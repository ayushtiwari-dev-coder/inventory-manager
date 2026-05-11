import { apiRequest, clearInputs, setLoading, validateInputs, showToast } from "./helping.js";

const token = localStorage.getItem("token");

if (token) {
    window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("login-section");
    const registerSection = document.getElementById("register-section");
    const toRegister = document.getElementById("link-to-register");
    const toLogin = document.getElementById("link-to-login");

    toRegister.addEventListener("click", (e) => {
        e.preventDefault();
        loginSection.style.display = "none";
        registerSection.style.display = "block";
    });

    toLogin.addEventListener("click", (e) => {
        e.preventDefault();
        registerSection.style.display = "none";
        loginSection.style.display = "block";
    });
});

const BASE_URL = "https://inventory-manager-fs9t.onrender.com";

async function handle_register(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-register-submit");
    const name = document.getElementById("reg-fullname").value;
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    try {
        validateInputs({
            name,
            username,
            password
        });

        setLoading(btn, true);

        const result = await apiRequest("/register", "POST", {
            name: name,
            username: username,
            password: password
        }, false);

        localStorage.setItem("token", result.token);
        clearInputs("register-section");
        
        // Replaced blocking alert with success toast
        showToast("Account Created Successfully!", "success");
        
        // Small delay so they can actually see the success toast before redirecting
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);

    } catch (err) {
        showToast(err.message, "error");
    } finally {
        setLoading(btn, false);
    }
}

async function handle_login(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-login-submit");
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        setLoading(btn, true);
        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password })
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("token", result.token);
            window.location.href = "dashboard.html";
        } else {
            // UNIFIED TOAST ERROR HANDLING
            const errorinfo = result.detail;

            if (errorinfo && errorinfo.message === "Account locked") {
                const minutes = Math.floor(errorinfo.time_left / 60);
                const seconds = errorinfo.time_left % 60;
                showToast(`SECURITY ALERT: Account locked. Try again in ${minutes}m ${seconds}s.`, "error");
            } 
            else if (errorinfo && errorinfo.attempts_left !== undefined) {
                showToast(`WRONG PASSWORD: ${errorinfo.attempts_left} attempts remaining.`, "error");
            } 
            else {
                // If it's a simple error string or standard message
                const msg = typeof errorinfo === 'string' ? errorinfo : (errorinfo?.message || "Login Failed");
                showToast(msg, "error");
            }
        }
    } catch (error) {
        console.error("Connection Error:", error);
        showToast("Server is offline. Check your backend connection.", "error");
    } finally {
        setLoading(btn, false);
    }
}

// Attach listeners to button IDs
document.addEventListener("DOMContentLoaded", () => {
    const regBtn = document.getElementById("btn-register-submit");
    const loginBtn = document.getElementById("btn-login-submit");

    if (regBtn) regBtn.addEventListener("click", handle_register);
    if (loginBtn) loginBtn.addEventListener("click", handle_login);
});