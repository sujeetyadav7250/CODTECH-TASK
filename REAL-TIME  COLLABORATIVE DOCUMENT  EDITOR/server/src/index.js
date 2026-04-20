require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Document = require("./models/Document");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // Reflect / allow dev URLs (localhost vs 127.0.0.1 both work)
    origin: true,
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collaborative-editor";

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "collaborative-editor-api" });
});

/** @type {Map<string, Map<string, string>>} roomId -> socketId -> username */
const roomMembers = new Map();

function broadcastRoomMembers(ioInstance, roomId, alsoEmitToSocket) {
  const users = roomMembers.get(roomId);
  if (!users) return;
  const list = Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  ioInstance.to(roomId).emit("room-members", list);
  if (alsoEmitToSocket) {
    alsoEmitToSocket.emit("room-members", list);
  }
}

async function getOrCreateDocument(roomId) {
  if (!roomId) {
    return null;
  }

  let doc = await Document.findOne({ roomId });
  if (!doc) {
    doc = await Document.create({ roomId, content: "" });
  }
  return doc;
}

io.on("connection", (socket) => {
  socket.on("join-document", async (payload) => {
    const roomId =
      typeof payload === "string" ? payload : payload?.roomId?.trim?.();
    const usernameRaw =
      typeof payload === "object" && payload !== null
        ? payload.username
        : undefined;
    const username =
      String(usernameRaw || "Anonymous")
        .trim()
        .slice(0, 40) || "Anonymous";

    if (!roomId) {
      return;
    }

    socket.join(roomId);
    if (!roomMembers.has(roomId)) {
      roomMembers.set(roomId, new Map());
    }
    roomMembers.get(roomId).set(socket.id, username);

    let content = "";
    try {
      const doc = await getOrCreateDocument(roomId);
      content = doc.content || "";
    } catch (e) {
      console.error("getOrCreateDocument", e);
    }
    socket.emit("load-document", content);
    broadcastRoomMembers(io, roomId, socket);
  });

  socket.on("send-changes", ({ roomId, content }) => {
    if (!roomId) {
      return;
    }

    socket.to(roomId).emit("receive-changes", content);
  });

  socket.on("save-document", async ({ roomId, content }) => {
    if (!roomId) {
      return;
    }

    const updated = await Document.findOneAndUpdate(
      { roomId },
      { content },
      { new: true, upsert: true }
    );

    socket.emit("document-saved", updated.updatedAt);
  });

  socket.on("disconnect", () => {
    for (const [roomId, users] of roomMembers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) {
          roomMembers.delete(roomId);
        } else {
          broadcastRoomMembers(io, roomId, null);
        }
        break;
      }
    }
  });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

start();
