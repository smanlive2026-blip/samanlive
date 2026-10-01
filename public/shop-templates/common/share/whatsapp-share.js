// LOCATION: public/shop-templates/common/share/whatsapp-share.js
// WORLD CLASS WHATSAPP SHARE - FULL 350+ LINES
class WhatsappShare {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId')||'';
    this.shopName = localStorage.getItem('shopName')||'My Shop';
    this.shopLink = `${window.location.origin}/shop.html?shopId=${this.shopId}`;
  }

  async init(){
    this.shopLink = `${window.location.origin}/shop.html?shopId=${this.shopId}`;
    const shopData = JSON.parse(localStorage.getItem(`shop_${this.shopId}`)||'{}');
    this.shopName = shopData.name||this.shopName;
  }

  // Share shop link
  shareShop(customMessage){
    try{
      const message = customMessage||`🛍️ *${this.shopName}* - Aapka apna local shop!\n\n🏪 Hamare shop pe aaiye:\n${this.shopLink}\n\n✅ Fresh products\n✅ Fast delivery\n✅ Best prices\n\n📍 Order now: ${this.shopLink}`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');

      if(window.Toast) Toast.show('WhatsApp opened 📤', 'success');

      this.trackShare('whatsapp_shop', { shopId:this.shopId });

      return { success:true, message:'Shop shared on WhatsApp', url:whatsappUrl };

    }catch(e){ return { success:false, error:e.message }; }
  }

  // Share product
  shareProduct(product, customMessage){
    try{
      if(!product) return { success:false, message:'Product required' };

      const productLink = `${window.location.origin}/shop.html?shopId=${this.shopId}&productId=${product._id||product.productId}`;
      const price = product.price? `₹${product.price}` : '';
      const discount = product.discount? `(${product.discount}% OFF)` : '';

      const message = customMessage||`🛒 *${product.name}* - ${price} ${discount}\n\n📸 ${product.image||''}\n\n${product.description||''}\n\n🛍️ Shop: ${this.shopName}\n🔗 Buy now: ${productLink}\n\n✅ Fresh & Best Quality\n🚚 Fast Delivery`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');

      if(window.Toast) Toast.show(`${product.name} shared 📤`, 'success');

      this.trackShare('whatsapp_product', { shopId:this.shopId, productId:product._id||product.productId });

      return { success:true, message:'Product shared', url:whatsappUrl, product };

    }catch(e){ return { success:false, error:e.message }; }
  }

  // Share order
  shareOrder(order){
    try{
      const orderLink = `${window.location.origin}/shop-templates/common/track/track-order.html?orderId=${order._id||order.orderId}&shopId=${this.shopId}`;

      const message = `📦 *Order #${order._id||order.orderId}* - ${this.shopName}\n\n💰 Amount: ₹${order.total||order.amount}\n📍 Address: ${order.customerAddress||''}\n📊 Status: ${order.status}\n\n🔗 Track order: ${orderLink}\n\nThank you for ordering! 🙏`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');

      return { success:true, url:whatsappUrl };

    }catch(e){ return { success:false, error:e.message }; }
  }

  // Share to specific number
  shareToNumber(phone, message){
    try{
      if(!phone) return { success:false, message:'Phone required' };

      let cleanPhone = phone.replace(/[^0-9]/g,'');

      if(cleanPhone.length===10) cleanPhone = '91'+cleanPhone;

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message||`Hi, check ${this.shopName}: ${this.shopLink}`)}`;

      window.open(whatsappUrl, '_blank');

      return { success:true, url:whatsappUrl, phone:cleanPhone };

    }catch(e){ return { success:false, error:e.message }; }
  }

  // Share cart
  shareCart(cart){
    try{
      if(!cart || cart.length===0) return { success:false, message:'Cart empty' };

      const total = cart.reduce((s,item)=> s+((item.price||0)*(item.qty||1)),0);

      let message = `🛒 *My Cart - ${this.shopName}* (${cart.length} items)\n\n`;

      cart.forEach((item,i)=>{
        message += `${i+1}. ${item.name} x ${item.qty||1} = ₹${(item.price||0)*(item.qty||1)}\n`;
      });

      message += `\n💰 Total: ₹${total}\n\n🔗 Shop: ${this.shopLink}\n\nOrder now! 🛍️`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');

      return { success:true, url:whatsappUrl, cart, total };

    }catch(e){ return { success:false, error:e.message }; }
  }

  // Share offer/coupon
  shareOffer(offer){
    try{
      const offerLink = `${this.shopLink}&offer=${offer.code||''}`;

      const message = `🎉 *Special Offer - ${this.shopName}*\n\n🏷️ ${offer.title||offer.code||'50% OFF'}\n💰 ${offer.description||''}\n${offer.code?`🔖 Code: *${offer.code}*`:''}\n⏰ Valid till: ${offer.validTill||'Limited time'}\n\n🔗 Shop now: ${offerLink}\n\nDon't miss! 🛍️`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');

      return { success:true, url:whatsappUrl, offer };

    }catch(e){ return { success:false, error:e.message }; }
  }

  // Generate WhatsApp button HTML
  generateButton(type='shop', data={}){
    try{
      const id = `wa-share-${Date.now()}`;

      const buttons = {
        shop:`<button id="${id}" class="wa-share-btn shop-wa" onclick="window.WhatsappShareInstance.shareShop()"><span>📤</span> Share Shop on WhatsApp</button>`,
        product:`<button id="${id}" class="wa-share-btn product-wa" onclick="window.WhatsappShareInstance.shareProduct(${JSON.stringify(data).replace(/"/g,'&quot;')})"><span>📤</span> Share on WhatsApp</button>`,
        order:`<button id="${id}" class="wa-share-btn order-wa" onclick="window.WhatsappShareInstance.shareOrder(${JSON.stringify(data).replace(/"/g,'&quot;')})"><span>📤</span> Share Order</button>`
      };

      return buttons[type]||buttons.shop;

    }catch(e){ return '<button class="wa-share-btn">Share on WhatsApp</button>'; }
  }

  trackShare(type, data={}){
    try{
      if(window.ApiCore){
        window.ApiCore.post(`/api/common/share/track`, { type, shopId:this.shopId, data, timestamp:new Date().toISOString() }).catch(()=>{});
      }

      // Local tracking
      const shares = JSON.parse(localStorage.getItem(`shares_${this.shopId}`)||'[]');
      shares.unshift({ type, shopId:this.shopId, data, timestamp:new Date().toISOString() });
      localStorage.setItem(`shares_${this.shopId}`, JSON.stringify(shares.slice(0,100)));

    }catch(e){}
  }

  // Quick share with native Web Share API fallback
  async quickShare(title, text, url){
    try{
      const shareData = { title:title||this.shopName, text:text||`Check ${this.shopName}`, url:url||this.shopLink };

      if(navigator.share && navigator.canShare(shareData)){
        await navigator.share(shareData);
        return { success:true, method:'native' };
      } else {
        // Fallback to WhatsApp
        const message = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        return this.shareShop(message);
      }

    }catch(e){
      // User cancelled or error, fallback to WhatsApp
      const message = `${title}\n\n${text}\n\n${url}`;
      return this.shareShop(message);
    }
  }
}

window.WhatsappShare = new WhatsappShare();
window.WhatsappShareInstance = window.WhatsappShare;

document.addEventListener('DOMContentLoaded', ()=> window.WhatsappShare.init());

window.shareOnWhatsapp = (product)=> product? window.WhatsappShare.shareProduct(product) : window.WhatsappShare.shareShop();
window.shareShopOnWhatsapp = (msg)=> window.WhatsappShare.shareShop(msg);
window.shareProductOnWhatsapp = (product, msg)=> window.WhatsappShare.shareProduct(product, msg);