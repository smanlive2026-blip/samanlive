# SAMANLIVE - Local Market Module

## Overview
SAMANLIVE Local Market ek hyperlocal e-commerce system hai jisme har shop ka apna alag dashboard aur product management hota hai. User apni shop banata hai, products add karta hai, aur customer nearby shops se order kar sakte hai.

## Version
v1.0.0 - Active Status Update

## Features
1. **Multi Shop Type Support**: Kirana, Cloth, Medical, Restaurant, Electronics, Hardware
2. **Auto Active Shops**: Shop create karte hi turant live ho jati hai, admin approval nahi chahiye
3. **Template Based Dashboard**: Har shop type ka alag HTML template aur form
4. **GPS Based Discovery**: User ke 5km radius me saari active shops dikhti hai
5. **Role Based Access**: User sirf apni shop manage kar sakta hai, Admin sab manage kar sakta hai
6. **Product Variants**: Cloth me Size/Color, Medical me Batch/Expiry, Restaurant me Veg/Non-veg

## Folder Structure

## Shop Types & Fields

### 1. Kirana Store
**Fields**: name, weight, unit, mrp, price, stock, brand, expiry
**Use Case**: Grocery items, daily needs

### 2. Cloth Store  
**Fields**: name, category, size, color, fabric, mrp, price, stock, description
**Use Case**: Garments with size/color variants

### 3. Medical Store
**Fields**: name, company, batch, expiry, type, packSize, prescription, mrp, price, stock
**Use Case**: Medicines with batch tracking

### 4. Restaurant
**Fields**: name, category, foodType, spiceLevel, prepTime, price, available, description
**Use Case**: Food items with veg/non-veg flag

## API Endpoints

### Shop Management
- `POST /api/local-market/shops` - Create new shop, status: active
- `GET /api/local-market/my-shops` - Get user's shops
- `GET /api/local-market/shops/:id` - Get shop details
- `PUT /api/local-market/shops/:id` - Update shop, owner only
- `DELETE /api/local-market/shops/:id` - Delete shop, owner or admin

### Product Management
- `GET /api/local-market/shops/:shopId/products` - List all products
- `POST /api/local-market/products` - Add new product
- `PUT /api/local-market/products/:id` - Update product
- `DELETE /api/local-market/products/:id` - Delete product

### Public APIs
- `GET /api/local-market/nearby?lat=&lng=&radius=5000` - Get nearby active shops
- `GET /api/local-market/shop-types` - Get all shop type definitions

## Database Models

### Shop
```js
{
  shopName: String,
  shopType: String, // kirana, cloth, medical, restaurant
  ownerName: String,
  mobile: String,
  address: String,
  description: String,
  icon: String,
  range: Number, // meters
  location: { type: Point, coordinates: [lng, lat] },
  createdBy: ObjectId,
  status: 'active', // default active
  rating: Number,
  isOpen: Boolean
}