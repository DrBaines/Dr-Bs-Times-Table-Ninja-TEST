
let questions = [];
for (let i = 1; i <= 12; i++) {
  for (let j = 1; j <= 12; j++) {
    if (i === 2) questions.push({ q: `${i} × ${j}`, a: i * j });
  }
}
questions = questions.sort(() => 0.5 - Math.random()).slice(0, 50);

let currentQuestion = 0;
let score = 0;
let timerStarted = false;
let time = 300;
let timer;

let questionEl = document.getElementById("question");
let answerEl = document.getElementById("answer");
let timerEl = document.getElementById("timer");
let scoreEl = document.getElementById("score");

function showQuestion() {
  if (currentQuestion < questions.length) {
    questionEl.textContent = questions[currentQuestion].q;
    answerEl.value = '';
    answerEl.focus();
  } else {
    endQuiz();
  }
}

function handleKey(event) {
  if (event.key === "Enter") {
    if (!timerStarted) {
      startTimer();
      timerStarted = true;
    }
    submitAnswer();
  }
}

function submitAnswer() {
  let userAnswer = parseInt(answerEl.value);
  if (userAnswer === questions[currentQuestion].a) {
    score++;
  }
  currentQuestion++;
  showQuestion();
}

function startTimer() {
  timer = setInterval(() => {
    time--;
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    timerEl.textContent = `Time left: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    if (time <= 0) {
      clearInterval(timer);
      endQuiz();
    }
  }, 1000);
}

function endQuiz() {
  questionEl.textContent = "";
  answerEl.style.display = "none";
  timerEl.textContent = "";
  scoreEl.textContent = `You scored ${score}/${questions.length}`;
}

showQuestion();
