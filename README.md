# Cloth Store &bull; Frontend Web Client &amp; UI Suite

The luxury, responsive frontend user interface for **Cloth Store**, crafted with modern CSS design tokens, Google Fonts (**Plus Jakarta Sans**, **Playfair Display**, **Outfit**), real-time product discovery, slide-over bag drawer, multi-method checkout, delivery tracking, and administrative control panels.

---

## ✨ Features &amp; User Experience

- **Luxury Aesthetics &amp; Design System**:
  - Curated typography pairing: *Playfair Display* for editorial headings and *Plus Jakarta Sans* for clean UI.
  - Glassmorphic sticky navigation with backdrop blur (`backdrop-filter: blur(16px)`).
  - Floating toast notifications system replacing intrusive browser alerts.
- **Product Discovery &amp; Exploration**:
  - **Live Search**: Debounced search bar filtering across names, categories, and genders with instant clear button.
  - **Filter Pills**: 1-click filtering across Men's Wardrobe, Women's Collection, T-Shirts, Formal Shirts, Jeans, and Dresses.
  - **Sorting**: Featured, Price: Low to High, Price: High to Low, and Alphabetical.
  - **Product Cards**: 4:5 fashion aspect ratio, hover image zoom, status badges (*Bestseller*, *Trending*, *Low Stock*), star ratings, size selector pills (S, M, L, XL), and quantity steppers.
- **Interactive Modals &amp; Bag Drawer**:
  - **Quick View Modal**: In-depth garment inspection with dynamic price total and size selection without page reloads.
  - **Slide-Out Cart Drawer**: Live **Free Shipping Progress Tracker**, promo code support (`LUXE10`, `STYLE20`), item removal, and synchronized storage.
- **Checkout &amp; Order Fulfillment**:
  - Multi-step checkout with address pre-filling from database profile.
  - 4 interactive payment methods: **UPI / QR** (with mock scanner), **Credit &amp; Debit Cards** (with auto-spacing card number formatter), **Net Banking**, and **Cash on Delivery**.
  - **Order Tracking &amp; Timeline**: Visual 4-step progress tracker (`Confirmed` &rarr; `Packaging` &rarr; `Dispatched` &rarr; `Delivered`), order filtering, tax invoice printing, and cancellation support.
- **Customer &amp; Admin Portals**:
  - Split-screen editorial authentication for customer login, registration, and 3-step OTP password recovery.
  - Executive dark-mode SaaS administration console with KPI metrics and inventory tables.

---

## 📁 Directory Structure

```
clothingstore_frontend/
└── frontend/
    ├── static/
    │   ├── home.css               # Design system, luxury store layout, drawer & modal styles
    │   ├── homejavascript.js      # Storefront search, filter, quickview, and cart logic
    │   ├── style.css              # Auth split-screen, checkout, and admin dashboard styling
    │   ├── javascript.js          # Auth submission, checkout multi-tab payment & OTP handling
    │   ├── logo.png               # Brand icon & favicon
    │   └── Background.jpg         # Hero visual asset
    └── templates/
        ├── home.html              # Storefront catalog, hero banner, quickview & cart drawer
        ├── login.html             # Customer login with demo credentials helper
        ├── create.html            # Customer registration with delivery address
        ├── payment.html           # Multi-method checkout and order review
        ├── myorders.html          # Order history, timeline tracker, and receipt printing
        ├── Forgetpass.html        # Step 1: Password recovery request
        ├── verification.html      # Step 2: 6-digit OTP verification
        ├── confirm.html           # Step 3: New password setup
        ├── adminlogin.html        # Privileged staff / administrator login
        └── admindashboard.html    # Executive SaaS operations console
```

---

## 🚀 Running the Store

The frontend is dynamically served by the Flask server in `clothingstore_backend`.

To launch both backend and frontend together:
```powershell
.\start_store.ps1
```
Or start via Python:
```bash
python clothingstore_backend/backend/app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in any modern web browser.