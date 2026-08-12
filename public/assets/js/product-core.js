/**
 * FILE: public/assets/js/product-core.js
 * KAAM: Ye common file hai. Har shop template isi ko use karega product add, load, delete ke liye
 * KYA HO RAHA:
 * 1. loadProducts() - Kisi bhi shop ke product load karega
 * 2. addProduct() - Kisi bhi shop me product add karega  
 * 3. deleteProduct() - Delete karega
 * 4. Har shop ko sirf apna "adapter" dena hai jisse ye common file samajh jaye uska data
 * 5. Admin, Area Manager, Shop - sab isi file ko call karenge
 */

const ProductCore = {
    
    // === 1. PRODUCTS LOAD KARNA ===
    // shopId aur template bhej do, ye khud API call kar lega
    loadProducts: async function(shopId, template) {
        try {
            const res = await fetch(`/api/products/shop/${shopId}?template=${template}`);
            const data = await res.json();
            if(data.success) return data.products || [];
            return [];
        } catch(e) {
            console.error("Product Load Error:", e);
            return [];
        }
    },

    // === 2. PRODUCT ADD KARNA ===
    // shopData = {shopId, template, ...apne product fields}
    addProduct: async function(productData) {
        try {
            const res = await fetch(`/api/products/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            return await res.json(); // {success: true, product: {}}
        } catch(e) {
            console.error("Product Add Error:", e);
            return {success: false};
        }
    },

    // === 3. PRODUCT DELETE KARNA ===
    deleteProduct: async function(productId) {
        try {
            const res = await fetch(`/api/products/delete/${productId}`, { method: 'DELETE' });
            return await res.json();
        } catch(e) {
            console.error("Product Delete Error:", e);
            return {success: false};
        }
    },

    // === 4. RENDER KARNA - COMMON CARD ===
    // containerId: jisme dikhana hai, products: array, onClick: jab card click ho
    renderProducts: function(containerId, products, onClick) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        if(products.length === 0) {
            container.innerHTML = `<p style="text-align:center;color:#999;">Koi product nahi hai</p>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="product-card" onclick="onClick && onClick('${p._id}')">
                <img src="${p.image}" onerror="this.src='/assets/default-product.png'">
                <h4>${p.name}</h4>
                <p>₹${p.price}</p>
                ${p.stock <= 0 ? '<span style="color:red;">Out of Stock</span>' : ''}
            </div>
        `).join('');
    },

    // === 5. ADMIN/AREA MANAGER KE LIYE - SAB SHOP KE PRODUCT ===
    loadAllProducts: async function(filters = {}) {
        try {
            const query = new URLSearchParams(filters).toString();
            const res = await fetch(`/api/products/admin/all?${query}`);
            const data = await res.json();
            return data.success ? data.products : [];
        } catch(e) {
            console.error("Admin Load Error:", e);
            return [];
        }
    }
};

// Global bana diya taaki koi bhi file use kar sake
window.ProductCore = ProductCore;