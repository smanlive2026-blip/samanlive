// LOCATION: common/components/product-card.js - FULL WORLD CLASS PRODUCT CARD JS - PRODUCTION
class ProductCardRenderer {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    this.cart = JSON.parse(localStorage.getItem(`cart_${this.shopId}`) || '[]');
  }

  // Main render method
  render(product, options = {}){
    const {
      showCategory = true,
      showRating = true,
      showStock = true,
      showWishlist = true,
      size = 'medium' // small, medium, large
    } = options;

    const isOutOfStock = (product.stock!== undefined && product.stock <= 0) || product.outOfStock;
    const isBestseller = product.bestseller || product.isBestseller || (product.totalSales && product.totalSales > 50);
    const discount = this.calculateDiscount(product.price, product.mrp);
    const inWishlist = this.wishlist.includes(product._id || product.productId);
    const inCart = this.cart.find(item => item._id === (product._id || product.productId));
    const cartQty = inCart? inCart.qty || inCart.quantity || 1 : 0;

    return `
      <div class="product-card ${size} ${isOutOfStock? 'out-of-stock' : ''}" data-product-id="${product._id || product.productId}" data-product='${JSON.stringify(product).replace(/'/g, "&#39;")}'>
        <div class="product-image-wrap" onclick="ProductCardRenderer.openQuickView('${product._id || product.productId}')">
          <img src="${this.getProductImage(product)}" alt="${product.name || 'Product'}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
          <div class="product-image-overlay"></div>

          ${showWishlist? `<button class="product-wishlist-btn ${inWishlist? 'active' : ''}" onclick="event.stopPropagation(); ProductCardRenderer.toggleWishlist('${product._id || product.productId}')" title="${inWishlist? 'Remove from Wishlist' : 'Add to Wishlist'}"><span class="wish-icon">${inWishlist? '♥' : '♡'}</span></button>` : ''}

          ${discount > 0 &&!isOutOfStock? `<span class="product-badge discount">${discount}% OFF</span>` : ''}
          ${isOutOfStock? `<span class="product-badge out-of-stock">Out of Stock</span>` : ''}
          ${isBestseller &&!isOutOfStock? `<span class="product-badge bestseller" style="${discount > 0? 'bottom:36px' : ''}">🔥 Bestseller</span>` : ''}

          <div class="product-quick-actions">
            <button class="quick-action-btn" onclick="event.stopPropagation(); ProductCardRenderer.openQuickView('${product._id || product.productId}')" title="Quick View">👁️</button>
            <button class="quick-action-btn" onclick="event.stopPropagation(); ProductCardRenderer.shareProduct('${product._id || product.productId}')" title="Share">↗️</button>
          </div>
        </div>

        <div class="product-info">
          ${showCategory && product.category? `<div class="product-category">${product.category}</div>` : ''}

          <b class="product-name" title="${product.name || product.title}">${product.name || product.title || 'Product Name'}</b>

          ${showRating? `
            <div class="product-rating">
              <span class="stars">${this.renderStars(product.rating || 4.5)}</span>
              <span class="rating-count">(${product.totalReviews || product.reviews || Math.floor(Math.random()*200)+10})</span>
            </div>
          ` : ''}

          <div class="product-pricing">
            <span class="product-price">₹${product.price}</span>
            ${product.mrp && product.mrp > product.price? `<span class="product-mrp">₹${product.mrp}</span>` : ''}
            ${discount > 0? `<span class="product-off">${discount}% OFF</span>` : ''}
          </div>

          ${showStock && product.stock!== undefined && product.stock <= 15 && product.stock > 0? `
            <div class="product-stock">
              <div class="stock-bar"><div class="stock-fill" style="width:${Math.max(10, (product.stock/20)*100)}%"></div></div>
              <span class="stock-text">${product.stock} left • Selling fast 🔥</span>
            </div>
          ` : ''}

          ${isOutOfStock? `
            <button class="product-add-btn" disabled style="background:#e2e8f0;color:#94a3b8;cursor:not-allowed">Out of Stock</button>
          ` : cartQty > 0? `
            <div class="product-add-controls" style="display:flex">
              <button class="qty-btn minus" onclick="event.stopPropagation(); ProductCardRenderer.updateCartQty('${product._id || product.productId}', -1)">−</button>
              <span class="qty-count">${cartQty}</span>
              <button class="qty-btn plus" onclick="event.stopPropagation(); ProductCardRenderer.updateCartQty('${product._id || product.productId}', 1)">+</button>
            </div>
          ` : `
            <button class="product-add-btn" onclick="event.stopPropagation(); ProductCardRenderer.addToCart('${product._id || product.productId}')">
              <span class="add-icon">🛒</span>
              <span class="add-text">Add to Cart</span>
            </button>
          `}
        </div>
      </div>
    `;
  }

  getProductImage(product){
    if(product.image) return product.image;
    if(product.img) return product.img;
    if(product.images && product.images[0]) return product.images[0];
    if(product.imageUrl) return product.imageUrl;
    return 'https://via.placeholder.com/300?text=No+Image';
  }

  calculateDiscount(price, mrp){
    if(!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }

  renderStars(rating){
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if(hasHalf) stars += '⭐';
    return stars || '⭐⭐⭐⭐⭐';
  }

  renderGrid(products, containerId, options = {}){
    const container = document.getElementById(containerId);
    if(!container){
      console.warn(`Container ${containerId} not found`);
      return;
    }

    if(!products || products.length === 0){
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px 20px;font-family:Outfit,sans-serif">
          <div style="font-size:48px">📦</div>
          <h3 style="font-weight:900;margin:12px 0 6px">No products found</h3>
          <p style="color:#64748b;font-size:13px">Try different filters or check back later</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p=> this.render(p, options)).join('');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    container.style.gap = '12px';

    // Responsive
    if(window.innerWidth >= 768){
      container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
    if(window.innerWidth >= 1024){
      container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }

    // Trigger event
    window.dispatchEvent(new CustomEvent('products:rendered', { detail: products }));
  }

  // Static methods for global access
  static async addToCart(productId){
    try{
      // Find product data from DOM
      const card = document.querySelector(`[data-product-id="${productId}"]`);
      let product = null;

      if(card){
        try{
          product = JSON.parse(card.dataset.product.replace(/&#39;/g, "'"));
        }catch(e){
          product = { _id: productId, name: card.querySelector('.product-name')?.innerText || 'Product', price: parseInt(card.querySelector('.product-price')?.innerText.replace('₹','')) || 0 };
        }
      }

      if(!product) product = { _id: productId, name: 'Product', price: 100 };

      // Use CartCore if available
      if(window.CartCore){
        await window.CartCore.addItem({
          _id: product._id || productId,
          productId: product._id || productId,
          name: product.name,
          title: product.name,
          price: product.price,
          image: product.image || '',
          qty: 1
        });
      } else {
        // Fallback to local cart
        const shopId = new URLSearchParams(location.search).get('shopId') || '';
        let cart = JSON.parse(localStorage.getItem(`cart_${shopId}`) || '[]');
        const existing = cart.find(item=> item._id === productId);

        if(existing){
          existing.qty = (existing.qty || 1) + 1;
        } else {
          cart.push({ _id: productId, name: product.name, price: product.price, image: product.image || '', qty: 1 });
        }

        localStorage.setItem(`cart_${shopId}`, JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.reduce((s,i)=> s + (i.qty||1), 0) } }));
      }

      // Show feedback
      if(window.Toast) window.Toast.cartAdded(product.name);

      // Haptic
      if(navigator.vibrate) navigator.vibrate(20);

      // Update button to qty controls
      if(card){
        const btn = card.querySelector('.product-add-btn');
        if(btn){
          btn.outerHTML = `
            <div class="product-add-controls" style="display:flex">
              <button class="qty-btn minus" onclick="event.stopPropagation(); ProductCardRenderer.updateCartQty('${productId}', -1)">−</button>
              <span class="qty-count">1</span>
              <button class="qty-btn plus" onclick="event.stopPropagation(); ProductCardRenderer.updateCartQty('${productId}', 1)">+</button>
            </div>
          `;
        }
      }

    }catch(e){
      console.error('Add to cart failed', e);
      if(window.Toast) Toast.show('Failed to add to cart', 'error');
    }
  }

  static updateCartQty(productId, change){
    const shopId = new URLSearchParams(location.search).get('shopId') || '';
    let cart = JSON.parse(localStorage.getItem(`cart_${shopId}`) || '[]');
    let item = cart.find(i=> i._id === productId);

    if(!item) return;

    item.qty = (item.qty || 1) + change;

    if(item.qty <= 0){
      cart = cart.filter(i=> i._id!== productId);
    }

    localStorage.setItem(`cart_${shopId}`, JSON.stringify(cart));

    if(window.CartCore){
      if(item.qty <= 0) window.CartCore.removeItem(productId);
      else window.CartCore.updateQty(productId, item.qty);
    }

    // Update UI
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if(card){
      if(item.qty <= 0 ||!cart.find(i=> i._id === productId)){
        const controls = card.querySelector('.product-add-controls');
        if(controls){
          controls.outerHTML = `
            <button class="product-add-btn" onclick="event.stopPropagation(); ProductCardRenderer.addToCart('${productId}')">
              <span class="add-icon">🛒</span>
              <span class="add-text">Add to Cart</span>
            </button>
          `;
        }
      } else {
        const countEl = card.querySelector('.qty-count');
        if(countEl) countEl.innerText = item.qty;
      }
    }

    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.reduce((s,i)=> s + (i.qty||1), 0) } }));
  }

  static toggleWishlist(productId){
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const index = wishlist.indexOf(productId);

    if(index >= 0){
      wishlist.splice(index, 1);
      if(window.Toast) Toast.show('Removed from wishlist', 'info');
    } else {
      wishlist.push(productId);
      if(window.Toast) Toast.show('Added to wishlist ❤️', 'success');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));

    // Update UI
    document.querySelectorAll(`[data-product-id="${productId}"].product-wishlist-btn`).forEach(btn=>{
      const isWishlisted = wishlist.includes(productId);
      btn.classList.toggle('active', isWishlisted);
      btn.querySelector('.wish-icon').innerText = isWishlisted? '♥' : '♡';
      if(isWishlisted) btn.style.color = '#ef4444';
      else btn.style.color = '';
    });

    if(window.WishlistCore) window.WishlistCore.sync();
  }

  static openQuickView(productId){
    if(window.ProductQuickView) window.ProductQuickView.open(productId);
    else {
      // Fallback - go to product page
      const shopId = new URLSearchParams(location.search).get('shopId') || '';
      window.location.href = `/shop-templates/common/components/product-quick-view.html?shopId=${shopId}&productId=${productId}`;
    }
  }

  static shareProduct(productId){
    const shopId = new URLSearchParams(location.search).get('shopId') || '';
    const url = `${location.origin}/shop.html?shopId=${shopId}&productId=${productId}`;

    if(navigator.share){
      navigator.share({ title: 'Check this product', url }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url).then(()=>{
        if(window.Toast) Toast.show('Product link copied! 🔗', 'success');
      });
    }
  }
}

window.ProductCard = new ProductCardRenderer();
window.ProductCardRenderer = ProductCardRenderer;