// ========================================
// ACHAR DASHBOARD JS - V28 WORLD CLASS
// Common se juda: Orders = Order collection (Common checkout)
// Cart/Checkout = Common CartCore / HierarchyCheckout
// Upload = /api/shops/achar/upload -> Cloudinary URL only
// ========================================
let shopId = new URLSearchParams(window.location.search).get('shopId') || '';
let shopData = {}, allProducts = [], allOrders = [], currentEditId = null, productImageUrl = '';
let productFilter = 'All', orderFilter = 'all', manualQty = {};
let quickAddSelected = new Set();

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function toast(m){ const t = $('toast'); if(!t) return alert(m); t.textContent = m; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(()=> t.style.display = 'none', 2800); }
function shopUrl(){ return `${location.origin}/shop-templates/achar-shop/customer-view.html?shopId=${shopId}`; }
function to24(t){ if(!t) return '09:00'; if(t.includes('AM')||t.includes('PM')){ const [tm,mod]=t.split(' '); let [h,m]=(tm||'09:00').split(':'); if(h==='12') h='00'; if(mod==='PM') h=String(num(h)+12); return `${String(h).padStart(2,'0')}:${m||'00'}`; } return t; }
function to12(t){ if(!t) return '09:00 AM'; if(t.includes('AM')||t.includes('PM')) return t; let [h,m]=t.split(':'); h=num(h); const mod=h>=12?'PM':'AM'; h=h%12||12; return `${h}:${m||'00'} ${mod}`; }

// ---------- NAV ----------
function showPage(p){
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.dataset.page===p));
  document.querySelectorAll('.nav button[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page===p));
  const titles = { home:['Overview','Aaj ka hisaab, ek nazar me'], products:['Products','Search, stock, edit - sab yahin'], orders:['Orders','Common checkout se aaye orders'], wallet:['Earnings & Wallet','Hisaab Common Order se'], settings:['Settings','Timing aur contact'], profile:['Profile','Customer ko yehi dikhega'], location:['Location','Nearby customers ko shop dikhegi'] };
  if(titles[p]){ $('pageTitle').textContent = titles[p][0]; $('pageSub').textContent = titles[p][1]; }
  $('sidebar').classList.remove('open'); $('overlay').classList.remove('show');
  window.scrollTo({ top:0 });
}

document.addEventListener('DOMContentLoaded', () => {
  if(!shopId){ document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif"><h2>Shop ID nahi mila</h2><p>Dashboard ko Shop list se kholo - URL me ?shopId= hona chahiye.</p></div>'; return; }
  if($('shopIdDisplay')) $('shopIdDisplay').textContent = 'Shop ID: ' + shopId;
  document.querySelectorAll('.nav button[data-page]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.goto)));
  document.querySelectorAll('#orderChips .chip').forEach(b => b.addEventListener('click', () => { orderFilter = b.dataset.orderFilter; document.querySelectorAll('#orderChips .chip').forEach(x => x.classList.toggle('active', x===b)); renderOrders(); }));
  const bind = (id, fn) => { const e = $(id); if(e) e.addEventListener('click', fn); };
  bind('menuBtn', () => { $('sidebar').classList.add('open'); $('overlay').classList.add('show'); });
  bind('overlay', () => { $('sidebar').classList.remove('open'); $('overlay').classList.remove('show'); });
  bind('addAcharBtn', openAddModal); bind('addAcharBtn2', openAddModal);
  bind('quickAddBtn', openQuickAdd); bind('quickAddSaveBtn', saveQuickAdd);
  bind('newOrderBtn', openManualOrder); bind('moSaveBtn', saveManualOrder);
  bind('userViewBtn', () => location.href = shopUrl());
  bind('viewShopBtn', () => location.href = shopUrl());
  bind('shareBtn2', shareShop); bind('copyLinkBtn2', copyShopLink); bind('whatsappShareBtn', shareWhatsApp);
  bind('saveAnnouncement', saveAnnouncement); bind('saveProfileBtn', saveProfile);
  bind('saveTiming', saveTiming); bind('savePhone', savePhone);
  bind('saveLocationBtn', saveLocation); bind('loadLocationBtn', loadLocation);
  bind('shopToggle', toggleShop);
  bind('walletCommonBtn', () => location.href = `/shop-templates/common/wallet/wallet.html?shopId=${shopId}`);
  bind('notifBtn', () => showPage('orders'));
  const oi = $('ownerImg'), oin = $('ownerInput');
  if(oi && oin){ oi.addEventListener('click', () => oin.click()); }
  if(oin) oin.addEventListener('change', e => uploadOwnerPhoto(e.target.files[0]));
  const ob = $('ownerImgBig'); if(ob && oin) ob.addEventListener('click', () => oin.click());
  const pi = $('productImgPreview'), pin = $('productImageInput');
  if(pi && pin){ pi.addEventListener('click', () => pin.click()); pin.addEventListener('change', e => uploadProductPhoto(e.target.files[0])); }
  const sp = $('searchProduct'); if(sp) sp.addEventListener('input', () => renderInventory());
  init();
});

async function init(){ await loadShopData(); await loadCommonOrders(); renderAll(); }

// ---------- SHOP DATA ----------
async function loadShopData(){
  try{
    const res = await fetch(`/api/shops/achar/${shopId}`); const data = await res.json();
    if(!data.success) throw new Error(data.message || 'Load fail');
    shopData = data.shop || {};
    const name = shopData.ownerName ? `${shopData.ownerName} ki Dukaan` : (shopData.shopName || shopData.name || 'Achar Shop');
    $('shopName').textContent = name;
    const img = shopData.ownerPhotoUrl || 'https://placehold.co/100/d97706/fff?text=A';
    $('ownerImg').src = img; if($('ownerImgBig')) $('ownerImgBig').src = img;
    $('announcementInput').value = shopData.announcement || '';
    $('ownerNameInput').value = shopData.ownerName || '';
    $('profileAddressInput').value = shopData.shopAddress || shopData.fullAddress || shopData.address || '';
    $('bannerUrlInput').value = shopData.bannerPhotoUrl || '';
    $('shopPhoneInput').value = shopData.phone || '';
    $('openTime').value = to24(shopData.settings?.openTime || shopData.openTime || '09:00 AM');
    $('closeTime').value = to24(shopData.settings?.closeTime || shopData.closeTime || '09:00 PM');
    $('shopAddress').value = shopData.shopAddress || shopData.fullAddress || '';
    allProducts = shopData.items || [];
  }catch(e){ toast('Shop load fail: ' + e.message); }
}

// ---------- ORDERS - COMMON ORDER COLLECTION ----------
// Common checkout Order collection me banata hai, isliye yahin se aayega.
// Pehle V28 wala route, nahi mila toh server.js wala /api/orders/shop/:shopId
async function loadCommonOrders(){
  try{
    let res = await fetch(`/api/shops/achar/${shopId}/common-orders`);
    let d = await res.json().catch(()=>({}));
    if(res.ok && d.success && Array.isArray(d.data)){ allOrders = d.data; return; }
  }catch(e){}
  try{
    const res2 = await fetch(`/api/orders/shop/${shopId}`);
    const d2 = await res2.json().catch(()=>({}));
    const raw = d2.data || d2.orders || [];
    allOrders = raw.map(o => ({
      _id: String(o._id || o.orderId || ''), orderId: o.orderId || o.trackingId || ('ORD-' + String(o._id||'').slice(-6).toUpperCase()),
      customerName: o.deliveryAddress?.name || o.customerName || o.buyerId || 'Customer',
      phone: o.deliveryAddress?.phone || o.customerPhone || '',
      address: o.deliveryAddress?.full || o.deliveryAddress?.line1 || o.address || '',
      items: (o.items||[]).map(it => ({ name: it.name || it.title || 'Item', qty: num(it.qty||it.quantity||1), price: num(it.price||0), image: it.image||'', variant: it.variant||'' })),
      total: num(o.totalAmount||o.total||0), paymentMethod: o.paymentMethod || o.paymentMode || 'cod',
      status: o.orderStatus || o.status || 'placed', createdAt: o.createdAt
    }));
  }catch(e){ allOrders = []; }
}

function renderAll(){ renderStats(); renderHomeOrders(); renderInventory(); renderHomeProducts(); renderOrders(); renderLowStock(); renderWallet(); renderWeek(); }

function renderStats(){
  const today = new Date().toDateString();
  const tOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt).toDateString()===today);
  const tSale = tOrders.reduce((s,o)=> s + num(o.total), 0);
  const totalSale = allOrders.filter(o => o.status!=='cancelled').reduce((s,o)=> s + num(o.total), 0);
  const fee = Math.round(totalSale * 0.05);
  $('todaySale').textContent = tSale.toLocaleString('en-IN');
  $('todayOrdersLine').textContent = `${tOrders.length} orders today`;
  $('totalOrders').textContent = allOrders.length;
  $('totalProducts').textContent = allProducts.length;
  const low = allProducts.filter(p => num(p.stock) < 5).length;
  $('lowStockLine').textContent = `${low} low stock`;
  $('myEarning').textContent = (totalSale - fee).toLocaleString('en-IN');
  const pending = allOrders.filter(o => ['placed','confirmed','packed','out_for_delivery'].includes(o.status)).length;
  $('navPendingCount').textContent = pending;
  $('navOrderCount').textContent = allOrders.length;
  $('navProductCount').textContent = allProducts.length;
  if($('notifDot')) $('notifDot').style.display = pending > 0 ? 'block' : 'none';
  const tg = $('shopToggle'); if(tg){ tg.className = 'pill ' + (shopData.isOpen ? 'open' : 'closed'); }
  $('toggleText').textContent = shopData.isOpen ? 'Open' : 'Closed';
}

function statusBadge(s){
  const map = { placed:['Placed','amber'], confirmed:['Confirmed','grey'], packed:['Packed','grey'], out_for_delivery:['On Way','grey'], delivered:['Delivered','green'], cancelled:['Cancelled','red'] };
  const [label, cls] = map[s] || [s||'Placed','grey'];
  return `<span class="badge ${cls}">${label}</span>`;
}
function orderCard(o){
  const items = (o.items||[]).map(it => `${esc(it.name)} × ${num(it.qty)}`).join(', ') || 'Items';
  const nextMap = { placed:'confirmed', confirmed:'packed', packed:'out_for_delivery', out_for_delivery:'delivered' };
  const nextLabel = { placed:'✅ Confirm Karo', confirmed:'📦 Packed Karo', packed:'🛵 On Way Karo', out_for_delivery:'✔️ Delivered Karo' };
  const next = nextMap[o.status];
  const when = o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : '';
  return `<div class="row"><div class="mid"><b>Order ${esc(o.orderId)} • ₹${num(o.total).toLocaleString('en-IN')}</b><span>${esc(o.customerName)} • ${esc(o.phone)} • ${when}</span><span style="display:block;margin-top:3px">${items} • ${esc(o.paymentMethod||'cod').toUpperCase()}</span></div><div style="text-align:right">${statusBadge(o.status)}<div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">${next ? `<button class="btn green sm" onclick="changeOrderStatus('${esc(o._id)}','${esc(o.orderId)}','${next}')">${nextLabel[o.status]}</button>` : ''}${o.status!=='delivered' && o.status!=='cancelled' ? `<button class="btn red sm" onclick="changeOrderStatus('${esc(o._id)}','${esc(o.orderId)}','cancelled')">Cancel</button>` : ''}</div></div></div>`;
}
function renderHomeOrders(){ const el = $('homeOrders'); if(!el) return; const pending = allOrders.filter(o => ['placed','confirmed','packed','out_for_delivery'].includes(o.status)); if(!pending.length){ el.innerHTML = '<div class="empty">✅ Koi pending order nahi.<br>Customer jab checkout karega, yahan aayega.</div>'; return; } el.innerHTML = pending.slice(0,3).map(orderCard).join(''); }
function renderOrders(){ const el = $('orderList'); if(!el) return; const list = orderFilter==='all' ? allOrders : allOrders.filter(o => o.status===orderFilter); if(!list.length){ el.innerHTML = '<div class="empty">Is status me koi order nahi.</div>'; return; } el.innerHTML = list.map(orderCard).join(''); }

async function changeOrderStatus(orderId, orderCode, status){
  if(status==='cancelled' && !confirm('Ye order cancel karein?')) return;
  try{
    // 1. V28 wala route - Order collection pe status badlega
    let res = await fetch(`/api/shops/achar/${shopId}/common-orders/${encodeURIComponent(orderId)}/status`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    let d = await res.json().catch(()=>({}));
    if(!res.ok || !d.success){
      // 2. Fallback - orderId se try karo
      res = await fetch(`/api/shops/achar/${shopId}/common-orders/${encodeURIComponent(orderCode)}/status`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
      d = await res.json().catch(()=>({}));
      if(!res.ok || !d.success) throw new Error(d.message || 'Server me common-orders route nahi laga - FILE 3 me dunga');
    }
    toast('Order ' + status + ' ho gaya'); await loadCommonOrders(); renderAll();
  }catch(e){ toast('Status fail: ' + e.message); }
}

// ---------- PRODUCTS ----------
function productRow(p){
  const stock = num(p.stock);
  return `<div class="row"><img src="${esc(p.image)}" onerror="this.src='https://placehold.co/100/d97706/fff?text=A'"><div class="mid"><b>${esc(p.name)}</b><span>${esc(p.category)} • ${esc(p.spiceLevel)} • ${esc(p.jarType)} • 500g ₹${num(p.price500)} • 1Kg ₹${num(p.price1kg)}</span></div><div style="text-align:right"><span class="badge ${stock<=0?'red':stock<5?'amber':'green'}">${stock<=0?'Out of Stock':stock+' Kg'}</span><div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end;align-items:center"><div class="qbox"><button onclick="changeStock('${esc(p.id)}',-1)">−</button><span>${stock}</span><button onclick="changeStock('${esc(p.id)}',1)">+</button></div><button class="btn light sm" onclick="editProduct('${esc(p.id)}')">Edit</button><button class="btn red sm" onclick="deleteProduct('${esc(p.id)}')">Delete</button></div></div></div>`;
}
function renderHomeProducts(){ const el = $('homeProducts'); if(!el) return; if(!allProducts.length){ el.innerHTML = '<div class="empty">Abhi koi achar nahi.<br>Add Achar dabao.</div>'; return; } el.innerHTML = allProducts.slice(0,3).map(productRow).join(''); }
function renderInventory(){
  const q = ($('searchProduct')?.value || '').toLowerCase();
  const cats = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const ch = $('categoryChips'); if(ch) ch.innerHTML = cats.map(c => `<button class="chip ${productFilter===c?'active':''}" onclick="setProductFilter('${esc(c)}')">${esc(c)}</button>`).join('');
  let list = allProducts.filter(p => (p.name||'').toLowerCase().includes(q));
  if(productFilter!=='All') list = list.filter(p => p.category===productFilter);
  const el = $('inventoryList'); if(!el) return;
  if(!list.length){ el.innerHTML = '<div class="empty">Koi achar nahi mila.</div>'; return; }
  el.innerHTML = list.map(productRow).join('');
}
function setProductFilter(c){ productFilter = c; renderInventory(); }
function renderLowStock(){ const el = $('stockAlert'); if(!el) return; const low = allProducts.filter(p => num(p.stock) < 5); if(!low.length){ el.innerHTML = '<div class="empty">✅ Sab stock thik hai</div>'; return; } el.innerHTML = low.map(p => `<div class="row"><div class="mid"><b>${esc(p.name)}</b><span>${esc(p.category)}</span></div><span class="badge ${num(p.stock)<=0?'red':'amber'}">${num(p.stock)} Kg</span></div>`).join(''); }
async function changeStock(id, delta){
  const p = allProducts.find(x => x.id===id); if(!p) return;
  const next = Math.max(0, num(p.stock) + delta);
  try{
    const res = await fetch(`/api/shops/achar/${shopId}/item/${encodeURIComponent(id)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ item: { ...p, stock: next } }) });
    if(!res.ok) throw new Error('Save fail');
    p.stock = next; renderAll(); toast(`Stock: ${next} Kg`);
  }catch(e){ toast('Stock fail: ' + e.message); }
}

// ---------- ADD / EDIT ----------
function openAddModal(){
  currentEditId = null; productImageUrl = '';
  $('modalTitle').textContent = 'Naya Achar Add Karo'; $('addModal').classList.add('open');
  const set = (id,v) => { const e=$(id); if(e) e.value=v; };
  set('acharName',''); set('acharType','Aam'); set('acharDesc',''); set('acharJar','Glass'); set('acharSpice','Medium'); set('acharPrice1kg',''); set('acharPrice500g',''); set('acharStock','');
  $('productImgPreview').src = 'https://placehold.co/600/d97706/fff?text=Achar+Photo';
}
function closeAddModal(){ $('addModal').classList.remove('open'); }
async function saveNewAchar(){
  const data = { name: ($('acharName')?.value||'').trim(), category: $('acharType')?.value||'Aam', description: $('acharDesc')?.value||'', jarType: $('acharJar')?.value||'Glass', spiceLevel: $('acharSpice')?.value||'Medium', price500: num($('acharPrice500g')?.value), price1kg: num($('acharPrice1kg')?.value), stock: num($('acharStock')?.value), image: productImageUrl || 'https://placehold.co/400/d97706/fff?text=Achar' };
  if(!data.name) return toast('Achar ka naam likho');
  if(!data.price1kg || !data.price500) return toast('500g aur 1Kg dono price likho');
  try{
    const url = currentEditId ? `/api/shops/achar/${shopId}/item/${encodeURIComponent(currentEditId)}` : `/api/shops/achar/${shopId}/item`;
    const res = await fetch(url, { method: currentEditId?'PUT':'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ item: data }) });
    const r = await res.json().catch(()=>({})); if(!res.ok) throw new Error(r.message || 'Save fail');
    toast('✅ Achar save ho gaya'); closeAddModal(); await loadShopData(); renderAll();
  }catch(e){ toast('Save fail: ' + e.message); }
}
function editProduct(id){
  const p = allProducts.find(x => x.id===id); if(!p) return;
  currentEditId = id; productImageUrl = p.image || '';
  $('modalTitle').textContent = 'Achar Edit Karo'; $('addModal').classList.add('open');
  const set = (id2,v) => { const e=$(id2); if(e) e.value = v ?? ''; };
  set('acharName', p.name); set('acharType', p.category); set('acharDesc', p.description); set('acharJar', p.jarType); set('acharSpice', p.spiceLevel); set('acharPrice1kg', p.price1kg); set('acharPrice500g', p.price500); set('acharStock', p.stock);
  $('productImgPreview').src = p.image || '';
}
async function deleteProduct(id){ if(!confirm('Ye achar delete karein?')) return; try{ await fetch(`/api/shops/achar/${shopId}/item/${encodeURIComponent(id)}`, { method:'DELETE' }); toast('Achar delete ho gaya'); await loadShopData(); renderAll(); }catch(e){ toast('Delete fail'); } }

// ---------- QUICK ADD - ASLI WALA ----------
const QUICK_LIST = [
  ['Aam ka Achar', 'Aam', 150, 280], ['Nimbu ka Achar', 'Nimbu', 120, 220], ['Mix Achar', 'Mix', 130, 250],
  ['Gajar ka Achar', 'Gajar', 110, 200], ['Lahsun ka Achar', 'Lahsun', 180, 340], ['Mirchi ka Achar', 'Mirchi', 130, 240],
  ['Aam ka Murabba', 'Murabba', 160, 300], ['Adrak ka Achar', 'Other', 170, 320], ['Karela ka Achar', 'Other', 140, 260],
  ['Baingan ka Achar', 'Other', 130, 240], ['Kathal ka Achar', 'Other', 150, 280], ['Mango Pickle Special', 'Aam', 200, 380],
  ['Sweet Nimbu Achar', 'Nimbu', 140, 260], ['Teekha Mix Achar', 'Mix', 150, 280], ['Gud wala Aam Achar', 'Aam', 170, 320],
  ['Hari Mirchi Achar', 'Mirchi', 120, 220], ['Red Chilli Pickle', 'Mirchi', 160, 300], ['Garlic Chilli Pickle', 'Lahsun', 190, 360],
  ['Carrot Beetroot Achar', 'Gajar', 130, 240], ['Amla ka Achar', 'Other', 150, 280], ['Ker Sangri Achar', 'Other', 220, 420],
  ['Panchmel Achar', 'Mix', 140, 260], ['Bamboo Shoot Achar', 'Other', 180, 340], ['Jackfruit Pickle', 'Other', 160, 300],
  ['Mango Chunda', 'Aam', 180, 340], ['Lemon Chilli Pickle', 'Nimbu', 150, 280], ['Onion Pickle', 'Other', 110, 200],
  ['Cauliflower Achar', 'Other', 120, 220], ['Turnip Achar', 'Other', 120, 220], ['Green Mango Chutney Achar', 'Aam', 140, 260]
];
function openQuickAdd(){
  quickAddSelected = new Set();
  const existing = new Set(allProducts.map(p => (p.name||'').toLowerCase()));
  $('quickAddList').innerHTML = QUICK_LIST.map(([name, cat, p500, p1kg], i) => {
    const done = existing.has(name.toLowerCase());
    return `<label style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;margin:0;cursor:${done?'not-allowed':'pointer'}"><input type="checkbox" ${done?'disabled':''} onchange="toggleQuickAdd(${i}, this.checked)" style="width:18px;height:18px;accent-color:#d97706"><span style="flex:1;font-size:14px;font-weight:700">${esc(name)} <span style="font-size:11px;color:#64748b;font-weight:600">• ${esc(cat)}</span></span><span style="font-size:12px;font-weight:800">₹${p500} / ₹${p1kg}</span>${done?'<span class="badge green">Added</span>':''}</label>`;
  }).join('');
  $('quickAddCount').textContent = '0';
  $('quickAddModal').classList.add('open');
}
function toggleQuickAdd(i, checked){ if(checked) quickAddSelected.add(i); else quickAddSelected.delete(i); $('quickAddCount').textContent = quickAddSelected.size; }
function closeQuickAdd(){ $('quickAddModal').classList.remove('open'); }
async function saveQuickAdd(){
  if(!quickAddSelected.size) return toast('Pehle koi achar tick karo');
  toast(`${quickAddSelected.size} achar add ho raha hai...`);
  let ok = 0;
  for(const i of quickAddSelected){
    const [name, cat, p500, p1kg] = QUICK_LIST[i];
    try{
      const res = await fetch(`/api/shops/achar/${shopId}/item`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ item: { name, category: cat, description: 'Maa ke haath ka bana hua ' + name, jarType:'Glass', spiceLevel:'Medium', price500:p500, price1kg:p1kg, stock:10, image:'https://placehold.co/400/d97706/fff?text=' + encodeURIComponent(name) } }) });
      if(res.ok) ok++;
    }catch(e){}
  }
  toast(`✅ ${ok} achar add ho gaya`); closeQuickAdd(); await loadShopData(); renderAll();
}

// ---------- MANUAL ORDER - COMMON CHECKOUT ME JAYEGA ----------
function openManualOrder(){
  manualQty = {};
  allProducts.forEach(p => manualQty[p.id] = 0);
  renderManualItems();
  $('moName').value = ''; $('moPhone').value = ''; $('moAddress').value = ''; $('moPayment').value = 'cod';
  $('manualOrderModal').classList.add('open');
}
function closeManualOrder(){ $('manualOrderModal').classList.remove('open'); }
function renderManualItems(){
  const el = $('moItems'); if(!el) return;
  if(!allProducts.length){ el.innerHTML = '<p class="hint">Pehle koi achar add karo.</p>'; return; }
  el.innerHTML = allProducts.map(p => `<div class="row" style="padding:8px 0"><div class="mid"><b>${esc(p.name)}</b><span>1Kg ₹${num(p.price1kg)}</span></div><div class="qbox"><button onclick="manualChangeQty('${esc(p.id)}',-1)">−</button><span id="mo-qty-${esc(p.id)}">${manualQty[p.id]||0}</span><button onclick="manualChangeQty('${esc(p.id)}',1)">+</button></div></div>`).join('');
  updateManualTotal();
}
function manualChangeQty(id, d){ manualQty[id] = Math.max(0, (manualQty[id]||0) + d); const el = $('mo-qty-' + id); if(el) el.textContent = manualQty[id]; updateManualTotal(); }
function updateManualTotal(){ let t = 0; allProducts.forEach(p => t += (manualQty[p.id]||0) * num(p.price1kg)); $('moTotal').textContent = t.toLocaleString('en-IN'); return t; }
async function saveManualOrder(){
  const name = ($('moName')?.value||'').trim(), phone = ($('moPhone')?.value||'').replace(/\D/g,'').slice(-10), address = ($('moAddress')?.value||'').trim();
  if(!name) return toast('Customer ka naam likho');
  if(phone.length!==10) return toast('Phone 10 digit ka likho');
  const items = allProducts.filter(p => (manualQty[p.id]||0) > 0).map(p => ({ productId: `${p.id}__1kg`, name: `${p.name} (1Kg)`, price: num(p.price1kg), qty: manualQty[p.id], quantity: manualQty[p.id], image: p.image, variant: '1kg', shopId }));
  if(!items.length) return toast('Koi item select karo - + dabake');
  const total = updateManualTotal();
  try{
    // Common checkout - Order collection me banega, dashboard ke Orders me dikhega
    const res = await fetch(`/api/common/checkout/${encodeURIComponent(shopId)}/place`, { method:'POST', headers:{'Content-Type':'application/json','x-buyer-id':'manual_' + phone}, body: JSON.stringify({ shopId, supplierId: shopId, supplierRole:'shop_owner', buyerId:'manual_' + phone, buyerRole:'customer', items, total, totalAmount: total, paymentMethod: $('moPayment')?.value || 'cod', addressText: `${name} • ${phone} • ${address}`, deliveryAddress: { name, phone, full: `${name} • ${phone} • ${address}` } }) });
    const d = await res.json().catch(()=>({}));
    if(!res.ok || !d.success){
      // Fallback - purana Achar order route
      const r2 = await fetch(`/api/shops/achar/${shopId}/order`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items, total, customerName: name, phone, address }) });
      const d2 = await r2.json().catch(()=>({}));
      if(!r2.ok) throw new Error(d.message || d2.message || 'Order fail');
    }
    toast('✅ Order ban gaya'); closeManualOrder(); await loadCommonOrders(); renderAll(); showPage('orders');
  }catch(e){ toast('Order fail: ' + e.message); }
}

// ---------- WALLET / WEEK ----------
function renderWallet(){
  const valid = allOrders.filter(o => o.status!=='cancelled');
  const totalSale = valid.reduce((s,o)=> s + num(o.total), 0);
  const fee = Math.round(totalSale * 0.05);
  $('walletTotal').textContent = totalSale.toLocaleString('en-IN');
  $('walletFee').textContent = fee.toLocaleString('en-IN');
  $('walletEarn').textContent = (totalSale - fee).toLocaleString('en-IN');
  const pending = allOrders.filter(o => ['placed','confirmed','packed','out_for_delivery'].includes(o.status)).reduce((s,o)=> s + num(o.total), 0);
  const delivered = allOrders.filter(o => o.status==='delivered').reduce((s,o)=> s + num(o.total), 0);
  $('walletPending').textContent = pending.toLocaleString('en-IN');
  $('walletDelivered').textContent = delivered.toLocaleString('en-IN');
}
function renderWeek(){
  const el = $('weekList'); if(!el) return;
  let html = '';
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toDateString();
    const dayOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt).toDateString()===ds && o.status!=='cancelled');
    const sale = dayOrders.reduce((s,o)=> s + num(o.total), 0);
    html += `<div class="row"><div class="mid"><b>${i===0?'Aaj':d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</b><span>${dayOrders.length} orders</span></div><b>₹${sale.toLocaleString('en-IN')}</b></div>`;
  }
  el.innerHTML = html;
}

// ---------- SETTINGS / PROFILE / LOCATION ----------
async function toggleShop(){
  const isOpen = !shopData.isOpen;
  try{
    const res = await fetch(`/api/shops/achar/${shopId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isOpen }) });
    const d = await res.json().catch(()=>({})); if(!res.ok) throw new Error(d.message || 'Fail');
    // Common shop-toggle bhi try karo - hai toh sync ho jayega, nahi hai toh ignore
    try{ await fetch(`/api/common/shop-toggle/${shopId}/toggle`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isOpen, shopId }) }); }catch(e){}
    shopData.isOpen = isOpen; renderStats();
    toast(isOpen ? '✅ Shop Open ho gayi - customer order kar sakta hai' : '🔴 Shop Closed - ab order nahi aayega');
  }catch(e){ toast('Toggle fail: ' + e.message); }
}
async function saveAnnouncement(){ const announcement = $('announcementInput')?.value || ''; try{ await fetch(`/api/shops/achar/${shopId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ announcement }) }); shopData.announcement = announcement; toast('✅ Announcement save ho gaya'); }catch(e){ toast('Save fail'); } }
async function saveTiming(){
  const openTime = to12($('openTime')?.value || '09:00'), closeTime = to12($('closeTime')?.value || '21:00');
  try{ await fetch(`/api/shops/achar/${shopId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ openTime, closeTime, settings:{ openTime, closeTime } }) }); $('timingStatus').textContent = `✅ Timing save ho gayi: ${openTime} - ${closeTime}`; toast('✅ Timing save ho gayi'); }catch(e){ toast('Timing fail'); }
}
async function savePhone(){
  const phone = ($('shopPhoneInput')?.value||'').replace(/\D/g,'').slice(-10);
  if(phone.length!==10) return toast('Phone 10 digit ka likho');
  try{ await fetch(`/api/shops/achar/${shopId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) }); shopData.phone = phone; $('phoneStatus').textContent = '✅ Number save ho gaya'; toast('✅ Number save ho gaya'); }catch(e){ toast('Save fail'); }
}
async function saveProfile(){
  const ownerName = ($('ownerNameInput')?.value||'').trim(), shopAddress = ($('profileAddressInput')?.value||'').trim(), bannerPhotoUrl = ($('bannerUrlInput')?.value||'').trim();
  if(!ownerName && !shopAddress) return toast('Naam ya Address toh bharo');
  try{
    const res = await fetch(`/api/shops/achar/${shopId}/profile`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ownerName, shopAddress, fullAddress: shopAddress }) });
    const d = await res.json().catch(()=>({})); if(!d.success) throw new Error(d.message || 'Fail');
    if(bannerPhotoUrl) await fetch(`/api/shops/achar/${shopId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ bannerPhotoUrl }) });
    $('profileStatus').textContent = '✅ Profile save ho gaya'; await loadShopData(); renderAll(); toast('✅ Profile save ho gaya');
  }catch(e){ toast('Profile fail: ' + e.message); }
}
async function loadLocation(){ try{ const res = await fetch(`/api/shops/achar/${shopId}/location`); const d = await res.json(); if(d.success && d.data){ $('locationType').value = d.data.locationType || 'fixed'; $('deliveryRange').value = d.data.deliveryRange ?? 5; $('shopAddress').value = d.data.address || ''; $('locationStatus').textContent = '✅ Location pehle se set hai'; } else $('locationStatus').textContent = 'Location abhi set nahi hai.'; }catch(e){} }
async function saveLocation(){
  const st = $('locationStatus');
  try{
    if(!navigator.geolocation) throw new Error('GPS nahi mila - browser ko location permission do');
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy:true, timeout:10000 }));
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    const res = await fetch(`/api/shops/achar/${shopId}/location`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ lat, lng, type: $('locationType')?.value || 'fixed', range: num($('deliveryRange')?.value || 5), address: $('shopAddress')?.value || '' }) });
    const d = await res.json(); if(!d.success) throw new Error(d.message || 'Save fail');
    st.textContent = `✅ Saved! Lat:${lat.toFixed(4)} Lng:${lng.toFixed(4)}`; toast('✅ Location save ho gayi');
  }catch(e){ st.textContent = '❌ ' + e.message; toast('Location fail: ' + e.message); }
}

// ---------- UPLOAD ----------
async function uploadToAchar(file){
  if(!file) return null; if(file.size > 5*1024*1024){ toast('Photo 5MB se chhoti bhejo'); return null; }
  const fd = new FormData(); fd.append('image', file);
  const res = await fetch('/api/shops/achar/upload', { method:'POST', body: fd }); const d = await res.json().catch(()=>({}));
  if(!d.success || !d.url) throw new Error(d.message || 'Upload fail'); return d.url;
}
async function uploadOwnerPhoto(file){ if(!file) return; try{ const url = await uploadToAchar(file); $('ownerImg').src = url; if($('ownerImgBig')) $('ownerImgBig').src = url; await fetch(`/api/shops/achar/${shopId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ownerPhotoUrl: url }) }); toast('✅ Owner photo save ho gayi'); }catch(e){ toast('Upload fail: ' + e.message); } }
async function uploadProductPhoto(file){ if(!file) return; try{ const url = await uploadToAchar(file); productImageUrl = url; $('productImgPreview').src = url; }catch(e){ toast('Upload fail: ' + e.message); } }

// ---------- SHARE ----------
function shareShop(){
  const text = `${shopData.ownerName ? shopData.ownerName + ' ki Dukaan' : 'Maa Ke Haath Ka Achar'} - Ghar ka bana shuddh achar. Order karo: ${shopUrl()}`;
  if(navigator.share){ navigator.share({ title:'Achar Shop', text, url: shopUrl() }).catch(() => copyShopLink()); }
  else copyShopLink();
}
async function copyShopLink(){ try{ await navigator.clipboard.writeText(shopUrl()); toast('✅ Shop link copy ho gaya'); }catch(e){ prompt('Shop link copy karo:', shopUrl()); } }
function shareWhatsApp(){ const text = encodeURIComponent(`${shopData.ownerName ? shopData.ownerName + ' ki Dukaan' : 'Maa Ke Haath Ka Achar'} - Ghar ka bana shuddh achar 🥒\nOrder karo: ${shopUrl()}`); window.open(`https://wa.me/?text=${text}`, '_blank'); }