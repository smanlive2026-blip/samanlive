// ===== STEP 1: SHOP ID QUERY SE NIKALO =====
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');

if(!shopId){
    alert('ERROR: URL me?shopId=xxx daalo');
    throw new Error('Shop ID missing');
}

console.log("✅ SHOP ID DETECTED:", shopId);
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('shopIdDisplay').innerText = shopId;
    ShopCore.init(shopId, 'furniture');
    initEvents();
    loadData();
});

let shopData = {};
let editingIndex = null;

async function loadData() {
    try{
        const res = await fetch(`/api/shops/${shopId}`);
        if(!res.ok) throw new Error('Shop not found 404');
        const result = await res.json();
        console.log("API RESPONSE:", result);

         shopData = result.shop || result.data || result; // FIX: data ya seedha object
        
        if(shopData && shopData._id){
            renderAll();
        } else {
            alert('Shop nahi mila');
        }
    }catch(err){
        console.error("LOAD ERROR:", err);
        alert('Server se data nahi aa raha');
    }
}

function renderAll(){
    document.getElementById('shopName').innerText = shopData?.shopName || 'Furniture Showroom';
    document.getElementById('items').innerText = shopData?.items?.length || 0;
    document.getElementById('userViewBtn').href = `/shop-templates/furniture/customer-view.html?shopId=${shopId}`;
    document.getElementById('addProductBtn').href = `add-product.html?shopId=${shopId}`;

    document.getElementById('announcementInput').value = shopData?.announcement || '';
    document.getElementById('openTime').value = shopData?.shopSettings?.openTime || '09:00';
    document.getElementById('closeTime').value = shopData?.shopSettings?.closeTime || '21:00';

    const toggle = document.getElementById('shopToggle');
    toggle.classList.toggle('off',!shopData?.isOpen);
    document.getElementById('toggleText').innerText = shopData?.isOpen? 'Open' : 'Closed';

    if(shopData?.banner) document.getElementById('shopBanner').src = shopData.banner;
    if(shopData?.ownerPhotoUrl) document.getElementById('ownerImg').src = shopData.ownerPhotoUrl;

    renderProducts();
    renderLowStock();
    loadOrderStats();
    bindUploadsCustom();
}

function renderProducts(filter=''){
    const list = document.getElementById('productList');
    let items = shopData?.items?.filter(i => i.name.toLowerCase().includes(filter.toLowerCase())) || [];
    if(!items.length) return list.innerHTML = '<p style="color:#64748b;">Koi product nahi hai. + Add Furniture dabao</p>';

    list.innerHTML = items.map((item, index) => `
        <div class="product-item">
            <img src="${item.image || 'https://placehold.co/80x80/a16207/fff?text=Item'}" onclick="uploadProductImage(${index})">
            <div style="flex:1;">
                <h4>${item.name} <span class="badge ${item.available? 'badge-green':'badge-red'}" onclick="toggleAvailable(${index})">${item.available? 'In Stock':'Out'}</span></h4>
                <p style="color:#64748b; font-size:13px;">₹${item.price} | Stock: ${item.stock} | ${item.unit}</p>
            </div>
            <button class="btn-sm" style="background:#f59e0b;" onclick="openEditModal(${index})"><i class="fa fa-pen"></i></button>
            <button class="btn-sm" style="background:#ef4444;" onclick="deleteItem(${index})"><i class="fa fa-trash"></i></button>
        </div>
    `).join('');
}

function renderLowStock(){
    const low = shopData?.items?.filter(i => i.stock <= 5) || [];
    document.getElementById('lowStock').innerHTML = low.length?
        low.map(i => `<div style="padding:10px; background:#fef2f2; border-radius:10px; margin-bottom:8px;"><b>${i.name}</b> - ${i.stock} left</div>`).join('') :
        '<p style="color:#16a34a;">Sab stock me hai ✅</p>';
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
            document.getElementById('revenue').innerText = todayOrders.reduce((a,b) => a + (b.totalAmount||0), 0);

            if(document.getElementById('orderList')){
                document.getElementById('orderList').innerHTML = orders.slice(0,5).map(o =>
                    `<div style="padding:10px; border-bottom:1px solid #eee;">${o.customerName} - ₹${o.totalAmount} - ${o.orderStatus}</div>`
                ).join('') || 'No orders yet';
            }
        }
    }catch(err){ console.log("Order stats error", err) }
}

async function updateShopDB(updateData){
    const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updateData)
    });
    const result = await res.json();
    if(result.success) loadData();
    else alert('Update failed: ' + result.message);
}

function bindUploadsCustom(){
    document.getElementById('ownerInput').onchange = async (e)=>{
        const file = e.target.files[0]; if(!file) return;
        const url = await ShopCore.uploadImage(file, 'profile');
        if(url){
            document.getElementById('ownerImg').src = url;
            await updateShopDB({ownerPhotoUrl: url});
        }
    }
    document.getElementById('bannerInput').onchange = async (e)=>{
        const file = e.target.files[0]; if(!file) return;
        const url = await ShopCore.uploadImage(file, 'banner');
        if(url){
            document.getElementById('shopBanner').src = url;
            await updateShopDB({banner: url});
        }
    }
}

function initEvents(){
    document.getElementById('searchProduct').onkeyup = (e) => renderProducts(e.target.value);
    document.getElementById('shopToggle').onclick = () => updateShopDB({isOpen:!shopData.isOpen});
    document.getElementById('saveAnnouncement').onclick = () => updateShopDB({announcement: document.getElementById('announcementInput').value});
    document.getElementById('saveTiming').onclick = () => updateShopDB({shopSettings: {openTime: document.getElementById('openTime').value, closeTime: document.getElementById('closeTime').value}});
}

function openEditModal(index){
    editingIndex = index;
    const item = shopData.items[index];
    document.getElementById('editName').value = item.name;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editStock').value = item.stock;
    document.getElementById('editUnit').value = item.unit;
    document.getElementById('editDesc').value = item.desc;
    document.getElementById('editModal').style.display = 'flex';
}
function closeEditModal(){ document.getElementById('editModal').style.display = 'none'; }
async function saveEditedItem(){
    const item = shopData.items[editingIndex];
    item.name = document.getElementById('editName').value;
    item.price = Number(document.getElementById('editPrice').value);
    item.stock = Number(document.getElementById('editStock').value);
    item.unit = document.getElementById('editUnit').value;
    item.desc = document.getElementById('editDesc').value;
    updateShopDB({items: shopData.items});
    closeEditModal();
}
async function toggleAvailable(index){
    shopData.items[index].available =!shopData.items[index].available;
    updateShopDB({items: shopData.items});
}
async function deleteItem(index){
    if(!confirm('Pakka delete karna hai?')) return;
    shopData.items.splice(index, 1);
    updateShopDB({items: shopData.items});
}
async function uploadProductImage(index){
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.click();
    input.onchange = async (e) => {
        const url = await ShopCore.uploadImage(e.target.files[0], 'product');
        if(url){
            shopData.items[index].image = url;
            updateShopDB({items: shopData.items});
        }
    }
}