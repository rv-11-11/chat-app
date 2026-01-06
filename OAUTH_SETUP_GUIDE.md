# OAuth Setup Guide - Step by Step

## The Problem
Supabase requires HTTPS redirect URIs for OAuth providers (like Google), but mobile apps use custom deep link schemes. The solution is to use Supabase's HTTPS callback URL for the OAuth provider, and configure the app deep link in Supabase.

## Setup Steps

### ✅ Step 1: Google OAuth Console (Already Done!)

You've already created a Google OAuth client for Supabase:
- **Client ID**: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
- **Redirect URI**: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback` ✅

### Step 2: Configure Supabase Google Provider

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `elcfjdfiiucahgmwtibh`
3. Navigate to **Authentication** → **Providers**
4. Click on **Google** provider
5. Make sure it's **Enabled**
6. Enter your **Client ID**: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
7. Enter your **Client Secret** (get this from Google Cloud Console → APIs & Services → Credentials)
8. Click **Save**

### Step 3: Add App Deep Link to Supabase

1. In Supabase Dashboard, navigate to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   linkiplay://auth/callback
   ```
3. Click **Save**

## How the Flow Works

```
User taps "Sign in with Google"
    ↓
App opens Google OAuth in browser
    ↓
Google authenticates user
    ↓
Google redirects to: https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback
    ↓
Supabase processes OAuth callback
    ↓
Supabase redirects to: linkiplay://auth/callback
    ↓
App receives deep link and extracts session
    ↓
User is signed in and redirected to dashboard
```

## Testing

After completing both steps:
1. Build and install the APK
2. Try signing in with Google
3. You should be redirected back to the app after Google authentication
4. The app should automatically sign you in and navigate to the dashboard

## Troubleshooting

**Error: "invalid redirect_uri"**
- Make sure you added the HTTPS URL to Google OAuth Console
- Make sure you added the deep link to Supabase Redirect URLs

**Error: "redirect_uri_mismatch"**
- Verify the exact URL in Google OAuth Console matches: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback`
- Check for typos or extra spaces

**App doesn't receive redirect**
- Verify the deep link `linkiplay://auth/callback` is added in Supabase
- Check that AndroidManifest.xml has the intent filter for `linkiplay://`
