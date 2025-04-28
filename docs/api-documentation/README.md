# API Documentation

This document provides comprehensive documentation for the Expense Tracker API, including endpoints, authentication flows, database schema, file upload handling, and error handling.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [Profile](#profile-endpoints)
   - [Trips](#trip-endpoints)
   - [Expenses](#expense-endpoints)
   - [Mileage Logs](#mileage-log-endpoints)
   - [Settings](#settings-endpoints)
   - [Background Tasks](#background-task-endpoints)
   - [Export](#export-endpoints)
   - [OCR](#ocr-endpoints)
3. [Database Schema](#database-schema)
4. [File Upload Handling](#file-upload-handling)
5. [Error Handling](#error-handling)

## Authentication

The Expense Tracker API uses Firebase Authentication for user authentication. All API endpoints require authentication except for public endpoints.

### Authentication Flow

1. **Client-side Authentication**:
   - Users authenticate using Firebase Authentication on the client side
   - After successful authentication, Firebase provides an ID token

2. **Server-side Authentication**:
   - The client includes the Firebase ID token in the `Authorization` header of API requests
   - The server verifies the token using Firebase Admin SDK
   - If the token is valid, the server attaches the user information to the request object

### Authentication Headers

Include the Firebase ID token in the `Authorization` header of all API requests:

```
Authorization: Bearer <firebase-id-token>
```

### User Registration

When a user registers with Firebase Authentication, a corresponding user record is created in the database. This is handled by the Clerk webhook endpoint.

## API Endpoints

### Profile Endpoints

#### GET /api/profile

Retrieves the current user's profile information.

**Response**:
```json
{
  "id": 1,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "email": "john.doe@example.com",
  "bio": "Software developer and travel enthusiast",
  "authUserId": "firebase-auth-user-id",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### PUT /api/profile

Updates the current user's profile information.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "bio": "Software developer and travel enthusiast"
}
```

**Response**: Updated user profile object

### Trip Endpoints

#### GET /api/trips

Retrieves all trips for the current user.

**Query Parameters**:
- `status` (optional): Filter trips by status (Planned, InProgress, Completed, Cancelled)

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "Business Trip to New York",
    "description": "Annual conference",
    "status": "Completed",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-05T00:00:00.000Z",
    "budget": 1500.00,
    "currency": "USD",
    "location": "New York, NY",
    "tags": ["business", "conference"],
    "totalExpenses": 1350.75,
    "expenseCount": 12,
    "createdAt": "2024-12-15T00:00:00.000Z",
    "updatedAt": "2025-01-06T00:00:00.000Z"
  }
]
```

#### GET /api/trips/:id

Retrieves a specific trip by ID.

**Response**: Trip object

#### POST /api/trips

Creates a new trip.

**Request Body**:
```json
{
  "name": "Business Trip to New York",
  "description": "Annual conference",
  "status": "Planned",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-05T00:00:00.000Z",
  "budget": 1500.00,
  "currency": "USD",
  "location": "New York, NY",
  "tags": ["business", "conference"]
}
```

**Response**: Created trip object

#### PUT /api/trips/:id

Updates a specific trip.

**Request Body**: Partial trip object with fields to update
**Response**: Updated trip object

#### DELETE /api/trips/:id

Deletes a specific trip.

**Response**: 204 No Content

### Expense Endpoints

#### GET /api/expenses

Retrieves all expenses for the current user.

**Query Parameters**:
- `tripName` (optional): Filter expenses by trip name

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "type": "Accommodation",
    "date": "2025-01-01",
    "vendor": "Hilton Hotel",
    "location": "New York, NY",
    "cost": 250.00,
    "comments": "Room 505",
    "tripName": "Business Trip to New York",
    "receiptPath": "receipts/1/abc123-receipt.jpg",
    "status": "complete",
    "createdAt": "2024-12-15T00:00:00.000Z",
    "updatedAt": "2024-12-15T00:00:00.000Z"
  }
]
```

#### GET /api/expenses/:id

Retrieves a specific expense by ID.

**Response**: Expense object

#### POST /api/expenses

Creates a new expense. Supports multipart/form-data for receipt upload.

**Request Body**:
```
// Form data
date: "2025-01-01"
cost: 250.00
tripName: "Business Trip to New York"
type: "Accommodation"
vendor: "Hilton Hotel"
location: "New York, NY"
comments: "Room 505"
receipt: [File]
```

**Response**: Created expense object with optional OCR task ID if a receipt was uploaded

#### PUT /api/expenses/:id

Updates a specific expense. Supports multipart/form-data for receipt upload.

**Request Body**: Partial expense object with fields to update
**Response**: Updated expense object

#### DELETE /api/expenses/:id

Deletes a specific expense and its associated receipt if any.

**Response**: 204 No Content

### Mileage Log Endpoints

#### GET /api/mileage-logs

Retrieves all mileage logs for the current user.

**Query Parameters**:
- `tripId` (optional): Filter mileage logs by trip ID

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "tripId": 1,
    "tripDate": "2025-01-01T00:00:00.000Z",
    "startOdometer": 12500.0,
    "endOdometer": 12550.0,
    "calculatedDistance": 50.0,
    "purpose": "Client meeting",
    "startImageUrl": "mileage/1/start-12500.jpg",
    "endImageUrl": "mileage/1/end-12550.jpg",
    "entryMethod": "manual",
    "createdAt": "2024-12-15T00:00:00.000Z",
    "updatedAt": "2024-12-15T00:00:00.000Z"
  }
]
```

#### GET /api/mileage-logs/:id

Retrieves a specific mileage log by ID.

**Response**: Mileage log object

#### POST /api/mileage-logs

Creates a new mileage log. Supports multipart/form-data for odometer image uploads.

**Request Body**:
```
// Form data
tripId: 1 (optional)
tripDate: "2025-01-01T00:00:00.000Z"
startOdometer: 12500.0
endOdometer: 12550.0
purpose: "Client meeting"
entryMethod: "manual"
startImage: [File] (optional)
endImage: [File] (optional)
```

**Response**: Created mileage log object

#### PUT /api/mileage-logs/:id

Updates a specific mileage log. Supports multipart/form-data for odometer image uploads.

**Request Body**: Partial mileage log object with fields to update
**Response**: Updated mileage log object

#### DELETE /api/mileage-logs/:id

Deletes a specific mileage log and its associated images if any.

**Response**: 204 No Content

### Settings Endpoints

#### GET /api/settings

Retrieves the current user's settings.

**Response**:
```json
{
  "currency": "USD",
  "theme": "light",
  "notifications": true,
  "defaultExpenseType": "General"
}
```

#### PUT /api/settings

Updates the current user's settings.

**Request Body**:
```json
{
  "currency": "EUR",
  "theme": "dark",
  "notifications": false,
  "defaultExpenseType": "Travel"
}
```

**Response**: Updated settings object

### Background Task Endpoints

#### GET /api/background-tasks

Retrieves all background tasks for the current user.

**Query Parameters**:
- `type` (optional): Filter tasks by type (batch_upload, expense_export, receipt_ocr)
- `status` (optional): Filter tasks by status (pending, processing, completed, failed)

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "type": "receipt_ocr",
    "status": "completed",
    "result": "{\"expenseId\":1,\"receiptPath\":\"receipts/1/abc123-receipt.jpg\"}",
    "error": null,
    "createdAt": "2024-12-15T00:00:00.000Z",
    "updatedAt": "2024-12-15T00:00:00.000Z"
  }
]
```

#### GET /api/background-tasks/:id

Retrieves a specific background task by ID.

**Response**: Background task object

#### POST /api/background-processor/process-next

Triggers the background processor to process the next pending task.

**Response**: Result of the processing operation

### Export Endpoints

#### GET /api/export/expenses

Exports expenses as a downloadable file.

**Query Parameters**:
- `format` (optional): Export format (csv, excel, pdf) - default: excel
- `tripName` (optional): Filter expenses by trip name
- `startDate` (optional): Filter expenses by start date
- `endDate` (optional): Filter expenses by end date

**Response**: Downloadable file or background task ID for large exports

### OCR Endpoints

#### POST /api/ocr/process

Processes an image or PDF file using OCR to extract expense information.

**Request Body**:
```
// Form data
file: [File]
template: "general" (optional)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2025-01-01",
    "vendor": "Hilton Hotel",
    "amount": 250.00,
    "description": "Room 505"
  }
}
```

## Database Schema

The Expense Tracker application uses a PostgreSQL database with the following schema:

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE DEFAULT '',
  bio TEXT,
  auth_user_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Trips Table

```sql
CREATE TYPE trip_status AS ENUM ('Planned', 'InProgress', 'Completed', 'Cancelled');

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status trip_status NOT NULL DEFAULT 'Planned',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  budget NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  location TEXT,
  tags TEXT[],
  total_expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  expense_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Expenses Table

```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  vendor TEXT NOT NULL,
  location TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  comments TEXT,
  trip_name TEXT NOT NULL,
  receipt_path TEXT,
  status TEXT DEFAULT 'complete',
  ocr_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Mileage Logs Table

```sql
CREATE TYPE entry_method AS ENUM ('manual', 'ocr');

CREATE TABLE mileage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  trip_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_odometer NUMERIC(10,1) NOT NULL,
  end_odometer NUMERIC(10,1) NOT NULL,
  calculated_distance NUMERIC(10,1) NOT NULL,
  purpose TEXT,
  start_image_url TEXT,
  end_image_url TEXT,
  entry_method entry_method NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Background Tasks Table

```sql
CREATE TYPE task_type AS ENUM ('batch_upload', 'expense_export', 'receipt_ocr');
CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE background_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  result TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Upload Handling

The Expense Tracker API supports file uploads for receipts and odometer images. Files are stored in Supabase Storage.

### Upload Process

1. Files are uploaded using multipart/form-data
2. The server processes the file using Multer middleware
3. The file is uploaded to Supabase Storage in the appropriate bucket
4. The file path is stored in the database

### Storage Buckets

- `receipts`: Stores expense receipt images and PDFs
- `mileage`: Stores odometer images for mileage logs

### File Paths

- Receipts: `receipts/{userId}/{uuid}-{filename}`
- Odometer images: `mileage/{userId}/{uuid}-{filename}`

### OCR Processing

When a receipt is uploaded, a background task is created to process the receipt using OCR. The OCR service extracts information from the receipt and updates the expense record.

## Error Handling

The API uses a consistent error handling approach across all endpoints.

### Error Response Format

```json
{
  "message": "Error message",
  "errors": [
    {
      "path": ["field"],
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Codes

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated user doesn't have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

### Validation Errors

Input validation is performed using Zod schemas. Validation errors return a 400 status code with detailed error information.

### Authentication Errors

Authentication errors return a 401 status code. The client should redirect the user to the login page.

### Authorization Errors

Authorization errors return a 403 status code. This occurs when a user tries to access a resource they don't own.

### Resource Not Found Errors

Resource not found errors return a 404 status code. This occurs when a requested resource doesn't exist.

### Server Errors

Server-side errors return a 500 status code. These errors are logged on the server for debugging.