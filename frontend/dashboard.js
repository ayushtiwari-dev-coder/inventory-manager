import { getToken } from "./helping.js";
import "./products.js"
import { loadSales,loadDailySummary } from "./sales.js";
import {loadprofile} from "./profile.js"
import { checkLowStock } from "./analytics.js";




document.addEventListener("DOMContentLoaded", async () => {

    const token = getToken();

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    await checkLowStock();
});


document.addEventListener("DOMContentLoaded", () => {

    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".section");

    const lastPage = localStorage.getItem("lastPage") || "products-page";

    sections.forEach(sec => sec.classList.remove("active-section"));

    const activeNav = document.querySelector(`[href="#${lastPage.replace("-page","")}"]`);
    if(activeNav){
    activeNav.classList.add("active");
    }

    const activeSection=document.getElementById(lastPage);
    if(activeSection){
        activeSection.classList.add("active-section");
    }

    if(lastPage=="profile-page"){
        loadprofile();
    }

    if(lastPage === "sales-page"){
        loadDailySummary();
        loadSales();
    }
            navItems.forEach(item => {
            item.addEventListener("click", function(e){
            e.preventDefault();

            const target = this.getAttribute("href").replace("#","") + "-page";

            localStorage.setItem("lastPage", target);

            /* FIX START */
            navItems.forEach(n => n.classList.remove("active"));
            this.classList.add("active");
            /* FIX END */

            sections.forEach(sec => sec.classList.remove("active-section"));

            const activeSection = document.getElementById(target);

            if(activeSection){
            activeSection.classList.add("active-section");
            }

            if(target === "sales-page"){
                loadDailySummary();
                loadSales();
            
            }
            if(target=="profile-page"){
                loadprofile();
            }

        });

    });

});
