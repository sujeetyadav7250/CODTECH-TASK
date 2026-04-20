require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chat_app";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    message: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

const onlineUsers = new Map();

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing." });
  }

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

app.post("/api/auth/signup", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: "Username must be 3+ chars and password 6+ chars." });
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return res.status(409).json({ error: "Username already exists." });
  }

  const user = await User.create({
    username,
    passwordHash: await bcrypt.hash(password, 10),
  });

  return res.status(201).json({
    token: createToken(user),
    user: { id: user._id.toString(), username: user.username },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  return res.json({
    token: createToken(user),
    user: { id: user._id.toString(), username: user.username },
  });
});

app.get("/api/users", authMiddleware, async (req, res) => {
  const users = await User.find({}, { username: 1 }).sort({ username: 1 });
  const members = users.map((user) => ({
    id: user._id.toString(),
    username: user.username,
    online: onlineUsers.has(user.username),
  }));
  res.json({ members });
});

app.get("/api/messages/:username", authMiddleware, async (req, res) => {
  const me = req.user.username;
  const other = String(req.params.username || "").trim().toLowerCase();

  const messages = await Message.find({
    $or: [
      { from: me, to: other },
      { from: other, to: me },
    ],
  }).sort({ createdAt: 1 });

  res.json({
    messages: messages.map((item) => ({
      from: item.from,
      to: item.to,
      message: item.message,
      timestamp: item.createdAt,
    })),
  });
});

const io = new Server(server, { cors: { origin: FRONTEND_URL } });

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Token required."));
    }
    socket.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return next(new Error("Unauthorized socket."));
  }
});

function broadcastOnlineUsers() {
  io.emit("online-users", Array.from(onlineUsers.keys()));
}

io.on("connection", (socket) => {
  const username = socket.user.username;
  onlineUsers.set(username, socket.id);
  broadcastOnlineUsers();

  socket.on("private-message", async ({ to, message }) => {
    const target = String(to || "").trim().toLowerCase();
    const text = String(message || "").trim();

    if (!target || !text || target === username) {
      return;
    }

    const targetUser = await User.findOne({ username: target });
    if (!targetUser) {
      return;
    }

    const saved = await Message.create({ from: username, to: target, message: text.slice(0, 500) });
    const payload = {
      from: username,
      to: target,
      message: saved.message,
      timestamp: saved.createdAt,
    };

    const targetSocketId = onlineUsers.get(target);
    if (targetSocketId) {
      io.to(targetSocketId).emit("private-message", payload);
    }
    socket.emit("private-message", payload);
  });

  socket.on("disconnect", () => {
    if (onlineUsers.get(username) === socket.id) {
      onlineUsers.delete(username);
      broadcastOnlineUsers();
    }
  });
});

async function start() {
  await mongoose.connect(MONGO_URI);
  server.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
