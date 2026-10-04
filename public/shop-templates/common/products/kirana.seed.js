// LOCATION: public/shop-templates/common/products/kirana.seed.js - V16 ES MODULE - WORLD BOSS - NO exports - ONLY export const
export const FORM_CONFIG = {
  title: "Kirana Product",
  icon: "🛒",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Aashirvaad Atta 10kg", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Aashirvaad, Tata, Local", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Atta","Dal","Rice","Oil","Masala","Biscuit","Namkeen","Tea","Sugar","General"], col: "half" },
    { name: "price", label: "Selling Price *", type: "number", placeholder: "480", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "500", col: "half" },
    { name: "stock", label: "Stock Qty *", type: "number", value: "100", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "10", col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "10kg, 1L, 500g", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["packet","kg","gram","litre","ml","piece","bottle","box","pouch"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Fresh kirana...", col: "full" }
  ]
};

export const PRODUCTS = [
  { name: "Aashirvaad Atta 10kg", brand: "Aashirvaad", category: "Atta", price: 480, mrp: 520, stock: 100, weight: "10kg", unit: "packet", thumbnail: "" },
  { name: "Fortune Oil 1L", brand: "Fortune", category: "Oil", price: 155, mrp: 170, stock: 100, weight: "1L", unit: "bottle" },
  { name: "Tata Salt 1kg", brand: "Tata", category: "Masala", price: 28, mrp: 30, stock: 200, weight: "1kg", unit: "packet" },
  { name: "Toor Dal 1kg", brand: "Local", category: "Dal", price: 140, mrp: 160, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Basmati Rice 5kg", brand: "India Gate", category: "Rice", price: 450, mrp: 500, stock: 80, weight: "5kg", unit: "packet" },
  { name: "Sugar 1kg", brand: "Local", category: "Sugar", price: 45, mrp: 50, stock: 150, weight: "1kg", unit: "packet" },
  { name: "Tata Tea Gold 250g", brand: "Tata", category: "Tea", price: 145, mrp: 160, stock: 100, weight: "250g", unit: "packet" },
  { name: "Parle-G 800g", brand: "Parle", category: "Biscuit", price: 90, mrp: 100, stock: 120, weight: "800g", unit: "packet" },
  { name: "Haldiram Aloo Bhujia 400g", brand: "Haldiram", category: "Namkeen", price: 95, mrp: 110, stock: 100, weight: "400g", unit: "packet" },
  { name: "MDH Kitchen King 100g", brand: "MDH", category: "Masala", price: 55, mrp: 60, stock: 100, weight: "100g", unit: "packet" },
  { name: "Moong Dal 1kg", brand: "Local", category: "Dal", price: 120, mrp: 135, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Chana Dal 1kg", brand: "Local", category: "Dal", price: 90, mrp: 100, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Urad Dal 1kg", brand: "Local", category: "Dal", price: 130, mrp: 145, stock: 80, weight: "1kg", unit: "packet" },
  { name: "Masoor Dal 1kg", brand: "Local", category: "Dal", price: 95, mrp: 110, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Poha 1kg", brand: "Local", category: "Rice", price: 50, mrp: 55, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Suji 1kg", brand: "Local", category: "Atta", price: 45, mrp: 50, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Besan 1kg", brand: "Fortune", category: "Atta", price: 85, mrp: 95, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Mustard Oil 1L", brand: "Fortune", category: "Oil", price: 165, mrp: 180, stock: 80, weight: "1L", unit: "bottle" },
  { name: "Refined Oil 5L", brand: "Fortune", category: "Oil", price: 750, mrp: 800, stock: 50, weight: "5L", unit: "bottle" },
  { name: "Ghee 500ml", brand: "Amul", category: "Oil", price: 310, mrp: 340, stock: 60, weight: "500ml", unit: "bottle" },
  // 20-100 tak auto generate ke liye same pattern - 100 products total
  { name: "Rajma 1kg", brand: "Local", category: "Dal", price: 110, mrp: 125, stock: 80, weight: "1kg", unit: "packet" },
  { name: "Chole 1kg", brand: "Local", category: "Dal", price: 95, mrp: 110, stock: 80, weight: "1kg", unit: "packet" },
  { name: "Matar 1kg", brand: "Local", category: "Dal", price: 85, mrp: 95, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Haldi 100g", brand: "MDH", category: "Masala", price: 30, mrp: 35, stock: 150, weight: "100g", unit: "packet" },
  { name: "Mirchi 100g", brand: "MDH", category: "Masala", price: 45, mrp: 50, stock: 150, weight: "100g", unit: "packet" },
  { name: "Dhaniya 100g", brand: "MDH", category: "Masala", price: 35, mrp: 40, stock: 150, weight: "100g", unit: "packet" },
  { name: "Jeera 100g", brand: "MDH", category: "Masala", price: 55, mrp: 60, stock: 120, weight: "100g", unit: "packet" },
  { name: "Garam Masala 50g", brand: "MDH", category: "Masala", price: 45, mrp: 50, stock: 120, weight: "50g", unit: "packet" },
  { name: "Maggi 12 pack", brand: "Maggi", category: "General", price: 144, mrp: 156, stock: 100, weight: "12 pack", unit: "box" },
  { name: "Kurkure 20rs x 10", brand: "Kurkure", category: "Namkeen", price: 180, mrp: 200, stock: 100, weight: "10 pack", unit: "box" },
  { name: "Lays 10rs x 20", brand: "Lays", category: "Namkeen", price: 180, mrp: 200, stock: 100, weight: "20 pack", unit: "box" },
  { name: "Colgate 150g", brand: "Colgate", category: "General", price: 75, mrp: 85, stock: 100, weight: "150g", unit: "packet" },
  { name: "Surf Excel 1kg", brand: "Surf", category: "General", price: 110, mrp: 125, stock: 80, weight: "1kg", unit: "packet" },
  { name: "Vim Bar 3 pack", brand: "Vim", category: "General", price: 30, mrp: 35, stock: 150, weight: "3 pack", unit: "packet" },
  { name: "Tata Salt Lite", brand: "Tata", category: "Masala", price: 35, mrp: 40, stock: 100, weight: "1kg", unit: "packet" },
  { name: "Poha Thin 500g", brand: "Local", category: "Rice", price: 30, mrp: 35, stock: 100, weight: "500g", unit: "packet" },
  { name: "Muri 500g", brand: "Local", category: "Namkeen", price: 25, mrp: 30, stock: 100, weight: "500g", unit: "packet" },
  { name: "Chana Roasted 500g", brand: "Local", category: "Namkeen", price: 60, mrp: 70, stock: 80, weight: "500g", unit: "packet" },
  { name: "Peanut 500g", brand: "Local", category: "Namkeen", price: 70, mrp: 80, stock: 80, weight: "500g", unit: "packet" },
  { name: "Jaggery 1kg", brand: "Local", category: "Sugar", price: 60, mrp: 70, stock: 80, weight: "1kg", unit: "packet" }
];

// Auto-fill 100 tak - 40 se 100 tak loop se generate
for(let i=PRODUCTS.length; i<100; i++){
  PRODUCTS.push({
    name: `Kirana Item ${i+1}`,
    brand: ["Local","Tata","Fortune","MDH","Haldiram"][i%5],
    category: ["General","Dal","Rice","Oil","Masala"][i%5],
    price: 30 + (i*2),
    mrp: 40 + (i*2),
    stock: 100,
    weight: `${500+i*10}g`,
    unit: "packet",
    thumbnail: ""
  });
}

export default { FORM_CONFIG, PRODUCTS };