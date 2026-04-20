# Real-Time Collaborative Document Editor

# Internship Details
Company: CODTECH IT SOLUTIONS PVT. LTD.
Name: Sujeet Kumar Yadav
Intern ID: CTS1663
Domain: Full Stack Web Development
Duration: 30 December 2025 – 21 April 2026
Mentor: Neela Santhosh Kumar



## Project Description

The Real-Time Collaborative Document Editor is a full-stack web application designed to enable multiple users to edit a shared document simultaneously with instant synchronization. The project focuses on delivering a seamless and interactive collaboration experience similar to modern tools like Google Docs.

This application is built using React (with Vite) for a fast and responsive frontend, while the backend is powered by Node.js and Express to handle API requests and server-side logic. For real-time communication, Socket.IO is implemented, allowing all connected users to receive live updates whenever any changes are made to the document.

The system uses a room-based architecture, where each document is associated with a unique ID. Users can join the same document by sharing this ID, enabling collaborative editing in a controlled environment. Every keystroke or change is instantly broadcast to all connected users, ensuring consistency across all sessions.

To ensure data persistence, the application integrates MongoDB with Mongoose, where document content is automatically saved at regular intervals (every 2 seconds). This prevents data loss and allows users to resume their work even after refreshing or rejoining the session.

Additionally, the editor includes a download feature, allowing users to save the document locally as a .txt file. The interface is designed to be simple, responsive, and user-friendly, making it easy for users to collaborate efficiently.

Overall, this project demonstrates the practical implementation of real-time web technologies, event-driven architecture, and full-stack development principles to build a scalable and efficient collaborative platform.




Tech stack:
- Frontend: React (JSX) + Vite + Socket.IO Client
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB + Mongoose

## Setup

### 1) Backend

```bash
cd server
npm install
.env
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
.env
npm run dev
```

## Usage

1. Open the app at `http://localhost:5173`.
2. Share the same Document ID with another user/tab.
3. Both users can type and see real-time changes.
4. The document autosaves to MongoDB every 2 seconds.

## OUTPUT OF THE TASK

<img width="1919" height="932" alt="image" src="https://github.com/user-attachments/assets/520cdf09-3221-40a8-bb40-09088cfacf36" />


<img width="1894" height="1006" alt="image" src="https://github.com/user-attachments/assets/ab11feed-85f1-475c-a225-c1352bf4e737" />

