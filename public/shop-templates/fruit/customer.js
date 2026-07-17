const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
let cart = JSON.parse(localStorage.getItem('cart_'+shopId)) || [];
let allProducts = [];
let shopData = {};

async function init() {
    if(!shopId) {
        alert("Shop ID nahi mili URL me");
        return;
    }

    // 1. SIRF DB SE DATA LAO
    try{
        const res = await fetch(`/api/shops/${shopId}`);
        const result = await res.json();
        if(result.success && result.shop) shopData = result.shop;
    }catch(err){ 
        console.error(err);
        document.getElementById('productGrid').innerHTML = '<p style="text-align:center; color:red;">Error: Server on nahi hai. npm start karo</p>';
        return;
    }

    // 2. SHOP INFO SET KARO
    document.getElementById('shopName').innerText = shopData.shopName || 'Fresh Fruits';
    document.getElementById('pageTitle').innerText = (shopData.shopName || 'Fresh Fruits') + ' - Shop';
    
    const ann = shopData.announcement;
    if(ann) { 
        document.getElementById('announcementBox').innerText = ann; 
        document.getElementById('announcementBox').style.display = 'block'; 
    }
    
    const isOpen = shopData.isOpen !== undefined ? shopData.isOpen : true;
    const statusEl = document.getElementById('shopStatus');
    if(isOpen === false) { 
        statusEl.innerHTML = '<i class="fa fa-circle"></i> CLOSED'; 
        statusEl.style.background = '#ef4444'; 
    } else {
        statusEl.innerHTML = '<i class="fa fa-circle"></i> OPEN';
        statusEl.style.background = 'rgba(255,255,255,0.2)';
    }
    
    // 3. PRODUCTS SIRF DB SE
    const savedFruits = shopData.items || [];
    allProducts = savedFruits.map(f => ({...f, image: f.image || f.img})); // img ko image me convert
    renderProducts(allProducts); 
    updateCart();
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if(!grid) return;
    if(products.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px;">No products found</p>';
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image || p.img || 'https://via.placeholder.com/150?text=Fruit'}" class="product-img" onerror="this.src='https://via.placeholder.com/150?text=Fruit'">
            <div class="product-name">${p.name}</div>
            <div class="product-price">₹${p.price} <span class="product-unit">/${p.unit}</span></div>
            ${getCartButton(p)}
        </div>`).join('');
}

function getCartButton(product) {
    const pid = product._id || product.id;
    const item = cart.find(c => c.id === pid);
    return item ? `<div class="qty-control"><button class="qty-btn" onclick="updateQty('${pid}', -1)">-</button><span>${item.qty}</span><button class="qty-btn" onclick="updateQty('${pid}', 1)">+</button></div>` : `<button class="add-btn" onclick="addToCart('${pid}')">Add to Cart</button>`;
}

function addToCart(id) { 
    const product = allProducts.find(p => (p._id || p.id) === id);
    if(!product) return;
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({...product, id: id, qty: 1});
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
    localStorage.setItem('cart_'+shopId, JSON.stringify(cart)); // Cart ke liye localStorage theek hai
    updateCart(); 
}

function updateCart() {
    document.getElementById('cartCount').innerText = cart.reduce((sum, c) => sum + c.qty, 0);
    document.getElementById('cartTotal').innerText = cart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    document.getElementById('cartItems').innerHTML = cart.length === 0 ? '<p style="text-align:center; color:#94a3b8;">Cart is empty</p>' : cart.map(c => `
        <div class="cart-item">
            <img src="${c.image || c.img || 'https://via.placeholder.com/50'}">
            <div style="flex:1;">
                <div style="font-weight:600;">${c.name}</div>
                <div>₹${c.price} x ${c.qty}</div>
            </div>
            <div style="font-weight:700;">₹${c.price * c.qty}</div>
        </div>`).join('');
}

function toggleCart() { 
    document.getElementById('cartSidebar').classList.toggle('active'); 
    document.getElementById('overlay').classList.toggle('active'); 
}

function filterCat(cat) { 
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); 
    event.target.classList.add('active'); 
    const filtered = cat === 'all'? allProducts : allProducts.filter(p => p.category === cat); 
    renderProducts(filtered); 
}

function placeOrder() {
    if(cart.length === 0) return alert('Cart is empty!');
    let phone = shopData.phone || '91XXXXXXXXXX';
    let msg = `Hello! Order from ${shopData.shopName}%0A%0A`;
    cart.forEach(c => msg += `${c.name} x ${c.qty} = ₹${c.price * c.qty}%0A`);
    msg += `%0ATotal: ₹${document.getElementById('cartTotal').innerText}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    window.location.href = `order-success.html?shopId=${shopId}`;
}

document.getElementById('searchInput').onkeyup = (e) => { 
    const term = e.target.value.toLowerCase(); 
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(term))); 
}

init();