let usersChart = null;

let incomeChart = null;

let salesChart = null;

const monthLabels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];

window.onload = function () {

  auth.onAuthStateChanged(user => {

    if (user) {

      document.getElementById("authPage").classList.add("hidden");

      document.getElementById("dashboard").classList.remove("hidden");

      document.getElementById("currentUserEmail").innerText = user.email;

      createCharts();

      loadUsers();

      loadProducts();

      loadSales();

      loadOnlineOrders();

      loadRecentSales();

      loadActivity();

      loadReports();
      
      loadAIAnalysis();

    } else {

      document.getElementById("authPage").classList.remove("hidden");

      document.getElementById("dashboard").classList.add("hidden");

    }

  });

};

/* AUTH */

function showLogin() {

  document.getElementById("loginForm").classList.remove("hidden");

  document.getElementById("registerForm").classList.add("hidden");

  document.getElementById("loginTab").classList.add("active-tab");

  document.getElementById("registerTab").classList.remove("active-tab");

}



function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const adminEmail = "admin@gmail.com";

  if (!email || !password) {
    alert("Введите email и пароль");
    return;
  }

  if (email !== adminEmail) {
    alert("Бұл бөлім тек администраторға арналған!");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .catch(error => {
      alert("Ошибка входа: " + error.message);
    });
}
function logoutUser() {

  auth.signOut();

}

/* PAGES */

function showPage(pageId, button) {

  document.querySelectorAll(".page").forEach(page => {

    page.classList.remove("active-page");

  });

  document.getElementById(pageId).classList.add("active-page");

  document.querySelectorAll(".menu-btn").forEach(btn => {

    btn.classList.remove("active");

  });

  if (button) button.classList.add("active");

}

/* HELPERS */

function makeSmoothData(total) {

  total = Number(total || 0);

  if (total <= 0) return [0, 0, 0, 0, 0, 0];

  if (total === 1) return [0, 0, 0, 0, 0, 1];

  return [

    Math.max(0, Math.floor(total * 0.15)),

    Math.max(0, Math.floor(total * 0.25)),

    Math.max(0, Math.floor(total * 0.4)),

    Math.max(0, Math.floor(total * 0.6)),

    Math.max(0, Math.floor(total * 0.8)),

    total

  ];

}

/* USERS */

function loadUsers() {

  const table = document.getElementById("usersTable");

  db.ref("users").on("value", snapshot => {

    table.innerHTML = "";

    let count = 0;

    snapshot.forEach(child => {

      count++;

      const id = child.key;

      const user = child.val();

      table.innerHTML += `

        <tr>

          <td>${id}</td>

          <td>${user.name || "-"}</td>

          <td>${user.email || "-"}</td>

          <td>${user.role || "user"}</td>

          <td>

            <button class="delete-btn" onclick="deleteUser('${id}')">Удалить</button>

          </td>

        </tr>

      `;

    });

    document.getElementById("statUsers").innerText = count;

    if (usersChart) {

      usersChart.data.datasets[0].data = makeSmoothData(count);

      usersChart.update();

    }

  });

}

function addUserManually() {

  const name = prompt("Имя:");

  const email = prompt("Email:");

  const password = prompt("Пароль минимум 6 символов:");

  if (!name || !email || !password) return;

  const now = new Date();

  auth.createUserWithEmailAndPassword(email, password)

    .then(result => {

      return db.ref("users/" + result.user.uid).set({

        name: name,

        email: email,

        role: "user",

        month: now.getMonth(),

        year: now.getFullYear(),

        createdAt: now.toLocaleString()

      });

    })

    .then(() => addActivity("Админ добавил пользователя: " + email))

    .catch(error => alert(error.message));

}

function deleteUser(id) {

  if (!confirm("Удалить пользователя из базы?")) return;

  db.ref("users/" + id).remove();

  addActivity("Пользователь удалён");

}

/* PRODUCTS */

function addProductFromForm() {

  const name = document.getElementById("productName").value.trim();

  const price = Number(document.getElementById("productPrice").value);

  const stock = Number(document.getElementById("productStock").value);

  const image = document.getElementById("productImage").value.trim();

  if (!name || !price || !stock) {

    alert("Заполните название, цену и количество");

    return;

  }

  db.ref("products").push({

    name: name,

    price: price,

    stock: stock,

    sold: 0,

    image: image || "https://via.placeholder.com/60"

  });

  document.getElementById("productName").value = "";

  document.getElementById("productPrice").value = "";

  document.getElementById("productStock").value = "";

  document.getElementById("productImage").value = "";

  addActivity("Добавлен товар: " + name);

}

function loadProducts() {

  const table = document.getElementById("productsTable");

  const select = document.getElementById("saleProductSelect");

  db.ref("products").on("value", snapshot => {

    table.innerHTML = "";

    select.innerHTML = `<option value="">Выберите товар</option>`;

    let count = 0;

    snapshot.forEach(child => {

      count++;

      const id = child.key;

      const p = child.val();

      table.innerHTML += `

        <tr>

          <td>

            <img class="product-image" src="${p.image || "https://via.placeholder.com/60"}" alt="product">

          </td>

          <td>${p.name || "-"}</td>

          <td>${Number(p.price || 0).toLocaleString()} ₸</td>

          <td>${p.stock || 0}</td>

          <td>${p.sold || 0}</td>

          <td>

            <button class="edit-btn" onclick="editProduct('${id}')">Изменить</button>

            <button class="delete-btn" onclick="deleteProduct('${id}')">Удалить</button>

          </td>

        </tr>

      `;

      select.innerHTML += `

        <option value="${id}">

          ${p.name} — ${Number(p.price || 0).toLocaleString()} ₸ — в наличии ${p.stock || 0}

        </option>

      `;

    });

    document.getElementById("statProducts").innerText = count;

  });

}

function editProduct(id) {

  db.ref("products/" + id).once("value").then(snapshot => {

    const p = snapshot.val();

    const name = prompt("Новое название:", p.name || "");

    const price = Number(prompt("Новая цена:", p.price || 0));

    const stock = Number(prompt("Новое количество в наличии:", p.stock || 0));

    const image = prompt("Новая ссылка на фото:", p.image || "");

    if (!name || !price || stock < 0) return;

    db.ref("products/" + id).update({

      name: name,

      price: price,

      stock: stock,

      image: image || "https://via.placeholder.com/60"

    });

    addActivity("Товар изменён: " + name);

  });

}

function deleteProduct(id) {

  if (!confirm("Удалить товар?")) return;

  db.ref("products/" + id).remove();

  addActivity("Товар удалён");

}

/* SALES */

function addSaleFromForm() {

  const productId = document.getElementById("saleProductSelect").value;

  const quantity = Number(document.getElementById("saleQuantity").value);

  if (!productId || !quantity || quantity <= 0) {

    alert("Выберите товар и введите количество");

    return;

  }

  db.ref("products/" + productId).once("value").then(snapshot => {

    const product = snapshot.val();

    if (!product) {

      alert("Товар не найден");

      return;

    }

    if (Number(product.stock) < quantity) {

      alert("Недостаточно товара в наличии");

      return;

    }

    const now = new Date();

    const price = Number(product.price);

    const total = price * quantity;

    const newStock = Number(product.stock) - quantity;

    const newSold = Number(product.sold || 0) + quantity;

    db.ref("sales").push({

      productId: productId,

      productName: product.name,

      quantity: quantity,

      price: price,

      total: total,

      image: product.image || "https://via.placeholder.com/60",

      month: now.getMonth(),

      year: now.getFullYear(),

      date: now.toLocaleString()

    });

    db.ref("products/" + productId).update({

      stock: newStock,

      sold: newSold

    });

    document.getElementById("saleProductSelect").value = "";

    document.getElementById("saleQuantity").value = "";

    addActivity(`Продано ${quantity} шт. товара ${product.name}. Осталось: ${newStock}`);

  });

}

function loadSales() {

  const table = document.getElementById("salesTable");

  db.ref("sales").on("value", snapshot => {

    table.innerHTML = "";

    let salesCount = 0;

    let income = 0;

    snapshot.forEach(child => {

      const sale = child.val();

      const quantity = Number(sale.quantity || 0);

      const total = Number(sale.total || 0);

      salesCount += quantity;

      income += total;

      table.innerHTML += `

        <tr>

          <td>${sale.productName || "-"}</td>

          <td>${quantity}</td>

          <td>${Number(sale.price || 0).toLocaleString()} ₸</td>

          <td>${total.toLocaleString()} ₸</td>

          <td>${sale.date || "-"}</td>

        </tr>

      `;

    });

    document.getElementById("statSales").innerText = salesCount;

    document.getElementById("statIncome").innerText = income.toLocaleString() + " ₸";

    if (salesChart) {

      salesChart.data.datasets[0].data = makeSmoothData(salesCount);

      salesChart.update();

    }

    if (incomeChart) {

      incomeChart.data.datasets[0].data = makeSmoothData(income);

      incomeChart.update();

    }

  });

}

/* RECENT SALES */

function loadRecentSales() {

  const table = document.getElementById("recentSalesTable");

  if (!table) return;

  db.ref("sales").limitToLast(5).on("value", snapshot => {

    table.innerHTML = "";

    const rows = [];

    snapshot.forEach(child => {

      rows.push(child.val());

    });

    rows.reverse();

    rows.forEach(sale => {

      table.innerHTML += `

        <tr>

          <td>

            <div class="sale-product">

              <img 

                class="sale-image" 

                src="${sale.image || "https://via.placeholder.com/60"}" 

                alt="product"

              >

              <span>${sale.productName || "-"}</span>

            </div>

          </td>

          <td>${sale.quantity || 0} шт</td>

          <td>${Number(sale.total || 0).toLocaleString()} ₸</td>

          <td>${sale.date || "-"}</td>

        </tr>

      `;

    });

  });

}

/* ACTIVITY */

function addActivity(text) {

  db.ref("activityLogs").push({

    action: text,

    date: new Date().toLocaleString()

  });

}

function loadActivity() {

  const list = document.getElementById("activityList");

  db.ref("activityLogs").on("value", snapshot => {

    list.innerHTML = "";

    snapshot.forEach(child => {

      const log = child.val();

      list.innerHTML += `

        <li>${log.action} — ${log.date}</li>

      `;

    });

  });

}

/* CHARTS */

function createCharts() {

  const usersCanvas = document.getElementById("usersChart");

  const incomeCanvas = document.getElementById("incomeChart");

  const salesCanvas = document.getElementById("salesChart");

  if (usersChart) usersChart.destroy();

  if (incomeChart) incomeChart.destroy();

  if (salesChart) salesChart.destroy();

  usersChart = new Chart(usersCanvas, {

    type: "line",

    data: {

      labels: monthLabels,

      datasets: [{

        label: "Пользователи",

        data: [0, 0, 0, 0, 0, 0],

        borderColor: "#6d4aff",

        backgroundColor: "rgba(109,74,255,0.15)",

        fill: true,

        tension: 0.4,

        pointRadius: 4

      }]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false

    }

  });

  incomeChart = new Chart(incomeCanvas, {

    type: "line",

    data: {

      labels: monthLabels,

      datasets: [{

        label: "Доход",

        data: [0, 0, 0, 0, 0, 0],

        borderColor: "#ff5ea8",

        backgroundColor: "rgba(255,94,168,0.15)",

        fill: true,

        tension: 0.4,

        pointRadius: 4

      }]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false

    }

  });

  salesChart = new Chart(salesCanvas, {

    type: "bar",

    data: {

      labels: monthLabels,

      datasets: [{

        label: "Продажи",

        data: [0, 0, 0, 0, 0, 0],

        backgroundColor: "#10b981",

        borderRadius: 8

      }]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false

    }

  });

}
function loadOnlineOrders() {
    const table = document.getElementById("onlineOrdersTable");

    if (!table) return;

    db.ref("orders").on("value", snapshot => {
        table.innerHTML = "";

        if (!snapshot.exists()) {
            table.innerHTML = `
                <tr>
                    <td colspan="7">Пока нет онлайн-заказов</td>
                </tr>
            `;
            return;
        }

        snapshot.forEach(child => {
            const orderId = child.key;
            const order = child.val();

            const products = order.items
                ? order.items.map(item =>
                    `${item.productName} (${item.quantity} шт)`
                  ).join("<br>")
                : "-";

            let statusContent = "";

            if (order.status === "Отменён") {
                statusContent = `<span style="color:red;font-weight:bold;">Отменён</span>`;
            } else {
                statusContent = `
                    <select onchange="updateOrderStatus('${orderId}', this.value)">
                        <option value="Новый" ${order.status === "Новый" ? "selected" : ""}>Новый</option>
                        <option value="Собран" ${order.status === "Собран" ? "selected" : ""}>Собран</option>
                        <option value="Отправлен" ${order.status === "Отправлен" ? "selected" : ""}>Отправлен</option>
                        <option value="Доставлен" ${order.status === "Доставлен" ? "selected" : ""}>Доставлен</option>
                    </select>
                `;
            }

            table.innerHTML += `
                <tr>
                    <td>${order.userEmail || "-"}</td>
                    <td>${products}</td>
                    <td>${Number(order.total || 0).toLocaleString()} ₸</td>
                    <td>${order.city || "-"}</td>
                    <td>${order.address || "-"}</td>
                    <td>${statusContent}</td>
                    <td>${order.date || "-"}</td>
                </tr>
            `;
        });
    });
}
function updateOrderStatus(orderId, status) {
    db.ref("orders/" + orderId).once("value").then(snapshot => {
        const order = snapshot.val();

        if (!order) return;

        if (order.status === "Отменён") {
            alert("Бұл заказды өзгертуге болмайды. Клиент отмена жасады.");
            return;
        }

        db.ref("orders/" + orderId).update({
            status: status
        }).then(() => {
            addActivity("Онлайн-заказ статусы өзгертілді: " + status);

            if (status === "Доставлен" && !order.addedToSales) {
                addOnlineOrderToSales(orderId, order);
            }
        });
    });
}
function addOnlineOrderToSales(orderId, order) {
    if (!order.items || order.items.length === 0) return;

    const now = new Date();

    order.items.forEach(item => {
        db.ref("sales").push({
            productId: item.productId || "",
            productName: item.productName || "-",
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            total: Number(item.total || 0),
            image: item.image || "https://via.placeholder.com/60",
            month: now.getMonth(),
            year: now.getFullYear(),
            date: now.toLocaleString(),
            source: "online",
            userEmail: order.userEmail || "-"
        });

        if (item.productId) {
            db.ref("products/" + item.productId).once("value").then(productSnap => {
                const product = productSnap.val();

                if (product) {
                    const newStock = Number(product.stock || 0) - Number(item.quantity || 0);
                    const newSold = Number(product.sold || 0) + Number(item.quantity || 0);

                    db.ref("products/" + item.productId).update({
                        stock: newStock < 0 ? 0 : newStock,
                        sold: newSold
                    });
                }
            });
        }
    });

    db.ref("orders/" + orderId).update({
        addedToSales: true
    });

    addActivity("Онлайн-заказ сатылымдарға қосылды: " + (order.userEmail || "-"));
}
function loadReports() {

    db.ref("users").once("value").then(usersSnap => {
        document.getElementById("reportUsers").innerText =
            usersSnap.numChildren();
    });

    db.ref("orders").once("value").then(orderSnap => {
        document.getElementById("reportOrders").innerText =
            orderSnap.numChildren();
    });

    db.ref("sales").once("value").then(salesSnap => {

        let total = 0;

        salesSnap.forEach(item => {
            const sale = item.val();
            total += Number(sale.total || 0);
        });

        document.getElementById("reportSales").innerText =
            total.toLocaleString() + " ₸";
    });
}
function exportUsersExcel() {
    db.ref("users").once("value").then(snapshot => {
        let data = [];
        let count = 0;

        snapshot.forEach(child => {
            const user = child.val();
            count++;

            data.push({
                "№": count,
                "Имя": user.name || "-",
                "Email": user.email || "-",
                "Роль": user.role || "-",
                "Дата регистрации": user.createdAt || "-"
            });
        });

        data.push({});
        data.push({
            "№": "",
            "Имя": "Всего пользователей:",
            "Email": count,
            "Роль": "",
            "Дата регистрации": ""
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, "Users_Report.xlsx");
    });
}

function exportSalesExcel() {
    db.ref("sales").once("value").then(snapshot => {
        let data = [];
        let count = 0;
        let totalQuantity = 0;
        let totalIncome = 0;

        snapshot.forEach(child => {
            const sale = child.val();
            count++;

            const quantity = Number(sale.quantity || 0);
            const total = Number(sale.total || 0);

            totalQuantity += quantity;
            totalIncome += total;

            data.push({
                "№": count,
                "Товар": sale.productName || "-",
                "Количество": quantity,
                "Цена": Number(sale.price || 0),
                "Сумма": total,
                "Источник": sale.source || "offline",
                "Покупатель": sale.userEmail || "-",
                "Дата": sale.date || "-"
            });
        });

        data.push({});
        data.push({
            "№": "",
            "Товар": "ИТОГО:",
            "Количество": totalQuantity,
            "Цена": "",
            "Сумма": totalIncome,
            "Источник": "",
            "Покупатель": "",
            "Дата": ""
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
        XLSX.writeFile(workbook, "Sales_Report.xlsx");
    });
}

function exportOrdersExcel() {
    db.ref("orders").once("value").then(snapshot => {
        let data = [];
        let count = 0;
        let totalOrders = 0;
        let totalIncome = 0;

        snapshot.forEach(child => {
            const order = child.val();
            count++;
            totalOrders++;
            totalIncome += Number(order.total || 0);

            const productsText = order.items
                ? order.items.map(item => {
                    return `${item.productName} (${item.quantity} шт)`;
                }).join(", ")
                : "-";

            data.push({
                "№": count,
                "Покупатель": order.userEmail || "-",
                "Товары": productsText,
                "Город": order.city || "-",
                "Адрес": order.address || "-",
                "Телефон": order.phone || "-",
                "Статус": order.status || "-",
                "Сумма": Number(order.total || 0),
                "Дата": order.date || "-"
            });
        });

        data.push({});
        data.push({
            "№": "",
            "Покупатель": "Всего онлайн-заказов:",
            "Товары": totalOrders,
            "Город": "",
            "Адрес": "",
            "Телефон": "",
            "Статус": "Общая сумма:",
            "Сумма": totalIncome,
            "Дата": ""
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Online Orders");
        XLSX.writeFile(workbook, "Online_Orders_Report.xlsx");
    });
}
// ==========================
// AI ANALYSIS
// ==========================

function loadAIAnalysis() {

    // Жалпы табыс және хит продаж
    db.ref("sales").once("value").then(snapshot => {

        let totalIncome = 0;
        let productStats = {};

        snapshot.forEach(child => {

            const sale = child.val();

            totalIncome += Number(sale.total || 0);

            const product = sale.productName || "Без названия";
            const quantity = Number(sale.quantity || 0);

            if (!productStats[product]) {
                productStats[product] = 0;
            }

            productStats[product] += quantity;

        });

        // Хит продаж
        let topProduct = "-";
        let maxSold = 0;

        for (let product in productStats) {
            if (productStats[product] > maxSold) {
                maxSold = productStats[product];
                topProduct = product;
            }
        }

        const topElement = document.getElementById("aiTopProduct");
        const incomeElement = document.getElementById("aiTotalIncome");

        if (topElement) {
            topElement.innerText =
                maxSold > 0 ? `${topProduct} (${maxSold} шт)` : "-";
        }

        if (incomeElement) {
            incomeElement.innerText =
                totalIncome.toLocaleString() + " ₸";
        }

    });

    // Қоймадағы ең аз қалған товар
    db.ref("products").once("value").then(snapshot => {

        let lowProduct = "-";
        let minStock = 999999;

        snapshot.forEach(child => {

            const product = child.val();
            const stock = Number(product.stock || 0);

            if (stock < minStock) {
                minStock = stock;
                lowProduct = product.name;
            }

        });

        const lowElement = document.getElementById("aiLowStock");
        const recElement = document.getElementById("aiRecommendation");

        if (lowElement) {
            lowElement.innerText =
                `${lowProduct} (${minStock} шт)`;
        }

        if (recElement) {
            recElement.innerHTML = `
                🏆 Ең көп сатылатын тауарларды бақылау ұсынылады.<br>
                ⚠️ <b>${lowProduct}</b> қоймада аз қалды (${minStock} дана).<br>
                📦 Қорды толықтыру ұсынылады.
            `;
        }

    });

}