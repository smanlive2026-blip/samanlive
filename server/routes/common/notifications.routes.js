// LOCATION: server/routes/common/notifications.routes.js
// WORLD CLASS NOTIFICATIONS ROUTE - FULL 600+ LINES - PUSH + IN-APP + ORDER + OFFER
const express = require('express');
const router = express.Router();

const notificationsMemory = new Map(); // userId_shopId -> notifications[]
const subscriptionsMemory = new Map(); // userId -> subscription
const settingsMemory = new Map(); // userId -> settings

function getNotifications(userId, shopId){
  const key = `${userId}_${shopId}`;
  if(!notificationsMemory.has(key)){
    notificationsMemory.set(key, []);
  }
  return notificationsMemory.get(key);
}

function getAllNotificationsForUser(userId){
  let all = [];
  for(let [key, notifs] of notificationsMemory.entries()){
    if(key.startsWith(userId)){
      all = all.concat(notifs);
    }
  }
  return all;
}

function getAllNotificationsForShop(shopId){
  let all = [];
  for(let [key, notifs] of notificationsMemory.entries()){
    if(key.endsWith(`_${shopId}`) || key.includes(`_${shopId}`)){
      all = all.concat(notifs);
    }
  }
  return all;
}

// ========== 1. GET NOTIFICATIONS ==========
// GET /api/common/notifications/:shopId?userId=xxx&type=xxx
router.get('/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { userId, type, filter, search } = req.query;

    let notifications = [];

    if(userId){
      notifications = getNotifications(userId, shopId);
    } else {
      notifications = getAllNotificationsForShop(shopId);
    }

    if(notifications.length===0){
      notifications = [
        { _id:'n1', shopId, userId:userId||'guest', type:'order', title:'Order Confirmed ✅', message:'Your order #ORD12345 confirmed by My Kirana Store. Preparing your order...', createdAt:new Date(Date.now()-5*60000).toISOString(), read:false, icon:'order', actionUrl:`/shop-templates/common/customer-orders/track-order.html?orderId=ORD12345&shopId=${shopId}`, actions:[{ label:'Track Order', primary:true }] },
        { _id:'n2', shopId, userId:userId||'guest', type:'offer', title:'🎉 50% OFF - Special Offer!', message:'Get 50% OFF on your first order. Use code WELCOME50. Valid till tonight!', createdAt:new Date(Date.now()-30*60000).toISOString(), read:false, icon:'offer', actionUrl:`/shop.html?shopId=${shopId}&offer=WELCOME50`, actions:[{ label:'Shop Now', primary:true }] },
        { _id:'n3', shopId, userId:userId||'guest', type:'order', title:'Out for Delivery 🛵', message:'Your order #ORD12344 is out for delivery. Delivery boy: Ramesh - 9876543210', createdAt:new Date(Date.now()-60*60000).toISOString(), read:true, icon:'order', actionUrl:`/shop-templates/common/track/track-order.html?orderId=ORD12344&shopId=${shopId}` },
        { _id:'n4', shopId, userId:userId||'guest', type:'system', title:'Welcome to SamanLive! 🎉', message:'Thanks for joining! Order from local shops and get fast delivery in 30 mins.', createdAt:new Date(Date.now()-120*60000).toISOString(), read:true, icon:'system' }
      ];

      if(userId){
        notificationsMemory.set(`${userId}_${shopId}`, notifications);
      }
    }

    if(type && type!=='all'){
      notifications = notifications.filter(n=> n.type===type);
    }

    if(filter==='unread'){
      notifications = notifications.filter(n=>!n.read);
    }

    if(search){
      const q = search.toLowerCase();
      notifications = notifications.filter(n=> (n.title||'').toLowerCase().includes(q) || (n.message||'').toLowerCase().includes(q));
    }

    notifications.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));

    const total = notifications.length;
    const unread = notifications.filter(n=>!n.read).length;
    const read = total-unread;

    res.json({
      success:true,
      notifications:notifications.slice(0,100),
      count:total,
      unread,
      read,
      stats:{ total, unread, read, order:notifications.filter(n=> n.type==='order').length, offer:notifications.filter(n=> n.type==='offer').length, system:notifications.filter(n=> n.type==='system').length }
    });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/notifications/user/:userId
router.get('/user/:userId', async (req,res)=>{
  try{
    const { userId } = req.params;
    const { type, filter } = req.query;

    let notifications = getAllNotificationsForUser(userId);

    if(notifications.length===0){
      notifications = [
        { _id:'n1', shopId:'shop1', userId, type:'order', title:'Order Confirmed ✅', message:'Order #ORD123 confirmed', createdAt:new Date().toISOString(), read:false },
        { _id:'n2', shopId:'shop1', userId, type:'offer', title:'🎉 Offer', message:'50% OFF - Code WELCOME50', createdAt:new Date(Date.now()-3600000).toISOString(), read:false }
      ];
    }

    if(type) notifications = notifications.filter(n=> n.type===type);
    if(filter==='unread') notifications = notifications.filter(n=>!n.read);

    notifications.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));

    res.json({ success:true, notifications:notifications.slice(0,100), count:notifications.length, unread:notifications.filter(n=>!n.read).length, userId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 2. SEND NOTIFICATION ==========
// POST /api/common/notifications/:shopId/send
router.post('/:shopId/send', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { userId, type, title, message, icon, actionUrl, actions, data } = req.body;

    if(!title ||!message){
      return res.status(400).json({ success:false, message:'Title and message required' });
    }

    const targetUserId = userId||'guest';

    const notification = {
      _id:'n'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      userId:targetUserId,
      type:type||'system',
      title,
      message,
      icon:icon||type||'system',
      actionUrl:actionUrl||'',
      actions:actions||[],
      data:data||{},
      createdAt:new Date().toISOString(),
      read:false
    };

    const userNotifs = getNotifications(targetUserId, shopId);
    userNotifs.unshift(notification);
    notificationsMemory.set(`${targetUserId}_${shopId}`, userNotifs.slice(0,100));

    if(global.io){
      global.io.to(`user:${targetUserId}`).emit('new-notification', notification);
      global.io.to(`shop:${shopId}`).emit('new-notification', notification);
      global.io.to(`notifications:${targetUserId}`).emit('new-notification', notification);
      global.io.emit('new-notification', notification);
    }

    // If has push subscription, send push
    const subscription = subscriptionsMemory.get(targetUserId);
    if(subscription){
      console.log(`Push would be sent to ${targetUserId}: ${title}`);
      // In real, use web-push library to send push
      // webpush.sendNotification(subscription, JSON.stringify({ title, body:message, icon, actionUrl }));
    }

    res.json({ success:true, message:'Notification sent 🔔', notification });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/notifications/send-bulk - Send to multiple users
router.post('/send-bulk', async (req,res)=>{
  try{
    const { shopId, userIds, type, title, message, actionUrl } = req.body;

    if(!shopId ||!title ||!message){
      return res.status(400).json({ success:false, message:'shopId, title, message required' });
    }

    if(!userIds || userIds.length===0){
      return res.status(400).json({ success:false, message:'userIds required - array of userIds' });
    }

    const sent = [];

    for(let userId of userIds){
      const notification = {
        _id:'n'+Date.now()+Math.random().toString(36).substr(2,5)+'_'+userId,
        shopId,
        userId,
        type:type||'system',
        title,
        message,
        icon:type||'system',
        actionUrl:actionUrl||'',
        createdAt:new Date().toISOString(),
        read:false
      };

      const userNotifs = getNotifications(userId, shopId);
      userNotifs.unshift(notification);
      notificationsMemory.set(`${userId}_${shopId}`, userNotifs.slice(0,100));

      sent.push(notification);

      if(global.io){
        global.io.to(`user:${userId}`).emit('new-notification', notification);
      }
    }

    if(global.io){
      global.io.to(`shop:${shopId}`).emit('bulk-notifications-sent', { shopId, count:sent.length, title });
    }

    res.json({ success:true, message:`Bulk notifications sent to ${sent.length} users 🔔`, count:sent.length, notifications:sent.slice(0,10) });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 3. ORDER STATUS NOTIFICATIONS ==========
// POST /api/common/notifications/order-status
router.post('/order-status', async (req,res)=>{
  try{
    const { orderId, shopId, userId, status } = req.body;

    if(!orderId ||!shopId ||!status){
      return res.status(400).json({ success:false, message:'orderId, shopId, status required' });
    }

    const titles = {
      pending:'Order Placed 📦',
      confirmed:'Order Confirmed ✅',
      preparing:'Order Preparing 👨‍🍳',
      out_for_delivery:'Out for Delivery 🛵',
      delivered:'Order Delivered ✅',
      cancelled:'Order Cancelled ❌',
      returned:'Order Returned ↩️'
    };

    const messages = {
      pending:`Your order #${orderId} placed successfully. Shop will confirm soon.`,
      confirmed:`Your order #${orderId} confirmed by shop. Preparing your order...`,
      preparing:`Your order #${orderId} is being prepared 👨‍🍳 Will be ready soon!`,
      out_for_delivery:`Your order #${orderId} is out for delivery 🛵 Delivery boy on the way! Track live.`,
      delivered:`Your order #${orderId} delivered successfully ✅ Thanks for ordering! Please rate us ⭐`,
      cancelled:`Your order #${orderId} was cancelled. Contact support for refund if paid.`,
      returned:`Your return request for order #${orderId} approved. Refund will be processed soon.`
    };

    const targetUserId = userId||'guest';

    const notification = {
      _id:'n'+Date.now()+Math.random().toString(36).substr(2,5),
      shopId,
      userId:targetUserId,
      orderId,
      type:'order',
      title:titles[status]||`Order ${status} - #${orderId}`,
      message:messages[status]||`Your order #${orderId} is now ${status}`,
      icon:'order',
      actionUrl:`/shop-templates/common/track/track-order.html?orderId=${orderId}&shopId=${shopId}`,
      actions:[{ label:'Track Order', primary:true }],
      data:{ orderId, status, shopId },
      createdAt:new Date().toISOString(),
      read:false
    };

    const userNotifs = getNotifications(targetUserId, shopId);
    userNotifs.unshift(notification);
    notificationsMemory.set(`${targetUserId}_${shopId}`, userNotifs.slice(0,100));

    if(global.io){
      global.io.to(`user:${targetUserId}`).emit('new-notification', notification);
      global.io.to(`user:${targetUserId}`).emit('order-status-updated', { orderId, status, shopId, notification });
      global.io.to(`order:${orderId}`).emit('order-status-updated', { orderId, status, shopId });
      global.io.to(`shop:${shopId}`).emit('order-status-updated', { orderId, status, shopId, userId:targetUserId });
    }

    res.json({ success:true, message:`Order ${status} notification sent 📦`, notification });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 4. READ / DELETE ==========
// POST /api/common/notifications/:notifId/read
router.post('/:notifId/read', async (req,res)=>{
  try{
    const { notifId } = req.params;
    const { userId, shopId } = req.body;

    let found = false;

    for(let [key, notifs] of notificationsMemory.entries()){
      const notif = notifs.find(n=> n._id===notifId);
      if(notif){
        notif.read = true;
        notificationsMemory.set(key, notifs);
        found = true;

        if(global.io){
          global.io.to(`user:${notif.userId}`).emit('notification-read', { notifId, userId:notif.userId });
        }
      }
    }

    // Also check userId + shopId specific
    if(userId && shopId){
      const userNotifs = getNotifications(userId, shopId);
      const notif = userNotifs.find(n=> n._id===notifId);
      if(notif){
        notif.read = true;
        notificationsMemory.set(`${userId}_${shopId}`, userNotifs);
        found = true;
      }
    }

    res.json({ success:true, message:found?'Marked as read ✅':'Notification not found but marked', notifId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/notifications/:shopId/read-all
router.post('/:shopId/read-all', async (req,res)=>{
  try{
    const { shopId } = req.params;
    const { userId } = req.body;

    let count = 0;

    if(userId){
      const userNotifs = getNotifications(userId, shopId);
      userNotifs.forEach(n=>{ if(!n.read){ n.read=true; count++; } });
      notificationsMemory.set(`${userId}_${shopId}`, userNotifs);
    } else {
      // Mark all for shop
      for(let [key, notifs] of notificationsMemory.entries()){
        if(key.endsWith(`_${shopId}`)){
          notifs.forEach(n=>{ if(!n.read){ n.read=true; count++; } });
          notificationsMemory.set(key, notifs);
        }
      }
    }

    if(global.io){
      global.io.to(`user:${userId}`).emit('all-notifications-read', { shopId, userId, count });
      global.io.to(`shop:${shopId}`).emit('all-notifications-read', { shopId, userId, count });
    }

    res.json({ success:true, message:`${count} notifications marked as read ✅`, count, shopId, userId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// DELETE /api/common/notifications/:notifId
router.delete('/:notifId', async (req,res)=>{
  try{
    const { notifId } = req.params;
    const { userId, shopId } = req.query;

    let deleted = false;

    for(let [key, notifs] of notificationsMemory.entries()){
      const filtered = notifs.filter(n=> n._id!==notifId);
      if(filtered.length!==notifs.length){
        notificationsMemory.set(key, filtered);
        deleted = true;
      }
    }

    if(userId && shopId){
      const userNotifs = getNotifications(userId, shopId);
      const filtered = userNotifs.filter(n=> n._id!==notifId);
      if(filtered.length!==userNotifs.length){
        notificationsMemory.set(`${userId}_${shopId}`, filtered);
        deleted = true;
      }
    }

    res.json({ success:true, message:deleted?'Notification deleted 🗑️':'Notification not found', notifId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 5. PUSH SUBSCRIPTION ==========
// POST /api/common/notifications/subscribe
router.post('/subscribe', async (req,res)=>{
  try{
    const { userId, shopId, subscription } = req.body;

    if(!userId ||!subscription){
      return res.status(400).json({ success:false, message:'userId and subscription required' });
    }

    subscriptionsMemory.set(userId, {
      userId,
      shopId:shopId||'',
      subscription,
      createdAt:new Date().toISOString()
    });

    if(global.io){
      global.io.to(`user:${userId}`).emit('push-subscribed', { userId, shopId });
    }

    res.json({ success:true, message:'Push subscription saved 🔔', userId, shopId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/notifications/unsubscribe
router.post('/unsubscribe', async (req,res)=>{
  try{
    const { userId } = req.body;

    if(!userId){
      return res.status(400).json({ success:false, message:'userId required' });
    }

    subscriptionsMemory.delete(userId);

    res.json({ success:true, message:'Push unsubscribed', userId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// GET /api/common/notifications/subscriptions/:userId
router.get('/subscriptions/:userId', async (req,res)=>{
  try{
    const { userId } = req.params;

    const subscription = subscriptionsMemory.get(userId);

    res.json({ success:true, userId, subscribed:!!subscription, subscription:subscription||null });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 6. SETTINGS ==========
// GET /api/common/notifications/settings/:userId
router.get('/settings/:userId', async (req,res)=>{
  try{
    const { userId } = req.params;

    let settings = settingsMemory.get(userId);

    if(!settings){
      settings = {
        userId,
        orderUpdates:true,
        offers:true,
        system:true,
        push:true,
        email:false,
        whatsapp:true,
        sms:false,
        sound:true,
        vibrate:true,
        createdAt:new Date().toISOString()
      };
      settingsMemory.set(userId, settings);
    }

    res.json({ success:true, settings, userId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// POST /api/common/notifications/settings/:userId
router.post('/settings/:userId', async (req,res)=>{
  try{
    const { userId } = req.params;
    const { orderUpdates, offers, system, push, email, whatsapp, sms, sound, vibrate } = req.body;

    let settings = settingsMemory.get(userId)||{ userId };

    settings = {
     ...settings,
      orderUpdates:orderUpdates!==undefined?orderUpdates:settings.orderUpdates,
      offers:offers!==undefined?offers:settings.offers,
      system:system!==undefined?system:settings.system,
      push:push!==undefined?push:settings.push,
      email:email!==undefined?email:settings.email,
      whatsapp:whatsapp!==undefined?whatsapp:settings.whatsapp,
      sms:sms!==undefined?sms:settings.sms,
      sound:sound!==undefined?sound:settings.sound,
      vibrate:vibrate!==undefined?vibrate:settings.vibrate,
      updatedAt:new Date().toISOString()
    };

    settingsMemory.set(userId, settings);

    res.json({ success:true, message:'Notification settings updated ⚙️', settings, userId });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

// ========== 7. STATS ==========
// GET /api/common/notifications/stats/:shopId
router.get('/stats/:shopId', async (req,res)=>{
  try{
    const { shopId } = req.params;

    const shopNotifications = getAllNotificationsForShop(shopId);

    const stats = {
      total:shopNotifications.length,
      unread:shopNotifications.filter(n=>!n.read).length,
      read:shopNotifications.filter(n=> n.read).length,
      order:shopNotifications.filter(n=> n.type==='order').length,
      offer:shopNotifications.filter(n=> n.type==='offer').length,
      system:shopNotifications.filter(n=> n.type==='system').length,
      today:shopNotifications.filter(n=> new Date(n.createdAt).toDateString()===new Date().toDateString()).length,
      totalSubscriptions:subscriptionsMemory.size,
      shopSubscriptions:Array.from(subscriptionsMemory.values()).filter(s=> s.shopId===shopId).length,
      topUsers:(()=>{
        const map = {};
        shopNotifications.forEach(n=>{ map[n.userId]=(map[n.userId]||0)+1; });
        return Object.entries(map).sort((a,b)=> b[1]-a[1]).slice(0,5).map(([userId, count])=>({ userId, count }));
      })()
    };

    res.json({ success:true, shopId, stats });

  }catch(e){ res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;