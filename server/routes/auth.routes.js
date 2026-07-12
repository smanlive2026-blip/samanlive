const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/auth/signup', async (req,res)=>{
    try {
        const {name, phone, email} = req.body;
        if(!name || !phone) return res.status(400).json({msg: 'Name and Phone required'});
        
        let user = await User.findOne({phone});
        if(user) return res.json({success:true, user}); // pehle se hai to wahi de do

        user = await User.create({
            name, phone, email: email || '',
            role: 'user', 
            isBlocked: false,
            orderCount: 0,
            walletBalance: 0,
            createdAt: new Date()
        });
        
        res.json({success:true, user});
    } catch (err) {
        res.status(500).json({msg: 'Server Error'});
    }
});

module.exports = router;