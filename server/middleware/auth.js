const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access denied. No token provided.' 
        });
    }

    // Area manager aur admin dono ke liye same secret use kar
    const JWT_SECRET = process.env.JWT_SECRET || 'samanlive-area-manager-secret-2026';

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        
        // Area manager me 'id' sign karte hain, admin me 'userId' ho sakta hai
        // Dono support karne ke liye ye check
        req.userId = user.id || user.userId;
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;