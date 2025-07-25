let button = document.querySelectorAll(".mybutton");
button.forEach(button=>{
    button.classList.add('enabled');
});
button.forEach(button =>{
    button.addEventListener("mouseover", event =>{
        button.classList.toggle("hover");

    });
});
button.forEach(button =>{
    button.addEventListener("mouseout", event =>{
        button.classList.toggle("hover");
    });
        
});

button.forEach(button =>{
    button.addEventListener("click", event =>{

        if(event.target.classList.contains("disabled")){
            event.target.textContent += "😎";

        }
        else{
            event.target.classList.replace("enabled", "disabled");
        }
    })

})