# Quick OAuth Setup - Final Step

## ✅ What's Already Done

1. **Google OAuth Client Created** ✅
   - Client ID: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
   - Redirect URI: `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback`

## 🔧 What You Need to Do Now

### 1. Configure Google Provider in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `elcfjdfiiucahgmwtibh`
3. Navigate to **Authentication** → **Providers**
4. Click on **Google**
5. Enable the provider
6. Enter:
   - **Client ID**: `170631155124-f71ib8jo7nie2elcnl730uhbd2tsva6l.apps.googleusercontent.com`
   - **Client Secret**: (Get this from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Your OAuth client)
7. Click **Save**

### 2. Add App Deep Link (IMPORTANT: Different Section!)

**⚠️ DO NOT add this in "OAuth Server" section!**

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration** (NOT "OAuth Server")
2. Scroll down to find **Redirect URLs** section
3. Click **Add URL** or the **+** button
4. Add:
   ```
   linkiplay://auth/callback
   ```
5. Click **Save**

**Note**: The "OAuth Server" section is for configuring Google's OAuth settings (which you've already done). The "URL Configuration" section is where you add redirect URLs that Supabase will redirect to AFTER processing OAuth.

## ✅ That's It!

After completing these two steps, your OAuth flow will work:
- Google OAuth → Supabase callback → App deep link → User signed in

## 🧪 Test It

1. Build your APK
2. Install on device
3. Tap "Sign in with Google"
4. Complete Google authentication
5. You should be redirected back to the app and signed in!
