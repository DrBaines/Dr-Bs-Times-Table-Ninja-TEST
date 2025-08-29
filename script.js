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
        mode: "no-cors",                                 // CORS-safe
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // no preflight
        body: JSON.stringify(payload)
      });
      // success: drop it
    } catch (e) {
      // network failed: keep it to retry later
      remaining.push(payload);
    }
  }
  pendingSubmissions = remaining;
  localStorage.setItem("pendingSubmissions", JSON.stringify(pendingSubmissions));
  isFlushing = false;
}

// Try to flush whenever page becomes visible/online
window.addEventListener("online", flushQueue);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") flushQueue();
});

/******************** QUIZ LOGIC ********************/
let questions = [];

// First 10 pool: 2 × 0..12 (choose 10 random)
for (let i = 0; i <= 12; i++) {
  questions.push({ q: `2 × ${i}`, a: 2 * i });
}
let firstTen = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);

// Next 10 pool: 0..12 × 2 (choose 10 random)
let reversed = [];
for (let i = 0; i <= 12; i++) {
  reversed.push({ q: `${i} × 2`, a: 2 * i });
}
let secondTen = reversed.sort(() => 0.5 - Math.random()).slice(0, 10);

// Final 10 pool: division facts ( (2*i) ÷ 2 = i ), includes 0 ÷ 2 = 0
let division = [];
for (let i = 0; i <= 12; i++) {
  division.push({ q: `${2 * i} ÷ 2`, a: i });
}
let finalTen = division.sort(() => 0.5 - Math.random()).slice(0, 10);

// Combine all (30 questions total)
let allQuestions = [...firstTen, ...secondTen, ...finalTen];

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

// Start quiz from welcome screen
function startQuiz() {
  username = document.getElementById("username").value.trim();
  if (username === "") {
    alert("Please enter your name to begin.");
    return;
  }
  document.getElementById("login-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("welcome-user").textContent = `Good luck, ${username}!`;

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

// Finish -> show score, then POST to Google Sheet (queued for reliability)
function endQuiz() {
  qEl.textContent = "";
  aEl.style.display = "none";
  tEl.style.display = "none";

const asked = Math.min(current, allQuestions.length);
  const total = allQuestions.length;
  const isoDate = new Date().toISOString();

  // Unique id to prevent duplicates
  const submissionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const payload = {
    id: submissionId,
    secret: SHEET_SECRET,
    name: username,
    score: score,
    asked: asked,
    total: total,
    date: isoDate,
    device: navigator.userAgent
  };

  // Queue first so it isn't lost on refresh
  queueSubmission(payload);

  // Try to send now with a CORS-safe request; if it fails, it remains queued
  fetch(SHEET_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
    .then(() => flushQueue())
    .catch(() => { /* will retry later */ });
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

// Expose functions used by inline handlers
window.startQuiz = startQuiz;
window.handleKey = handleKey;
