# Interactive Chat Application

Full-stack chat app with:

- `frontend`: React (`.jsx`) + Tailwind CSS + Socket.IO client
- `backend`: Node.js + Express + Socket.IO + MongoDB + JWT auth

## Features

- Signup and login
- Real-time private chat with any member
- Online status indicator
- Persistent users/messages in MongoDB
- Responsive interactive UI

## Backend setup

```bash
cd backend
npm install
copy .env.example .env
npm start
```

Backend runs on `http://localhost:4000`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## MongoDB

Use local MongoDB by default:

`mongodb://127.0.0.1:27017/chat_app`

Or set your own `MONGO_URI` in `backend/.env`.
