particlesJS.load('particles-js', 'particles.json');

let score = parseInt(localStorage.getItem("score")) || 0;
let autoClick = parseInt(localStorage.getItem("autoClick")) || 0;
const scoreEl = document.getElementById("score");
const upgrades = document.querySelectorAll(".upgrade");
const clickButton = document.getElementById("click-button");
let clickStreak = 0, lastClickTime = 0;

function updateScore(){
  scoreEl.textContent = score;
  localStorage.setItem("score", score);
  localStorage.setItem("autoClick", autoClick);
}
function updateButtons(){
  upgrades.forEach(b => {
    const cost = +b.dataset.cost;
    if(score >= cost){
      b.classList.add("affordable"); b.classList.remove("not-affordable");
    } else {
      b.classList.add("not-affordable"); b.classList.remove("affordable");
    }
  });
}
function spawnCoins(count){
  for(let i=0;i<count;i++){
    const coin = document.createElement("img");
    coin.src = "assets/coin.png"; coin.className = "floating-coin";
    coin.style.left = Math.random()*100+"vw";
    document.body.appendChild(coin);
    coin.animate([{top:"-50px",opacity:1},{top:"100vh",opacity:0}],{
      duration:2000+Math.random()*1000, easing:"ease-in"
    });
    setTimeout(()=>coin.remove(),3000);
  }
}
function showDownImage(){
  const img = document.createElement("img");
  img.src = "assets/down.png"; img.className = "down-float";
  img.style.left = `${30+Math.random()*40}vw`;
  document.body.appendChild(img);
  setTimeout(()=>img.remove(),4000);
}

clickButton.addEventListener("click",()=>{
  const now = Date.now();
  if(now - lastClickTime < 1000) clickStreak++; else clickStreak = 1;
  lastClickTime = now;
  if(clickStreak>=10) { showDownImage(); clickStreak=0; }
  score++; spawnCoins(10); updateScore(); updateButtons();
});
upgrades.forEach(b=>{
  b.addEventListener("click",()=>{
    const val = +b.dataset.value, cost = +b.dataset.cost;
    if(score>=cost){ score-=cost; autoClick+=val; updateScore(); updateButtons(); }
  });
});
setInterval(()=>{
  score+=autoClick; updateScore(); updateButtons();
},1000);

updateButtons(); updateScore();
