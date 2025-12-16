# REACT NATIVE + EXPO ARCHITECTURE DESIGN

## 📐 ARCHITECTURE OVERVIEW

This document outlines the complete architecture for the React Native + Expo mobile application, mapping from the existing web application to mobile equivalents.

---

## 📁 FOLDER STRUCTURE

```
native-chat-app/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth stack
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Home/Chat list
│   │   ├── groups.tsx            # Groups tab
│   │   ├── channels.tsx          # Channels tab
│   │   └── community.tsx         # Communities tab
│   ├── (drawer)/                 # Settings drawer
│   │   ├── _layout.tsx
│   │   ├── profile.tsx
│   │   ├── settings.tsx
│   │   └── reports.tsx
│   ├── chat/
│   │   └── [chatId].tsx          # Dynamic chat route
│   ├── channel/
│   │   └── [channelId].tsx       # Dynamic channel route
│   ├── group/
│   │   └── [groupId].tsx          # Dynamic group route
│   ├── community/
│   │   └── [communityId].tsx    # Dynamic community route
│   └── _layout.tsx               # Root layout
│
├── src/
│   ├── components/               # Reusable components
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── chat/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatListItem.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatBody.tsx
│   │   │   ├── ChatFooter.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageActions.tsx
│   │   │   └── ReplyBar.tsx
│   │   ├── channel/
│   │   │   ├── ChannelList.tsx
│   │   │   ├── ChannelPost.tsx
│   │   │   └── ChannelSubscribeButton.tsx
│   │   ├── group/
│   │   │   ├── GroupCreateDialog.tsx
│   │   │   ├── GroupMembersList.tsx
│   │   │   └── GroupManagementPanel.tsx
│   │   ├── community/
│   │   │   ├── CommunityList.tsx
│   │   │   └── CommunityCard.tsx
│   │   ├── media/
│   │   │   ├── ImagePicker.tsx
│   │   │   ├── VideoPicker.tsx
│   │   │   ├── FilePicker.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   └── VideoPlayer.tsx
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── Loading.tsx
│   │   └── common/
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── OfflineIndicator.tsx
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts           # Auth state & actions
│   │   ├── useSocket.ts         # Socket connection & events
│   │   ├── useChat.ts           # Chat state & actions
│   │   ├── useChannel.ts        # Channel state & actions
│   │   ├── useCommunity.ts     # Community state & actions
│   │   ├── useOfflineQueue.ts  # Offline message queue
│   │   ├── useWebRTC.ts         # Video/audio calls
│   │   ├── useNotifications.ts # Push notifications
│   │   └── useSettings.ts      # User settings
│   │
│   ├── services/                 # API & external services
│   │   ├── api/
│   │   │   ├── client.ts        # Axios instance
│   │   │   ├── auth.ts          # Auth endpoints
│   │   │   ├── chat.ts          # Chat endpoints
│   │   │   ├── channel.ts      # Channel endpoints
│   │   │   ├── community.ts    # Community endpoints
│   │   │   ├── message.ts      # Message endpoints
│   │   │   ├── search.ts        # Search endpoints
│   │   │   └── admin.ts        # Admin endpoints
│   │   ├── storage/
│   │   │   ├── asyncStorage.ts # AsyncStorage wrapper
│   │   │   └── secureStore.ts   # SecureStore wrapper
│   │   ├── socket/
│   │   │   ├── socketClient.ts # Socket.IO client
│   │   │   └── socketEvents.ts  # Event handlers
│   │   └── upload/
│   │       └── cloudinary.ts    # Cloudinary upload
│   │
│   ├── store/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── channelStore.ts
│   │   ├── communityStore.ts
│   │   ├── socketStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── chat.types.ts
│   │   ├── channel.types.ts
│   │   ├── community.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   ├── navigation/              # Navigation config
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   │
│   └── theme/                    # Theme configuration
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
│
├── assets/                       # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

---

## 🧭 NAVIGATION STRATEGY

### Navigation Stack

**Web → React Native Mapping:**
- React Router → Expo Router (file-based)
- Browser history → Native navigation stack
- URL params → Route params

### Navigation Structure

```
Root Layout
├── Auth Stack (if not authenticated)
│   ├── Sign In
│   └── Sign Up
│
└── Main App (if authenticated)
    ├── Tab Navigator
    │   ├── Chats Tab
    │   ├── Groups Tab
    │   ├── Channels Tab
    │   └── Communities Tab
    │
    ├── Stack Navigator (modals)
    │   ├── Chat Screen ([chatId])
    │   ├── Channel Screen ([channelId])
    │   ├── Group Screen ([groupId])
    │   └── Community Screen ([communityId])
    │
    └── Drawer Navigator
        ├── Profile
        ├── Settings
        └── Reports (if moderator/admin)
```

### Deep Linking

- **Invite Links:** `app://invite/:username`
- **Chat Links:** `app://chat/:chatId`
- **Channel Links:** `app://channel/:channelId`
- **Community Links:** `app://community/:communityId`

**Implementation:**
- Expo Linking API
- Universal links (iOS)
- App links (Android)

---

## 🗄️ STATE MANAGEMENT

### Strategy: Zustand (Same as Web)

**Stores:**
1. **authStore** - User, login state, token
2. **chatStore** - Chats list, current chat, messages
3. **channelStore** - Channels list, current channel
4. **communityStore** - Communities list, current community
5. **socketStore** - Socket connection, online users
6. **settingsStore** - User preferences, notifications

### Persistence

**Web localStorage → React Native:**
- **Non-sensitive:** AsyncStorage
- **Sensitive (tokens):** SecureStore (Expo)

**Migration:**
- Settings → AsyncStorage
- Auth token → SecureStore
- Offline queue → AsyncStorage

---

## 🔌 SOCKET LIFECYCLE

### Connection Flow

```
App Launch
  ↓
Check Auth Status
  ↓
If Authenticated → Connect Socket
  ↓
Socket Authenticated (JWT cookie)
  ↓
Join User Room: user:${userId}
  ↓
Listen to Events
```

### Socket Events Mapping

**Web Socket.IO → React Native Socket.IO Client**

| Web Event | React Native Handler | Action |
|-----------|---------------------|--------|
| `connect` | `socket.on('connect')` | Update connection state |
| `disconnect` | `socket.on('disconnect')` | Show offline indicator |
| `online:users` | `socket.on('online:users')` | Update online users list |
| `message:new` | `socket.on('message:new')` | Add message to chat |
| `message:deleted` | `socket.on('message:deleted')` | Remove message |
| `chat:new` | `socket.on('chat:new')` | Add chat to list |
| `chat:update` | `socket.on('chat:update')` | Update chat in list |
| `subscriber:joined` | `socket.on('subscriber:joined')` | Update channel subscribers |
| `subscriber:left` | `socket.on('subscriber:left')` | Update channel subscribers |
| `admin:added` | `socket.on('admin:added')` | Update admin list |
| `admin:removed` | `socket.on('admin:removed')` | Update admin list |
| `report:created` | `socket.on('report:created')` | Add report (admin) |
| `report:status-changed` | `socket.on('report:status-changed')` | Update report (admin) |

### Room Management

**Join Rooms:**
- On screen focus: Join `chat:${chatId}`
- On screen blur: Leave `chat:${chatId}`
- On channel view: Join `channel:${channelId}`
- On reports view: Join `admin:reports` (if admin)

**Implementation:**
- Use `useFocusEffect` from React Navigation
- Auto-join/leave on navigation

---

## 🌐 API LAYER

### HTTP Client

**Web Axios → React Native Axios**

```typescript
// src/services/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // For cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add token if needed
apiClient.interceptors.request.use(async (config) => {
  // Token is in cookie, but we can add auth header if needed
  return config;
});

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      await SecureStore.deleteItemAsync('authToken');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints Structure

```typescript
// src/services/api/auth.ts
export const authApi = {
  register: (data: RegisterData) => apiClient.post('/auth/register', data),
  login: (data: LoginData) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getStatus: () => apiClient.get('/auth/status'),
};

// Similar for chat, channel, community, message, search, admin
```

---

## 🎨 THEME & DESIGN SYSTEM

### Color System

**Web Tailwind → React Native StyleSheet**

```typescript
// src/theme/colors.ts
export const colors = {
  // Light theme
  light: {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    secondary: '#5856D6',
    muted: '#F5F5F5',
    border: '#E5E5E5',
  },
  // Dark theme
  dark: {
    background: '#000000',
    foreground: '#FFFFFF',
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    muted: '#1C1C1E',
    border: '#38383A',
  },
};
```

### Typography

```typescript
// src/theme/typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 14, fontWeight: '400' },
};
```

### Spacing

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Theme Provider

```typescript
// src/theme/ThemeProvider.tsx
import { useColorScheme } from 'react-native';
import { colors } from './colors';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  return { theme, colorScheme };
};
```

---

## 📱 NATIVE API MAPPINGS

### Web → React Native Equivalents

| Web API | React Native Equivalent | Package |
|---------|------------------------|---------|
| `localStorage` | `AsyncStorage` | `@react-native-async-storage/async-storage` |
| `sessionStorage` | `AsyncStorage` (with key prefix) | `@react-native-async-storage/async-storage` |
| `document.cookie` | `SecureStore` (for tokens) | `expo-secure-store` |
| `<input type="file">` | `ImagePicker` / `DocumentPicker` | `expo-image-picker` / `expo-document-picker` |
| `<video>` | `Video` component | `expo-av` |
| `<img>` | `Image` component | `expo-image` |
| `navigator.onLine` | `NetInfo` | `@react-native-community/netinfo` |
| `Notification API` | `Notifications` | `expo-notifications` |
| `Service Worker` | Background tasks | `expo-task-manager` (limited) |
| `window.location` | `Linking` | `expo-linking` |
| CSS animations | `Animated` / `Reanimated` | `react-native-reanimated` |
| `fetch` | `axios` / `fetch` | Built-in / `axios` |

---

## 🔐 AUTHENTICATION FLOW

### Token Management

**Web (Cookie-based) → React Native (Hybrid)**

1. **Login:**
   - Server sets HTTP-only cookie (works with `withCredentials: true`)
   - Also store token in SecureStore as backup
   - Use cookie for API requests

2. **Token Refresh:**
   - Check `/auth/status` on app launch
   - Refresh if expired
   - Handle 401 errors

3. **Logout:**
   - Clear SecureStore
   - Call `/auth/logout` to clear server cookie

### Auto-Login

```typescript
// On app launch
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await authApi.getStatus();
      if (response.data.user) {
        setUser(response.data.user);
        connectSocket();
      }
    } catch {
      // Not authenticated
      navigateToLogin();
    }
  };
  checkAuth();
}, []);
```

---

## 📦 REQUIRED PACKAGES

### Core Dependencies

```json
{
  "dependencies": {
    "expo": "~54.0.27",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo-router": "~6.0.17",
    "@react-navigation/native": "^7.1.8",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/drawer": "^7.7.9",
    "axios": "^1.12.2",
    "socket.io-client": "^4.8.1",
    "zustand": "^5.0.8",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "expo-secure-store": "~14.0.4",
    "expo-image-picker": "~16.0.5",
    "expo-document-picker": "~12.1.2",
    "expo-av": "~15.0.1",
    "expo-image": "~3.0.11",
    "expo-notifications": "~0.29.9",
    "@react-native-community/netinfo": "^11.3.1",
    "expo-linking": "~8.0.10",
    "react-native-reanimated": "~4.1.1",
    "react-native-gesture-handler": "~2.28.0",
    "date-fns": "^4.1.0",
    "nativewind": "^4.2.1"
  }
}
```

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### Image Optimization

- Use `expo-image` for better performance
- Lazy loading for chat list images
- Image caching
- Thumbnail generation for videos

### List Optimization

- Use `FlatList` with `getItemLayout`
- Virtualization for long lists
- Pagination for chat list
- Memoization for list items

### Socket Optimization

- Debounce frequent events
- Batch updates
- Connection pooling
- Reconnection backoff

---

## 🔒 SECURITY CONSIDERATIONS

1. **Token Storage:** SecureStore for sensitive data
2. **HTTPS Only:** Enforce in production
3. **Certificate Pinning:** For API calls (if needed)
4. **Code Obfuscation:** For production builds
5. **Deep Link Validation:** Verify invite links server-side

---

## 📝 ENVIRONMENT VARIABLES

```typescript
// app.json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.API_URL || "http://localhost:8000",
      "socketUrl": process.env.SOCKET_URL || "http://localhost:8000",
      "cloudinaryCloudName": process.env.CLOUDINARY_CLOUD_NAME,
      "cloudinaryApiKey": process.env.CLOUDINARY_API_KEY
    }
  }
}
```

---

## 🧪 TESTING STRATEGY

1. **Unit Tests:** Jest for utilities
2. **Component Tests:** React Native Testing Library
3. **Integration Tests:** API mocking
4. **E2E Tests:** Detox (optional)

---

**END OF ARCHITECTURE DESIGN**


