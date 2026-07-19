const jwt = require('jsonwebtoken');
const User = require('../../models/common/User');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token missing hai bhai' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if(!req.user){
            return res.status(401).json({ success: false, message: 'User nahi mila' });
        }
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token invalid hai' });
    }
}

// Shop owner check - sirf apni hi shop edit kar paye
const isShopOwner = (req, res, next) => {
    // req.user.id aur req.params.shopId match karna hai
    // ya fir DB me check karna hai ki ye user is shop ka owner hai
    if(req.user.role!== 'shop' && req.user.role!== 'admin'){
        return res.status(403).json({ success: false, message: 'Permission nahi hai' });
    }
    next();
}

module.exports = { authenticateToken, isShopOwner };