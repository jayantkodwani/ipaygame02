let timer = 0;
let timerInterval = null;
let gameCompleted = false;
let startTime = null;

function startGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  document.getElementById("submitBtn").disabled = true;
  gameCompleted = false;
  timer = 0;
  document.getElementById("timer").innerText = timer;

  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    timer = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = timer;
  }, 1000);

  // Placeholder for animated animal
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "brown";
  ctx.fillRect(50, 200, 50, 50); // Simple "animal"
}

function submitScore() {
  if (!gameCompleted) {
    alert("Finish the puzzle first!");
    return;
  }

  const name = document.getElementById('playerName').value.trim();
  if (!name) {
    alert("Please enter your name.");
    return;
  }

  fetch('/submit-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: timer })
  })
  .then(res => res.text())
  .then(data => alert(data))
  .catch(err => alert("Error: " + err));
}