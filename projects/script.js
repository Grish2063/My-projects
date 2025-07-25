let timeoutId;
function start(){
    timeoutId = setTimeout(()=> window.alert("You are gay"), 3000);
    console.log("Started")
}
function end(){
    clearTimeout(timeoutId);
    console.log("Ended");
}








