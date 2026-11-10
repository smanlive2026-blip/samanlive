// LOCATION: public/shop-templates/common/wallet/wallet.js - V25 - UNIFIED - FULL CODE
// WORLD CLASS WALLET JS - FULL
// RULE: Wallet = Server se hi aayega, Server pe hi save hoga. Is file me koi bhi browser storage use NAHI hoga.
// RULE 2: shopId SIRF URL se aayega. URL me nahi hai toh galat shop ka wallet kabhi nahi kholega.
// RULE 3: Transaction ka _id Server banayega, hum browser me fake ID kabhi nahi banayenge.
// RULE 4: Balance hum browser me KABHI nahi ghatayenge / badhayenge. Balance Server hi ghatayega / badhayega.
// RULE 5: Fake balance KABHI nahi dikhayenge. Server se nahi mila toh balance 0 rahega, 12450.50 jaisa hardcode balance KABHI nahi dikhega.
// FLOW: Load -> GET /api/common/wallet/:shopId -> Add -> POST /api/common/wallet/:shopId/transaction -> Withdraw -> POST /api/common/wallet/:shopId/payout -> Credit From Order -> POST /api/common/wallet/:shopId/transaction -> dobara Server se Load
// FIX V25: Pehle is file me shopId + balance + transactions browser storage se aate the, aur save / balance bhi browser storage me hota tha. Ab FULL Server only hai.
class WalletCore {
  constructor(){
    // shopId SIRF URL se - kahi aur se NAHI
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.balance = 0;
    this.transactions = [];
  }

  getToken(){
    try{ if(window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; }catch(e){}
    return window.USER_TOKEN || '';
  }
  getUserId(){
    try{ if(window.AuthCore && window.AuthCore.getUserId) return window.AuthCore.getUserId() || ''; }catch(e){}
    if(window.currentUser && window.currentUser._id) return window.currentUser._id;
    return '';
  }
  getHeaders(){
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken(), 'x-buyer-id': this.getUserId() };
  }
  num(v){ const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  safeDate(d){
    try{ const dt = new Date(d); if(isNaN(dt)) return null; return dt; }catch(e){ return null; }
  }
  isSameDay(a,b){
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  async init(){
    await this.loadWallet();
  }

  async loadWallet(){
    try{
      if(!this.shopId){
        // shopId URL me nahi hai toh galat shop ka wallet kabhi nahi kholega - balance 0 hi rahega
        this.balance = 0;
        this.transactions = [];
        return { balance: this.balance, transactions: this.transactions };
      }

      let data = null;
      // 1. ApiCore se - HAMESHA Server se
      if(window.ApiCore){
        try{
          data = await window.ApiCore.get(`/api/common/wallet/${this.shopId}`);
        }catch(e){ data = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server se hi mangenge
      if(!data){
        try{
          const res = await fetch(`/api/common/wallet/${this.shopId}`, { headers: this.getHeaders() }).then(r=>r.json()).catch(()=>null);
          if(res) data = res;
        }catch(e){}
      }
      // 3. NO Browser storage fallback + NO Fake balance - Server se nahi mila toh balance 0 + transactions khaali hi rahenge, 12450.50 jaisa fake balance KABHI nahi dikhega
      if(!data || typeof data !== 'object'){
        this.balance = 0;
        this.transactions = [];
      } else {
        this.balance = this.num(data.balance ?? data.availableBalance ?? data.totalBalance ?? 0);
        this.transactions = Array.isArray(data.transactions) ? data.transactions : Array.isArray(data) ? data : [];
      }
      return { balance: this.balance, transactions: this.transactions };
    }catch(e){
      this.balance = 0;
      this.transactions = [];
      return { balance: 0, transactions: [] };
    }
  }

  async addTransaction(transaction){
    if(!transaction || !transaction.amount || this.num(transaction.amount) <= 0){
      return { success: false, message: 'Amount required' };
    }
    if(!this.shopId){
      return { success: false, message: 'Shop not found - URL me ?shopId=XXX hona chahiye' };
    }
    try{
      // _id Server banayega, hum browser me fake ID nahi banayenge - isliye transaction me _id bhejte hi nahi
      const payload = { shopId: this.shopId, ...transaction, createdAt: new Date().toISOString(), status: transaction.status || 'success' };
      delete payload._id;

      let saved = null;
      // 1. ApiCore se - HAMESHA Server pe
      if(window.ApiCore){
        try{
          const result = await window.ApiCore.post(`/api/common/wallet/${this.shopId}/transaction`, payload);
          saved = result || null;
        }catch(e){ saved = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server pe hi save hoga
      if(!saved){
        try{
          const res = await fetch(`/api/common/wallet/${this.shopId}/transaction`, { method:'POST', headers: this.getHeaders(), body: JSON.stringify(payload) }).then(r=>r.json()).catch(()=>null);
          if(res && (res.success || res.transaction || res.balance !== undefined || !res.error)) saved = res;
        }catch(e){}
      }
      // 3. Server pe save nahi hua toh dhokha nahi denge - browser storage me save karke "success" nahi bolenge, aur Balance browser me KABHI nahi ghatayenge / badhayenge
      if(!saved){
        return { success: false, message: 'Server me save nahi hua - Transaction add nahi hui' };
      }

      // Save ke baad turant Server se dobara mang ke verify karo - tabhi balance + transactions update honge
      await this.loadWallet();

      if(window.SocketCore){
        try{ window.SocketCore.emit('wallet-updated', { shopId: this.shopId, balance: this.balance, transaction: payload }); }catch(e){}
      }

      return { success: true, balance: this.balance, transactions: this.transactions };

    }catch(e){ return { success: false, error: e.message }; }
  }

  async withdraw(amount, withdrawTo, note){
    const amt = this.num(amount);
    if(!amt || amt < 100) return { success: false, message: 'Min ₹100' };
    if(amt > this.balance) return { success: false, message: 'Insufficient balance' };
    if(amt > 50000) return { success: false, message: 'Max ₹50,000 per day' };
    if(!withdrawTo) return { success: false, message: 'Payout method required - Shop Settings se Bank / UPI add karo' };

    // Withdraw bhi addTransaction se hi jayega - taaki Server pe hi save ho + Balance Server hi ghataye
    // withdrawTo yaha string bhi ho sakta hai (old code) ya object bhi (new code) - dono handle karenge, hardcode Bank / UPI KABHI nahi banayenge
    const payoutMethod = typeof withdrawTo === 'string' ? withdrawTo : (withdrawTo._id || withdrawTo.id || withdrawTo);

    return await this.addTransaction({
      type: 'debit',
      category: 'payout',
      amount: amt,
      title: 'Payout Request',
      desc: `${typeof payoutMethod === 'string' ? payoutMethod : 'Payout Method'} • ${note || 'Withdrawal'}`,
      payoutMethodId: typeof payoutMethod === 'string' && payoutMethod.includes('-') ? payoutMethod : undefined,
      payoutMethod: payoutMethod,
      note: note || 'Withdrawal',
      status: 'pending'
    });
  }

  async creditFromOrder(order){
    if(!order) return { success: false, message: 'Order not found' };
    const amount = this.num(order.total ?? order.amount ?? 0);
    if(amount <= 0) return { success: false, message: 'Order amount required' };

    return await this.addTransaction({
      type: 'credit',
      category: 'order',
      amount,
      title: 'Order Payment',
      desc: `Order #${order._id || order.orderId || ''} • ${order.customerName || order.customer || 'Customer'}`,
      status: 'success',
      orderId: order._id || order.orderId
    });
  }

  getBalance(){
    return this.balance;
  }

  getTransactions(filter){
    let filtered = [...this.transactions];
    if(filter && filter!=='all'){
      filtered = filtered.filter(t=> t.type===filter || t.category===filter);
    }
    return filtered.sort((a,b)=>{
      const da = this.safeDate(b.date || b.createdAt);
      const db = this.safeDate(a.date || a.createdAt);
      if(!da && !db) return 0;
      if(!da) return 1;
      if(!db) return -1;
      return da - db;
    });
  }

  getStats(){
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate()-7);
    const creditTxns = this.transactions.filter(t=> t.type==='credit');

    const totalCredit = creditTxns.reduce((s,t)=> s + this.num(t.amount), 0);
    const totalDebit = this.transactions.filter(t=> t.type==='debit').reduce((s,t)=> s + this.num(t.amount), 0);
    const totalPayouts = this.transactions.filter(t=> t.category==='payout').reduce((s,t)=> s + this.num(t.amount), 0);
    const pending = this.transactions.filter(t=> t.status==='pending').reduce((s,t)=> s + this.num(t.amount), 0);
    const today = creditTxns.filter(t=>{
      const d = this.safeDate(t.date || t.createdAt); return d && this.isSameDay(d, now);
    }).reduce((s,t)=> s + this.num(t.amount), 0);
    const week = creditTxns.filter(t=>{
      const d = this.safeDate(t.date || t.createdAt); return d && d >= weekAgo && d <= now;
    }).reduce((s,t)=> s + this.num(t.amount), 0);
    const month = creditTxns.filter(t=>{
      const d = this.safeDate(t.date || t.createdAt); return d && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }).reduce((s,t)=> s + this.num(t.amount), 0);

    return { balance: this.balance, totalCredit, totalDebit, totalPayouts, pending, today, week, month, totalTransactions: this.transactions.length };
  }
}

window.WalletCoreInstance = new WalletCore();
document.addEventListener('DOMContentLoaded', ()=> window.WalletCoreInstance.init());