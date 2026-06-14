const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Manager = require('../models/Manager');

const JWT_SECRET = process.env.JWT_SECRET || 'samanlive_secret_key_2026_change_this';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access denied. No token provided.'
        });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({
                    success: false,
                    error: 'Token expired. Please login again.'
                });
            }
            return res.status(403).json({
                success: false,
                error: 'Invalid token'
            });
        }

        try {
            // Token me type check karo - admin, manager, ya user
            const userType = decoded.type || 'user';

            if (userType === 'manager') {
                const manager = await Manager.findById(decoded.id).select('-password');
                if (!manager ||!manager.status) {
                    return res.status(403).json({
                        success: false,
                        error: 'Manager account deactivated or not found'
                    });
                }
                req.manager = manager;
                req.userId = manager._id;
                req.userType = 'manager';
            } else {
                const user = await User.findById(decoded.id || decoded.userId).select('-password');
                if (!user) {
                    return res.status(403).json({
                        success: false,
                        error: 'User not found'
                    });
                }
                req.user = user;
                req.userId = user._id;
                req.userType = 'user';
            }

            req.tokenData = decoded;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    });
}

// Optional: Admin only middleware
const requireAdmin = (req, res, next) => {
    if (req.userType!== 'admin' && req.user?.role!== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};

// Optional: Manager only middleware
const requireManager = (req, res, next) => {
    if (req.userType!== 'manager') {
        return res.status(403).json({
            success: false,
            error: 'Manager access required'
        });
    }
    next();
};

module.exports = authenticateToken;
module.exports.requireAdmin = requireAdmin;
module.exports.requireManager = requireManager;