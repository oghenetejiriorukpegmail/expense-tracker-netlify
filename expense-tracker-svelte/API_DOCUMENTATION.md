# Expense Tracker API Documentation

## Architecture Overview

The Expense Tracker API is built using a modern, type-safe stack:

- **tRPC**: End-to-end typesafe API layer
- **Firebase Auth**: Authentication and authorization
- **SvelteKit**: Full-stack framework
- **Zod**: Runtime type validation

### Key Features

- End-to-end type safety
- Authentication and authorization middleware
- Error handling and logging
- Rate limiting (to be implemented)
- File upload support (to be implemented)
- Caching strategy (to be implemented)

## Authentication

Authentication is handled through Firebase Authentication. The API uses Firebase ID tokens for authenticating requests.

### Authentication Flow

1. Client logs in through Firebase Auth
2. Client obtains ID token
3. Token is sent in Authorization header: `Bearer <token>`
4. Server validates token using Firebase Admin SDK
5. User context is added to request

## API Routes

### Expenses

Base URL: `/api/trpc/expense`

#### Create Expense
```typescript
mutation create({
  amount: number;
  description: string;
  date: string;
  category: string;
  receiptUrl?: string;
})
```

#### List Expenses
```typescript
query list({
  limit?: number;
  cursor?: string;
})
```

#### Get Expense by ID
```typescript
query byId({
  id: string;
})
```

#### Update Expense
```typescript
mutation update({
  id: string;
  data: {
    amount?: number;
    description?: string;
    date?: string;
    category?: string;
    receiptUrl?: string;
  }
})
```

#### Delete Expense
```typescript
mutation delete({
  id: string;
})
```

## Error Handling

The API uses tRPC's error handling system with custom formatting:

```typescript
{
  code: string;      // Error code (e.g., 'UNAUTHORIZED')
  message: string;   // Human-readable message
  cause?: unknown;   // Original error cause
  data?: {          // Additional error data
    zodError?: ZodError;  // Validation errors
  }
}
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_SERVICE_ACCOUNT=your_service_account_json
```

4. Start development server:
```bash
npm run dev
```

## Future Improvements

1. **Rate Limiting**
   - Implement rate limiting using Redis or similar
   - Add configurable limits per endpoint
   - Add user-specific limits

2. **File Upload**
   - Add support for receipt uploads
   - Implement file validation and virus scanning
   - Set up cloud storage integration

3. **Caching**
   - Implement Redis caching layer
   - Add cache invalidation strategies
   - Add cache warming for common queries

4. **Monitoring**
   - Add request logging
   - Implement error tracking
   - Add performance monitoring

5. **Testing**
   - Add unit tests for API routes
   - Add integration tests
   - Add load testing

## Security Considerations

1. All routes requiring authentication are protected by Firebase Auth
2. Input validation using Zod schemas
3. CORS configuration (to be implemented)
4. Rate limiting (to be implemented)
5. Request size limits
6. Secure headers

## Deployment

The API is deployed on Netlify using serverless functions:

1. Build command: `npm run build`
2. Functions directory: `netlify/functions`
3. Environment variables set in Netlify dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT