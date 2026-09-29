window.CommonCheckout = {
  placeOrder: async (data)=>{
    const res = await fetch('/api/orders', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
    return res.json();
  }
}