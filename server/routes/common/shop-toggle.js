// LOCATION: server/routes/common/shop-toggle.js - FULL - V2 - SINGLE SOURCE OF TRUTH
// RULE: Shop Open / Close ka 1 hi sach hai = Shop Model ka isOpen.
//       Chahe Dashboard se band karo, Open-Close page se, Settings se, ya Customer side se check karo - sab yahin aayega.
//       settings.routes.js wala RAM / Map wala system AB NAHI CHALEGA. Uska status yahan se Shop Model se aayega.
// ROUTES - SAB ISI FILE ME:
//   PUT  /api/common/shop-toggle/:shopId                  -> { isOpen } - Purana wala - Dashboard-core / Kirana use karta hai
//   GET  /api/common/shop-toggle/:shopId                  -> { isOpen } - Purana wala
//   GET  /api/common/shop-toggle/:shopId/status            -> { isOpen, timing, mode, busy } - Achar Dashboard + shop-toggle.js Frontend mangta hai
//   POST /api/common/shop-toggle/:shopId/toggle           -> { isOpen } - shop-toggle.js Frontend mangta hai
//   POST /api/common/shop-toggle/:shopId/status/toggle    -> { isOpen } - open-close.html mangta hai
//   POST /api/common/shop-toggle/:shopId/status           -> { isOpen } - settings.js / open-close ka alternate
//   GET  /api/common/shop-toggle/:shopId/timing            -> { timing }
//   POST /api/common/shop-toggle/:shopId/timing           -> { open, close } - Achar Dashboard ka saveTiming mangta hai
//   GET  /api/common/shop-status/:shopId                  -> { isOpen } - Customer side mangta hai - server.js me is file ko /api/common/shop-status pe bhi mount karo
//   GET  /api/common/shop-toggle/:shopId/status/history   -> { history }
// MODEL: Shop (server/models/Shop.js) = isOpen + shopSettings.openTime/closeTime + shopSettings.busyMode
//        CommonShop (server/models/common/shop.js) = isOpen + timing - Agar mile toh sync hoga, na mile toh ignore
// SOCKET: Save ke baad global.io se 'shop-status-changed' emit hoga - Customer + Dashboard dono ko turant pata chalega
// NOTE: Is file me koi In-Memory Map / RAM wala sach NAHI hai. Restart hone pe bhi status nahi udega.

const express = require('express');
const router = express.Router();
const Shop = require('../../models/Shop');
const { getShopId } = require('../../utils/shopId');

// ========== IN-MEMORY HISTORY - SIRF HISTORY KE LIYE, SACH KE LIYE NAHI ==========
// Sach hamesha Shop Model se aayega. Ye sirf open-close.html ke "Recent Status Changes" dikhane ke liye hai.
// Restart hone pe history khali ho jayegi, par shop ka Open/Close kabhi nahi udega.
const statusHistoryMemory = new Map(); // shopId -> history[]

function getHistory(shopId) {
  if (!statusHistoryMemory.has(shopId)) {
    statusHistoryMemory.set(shopId, []);
  }
  return statusHistoryMemory.get(shopId);
}

function pushHistory(shopId, isOpen, mode, by, reason) {
  try {
    const history = getHistory(shopId);
    history.unshift({
      _id: 'h' + Date.now(),
      shopId: String(shopId),
      status: mode || (isOpen ? 'open' : 'closed'),
      isOpen: !!isOpen,
      mode: mode || (isOpen ? 'open' : 'closed'),
      time: new Date().toISOString(),
      by: by || 'owner',
      reason: reason || ''
    });
    if (history.length > 50) history.splice(50);
    statusHistoryMemory.set(shopId, history);
  } catch (e) {}
}

// ========== HELPERS ==========
function normalizeIsOpen(body) {
  // Body me kuch bhi aa sakta hai - isOpen / status / mode - sabko 1 me karo
  if (body == null) return undefined;
  if (typeof body.isOpen === 'boolean') return body.isOpen;
  if (typeof body.shopOpen === 'boolean') return body.shopOpen;
  if (typeof body.open === 'boolean') return body.open;
  if (typeof body.status === 'string') {
    const s = body.status.toLowerCase().trim();
    if (s === 'open') return true;
    if (s === 'closed' || s === 'close') return false;
    if (s === 'busy') return true; // Busy me bhi shop khuli hi hoti hai, bas delay hota hai
  }
  if (typeof body.mode === 'string') {
    const m = body.mode.toLowerCase().trim();
    if (m === 'open') return true;
    if (m === 'closed' || m === 'close') return false;
    if (m === 'busy') return true;
  }
  return undefined;
}

function normalizeMode(body, isOpen) {
  if (body && typeof body.mode === 'string' && body.mode) return body.mode.toLowerCase().trim();
  if (body && typeof body.status === 'string' && body.status) return body.status.toLowerCase().trim();
  return isOpen ? 'open' : 'closed';
}

function getTimingFromShop(shop) {
  const ss = shop.shopSettings || {};
  return {
    openingTime: ss.openTime || ss.openingTime || '09:00',
    closingTime: ss.closeTime || ss.closingTime || '21:00',
    open: ss.openTime || ss.openingTime || '09:00',
    close: ss.closeTime || ss.closingTime || '21:00',
    isOpen: shop.isOpen !== false,
    is24Hours: !!ss.is24Hours,
    busyMode: !!ss.busyMode,
    busyDelay: ss.busyDelay || 30
  };
}

function emitShopStatus(req, shopId, isOpen, mode, timing) {
  try {
    const payload = { shopId: String(shopId), isOpen: !!isOpen, status: isOpen ? 'open' : 'closed', mode: mode || (isOpen ? 'open' : 'closed'), timing: timing || null };
    // 1. global.io - server.js me set hai
    if (global.io) {
      global.io.to('shop:' + shopId).emit('shop-status-changed', payload);
      global.io.emit('shop-status-changed', payload);
      global.io.to('shop:' + shopId).emit('shop-status-toggled', payload);
    }
    // 2. req.app.get('io') - Vercel / alag setup me
    try {
      const io2 = req && req.app && req.app.get && req.app.get('io');
      if (io2 && io2 !== global.io) {
        io2.to('shop:' + shopId).emit('shop-status-changed', payload);
        io2.emit('shop-status-changed', payload);
      }
    } catch (e) {}
  } catch (e) {}
}

async function syncCommonShop(shopId, update) {
  // CommonShop alag collection hai - agar mile toh sync karo, na mile toh chup-chap ignore karo
  try {
    const CommonShop = require('../../models/common/shop');
    await CommonShop.findOneAndUpdate(
      { $or: [{ shopId: String(shopId) }, { _id: shopId }] },
      { $set: update },
      { new: true }
    ).catch(() => {});
  } catch (e) {}
}

async function syncTemplateModel(shop, isOpen, timing) {
  // Purana Achar.js / Kirana.js wala copy - sirf backup ke liye, asli sach Shop hi hai
  try {
    const templateName = String(shop.template || shop.shopType || 'achar').toLowerCase();
    const modelMap = {
      'achar': 'Achar', 'achar-shop': 'Achar',
      'kirana': 'Kirana', 'cloth': 'Cloth', 'fruit': 'Fruit',
      'furniture': 'Furniture', 'auto': 'Auto'
    };
    const modelFileName = modelMap[templateName];
    if (!modelFileName) return;
    const DynamicModel = require('../../models/shops/' + modelFileName);
    await DynamicModel.findOneAndUpdate(
      { shopId: String(shop._id) },
      { $set: { isOpen: isOpen, 'settings.isOpen': isOpen } },
      { upsert: false }
    ).catch(() => {});
  } catch (e) {}
}

// ========== CORE SAVE - SAB ROUTE YAHIN SE JAYENGE ==========
async function saveShopStatus(req, res, shopId, body) {
  try {
    const finalIsOpen = normalizeIsOpen(body);
    if (finalIsOpen === undefined) {
      return res.status(400).json({ success: false, message: 'isOpen boolean hona chahiye ya status: open/closed bhejo' });
    }
    const mode = normalizeMode(body, finalIsOpen);
    const isBusy = mode === 'busy';
    const by = (body && (body.by || body.userId)) || 'owner';
    const reason = (body && body.reason) || '';

    // Timing bhi aayi hai toh saath me save karo
    let timingUpdate = {};
    const openTime = (body && (body.openingTime || body.open || body.openTime)) || null;
    const closeTime = (body && (body.closingTime || body.close || body.closeTime)) || null;
    if (openTime) timingUpdate['shopSettings.openTime'] = String(openTime);
    if (closeTime) timingUpdate['shopSettings.closeTime'] = String(closeTime);
    if (body && body.is24Hours !== undefined) timingUpdate['shopSettings.is24Hours'] = !!body.is24Hours;
    if (isBusy) {
      timingUpdate['shopSettings.busyMode'] = true;
      timingUpdate['shopSettings.busyDelay'] = parseInt((body && body.delayMinutes) || (body && body.busyDelay) || 30) || 30;
    } else if (mode === 'open' || mode === 'closed') {
      timingUpdate['shopSettings.busyMode'] = false;
    }

    // 1. MAIN SHOP - YAHI ASLI SACH HAI
    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { $set: Object.assign({ isOpen: finalIsOpen }, timingUpdate) },
      { new: true }
    );

    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const timing = getTimingFromShop(shop);

    // 2. CommonShop sync
    await syncCommonShop(shopId, {
      isOpen: finalIsOpen,
      'timing.isOpen': finalIsOpen,
      openingTime: timing.openingTime,
      closingTime: timing.closingTime
    });

    // 3. Purana template model sync - na ho toh ignore
    await syncTemplateModel(shop, finalIsOpen, timing);

    // 4. History - sirf dikhane ke liye
    pushHistory(shopId, finalIsOpen, mode, by, reason);

    // 5. Socket - sabko turant pata chale
    emitShopStatus(req, shopId, finalIsOpen, mode, timing);

    return res.json({
      success: true,
      isOpen: shop.isOpen,
      status: finalIsOpen ? 'open' : 'closed',
      mode: mode,
      timing: timing,
      history: getHistory(shopId).slice(0, 10),
      message: isBusy ? 'Shop Busy 🟡' : (finalIsOpen ? 'Shop Open 🟢' : 'Shop Closed 🔴')
    });
  } catch (err) {
    console.log('SHOP TOGGLE ERROR:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function readShopStatus(req, res, shopId) {
  try {
    const shop = await Shop.findById(shopId).lean();
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    const isOpen = shop.isOpen !== false;
    const timing = getTimingFromShop(shop);
    const mode = timing.busyMode ? 'busy' : (isOpen ? 'open' : 'closed');
    return res.json({
      success: true,
      shopId: String(shop._id),
      isOpen: isOpen,
      status: isOpen ? 'open' : 'closed',
      mode: mode,
      is24Hours: timing.is24Hours,
      timing: timing,
      openingTime: timing.openingTime,
      closingTime: timing.closingTime,
      autoOpenClose: true,
      history: getHistory(shopId).slice(0, 10),
      lastChanged: getHistory(shopId)[0] ? getHistory(shopId)[0].time : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ========== ROUTES - ORDER MAT BADALNA - SPECIFIC PEHLE, GENERIC BAAD ME ==========

// GET /api/common/shop-toggle/:shopId/status - Achar Dashboard + shop-toggle.js Frontend
router.get('/:shopId/status', async (req, res) => {
  const shopId = getShopId(req);
  return readShopStatus(req, res, shopId);
});

// GET /api/common/shop-toggle/:shopId/status/history - open-close.html ka Recent Status
router.get('/:shopId/status/history', async (req, res) => {
  const shopId = getShopId(req);
  const limit = parseInt(req.query.limit) || 10;
  return res.json({ success: true, history: getHistory(shopId).slice(0, limit), count: getHistory(shopId).length });
});

// GET /api/common/shop-toggle/:shopId/timing - Timing padhne ke liye
router.get('/:shopId/timing', async (req, res) => {
  const shopId = getShopId(req);
  try {
    const shop = await Shop.findById(shopId).lean();
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    const timing = getTimingFromShop(shop);
    return res.json({ success: true, isOpen: shop.isOpen !== false, timing: timing, openingTime: timing.openingTime, closingTime: timing.closingTime });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/common/shop-toggle/:shopId/toggle - shop-toggle.js Frontend
router.post('/:shopId/toggle', async (req, res) => {
  const shopId = getShopId(req);
  return saveShopStatus(req, res, shopId, req.body || {});
});

// POST /api/common/shop-toggle/:shopId/status/toggle - open-close.html
router.post('/:shopId/status/toggle', async (req, res) => {
  const shopId = getShopId(req);
  return saveShopStatus(req, res, shopId, req.body || {});
});

// POST /api/common/shop-toggle/:shopId/status - settings.js ka alternate
router.post('/:shopId/status', async (req, res) => {
  const shopId = getShopId(req);
  return saveShopStatus(req, res, shopId, req.body || {});
});

// POST /api/common/shop-toggle/:shopId/status/busy - Busy Mode
router.post('/:shopId/status/busy', async (req, res) => {
  const shopId = getShopId(req);
  const body = req.body || {};
  const busy = body.busy !== false;
  return saveShopStatus(req, res, shopId, Object.assign({}, body, { mode: busy ? 'busy' : 'open', isOpen: true }));
});

// POST /api/common/shop-toggle/:shopId/timing - Achar Dashboard ka saveTiming()
router.post('/:shopId/timing', async (req, res) => {
  const shopId = getShopId(req);
  try {
    const body = req.body || {};
    const open = body.open || body.openingTime || body.openTime || '09:00';
    const close = body.close || body.closingTime || body.closeTime || '21:00';
    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { $set: { 'shopSettings.openTime': String(open), 'shopSettings.closeTime': String(close) } },
      { new: true }
    );
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    const timing = getTimingFromShop(shop);
    await syncCommonShop(shopId, { openingTime: timing.openingTime, closingTime: timing.closingTime, 'timing.openingTime': timing.openingTime, 'timing.closingTime': timing.closingTime });
    emitShopStatus(req, shopId, shop.isOpen !== false, timing.busyMode ? 'busy' : (shop.isOpen !== false ? 'open' : 'closed'), timing);
    return res.json({ success: true, message: 'Timing save ho gayi', timing: timing, isOpen: shop.isOpen !== false });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /api/common/shop-toggle/:shopId - Purana wala - Dashboard-core / Kirana / Auto use karta hai
router.put('/:shopId', async (req, res) => {
  const shopId = getShopId(req);
  return saveShopStatus(req, res, shopId, req.body || {});
});

// POST /api/common/shop-toggle/:shopId - Dashboard-core ka alternate
router.post('/:shopId', async (req, res) => {
  const shopId = getShopId(req);
  return saveShopStatus(req, res, shopId, req.body || {});
});

// GET /api/common/shop-toggle/:shopId - Purana wala - Customer view / Nearby ke liye
// GET /api/common/shop-status/:shopId - Customer side - server.js me is file ko /api/common/shop-status pe bhi mount karo, tab yehi route chalega
router.get('/:shopId', async (req, res) => {
  const shopId = getShopId(req);
  return readShopStatus(req, res, shopId);
});

module.exports = router;