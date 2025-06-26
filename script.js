const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let animationFrameId;

const projectiles = []; // 発射される球を管理する配列

const player = {
  x: 50,
  y: canvas.height - 50,
  width: 100,
  height: 100,
  color: 'blue',
  speed: 3,
  dx: 0,
  dy: 0,
  gravity: 0.2,
  jumpPower: -7.5,
  isJumping: false,
  jumpCount: 0
};

const playerImage = new Image();
playerImage.src = 'tya-hannta-.png'; // 画像のパス

const obstacles = [];

const stages = [
  // Stage 1
  [
    { x: 200, y: canvas.height - 70, width: 50, height: 70, color: 'red' },
    { x: 400, y: canvas.height - 120, width: 50, height: 120, color: 'red' },
    { x: 600, y: canvas.height - 60, width: 80, height: 60, color: 'red' }
  ],
  // Stage 2
  [
    { x: 150, y: canvas.height - 50, width: 30, height: 50, color: 'red' },
    { x: 300, y: canvas.height - 100, width: 40, height: 100, color: 'red' },
    { x: 500, y: canvas.height - 70, width: 60, height: 70, color: 'red' },
    { x: 700, y: canvas.height - 90, width: 40, height: 90, color: 'red' }
  ],
  // Stage 3
  [
    { x: 250, y: canvas.height - 150, width: 50, height: 150, color: 'red' },
    { x: 450, y: canvas.height - 100, width: 70, height: 100, color: 'red' },
    { x: 650, y: canvas.height - 70, width: 40, height: 70, color: 'red' },
    { x: 720, y: canvas.height - 120, width: 30, height: 120, color: 'red' }
  ],
  // Stage 4 (Moving Obstacle)
  [
    { x: 200, y: canvas.height - 70, width: 50, height: 70, color: 'red', initialX: 200, moveRange: 150, moveSpeed: 1, direction: 1 },
    { x: 500, y: canvas.height - 100, width: 50, height: 100, color: 'red' }
  ],
  // Stage 5 (Two Moving Obstacles)
  [
    { x: 150, y: canvas.height - 80, width: 40, height: 80, color: 'red', initialX: 150, moveRange: 100, moveSpeed: 0.8, direction: 1 },
    { x: 400, y: canvas.height - 120, width: 60, height: 120, color: 'red', initialX: 400, moveRange: 200, moveSpeed: 1.2, direction: -1 },
    { x: 700, y: canvas.height - 60, width: 50, height: 60, color: 'red' }
  ],
  // Stage 6 (Shooting Obstacle - No Platforms)
  [
    { x: 200, y: canvas.height - 100, width: 50, height: 100, color: 'red' },
    { x: 400, y: canvas.height - 70, width: 50, height: 70, color: 'red' },
    { x: 600, y: canvas.height - 120, width: 50, height: 120, color: 'red' },
    { x: 800, y: canvas.height - 90, width: 50, height: 90, color: 'red', shootsProjectile: true, lastShotTime: 0, shotInterval: 2000, projectileSpeed: 2.0 }
  ]
];

let currentStageIndex = 0;

const goal = {
  x: canvas.width - 80,
  y: canvas.height - 80,
  width: 50,
  height: 80,
  color: 'green'
};

function loadStage(stageIndex) {
  if (stageIndex < stages.length) {
    obstacles.length = 0; // Clear existing obstacles
    stages[stageIndex].forEach(obstacle => obstacles.push(obstacle));
    player.x = 50; // Reset player position
    player.y = canvas.height - 50;
    player.dx = 0;
    player.dy = 0;
    player.isJumping = false;
    player.jumpCount = 0;
  } else {
    alert('All Stages Cleared! Restarting from Stage 1!');
    currentStageIndex = 0; // Reset to first stage
    loadStage(currentStageIndex);
  }
}

function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
  obstacles.forEach(obstacle => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

function drawGoal() {
  ctx.fillStyle = goal.color;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
}

function drawProjectiles() {
  projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
  player.x += player.dx;

  if (player.isJumping) {
    player.dy += player.gravity;
    player.y += player.dy;
  }

  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
    player.dy = 0;
    player.isJumping = false;
    player.jumpCount = 0;
  }
}

function checkCollisions() {
  // Obstacle collision
  obstacles.forEach(obstacle => {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      if (obstacle.isPlatform) {
        // If it's a platform and player is landing on it
        if (player.dy > 0 && player.y + player.height - player.dy <= obstacle.y) {
          player.y = obstacle.y - player.height;
          player.dy = 0;
          player.isJumping = false;
          player.jumpCount = 0;
          // Move player with platform
          if (obstacle.moveRangeY) {
            player.y += obstacle.moveSpeedY * obstacle.directionY;
          }
        }
      } else {
        // Collision detected with a regular obstacle, reset player position
        player.x = 50;
        player.y = canvas.height - 50;
      }
    }
  });

  // Projectile collision
  projectiles.forEach((p, index) => {
    if (
      player.x < p.x + p.radius &&
      player.x + player.width > p.x - p.radius &&
      player.y < p.y + p.radius &&
      player.y + player.height > p.y - p.radius
    ) {
      // Collision detected, reset player position and remove projectile
      player.x = 50;
      player.y = canvas.height - 50;
      projectiles.splice(index, 1);
    }
  });

  // Goal collision
  if (
    player.x < goal.x + goal.width &&
    player.x + player.width > goal.x &&
    player.y < goal.y + goal.height &&
    player.y + player.height > goal.y
  ) {
    // Goal reached, load next stage
    currentStageIndex++;
    loadStage(currentStageIndex);
  }
}

function update() {
  clear();
  drawPlayer();
  drawObstacles();
  drawGoal();
  drawProjectiles(); // Draw projectiles
  newPos();
  checkCollisions();

  // Update moving obstacles and platforms
  obstacles.forEach(obstacle => {
    if (obstacle.moveRange) {
      obstacle.x += obstacle.moveSpeed * obstacle.direction;
      if (obstacle.x > obstacle.initialX + obstacle.moveRange || obstacle.x < obstacle.initialX) {
        obstacle.direction *= -1; // Reverse horizontal direction
      }
    }
    if (obstacle.moveRangeY) {
      obstacle.y += obstacle.moveSpeedY * obstacle.directionY;
      if (obstacle.y > obstacle.initialY + obstacle.moveRangeY || obstacle.y < obstacle.initialY) {
        obstacle.directionY *= -1; // Reverse vertical direction
      }
    }

    // Shooting obstacle logic
    if (obstacle.shootsProjectile) {
      const currentTime = Date.now();
      if (currentTime - obstacle.lastShotTime > obstacle.shotInterval) {
        projectiles.push({
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2,
          radius: 5,
          color: 'purple',
          dx: -obstacle.projectileSpeed, // Use obstacle's specific projectile speed
          dy: 0
        });
        obstacle.lastShotTime = currentTime;
      }
    }
  });

  // Update projectile positions and remove out-of-bounds projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].x += projectiles[i].dx;
    if (projectiles[i].x < 0 || projectiles[i].x > canvas.width) {
      projectiles.splice(i, 1); // Remove if out of bounds
    }
  }

  animationFrameId = requestAnimationFrame(update);
}

function moveRight() {
  player.dx = player.speed;
}

function moveLeft() {
  player.dx = -player.speed;
}

function stop() {
  player.dx = 0;
}

function jump() {
  if (player.jumpCount < 3) {
    player.isJumping = true;
    player.dy = player.jumpPower;
    player.jumpCount++;
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    moveRight();
  } else if (e.key === 'ArrowLeft') {
    moveLeft();
  } else if (e.key === ' ' || e.key === 'ArrowUp') {
    jump();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    stop();
  }
});

loadStage(currentStageIndex);
update();