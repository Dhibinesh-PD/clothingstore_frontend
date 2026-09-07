// =============================================================
// TOAST HELPER
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
// PASSWORD VISIBILITY TOGGLE
// =============================================================

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "Show";
        }
    });
}

// =============================================================
// LOGIN FORM
// =============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const passwordValue = document.getElementById("password").value;
        const message = document.getElementById("message");
        const submitBtn = loginForm.querySelector("button[type='submit']");

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Signing In...";
        }

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: passwordValue })
            });

            const result = await response.json();

            if (result.success) {
                if (message) message.textContent = "";
                showToast("Welcome back! Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = result.redirect || "/home";
                }, 600);
            } else {
                if (message) message.textContent = result.message;
                showToast(result.message, "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Sign In";
                }
            }
        } catch (error) {
            console.error(error);
            if (message) message.textContent = "Unable to connect to server.";
            showToast("Server connection error.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Sign In";
            }
        }
    });
}

// Demo quick-fill credentials helper
function fillDemoUser() {
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    if (emailEl && passEl) {
        emailEl.value = "david@example.com";
        passEl.value = "password123";
        showToast("Demo customer credentials loaded!", "info");
    }
}

// =============================================================
// CREATE ACCOUNT FORM
// =============================================================

const createForm = document.getElementById("createForm");

if (createForm) {
    createForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const pincode = document.getElementById("pincode").value.trim();
        const address = document.getElementById("address").value.trim();
        const passwordValue = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("message");

        if (passwordValue !== confirmPassword) {
            if (message) message.textContent = "Passwords do not match.";
            showToast("Passwords do not match!", "error");
            return;
        }

        const submitBtn = createForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating Account...";
        }

        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    pincode: pincode,
                    address: address,
                    password: passwordValue
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast("Account created successfully! Redirecting to login...", "success");
                createForm.reset();
                setTimeout(() => {
                    window.location.href = "/";
                }, 1200);
            } else {
                if (message) message.textContent = result.message;
                showToast(result.message, "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Create Account";
                }
            }
        } catch (error) {
            console.error(error);
            if (message) message.textContent = "Unable to connect to server.";
            showToast("Server connection error.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Create Account";
            }
        }
    });
}

// =============================================================
// CHECKOUT & PAYMENT PAGE
// =============================================================

let activePaymentTab = 'upi';

function switchPayTab(tabName, element) {
    activePaymentTab = tabName;

    // Toggle button active classes
    const buttons = document.querySelectorAll(".pay-tab");
    buttons.forEach(btn => btn.classList.remove("active"));
    if (element) element.classList.add("active");

    // Toggle content visibility
    const panels = {
        'upi': 'tabContentUpi',
        'card': 'tabContentCard',
        'netbanking': 'tabContentNetbanking',
        'cod': 'tabContentCod'
    };

    Object.keys(panels).forEach(key => {
        const el = document.getElementById(panels[key]);
        if (el) {
            el.style.display = (key === tabName) ? "block" : "none";
        }
    });
}

// Auto-format card number input with spacing every 4 digits
const cardInput = document.getElementById("cardNumberInput");
if (cardInput) {
    cardInput.addEventListener("input", function (e) {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        e.target.value = formatted;
    });
}

const paymentForm = document.getElementById("paymentForm");

if (paymentForm) {
    // 1. Resolve cart products from all possible storage keys
    const bodyUserId = document.body.dataset.userId;
    const userCartKey = bodyUserId ? `buyProducts_${bodyUserId}` : null;
    const rawData = localStorage.getItem("buyProducts") || (userCartKey ? localStorage.getItem(userCartKey) : null) || localStorage.getItem("cart");

    let buyProducts = [];
    try {
        buyProducts = JSON.parse(rawData) || [];
    } catch (e) {
        buyProducts = [];
    }

    const discountPct = parseFloat(localStorage.getItem("appliedDiscountPercent") || "0");

    // 2. Pre-fill customer address from database profile
    fetch("/api/profile")
        .then(resp => resp.json())
        .then(data => {
            if (data.success && data.profile) {
                const p = data.profile;
                if (document.getElementById("custName") && p.name) document.getElementById("custName").value = p.name;
                if (document.getElementById("phone") && p.phone) document.getElementById("phone").value = p.phone;
                if (document.getElementById("pincode") && p.pincode) document.getElementById("pincode").value = p.pincode;
                if (document.getElementById("address") && p.address) document.getElementById("address").value = p.address;
            }
        })
        .catch(err => console.warn("Profile pre-fill error:", err));

    // 3. Render Order Summary
    const orderDetailsEl = document.getElementById("orderDetails");
    const countDisplay = document.getElementById("orderItemsCount");
    const billSubtotal = document.getElementById("billSubtotal");
    const billDiscountRow = document.getElementById("billDiscountRow");
    const billDiscount = document.getElementById("billDiscount");
    const billGrandTotal = document.getElementById("billGrandTotal");

    if (buyProducts.length === 0) {
        if (orderDetailsEl) {
            orderDetailsEl.innerHTML = `
                <div style="text-align:center; padding: 30px 10px; color: #64748b;">
                    <p style="margin: 0 0 12px;">No products selected for checkout.</p>
                    <a href="/home" class="hero-btn-primary" style="display:inline-block; text-decoration:none; padding: 10px 22px; font-size: 13.5px;">Return to Shop</a>
                </div>
            `;
        }
        if (countDisplay) countDisplay.textContent = "0 items";
    } else {
        let subtotal = 0;
        let totalQuantity = 0;
        let html = "";

        buyProducts.forEach(item => {
            const qty = item.qty || 1;
            const lineTotal = item.price * qty;
            subtotal += lineTotal;
            totalQuantity += qty;

            const isUrl = item.image && (item.image.startsWith("http") || item.image.startsWith("/"));
            const imgHtml = isUrl
                ? `<img class="checkout-thumb" src="${item.image}" alt="${item.name}">`
                : `<div class="checkout-thumb" style="display:flex;align-items:center;justify-content:center;font-size:24px;">${item.image}</div>`;

            html += `
                <div class="checkout-item-row">
                    ${imgHtml}
                    <div class="checkout-item-meta">
                        <div class="item-name">${item.name}</div>
                        <div class="item-sub">Size: <strong>${item.size || 'M'}</strong> &bull; Qty: ${qty}</div>
                        <div class="item-price">₹${lineTotal.toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        if (orderDetailsEl) orderDetailsEl.innerHTML = html;
        if (countDisplay) countDisplay.textContent = `${totalQuantity} item${totalQuantity > 1 ? 's' : ''} in bag`;

        const discountAmount = subtotal * (discountPct / 100);
        const grandTotal = subtotal - discountAmount;

        if (billSubtotal) billSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
        if (billGrandTotal) billGrandTotal.textContent = `₹${grandTotal.toFixed(2)}`;

        if (billDiscountRow && billDiscount && discountPct > 0) {
            billDiscountRow.style.display = "flex";
            billDiscount.textContent = `-₹${discountAmount.toFixed(2)}`;
        }
    }

    // 4. Handle Payment Submission
    paymentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const custName = document.getElementById("custName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const pincode = document.getElementById("pincode").value.trim();
        const address = document.getElementById("address").value.trim();
        const feedback = document.getElementById("paymentMessage");
        const submitBtn = document.getElementById("completePaymentBtn");

        if (buyProducts.length === 0) {
            showToast("Your shopping bag is empty.", "error");
            return;
        }

        if (!custName || !phone || !pincode || !address) {
            showToast("Please fill in all delivery address details.", "error");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                Processing Payment...
            `;
        }

        try {
            const response = await fetch("/buy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    products: buyProducts,
                    name: custName,
                    phone: phone,
                    pincode: pincode,
                    address: address,
                    payment_method: activePaymentTab.toUpperCase()
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast("Payment Authorized! Order confirmed successfully.", "success");

                // Clear carts and stored state
                localStorage.removeItem("buyProducts");
                localStorage.removeItem("appliedDiscountPercent");
                if (bodyUserId) {
                    localStorage.removeItem("cart_" + bodyUserId);
                    localStorage.removeItem("buyProducts_" + bodyUserId);
                }
                localStorage.removeItem("cart");

                if (submitBtn) {
                    submitBtn.textContent = "✓ Order Placed!";
                    submitBtn.style.background = "#10b981";
                }

                // Redirect to Orders
                setTimeout(() => {
                    window.location.href = "/my-orders?success=1";
                }, 1000);
            } else {
                if (feedback) feedback.textContent = result.message;
                showToast(result.message, "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>Authorize & Place Order</span>`;
                }
            }
        } catch (error) {
            console.error(error);
            showToast("Order transaction error. Please try again.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>Authorize & Place Order</span>`;
            }
        }
    });
}

// =============================================================
// FORGOT PASSWORD FLOW (3-STEP RECOVERY)
// =============================================================

// Step 1: Request OTP
const forgotPassForm = document.getElementById("forgotPassForm");
if (forgotPassForm) {
    forgotPassForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = document.getElementById("recoverEmail").value.trim();
        const msg = document.getElementById("recoverMsg");
        const btn = forgotPassForm.querySelector("button[type='submit']");

        if (btn) btn.disabled = true;

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email })
            });
            const result = await response.json();

            if (result.success) {
                sessionStorage.setItem("recovery_email", result.email);
                showToast(`Code sent! Demo Code: ${result.demo_otp}`, "info");
                setTimeout(() => {
                    window.location.href = "/verify-otp";
                }, 1500);
            } else {
                if (msg) msg.textContent = result.message;
                showToast(result.message, "error");
                if (btn) btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            showToast("Server communication error.", "error");
            if (btn) btn.disabled = false;
        }
    });
}

// Step 2: Verify OTP
const verifyOtpForm = document.getElementById("verifyOtpForm");
if (verifyOtpForm) {
    const storedEmail = sessionStorage.getItem("recovery_email") || "";
    const emailBadge = document.getElementById("verifyEmailBadge");
    if (emailBadge && storedEmail) emailBadge.textContent = storedEmail;

    verifyOtpForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const otp = document.getElementById("otpCode").value.trim();
        const msg = document.getElementById("otpMsg");
        const btn = verifyOtpForm.querySelector("button[type='submit']");

        if (btn) btn.disabled = true;

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: storedEmail, otp: otp })
            });
            const result = await response.json();

            if (result.success) {
                showToast("Code verified! Set your new password.", "success");
                setTimeout(() => {
                    window.location.href = "/reset-password";
                }, 800);
            } else {
                if (msg) msg.textContent = result.message;
                showToast(result.message, "error");
                if (btn) btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            showToast("Verification failed.", "error");
            if (btn) btn.disabled = false;
        }
    });
}

// Step 3: Reset Password
const resetPassForm = document.getElementById("resetPassForm");
if (resetPassForm) {
    const storedEmail = sessionStorage.getItem("recovery_email") || "";

    resetPassForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const newPass = document.getElementById("newPassword").value;
        const confirmPass = document.getElementById("confirmNewPassword").value;
        const msg = document.getElementById("resetMsg");

        if (newPass !== confirmPass) {
            if (msg) msg.textContent = "Passwords do not match.";
            showToast("Passwords do not match.", "error");
            return;
        }

        const btn = resetPassForm.querySelector("button[type='submit']");
        if (btn) btn.disabled = true;

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: storedEmail, password: newPass })
            });
            const result = await response.json();

            if (result.success) {
                sessionStorage.removeItem("recovery_email");
                showToast("Password updated! Redirecting to login...", "success");
                setTimeout(() => {
                    window.location.href = "/";
                }, 1000);
            } else {
                if (msg) msg.textContent = result.message;
                showToast(result.message, "error");
                if (btn) btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            showToast("Reset failed.", "error");
            if (btn) btn.disabled = false;
        }
    });
}
