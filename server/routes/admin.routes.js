const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Saare users admin ko do
router.get('/users', auth, isAdmin, async (req,res)=>{
    try {
        const users = await User.find().sort({createdAt:-1});
        res.json(users);
    } catch (err) {
        res.status(500).json({msg: 'Server Error'});
    }
});

// Block/Unblock
router.put('/users/:id/block', auth, isAdmin, async (req,res)=>{
    try {
        const {isBlocked} = req.body;
        await User.findByIdAndUpdate(req.params.id, {isBlocked});
        res.json({success:true});
    } catch (err) {
        res.status(500).json({msg: 'Server Error'});
    }
});

module.exports = router;