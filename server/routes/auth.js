const express = require("express");
const User = require("../models/User");
const { comparePassword, createToken, hashPassword, requireAuth } = require("../middleware/auth");

const router = express.Router();

const respondWithSession = (res, user, status = 200) => {
  res.status(status).json({
    token: createToken(user._id.toString()),
    user: { id: user._id, email: user.email },
  });
};

router.post("/register", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    const user = await User.create({ email, passwordHash: await hashPassword(password) });
    respondWithSession(res, user, 201);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    res.status(500).json({ message: "Could not create your account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    respondWithSession(res, user);
  } catch (_err) {
    res.status(500).json({ message: "Could not sign in right now." });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email } });
});

module.exports = router;