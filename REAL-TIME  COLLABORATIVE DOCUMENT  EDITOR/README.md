# Real-Time Collaborative Document Editor

Tech stack:
- Frontend: React (JSX) + Vite + Socket.IO Client
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB + Mongoose

## Setup

### 1) Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

## Usage

1. Open the app at `http://localhost:5173`.
2. Share the same Document ID with another user/tab.
3. Both users can type and see real-time changes.
4. The document autosaves to MongoDB every 2 seconds.