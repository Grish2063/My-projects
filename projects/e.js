const wrapper = document.querySelector(".sliderWrapper");
const menuItems = document.querySelectorAll(".menuItem");

const products = [
  {
    id: 1,
    title: "Air Force 1",
    price: 119,
    desc: "Classic and clean. Air cushioning for all-day comfort.",
    colors: [
      { code: "black", img: "air.png" },
      { code: "darkblue", img: "air2.png" },
    ],
  },
  {
    id: 2,
    title: "Air Jordan",
    price: 149,
    desc: "Iconic style meets high performance. The legend lives on.",
    colors: [
      { code: "lightgray", img: "jordan.png" },
      { code: "green", img: "jordan2.png" },
    ],
  },
  {
    id: 3,
    title: "Blazer",
    price: 109,
    desc: "Retro vibes with modern durability. Perfect for everyday wear.",
    colors: [
      { code: "lightgray", img: "blazer.png" },
      { code: "green", img: "blazer2.png" },
    ],
  },
  {
    id: 4,
    title: "Crater",
    price: 129,
    desc: "Sustainable and sleek. Built with recycled materials.",
    colors: [
      { code: "black", img: "crater.png" },
      { code: "lightgray", img: "crater2.png" },
    ],
  },
  {
    id: 5,
    title: "Hippie",
    price: 99,
    desc: "Bold and comfortable. For the free spirit in you.",
    colors: [
      { code: "gray", img: "hippie.png" },
      { code: "black", img: "hippie2.png" },
    ],
  },
];


let choosenProduct = products[0];

const currentProductImg = document.querySelector(".productImg");
const currentProductTitle = document.querySelector(".productTitle");
const currentProductPrice = document.querySelector(".productPrice");
const currentProductColors = document.querySelectorAll(".color");
const currentProductSizes = document.querySelectorAll(".size");
const currentProductDesc = document.querySelector(".productDesc");


menuItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    wrapper.style.transform = `translateX(${-100 * index}vw)`;

    choosenProduct = products[index];

    currentProductTitle.textContent = choosenProduct.title;
    currentProductPrice.textContent = "$" + choosenProduct.price;
    currentProductImg.src = choosenProduct.colors[0].img;
    currentProductDesc.textContent = choosenProduct.desc;


    currentProductColors.forEach((color , index)=>{
      color.style.backgroundColor = choosenProduct.colors[index].code;

    });


  });
});

currentProductColors.forEach((color , index)=>{
  color.addEventListener("click", ()=>{
    currentProductImg.src = choosenProduct.colors[index].img;

  })
});
currentProductSizes.forEach((size , index)=>{
  size.addEventListener("click", ()=>{
    currentProductSizes.forEach(size=>{
    size.style.backgroundColor = "white";
    size.style.color = "black";

    })
    size.style.backgroundColor = "black";
    size.style.color = "white";

  })
});
const productButton = document.querySelector(".productButton");
const payment = document.querySelector(".payment");
const close = document.querySelector(".close");


productButton.addEventListener("click", ()=>{
    payment.style.display="flex";

})
close.addEventListener("click", ()=>{
    payment.style.display="none";
    
});