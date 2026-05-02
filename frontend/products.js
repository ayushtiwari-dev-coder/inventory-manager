// ============================================================
// products.js — Product table + sale-mode-aware rendering
// CHANGES:
//   - Removed embedded sale/cart logic (moved to sales.js)
//   - Added renderProductsInSaleMode() / renderProductsNormal()
//   - Row clicks in sale mode call toggleCartItem() from sales.js
//   - Edit/Delete buttons hidden during sale mode
//   - No modal operations allowed during sale mode
// ============================================================

import {
    apiRequest,
    openModal,
    closeModal,
    handleSubmit,
    configureModalFields,
    clearInputs,
    validateInputs,
    resetmodal
} from "./helping.js";

import {
    loadDailySummary,
    loadSales,
    getSaleMode,
    toggleCartItem,
    isInCart
} from "./sales.js";

// ── Module state ─────────────────────────────────────────────
let selectedProductId = null;
let _productsCache = [];   // last fetched products list

// ── Product API actions ──────────────────────────────────────
const Product = {
    add: async () => {
        const product_name = document.getElementById("product-name").value;
        const mrp = parseFloat(document.getElementById("product-mrp").value);
        const profit_margin = parseFloat(document.getElementById("product-margin").value);
        const stock = parseInt(document.getElementById("product-stock").value);

        validateInputs({ product_name, mrp, profit_margin, stock });
        return await apiRequest("/products", "POST", { product_name, mrp, profit_margin, stock });
    },

    edit: async () => {

        const id = parseInt(selectedProductId);

        const mrpVal = document.getElementById("product-mrp").value;
        const marginVal = document.getElementById("product-margin").value;
        const stockVal = document.getElementById("product-stock").value;

        const payload = {
            product_id: id
        };

        if (mrpVal !== "") payload.mrp = parseFloat(mrpVal);
        if (marginVal !== "") payload.margin = parseFloat(marginVal);
        if (stockVal !== "") payload.stock_change = parseInt(stockVal);

        return await apiRequest("/products/update", "PUT", payload);
    },

    delete: async () => {
        return await apiRequest(`/products/${selectedProductId}`, "DELETE");
    }
};

// ── Load + render (STATE 1 — normal) ────────────────────────

export async function loadProducts() {
    try {
        const result = await apiRequest("/products", "GET");
        if (result.status === "success") {
            _productsCache = result.products;
            if (getSaleMode()) {
                renderProductsInSaleMode();
            } else {
                renderProductsNormal();
            }
        } else if (result.status === "no_products") {
            _productsCache = [];
            document.getElementById("products-list-body").innerHTML =
                '<tr><td colspan="5">No products available</td></tr>';
        }
    } catch (err) {
        console.error("loadProducts:", err.message);
    }
}

/**
 * STATE 1 rendering — full Edit / Sell / Delete buttons visible.
 */
export function renderProductsNormal() {
    const table = document.getElementById("products-list-body");
    if (!table) return;

    if (_productsCache.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No products available</td></tr>';
        return;
    }

    let html = "";
    _productsCache.forEach(p => {
        html += `
        <tr data-id="${p.product_id}" data-name="${p.product_name}" data-stock="${p.stock}">
            <td>${p.product_id}</td>
            <td>${p.product_name}</td>
            <td>${p.mrp}</td>
            <td>${p.stock}</td>
            <td>
                <button class="edit-btn"   data-id="${p.product_id}" data-modal-open="edit">Edit</button>
                <button class="delete-btn" data-id="${p.product_id}" data-modal-open="delete">Delete</button>
            </td>
        </tr>`;
    });
    table.innerHTML = html;
}

/**
 * STATE 2 rendering — rows are selectable, no Edit/Delete buttons.
 * Selected rows get .selected class; clicking toggles cart membership.
 */
export function renderProductsInSaleMode() {
    const table = document.getElementById("products-list-body");
    if (!table) return;

    if (_productsCache.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No products to sell</td></tr>';
        return;
    }

    let html = "";
    _productsCache.forEach(p => {
        const selected = isInCart(p.product_id) ? "selected" : "";
        html += `
        <tr
            class="sale-row ${selected}"
            data-id="${p.product_id}"
            data-name="${p.product_name}"
            data-stock="${p.stock}"
            style="cursor:pointer;"
        >
            <td>${p.product_id}</td>
            <td>${p.product_name}</td>
            <td>${p.mrp}</td>
            <td>${p.stock}</td>
            <td><span class="cart-indicator">${selected ? "✓ In Cart" : "Click to add"}</span></td>
        </tr>`;
    });
    table.innerHTML = html;

    // Attach row-click handlers for cart toggling
    table.querySelectorAll(".sale-row").forEach(row => {
        row.addEventListener("click", () => {
            const id = row.dataset.id;
            const name = row.dataset.name;
            const stock = row.dataset.stock;

            const added = toggleCartItem(id, name, stock);
            row.classList.toggle("selected", added);
            row.querySelector(".cart-indicator").innerText = added ? "✓ In Cart" : "Click to add";
        });
    });
}

// ── Unified event listener (STATE 1 only actions) ────────────

document.addEventListener("click", (e) => {
    // Block all modal/edit/delete actions while in sale mode
    if (getSaleMode()) return;

    if (e.target.dataset.modalOpen) {
        const mode = e.target.dataset.modalOpen;
        const productId = e.target.dataset.id;
        const submitBtn = document.getElementById("btn-submit-product");

        if (productId) selectedProductId = productId;

        if (mode === "delete") {
            const confirmed = confirm(`Delete product #${selectedProductId}?`);
            if (confirmed) {
                Product.delete().then(res => {
                    if (res.status === "success") {
                        loadProducts();
                    }
                });
            }
            return;
        }

        resetmodal(submitBtn);
        submitBtn.dataset.submitAction = mode;
        configureModalFields(mode);
        openModal("add-product-modal");
    }

    // Close modal
    if (e.target.dataset.modalClose || e.target.id === "modal-close-btn") {
        closeModal("add-product-modal");
    }

    // Add / Edit submit
    if (e.target.id === "btn-submit-product" && e.target.dataset.submitAction) {
        const mode = e.target.dataset.submitAction;
        handleSubmit(
            e.target,
            () => Product[mode](),
            () => {
                closeModal("add-product-modal");
                clearInputs("add-product-modal");
                loadProducts();
            }
        );
    }
});

// Wire up Add Product button
document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("btn-add-product-modal");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            if (getSaleMode()) return; // Guard
            const submitBtn = document.getElementById("btn-submit-product");
            resetmodal(submitBtn);
            submitBtn.dataset.submitAction = "add";
            configureModalFields("add");
            openModal("add-product-modal");
        });
    }

    loadProducts();
});
document.addEventListener("enterSaleMode", () => {
    renderProductsInSaleMode();
});

document.addEventListener("exitSaleMode", () => {
    renderProductsNormal();
});
document.addEventListener("reloadProducts", () => {
    loadProducts();
});