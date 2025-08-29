// ===================== Firebase (Compat) =====================
// Replace with your own config if different
const firebaseConfig = {
  apiKey: "AIzaSyA_AucFpYB9R7fhyCijbOjE3hbAKAy-O7U",
  authDomain: "times-table-ninja.firebaseapp.com",
  projectId: "times-table-ninja",
  storageBucket: "times-table-ninja.appspot.com",
  messagingSenderId: "598819927594",
  appId: "1:598819927594:web:ddad18370cc348df70b553"
};

// Namespaced compat init (works with the script tags in index.html)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// ===================== Quiz Logic =====================
let questions = [];

// First 10: 2 × 1..12 (random 10)
for (let i = 0; i <= 12; i++) {
  questions.push({ q: `2 × ${i}`, a: 2 * i });
}
let firstTen = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);

// Next 10: reversed operand i × 2 (random 10)
let reversed = [];
for (let i = 0; i <= 12; i++) {
  reversed.push({ q: `${i} × 2`, a: 2 * i });
}
let secondTen = reversed.sort(() => 0.5 - Math.random()).slice(0, 10);

// Final 10: division facts like '24 ÷ 12' (= 2).
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
    const userAns = parseInt(aEl.value);
    userAnswers.push(userAns);
    if (userAns === allQuestions[current].a) {
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

// Finish + save to Firestore
function endQuiz() {
  qEl.textContent = "";
  aEl.style.display = "none";
  tEl.style.display = "none";

  sEl.innerHTML = `${username}, you scored ${score}/30 <br><br>
    <button onclick="showAnswers()" style="font-size:32px; padding:15px 40px;">Click to display answers</button>`;

  // Save result (write-only; ensure your Firestore rules allow writes)
  db.collection("scores").add({
    name: username,
    score: score,
    date: new Date().toISOString()
  })
  .then(() => console.log("Score saved"))
  .catch(err => console.error("Error saving score:", err));
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
