import { apiRequest, clearInputs, setLoading, validateInputs, showToast, hideLoader, showLoader } from "./helping.js";

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

const BASE_URL = "http://localhost:8000";

async function handle_register(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-register-submit");
    const name = document.getElementById("reg-fullname").value;
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const reg_Code = document.getElementById("reg-code").value;

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
            password: password,
            reg_code: reg_Code
        }, false);

        localStorage.setItem("token", result.token);
        clearInputs("register-section");


        showToast("Account Created Successfully!", "success");

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

            if (result.status === "force_password_reset") {
                const loginSection = document.getElementById("login-section");

                loginSection.innerHTML = `
                    <h2>🔒 Set Private Password</h2>
                    <p style="color: #666; font-size: 0.88rem; margin-bottom: 15px; text-align: center;">
                        For privacy, please choose a permanent secure password for your inventory store.
                    </p>
                    <div class="input-group">
                        <label for="new-private-password">New Password</label>
                        <input type="password" id="new-private-password" placeholder="Min 8 characters">
                    </div>
                    <button id="btn-reset-submit" class="auth-btn">Save Password & Login</button>
                `;

                document.getElementById("btn-reset-submit").addEventListener("click", async () => {
                    const newPassword = document.getElementById("new-private-password").value;

                    try {
                        validateInputs({ password });

                        showLoader();
                        
                        const resetResponse = await fetch(`${BASE_URL}/auth/finalize-reset`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                username: username, 
                                new_password: newPassword
                            })
                        });
                        hideLoader();

                        const resetData = await resetResponse.json();

                        if (resetResponse.ok) {
                            showToast("Password secured! Logging you in instantly...", "success");

                            localStorage.setItem("token", resetData.token);

                            setTimeout(() => {
                                window.location.href = "dashboard.html";
                            }, 1000);
                        } else {
                            showToast(resetData.detail || "Failed to update password.", "error");
                        }
                    } catch (err) {
                        hideLoader();
                        
                        showToast(err.message, "error");
                    }
                });

            } else {
                // BLOCK 2: Standard user account login path
                localStorage.setItem("token", result.token);
                window.location.href = "dashboard.html";
            }
        } else {
            // UNIFIED TOAST ERROR HANDLING (Preserved exactly as it was in your code)
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