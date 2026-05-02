import { apiRequest } from "./helping.js";

let revenueChart = null;
let profitChart = null;

export async function checkLowStock() {
    try {
        const result = await apiRequest("/alerts/low-stock", "GET");

        if (result.status === "success") {
            const products = result.data;

            if (products.length > 0) {

                let names = products.map(p => `${p.product_name} (stock: ${p.stock})`).join("\n");

                alert(
                    `LOW STOCK ALERT ⚠️

The following products are running low:

${names}`
                );
            }
        }

    } catch (err) {
        console.error("Low stock check failed:", err.message);
    }
}


export async function loadAnalyticsGraphs() {

    const selector = document.getElementById("trend-period");
    const months = selector ? selector.value : 6;

    try {

        const result = await apiRequest(`/analytics/sales-trend?months=${months}`);

        if (result.status !== "success") return;

        const dates = result.data.dates.reverse();
        const revenue = result.data.revenue.reverse();
        const profit = result.data.profit.reverse();

        renderRevenueChart(dates, revenue);
        renderProfitChart(dates, profit);

    } catch (err) {
        console.error("Graph error:", err.message);
    }

}
function renderRevenueChart(labels, data) {

    const ctx = document.getElementById("revenue-chart").getContext("2d");

    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Revenue",
                    data: data,
                    borderWidth: 2
                }
            ]
        }
    });

}

function renderProfitChart(labels, data) {

    const ctx = document.getElementById("profit-chart").getContext("2d");

    if (profitChart) profitChart.destroy();

    profitChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Profit",
                    data: data,
                    borderWidth: 2
                }
            ]
        }
    });

}
document.addEventListener("DOMContentLoaded", () => {

    const selector = document.getElementById("trend-period");

    if (selector) {
        selector.addEventListener("change", () => {
            loadAnalyticsGraphs();
        });
    }

});
