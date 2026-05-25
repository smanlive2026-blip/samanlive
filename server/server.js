const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Static files serve karo - public folder se
app.use(express.static(path.join(__dirname, '../public')));

// JSON parse karne ke liye
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route - index.html bhejo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Saare 52 modules ke routes
const modules = [
    'education', 'health', 'kids', 'games', 'music', 'books', 
    'shopping', 'food', 'travel', 'real-estate', 'jobs', 'automotive',
    'finance', 'banking', 'stocks', 'payments', 'movies', 'tv-shows',
    'art', 'photography', 'writing', 'theater', 'fitness', 'yoga',
    'sports', 'football', 'basketball', 'tennis', 'swimming', 'cycling',
    'climbing', 'skiing', 'surfing', 'fishing', 'camping', 'gardening',
    'pets', 'cats', 'birds', 'fish', 'butterfly', 'flowers',
    'trees', 'night', 'weather', 'rainbow', 'stars', 'earth',
    'space', 'ufo', 'robots', 'target'
];

// Har module ka route banao
modules.forEach(module => {
    app.get(`/modules/${module}`, (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${module.toUpperCase()} - SAMANLIVE</title>
                <link rel="stylesheet" href="/assets/css/main.css">
                <style>
                    .module-page {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 50px 20px;
                    }
                    .module-content h1 {
                        font-size: 48px;
                        color: #1e40af;
                        margin-bottom: 20px;
                        text-transform: capitalize;
                    }
                    .module-content p {
                        font-size: 18px;
                        color: #64748b;
                        margin-bottom: 30px;
                    }
                    .back-btn {
                        background: #1e40af;
                        color: white;
                        padding: 12px 30px;
                        border: none;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                    }
                    .back-btn:hover {
                        background: #1e3a8a;
                    }
                </style>
            </head>
            <body>
                <header class="header">
                    <div class="header-container">
                        <div class="logo">
                            <div class="logo-icon">S</div>
                            <span>SAMANLIVE</span>
                        </div>
                        <nav class="desktop-nav">
                            <a href="/">Home</a>
                            <a href="/#services">Services</a>
                            <a href="/#about">About</a>
                        </nav>
                        <div class="user-section">
                            <div class="user-avatar">U</div>
                        </div>
                    </div>
                </header>

                <main class="main-content">
                    <div class="container">
                        <div class="module-page">
                            <div class="module-content">
                                <h1>${module.replace('-', ' ')} Module</h1>
                                <p>Ye ${module} ka page hai. Yahan is service ka pura content aayega.</p>
                                <p>Abhi development me hai 🚀</p>
                                <a href="/" class="back-btn">← Back to Home</a>
                            </div>
                        </div>
                    </div>
                </main>

                <footer class="footer">
                    <div class="footer-container">
                        <div class="footer-bottom">
                            <p>© 2024 SAMANLIVE. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </body>
            </html>
        `);
    });
});

// 404 Error handle
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                h1 { color: #1e40af; font-size: 72px; margin: 0; }
                p { color: #64748b; font-size: 18px; }
                a { background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Oops! Page nahi mila 😅</p>
            <a href="/">Home Pe Wapas Jao</a>
        </body>
        </html>
    `);
});

// Server start karo
app.listen(PORT, () => {
    console.log(`✅ SAMANLIVE Server chalu ho gaya: http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '../public')}`);
    console.log(`🚀 52 Modules ready hai!`);
});