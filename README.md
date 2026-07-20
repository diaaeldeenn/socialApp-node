# Social Media App — REST API

A production-ready social media backend built with **Node.js**, **TypeScript**, and **Express 5**, covering everything from authentication to real-time chat.

**Live API:** `https://social-app-backend-coral.vercel.app`
**API Docs:** [Postman Documentation](https://documenter.getpostman.com/view/49715513/2sBY4PPgB9)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Cache / Session | Redis |
| File Storage | AWS S3 |
| Auth | JWT (Access + Refresh tokens) + Google OAuth2 |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Real-time | Socket.io (see note below) |
| Email | Nodemailer + Gmail SMTP |
| Validation | Zod v4 |
| Security | Helmet, CORS, express-rate-limit, bcrypt, AES-256 encryption |

---

## Architecture

```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── posts/
│   ├── comments/
│   ├── friendRequest/
│   ├── chat/
│   └── realtime/
├── DB/
│   ├── models/
│   └── repository/          # Repository Pattern (BaseRepository<T>)
├── common/
│   ├── middleware/
│   ├── service/              # Redis, S3, Notification services
│   ├── utils/
│   └── enum/
└── config/
```

The project follows a clean **Repository Pattern** with a generic `BaseRepository<T>` that abstracts all Mongoose operations (find, create, update, delete, pagination, aggregate), keeping services completely decoupled from the database layer.

---

## Features

### Authentication
- Local signup with email + OTP email confirmation
- Google OAuth2 (Sign in with Google via `idToken`)
- JWT access tokens (1h) + refresh tokens (1y) with `jwtid` linking
- OTP rate limiting via Redis: max 3 attempts per 5 minutes, 5-minute block after exceeding
- Full forget password flow: send OTP → verify OTP → reset password
- Passwords hashed with bcrypt (12 rounds)
- Phone numbers encrypted at rest with AES-256-CBC

### Posts
- Create posts with text and/or multiple media attachments (uploaded to S3)
- Post privacy: `public`, `private`, `onlyMe`
- Control comments: `allow` / `disAllow`
- Tag users in posts (validates ObjectIds, sends FCM notification to tagged users)
- Paginated feed with privacy-aware filtering (friends + public + tagged)
- Content search with regex
- React system: `like`, `love`, `haha`, `care`, `sad`, `angry` — toggle behavior (same react = remove)
- On delete: cascades to all comments, replies, reactions, and S3 files

### Comments & Replies
- Infinite nested replies (comment on a comment)
- Attach media files to comments
- Tag users in comments with push notifications
- React on comments with the same toggle system
- On delete: recursive subtree deletion (all replies, their files, their reactions)

### Friend System
- Send / cancel friend requests
- Accept / reject received requests
- Remove existing friends
- Friendship used to filter post visibility (private posts visible to friends)
- Push notification sent on request send and on accept

### Real-time Chat (Socket.io)
> **Note:** The real-time feature is fully implemented on a separate branch (`socket`) and is not deployed on Vercel since Vercel's serverless architecture does not support persistent WebSocket connections. The branch is available on GitHub and can be run locally or deployed on a Node-compatible server (Railway, Render, EC2, etc.).

- JWT authentication at the Socket.io handshake level
- User socket IDs stored in Redis Sets (supports multiple devices per user)
- One-to-one chat with message persistence in MongoDB
- Events: `sendMessage` → emits `successMessage` to sender and `newMessage` to recipient
- Socket cleanup on disconnect via Redis

### File Storage (AWS S3)
- Direct upload via pre-signed URLs (client uploads straight to S3)
- Stream files back through the API
- Pre-signed GET URLs for private files (60s expiry)
- List, delete single file, delete multiple files, delete entire folder
- Multipart upload support for large files

### Push Notifications (FCM)
- FCM tokens stored per user in Redis Sets (multi-device support)
- Notifications sent on: login from new device, new friend request, accepted request, tag in post/comment, react on post/comment

---

## API Overview

| Module | Endpoints |
|---|---|
| Auth | 9 endpoints — signup, Gmail, OTP, signin, refresh, forget/reset password |
| User | 3 endpoints — profile, update profile, update password |
| Posts | 5 endpoints — CRUD + react |
| Comments | 6 endpoints — create comment/reply, get, react, update, delete |
| Friends | 6 endpoints — send, accept/reject, received, sent, remove, cancel |
| S3 | 7 endpoints — upload, stream, pre-signed, list, delete |

Full documentation with request/response examples: [Postman Docs](https://documenter.getpostman.com/view/49715513/2sBY4PPgB9)

---

## Environment Variables

```env
PORT=3000
MONGO_LOCAL=mongodb://...
JWT_TOKEN=your_jwt_secret
JWT_REFRESH_TOKEN=your_refresh_secret
GMAIL_USER=your@gmail.com
GMAIL_PASS=your_app_password
AWS_REGION=us-east-1
AWS_ACCESS_KEY=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...
Client_ID=google_oauth_client_id
Redis_URL=redis://...
```

---

## Running Locally

```bash
git clone https://github.com/diaaeldeenn/socialApp-node
cd socialApp-node
npm install
# add your .env file
npm run dev
```

For the Socket.io version:

```bash
git checkout socket
npm run dev
```

---

## Security Highlights

- Rate limiting: 200 requests per 15 minutes per IP
- Helmet for HTTP security headers
- CORS enabled
- Passwords: bcrypt with 12 salt rounds
- Phone numbers: AES-256-CBC encrypted in DB
- JWT with `jwtid` (uuid) to link access and refresh tokens
- OTP brute-force protection via Redis counters and TTL-based blocking

---

## 👤 Developer

**Eng. Diaa Eldeen**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/diaaelseady)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/diaaeldeenn)
