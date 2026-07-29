// ========================================
// QUICK ADD 50+ ACHAR PRODUCTS
// File: /public/shop-templates/achar-shop/quick-add-products.js
// ========================================

const acharProductsList = [
    { name: 'Aam Ka Achar', category: 'Aam', price500: 120, price1kg: 220, stock: 20, description: 'Khatta meetha aam ka achar maa ke haath ka', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Aam+Achar' },
    { name: 'Nimbu Ka Achar', category: 'Nimbu', price500: 100, price1kg: 180, stock: 15, description: 'Teekha nimbu achar', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Nimbu+Achar' },
    { name: 'Mix Achar', category: 'Mix', price500: 140, price1kg: 260, stock: 25, description: 'Aam, gajar, mooli ka mix achar', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Mix+Achar' },
    { name: 'Gajar Ka Achar', category: 'Gajar', price500: 110, price1kg: 200, stock: 10, description: 'Sardiyon wala gajar achar', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Gajar+Achar' },
    { name: 'Lahsun Ka Achar', category: 'Lahsun', price500: 150, price1kg: 280, stock: 18, description: 'Oil wala lahsun achar', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Lahsun+Achar' },
    { name: 'Hari Mirchi Achar', category: 'Mirchi', price500: 90, price1kg: 160, stock: 30, description: 'Teekhi hari mirchi', jarType: 'Plastic', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Mirchi+Achar' },
    { name: 'Aam Murabba', category: 'Murabba', price500: 160, price1kg: 300, stock: 12, description: 'Meetha aam murabba', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Murabba' },
    { name: 'Aam Ka Gol Achar', category: 'Aam', price500: 130, price1kg: 240, stock: 22, description: 'Masaledar gol aam', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Aam+Gol' },
    { name: 'Nimbu Meetha Achar', category: 'Nimbu', price500: 110, price1kg: 200, stock: 16, description: 'Meetha nimbu', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Meetha+Nimbu' },
    { name: 'Mix Punjabi Achar', category: 'Mix', price500: 150, price1kg: 270, stock: 20, description: 'Punjabi style mix', jarType: 'Ceramic', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Punjabi+Mix' },
    // Baki ke 40 product... yaha full list daal dena
    { name: 'Bharwa Mirchi', category: 'Mirchi', price500: 120, price1kg: 220, stock: 14, description: 'Bharwa masala mirchi', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Bharwa' },
    { name: 'Aam Chunda', category: 'Aam', price500: 140, price1kg: 250, stock: 19, description: 'Gujrati chunda', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Chunda' },
    { name: 'Adrak Ka Achar', category: 'Other', price500: 130, price1kg: 240, stock: 11, description: 'Adrak nimbu achar', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Adrak' },
    { name: 'Kair Ka Achar', category: 'Other', price500: 170, price1kg: 320, stock: 8, description: 'Rajasthani kair', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Kair' },
    { name: 'Lasoda Ka Achar', category: 'Other', price500: 160, price1kg: 300, stock: 9, description: 'Gondi achar', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Lasoda' },
    { name: 'Aam Lehsun Achar', category: 'Aam', price500: 135, price1kg: 250, stock: 17, description: 'Aam lehsun mix', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Aam+Lehsun' },
    { name: 'Nimbu Adrak', category: 'Nimbu', price500: 115, price1kg: 210, stock: 13, description: 'Nimbu adrak ka mix', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Nimbu+Adrak' },
    { name: 'Gobhi Gajar Shalgam', category: 'Mix', price500: 125, price1kg: 230, stock: 21, description: 'Winter special mix', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=GGS+Mix' },
    { name: 'Mooli Ka Achar', category: 'Other', price500: 105, price1kg: 190, stock: 15, description: 'Khatti mooli', jarType: 'Plastic', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Mooli' },
    { name: 'Baingan Ka Achar', category: 'Other', price500: 110, price1kg: 200, stock: 10, description: 'Bharwa baingan', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Baingan' },
    { name: 'Aam Panchranga', category: 'Aam', price500: 145, price1kg: 270, stock: 16, description: '5 masale wala aam', jarType: 'Ceramic', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Panchranga' },
    { name: 'Nimbu Ka Chilka', category: 'Nimbu', price500: 95, price1kg: 170, stock: 24, description: 'Sirf chilke wala', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Nimbu+Chilka' },
    { name: 'Aamras Murabba', category: 'Murabba', price500: 180, price1kg: 340, stock: 11, description: 'Aamras me dooba', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Aamras' },
    { name: 'Hing Wala Achar', category: 'Other', price500: 155, price1kg: 290, stock: 12, description: 'Pachak hing achar', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Hing' },
    { name: 'Lal Mirchi Achar', category: 'Mirchi', price500: 100, price1kg: 180, stock: 28, description: 'Lal sukhi mirchi', jarType: 'Plastic', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Lal+Mirchi' },
    { name: 'Aam Ka Kutcha Achar', category: 'Aam', price500: 125, price1kg: 230, stock: 18, description: 'Kacche aam ka', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Kutcha+Aam' },
    { name: 'Nimbu Ka Rasa', category: 'Nimbu', price500: 105, price1kg: 195, stock: 14, description: 'Ras wala nimbu', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Nimbu+Ras' },
    { name: 'Mix Khatta Meetha', category: 'Mix', price500: 155, price1kg: 280, stock: 17, description: 'Khatta meetha mix', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Khatta+Meetha' },
    { name: 'Gajar Kanji', category: 'Gajar', price500: 90, price1kg: 170, stock: 22, description: 'Kanji wali gajar', jarType: 'Plastic', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Kanji' },
    { name: 'Lahsun Aadrak', category: 'Lahsun', price500: 160, price1kg: 300, stock: 10, description: 'Lahsun adrak mix', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Lahsun+Adrak' },
    { name: 'Aam Ka Achar Tel Wala', category: 'Aam', price500: 140, price1kg: 260, stock: 15, description: 'Sarso tel wala', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Tel+Aam' },
    { name: 'Nimbu Ka Achar Meetha', category: 'Nimbu', price500: 120, price1kg: 220, stock: 16, description: 'Cheeni wala nimbu', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Meetha+Nimbu2' },
    { name: 'Mix Rajasthani', category: 'Mix', price500: 165, price1kg: 310, stock: 13, description: 'Rajsthani special', jarType: 'Ceramic', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Raj+Mix' },
    { name: 'Aam Ka Achar Lahsun Wala', category: 'Aam', price500: 150, price1kg: 280, stock: 14, description: 'Aam lehsun tel', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Aam+Lehsun2' },
    { name: 'Gajar Achar Meetha', category: 'Gajar', price500: 120, price1kg: 220, stock: 11, description: 'Meethi gajar', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Meethi+Gajar' },
    { name: 'Mirchi Ka Tapora', category: 'Mirchi', price500: 110, price1kg: 200, stock: 19, description: 'Tapora style', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Tapora' },
    { name: 'Aam Ka Murabba Sukha', category: 'Murabba', price500: 170, price1kg: 320, stock: 9, description: 'Sukha murabba', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Sukha+Murabba' },
    { name: 'Nimbu Ka Achar Namkeen', category: 'Nimbu', price500: 100, price1kg: 185, stock: 20, description: 'Namkeen nimbu', jarType: 'Plastic', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Namkeen+Nimbu' },
    { name: 'Mix Achar Oil Free', category: 'Mix', price500: 135, price1kg: 250, stock: 18, description: 'Oil free healthy', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Oil+Free' },
    { name: 'Aam Ka Achar Gujrati', category: 'Aam', price500: 130, price1kg: 240, stock: 16, description: 'Gujrati style', jarType: 'Glass', spiceLevel: 'Mild', image: 'https://placehold.co/400/FBBF24/fff?text=Gujrati+Aam' },
    { name: 'Lahsun Ka Achar Sukha', category: 'Lahsun', price500: 145, price1kg: 270, stock: 12, description: 'Sukha lahsun', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Sukha+Lahsun' },
    { name: 'Gajar Mirchi Mix', category: 'Mix', price500: 115, price1kg: 210, stock: 17, description: 'Gajar mirchi', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Gajar+Mirchi' },
    { name: 'Aam Ka Achar Khatta', category: 'Aam', price500: 125, price1kg: 235, stock: 19, description: 'Extra khatta', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Khatta+Aam' },
    { name: 'Nimbu Ka Achar Punjabi', category: 'Nimbu', price500: 110, price1kg: 205, stock: 15, description: 'Punjabi style', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Punjabi+Nimbu' },
    { name: 'Mix Achar Ghar Ka', category: 'Mix', price500: 145, price1kg: 265, stock: 21, description: 'Ghar jaisa swaad', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Ghar+Ka+Mix' },
    { name: 'Aam Ka Achar Special', category: 'Aam', price500: 160, price1kg: 300, stock: 10, description: 'Special masala', jarType: 'Ceramic', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Special+Aam' },
    { name: 'Mirchi Lehsun Achar', category: 'Mirchi', price500: 125, price1kg: 235, stock: 14, description: 'Mirchi lehsun', jarType: 'Glass', spiceLevel: 'Teekha', image: 'https://placehold.co/400/FBBF24/fff?text=Mirchi+Lahsun' },
    { name: 'Aam Ka Achar Bina Tel', category: 'Aam', price500: 135, price1kg: 250, stock: 17, description: 'Bina tel wala', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Bina+Tel' },
    { name: 'Nimbu Ka Achar Gharalu', category: 'Nimbu', price500: 105, price1kg: 195, stock: 18, description: 'Gharalu recipe', jarType: 'Glass', spiceLevel: 'Medium', image: 'https://placehold.co/400/FBBF24/fff?text=Gharalu+Nimbu' }
];

let isAdding = false;

async function quickAddProducts() {
    const shopId = new URLSearchParams(window.location.search).get('shopId'); // FIX: shopId yaha liya
    
    if(isAdding) return alert('Pehle wale add ho rahe hain');
    if(!shopId) return alert('ShopId nahi mila');
    if(!confirm('50+ products add karein? Pehle wale delete nahi honge')) return;
    
    isAdding = true;
    const btn = document.getElementById('quickAddBtn');
    if(btn) {
        btn.innerText = 'Adding...';
        btn.disabled = true;
    }

    let success = 0;
    for(let p of acharProductsList) {
        p.shopId = shopId;
        p.isActive = true; // ye add kiya
        try {
            const res = await fetch('/api/shops/achar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(p)
            });
            if(res.ok) success++;
            await new Promise(r => setTimeout(r, 100)); // server load kam karne ke liye
        } catch(e) { console.log('Error', p.name) }
    }

    alert(`${success} products add ho gaye!`);
    isAdding = false;
    if(btn) {
        btn.innerText = '⚡ 50+ Products Add Karein';
        btn.disabled = false;
    }
    if(typeof loadInventory === 'function') loadInventory(); // inventory refresh
}