// LOCATION: public/shop-templates/common/orders/orders.js - COMMON - V1 FINAL - Sab Dashboard Isi Ko Bulayenge
// RULE: Isme koi dashboard ka design nahi hoga, sirf function hoga.
// Kirana / Dairy / Patanjali / Sports - Sabka dashboard isi ko bulayega.
// ROLE WISE: Jo jiska kaam hai, wahi API call hogi. Koi dusre ka order nahi dekh payega.

(function () {
  // ===== BASE URL - Har jagah se chalega =====
  const API_BASE = window.API_BASE || window.EnvConfig?.API_BASE || window.location.origin;

  // ===== HELPER - Token + BuyerId =====
  function getHeaders() {
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) ||
      localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // ===== 1. LIST - Har Role Ko Uska Hissa Hi Milega =====
  // CommonOrders.list('shop_owner', 'SHOP_ID')
  // CommonOrders.list('customer', 'BUYER_ID')
  // CommonOrders.list('area-manager', 'AREA_ID')
  // CommonOrders.list('delivery_boy', 'BOY_ID')
  // CommonOrders.list('executive', '')
  // CommonOrders.list('admin', '')
  async function list(role, id, status = '') {
    try {
      const q = new URLSearchParams({ role: role || 'shop_owner', id: id || '' });
      if (status) q.set('status', status);
      const res = await fetch(`${API_BASE}/api/common/orders/list?${q}`, { headers: getHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Order list fail');
      return data.orders || [];
    } catch (e) {
      console.error('CommonOrders.list fail:', e.message);
      return [];
    }
  }

  // ===== 2. DETAIL - Ek Order Ka Pura Detail =====
  async function detail(orderId) {
    const res = await fetch(`${API_BASE}/api/common/orders/detail/${orderId}`, { headers: getHeaders() });
    return await res.json();
  }

  // ===== 3. ORDER BANANA - Customer / Bulk Wala =====
  // CommonOrders.create({ buyerId, buyerRole, supplierId, supplierRole, items, totalAmount, deliveryAddress, paymentMode })
  async function create(payload) {
    const res = await fetch(`${API_BASE}/api/common/orders/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  // ===== 4. STATUS BADALNA - Role Check Backend Me Bhi Hai =====
  // Shop: confirmed / cancelled / packed
  // Area Manager: assigned (alag function se)
  // Delivery Boy: picked / delivered
  // Customer: cancelled (sirf placed me)
  async function changeStatus(orderId, role, userId, newStatus) {
    const res = await fetch(`${API_BASE}/api/common/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role, userId, newStatus })
    });
    return await res.json();
  }

  // ===== 5. AREA MANAGER - DELIVERY BOY ASSIGN =====
  async function assign(orderId, deliveryBoyId) {
    const res = await fetch(`${API_BASE}/api/common/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ deliveryBoyId })
    });
    return await res.json();
  }

  // ===== 6. TRACK - Customer Ke Liye =====
  async function track(orderId) {
    const res = await fetch(`${API_BASE}/api/common/orders/track/${orderId}`, { headers: getHeaders() });
    return await res.json();
  }

  // ===== 7. COUNT - Dashboard Ke Liye Chhota Badge =====
  // CommonOrders.count('shop_owner', 'SHOP_ID', 'placed') => 5
  async function count(role, id, status = '') {
    const orders = await list(role, id, status);
    return orders.length;
  }

  // ===== PUBLIC API - Bahar Se Yahi Dikhega =====
  window.CommonOrders = {
    list,
    detail,
    create,
    changeStatus,
    assign,
    track,
    count
  };

  console.log('✅ CommonOrders loaded - Common Function Ready');
})();