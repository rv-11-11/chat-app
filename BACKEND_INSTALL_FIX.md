# Backend Installation Fix

## Issue
The backend `npm install` fails because `@tensorflow/tfjs-node` requires Visual Studio C++ build tools on Windows.

## Solution Options

### Option 1: Skip TensorFlow (Recommended for Testing)
The TensorFlow package is only used for NSFW detection. You can install without it:

```bash
cd backend
npm install --ignore-scripts
```

Then manually install other packages if needed, or continue without NSFW detection for now.

### Option 2: Install Visual Studio Build Tools
1. Download Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/
2. Install "Desktop development with C++" workload
3. Run `npm install` again

### Option 3: Use Docker (if available)
Run backend in Docker to avoid Windows build issues.

## For Now - Test Frontend Only

The frontend (React Native app) doesn't need the backend to be fully installed. You can:

1. **Test frontend only** - The app will show connection errors but you can test UI
2. **Use existing backend** - If backend was already working before, use that
3. **Skip NSFW** - Backend will work without TensorFlow, just NSFW detection won't work

## Quick Test Command

```bash
# Frontend (root directory) - This works now!
npm install  # ✅ Already done

# Backend - Skip TensorFlow for now
cd backend
npm install --ignore-scripts
```

The backend will still run, just NSFW detection won't work until TensorFlow is properly installed.


