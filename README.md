# Native Chat App - React Native + Expo

A complete React Native mobile application converted from a production web chat application.

## 📋 Current Status

### ✅ Completed
- **STEP 1:** Expo project bootstrap (config, API client, stores)
- **STEP 2:** Authentication system (login, signup, auto-login)
- **STEP 3:** Socket infrastructure (connection, reconnection, events)

### 🚧 In Progress
- **STEP 4:** Chat list implementation
- **STEP 5:** One-to-one messaging

## 🚀 Quick Start

See [QUICK_START.md](./QUICK_START.md) for detailed testing instructions.

```bash
# Install dependencies
npm install

# Start backend (in separate terminal)
cd backend && npm run dev

# Start Expo app
npm start
```

## 📁 Project Structure

```
native-chat-app/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── src/
│   ├── config/            # Environment config
│   ├── types/             # TypeScript types
│   ├── services/          # API & socket services
│   ├── store/             # Zustand stores
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities
└── backend/               # Backend API (existing)
```

## 🔧 Configuration

Update `app.json` with your backend URL:

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

## 📚 Documentation

- [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md) - Complete feature list
- [ARCHITECTURE_DESIGN.md](./ARCHITECTURE_DESIGN.md) - Architecture details
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing instructions
- [QUICK_START.md](./QUICK_START.md) - Quick setup guide

## 🛠️ Tech Stack

- **Framework:** React Native + Expo
- **Navigation:** Expo Router
- **State:** Zustand
- **API:** Axios
- **Socket:** Socket.IO Client
- **Storage:** AsyncStorage + SecureStore

## 📝 Development

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## 🐛 Troubleshooting

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for common issues and fixes.

## 📄 License

Private project
