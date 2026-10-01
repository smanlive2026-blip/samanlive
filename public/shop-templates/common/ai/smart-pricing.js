// LOCATION: common/ai/smart-pricing.js - DYNAMIC PRICING
window.SmartPricing = {
  suggestPrice(basePrice, stock, demand='medium'){
    let price = basePrice;
    // Low stock = price up 10%
    if(stock <= 3) price = basePrice * 1.10;
    // High demand = price up 15%
    if(demand === 'high') price = price * 1.15;
    // Festival logic
    const month = new Date().getMonth();
    if([9,10].includes(month)) price = price * 1.05; // Diwali season
    return Math.round(price);
  },
  async fetchSuggestion(productId){
    const shopId = new URLSearchParams(location.search).get('shopId');
    const res = await fetch(`/api/common/ai/pricing/${shopId}/${productId}`);
    const data = await res.json();
    return data.suggestedPrice;
  }
};