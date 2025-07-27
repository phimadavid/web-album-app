# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the web album app.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A project in Google Cloud Console

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen if prompted:
   - Choose "External" for user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains
6. For Application type, select "Web application"
7. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
8. Click "Create"
9. Copy the Client ID and Client Secret

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET_ID=your_google_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Features Implemented

- **Google Sign-In Button**: Added to the sign-in form with Google branding
- **User Creation**: Automatically creates new users when they sign in with Google
- **Database Integration**: Stores Google user information in the existing users table
- **Session Management**: Properly handles Google OAuth sessions alongside credential-based authentication
- **Role Assignment**: Assigns default "user" role to Google OAuth users

### 4. How It Works

1. User clicks "Sign in with Google" button
2. User is redirected to Google's OAuth consent screen
3. After authorization, Google redirects back to the app
4. The app checks if the user exists in the database
5. If new user, creates a database record with Google profile information
6. User is signed in and redirected to their dashboard

### 5. Database Schema

The users table includes these fields for Google OAuth:
- `googleId`: Stores the Google user ID (unique)
- `image`: Stores the user's Google profile picture URL
- `password`: Empty string for OAuth users (not used)

### 6. Security Notes

- Google OAuth users don't have passwords in the database
- The `googleId` field is unique to prevent duplicate accounts
- Sessions are managed securely using NextAuth.js JWT strategy
- Users can only access their own data based on their authenticated session

### 7. Testing

1. Set up the environment variables
2. Run the development server: `npm run dev`
3. Navigate to `/signin`
4. Click "Sign in with Google"
5. Complete the Google OAuth flow
6. Verify you're redirected to the dashboard

## Troubleshooting

- **Invalid redirect URI**: Make sure the redirect URI in Google Console matches your app's URL
- **Client ID not found**: Verify the `GOOGLE_CLIENT_ID` environment variable is set correctly
- **Database errors**: Ensure the database is running and migrations are applied
- **Session issues**: Check that `NEXTAUTH_SECRET` is set and `NEXTAUTH_URL` matches your app's URL
