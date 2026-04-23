import { getToken } from "./helping.js";

document.addEventListener("DOMContentLoaded", () => {

const token = getToken();

if(!token){
    window.location.href = "login.html";
}

const username = localStorage.getItem("username");
const name = localStorage.getItem("name");

document.getElementById("display-username").innerText = username || "";
document.getElementById("display-name").innerText = name || "";

const logoutBtn = document.getElementById("btn-logout");

logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");

    window.location.href = "login.html";

});

});