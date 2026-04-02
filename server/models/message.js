const mongoose = require("mongoose");

// Message structure (what each message looks like)
const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  text: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);