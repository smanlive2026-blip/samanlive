// LOCATION: public/shop-templates/common/core/api-core.js - V8 RAM ONLY - FULL CODE - NO CUT
// RULE: Buyer ID CartCore se - Token AuthCore se - Dono nahi mile toh Guest RAM se - Kahin save nahi hoga
// RULE: Cache sirf RAM me - Map me - Page band hua toh cache gaya
// RULE: Purane naam sab wahi hain - get / post / put / patch / delete / upload / getShop / getBuyerId / getHeaders
class ApiCore {
  constructor(){
    this.baseUrl = window.API_BASE || (window.EnvConfig && window.EnvConfig.API_BASE) || '';
    this.shopId = new URLSearchParams(location.search).get('shopId') || window.SHOP_ID || window.shopId || '';
    this.timeout = 15000;
    this.retryCount = 2;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.init();
  }
  init(){
    this.addRequestInterceptor(async function(config){
      var buyerId = '';
      try{
        if(window.CartCore && window.CartCore.getBuyerId) buyerId = window.CartCore.getBuyerId();
        else if(window.UserCore && window.UserCore.getBuyerId) buyerId = window.UserCore.getBuyerId();
        else if(window.AuthCore && window.AuthCore.getUserId) buyerId = window.AuthCore.getUserId();
        else if(window.USER_ID) buyerId = window.USER_ID;
        else if(window.currentUser && window.currentUser._id) buyerId = window.currentUser._id;
        if(!buyerId) buyerId = window.__SAMAN_GUEST_ID || ('guest_' + Date.now());
        if(buyerId && String(buyerId).length >= 10 && String(buyerId).indexOf('user_') !== 0 && String(buyerId).indexOf('guest_') !== 0 && String(buyerId).length === 24) buyerId = 'user_' + buyerId;
      }catch(e){ buyerId = window.__SAMAN_GUEST_ID || ('guest_' + Date.now()); }
      var token = '';
      try{ if(window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; }catch(e){}
      if(!token) token = window.USER_TOKEN || '';
      config.headers = Object.assign({ 'Content-Type': 'application/json', 'x-buyer-id': buyerId }, token ? { 'Authorization': 'Bearer ' + token } : {}, config.headers || {});
      if(config.method === 'GET'){
        var sep = config.url.indexOf('?') !== -1 ? '&' : '?';
        if(config.url.indexOf('t=') === -1) config.url += sep + 't=' + Date.now();
      }
      return config;
    });
    this.addResponseInterceptor(async function(response){
      if(!response.ok && response.status === 401){ console.warn('ApiCore 401 Unauthorized -', response.url); }
      return response;
    });
  }
  addRequestInterceptor(fn){ this.requestInterceptors.push(fn); }
  addResponseInterceptor(fn){ this.responseInterceptors.push(fn); }
  async runRequestInterceptors(config){ var c = config; for(var i = 0; i < this.requestInterceptors.length; i++){ c = await this.requestInterceptors[i](c); } return c; }
  async runResponseInterceptors(response){ var r = response; for(var i = 0; i < this.responseInterceptors.length; i++){ r = await this.responseInterceptors[i](r); } return r; }
  async request(url, options){
    options = options || {};
    var config = { url: this.baseUrl + url, method: options.method || 'GET', headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}), body: options.body ? JSON.stringify(options.body) : undefined, credentials: 'include', cache: 'no-store' };
    if(options.body !== undefined) config.body = JSON.stringify(options.body);
    if(options.headers) config.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers);
    var cacheKey = config.method + ':' + config.url + ':' + (config.body || '');
    if(this.pendingRequests.has(cacheKey)) return this.pendingRequests.get(cacheKey);
    var self = this;
    var finalConfig = await this.runRequestInterceptors(config);
    var fetchPromise = this.fetchWithRetry(finalConfig).then(async function(res){
      var processedRes = await self.runResponseInterceptors(res);
      self.pendingRequests.delete(cacheKey);
      var text = await processedRes.text();
      var data;
      try{ data = JSON.parse(text); }catch(e){ data = { success: processedRes.ok, data: text }; }
      if(!processedRes.ok) throw new ApiError(processedRes.status, (data && data.message) || ('API Error ' + processedRes.status), data);
      if(finalConfig.method === 'GET' && processedRes.ok) self.cache.set(cacheKey, { data: data, timestamp: Date.now() });
      return data;
    }).catch(function(err){ self.pendingRequests.delete(cacheKey); throw err; });
    this.pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
  async fetchWithRetry(config, attempt){
    attempt = attempt || 0;
    try{
      var controller = new AbortController();
      var timeoutId = setTimeout(function(){ controller.abort(); }, this.timeout);
      var res = await fetch(config.url, { method: config.method, headers: config.headers, body: config.body, credentials: config.credentials, cache: config.cache, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    }catch(err){
      if(attempt < this.retryCount && (err.name === 'AbortError' || (err.message && err.message.indexOf('Failed to fetch') !== -1))){
        console.warn('ApiCore retry ' + config.url + ' attempt ' + (attempt + 1));
        await this.sleep(500 * (attempt + 1));
        return this.fetchWithRetry(config, attempt + 1);
      }
      throw err;
    }
  }
  sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  get(url, params){
    params = params || {};
    var query = new URLSearchParams(params).toString();
    var fullUrl = query ? (url + '?' + query) : url;
    var cacheKey = 'GET:' + this.baseUrl + fullUrl + ':';
    var cached = this.cache.get(cacheKey);
    if(cached && Date.now() - cached.timestamp < 30000){ console.log('ApiCore cache hit ' + fullUrl); return Promise.resolve(cached.data); }
    return this.request(fullUrl, { method: 'GET' });
  }
  post(url, body, options){ options = options || {}; return this.request(url, { method: 'POST', body: body, headers: options.headers || {} }); }
  put(url, body, options){ options = options || {}; return this.request(url, { method: 'PUT', body: body, headers: options.headers || {} }); }
  patch(url, body, options){ options = options || {}; return this.request(url, { method: 'PATCH', body: body, headers: options.headers || {} }); }
  delete(url, options){ options = options || {}; return this.request(url, { method: 'DELETE', headers: options.headers || {} }); }
  async upload(url, formData){
    var controller = new AbortController();
    var timeoutId = setTimeout(function(){ controller.abort(); }, 30000);
    var headers = {};
    var token = '';
    try{ if(window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; }catch(e){}
    if(!token) token = window.USER_TOKEN || '';
    if(token) headers['Authorization'] = 'Bearer ' + token;
    headers['x-buyer-id'] = this.getBuyerId();
    var res = await fetch(this.baseUrl + url, { method: 'POST', body: formData, credentials: 'include', headers: headers, signal: controller.signal });
    clearTimeout(timeoutId);
    var data = await res.json();
    if(!res.ok) throw new ApiError(res.status, data.message, data);
    return data;
  }
  clearCache(pattern){
    if(!pattern){ this.cache.clear(); return; }
    var self = this;
    Array.from(this.cache.keys()).forEach(function(key){ if(key.indexOf(pattern) !== -1) self.cache.delete(key); });
  }
  getShop(shopId){ return this.get('/api/common/profile/' + shopId).catch(function(){ return this.get('/api/shops/' + shopId); }.bind(this)); }
  getShopProducts(shopId, filters){ filters = filters || {}; return this.get('/api/shops/' + shopId + '/products', filters); }
  getBuyerId(){
    if(window.CartCore && window.CartCore.getBuyerId) return window.CartCore.getBuyerId();
    if(window.UserCore && window.UserCore.getBuyerId) return window.UserCore.getBuyerId();
    if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId();
    return window.USER_ID || window.__SAMAN_GUEST_ID || ('guest_' + Date.now());
  }
  getBuyerInfo(){
    var role = 'customer';
    try{ if(window.RoleHierarchy && window.RoleHierarchy.getMyRole) role = window.RoleHierarchy.getMyRole(); else if(window.AuthCore && window.AuthCore.getRole) role = window.AuthCore.getRole(); else role = window.USER_ROLE || 'customer'; }catch(e){}
    var shopId = null;
    try{ if(window.RoleHierarchy && window.RoleHierarchy.getMyShopId) shopId = window.RoleHierarchy.getMyShopId(); }catch(e){}
    if(!shopId) shopId = window.MY_SHOP_ID || window.SHOP_ID || null;
    return { buyerId: this.getBuyerId(), buyerRole: role, buyerShopId: shopId };
  }
  trackEvent(event, data){ data = data || {}; this.post('/api/common/analytics/track', { event: event, data: data, shopId: this.shopId, timestamp: Date.now() }).catch(function(){}); }
}
class ApiError extends Error {
  constructor(status, message, data){ super(message); this.status = status; this.data = data; this.name = 'ApiError'; }
}
window.ApiCore = new ApiCore();
window.ApiError = ApiError;
window.apiGet = function(url, params){ return window.ApiCore.get(url, params); };
window.apiPost = function(url, body){ return window.ApiCore.post(url, body); };
window.apiPut = function(url, body){ return window.ApiCore.put(url, body); };
window.apiDelete = function(url){ return window.ApiCore.delete(url); };
window.ApiCore.getHeaders = function(){
  var token = '';
  try{ if(window.AuthCore && window.AuthCore.getToken) token = window.AuthCore.getToken() || ''; }catch(e){}
  if(!token) token = window.USER_TOKEN || '';
  return { 'Content-Type': 'application/json', 'x-buyer-id': window.ApiCore.getBuyerId(), 'Authorization': token ? ('Bearer ' + token) : '' };
};
console.log('ApiCore V8 loaded - RAM only - CartCore buyerId + AuthCore token');