import { getToken } from "./helping.js";
import "./products.js"
import { loadSales,loadDailySummary } from "./sales.js";


const token=getToken();
if(!token){
    window.location.href="login.html"
}

document.addEventListener("DOMContentLoaded", () => {

    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".section");

    const lastPage = localStorage.getItem("lastPage") || "products-page";

    sections.forEach(sec => sec.classList.remove("active-section"));

    const activeSection = document.getElementById(lastPage);

    if(activeSection){
        activeSection.classList.add("active-section");
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

            sections.forEach(sec => sec.classList.remove("active-section"));

            const activeSection = document.getElementById(target);

            if(activeSection){
                activeSection.classList.add("active-section");
            }

            if(target === "sales-page"){
                loadDailySummary();
                loadSales();
            }

        });

    });

});

document.addEventListener("DOMContentLoaded", () => {
    loadDailySummary()
    loadSales()
})