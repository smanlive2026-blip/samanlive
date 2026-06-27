// ========================================
// NOTIFICATIONS - ADMIN/AREA MANAGER READY
// app.js se currentUser + LocationManager use karega
// ========================================

let allNotifications = [];
let filteredNotifications = [];
let unreadCount = 0;
let currentFilter = 'all';
let counts = { all: 0, order: 0, delivery: 0, promo: 0, area: 0, system: 0, admin: 0 };

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
            updateCounts();
            updateUnreadCount();
            filterNotifications(currentFilter);
        } else {
            showEmptyState();
        }
    } catch (err) {
        console.error('Failed to load notifications:', err);
        showEmptyState();
    }
}

// ========================================
// UPDATE COUNTS - Filter tabs ke liye
// ========================================
function updateCounts() {
    counts = { all: 0, order: 0, delivery: 0, promo: 0, area: 0, system: 0, admin: 0 };
    
    allNotifications.forEach(n => {
        counts.all++;
        if (counts[n.type] !== undefined) {
            counts[n.type]++;
        }
    });

    // UI update
    document.getElementById('countAll').textContent = counts.all;
    document.getElementById('countOrder').textContent = counts.order;
    document.getElementById('countDelivery').textContent = counts.delivery;
    document.getElementById('countPromo').textContent = counts.promo;
    document.getElementById('countArea').textContent = counts.area;
    document.getElementById('countSystem').textContent = counts.system;
}

// ========================================
// UPDATE UNREAD COUNT
// ========================================
function updateUnreadCount() {
    unreadCount = allNotifications.filter(n => !n.read).length;
    const badge = document.getElementById('unreadBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// ========================================
// FILTER NOTIFICATIONS
// ========================================
window.filterNotifications = function(type) {
    currentFilter = type;
    
    // Tab active state
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${type}"]`).classList.add('active');

    // Filter logic
    if (type === 'all') {
        filteredNotifications = [...allNotifications];
    } else {
        filteredNotifications = allNotifications.filter(n => n.type === type);
    }

    renderNotifications();
}

// ========================================
// RENDER NOTIFICATIONS - UI me dikhao
// ========================================
function renderNotifications() {
    const container = document.getElementById('notificationsContainer');

    if (filteredNotifications.length === 0) {
        showEmptyState();
        return;
    }

    // Sort: Unread first, then priority, then by date
    const sorted = [...filteredNotifications].sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        if (a.priority !== b.priority) {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    container.innerHTML = sorted.map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''} ${notif.priority ? 'priority-' + notif.priority : ''}" onclick="handleNotificationClick('${notif._id}')">
            <div class="notification-icon ${getNotificationType(notif.type)}">
                ${getNotificationIcon(notif.type)}
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-title">${notif.title}</div>
                    ${notif.priority && notif.priority !== 'low' ? `<span class="priority-tag ${notif.priority}">${notif.priority}</span>` : ''}
                </div>
                <div class="notification-text">${notif.message}</div>
                <div class="notification-meta">
                    <div class="notification-time">🕐 ${formatTime(notif.createdAt)}</div>
                    ${notif.source ? `<div class="notification-source">${getSourceIcon(notif.source)} ${formatSource(notif.source)}</div>` : ''}
                </div>
                ${notif.actionUrl ? `
                    <div class="notification-actions">
                        <button class="action-btn btn-primary" onclick="event.stopPropagation(); window.location.href='${notif.actionUrl}'">
                            ${notif.actionText || 'View'}
                        </button>
                    </div>
                ` : ''}
            </div>
            <button class="delete-btn" onclick="deleteNotification('${notif._id}', event)">×</button>
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
        'system': '⚙️',
        'chat': '💬',
        'offer': '🏷️',
        'area': '📍',
        'admin': '👑'
    };
    return icons[type] || '🔔';
}

function getNotificationType(type) {
    return type;
}

function getSourceIcon(source) {
    const icons = {
        'admin': '👑',
        'area_manager': '🗺️',
        'system': '⚙️',
        'user': '👤',
        'shop': '🏪'
    };
    return icons[source] || '🔔';
}

function formatSource(source) {
    const names = {
        'admin': 'Admin',
        'area_manager': 'Area Manager',
        'system': 'System',
        'user': 'User',
        'shop': 'Shop'
    };
    return names[source] || source;
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
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// ========================================
// HANDLE NOTIFICATION CLICK
// ========================================
window.handleNotificationClick = async function(notificationId) {
    const notif = allNotifications.find(n => n._id === notificationId);
    if (!notif) return;

    // Mark as read
    if (!notif.read) {
        await markAsRead(notificationId);
    }

    // Navigate based on type or actionUrl
    if (notif.actionUrl) {
        window.location.href = notif.actionUrl;
        return;
    }

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
        case 'area':
        case 'admin':
            showNotificationDetails(notif);
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
            updateCounts();
            filterNotifications(currentFilter);
        }
    } catch (err) {
        console.error('Failed to mark as read:', err);
    }
}

// ========================================
// MARK ALL AS READ
// ========================================
window.markAllAsRead = async function() {
    if (unreadCount === 0) {
        showToast('All notifications already read');
        return;
    }

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
            filterNotifications(currentFilter);
            showToast('✅ All marked as read');
        }
    } catch (err) {
        showToast('Failed to mark all as read');
    }
}

// ========================================
// DELETE NOTIFICATION
// ========================================
window.deleteNotification = async function(notificationId, event) {
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
            allNotifications = allNotifications.filter(n => n._id !== notificationId);
            updateCounts();
            updateUnreadCount();
            filterNotifications(currentFilter);
            showToast('Notification deleted');
        }
    } catch (err) {
        showToast('Failed to delete');
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
                    <div style="margin-bottom:16px;">
                        <span class="notification-icon ${getNotificationType(notif.type)}" style="width:60px;height:60px;font-size:32px;margin-bottom:12px;">
                            ${getNotificationIcon(notif.type)}
                        </span>
                    </div>
                    <p style="margin-bottom:16px;line-height:1.6;font-size:15px;color:#475569;">${notif.message}</p>
                    <div style="padding-top:16px;border-top:1px solid #f1f5f9;">
                        <small style="color:#64748b;display:block;margin-bottom:4px;">
                            🕐 ${new Date(notif.createdAt).toLocaleString('en-IN')}
                        </small>
                        ${notif.source ? `<small style="color:#64748b;display:block;">
                            ${getSourceIcon(notif.source)} From: ${formatSource(notif.source)}
                        </small>` : ''}
                    </div>
                    ${notif.actionUrl ? `
                        <button class="action-btn btn-primary" style="width:100%;margin-top:16px;padding:12px;" onclick="window.location.href='${notif.actionUrl}'">
                            ${notif.actionText || 'View Details'}
                        </button>
                    ` : ''}
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
            showToast(`🔔 ${newCount} new notification${newCount > 1 ? 's' : ''}`);
            
            // Browser notification bhi
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('SAMANLIVE', {
                    body: `You have ${newCount} new notification${newCount > 1 ? 's' : ''}`,
                    icon: '/assets/images/logo.png'
                });
            }
        }
    }, 30000);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Agar Socket.io use karna hai to:
    // if (window.io && window.currentUser) {
    //     const socket = io();
    //     socket.on(`notification:${window.currentUser._id}`, (data) => {
    //         allNotifications.unshift(data);
    //         updateCounts();
    //         updateUnreadCount();
    //         filterNotifications(currentFilter);
    //         showToast('🔔 ' + data.title);
    //     });
    // }
}

// ========================================
// EMPTY STATE
// ========================================
function showEmptyState() {
    const filterName = currentFilter === 'all' ? '' : ` in ${currentFilter}`;
    document.getElementById('notificationsContainer').innerHTML = `
        <div class="empty-state">
            <div class="icon">🔔</div>
            <h2>No Notifications${filterName}</h2>
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
        animation: fadeIn 0.2s;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .modal-box {
        background: white;
        border-radius: 20px;
        width: 100%;
        max-width: 500px;
        animation: slideUp 0.3s;
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
        color: #0f172a;
    }
    .modal-header button {
        background: #f1f5f9;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        color: #64748b;
        transition: all 0.2s;
    }
    .modal-header button:hover {
        background: #e2e8f0;
    }
    .modal-body {
        padding: 24px;
    }
`;
document.head.appendChild(style);