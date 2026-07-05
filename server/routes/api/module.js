const express = require('express');
const router = express.Router();
const Module = require('../../models/Module');

// GET ALL MODULES - Admin + Area Manager dono use karenge
router.get('/', async (req, res) => {
    try {
        const modules = await Module.find({ status: 'active' }).sort({ priority: 1 });
        res.json({ modules }); // ✅ modules key me bhejna hai
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;