// =============================================
// PASSWORD TOGGLE
// =============================================

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

if (togglePassword && password) {
    togglePassword.addEventListener("click", function () {
        if (password.type === "password") {
            password.type = "text";
            togglePassword.textContent = "Hide";
        } else {
            password.type = "password";
            togglePassword.textContent = "Show";
        }
    });
}

// =============================================
// LOGIN FORM
// =============================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const passwordValue = document.getElementById("password").value;
        const message = document.getElementById("message");

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: passwordValue })
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = result.redirect;
            } else {
                message.textContent = result.message;
            }
        } catch (error) {
            console.error(error);
            message.textContent = "Unable to connect to server.";
        }
    });
}

// =============================================
// CREATE ACCOUNT FORM
// =============================================

const createForm = document.getElementById("createForm");

if (createForm) {
    createForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const pincode = document.getElementById("pincode").value;
        const address = document.getElementById("address").value;
        const passwordValue = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("message");

        if (passwordValue !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
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

            message.textContent = result.message;

            if (result.success) {
                createForm.reset();
            }
        } catch (error) {
            console.error(error);
            message.textContent = "Unable to connect to server.";
        }
    });
}

// =============================================
// PAYMENT PAGE
// =============================================

const paymentForm = document.getElementById("paymentForm");
const orderDetails = document.getElementById("orderDetails");

if (paymentForm) {
    const userId = (document.body && document.body.dataset.userId) ? document.body.dataset.userId : "guest";
    const buyProducts = JSON.parse(localStorage.getItem("buyProducts_" + userId)) || [];

    // Fetch the logged-in customer's saved profile and pre-fill the form
    fetch("/api/profile")
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            if (data.success && data.profile) {
                const p = data.profile;
                if (document.getElementById("custName") && p.name) {
                    document.getElementById("custName").value = p.name;
                }
                if (document.getElementById("phone") && p.phone) {
                    document.getElementById("phone").value = p.phone;
                }
                if (document.getElementById("pincode") && p.pincode) {
                    document.getElementById("pincode").value = p.pincode;
                }
                if (document.getElementById("address") && p.address) {
                    document.getElementById("address").value = p.address;
                }
            }
        })
        .catch(function (err) {
            console.error("PROFILE PREFILL ERROR:", err);
        });

    if (buyProducts.length === 0) {
        orderDetails.innerHTML = "<p>No products selected.</p>";
    } else {
        let total = 0;
        let orderHTML = "";

        buyProducts.forEach(function (product) {
            const qty = product.qty || 1;
            const lineTotal = product.price * qty;
            total += lineTotal;
            orderHTML += `
                <div style="margin-bottom: 15px;">
                    <h3>${product.name}</h3>
                    <p>${product.gender} / ${product.category}</p>
                    <p>₹${product.price} x ${qty} = <strong>₹${lineTotal.toFixed(2)}</strong></p>
                </div>
            `;
        });

        orderHTML += `<hr><h3 style="margin-top: 15px;">Total: ₹${total.toFixed(2)}</h3>`;
        orderDetails.innerHTML = orderHTML;
    }

    paymentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const custName = document.getElementById("custName").value;
        const phone = document.getElementById("phone").value;
        const pincode = document.getElementById("pincode").value;
        const address = document.getElementById("address").value;
        const message = document.getElementById("paymentMessage");

        if (buyProducts.length === 0) {
            message.textContent = "No products selected.";
            return;
        }

        if (!custName.trim() || !phone.trim() || !pincode.trim() || !address.trim()) {
            message.textContent = "Please fill in all fields.";
            return;
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
                    address: address
                })
            });

            const result = await response.json();

            if (result.success) {
                message.textContent = "Payment completed! Order placed successfully.";

                localStorage.removeItem("cart_" + userId);
                localStorage.removeItem("buyProducts_" + userId);

                const button = paymentForm.querySelector(".payment-button");
                if (button) {
                    button.disabled = true;
                    button.textContent = "Order Placed";
                }

                // Redirect to My Orders with success message
                setTimeout(function () {
                    window.location.href = "/my-orders?success=1";
                }, 1200);
            } else {
                message.textContent = result.message;
            }
        } catch (error) {
            console.error(error);
            message.textContent = "Unable to connect to server.";
        }
    });
}
