const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
let cart = JSON.parse(localStorage.getItem('cart_'+shopId)) || [];
let allProducts = [];
let shopData = {}; // CHANGED: shop ka data yaha save karenge

async function init() { // CHANGED: async kiya
    // CHANGED: AB API SE SAB UTHAO
    try{
        const res = await fetch(`/api/shops/${shopId}`);
        const result = await res.json();
        if(result.success && result.shop) shopData = result.shop; // FIX: result.shop check bhi joda
    }catch(err){ console.error(err) }

    document.getElementById('shopName').innerText = shopData.shopName || localStorage.getItem('shopName_'+shopId) || 'Fresh Fruits'; // CHANGED
    document.getElementById('pageTitle').innerText = (shopData.shopName || localStorage.getItem('shopName_'+shopId) || 'Fresh Fruits') + ' - Shop'; // CHANGED
    
    const ann = shopData.announcement || localStorage.getItem('announcement_'+shopId); // CHANGED
    if(ann) { document.getElementById('announcementBox').innerText = ann; document.getElementById('announcementBox').style.display = 'block'; }
    
    const isOpen = shopData.isOpen !== undefined ? shopData.isOpen : localStorage.getItem('shopStatus_'+shopId) !== 'false'; // FIX: OPEN/CLOSE dono
    const statusEl = document.getElementById('shopStatus');
    if(isOpen === false) { 
        statusEl.innerHTML = '<i class="fa fa-circle"></i> CLOSED'; 
        statusEl.style.background = '#ef4444'; 
    } else {
        statusEl.innerHTML = '<i class="fa fa-circle"></i> OPEN';
        statusEl.style.background = 'rgba(255,255,255,0.2)';
    }
    
    const savedFruits = shopData.items && shopData.items.length > 0 ? shopData.items : [...window.FRUIT_PRODUCTS_DATA]; // CHANGED
    allProducts = savedFruits.map(f => ({...f, image: f.image || f.img})); // FIX: img -> image convert kiya
    renderProducts(allProducts); updateCart();
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if(!grid) return;
    grid.innerHTML = products.map(p => `<div class="product-card"><img src="${p.image || p.img || 'https://via.placeholder.com/150?text=Fruit'}" class="product-img" onerror="this.src='https://via.placeholder.com/150?text=Fruit'"><div class="product-name">${p.name}</div><div class="product-price">₹${p.price} <span class="product-unit">/${p.unit}</span></div>${getCartButton(p)}</div>`).join(''); // FIX: p.img fallback joda
}

function getCartButton(product) {
    const pid = product._id || product.id; // CHANGED: _id bhi support
    const item = cart.find(c => c.id === pid);
    return item ? `<div class="qty-control"><button class="qty-btn" onclick="updateQty('${pid}', -1)">-</button><span>${item.qty}</span><button class="qty-btn" onclick="updateQty('${pid}', 1)">+</button></div>` : `<button class="add-btn" onclick="addToCart('${pid}')">Add to Cart</button>`; // CHANGED
}

function addToCart(id) { 
    const product = allProducts.find(p => (p._id || p.id) === id); // CHANGED
    if(!product) return;
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({...product, id: id, qty: 1}); // CHANGED: id fix kiya
    saveCart(); 
    renderProducts(allProducts); 
}
function updateQty(id, change) { 
    const item = cart.find(c => c.id === id); 
    if(!item) return;
    item.qty += change; 
    if(item.qty <= 0) cart = cart.filter(c => c.id !== id); 
    saveCart(); 
    renderProducts(allProducts); 
}
function saveCart() { 
    localStorage.setItem('cart_'+shopId, JSON.stringify(cart)); 
    updateCart(); 
}
function updateCart() {
    document.getElementById('cartCount').innerText = cart.reduce((sum, c) => sum + c.qty, 0);
    document.getElementById('cartTotal').innerText = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    document.getElementById('cartItems').innerHTML = cart.length === 0 ? '<p style="text-align:center; color:#94a3b8;">Cart is empty</p>' : cart.map(c => `<div class="cart-item"><img src="${c.image || c.img || 'https://via.placeholder.com/50'}"><div style="flex:1;"><div style="font-weight:600;">${c.name}</div><div>₹${c.price} x ${c.qty}</div></div><div style="font-weight:700;">₹${c.price * c.qty}</div></div>`).join(''); // FIX: c.img fallback
}

function toggleCart() { document.getElementById('cartSidebar').classList.toggle('active'); document.getElementById('overlay').classList.toggle('active'); }
function filterCat(cat) { 
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); 
    event.target.classList.add('active'); 
    const filtered = cat === 'all'? allProducts : allProducts.filter(p => p.category === cat); 
    renderProducts(filtered); 
}

function placeOrder() {
    if(cart.length === 0) return alert('Cart is empty!');
    let phone = shopData.phone || '91XXXXXXXXXX'; // CHANGED: shop ka number
    let msg = `Hello! Order from ${document.getElementById('shopName').innerText}%0A%0A`;
    cart.forEach(c => msg += `${c.name} x ${c.qty} = ₹${c.price * c.qty}%0A`);
    msg += `%0ATotal: ₹${document.getElementById('cartTotal').innerText}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank'); // CHANGED
    window.location.href = `order-success.html?shopId=${shopId}`;
}

// CHANGED: YE PURA BLOCK HATA DIYA. YE DASHBOARD WALA THA, CUSTOMER ME NAHI CHAHIYE
/*
document.addEventListener('DOMContentLoaded', function() {
    const shopId = document.getElementById('shopIdDisplay').innerText || 'demo123';
    const template = 'fruit';
    ShopCore.init(shopId, template);
    ShopCore.bindImageUpload('ownerPhoto', 'photoUpload', 'profile', 'owner');
    console.log("ShopCore Loaded for:", shopId);
});
*/

document.getElementById('searchInput').onkeyup = (e) => { const term = e.target.value.toLowerCase(); renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(term))); }
init();