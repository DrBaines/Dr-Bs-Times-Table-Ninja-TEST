

let questions = [];
for (let i = 1; i <= 12; i++) {
  questions.push({ q: `2 × ${i}`, a: 2 * i });
}
questions = questions.sort(() => 0.5 - Math.random()).slice(0, 10);

let current = 0;
let score = 0;
let time = 60;
let timer;
let timerStarted = false;

const qEl = document.getElementById("question");
const aEl = document.getElementById("answer");
const tEl = document.getElementById("timer");
const sEl = document.getElementById("score");

function showQuestion() {
  if (current < questions.length) {
    qEl.textContent = questions[current].q;
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
    if (userAns === questions[current].a) {
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
  sEl.textContent = `You scored ${score}/10`;
}

showQuestion();
