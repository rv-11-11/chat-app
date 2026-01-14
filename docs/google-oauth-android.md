Purpose

This document lists exact steps to get "Sign in with Google" working for native Android (APK / EAS dev client) when using Supabase OAuth and expo-auth-session.

Checklist

- Add redirect URLs to Supabase
- Build an EAS dev-client or standalone APK
- Install/build on device and test

Redirect URIs to add in Supabase (use exact values printed in app logs)

- For standalone app (recommended):
  - linkiplay://

- For EAS dev client (development builds):
  - linkiplay://expo-development-client/--/expo-auth-session

- For web (if you test web):
  - http://localhost:19006

Notes

- The `redirectUri` printed in the app logs (`console.log('[Auth] redirectUri (sign-in)', redirectUri)`) is authoritative — add that exact string to Supabase > Authentication > Settings > Redirect URLs.
- Expo Go cannot handle native OAuth redirect with custom schemes. Build a dev-client or standalone APK.

Build commands (EAS)

# Install eas-cli if not installed
npm install -g eas-cli

# Build a development dev-client for Android
eas build --platform android --profile development

# Or build a production APK (standalone)
eas build --platform android --profile production

Testing

- Install the generated APK on device.
- Open the app, tap "Sign in with Google".
- Watch device logs (adb logcat) or run the app and check server logs for the /auth/google payload.

Debugging

- If you see the UI but backend operations fail, confirm these logs appear in app logs:
  - [Supabase] native flow setSession from returned url
  - [Supabase] auth event SIGNED_IN
  - [Client] googleLogin payload { email, name, googleId, avatar }

- On the backend, look for:
  - [Backend] /auth/google payload { email, name, googleId, avatar }

If the payload email is empty, check that you have added the correct redirect URI in Supabase and that the scopes include 'openid email profile'.

Security

- Remove debug logs from production builds.
- Ensure your Supabase credentials and JWT secret remain secure.
