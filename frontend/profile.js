import { apiRequest, getToken } from "./helping.js";
export async function loadprofile(){

    const token=getToken();
    if(!token){
        window.location.href="index.html";
        return;
    }
    console.log("reached input part")
    const usernameField = document.getElementById("display-username");
    const nameField = document.getElementById("display-name");
    const logoutBtn = document.getElementById("btn-logout");
    console.log("took input")
    try {

        const result = await apiRequest("/profile", "GET");
        console.log("FETCHED")

        if (result.status === "success") {
            usernameField.innerText = result.data.username;
            nameField.innerText = result.data.name;
            console.log(result.data.username)
            console.log(result.data.name)
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