// LOCATION: public/shop-templates/common/products/index.js - SEED LOADER - ALL 70 SHOPS
export async function loadSeed(shopType){
  try{
    const module = await import(`./${shopType}.seed.js`);
    return module.default || module.PRODUCTS || [];
  }catch(e){
    console.warn(`Seed not found for ${shopType}`, e);
    return [];
  }
}

export const SHOP_TYPES = ["kirana","cloth","mobile","bakery","medical","fruit","sabji","dairy","beauty","footwear","electronics","restaurant","hardware","stationery","jewellery","auto","furniture","grocery-sweet","halwai","meat","pan","tea","juice","pizza","salon","optical","watch-shop","toy-shop","sports","winter-wear","kids-wear","saree-shop","suit-shop","mattress-shop","flower","nursery","puja","plastic","bartan","paint-shop","tiles","sanitary","plumbing","electrical","battery","brick","ply-board","door-shop","mat-shop","kambal-shop","charpai-shop","decoration-shop","fabric-shop","purse","rental","clinic","vet-shop","photo-studio","service","achar-shop","chakki","krishi","pansari","patanjali","tripal-shop","murti-shop","vet-clinic","painting"];