// LOCATION: server/routes/common/finance.routes.js - V1 FINAL - UNIFIED FINANCE
// RULE 1: Demo / Fake / Sample data kabhi nahi. Nahi hai toh [] + 0.
// RULE 2: Paisa Server pe hi + / -. Browser me kabhi nahi.
// RULE 3: GSTIN hardcode kabhi nahi. Hamesha Shop.gst se aayega.
// FLOW: Expense -> FinanceTransaction(expense) -> Profit-Loss me auto ghat jayega
//       GST Invoice -> FinanceTransaction(gst) -> InvoiceNo auto INV-001, INV-002
//       Payout History -> WalletTransaction se, Finance se nahi

const express = require('express');
const router = express.Router();

const FinanceTransaction = require('../../models/FinanceTransaction');
const Shop = require('../../models/Shop');

// Wallet model ho toh use karo, nahi ho toh payout [] de do - crash kabhi nahi
let WalletTransaction = null;
try { WalletTransaction = require('../../models/WalletTransaction'); } catch (e) { WalletTransaction = null; }

// ============ HELPERS ============
// Period -> startDate / endDate - today / week / month / year
function getPeriodRange(period) {
  const now = new Date();
  let start = new Date();
  if (period === 'today') { start.setHours(0, 0, 0, 0); }
  else if (period === 'week') { start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0); }
  else if (period === 'year') { start = new Date(now.getFullYear(), 0, 1); }
  else { start = new Date(now.getFullYear(), now.getMonth(), 1); } // month default
  return { start, end: now };
}

// ============ 1. EXPENSE LIST - GET /api/common/finance/:shopId/expense ============
router.get('/:shopId/expense', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { category, search } = req.query;
    const q = { shopId, kind: 'expense', status: 'completed' };
    if (category && category !== 'all') q.category = category;

    let list = await FinanceTransaction.find(q).sort({ createdAt: -1 }).lean();
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => (e.title || '').toLowerCase().includes(s) || (e.category || '').toLowerCase().includes(s) || (e.description || '').toLowerCase().includes(s));
    }
    const total = list.reduce((a, b) => a + (b.amount || 0), 0);
    const now = new Date();
    const thisMonth = list.filter(e => { const d = new Date(e.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const monthTotal = thisMonth.reduce((a, b) => a + (b.amount || 0), 0);
    res.json({ success: true, expenses: list, total, monthTotal, count: list.length });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============ 2. EXPENSE ADD - POST /api/common/finance/:shopId/expense ============
router.post('/:shopId/expense', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { title, amount, category, paymentMethod, description, date } = req.body;
    if (!title || !amount || Number(amount) <= 0) return res.status(400).json({ success: false, error: 'Title aur Amount sahi daalo' });

    const doc = await FinanceTransaction.create({
      ownerType: 'shop', ownerId: shopId, shopId,
      kind: 'expense', type: 'debit',
      amount: Number(amount), title: String(title).trim(),
      category: category || 'other', paymentMethod: paymentMethod || 'cash',
      description: description || '', createdBy: 'shop_owner', createdByRole: 'shop',
      createdAt: date ? new Date(date) : new Date(),
    });
    res.json({ success: true, expense: doc });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============ 3. EXPENSE DELETE - DELETE /api/common/finance/:shopId/expense/:id ============
router.delete('/:shopId/expense/:id', async (req, res) => {
  try {
    const { shopId, id } = req.params;
    const del = await FinanceTransaction.deleteOne({ _id: id, shopId, kind: 'expense' });
    if (!del.deletedCount) return res.status(404).json({ success: false, error: 'Expense nahi mila' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============ 4. PROFIT-LOSS - GET /api/common/finance/:shopId/profit-loss?period=month ============
router.get('/:shopId/profit-loss', async (req, res) => {
  try {
    const { shopId } = req.params;
    const period = req.query.period || 'month';
    const { start, end } = getPeriodRange(period);

    // FinanceTransaction.getProfitLoss() - CODE 1 wala static
    const pl = await FinanceTransaction.getProfitLoss(shopId, start, end);

    // Wallet se earning bhi jodo - agar WalletTransaction hai toh
    let walletEarning = 0, walletPayout = 0;
    if (WalletTransaction) {
      try {
        const w = await WalletTransaction.aggregate([
          { $match: { ownerId: shopId, status: 'completed', createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ]);
        w.forEach(x => { if (x._id === 'credit') walletEarning += x.total; if (x._id === 'debit') walletPayout += x.total; });
      } catch (e) {}
    }

    // Agar Finance me earning 0 hai toh Wallet wali earning hi revenue hai - double count nahi
    const revenue = pl.revenue > 0 ? pl.revenue : walletEarning;
    const profit = revenue - pl.expense - pl.refund;

    res.json({
      success: true, period, startDate: start, endDate: end,
      revenue, expense: pl.expense, profit, refund: pl.refund,
      payout: pl.payout > 0 ? pl.payout : walletPayout,
      gstTotal: pl.gstTotal, totalOrders: pl.totalOrders,
      avgOrderValue: pl.avgOrderValue, netProfit: revenue - pl.expense - pl.refund,
      expenseByCategory: pl.expenseByCategory, revenueByMethod: pl.revenueByMethod,
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============ 5. GST INVOICE CREATE - POST /api/common/finance/:shopId/gst-invoice ============
router.post('/:shopId/gst-invoice', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { customerName, customerPhone, items, gstRate } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, error: 'Items daalo' });

    // Shop ka asli GSTIN - hardcode kabhi nahi
    const shop = await Shop.findById(shopId).lean();
    const gstin = shop ? (shop.gst || '') : '';

    let taxable = 0, gstAmount = 0;
    const finalItems = items.map(it => {
      const qty = Number(it.qty || 1), rate = Number(it.rate || 0), gr = Number(it.gstRate ?? gstRate ?? 18);
      const amt = qty * rate;
      const g = Math.round(amt * gr / 100);
      taxable += amt; gstAmount += g;
      return { name: it.name || 'Item', qty, rate, gstRate: gr, amount: amt + g };
    });
    const total = taxable + gstAmount;

    // Invoice No auto - INV-001, INV-002...
    const count = await FinanceTransaction.countDocuments({ shopId, kind: 'gst' });
    const invoiceNo = 'INV-' + String(count + 1).padStart(3, '0');

    const doc = await FinanceTransaction.create({
      ownerType: 'shop', ownerId: shopId, shopId,
      kind: 'gst', type: 'credit', amount: total,
      title: `GST Invoice ${invoiceNo}`, category: 'gst', paymentMethod: req.body.paymentMethod || 'cash',
      gst: {
        invoiceNo, gstin, gstRate: Number(gstRate || 18), gstAmount,
        cgst: Math.round(gstAmount / 2), sgst: Math.round(gstAmount / 2), igst: 0,
        taxableAmount: taxable, totalAmount: total,
        customerName: customerName || '', customerPhone: customerPhone || '', items: finalItems,
      },
      createdBy: 'shop_owner', createdByRole: 'shop',
    });
    res.json({ success: true, invoice: doc, invoiceNo, gstin, taxableAmount: taxable, gstAmount, totalAmount: total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============ 6. GST INVOICE LIST - GET /api/common/finance/:shopId/gst-invoice ============
router.get('/:shopId/gst-invoice', async (req, res) => {
  try {
    const { shopId } = req.params;
    const list = await FinanceTransaction.find({ shopId, kind: 'gst' }).sort({ createdAt: -1 }).lean();
    const shop = await Shop.findById(shopId).lean();
    res.json({ success: true, invoices: list, gstin: shop ? (shop.gst || '') : '', shopName: shop ? shop.shopName : '' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============ 7. PAYOUT HISTORY - GET /api/common/finance/:shopId/payout-history ============
router.get('/:shopId/payout-history', async (req, res) => {
  try {
    const { shopId } = req.params;
    let payouts = [];

    // Pehle Wallet se - asli payout wahi hai
    if (WalletTransaction) {
      try {
        payouts = await WalletTransaction.find({ ownerId: shopId, type: 'debit' }).sort({ createdAt: -1 }).lean();
      } catch (e) {}
    }
    // Wallet nahi hai toh Finance se
    if (!payouts.length) {
      payouts = await FinanceTransaction.find({ shopId, kind: 'payout' }).sort({ createdAt: -1 }).lean();
    }

    const total = payouts.reduce((a, b) => a + (b.amount || 0), 0);
    const pending = payouts.filter(p => p.status === 'pending').reduce((a, b) => a + (b.amount || 0), 0);
    const completed = payouts.filter(p => p.status === 'completed').reduce((a, b) => a + (b.amount || 0), 0);
    res.json({ success: true, payouts, total, pending, completed, count: payouts.length });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;