export const FORM_CONFIG = {
  title: "Cloth Product",
  icon: "👕",
  fields: [
    { name: "name", label: "Product Name *", type: "text", placeholder: "Men T-Shirt", col: "full" },
    { name: "brand", label: "Brand", type: "text", placeholder: "Nike, Local", col: "half" },
    { name: "category", label: "Category", type: "select", options: ["T-Shirt","Shirt","Jeans","Saree","Kurta"], col: "half" },
    { name: "price", label: "Price *", type: "number", placeholder: "499", col: "half" },
    { name: "mrp", label: "MRP", type: "number", placeholder: "999", col: "half" },
    { name: "size", label: "Size", type: "select", options: ["S","M","L","XL","XXL","Free Size"], col: "half" },
    { name: "color", label: "Color", type: "text", placeholder: "Black", col: "half" }
  ]
};
export const PRODUCTS = [{ name: "Men T-Shirt Black M", brand: "Local", category: "T-Shirt", price: 299, mrp: 599, stock: 50, size: "M", color: "Black" }];
export default { FORM_CONFIG, PRODUCTS };