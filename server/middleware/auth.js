const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // isme user._id hoga
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Invalid token' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role!== 'admin') return res.status(403).json({ msg: 'Admin only' });
    next();
};