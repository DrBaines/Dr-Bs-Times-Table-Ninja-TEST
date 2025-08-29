/***************** CONFIG *****************/
const TEACHER_PASSWORD = "TEACHER123"; // change to your own
/******************************************/

// ===================== Quiz Logic =====================
let questions = [];

// First 10 pool: 2 × 0..12 (we'll take 10 random)
for (let i = 0; i <= 12; i++) {
  questions.push({ q: `2 × ${i}`, a: 2 * i });
}
let firstTen = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);

// Next 10 pool: 0..12 × 2 (10 random)
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

// Persisted results (survive refresh in this browser/session)
let results = JSON.parse(localStorage.getItem("quizResults") || "[]");

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

// Finish (save locally)
function endQuiz() {
  qEl.textContent = "";
  aEl.style.display = "none";
  tEl.style.display = "none";

  const asked = Math.min(current, allQuestions.length);
  const total = allQuestions.length;
  const isoDate = new Date().toISOString();

  sEl.innerHTML = `${username}, you scored ${score}/${total} <br><br>
    <button onclick="showAnswers()" style="font-size:32px; padding:15px 40px;">Click to display answers</button>`;

  // Save to local persistent store
  results.push({ name: username, score, asked, total, date: isoDate });
  localStorage.setItem("quizResults", JSON.stringify(results));
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

// ===================== Teacher Mode =====================
function openTeacher() {
  const pwd = prompt("Teacher password:");
  if (pwd !== TEACHER_PASSWORD) {
    if (pwd !== null) alert("Incorrect password.");
    return;
  }
  renderTeacherTable();
  document.getElementById("teacher-panel").style.display = "flex";
}

function closeTeacher() {
  document.getElementById("teacher-panel").style.display = "none";
}

function panelBackdropClose(e) {
  if (e.target && e.target.id === "teacher-panel") {
    closeTeacher();
  }
}

function renderTeacherTable() {
  const tbody = document.getElementById("teacher-tbody");
  const info  = document.getElementById("teacher-info");
  tbody.innerHTML = "";
  const data = JSON.parse(localStorage.getItem("quizResults") || "[]");

  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml_(r.name)}</td>
      <td>${r.score}</td>
      <td>${r.asked}</td>
      <td>${r.total}</td>
      <td>${escapeHtml_(r.date)}</td>`;
    tbody.appendChild(tr);
  });

  info.textContent = `${data.length} result${data.length === 1 ? "" : "s"} stored locally`;
}

function downloadCSV() {
  const data = JSON.parse(localStorage.getItem("quizResults") || "[]");
  let csv = "Name,Score,Asked,Total,Date\n";
  data.forEach(r => {
    const row = [
      csvQuote_(r.name),
      csvQuote_(r.score),
      csvQuote_(r.asked),
      csvQuote_(r.total),
      csvQuote_(r.date)
    ].join(",");
    csv += row + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scores.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearResults() {
  if (!confirm("Clear all locally saved results on this device?")) return;
  localStorage.removeItem("quizResults");
  renderTeacherTable();
}

// Helpers
function escapeHtml_(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function csvQuote_(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Expose functions used by inline handlers
window.startQuiz = startQuiz;
window.handleKey = handleKey;
window.openTeacher = openTeacher;
window.closeTeacher = closeTeacher;
window.panelBackdropClose = panelBackdropClose;
window.downloadCSV = downloadCSV;
window.clearResults = clearResults;
