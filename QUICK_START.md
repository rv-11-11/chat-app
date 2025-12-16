# 🚀 QUICK START - Testing Current Implementation

## Prerequisites
- Node.js installed
- Backend server running (from `backend/` folder)
- Expo CLI: `npm install -g expo-cli` (optional, `npx expo` works too)

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Backend URL

### For Android Emulator:
Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://10.0.2.2:8000",
      "socketUrl": "http://10.0.2.2:8000"
    }
  }
}
```

### For iOS Simulator:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:8000",
      "socketUrl": "http://localhost:8000"
    }
  }
}
```

### For Physical Device:
Use your computer's IP address:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.XXX:8000",
      "socketUrl": "http://192.168.1.XXX:8000"
    }
  }
}
```

## Step 3: Start Backend
```bash
cd backend
npm run dev
```
Backend should be running on `http://localhost:8000`

## Step 4: Start Expo App
```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS  
- Press `w` for Web
- Scan QR code with Expo Go app (physical device)

## Step 5: Test Authentication

### Test Sign Up:
1. App opens → Sign In screen
2. Tap "Sign Up"
3. Fill form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
4. Tap "Sign Up"
5. ✅ Should navigate to Chats tab

### Test Sign In:
1. From Sign Up, tap "Sign In"
2. Enter credentials
3. Tap "Sign In"
4. ✅ Should navigate to Chats tab

### Test Auto-Login:
1. Close app completely
2. Reopen app
3. ✅ Should auto-login and go to Chats tab

## Expected Console Output

### On App Start:
```
✅ Backend connection successful: { message: "Server is healthy", status: "OK" }
```

### After Login:
```
✅ Socket connected
Socket connected: [socket-id]
```

## Troubleshooting

### "Cannot find module" errors
→ Run `npm install` again

### Backend connection failed
→ Check backend is running: `cd backend && npm run dev`
→ Verify URL in `app.json`

### Socket connection fails
→ Check backend CORS settings
→ Verify backend socket is running

### Auth fails
→ Check backend logs
→ Verify email/password format
→ Check backend auth endpoints

## What's Working ✅
- ✅ Backend connection test
- ✅ Sign Up flow
- ✅ Sign In flow  
- ✅ Auto-login on app start
- ✅ Socket connection after login
- ✅ Navigation to tabs
- ✅ Basic tab structure

## What's Next 🚧
- Chat list (fetching and displaying)
- One-to-one messaging
- Groups and channels
- Media uploads

---

**Ready to test!** Follow the steps above and check the console for any errors.

