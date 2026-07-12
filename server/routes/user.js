const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.put('/update', auth, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {new: true});
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;