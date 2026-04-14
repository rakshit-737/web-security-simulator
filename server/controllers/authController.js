const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }

  const sanitizedUsername = username.trim().slice(0, 64);

  try {
    const user = await User.findOne({ username: sanitizedUsername });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error during login' });
  }
}

function getMe(req, res) {
  return res.json({
    id:       req.user._id,
    username: req.user.username,
    email:    req.user.email,
    role:     req.user.role,
  });
}

module.exports = { login, getMe };
