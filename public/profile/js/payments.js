// ========================================
// PAYMENT METHODS - UPI/CARD/WALLET LOGIC
// app.js se currentUser use karega
// ========================================

let currentUser = null;
let allPayments = [];
let selectedPaymentType = 'upi';

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

    await loadPayments();
    setupCardFormatting();
});

// ========================================
// LOAD PAYMENTS - API se
// ========================================
async function loadPayments() {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/user/payments', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            allPayments = data.payments || [];
            renderPayments();
        }
    } catch (err) {
        console.error('Failed to load payments:', err);
    }
}

// ========================================
// RENDER PAYMENTS - UI me dikhao
// ========================================
function renderPayments() {
    const container = document.getElementById('paymentsContainer');

    if (allPayments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">💳</div>
                <h2>No Payment Methods</h2>
                <p>Add UPI, Cards or Wallets for faster checkout</p>
            </div>
        `;
        return;
    }

    const upiPayments = allPayments.filter(p => p.type === 'upi');
    const cardPayments = allPayments.filter(p => p.type === 'card');
    const walletPayments = allPayments.filter(p => p.type === 'wallet');

    let html = '';

    if (upiPayments.length > 0) {
        html += '<div class="section-title">UPI</div>';
        html += upiPayments.map(p => renderPaymentCard(p)).join('');
    }

    if (cardPayments.length > 0) {
        html += '<div class="section-title">Cards</div>';
        html += cardPayments.map(p => renderPaymentCard(p)).join('');
    }

    if (walletPayments.length > 0) {
        html += '<div class="section-title">Wallets</div>';
        html += walletPayments.map(p => renderPaymentCard(p)).join('');
    }

    container.innerHTML = html;
}

// ========================================
// RENDER SINGLE PAYMENT CARD
// ========================================
function renderPaymentCard(payment) {
    let iconClass, iconEmoji, displayText;

    if (payment.type === 'upi') {
        iconClass = 'upi-icon';
        iconEmoji = '📱';
        displayText = payment.upiId;
    } else if (payment.type === 'card') {
        iconClass = 'card-icon';
        iconEmoji = '💳';
        displayText = '**** **** **** ' + payment.cardLast4;
    } else {
        iconClass = 'wallet-icon';
        iconEmoji = '👛';
        displayText = payment.walletType + ' - ' + payment.phone;
    }

    return `
        <div class="payment-card">
            <div class="payment-left">
                <div class="payment-icon ${iconClass}">${iconEmoji}</div>
                <div class="payment-details">
                    <h3>${payment.name}</h3>
                    <p>${displayText}</p>
                </div>
            </div>
            <div class="payment-actions">
                ${payment.isDefault ? '<span class="default-badge">DEFAULT</span>' : `
                    <button class="action-btn btn-default" onclick="setDefaultPayment('${payment._id}')">Set Default</button>
                `}
                <button class="action-btn btn-delete" onclick="deletePayment('${payment._id}')">Delete</button>
            </div>
        </div>
    `;
}

// ========================================
// OPEN PAYMENT MODAL
// ========================================
function openPaymentModal() {
    document.getElementById('paymentModal').classList.add('active');
    selectPaymentType('upi');
    resetModalForm();
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    resetModalForm();
}

function resetModalForm() {
    document.getElementById('upiId').value = '';
    document.getElementById('upiName').value = currentUser?.name || '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardName').value = currentUser?.name || '';
    document.getElementById('cardExpiry').value = '';
    document.getElementById('cardCvv').value = '';
    document.getElementById('walletPhone').value = currentUser?.phone || '';
    document.getElementById('setDefaultPayment').checked = false;
}

// ========================================
// SELECT PAYMENT TYPE - Tab switch
// ========================================
function selectPaymentType(type) {
    selectedPaymentType = type;
    document.querySelectorAll('.type-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    document.getElementById('upiForm').style.display = type === 'upi' ? 'block' : 'none';
    document.getElementById('cardForm').style.display = type === 'card' ? 'block' : 'none';
    document.getElementById('walletForm').style.display = type === 'wallet' ? 'block' : 'none';
}

// ========================================
// SAVE PAYMENT - API call
// ========================================
async function savePayment() {
    const btn = document.getElementById('saveBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const token = localStorage.getItem('userToken');
    let paymentData = {
        type: selectedPaymentType,
        isDefault: document.getElementById('setDefaultPayment').checked
    };

    if (selectedPaymentType === 'upi') {
        paymentData.upiId = document.getElementById('upiId').value.trim();
        paymentData.name = document.getElementById('upiName').value.trim();
        if (!paymentData.upiId || !paymentData.name) {
            alert('Please fill all UPI fields!');
            btn.textContent = 'Save Payment Method';
            btn.disabled = false;
            return;
        }
        // UPI ID validation
        if (!paymentData.upiId.includes('@')) {
            alert('Invalid UPI ID! Format: name@bank');
            btn.textContent = 'Save Payment Method';
            btn.disabled = false;
            return;
        }
    } else if (selectedPaymentType === 'card') {
        paymentData.cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        paymentData.cardName = document.getElementById('cardName').value.trim();
        paymentData.cardExpiry = document.getElementById('cardExpiry').value.trim();
        paymentData.cardCvv = document.getElementById('cardCvv').value.trim();
        
        if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.cardExpiry || !paymentData.cardCvv) {
            alert('Please fill all card fields!');
            btn.textContent = 'Save Payment Method';
            btn.disabled = false;
            return;
        }
        // Card validation
        if (paymentData.cardNumber.length < 16) {
            alert('Invalid card number!');
            btn.textContent = 'Save Payment Method';
            btn.disabled = false;
            return;
        }
        paymentData.cardLast4 = paymentData.cardNumber.slice(-4);
        paymentData.name = paymentData.cardName;
    } else {
        paymentData.walletType = document.getElementById('walletType').value;
        paymentData.phone = document.getElementById('walletPhone').value.trim();
        paymentData.name = paymentData.walletType.charAt(0).toUpperCase() + paymentData.walletType.slice(1) + ' Wallet';
        
        if (!paymentData.phone || paymentData.phone.length !== 10) {
            alert('Please enter valid 10 digit mobile number!');
            btn.textContent = 'Save Payment Method';
            btn.disabled = false;
            return;
        }
    }

    try {
        const res = await fetch('/api/user/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(paymentData)
        });
        const data = await res.json();

        if (data.success) {
            await loadPayments();
            closePaymentModal();
            showToast('✅ Payment method added!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Failed to save payment method');
    }

    btn.textContent = 'Save Payment Method';
    btn.disabled = false;
}

// ========================================
// DELETE PAYMENT
// ========================================
async function deletePayment(paymentId) {
    if (!confirm('Delete this payment method?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/user/payments/${paymentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            await loadPayments();
            showToast('Payment method deleted!');
        }
    } catch (err) {
        alert('Failed to delete');
    }
}

// ========================================
// SET DEFAULT PAYMENT
// ========================================
async function setDefaultPayment(paymentId) {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/user/payments/${paymentId}/default`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            await loadPayments();
            showToast('✅ Default payment updated!');
        }
    } catch (err) {
        alert('Failed to set default');
    }
}

// ========================================
// CARD NUMBER FORMATTING - Auto space
// ========================================
function setupCardFormatting() {
    const cardInput = document.getElementById('cardNumber');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    }

    // Expiry formatting
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0,2) + '/' + value.slice(2,4);
            }
            e.target.value = value;
        });
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
`;
document.head.appendChild(style);