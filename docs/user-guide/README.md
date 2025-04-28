# User Guide

Welcome to the Expense Tracker User Guide! This guide will help you understand how to use the application effectively to manage your expenses.

## Table of Contents

1. [Getting Started](#getting-started)
   - [Signing Up](#signing-up)
   - [Logging In](#logging-in)
   - [Dashboard Overview](#dashboard-overview)
2. [Managing Trips](#managing-trips)
   - [Creating a Trip](#creating-a-trip)
   - [Viewing Trip Details](#viewing-trip-details)
   - [Updating a Trip](#updating-a-trip)
   - [Deleting a Trip](#deleting-a-trip)
3. [Managing Expenses](#managing-expenses)
   - [Adding an Expense](#adding-an-expense)
   - [Uploading Receipts](#uploading-receipts)
   - [Using OCR for Receipts](#using-ocr-for-receipts)
   - [Viewing Expense Details](#viewing-expense-details)
   - [Updating an Expense](#updating-an-expense)
   - [Deleting an Expense](#deleting-an-expense)
4. [Managing Mileage Logs](#managing-mileage-logs)
   - [Adding a Mileage Log](#adding-a-mileage-log)
   - [Uploading Odometer Images](#uploading-odometer-images)
   - [Viewing Mileage Log Details](#viewing-mileage-log-details)
   - [Updating a Mileage Log](#updating-a-mileage-log)
   - [Deleting a Mileage Log](#deleting-a-mileage-log)
5. [Data Visualization](#data-visualization)
   - [Expense Charts](#expense-charts)
   - [Spending Trends](#spending-trends)
6. [Exporting Data](#exporting-data)
   - [Exporting Expenses](#exporting-expenses)
7. [Managing Your Profile](#managing-your-profile)
   - [Updating Profile Information](#updating-profile-information)
8. [Settings](#settings)
   - [Customizing Preferences](#customizing-preferences)
9. [Best Practices](#best-practices)
10. [Frequently Asked Questions (FAQs)](#frequently-asked-questions-faqs)
11. [Troubleshooting](#troubleshooting)

## Getting Started

### Signing Up

1. Navigate to the application's signup page.
2. Enter your email address and choose a secure password.
3. Optionally, sign up using your Google account.
4. Follow the on-screen instructions to complete the registration.

### Logging In

1. Navigate to the application's login page.
2. Enter your registered email address and password.
3. Alternatively, log in using your Google account if you signed up with it.
4. Click "Login".

### Dashboard Overview

Upon logging in, you'll land on the dashboard, which provides a quick overview of your recent activity:
- Summary of recent expenses
- Overview of active trips
- Quick access to common actions (Add Expense, Add Trip)
- Charts visualizing your spending patterns

## Managing Trips

Trips help you organize expenses related to specific events or periods (e.g., business travel, vacations).

### Creating a Trip

1. Navigate to the "Trips" section.
2. Click the "Add Trip" button.
3. Fill in the trip details:
   - **Name**: A descriptive name for the trip (e.g., "Client Visit - Chicago").
   - **Description**: Optional details about the trip.
   - **Status**: Planned, InProgress, Completed, or Cancelled.
   - **Start Date & End Date**: The duration of the trip.
   - **Budget**: Optional budget amount for the trip.
   - **Currency**: The currency for the budget and expenses.
   - **Location**: The primary location of the trip.
   - **Tags**: Optional tags for categorization (e.g., "business", "conference").
4. Click "Save Trip".

### Viewing Trip Details

1. Go to the "Trips" section.
2. Click on the name of the trip you want to view.
3. The trip details page will show:
   - Trip information
   - A list of expenses associated with the trip
   - A summary of total expenses for the trip

### Updating a Trip

1. Navigate to the trip details page.
2. Click the "Edit" button.
3. Modify the trip details as needed.
4. Click "Save Changes".

### Deleting a Trip

1. Navigate to the trip details page.
2. Click the "Delete" button.
3. Confirm the deletion when prompted.
   **Note**: Deleting a trip will **not** delete its associated expenses. Expenses will become unassociated with any trip.

## Managing Expenses

Record and manage individual expenses.

### Adding an Expense

1. Navigate to the "Expenses" section or a specific Trip's detail page.
2. Click the "Add Expense" button.
3. Fill in the expense details:
   - **Type**: Category of the expense (e.g., Food, Accommodation, Travel).
   - **Date**: The date the expense occurred.
   - **Vendor**: The name of the vendor or store.
   - **Location**: Where the expense was made.
   - **Cost**: The amount of the expense.
   - **Comments**: Any additional notes about the expense.
   - **Trip Name**: Select the trip this expense belongs to (required).
   - **Receipt**: Optionally, upload a receipt image or PDF.
4. Click "Save Expense".

### Uploading Receipts

- When adding or editing an expense, click the "Upload Receipt" button or drag and drop a file.
- Supported formats: JPG, PNG, PDF.
- The uploaded receipt will be linked to the expense.

### Using OCR for Receipts

- If you upload a receipt, the system will automatically attempt to extract information using Optical Character Recognition (OCR).
- This process runs in the background. The expense status will show as "Processing OCR".
- Once complete, the status will change to "Complete" or "OCR Failed".
- If successful, some expense fields (like vendor, date, cost) might be automatically populated or updated based on the OCR results. You can review and confirm these details.
- If OCR fails, an error message might be displayed. You can still manually enter the expense details.

### Viewing Expense Details

1. Go to the "Expenses" section or a specific Trip's detail page.
2. Click on the expense you want to view.
3. The expense details modal or page will show all information, including the attached receipt if available.

### Updating an Expense

1. Navigate to the expense details view.
2. Click the "Edit" button.
3. Modify the expense details as needed. You can also replace or remove the receipt.
4. Click "Save Changes".

### Deleting an Expense

1. Navigate to the expense details view or find the expense in a list.
2. Click the "Delete" button associated with the expense.
3. Confirm the deletion when prompted.
   **Note**: This action is permanent and will also delete the associated receipt file from storage.

## Managing Mileage Logs

Track mileage for business or personal travel.

### Adding a Mileage Log

1. Navigate to the "Mileage Logs" section.
2. Click the "Add Mileage Log" button.
3. Fill in the log details:
   - **Trip**: Optionally associate the log with a specific trip.
   - **Date**: The date of the travel.
   - **Start Odometer**: Reading at the beginning of the trip.
   - **End Odometer**: Reading at the end of the trip.
   - **Purpose**: Reason for the travel (e.g., "Client Meeting", "Site Visit").
   - **Entry Method**: Select "Manual" or "OCR" (if uploading images).
   - **Start/End Images**: Optionally upload images of the odometer readings.
4. The distance will be calculated automatically.
5. Click "Save Log".

### Uploading Odometer Images

- When adding or editing a mileage log, you can upload images for the start and end odometer readings.
- This provides visual proof for reimbursement or tax purposes.

### Viewing Mileage Log Details

1. Go to the "Mileage Logs" section.
2. Click on the log you want to view.
3. The details view will show all information, including calculated distance and attached images if available.

### Updating a Mileage Log

1. Navigate to the mileage log details view.
2. Click the "Edit" button.
3. Modify the log details as needed.
4. Click "Save Changes".

### Deleting a Mileage Log

1. Navigate to the mileage log details view or find the log in a list.
2. Click the "Delete" button associated with the log.
3. Confirm the deletion when prompted.

## Data Visualization

The application provides charts to help you understand your spending.

### Expense Charts

- **Expenses by Category**: A pie or bar chart showing the distribution of expenses across different types (Food, Travel, etc.).
- **Expenses Over Time**: A line chart showing total spending trends over selected periods (e.g., monthly, yearly).

### Spending Trends

- Compare spending across different trips or time periods.
- Identify areas where spending is high or increasing.

## Exporting Data

You can export your expense data for reporting or analysis.

### Exporting Expenses

1. Navigate to the "Export" section or find the export option on the Expenses page.
2. Select the desired filters:
   - **Format**: CSV, Excel, PDF.
   - **Trip Name**: Export expenses for a specific trip or all trips.
   - **Date Range**: Specify a start and end date.
3. Click the "Export" button.
4. For small exports, the file will download directly. For large exports, a background task will be created, and you'll be notified when the file is ready for download.

## Managing Your Profile

Keep your personal information up-to-date.

### Updating Profile Information

1. Navigate to the "Profile" or "Account Settings" section.
2. Click "Edit Profile".
3. Update your First Name, Last Name, Phone Number, or Bio.
4. Click "Save Changes".
   **Note**: Username and Email are typically managed through your authentication provider (Firebase) and may not be editable directly within the app.

## Settings

Customize the application to your preferences.

### Customizing Preferences

1. Navigate to the "Settings" section.
2. Adjust settings such as:
   - **Default Currency**: Set the currency used for new trips and budgets.
   - **Theme**: Choose between light and dark mode.
   - **Notification Preferences**: Manage email or in-app notifications.
   - **Default Expense Type**: Set a default category for new expenses.
3. Changes are usually saved automatically or via a "Save Settings" button.

## Best Practices

- **Be Consistent**: Use consistent naming conventions for trips and expense types.
- **Upload Receipts Promptly**: Attach receipts as soon as possible to avoid losing them.
- **Categorize Accurately**: Use appropriate expense types for better analysis.
- **Review Regularly**: Periodically review your expenses and trips for accuracy.
- **Utilize Trips**: Group related expenses under trips for better organization, especially for travel or projects.
- **Keep Profile Updated**: Ensure your contact information is current.

## Frequently Asked Questions (FAQs)

**Q: Can I use the app offline?**
A: Basic offline functionality might be available, allowing you to view cached data. Adding new expenses offline might be supported with synchronization when you reconnect. Check specific feature documentation for details.

**Q: How secure is my data?**
A: The application uses industry-standard security practices. Authentication is handled by Firebase, and data is stored securely in Supabase with appropriate access controls.

**Q: Can I share a trip with someone else?**
A: Currently, trip sharing is not supported. Each user manages their own trips and expenses.

**Q: What happens if OCR fails to read my receipt?**
A: If OCR fails, the expense status will indicate failure. You can still manually enter or correct the expense details. Ensure receipt images are clear and well-lit for best results.

**Q: How do I reset my password?**
A: Use the "Forgot Password" link on the login page. Password reset is handled through Firebase Authentication.

## Troubleshooting

**Problem: I can't log in.**
- **Solution**: Double-check your email and password. Use the "Forgot Password" link if needed. Ensure you are using the correct login method (email/password or Google).

**Problem: My uploaded receipt is not processing (stuck in "Processing OCR").**
- **Solution**: Background processing might take a few minutes. If it remains stuck for a long time, try re-uploading the receipt. If the issue persists, contact support or check the system status.

**Problem: An expense amount looks incorrect after OCR.**
- **Solution**: OCR is not always 100% accurate. Manually edit the expense to correct any errors made by the OCR process.

**Problem: The charts are not loading or showing incorrect data.**
- **Solution**: Try refreshing the page. Ensure you have selected the correct date ranges or filters. If the problem continues, there might be a temporary issue; try again later or contact support.

**Problem: I deleted an expense/trip by mistake. Can I recover it?**
- **Solution**: Deletions are generally permanent. Be careful when deleting items. There is no built-in undo functionality for deletions.

If you encounter issues not covered here, please refer to the application's support resources or contact the development team.