// LOCATION: public/shop-templates/sports/dashboard.js - V5 WORLD CLASS - FULL CODE
const params = new URLSearchParams(location.search);
const shopId = params.get('shopId') || params.get('id') || localStorage.getItem('last_sports_shopId') || '';

if (shopId) localStorage.setItem('last_sports_shopId', shopId);

let allProducts = [];
let shopData = null;

// Elements
const els = {
  shopName: document.getElementById('shopName'),
  shopIdDisplay: document.getElementById('shopIdDisplay'),
  items: document.getElementById('items'),
  sale: document.getElementById('sale'),
  revenue: document.getElementById('revenue'),
  jersey: document.getElementById('jersey'),
  prodCount: document.getElementById('prodCount'),
  inventoryList: document.getElementById('inventoryList'),
  lowStock: document.getElementById('lowStock'),
  categories: document.getElementById('categories'),
  searchInput: document.getElementById('searchInput'),
  toggleSwitch: document.getElementById('toggleSwitch'),
  toggleText: document.getElementById('toggleText'),
  toast: document.getElementById('toast')
};

// INIT
if (!shopId) {
  alert('shopId missing in URL! Add?shopId=YOUR_ID');
} else {
  if (els.shopIdDisplay) els.shopIdDisplay.innerText = `ID: ${shopId.slice(-6)}`;
  loadShopData();
}

function toast(msg) {
  if (!els.toast) return alert(msg);
  els.toast.innerText = msg;
  els.toast.style.display = 'block';
  setTimeout(() => els.toast.style.display = 'none', 3000);
}

async function loadShopData() {
  try {
    const res = await fetch(`/api/shops/sports/${shopId}?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to load');

    shopData = data.shop;
    const products = shopData.products || shopData.items || [];
    allProducts = products;

    // Update header
    if (els.shopName) els.shopName.innerHTML = `<i class="fa fa-trophy"></i> ${shopData.settings?.shopName || shopData.shopName || 'Sports World'}`;

    // Stats
    if (els.items) els.items.innerText = products.length;
    if (els.prodCount) els.prodCount.innerText = `(${products.length})`;
    if (els.sale) els.sale.innerText = shopData.stats?.todaySale || shopData.stats?.totalOrders || 0;
    if (els.revenue) els.revenue.innerText = shopData.stats?.revenue || 0;
    if (els.jersey) els.jersey.innerText = shopData.stats?.jerseyOrders || products.filter(p => (p.category||'').toLowerCase().includes('jersey')).length;

    // Toggle
    const isOpen = shopData.settings?.isOpen?? true;
    if (els.toggleSwitch) els.toggleSwitch.className = `switch ${isOpen? 'on' : ''}`;
    if (els.toggleText) els.toggleText.innerText = isOpen? 'Open' : 'Closed';

    renderProducts(products);
    renderLowStock(data.shop.lowStock || products.filter(p => p.stock <= 5));
    renderCategories();

  } catch (err) {
    console.error(err);
    if (els.inventoryList) {
      els.inventoryList.innerHTML = `<div style="grid-column:1/-1;padding:30px;text-align:center;color:#ef4444">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:24px"></i><br><br>
        <b>Error loading shop</b><br><small>${err.message}</small><br><br>
        <small>Check: server.js me route hai kya?<br><code>app.use('/api/shops/sports', require('./routes/shops/sports-route'))</code></small>
      </div>`;
    }
  }
}

function renderProducts(list) {
  if (!els.inventoryList) return;
  if (!list.length) {
    els.inventoryList.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
        <div style="font-size:60px">🏏</div>
        <h3 style="margin-top:10px;font-weight:900">No items yet</h3>
        <p style="color:#94a3b8;font-size:13px;margin-top:6px">Click <b style="color:#f97316">Quick Add</b> or <b>Add Item</b> to add products</p>
      </div>`;
    return;
  }

  els.inventoryList.innerHTML = list.map(p => `
    <div class="p-card">
      <img src="${p.image || `https://source.unsplash.com/400x300/?${encodeURIComponent(p.category || 'sports')},${encodeURIComponent(p.name.split(' ')[0])}`}"
           onerror="this.src='https://placehold.co/400/f97316/fff?text=${encodeURIComponent(p.name.slice(0,12))}'">
      <div class="p-info">
        <b>${p.name}</b>
        <div class="meta">${p.brand || 'Generic'} • ${p.category || 'General'} ${p.size? '• Size: '+p.size : ''}</div>
        <div class="price-row">
          <div class="price">₹${p.price}
            ${p.mrp && p.mrp > p.price? `<small style="text-decoration:line-through;color:#94a3b8;margin-left:4px">₹${p.mrp}</small>` : ''}
            <br><span class="brand-badge">${p.brand || 'Sports'}</span>
          </div>
          <div class="stock ${p.stock <= 5? 'low' : 'ok'}">${p.stock} LEFT</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button onclick="editProduct('${p._id}')" style="flex:1;background:#f1f5f9;border:1px solid #e2e8f0;padding:8px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button onclick="deleteProduct('${p._id}')" style="width:40px;background:#fff;border:1px solid #fee2e2;color:#ef4444;border-radius:10px;cursor:pointer">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderLowStock(list) {
  if (!els.lowStock) return;
  if (!list.length) {
    els.lowStock.innerHTML = `<div style="background:#f0fdf4;color:#166534;padding:12px;border-radius:12px;font-weight:800;font-size:13px;text-align:center">✓ All Stock OK</div>`;
    return;
  }
  els.lowStock.innerHTML = list.slice(0, 6).map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:8px">
      <div><b style="font-size:13px">${p.name}</b><br><small style="color:#92400e;font-size:11px">${p.category || ''}</small></div>
      <span style="background:#92400e;color:#fff;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:900">${p.stock}</span>
    </div>
  `).join('');
}

function renderCategories() {
  if (!els.categories) return;
  const cats = [...new Set(allProducts.map(p => p.category || 'General'))];
  if (!cats.length) {
    els.categories.innerHTML = `<p style="color:#94a3b8;font-size:12px">No categories yet</p>`;
    return;
  }
  els.categories.innerHTML = cats.map(cat => {
    const count = allProducts.filter(p => (p.category || 'General') === cat).length;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f8fafc">
      <span style="font-weight:700;font-size:13px">${cat}</span>
      <span style="background:#f1f5f9;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800">${count}</span>
    </div>`;
  }).join('');
}

// Search - NEW WALA (ye chalega)
if (els.searchInput) {
  els.searchInput.addEventListener('input', () => {
    const q = els.searchInput.value.toLowerCase();
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    );
    renderProducts(filtered);
  });
}

// Search - OLD WALA (tera wala hi rakha hai, delete nahi kiya)
window.filter = function() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
  renderProducts(filtered);
}

window.editProduct = function(id) {
  location.href = `/shop-templates/sports/product-form.html?shopId=${shopId}&editId=${id}`;
}

window.deleteProduct = async function(id) {
  if (!confirm('Delete this item?')) return;
  try {
    const res = await fetch(`/api/shops/sports/${shopId}/item/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast('Deleted successfully');
      loadShopData();
    } else {
      toast('Delete failed: ' + data.message);
    }
  } catch (e) {
    toast('Error: ' + e.message);
  }
}

window.toggleShop = async function() {
  if (!els.toggleSwitch) return;
  const isOpen =!els.toggleSwitch.classList.contains('on');
  els.toggleSwitch.classList.toggle('on', isOpen);
  if (els.toggleText) els.toggleText.innerText = isOpen? 'Open' : 'Closed';

  try {
    await fetch(`/api/shops/sports/${shopId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen })
    });
    toast(isOpen? 'Shop Opened' : 'Shop Closed');
  } catch (e) {
    toast('Failed to update status');
  }
}

window.goForm = function() {
  location.href = `/shop-templates/sports/product-form.html?shopId=${shopId}`;
}

window.goQuick = function() {
  location.href = `/shop-templates/sports/product-form.html?shopId=${shopId}&quick=1`;
}

window.viewShop = function() {
  window.open(`/shop-templates/sports/user-view.html?shopId=${shopId}`, '_blank');
}

// For old buttons id
document.getElementById('addItemBtn')?.addEventListener('click', () => window.goForm());
document.getElementById('newSaleBtn')?.addEventListener('click', () => window.viewShop());