// URL se ID nikalega: /shop/64f1a2b3c4d5e6f7g8h9i0j1/dashboard
const pathParts = window.location.pathname.split('/');
const shopId = pathParts[2];
document.getElementById('shopIdDisplay').innerText = shopId;

ShopCore.init(shopId, 'furniture');

let shopData = {};

async function loadData() {
    const res = await fetch(`/api/shops/get/${shopId}`);
    const result = await res.json();
    if(result.success){
        shopData = result.data;
        renderAll();
    } else {
        alert('Shop nahi mila: ' + result.message);
    }
}

function renderAll(){
    document.getElementById('shopName').innerText = shopData.shopName || 'Furniture Showroom';
    document.getElementById('items').innerText = shopData.items?.length || 0;

    // Orders count - tere Order model se
    loadOrderStats();

    renderProducts();
    renderLowStock();
    renderCategories();

    // Photo load - DB se aaye to local me save
    if(shopData.ownerPhotoUrl){
        localStorage.setItem(`photo_${shopId}_profile_cloud`, shopData.ownerPhotoUrl);
    }
    ShopCore.bindImageUpload('ownerImg', 'ownerInput', 'profile', 'profile');
}

async function loadOrderStats(){
    try{
        const res = await fetch(`/api/orders/shop/${shopId}`);
        const result = await res.json();
        if(result.success){
            const orders = result.data || [];
            const today = new Date().toDateString();
            const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

            document.getElementById('orders').innerText = todayOrders.length;
            document.getElementById('delivery').innerText = orders.filter(o =>!['delivered','cancelled'].includes(o.orderStatus)).length;
            document.getElementById('revenue').innerText = todayOrders.reduce((a,b) => a + b.totalAmount, 0);
        }
    }catch(err){ console.log("Order stats error", err) }
}

function renderProducts(){
    const list = document.getElementById('productList');
    if(!shopData.items?.length) return list.innerHTML = '<p style="color:#64748b;">Koi furniture nahi hai. Add karo</p>';

    list.innerHTML = shopData.items.map((item, index) => `
        <div class="order-card" style="display:flex; gap:15px; align-items:center;">
            <img src="${item.image || 'https://placehold.co/80x80/a16207/fff?text=Item'}" style="width:80px; height:80px; object-fit:cover; border-radius:12px;">
            <div style="flex:1;">
                <h4>${item.name}</h4>
                <p style="color:#64748b; font-size:13px;">Stock: ${item.stock} | ${item.desc || ''} | ${item.unit}</p>
            </div>
            <div style="text-align:right;">
                <p style="font-weight:700; font-size:18px;">₹${item.price}</p>
                <button onclick="deleteItem(${index})" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; margin-top:5px;"><i class="fa fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderLowStock(){
    const low = shopData.items?.filter(i => i.stock <= 5) || [];
    document.getElementById('lowStock').innerHTML = low.length?
        low.map(i => `<div style="padding:10px; background:#fef2f2; border-radius:10px; margin-bottom:8px;"><b>${i.name}</b> - ${i.stock} left</div>`).join('') :
        '<p style="color:#16a34a;">Sab stock me hai ✅</p>';
}

function renderCategories(){
    const cats = [...new Set(shopData.items?.map(i => i.unit))].filter(Boolean);
    document.getElementById('categories').innerHTML = cats.length?
        cats.map(c => `<div style="padding:8px; background:#fef3c7; border-radius:8px; margin-bottom:6px;">${c}</div>`).join('') :
        '<p style="color:#64748b;">No categories</p>';
}

async function updateShop(){
    const res = await fetch(`/api/shops/update/${shopId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ items: shopData.items })
    });
    const result = await res.json();
    if(result.success) loadData();
    else alert('Update failed');
}

async function deleteItem(index){
    if(!confirm('Pakka delete karna hai?')) return;
    shopData.items.splice(index, 1);
    updateShop();
}

document.getElementById('addItemBtn').onclick = () => {
    const name = prompt('Furniture Name?');
    const price = prompt('Price?');
    const stock = prompt('Stock?');
    const unit = prompt('Unit? Piece/Set') || 'Piece';
    if(!name ||!price) return;

    shopData.items.push({
        name,
        price: Number(price),
        stock: Number(stock) || 0,
        unit: unit,
        desc: '',
        image: ''
    });
    updateShop();
}

document.getElementById('newOrderBtn').onclick = () => {
    alert('Order wala section baad me banayenge');
}

loadData();