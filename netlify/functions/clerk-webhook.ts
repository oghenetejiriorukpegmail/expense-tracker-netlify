import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema";

// Define the structure of Clerk webhook events
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Get the Clerk webhook signing secret from environment variables
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("CLERK_WEBHOOK_SIGNING_SECRET is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Initialize database connection directly
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Create a direct database connection
  let db: any = null;
  
  try {
    // Verify the webhook signature
    const svix_id = event.headers["svix-id"] || "";
    const svix_timestamp = event.headers["svix-timestamp"] || "";
    const svix_signature = event.headers["svix-signature"] || "";
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing Svix headers");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing Svix headers" }),
      };
    }

    // Verify the webhook signature
    let payload: ClerkWebhookEvent;
    try {
      const wh = new Webhook(signingSecret);
      const payloadString = event.body || "";
      
      // Verify the webhook signature
      const payloadJson = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
      
      // Parse the payload
      payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson as ClerkWebhookEvent;
    } catch (err) {
      console.error("Invalid webhook signature", err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid webhook signature" }),
      };
    }

    // Initialize database connection
    console.log("Initializing direct database connection in webhook handler");
    const client = postgres(databaseUrl, { max: 1 });
    db = drizzle(client, { schema });

    // Extract user data from the webhook payload
    const { type, data } = payload;
    const clerkUserId = data.id;
    
    console.log(`Processing webhook event: ${type} for user ${clerkUserId}`);

    // Handle different event types
    switch (type) {
      case "user.created": {
        // Extract user information
        const email = data.email_addresses?.[0]?.email_address || "";
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";

        // Check if user already exists (idempotency)
        const existingUserResult = await db.select()
          .from(schema.users)
          .where(eq(schema.users.authUserId, clerkUserId))
          .limit(1);
        
        const existingUser = existingUserResult[0];
        if (existingUser) {
          console.log(`User ${clerkUserId} already exists in Supabase, skipping creation`);
          return {
            statusCode: 200,
            body: JSON.stringify({ message: "User already exists", userId: existingUser.id }),
          };
        }

        // Create a new user in Supabase
        console.log(`Creating new user in Supabase for Clerk user ${clerkUserId}`);
        
        // Generate a random username based on the email or a UUID
        const username = email ? email.split('@')[0] + '-' + Math.floor(Math.random() * 10000) : 'user-' + Math.random().toString(36).substring(2, 10);
        
        const userData = {
          username,
          password: Math.random().toString(36).substring(2, 15), // Random password (not used with Clerk)
          email: email || `${username}@example.com`, // Fallback email if none provided
          firstName: firstName || '',
          lastName: lastName || '',
          phoneNumber: '',
          authUserId: clerkUserId,
        };
        
        const newUserResult = await db.insert(schema.users)
          .values(userData)
          .returning();
        
        const newUser = newUserResult[0];
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "User created successfully", userId: newUser.id }),
        };
      }

      case "user.updated": {
        // Extract updated user information
        const email = data.email_addresses?.[0]?.email_address || "";
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const phoneNumber = data.phone_numbers?.[0]?.phone_number || "";

        // Find the user in Supabase
        const existingUserResult = await db.select()
          .from(schema.users)
          .where(eq(schema.users.authUserId, clerkUserId))
          .limit(1);
        
        const existingUser = existingUserResult[0];
        if (!existingUser) {
          console.log(`User ${clerkUserId} not found in Supabase, creating instead of updating`);
          
          // Generate a random username based on the email or a UUID
          const username = email ? email.split('@')[0] + '-' + Math.floor(Math.random() * 10000) : 'user-' + Math.random().toString(36).substring(2, 10);
          
          const userData = {
            username,
            password: Math.random().toString(36).substring(2, 15), // Random password (not used with Clerk)
            email: email || `${username}@example.com`, // Fallback email if none provided
            firstName: firstName || '',
            lastName: lastName || '',
            phoneNumber: '',
            authUserId: clerkUserId,
          };
          
          const newUserResult = await db.insert(schema.users)
            .values(userData)
            .returning();
          
          const newUser = newUserResult[0];
          
          return {
            statusCode: 200,
            body: JSON.stringify({ message: "User created instead of updated", userId: newUser.id }),
          };
        }

        // Update the user in Supabase
        console.log(`Updating user ${existingUser.id} in Supabase for Clerk user ${clerkUserId}`);
        
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName || '';
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || '';
        if (email !== undefined) updateData.email = email;
        
        const updatedUserResult = await db.update(schema.users)
          .set(updateData)
          .where(eq(schema.users.id, existingUser.id))
          .returning();
        
        const updatedUser = updatedUserResult[0];

        return {
          statusCode: 200,
          body: JSON.stringify({ message: "User updated successfully", userId: existingUser.id }),
        };
      }

      case "user.deleted": {
        // Find the user in Supabase
        const existingUserResult = await db.select()
          .from(schema.users)
          .where(eq(schema.users.authUserId, clerkUserId))
          .limit(1);
        
        const existingUser = existingUserResult[0];
        if (!existingUser) {
          console.log(`User ${clerkUserId} not found in Supabase, nothing to delete`);
          return {
            statusCode: 200,
            body: JSON.stringify({ message: "User not found, nothing to delete" }),
          };
        }

        // Delete the user from Supabase
        console.log(`Deleting user ${existingUser.id} from Supabase for Clerk user ${clerkUserId}`);

        // Delete the user's data in a transaction to ensure consistency
        // This will cascade delete related data due to foreign key constraints
        await db.transaction(async (tx: any) => {
          // Delete expenses
          await tx.delete(schema.expenses).where(eq(schema.expenses.userId, existingUser.id));
          
          // Delete trips
          await tx.delete(schema.trips).where(eq(schema.trips.userId, existingUser.id));
          
          // Delete mileage logs
          await tx.delete(schema.mileageLogs).where(eq(schema.mileageLogs.userId, existingUser.id));
          
          // Delete background tasks
          await tx.delete(schema.backgroundTasks).where(eq(schema.backgroundTasks.userId, existingUser.id));
          
          // Finally, delete the user
          await tx.delete(schema.users).where(eq(schema.users.id, existingUser.id));
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: "User deleted successfully", userId: existingUser.id }),
        };
      }

      default:
        // Ignore other event types
        console.log(`Ignoring unsupported webhook event type: ${type}`);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: `Event type ${type} not handled` }),
        };
    }
  } catch (error) {
    // Log the error
    console.error("Error processing Clerk webhook:", error);
    
    // Return a 200 status code to prevent Clerk from retrying
    // This is important for idempotency and to avoid duplicate events
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: "Error processing webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export { handler };