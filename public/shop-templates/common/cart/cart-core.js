// LOCATION: public/shop-templates/common/cart/cart-core.js - CART CORE - WORLD CLASS - NO LOCALSTORAGE - SERVER CART
class CartCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.shopType = new URLSearchParams(location.search).get('shopType') || new URLSearchParams(location.search).get('type') || '';
    this.api = '/api/common/cart';
    this.cart = { items: [], total: 0, itemCount: 0 };
    this.listeners = [];
    this.ready = this.load();
  }

  onChange(fn){ this.listeners.push(fn); }
  emit(){ this.listeners.forEach(fn => { try{ fn(this.cart); }catch(e){} }); this.renderCount(); }

  renderCount(){
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = this.cart.itemCount || 0;
      el.style.display = this.cart.itemCount > 0 ? 'grid' : 'none';
    });
    document.querySelectorAll('[data-cart-total]').forEach(el => {
      el.textContent = '₹' + (this.cart.total || 0);
    });
  }

  async req(path, options = {}){
    const res = await fetch(`${this.api}/${this.shopId}${path}`, {
      credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if(data.cart){ this.cart = data.cart; this.emit(); }
    return data;
  }

  async load(){
    if(!this.shopId) return this.cart;
    try{ await this.req('', { method: 'GET', headers: {} }); }catch(e){ console.error('Cart load failed', e); }
    return this.cart;
  }

  async add(product, qty = 1){
    if(!this.shopId){ alert('shopId missing - URL me ?shopId=xxx lagao'); return { success:false }; }
    if(!product) return { success:false };
    const p = {
      productId: product._id || product.productId || product.id,
      name: product.name,
      price: Number(product.price) || 0,
      mrp: Number(product.mrp) || 0,
      image: product.thumbnail || product.image || '',
      unit: product.unit || '',
      shopType: product.shopType || this.shopType,
      qty
    };
    if(!p.productId ||!p.name){ console.error('Product incomplete', product); return { success:false }; }
    return this.req('/add', { method: 'POST', body: JSON.stringify(p) });
  }

  async updateQty(productId, qty){
    return this.req('/update', { method: 'POST', body: JSON.stringify({ productId: String(productId), qty: Number(qty) }) });
  }

  async remove(productId){
    return this.req('/remove', { method: 'POST', body: JSON.stringify({ productId: String(productId) }) });
  }

  async clear(){
    return this.req('/clear', { method: 'POST', body: JSON.stringify({}) });
  }

  getQty(productId){
    const it = this.cart.items.find(i => i.productId === String(productId));
    return it? it.qty : 0;
  }

  goToCart(){
    location.href = `/shop-templates/common/cart/cart.html?shopId=${this.shopId}${this.shopType? '&shopType='+this.shopType : ''}`;
  }
  goToCheckout(){
    location.href = `/shop-templates/common/checkout/checkout.html?shopId=${this.shopId}${this.shopType? '&shopType='+this.shopType : ''}`;
  }
}

window.CartCore = new CartCore();
// Purane code ke liye short naam
window.addToCart = (product, qty=1) => window.CartCore.add(product, qty);
window.updateCartQty = (id, qty) => window.CartCore.updateQty(id, qty);
window.removeFromCart = (id) => window.CartCore.remove(id);