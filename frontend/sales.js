import { apiRequest, closeModal, handleSubmit, clearInputs,validateInputs } from "./helping.js";

export const Sale = {
    record: async (productId) => {
        // We use the 'product-stock' input from your modal for the quantity sold
        const qtyInput = document.getElementById("product-stock");
        const qtyValue = qtyInput.value.trim();

        validateInputs({
            quantity:qtyValue
        });

        // Hits the backend: @app.post("/sales")
        return await apiRequest("/sales", "POST", { 
            product_id: parseInt(productId), 
            quantity: parseInt(qtyValue) 
        });
    }
};


export async function loadDailySummary(){

    try{

        const result = await apiRequest("/analytics/revenue?period=daily","GET")

        if(result.status === "success"){

            const revenue = result.data.total_revenue || 0
            const profit = result.data.total_profit || 0

            document.getElementById("val-daily-revenue").innerText = "₹" + revenue
            document.getElementById("val-daily-profit").innerText = "₹" + profit

        }

    }catch(err){

        console.error(err.message)

    }

}

export async function loadSales(){

    try{

        const result = await apiRequest("/sales/recent","GET")

        if(result.status === "success"){
            renderSales(result.sales)
        }

        if(result.status === "no_sales"){
            const table = document.getElementById("sales-list-body")

            table.innerHTML = `
            <tr>
                <td colspan="4">No sales yet</td>
            </tr>
            `
        }

    }catch(err){
        console.log(err.message)
    }

}
function renderSales(sales){

    const table = document.getElementById("sales-list-body")

    let html = ""

    sales.forEach(s => {

        html += `
        <tr>
            <td>${new Date(s.sale_time + "Z").toLocaleString()}</td>
            <td>${s.product_name}</td>
            <td>${s.quantity} </td>
            <td>${s.total_sale}</td>
        </tr>
        `

    })

    table.innerHTML = html

}

