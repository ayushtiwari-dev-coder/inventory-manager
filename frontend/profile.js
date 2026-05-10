import { apiRequest, getToken } from "./helping.js";
import { store, actions } from "./store.js";

export async function loadprofile(){
    const token = getToken();
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const usernameField = document.getElementById("display-username");
    const nameField = document.getElementById("display-name");
    const logoutBtn = document.getElementById("btn-logout");

    // If profile is already cached, render it instantly and skip the API request
    if (store.profile) {
        console.log("Serving profile settings from Cache!");
        usernameField.innerText = store.profile.username;
        nameField.innerText = store.profile.name;
        return;
    }

    try {
        const result = await apiRequest("/profile", "GET");
        if (result.status === "success") {
            actions.setProfile(result.data); // Save to cache
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
}