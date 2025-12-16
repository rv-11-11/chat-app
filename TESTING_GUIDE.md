# TESTING GUIDE - Current Implementation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Update Backend URL (if needed)
Edit `app.json` and update the `extra.apiUrl` and `extra.socketUrl` if your backend is not running on `http://localhost:8000`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_BACKEND_IP:8000",
      "socketUrl": "http://YOUR_BACKEND_IP:8000"
    }
  }
}
```

### 3. Start Backend Server
Make sure your backend is running:
```bash
cd backend
npm run dev
```

### 4. Start Expo App
```bash
npm start
```

Then press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web browser

---

## ✅ What to Test

### STEP 1: Backend Connection
- App should start without crashes
- Check console for: `✅ Backend connection successful` or `❌ Backend connection failed`
- If failed, verify backend is running and URL is correct

### STEP 2: Authentication Flow

#### Sign Up
1. App should show Sign In screen first
2. Tap "Sign Up" link
3. Fill in:
   - Full Name
   - Email
   - Password (min 6 chars)
   - Confirm Password
4. Tap "Sign Up"
5. **Expected:** 
   - Loading indicator shows
   - On success: Navigate to Chats tab
   - User should be logged in
   - Socket should connect (check console)

#### Sign In
1. From Sign Up screen, tap "Sign In" link
2. Enter email and password
3. Tap "Sign In"
4. **Expected:**
   - Loading indicator shows
   - On success: Navigate to Chats tab
   - User should be logged in
   - Socket should connect

#### Auto-Login
1. Close app completely
2. Reopen app
3. **Expected:**
   - App checks auth status
   - If still logged in: Go directly to Chats tab
   - If logged out: Show Sign In screen

#### Logout (if implemented in drawer)
- Should clear user session
- Navigate back to Sign In

### STEP 3: Socket Connection
- After login, check console logs:
  - `✅ Socket connected`
  - `Socket connected: [socket-id]`
- Socket should auto-reconnect on disconnect

### STEP 4: Navigation
- Tabs should be visible at bottom:
  - Chats
  - Groups
  - Channels
  - Communities
- Each tab should show placeholder content

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'expo-constants'"
**Fix:** Run `npm install` to install all dependencies

### Issue: Backend connection failed
**Fix:** 
1. Verify backend is running: `cd backend && npm run dev`
2. Check backend URL in `app.json`
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For iOS simulator, `localhost` should work
5. For physical device, use your computer's IP address

### Issue: Socket connection fails
**Fix:**
1. Ensure backend socket is running
2. Check CORS settings in backend
3. Verify `withCredentials: true` is set (it is in our code)

### Issue: Auth fails with 401
**Fix:**
1. Verify backend auth endpoints are working
2. Check backend logs for errors
3. Ensure email/password are correct

### Issue: Navigation not working
**Fix:**
1. Check Expo Router is properly installed
2. Verify file structure matches routes
3. Restart Expo: `npm start -- --clear`

---

## 📱 Platform-Specific Notes

### Android
- Use `10.0.2.2` for localhost backend
- Or use your computer's IP: `http://192.168.x.x:8000`

### iOS
- `localhost` should work in simulator
- For physical device, use computer's IP

### Web
- Should work with `localhost:8000`
- Check browser console for errors

---

## 🔍 Debug Checklist

- [ ] Backend is running and accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Backend URL is correct in `app.json`
- [ ] No TypeScript errors (after `npm install`)
- [ ] Expo server started successfully
- [ ] App launches without crashes
- [ ] Sign Up works
- [ ] Sign In works
- [ ] Socket connects after login
- [ ] Navigation between tabs works
- [ ] Auto-login works after app restart

---

## 📝 Test Results Template

```
Date: ___________
Platform: [Android/iOS/Web]
Backend URL: ___________

✅ Backend Connection: [Pass/Fail]
✅ Sign Up: [Pass/Fail]
✅ Sign In: [Pass/Fail]
✅ Socket Connection: [Pass/Fail]
✅ Navigation: [Pass/Fail]
✅ Auto-Login: [Pass/Fail]

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

## 🚨 If Everything Works

Great! You're ready for:
- **STEP 4:** Chat List Implementation
- **STEP 5:** One-to-One Chat
- **STEP 6:** Groups & Channels

---

## 📞 Need Help?

Check:
1. Console logs for errors
2. Backend logs
3. Network tab (if testing on web)
4. Expo logs: `npx expo start --clear`


