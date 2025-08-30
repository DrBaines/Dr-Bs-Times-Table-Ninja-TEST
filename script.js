/******** Google Sheet endpoint (multi-device) ********/
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwx2FJ3l20bC0PxGVC-FdowN8V_uBjbpfFVWMxHZv3_4WUM509Bxbl6WEy5ftLhjSs_zA/exec"; // e.g., https://script.google.com/macros/s/.../exec
const SHEET_SECRET   = "Banstead123";   // must match SECRET in your Apps Script
/******************************************************/

/******** Google Sheet endpoint (multi-device) ********/
const SHEET_ENDPOINT = "PASTE_YOUR_WEB_APP_URL_HERE"; // e.g., https://script.google.com/macros/s/.../exec
const SHEET_SECRET   = "CHANGE_ME_TO_RANDOM_STRING";   // must match SECRET in Apps Script
/******************************************************/

/********* Offline/refresh-safe queue for submissions *********/
let pendingSubmissions = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");
let isFlushing = false;

function saveQueue_() {
  localStorage.setItem("pendingSubmissions", JSON.stringify(pendingSubmissions));
}
function queueSubmission(payload) {
  if (pendingSubmissions.some(p => p.id === payload.id)) return; // prevent duplicate queue entries
  pendingSubmissions.push(payload);
  saveQueue_();
}
async function flushQueue() {
  if (isFlushing) return;
  if (!pendingSubmissions.length) return;
  isFlushing = true;

  const remaining = [];
  for (const payload of pendingSubmissions) {
    try {
      await fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors", // CORS-safe (no preflight)
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      // success: drop it
    } catch (e) {
      remaining.push(payload); // keep to retry later
    }
  }
  pendingSubmissions = remaining;
  saveQueue_();
  isFlushing = false;
}
window.addEventListener("online", flushQueue);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") flushQueue();
});

/******************** QUIZ STATE ********************/
let selectedBase = null; // 2, 3, or 4
let allQuestions = [];
let current = 0;
let score = 0;
let time = 90;       // seconds
let timer = null;    // ensure we can clear it
let timerStarted = false;
let ended = false;   //  prevents double end
let userAnswers = [];
let username = "";

// Elements (exist on page load)
const qEl = document.getElementById("question");
const aEl = document.getElementById("answer");
const tEl = document.getElementById("timer");
const sEl = document.getElementById("score");

/******************** TABLE SELECTION ********************/
function selectTable(base) {
  selectedBase = base;
  [2,3,4].forEach(b => {
    const el = document.getElementById(`btn-${b}`);
    if (el) el.classList.toggle("selected", b === base);
  });
}

// Build 30 questions for chosen base (0..12 with reversed/division)
function buildQuestions(base) {
  const mul1 = []; for (let i = 0; i <= 12; i++) mul1.push({ q: `${base} × ${i}`, a: base * i });
  const mul2 = []; for (let i = 0; i <= 12; i++) mul2.push({ q: `${i} × ${base}`, a: base * i });
  const div  = []; for (let i = 0; i <= 12; i++) div.push({ q: `${base * i} ÷ ${base}`, a: i });

  const firstTen  = mul1.sort(() => 0.5 - Math.random()).slice(0, 10);
  const secondTen = mul2.sort(() => 0.5 - Math.random()).slice(0, 10);
  const finalTen  = div.sort(() => 0.5 - Math.random()).slice(0, 10);
  return [...firstTen, ...secondTen, ...finalTen];
}

/******************** QUIZ FLOW ********************/
function startQuiz() {
  username = document.getElementById("username").value.trim();
  if (!selectedBase) { alert("Please choose 2×, 3× or 4×."); return; }
  if (username === "") { alert("Please enter your name to begin."); return; }

  // Reset run state
  if (timer) { clearInterval(timer); timer = null; }
  time = 90;
  timerStarted = false;
  ended = false;              //  allow answering again
  score = 0;
  current = 0;
  userAnswers = [];
  tEl.textContent = "Time left: 1:30";

  // Build questions for this run
  allQuestions = buildQuestions(selectedBase);

  // Show UI
  document.getElementById("login-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("welcome-user").textContent = `Good luck, ${username}! Practising ${selectedBase}×`;

  // Ensure input is usable
  aEl.style.display = "inline-block";
  aEl.disabled = false;

  showQuestion();
}

function showQuestion() {
  if (current < allQuestions.length && !ended) {
    qEl.textContent = allQuestions[current].q;
    aEl.value = "";
    aEl.disabled = false;
    aEl.style.display = "inline-block";
    setTimeout(() => aEl.focus(), 0); // ensure focus
  } else {
    endQuiz();
  }
}

function handleKey(e) {
  if (e.key !== "Enter" || ended) return; // ignore when ended
  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }
  const raw = aEl.value.trim();
  const userAns = raw === "" ? NaN : parseInt(raw, 10);
  userAnswers.push(isNaN(userAns) ?
