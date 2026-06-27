// ========================================
// WISHLIST - SAVED PRODUCTS LOGIC
// app.js se currentUser use karega
// ========================================

let allWishlistItems = [];

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

    await loadWishlist();
});

// ========================================
// LOAD WISHLIST - API se
// ========================================
async function loadWishlist() {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/user/wishlist', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            allWishlistItems = data.items || [];
            renderWishlist();
        } else {
            showEmptyState();
        }
    } catch (err) {
        console.error('Failed to load wishlist:', err);
        showEmptyState();
    }
}

// ========================================
// RENDER WISHLIST - UI me dikhao
// ========================================
function renderWishlist() {
    const container = document.getElementById('wishlistContainer');
    document.getElementById('wishlistCount').textContent = `${allWishlistItems.length} items`;

    if (allWishlistItems.length === 0) {
        showEmptyState();
        return;
    }

    container.innerHTML = allWishlistItems.map(item => {
        const discount = item.oldPrice ? Math.round((1 - item.price / item.oldPrice) * 100) : 0;
        return `
            <div class="wishlist-item">
                <div class="wishlist-img-wrapper">
                    <img src="${item.image || '/assets/default-product.png'}" 
                         class="wishlist-img" 
                         alt="${item.name}"
                         onclick="viewProduct('${item._id}')"
                         style="cursor:pointer;">
                    ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ''}
                    <button class="heart-btn" onclick="removeFromWishlist('${item._id}')">❤️</button>
                </div>
                <div class="wishlist-details">
                    <div class="wishlist-name" onclick="viewProduct('${item._id}')" style="cursor:pointer;">${item.name}</div>
                    <div class="wishlist-price">
                        <span class="current-price">₹${item.price}</span>
                        ${item.oldPrice ? `<span class="old-price">₹${item.oldPrice}</span>` : ''}
                    </div>
                    <div class="wishlist-shop">🏪 ${item.shopName || 'SAMANLIVE Store'}</div>
                    <button class="add-cart-btn" onclick="addToCart('${item._id}')">Add to Cart</button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// EMPTY STATE
// ========================================
function showEmptyState() {
    document.getElementById('wishlistContainer').innerHTML = `
        <div class="empty-state">
            <div class="icon">❤️</div>
            <h2>Your Wishlist is Empty</h2>
            <p>Save items you love to buy them later</p>
            <button class="shop-now-btn" onclick="window.location.href='/'">Start Shopping</button>
        </div>
    `;
    document.getElementById('wishlistCount').textContent = '0 items';
}

// ========================================
// REMOVE FROM WISHLIST
// ========================================
async function removeFromWishlist(itemId) {
    if (!confirm('Remove from wishlist?')) return;

    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch(`/api/user/wishlist/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            await loadWishlist();
            showToast('Removed from wishlist');
        } else {
            alert('Failed to remove item');
        }
    } catch (err) {
        alert('Failed to remove item');
    }
}

// ========================================
// ADD TO CART
// ========================================
async function addToCart(itemId) {
    const token = localStorage.getItem('userToken');
    try {
        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ productId: itemId, quantity: 1 })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Added to cart!');
            updateCartCount();
        } else {
            alert('Failed to add to cart: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Failed to add to cart');
    }
}

// ========================================
// VIEW PRODUCT - Detail page pe jao
// ========================================
function viewProduct(productId) {
    window.location.href = `/product-details.html?id=${productId}`;
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