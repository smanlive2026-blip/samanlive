// LOCATION: public/shop-templates/common/wallet/expense.js - V25 - UNIFIED - FULL CODE
// WORLD CLASS EXPENSE JS - FULL
// RULE: Expense = Server se hi aayega, Server pe hi save hoga. Is file me koi bhi browser storage use NAHI hoga.
// RULE 2: shopId SIRF URL se aayega. URL me nahi hai toh galat shop ka kharcha kabhi nahi kholega.
// RULE 3: Expense ka _id Server banayega, hum browser me fake ID kabhi nahi banayenge.
// RULE 4: Wallet balance hum browser me KABHI nahi ghatayenge / badhayenge. Balance Server hi handle karega.
// FLOW: Load -> GET /api/common/wallet/:shopId/expenses -> Add -> POST /api/common/wallet/:shopId/expenses -> Delete -> DELETE /api/common/wallet/:shopId/expenses/:expenseId -> dobara Server se Load
// FIX V25: Pehle is file me shopId + expenses browser storage se aate the, aur save / delete bhi browser storage me hota tha. Ab FULL Server only hai.
class ExpenseCore {
  constructor(){
    // shopId SIRF URL se - kahi aur se NAHI
    this.shopId = new URLSearchParams(location.search).get('shopId') || '';
    this.expenses = [];
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
  safeDate(d){
    try{ const dt = new Date(d); if(isNaN(dt)) return null; return dt; }catch(e){ return null; }
  }

  async init(){
    await this.loadExpenses();
  }

  async loadExpenses(){
    try{
      if(!this.shopId){
        // shopId URL me nahi hai toh galat shop ka kharcha kabhi nahi kholega - khaali hi rahega
        this.expenses = [];
        return this.expenses;
      }

      let fetched = null;
      // 1. ApiCore se - HAMESHA Server se
      if(window.ApiCore){
        try{
          const data = await window.ApiCore.get(`/api/common/wallet/${this.shopId}/expenses`);
          fetched = data.expenses || data || null;
        }catch(e){ fetched = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server se hi mangenge
      if(!fetched){
        try{
          const res = await fetch(`/api/common/wallet/${this.shopId}/expenses`, { headers: this.getHeaders() }).then(r=>r.json()).catch(()=>null);
          if(res) fetched = res.expenses || res;
        }catch(e){}
      }
      // 3. NO Browser storage fallback + NO Fake expense - Server se nahi mila toh khaali hi rahega, Fuel / Stock / Rent jaisa fake kharcha KABHI nahi banega
      this.expenses = Array.isArray(fetched) ? fetched : [];
      return this.expenses;
    }catch(e){ this.expenses = []; return this.expenses; }
  }

  async addExpense(expenseData){
    if(!expenseData || !expenseData.amount || !expenseData.title){
      return { success: false, message: 'Amount & title required' };
    }
    if(!this.shopId){
      return { success: false, message: 'Shop not found - URL me ?shopId=XXX hona chahiye' };
    }

    try{
      // _id Server banayega, hum browser me fake ID nahi banayenge - isliye expense me _id bhejte hi nahi
      const expense = { shopId: this.shopId, ...expenseData, createdAt: new Date().toISOString() };
      delete expense._id;

      let saved = null;
      // 1. ApiCore se - HAMESHA Server pe
      if(window.ApiCore){
        try{
          const result = await window.ApiCore.post(`/api/common/wallet/${this.shopId}/expenses`, expense);
          saved = result || null;
        }catch(e){ saved = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server pe hi save hoga
      if(!saved){
        try{
          const res = await fetch(`/api/common/wallet/${this.shopId}/expenses`, { method:'POST', headers: this.getHeaders(), body: JSON.stringify(expense) }).then(r=>r.json()).catch(()=>null);
          if(res && (res.success || res.expense || !res.error)) saved = res;
        }catch(e){}
      }
      // 3. Server pe save nahi hua toh dhokha nahi denge - browser storage me save karke "saved" nahi bolenge
      if(!saved){
        return { success: false, message: 'Server me save nahi hua - Expense add nahi hua' };
      }

      // Save ke baad turant Server se dobara mang ke verify karo - tabhi this.expenses update hoga
      await this.loadExpenses();
      const newExpense = saved.expense || saved || expense;

      return { success: true, expenses: this.expenses, expense: newExpense };

    }catch(e){ return { success: false, error: e.message }; }
  }

  async deleteExpense(expenseId){
    if(!expenseId) return { success: false, message: 'Expense not found' };
    if(!this.shopId) return { success: false, message: 'Shop not found' };
    try{
      let deleted = false;
      // 1. ApiCore se - HAMESHA Server pe
      if(window.ApiCore){
        try{ await window.ApiCore.delete(`/api/common/wallet/${this.shopId}/expenses/${expenseId}`); deleted = true; }catch(e){ deleted = false; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server pe hi delete hoga
      if(!deleted){
        try{
          const res = await fetch(`/api/common/wallet/${this.shopId}/expenses/${expenseId}`, { method:'DELETE', headers: this.getHeaders() }).then(r=>r.json()).catch(()=>null);
          if(res && (res.success || !res.error)) deleted = true;
        }catch(e){}
      }
      // 3. Server pe delete nahi hua toh list se hatayenge hi nahi - dhokha nahi denge
      if(!deleted){
        return { success: false, message: 'Server me delete nahi hua - dobara try karo' };
      }

      // Delete ke baad turant Server se dobara mang ke verify karo
      await this.loadExpenses();
      return { success: true, expenses: this.expenses };
    }catch(e){ return { success: false, error: e.message }; }
  }

  getExpenses(category){
    let filtered = [...this.expenses];
    if(category && category!=='all') filtered = filtered.filter(e=> e.category===category);
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
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const getAmount = (e)=> parseFloat(e.amount) || 0;

    const total = this.expenses.reduce((s,e)=> s + getAmount(e), 0);
    const month = this.expenses.filter(e=>{
      const d = this.safeDate(e.date || e.createdAt);
      return d && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }).reduce((s,e)=> s + getAmount(e), 0);
    const today = this.expenses.filter(e=>{
      const d = this.safeDate(e.date || e.createdAt);
      if(!d) return false;
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return ds === todayStr;
    }).reduce((s,e)=> s + getAmount(e), 0);
    const byCategory = {
      delivery: this.expenses.filter(e=> e.category==='delivery').reduce((s,e)=> s + getAmount(e), 0),
      inventory: this.expenses.filter(e=> e.category==='inventory').reduce((s,e)=> s + getAmount(e), 0),
      staff: this.expenses.filter(e=> e.category==='staff').reduce((s,e)=> s + getAmount(e), 0),
      rent: this.expenses.filter(e=> e.category==='rent').reduce((s,e)=> s + getAmount(e), 0),
      marketing: this.expenses.filter(e=> e.category==='marketing').reduce((s,e)=> s + getAmount(e), 0),
      other: this.expenses.filter(e=> e.category==='other').reduce((s,e)=> s + getAmount(e), 0)
    };
    return { total, month, today, count: this.expenses.length, byCategory };
  }
}

window.ExpenseCoreInstance = new ExpenseCore();
document.addEventListener('DOMContentLoaded', ()=> window.ExpenseCoreInstance.init());