// --- Firebase (ES Modules) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Your Firebase config (provided) ===
const firebaseConfig = {
  apiKey: "AIzaSyDExwdqJMlPTk4bDV_HB-lGhGhXEvdWT4w",
  authDomain: "fairblock-clicker.firebaseapp.com",
  projectId: "fairblock-clicker",
  storageBucket: "fairblock-clicker.firebasestorage.app",
  messagingSenderId: "34674811923",
  appId: "1:34674811923:web:e6de920e42e946210e0be6"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Particles (background)
particlesJS.load('particles-js', 'particles.json');

// Game state
let score = parseInt(localStorage.getItem("score")) || 0;
let autoClick = parseInt(localStorage.getItem("autoClick")) || 0;
const scoreEl = document.getElementById("score");
const upgrades = document.querySelectorAll(".upgrade");
const clickButton = document.getElementById("click-button");

let clickStreak = 0, lastClickTime = 0;
let uid = null;
let username = localStorage.getItem("username") || "";

// UI refs
const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const saveUsernameBtn = document.getElementById("saveUsername");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const leaderboardPanel = document.getElementById("leaderboardPanel");
const closeLeaderboard = document.getElementById("closeLeaderboard");
const leaderboardBody = document.querySelector("#leaderboardTable tbody");

// Helpers
function updateScore() {
  scoreEl.textContent = score;
  localStorage.setItem("score", score);
  localStorage.setItem("autoClick", autoClick);
}
function updateButtons() {
  upgrades.forEach(b => {
    const cost = +b.dataset.cost;
    if (score >= cost) { b.classList.add("affordable"); b.classList.remove("not-affordable"); }
    else { b.classList.add("not-affordable"); b.classList.remove("affordable"); }
  });
}
function spawnCoins(count) {
  for (let i=0;i<count;i++) {
    const coin = document.createElement("img");
    coin.src = "assets/coin.png";
    coin.className = "floating-coin";
    coin.style.left = Math.random()*100+"vw";
    document.body.appendChild(coin);
    coin.animate([{top:"-50px",opacity:1},{top:"100vh",opacity:0}],{ duration: 2000+Math.random()*1000, easing:"ease-in" });
    setTimeout(()=>coin.remove(), 3000);
  }
}
function showDownImage() {
  const img = document.createElement("img");
  img.src = "assets/down.png";
  img.className = "down-float";
  img.style.left = `${30+Math.random()*40}vw`;
  document.body.appendChild(img);
  setTimeout(()=>img.remove(), 4000);
}

// Game events
clickButton.addEventListener("click", () => {
  const now = Date.now();
  clickStreak = (now - lastClickTime < 1000) ? clickStreak + 1 : 1;
  lastClickTime = now;
  if (clickStreak >= 10) { showDownImage(); clickStreak = 0; }
  score++;
  spawnCoins(10);
  updateScore();
  updateButtons();
});

upgrades.forEach(b => {
  b.addEventListener("click", () => {
    const val = +b.dataset.value, cost = +b.dataset.cost;
    if (score >= cost) { score -= cost; autoClick += val; updateScore(); updateButtons(); }
  });
});

setInterval(() => { score += autoClick; updateScore(); updateButtons(); }, 1000);

// --- Username flow ---
function needUsername() { return !username || username.trim().length === 0; }
function openUsernameModal() { usernameModal.classList.remove("hidden"); usernameInput.value = ""; usernameInput.focus(); }
function closeUsernameModal() { usernameModal.classList.add("hidden"); }
saveUsernameBtn.addEventListener("click", async () => {
  const val = usernameInput.value.trim().slice(0,20);
  if (!val) return;
  username = val;
  localStorage.setItem("username", username);
  closeUsernameModal();
  if (uid) await upsertScore(); // create user doc right away
});

// --- Auth ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    uid = user.uid;
    if (needUsername()) openUsernameModal(); else await upsertScore();
    subscribeLeaderboard();
  }
});
signInAnonymously(auth).catch(console.error);

// --- Firestore write (every 5s, only if improved) ---
let lastPushedScore = -1;
async function upsertScore() {
  if (!uid || needUsername()) return;
  if (score <= lastPushedScore) return;
  lastPushedScore = score;
  const ref = doc(db, "leaders", uid);
  await setDoc(ref, { username, score, updatedAt: serverTimestamp() }, { merge: true });
}
setInterval(upsertScore, 5000);

// --- Leaderboard UI ---
leaderboardBtn.addEventListener("click", ()=> leaderboardPanel.classList.remove("hidden"));
closeLeaderboard.addEventListener("click", ()=> leaderboardPanel.classList.add("hidden"));

function subscribeLeaderboard() {
  const q = query(collection(db, "leaders"), orderBy("score","desc"), limit(10));
  onSnapshot(q, (snap) => {
    leaderboardBody.innerHTML = "";
    let rank = 1;
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${rank}</td><td>${escapeHtml(data.username||"Player")}</td><td>${data.score||0}</td>`;
      leaderboardBody.appendChild(tr);
      rank++;
    });
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// Initial paint
updateButtons(); updateScore();
