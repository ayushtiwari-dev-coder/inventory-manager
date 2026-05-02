// helping.js

const BASE_URL = "http://127.0.0.1:8000";


// TOKEN HELPER
export function getToken() {
    return localStorage.getItem("token");
}



// GENERIC API REQUEST

export async function apiRequest(endpoint, method="GET", data=null, auth=true){

    showLoader()

    try{

        const headers = {
            "Content-Type": "application/json"
        };

        if(auth){
            const token = getToken();
            if(token){
                headers["Authorization"] = `Bearer ${token}`;
            }
        }

        const options = {
            method: method,
            headers: headers
        };

        if(data){
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);

        let result;

        try{
            result = await response.json();
        }catch{
            throw new Error("Invalid JSON response");
        }

        if(!response.ok){
            throw new Error(result.detail || "API Error");
        }

        return result;

    }finally{

        hideLoader()

    }

}




// CLEAR FORM INPUTS

export function clearInputs(formId){

    const form = document.getElementById(formId);
    if(!form){return};

    const inputs = form.querySelectorAll("input");

    inputs.forEach(input=>{
        input.value="";
    });

}




// BUTTON LOADING STATE

export function setLoading(button, state){

    if(state){
        button.disabled = true;
        button.dataset.originalText = button.innerText;
        button.innerText = "Processing...";
    }
    else{
        button.disabled = false;
        button.innerText = button.dataset.originalText;
    }

}

export function openModal(modalid){

    const modal = document.getElementById(modalid);

    if(modal){
        modal.classList.remove("hidden");
    }

}
export function closeModal(modalid){

    const modal = document.getElementById(modalid);

    if(modal){
        modal.classList.add("hidden");
    }

}
export function configureModalFields(mode){

        

    const name = document.getElementById("field-name");
    const mrp = document.getElementById("field-mrp");
    const margin = document.getElementById("field-margin");
    const stock = document.getElementById("field-stock");
    const title = document.getElementById("modal-title");

    name.style.display = "none";
    mrp.style.display = "none";
    margin.style.display = "none";
    stock.style.display = "none";


    // ADD PRODUCT
    if(mode === "add"){

        title.innerText = "Add Product";

        name.style.display = "block";
        mrp.style.display = "block";
        margin.style.display = "block";
        stock.style.display = "block";

    }


    // EDIT PRODUCT
    if(mode === "edit"){

        title.innerText = "Edit Product";

        name.style.display = "none";
        mrp.style.display = "block";
        margin.style.display = "block";
        stock.style.display = "block";

    }


    // SALE
    if(mode === "sale"){

        title.innerText = "Record Sale";

        name.style.display = "none";
        mrp.style.display = "none";
        margin.style.display = "none";
        stock.style.display = "block";

    }

}
export async function handleSubmit(button, apiCall, onSuccess){

    setLoading(button,true)
    button.innerText = "Processing...";

    try{

        const result = await apiCall();

        if(result.status === "success"){
            onSuccess(result);
        }else{
            alert(result.status);
        }

    }catch(err){

        alert(err.message);

    }finally{

    setLoading(button,false);
    }

}
export function showLoader(){

    const loader = document.getElementById("loading-overlay");

    if(loader){
        loader.classList.remove("hidden");
    }

}

export function hideLoader(){

    const loader = document.getElementById("loading-overlay");

    if(loader){
        loader.classList.add("hidden");
    }
}

export function resetmodal(submitBtn){
    clearInputs("add-product-modal");
    submitBtn.onclick=null;
    delete submitBtn.dataset.submitAction;
    submitBtn.disabled=false;
}
export function validateInputs(data){

    const nameRegex = /^[A-Za-z0-9_-]+$/;
    const productRegex = /^[A-Za-z0-9-]+$/;

    // PRODUCT NAME
    if(data.product_name !== undefined){

        const name = data.product_name.trim();

        if(name === ""){
            throw new Error("Product name cannot be empty");
        }

        if(!productRegex.test(name)){
            throw new Error("Product name can contain only letters, numbers, and dash (-)");
        }

        if(name.length > 50){
            throw new Error("Product name too long");
        }
    }

    // MRP
    if(data.mrp !== undefined){

        const mrp = Number(data.mrp);

        if(isNaN(mrp)){
            throw new Error("MRP must be a number");
        }

        if(mrp <= 0){
            throw new Error("MRP must be greater than zero");
        }

        if(mrp > 99999999){
            throw new Error("MRP too large");
        }
    }

    // PROFIT MARGIN
    if(data.profit_margin !== undefined){

        const margin = Number(data.profit_margin);

        if(isNaN(margin)){
            throw new Error("Profit margin must be a number");
        }

        if(margin <= 0){
            throw new Error("Profit margin must be greater than zero");
        }

        if(margin > 99999999){
            throw new Error("Profit margin too large");
        }
    }

    // STOCK
    if(data.stock !== undefined){

        const stock = Number(data.stock);

        if(!Number.isInteger(stock)){
            throw new Error("Stock must be a whole number");
        }

        if(stock <= 0){
            throw new Error("Stock must be greater than zero");
        }

        if(stock > 9999999){
            throw new Error("Stock value too large");
        }
    }

    // SALE QUANTITY
    if(data.quantity !== undefined){

        const qty = Number(data.quantity);

        if(!Number.isInteger(qty)){
            throw new Error("Quantity must be a whole number");
        }

        if(qty === 0){
            throw new Error("stock change cannot be zero");
        }

        if(qty > 9999999){
            throw new Error("Quantity too large");
        }
    }

    // USERNAME
    if(data.username !== undefined){

        let username = data.username.trim().toLowerCase();

        if(username === ""){
            throw new Error("Username cannot be empty");
        }

        if(username.includes(" ")){
            throw new Error("Username cannot contain spaces");
        }

        if(username.length > 40){
            throw new Error("Username too long");
        }

        if(!nameRegex.test(username)){
            throw new Error("Username can contain only letters, numbers, _ and -");
        }

        data.username = username;
    }

    // NAME
    if(data.name !== undefined){

        const name = data.name.trim();

        if(name === ""){
            throw new Error("Name cannot be empty");
        }

        if(name.includes(" ")){
            throw new Error("Name cannot contain spaces");
        }

        if(name.length > 40){
            throw new Error("Name too long");
        }

        if(!nameRegex.test(name)){
            throw new Error("Name can contain only letters, numbers, _ and -");
        }
    }

    // PASSWORD
    if(data.password !== undefined){

        const password = data.password;

        if(password.length < 8){
            throw new Error("Password must be at least 8 characters");
        }

        if(password.includes(" ")){
            throw new Error("Password cannot contain spaces");
        }

        if(!/[A-Z]/.test(password)){
            throw new Error("Password must contain an uppercase letter");
        }

        if(!/[0-9]/.test(password)){
            throw new Error("Password must contain a number");
        }

        if(!/[!@#$%^&*(),.?":{}|<>]/.test(password)){
            throw new Error("Password must contain a special character");
        }
    }
}