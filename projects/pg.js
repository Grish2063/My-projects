function roll(){
    const numOfdice = document.getElementById("numOfdice").value;
    const diceresult = document.getElementById("diceresult");
    const diceimages = document.getElementById("diceimages");
    const values = [];
    const images = [];

    for(i=0 ; i < numOfdice ; i++){
        const value = Math.floor(Math.random() * 6) + 1;
        values.push(value);
        images.push(`<img src = "dice_images/d${value}.png">`);

    }
    diceresult.textContent = `Dice ${values.join(`, `)}`;
    diceimages.innerHTML = images.join('');
   
}

