let canvas, ctx;
let leftBank = [], rightBank = [], selected = [];
let torchOnLeft = true;
let startTime, timer = 0, timerInterval;
let sprites = [], gameCompleted = false;

const animalData = [
  { id: 1, name: "Rabbit", time: 1 },
  { id: 2, name: "Monkey", time: 2 },
  { id: 3, name: "Elephant", time: 5 },
  { id: 4, name: "Turtle", time: 10 }
];

function loadSprites() {
  return animalData.map(animal => {
    const img = new Image();
    img.src = `/static/images/animal_${animal.id}.png`;
    return img;
  });
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bridge plank
  ctx.fillStyle = "#654321";
  ctx.fillRect(400, 180, 200, 40);

  // Rope
  ctx.strokeStyle = "#aaaaaa";
  ctx.beginPath();
  ctx.moveTo(400, 180);
  ctx.lineTo(600, 180);
  ctx.stroke();

  // Torch glow
  const glowX = torchOnLeft ? 300 : 700;
  const gradient = ctx.createRadialGradient(glowX, 220, 20, glowX, 220, 100);
  gradient.addColorStop(0, "rgba(255, 200, 0, 0.7)");
  gradient.addColorStop(1, "rgba(255, 200, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Animals
  leftBank.forEach((a, i) => {
    ctx.drawImage(sprites[a.id - 1], 50 + i * 70, 250, 60, 60);
  });
  rightBank.forEach((a, i) => {
    ctx.drawImage(sprites[a.id - 1], 850 - i * 70, 50, 60, 60);
  });
}

function setupSelectors() {
  const panel = document.getElementById("animalSelectors");
  panel.innerHTML = "";
  animalData.forEach(animal => {
    const img = document.createElement("img");
    img.src = `/static/images/animal_${animal.id}.png`;
    img.dataset.id = animal.id;
    img.onclick = () => toggleAnimal(animal.id);
    panel.appendChild(img);
  });
}

function toggleAnimal(id) {
  const intId = parseInt(id);
  if (selected.includes(intId)) {
    selected = selected.filter(x => x !== intId);
  } else if (selected.length < 2) {
    selected.push(intId);
  }
  document.querySelectorAll("#animalSelectors img").forEach(img => {
    img.classList.toggle("selected", selected.includes(parseInt(img.dataset.id)));
  });
}

function startGame() {
  console.log('Game started');
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  sprites = loadSprites();
  leftBank = [...animalData];
  rightBank = [];
  selected = [];
  torchOnLeft = true;
  gameCompleted = false;
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("timer").innerText = "0";
  setupSelectors();
  drawScene();

  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    timer = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = timer;
  }, 1000);

  drawScene();
}

async function sendAnimals() {
  if (selected.length === 0 || selected.length > 2) {
    alert("Select 1 or 2 animals.");
    return;
  }

  const from = torchOnLeft ? leftBank : rightBank;
  const to = torchOnLeft ? rightBank : leftBank;
  const moving = from.filter(a => selected.includes(a.id));

  if (moving.length !== selected.length) {
    alert("Selected animals are not on this side!");
    return;
  }

  const moveTime = Math.max(...moving.map(a => a.time));
  timer += moveTime;
  document.getElementById("timer").innerText = timer;

  // Animate walk
  await animateWalk(moving, from === leftBank);
(id => {
    const idx = from.findIndex(a => a.id === id);
    if (idx >= 0) {
      to.push(from[idx]);
      from.splice(idx, 1);
    }
  });

  selected = [];
  torchOnLeft = !torchOnLeft;
  document.querySelectorAll("#animalSelectors img").forEach(img => {
    img.classList.remove("selected");
  });

  drawScene();

  if (rightBank.length === 4) {
    clearInterval(timerInterval);
    gameCompleted = true;
    document.getElementById("submitBtn").disabled = false;
    alert("🎉 All animals crossed successfully!");
  }
}

function submitScore() {
  if (!gameCompleted) return alert("Finish the puzzle first!");
  const name = document.getElementById("playerName").value.trim();
  if (!name) return alert("Please enter your name.");
  fetch("/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score: timer })
  }).then(r => r.text()).then(msg => alert(msg));
}

async function animateWalk(moving, isLeftToRight) {
  const startX = isLeftToRight ? 300 : 700;
  const endX = isLeftToRight ? 600 : 400;
  const steps = 30;
  for (let step = 0; step <= steps; step++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bridge
    ctx.fillStyle = "#654321";
    ctx.fillRect(400, 180, 200, 40);
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(400, 180);
    ctx.lineTo(600, 180);
    ctx.stroke();

    // Torch glow
    const midX = startX + ((endX - startX) * step) / steps;
    const gradient = ctx.createRadialGradient(midX, 220, 20, midX, 220, 100);
    gradient.addColorStop(0, "rgba(255, 200, 0, 0.7)");
    gradient.addColorStop(1, "rgba(255, 200, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Left & Right sides
    leftBank.forEach((a, i) => {
      ctx.drawImage(sprites[a.id - 1], 50 + i * 70, 250, 60, 60);
    });
    rightBank.forEach((a, i) => {
      ctx.drawImage(sprites[a.id - 1], 850 - i * 70, 50, 60, 60);
    });

    // Moving animals on bridge
    moving.forEach((a, i) => {
      const offset = i * 60;
      const x = midX + offset - (moving.length * 30);
      ctx.drawImage(sprites[a.id - 1], x, 180, 60, 60);
    });

    await new Promise(r => setTimeout(r, 40));
  }
}

function resetGame() {
  clearInterval(timerInterval);
  selected = [];
  startGame();  // Restart everything
}
