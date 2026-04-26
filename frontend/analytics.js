import { apiRequest } from "./helping.js";

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

