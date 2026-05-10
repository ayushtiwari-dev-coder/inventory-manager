

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

import { store, actions } from "./store.js";

// Module state 
let selectedProductId = null;
let _productsCache = [];   // last fetched products list
let _searchTerm = "";

// Product API actions inside frontend/products.js
const Product = {
    add: async () => {
        const product_name = document.getElementById("product-name").value;
        const selling_price = parseFloat(document.getElementById("product-selling-price").value);
        const cost_price = parseFloat(document.getElementById("product-cost-price").value);
        const stock = parseInt(document.getElementById("product-stock").value);
        
        validateInputs({ product_name, selling_price, cost_price, stock });

        const response = await apiRequest("/products", "POST", { 
            product_name, 
            selling_price, 
            cost_price, 
            stock 
        });

        if (response.status === "success") {
            // Mark all caches stale!
            actions.markProductsDirty();
            actions.markAnalyticsDirty();
            actions.markRevenueDirty();
        }
        return response;
    },

    edit: async () => {
        const id = parseInt(selectedProductId);
        const sellingVal = document.getElementById("product-selling-price").value;
        const costVal = document.getElementById("product-cost-price").value;
        const stockVal = document.getElementById("product-stock").value;

        const payload = { product_id: id };

        if (sellingVal !== "" && !isNaN(sellingVal)) payload.selling_price = parseFloat(sellingVal);
        if (costVal !== "" && !isNaN(costVal)) payload.cost_price = parseFloat(costVal);
        if (stockVal !== "" && !isNaN(stockVal)) payload.stock_change = parseInt(stockVal);

        const response = await apiRequest("/products/update", "PUT", payload);

        if (response.status === "success") {
            // Mark all caches stale!
            actions.markProductsDirty();
            actions.markAnalyticsDirty();
            actions.markRevenueDirty();
        }
        return response;
    },

    delete: async () => {
        const response = await apiRequest(`/products/${selectedProductId}`, "DELETE");

        if (response.status === "success") {
            // Mark all caches stale!
            actions.markProductsDirty();
            actions.markAnalyticsDirty();
            actions.markRevenueDirty();
        }
        return response;
    }
};
// Load + render (STATE 1 — normal)

// frontend/products.js




export async function loadProducts() {
    // Only serve from cache if we have products AND they aren't marked dirty
    if (!store.isProductsDirty && store.products && store.products.length > 0) {
        _productsCache = store.products; // Sync internal module list
        if (getSaleMode()) {
            renderProductsInSaleMode();
        } else {
            renderProductsNormal();
        }
        return; // Skip the database fetch!
    }

    try {
        const result = await apiRequest("/products", "GET");
        if (result.status === "success") {
            actions.setProducts(result.products); // Save to cache & sets isProductsDirty = false
            _productsCache = result.products;

            if (getSaleMode()) {
                renderProductsInSaleMode();
            } else {
                renderProductsNormal();
            }
        } else if (result.status === "no_products") {
            actions.setProducts([]);
            _productsCache = [];
            document.getElementById("products-list-body").innerHTML =
                '<tr><td colspan="5">No products available</td></tr>';
        }
    } catch (err) {
        console.error("loadProducts failed:", err.message);
    }
}

function getFilteredProducts() {
    return _productsCache.filter(p =>
        p.product_name
            .toLowerCase()
            .includes(_searchTerm.toLowerCase())
    );
}


export function renderProductsNormal() {
    const table = document.getElementById("products-list-body");
    if (!table) return;

    if (_productsCache.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No products available</td></tr>';
        return;
    }

    let html = "";
    getFilteredProducts().forEach(p => {
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

export function renderProductsInSaleMode() {
    const table = document.getElementById("products-list-body");
    if (!table) return;

    if (_productsCache.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No products to sell</td></tr>';
        return;
    }

    let html = "";
    getFilteredProducts().forEach(p => {
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

//  Unified event listener (STATE 1 only actions) 

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
                        document.dispatchEvent(new Event("reloadProducts"));
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

    // Add / Edit submit handler
if (e.target.id === "btn-submit-product" && e.target.dataset.submitAction) {
    const mode = e.target.dataset.submitAction;
    handleSubmit(
        e.target,
        () => Product[mode](),
        () => {
            closeModal("add-product-modal");
            clearInputs("add-product-modal");
            
            // This will execute loadProducts() which now correctly sees 
            // store.isProductsDirty = true, forces the API query,
            // and draws your new/edited product list instantly!
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
    loadProducts()
});
const searchInput = document.getElementById("product-search");

if (searchInput) {
    searchInput.addEventListener("input", (e) => {

        _searchTerm = e.target.value;

        if (getSaleMode()) {
            renderProductsInSaleMode();
        } else {
            renderProductsNormal();
        }
    });
}