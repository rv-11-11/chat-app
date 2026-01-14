Local Android signing guide (assembleRelease)

1. Create `keystore.properties` from template:
   - Copy `keystore.properties.template` to `keystore.properties` at the repo root and fill the values.

2. Ensure `android/app/build.gradle` reads `keystore.properties` (this repo should already be set up for it). If not, add the following near the top of `android/app/build.gradle`:

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

And in `android { signingConfigs { release { ... } } }` use `keystoreProperties['keyAlias']` etc.

3. Build release APK from Windows PowerShell:

```powershell
cd android
.\gradlew assembleRelease
```

4. The signed APK is at:

```
android/app/build/outputs/apk/release/app-release.apk
```

5. Install on device:

```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

Debugging tips
- Use the in-app Debug screen (`linkiplay://debug`) to inspect Supabase user, backend token, and app user.
- If native setSession fails, you'll see an Alert inside the app. That usually means redirect URI mismatch or scopes missing.

Security
- Never commit your `keystore.properties` to source control. The template is safe to commit.
