let products = [];

// =============================================
// PER-CUSTOMER CART KEY
// Each customer gets their own isolated cart in
// localStorage so carts are not shared across users.
// =============================================

function getCurrentUserId() {
    const body = document.body;
    if (body && body.dataset.userId) {
        return body.dataset.userId;
    }
    return (typeof CURRENT_USER_ID !== "undefined" && CURRENT_USER_ID) ? CURRENT_USER_ID : "guest";
}

function cartStorageKey() {
    return "cart_" + getCurrentUserId();
}

let cart = JSON.parse(localStorage.getItem(cartStorageKey())) || [];

// normalize cart items to include qty
cart.forEach(function (item) {
    if (!item.qty) item.qty = 1;
});

// =============================================
// LOAD PRODUCTS
// =============================================

async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        products = await response.json();
        showAllProducts();
    } catch (error) {
        console.error("PRODUCT ERROR:", error);
    }
}

// =============================================
// SHOW ALL PRODUCTS
// =============================================

function showAllProducts() {
    document.querySelector(".products-section").style.display = "block";
    document.getElementById("cartSection").style.display = "none";
    document.getElementById("productTitle").textContent = "All Products";
    document.getElementById("productDescription").textContent = "Explore our latest collection";
    displayProducts(products);
}

// =============================================
// SHOW PRODUCTS BY GENDER
// =============================================

function showGender(gender) {
    document.querySelector(".products-section").style.display = "block";
    document.getElementById("cartSection").style.display = "none";

    const filteredProducts = products.filter(function (product) {
        return product.gender === gender;
    });

    document.getElementById("productTitle").textContent = gender + " Collection";
    document.getElementById("productDescription").textContent = "Explore our " + gender.toLowerCase() + "'s collection";
    displayProducts(filteredProducts);
}

// =============================================
// SHOW PRODUCTS BY CATEGORY
// =============================================

function showCategory(category) {
    document.querySelector(".products-section").style.display = "block";
    document.getElementById("cartSection").style.display = "none";

    const filteredProducts = products.filter(function (product) {
        return product.category === category;
    });

    let title = category;
    if (category === "T-Shirt") title = "T-Shirts";
    else if (category === "Shirt") title = "Shirts";
    else if (category === "Jeans") title = "Jeans";
    else if (category === "Dress") title = "Dresses";

    document.getElementById("productTitle").textContent = title;
    document.getElementById("productDescription").textContent = "Explore our " + title.toLowerCase() + " collection";
    displayProducts(filteredProducts);
}

// =============================================
// DISPLAY PRODUCTS
// =============================================

function displayProducts(productList) {
    const container = document.getElementById("productContainer");
    container.innerHTML = "";

    if (productList.length === 0) {
        container.innerHTML = `<div class="empty-cart">No products found.</div>`;
        return;
    }

    productList.forEach(function (product) {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-details">
                <h3>${product.name}</h3>
                <p class="category">${product.gender} / ${product.category}</p>
                <p class="product-price">₹${product.price}</p>
                <div class="add-cart-row">
                    <div class="qty-selector">
                        <button type="button" class="qty-btn" onclick="changeQty('qty-${product.id}', -1)">-</button>
                        <input type="number" id="qty-${product.id}" class="qty-input" value="1" min="1" max="${product.stock}">
                        <button type="button" class="qty-btn" onclick="changeQty('qty-${product.id}', 1)">+</button>
                    </div>
                    <button class="add-cart-button" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// =============================================
// CHANGE QUANTITY (product page selector)
// =============================================

function changeQty(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let val = parseInt(input.value) || 1;
    val += delta;

    const max = parseInt(input.max) || 99;
    if (val < 1) val = 1;
    if (val > max) val = max;

    input.value = val;
}

// =============================================
// ADD TO CART
// =============================================

function addToCart(productId) {
    const product = products.find(function (item) {
        return item.id === productId;
    });

    if (!product) return;

    const qtyInput = document.getElementById("qty-" + productId);
    let qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    if (qty < 1) qty = 1;

    if (qty > product.stock) {
        alert("Only " + product.stock + " in stock.");
        return;
    }

    // Check if product already in cart, increment quantity
    const existing = cart.find(function (item) {
        return item.id === product.id;
    });

    if (existing) {
        existing.qty += qty;
        if (existing.qty > product.stock) existing.qty = product.stock;
    } else {
        const cartItem = Object.assign({}, product);
        cartItem.qty = qty;
        cart.push(cartItem);
    }

    localStorage.setItem(cartStorageKey(), JSON.stringify(cart));
    updateCartCount();
    alert(product.name + " added to cart!");
}

// =============================================
// UPDATE CART COUNT
// =============================================

function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    if (cartCount) {
        let totalItems = 0;
        cart.forEach(function (item) {
            totalItems += item.qty || 1;
        });
        cartCount.textContent = totalItems;
    }
}

// =============================================
// UPDATE CART ITEM QUANTITY (in cart view)
// =============================================

function updateCartQty(index, delta) {
    const item = cart[index];
    if (!item) return;

    let newQty = (item.qty || 1) + delta;
    const maxQty = item.stock || 99;

    if (newQty < 1) {
        cart.splice(index, 1);
    } else {
        if (newQty > maxQty) newQty = maxQty;
        item.qty = newQty;
    }

    localStorage.setItem(cartStorageKey(), JSON.stringify(cart));
    updateCartCount();
    showCart();
}

// =============================================
// SHOW CART
// =============================================

function showCart() {
    document.querySelector(".products-section").style.display = "none";
    document.getElementById("cartSection").style.display = "block";

    const container = document.getElementById("cartContainer");
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart">Your cart is empty.</div>`;
        document.getElementById("cartTotal").innerHTML = "";
        return;
    }

    let total = 0;

    cart.forEach(function (product, index) {
        const qty = product.qty || 1;
        const lineTotal = product.price * qty;
        total += lineTotal;

        const item = document.createElement("div");
        item.className = "cart-item";

        item.innerHTML = `
            <div class="cart-item-left">
                <div class="cart-item-image">${product.image}</div>
                <div class="cart-item-info">
                    <h3>${product.name}</h3>
                    <p>${product.gender} / ${product.category}</p>
                    <p>₹${product.price} x ${qty} = <strong>₹${lineTotal.toFixed(2)}</strong></p>
                    <div class="qty-selector">
                        <button type="button" class="qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
                        <span class="qty-input qty-static">${qty}</span>
                        <button type="button" class="qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
            <div>
                <button class="remove-button" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;

        container.appendChild(item);
    });

    document.getElementById("cartTotal").innerHTML = `
        <h3>Total: ₹${total.toFixed(2)}</h3>
        <button class="buy-button" onclick="buyWholeCart()">Buy All / Checkout</button>
    `;
}

// =============================================
// REMOVE FROM CART
// =============================================

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem(cartStorageKey(), JSON.stringify(cart));
    updateCartCount();
    showCart();
}

// =============================================
// BUY WHOLE CART
// =============================================

function buyWholeCart() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    localStorage.setItem("buyProducts_" + getCurrentUserId(), JSON.stringify(cart));
    window.location.href = "/payment";
}

// =============================================
// PAGE LOAD
// =============================================

document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();

    const productContainer = document.getElementById("productContainer");
    if (productContainer) {
        loadProducts();
    }
});
