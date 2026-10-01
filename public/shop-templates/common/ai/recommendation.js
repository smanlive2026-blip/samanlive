// LOCATION: common/ai/recommendation.js - SMART RECOMMENDATION ENGINE
window.AIRecommend = {
  async getRecommended(productId){
    const shopId = new URLSearchParams(location.search).get('shopId');
    try{
      const res = await fetch(`/api/common/ai/recommend/${shopId}?productId=${productId}&t=${Date.now()}`, {cache:'no-store'});
      const data = await res.json();
      return data.products || [];
    }catch(e){ return []; }
  },
  render(containerId, products){
    const c = document.getElementById(containerId);
    if(!c ||!products.length) return;
    c.innerHTML = `<h3 style="font-weight:900;margin:10px 0">You may also like</h3><div style="display:flex;gap:10px;overflow:auto">${products.map(p=>`
      <div style="min-width:140px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:10px">
        <img src="${p.image}" style="width:100%;height:80px;object-fit:cover;border-radius:10px">
        <b style="font-size:12px;display:block;margin-top:6px">${p.name}</b>
        <span style="font-weight:900;color:#0ea5e9">₹${p.price}</span>
      </div>
    `).join('')}</div>`;
  }
};