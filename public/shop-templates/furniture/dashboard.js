// ===== STEP 1: SHOP ID QUERY SE NIKALO =====
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
const API_BASE = `/api/furniture`;

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
        const res = await fetch(`${API_BASE}/${shopId}`);
        const result = await res.json();
        console.log("API RESPONSE FULL:", result);

        shopData = result.shop || result.data || result;
        shopData.items = shopData.items || shopData.products || shopData.inventory || [];

        console.log("ITEMS ARRAY:", shopData.items);

        if(shopData && (shopData.shopId || shopData._id)){
            renderAll();
        } else {
            alert('Shop nahi mila. DB me shopId check karo: ' + shopId);
        }
    }catch(err){
        console.error("LOAD ERROR:", err);
        alert('Error: ' + err.message);
    }
}

function renderAll(){
    document.getElementById('shopName').innerText = shopData?.shopName || shopData?.name || 'Furniture Showroom';
    document.getElementById('items').innerText = shopData?.items?.length || 0;

    document.getElementById('userViewBtn').href = `/shop-templates/furniture/customer-view.html?shopId=${shopId}`;
    document.getElementById('addProductBtn').href = `add-product.html?shopId=${shopId}`;
    document.getElementById('bulkProductBtn').href = `bulk-products.html?shopId=${shopId}`;
    document.getElementById('libraryBtn').href = `product-library.html?shopId=${shopId}`;

    document.getElementById('announcementInput').value = shopData?.announcement || shopData?.settings?.announcement || '';
    document.getElementById('openTime').value = shopData?.shopSettings?.openTime || shopData?.settings?.openTime || '09:00';
    document.getElementById('closeTime').value = shopData?.shopSettings?.closeTime || shopData?.settings?.closeTime || '21:00';

    // NAYA: PHONE NUMBER LOAD KARO
    document.getElementById('shopPhoneInput').value = shopData?.phone || '';

    // TOGGLE FIX: backend se jo bhi aaye usko true/false me convert
    const isOpen = shopData?.isOpen === true || shopData?.isOpen === "true" || shopData?.settings?.isOpen === true || shopData?.shopStatus === "open";
    const toggle = document.getElementById('shopToggle');
    toggle.classList.toggle('off',!isOpen);
    document.getElementById('toggleText').innerText = isOpen? 'Open' : 'Closed';
    shopData.isOpen = isOpen;

    // UPDATE: banner + owner dono settings se bhi padhe
    if(shopData?.banner || shopData?.bannerPhotoUrl || shopData?.settings?.bannerPhotoUrl)
        document.getElementById('shopBanner').src = shopData.banner || shopData.bannerPhotoUrl || shopData?.settings?.bannerPhotoUrl;
    if(shopData?.ownerPhotoUrl || shopData?.settings?.ownerPhotoUrl)
        document.getElementById('ownerImg').src = shopData.ownerPhotoUrl || shopData?.settings?.ownerPhotoUrl;

    renderProducts();
    renderLowStock();
    loadOrderStats();
    bindUploadsCustom(); // purana wala rehne de
    // UPDATE: shop-core wala bind use karo. Golden rule follow. Double bind ho jayega par chalega
    ShopCore.bindImageUpload('ownerImg', 'ownerInput', 'profile', 'owner');
    ShopCore.bindImageUpload('shopBanner', 'bannerInput', 'banner', 'banner');
}

function renderProducts(filter=''){
    const list = document.getElementById('productList');
    const searchTerm = filter.toLowerCase();

    let items = shopData?.items?.filter(i => {
        if(!i) return false;
        const name = i.name || i.productName || i.title || '';
        return name.toLowerCase().includes(searchTerm);
    }) || [];

    console.log("FILTERED ITEMS TO RENDER:", items);

    if(!items.length) return list.innerHTML = '<p style="color:#64748b;">Koi product nahi hai. + Add Furniture dabao</p>';

    list.innerHTML = items.map((item, index) => {
        const id = item._id || item.id;
        const name = item.name || item.productName || item.title || 'No Name';
        const price = item.price || item.productPrice || 0;
        const stock = item.stock || item.quantity || 0;
        const unit = item.unit || item.productUnit || 'Piece';
        const available = item.available === true || item.available === "true";
        return `
        <div class="product-item">
            <img src="${item.image || item.img || item.productImage || 'https://placehold.co/80x80/a16207/fff?text=Item'}" onclick="uploadProductImage(${index})" style="cursor:pointer;">
            <div style="flex:1;">
                <h4>${name} <span class="badge ${available? 'badge-green':'badge-red'}" onclick="toggleAvailable(${index})">${available? 'In Stock':'Out'}</span></h4>
                <p style="color:#64748b; font-size:13px;">₹${price} | Stock: ${stock} | ${unit}</p>
            </div>
            <button class="btn-sm" style="background:#f59e0b;" onclick="openEditModal(${index})"><i class="fa fa-pen"></i></button>
            <button class="btn-sm" style="background:#ef4444;" onclick="deleteItem(${index})"><i class="fa fa-trash"></i></button>
        </div>
    `}).join('');
}

function renderLowStock(){
    const low = shopData?.items?.filter(i => i && (i.stock || i.quantity || 0) <= 5) || [];
    document.getElementById('lowStock').innerHTML = low.length?
        low.map(i => `<div style="padding:10px; background:#fef2f2; border-radius:10px; margin-bottom:8px;"><b>${i.name || i.productName || 'No Name'}</b> - ${i.stock || i.quantity} left</div>`).join('') :
        '<p style="color:#16a34a;">Sab stock me hai ✅</p>';
}

async function loadOrderStats(){
    try{
        const res = await fetch(`${API_BASE}/${shopId}/orders`);
        if(!res.ok) return;
        const result = await res.json();
        if(result.success){
            const orders = result.data || [];
            const today = new Date().toDateString();
            const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

            document.getElementById('orders').innerText = todayOrders.length;
            document.getElementById('delivery').innerText = orders.filter(o =>!['delivered','cancelled'].includes(o.status)).length;
            document.getElementById('revenue').innerText = todayOrders.reduce((a,b) => a + (b.total||0), 0);

            if(document.getElementById('orderList')){
                document.getElementById('orderList').innerHTML = orders.slice(0,5).map(o =>
                    `<div style="padding:10px; border-bottom:1px solid #eee;">${o.customerName} - ₹${o.total} - ${o.status}</div>`
                ).join('') || 'No orders yet';
            }
        }
    }catch(err){ console.log("Order stats error", err) }
}

// YE EK HI RAKHO. UPAR WALA HATA DIYA
async function updateShopDB(updateData){
    const res = await fetch(`${API_BASE}/${shopId}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updateData)
    });
    const result = await res.json();
    console.log("UPDATE RESPONSE:", result);

    // success ho ya na ho, 500ms baad fresh data le aao
    setTimeout(() => loadData(), 500);
}

async function updateFurnitureItem(itemId, updatedItem){
    const res = await fetch(`${API_BASE}/${shopId}/item/${itemId}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ item: updatedItem })
    });
    const result = await res.json();
    if(result.success) loadData();
    else alert('Item Update failed: ' + result.message);
}

function bindUploadsCustom(){
    // OWNER UPLOAD
    document.getElementById('ownerInput').onchange = async (e)=>{
        const file = e.target.files[0]; if(!file) return;
        document.getElementById('uploadLoader').style.display = 'inline';
        const url = await ShopCore.uploadImage(file, 'profile');
        document.getElementById('uploadLoader').style.display = 'none';
        if(url){
            document.getElementById('ownerImg').src = url;
            // YAHAN CHANGE: settings hata ke seedha root me bhej
            await updateShopDB({ownerPhotoUrl: url});
            alert('Logo Saved ✅');
        }
    }

    // BANNER UPLOAD - YEHI MAIN FIX HAI
    document.getElementById('bannerInput').onchange = async (e)=>{
        const file = e.target.files[0]; if(!file) return;
        document.getElementById('uploadLoader').style.display = 'inline';
        const url = await ShopCore.uploadImage(file, 'banner');
        document.getElementById('uploadLoader').style.display = 'none';
        if(url){
            document.getElementById('shopBanner').src = url;
            // YAHAN CHANGE: settings hata ke seedha root me bhej
            await updateShopDB({bannerPhotoUrl: url});
            alert('Banner Saved ✅');
        }
    }
    document.getElementById('ownerImg').onclick = () => document.getElementById('ownerInput').click();
    document.getElementById('shopBanner').onclick = () => document.getElementById('bannerInput').click();
}

function initEvents(){
    document.getElementById('searchProduct').onkeyup = (e) => renderProducts(e.target.value);

    // TOGGLE FINAL CODE
    document.getElementById('shopToggle').onclick = async () => {
        const newStatus =!shopData.isOpen;

        // 1. Pehle UI turant change
        shopData.isOpen = newStatus;
        document.getElementById('shopToggle').classList.toggle('off',!newStatus);
        document.getElementById('toggleText').innerText = newStatus? 'Open' : 'Closed';

        // 2. Fir backend me save
        await updateShopDB({isOpen: newStatus});
    };

    document.getElementById('saveAnnouncement').onclick = () => updateShopDB({announcement: document.getElementById('announcementInput').value});
    document.getElementById('saveTiming').onclick = () => updateShopDB({settings: {openTime: document.getElementById('openTime').value, closeTime: document.getElementById('closeTime').value}});

    // NAYA: PHONE SAVE KARNE KA CODE
    document.getElementById('savePhone').onclick = async () => {
        const phone = document.getElementById('shopPhoneInput').value;
        if(phone.length!== 10) return alert('10 digit number dalo bhai');

        await updateShopDB({phone: phone});
        alert('Number Saved ✅');
    };
}

function openEditModal(index){
    editingIndex = index;
    const item = shopData.items[index];
    document.getElementById('editName').value = item.name || item.productName || '';
    document.getElementById('editPrice').value = item.price || item.productPrice || 0;
    document.getElementById('editStock').value = item.stock || item.quantity || 0;
    document.getElementById('editUnit').value = item.unit || item.productUnit || '';
    document.getElementById('editDesc').value = item.desc || item.description || '';
    document.getElementById('editModal').style.display = 'flex';
}
function closeEditModal(){ document.getElementById('editModal').style.display = 'none'; }

async function saveEditedItem(){
    const item = shopData.items[editingIndex];
    const updatedItem = {
    ...item,
        name: document.getElementById('editName').value,
        price: Number(document.getElementById('editPrice').value),
        stock: Number(document.getElementById('editStock').value),
        unit: document.getElementById('editUnit').value,
        desc: document.getElementById('editDesc').value
    };
    await updateFurnitureItem(item._id || item.id, updatedItem);
    closeEditModal();
}

async function toggleAvailable(index){
    const item = shopData.items[index];
    await updateFurnitureItem(item._id || item.id, {...item, available:!item.available});
}

async function deleteItem(index){
    if(!confirm('Pakka delete karna hai?')) return;
    const item = shopData.items[index];
    await fetch(`${API_BASE}/${shopId}/item/${item._id || item.id}`, { method: 'DELETE' });
    loadData();
}

async function uploadProductImage(index){
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.click();
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        document.getElementById('uploadLoader').style.display = 'inline';
        const item = shopData.items[index];
        const imageUrl = await ShopCore.uploadImage(file, 'product');
        document.getElementById('uploadLoader').style.display = 'none';
        if(!imageUrl) {
            alert('Photo upload nahi hui. Cloudinary check karo');
            return;
        }
        await updateFurnitureItem(item._id || item.id, {...item, image: imageUrl});
        alert('Product Photo Uploaded ✅');
    }
}