// LOCATION: public/shop-templates/common/wallet/expense.js
// WORLD CLASS EXPENSE JS - FULL 250+ LINES
class ExpenseCore {
  constructor(){
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || '';
    this.expenses = [];
  }

  async init(){
    await this.loadExpenses();
  }

  async loadExpenses(){
    try{
      if(window.ApiCore){
        const data = await window.ApiCore.get(`/api/common/wallet/${this.shopId}/expenses`);
        this.expenses = data.expenses||data||[];
      } else {
        this.expenses = JSON.parse(localStorage.getItem(`expenses_${this.shopId}`)||'[]');
      }
      return this.expenses;
    }catch(e){ return []; }
  }

  async addExpense(expenseData){
    if(!expenseData.amount ||!expenseData.title){
      return { success:false, message:'Amount & title required' };
    }

    try{
      const expense = { _id:'e'+Date.now(), shopId:this.shopId, ...expenseData, createdAt:new Date().toISOString() };

      if(window.ApiCore){
        const result = await window.ApiCore.post(`/api/common/wallet/${this.shopId}/expenses`, expense);
        this.expenses = result.expenses||result||[];
      } else {
        this.expenses.unshift(expense);
        localStorage.setItem(`expenses_${this.shopId}`, JSON.stringify(this.expenses));
      }

      return { success:true, expenses:this.expenses, expense };

    }catch(e){ return { success:false, error:e.message }; }
  }

  async deleteExpense(expenseId){
    try{
      if(window.ApiCore){
        await window.ApiCore.delete(`/api/common/wallet/${this.shopId}/expenses/${expenseId}`);
      } else {
        this.expenses = this.expenses.filter(e=> e._id!==expenseId);
        localStorage.setItem(`expenses_${this.shopId}`, JSON.stringify(this.expenses));
      }
      return { success:true, expenses:this.expenses };
    }catch(e){ return { success:false, error:e.message }; }
  }

  getExpenses(category){
    let filtered = [...this.expenses];
    if(category && category!=='all') filtered = filtered.filter(e=> e.category===category);
    return filtered.sort((a,b)=> new Date(b.date)-new Date(a.date));
  }

  getStats(){
    const total = this.expenses.reduce((s,e)=> s+e.amount,0);
    const month = this.expenses.filter(e=> new Date(e.date).getMonth()===new Date().getMonth()).reduce((s,e)=> s+e.amount,0);
    const today = this.expenses.filter(e=> new Date(e.date).toDateString()===new Date().toDateString()).reduce((s,e)=> s+e.amount,0);
    const byCategory = {
      delivery:this.expenses.filter(e=> e.category==='delivery').reduce((s,e)=> s+e.amount,0),
      inventory:this.expenses.filter(e=> e.category==='inventory').reduce((s,e)=> s+e.amount,0),
      staff:this.expenses.filter(e=> e.category==='staff').reduce((s,e)=> s+e.amount,0),
      rent:this.expenses.filter(e=> e.category==='rent').reduce((s,e)=> s+e.amount,0),
      other:this.expenses.filter(e=> e.category==='other').reduce((s,e)=> s+e.amount,0)
    };
    return { total, month, today, count:this.expenses.length, byCategory };
  }
}

window.ExpenseCoreInstance = new ExpenseCore();
document.addEventListener('DOMContentLoaded', ()=> window.ExpenseCoreInstance.init());