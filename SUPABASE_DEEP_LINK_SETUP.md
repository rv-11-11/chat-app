# Supabase Deep Link Setup - Step by Step

## ⚠️ Important: Two Different Sections!

Supabase has **two different places** to configure redirects. Make sure you're in the right one!

## ✅ Section 1: OAuth Server (Already Done!)

**Location**: Authentication → Sign In / Providers → Google → OAuth Server

This is where you configure Google OAuth settings. You've already done this correctly:
- ✅ Client ID: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
- ✅ Client Secret: Configured
- ✅ Callback URL: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback`

**DO NOT** add `linkiplay://auth/callback` here! This section only accepts HTTPS URLs.

## ✅ Section 2: URL Configuration (Add Deep Link Here!)

**Location**: Authentication → URL Configuration

This is where you add redirect URLs that Supabase will redirect to AFTER processing OAuth.

### Steps:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `elcfjdfiiucahgmwtibh`
3. Click **Authentication** in the left sidebar
4. Click **URL Configuration** (NOT "OAuth Server" or "Sign In / Providers")
5. Scroll down to find **Redirect URLs** section
6. Click **Add URL** or the **+** button
7. Enter:
   ```
   linkiplay://auth/callback
   ```
8. Click **Save**

## Visual Guide

```
Supabase Dashboard
├── Authentication
    ├── Sign In / Providers
    │   └── Google
    │       └── OAuth Server ← Already configured ✅
    │           └── Callback URL: https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback
    │
    └── URL Configuration ← ADD DEEP LINK HERE! ✅
        └── Redirect URLs
            └── Add: linkiplay://auth/callback
```

## How It Works

1. User taps "Sign in with Google" in app
2. App opens Google OAuth in browser
3. Google redirects to: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback` (configured in OAuth Server)
4. Supabase processes the OAuth callback
5. Supabase redirects to: `linkiplay://auth/callback` (configured in URL Configuration)
6. App receives deep link and signs user in

## Troubleshooting

**Error: "scheme must be HTTPS or HTTP"**
- ❌ You're trying to add it in the wrong section (OAuth Server)
- ✅ Add it in **URL Configuration** → **Redirect URLs** instead

**Can't find URL Configuration**
- Make sure you're in Authentication section
- Look for "URL Configuration" in the left sidebar under Authentication
- It might be under "Configuration" submenu

**Deep link not working**
- Verify `linkiplay://auth/callback` is added in URL Configuration (not OAuth Server)
- Check that AndroidManifest.xml has the intent filter for `linkiplay://`
- Verify the app code uses `makeRedirectUri({ scheme: 'linkiplay', path: 'auth/callback' })`
