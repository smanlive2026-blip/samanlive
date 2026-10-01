// LOCATION: common/checkout/payment-gateway.js - RAZORPAY / ONLINE
class PaymentGateway {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId')||'';
  }

  async pay(amount, shopId){
    shopId = shopId || this.shopId;
    amount = parseInt(amount) || 0;

    // Check if Razorpay loaded
    if(typeof Razorpay === 'undefined'){
      await this.loadRazorpayScript();
    }

    try{
      // Create order on server
      const res = await fetch(`/api/common/checkout/${shopId}/create-razorpay-order`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ amount: amount*100, currency:'INR' })
      });
      const data = await res.json();

      const options = {
        key: data.key || 'rzp_test_dummy',
        amount: amount*100,
        currency:'INR',
        name: 'Local Market Shop',
        description: `Order for shop ${shopId}`,
        order_id: data.orderId || '',
        handler: async (response)=>{
          // Verify payment
          const verifyRes = await fetch(`/api/common/checkout/${shopId}/verify-payment`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            credentials:'include',
            body: JSON.stringify({...response, amount })
          });
          const verifyData = await verifyRes.json();
          if(verifyData.success){
            window.location.href = `./order-success.html?shopId=${shopId}&orderId=${verifyData.orderId}&amount=${amount}`;
          } else {
            alert('Payment verification failed');
          }
        },
        prefill: { name: window.currentUser?.name || '', email: window.currentUser?.email || '', contact: window.currentUser?.phone || '' },
        theme:{ color:'#0f172a' }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (resp)=> alert('Payment failed: '+resp.error.description));
      rzp.open();

    }catch(e){
      console.error('Razorpay error', e);
      alert('Online payment currently unavailable, please use COD');
    }
  }

  loadRazorpayScript(){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src='https://checkout.razorpay.com/v1/checkout.js';
      s.onload=resolve; s.onerror=reject;
      document.head.appendChild(s);
    });
  }
}

window.PaymentGateway = new PaymentGateway();