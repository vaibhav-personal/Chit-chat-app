const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");


// 🔐 REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, profilePic } = req.body;

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists ❌" });
    }

    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      profilePic
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully ✅",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed ❌" });
  }
});


// 🔐 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    // 🔒 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password ❌" });
    }

    res.status(200).json({
      message: "Login successful ✅",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed ❌" });
  }
});

module.exports = router;