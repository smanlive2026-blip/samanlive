// ========================================
// SETTINGS - ACCOUNT/NOTIFICATION/PRIVACY LOGIC
// app.js se currentUser use karega
// ========================================

let currentUser = null;
let userSettings = {};

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

    await loadSettings();
});

// ========================================
// LOAD SETTINGS - API + LocalStorage
// ========================================
async function loadSettings() {
    const token = localStorage.getItem('userToken');

    try {
        // API se settings fetch karo
        const res = await fetch('/api/user/settings', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            userSettings = data.settings || {};
            // Local storage me bhi save for offline
            localStorage.setItem('userSettings', JSON.stringify(userSettings));
        } else {
            // API fail to local se load
            userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        }
    } catch (err) {
        // Network error to local se load
        userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    }

    applySettingsToUI();
}

// ========================================
// APPLY SETTINGS TO UI - Toggles set karo
// ========================================
function applySettingsToUI() {
    document.getElementById('notifOrders').checked = userSettings.notifOrders!== false;
    document.getElementById('notifPromos').checked = userSettings.notifPromos!== false;
    document.getElementById('notifPush').checked = userSettings.notifPush!== false;
    document.getElementById('notifEmail').checked = userSettings.notifEmail === true;
    document.getElementById('privacyLocation').checked = userSettings.privacyLocation!== false;
    document.getElementById('darkMode').checked = userSettings.darkMode === true;

    // Dark mode apply karo if enabled
    if (userSettings.darkMode === true) {
        document.body.style.filter = 'invert(1) hue-rotate(180deg)';
    }
}

// ========================================
// SAVE SETTING - API + LocalStorage
// ========================================
async function saveSetting(key, value) {
    const token = localStorage.getItem('userToken');

    // Local me turant save
    userSettings[key] = value;
    localStorage.setItem('userSettings', JSON.stringify(userSettings));

    // API me save karo
    try {
        const res = await fetch('/api/user/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ [key]: value })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Setting saved!');
        } else {
            showToast('Saved locally, will sync later');
        }
    } catch (err) {
        showToast('Saved locally, will sync later');
    }
}

// ========================================
// TOGGLE DARK MODE
// ========================================
function toggleDarkMode(enabled) {
    saveSetting('darkMode', enabled);
    if (enabled) {
        document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        showToast('🌙 Dark mode enabled');
    } else {
        document.body.style.filter = 'none';
        showToast('☀️ Light mode enabled');
    }
}

// ========================================
// CHANGE PASSWORD
// ========================================
function changePassword() {
    if (!currentUser) return;

    const phone = currentUser.phone;
    if (confirm(`Change Password\n\nOTP will be sent to ${phone}\n\nContinue?`)) {
        // API call for OTP
        sendPasswordResetOTP(phone);
    }
}

async function sendPasswordResetOTP(phone) {
    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, type: 'password_reset' })
        });
        const data = await res.json();

        if (data.success) {
            const otp = prompt('Enter OTP sent to ' + phone);
            if (otp) {
                verifyPasswordResetOTP(phone, otp);
            }
        } else {
            alert('Failed to send OTP: ' + data.error);
        }
    } catch (err) {
        alert('Failed to send OTP. Please try again.');
    }
}

async function verifyPasswordResetOTP(phone, otp) {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, otp: otp, newPassword: newPassword })
        });
        const data = await res.json();

        if (data.success) {
            alert('✅ Password changed successfully!\n\nPlease login again with new password.');
            logout();
        } else {
            alert('Failed: ' + data.error);
        }
    } catch (err) {
        alert('Failed to reset password. Please try again.');
    }
}

// ========================================
// CLEAR CACHE
// ========================================
function clearCache() {
    if (confirm('Clear app cache?\n\nThis will not delete your account data, only temporary files.')) {
        // Local storage ka cache clear
        localStorage.removeItem('appCache');
        localStorage.removeItem('imageCache');
        localStorage.removeItem('tempData');

        // Session storage clear
        sessionStorage.clear();

        // Browser cache clear attempt
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        showToast('✅ Cache cleared successfully!');
    }
}

// ========================================
// LOGOUT
// ========================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userSettings');
        localStorage.removeItem('myShopsList');
        sessionStorage.clear();

        showToast('Logging out...');
        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    }
}

// ========================================
// DELETE ACCOUNT - Permanent
// ========================================
async function deleteAccount() {
    if (!confirm('⚠️ WARNING: This will permanently delete your account and all data.\n\nThis action cannot be undone. Are you sure?')) {
        return;
    }

    if (!confirm('Final confirmation: Delete account permanently?\n\nAll your shops, orders, and data will be lost forever.')) {
        return;
    }

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/user/delete-account', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            alert('Account deletion request submitted.\n\nYour account will be deleted within 24 hours.\n\nYou will receive confirmation email.');
            logout();
        } else {
            alert('Failed to delete account: ' + data.error);
        }
    } catch (err) {
        alert('Failed to delete account. Please contact support.');
    }
}

// ========================================
// TOAST NOTIFICATION - Better UX
// ========================================
function showToast(message) {
    // Remove existing toast
    const existingToast = document.getElementById('toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
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
`;
document.head.appendChild(style);