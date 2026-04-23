import { apiRequest, getToken } from "./helping.js";

document.addEventListener("DOMContentLoaded", async () => {

    const token=getToken();
    if(!token){
        window.location.href="index.html";
        return;
    }

    const usernameField = document.getElementById("display-username");
    const nameField = document.getElementById("display-name");
    const logoutBtn = document.getElementById("btn-logout");

    try {

        const result = await apiRequest("/profile", "GET");

        if (result.status === "success") {
            usernameField.innerText = result.data.username;
            nameField.innerText = result.data.name;
        }

    } catch (err) {
        console.error("Profile load error:", err.message);
    }

    // LOGOUT
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "index.html";
    });

});