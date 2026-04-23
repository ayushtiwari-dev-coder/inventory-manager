import { Sale,loadDailySummary,loadSales} from "./sales.js"; 
import { apiRequest, openModal, closeModal, handleSubmit, configureModalFields,clearInputs, validateInputs,resetmodal } from "./helping.js";

// 1. Memory for the script
let selectedProductId = null; 

// 2. The Actions (Add, Edit, Delete)
const Product = {
    add: async () => {
        const product_name = document.getElementById("product-name").value;
        const mrp = parseFloat(document.getElementById("product-mrp").value);
        const profit_margin = parseFloat(document.getElementById("product-margin").value);
        const stock = parseInt(document.getElementById("product-stock").value);

        validateInputs({
            product_name,
            mrp,
            profit_margin,
            stock
        });
        return await apiRequest("/products", "POST", { product_name, mrp, profit_margin, stock });
    },

    edit: async () => {
        const id = parseInt(selectedProductId);
        const mrpVal = document.getElementById("product-mrp").value;
        const marginVal = document.getElementById("product-margin").value;
        const stockVal = document.getElementById("product-stock").value;
        let lastResult = { status: "success" };

        if (mrpVal !== "") {
            validateInputs({
                mrp:mrpVal
            });
            lastResult = await apiRequest("/products/update-price", "PUT", { 
                product_id: id, 
                new_mrp: parseFloat(mrpVal) 
            });
        }
        if (marginVal !== "") {

            validateInputs({
                profit_margin:marginVal
            });
            lastResult = await apiRequest("/products/update-margin", "PUT", { 
                product_id: id, 
                new_margin: parseFloat(marginVal) 
            });
        }
        if (stockVal !== "") {

            validateInputs({
                stock:stockVal
            });
            lastResult = await apiRequest("/products/update-stock", "PUT", { 
                product_id: id, 
                change: parseInt(stockVal) 
            });
        }
        return lastResult;
    },

    delete: async () => {
        try{
        return await apiRequest(`/products/${selectedProductId}`, "DELETE");
        }catch(error){
            throw new Error("");
            
        }
    }

};

// 3. Load & Render Functions
async function loadProducts() {
    try {
        const result = await apiRequest("/products", "GET");
        if (result.status === "success") {
            renderProducts(result.products);
        } else if (result.status === "no_products") {
            document.getElementById("products-list-body").innerHTML = 
                '<tr><td colspan="5">No products available</td></tr>';
        }
    } catch (err) {
        console.error("Load Error:", err.message);
    }
}

function renderProducts(products) {
    const table = document.getElementById("products-list-body");
    let html = "";
    products.forEach(p => {
        html += `
        <tr>
            <td>${p.product_id}</td>
            <td>${p.product_name}</td>
            <td>${p.mrp}</td>
            <td>${p.stock}</td>
            <td>
                <button class="edit-btn" data-id="${p.product_id}" data-modal-open="edit">Edit</button>
                <button class="sale-btn" data-id="${p.product_id}" data-modal-open="sale">Sell</button>
                <button class="delete-btn" data-id="${p.product_id}" data-modal-open="delete">Delete</button>
            </td>
        </tr>`;
    });
    table.innerHTML = html;
}

// 4. The Unified Event Listener (The Guard)
document.addEventListener("click", (e) => {
  if (e.target.dataset.modalOpen) {
    const mode = e.target.dataset.modalOpen;
    const productId = e.target.dataset.id;
    const submitBtn = document.getElementById("btn-submit-product");

    // Case: Add / Edit / Delete
    if (productId) { selectedProductId = productId; }

    // Case: Sale
    if (mode === "sale") {
        resetmodal(submitBtn)
        delete submitBtn.dataset.submitAction

      configureModalFields("sale"); 
      document.getElementById("modal-title").innerText = "Record Sale";
      document.getElementById("product-stock").value = ""; 

      submitBtn.onclick = () => {
        handleSubmit(submitBtn, () => Sale.record(selectedProductId), (result) => {
          if (result.status === "success") {
            closeModal("add-product-modal");
            clearInputs("add-product-modal");
            loadProducts(); 
            loadDailySummary()
            loadSales()
            
          }
        });
      };
      openModal("add-product-modal");
      return; 
    }

    
    submitBtn.onclick = null; 
    submitBtn.dataset.submitAction = mode;

    if (mode === "delete") {
      const confirmed = confirm(`Delete product #${selectedProductId}?`);
      if (confirmed) {
        Product.delete().then((res) => { if (res.status === "success") loadProducts(); });
      }
      return;
    }

    resetmodal(submitBtn)
    configureModalFields(mode);
    openModal("add-product-modal");
  }

  // Close Logic
  if (e.target.dataset.modalClose || e.target.id === "modal-close-btn") {
    closeModal("add-product-modal");
  }

  // Add/Edit Submit Logic
  if (e.target.id === "btn-submit-product" && e.target.dataset.submitAction) {
    const mode = e.target.dataset.submitAction;
    handleSubmit(e.target, () => Product[mode](), () => {
        closeModal("add-product-modal");
        clearInputs("add-product-modal");
        loadProducts();
      }
    );
  }
});

// 5. Run it!
loadProducts();