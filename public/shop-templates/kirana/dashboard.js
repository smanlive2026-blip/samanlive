// LOCATION: public/shop-templates/kirana/dashboard.js
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId') || urlParams.get('id');
if(!shopId) document.body.innerHTML = '<h2 style="padding:20px">Shop ID Missing! URL me ?shopId= lagao</h2>';
window.shopId = shopId;

const shopIdDisplay = document.getElementById('shopIdDisplay');
if(shopIdDisplay) shopIdDisplay.innerText = shopId ? shopId.slice(0,8)+'...' : 'NO-ID';

let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  loadKiranaData();
  document.getElementById('addProductBtn')?.addEventListener('click', () => {
    window.location.href = `/shop-templates/kirana/product-form.html?shopId=${shopId}`;
  });
  document.getElementById('quickAddBtn')?.addEventListener('click', () => {
    window.location.href = `/shop-templates/kirana/product-form.html?shopId=${shopId}&quick=1`;
  });
  document.getElementById('viewShopBtn')?.addEventListener('click', () => {
    window.open(`/shop-templates/kirana/user-view.html?shopId=${shopId}`, '_blank');
  });
});

async function loadKiranaData(){
  try{
    const res = await fetch(`/api/shops/kirana/${shopId}`, {cache:'no-store'});
    const result = await res.json();
    if(!result.success) throw new Error(result.message);
    const shop = result.shop;
    
    document.getElementById('shopName').innerText = shop.settings?.shopName || shop.shopName || 'Kirana Store';
    document.getElementById('productCount').innerText = shop.products?.length || 0;
    document.getElementById('prodCountText') && (document.getElementById('prodCountText').innerText = `(${shop.products?.length||0})`);
    document.getElementById('lowStockCount').innerText = shop.lowStock?.length || 0;
    document.getElementById('revenue').innerText = shop.stats?.revenue || 0;
    document.getElementById('orderCount').innerText = shop.stats?.totalOrders || 0;

    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleText = document.getElementById('toggleText');
    if(toggleSwitch){
      const isOpen = shop.settings?.isOpen ?? true;
      toggleSwitch.classList.toggle('on', isOpen);
      toggleSwitch.classList.toggle('off', !isOpen);
      if(toggleText) toggleText.innerText = isOpen? 'Open' : 'Closed';
    }

    allProducts = shop.products || [];
    loadProducts(allProducts);
    loadLowStock(shop.lowStock || []);
  }catch(e){
    console.error("Kirana Load Error:", e);
    document.getElementById('productList').innerHTML = `<p style="color:red;padding:20px">Error: ${e.message}</p>`;
  }
}

function loadProducts(products){
  const container = document.getElementById('productList');
  if(!container) return;
  if(!products.length){
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8"><i class="fa-solid fa-basket-shopping" style="font-size:40px;margin-bottom:10px;display:block"></i>No products yet<br><b style="color:#16a34a">Quick Add</b> se 100 products ek click me jodo</div>`;
    return;
  }
  container.innerHTML = products.map(p => `
    <div class="product-box">
      <img src="${p.image || 'https://placehold.co/400/16a34a/fff?text='+encodeURIComponent(p.name.slice(0,12))}" loading="lazy">
      <div class="p">
        <b>${p.name}</b>
        <small>${p.brand || ''} • ${p.weight||''} ${p.unit||''} • ${p.category||''}</small>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span style="font-weight:800;color:#0f172a">₹${p.price} <small style="color:#94a3b8;text-decoration:line-through">${p.mrp? '₹'+p.mrp: ''}</small></span>
          <span style="font-size:11px;color:${p.stock <= (p.lowStockLimit||10) ? '#ef4444':'#16a34a'};font-weight:700">${p.stock} ${p.unit}</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button onclick="editProduct('${p._id}')" style="flex:1;background:#0f172a;color:#fff;border:none;padding:7px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer"><i class="fa fa-pen"></i> Edit</button>
          <button onclick="deleteProduct('${p._id}')" style="background:#fee2e2;color:#dc2626;border:none;padding:7px 10px;border-radius:8px;cursor:pointer"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function loadLowStock(products){
  const container = document.getElementById('lowStock');
  if(!container) return;
  if(!products.length){
    container.innerHTML = `<p style="color:#16a34a;font-weight:700;font-size:13px"><i class="fa fa-check"></i> All Stock OK ✓</p>`; return;
  }
  container.innerHTML = products.slice(0,6).map(p => `
    <div style="background:#fef3c7;padding:10px 12px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;font-size:13px">
      <div><b>${p.name}</b><br><small style="color:#92400e">${p.category||''}</small></div>
      <span style="background:#92400e;color:#fff;padding:4px 8px;border-radius:20px;font-weight:800;font-size:11px">${p.stock} LEFT</span>
    </div>
  `).join('');
}

function filterProducts(){
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q));
  loadProducts(filtered);
}

async function deleteProduct(id){
  if(!confirm('Ye product delete karna hai?')) return;
  try{
    const res = await fetch(`/api/shops/kirana/${shopId}/item/${id}`, {method:'DELETE', cache:'no-store'});
    const data = await res.json();
    if(data.success) loadKiranaData(); else alert('Delete fail');
  }catch(e){ alert(e.message) }
}

function editProduct(id){
  window.location.href = `/shop-templates/kirana/product-form.html?shopId=${shopId}&editId=${id}`;
}

window.loadKiranaData = loadKiranaData;
window.filterProducts = filterProducts;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;