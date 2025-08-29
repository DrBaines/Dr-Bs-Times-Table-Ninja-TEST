
let questions = [];
for (let i = 1; i <= 12; i++) {
  for (let j = 1; j <= 12; j++) {
    if (i === 2) questions.push({ q: `${i} × ${j}`, a: i * j });
  }
}
questions = questions.sort(() => 0.5 - Math.random()).slice(0, 50);

let quizContainer = document.getElementById("quiz");
questions.forEach((item, index) => {
  quizContainer.innerHTML += `<p>${index + 1}. ${item.q} = <input type="number" id="q${index}" /></p>`;
});

let time = 300;
let timerEl = document.getElementById("timer");
let timer = setInterval(() => {
  time--;
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  timerEl.textContent = `Time left: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  if (time <= 0) {
    clearInterval(timer);
    submitQuiz();
  }
}, 1000);

function submitQuiz() {
  clearInterval(timer);
  let score = 0;
  questions.forEach((item, index) => {
    let userAnswer = parseInt(document.getElementById(`q${index}`).value);
    if (userAnswer === item.a) score++;
  });
  document.getElementById("score").textContent = `You scored ${score}/50`;
}
