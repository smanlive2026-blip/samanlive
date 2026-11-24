// LOCATION: public/shop-templates/common/components/product-card.js - V2 DOUBLE CART FIX
// KAAM: Sirf card dikhana + Add / Wishlist / QuickView dabane pe sahi wali Core ko bulana.
// RULE: Ye apna alag cart kabhi nahi banayega. Cart ka kaam sirf CartCore ka hai.
// RULE: Ye apni alag wishlist kabhi nahi banayega. Wishlist ka kaam sirf WishlistCore / Wishlist API ka hai.
// RULE: Ye apna alag paisa / total kabhi nahi ginega. Total CartCore ginega.

class ProductCardRenderer {
  constructor() {
    this.shopId = new URLSearchParams(location.search).get('shopId') || window.__SAMAN_SHOP_ID || '';
  }

  getShopId() {
    return new URLSearchParams(location.search).get('shopId') || window.__SAMAN_SHOP_ID || this.shopId || '';
  }

  getBuyerId() {
    if (window.__SAMAN_GUEST_ID) return window.__SAMAN_GUEST_ID;
    if (window.CartCore && window.CartCore.getBuyerId) { try { var b = window.CartCore.getBuyerId(); if (b) return b; } catch (e) {} }
    if (window.RoleHierarchy && window.RoleHierarchy.getMyId) { try { var r = window.RoleHierarchy.getMyId(); if (r) return r; } catch (e) {} }
    var gid = 'guest_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    window.__SAMAN_GUEST_ID = gid;
    return gid;
  }

  getApiBase() {
    return window.API_BASE || window.location.origin;
  }

  getHeaders() {
    var token = '';
    try { if (window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; } catch (e) {}
    if (!token) token = window.USER_TOKEN || '';
    var h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  calculateDiscount(price, mrp) {
    price = Number(price || 0);
    mrp = Number(mrp || 0);
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }

  // Card ka HTML - sirf dikhane ke liye, isme koi cart ka hisaab nahi hai
  render(product, options) {
    options = options || {};
    var showCategory = options.showCategory !== false;
    var showRating = options.showRating !== false;
    var showWishlist = options.showWishlist !== false;
    var pid = product._id || product.productId || product.id || '';
    var name = product.name || product.productName || product.title || 'Product';
    var img = product.image || product.thumbnail || product.images && product.images[0] || 'https://via.placeholder.com/300';
    if (Array.isArray(img)) img = img[0] || 'https://via.placeholder.com/300';
    var price = Number(product.price || 0);
    var mrp = Number(product.mrp || product.originalPrice || 0);
    var stock = product.stock;
    if (stock === undefined) stock = product.quantity;
    var isOut = (stock !== undefined && Number(stock) <= 0) || product.outOfStock === true;
    var isBest = product.bestseller || product.isBestseller || (product.totalSales && product.totalSales > 50);
    var discount = this.calculateDiscount(price, mrp);
    var rating = product.rating || product.avgRating || 4.5;
    var ratingCount = product.ratingCount || product.reviewsCount || product.totalReviews || 0;
    var category = product.category || product.categoryName || '';
    var safePid = this.esc(pid);
    var safeName = this.esc(name);
    var html = '';
    html += '<div class="product-card" data-product-id="' + safePid + '" data-product-card="1">';
    html += '<div class="product-image-wrap">';
    html += '<img class="product-image" src="' + this.esc(img) + '" alt="' + safeName + '" loading="lazy" data-zoom-img="' + this.esc(img) + '">';
    html += '<div class="product-image-overlay"></div>';
    if (showWishlist) html += '<button class="product-wishlist-btn" data-wishlist-btn="' + safePid + '" title="Wishlist"><span class="wish-icon">♡</span></button>';
    if (discount > 0) html += '<span class="product-badge discount">' + discount + '% OFF</span>';
    if (isOut) html += '<span class="product-badge out-of-stock">Out of Stock</span>';
    if (isBest && !isOut) html += '<span class="product-badge bestseller">🔥 Bestseller</span>';
    html += '<div class="product-quick-actions">';
    html += '<button class="quick-action-btn" data-quick-view="' + safePid + '" title="Quick View">👁️</button>';
    html += '<button class="quick-action-btn" data-share-product="' + safePid + '" title="Share">↗️</button>';
    html += '</div></div>';
    html += '<div class="product-info">';
    if (showCategory && category) html += '<div class="product-category">' + this.esc(category) + '</div>';
    html += '<b class="product-name">' + safeName + '</b>';
    if (showRating) html += '<div class="product-rating"><span class="stars">⭐ ' + rating + '</span><span class="rating-count">(' + ratingCount + ')</span></div>';
    html += '<div class="product-pricing"><b class="product-price">₹' + price + '</b>';
    if (mrp > price) html += '<span class="product-mrp">₹' + mrp + '</span>';
    html += '</div>';
    if (isOut) {
      html += '<button class="product-add-btn" disabled>Out of Stock</button>';
    } else {
      html += '<button class="product-add-btn" data-add="' + safePid + '"><span class="add-icon">🛒</span><span class="add-text">Add to Cart</span></button>';
    }
    html += '</div></div>';
    return html;
  }

  // Card ka data - DOM se uthao, dobara API mat maaro
  readProductFromCard(card) {
    if (!card) return null;
    var pid = card.getAttribute('data-product-id') || '';
    var nameEl = card.querySelector('.product-name');
    var imgEl = card.querySelector('.product-image');
    var priceEl = card.querySelector('.product-price');
    var mrpEl = card.querySelector('.product-mrp');
    var price = 0;
    var mrp = 0;
    if (priceEl) price = Number(String(priceEl.textContent || '').replace(/[^0-9.]/g, '')) || 0;
    if (mrpEl) mrp = Number(String(mrpEl.textContent || '').replace(/[^0-9.]/g, '')) || 0;
    return {
      _id: pid, productId: pid, id: pid,
      name: nameEl ? nameEl.textContent.trim() : 'Product',
      price: price, mrp: mrp,
      image: imgEl ? imgEl.getAttribute('src') || '' : '',
      thumbnail: imgEl ? imgEl.getAttribute('src') || '' : '',
      shopId: this.getShopId(), supplierId: this.getShopId()
    };
  }

  // ADD - Seedha CartCore ko bulao, apna cart mat banao
  async addToCart(productId, qty) {
    qty = qty || 1;
    var card = document.querySelector('[data-product-id="' + productId + '"]');
    var product = this.readProductFromCard(card);
    if (!product) {
      // Card nahi mila toh khaali product se bhi CartCore ko bula do, wo khud sambhal lega
      product = { _id: productId, productId: productId, id: productId, name: 'Product', price: 0, shopId: this.getShopId(), supplierId: this.getShopId() };
    }
    try {
      if (window.SamanComponents && window.SamanComponents.loader) window.SamanComponents.loader(true, 'Cart me daal rahe hain...');
      if (window.CartCore && window.CartCore.add) {
        await window.CartCore.add(product, qty);
      } else if (window.CartCore && window.CartCore.addItem) {
        await window.CartCore.addItem(product, qty);
      } else {
        // CartCore nahi mila toh cart page pe bhej do, alag cart mat banao
        window.location.href = '../common/cart/cart.html?shopId=' + encodeURIComponent(this.getShopId()) + '&productId=' + encodeURIComponent(productId);
        return;
      }
      if (window.SamanComponents && window.SamanComponents.toast) window.SamanComponents.toast(product.name + ' cart me aa gaya');
      else if (window.Toast && window.Toast.show) window.Toast.show(product.name + ' cart me aa gaya', 'success');
      if (navigator.vibrate) navigator.vibrate(20);
      window.dispatchEvent(new CustomEvent('saman:cart-added', { detail: { productId: productId, qty: qty } }));
    } catch (e) {
      if (window.SamanComponents && window.SamanComponents.toast) window.SamanComponents.toast('Add nahi hua, dobara try karo', 'error');
    } finally {
      if (window.SamanComponents && window.SamanComponents.loader) window.SamanComponents.loader(false);
    }
  }

  // QTY - Seedha CartCore ko bulao
  async updateCartQty(productId, change) {
    try {
      if (window.CartCore && window.CartCore.updateQty) {
        var card = document.querySelector('[data-product-id="' + productId + '"]');
        var countEl = card ? card.querySelector('.qty-count') : null;
        var cur = countEl ? Number(countEl.textContent || 1) : 1;
        var next = cur + change;
        if (next <= 0) {
          if (window.CartCore.removeItem) await window.CartCore.removeItem(productId);
          else if (window.CartCore.remove) await window.CartCore.remove(productId);
        } else {
          await window.CartCore.updateQty(productId, next);
        }
        if (countEl && next > 0) countEl.textContent = next;
        if (next <= 0 && card) {
          var controls = card.querySelector('.product-add-controls');
          if (controls) {
            controls.outerHTML = '<button class="product-add-btn" data-add="' + this.esc(productId) + '"><span class="add-icon">🛒</span><span class="add-text">Add to Cart</span></button>';
          }
        }
      }
    } catch (e) {}
  }

  // WISHLIST - Seedha WishlistCore / API ko bulao, apni wishlist mat banao
  async toggleWishlist(productId) {
    try {
      if (window.WishlistCore && window.WishlistCore.toggle) {
        await window.WishlistCore.toggle(productId);
        return;
      }
      if (window.SamanRWS && window.SamanRWS.wishlist) {
        await window.SamanRWS.wishlist(productId);
        return;
      }
      // Koi Core nahi mila toh seedha API - phir bhi apni alag wishlist nahi
      var res = await fetch(this.getApiBase() + '/api/common/wishlist/toggle', {
        method: 'POST', headers: this.getHeaders(), credentials: 'include',
        body: JSON.stringify({ productId: productId, shopId: this.getShopId(), buyerId: this.getBuyerId() })
      });
      var data = await res.json().catch(function () { return {}; });
      if (window.SamanComponents && window.SamanComponents.toast) {
        window.SamanComponents.toast(data && data.added === false ? 'Wishlist se hat gaya' : 'Wishlist me aa gaya');
      }
      document.querySelectorAll('[data-wishlist-btn="' + productId + '"]').forEach(function (btn) {
        btn.classList.toggle('wish-on');
        var icon = btn.querySelector('.wish-icon');
        if (icon) icon.textContent = btn.classList.contains('wish-on') ? '♥' : '♡';
      });
    } catch (e) {
      if (window.SamanComponents && window.SamanComponents.toast) window.SamanComponents.toast('Wishlist nahi hua', 'error');
    }
  }

  openQuickView(productId) {
    if (window.ProductQuickView && window.ProductQuickView.open) {
      window.ProductQuickView.open(productId);
      return;
    }
    var shopId = this.getShopId();
    window.location.href = '../common/products/product-detail.html?shopId=' + encodeURIComponent(shopId) + '&productId=' + encodeURIComponent(productId);
  }

  shareProduct(productId) {
    var shopId = this.getShopId();
    var url = window.location.origin + '/shop-templates/achar-shop/customer-view.html?shopId=' + encodeURIComponent(shopId) + '&productId=' + encodeURIComponent(productId);
    if (navigator.share) {
      navigator.share({ title: 'Achar dekho', url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        if (window.SamanComponents && window.SamanComponents.toast) window.SamanComponents.toast('Link copy ho gaya');
      });
    }
  }

  openImageZoom(imgSrc) {
    if (window.ImageZoom && window.ImageZoom.open) {
      window.ImageZoom.open([imgSrc], 0, 'Product Image');
      return;
    }
    if (window.ImageZoom && window.ImageZoom.prototype) {
      var z = new window.ImageZoom();
      z.open([imgSrc], 0, 'Product Image');
    }
  }
}

window.ProductCard = new ProductCardRenderer();
window.ProductCardRenderer = ProductCardRenderer;

// Ek hi click listener - sab card ke button yahin se chalenge, dobara listener mat lagana
if (!window.__SAMAN_PRODUCT_CARD_BOUND__) {
  window.__SAMAN_PRODUCT_CARD_BOUND__ = true;
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest ? e.target.closest('[data-add]') : null;
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.ProductCard.addToCart(addBtn.getAttribute('data-add'), 1);
      return;
    }
    var wishBtn = e.target.closest ? e.target.closest('[data-wishlist-btn]') : null;
    if (wishBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.ProductCard.toggleWishlist(wishBtn.getAttribute('data-wishlist-btn'));
      return;
    }
    var qvBtn = e.target.closest ? e.target.closest('[data-quick-view]') : null;
    if (qvBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.ProductCard.openQuickView(qvBtn.getAttribute('data-quick-view'));
      return;
    }
    var shareBtn = e.target.closest ? e.target.closest('[data-share-product]') : null;
    if (shareBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.ProductCard.shareProduct(shareBtn.getAttribute('data-share-product'));
      return;
    }
    var zoomImg = e.target.closest ? e.target.closest('[data-zoom-img]') : null;
    if (zoomImg) {
      e.preventDefault();
      window.ProductCard.openImageZoom(zoomImg.getAttribute('data-zoom-img') || zoomImg.getAttribute('src'));
      return;
    }
  });
}