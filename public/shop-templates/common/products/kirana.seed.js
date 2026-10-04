export const FORM_CONFIG = {
  title: "Kirana Product",
  icon: "🛒",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Aashirvaad Atta 10kg", col: "full" },
    { name: "brand", label: "Brand *", type: "text", placeholder: "Aashirvaad, Tata", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["Atta","Dal","Rice","Oil","Masala","Biscuit","Namkeen","Tea","Sugar","General"], col: "half" },
    { name: "price", label: "Selling Price *", type: "number", placeholder: "480", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "500", col: "half" },
    { name: "stock", label: "Stock Qty *", type: "number", value: "100", col: "half" },
    { name: "lowStockAlert", label: "Low Stock Alert", type: "number", value: "10", col: "half" },
    { name: "weight", label: "Weight", type: "text", placeholder: "10kg, 1L", col: "half" },
    { name: "unit", label: "Unit", type: "select", options: ["packet","kg","gram","litre","ml","piece","bottle"], col: "half" },
    { name: "thumbnail", label: "Image URL", type: "text", placeholder: "https://...", col: "full" },
    { name: "description", label: "Description", type: "text", placeholder: "Fresh kirana...", col: "full" }
  ]
};

export const PRODUCTS = [
  { name: "Aashirvaad Atta 10kg", brand: "Aashirvaad", category: "Atta", price: 480, mrp: 520, stock: 100, weight: "10kg", unit: "packet", thumbnail: "" },
  { name: "Fortune Oil 1L", brand: "Fortune", category: "Oil", price: 155, mrp: 170, stock: 100, weight: "1L", unit: "bottle", thumbnail: "" },
  { name: "Tata Salt 1kg", brand: "Tata", category: "Masala", price: 28, mrp: 30, stock: 200, weight: "1kg", unit: "packet", thumbnail: "" },
  { name: "Toor Dal 1kg", brand: "Local", category: "Dal", price: 140, mrp: 160, stock: 100, weight: "1kg", unit: "packet", thumbnail: "" },
  { name: "Basmati Rice 5kg", brand: "India Gate", category: "Rice", price: 450, mrp: 500, stock: 80, weight: "5kg", unit: "packet", thumbnail: "" },
  { name: "Sugar 1kg", brand: "Local", category: "Sugar", price: 45, mrp: 50, stock: 150, weight: "1kg", unit: "packet", thumbnail: "" },
  { name: "Tata Tea Gold 250g", brand: "Tata", category: "Tea", price: 145, mrp: 160, stock: 100, weight: "250g", unit: "packet", thumbnail: "" },
  { name: "Parle-G 800g", brand: "Parle", category: "Biscuit", price: 90, mrp: 100, stock: 120, weight: "800g", unit: "packet", thumbnail: "" },
  { name: "Haldiram Bhujia 400g", brand: "Haldiram", category: "Namkeen", price: 95, mrp: 110, stock: 100, weight: "400g", unit: "packet", thumbnail: "" },
  { name: "MDH Kitchen King 100g", brand: "MDH", category: "Masala", price: 55, mrp: 60, stock: 100, weight: "100g", unit: "packet", thumbnail: "" }
];

for(let i=PRODUCTS.length;i<100;i++){
  PRODUCTS.push({ name:`Kirana Item ${i+1}`, brand:["Local","Tata","Fortune","MDH","Haldiram"][i%5], category:["General","Dal","Rice","Oil","Masala"][i%5], price:30+i*2, mrp:40+i*2, stock:100, weight:`${500+i*10}g`, unit:"packet", thumbnail:"" });
}

export default { FORM_CONFIG, PRODUCTS };