// LOCATION: public/shop-templates/common/notifications/notifications.js - V2 HONEST - FULL CODE - NO FAKE
// FIX V2: 1) Fake hata diya - ORD12345 / WELCOME50 wala nakli Notification kabhi nahi banega
// 2) shopId SIRF URL se - localStorage se kabhi nahi, warna galat shop ka Notification dikhta tha
// 3) userId AuthCore se - localStorage se kabhi nahi
// 4) addNotification ab sirf Server pe bhejega - localStorage me Fake save nahi karega, browser me global.io nahi chalayega
// FLOW: init -> Load (Server se) -> Socket pe naya aaye toh upar jodo -> Mark Read -> Server pe bhi mark karo
// RULE: Koi Notification nahi hai toh [] hi rahega - "No notifications yet" dikhega, nakli nahi dikhega
class NotificationsCore {
  constructor(){
    // shopId SIRF URL se - localStorage se kabhi nahi
    this.shopId = new URLSearchParams(location.search).get('shopId') || window.SHOP_ID || '';
    this.userId = '';
    try{
      if(window.AuthCore && window.AuthCore.getUserId) this.userId = window.AuthCore.getUserId() || '';
    }catch(e){}
    if(!this.userId){
      try{ this.userId = new URLSearchParams(location.search).get('userId') || 'guest'; }catch(e){ this.userId = 'guest'; }
    }
    this.notifications = [];
    this.unreadCount = 0;
    this.permission = 'default';
    this.subscription = null;
    try{ this.permission = ('Notification' in window) ? Notification.permission : 'default'; }catch(e){}
  }

  async init(){
    await this.loadNotifications();
    this.checkPermission();
    this.initSocket();
    this.updateBadge();
  }

  async loadNotifications(){
    try{
      if(!this.shopId){ this.notifications = []; this.unreadCount = 0; this.updateBadge(); return []; }
      var data = null;
      if(window.ApiCore){
        try{ data = await window.ApiCore.get(`/api/common/notifications/${encodeURIComponent(this.shopId)}?userId=${encodeURIComponent(this.userId)}`); }catch(e){ data = null; }
      }
      if(!data){
        try{ data = await fetch(`/api/common/notifications/${encodeURIComponent(this.shopId)}?userId=${encodeURIComponent(this.userId)}`).then(function(r){ return r.json(); }).catch(function(){ return null; }); }catch(e){}
      }
      // Backend se jo aaya wahi - Khali hai toh khali hi rahega, Fake kabhi nahi banayenge
      // Backend ka Fake FILE 2 me hat chuka hai, phir bhi purana Fake ID aa jaye toh usko yahan bhi rok dete hain
      var list = (data && (data.notifications || [])) || [];
      list = list.filter(function(n){
        if(!n) return false;
        if(n._id === 'n1' || n._id === 'n2' || n._id === 'n3' || n._id === 'n4') return false;
        var m = String(n.message || '') + ' ' + String(n.title || '');
        if(m.indexOf('ORD12345') !== -1) return false;
        if(m.indexOf('WELCOME50') !== -1) return false;
        if(m.indexOf('9876543210') !== -1) return false;
        return true;
      });
      this.notifications = list;
      this.unreadCount = list.filter(function(n){ return !n.read; }).length;
      this.updateBadge();
      return this.notifications;
    }catch(e){
      // Fail hua toh khali dikhayenge, Fake nahi banayenge
      this.notifications = [];
      this.unreadCount = 0;
      this.updateBadge();
      return [];
    }
  }

  async addNotification(notification){
    try{
      if(!notification || !notification.title) return { success:false, error:'title chahiye' };
      if(!this.shopId) return { success:false, error:'shopId missing - URL me ?shopId=XXX chahiye' };
      var payload = {
        userId: notification.userId || this.userId,
        type: notification.type || 'system',
        title: notification.title,
        message: notification.message || notification.title,
        icon: notification.icon || notification.type || 'system',
        actionUrl: notification.actionUrl || '',
        actions: notification.actions || [],
        data: notification.data || {}
      };
      var data = null;
      if(window.ApiCore){
        try{ data = await window.ApiCore.post(`/api/common/notifications/${encodeURIComponent(this.shopId)}/send`, payload); }catch(e){ data = null; }
      }
      if(!data){
        try{
          data = await fetch(`/api/common/notifications/${encodeURIComponent(this.shopId)}/send`, {
            method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload)
          }).then(function(r){ return r.json(); }).catch(function(){ return null; });
        }catch(e){}
      }
      if(!data || !data.notification) return { success:false, error:'Server pe save nahi hua' };
      var notif = data.notification;
      if(!this.notifications.find(function(n){ return n._id === notif._id; })){
        this.notifications.unshift(notif);
      }
      this.unreadCount = this.notifications.filter(function(n){ return !n.read; }).length;
      this.updateBadge();
      this.showToast(notif);
      this.showBrowserPush(notif);
      return { success:true, notification:notif };
    }catch(e){ return { success:false, error:e.message }; }
  }

  // Order ka Notification - Sirf Order Status wali API se jayega, yahan Fake nahi banega
  async sendOrderNotification(orderId, status, customerId, shopId){
    try{
      if(!orderId || !status) return { success:false, error:'orderId + status chahiye' };
      var sid = shopId || this.shopId;
      if(!sid) return { success:false, error:'shopId missing' };
      var payload = { orderId: orderId, shopId: sid, userId: customerId || this.userId, status: status };
      var data = null;
      if(window.ApiCore){ try{ data = await window.ApiCore.post('/api/common/notifications/order-status', payload); }catch(e){ data = null; } }
      if(!data){
        try{ data = await fetch('/api/common/notifications/order-status', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) }).then(function(r){ return r.json(); }).catch(function(){ return null; }); }catch(e){}
      }
      if(data && data.notification){
        if(!this.notifications.find(function(n){ return n._id === data.notification._id; })) this.notifications.unshift(data.notification);
        this.unreadCount = this.notifications.filter(function(n){ return !n.read; }).length;
        this.updateBadge();
        this.showToast(data.notification);
      }
      return data || { success:false };
    }catch(e){ return { success:false, error:e.message }; }
  }

  // Offer ka Notification - Sirf tab jayega jab koi asli Offer bheje, Fake WELCOME50 kabhi nahi banega
  async sendOfferNotification(offerTitle, offerCode, shopId){
    try{
      if(!offerTitle) return { success:false, error:'offerTitle chahiye' };
      return await this.addNotification({
        type:'offer',
        title: offerTitle,
        message: offerCode ? ('Code: ' + offerCode) : offerTitle,
        icon:'offer',
        actionUrl: '/shop-templates/common/notifications/notifications.html?shopId=' + encodeURIComponent(shopId || this.shopId),
        data:{ offerTitle: offerTitle, offerCode: offerCode || '', shopId: shopId || this.shopId }
      });
    }catch(e){ return { success:false, error:e.message }; }
  }

  async markAsRead(notifId){
    try{
      var notif = this.notifications.find(function(n){ return n._id === notifId; });
      if(notif) notif.read = true;
      this.unreadCount = this.notifications.filter(function(n){ return !n.read; }).length;
      this.updateBadge();
      if(window.ApiCore){
        await window.ApiCore.post(`/api/common/notifications/${encodeURIComponent(notifId)}/read`, { userId:this.userId, shopId:this.shopId }).catch(function(){});
      } else {
        try{ await fetch(`/api/common/notifications/${encodeURIComponent(notifId)}/read`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ userId:this.userId, shopId:this.shopId }) }).catch(function(){}); }catch(e){}
      }
      return { success:true };
    }catch(e){ return { success:false }; }
  }

  async markAllAsRead(){
    try{
      this.notifications.forEach(function(n){ n.read = true; });
      this.unreadCount = 0;
      this.updateBadge();
      if(window.ApiCore){
        await window.ApiCore.post(`/api/common/notifications/${encodeURIComponent(this.shopId)}/read-all`, { userId:this.userId }).catch(function(){});
      } else {
        try{ await fetch(`/api/common/notifications/${encodeURIComponent(this.shopId)}/read-all`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ userId:this.userId }) }).catch(function(){}); }catch(e){}
      }
      return { success:true };
    }catch(e){ return { success:false }; }
  }

  async deleteNotification(notifId){
    try{
      this.notifications = this.notifications.filter(function(n){ return n._id !== notifId; });
      this.unreadCount = this.notifications.filter(function(n){ return !n.read; }).length;
      this.updateBadge();
      if(window.ApiCore){
        await window.ApiCore.delete(`/api/common/notifications/${encodeURIComponent(notifId)}?userId=${encodeURIComponent(this.userId)}&shopId=${encodeURIComponent(this.shopId)}`).catch(function(){});
      }
      return { success:true };
    }catch(e){ return { success:false }; }
  }

  getUnread(){
    return this.notifications.filter(function(n){ return !n.read; });
  }

  getAll(){
    return this.notifications;
  }

  checkPermission(){
    try{ if('Notification' in window) this.permission = Notification.permission; }catch(e){}
    return this.permission;
  }

  async enablePush(){
    try{
      if(!('Notification' in window)) return { success:false, error:'Is browser me Push nahi hai' };
      var perm = await Notification.requestPermission();
      this.permission = perm;
      if(perm === 'granted'){
        // Sirf Permission le rahe hain + Server ko bata rahe hain - Web Push ka asli bhejna abhi Backend me band hai, isliye jhootha "Push sent" nahi bolenge
        try{
          if(window.ApiCore) await window.ApiCore.post('/api/common/notifications/subscribe', { userId:this.userId, shopId:this.shopId, subscription:{ permission:'granted', at:new Date().toISOString() } }).catch(function(){});
        }catch(e){}
        return { success:true, permission:perm };
      }
      return { success:false, permission:perm };
    }catch(e){ return { success:false, error:e.message }; }
  }

  updateBadge(){
    try{
      document.querySelectorAll('[data-notif-badge], .notif-badge, #notifBadge, #notificationBadge').forEach(function(el){
        if(!el) return;
        if(this.unreadCount > 0){ el.style.display = 'grid'; el.textContent = this.unreadCount > 99 ? '99+' : String(this.unreadCount); }
        else { el.style.display = 'none'; }
      }.bind(this));
      document.querySelectorAll('[data-unread-count]').forEach(function(el){ el.textContent = String(this.unreadCount); }.bind(this));
    }catch(e){}
  }

  showToast(notif){
    try{
      if(!notif) return;
      var old = document.querySelector('.toast-notification');
      if(old) old.remove();
      var toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.style.cssText = 'position:fixed;top:20px;right:20px;left:20px;margin:0 auto;max-width:360px;padding:14px 16px;background:#0f172a;color:#fff;border-radius:12px;font-weight:700;font-size:13px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2);cursor:pointer;line-height:1.4';
      toast.textContent = (notif.title || 'Notification') + ' - ' + (notif.message || '');
      toast.addEventListener('click', function(){
        toast.remove();
        if(notif.actionUrl) window.location.href = notif.actionUrl;
      });
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); }, 4000);
    }catch(e){}
  }

  showBrowserPush(notif){
    try{
      if(!notif) return;
      if(!('Notification' in window)) return;
      if(Notification.permission !== 'granted') return;
      if(!document.hidden) return; // Page khula hai toh Toast hi kaafi hai, dobara Browser Push mat dikhao
      new Notification(notif.title || 'Notification', { body: notif.message || '', tag: notif._id || 'notif' });
    }catch(e){}
  }

  initSocket(){
    try{
      if(window.SocketCore){
        var self = this;
        window.SocketCore.on('new-notification', function(notif){
          if(!notif) return;
          if(notif.shopId !== self.shopId && notif.userId !== self.userId) return;
          if(self.notifications.find(function(n){ return n._id === notif._id; })) return;
          self.notifications.unshift(notif);
          self.unreadCount = self.notifications.filter(function(n){ return !n.read; }).length;
          self.updateBadge();
          self.showToast(notif);
          self.showBrowserPush(notif);
        });
      }
    }catch(e){}
  }
}

window.NotificationsCore = new NotificationsCore();
window.NotificationsCoreInstance = window.NotificationsCore;

document.addEventListener('DOMContentLoaded', function(){ window.NotificationsCore.init(); });

// Global helpers - Purane callers ke liye same naam rakhe hain, taaki koi file toote na
window.sendNotification = function(data){ return window.NotificationsCore.addNotification(data); };
window.markNotificationRead = function(id){ return window.NotificationsCore.markAsRead(id); };
window.markAllNotificationsRead = function(){ return window.NotificationsCore.markAllAsRead(); };
window.getUnreadNotifications = function(){ return window.NotificationsCore.getUnread(); };
window.sendOrderNotification = function(orderId, status, customerId, shopId){ return window.NotificationsCore.sendOrderNotification(orderId, status, customerId, shopId); };