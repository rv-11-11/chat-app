# Supabase Redirect URI Configuration

## ✅ Google OAuth Already Configured!

You've already set up a Google OAuth client for Supabase:
- **Client ID**: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
- **Redirect URI**: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback` ✅

**Next Step**: Make sure this client ID is configured in Supabase's Google provider settings, then add the app deep link below.

### Configure Supabase Dashboard (Required for App Deep Link)

Add your app's deep link to Supabase's allowed redirect URLs:

```
linkiplay://auth/callback
```

**Steps:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `elcfjdfiiucahgmwtibh`
3. **First, configure Google Provider:**
   - Navigate to **Authentication** → **Providers**
   - Click on **Google** provider
   - Make sure it's **Enabled**
   - Enter your **Client ID**: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
   - Enter your **Client Secret** (from Google Cloud Console)
   - Click **Save**
4. **Then, add the app deep link:**
   - Navigate to **Authentication** → **URL Configuration**
   - Under **Redirect URLs**, add:
     ```
     linkiplay://auth/callback
     ```
   - Click **Save**

## How It Works

1. User taps "Sign in with Google" in the app
2. App opens Google OAuth in browser
3. Google redirects to Supabase's callback URL: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback`
4. Supabase processes the OAuth callback and redirects to the app using: `linkiplay://auth/callback`
5. The Android app handles the deep link via the intent filter in `AndroidManifest.xml`
6. App extracts the session tokens and signs the user in
7. User is redirected to the dashboard

## Testing

After adding the redirect URI in Supabase:
1. Build and install the APK on your Android device
2. Try signing in with Google
3. After Google authentication, you should be redirected back to the app
4. The app should automatically navigate to the dashboard (/(tab))

## Additional Notes

- The scheme `linkiplay` is defined in `app.json` under `expo.scheme`
- The Android package name is `com.linkiplay.messenger`
- The deep link intent filter is configured in `android/app/src/main/AndroidManifest.xml`
