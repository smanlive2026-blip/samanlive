// ========================================
// MY ORDERS - ORDER MANAGEMENT LOGIC
// app.js se currentUser use karega
// ========================================

let currentUser = null;
let allOrders = [];
let currentFilter = 'all';

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

    await loadOrders();
});

// ========================================
// LOAD ORDERS - API se
// ========================================
async function loadOrders() {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/orders/my-orders', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            allOrders = data.orders || [];
            renderOrders();
        } else {
            showEmptyState();
        }
    } catch (err) {
        console.error('Failed to load orders:', err);
        showEmptyState();
    }
}

// ========================================
// FILTER ORDERS - Tab click
// ========================================
function filterOrders(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    renderOrders();
}

// ========================================
// RENDER ORDERS - UI me dikhao
// ========================================
function renderOrders() {
    const container = document.getElementById('ordersContainer');
    const filtered = currentFilter === 'all' 
        ? allOrders 
        : allOrders.filter(o => o.status === currentFilter);

    if (filtered.length === 0) {
        showEmptyState();
        return;
    }

    container.innerHTML = filtered.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">
                    Order <b>#${order.orderId}</b><br>
                    <span>${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                    })}</span>
                </div>
                <div class="order-status status-${order.status}">${order.status}</div>
            </div>
            <div class="order-body">
                <img src="${order.items[0]?.image || '/assets/default-product.png'}" 
                     class="order-img" 
                     alt="Product"
                     onclick="viewOrderDetails('${order._id}')"
                     style="cursor:pointer;">
                <div class="order-details">
                    <h3 onclick="viewOrderDetails('${order._id}')" style="cursor:pointer;">${order.items[0]?.name || 'Product'}</h3>
                    <p>Qty: ${order.items[0]?.quantity || 1} • ${order.items.length} item(s)</p>
                    <p>Shop: ${order.shopName || 'SAMANLIVE Store'}</p>
                    ${order.deliveryDate ? `<p style="color:#10b981;font-size:12px;">Expected: ${new Date(order.deliveryDate).toLocaleDateString('en-IN')}</p>` : ''}
                </div>
            </div>
            <div class="order-footer">
                <div class="order-price">₹${order.totalAmount}</div>
                <div class="order-actions">
                    ${getOrderActions(order)}
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// GET ORDER ACTIONS - Status ke hisab se buttons
// ========================================
function getOrderActions(order) {
    switch(order.status) {
        case 'delivered':
            return `
                <button class="action-btn btn-secondary" onclick="returnOrder('${order._id}')">Return</button>
                <button class="action-btn btn-primary" onclick="buyAgain('${order._id}')">Buy Again</button>
            `;
        case 'pending':
        case 'confirmed':
            return `
                <button class="action-btn btn-secondary" onclick="cancelOrder('${order._id}')">Cancel</button>
                <button class="action-btn btn-primary" onclick="trackOrder('${order._id}')">Track</button>
            `;
        case 'shipped':
            return `
                <button class="action-btn btn-primary" onclick="trackOrder('${order._id}')">Track Order</button>
            `;
        case 'cancelled':
            return `
                <button class="action-btn btn-primary" onclick="buyAgain('${order._id}')">Buy Again</button>
            `;
        default:
            return `
                <button class="action-btn btn-primary" onclick="viewOrderDetails('${order._id}')">View Details</button>
            `;
    }
}

// ========================================
// EMPTY STATE
// ========================================
function showEmptyState() {
    const emptyMessage = currentFilter === 'all' 
        ? 'No Orders Yet'
        : `No ${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Orders`;
    
    const emptySubtext = currentFilter === 'all'
        ? "You haven't placed any orders yet. Start shopping now!"
        : `No orders match this filter. Try different filter or start shopping!`;

    document.getElementById('ordersContainer').innerHTML = `
        <div class="empty-state">
            <div class="icon">📦</div>
            <h2>${emptyMessage}</h2>
            <p>${emptySubtext}</p>
            <button class="shop-now-btn" onclick="window.location.href='/'">Shop Now</button>
        </div>
    `;
}

// ========================================
// TRACK ORDER - Detail page
// ========================================
function trackOrder(orderId) {
    window.location.href = `/order-tracking.html?orderId=${orderId}`;
}

// ========================================
// VIEW ORDER DETAILS
// ========================================
function viewOrderDetails(orderId) {
    window.location.href = `/order-details.html?orderId=${orderId}`;
}

// ========================================
// CANCEL ORDER - API call
// ========================================
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ Order cancelled successfully');
            await loadOrders(); // Refresh list
        } else {
            alert('Failed to cancel order: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Failed to cancel order. Please try again.');
    }
}

// ========================================
// RETURN ORDER - Request return
// ========================================
async function returnOrder(orderId) {
    if (!confirm('Do you want to return this order?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/orders/${orderId}/return`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ reason: 'Customer requested' })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ Return request submitted');
            await loadOrders();
        } else {
            alert('Failed to submit return: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Failed to submit return request. Please try again.');
    }
}

// ========================================
// BUY AGAIN - Add items to cart
// ========================================
async function buyAgain(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;

    const token = localStorage.getItem('userToken');
    let successCount = 0;

    try {
        for (const item of order.items) {
            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ 
                    productId: item.productId, 
                    quantity: item.quantity 
                })
            });
            const data = await res.json();
            if (data.success) successCount++;
        }

        if (successCount > 0) {
            showToast(`✅ ${successCount} item(s) added to cart!`);
            updateCartCount();
            setTimeout(() => {
                if (confirm('Go to cart?')) {
                    window.location.href = '/cart.html';
                }
            }, 500);
        } else {
            alert('Failed to add items to cart');
        }
    } catch (err) {
        alert('Failed to add items to cart. Please try again.');
    }
}

// ========================================
// UPDATE CART COUNT - Header me badge
// ========================================
async function updateCartCount() {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/cart/count', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success && window.updateHeaderCartCount) {
            window.updateHeaderCartCount(data.count);
        }
    } catch (err) {
        console.log('Cart count update failed');
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