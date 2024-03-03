let searchInp = document.querySelector("#searchId")
let submit = document.querySelector("#submitId")
submit.addEventListener("click",()=>{
   
    searchResult();
})
const searchResult=()=>{
    let newValue=searchInp.value;
    if(newValue!==""){
    window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(newValue);
    }
}

searchInp.addEventListener("mousedown",()=>{
    if(searchInp!==""){
    let valueClear= searchInp.removeAttribute("placeholder")
    }else{
        valueClear= searchInp.getAttribute("placeholder")
    }
    // valueClear.value ="";
})