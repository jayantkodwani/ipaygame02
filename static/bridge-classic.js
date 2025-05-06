let canvas, ctx;
let allAnimals = [];
let leftSide = [], rightSide = [];
let selected = [];
let torchOnLeft = true;
let startTime, timer = 0, timerInterval;
let gameCompleted = false;

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

function drawTorchLight(x) {
  const gradient = ctx.createRadialGradient(x, 250, 10, x, 250, 100);
  gradient.addColorStop(0, "rgba(255, 200, 50, 0.8)");
  gradient.addColorStop(1, "rgba(255, 200, 50, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderAnimals(group, yOffset) {
  group.forEach((animal, i) => {
    ctx.drawImage(allAnimals[animal.id - 1], 50 + i * 80, yOffset, 60, 60);
  });
}

function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTorchLight(torchOnLeft ? 200 : 700);
  renderAnimals(leftSide, 180);
  renderAnimals(rightSide, 40);
}

function toggleAnimal(id) {
  const idx = selected.indexOf(id);
  if (idx >= 0) {
    selected.splice(idx, 1);
  } else if (selected.length < 2) {
    selected.push(id);
  }
  document.querySelectorAll(".animal").forEach(el => {
    el.classList.toggle("selected", selected.includes(parseInt(el.dataset.id)));
  });
}

function setupAnimalSelectors() {
  const container = document.getElementById("animalSelectors");
  container.innerHTML = "";
  animalData.forEach(animal => {
    const img = document.createElement("img");
    img.src = `/static/images/animal_${animal.id}.png`;
    img.className = "animal";
    img.dataset.id = animal.id;
    img.onclick = () => toggleAnimal(animal.id);
    img.width = 60;
    container.appendChild(img);
  });
}

function startGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  allAnimals = loadSprites();
  leftSide = [...animalData];
  rightSide = [];
  selected = [];
  torchOnLeft = true;
  gameCompleted = false;
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("timer").innerText = "0";
  setupAnimalSelectors();

  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    timer = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").innerText = timer;
  }, 1000);

  renderCanvas();
}

function sendAnimals() {
  if (selected.length === 0 || selected.length > 2) {
    alert("Select 1 or 2 animals to send.");
    return;
  }

  const group = torchOnLeft ? leftSide : rightSide;
  const destination = torchOnLeft ? rightSide : leftSide;

  const moving = group.filter(a => selected.includes(a.id));
  if (moving.length === 0) {
    alert("Selected animals are not on this side.");
    return;
  }
  if (moving.length !== selected.length) {
    alert("Some selected animals are not on the side with the torch.");
    return;
  }

  // Move animals
  selected.forEach(id => {
    const idx = group.findIndex(a => a.id === id);
    if (idx !== -1) {
      destination.push(group[idx]);
      group.splice(idx, 1);
    }
  });

  const moveTime = Math.max(...moving.map(a => a.time));
  timer += moveTime;
  document.getElementById("timer").innerText = timer;
  torchOnLeft = !torchOnLeft;
  selected = [];
  document.querySelectorAll(".animal").forEach(el => el.classList.remove("selected"));

  renderCanvas();

  if (rightSide.length === 4) {
    clearInterval(timerInterval);
    gameCompleted = true;
    document.getElementById("submitBtn").disabled = false;
    alert("🎉 All animals crossed the bridge!");
  }
}

function submitScore() {
  if (!gameCompleted) return alert("Finish the puzzle first!");
  const name = document.getElementById("playerName").value.trim();
  if (!name) return alert("Please enter your name.");
  fetch('/submit-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: timer })
  }).then(res => res.text()).then(msg => alert(msg));
}
