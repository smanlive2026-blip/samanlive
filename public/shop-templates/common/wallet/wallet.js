// LOCATION: public/shop-templates/common/wallet/wallet.js - V3 FINAL - UNIFIED - WORLD CLASS
// RULE 1: Balance Server se hi aayega, Server pe hi save hoga. Browser storage / localStorage KABHI nahi.
// RULE 2: shopId / userId SIRF URL se aayega. URL me nahi hai toh galat wallet kabhi nahi kholega.
// RULE 3: Balance browser me KABHI + / - nahi karenge. Balance Server hi badlayega.
// RULE 4: Fake balance / Fake transaction KABHI nahi. Server se nahi mila toh 0 + "No transactions yet".
// RULE 5: Bank / UPI KABHI hardcode nahi. User jo dalega wahi jayega.
// FLOW: URL se role + id -> GET /api/common/wallet/:ownerType/:ownerId -> Render -> Withdraw -> POST payout -> Reload

class WalletCore {
  constructor() {
    const params = new URLSearchParams(location.search);
    // ===== ROLE + ID - URL SE HI =====
    this.role = (params.get('role') || params.get('userRole') || '').toLowerCase();
    this.shopId = params.get('shopId') || params.get('shop_id') || '';
    this.userId = params.get('userId') || params.get('user_id') || params.get('buyerId') || '';
    this.managerId = params.get('managerId') || params.get('areaManagerId') || '';
    this.deliveryBoyId = params.get('deliveryBoyId') || params.get('deliveryId') || '';
    this.targetId = params.get('targetId') || '';
    this.targetRole = (params.get('targetRole') || '').toLowerCase();

    // Role nahi diya toh shopId hai toh shop_owner maan lo, nahi toh customer
    if (!this.role) this.role = this.shopId ? 'shop_owner' : 'customer';

    // ===== OWNER TYPE + OWNER ID - API KE LIYE =====
    const mapped = this.resolveOwner();
    this.ownerType = mapped.ownerType; // shop / customer / area_manager / delivery_boy
    this.ownerId = mapped.ownerId;

    this.balance = 0;
    this.transactions = [];
    this.totalEarning = 0;
    this.totalPayout = 0;
    this.totalOrders = 0;
    this.todayEarning = 0;
    this.monthEarning = 0;
    this.canWithdraw = false;
    this.canPayWithWallet = false;
    this.filter = 'all';
    this.page = 1;
    this.totalPages = 1;
    this.hideBalance = false;
    this.payoutMethod = 'upi';
    this.loading = false;
  }

  // ===== ROLE SE OWNER NIKALO =====
  resolveOwner() {
    // Admin kisi ka bhi wallet dekh raha hai - targetId se
    if (this.role === 'admin' || this.role === 'super_admin') {
      if (this.targetId) {
        const t = this.targetRole || 'shop_owner';
        if (t.includes('customer') || t.includes('user')) return { ownerType: 'customer', ownerId: this.targetId };
        if (t.includes('area') || t.includes('manager')) return { ownerType: 'area_manager', ownerId: this.targetId };
        if (t.includes('delivery')) return { ownerType: 'delivery_boy', ownerId: this.targetId };
        return { ownerType: 'shop', ownerId: this.targetId };
      }
      // Admin ne target nahi diya toh apna khud ka kuch nahi - 0 dikhega
      return { ownerType: 'admin', ownerId: '' };
    }
    if (this.role.includes('shop')) return { ownerType: 'shop', ownerId: this.shopId || this.userId };
    if (this.role.includes('customer') || this.role.includes('user') || this.role.includes('buyer')) return { ownerType: 'customer', ownerId: this.userId || this.shopId };
    if (this.role.includes('area') || this.role === 'manager') return { ownerType: 'area_manager', ownerId: this.managerId || this.userId };
    if (this.role.includes('delivery')) return { ownerType: 'delivery_boy', ownerId: this.deliveryBoyId || this.userId };
    if (this.role.includes('product')) return { ownerType: 'admin', ownerId: '' }; // Product Manager ka wallet nahi hota
    return { ownerType: 'customer', ownerId: this.userId || '' };
  }

  // ===== ROLE KE HISAB SE NAAM / LABEL =====
  getRoleMeta() {
    if (this.ownerType === 'shop') return { title: 'Shop Wallet', subtitle: 'Dukaan ki Earning', badge: 'SHOP', balanceLabel: 'Total Balance', stat1: 'Total Earning', stat2: 'Total Orders', stat3: 'Total Payout', info: 'Order se jo paisa aaya, commission kat ke jo bacha, wo yahan dikhega.' };
    if (this.ownerType === 'customer') return { title: 'My Wallet', subtitle: 'Cashback & Refund', badge: 'CUSTOMER', balanceLabel: 'Wallet Balance', stat1: 'Total Cashback', stat2: 'Total Refunds', stat3: 'Total Spent', info: 'Order cancel hone pe Refund aur Offer ka Cashback yahan aayega. Isse agla order pay kar sakte ho.' };
    if (this.ownerType === 'area_manager') return { title: 'Manager Wallet', subtitle: 'Commission Earning', badge: 'AREA MANAGER', balanceLabel: 'Commission Balance', stat1: 'Total Commission', stat2: 'Total Shops', stat3: 'Total Payout', info: 'Tumhare area ki dukaan se jo commission mila, wo yahan dikhega.' };
    if (this.ownerType === 'delivery_boy') return { title: 'Delivery Wallet', subtitle: 'Delivery Earning', badge: 'DELIVERY', balanceLabel: 'Delivery Balance', stat1: 'Total Earning', stat2: 'Total Deliveries', stat3: 'Total Payout', info: 'Har delivery pe jo paisa mila, wo yahan dikhega.' };
    return { title: 'Wallet - View Only', subtitle: 'Sirf dekh sakte ho', badge: 'ADMIN', balanceLabel: 'Balance', stat1: 'Total Earning', stat2: 'Total Orders', stat3: 'Total Payout', info: 'Admin sirf dekh sakta hai. Withdraw / Pay yahan se nahi hoga.' };
  }

  // ===== TOKEN =====
  getToken() {
    try { if (window.AuthCore && window.AuthCore.getToken) return window.AuthCore.getToken() || ''; } catch (e) {}
    try { return localStorage.getItem('TOKEN') || localStorage.getItem('token') || ''; } catch (e) { return ''; }
  }
  getHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }
  num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  inr(v) {
    const n = this.num(v);
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
    if (n >= 1000) return '₹' + n.toLocaleString('en-IN');
    return '₹' + n.toLocaleString('en-IN');
  }
  fmtDate(d) {
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return '';
      const today = new Date();
      const isToday = dt.toDateString() === today.toDateString();
      const time = dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
      if (isToday) return 'Today, ' + time;
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + time;
    } catch (e) { return ''; }
  }

  // ===== INIT =====
  async init() {
    this.applyRoleUI();
    this.bindEvents();
    // ID hi nahi hai toh galat wallet kabhi nahi kholenge
    if (!this.ownerId || this.ownerType === 'admin') {
      if (this.role === 'admin' || this.role === 'product_manager') {
        this.showError('Admin ke liye Wallet nahi hota. Kisi Shop / Customer ka wallet dekhne ke liye ?targetId=... bhejo.');
      } else {
        this.showError('ID Missing hai. Wapas jake apne Dashboard se Wallet kholo.');
      }
      return;
    }
    await this.loadWallet(true);
  }

  applyRoleUI() {
    const meta = this.getRoleMeta();
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('walletTitle', meta.title);
    set('walletSubtitle', meta.subtitle);
    set('roleBadge', meta.badge);
    set('balanceLabel', meta.balanceLabel);
    set('stat1Label', meta.stat1);
    set('stat2Label', meta.stat2);
    set('stat3Label', meta.stat3);
    const info = document.querySelector('#infoCard p');
    if (info) info.textContent = meta.info;
    const badge = document.getElementById('roleBadge');
    if (badge) {
      badge.className = 'header-badge';
      if (this.ownerType === 'customer') badge.classList.add('customer');
      if (this.role === 'admin') badge.classList.add('admin');
    }
    // Admin / Product Manager ko Withdraw kabhi nahi dikhega
    const withdrawBtn = document.getElementById('withdrawBtn');
    const payoutBtn = document.getElementById('payoutHistoryBtn');
    if (this.role === 'admin' || this.role === 'product_manager') {
      if (withdrawBtn) withdrawBtn.style.display = 'none';
      if (payoutBtn) payoutBtn.textContent = '🕘 Payout History';
    } else if (this.ownerType === 'customer') {
      if (withdrawBtn) withdrawBtn.textContent = '🛒 Pay With Wallet';
      if (payoutBtn) payoutBtn.textContent = '🧾 My Orders';
    }
  }

  // ===== LOAD - SIRF SERVER SE =====
  async loadWallet(first = false) {
    if (this.loading) return;
    this.loading = true;
    if (first) this.showSkeleton();
    try {
      const url = `/api/common/wallet/${this.ownerType}/${encodeURIComponent(this.ownerId)}?page=${this.page}&limit=20&filter=${this.filter}`;
      let data = null;
      // 1. ApiCore se
      if (window.ApiCore && window.ApiCore.get) {
        try { data = await window.ApiCore.get(url); } catch (e) { data = null; }
      }
      // 2. Direct fetch se - ApiCore na chale toh bhi Server se hi
      if (!data) {
        try {
          const res = await fetch(url, { headers: this.getHeaders() });
          data = await res.json().catch(() => null);
        } catch (e) { data = null; }
      }
      // 3. NO localStorage + NO Fake - Server se nahi mila toh 0 hi rahega
      if (!data || !data.success) {
        if (first) {
          this.balance = 0; this.transactions = [];
          this.renderAll();
          this.showToast(data?.message || 'Wallet load nahi hua', 'error');
        }
        this.loading = false;
        return;
      }
      this.balance = this.num(data.balance ?? data.availableBalance ?? 0);
      this.totalEarning = this.num(data.totalEarning ?? data.totalRevenue ?? 0);
      this.totalPayout = this.num(data.totalPayout ?? data.totalExpense ?? 0);
      this.totalOrders = this.num(data.totalOrders ?? 0);
      this.todayEarning = this.num(data.todayEarning ?? 0);
      this.monthEarning = this.num(data.monthEarning ?? 0);
      this.canWithdraw = !!data.canWithdraw;
      this.canPayWithWallet = !!data.canPayWithWallet;
      const list = Array.isArray(data.transactions) ? data.transactions : [];
      // Filter change hua toh naya list, Load More hai toh purane me jodo
      this.transactions = this.page === 1 ? list : [...this.transactions, ...list];
      this.totalPages = data.pagination?.totalPages || 1;
      this.renderAll();
    } catch (e) {
      if (first) this.showError('Network problem hai. Dobara try karo.');
    }
    this.loading = false;
  }

  // ===== RENDER =====
  renderAll() {
    // Balance - Hide hai toh **** dikhao
    const balEl = document.getElementById('walletBalance');
    if (balEl) balEl.textContent = this.hideBalance ? '₹ • • • •' : this.inr(this.balance);
    const sub = document.getElementById('balanceSub');
    if (sub) sub.textContent = `Today ${this.inr(this.todayEarning)} • This Month ${this.inr(this.monthEarning)}`;
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('stat1Value', this.inr(this.totalEarning));
    set('stat2Value', String(this.totalOrders));
    set('stat3Value', this.inr(this.totalPayout));
    const modalBal = document.getElementById('availableBalanceModal');
    if (modalBal) modalBal.textContent = this.inr(this.balance);
    set('countAll', String(this.transactions.length));
    this.renderTransactions();
    // Load More button
    const wrap = document.getElementById('loadMoreWrap');
    if (wrap) wrap.style.display = this.page < this.totalPages ? 'block' : 'none';
    // Withdraw button - Balance 0 hai toh bhi dikhega, click pe message aayega
    const wBtn = document.getElementById('withdrawBtn');
    if (wBtn && this.role !== 'admin' && this.role !== 'product_manager') {
      wBtn.disabled = false;
    }
  }

  renderTransactions() {
    const list = document.getElementById('txnList');
    if (!list) return;
    if (!this.transactions.length) {
      list.innerHTML = `<div class="empty"><div class="emoji">💰</div><b>No transactions yet</b><span>${this.ownerType === 'shop' ? 'Order aate hi earning yahan dikhegi' : this.ownerType === 'customer' ? 'Refund / Cashback yahan dikhega' : 'Earning aate hi yahan dikhegi'}</span></div>`;
      return;
    }
    list.innerHTML = this.transactions.map(t => {
      const isCredit = t.type === 'credit';
      const isPayout = t.reason === 'payout';
      const icon = isPayout ? '💸' : isCredit ? (t.reason === 'refund' ? '↩️' : t.reason === 'cashback' ? '🎁' : t.reason === 'commission' ? '👑' : t.reason === 'delivery_earning' ? '🛵' : '💵') : (t.reason === 'expense' ? '🛒' : '💳');
      const iconClass = isPayout ? 'payout' : isCredit ? 'credit' : 'debit';
      const title = t.title || t.reason || 'Transaction';
      const sub = `${this.fmtDate(t.createdAt || t.date)} • ${t.paymentMethod || 'Wallet'}${t.orderId ? ' • ' + t.orderId : ''}`;
      const status = t.status || 'completed';
      const statusLabel = status === 'pending' ? 'Pending' : status === 'completed' ? 'Completed' : status === 'reversed' ? 'Rejected' : status;
      return `<div class="txn-item">
        <div class="txn-icon ${iconClass}">${icon}</div>
        <div class="txn-info"><b>${this.escape(title)}</b><span>${this.escape(sub)}</span></div>
        <div class="txn-right"><b class="${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}${this.inr(t.amount)}</b><span class="txn-status ${status}">${statusLabel}</span></div>
      </div>`;
    }).join('');
  }

  escape(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  showSkeleton() {
    const list = document.getElementById('txnList');
    if (list) list.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  }
  showError(msg) {
    const list = document.getElementById('txnList');
    if (list) list.innerHTML = `<div class="error-box">${this.escape(msg)}<br><button class="retry-btn" onclick="location.reload()">↻ Retry</button></div>`;
  }
  showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { t.className = 'toast'; }, 3000);
  }

  // ===== EVENTS =====
  bindEvents() {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('walletBack', () => { if (window.history.length > 1) history.back(); else location.href = '/'; });
    on('eyeToggle', () => {
      this.hideBalance = !this.hideBalance;
      const el = document.getElementById('eyeToggle');
      if (el) el.textContent = this.hideBalance ? '🙈' : '👁️';
      this.renderAll();
    });
    on('refreshLink', (e) => { e.preventDefault(); this.page = 1; this.loadWallet(true); });
    on('loadMoreBtn', () => { if (this.page < this.totalPages) { this.page++; this.loadWallet(false); } });

    // Tabs
    document.querySelectorAll('.wallet-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wallet-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter || 'all';
        this.page = 1;
        this.loadWallet(true);
      });
    });

    // Withdraw / Pay button
    on('withdrawBtn', () => {
      if (this.role === 'admin' || this.role === 'product_manager') return;
      if (this.ownerType === 'customer') {
        this.showToast('Wallet se order pay karne ke liye Checkout pe jao', 'success');
        return;
      }
      if (!this.canWithdraw && this.ownerType !== 'shop') {
        this.showToast('Is role ko Withdraw nahi milega', 'error');
        return;
      }
      if (this.balance < 100) { this.showToast('Minimum Withdraw ₹100 hai. Balance kam hai.', 'error'); return; }
      this.openWithdraw();
    });
    on('payoutHistoryBtn', () => {
      this.filter = 'payout';
      document.querySelectorAll('.wallet-tab').forEach(b => b.classList.toggle('active', b.dataset.filter === 'payout'));
      this.page = 1;
      this.loadWallet(true);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    });

    // Modal
    on('closeWithdraw', () => this.closeWithdraw());
    on('cancelWithdraw', () => this.closeWithdraw());
    on('withdrawBackdrop', () => this.closeWithdraw());
    on('methodUpi', () => this.setPayoutMethod('upi'));
    on('methodBank', () => this.setPayoutMethod('bank'));
    document.querySelectorAll('.amount-quick button').forEach(b => {
      b.addEventListener('click', () => {
        const amt = b.dataset.amt;
        const inp = document.getElementById('withdrawAmount');
        if (!inp) return;
        inp.value = amt === 'all' ? Math.floor(this.balance) : amt;
      });
    });
    on('confirmWithdraw', () => this.doWithdraw());
  }

  setPayoutMethod(m) {
    this.payoutMethod = m;
    const upiBtn = document.getElementById('methodUpi');
    const bankBtn = document.getElementById('methodBank');
    if (upiBtn) upiBtn.classList.toggle('active', m === 'upi');
    if (bankBtn) bankBtn.classList.toggle('active', m === 'bank');
    const upiF = document.getElementById('upiField');
    const bankF = document.getElementById('bankField');
    if (upiF) upiF.style.display = m === 'upi' ? 'block' : 'none';
    if (bankF) bankF.style.display = m === 'bank' ? 'block' : 'none';
  }
  openWithdraw() {
    const m = document.getElementById('withdrawModal');
    if (!m) return;
    const modalBal = document.getElementById('availableBalanceModal');
    if (modalBal) modalBal.textContent = this.inr(this.balance);
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    const inp = document.getElementById('withdrawAmount');
    if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 300); }
  }
  closeWithdraw() {
    const m = document.getElementById('withdrawModal');
    if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  }

  // ===== WITHDRAW - PAYOUT REQUEST =====
  async doWithdraw() {
    const amountEl = document.getElementById('withdrawAmount');
    const upiEl = document.getElementById('withdrawUpi');
    const bankEl = document.getElementById('withdrawBankAcc');
    const ifscEl = document.getElementById('withdrawIfsc');
    const btn = document.getElementById('confirmWithdraw');
    const amount = this.num(amountEl?.value);
    if (!amount || amount <= 0) { this.showToast('Amount dalo', 'error'); return; }
    if (amount < 100) { this.showToast('Minimum Withdraw ₹100 hai', 'error'); return; }
    if (amount > this.balance) { this.showToast('Balance kam hai - ' + this.inr(this.balance), 'error'); return; }
    if (this.payoutMethod === 'upi' && !String(upiEl?.value || '').trim()) { this.showToast('UPI ID dalo', 'error'); return; }
    if (this.payoutMethod === 'bank' && (!String(bankEl?.value || '').trim() || !String(ifscEl?.value || '').trim())) { this.showToast('Bank Account + IFSC dalo', 'error'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    try {
      const body = {
        amount,
        method: this.payoutMethod,
        upiId: String(upiEl?.value || '').trim(),
        bankAccount: String(bankEl?.value || '').trim(),
        bankIfsc: String(ifscEl?.value || '').trim().toUpperCase(),
      };
      const res = await fetch(`/api/common/wallet/${this.ownerType}/${encodeURIComponent(this.ownerId)}/payout`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!data || !data.success) {
        this.showToast(data?.message || 'Payout nahi hua', 'error');
      } else {
        this.showToast('Payout Request bhej diya! Admin approve karega.', 'success');
        this.closeWithdraw();
        // Dobara Server se load - Balance browser me kam nahi karenge
        this.page = 1;
        await this.loadWallet(true);
      }
    } catch (e) {
      this.showToast('Network problem hai', 'error');
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Withdraw Now →'; }
  }
}

// ===== START =====
document.addEventListener('DOMContentLoaded', () => {
  window.WalletCoreInstance = new WalletCore();
  window.WalletCoreInstance.init();
});