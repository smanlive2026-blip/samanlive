const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const modulesPath = path.join(__dirname, '../../public/assets/js/modules.json');

router.get('/categories', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
        res.json(data.marketCategories || []);
    } catch (err) {
        res.status(500).json({ error: 'Categories load nahi hui' });
    }
});

module.exports = router;