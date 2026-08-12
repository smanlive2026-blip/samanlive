// ========================================
// QUICK ADD 50+ KIRANA PRODUCTS
// File: /public/shop-templates/kirana-shop/quick-add-products.js
// KAAM: Common API /api/products/add use karke 50+ kirana add karega
// ========================================

const kiranaProductsList = [
    { name: 'Tata Salt 1kg', category: 'Grocery', brand: 'Tata', unit: '1kg', price: 25, mrp: 30, stock: 50, description: 'Iodized Namak', image: 'https://placehold.co/400/22C55E/fff?text=Tata+Salt' },
    { name: 'Aashirvaad Atta 5kg', category: 'Flour', brand: 'Aashirvaad', unit: '5kg', price: 280, mrp: 320, stock: 30, description: 'Shudh Chakki Atta', image: 'https://placehold.co/400/22C55E/fff?text=Aashirvaad+Atta' },
    { name: 'Fortune Sunflower Oil 1L', category: 'Oil', brand: 'Fortune', unit: '1L', price: 160, mrp: 180, stock: 40, description: 'Refined Oil', image: 'https://placehold.co/400/22C55E/fff?text=Fortune+Oil' },
    { name: 'Sugar 1kg', category: 'Grocery', brand: 'Local', unit: '1kg', price: 45, mrp: 50, stock: 100, description: 'Cheeni', image: 'https://placehold.co/400/22C55E/fff?text=Sugar' },
    { name: 'Toor Dal 1kg', category: 'Dal', brand: 'Tata Sampann', unit: '1kg', price: 140, mrp: 160, stock: 35, description: 'Arhar Dal', image: 'https://placehold.co/400/22C55E/fff?text=Toor+Dal' },
    { name: 'Moong Dal 1kg', category: 'Dal', brand: 'Tata Sampann', unit: '1kg', price: 130, mrp: 150, stock: 35, description: 'Dhuli Moong Dal', image: 'https://placehold.co/400/22C55E/fff?text=Moong+Dal' },
    { name: 'Chana Dal 1kg', category: 'Dal', brand: 'Tata Sampann', unit: '1kg', price: 110, mrp: 130, stock: 30, description: 'Bengal Gram', image: 'https://placehold.co/400/22C55E/fff?text=Chana+Dal' },
    { name: 'Basmati Rice 1kg', category: 'Rice', brand: 'India Gate', unit: '1kg', price: 120, mrp: 140, stock: 45, description: 'Classic Basmati', image: 'https://placehold.co/400/22C55E/fff?text=Basmati+Rice' },
    { name: 'Colgate Toothpaste 100g', category: 'Personal Care', brand: 'Colgate', unit: '100g', price: 80, mrp: 90, stock: 60, description: 'MaxFresh', image: 'https://placehold.co/400/22C55E/fff?text=Colgate' },
    { name: 'Surf Excel 1kg', category: 'Detergent', brand: 'Surf Excel', unit: '1kg', price: 160, mrp: 180, stock: 25, description: 'Washing Powder', image: 'https://placehold.co/400/22C55E/fff?text=Surf+Excel' },
    { name: 'Lipton Tea 250g', category: 'Beverages', brand: 'Lipton', unit: '250g', price: 110, mrp: 120, stock: 40, description: 'Dust Tea', image: 'https://placehold.co/400/22C55E/fff?text=Lipton+Tea' },
    { name: 'Nescafe Coffee 100g', category: 'Beverages', brand: 'Nescafe', unit: '100g', price: 220, mrp: 250, stock: 30, description: 'Classic', image: 'https://placehold.co/400/22C55E/fff?text=Nescafe' },
    { name: 'Britannia Biscuit', category: 'Snacks', brand: 'Britannia', unit: '200g', price: 30, mrp: 35, stock: 80, description: 'Good Day', image: 'https://placehold.co/400/22C55E/fff?text=Good+Day' },
    { name: 'Parle-G 100g', category: 'Snacks', brand: 'Parle', unit: '100g', price: 10, mrp: 10, stock: 200, description: 'Glucose Biscuit', image: 'https://placehold.co/400/22C55E/fff?text=ParleG' },
    { name: 'Maggi Noodles 70g', category: 'Snacks', brand: 'Maggi', unit: '70g', price: 15, mrp: 15, stock: 150, description: '2-Minute', image: 'https://placehold.co/400/22C55E/fff?text=Maggi' },
    { name: 'Red Chilli Powder 200g', category: 'Spices', brand: 'MDH', unit: '200g', price: 90, mrp: 100, stock: 50, description: 'Deghi Mirch', image: 'https://placehold.co/400/22C55E/fff?text=MDH+Mirch' },
    { name: 'Turmeric Powder 200g', category: 'Spices', brand: 'MDH', unit: '200g', price: 60, mrp: 70, stock: 50, description: 'Haldi', image: 'https://placehold.co/400/22C55E/fff?text=MDH+Haldi' },
    { name: 'Garam Masala 100g', category: 'Spices', brand: 'MDH', unit: '100g', price: 80, mrp: 90, stock: 40, description: 'Mix Masala', image: 'https://placehold.co/400/22C55E/fff?text=Garam+Masala' },
    { name: 'Amul Milk 500ml', category: 'Dairy', brand: 'Amul', unit: '500ml', price: 30, mrp: 32, stock: 60, description: 'Toned Milk', image: 'https://placehold.co/400/22C55E/fff?text=Amul+Milk' },
    { name: 'Amul Butter 100g', category: 'Dairy', brand: 'Amul', unit: '100g', price: 60, mrp: 65, stock: 50, description: 'Salted Butter', image: 'https://placehold.co/400/22C55E/fff?text=Amul+Butter' },
    { name: 'Bread 400g', category: 'Bakery', brand: 'Britannia', unit: '400g', price: 40, mrp: 45, stock: 30, description: 'White Bread', image: 'https://placehold.co/400/22C55E/fff?text=Bread' },
    { name: 'Eggs 12pc', category: 'Dairy', brand: 'Farm', unit: '12pc', price: 70, mrp: 80, stock: 40, description: 'Fresh Eggs', image: 'https://placehold.co/400/22C55E/fff?text=Eggs' },
    { name: 'Shampoo 200ml', category: 'Personal Care', brand: 'Dove', unit: '200ml', price: 180, mrp: 200, stock: 25, description: 'Hairfall Care', image: 'https://placehold.co/400/22C55E/fff?text=Dove+Shampoo' },
    { name: 'Soap 125g', category: 'Personal Care', brand: 'Lux', unit: '125g', price: 45, mrp: 50, stock: 100, description: 'Beauty Soap', image: 'https://placehold.co/400/22C55E/fff?text=Lux+Soap' },
    { name: 'Hair Oil 200ml', category: 'Personal Care', brand: 'Parachute', unit: '200ml', price: 70, mrp: 80, stock: 50, description: 'Coconut Oil', image: 'https://placehold.co/400/22C55E/fff?text=Parachute+Oil' },
    { name: 'Face Wash 100ml', category: 'Personal Care', brand: 'Himalaya', unit: '100ml', price: 120, mrp: 140, stock: 35, description: 'Neem Facewash', image: 'https://placehold.co/400/22C55E/fff?text=Face+Wash' },
    { name: 'Dish Wash 500ml', category: 'Cleaning', brand: 'Vim', unit: '500ml', price: 90, mrp: 100, stock: 40, description: 'Liquid Gel', image: 'https://placehold.co/400/22C55E/fff?text=Vim+Liquid' },
    { name: 'Floor Cleaner 500ml', category: 'Cleaning', brand: 'Lizol', unit: '500ml', price: 110, mrp: 120, stock: 30, description: 'Disinfectant', image: 'https://placehold.co/400/22C55E/fff?text=Lizol' },
    { name: 'Chips 50g', category: 'Snacks', brand: 'Lays', unit: '50g', price: 20, mrp: 20, stock: 120, description: 'Classic Salted', image: 'https://placehold.co/400/22C55E/fff?text=Lays' },
    { name: 'Cold Drink 750ml', category: 'Beverages', brand: 'Coca Cola', unit: '750ml', price: 40, mrp: 45, stock: 80, description: 'Thums Up', image: 'https://placehold.co/400/22C55E/fff?text=ThumsUp' },
    { name: 'Water Bottle 1L', category: 'Beverages', brand: 'Bisleri', unit: '1L', price: 20, mrp: 20, stock: 100, description: 'Drinking Water', image: 'https://placehold.co/400/22C55E/fff?text=Bisleri' },
    { name: 'Ketchup 500g', category: 'Sauces', brand: 'Kissan', unit: '500g', price: 80, mrp: 90, stock: 40, description: 'Tomato Ketchup', image: 'https://placehold.co/400/22C55E/fff?text=Ketchup' },
    { name: 'Mayonnaise 400g', category: 'Sauces', brand: 'Veeba', unit: '400g', price: 130, mrp: 150, stock: 25, description: 'Veg Mayo', image: 'https://placehold.co/400/22C55E/fff?text=Mayo' },
    { name: 'Peanut Butter 340g', category: 'Spreads', brand: 'Sundrop', unit: '340g', price: 220, mrp: 250, stock: 20, description: 'Creamy', image: 'https://placehold.co/400/22C55E/fff?text=Peanut+Butter' },
    { name: 'Jam 500g', category: 'Spreads', brand: 'Kissan', unit: '500g', price: 120, mrp: 140, stock: 25, description: 'Mixed Fruit Jam', image: 'https://placehold.co/400/22C55E/fff?text=Jam' },
    { name: 'Cornflakes 500g', category: 'Breakfast', brand: 'Kelloggs', unit: '500g', price: 200, mrp: 230, stock: 30, description: 'Original', image: 'https://placehold.co/400/22C55E/fff?text=Cornflakes' },
    { name: 'Oats 500g', category: 'Breakfast', brand: 'Quaker', unit: '500g', price: 90, mrp: 100, stock: 35, description: 'Instant Oats', image: 'https://placehold.co/400/22C55E/fff?text=Quaker+Oats' },
    { name: 'Honey 500g', category: 'Grocery', brand: 'Dabur', unit: '500g', price: 250, mrp: 280, stock: 20, description: 'Pure Honey', image: 'https://placehold.co/400/22C55E/fff?text=Dabur+Honey' },
    { name: 'Pickle 400g', category: 'Grocery', brand: 'Mother', unit: '400g', price: 110, mrp: 130, stock: 30, description: 'Mixed Pickle', image: 'https://placehold.co/400/22C55E/fff?text=Pickle' },
    { name: 'Papad 200g', category: 'Snacks', brand: 'Lijjat', unit: '200g', price: 60, mrp: 70, stock: 50, description: 'Urad Papad', image: 'https://placehold.co/400/22C55E/fff?text=Papad' },
    { name: 'Namkeen 400g', category: 'Snacks', brand: 'Haldiram', unit: '400g', price: 100, mrp: 120, stock: 60, description: 'Aloo Bhujia', image: 'https://placehold.co/400/22C55E/fff?text=Bhujia' },
    { name: 'Dry Fruits 250g', category: 'Grocery', brand: 'Tulsi', unit: '250g', price: 300, mrp: 350, stock: 15, description: 'Mix Dry Fruits', image: 'https://placehold.co/400/22C55E/fff?text=Dry+Fruits' },
    { name: 'Sewai 200g', category: 'Grocery', brand: 'MTR', unit: '200g', price: 40, mrp: 50, stock: 40, description: 'Vermicelli', image: 'https://placehold.co/400/22C55E/fff?text=Sewai' },
    { name: 'Poha 500g', category: 'Grocery', brand: 'Tata', unit: '500g', price: 50, mrp: 60, stock: 45, description: 'Flattened Rice', image: 'https://placehold.co/400/22C55E/fff?text=Poha' },
    { name: 'Suji 500g', category: 'Flour', brand: 'Tata', unit: '500g', price: 45, mrp: 50, stock: 50, description: 'Rava', image: 'https://placehold.co/400/22C55E/fff?text=Suji' },
    { name: 'Besan 1kg', category: 'Flour', brand: 'Tata', unit: '1kg', price: 110, mrp: 120, stock: 40, description: 'Gram Flour', image: 'https://placehold.co/400/22C55E/fff?text=Besan' },
    { name: 'Jeera 100g', category: 'Spices', brand: 'Tata', unit: '100g', price: 60, mrp: 70, stock: 50, description: 'Cumin Seeds', image: 'https://placehold.co/400/22C55E/fff?text=Jeera' },
    { name: 'Mustard Oil 1L', category: 'Oil', brand: 'Patanjali', unit: '1L', price: 170, mrp: 190, stock: 30, description: 'Kachi Ghani', image: 'https://placehold.co/400/22C55E/fff?text=Mustard+Oil' },
    { name: 'Ghee 1L', category: 'Dairy', brand: 'Amul', unit: '1L', price: 600, mrp: 650, stock: 20, description: 'Pure Ghee', image: 'https://placehold.co/400/22C55E/fff?text=Amul+Ghee' }
];

let isAdding = false;

async function quickAddProducts() {
    const shopId = new URLSearchParams(window.location.search).get('shopId');

    if(isAdding) return alert('Pehle wale add ho rahe hain');
    if(!shopId) return alert('ShopId nahi mila');
    if(!confirm(`50+ Kirana products add karein?`)) return;

    isAdding = true;
    const btn = document.getElementById('quickAddBtn');
    if(btn) {
        btn.innerText = 'Adding 0/50...';
        btn.disabled = true;
    }

    let success = 0;
    let failed = 0;

    for(let i = 0; i < kiranaProductsList.length; i++) {
        let p = {...kiranaProductsList[i]};

        // === COMMON DB FORMAT ===
        const productData = {
            shopId: shopId,
            template: 'kirana', // ZAROORI: kirana template
            name: p.name,
            description: p.description,
            price: p.price,
            mrp: p.mrp,
            image: p.image,
            images: [p.image],
            stock: p.stock,
            category: p.category,
            isActive: true,
            // === KIRANA KE SPECIFIC FIELD ===
            extra: {
                brand: p.brand,
                unit: p.unit,
                expiry: '' // baad me add karna ho to
            }
        };

        try {
            const res = await fetch(`/api/products/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(productData)
            });

            const data = await res.json();

            if(res.ok && data.success) {
                success++;
            } else {
                failed++;
                console.log('Failed:', p.name, data.message);
            }

            if(btn) btn.innerText = `Adding ${success}/${kiranaProductsList.length}...`;
            await new Promise(r => setTimeout(r, 150));

        } catch(e) {
            failed++;
            console.log('Error', p.name, e)
        }
    }

    alert(`${success} products add ho gaye!\n${failed} fail hue`);
    isAdding = false;
    if(btn) {
        btn.innerText = '⚡ 50+ Products Add Karein';
        btn.disabled = false;
    }

    // RELOAD
    if(window.ProductCore) {
        const products = await ProductCore.loadProducts(shopId, 'kirana');
        ProductCore.renderProducts('productList', products);
    }
}