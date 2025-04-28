# Expense Tracker SvelteKit Netlify

Expense Tracker application built with SvelteKit and deployed to Netlify, using Firebase Auth and Supabase.

## Overview

This project is a migration of the Expense Tracker application from a React frontend with Clerk authentication to a SvelteKit frontend with Firebase authentication, while maintaining the Supabase database backend.

![Expense Tracker Screenshot](https://via.placeholder.com/800x450.png?text=Expense+Tracker+App)

## Features

- **User Authentication**: Firebase Authentication with email/password, Google, and GitHub login options
- **Expense Management**: Create, read, update, and delete expenses
- **Trip Management**: Organize expenses by trips
- **Receipt OCR**: Extract expense information from receipts using OCR
- **Data Export**: Export expenses to Excel or PDF
- **Analytics**: View expense analytics and reports
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: SvelteKit
- **Authentication**: Firebase Authentication
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Hosting**: Netlify
- **API**: tRPC
- **Styling**: Tailwind CSS

## Deployment

For detailed deployment instructions, see the [Deployment Guide](DEPLOYMENT_GUIDE.md).

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/oghenetejiriorukpegmail/expense-tracker-svelte-netlify.git
   cd expense-tracker-svelte-netlify
   ```

2. Install dependencies:
   ```bash
   cd expense-tracker-svelte
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your Firebase and Supabase credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

- `expense-tracker-svelte/`: SvelteKit application
  - `src/`: Source code
    - `lib/`: Library code
    - `routes/`: SvelteKit routes
    - `components/`: Svelte components
  - `static/`: Static assets
  - `expense-tracker-api/`: API code
- `netlify/`: Netlify functions
- `migrations/`: Database migrations

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
