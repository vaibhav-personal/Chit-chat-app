const router = require("express").Router();
const mongoose = require("mongoose");
const Message = require("../models/message");

let fallbackMessages = [];

// 🟢 1. SAVE MESSAGE
router.post("/", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    // DB not connected; store in-memory as fallback
    const msg = { ...req.body, _id: Date.now().toString(), createdAt: new Date() };
    fallbackMessages.push(msg);
    return res.json(msg);
  }

  try {
    const newMessage = new Message(req.body);
    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});


// 🟢 2. GET CHAT HISTORY
router.get("/:user1/:user2", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const messages = fallbackMessages.filter(
      (msg) =>
        (msg.senderId === req.params.user1 && msg.receiverId === req.params.user2) ||
        (msg.senderId === req.params.user2 && msg.receiverId === req.params.user1)
    );
    return res.json(messages);
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.params.user1, receiverId: req.params.user2 },
        { senderId: req.params.user2, receiverId: req.params.user1 },
      ],
    }).sort({ createdAt: 1 }); // oldest first

    res.json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;