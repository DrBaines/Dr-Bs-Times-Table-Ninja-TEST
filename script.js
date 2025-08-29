/******** Google Sheet endpoint (multi-device) ********/
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwx2FJ3l20bC0PxGVC-FdowN8V_uBjbpfFVWMxHZv3_4WUM509Bxbl6WEy5ftLhjSs_zA/exec"; // e.g., https://script.google.com/macros/s/.../exec
const SHEET_SECRET   = "Banstead123";   // must match SECRET in your Apps Script
/******************************************************/

/********* Offline/refresh-safe queue for submissions *********/
let pendingSubmissions = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");
let isFlushing = false;

function queueSubmission(payload) {
  pendingSubmissions.push(payload);
  localStorage.setItem("pendingSubmissions", JSON.stringify(pendingSubmissions));
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
      // success → drop from queue
    } catch (e) {
      // network failed → keep it to retry later
      remaining.push(payload);
    }
  }
  pendingSubmissions = remaining;
  localStorage.setItem("pendingSubmissions", JSON.stringify(pendingSubmissions));
  isFlushing = false;
}

window.addEventListener("online", flushQueue);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") flushQueue();
});

/******************** QUIZ LOGIC ********************/
let selectedBase = null; // 2, 3, or 4
let allQuestions = [];
let current = 0;
let score = 0;
let time = 90; // seconds
let timer;
let timerStarted = false;
let userAnswers = [];
let username = "";

// Elements
const qEl = document.getElementById("question");
const aEl = document.getElementById("answer");
const tEl = document.getElementById("timer");
const sEl = document.getElementById("score");

// Table selection UI
function selectTable(base) {
  selectedBase = base;
  // Visual selection
  [2,3,4].forEach(b => {
    const el = document.getElementById(`btn-${b}`);
    if (el) el.classList.toggle("selected", b === base);
  });
}

// Build 30 questions for the chosen base
function buildQuestions(base) {
  // First 10 from base × (0..12), random 10
  const mul1 = [];
  for (let i = 0; i <= 12; i++) mul1.push({ q: `${base} × ${i}`, a: base * i });
  const firstTen = mul1.sort(() => 0.5 - Math.random()).slice(0, 10);

  // Next 10 from (0..12) × base, random 10
  const mul2 = [];
  for (let i = 0; i <= 12; i++) mul2.push({ q: `${i} × ${base}`, a: base * i });
  const secondTen = mul2.sort(() => 0.5 - Math.random()).slice(0, 10);

  // Final 10: division facts ((base*i) ÷ base = i), includes 0 ÷ base = 0
  const div = [];
  for (let i = 0; i <= 12; i++) div.push({ q: `${base * i} ÷ ${base}`, a: i });
  const finalTen = div.sort(() => 0.5 - Math.random()).slice(0, 10);

  return [...firstTen, ...secondTen, ...finalTen];
}

// Start quiz from welcome screen
function startQuiz() {
  username = document.getElementById("username").value.trim();
  if (!selectedBase) {
    alert("Please choose 2×, 3× or 4×.");
    return;
  }
  if (username === "") {
    alert("Please enter your name to begin.");
    return;
  }

  // Build the questions for the chosen base
  allQuestions = buildQuestions(selectedBase);

  // Reset run state
  current = 0;
  score = 0;
  time = 90;
  timerStarted = false;
  userAnswers = [];
  tEl.textContent = "Time left: 1:30";

  document.getElementById("login-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("welcome-user").textContent = `Good luck, ${username}! Practising ${selectedBase}×`;

  showQuestion();
}

// Render current question
function showQuestion() {
  if (current < allQuestions.length) {
    qEl.textContent = allQuestions[current].q;
    aEl.value = "";
    aEl.focus();
  } else {
    endQuiz();
  }
}

// Handle Enter key to submit an answer
function handleKey(e) {
  if (e.key === "Enter") {
    if (!timerStarted) {
      startTimer();
      timerStarted = true;
    }
    const raw = aEl.value.trim();
    const userAns = raw === "" ? NaN : parseInt(raw, 10); // empty -> incorrect
    userAnswers.push(isNaN(userAns) ? "" : userAns);

    if (!isNaN(userAns) && userAns === allQuestions[current].a) {
      score++;
    }
    current++;
    showQuestion();
  }
}

// Countdown
function startTimer() {
  timer = setInterval(() => {
    time--;
    const min = Math.floor(time / 60);
    const sec = time % 60;
    tEl.textContent = `Time left: ${min}:${sec < 10 ? "0" : ""}${sec}`;
    if (time <= 0) {
      clearInterval(timer);
      endQuiz();
    }
  }, 1000);
}

// Finish -> show score, then POST to Google Sheet via queue (CORS-safe)
function endQuiz() {
  qEl.textContent = "";
  aEl.style.display = "none";
  tEl.style.display = "none";

  const asked = Math.min(current, allQuestions.length);
  const total = allQuestions.length;
  const isoDate = new Date().toISOString();

  sEl.innerHTML = `${username}, you scored ${score}/${total} <br><br>
    <button onclick="showAnswers()" style="font-size:32px; padding:15px 40px;">Click to display answers</button>`;

  // Unique id to help server-side dedup (if you added that)
  const submissionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const payload = {
    id: submissionId,
    secret: SHEET_SECRET,
    table: `${selectedBase}x`,
    name: username,
    score: score,
    asked: asked,
    total: total,
    date: isoDate,
    device: navigator.userAgent
  };

  // Queue first so it isn't lost on refresh; only flushQueue() sends
  queueSubmission(payload);
  flushQueue();
}

// Show answers with green/red colouring for entire item
function showAnswers() {
  let answersHTML = "<div style='display:flex; flex-wrap:wrap; justify-content:center;'>";
  allQuestions.forEach((q, i) => {
    const userAns = userAnswers[i] !== undefined ? userAnswers[i] : "";
    const correct = userAns === q.a;
    const color = correct ? "green" : "red";
    answersHTML += `<div style="width: 30%; min-width:260px; margin:10px; font-size:24px; color:${color}; font-weight:bold;">
      ${q.q} = ${userAns}
    </div>`;
  });
  answersHTML += "</div>";
  sEl.innerHTML += answersHTML;
}

// Expose to HTML handlers
window.selectTable = selectTable;
window.startQuiz   = startQuiz;
window.handleKey   = handleKey;
