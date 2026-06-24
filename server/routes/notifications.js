const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authenticateToken');
const { requireAdmin } = require('../middleware/authenticateToken');

// ==================== GET /api/user/notifications ====================
// Get all notifications with pagination
router.get('/user/notifications', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        
        const user = await User.findById(req.userId).select('notifications');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let notifications = user.notifications || [];
        
        // Filter unread if requested
        if (unreadOnly === 'true') {
            notifications = notifications.filter(n =>!n.read);
        }

        // Sort by newest first
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotifications = notifications.slice(startIndex, endIndex);

        // Unread count
        const unreadCount = user.notifications.filter(n =>!n.read).length;

        res.json({
            success: true,
            notifications: paginatedNotifications,
            total: notifications.length,
            unreadCount,
            page: parseInt(page),
            totalPages: Math.ceil(notifications.length / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== GET /api/user/notifications/unread-count ====================
// Get unread count only - NAYA
router.get('/user/notifications/unread-count', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('notifications');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const unreadCount = user.notifications.filter(n =>!n.read).length;

        res.json({ success: true, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PUT /api/user/notifications/:id/read ====================
// Mark single as read
router.put('/user/notifications/:id/read', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const notification = user.notifications.id(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        notification.read = true;
        notification.readAt = new Date();
        await user.save();

        const unreadCount = user.notifications.filter(n =>!n.read).length;

        res.json({
            success: true,
            message: 'Marked as read',
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PUT /api/user/notifications/read-all ====================
// Mark all as read
router.put('/user/notifications/read-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const now = new Date();
        user.notifications.forEach(notif => {
            if (!notif.read) {
                notif.read = true;
                notif.readAt = now;
            }
        });

        await user.save();
        res.json({
            success: true,
            message: 'All notifications marked as read',
            unreadCount: 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELETE /api/user/notifications/:id ====================
// Delete single notification - NAYA
router.delete('/user/notifications/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const notification = user.notifications.id(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        user.notifications.pull(req.params.id);
        await user.save();

        const unreadCount = user.notifications.filter(n =>!n.read).length;

        res.json({
            success: true,
            message: 'Notification deleted',
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DELETE /api/user/notifications ====================
// Clear all notifications - NAYA
router.delete('/user/notifications', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.notifications = [];
        await user.save();

        res.json({
            success: true,
            message: 'All notifications cleared',
            unreadCount: 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== POST /api/user/notifications ====================
// Create notification - Admin use only
router.post('/user/notifications', auth, requireAdmin, async (req, res) => {
    try {
        const { userId, type, title, message, actionUrl, icon } = req.body;

        if (!type ||!title ||!message) {
            return res.status(400).json({
                success: false,
                error: 'Type, title, and message are required'
            });
        }

        // Specific user ko bhejo ya sabko
        if (userId) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            user.notifications.push({
                type,
                title,
                message,
                actionUrl: actionUrl || '',
                icon: icon || '🔔',
                read: false
            });
            await user.save();

            res.json({ success: true, message: 'Notification sent to user' });
        } else {
            // Broadcast to all users - WARNING: Heavy operation
            const result = await User.updateMany(
                {},
                {
                    $push: {
                        notifications: {
                            type,
                            title,
                            message,
                            actionUrl: actionUrl || '',
                            icon: icon || '🔔',
                            read: false,
                            createdAt: new Date()
                        }
                    }
                }
            );

            res.json({
                success: true,
                message: `Notification sent to ${result.modifiedCount} users`
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
