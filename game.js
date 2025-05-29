const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let fruits = [];
let particles = [];
let swipes = [];
let score = 0;
const gravity = 0.2;
const swipeTrail = [];
const dangerNames = ['nair', 'crashout'];
let gameOver = false;

const characterNames = [
  'adendavid', 'adetola', 'bigbruh', 'crashout', 'drdappfa', 'enspire',
  'fide', 'harry', 'itzchi', 'KB', 'nair', 'pierre',
  'succinctduck', 'swilla', 'thisguy', 'zksybil'
];

const characterImages = {};
characterNames.forEach(name => {
  const img = new Image();
  img.src = `assets/${name}.png`;
  characterImages[name] = img;
});

document.getElementById('score').innerText = `Score: ${score}`;

function spawnFruit() {
  if (gameOver) return;
  const name = characterNames[Math.floor(Math.random() * characterNames.length)];
  const fruit = {
    x: Math.random() * (canvas.width - 100) + 50,
    y: canvas.height + 50,
    vx: (Math.random() - 0.5) * 6,
    vy: -Math.random() * 12 - 8,
    radius: 40,
    image: characterImages[name],
    color: getRandomColor(),
    sliced: false,
    name: name
  };
  fruits.push(fruit);
}

function getRandomColor() {
  const colors = ['pink', 'blue', 'green', 'orange', 'purple'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createJuiceParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 4 + 2,
      color,
      life: 40,
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
}

function drawSwipeTrail() {
  if (swipeTrail.length < 2) return;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  for (let i = 1; i < swipeTrail.length; i++) {
    const p1 = swipeTrail[i - 1];
    const p2 = swipeTrail[i];
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  }

  ctx.strokeStyle = 'rgba(255, 105, 180, 0.9)'; // vibrant pink
  ctx.lineWidth = 5;
  ctx.shadowColor = 'rgba(255, 105, 180, 0.6)';
  ctx.shadowBlur = 12;
  ctx.stroke();

  ctx.shadowBlur = 0;
}

// Swipe Handling
let isSwiping = false;

canvas.addEventListener('mousedown', (e) => {
  if (gameOver) return;
  isSwiping = true;
  swipeTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
});

canvas.addEventListener('mousemove', (e) => {
  if (isSwiping && !gameOver) {
    const point = { x: e.clientX, y: e.clientY, time: Date.now() };
    swipeTrail.push(point);
    if (swipeTrail.length > 15) swipeTrail.shift();
    checkSwipeHits();
  }
});

canvas.addEventListener('mouseup', () => {
  isSwiping = false;
  swipeTrail.length = 0;
});

function checkSwipeHits() {
  if (!isSwiping || swipeTrail.length < 2 || gameOver) return;

  for (let f of fruits) {
    if (f.sliced) continue;

    for (let i = 1; i < swipeTrail.length; i++) {
      const p1 = swipeTrail[i - 1];
      const p2 = swipeTrail[i];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) continue;

      if (lineCircleIntersect(p1, p2, f, f.radius * 0.85)) {
        f.sliced = true;

        if (dangerNames.includes(f.name)) {
          gameOver = true;
          setTimeout(showGameOver, 100);
        } else {
          score += 1;
          document.getElementById('score').innerText = `Score: ${score}`;
          createJuiceParticles(f.x, f.y, f.color);
        }
        break;
      }
    }
  }
}

function lineCircleIntersect(p1, p2, circle, radius) {
  const { x: cx, y: cy } = circle;

  const acx = cx - p1.x;
  const acy = cy - p1.y;
  const abx = p2.x - p1.x;
  const aby = p2.y - p1.y;
  const ab2 = abx * abx + aby * aby;
  const acab = acx * abx + acy * aby;
  let t = acab / ab2;

  t = Math.max(0, Math.min(1, t));
  const hx = p1.x + abx * t;
  const hy = p1.y + aby * t;

  const dx = cx - hx;
  const dy = cy - hy;
  return dx * dx + dy * dy <= radius * radius;
}

function updateFruits() {
  fruits.forEach(f => {
    f.x += f.vx;
    f.y += f.vy;
    f.vy += gravity;
  });
}

function drawFruits() {
  fruits.forEach(f => {
    if (!f.sliced && f.image.complete) {
      ctx.drawImage(f.image, f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);
    }
  });
}

function showGameOver() {
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.display = 'flex';
  } else {
    console.warn('Game over screen element not found.');
  }
}

function gameLoop() {
  if (gameOver) {
    showGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateFruits();
  updateParticles();
  drawFruits();
  drawParticles();
  drawSwipeTrail();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnFruit, 1000);
gameLoop();
