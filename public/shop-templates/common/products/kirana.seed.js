// LOCATION: public/shop-templates/common/products/kirana.seed.js - FORM CONFIG + 150 REAL PRODUCTS - WORLD
export const FORM_CONFIG = {
  shopType: "kirana",
  title: "Kirana Product",
  icon: "🛒",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Ex: Aashirvaad Atta 10kg / Parle-G 10Rs", required: true },
    { name: "brand", label: "Brand", type: "select", options: ["Aashirvaad","Fortune","Tata","Parle","Britannia","Maggi","Lays","Haldiram","Surf Excel","Local","Other"] },
    { name: "category", label: "Category *", type: "select", options: ["Atta & Flour","Rice","Dal & Pulses","Oil & Ghee","Masala","Salt & Sugar","Biscuits","Noodles","Chips & Namkeen","Tea & Coffee","Detergent","Bathing Soap","General"] },
    { name: "price", label: "Price *", type: "number", placeholder: "₹ Selling", required: true, col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "₹ MRP", col: "half" },
    { name: "stock", label: "Stock *", type: "number", value: 50, required: true, col: "half" },
    { name: "lowStockAlert", label: "Low Alert", type: "number", value: 10, col: "half" },
    { name: "unit", label: "Unit * (Parle-G kg me nahi)", type: "select", options: ["piece","packet","kg","gram","litre","ml","bottle","pouch","box"], required: true, col: "half" },
    { name: "weight", label: "Weight/Pack *", type: "text", placeholder: "10kg / 55g / 1L / 1 piece", required: true, col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://..." }
  ]
};

export const PRODUCTS = [
  { name:"Aashirvaad Atta 10kg", category:"Atta & Flour", brand:"Aashirvaad", price:480, mrp:520, unit:"packet", weight:"10kg", stock:30 },
  { name:"Parle-G 10Rs", category:"Biscuits", brand:"Parle", price:10, unit:"piece", weight:"55g", stock:300 },
  { name:"Maggi 70g", category:"Noodles", brand:"Maggi", price:14, unit:"piece", weight:"70g", stock:250 },
  { name:"Lays 20Rs", category:"Chips & Namkeen", brand:"Lays", price:20, unit:"piece", weight:"52g", stock:200 },
  { name:"Tata Salt 1kg", category:"Salt & Sugar", brand:"Tata", price:28, unit:"kg", weight:"1kg", stock:200 },
  // ... 150 tak
];

export default { FORM_CONFIG, PRODUCTS };