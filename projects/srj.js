    const textbox = document.getElementById("textbox");
    const toNrs = document.getElementById("toNrs");
    const todollar = document.getElementById("todollar");
    const result = document.getElementById("result");
    const exchangeRate = 133;
    let currency;

    function convert(){
        if(toNrs.checked){
            currency = Number(textbox.value);
            currency = (currency * exchangeRate).toFixed(2);
            result.textContent = `NPR: Rs${currency}`;
        }
        else if (todollar.checked){
            currency = Number(textbox.value);
            currency = (currency / exchangeRate).toFixed(2);
            result.textContent = `USD: $${currency}`;
        }
        else{
            result.textContent = "Select a currency";
        }
    }