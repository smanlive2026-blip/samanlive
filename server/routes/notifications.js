const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/user/notifications - Get all notifications
router.get('/user/notifications', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/user/notifications/:id/read - Mark single as read
router.put('/user/notifications/:id/read', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const notification = user.notifications.id(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        notification.read = true;
        await user.save();

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/user/notifications/read-all - Mark all as read
router.put('/user/notifications/read-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        user.notifications.forEach(notif => {
            notif.read = true;
        });

        await user.save();
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/user/notifications - Create notification - Admin use
router.post('/user/notifications', auth, async (req, res) => {
    try {
        const { type, title, message, actionUrl } = req.body;
        const user = await User.findById(req.userId);

        user.notifications.push({ type, title, message, actionUrl });
        await user.save();

        res.json({ success: true, message: 'Notification created' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;