const router = require("express").Router();
const User = require("../models/User"); // ✅ VERY IMPORTANT

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

module.exports = router;