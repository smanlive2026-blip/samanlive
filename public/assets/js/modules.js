<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAMANLIVE - All Services One App</title>
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- HEADER - Amazon jaisa -->
    <header class="header">
        <div class="logo"><i class="fa-solid fa-layer-group"></i> SAMANLIVE</div>
        <div class="search-bar">
            <input type="text" placeholder="Search Services...">
            <button><i class="fa fa-search"></i></button>
        </div>
        <div class="header-icons">
            <i class="fa fa-bell"></i>
            <i class="fa fa-user"></i>
            <i class="fa fa-shopping-cart"></i>
        </div>
    </header>

    <!-- NAV - Bajaj jaisa -->
    <nav class="main-nav">
        <a href="#" class="active"><i class="fa fa-home"></i> Home</a>
        <a href="#"><i class="fa fa-compass"></i> Explore</a>
        <a href="#"><i class="fa fa-th"></i> Services</a>
        <a href="#"><i class="fa fa-tag"></i> Offers</a>
        <a href="#"><i class="fa fa-shopping-cart"></i> My Cart</a>
    </nav>

    <!-- DYNAMIC AD BANNER - 50 ads ghumenge -->
    <section class="ad-slider">
        <div class="slide active">
            <img src="assets/img/banners/mega-sale.jpg" alt="Mega Sale 50% Off">
            <button>Shop Now</button>
        </div>
        <div class="slide">
            <img src="assets/img/banners/new-arrivals.jpg" alt="New Arrivals">
            <button>Shop Now</button>
        </div>
        <div class="slide">
            <img src="assets/img/banners/travel-deals.jpg" alt="Travel Deals">
            <button>Shop Now</button>
        </div>
        <div class="dots"></div>
    </section>

    <!-- WELCOME BANNER -->
    <section class="welcome-banner">
        <h2>WELCOME! Discover Our Services</h2>
        <button>Learn Now</button>
    </section>

    <!-- 52 MODULES GRID - Har ek badi website -->
    <section class="modules-grid">
        <h3>All Services</h3>
        <div class="grid-container">
            <!-- JS se 52 modules yaha load honge -->
        </div>
    </section>

    <!-- BOTTOM ADS -->
    <section class="bottom-ads">
        <img src="assets/img/banners/style-guide.jpg" alt="Style Guide">
        <img src="assets/img/banners/grocery-hub.jpg" alt="Grocery Hub">
    </section>

    <!-- FOOTER - Policy sab -->
    <footer>
        <div class="footer-links">
            <div>
                <h4>Company</h4>
                <a href="#">About Us</a>
                <a href="#">Careers</a>
            </div>
            <div>
                <h4>Help</h4>
                <a href="#">Help Center</a>
                <a href="#">Contact Us</a>
            </div>
            <div>
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
            </div>
        </div>
        <div class="copyright">
            © 2024 SAMANLIVE. All rights reserved.
        </div>
    </footer>

    <script src="assets/js/app.js"></script>
    <script src="assets/js/modules.js"></script>
</body>
</html>