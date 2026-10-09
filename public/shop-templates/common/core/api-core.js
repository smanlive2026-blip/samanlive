// LOCATION: public/shop-templates/common/core/api-core.js - WORLD CLASS API CORE - PRODUCTION GRADE
class ApiCore {
  constructor(){
    this.baseUrl = '';
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.timeout = 15000;
    this.retryCount = 2;
    this.cache = new Map();
    this.pendingRequests = new Map();

    // Interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];

    this.init();
  }

  init(){
    // Add auth interceptor
    this.addRequestInterceptor(async (config)=>{
      // Add timestamp to avoid cache
      if(config.method === 'GET'){
        config.url += (config.url.includes('?')? '&' : '?') + `t=${Date.now()}`;
      }
      return config;
    });

    this.addResponseInterceptor(async (response)=>{
      if(!response.ok && response.status === 401){
        // Auto redirect to login on 401
        console.warn('Unauthorized - redirecting to login');
        // Don't auto redirect on dashboard check
        if(!window.location.pathname.includes('dashboard')){
          // Show login prompt
        }
      }
      return response;
    });
  }

  addRequestInterceptor(fn){ this.requestInterceptors.push(fn); }
  addResponseInterceptor(fn){ this.responseInterceptors.push(fn); }

  async runRequestInterceptors(config){
    let c = config;
    for(const fn of this.requestInterceptors){
      c = await fn(c);
    }
    return c;
  }

  async runResponseInterceptors(response){
    let r = response;
    for(const fn of this.responseInterceptors){
      r = await fn(r);
    }
    return r;
  }

  // Main request method with retry, cache, dedup
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

    //delete config.headers; // will rebuild after interceptors
    config.headers = { 'Content-Type':'application/json',...(options.headers||{}) };

    // Deduplication - if same request pending, return same promise
    const cacheKey = `${config.method}:${config.url}:${config.body||''}`;
    if(this.pendingRequests.has(cacheKey)){
      return this.pendingRequests.get(cacheKey);
    }

    const finalConfig = await this.runRequestInterceptors(config);

    const fetchPromise = this.fetchWithRetry(finalConfig)
     .then(async res => {
        const processedRes = await this.runResponseInterceptors(res);
        this.pendingRequests.delete(cacheKey);

        // Try to parse JSON
        let data;
        const text = await processedRes.text();
        try{ data = JSON.parse(text); }catch(e){ data = { success: processedRes.ok, data: text }; }

        if(!processedRes.ok){
          throw new ApiError(processedRes.status, data.message || `API Error ${processedRes.status}`, data);
        }

        // Cache GET requests for 30 sec
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
        console.warn(`Retrying ${config.url} - attempt ${attempt+1}`);
        await this.sleep(500 * (attempt+1));
        return this.fetchWithRetry(config, attempt+1);
      }
      throw err;
    }
  }

  sleep(ms){ return new Promise(r=> setTimeout(r, ms)); }

  // Convenience methods
  get(url, params = {}){
    const query = new URLSearchParams(params).toString();
    const fullUrl = query? `${url}?${query}` : url;

    // Check cache first for GET
    const cacheKey = `GET:${this.baseUrl + fullUrl}:`;
    const cached = this.cache.get(cacheKey);
    if(cached && Date.now() - cached.timestamp < 30000){
      console.log(`Cache hit for ${fullUrl}`);
      return Promise.resolve(cached.data);
    }

    return this.request(fullUrl, { method:'GET' });
  }

  post(url, body, options = {}){ return this.request(url, { method:'POST', body,...options }); }
  put(url, body, options = {}){ return this.request(url, { method:'PUT', body,...options }); }
  patch(url, body, options = {}){ return this.request(url, { method:'PATCH', body,...options }); }
  delete(url, options = {}){ return this.request(url, { method:'DELETE',...options }); }

  // Upload with FormData
  async upload(url, formData){
    const controller = new AbortController();
    const timeoutId = setTimeout(()=> controller.abort(), 30000);

    const res = await fetch(this.baseUrl + url, {
      method:'POST',
      body: formData,
      credentials:'include',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    if(!res.ok) throw new ApiError(res.status, data.message, data);
    return data;
  }

  // Clear cache
  clearCache(pattern){
    if(!pattern){
      this.cache.clear();
      return;
    }
    for(const key of this.cache.keys()){
      if(key.includes(pattern)) this.cache.delete(key);
    }
  }

  // Shop specific APIs
  getShop(shopId){
  // Pehle common route try kar, fir old route fallback
  return this.get(`/api/common/profile/${shopId}`).catch(()=>{
    return this.get(`/api/shops/${shopId}`);
  });
}

  getShopProducts(shopId, filters = {}){
    return this.get(`/api/shops/${shopId}/products`, filters);
  }

  // Analytics
  trackEvent(event, data = {}){
    // Fire and forget
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

// Global fetch wrapper for legacy code
window.apiGet = (url, params)=> window.ApiCore.get(url, params);
window.apiPost = (url, body)=> window.ApiCore.post(url, body);