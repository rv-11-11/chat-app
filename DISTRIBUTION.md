# LinkiPlay Distribution Guide

## Application Details
- **Name:** LinkiPlay - Telegram Style Messenger
- **Version:** 1.0.0
- **Package ID:** com.linkiplay.messenger

## Generated APK
The standalone APK has been generated at:
`android/app/build/outputs/apk/release/app-release.apk`

## Installation Instructions
1. Transfer the `app-release.apk` file to your Android device.
2. Open the file and allow installation from unknown sources if prompted.
3. The app will install as "LinkiPlay".

## Update System
The app includes an automatic update check system.
- When the app launches, it checks the server for a newer version.
- If a new version is detected (version number > current installed version), the user is prompted to update.
- The update URL is currently configured in `backend/src/routes/index.ts`.

## Future Builds
To generate a new release APK:
1. Open a terminal in the project root.
2. Run: `npx expo prebuild --platform android` (if you changed app.json).
3. Navigate to android folder: `cd android`.
4. Run build command:
   - Windows: `.\gradlew assembleRelease`
   - Mac/Linux: `./gradlew assembleRelease`
5. The new APK will be in the same output folder.

## Signing
This build uses a debug key for signing, which is suitable for direct distribution (side-loading) but NOT for Google Play Store.
To sign for Google Play:
1. Generate a keystore file.
2. Update `android/app/build.gradle` signing configs.
3. Run `.\gradlew bundleRelease` to generate an AAB file.
