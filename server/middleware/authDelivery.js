// LOCATION: server/middleware/authDelivery.js
// YE MIDDLEWARE SIRF DELIVERY MANAGER / AREA MANAGER KE TOKEN KE LIYE HAI

const jwt = require('jsonwebtoken');
const Manager = require('../models/Manager');

const authDelivery = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // DB se manager nikal
    const manager = await Manager.findById(decoded.id);
    if(!manager || !manager.status) {
        return res.status(401).json({ success: false, message: 'Manager not found' });
    }

    req.manager = manager; // isse req.manager.id, req.manager.role, req.manager.areaCode sab mil jayega
    next();
  } catch (err) {
    console.log("DELIVERY AUTH ERROR:", err.message);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

module.exports = { authDelivery };