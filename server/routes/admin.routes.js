const express = require('express');
const router = express.Router();
const User = require('../models/User');

// SAARAY USERS LANA
router.get('/users', async (req,res)=>{
    try {
        const users = await User.find().sort({createdAt:-1});
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// BLOCK/UNBLOCK
router.put('/users/:id/block', async (req,res)=>{
    try {
        const {isBlocked} = req.body;
        await User.findByIdAndUpdate(req.params.id, {isBlocked});
        res.json({success:true});
    } catch (err) {
        res.status(500).json({msg: 'Server Error'});
    }
});

module.exports = router;