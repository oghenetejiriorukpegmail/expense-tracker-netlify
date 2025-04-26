/**
 * Clerk Webhook Handler
 *
 * This serverless function processes webhook events from Clerk authentication service
 * and synchronizes user data with our Supabase database.
 *
 * IMPORTANT IMPLEMENTATION NOTES:
 * 1. This handler establishes a direct database connection rather than importing
 *    from shared modules to avoid dependency issues in the Netlify Functions environment.
 * 2. All database operations are designed to be idempotent to prevent duplicate records.
 * 3. Error handling is comprehensive with detailed logging for troubleshooting.
 * 4. The handler returns 200 status even for errors to prevent Clerk from retrying
 *    and potentially causing duplicate operations.
 */

import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema";

/**
 * Interface defining the structure of Clerk webhook events
 * This ensures proper typing for the webhook payload processing
 */
interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses?: Array<{
      email_address: string;
      id: string;
      verification?: {
        status: string;
      };
    }>;
    first_name?: string;
    last_name?: string;
    username?: string;
    phone_numbers?: Array<{
      phone_number: string;
      id: string;
    }>;
    profile_image_url?: string;
    // Add other fields as needed
  };
  object: string;
  type: string;
}

/**
 * Webhook handler function for processing Clerk authentication events
 *
 * @param event - The Netlify function event containing request details
 * @param context - The Netlify function context
 * @returns Response object with status code and body
 */
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Request validation - only allow POST requests
  if (event.httpMethod !== "POST") {
    console.error(`Invalid HTTP method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed",
        message: "Only POST requests are accepted for webhook events"
      }),
    };
  }

  // Environment validation - check for required environment variables
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("CLERK_WEBHOOK_SIGNING_SECRET is not set - webhook cannot be verified");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server configuration error",
        message: "Missing webhook signing secret"
      }),
    };
  }

  // Database connection validation
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set - cannot connect to database");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server configuration error",
        message: "Missing database connection string"
      }),
    };
  }

  // Create a direct database connection
  let db: any = null;
  let client: any = null;
  
  try {
    // Header validation - verify all required Svix headers are present
    const svix_id = event.headers["svix-id"] || "";
    const svix_timestamp = event.headers["svix-timestamp"] || "";
    const svix_signature = event.headers["svix-signature"] || "";
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing Svix headers", {
        hasId: !!svix_id,
        hasTimestamp: !!svix_timestamp,
        hasSignature: !!svix_signature
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing Svix headers",
          message: "Required webhook verification headers are missing"
        }),
      };
    }

    // Signature verification - ensure the webhook is authentic
    let payload: ClerkWebhookEvent;
    try {
      const wh = new Webhook(signingSecret);
      const payloadString = event.body || "";
      
      // Verify the webhook signature using Svix
      const payloadJson = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
      
      // Parse the payload with type safety
      payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson as ClerkWebhookEvent;
    } catch (err) {
      console.error("Invalid webhook signature", err);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid webhook signature",
          message: "The webhook signature could not be verified",
          details: err instanceof Error ? err.message : "Unknown error"
        }),
      };
    }

    // Database connection - establish direct connection to avoid dependency issues
    console.log("Initializing direct database connection in webhook handler");
    try {
      client = postgres(databaseUrl, { max: 1 });
      db = drizzle(client, { schema });
    } catch (dbError) {
      console.error("Failed to establish database connection", dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Database connection error",
          message: "Failed to connect to the database",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }),
      };
    }

    // Extract user data from the webhook payload
    const { type, data } = payload;
    const clerkUserId = data.id;
    
    console.log(`Processing webhook event: ${type} for user ${clerkUserId}`);

    // Handle different event types
    switch (type) {
      case "user.created": {
        try {
          console.log(`Processing user.created event for Clerk user ${clerkUserId}`);
          
          // Extract user information with validation
          const email = data.email_addresses?.[0]?.email_address || "";
          if (!email) {
            console.warn(`No email address found for Clerk user ${clerkUserId}`);
          }
          
          const firstName = data.first_name || "";
          const lastName = data.last_name || "";

          // Check if user already exists (idempotency)
          console.log(`Checking if user ${clerkUserId} already exists in database`);
          let existingUserResult;
          try {
            existingUserResult = await db.select()
              .from(schema.users)
              .where(eq(schema.users.authUserId, clerkUserId))
              .limit(1);
          } catch (dbError) {
            console.error(`Database error when checking for existing user ${clerkUserId}:`, dbError);
            throw new Error(`Failed to check for existing user: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
          }
          
          const existingUser = existingUserResult[0];
          if (existingUser) {
            console.log(`User ${clerkUserId} already exists in Supabase with ID ${existingUser.id}, skipping creation`);
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "User already exists",
                userId: existingUser.id,
                success: true
              }),
            };
          }

          // Create a new user in Supabase
          console.log(`Creating new user in Supabase for Clerk user ${clerkUserId}`);
          
          // Generate a random username based on the email or a UUID
          const username = email
            ? email.split('@')[0] + '-' + Math.floor(Math.random() * 10000)
            : 'user-' + Math.random().toString(36).substring(2, 10);
          
          const userData = {
            username,
            password: Math.random().toString(36).substring(2, 15), // Random password (not used with Clerk)
            email: email || `${username}@example.com`, // Fallback email if none provided
            firstName: firstName || '',
            lastName: lastName || '',
            phoneNumber: '',
            authUserId: clerkUserId,
          };
          
          let newUserResult;
          try {
            newUserResult = await db.insert(schema.users)
              .values(userData)
              .returning();
          } catch (insertError) {
            console.error(`Failed to insert new user ${clerkUserId} into database:`, insertError);
            throw new Error(`User creation failed: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
          }
          
          const newUser = newUserResult[0];
          console.log(`Successfully created user in database with ID ${newUser.id} for Clerk user ${clerkUserId}`);
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: "User created successfully",
              userId: newUser.id,
              success: true
            }),
          };
        } catch (eventError) {
          console.error(`Error processing user.created event for ${clerkUserId}:`, eventError);
          return {
            statusCode: 200, // Still return 200 to prevent retries
            body: JSON.stringify({
              error: "Error processing user creation",
              message: eventError instanceof Error ? eventError.message : "Unknown error",
              success: false,
              clerkUserId
            }),
          };
        }
      }

      case "user.updated": {
        try {
          console.log(`Processing user.updated event for Clerk user ${clerkUserId}`);
          
          // Extract updated user information
          const email = data.email_addresses?.[0]?.email_address || "";
          const firstName = data.first_name || "";
          const lastName = data.last_name || "";
          const phoneNumber = data.phone_numbers?.[0]?.phone_number || "";

          // Find the user in Supabase
          console.log(`Looking up user ${clerkUserId} in database for update`);
          let existingUserResult;
          try {
            existingUserResult = await db.select()
              .from(schema.users)
              .where(eq(schema.users.authUserId, clerkUserId))
              .limit(1);
          } catch (lookupError) {
            console.error(`Database error when looking up user ${clerkUserId} for update:`, lookupError);
            throw new Error(`Failed to look up user: ${lookupError instanceof Error ? lookupError.message : 'Unknown error'}`);
          }
          
          const existingUser = existingUserResult[0];
          if (!existingUser) {
            console.log(`User ${clerkUserId} not found in Supabase, creating instead of updating`);
            
            // Generate a random username based on the email or a UUID
            const username = email
              ? email.split('@')[0] + '-' + Math.floor(Math.random() * 10000)
              : 'user-' + Math.random().toString(36).substring(2, 10);
            
            const userData = {
              username,
              password: Math.random().toString(36).substring(2, 15), // Random password (not used with Clerk)
              email: email || `${username}@example.com`, // Fallback email if none provided
              firstName: firstName || '',
              lastName: lastName || '',
              phoneNumber: '',
              authUserId: clerkUserId,
            };
            
            let newUserResult;
            try {
              newUserResult = await db.insert(schema.users)
                .values(userData)
                .returning();
            } catch (insertError) {
              console.error(`Failed to create user ${clerkUserId} during update fallback:`, insertError);
              throw new Error(`User creation during update failed: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
            }
            
            const newUser = newUserResult[0];
            console.log(`Created new user with ID ${newUser.id} instead of updating for Clerk user ${clerkUserId}`);
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "User created instead of updated",
                userId: newUser.id,
                success: true
              }),
            };
          }

          // Update the user in Supabase
          console.log(`Updating user ${existingUser.id} in Supabase for Clerk user ${clerkUserId}`);
          
          const updateData: any = {};
          if (firstName !== undefined) updateData.firstName = firstName;
          if (lastName !== undefined) updateData.lastName = lastName || '';
          if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || '';
          if (email !== undefined) updateData.email = email;
          
          // Log what fields are being updated
          console.log(`Updating fields for user ${existingUser.id}:`, Object.keys(updateData).join(', '));
          
          let updatedUserResult;
          try {
            updatedUserResult = await db.update(schema.users)
              .set(updateData)
              .where(eq(schema.users.id, existingUser.id))
              .returning();
          } catch (updateError) {
            console.error(`Failed to update user ${existingUser.id} in database:`, updateError);
            throw new Error(`User update failed: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
          }
          
          const updatedUser = updatedUserResult[0];
          console.log(`Successfully updated user ${existingUser.id} for Clerk user ${clerkUserId}`);

          return {
            statusCode: 200,
            body: JSON.stringify({
              message: "User updated successfully",
              userId: existingUser.id,
              success: true,
              updatedFields: Object.keys(updateData)
            }),
          };
        } catch (eventError) {
          console.error(`Error processing user.updated event for ${clerkUserId}:`, eventError);
          return {
            statusCode: 200, // Still return 200 to prevent retries
            body: JSON.stringify({
              error: "Error processing user update",
              message: eventError instanceof Error ? eventError.message : "Unknown error",
              success: false,
              clerkUserId
            }),
          };
        }
      }

      case "user.deleted": {
        try {
          console.log(`Processing user.deleted event for Clerk user ${clerkUserId}`);
          
          // Find the user in Supabase
          console.log(`Looking up user ${clerkUserId} in database for deletion`);
          let existingUserResult;
          try {
            existingUserResult = await db.select()
              .from(schema.users)
              .where(eq(schema.users.authUserId, clerkUserId))
              .limit(1);
          } catch (lookupError) {
            console.error(`Database error when looking up user ${clerkUserId} for deletion:`, lookupError);
            throw new Error(`Failed to look up user for deletion: ${lookupError instanceof Error ? lookupError.message : 'Unknown error'}`);
          }
          
          const existingUser = existingUserResult[0];
          if (!existingUser) {
            console.log(`User ${clerkUserId} not found in Supabase, nothing to delete`);
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "User not found, nothing to delete",
                success: true
              }),
            };
          }

          // Delete the user from Supabase
          console.log(`Deleting user ${existingUser.id} from Supabase for Clerk user ${clerkUserId}`);

          // Delete the user's data in a transaction to ensure consistency
          try {
            // This will cascade delete related data due to foreign key constraints
            await db.transaction(async (tx: any) => {
              console.log(`Starting transaction to delete user ${existingUser.id} and related data`);
              
              // Delete expenses
              try {
                await tx.delete(schema.expenses).where(eq(schema.expenses.userId, existingUser.id));
                console.log(`Deleted expenses for user ${existingUser.id}`);
              } catch (expenseError) {
                console.error(`Error deleting expenses for user ${existingUser.id}:`, expenseError);
                throw expenseError; // Rethrow to trigger transaction rollback
              }
              
              // Delete trips
              try {
                await tx.delete(schema.trips).where(eq(schema.trips.userId, existingUser.id));
                console.log(`Deleted trips for user ${existingUser.id}`);
              } catch (tripError) {
                console.error(`Error deleting trips for user ${existingUser.id}:`, tripError);
                throw tripError; // Rethrow to trigger transaction rollback
              }
              
              // Delete mileage logs
              try {
                await tx.delete(schema.mileageLogs).where(eq(schema.mileageLogs.userId, existingUser.id));
                console.log(`Deleted mileage logs for user ${existingUser.id}`);
              } catch (mileageError) {
                console.error(`Error deleting mileage logs for user ${existingUser.id}:`, mileageError);
                throw mileageError; // Rethrow to trigger transaction rollback
              }
              
              // Delete background tasks
              try {
                await tx.delete(schema.backgroundTasks).where(eq(schema.backgroundTasks.userId, existingUser.id));
                console.log(`Deleted background tasks for user ${existingUser.id}`);
              } catch (taskError) {
                console.error(`Error deleting background tasks for user ${existingUser.id}:`, taskError);
                throw taskError; // Rethrow to trigger transaction rollback
              }
              
              // Finally, delete the user
              try {
                await tx.delete(schema.users).where(eq(schema.users.id, existingUser.id));
                console.log(`Deleted user ${existingUser.id}`);
              } catch (userError) {
                console.error(`Error deleting user ${existingUser.id}:`, userError);
                throw userError; // Rethrow to trigger transaction rollback
              }
              
              console.log(`Transaction completed successfully, all data for user ${existingUser.id} deleted`);
            });
          } catch (transactionError) {
            console.error(`Transaction failed when deleting user ${existingUser.id}:`, transactionError);
            throw new Error(`User deletion transaction failed: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`);
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              message: "User deleted successfully",
              userId: existingUser.id,
              success: true
            }),
          };
        } catch (eventError) {
          console.error(`Error processing user.deleted event for ${clerkUserId}:`, eventError);
          return {
            statusCode: 200, // Still return 200 to prevent retries
            body: JSON.stringify({
              error: "Error processing user deletion",
              message: eventError instanceof Error ? eventError.message : "Unknown error",
              success: false,
              clerkUserId
            }),
          };
        }
      }

      default:
        // Log unhandled event types for monitoring
        console.log(`Received unhandled webhook event type: ${type} for user ${clerkUserId}`);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `Event type ${type} not handled`,
            eventType: type,
            clerkUserId,
            success: true,
            ignored: true
          }),
        };
    }
  } catch (error) {
    // Comprehensive error logging with context
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error processing Clerk webhook:", {
      error: errorMessage,
      stack: errorStack,
      time: new Date().toISOString(),
      headers: Object.keys(event.headers),
      eventType: event.body ? JSON.parse(event.body).type : "unknown"
    });
    
    // Return a 200 status code to prevent Clerk from retrying
    // This is important for idempotency and to avoid duplicate events
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: "Error processing webhook",
        message: errorMessage,
        success: false,
        timestamp: new Date().toISOString()
      }),
    };
  } finally {
    // Ensure database connection is properly closed to prevent connection leaks
    if (client) {
      try {
        await client.end();
        console.log("Database connection closed successfully");
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
};

export { handler };