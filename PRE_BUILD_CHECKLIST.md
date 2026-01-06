# Pre-Build Checklist

## ✅ Environment Variables Configuration

All environment variables are properly configured in `app.json`:

- ✅ **API URL**: `https://chat-app-qwrr.onrender.com`
- ✅ **Socket URL**: `https://chat-app-qwrr.onrender.com`
- ✅ **Supabase URL**: `https://elcfjdfiiucahgmwtibh.supabase.co`
- ✅ **Supabase Anon Key**: Configured
- ✅ **Google OAuth Client IDs**: Configured for Web and Android
- ✅ **Privacy Policy URL**: `https://chat-app-qwrr.onrender.com/api/legal/privacy`

## ✅ Code Fixes Applied

1. **OAuth Redirect Handling**: Fixed to properly process session after Google sign-in
2. **Environment Variables**: Fixed Supabase to use `Constants.expoConfig?.extra` instead of `process.env`
3. **Privacy Policy URL**: Updated to point to backend endpoint
4. **Community Invite Links**: Fixed to use ENV config instead of process.env

## ✅ Android Configuration

- **Package Name**: `com.linkiplay.messenger`
- **Version Code**: 2
- **Version Name**: 1.0.0
- **Scheme**: `linkiplay` (for deep linking)
- **Permissions**: INTERNET, ACCESS_NETWORK_STATE, POST_NOTIFICATIONS, RECORD_AUDIO, CAMERA
- **Signing**: Release keystore configured

## ✅ Supabase Redirect URI

**IMPORTANT**: Configure redirect URIs in TWO places:

1. **Google OAuth Console**: Add `https://elcfjdfiiucahgmwtibh.supabase.co/auth/v1/callback`
2. **Supabase Dashboard**: Add `linkiplay://auth/callback`

See `SUPABASE_REDIRECT_URI.md` for detailed instructions.

## ✅ Build Commands

To build the APK:

```bash
cd android
.\gradlew assembleRelease
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## ✅ Testing Checklist

Before uploading to Play Store:

1. [ ] Test Google Sign-In flow
2. [ ] Verify redirect to dashboard after sign-in
3. [ ] Test all core features (chat, channels, communities)
4. [ ] Verify privacy policy link works
5. [ ] Test on different Android versions if possible
6. [ ] Verify app icon and splash screen display correctly

## ⚠️ Important Notes

1. **Supabase Redirect URI**: Must be added in Supabase dashboard before testing OAuth
2. **Privacy Policy**: Ensure backend is running and accessible at the configured URL
3. **Version Code**: Increment for each new release (currently at 2)
4. **Signing**: Uses production keystore for release builds
