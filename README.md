# Expense Tracker MVP with Supabase

A full-stack expense tracking application built with:

- **Authentication**: Clerk for user authentication
- **Database/Storage**: Supabase for database and file storage
- **OCR**: AI-powered receipt scanning and data extraction
- **Export**: CSV and Excel export capabilities
- **Deployment**: Optimized for Netlify serverless functions

## Features

- User authentication with Clerk
- Expense tracking with receipt uploads
- OCR processing for automatic data extraction
- Trip organization
- Mileage tracking
- Data export to CSV/Excel
- Responsive UI

## Recent Updates

- Fixed authentication middleware for Netlify deployment
- Improved error handling
- Standardized authentication flow across all API routes
- Fixed Clerk publishable key configuration for Netlify environment
- Added automatic user creation for new Clerk users
- Fixed sign-in/sign-up page routing and redirection
- Fixed authentication redirect after successful sign-in
- Implemented `AuthCallbackHandler` component to correctly handle Clerk authentication sub-paths (e.g., SSO, MFA)
- Enhanced auth callback handling to support all Clerk SSO paths and fallback redirects
- Updated Clerk redirect configuration with proper appearance settings and redirect URLs
- Fixed social authentication (Google) sign-in and sign-up flows
- Added comprehensive support for all Clerk authentication paths including OAuth callbacks

## Clerk Webhook Integration

The application uses Clerk webhooks to synchronize user data between Clerk and Supabase. This integration ensures that user information stays consistent across both systems.

### How It Works

1. **Webhook Setup**: Clerk sends events (user created, updated, deleted) to our Netlify serverless function endpoint.
2. **Event Processing**: The webhook handler validates the event signature and processes the payload.
3. **Database Synchronization**: User data is created, updated, or deleted in Supabase based on the event type.

### Implementation Details

- Direct database connection in the webhook handler to avoid dependency issues
- Idempotent operations to prevent duplicate user records
- Transaction-based deletion to maintain data consistency
- Comprehensive error handling with detailed logging

### Troubleshooting

If you encounter issues with the Clerk webhook integration:

1. **Webhook Not Firing**: Verify webhook configuration in the Clerk dashboard and check that the endpoint URL is correct.
2. **Signature Verification Errors**: Ensure the `CLERK_WEBHOOK_SIGNING_SECRET` environment variable is correctly set.
3. **Database Connection Issues**: Confirm the `DATABASE_URL` environment variable is properly configured.
4. **Missing User Data**: Check the Netlify function logs for detailed error messages.

For detailed logs, run: `netlify functions:invoke clerk-webhook --no-identity`
