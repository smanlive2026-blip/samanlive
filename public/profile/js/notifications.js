// ========================================
// NOTIFICATIONS - IN-APP + PUSH LOGIC
// app.js se currentUser + LocationManager use karega
// ========================================

let currentUser = null;
let allNotifications = [];
let unreadCount = 0;

// ========================================
// PAGE LOAD - Init
// ========================================
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // app.js se user check karo pehle
    if (window.currentUser) {
        currentUser = window.currentUser;
    } else {
        // Agar app.js me nahi mila to API se
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                window.currentUser = data.user;
            } else {
                localStorage.removeItem('userToken');
                window.location.href = '/';
                return;
            }
        } catch (err) {
            window.location.href = '/';
            return;
        }
    }

    await loadNotifications();
    setupNotificationListener();
});

// ========================================
// LOAD NOTIFICATIONS - API se
// ========================================
async function loadNotifications() {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/notifications', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            allNotifications = data.notifications || [];
            updateUnreadCount();
            renderNotifications();
        } else {
            showEmptyState();
        }
    } catch (err) {
        console.error('Failed to load notifications:', err);
        showEmptyState();
    }
}

// ========================================
// UPDATE UNREAD COUNT
// ========================================
function updateUnreadCount() {
    unreadCount = allNotifications.filter(n =>!n.read).length;
    const badge = document.getElementById('unreadBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0? 'inline-block' : 'none';
    }

    // Header me bhi update karo
    const headerCount = document.querySelector('.notification-count');
    if (headerCount) {
        headerCount.textContent = `${allNotifications.length} notifications`;
    }
}

// ========================================
// RENDER NOTIFICATIONS - UI me dikhao
// ========================================
function renderNotifications() {
    const container = document.getElementById('notificationsContainer');

    if (allNotifications.length === 0) {
        showEmptyState();
        return;
    }

    // Sort: Unread first, then by date
    const sorted = [...allNotifications].sort((a, b) => {
        if (a.read!== b.read) return a.read? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    container.innerHTML = sorted.map(notif => `
        <div class="notification-item ${!notif.read? 'unread' : ''}">
            <div class="notification-main" onclick="handleNotificationClick('${notif._id}')">
                <div class="notification-icon ${getNotificationType(notif.type)}">
                    ${getNotificationIcon(notif.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-text">${notif.message}</div>
                    <div class="notification-time">${formatTime(notif.createdAt)}</div>
                </div>
                ${!notif.read? '<div class="unread-dot"></div>' : ''}
            </div>
            <button class="delete-notif-btn" onclick="deleteNotification('${notif._id}', event)">🗑️</button>
        </div>
    `).join('');
}

// ========================================
// NOTIFICATION ICON & TYPE
// ========================================
function getNotificationIcon(type) {
    const icons = {
        'order': '📦',
        'promo': '🎁',
        'shop': '🏪',
        'payment': '💳',
        'delivery': '🚚',
        'system': '🔔',
        'chat': '💬',
        'offer': '🏷️'
    };
    return icons[type] || '🔔';
}

function getNotificationType(type) {
    return `notif-${type}`;
}

// ========================================
// FORMAT TIME - "2 hours ago" style
// ========================================
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    });
}

// ========================================
// HANDLE NOTIFICATION CLICK
// ========================================
async function handleNotificationClick(notificationId) {
    const notif = allNotifications.find(n => n._id === notificationId);
    if (!notif) return;

    // Mark as read
    if (!notif.read) {
        await markAsRead(notificationId);
    }

    // Navigate based on type
    switch(notif.type) {
        case 'order':
            window.location.href = `/order-details.html?orderId=${notif.data?.orderId}`;
            break;
        case 'shop':
            window.location.href = `/local-market/dashboard.html?shopId=${notif.data?.shopId}&type=${notif.data?.shopType}`;
            break;
        case 'promo':
        case 'offer':
            window.location.href = `/${notif.data?.link || ''}`;
            break;
        case 'payment':
            window.location.href = '/profile/payments.html';
            break;
        case 'delivery':
            window.location.href = `/order-tracking.html?orderId=${notif.data?.orderId}`;
            break;
        case 'chat':
            window.location.href = `/chat.html?userId=${notif.data?.userId}`;
            break;
        default:
            showNotificationDetails(notif);
    }
}

// ========================================
// MARK AS READ - API call
// ========================================
async function markAsRead(notificationId) {
    const token = localStorage.getItem('userToken');
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        // Update local
        const notif = allNotifications.find(n => n._id === notificationId);
        if (notif) {
            notif.read = true;
            updateUnreadCount();
            renderNotifications();
        }
    } catch (err) {
        console.error('Failed to mark as read:', err);
    }
}

// ========================================
// MARK ALL AS READ
// ========================================
async function markAllAsRead() {
    if (!confirm('Mark all notifications as read?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/notifications/read-all', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            allNotifications.forEach(n => n.read = true);
            updateUnreadCount();
            renderNotifications();
            showToast('✅ All marked as read');
        }
    } catch (err) {
        showToast('Failed to mark all as read');
    }
}

// ========================================
// DELETE NOTIFICATION
// ========================================
async function deleteNotification(notificationId, event) {
    if (event) event.stopPropagation();
    if (!confirm('Delete this notification?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            allNotifications = allNotifications.filter(n => n._id!== notificationId);
            updateUnreadCount();
            renderNotifications();
            showToast('Notification deleted');
        }
    } catch (err) {
        showToast('Failed to delete');
    }
}

// ========================================
// CLEAR ALL NOTIFICATIONS
// ========================================
async function clearAllNotifications() {
    if (!confirm('Clear all notifications? This cannot be undone.')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/notifications/clear-all', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            allNotifications = [];
            updateUnreadCount();
            renderNotifications();
            showToast('✅ All notifications cleared');
        }
    } catch (err) {
        showToast('Failed to clear notifications');
    }
}

// ========================================
// SHOW NOTIFICATION DETAILS - Modal
// ========================================
function showNotificationDetails(notif) {
    const modal = document.createElement('div');
    modal.className = 'notif-detail-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-box" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${notif.title}</h3>
                    <button onclick="this.closest('.notif-detail-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom:16px;line-height:1.6;">${notif.message}</p>
                    <small style="color:#64748b;">${new Date(notif.createdAt).toLocaleString('en-IN')}</small>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ========================================
// REAL-TIME LISTENER - Polling every 30 sec
// ========================================
function setupNotificationListener() {
    // Polling every 30 seconds for new notifications
    setInterval(async () => {
        const oldCount = allNotifications.length;
        await loadNotifications();

        // Agar naye notifications aaye to toast
        if (allNotifications.length > oldCount) {
            const newCount = allNotifications.length - oldCount;
            showToast(`🔔 ${newCount} new notification${newCount > 1? 's' : ''}`);
        }
    }, 30000);

    // Agar Socket.io use karna hai to:
    // if (window.io) {
    // const socket = io();
    // socket.on(`notification:${currentUser._id}`, (data) => {
    // allNotifications.unshift(data);
    // updateUnreadCount();
    // renderNotifications();
    // showToast('🔔 ' + data.title);
    // });
    // }
}

// ========================================
// EMPTY STATE
// ========================================
function showEmptyState() {
    document.getElementById('notificationsContainer').innerHTML = `
        <div class="empty-state">
            <div class="icon">🔔</div>
            <h2>No Notifications</h2>
            <p>You're all caught up! New notifications will appear here.</p>
        </div>
    `;
}

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message) {
    const existingToast = document.getElementById('toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes slideDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
   .notification-item {
        position: relative;
        display: flex;
        align-items: start;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.2s;
    }
   .notification-item:hover {
        background: #f8fafc;
    }
   .notification-item.unread {
        background: #f0f9ff;
        border-left: 3px solid #667eea;
    }
   .notification-main {
        flex: 1;
        display: flex;
        gap: 12px;
    }
   .notification-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        background: #eef2ff;
        flex-shrink: 0;
    }
   .notification-content {
        flex: 1;
    }
   .notification-title {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
    }
   .notification-text {
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
        margin-bottom: 6px;
    }
   .notification-time {
        font-size: 12px;
        color: #94a3b8;
    }
   .unread-dot {
        width: 10px;
        height: 10px;
        background: #667eea;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 4px;
    }
   .delete-notif-btn {
        background: #fee2e2;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.2s;
    }
   .notification-item:hover.delete-notif-btn {
        opacity: 1;
    }
   .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
   .modal-box {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
    }
   .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
   .modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: #1e293b;
    }
   .modal-header button {
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        color: #64748b;
    }
   .modal-body {
        padding: 24px;
    }
`;
document.head.appendChild(style);