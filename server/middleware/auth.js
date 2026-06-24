const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // JWT me sirf userId aur phone hai, full user nahi
        // DB se user nikal ke req.user me daal do
        const user = await User.findById(decoded.userId).select('-password -otp');

        if(!user) {
            return res.status(401).json({ success: false, msg: 'User not found' });
        }

        if(user.status!== 'active') {
            return res.status(403).json({ success: false, msg: 'Account blocked' });
        }

        req.user = user; // Ab full user object milega routes me
        next();
    } catch (err) {
        console.error('Token Verify Error:', err.message);
        res.status(401).json({ success: false, msg: 'Invalid token' });
    }
};

exports.isAdmin = (req, res, next) => {
    // Abhi User schema me role nahi hai, to phone se check kar lete hain
    // Baad me schema me role field add kar dena

    const adminPhones = ['9999999999', '8888888888']; // Apne admin ke number daal de

    if (!adminPhones.includes(req.user.phone)) {
        return res.status(403).json({ success: false, msg: 'Admin only' });
    }
    next();
};