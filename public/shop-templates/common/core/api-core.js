// LOCATION: public/shop-templates/common/core/api-core.js - V7 WORLD CLASS FINAL - YOUR CLASS + BUYER_ID + AUTH MERGE
class ApiCore {
  constructor(){
    this.baseUrl = window.API_BASE || window.EnvConfig?.API_BASE || '';
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('last_shopId') || '';
    this.timeout = 15000;
    this.retryCount = 2;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.init();
  }

  init(){
    // 1. Auth + BuyerID interceptor - WORLD CLASS FIX
    this.addRequestInterceptor(async (config)=>{
      // BuyerId - sabse jaruri - CartCore se lo
      let buyerId = '';
      try{
        if(window.CartCore && window.CartCore.getBuyerId) buyerId = window.CartCore.getBuyerId();
        else buyerId = localStorage.getItem('USER_ID') || sessionStorage.getItem('guest_id') || localStorage.getItem('guest_id') || '';
        if(!buyerId) buyerId = 'guest_' + Date.now();
      }catch(e){ buyerId = 'guest_' + Date.now(); }

      const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || localStorage.getItem('token') || localStorage.getItem('userToken') || '';

      config.headers = {
        'Content-Type': 'application/json',
        'x-buyer-id': buyerId,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(config.headers||{})
      };

      // Avoid cache
      if(config.method === 'GET'){
        const sep = config.url.includes('?')? '&' : '?';
        if(!config.url.includes('t=')) config.url += `${sep}t=${Date.now()}`;
      }
      return config;
    });

    this.addResponseInterceptor(async (response)=>{
      if(!response.ok && response.status === 401){
        console.warn('ApiCore 401 Unauthorized -', response.url);
        // Auto logout nahi karenge, sirf log
      }
      return response;
    });
  }

  addRequestInterceptor(fn){ this.requestInterceptors.push(fn); }
  addResponseInterceptor(fn){ this.responseInterceptors.push(fn); }

  async runRequestInterceptors(config){
    let c = config;
    for(const fn of this.requestInterceptors){ c = await fn(c); }
    return c;
  }

  async runResponseInterceptors(response){
    let r = response;
    for(const fn of this.responseInterceptors){ r = await fn(r); }
    return r;
  }

  async request(url, options = {}){
    const config = {
      url: this.baseUrl + url,
      method: options.method || 'GET',
      headers: { 'Content-Type':'application/json',...(options.headers||{}) },
      body: options.body? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      cache: 'no-store',
      ...options
    };
    config.headers = { 'Content-Type':'application/json',...(options.headers||{}) };

    const cacheKey = `${config.method}:${config.url}:${config.body||''}`;
    if(this.pendingRequests.has(cacheKey)){
      return this.pendingRequests.get(cacheKey);
    }

    const finalConfig = await this.runRequestInterceptors(config);

    const fetchPromise = this.fetchWithRetry(finalConfig)
     .then(async res => {
        const processedRes = await this.runResponseInterceptors(res);
        this.pendingRequests.delete(cacheKey);
        let data;
        const text = await processedRes.text();
        try{ data = JSON.parse(text); }catch(e){ data = { success: processedRes.ok, data: text }; }
        if(!processedRes.ok){
          throw new ApiError(processedRes.status, data.message || `API Error ${processedRes.status}`, data);
        }
        if(finalConfig.method === 'GET' && processedRes.ok){
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }
        return data;
      })
     .catch(err=>{
        this.pendingRequests.delete(cacheKey);
        throw err;
      });

    this.pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async fetchWithRetry(config, attempt = 0){
    try{
      const controller = new AbortController();
      const timeoutId = setTimeout(()=> controller.abort(), this.timeout);
      const res = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        credentials: config.credentials,
        cache: config.cache,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res;
    }catch(err){
      if(attempt < this.retryCount && (err.name === 'AbortError' || err.message.includes('Failed to fetch'))){
        console.warn(`ApiCore retry ${config.url} attempt ${attempt+1}`);
        await this.sleep(500 * (attempt+1));
        return this.fetchWithRetry(config, attempt+1);
      }
      throw err;
    }
  }

  sleep(ms){ return new Promise(r=> setTimeout(r, ms)); }

  // Convenience methods - WORLD CLASS + QUERY SUPPORT
  get(url, params = {}){
    const query = new URLSearchParams(params).toString();
    const fullUrl = query? `${url}?${query}` : url;
    const cacheKey = `GET:${this.baseUrl + fullUrl}:`;
    const cached = this.cache.get(cacheKey);
    if(cached && Date.now() - cached.timestamp < 30000){
      console.log(`ApiCore cache hit ${fullUrl}`);
      return Promise.resolve(cached.data);
    }
    return this.request(fullUrl, { method:'GET' });
  }

  post(url, body, options = {}){ return this.request(url, { method:'POST', body,...options }); }
  put(url, body, options = {}){ return this.request(url, { method:'PUT', body,...options }); }
  patch(url, body, options = {}){ return this.request(url, { method:'PATCH', body,...options }); }
  delete(url, options = {}){ return this.request(url, { method:'DELETE',...options }); }

  async upload(url, formData){
    const controller = new AbortController();
    const timeoutId = setTimeout(()=> controller.abort(), 30000);
    const headers = {};
    const token = (window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || '';
    if(token) headers['Authorization'] = `Bearer ${token}`;
    headers['x-buyer-id'] = (window.CartCore && window.CartCore.getBuyerId && window.CartCore.getBuyerId()) || localStorage.getItem('USER_ID') || '';
    const res = await fetch(this.baseUrl + url, { method:'POST', body: formData, credentials:'include', headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if(!res.ok) throw new ApiError(res.status, data.message, data);
    return data;
  }

  clearCache(pattern){
    if(!pattern){ this.cache.clear(); return; }
    for(const key of this.cache.keys()){ if(key.includes(pattern)) this.cache.delete(key); }
  }

  // Shop APIs
  getShop(shopId){
    return this.get(`/api/common/profile/${shopId}`).catch(()=> this.get(`/api/shops/${shopId}`));
  }
  getShopProducts(shopId, filters = {}){
    return this.get(`/api/shops/${shopId}/products`, filters);
  }

  // Buyer helpers - for checkout/cart
  getBuyerId(){
    if(window.CartCore && window.CartCore.getBuyerId) return window.CartCore.getBuyerId();
    return localStorage.getItem('USER_ID') || sessionStorage.getItem('guest_id') || '';
  }
  getBuyerInfo(){
    return {
      buyerId: this.getBuyerId(),
      buyerRole: (window.RoleHierarchy && window.RoleHierarchy.getMyRole && window.RoleHierarchy.getMyRole()) || localStorage.getItem('USER_ROLE') || 'customer',
      buyerShopId: localStorage.getItem('MY_SHOP_ID') || null
    };
  }

  trackEvent(event, data = {}){
    this.post('/api/common/analytics/track', { event, data, shopId: this.shopId, timestamp: Date.now() }).catch(()=>{});
  }
}

class ApiError extends Error {
  constructor(status, message, data){
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

window.ApiCore = new ApiCore();
window.ApiError = ApiError;
window.apiGet = (url, params)=> window.ApiCore.get(url, params);
window.apiPost = (url, body)=> window.ApiCore.post(url, body);
window.apiPut = (url, body)=> window.ApiCore.put(url, body);
window.apiDelete = (url)=> window.ApiCore.delete(url);

// Legacy compat - purana code jo window.ApiCore.getHeaders() use karta tha
window.ApiCore.getHeaders = function(){
  return {
    'Content-Type': 'application/json',
    'x-buyer-id': window.ApiCore.getBuyerId(),
    'Authorization': `Bearer ${(window.AuthCore && window.AuthCore.getToken && window.AuthCore.getToken()) || localStorage.getItem('TOKEN') || ''}`
  };
};

console.log('✅ ApiCore V7 WORLD CLASS FINAL - Your class + buyerId + auth + cache + retry loaded');