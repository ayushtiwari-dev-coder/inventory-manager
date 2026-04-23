import { apiRequest,clearInputs,setLoading,validateInputs } from "./helping.js";

const token=localStorage.getItem("token");

if(token){
    window.location.href="dashboard.html";
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
// This address (127.0.0.1) only works if your Python terminal is ON
const BASE_URL = "https://inventory-manager-fs9t.onrender.com";

async function handle_register(e) {

    e.preventDefault();

    const btn = document.getElementById("btn-register-submit");

    const name = document.getElementById("reg-fullname").value;
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    try{
    validateInputs({
        name,
        username,
        password
    });
    console.log("button clicked")
    setLoading(btn, true);
    

    

        const result = await apiRequest("/register", "POST", {
            name: name,
            username: username,
            password: password
        }, false);

        localStorage.setItem("token", result.token);

        clearInputs("register-section")

        alert("Account Created Successfully!");

        window.location.href = "dashboard.html";

    } catch (err) {

        alert(err.message);

    }

    setLoading(btn, false);
}

async function handle_login(e) {
    e.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password })
        });

        const result = await response.json();

        if (response.ok) {
            // SUCCESS
            localStorage.setItem("token", result.token);
            window.location.href = "dashboard.html";
        } else {
            // ERROR HANDLING 
            const errorinfo=result.detail
            if (errorinfo.message === "Account locked") {
                const minutes = Math.floor(errorinfo.time_left / 60);
                const seconds = errorinfo.time_left % 60;
                alert(`SECURITY ALERT: Your account is locked. Please try again in ${minutes}m ${seconds}s.`);
            } 
            else if (errorinfo.attempts_left !== undefined) {
                alert(`WRONG PASSWORD: You have ${errorinfo.attempts_left} attempts remaining before your account is locked.`);
            } 
            else {
                alert("Login Failed: " + (result.detail || result.message || "Check your credentials"));
            }
        }
    } catch (error) {
        console.error("Connection Error:", error);
        alert("Server is OFF. Start your Uvicorn/Gunicorn server first!");
    }
}

// Attach listeners to your button IDs
document.addEventListener("DOMContentLoaded", () => {
    const regBtn = document.getElementById("btn-register-submit");
    const loginBtn = document.getElementById("btn-login-submit");

    if (regBtn) regBtn.addEventListener("click", handle_register);
    
    if (loginBtn) loginBtn.addEventListener("click", handle_login);

});