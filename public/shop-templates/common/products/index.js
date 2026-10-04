// LOCATION: public/shop-templates/common/products/index.js - UNIVERSAL LOADER - FORM_CONFIG + PRODUCTS - 70 SHOPS - V16
// Ye file admin, area-manager, user-view ke liye hai - product-form.html direct import karta hai, isko direct use nahi karta

export async function loadSeed(shopType){
  try{
    const module = await import(`./${shopType}.seed.js`);
    // Naya structure: FORM_CONFIG + PRODUCTS dono
    return {
      config: module.FORM_CONFIG || module.default?.FORM_CONFIG || null,
      products: module.PRODUCTS || module.default?.PRODUCTS || [],
      all: module.default || module
    };
  }catch(e){
    console.warn(`❌ Seed not found for ${shopType}: ./common/products/${shopType}.seed.js`, e);
    return { config: null, products: [], all: null };
  }
}

// Sirf products chahiye toh
export async function loadProducts(shopType){
  const data = await loadSeed(shopType);
  return data.products;
}

// Sirf form config chahiye toh
export async function loadFormConfig(shopType){
  const data = await loadSeed(shopType);
  return data.config;
}

// Sab 70 shop ka list - ek sath admin ko dikhane ke liye
export async function loadAllShopsSeed(){
  const all = {};
  for(let type of SHOP_TYPES){
    all[type] = await loadSeed(type);
  }
  return all;
}

export const SHOP_TYPES = ["kirana","cloth","mobile","bakery","medical","fruit","sabji","dairy","beauty","footwear","electronics","restaurant","hardware","stationery","jewellery","auto","furniture","grocery-sweet","halwai","meat","pan","tea","juice","pizza","salon","optical","watch-shop","toy-shop","sports","winter-wear","kids-wear","saree-shop","suit-shop","mattress-shop","flower","nursery","puja","plastic","bartan","paint-shop","tiles","sanitary","plumbing","electrical","battery","brick","ply-board","door-shop","mat-shop","kambal-shop","charpai-shop","decoration-shop","fabric-shop","purse","rental","clinic","vet-shop","photo-studio","service","achar-shop","chakki","krishi","pansari","patanjali","tripal-shop","murti-shop","vet-clinic","painting"];

// Quick check - kaunsi seed file bani hai, kaunsi nahi
export async function checkSeedStatus(){
  const status = [];
  for(let type of SHOP_TYPES){
    try{
      await import(`./${type}.seed.js`);
      status.push({ type, exists: true });
    }catch{
      status.push({ type, exists: false });
    }
  }
  console.table(status);
  return status;
}