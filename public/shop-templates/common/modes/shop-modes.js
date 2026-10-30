// LOCATION: public/shop-templates/common/modes/shop-modes.js - V20 - MODE RESOLVER - FULL CODE
(function(){
  const MODE_MAP = {
    // retail - 24 shops
    'kirana':'retail','thela':'retail','pansari':'retail','general':'retail','achar-shop':'retail','grocery-sweet':'retail','battery':'retail','bartan':'retail','plastic':'retail','dairy':'retail','chakki':'retail','krishi':'retail','patanjali':'retail',
    // fashion - 17 shops
    'cloth':'fashion','saree-shop':'fashion','child-clothes':'fashion','kids-wear':'fashion','suit-shop':'fashion','winter-wear':'fashion','fabric-shop':'fashion','footwear':'fashion','purse':'fashion','kambal-shop':'fashion','mat-shop':'fashion','mattress-shop':'fashion','watch-shop':'fashion','jewellery':'fashion','beauty':'fashion','murti-shop':'fashion',
    // food - 11 shops
    'restaurant':'food','dhaba':'food','hotel':'food','pizza':'food','bakery':'food','halwai':'food','juice':'food','tea':'food','fruit':'food','meat':'food','sabji':'food',
    // service - 15 shops
    'auto':'service','mobile':'service','mochi':'service','optical':'service','photo-studio':'service','salon':'service','plumbing':'service','door-shop':'service','ply-board':'service','puja':'service','painting':'service','service':'service','paint-shop':'service',
    // healthcare - 6 shops
    'clinic':'healthcare','hospital':'healthcare','medical':'healthcare','vet-clinic':'healthcare','vet-shop':'healthcare','nursery':'healthcare',
    // rental - 5 shops
    'rental':'rental','decoration-shop':'rental','charpai-shop':'rental','tripal-shop':'rental','flower':'rental',
    // bulk - 12 shops
    'hardware':'bulk','brick':'bulk','tiles':'bulk','sanitary':'bulk','furniture':'bulk','electronics':'bulk','sports':'bulk','stationery':'bulk','toy-shop':'bulk',
    // mandi - same as retail perishable handled by fields
    'fish':'mandi','chicken':'mandi',
    // csc + education
    'csc':'csc','cyber-cafe':'csc','xerox':'csc','coaching':'education','stationery':'education'
  };

  window.getModeForShop = function(shopType){
    if(!shopType) return window.SHOP_MODES ? window.SHOP_MODES['retail'] : {id:'retail',name:'Retail',icon:'🛒',color:'#10b981',tabs:['products','orders','finance'],fields:[]};
    const t = shopType.toLowerCase().trim();
    const modeId = MODE_MAP[t] || 'retail';
    const modes = window.SHOP_MODES || window.WORLD_SHOP_MODES_CONFIG || {};
    return modes[modeId] || modes['retail'] || {id:modeId,name:modeId,icon:'🛒',color:'#10b981',tabs:['products','orders'],fields:[]};
  };

  window.getShopTypeFromURL = function(){
    const params = new URLSearchParams(location.search);
    if(params.get('shopType')) return params.get('shopType').toLowerCase();
    const m = location.pathname.match(/\/shop-templates\/([^\/]+)\//);
    if(m) return m[1].toLowerCase();
    return localStorage.getItem('shopType') || 'kirana';
  };

  console.log('✅ shop-modes.js resolver loaded - 50 modes mapped');
})();