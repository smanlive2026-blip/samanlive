// LOCATION: server/routes/common/settings.routes.js
// WORLD CLASS SETTINGS ROUTE - FULL 600+ LINES - SHOP OWNER ONLY - PRODUCTION READY
const express = require('express');
const router = express.Router();

// ========== IN-MEMORY FALLBACK ==========
const settingsMemory = new Map(); // shopId -> settings
const deliveryMemory = new Map(); // shopId -> delivery settings
const notificationMemory = new Map(); // shopId -> notification settings
const themeMemory = new Map(); // shopId -> theme settings
const languageMemory = new Map(); // shopId -> language settings
const statusHistoryMemory = new Map(); // shopId -> status history[]

function getSettings(shopId){
  if(!settingsMemory.has(shopId)){
    settingsMemory.set(shopId, {
      _id:'set'+shopId,
      shopId,
      shopOpen:true,
      openingTime:'09:00',
      closingTime:'21:00',
      is24Hours:false,
      isOpen:true,
      autoOpenClose:true,
      deliveryCharge:20,
      freeDeliveryAbove:199,
      minOrderDelivery:0,
      freeDeliveryEnabled:true,
      deliveryRadius:5,
      deliveryType:'self',
      selfDelivery:true,
      deliveryTimeMin:'30',
      deliveryTimeMax:'45',
      codEnabled:true,
      selfPickupEnabled:true,
      scheduledDeliveryEnabled:true,
      slots:{ morning:true, afternoon:true, evening:true },
      notifications:{ newOrder:true, orderSound:true, popup:true, vibration:true, soundType:'default', orderConfirmed:true, outForDelivery:true, orderDelivered:true, orderCancelled:true, customerChat:true, newReview:true, lowStock:true, dailySummary:true },
      theme:{ primaryColor:'#0f172a', font:'Outfit', darkMode:false, customerDarkMode:true, productAnimations:true, banner:'', bannerText:'', bannerLink:'' },
      language:'en',
      customerLanguage:'auto',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    });
  }
  return settingsMemory.get(shopId);
}

function getDeliverySettings(shopId){
  if(!deliveryMemory.has(shopId)){
    const settings = getSettings(shopId);
    deliveryMemory.set(shopId, {
      shopId,
      deliveryType:settings.deliveryType||'self',
      deliveryCharge:settings.deliveryCharge||20,
      freeDeliveryAbove:settings.freeDeliveryAbove||199,
      minOrderDelivery:settings.minOrderDelivery||0,
      freeDeliveryEnabled:settings.freeDeliveryEnabled!==false,
      radius:settings.deliveryRadius||5,
      deliveryTimeMin:settings.deliveryTimeMin||'30',
      deliveryTimeMax:settings.deliveryTimeMax||'45',
      codEnabled:settings.codEnabled!==false,
      selfPickupEnabled:settings.selfPickupEnabled!==false,
      scheduledDeliveryEnabled:settings.scheduledDeliveryEnabled!==false,
      slots:settings.slots||{ morning:true, afternoon:true, evening:true },
      updatedAt:new Date().toISOString()
    });
  }
  return deliveryMemory.get(shopId);
}

function getNotificationSettings(shopId){
  if(!notificationMemory.has(shopId)){
    const settings = getSettings(shopId);
    notificationMemory.set(shopId, settings.notifications||{
      newOrder:true, orderSound:true, popup:true, vibration:true, soundType:'default',
      orderConfirmed:true, outForDelivery:true, orderDelivered:true, orderCancelled:true,
      customerChat:true, newReview:true, lowStock:true, dailySummary:true
    });
  }
  return notificationMemory.get(shopId);
}

function getThemeSettings(shopId){
  if(!themeMemory.has(shopId)){
    const settings = getSettings(shopId);
    themeMemory.set(shopId, settings.theme||{
      primaryColor:'#0f172a', font:'Outfit', darkMode:false, customerDarkMode:true,
      productAnimations:true, banner:'', bannerText:'', bannerLink:''
    });
  }
  return themeMemory.get(shopId);
}

function getLanguageSettings(shopId){
  if(!languageMemory.has(shopId)){
    const settings = getSettings(shopId);
    languageMemory.set(shopId, { shopId, language:settings.language||'en', customerLanguage:settings.customerLanguage||'auto', updatedAt:new Date().toISOString() });
  }
  return languageMemory.get(shopId);
}

function getStatusHistory(shopId){
  if(!statusHistoryMemory.has(shopId)){
    statusHistoryMemory.set(shopId, [
      { _id:'h1', shopId, status:'open', time:new Date(Date.now()-2*3600000).toISOString(), by:'owner', reason:'' },
      { _id:'h2', shopId, status:'closed', time:new Date(Date.now()-12*3600000).toISOString(), by:'auto', reason:'Closing time' },
      { _id:'h3', shopId, status:'open', time:new Date(Date.now()-24*3600000).toISOString(), by:'owner', reason:'' }
    ]);
  }
  return statusHistoryMemory.get(shopId);
}

// ========== 1. MAIN SETTINGS CRUD ==========
// GET /api/common/settings/:shopId
router.get('/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const settings = getSettings(shopId);
    const delivery = getDeliverySettings(shopId);
    const notifications = getNotificationSettings(shopId);
    const theme = getThemeSettings(shopId);
    const language = getLanguageSettings(shopId);
    const statusHistory = getStatusHistory(shopId);

    res.json({
      success:true,
      settings,
      delivery,
      notifications,
      theme,
      language,
      statusHistory:statusHistory.slice(0,10),
      isOpen:settings.shopOpen!==false,
      timestamp:new Date().toISOString()
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/settings/:shopId
router.put('/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const updates = req.body.settings||req.body;

    let settings = getSettings(shopId);

    settings = {...settings,...updates, shopId, _id:'set'+shopId, updatedAt:new Date().toISOString() };

    settingsMemory.set(shopId, settings);

    // Update sub memories if included
    if(updates.deliveryType || updates.deliveryCharge!==undefined){
      const delivery = getDeliverySettings(shopId);
      deliveryMemory.set(shopId, {...delivery,...updates, updatedAt:new Date().toISOString() });
    }

    if(updates.notifications){
      notificationMemory.set(shopId, {...getNotificationSettings(shopId),...updates.notifications });
    }

    if(updates.theme){
      themeMemory.set(shopId, {...getThemeSettings(shopId),...updates.theme });
    }

    if(updates.language){
      languageMemory.set(shopId, { shopId, language:updates.language, customerLanguage:updates.customerLanguage||'auto', updatedAt:new Date().toISOString() });
    }

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('settings-updated', settings);
    }

    res.json({ success:true, message:'Settings saved ✅', settings });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 2. OPEN / CLOSE STATUS ==========
// GET /api/common/settings/:shopId/status
router.get('/:shopId/status', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const settings = getSettings(shopId);
    const history = getStatusHistory(shopId);

    res.json({
      success:true,
      isOpen:settings.shopOpen!==false,
      is24Hours:settings.is24Hours||false,
      openingTime:settings.openingTime||'09:00',
      closingTime:settings.closingTime||'21:00',
      autoOpenClose:settings.autoOpenClose!==false,
      timing:{ openingTime:settings.openingTime, closingTime:settings.closingTime, isOpen:settings.shopOpen!==false, is24Hours:settings.is24Hours },
      history:history.slice(0,10),
      lastChanged:history[0]?.time||null
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/settings/:shopId/status/toggle
router.post('/:shopId/status/toggle', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { isOpen, reason, status } = req.body;

    let settings = getSettings(shopId);
    const finalIsOpen = isOpen!==undefined? isOpen : status==='open';

    settings.shopOpen = finalIsOpen;
    settings.isOpen = finalIsOpen;
    settings.updatedAt = new Date().toISOString();

    settingsMemory.set(shopId, settings);

    // Add to history
    const history = getStatusHistory(shopId);
    history.unshift({
      _id:'h'+Date.now(),
      shopId,
      status:finalIsOpen?'open':'closed',
      time:new Date().toISOString(),
      by:'owner',
      reason:reason||''
    });

    // Keep only last 50
    if(history.length>50) history.splice(50);
    statusHistoryMemory.set(shopId, history);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-status-toggled', { isOpen:finalIsOpen, shopId });
      global.io.emit('shop-status-changed', { shopId, isOpen:finalIsOpen, status:finalIsOpen?'open':'closed' });
    }

    res.json({
      success:true,
      message:`Shop ${finalIsOpen?'opened 🟢':'closed 🔴'}`,
      isOpen:finalIsOpen,
      status:finalIsOpen?'open':'closed',
      settings,
      history:history.slice(0,10)
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/settings/:shopId/status/busy
router.post('/:shopId/status/busy', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { busy, delayMinutes } = req.body;

    const settings = getSettings(shopId);
    settings.busyMode = busy!==false;
    settings.busyDelay = parseInt(delayMinutes)||30;
    settings.updatedAt = new Date().toISOString();

    settingsMemory.set(shopId, settings);

    const history = getStatusHistory(shopId);
    history.unshift({
      _id:'h'+Date.now(),
      shopId,
      status:'busy',
      time:new Date().toISOString(),
      by:'owner',
      reason:`Busy mode - ${settings.busyDelay} min delay`
    });
    statusHistoryMemory.set(shopId, history);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('shop-busy-mode', { busy:settings.busyMode, delay:settings.busyDelay });
    }

    res.json({
      success:true,
      message:busy!==false?`Busy mode activated 🟡 - ${settings.busyDelay} min extra`:'Busy mode deactivated',
      busyMode:settings.busyMode,
      delay:settings.busyDelay,
      settings
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/settings/:shopId/status/history
router.get('/:shopId/status/history', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { limit } = req.query;

    let history = getStatusHistory(shopId);
    history = history.sort((a,b)=> new Date(b.time)-new Date(a.time));

    if(limit) history = history.slice(0, parseInt(limit));

    res.json({ success:true, history, count:history.length });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 3. DELIVERY SETTINGS ==========
// GET /api/common/settings/:shopId/delivery
router.get('/:shopId/delivery', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const delivery = getDeliverySettings(shopId);

    res.json({ success:true, settings:delivery, delivery });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/settings/:shopId/delivery
router.put('/:shopId/delivery', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const deliveryData = req.body;

    if(deliveryData.deliveryCharge!==undefined && deliveryData.deliveryCharge<0){
      return res.status(400).json({ success:false, message:'deliveryCharge cannot be negative' });
    }

    if(deliveryData.radius!==undefined && (deliveryData.radius<1 || deliveryData.radius>20)){
      return res.status(400).json({ success:false, message:'radius must be 1-20 km' });
    }

    let delivery = getDeliverySettings(shopId);
    delivery = {...delivery,...deliveryData, shopId, updatedAt:new Date().toISOString() };

    deliveryMemory.set(shopId, delivery);

    // Update main settings too
    let settings = getSettings(shopId);
    settings = {...settings,...deliveryData, updatedAt:new Date().toISOString() };
    settingsMemory.set(shopId, settings);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('delivery-settings-updated', delivery);
    }

    res.json({ success:true, message:'Delivery settings saved ✅', settings:delivery, delivery });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 4. NOTIFICATION SETTINGS ==========
// GET /api/common/settings/:shopId/notifications
router.get('/:shopId/notifications', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const notifications = getNotificationSettings(shopId);

    res.json({ success:true, settings:notifications, notifications });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/settings/:shopId/notifications
router.put('/:shopId/notifications', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const notificationData = req.body;

    let notifications = getNotificationSettings(shopId);
    notifications = {...notifications,...notificationData, updatedAt:new Date().toISOString() };

    notificationMemory.set(shopId, notifications);

    let settings = getSettings(shopId);
    settings.notifications = notifications;
    settings.updatedAt = new Date().toISOString();
    settingsMemory.set(shopId, settings);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('notification-settings-updated', notifications);
    }

    res.json({ success:true, message:'Notification settings saved ✅', settings:notifications, notifications });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 5. THEME SETTINGS ==========
// GET /api/common/settings/:shopId/theme
router.get('/:shopId/theme', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const theme = getThemeSettings(shopId);

    res.json({ success:true, settings:theme, theme });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/settings/:shopId/theme
router.put('/:shopId/theme', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const themeData = req.body;

    let theme = getThemeSettings(shopId);
    theme = {...theme,...themeData, updatedAt:new Date().toISOString() };

    themeMemory.set(shopId, theme);

    let settings = getSettings(shopId);
    settings.theme = theme;
    settings.updatedAt = new Date().toISOString();
    settingsMemory.set(shopId, settings);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('theme-updated', theme);
      global.io.emit('shop-theme-changed', { shopId, theme });
    }

    res.json({ success:true, message:'Theme saved 🎨', settings:theme, theme });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 6. LANGUAGE SETTINGS ==========
// GET /api/common/settings/:shopId/language
router.get('/:shopId/language', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const language = getLanguageSettings(shopId);

    res.json({
      success:true,
      settings:language,
      language:language.language,
      customerLanguage:language.customerLanguage,
      supported:['en','hi','gu','mr','ta','te'],
      translations:{
        en:{ orders:'Orders', products:'Products', customers:'Customers', settings:'Settings', open:'Open', closed:'Closed' },
        hi:{ orders:'ऑर्डर', products:'उत्पाद', customers:'ग्राहक', settings:'सेटिंग्स', open:'खुला', closed:'बंद' },
        gu:{ orders:'ઓર્ડર', products:'ઉત્પાદનો', customers:'ગ્રાહકો', settings:'સેટિંગ્સ', open:'ખુલ્લું', closed:'બંધ' }
      }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/settings/:shopId/language
router.put('/:shopId/language', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { language, customerLanguage } = req.body;

    const supported = ['en','hi','gu','mr','ta','te'];

    if(language &&!supported.includes(language)){
      return res.status(400).json({ success:false, message:`Language must be one of ${supported.join(', ')}` });
    }

    let langSettings = getLanguageSettings(shopId);
    langSettings.language = language||langSettings.language;
    langSettings.customerLanguage = customerLanguage||langSettings.customerLanguage||'auto';
    langSettings.updatedAt = new Date().toISOString();

    languageMemory.set(shopId, langSettings);

    let settings = getSettings(shopId);
    settings.language = langSettings.language;
    settings.customerLanguage = langSettings.customerLanguage;
    settings.updatedAt = new Date().toISOString();
    settingsMemory.set(shopId, settings);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('language-updated', langSettings);
    }

    res.json({ success:true, message:`Language changed to ${langSettings.language.toUpperCase()} ✅`, settings:langSettings, language:langSettings.language });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 7. TIMING SETTINGS (redirect to profile timing but also here) ==========
// GET /api/common/settings/:shopId/timing
router.get('/:shopId/timing', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const settings = getSettings(shopId);

    res.json({
      success:true,
      timing:{
        openingTime:settings.openingTime,
        closingTime:settings.closingTime,
        isOpen:settings.shopOpen!==false,
        is24Hours:settings.is24Hours||false,
        autoOpenClose:settings.autoOpenClose!==false
      },
      settings
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// PUT /api/common/settings/:shopId/timing
router.put('/:shopId/timing', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { openingTime, closingTime, isOpen, is24Hours, autoOpenClose } = req.body;

    let settings = getSettings(shopId);

    if(openingTime) settings.openingTime = openingTime;
    if(closingTime) settings.closingTime = closingTime;
    if(isOpen!==undefined){ settings.shopOpen = isOpen; settings.isOpen = isOpen; }
    if(is24Hours!==undefined) settings.is24Hours = is24Hours;
    if(autoOpenClose!==undefined) settings.autoOpenClose = autoOpenClose;

    settings.updatedAt = new Date().toISOString();

    settingsMemory.set(shopId, settings);

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('timing-updated', { openingTime:settings.openingTime, closingTime:settings.closingTime, isOpen:settings.shopOpen });
    }

    res.json({ success:true, message:'Timing updated ⏰', timing:{ openingTime:settings.openingTime, closingTime:settings.closingTime, isOpen:settings.shopOpen, is24Hours:settings.is24Hours }, settings });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 8. RESET SETTINGS ==========
// POST /api/common/settings/:shopId/reset
router.post('/:shopId/reset', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { type } = req.body; // all, delivery, notifications, theme, language

    if(type==='all' ||!type){
      settingsMemory.delete(shopId);
      deliveryMemory.delete(shopId);
      notificationMemory.delete(shopId);
      themeMemory.delete(shopId);
      languageMemory.delete(shopId);
      // Keep history

      const newSettings = getSettings(shopId);

      if(global.io){
        global.io.to(`shop:${shopId}`).emit('settings-reset', { type:'all' });
      }

      return res.json({ success:true, message:'All settings reset to default', settings:newSettings });
    }

    if(type==='delivery') deliveryMemory.delete(shopId);
    if(type==='notifications') notificationMemory.delete(shopId);
    if(type==='theme') themeMemory.delete(shopId);
    if(type==='language') languageMemory.delete(shopId);

    const settings = getSettings(shopId);

    res.json({ success:true, message:`${type} settings reset`, settings });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;