
// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA_AucFpYB9R7fhyCijbOjE3hbAKAy-O7U",
  authDomain: "times-table-ninja.firebaseapp.com",
  projectId: "times-table-ninja",
  storageBucket: "times-table-ninja.appspot.com",   // ✅ fixed
  messagingSenderId: "598819927594",
  appId: "1:598819927594:web:ddad18370cc348df70b553"
};

// ✅ Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

let questions = [];

// First 10: 2 × 1 to 2 × 12 (straight)
for (let i = 1; i <= 12; i++) {
  questions.push({ q: `2 × ${i}`, a: 2 * i });
}
let firstTen = questions.sort(() => 0.5 - Math.random()).slice(0, 10);

// Next 10: reversed operand (e.g., 1 × 2 to 12 × 2)
let reversed = [];
for (let i = 1; i <= 12; i++) {
  reversed.push({ q: `${i} × 2`, a: 2 * i });
}
let secondTen = reversed.sort(() => 0.5 - Math.random()).slice(0, 10);

// Final 10: division facts
let division = [];
for (let i = 1; i <= 12; i++) {
  division.push({ q: `${2 * i} ÷ 2`, a: i});
}
let finalTen = division.sort(() => 0.5 - Math.random()).slice(0, 10);

// Combine all
let allQuestions = [...firstTen, ...secondTen, ...finalTen];

let current = 0;
let score = 0;
let time = 90; // 90 seconds
let timer;
let timerStarted = false;
let userAnswers = [];
let username = "";

const qEl = document.getElementById("question");
const aEl = document.getElementById("answer");
const tEl = document.getElementById("timer");
const sEl = document.getElementById("score");

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

function showQuestion() {
  if (current < allQuestions.length) {
    qEl.textContent = allQuestions[current].q;
    aEl.value = "";
    aEl.focus();
  } else {
    endQuiz();
  }
}

function handleKey(e) {
  if (e.key === "Enter") {
    if (!timerStarted) {
      startTimer();
      timerStarted = true;
    }
    let userAns = parseInt(aEl.value);
    userAnswers.push(userAns);
    if (userAns === allQuestions[current].a) {
      score++;
    }
    current++;
    showQuestion();
  }
}

function startTimer() {
  timer = setInterval(() => {
    time--;
    let min = Math.floor(time / 60);
    let sec = time % 60;
    tEl.textContent = `Time left: ${min}:${sec < 10 ? "0" : ""}${sec}`;
    if (time <= 0) {
      clearInterval(timer);
      endQuiz();
    }
  }, 1000);
}

function endQuiz() {
  qEl.textContent = "";
  aEl.style.display = "none";
  tEl.style.display = "none";
  sEl.innerHTML = `${username}, you scored ${score}/30 <br><br>
                   <button onclick="showAnswers()" style="font-size:32px; padding:15px 40px;">Click to display answers</button>`;

  // ✅ Save to Firestore
  db.collection("scores").add({
    name: username,
    score: score,
    date: new Date().toISOString()
  })
  .then(() => console.log("Score saved"))
  .catch(err => console.error("Error saving score:", err));
}

function showAnswers() {
  let answersHTML = "<div style='display: flex; flex-wrap: wrap;'>";
  allQuestions.forEach((q, i) => {
    let userAns = userAnswers[i] !== undefined ? userAnswers[i] : "";
    let correct = userAns === q.a;
    let color = correct ? "green" : "red";
    answersHTML += `<div style='width: 30%; margin: 10px; font-size: 24px; color:${color}; font-weight:bold;'>
                      ${q.q} = ${userAns}
                    </div>`;
  });
  answersHTML += "</div>";
  sEl.innerHTML += answersHTML;
}
