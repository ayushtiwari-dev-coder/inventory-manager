import { apiRequest } from "./helping.js";

let revenueChart = null;
let profitChart = null;

let topProductsCache=[];
let leastProductsCache=[];
let currentTable="top";

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

async function loadAnalyticsTables() {

    try {

        const top = await apiRequest("/analytics/top-products");
        const least = await apiRequest("/analytics/least-products");

        if (top.status === "success") {
            topProductsCache = top.data;
        }

        if (least.status === "success") {
            leastProductsCache = least.data;
        }

        renderAnalyticsTable();

    } catch (err) {
        console.error("Analytics table error:", err.message);
    }

}
function renderAnalyticsTable() {

    const body = document.getElementById("analytics-table-body");

    const data =
        currentTable === "top"
            ? topProductsCache
            : leastProductsCache;

    if (!body) return;

    if (!data || data.length === 0) {
        body.innerHTML = `<tr><td colspan="3">No data available</td></tr>`;
        return;
    }

    let html = "";

    data.forEach(p => {

        html += `
        <tr>
            <td>${p.product_name}</td>
            <td>${p.total_profit}</td>
            <td>${p.total_quantity}</td>
        </tr>
        `;

    });

    body.innerHTML = html;

}
function setupTableSwitch() {

    const topBtn = document.getElementById("btn-top-products");
    const leastBtn = document.getElementById("btn-least-products");

    if (topBtn) {
        topBtn.addEventListener("click", () => {
            currentTable = "top";
            renderAnalyticsTable();
        });
    }

    if (leastBtn) {
        leastBtn.addEventListener("click", () => {
            currentTable = "least";
            renderAnalyticsTable();
        });
    }

}
document.addEventListener("DOMContentLoaded", () => {

    const selector = document.getElementById("trend-period");

    if (selector) {
        selector.addEventListener("change", () => {
            loadAnalyticsGraphs();
        });
    }

    setupTableSwitch();
    loadAnalyticsTables();

});
