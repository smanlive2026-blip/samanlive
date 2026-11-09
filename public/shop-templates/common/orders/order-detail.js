// LOCATION: public/shop-templates/common/orders/order-detail.js - COMMON - V1 FINAL
// KAAM: Ek order ka pura detail dikhana + us role ka button dikhana jo uska kaam hai.
// Shop ko Accept/Reject dikhega, Area Manager ko Assign dikhega, Delivery Boy ko Pick/Delivered, Customer ko Track/Cancel.

(function () {
  const API_BASE = window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;

  function getHeaders() {
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) ||
      localStorage.getItem('TOKEN') || localStorage.getItem('token') || '';
    return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
  }

  // ===== 1. DETAIL LAANA =====
  async function load(orderId) {
    try {
      const res = await fetch(`${API_BASE}/api/common/orders/detail/${orderId}`, { headers: getHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Order nahi mila');
      return data.order;
    } catch (e) {
      console.error('OrderDetail load fail:', e.message);
      return null;
    }
  }

  // ===== 2. DETAIL KO HTML ME BHARNA =====
  // HTML me ye ID hone chahiye: orderIdText, orderStatusBadge, itemsList, totalText, addressText, actionBtns
  function render(order, role, myId) {
    if (!order) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

    set('orderIdText', '#' + order.orderId);
    set('orderDateText', new Date(order.createdAt).toLocaleString('en-IN'));
    set('orderStatusBadge', `<span class="badge b-${order.orderStatus}">${(order.orderStatus || 'placed').toUpperCase()}</span>`);
    set('paymentText', `${order.paymentMode || order.paymentMethod || 'cod'} • ${order.paymentStatus || 'pending'}`);
    set('totalText', '₹' + (order.totalAmount || order.total || 0));
    set('commissionText', '₹' + (order.commissionAmount || 0));
    set('earningText', '₹' + (order.supplierEarning || 0));

    // Address
    const a = order.deliveryAddress || {};
    set('addressText', `${a.name || ''} • ${a.phone || ''}<br>${a.full || a.line1 || ''} ${a.line2 || ''}<br>${a.city || ''} ${a.state || ''} - ${a.pincode || ''}`);

    // Items
    set('itemsList', (order.items || []).map(i => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">
        <span>${i.image ? `<img src="${i.image}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:8px">` : ''}${i.name} x ${i.qty || i.quantity || 1}</span>
        <b>₹${(i.price || 0) * (i.qty || i.quantity || 1)}</b>
      </div>
    `).join(''));

    // Delivery Boy
    set('deliveryBoyText', order.deliveryBoyId ? `Assigned: ${order.deliveryBoyId}` : 'Abhi assign nahi hua');

    // Buttons - Jo jiska kaam hai
    let btns = '';
    if (role === 'shop_owner') {
      if (order.orderStatus === 'placed') btns = `
        <button class="btn-accept" onclick="OrderDetail.change('${order.orderId}','confirmed')">✓ Accept</button>
        <button class="btn-reject" onclick="OrderDetail.change('${order.orderId}','cancelled')">✕ Reject</button>`;
      if (order.orderStatus === 'confirmed') btns = `<button class="btn-pack" onclick="OrderDetail.change('${order.orderId}','packed')">📦 Pack Kar Diya</button>`;
    }
    if (role === 'area-manager' && order.orderStatus === 'packed') {
      btns = `<button class="btn-assign" onclick="OrderDetail.assignPrompt('${order.orderId}')">🛵 Delivery Boy Assign</button>`;
    }
    if (role === 'delivery_boy') {
      if (order.orderStatus === 'assigned') btns = `<button class="btn-pick" onclick="OrderDetail.change('${order.orderId}','picked')">Pick Kar Liya</button>`;
      if (order.orderStatus === 'picked') btns = `<button class="btn-deliver" onclick="OrderDetail.change('${order.orderId}','delivered')">✅ Deliver Ho Gaya</button>`;
    }
    if (role === 'customer' && order.orderStatus === 'placed') {
      btns = `<button class="btn-reject" onclick="OrderDetail.change('${order.orderId}','cancelled')">Cancel Order</button>`;
    }
    set('actionBtns', btns ? `<div class="btns">${btns}</div>` : '<p style="font-size:12px;color:#94a3b8">Is stage pe tumhara koi kaam nahi hai.</p>');
  }

  // ===== 3. STATUS BADALNA =====
  async function change(orderId, newStatus) {
    const role = window.ORDER_ROLE || new URLSearchParams(location.search).get('role') || 'shop_owner';
    const myId = window.ORDER_MY_ID || new URLSearchParams(location.search).get('id') || '';
    if (!confirm('Pakka ' + newStatus + ' karna hai?')) return null;
    const res = await fetch(`${API_BASE}/api/common/orders/${orderId}/status`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ role, userId: myId, newStatus })
    });
    const data = await res.json();
    if (!data.success) { alert(data.message || 'Fail ho gaya'); return null; }
    // Page reload karke naya status dikhao
    const fresh = await load(orderId);
    if (fresh) render(fresh, role, myId);
    return data;
  }

  // ===== 4. ASSIGN PROMPT =====
  async function assignPrompt(orderId) {
    const boyId = prompt('Delivery Boy ID daalo:');
    if (!boyId) return;
    const res = await fetch(`${API_BASE}/api/common/orders/${orderId}/assign`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ deliveryBoyId: boyId })
    });
    const data = await res.json();
    if (!data.success) return alert(data.message || 'Fail');
    const fresh = await load(orderId);
    const role = window.ORDER_ROLE || 'area-manager';
    if (fresh) render(fresh, role, '');
  }

  // ===== 5. AUTO INIT - order-detail.html khulte hi chalega =====
  async function init() {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId') || params.get('id') || window.ORDER_ID;
    if (!orderId) return;
    const role = params.get('role') || 'shop_owner';
    const myId = params.get('myId') || params.get('id2') || params.get('shopId') || '';
    window.ORDER_ROLE = role;
    window.ORDER_MY_ID = myId;
    const order = await load(orderId);
    if (order) render(order, role, myId);
    else {
      const el = document.getElementById('itemsList');
      if (el) el.innerHTML = '<p style="text-align:center;color:#ef4444">Order nahi mila</p>';
    }
  }

  window.OrderDetail = { load, render, change, assignPrompt, init };

  // Page load hote hi chal jaye
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  console.log('✅ OrderDetail loaded');
})();