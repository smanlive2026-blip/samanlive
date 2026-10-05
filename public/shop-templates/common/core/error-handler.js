// LOCATION: public/shop-templates/common/core/error-handler.js - WORLD CLASS ERROR HANDLER - FULL PRODUCTION GRADE
class ErrorHandler {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.errors = [];
    this.maxErrors = 100;
    this.listeners = [];
    this.sentryEnabled = false;
    this.errorCounts = new Map();

    this.init();
  }

  init(){
    // Global error handlers
    window.addEventListener('error', (e)=> this.handleWindowError(e));
    window.addEventListener('unhandledrejection', (e)=> this.handleUnhandledRejection(e));

    // Console error interception for API errors
    const originalConsoleError = console.error;
    console.error = (...args)=>{
      // Log but don't crash
      originalConsoleError.apply(console, args);

      // Check if it's an API error worth tracking
      const msg = args.join(' ');
      if(msg.includes('API Error') || msg.includes('Failed to fetch') || msg.includes('500') || msg.includes('NetworkError')){
        this.logError({
          type: 'console',
          message: msg.slice(0, 200),
          stack: new Error().stack,
          severity: 'medium'
        }, false); // Don't show toast for console errors
      }
    };

    // Track JS errors count
    setInterval(()=> this.reportIfNeeded(), 60000);
  }

  handleWindowError(event){
    const error = {
      type: 'js',
      message: event.message || 'Unknown JS error',
      file: event.filename || location.href,
      line: event.lineno || 0,
      col: event.colno || 0,
      stack: event.error?.stack || '',
      url: location.href,
      userAgent: navigator.userAgent,
      shopId: this.shopId,
      timestamp: Date.now(),
      severity: this.getSeverity(event.message)
    };

    this.logError(error);

    // Don't block default behavior for syntax errors in dev
    if(error.message.includes('ResizeObserver') || error.message.includes('Script error')) return;
  }

  handleUnhandledRejection(event){
    const reason = event.reason;
    const error = {
      type: 'promise',
      message: reason?.message || String(reason) || 'Unhandled promise rejection',
      stack: reason?.stack || '',
      url: location.href,
      shopId: this.shopId,
      timestamp: Date.now(),
      severity: 'high',
      reason
    };

    this.logError(error);
    event.preventDefault(); // Prevent console spam
  }

  logError(error, showToast = true){
    // Deduplication
    const key = `${error.message}:${error.file||''}:${error.line||''}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count+1);

    if(count > 3){
      // Don't log same error more than 3 times in 5 mins
      if(count === 4) console.warn(`Error suppressed after 3 times: ${key}`);
      return;
    }

    // Auto-clear counts after 5 mins
    if(count === 0){
      setTimeout(()=> this.errorCounts.delete(key), 5 * 60 * 1000);
    }

    error.id = 'err_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);

    this.errors.push(error);
    if(this.errors.length > this.maxErrors) this.errors.shift();

    // Log to console in dev
    console.group(`🚨 Error logged: ${error.type}`);
    console.error(error.message);
    if(error.stack) console.error(error.stack);
    console.groupEnd();

    // Show user-friendly message for critical errors
    if(showToast){
      const userMsg = this.getUserFriendlyMessage(error);
      if(userMsg && error.severity === 'high'){
        if(window.Toast) Toast.show(userMsg, 'error');
        else if(!document.getElementById('errorToast')) this.showErrorToast(userMsg);
      }
    }

    // Notify listeners
    this.listeners.forEach(cb=>{
      try{ cb(error); }catch(e){}
    });

    // Report to backend if critical
    if(error.severity === 'high' || error.type === 'api'){
      this.reportToBackend(error).catch(()=>{});
    }

    return error;
  }

  getSeverity(message){
    if(!message) return 'low';
    const msg = message.toLowerCase();
    if(msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) return 'high';
    if(msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('not found')) return 'medium';
    if(msg.includes('resizeobserver') || msg.includes('script error') || msg.includes('non-error')) return 'low';
    return 'medium';
  }

  getUserFriendlyMessage(error){
    if(!error.message) return null;
    const msg = error.message.toLowerCase();

    if(msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')){
      return 'Network issue - please check your internet 🌐';
    }
    if(msg.includes('timeout') || msg.includes('aborted')){
      return 'Request timed out - please retry ⏳';
    }
    if(msg.includes('unauthorized') || msg.includes('401')){
      return 'Session expired - please login again 🔒';
    }
    if(msg.includes('forbidden') || msg.includes('403')){
      return 'You do not have permission for this action ⛔';
    }
    if(msg.includes('not found') || msg.includes('404')){
      return 'Requested data not found 🔍';
    }
    if(msg.includes('500') || msg.includes('server error') || msg.includes('internal')){
      return 'Server error - our team is fixing it 🛠️';
    }
    if(msg.includes('quota exceeded') || msg.includes('storage')){
      return 'Storage full - please clear some data 💾';
    }
    return null;
  }

  showErrorToast(msg){
    const toast = document.createElement('div');
    toast.id = 'errorToast';
    toast.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#dc2626;color:#fff;padding:12px 16px;border-radius:12px;font-family:Outfit,sans-serif;font-weight:800;font-size:13px;z-index:999999;box-shadow:0 12px 24px rgba(0,0,0,.2);animation:slideUp.3s;max-width:90vw`;
    toast.innerHTML = `${msg} <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:20px;height:20px;border-radius:50%;margin-left:8px;cursor:pointer">✕</button><style>@keyframes slideUp{from{transform:translate(-50%,20px);opacity:0}to{transform:translate(-50%,0);opacity:1}}</style>`;
    document.body.appendChild(toast);
    setTimeout(()=>{ if(toast.parentElement) toast.remove(); }, 4000);
  }

  async reportToBackend(error){
    try{
      if(!window.ApiCore) return;
      await window.ApiCore.post('/api/common/errors/report', {
        error: {
          message: error.message,
          stack: error.stack,
          type: error.type,
          file: error.file,
          line: error.line,
          url: error.url,
          shopId: this.shopId,
          userAgent: error.userAgent || navigator.userAgent,
          timestamp: error.timestamp,
          severity: error.severity,
          count: this.errorCounts.get(`${error.message}:${error.file||''}:${error.line||''}`) || 1
        }
      }).catch(()=>{}); // Silent fail
    }catch(e){}
  }

  reportIfNeeded(){
    if(this.errors.length >= 10){
      const recent = this.errors.slice(-10);
      const criticalCount = recent.filter(e=> e.severity === 'high').length;
      if(criticalCount >= 3){
        console.warn(`High error rate detected: ${criticalCount} critical errors in last 10`);
        this.reportToBackend({
          type: 'error_burst',
          message: `Burst of ${criticalCount} critical errors`,
          stack: JSON.stringify(recent.map(e=> e.message)),
          severity: 'high',
          timestamp: Date.now()
        });
      }
    }
  }

  handleApiError(error, context = ''){
    const apiError = {
      type: 'api',
      message: error.message || `API Error in ${context}`,
      stack: error.stack || '',
      status: error.status || 0,
      data: error.data || null,
      context,
      url: location.href,
      shopId: this.shopId,
      timestamp: Date.now(),
      severity: error.status >= 500? 'high' : error.status >= 400? 'medium' : 'low'
    };

    this.logError(apiError);

    // User friendly handling
    if(error.status === 401){
      if(window.AuthCore) window.AuthCore.showAuthModal();
    } else if(error.status === 403){
      if(window.Toast) Toast.show('Access denied ⛔', 'error');
    } else if(error.status === 404){
      if(context.includes('shop') || context.includes('product')){
        if(window.EmptyState) EmptyState.show('products');
      }
    } else if(error.status >= 500){
      if(window.Toast) Toast.show('Server error - please try again later', 'error');
    } else if(error.message.includes('Failed to fetch')){
      if(window.Toast) Toast.show('Network error - check internet', 'error');
    }

    return apiError;
  }

  wrapAsync(fn, context = 'unknown'){
    return async (...args)=>{
      try{
        return await fn(...args);
      }catch(e){
        this.handleApiError(e, context);
        throw e;
      }
    };
  }

  wrap(fn, context = 'unknown'){
    return (...args)=>{
      try{
        const result = fn(...args);
        if(result instanceof Promise){
          return result.catch(e=>{
            this.handleApiError(e, context);
            throw e;
          });
        }
        return result;
      }catch(e){
        this.handleApiError(e, context);
        throw e;
      }
    };
  }

  onError(callback){ this.listeners.push(callback); }

  getErrors(){ return [...this.errors]; }
  clearErrors(){ this.errors = []; this.errorCounts.clear(); }
  getErrorCount(){ return this.errors.length; }

  // Utility to show error page
  showErrorPage(title, message, actionText = 'Retry', actionFn = null){
    document.body.innerHTML = `
      <div style="height:100vh;display:grid;place-items:center;font-family:Outfit,sans-serif;text-align:center;padding:20px;background:#f8fafc">
        <div style="background:#fff;padding:32px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,.08);max-width:380px;width:100%">
          <div style="width:80px;height:80px;background:#fee2e2;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;font-size:40px">⚠️</div>
          <h2 style="font-weight:900;margin:0 0 8px;font-size:20px;color:#0f172a">${title}</h2>
          <p style="color:#64748b;font-size:13px;margin:0 0 20px;line-height:1.5">${message}</p>
          <button id="errorActionBtn" style="width:100%;background:#0f172a;color:#fff;border:none;padding:14px;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer">${actionText}</button>
          <a href="/" style="display:block;margin-top:10px;color:#64748b;text-decoration:none;font-size:13px;font-weight:700">Go Home</a>
          <div style="margin-top:16px;font-size:11px;color:#94a3b8;background:#f8fafc;padding:8px;border-radius:8px">Shop ID: ${this.shopId.slice(-8) || 'N/A'} • ${new Date().toLocaleString()}</div>
        </div>
      </div>
    `;
    document.getElementById('errorActionBtn')?.addEventListener('click', ()=>{
      if(actionFn) actionFn();
      else location.reload();
    });
  }
}

window.ErrorHandler = new ErrorHandler();
window.handleError = (error, context)=> window.ErrorHandler.handleApiError(error, context);
window.wrapError = (fn, context)=> window.ErrorHandler.wrap(fn, context);
window.wrapAsyncError = (fn, context)=> window.ErrorHandler.wrapAsync(fn, context);