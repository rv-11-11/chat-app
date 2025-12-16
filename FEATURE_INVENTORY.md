# COMPLETE FEATURE INVENTORY
## React Native + Expo Migration - Full Codebase Analysis

**Date:** Analysis Phase  
**Status:** PHASE 0 - Complete Feature Discovery

---

## 📋 TABLE OF CONTENTS

1. [Authentication & User Management](#1-authentication--user-management)
2. [Core Messaging Features](#2-core-messaging-features)
3. [Chat Types & Management](#3-chat-types--management)
4. [Real-time Features](#4-real-time-features)
5. [Media & Attachments](#5-media--attachments)
6. [Search & Discovery](#6-search--discovery)
7. [Invite System](#7-invite-system)
8. [Notifications](#8-notifications)
9. [Settings & Preferences](#9-settings--preferences)
10. [Offline Support](#10-offline-support)
11. [Content Moderation](#11-content-moderation)
12. [Admin & Moderation Features](#12-admin--moderation-features)

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 Authentication Flows

**Feature:** User Registration
- **Location:** `client/src/pages/auth/sign-up.tsx`, `backend/src/controllers/auth.controller.ts`
- **Backend:** `POST /api/auth/register`
- **Details:**
  - Email/password registration
  - Name, email, password required
  - Optional avatar upload
  - Auto-login after registration
  - JWT token set in HTTP-only cookie
  - Rate limiting: 5 registrations per hour per IP
- **RN Strategy:** 
  - Form with validation (React Hook Form)
  - Image picker for avatar (Expo ImagePicker)
  - AsyncStorage for token persistence
  - SecureStore for sensitive data

**Feature:** User Login
- **Location:** `client/src/pages/auth/sign-in.tsx`, `backend/src/controllers/auth.controller.ts`
- **Backend:** `POST /api/auth/login`
- **Details:**
  - Email/password authentication
  - JWT token in HTTP-only cookie
  - Rate limiting: 5 attempts per 15 minutes
  - Admin IP whitelist check
  - Auto-process pending invites after login
  - Audit logging for admin logins
- **RN Strategy:**
  - Secure credential storage
  - Auto-login on app launch
  - Handle invite redirects

**Feature:** Google OAuth Login
- **Location:** `backend/src/config/passport.config.ts`, `backend/src/controllers/auth.controller.ts`
- **Backend:** `GET /api/auth/google`, `GET /api/auth/google/callback`
- **Details:**
  - Passport.js Google OAuth 2.0
  - Redirect URL support
  - Session-based flow
- **RN Strategy:**
  - Expo AuthSession for OAuth
  - Deep linking for callback

**Feature:** Auth Status Check
- **Location:** `client/src/hooks/use-auth.ts`
- **Backend:** `GET /api/auth/status`
- **Details:**
  - Validates current session
  - Returns user object if authenticated
  - Auto-connects socket on success
- **RN Strategy:**
  - Check on app launch
  - Refresh token logic

**Feature:** Logout
- **Location:** `client/src/hooks/use-auth.ts`
- **Backend:** `POST /api/auth/logout`
- **Details:**
  - Clears JWT cookie
  - Disconnects socket
  - Clears local state
- **RN Strategy:**
  - Clear AsyncStorage
  - Navigate to login

### 1.2 User Profile Management

**Feature:** User Profile Update
- **Location:** `client/src/components/profile-edit-dialog.tsx`, `backend/src/controllers/user.controller.ts`
- **Backend:** `PUT /api/user/profile`
- **Details:**
  - Update name, avatar, username
  - Username uniqueness validation
  - Username format: lowercase alphanumeric + underscore
- **RN Strategy:**
  - Profile edit screen
  - Image picker for avatar
  - Cloudinary upload

**Feature:** Get User by Username
- **Location:** `backend/src/controllers/user.controller.ts`
- **Backend:** `GET /api/user/username/:username`
- **Details:**
  - Public user lookup
  - Returns user profile
- **RN Strategy:**
  - User profile view screen

**Feature:** Get All Users
- **Location:** `client/src/hooks/use-chat.ts`, `backend/src/controllers/user.controller.ts`
- **Backend:** `GET /api/user/all`
- **Details:**
  - List all users for chat creation
  - Excludes current user
- **RN Strategy:**
  - User picker component
  - Search/filter functionality

### 1.3 User Roles & Permissions

**Feature:** User Roles
- **Location:** `backend/src/models/user.model.ts`
- **Details:**
  - Roles: USER, MODERATOR, ADMIN
  - Default: USER
  - Role-based access control
- **RN Strategy:**
  - Conditional UI rendering
  - Protected routes

**Feature:** User Suspension
- **Location:** `backend/src/models/user.model.ts`
- **Details:**
  - `isSuspended` flag
  - `suspendedUntil` date
  - `suspensionReason` text
  - Admin-only feature
- **RN Strategy:**
  - Show suspension message
  - Block actions when suspended

---

## 2. CORE MESSAGING FEATURES

### 2.1 Message Types

**Feature:** Text Messages
- **Location:** `client/src/components/chat/chat-footer.tsx`, `backend/src/services/message.service.ts`
- **Backend:** `POST /api/chat/message/send`
- **Details:**
  - Plain text content
  - Markdown/linkify support (linkify-react)
  - Max length validation
- **RN Strategy:**
  - TextInput component
  - Link detection & preview

**Feature:** Image Messages
- **Location:** `client/src/components/file/image-upload-with-nsfw.tsx`
- **Backend:** `POST /api/chat/message/send` (with image field)
- **Details:**
  - Base64 or file upload
  - Cloudinary storage
  - NSFW detection before upload
  - Image preview before send
- **RN Strategy:**
  - Expo ImagePicker
  - Image preview component
  - Upload progress indicator

**Feature:** Video Messages
- **Location:** `client/src/components/chat/chat-footer.tsx`
- **Backend:** `POST /api/chat/message/send` (with video field)
- **Details:**
  - Base64 video upload (up to 200MB)
  - Video metadata: name, duration, size, thumbnail
  - Cloudinary storage
  - Video preview
- **RN Strategy:**
  - Expo ImagePicker (video mode)
  - Video player component
  - Thumbnail generation

**Feature:** File Attachments
- **Location:** `backend/src/models/message.model.ts`
- **Backend:** `POST /api/chat/message/send` (with file field)
- **Details:**
  - File metadata: url, name, type, size
  - Cloudinary storage
  - File preview/download
- **RN Strategy:**
  - Expo DocumentPicker
  - File preview component
  - Download handler

**Feature:** System Messages
- **Location:** `backend/src/models/message.model.ts`
- **Details:**
  - `messageType: "SYSTEM"`
  - Auto-generated for events (user joined, left, etc.)
  - Displayed differently in UI
- **RN Strategy:**
  - System message component
  - Centered, muted styling

### 2.2 Message Actions

**Feature:** Reply to Message
- **Location:** `client/src/components/chat/chat-body-message.tsx`, `client/src/components/chat/chat-reply-bar.tsx`
- **Backend:** `POST /api/chat/message/send` (with replyToId)
- **Details:**
  - Reply to any message
  - Shows quoted message preview
  - Reply chain in message
- **RN Strategy:**
  - Long-press on message
  - Reply preview bar
  - Quoted message display

**Feature:** Edit Message
- **Location:** `client/src/components/chat/chat-body-message.tsx`, `backend/src/controllers/message.controller.ts`
- **Backend:** `PUT /api/chat/message/:messageId/edit`
- **Details:**
  - Only sender can edit
  - Edit text content only
  - Shows "edited" indicator
- **RN Strategy:**
  - Edit dialog
  - Updated timestamp display

**Feature:** Delete Message
- **Location:** `client/src/components/chat/chat-body-message.tsx`, `backend/src/services/message.service.ts`
- **Backend:** `DELETE /api/chat/message/:messageId`
- **Details:**
  - Sender or admin can delete
  - Soft delete (removes from chat)
  - Emits `message:deleted` socket event
- **RN Strategy:**
  - Delete confirmation dialog
  - Optimistic UI update

**Feature:** Forward Message
- **Location:** `client/src/components/chat/forward-picker.tsx`, `backend/src/services/message.service.ts`
- **Backend:** `POST /api/chat/message/:messageId/forward`
- **Details:**
  - Forward to multiple chats
  - Preserves media (no re-upload)
  - Removes replyTo reference
  - Channel admin-only for channels
- **RN Strategy:**
  - Chat picker modal
  - Multi-select support
  - Forward confirmation

**Feature:** Pin Message
- **Location:** `client/src/components/chat/chat-body-message.tsx`, `backend/src/services/message.service.ts`
- **Backend:** `PUT /api/chat/message/:messageId/pin`
- **Details:**
  - Toggle pin status
  - Pinned messages shown first
  - One pinned message per chat (implied)
- **RN Strategy:**
  - Pin icon in message menu
  - Pinned message bar at top
  - Visual pin indicator

**Feature:** View Count (Channel Messages)
- **Location:** `client/src/components/channel/channel-post-message.tsx`, `backend/src/services/message.service.ts`
- **Backend:** `POST /api/chat/message/:messageId/view`
- **Details:**
  - Increment view count
  - Track viewed messages in localStorage
  - Display view count
- **RN Strategy:**
  - Track views in AsyncStorage
  - View count badge

### 2.3 Message State & Sync

**Feature:** Optimistic Updates
- **Location:** `client/src/hooks/use-chat.ts`
- **Details:**
  - Show message immediately
  - Replace with server response
  - Remove on error
- **RN Strategy:**
  - Temporary message ID
  - State management (Zustand)

**Feature:** Message Status
- **Location:** `client/src/types/chat.type.ts`
- **Details:**
  - "sending..." status
  - Visual indicators
- **RN Strategy:**
  - Status icons (sending, sent, failed)

**Feature:** Unread Count
- **Location:** `backend/src/models/chat.model.ts`
- **Details:**
  - `unreadBy` array tracks users
  - Incremented on new message
  - Cleared on mark-as-read
- **RN Strategy:**
  - Badge on chat list item
  - Unread indicator

---

## 3. CHAT TYPES & MANAGEMENT

### 3.1 Direct Messages (1-on-1)

**Feature:** Create Direct Chat
- **Location:** `client/src/components/chat/newchat-popover.tsx`, `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/create`
- **Details:**
  - Create with participantId
  - Auto-find existing chat
  - Type: DIRECT
- **RN Strategy:**
  - User picker
  - Navigate to chat

**Feature:** Direct Chat List
- **Location:** `client/src/components/chat/chat-list.tsx`
- **Backend:** `GET /api/chat/all`
- **Details:**
  - Shows all user chats
  - Sorted by last message
  - Shows unread count
- **RN Strategy:**
  - FlatList with sections
  - Pull to refresh

### 3.2 Group Chats

**Feature:** Create Group
- **Location:** `client/src/components/chat/group-create-dialog.tsx`, `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/create`
- **Details:**
  - Group name required
  - Optional group username (@groupname)
  - Optional icon
  - Multiple participants
  - Type: GROUP
  - Creator is admin
- **RN Strategy:**
  - Group creation screen
  - Multi-select participants
  - Image picker for icon

**Feature:** Group Management
- **Location:** `client/src/components/chat/group-management-panel.tsx`
- **Details:**
  - Edit group name/icon
  - Add/remove members
  - Promote to admin
  - Delete group
- **RN Strategy:**
  - Group settings screen
  - Member list with actions

**Feature:** Group Members
- **Location:** `client/src/components/chat/view-members-dialog.tsx`, `client/src/components/chat/group-members-list.tsx`
- **Backend:** `GET /api/chat/:id`
- **Details:**
  - List all participants
  - Show admins
  - Admin actions (remove, promote)
- **RN Strategy:**
  - Members list screen
  - Admin badges

**Feature:** Group Invite
- **Location:** `client/src/components/group/group-invite-dialog.tsx`
- **Backend:** `POST /api/chat/:id/invite-user`
- **Details:**
  - Invite by user ID
  - Username-based invite links
- **RN Strategy:**
  - Share invite link
  - Deep linking

### 3.3 Channels

**Feature:** Create Channel
- **Location:** `client/src/components/channel/channel-create-dialog.tsx`, `backend/src/services/channel.service.ts`
- **Backend:** `POST /api/channel/create`
- **Details:**
  - Channel name
  - Optional channel username (@channelname)
  - Description
  - Public/private toggle
  - Icon upload
  - Creator is admin
  - Type: CHANNEL
- **RN Strategy:**
  - Channel creation screen
  - Form with validation

**Feature:** Subscribe to Channel
- **Location:** `client/src/components/channel/channel-subscribe-button.tsx`, `backend/src/services/channel.service.ts`
- **Backend:** `POST /api/channel/:channelId/subscribe`
- **Details:**
  - Join public channels
  - Join via invite link
  - Increment subscriberCount
- **RN Strategy:**
  - Subscribe button
  - Confirmation dialog

**Feature:** Unsubscribe from Channel
- **Location:** `backend/src/services/channel.service.ts`
- **Backend:** `POST /api/channel/:channelId/unsubscribe`
- **Details:**
  - Leave channel
  - Decrement subscriberCount
- **RN Strategy:**
  - Unsubscribe action
  - Confirmation

**Feature:** Channel Posts (Messages)
- **Location:** `client/src/components/channel/channel-posts-body.tsx`
- **Details:**
  - Only admins can post
  - Broadcast to all subscribers
  - View count tracking
  - Pinned posts first
- **RN Strategy:**
  - Channel feed screen
  - Post composer (admin only)

**Feature:** Channel Management
- **Location:** `client/src/components/channel/channel-management-panel.tsx`
- **Backend:** `PUT /api/channel/:channelId`
- **Details:**
  - Edit name, description, icon
  - Add/remove admins
  - Manage subscribers
  - Delete channel
- **RN Strategy:**
  - Channel settings screen
  - Admin management

**Feature:** Channel Subscribers
- **Location:** `client/src/components/channel/view-subscribers-dialog.tsx`
- **Backend:** `GET /api/channel/:channelId/info`
- **Details:**
  - List all subscribers
  - Subscriber count
  - Admin actions
- **RN Strategy:**
  - Subscribers list screen

**Feature:** Public Channels Discovery
- **Location:** `client/src/components/channel/channel-list.tsx`, `backend/src/services/channel.service.ts`
- **Backend:** `GET /api/channel/public`
- **Details:**
  - Paginated list
  - Search support
  - Shows subscriber count
- **RN Strategy:**
  - Channels discovery screen
  - Infinite scroll

**Feature:** Recommended Channels
- **Location:** `backend/src/services/channel.service.ts`
- **Backend:** `GET /api/channel/recommended`
- **Details:**
  - Featured channels
  - Popular channels
- **RN Strategy:**
  - Recommended section

**Feature:** Featured Channels
- **Location:** `backend/src/services/admin.service.ts`
- **Backend:** `POST /api/admin/channel/:channelId/feature`, `GET /api/admin/channels/featured`
- **Details:**
  - Admin can feature channels
  - Featured until date
  - Special promotion
- **RN Strategy:**
  - Featured badge
  - Promoted section

### 3.4 Communities

**Feature:** Create Community
- **Location:** `client/src/components/community/community-create-dialog.tsx`, `backend/src/services/community.service.ts`
- **Backend:** `POST /api/community/create`
- **Details:**
  - Community name
  - Optional username (@communityname)
  - Description
  - Icon
  - Public/private toggle
  - Creator is admin
- **RN Strategy:**
  - Community creation screen

**Feature:** Join Community
- **Location:** `backend/src/services/community.service.ts`
- **Backend:** `POST /api/community/:communityId/join`
- **Details:**
  - Join public communities
  - Auto-join all groups/channels in community
- **RN Strategy:**
  - Join button
  - Confirmation

**Feature:** Community Management
- **Location:** `client/src/components/community/community-edit-dialog.tsx`
- **Backend:** `PUT /api/community/:communityId`
- **Details:**
  - Edit name, description, icon
  - Add/remove members
  - Add/remove groups/channels
  - Delete community
- **RN Strategy:**
  - Community settings screen

**Feature:** Add Groups/Channels to Community
- **Location:** `client/src/components/community/add-group-dialog.tsx`, `backend/src/services/community.service.ts`
- **Backend:** `POST /api/community/:communityId/chat/add`
- **Details:**
  - Link existing groups/channels
  - Community owns groups/channels
- **RN Strategy:**
  - Group/channel picker
  - Link confirmation

**Feature:** Public Communities
- **Location:** `backend/src/services/community.service.ts`
- **Backend:** `GET /api/community/public`
- **Details:**
  - Paginated list
  - Search support
- **RN Strategy:**
  - Communities discovery screen

### 3.5 Chat Operations

**Feature:** Mark Chat as Read
- **Location:** `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/:id/mark-as-read`
- **Details:**
  - Remove user from unreadBy
  - Clear unread count
  - Supports ID or username lookup
- **RN Strategy:**
  - Auto-mark on view
  - Manual mark action

**Feature:** Update Chat
- **Location:** `backend/src/services/chat.service.ts`
- **Backend:** `PUT /api/chat/:id`
- **Details:**
  - Update name, icon, description
  - Admin/creator only
- **RN Strategy:**
  - Edit chat screen

**Feature:** Delete Chat
- **Location:** `client/src/components/chat/delete-chat-dialog.tsx`, `backend/src/services/chat.service.ts`
- **Backend:** `DELETE /api/chat/:id`
- **Details:**
  - Delete direct chat
  - Delete group (admin/creator)
  - Remove from all participants
- **RN Strategy:**
  - Delete confirmation
  - Navigate away

**Feature:** Add Member to Chat
- **Location:** `client/src/components/chat/add-member-dialog.tsx`, `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/:id/add-member`
- **Details:**
  - Add user to group
  - Admin/creator only
  - System message on add
- **RN Strategy:**
  - User picker
  - Add confirmation

**Feature:** Remove Member from Chat
- **Location:** `client/src/components/chat/member-action-dialog.tsx`, `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/:id/remove-member`
- **Details:**
  - Remove user from group
  - Admin/creator only
  - System message on remove
- **RN Strategy:**
  - Remove action in member list

**Feature:** Promote to Admin
- **Location:** `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/:id/promote-member`
- **Details:**
  - Promote group member to admin
  - Creator/admin only
- **RN Strategy:**
  - Promote action in member list

---

## 4. REAL-TIME FEATURES

### 4.1 Socket.IO Integration

**Feature:** Socket Connection
- **Location:** `client/src/hooks/use-socket.ts`, `backend/src/lib/socket.ts`
- **Details:**
  - JWT authentication via cookie
  - Auto-connect on login
  - Reconnection logic
  - Transport: polling, websocket
- **RN Strategy:**
  - Socket.IO client
  - Reconnection handling
  - Background connection management

**Feature:** Online Users Tracking
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `online:users` (array of user IDs)
- **Details:**
  - Track all online users
  - Broadcast on connect/disconnect
  - Map userId -> socketId
- **RN Strategy:**
  - Online status indicator
  - Presence UI

**Feature:** User Presence
- **Location:** `client/src/components/avatar-with-badge.tsx`
- **Details:**
  - Green dot for online
  - Last seen (if implemented)
- **RN Strategy:**
  - Badge component
  - Status indicator

### 4.2 Chat Room Events

**Feature:** Join Chat Room
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `chat:join` (chatId)
- **Details:**
  - Join room: `chat:${chatId}`
  - Validate participant
  - Receive messages for chat
- **RN Strategy:**
  - Join on screen focus
  - Leave on screen blur

**Feature:** Leave Chat Room
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `chat:leave` (chatId)
- **Details:**
  - Leave room
  - Stop receiving messages
- **RN Strategy:**
  - Leave on navigation away

**Feature:** New Message Event
- **Location:** `backend/src/lib/socket.ts`, `client/src/components/chat/chat-body.tsx`
- **Socket Event:** `message:new` (message object)
- **Details:**
  - Emitted to chat room
  - Excludes sender (unless specified)
  - Real-time message delivery
- **RN Strategy:**
  - Add message to list
  - Scroll to bottom
  - Notification (if not active)

**Feature:** Message Deleted Event
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `message:deleted` ({ chatId, messageId })
- **Details:**
  - Broadcast deletion
  - Remove from UI
- **RN Strategy:**
  - Remove from message list
  - Optimistic update

**Feature:** Chat Update Event
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `chat:update` ({ chatId, lastMessage })
- **Details:**
  - Update chat list
  - Update last message preview
  - Increment unread
- **RN Strategy:**
  - Update chat in list
  - Badge update

**Feature:** New Chat Event
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `chat:new` (chat object)
- **Details:**
  - New chat created
  - Add to chat list
- **RN Strategy:**
  - Add to chat list
  - Navigate to chat

### 4.3 Channel Events

**Feature:** Subscribe to Channel Room
- **Location:** `backend/src/lib/socket.ts`
- **Socket Event:** `channel:subscribe` (channelId)
- **Details:**
  - Join room: `channel:${channelId}`
  - Receive channel updates
- **RN Strategy:**
  - Subscribe on channel view

**Feature:** Channel Subscriber Events
- **Location:** `backend/src/lib/socket.ts`
- **Socket Events:** `subscriber:joined`, `subscriber:left`
- **Details:**
  - Real-time subscriber count
  - Update UI
- **RN Strategy:**
  - Update subscriber count
  - Show join/leave notifications

**Feature:** Channel Admin Events
- **Location:** `backend/src/lib/socket.ts`
- **Socket Events:** `admin:added`, `admin:removed`
- **Details:**
  - Admin list updates
  - Real-time changes
- **RN Strategy:**
  - Update admin list
  - Show notification

### 4.4 WebRTC (Video/Audio Calls)

**Feature:** WebRTC Signaling
- **Location:** `client/src/hooks/use-webrtc.ts`, `backend/src/lib/socket.ts`
- **Socket Events:** `webrtc:join`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice`
- **Details:**
  - Join WebRTC room
  - Exchange SDP offers/answers
  - ICE candidate exchange
  - Peer-to-peer connection
- **RN Strategy:**
  - React Native WebRTC library
  - Call screen
  - Video/audio toggle

**Feature:** Video/Audio Calls
- **Location:** `client/src/hooks/use-webrtc.ts`
- **Details:**
  - Start call
  - Local/remote streams
  - End call
- **RN Strategy:**
  - Call UI
  - Media permissions
  - Call controls

---

## 5. MEDIA & ATTACHMENTS

### 5.1 Image Handling

**Feature:** Image Upload
- **Location:** `client/src/components/file/image-upload-with-nsfw.tsx`
- **Details:**
  - File picker
  - Base64 conversion
  - NSFW detection before upload
  - Cloudinary upload
  - Progress tracking
- **RN Strategy:**
  - Expo ImagePicker
  - Image compression
  - Upload progress bar

**Feature:** Image Preview
- **Location:** `client/src/components/chat/image-viewer-dialog.tsx`
- **Details:**
  - Full-screen image viewer
  - Zoom/pan
  - Download option
- **RN Strategy:**
  - Image viewer modal
  - Pinch to zoom
  - Share functionality

### 5.2 Video Handling

**Feature:** Video Upload
- **Location:** `client/src/components/chat/chat-footer.tsx`
- **Details:**
  - Video picker
  - Base64 encoding (up to 200MB)
  - Thumbnail generation
  - Cloudinary upload
- **RN Strategy:**
  - Expo ImagePicker (video)
  - Video compression
  - Thumbnail generation
  - Upload progress

**Feature:** Video Playback
- **Location:** Message display
- **Details:**
  - Inline video player
  - Play/pause controls
  - Full-screen support
- **RN Strategy:**
  - React Native Video
  - Video player component

### 5.3 File Handling

**Feature:** File Upload
- **Location:** `backend/src/models/message.model.ts`
- **Details:**
  - File metadata: name, type, size, url
  - Cloudinary storage
  - Download support
- **RN Strategy:**
  - Expo DocumentPicker
  - File preview
  - Download handler
  - Share functionality

**Feature:** File Preview
- **Location:** `client/src/components/file/file-preview.tsx`
- **Details:**
  - Show file info
  - Download button
  - Share button
- **RN Strategy:**
  - File info card
  - Native share sheet

---

## 6. SEARCH & DISCOVERY

### 6.1 Global Search

**Feature:** Public Content Search
- **Location:** `backend/src/services/search.service.ts`, `backend/src/controllers/search.controller.ts`
- **Backend:** `GET /api/search?q=query&limit=10`
- **Details:**
  - Search users, channels, groups, communities
  - Public content only
  - Search by name, username, email, description
  - Case-insensitive regex
  - Limit results
- **RN Strategy:**
  - Search screen
  - Search input
  - Results by category
  - Infinite scroll

**Feature:** User Context Search
- **Location:** `backend/src/services/search.service.ts`
- **Backend:** `GET /api/search/my?q=query&limit=10`
- **Details:**
  - Includes user's private content
  - Private groups/channels user is member of
  - Shows membership status
- **RN Strategy:**
  - "My" search tab
  - Membership indicators

### 6.2 Chat Search

**Feature:** Search in Chat
- **Location:** (Implied from chat list search)
- **Details:**
  - Search chat names
  - Filter chat list
- **RN Strategy:**
  - Search bar in chat list
  - Filter results

---

## 7. INVITE SYSTEM

### 7.1 Invite Links

**Feature:** Resolve Invite
- **Location:** `backend/src/controllers/invite.controller.ts`
- **Backend:** `GET /api/invite/resolve/:username`
- **Details:**
  - Resolve username to chat/community
  - Returns type and ID
  - Supports ObjectId or username
- **RN Strategy:**
  - Deep link handler
  - Invite accept screen

**Feature:** Group Invite Links
- **Location:** `backend/src/services/chat.service.ts`
- **Backend:** `POST /api/chat/:id/join-by-invite`
- **Details:**
  - Join by username or ID
  - Respects `allowInviteLinkJoin` setting
  - System message on join
- **RN Strategy:**
  - Share invite link
  - Deep link to join
  - Accept invite screen

**Feature:** Channel Invite Links
- **Location:** `backend/src/services/channel.service.ts`
- **Backend:** `POST /api/channel/:channelId/join-by-invite`
- **Details:**
  - Join by username or ID
  - Respects `allowInviteLinkJoin` setting
  - System message on subscribe
- **RN Strategy:**
  - Share invite link
  - Deep link to join

**Feature:** Community Invite Links
- **Location:** `backend/src/services/community.service.ts`
- **Backend:** `POST /api/community/:communityId/join-by-invite`
- **Details:**
  - Join by username or ID
  - Public communities only
  - Auto-join all groups/channels
- **RN Strategy:**
  - Share invite link
  - Deep link to join

### 7.2 Invite Info

**Feature:** Get Chat Invite Info
- **Location:** `backend/src/services/chat.service.ts`
- **Backend:** `GET /api/chat/:id/invite-info` (public)
- **Details:**
  - Public info about chat
  - Name, type, member count
  - Join eligibility
- **RN Strategy:**
  - Invite preview screen

**Feature:** Get Channel Invite Info
- **Location:** `backend/src/services/channel.service.ts`
- **Backend:** `GET /api/channel/:channelId/invite-info` (public)
- **Details:**
  - Public channel info
  - Name, description, subscriber count
- **RN Strategy:**
  - Channel preview screen

**Feature:** Get Community Invite Info
- **Location:** `backend/src/services/community.service.ts`
- **Backend:** `GET /api/community/:communityId/invite-info` (public)
- **Details:**
  - Public community info
  - Name, description, member count
- **RN Strategy:**
  - Community preview screen

### 7.3 Invite Flow

**Feature:** Accept Invite (Logged Out)
- **Location:** `client/src/pages/accept-invite/index.tsx`
- **Details:**
  - Show invite info
  - Prompt login/signup
  - Auto-join after auth
  - Store pending invite
- **RN Strategy:**
  - Invite accept screen
  - Auth flow integration
  - Deep link handling

**Feature:** Pending Invite Processing
- **Location:** `client/src/hooks/use-auth.ts`
- **Details:**
  - Process after login
  - Join group/channel/community
  - Retry on failure
- **RN Strategy:**
  - Auto-process on login
  - Error handling

---

## 8. NOTIFICATIONS

### 8.1 In-App Notifications

**Feature:** Notification System
- **Location:** `client/src/hooks/use-settings.ts`, `client/src/components/notifications-panel.tsx`
- **Details:**
  - Notification store (Zustand)
  - Types: message, update, system
  - Read/unread status
  - Timestamp
- **RN Strategy:**
  - Notification state
  - Notification panel
  - Badge count

**Feature:** Notification Bell
- **Location:** `client/src/components/notification-bell.tsx`
- **Details:**
  - Unread count badge
  - Notification dropdown
  - Mark as read
  - Clear notifications
- **RN Strategy:**
  - Notification icon
  - Modal/drawer
  - Swipe to dismiss

**Feature:** Message Notifications
- **Location:** `client/src/components/app-wrapper.tsx`
- **Details:**
  - Triggered on `message:new` event
  - Shows chat name
  - Increments unread
  - Respects notification settings
- **RN Strategy:**
  - Push notifications (Expo Notifications)
  - In-app notifications
  - Badge updates

### 8.2 Push Notifications

**Feature:** Push Notification Setup
- **Location:** (To be implemented)
- **Details:**
  - Expo Notifications
  - Device token registration
  - Background notifications
- **RN Strategy:**
  - Expo Notifications API
  - Token management
  - Notification handlers

---

## 9. SETTINGS & PREFERENCES

### 9.1 User Settings

**Feature:** Language Selection
- **Location:** `client/src/hooks/use-settings.ts`
- **Details:**
  - Language preference
  - Stored in localStorage
  - Default: English
- **RN Strategy:**
  - AsyncStorage
  - i18n integration
  - Language picker

**Feature:** Auto-Download Settings
- **Location:** `client/src/hooks/use-settings.ts`
- **Details:**
  - Auto-download photos
  - Auto-download videos
  - Auto-download documents
  - Stored in localStorage
- **RN Strategy:**
  - Settings screen
  - Toggle switches
  - AsyncStorage

**Feature:** Notification Settings
- **Location:** `client/src/hooks/use-settings.ts`
- **Details:**
  - Enable/disable notifications
  - Stored in localStorage
- **RN Strategy:**
  - Settings toggle
  - Permission requests

### 9.2 Theme Support

**Feature:** Theme Provider
- **Location:** `client/src/components/theme-provider.tsx`, `client/src/components/theme-selector.tsx`
- **Details:**
  - Light/dark theme
  - next-themes integration
  - System preference
- **RN Strategy:**
  - React Native Appearance
  - Theme context
  - Theme toggle

---

## 10. OFFLINE SUPPORT

### 10.1 Offline Queue

**Feature:** Offline Message Queue
- **Location:** `client/src/hooks/use-offline-queue.ts`
- **Details:**
  - Queue messages when offline
  - Retry on reconnect
  - Track pending/failed messages
  - Service worker sync (web)
- **RN Strategy:**
  - AsyncStorage queue
  - Network state listener
  - Retry mechanism
  - Background sync (if available)

**Feature:** Online/Offline Detection
- **Location:** `client/src/hooks/use-offline-queue.ts`
- **Details:**
  - Listen to online/offline events
  - Show status to user
  - Auto-sync on reconnect
- **RN Strategy:**
  - NetInfo API
  - Connection status indicator
  - Auto-retry

---

## 11. CONTENT MODERATION

### 11.1 NSFW Detection

**Feature:** Client-Side NSFW Detection
- **Location:** `client/src/hooks/use-nsfw-detection.ts`
- **Details:**
  - NSFWJS model (TensorFlow.js)
  - Check images before upload
  - Block inappropriate content
  - Show error message
- **RN Strategy:**
  - TensorFlow Lite (if available)
  - Or server-side only
  - Image validation

**Feature:** Server-Side NSFW Detection
- **Location:** `backend/src/middlewares/nsfw.middleware.ts`, `backend/src/services/nsfw.service.ts`
- **Details:**
  - TensorFlow.js Node
  - Validate image content
  - Block if inappropriate
  - Return error with blocked flag
- **RN Strategy:**
  - API validation
  - Error handling
  - User feedback

### 11.2 Reporting System

**Feature:** Create Report
- **Location:** `client/src/components/chat/chat-body-message.tsx`, `backend/src/controllers/admin.controller.ts`
- **Backend:** `POST /api/admin/report`
- **Details:**
  - Report users, messages, chats
  - Reason categories
  - Description
  - Status: PENDING
- **RN Strategy:**
  - Report dialog
  - Category selection
  - Submit report

**Feature:** View User Reports
- **Location:** `client/src/pages/settings/reports.tsx`, `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/report/my`
- **Details:**
  - List user's reports
  - Show status
  - Resolution details
- **RN Strategy:**
  - Reports screen
  - Report list
  - Status badges

**Feature:** Report Socket Events
- **Location:** `client/src/hooks/use-report-socket.ts`, `backend/src/lib/socket.ts`
- **Socket Events:** `report:created`, `report:status-changed`
- **Details:**
  - Real-time report updates
  - Admin notifications
- **RN Strategy:**
  - Socket listeners
  - Update report status

---

## 12. ADMIN & MODERATION FEATURES

### 12.1 Admin Authentication

**Feature:** Admin Login
- **Location:** `backend/src/controllers/auth.controller.ts`
- **Details:**
  - Admin email check
  - IP whitelist (optional)
  - Audit logging
  - Admin secret key (for external apps)
- **RN Strategy:**
  - Admin login screen
  - Secure admin access

**Feature:** Admin Middleware
- **Location:** `backend/src/middlewares/admin.middleware.ts`
- **Details:**
  - Role checks: isAdmin, isModerator
  - Suspension check
  - IP whitelist
- **RN Strategy:**
  - Protected admin routes
  - Role-based UI

### 12.2 User Management (Admin)

**Feature:** Get All Users
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/users` (admin only)
- **Details:**
  - List all users
  - Pagination
  - Filter/search
- **RN Strategy:**
  - Admin users screen
  - User list
  - Search/filter

**Feature:** Suspend User
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `POST /api/admin/users/:userId/suspend` (admin only)
- **Details:**
  - Set suspension flag
  - Suspension reason
  - Suspension until date
  - Audit log
- **RN Strategy:**
  - Suspend action
  - Suspension dialog
  - Date picker

**Feature:** Unsuspend User
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `POST /api/admin/users/:userId/unsuspend` (admin only)
- **Details:**
  - Remove suspension
  - Audit log
- **RN Strategy:**
  - Unsuspend action
  - Confirmation

**Feature:** Delete User
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `DELETE /api/admin/users/:userId` (admin only)
- **Details:**
  - Permanently delete user
  - Audit log
- **RN Strategy:**
  - Delete action
  - Confirmation dialog

### 12.3 Report Management (Moderator/Admin)

**Feature:** Get All Reports
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/reports` (moderator+)
- **Details:**
  - List all reports
  - Filter by status
  - Pagination
  - Include report details
- **RN Strategy:**
  - Reports management screen
  - Filter tabs
  - Report details view

**Feature:** Resolve Report
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `POST /api/admin/reports/:reportId/resolve` (moderator+)
- **Details:**
  - Set status: RESOLVED
  - Resolution notes
  - Audit log
  - Socket notification
- **RN Strategy:**
  - Resolve action
  - Resolution dialog
  - Status update

**Feature:** Dismiss Report
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `POST /api/admin/reports/:reportId/dismiss` (moderator+)
- **Details:**
  - Set status: DISMISSED
  - Dismissal reason
  - Audit log
  - Socket notification
- **RN Strategy:**
  - Dismiss action
  - Dismissal dialog

### 12.4 Analytics & Dashboard

**Feature:** Dashboard Stats
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/stats` (admin only)
- **Details:**
  - User count
  - Chat count
  - Message count
  - Active users
- **RN Strategy:**
  - Admin dashboard
  - Stats cards
  - Charts (if needed)

**Feature:** Chat Analytics
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/analytics` (moderator+)
- **Details:**
  - Chat statistics
  - Activity metrics
- **RN Strategy:**
  - Analytics screen
  - Metrics display

### 12.5 Audit Logging

**Feature:** Audit Logs
- **Location:** `backend/src/models/auditLog.model.ts`, `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/audit-logs` (admin only)
- **Details:**
  - Log all admin actions
  - User, action, resource, IP, user agent
  - Status: SUCCESS/FAILURE
  - Auto-delete after 90 days
- **RN Strategy:**
  - Audit log screen
  - Filter/search
  - Export (if needed)

### 12.6 Channel Management (Admin)

**Feature:** Feature Channel
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `POST /api/admin/channel/:channelId/feature` (admin secret)
- **Details:**
  - Mark channel as featured
  - Set featured until date
  - Special promotion
- **RN Strategy:**
  - Feature action
  - Date picker

**Feature:** Unfeature Channel
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `DELETE /api/admin/channel/:channelId/feature` (admin secret)
- **Details:**
  - Remove featured status
- **RN Strategy:**
  - Unfeature action

**Feature:** Get Featured Channels
- **Location:** `backend/src/controllers/admin.controller.ts`
- **Backend:** `GET /api/admin/channels/featured` (public)
- **Details:**
  - List featured channels
  - Public endpoint
- **RN Strategy:**
  - Featured section
  - Promoted channels

### 12.7 Admin Socket Room

**Feature:** Admin Reports Room
- **Location:** `backend/src/lib/socket.ts`, `client/src/hooks/use-report-socket.ts`
- **Socket Events:** `admin:join-reports-room`, `admin:leave-reports-room`
- **Details:**
  - Join admin reports room
  - Receive real-time report notifications
- **RN Strategy:**
  - Join on reports screen
  - Leave on navigation away

---

## 📊 FEATURE SUMMARY STATISTICS

- **Total Features Documented:** 100+
- **Authentication Features:** 6
- **Messaging Features:** 15+
- **Chat Management Features:** 25+
- **Real-time Features:** 12+
- **Media Features:** 8+
- **Search Features:** 3
- **Invite Features:** 8+
- **Notification Features:** 4+
- **Settings Features:** 5+
- **Offline Features:** 2
- **Moderation Features:** 4+
- **Admin Features:** 15+

---

## 🔄 MIGRATION PRIORITY

### Phase 1 (Core)
1. Authentication (login, signup, logout)
2. Socket connection & basic events
3. Direct messaging (send, receive)
4. Chat list
5. Basic UI components

### Phase 2 (Essential)
6. Group chats
7. Media upload (images)
8. Message actions (reply, edit, delete)
9. Search
10. Notifications

### Phase 3 (Advanced)
11. Channels
12. Communities
13. Video/audio calls (WebRTC)
14. File attachments
15. Offline queue

### Phase 4 (Polish)
16. Advanced search
17. Invite system
18. Settings
19. Theme support
20. Content moderation

### Phase 5 (Admin)
21. Admin authentication
22. User management
23. Report management
24. Analytics
25. Audit logs

---

## 📝 NOTES

- **Backend API:** All endpoints use `/api` prefix
- **Authentication:** JWT in HTTP-only cookies
- **Socket Path:** `/socket.io/`
- **File Storage:** Cloudinary
- **Database:** MongoDB (Mongoose)
- **Rate Limiting:** Express Rate Limit
- **NSFW Detection:** TensorFlow.js (client & server)
- **Session:** Express Session with MongoDB store

---

**END OF FEATURE INVENTORY**

