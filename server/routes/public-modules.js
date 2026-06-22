const express = require('express');
const router = express.Router();
const modulesData = require('../seed/seed-modules.json');

router.get('/modules', (req, res) => {
    res.json(modulesData.modules);
});

router.post('/modules/nearby', (req, res) => {
    res.json(modulesData.modules);
});

module.exports = router;