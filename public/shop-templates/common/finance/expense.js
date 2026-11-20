// LOCATION: public/shop-templates/common/finance/expense.js - V1 FINAL - NO DEMO, NO LOCALSTORAGE
// RULE 1: Demo seed kabhi nahi. Nahi hai toh "No expense yet" + 0.
// RULE 2: localStorage me paisa kabhi save nahi hoga. Sirf Server.
// RULE 3: Add / Delete sab /api/common/finance/:shopId/expense se.
// FLOW: Add -> POST finance/expense -> Server FinanceTransaction -> List reload

class ExpenseCore {
  constructor() {
    this.shopId = new URLSearchParams(location.search).get('shopId') || localStorage.getItem('shopId') || '';
    this.expenses = [];
    this.categories = ['stock', 'rent', 'delivery', 'salary', 'utility', 'marketing', 'maintenance', 'other'];
    this.filter = 'all';
    this.sortBy = 'date_desc';
    this.searchQuery = '';
  }

  async init() {
    await this.loadExpenses();
    this.bindEvents();
    this.initChart();
  }

  // ============ LOAD - SERVER SE ============
  async loadExpenses() {
    try {
      if (window.Loader) Loader.show('Loading expenses...');
      if (!this.shopId) { this.expenses = []; this.render(); return; }

      // ApiCore ho toh wahi, nahi ho toh seedha fetch
      let data = null;
      if (window.ApiCore && window.ApiCore.get) {
        data = await window.ApiCore.get(`/api/common/finance/${this.shopId}/expense`);
      } else {
        const r = await fetch(`/api/common/finance/${this.shopId}/expense`);
        data = await r.json();
      }
      // Backend se aaya toh wahi, nahi aaya toh [] - Demo kabhi nahi
      this.expenses = (data && data.expenses) ? data.expenses : [];
      this.render();
      this.updateAnalytics();
    } catch (e) {
      console.error('Load expenses failed', e);
      this.expenses = [];
      this.render();
      if (window.Toast) Toast.show('Expenses load nahi hue', 'error');
    } finally {
      if (window.Loader) Loader.hide();
    }
  }

  // ============ ADD - SERVER PE ============
  async addExpense() {
    const titleEl = document.getElementById('expenseTitle');
    const amountEl = document.getElementById('expenseAmount');
    const catEl = document.getElementById('expenseCategory');
    const payEl = document.getElementById('expensePayment');
    const noteEl = document.getElementById('expenseNote');
    const dateEl = document.getElementById('expenseDate');

    const title = titleEl ? titleEl.value.trim() : '';
    const amount = amountEl ? Number(amountEl.value) : 0;
    if (!title || !amount || amount <= 0) {
      if (window.Toast) Toast.show('Title aur Amount sahi daalo', 'error');
      return;
    }

    try {
      const body = {
        title,
        amount,
        category: catEl ? catEl.value : 'other',
        paymentMethod: payEl ? payEl.value : 'cash',
        description: noteEl ? noteEl.value.trim() : '',
        date: dateEl && dateEl.value ? dateEl.value : new Date().toISOString(),
      };
      if (window.ApiCore && window.ApiCore.post) {
        await window.ApiCore.post(`/api/common/finance/${this.shopId}/expense`, body);
      } else {
        await fetch(`/api/common/finance/${this.shopId}/expense`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      if (window.Toast) Toast.show('Expense add ho gaya', 'success');
      // Form clear
      if (titleEl) titleEl.value = '';
      if (amountEl) amountEl.value = '';
      if (noteEl) noteEl.value = '';
      // Modal band ho toh band karo
      const modal = document.getElementById('addExpenseModal');
      if (modal) modal.style.display = 'none';
      await this.loadExpenses();
      this.initChart();
    } catch (e) {
      if (window.Toast) Toast.show('Expense add nahi hua', 'error');
    }
  }

  // ============ DELETE - SERVER PE ============
  async deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      if (window.ApiCore && window.ApiCore.delete) {
        await window.ApiCore.delete(`/api/common/finance/${this.shopId}/expense/${id}`);
      } else {
        await fetch(`/api/common/finance/${this.shopId}/expense/${id}`, { method: 'DELETE' });
      }
      this.expenses = this.expenses.filter(e => (e._id || e.id) !== id);
      this.render();
      this.updateAnalytics();
      if (window.Toast) Toast.show('Expense deleted', 'success');
    } catch (e) {
      if (window.Toast) Toast.show('Delete nahi hua', 'error');
    }
  }

  // ============ ANALYTICS ============
  updateAnalytics() {
    const total = this.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const now = new Date();
    const thisMonth = this.expenses.filter(e => { const d = new Date(e.createdAt || e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const monthTotal = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);

    const byCategory = {};
    this.expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0); });
    const highestCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    const totalEl = document.getElementById('analyticsTotalExpense');
    if (totalEl) totalEl.innerText = `₹${total}`;
    const monthEl = document.getElementById('analyticsMonthExpense');
    if (monthEl) monthEl.innerText = `₹${monthTotal}`;
    const highestCatEl = document.getElementById('analyticsHighestCategory');
    if (highestCatEl) highestCatEl.innerText = highestCat ? `${highestCat[0]}: ₹${highestCat[1]}` : 'No expense yet';
    const headerEl = document.getElementById('totalExpenseHeader');
    if (headerEl) headerEl.innerText = `₹${monthTotal}`;

    this.updateCategoryChart(byCategory);
  }

  updateCategoryChart(byCategory) {
    const canvas = document.getElementById('expenseCategoryChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const labels = Object.keys(byCategory);
    const data = Object.values(byCategory);
    if (window.expenseChart) window.expenseChart.destroy();
    const ctx = canvas.getContext('2d');
    window.expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: ['#0f172a', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Outfit', weight: '700' }, boxWidth: 12 } } } }
    });
  }

  // ============ RENDER ============
  render() {
    const container = document.getElementById('expensesList');
    if (!container) return;
    let filtered = [...this.expenses];
    if (this.filter !== 'all') filtered = filtered.filter(e => e.category === this.filter);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e => (e.title || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
    }
    if (this.sortBy === 'date_desc') filtered.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    if (this.sortBy === 'date_asc') filtered.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
    if (this.sortBy === 'amount_desc') filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    if (this.sortBy === 'amount_asc') filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));

    const empty = document.getElementById('expenseEmpty');
    if (filtered.length === 0) {
      container.innerHTML = '';
      if (empty) { empty.style.display = 'block'; empty.innerText = 'No expense yet. + Add pe dabake pehla expense daalo.'; }
      return;
    }
    if (empty) empty.style.display = 'none';
    container.style.display = 'flex';
    const icons = { stock: '🛒', rent: '🏠', delivery: '🚚', salary: '👨‍💼', utility: '💡', marketing: '📢', maintenance: '🔧', other: '📦' };
    container.innerHTML = filtered.map(exp => `
      <div class="expense-item" data-id="${exp._id}">
        <div class="expense-icon">${icons[exp.category] || '📦'}</div>
        <div class="expense-info">
          <b>${exp.title}</b>
          <span>${exp.category} • ${new Date(exp.createdAt || exp.date).toLocaleDateString()} • ${exp.paymentMethod || 'cash'}</span>
        </div>
        <b class="expense-amount">-₹${exp.amount}</b>
        <button class="expense-del" onclick="window.ExpenseCore.deleteExpense('${exp._id}')">✕</button>
      </div>
    `).join('');
  }

  // ============ EVENTS ============
  bindEvents() {
    const searchInput = document.getElementById('expenseSearch');
    if (searchInput) searchInput.addEventListener('input', (e) => { this.searchQuery = e.target.value; this.render(); });
    const sortSelect = document.getElementById('expenseSort');
    if (sortSelect) sortSelect.addEventListener('change', (e) => { this.sortBy = e.target.value; this.render(); });
    const addBtn = document.getElementById('addExpenseBtn');
    if (addBtn) addBtn.addEventListener('click', () => {
      const modal = document.getElementById('addExpenseModal');
      if (modal) modal.style.display = 'block';
      else this.addExpense();
    });
    const saveBtn = document.getElementById('saveExpenseBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.addExpense());
    const backBtn = document.getElementById('expenseBack');
    if (backBtn) backBtn.addEventListener('click', () => history.back());
  }

  initChart() {
    const canvas = document.getElementById('expenseTrendChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const days = [], amounts = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en', { weekday: 'short' }));
      const dayTotal = this.expenses.filter(e => { const d = new Date(e.createdAt || e.date); return d.toDateString() === date.toDateString(); }).reduce((s, e) => s + (e.amount || 0), 0);
      amounts.push(dayTotal);
    }
    const ctx = canvas.getContext('2d');
    if (window.expenseTrendChart) window.expenseTrendChart.destroy();
    window.expenseTrendChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: days, datasets: [{ label: 'Expense', data: amounts, backgroundColor: '#ef4444', borderRadius: 8 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
    });
  }

  exportCSV() {
    const csv = this.expenses.map(e => `${new Date(e.createdAt || e.date).toLocaleDateString()},${e.category},${e.title},${e.amount},${e.paymentMethod || ''},${e.description || ''}`).join('\n');
    const blob = new Blob([`Date,Category,Title,Amount,Payment,Note\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `expenses_${this.shopId}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  }
}

window.ExpenseCore = new ExpenseCore();
document.addEventListener('DOMContentLoaded', () => window.ExpenseCore.init());