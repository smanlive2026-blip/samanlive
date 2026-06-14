const User = require('../models/User');

const sendNotification = async (userId, notificationData) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        user.notifications.push({
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            actionUrl: notificationData.actionUrl || '',
            icon: notificationData.icon || '🔔',
            read: false
        });

        await user.save();
        return true;
    } catch (error) {
        console.error('Notification Error:', error);
        return false;
    }
};

module.exports = sendNotification;