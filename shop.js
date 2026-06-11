let currentUser = null;
let cart = [];
let products = [];

function showLogin() {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");

    document.getElementById("loginTab").classList.add("active-tab");
    document.getElementById("registerTab").classList.remove("active-tab");
}

function showRegister() {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("loginForm").classList.add("hidden");

    document.getElementById("registerTab").classList.add("active-tab");
    document.getElementById("loginTab").classList.remove("active-tab");
}

function registerCustomer() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!name || !email || !password) {
        alert("Заполните все поля");
        return;
    }

    if (password.length < 6) {
        alert("Пароль должен быть минимум 6 символов");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((result) => {
            return db.ref("users/" + result.user.uid).set({
                name: name,
                email: email,
                role: "customer",
                createdAt: new Date().toLocaleString()
            });
        })
        .then(() => {
            alert("Регистрация успешна!");
        })
        .catch(error => {
            alert(error.message);
        });
}

function loginCustomer() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Введите email и пароль");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            alert(error.message);
        });
}

function logoutCustomer() {
    auth.signOut();
}

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;

        document.getElementById("authPage").classList.add("hidden");
        document.getElementById("shopPage").classList.remove("hidden");
        document.getElementById("customerEmail").innerText = user.email;

        loadProducts();
        loadMyOrders();
    } else {
        currentUser = null;

        document.getElementById("shopPage").classList.add("hidden");
        document.getElementById("authPage").classList.remove("hidden");
    }
});

function showSection(id) {
    document.querySelectorAll(".shop-section").forEach(section => {
        section.classList.remove("active-section");
    });

    document.getElementById(id).classList.add("active-section");
}

function loadProducts() {
    db.ref("products").on("value", snapshot => {
        const grid = document.getElementById("productsGrid");
        grid.innerHTML = "";
        products = [];

        if (!snapshot.exists()) return;

        snapshot.forEach(item => {
            const product = item.val();
            product.id = item.key;

            products.push(product);

            grid.innerHTML += `
                <div class="product-card">
                    <img src="${product.image || "https://via.placeholder.com/300"}" alt="">

                    <div class="product-info">
                        <h3>${product.name || "-"}</h3>
                        <p>В наличии: ${product.stock || 0} шт.</p>

                        <div class="price">
                            ${Number(product.price || 0).toLocaleString()} ₸
                        </div>

                        <button onclick="addToCart('${product.id}')">
                            <i class="fa-solid fa-cart-plus"></i>
                            Добавить в корзину
                        </button>
                    </div>
                </div>
            `;
        });
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);

    if (!product) return;

    if (Number(product.stock || 0) <= 0) {
        alert("Бұл товар қазір жоқ");
        return;
    }

    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity >= Number(product.stock || 0)) {
            alert("Складта бұдан көп жоқ");
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price || 0),
            image: product.image || "https://via.placeholder.com/60",
            quantity: 1,
            stock: Number(product.stock || 0)
        });
    }

    renderCart();
}
if (typeof gtag === "function") {
    gtag("event", "add_to_cart", {
        item_name: product.name,
        value: Number(product.price || 0),
        currency: "KZT"
    });
}
function renderCart() {
    const table = document.getElementById("cartTable");
    const count = document.getElementById("cartCount");
    const totalLabel = document.getElementById("cartTotal");

    table.innerHTML = "";

    let total = 0;
    let items = 0;

    cart.forEach((item, index) => {
        const sum = item.price * item.quantity;

        total += sum;
        items += item.quantity;

        table.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()} ₸</td>
                <td>
                    <button onclick="decreaseQuantity(${index})">−</button>
                    <span style="margin:0 10px;">${item.quantity}</span>
                    <button onclick="increaseQuantity(${index})">+</button>
                </td>
                <td>${sum.toLocaleString()} ₸</td>
                <td>
                    <button onclick="removeCart(${index})">❌</button>
                </td>
            </tr>
        `;
    });

    count.innerText = items;
    totalLabel.innerText = total.toLocaleString() + " ₸";
}

function increaseQuantity(index) {
    if (cart[index].quantity >= cart[index].stock) {
        alert("Складта бұдан көп жоқ");
        return;
    }

    cart[index].quantity++;
    renderCart();
}

function decreaseQuantity(index) {
    cart[index].quantity--;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    renderCart();
}

function removeCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function checkoutOrder() {
    if (cart.length === 0) {
        alert("Корзина пуста");
        return;
    }

    const city = document.getElementById("orderCity").value.trim();
    const address = document.getElementById("orderAddress").value.trim();
    const phone = document.getElementById("orderPhone").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.trim();
const cardDate = document.getElementById("cardDate").value.trim();
const cardCvv = document.getElementById("cardCvv").value.trim();

    if (!city || !address || !phone) {
    alert("Выберите город, введите адрес и телефон");
    return;
}

const phoneDigits = phone.replace(/\D/g, "");

if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    alert("Телефон должен быть в формате +7 777 123 45 67");
    return;
}

if (!cardNumber || !cardDate || !cardCvv) {
    alert("Введите данные демо-карты");
    return;
}

if (cardNumber.replace(/\D/g, "").length !== 16) {
    alert("Номер карты должен содержать 16 цифр");
    return;
}

if (!/^\d{2}\/\d{2}$/.test(cardDate)) {
    alert("Введите срок карты в формате MM/YY");
    return;
}

if (cardCvv.length !== 3) {
    alert("CVV должен содержать 3 цифры");
    return;
}

    let total = 0;

    const orderItems = cart.map(item => {
        const sum = item.price * item.quantity;
        total += sum;

        return {
            productId: item.id,
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
            total: sum,
            image: item.image
        };
    });

    const order = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: orderItems,
        total: total,
        city: city,
        address: address,
        phone: phone,
        status: "Новый",
paymentStatus: "Демо-оплата подтверждена",
date: new Date().toLocaleString()
    };

    db.ref("orders").push(order)
        .then(() => {
            alert("Заказ успешно оформлен!");
            if (typeof gtag === "function") {
    gtag("event", "purchase", {
        transaction_id: Date.now().toString(),
        value: total,
        currency: "KZT"
    });
}

            cart = [];
            renderCart();

            document.getElementById("orderCity").value = "";
            document.getElementById("orderAddress").value = "";
            document.getElementById("orderPhone").value = "";

            loadMyOrders();
            showSection("orders");
        })
        .catch(error => {
            alert("Ошибка: " + error.message);
        });
}

function loadMyOrders() {
    const table = document.getElementById("myOrdersTable");

    if (!table || !currentUser) return;

    db.ref("orders").on("value", snapshot => {
        table.innerHTML = "";

        snapshot.forEach(child => {
            const orderId = child.key;
            const order = child.val();

            if (order.userId === currentUser.uid) {
                const productsText = order.items.map(item => {
                    return `${item.productName} (${item.quantity} шт)`;
                }).join(", ");

                const cancelButton = order.status === "Новый"
                    ? `<button onclick="cancelOrder('${orderId}')">Отменить</button>`
                    : "-";

                table.innerHTML += `
                    <tr>
                        <td>${productsText}</td>
                        <td>${Number(order.total || 0).toLocaleString()} ₸</td>
                        <td>${order.city || "-"}</td>
                        <td>${order.address || "-"}</td>
                        <td>${order.status || "-"}</td>
                        <td>${order.date || "-"}</td>
                        <td>${cancelButton}</td>
                    </tr>
                `;
            }
        });
    });
}

function cancelOrder(orderId) {
    if (!confirm("Заказды отменить етесіз бе?")) return;

    db.ref("orders/" + orderId).update({
        status: "Отменён"
    }).then(() => {
        alert("Заказ отменён");
    });
}
if (typeof gtag === "function") {
    gtag("event", "cancel_order", {
        order_id: orderId
    });
}
function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, "");

    if (value.startsWith("8")) {
        value = "7" + value.slice(1);
    }

    if (!value.startsWith("7")) {
        value = "7" + value;
    }

    value = value.slice(0, 11);

    let formatted = "+7";

    if (value.length > 1) {
        formatted += " " + value.slice(1, 4);
    }

    if (value.length > 4) {
        formatted += " " + value.slice(4, 7);
    }

    if (value.length > 7) {
        formatted += " " + value.slice(7, 9);
    }

    if (value.length > 9) {
        formatted += " " + value.slice(9, 11);
    }

    input.value = formatted;
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, "").slice(0, 16);
    input.value = value.replace(/(.{4})/g, "$1 ").trim();
}

function formatCardDate(input) {
    let value = input.value.replace(/\D/g, "").slice(0, 4);

    if (value.length >= 3) {
        input.value = value.slice(0, 2) + "/" + value.slice(2);
    } else {
        input.value = value;
    }
}