const express = require('express');
const router = express.Router();
// const modulesData = require('../seed/seed-modules.json'); <-- HATA DIYA

// Abhi ke liye empty array bhej rahe hai. Baad me DB se lena
router.get('/modules', (req, res) => {
    res.json([]); 
});

router.post('/modules/nearby', (req, res) => {
    res.json([]);
});

module.exports = router;
