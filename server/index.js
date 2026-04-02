const path = require("path");

// 🔐 Load env
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");

const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 📡 Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// ❗ Error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection", reason);
});

// 🧠 Mongo URI
const MONGO_URI =
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/chatApp";

// 🔌 Mongo connection
async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection failed ❌", err);
    process.exit(1);
  }
}

// 🚀 Start Server
async function startServer() {
  await connectMongo();

  const server = http.createServer(app);

  // ✅ FIX: DEFINE io HERE
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // 🧠 In-memory storage
  const users = {};
  const onlineUsers = {};
  const lastSeenMap = {};

  // 🔥 SOCKET LOGIC
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🟢 JOIN
    socket.on("join", (userId) => {
      users[userId] = socket.id;
      onlineUsers[userId] = socket.id;

      io.emit("onlineUsers", Object.keys(onlineUsers));
    });

    // 💬 SEND MESSAGE
    socket.on("sendMessage", (data) => {
      const receiverSocket = users[data.receiverId];

      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", data);

        // ✔ delivered
        io.to(socket.id).emit("messageStatus", {
          ...data,
          status: "delivered",
        });
      } else {
        // ✔ sent
        io.to(socket.id).emit("messageStatus", {
          ...data,
          status: "sent",
        });
      }
    });

    // ✍️ TYPING
    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocket = users[receiverId];

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", { senderId });
      }
    });

    // 👀 SEEN
    socket.on("seen", ({ senderId }) => {
      const senderSocket = users[senderId];

      if (senderSocket) {
        io.to(senderSocket).emit("messageSeen");
      }
    });

    // ❌ DISCONNECT
    socket.on("disconnect", () => {
      let disconnectedUser = null;

      for (const user in users) {
        if (users[user] === socket.id) {
          disconnectedUser = user;
          delete users[user];
        }
      }

      for (const user in onlineUsers) {
        if (onlineUsers[user] === socket.id) {
          delete onlineUsers[user];

          // 🕒 last seen
          lastSeenMap[user] = new Date();

          io.emit("lastSeen", {
            userId: user,
            lastSeen: lastSeenMap[user],
          });
        }
      }

      io.emit("onlineUsers", Object.keys(onlineUsers));
    });
  });

  // 🚀 Start server
  server.listen(PORT, () => {
    console.log(`Server running with socket 🚀 on port ${PORT}`);
  });
}

// ▶ Start
startServer();