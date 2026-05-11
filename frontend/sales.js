
import { store,actions } from "./store.js";
import { apiRequest, closeModal, clearInputs,showToast } from "./helping.js";
import { renderProductsInSaleMode,renderProductsNormal } from "./products.js";

// ── Internal state ──────────────────────────────────────────
let _saleMode = false;
let _cart = [];   // [{ product_id, product_name, stock, quantity }]


export function getSaleMode() { return _saleMode; }
export function getCart() { return _cart; }

// ── Enter / Exit sale mode ───────────────────────────────────

export function enterSaleMode() {
    _saleMode = true;
    _cart = [];
    document.dispatchEvent(new Event("enterSaleMode"))   // products.js re-renders rows
    _showSaleModeUI();
}

export function exitSaleMode() {
    _saleMode = false;
    _cart = [];
    document.dispatchEvent(new Event("exitSaleMode"));      
    _showNormalUI();
    _hideCartView();
}

// ── Cart manipulation ────────────────────────────────────────


export function toggleCartItem(productId, productName, stock) {
    const idx = _cart.findIndex(p => p.product_id === parseInt(productId));
    if (idx !== -1) {
        _cart.splice(idx, 1);
        return false; // removed
    } else {
        _cart.push({
            product_id: parseInt(productId),
            product_name: productName,
            stock: parseInt(stock),
            quantity: 1
        });
        return true; // added
    }
}

export function isInCart(productId) {
    return _cart.some(p => p.product_id === parseInt(productId));
}

// Cart view (STATE 3)

export function showCartView() {
    if (_cart.length === 0) {
        showToast("Your cart is empty. Click product rows to add items.", "info");
        return;
    }

    _renderCartTable();

    document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
    document.getElementById("cart-view").classList.add("active-section");
}

function _hideCartView() {

    document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
    document.getElementById("products-page").classList.add("active-section");

}

function _renderCartTable() {
    const tbody = document.getElementById("cart-list-body");
    if (!tbody) return;

    let html = "";
    _cart.forEach((item, idx) => {
        html += `
        <tr>
            <td>${item.product_name}</td>
            <td>${item.stock}</td>
            <td>
                <input
                    type="number"
                    class="cart-qty-input"
                    data-idx="${idx}"
                    value="${item.quantity}"
                    min="1"
                    max="${item.stock}"
                    style="width:70px; padding:4px 6px; border:1px solid #ddd; border-radius:4px;"
                />
            </td>
            <td>
                <button
                    class="delete-btn cart-remove-btn"
                    data-idx="${idx}"
                    style="padding:4px 10px; font-size:0.8rem;"
                >Remove</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;

    // Sync quantity inputs back to _cart in real time
    tbody.querySelectorAll(".cart-qty-input").forEach(input => {
        input.addEventListener("change", (e) => {
            const idx = parseInt(e.target.dataset.idx);
            let val = parseInt(e.target.value);
            const maxStock = _cart[idx].stock;

            if (isNaN(val) || val < 1) {
                showToast("Quantity cannot be negative or zero.", "error");
                val = 1;
                e.target.value = 1;
            }
            if (val > maxStock) {
                showToast(`Only ${maxStock} items available in stock.`, "error");
                val = maxStock;
                e.target.value = maxStock;
            }

            _cart[idx].quantity = val;
        });
    });

    // Remove button
    tbody.querySelectorAll(".cart-remove-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt(e.target.dataset.idx);
            _cart.splice(idx, 1);
            if (_cart.length === 0) {
                // Auto-go back if cart becomes empty
                _hideCartView();

            } else {
                _renderCartTable();
            }
        });
    });
}

// Submit sale 

export async function submitCart() {
    if (_cart.length === 0) {
        showToast("Cart is empty.", "error");
        return;
    }

    // Validate quantities
    for (const item of _cart) {
        if (item.quantity <= 0) {
            showToast(`Invalid quantity for ${item.product_name}`, "error");
            return;
        }
        if (item.quantity > item.stock) {
            showToast(`Quantity for ${item.product_name} exceeds stock (${item.stock})`, "error");
            return;
        }
    }

    const items = _cart.map(p => ({
        product_id: p.product_id,
        quantity: p.quantity
    }));

    try {
        const result = await apiRequest("/sales", "POST", { items });
        if (result.status === "success") {
            showToast(`Sale recorded! Total: ₹${result.data?.total_sale ?? ""} | Profit: ₹${result.data?.total_profit ?? ""}`, "success");

            // 1. Mutate the cache locally (Optimistic update)
            _cart.forEach(cartitem => {
                actions.deductStock(cartitem.product_id, cartitem.quantity);
            });

            // 2. Mark BOTH analytics and revenue summaries dirty so they'll refetch next time they are viewed
            actions.markAnalyticsDirty();
            actions.markRevenueDirty();

            // 3. Clear cart and exit sale mode
            exitSaleMode();

            // 4. Force immediate re-render of the product UI from our mutated cache
            if (getSaleMode()) {
                renderProductsInSaleMode();
            } else {
                renderProductsNormal();
            }

        } else {
            alert("Sale failed: " + (result.message || result.status));
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// UI helpers

function _showSaleModeUI() {
    // Show the Cart and Cancel-Sale buttons; hide Add Product
    _el("btn-add-product-modal").style.display = "none";
    _el("btn-start-sale").style.display = "none";
    _el("btn-view-cart").style.display = "inline-block";
    _el("btn-cancel-sale").style.display = "inline-block";
    _el("sale-mode-banner").style.display = "block";
}

function _showNormalUI() {
    _el("btn-add-product-modal").style.display = "inline-block";
    _el("btn-start-sale").style.display = "inline-block";
    _el("btn-view-cart").style.display = "none";
    _el("btn-cancel-sale").style.display = "none";
    _el("sale-mode-banner").style.display = "none";
}

function _el(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`[sales.js] Element #${id} not found`);
    return el || { style: {} }; // safe fallback
}

// Revenue + Recent Sales  

export async function loadDailySummary() {
    const selector = document.getElementById("revenue-period");
    const period = selector ? selector.value : "daily";

    // 1. Use the cached summary if it's not marked dirty and contains the selected period
    if (!store.revenue.isDirty && store.revenue.periods[period]) {
        console.log(`Serving ${period} revenue summary from Cache!`);
        const cached = store.revenue.periods[period];
        document.getElementById("val-daily-revenue").innerText = "₹ " + cached.total_revenue;
        document.getElementById("val-daily-profit").innerText = "₹ " + cached.total_profit;
        return;
    }

    try {
        const result = await apiRequest(`/analytics/revenue?period=${period}`, "GET");
        if (result.status === "success") {
            const revenue = result.data.total_revenue || 0;
            const profit = result.data.total_profit || 0;

            // 2. Store in cache
            actions.setRevenueSummary(period, { total_revenue: revenue, total_profit: profit });

            document.getElementById("val-daily-revenue").innerText = "₹ " + revenue;
            document.getElementById("val-daily-profit").innerText = "₹ " + profit;
        }
    } catch (err) {
        console.error("loadDailySummary:", err.message);
    }
}

export async function loadSales() {
    try {
        const result = await apiRequest("/sales/recent", "GET");
        if (result.status === "success") {
            _renderSales(result.sales);
        } else if (result.status === "no_sales") {
            document.getElementById("sales-list-body").innerHTML =
                `<tr><td colspan="4">No sales yet</td></tr>`;
        }
    } catch (err) {
        console.error("loadSales:", err.message);
    }
}

function _renderSales(sales) {
    const table = document.getElementById("sales-list-body");
    let html = "";
    sales.forEach(s => {
        html += `
        <tr>
            <td>${new Date(s.sale_time + "Z").toLocaleString()}</td>
            <td>${s.product_name}</td>
            <td>${s.quantity}</td>
            <td>${s.item_sale}</td>
        </tr>`;
    });
    table.innerHTML = html;
}

//DOMContentLoaded: wire up Cart-view buttons 

document.addEventListener("DOMContentLoaded", () => {
    // "Start Sale" buttons enters STATE 2
    const startBtn = document.getElementById("btn-start-sale");
    if (startBtn) startBtn.addEventListener("click", () => enterSaleMode());

    // "View Cart" button enters STATE 3
    const cartBtn = document.getElementById("btn-view-cart");
    if (cartBtn) cartBtn.addEventListener("click", () => showCartView());

    // "Cancel Sale" button exits back to STATE 1
    const cancelBtn = document.getElementById("btn-cancel-sale");
    if (cancelBtn) cancelBtn.addEventListener("click", () => exitSaleMode());

    // "Submit Sale" inside cart view
    const submitBtn = document.getElementById("btn-cart-submit");
    if (submitBtn) submitBtn.addEventListener("click", () => submitCart());

    // "Back" inside cart view returns to STATE 2 (product table)
    const backBtn = document.getElementById("btn-cart-back");
    if (backBtn) backBtn.addEventListener("click", () => {
        _hideCartView();

    });

    // Sales page submit-cart button (kept for backward compat)
    const salesSubmitBtn = document.getElementById("btn-submit-cart");
    if (salesSubmitBtn) {
        salesSubmitBtn.addEventListener("click", async () => {
            const result = await submitCart();
        });
    }
});
    const periodSelector = document.getElementById("revenue-period");

    if (periodSelector) {

        periodSelector.addEventListener("change", () => {
            loadDailySummary();
        });

    }