// helping.js

const BASE_URL = "http://127.0.0.1:8000";


// TOKEN HELPER
export function getToken() {
    return localStorage.getItem("token");
}



// GENERIC API REQUEST

export async function apiRequest(endpoint, method="GET", data=null, auth=true){

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

    }

    setLoading(button,false);

}