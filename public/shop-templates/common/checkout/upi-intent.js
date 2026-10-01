// LOCATION: common/checkout/upi-intent.js - UPI INTENT WORLD CLASS
class UpiIntent {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId')||'';
    this.upiId = 'shop@upi'; // Replace with shop's UPI from API
    this.merchantName = 'Local Market';
  }

  async init(){
    try{
      const res = await fetch(`/api/shops/${this.shopId}?t=${Date.now()}`, { cache:'no-store' });
      const data = await res.json();
      const shop = data.shop || data;
      this.upiId = shop.upiId || shop.upi || this.upiId;
      this.merchantName = shop.shopName || shop.name || this.merchantName;
    }catch(e){}
  }

  pay(amount, app='upi'){
    amount = parseFloat(amount) || 1;
    const orderId = 'ORD'+Date.now();
    const note = `Order ${orderId} for ${this.merchantName}`;

    // UPI Deep Links
    const upiLinks = {
      gpay: `tez://upi/pay?pa=${this.upiId}&pn=${encodeURIComponent(this.merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      phonepe: `phonepe://pay?pa=${this.upiId}&pn=${encodeURIComponent(this.merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      paytm: `paytmmp://pay?pa=${this.upiId}&pn=${encodeURIComponent(this.merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      upi: `upi://pay?pa=${this.upiId}&pn=${encodeURIComponent(this.merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
    };

    const link = upiLinks[app] || upiLinks.upi;

    // Try to open UPI app
    window.location.href = link;

    // Fallback: show QR / confirm after 3 sec
    setTimeout(()=>{
      if(confirm(`Did payment of ₹${amount} via ${app.toUpperCase()} complete? Click OK if paid`)){
        // Place order as UPI paid
        fetch(`/api/common/checkout/${this.shopId}/place`, {
          method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
          body: JSON.stringify({ paymentMethod:'upi', upiApp:app, amount, addressId: localStorage.getItem('selectedAddressId') })
        }).then(r=>r.json()).then(d=>{
          if(d.success) window.location.href = `./order-success.html?shopId=${this.shopId}&orderId=${d.orderId}&amount=${amount}`;
        });
      }
    }, 2500);
  }
}

window.UpiIntent = new UpiIntent();
document.addEventListener('DOMContentLoaded', ()=> window.UpiIntent.init());