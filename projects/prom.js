fetchdata();
async function fetchdata(){
    try{
        const pokeName = document.getElementById("pokename").value.toLowerCase();
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeName}`);
       
        if(!response.ok){
            throw new Error("This is not available in the data");
        }
       const data = await response.json();
       const pokemons = data.sprites.front_default;
       const imgElement = document.getElementById("pokemons");
       imgElement.src = pokemons;
       imgElement.style.display = "block";

    }
    catch(error){
        console.error(error);

    }
}



