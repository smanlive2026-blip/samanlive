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
            const userType = decoded.type || 'user';

            if (userType === 'manager') {
                const manager = await Manager.findById(decoded.id || decoded.userId).select('-password');
                if (!manager ||!manager.status) {
                    return res.status(403).json({
                        success: false,
                        error: 'Manager account deactivated or not found'
                    });
                }
                req.manager = manager;
                req.userId = manager._id;
                req.userType = 'manager';
                req.user = manager; // ✅ Full object rakho
                // Extra fields
                req.user.role = 'area_manager';
                req.user.managerCode = manager.managerCode || manager.areaCode + '-DEFAULT';
            } else {
                const user = await User.findById(decoded.id || decoded.userId).select('-password');
                if (!user) {
                    return res.status(403).json({
                        success: false,
                        error: 'User not found'
                    });
                }
                req.user = user; // ✅ FIX: Full user object rakho, overwrite mat karo
                req.userId = user._id;
                req.userType = user.role === 'admin'? 'admin' : 'user';
            }

            req.tokenData = decoded;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    });
}

// Admin only middleware
const requireAdmin = (req, res, next) => {
    if (req.userType!== 'admin' && req.user?.role!== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};

// Manager only middleware
const requireManager = (req, res, next) => {
    if (req.userType!== 'manager') {
        return res.status(403).json({
            success: false,
            error: 'Manager access required'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireManager
};