const mongoose = require("mongoose");

// This defines what a user looks like
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePic: {
  type: String,
  default: "https://via.placeholder.com/40"
  }
});

module.exports = mongoose.model("User", UserSchema);

