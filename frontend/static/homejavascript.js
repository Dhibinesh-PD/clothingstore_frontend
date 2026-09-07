let allProducts = [];
let displayedProducts = [];
let currentGender = 'all';
let currentCategory = 'all';
let searchKeyword = '';
let currentSort = 'default';
let appliedDiscountPercent = 0;
let searchDebounceTimer = null;
let activeQvProduct = null;
let activeQvSize = 'M';
let activeQvQty = 1;

// =============================================================
// STORAGE & USER ISOLATION
// =============================================================

function getCurrentUserId() {
    const body = document.body;
    if (body && body.dataset.userId && body.dataset.userId !== "None") {
        return body.dataset.userId;
    }
    return "guest";
}

function cartStorageKey() {
    return "cart_" + getCurrentUserId();
}

function loadCartFromStorage() {
    try {
        const data = localStorage.getItem(cartStorageKey()) || localStorage.getItem("cart");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            parsed.forEach(function (item) {
                if (!item.qty) item.qty = 1;
                if (!item.size) item.size = "M";
            });
            return parsed;
        }
    } catch (e) {
        console.warn("Error parsing cart storage:", e);
    }
    return [];
}

let cart = loadCartFromStorage();

function saveCartToStorage() {
    const json = JSON.stringify(cart);
    localStorage.setItem(cartStorageKey(), json);
    localStorage.setItem("cart", json); // backward compatibility
    updateCartBadge();
    renderCartDrawerItems();
}

// =============================================================
// TOAST NOTIFICATIONS (Replaces browser alert popups)
// =============================================================

function showToast(message, type = 'success') {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item ${type}`;

    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `
        <span style="font-size: 16px; font-weight: 800;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// =============================================================
// API DATA FETCHING
// =============================================================

async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        allProducts = await response.json();
        applyFiltersAndRender();
    } catch (error) {
        console.error("PRODUCT FETCH ERROR:", error);
        showToast("Unable to fetch catalog. Please check connection.", "error");
    }
}

// =============================================================
// FILTER & SEARCH LOGIC
// =============================================================

function handleSearchInput(value) {
    clearTimeout(searchDebounceTimer);
    const clearBtn = document.getElementById("searchClearBtn");
    if (clearBtn) {
        clearBtn.style.display = value.trim().length > 0 ? "block" : "none";
    }

    searchDebounceTimer = setTimeout(() => {
        searchKeyword = value.trim().toLowerCase();
        applyFiltersAndRender();
    }, 180);
}

function clearSearch() {
    const input = document.getElementById("catalogSearchInput");
    if (input) input.value = "";
    const clearBtn = document.getElementById("searchClearBtn");
    if (clearBtn) clearBtn.style.display = "none";
    searchKeyword = "";
    applyFiltersAndRender();
}

function filterByPreset(preset) {
    if (preset === 'all') {
        currentGender = 'all';
        currentCategory = 'all';
        document.getElementById("productTitle").textContent = "All Apparel & Collections";
        document.getElementById("productDescription").textContent = "Showing curated garments ready for doorstep dispatch";
    } else {
        currentGender = preset;
        currentCategory = 'all';
        document.getElementById("productTitle").textContent = preset + "'s Wardrobe";
        document.getElementById("productDescription").textContent = "Curated luxury styles tailored for " + preset.toLowerCase();
    }
    updateActivePills();
    applyFiltersAndRender();
}

function filterByCategory(category) {
    currentCategory = category;
    document.getElementById("productTitle").textContent = category + " Collection";
    document.getElementById("productDescription").textContent = "Explore our signature " + category.toLowerCase() + " line";
    updateActivePills();
    applyFiltersAndRender();
}

function showAllProducts() {
    filterByPreset('all');
    window.scrollTo({ top: 400, behavior: 'smooth' });
}

function showGender(gender) {
    filterByPreset(gender);
    window.scrollTo({ top: 400, behavior: 'smooth' });
}

function handleSortChange(sortValue) {
    currentSort = sortValue;
    applyFiltersAndRender();
}

function updateActivePills() {
    const pills = document.querySelectorAll(".filter-pill");
    pills.forEach(p => p.classList.remove("active"));

    if (currentGender === 'all' && currentCategory === 'all') {
        const el = document.getElementById("pillAll");
        if (el) el.classList.add("active");
    } else if (currentCategory !== 'all') {
        const catMap = {
            'T-Shirt': 'pillTShirt',
            'Shirt': 'pillShirt',
            'Jeans': 'pillJeans',
            'Dress': 'pillDress',
        };
        const el = document.getElementById(catMap[currentCategory]);
        if (el) el.classList.add("active");
    } else if (currentGender === 'Men') {
        const el = document.getElementById("pillMen");
        if (el) el.classList.add("active");
    } else if (currentGender === 'Women') {
        const el = document.getElementById("pillWomen");
        if (el) el.classList.add("active");
    }
}

function applyFiltersAndRender() {
    displayedProducts = allProducts.filter(item => {
        if (currentGender !== 'all' && item.gender !== currentGender) {
            return false;
        }
        if (currentCategory !== 'all' && item.category !== currentCategory) {
            return false;
        }
        if (searchKeyword) {
            const haystack = `${item.name} ${item.gender} ${item.category}`.toLowerCase();
            if (!haystack.includes(searchKeyword)) {
                return false;
            }
        }
        return true;
    });

    // Sorting
    if (currentSort === "price_asc") {
        displayedProducts.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price_desc") {
        displayedProducts.sort((a, b) => b.price - a.price);
    } else if (currentSort === "name_asc") {
        displayedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        displayedProducts.sort((a, b) => a.id - b.id);
    }

    const countDisplay = document.getElementById("catalogCountDisplay");
    if (countDisplay) {
        countDisplay.textContent = `${displayedProducts.length} items`;
    }

    renderProductGrid(displayedProducts);
}

// =============================================================
// PRODUCT GRID RENDERING
// =============================================================

function renderProductGrid(products) {
    const container = document.getElementById("productContainer");
    if (!container) return;
    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-catalog">
                <div class="empty-icon">🔍</div>
                <h3>No Matching Items Found</h3>
                <p>We couldn't find any clothing items matching your current filters.</p>
                <button type="button" class="hero-btn-primary" onclick="clearSearch(); filterByPreset('all');">Reset Filters</button>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.id = `prod-card-${product.id}`;

        const badgeClass = {
            "Bestseller": "badge-bestseller",
            "Trending": "badge-trending",
            "Low Stock": "badge-low-stock",
            "New Season": "badge-new-season",
        }[product.badge] || "badge-new-season";

        // Image formatting: Handle HD image URL or fallback
        const isUrl = product.image && (product.image.startsWith("http") || product.image.startsWith("/"));
        const imgHtml = isUrl
            ? `<img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">`
            : `<div class="product-image" style="display:flex;align-items:center;justify-content:center;font-size:72px;">${product.image}</div>`;

        card.innerHTML = `
            <div class="product-image-container">
                <span class="badge-tag ${badgeClass}">${product.badge || 'Premium'}</span>
                ${imgHtml}
                <button type="button" class="quick-view-btn" onclick="openQuickView(${product.id})">
                    Quick View
                </button>
            </div>
            <div class="product-details">
                <div class="category-meta-row">
                    <span class="category-label">${product.gender} &bull; ${product.category}</span>
                    <span class="rating-box">★ ${product.rating || '4.8'} <span class="rating-reviews">(${product.reviews_count || '84'})</span></span>
                </div>
                <h3 class="product-title" title="${product.name}">${product.name}</h3>
                <div class="price-row">
                    <span class="current-price">₹${product.price.toFixed(2)}</span>
                    <span class="original-price">₹${product.original_price ? product.original_price.toFixed(2) : (product.price * 1.4).toFixed(2)}</span>
                    <span class="discount-percent">30% OFF</span>
                </div>

                <div class="size-selector-row" id="sizes-row-${product.id}">
                    <div class="size-pill" onclick="selectCardSize(${product.id}, 'S', this)">S</div>
                    <div class="size-pill active" onclick="selectCardSize(${product.id}, 'M', this)">M</div>
                    <div class="size-pill" onclick="selectCardSize(${product.id}, 'L', this)">L</div>
                    <div class="size-pill" onclick="selectCardSize(${product.id}, 'XL', this)">XL</div>
                </div>

                <div class="card-actions-row">
                    <div class="qty-stepper">
                        <button type="button" class="qty-btn" onclick="adjustCardQty(${product.id}, -1)">-</button>
                        <span id="card-qty-${product.id}" class="qty-val-display">1</span>
                        <button type="button" class="qty-btn" onclick="adjustCardQty(${product.id}, 1)">+</button>
                    </div>
                    <button type="button" class="add-cart-btn" onclick="addProductToCart(${product.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        Add to Bag
                    </button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// Card Quantity & Size
const cardSelectedSizes = {};
function selectCardSize(productId, size, element) {
    cardSelectedSizes[productId] = size;
    const parent = element.parentElement;
    if (parent) {
        parent.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
        element.classList.add("active");
    }
}

function adjustCardQty(productId, delta) {
    const el = document.getElementById(`card-qty-${productId}`);
    if (!el) return;
    let qty = parseInt(el.textContent) || 1;
    qty += delta;
    if (qty < 1) qty = 1;
    if (qty > 10) qty = 10;
    el.textContent = qty;
}

// Add to Cart from Card
function addProductToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const qtyEl = document.getElementById(`card-qty-${productId}`);
    const qty = qtyEl ? (parseInt(qtyEl.textContent) || 1) : 1;
    const size = cardSelectedSizes[productId] || "M";

    const existing = cart.find(item => item.id === product.id && item.size === size);
    if (existing) {
        existing.qty += qty;
        if (existing.qty > product.stock) existing.qty = product.stock;
    } else {
        const item = Object.assign({}, product, { qty: qty, size: size });
        cart.push(item);
    }

    saveCartToStorage();
    showToast(`Added ${qty}x ${product.name} (${size}) to your bag!`, "success");
    openCartDrawer();
}

// =============================================================
// QUICK VIEW MODAL
// =============================================================

function openQuickView(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    activeQvProduct = product;
    activeQvSize = "M";
    activeQvQty = 1;

    document.getElementById("qvName").textContent = product.name;
    document.getElementById("qvCategory").textContent = `${product.gender} • ${product.category}`;
    document.getElementById("qvRating").textContent = `★ ${product.rating || '4.8'}`;
    document.getElementById("qvPrice").textContent = `₹${product.price.toFixed(2)}`;
    document.getElementById("qvOrigPrice").textContent = `₹${(product.original_price || product.price * 1.4).toFixed(2)}`;
    document.getElementById("qvBtnTotal").textContent = `₹${product.price.toFixed(2)}`;
    document.getElementById("qvQtyDisplay").textContent = "1";

    const qvImg = document.getElementById("qvImage");
    if (product.image && (product.image.startsWith("http") || product.image.startsWith("/"))) {
        qvImg.src = product.image;
        qvImg.style.display = "block";
    } else {
        qvImg.src = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
    }

    // Reset size pills in QV
    const qvSizes = document.getElementById("qvSizes");
    if (qvSizes) {
        qvSizes.querySelectorAll(".size-pill").forEach((p, idx) => {
            p.classList.toggle("active", idx === 1); // default M
        });
    }

    document.getElementById("quickViewModal").style.display = "flex";
}

function closeQuickView() {
    document.getElementById("quickViewModal").style.display = "none";
}

function handleModalBackdropClick(event) {
    if (event.target.id === "quickViewModal") {
        closeQuickView();
    }
}

function selectQvSize(element, size) {
    activeQvSize = size;
    const parent = element.parentElement;
    if (parent) {
        parent.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
        element.classList.add("active");
    }
}

function changeQvQty(delta) {
    if (!activeQvProduct) return;
    activeQvQty += delta;
    if (activeQvQty < 1) activeQvQty = 1;
    if (activeQvQty > 10) activeQvQty = 10;

    document.getElementById("qvQtyDisplay").textContent = activeQvQty;
    const total = activeQvProduct.price * activeQvQty;
    document.getElementById("qvBtnTotal").textContent = `₹${total.toFixed(2)}`;
}

function addQvToCart() {
    if (!activeQvProduct) return;

    const existing = cart.find(item => item.id === activeQvProduct.id && item.size === activeQvSize);
    if (existing) {
        existing.qty += activeQvQty;
        if (existing.qty > activeQvProduct.stock) existing.qty = activeQvProduct.stock;
    } else {
        const item = Object.assign({}, activeQvProduct, { qty: activeQvQty, size: activeQvSize });
        cart.push(item);
    }

    saveCartToStorage();
    closeQuickView();
    showToast(`Added ${activeQvQty}x ${activeQvProduct.name} (${activeQvSize}) to your bag!`, "success");
    openCartDrawer();
}

// =============================================================
// SLIDE-OVER CART DRAWER
// =============================================================

function openCartDrawer() {
    const overlay = document.getElementById("cartDrawerOverlay");
    if (overlay) {
        overlay.classList.add("open");
        renderCartDrawerItems();
    }
}

function closeCartDrawer() {
    const overlay = document.getElementById("cartDrawerOverlay");
    if (overlay) {
        overlay.classList.remove("open");
    }
}

function handleDrawerBackdropClick(event) {
    if (event.target.id === "cartDrawerOverlay") {
        closeCartDrawer();
    }
}

function updateCartBadge() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;
    let totalItems = 0;
    cart.forEach(item => {
        totalItems += item.qty || 1;
    });
    badge.textContent = totalItems;
}

function renderCartDrawerItems() {
    const container = document.getElementById("cartItemsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: #64748b;">
                <div style="font-size: 40px; margin-bottom: 12px;">🛍️</div>
                <h4 style="color: #0f172a; margin: 0 0 6px;">Your bag is currently empty</h4>
                <p style="font-size: 13.5px; margin: 0 0 18px;">Discover our collection and elevate your wardrobe.</p>
                <button type="button" class="hero-btn-primary" onclick="closeCartDrawer(); showAllProducts();">
                    Explore Collection
                </button>
            </div>
        `;
        updateDrawerFinancials(0);
        return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
        const qty = item.qty || 1;
        const lineTotal = item.price * qty;
        subtotal += lineTotal;

        const isUrl = item.image && (item.image.startsWith("http") || item.image.startsWith("/"));
        const imgTag = isUrl
            ? `<img class="drawer-item-thumb" src="${item.image}" alt="${item.name}">`
            : `<div class="drawer-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:32px;">${item.image}</div>`;

        const row = document.createElement("div");
        row.className = "drawer-cart-item";
        row.innerHTML = `
            ${imgTag}
            <div class="drawer-item-info">
                <h4 class="drawer-item-title">${item.name}</h4>
                <div class="drawer-item-meta">Size: <strong>${item.size || 'M'}</strong> &bull; ₹${item.price} each</div>
                <div class="drawer-item-pricing">₹${lineTotal.toFixed(2)}</div>
                <div class="drawer-item-actions">
                    <div class="qty-stepper" style="height: 32px;">
                        <button type="button" class="qty-btn" style="width: 24px;" onclick="updateDrawerItemQty(${index}, -1)">-</button>
                        <span class="qty-val-display" style="width: 24px; font-size: 12.5px;">${qty}</span>
                        <button type="button" class="qty-btn" style="width: 24px;" onclick="updateDrawerItemQty(${index}, 1)">+</button>
                    </div>
                    <button type="button" class="drawer-item-remove" onclick="removeDrawerItem(${index})">Remove</button>
                </div>
            </div>
        `;
        container.appendChild(row);
    });

    updateDrawerFinancials(subtotal);
}

function updateDrawerItemQty(index, delta) {
    const item = cart[index];
    if (!item) return;

    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) {
        cart.splice(index, 1);
        showToast("Item removed from bag", "info");
    } else {
        const max = item.stock || 99;
        if (item.qty > max) item.qty = max;
    }
    saveCartToStorage();
}

function removeDrawerItem(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCartToStorage();
    if (item) {
        showToast(`Removed ${item.name} from bag`, "info");
    }
}

function updateDrawerFinancials(subtotal) {
    const subtotalEl = document.getElementById("drawerSubtotal");
    const totalEl = document.getElementById("drawerTotal");
    const trackerText = document.getElementById("shippingTrackerText");
    const trackerBar = document.getElementById("shippingProgressBar");
    const discountRow = document.getElementById("drawerDiscountRow");
    const discountEl = document.getElementById("drawerDiscount");

    if (!subtotalEl || !totalEl) return;

    const discountAmount = subtotal * (appliedDiscountPercent / 100);
    const finalSubtotal = subtotal - discountAmount;
    const isFreeShipping = subtotal >= 999;
    const shipping = isFreeShipping || subtotal === 0 ? 0 : 99;
    const grandTotal = finalSubtotal + shipping;

    subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    totalEl.textContent = `₹${grandTotal.toFixed(2)}`;

    if (discountRow && discountEl) {
        if (appliedDiscountPercent > 0) {
            discountRow.style.display = "flex";
            discountEl.textContent = `-₹${discountAmount.toFixed(2)}`;
        } else {
            discountRow.style.display = "none";
        }
    }

    // Shipping tracker progress
    if (trackerText && trackerBar) {
        if (subtotal >= 999) {
            trackerText.innerHTML = "🎉 <strong>Congratulations!</strong> You qualify for FREE Express Shipping!";
            trackerBar.style.width = "100%";
        } else {
            const gap = 999 - subtotal;
            const pct = Math.min(100, Math.round((subtotal / 999) * 100));
            trackerText.innerHTML = `Add <strong>₹${gap.toFixed(2)}</strong> more to get <strong>FREE Express Shipping</strong>`;
            trackerBar.style.width = `${pct}%`;
        }
    }
}

function applyPromoCode() {
    const input = document.getElementById("promoInput");
    if (!input) return;
    const code = input.value.trim().toUpperCase();

    if (code === "LUXE10" || code === "STYLE10" || code === "WELCOME10") {
        appliedDiscountPercent = 10;
        document.getElementById("discountPercentText").textContent = "10%";
        showToast("Promo applied! 10% discount added to your bag.", "success");
    } else if (code === "STYLE20" || code === "VIP20") {
        appliedDiscountPercent = 20;
        document.getElementById("discountPercentText").textContent = "20%";
        showToast("VIP Promo applied! 20% discount granted!", "success");
    } else {
        showToast("Invalid promo code. Try LUXE10 or STYLE20", "error");
        return;
    }
    renderCartDrawerItems();
}

// =============================================================
// PROCEED TO CHECKOUT (Robust synchronization)
// =============================================================

function proceedToCheckout() {
    if (cart.length === 0) {
        showToast("Your shopping bag is empty.", "error");
        return;
    }

    const payload = JSON.stringify(cart);
    // Write to BOTH storage keys so payment.html works flawlessly!
    localStorage.setItem("buyProducts", payload);
    localStorage.setItem("buyProducts_" + getCurrentUserId(), payload);
    localStorage.setItem("appliedDiscountPercent", appliedDiscountPercent.toString());

    window.location.href = "/payment";
}

// =============================================================
// INITIALIZATION
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();
    loadProducts();
});
