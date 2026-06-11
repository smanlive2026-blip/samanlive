const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const Manager = require('../models/Manager'); // apna model ka path check kar lena

const upload = multer({ dest: 'uploads/' });

router.post('/create-manager', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 }
]), async (req, res, next) => { // <-- next yahan important hai
    try {
        const { name, area, email, phone, serviceCharge, status, moduleAccess } = req.body;

        if (!name ||!area ||!email ||!phone) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const documents = {};
        if (req.files.photo) documents.photo = req.files.photo[0].path;
        if (req.files.aadhar) documents.aadhar = req.files.aadhar[0].path;
        if (req.files.pan) documents.pan = req.files.pan[0].path;
        if (req.files.addressProof) documents.addressProof = req.files.addressProof[0].path;

        const loginToken = crypto.randomBytes(32).toString('hex');
        const tempPassword = Math.random().toString(36).slice(-8);

        const manager = new Manager({
            name,
            area,
            email,
            phone,
            serviceCharge,
            status: status === 'true',
            moduleAccess: JSON.parse(moduleAccess),
            documents,
            loginToken,
            tempPassword
        });

        await manager.save();

        res.json({
            success: true,
            loginLink: `${process.env.FRONTEND_URL}/area-manager.html?token=${loginToken}`,
            tempPassword
        });

    } catch (err) {
        console.error('Create manager error:', err);
        next(err);
    }
});

module.exports = router;