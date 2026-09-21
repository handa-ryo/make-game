"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const hpBarInner = document.getElementById("hp-bar-inner");
const stageNumEl = document.getElementById("stage-num");
const scoreNumEl = document.getElementById("score-num");
const stageBanner = document.getElementById("stage-banner");
const bossHpWrap = document.getElementById("boss-hp-wrap");
const bossHpInner = document.getElementById("boss-hp-inner");

const startScreen = document.getElementById("start-screen");
const charSelectScreen = document.getElementById("char-select-screen");
const gameoverScreen = document.getElementById("gameover-screen");
const clearScreen = document.getElementById("clear-screen");
const gameoverDetail = document.getElementById("gameover-detail");
const clearDetail = document.getElementById("clear-detail");

// ---------- Bunchou (Java sparrow) character schemes ----------
const BIRD_SCHEMES = {
  sakura: {
    label: "桜文鳥",
    body: "#98a1b3",
    head: "#242427",
    cheek: "#faf6f0",
    beak: "#e2555a",
    eyeRing: "#e2555a",
  },
  white: {
    label: "白文鳥",
    body: "#f7f4ec",
    head: "#f7f4ec",
    cheek: null,
    beak: "#f0a98f",
    eyeRing: "#e2555a",
  },
  cinnamon: {
    label: "シナモン文鳥",
    body: "#c99a6b",
    head: "#a97748",
    cheek: "#fff6ea",
    beak: "#e2937a",
    eyeRing: "#e2555a",
  },
};
let selectedBird = "sakura";

function drawBunchou(g, scheme, scale) {
  g.save();
  g.scale(scale, scale);

  // tail
  g.fillStyle = scheme.head;
  g.beginPath();
  g.moveTo(-10, -4);
  g.lineTo(-21, 0);
  g.lineTo(-10, 4);
  g.closePath();
  g.fill();

  // body
  g.fillStyle = scheme.body;
  g.beginPath();
  g.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
  g.fill();

  // head
  g.fillStyle = scheme.head;
  g.beginPath();
  g.arc(9, -2, 8, 0, Math.PI * 2);
  g.fill();

  // cheek patch
  if (scheme.cheek) {
    g.fillStyle = scheme.cheek;
    g.beginPath();
    g.ellipse(10.5, 1, 4, 3.2, 0, 0, Math.PI * 2);
    g.fill();
  }

  // beak
  g.fillStyle = scheme.beak;
  g.beginPath();
  g.moveTo(16, -3.2);
  g.lineTo(22.5, 0);
  g.lineTo(16, 3.2);
  g.closePath();
  g.fill();

  // eye
  g.strokeStyle = scheme.eyeRing;
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(11.2, -4, 2.6, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#1a1a1a";
  g.beginPath();
  g.arc(11.2, -4, 1.2, 0, Math.PI * 2);
  g.fill();

  g.restore();
}

// ---------- Stage definitions ----------
// Each stage has waves (spawned as the previous wave's enemies clear), a
// sky gradient + ambient effect, an optional environmental hazard, and an
// optional boss that appears after the last wave.
const STAGES = [
  {
    name: "青空",
    theme: { sky: ["#8fd3ff", "#e6f7ff"], ambient: "clouds" },
    hazard: null,
    boss: false,
    waves: [
      { chasers: 3, shooters: 0 },
      { chasers: 4, shooters: 1 },
    ],
  },
  {
    name: "雨雲",
    theme: { sky: ["#5b6b7d", "#98a6b3"], ambient: "rain" },
    hazard: "raindrops",
    boss: false,
    waves: [
      { chasers: 4, shooters: 2 },
      { chasers: 5, shooters: 2 },
      { chasers: 3, shooters: 3, brutes: 1 },
    ],
  },
  {
    name: "夕焼け山脈",
    theme: { sky: ["#3b2350", "#ff8a5c"], ambient: "sunset" },
    hazard: null,
    boss: true,
    waves: [
      { chasers: 5, shooters: 3 },
      { chasers: 6, shooters: 3 },
    ],
  },
];

// ---------- Input ----------
const keys = new Set();
const mouse = { x: W / 2, y: H / 2, down: false };

window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * W;
  mouse.y = ((e.clientY - rect.top) / rect.height) * H;
});
canvas.addEventListener("mousedown", () => (mouse.down = true));
window.addEventListener("mouseup", () => (mouse.down = false));
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// ---------- Entities ----------
class Player {
  constructor(scheme) {
    this.scheme = scheme;
    this.x = W / 2;
    this.y = H / 2;
    this.r = 14;
    this.speed = 260;
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.fireCooldown = 0;
    this.fireRate = 0.14;
    this.invuln = 0;
  }

  update(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
    }
    this.x = clamp(this.x, this.r, W - this.r);
    this.y = clamp(this.y, this.r, H - this.r);

    this.fireCooldown -= dt;
    if (mouse.down && this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      const ang = Math.atan2(mouse.y - this.y, mouse.x - this.x);
      bullets.push(new Bullet(this.x, this.y, ang, 520, "player"));
      spawnMuzzle(this.x, this.y, ang);
    }
    if (this.invuln > 0) this.invuln -= dt;
  }

  hit(dmg) {
    if (this.invuln > 0) return;
    this.hp -= dmg;
    this.invuln = 0.5;
    shake = Math.min(shake + 6, 16);
    if (this.hp <= 0) {
      this.hp = 0;
      onGameOver();
    }
  }

  draw() {
    const ang = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    ctx.rotate(ang);
    drawBunchou(ctx, this.scheme, 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Bullet {
  constructor(x, y, angle, speed, owner) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.owner = owner;
    this.r = owner === "player" ? 4 : 5;
    this.dead = false;
    this.dmg = owner === "player" ? 10 : 8;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
      this.dead = true;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.owner === "player" ? "#fde68a" : "#f87171";
    ctx.shadowColor = this.owner === "player" ? "#fde68a" : "#f87171";
    ctx.shadowBlur = 8;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Enemy {
  constructor(type, x, y) {
    this.type = type; // "chaser" | "shooter" | "brute" | "boss"
    this.x = x;
    this.y = y;
    this.dead = false;
    this.fireCooldown = 1 + Math.random();
    this.isBoss = type === "boss";

    if (type === "chaser") {
      // dragonfly: fast, direct
      this.r = 11;
      this.speed = 100 + Math.random() * 25;
      this.hp = 20;
      this.maxHp = 20;
      this.color = "#2dd4bf";
      this.contactDmg = 12;
      this.score = 10;
      this.wingPhase = Math.random() * Math.PI * 2;
    } else if (type === "shooter") {
      // bee: keeps its distance and stings from range
      this.r = 12;
      this.speed = 60;
      this.hp = 26;
      this.maxHp = 26;
      this.color = "#fbbf24";
      this.contactDmg = 8;
      this.score = 20;
      this.preferredDist = 220;
    } else if (type === "brute") {
      // crow: tough, harasses in bad weather
      this.r = 19;
      this.speed = 58;
      this.hp = 90;
      this.maxHp = 90;
      this.color = "#374151";
      this.contactDmg = 20;
      this.score = 50;
    } else {
      // hawk boss
      this.r = 40;
      this.speed = 70;
      this.hp = 420;
      this.maxHp = 420;
      this.color = "#92400e";
      this.contactDmg = 22;
      this.score = 500;
      this.burstCooldown = 2.2;
      this.aimCooldown = 1.1;
      this.dir = 1;
      this.wingPhase = 0;
    }
  }

  update(dt, player) {
    const d = dist(this.x, this.y, player.x, player.y);
    const ang = Math.atan2(player.y - this.y, player.x - this.x);

    if (this.type === "shooter") {
      if (d > this.preferredDist + 20) {
        this.x += Math.cos(ang) * this.speed * dt;
        this.y += Math.sin(ang) * this.speed * dt;
      } else if (d < this.preferredDist - 20) {
        this.x -= Math.cos(ang) * this.speed * dt;
        this.y -= Math.sin(ang) * this.speed * dt;
      }
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && d < 500) {
        this.fireCooldown = 1.4 + Math.random() * 0.6;
        bullets.push(new Bullet(this.x, this.y, ang, 280, "enemy"));
      }
    } else if (this.type === "boss") {
      // patrols the upper sky, alternates aimed shots and radial bursts
      this.wingPhase += dt * 6;
      this.x += this.dir * this.speed * dt;
      if (this.x < 120 || this.x > W - 120) this.dir *= -1;
      this.y = 130 + Math.sin(performance.now() * 0.0012) * 18;

      this.aimCooldown -= dt;
      if (this.aimCooldown <= 0) {
        this.aimCooldown = 1.1;
        for (let i = -1; i <= 1; i++) {
          bullets.push(new Bullet(this.x, this.y, ang + i * 0.16, 260, "enemy"));
        }
      }
      this.burstCooldown -= dt;
      if (this.burstCooldown <= 0) {
        this.burstCooldown = 2.4;
        const n = 14;
        for (let i = 0; i < n; i++) {
          bullets.push(new Bullet(this.x, this.y, (i / n) * Math.PI * 2, 190, "enemy"));
        }
      }
    } else {
      // chaser (dragonfly) or brute (crow)
      if (this.type === "chaser") this.wingPhase += dt * 22;
      this.x += Math.cos(ang) * this.speed * dt;
      this.y += Math.sin(ang) * this.speed * dt;
    }

    this.x = clamp(this.x, this.r, W - this.r);
    this.y = clamp(this.y, this.r, H - this.r);

    if (d < this.r + player.r) {
      player.hit(this.contactDmg * dt * 4);
    }
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.dead = true;
      score += this.score;
      spawnExplosion(this.x, this.y, this.color, this.isBoss ? 50 : 16);
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;

    if (this.type === "chaser") {
      // dragonfly: diamond body + a pair of flickering wings
      const flap = Math.sin(this.wingPhase) * 0.5 + 0.5;
      ctx.strokeStyle = "rgba(220,255,250,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(-2, 0, this.r * 1.3, this.r * 0.5 * (0.4 + flap), Math.PI / 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-2, 0, this.r * 1.3, this.r * 0.5 * (0.4 + flap), -Math.PI / 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.r, 0);
      ctx.lineTo(0, -this.r * 0.55);
      ctx.lineTo(-this.r * 1.6, 0);
      ctx.lineTo(0, this.r * 0.55);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === "shooter") {
      // bee: round body with dark stripes
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(30,20,10,0.75)";
      ctx.fillRect(-this.r, -this.r * 0.35, this.r * 2, this.r * 0.28);
      ctx.fillRect(-this.r, this.r * 0.1, this.r * 2, this.r * 0.28);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.ellipse(2, -this.r - 2, this.r * 0.6, this.r * 0.35, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === "brute") {
      // crow: dark rounded body with a small beak
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(this.r * 0.7, -4);
      ctx.lineTo(this.r * 1.4, 0);
      ctx.lineTo(this.r * 0.7, 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // hawk boss: swept wings + body + hooked beak
      const flap = Math.sin(this.wingPhase) * 8;
      ctx.fillStyle = "#5c3317";
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-this.r * 1.6, -this.r * 0.9 - flap);
      ctx.lineTo(-this.r * 0.9, -this.r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-this.r * 1.6, this.r * 0.9 + flap);
      ctx.lineTo(-this.r * 0.9, this.r * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r * 0.85, this.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(this.r * 0.6, 0, this.r * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.moveTo(this.r * 0.95, -6);
      ctx.lineTo(this.r * 1.3, 0);
      ctx.lineTo(this.r * 0.95, 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // small hp bar for non-boss enemies (boss uses the HUD bar)
    if (!this.isBoss && this.hp < this.maxHp) {
      const w = this.r * 2;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(this.x - w / 2, this.y - this.r - 10, w, 4);
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(this.x - w / 2, this.y - this.r - 10, w * (this.hp / this.maxHp), 4);
    }
  }
}

// Wind-blown raindrop hazard: not part of the enemy roster (doesn't block
// wave/stage progression), just an environmental obstacle in the storm.
class Raindrop {
  constructor() {
    const margin = 40;
    this.x = Math.random() * (W + 200) - 100;
    this.y = -margin;
    const speed = 260 + Math.random() * 140;
    const windAngle = Math.PI / 2 + 0.35; // falling down and drifting sideways
    this.vx = Math.cos(windAngle) * speed;
    this.vy = Math.sin(windAngle) * speed;
    this.len = 14 + Math.random() * 10;
    this.r = 6;
    this.hp = 8;
    this.dead = false;
    this.contactDmg = 8;
  }
  update(dt, player) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x > W + 80 || this.y > H + 80) {
      this.dead = true;
    }
    if (dist(this.x, this.y, player.x, player.y) < this.r + player.r) {
      player.hit(this.contactDmg * dt * 4);
    }
  }
  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.dead = true;
      score += 3;
      spawnExplosion(this.x, this.y, "#bfe3ff", 6);
    }
  }
  draw() {
    const ang = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(ang);
    ctx.strokeStyle = "rgba(191, 227, 255, 0.85)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-this.len, 0);
    ctx.lineTo(this.len, 0);
    ctx.stroke();
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const ang = Math.random() * Math.PI * 2;
    const spd = 60 + Math.random() * 160;
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.life = 0.4 + Math.random() * 0.3;
    this.maxLife = this.life;
    this.color = color;
    this.r = 2 + Math.random() * 2;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life -= dt;
  }
  draw() {
    ctx.globalAlpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function spawnExplosion(x, y, color, count) {
  for (let i = 0; i < (count || 16); i++) particles.push(new Particle(x, y, color));
}
function spawnMuzzle(x, y, ang) {
  for (let i = 0; i < 3; i++) {
    const p = new Particle(x + Math.cos(ang) * 16, y + Math.sin(ang) * 16, "#fde68a");
    p.life = 0.12;
    p.maxLife = 0.12;
    particles.push(p);
  }
}

// ---------- Game state ----------
let player, bullets, enemies, hazards, particles, score, shake;
let stageIndex, waveIndex, waveTimer, running, spawning;
let bossSpawned, hazardTimer;

function spawnWave(wave) {
  const margin = 40;
  const edges = [];
  const count = (wave.chasers || 0) + (wave.shooters || 0) + (wave.brutes || 0);
  for (let i = 0; i < count; i++) {
    edges.push(Math.floor(Math.random() * 4));
  }
  const types = [];
  for (let i = 0; i < (wave.chasers || 0); i++) types.push("chaser");
  for (let i = 0; i < (wave.shooters || 0); i++) types.push("shooter");
  for (let i = 0; i < (wave.brutes || 0); i++) types.push("brute");

  types.forEach((type, i) => {
    const edge = edges[i];
    let x, y;
    if (edge === 0) { x = -margin; y = Math.random() * H; }
    else if (edge === 1) { x = W + margin; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = -margin; }
    else { x = Math.random() * W; y = H + margin; }
    enemies.push(new Enemy(type, x, y));
  });
}

function spawnBoss() {
  enemies.push(new Enemy("boss", W / 2, -60));
  showBanner("タカが現れた!", 1600);
  bossHpWrap.classList.add("visible");
}

function showBanner(text, ms) {
  stageBanner.textContent = text;
  stageBanner.style.transition = "none";
  stageBanner.style.opacity = "1";
  requestAnimationFrame(() => {
    stageBanner.style.transition = `opacity ${ms}ms ease`;
    setTimeout(() => (stageBanner.style.opacity = "0"), ms * 0.6);
  });
}

function startStage(idx) {
  stageIndex = idx;
  waveIndex = 0;
  bossSpawned = false;
  hazardTimer = 1.5;
  bossHpWrap.classList.remove("visible");
  stageNumEl.textContent = String(stageIndex + 1);
  showBanner(`STAGE ${stageIndex + 1} - ${STAGES[stageIndex].name}`, 1600);
  waveTimer = 1.0;
  spawning = true;
}

function resetGame() {
  player = new Player(BIRD_SCHEMES[selectedBird]);
  bullets = [];
  enemies = [];
  hazards = [];
  particles = [];
  score = 0;
  shake = 0;
  scoreNumEl.textContent = "0";
  startStage(0);
  running = true;
}

function onGameOver() {
  running = false;
  gameoverDetail.textContent = `ステージ ${stageIndex + 1} で撃破されました。スコア: ${score}`;
  gameoverScreen.classList.remove("hidden");
}

function onAllClear() {
  running = false;
  clearDetail.textContent = `全ステージクリア！ 最終スコア: ${score}`;
  clearScreen.classList.remove("hidden");
}

// ---------- Update / draw loop ----------
function update(dt) {
  player.update(dt);

  bullets.forEach((b) => b.update(dt));
  bullets = bullets.filter((b) => !b.dead);

  enemies.forEach((e) => e.update(dt, player));

  const stage = STAGES[stageIndex];
  if (stage.hazard === "raindrops") {
    hazardTimer -= dt;
    if (hazardTimer <= 0) {
      hazardTimer = 0.12 + Math.random() * 0.1;
      hazards.push(new Raindrop());
    }
  }
  hazards.forEach((h) => h.update(dt, player));

  // player bullets vs enemies
  for (const b of bullets) {
    if (b.owner !== "player") continue;
    for (const e of enemies) {
      if (e.dead) continue;
      if (dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
        e.hit(b.dmg);
        b.dead = true;
        break;
      }
    }
    if (b.dead) continue;
    for (const h of hazards) {
      if (h.dead) continue;
      if (dist(b.x, b.y, h.x, h.y) < b.r + h.r) {
        h.hit(b.dmg);
        b.dead = true;
        break;
      }
    }
  }
  // enemy bullets vs player
  for (const b of bullets) {
    if (b.owner !== "enemy") continue;
    if (dist(b.x, b.y, player.x, player.y) < b.r + player.r) {
      player.hit(b.dmg);
      b.dead = true;
    }
  }
  bullets = bullets.filter((b) => !b.dead);
  enemies = enemies.filter((e) => !e.dead);
  hazards = hazards.filter((h) => !h.dead);

  particles.forEach((p) => p.update(dt));
  particles = particles.filter((p) => p.life > 0);

  if (shake > 0) shake = Math.max(0, shake - dt * 40);

  // boss hp bar
  const boss = enemies.find((e) => e.isBoss);
  if (boss) {
    bossHpInner.style.width = `${clamp((boss.hp / boss.maxHp) * 100, 0, 100)}%`;
  }

  // wave / stage progression
  if (spawning) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      spawnWave(stage.waves[waveIndex]);
      spawning = false;
    }
  } else if (enemies.length === 0) {
    waveIndex++;
    if (waveIndex < stage.waves.length) {
      waveTimer = 1.2;
      spawning = true;
    } else if (stage.boss && !bossSpawned) {
      bossSpawned = true;
      spawnBoss();
    } else {
      bossHpWrap.classList.remove("visible");
      if (stageIndex + 1 < STAGES.length) {
        stageIndex++;
        startStage(stageIndex);
      } else {
        onAllClear();
      }
    }
  }

  hpBarInner.style.width = `${clamp((player.hp / player.maxHp) * 100, 0, 100)}%`;
  scoreNumEl.textContent = String(score);
}

function drawClouds() {
  const t = performance.now() * 0.015;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 7; i++) {
    const x = ((i * 160 + t * (0.6 + (i % 3) * 0.2)) % (W + 220)) - 110;
    const y = 60 + ((i * 83) % (H - 140));
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(x, y, 42, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 26, y - 8, 28, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 24, y - 4, 24, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRainAmbient() {
  const t = performance.now() * 0.001;
  ctx.strokeStyle = "rgba(220,235,255,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const seedX = (i * 53.7) % (W + 200) - 100;
    const speed = 400 + (i % 5) * 60;
    const y = (((i * 47) % H) + t * speed) % (H + 40) - 20;
    const x = seedX + y * 0.35;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y - 14);
    ctx.stroke();
  }
}

function drawSunsetAmbient() {
  const t = performance.now() * 0.008;
  ctx.fillStyle = "#ffd8a8";
  for (let i = 0; i < 5; i++) {
    const x = ((i * 200 + t * 0.4) % (W + 200)) - 100;
    const y = 50 + i * 40;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(x, y, 70, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(30,15,40,0.55)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 90);
  ctx.lineTo(120, H - 150);
  ctx.lineTo(230, H - 100);
  ctx.lineTo(360, H - 170);
  ctx.lineTo(480, H - 110);
  ctx.lineTo(620, H - 160);
  ctx.lineTo(760, H - 90);
  ctx.lineTo(W, H - 130);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function drawSkyBackground(theme) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.sky[0]);
  grad.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (theme.ambient === "clouds") drawClouds();
  else if (theme.ambient === "rain") drawRainAmbient();
  else if (theme.ambient === "sunset") drawSunsetAmbient();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  drawSkyBackground(STAGES[stageIndex].theme);

  hazards.forEach((h) => h.draw());
  particles.forEach((p) => p.draw());
  bullets.forEach((b) => b.draw());
  enemies.forEach((e) => e.draw());
  player.draw();

  ctx.restore();
}

let lastTime = 0;
function loop(t) {
  const dt = Math.min((t - lastTime) / 1000, 0.033);
  lastTime = t;
  if (running) {
    update(dt);
    draw();
  }
  requestAnimationFrame(loop);
}

// ---------- Character select ----------
const birdPicker = document.getElementById("bird-picker");
Object.keys(BIRD_SCHEMES).forEach((key) => {
  const scheme = BIRD_SCHEMES[key];
  const card = document.createElement("div");
  card.className = "bird-card" + (key === selectedBird ? " selected" : "");
  card.dataset.bird = key;

  const prevCanvas = document.createElement("canvas");
  prevCanvas.width = 64;
  prevCanvas.height = 64;
  const pctx = prevCanvas.getContext("2d");
  pctx.translate(24, 32);
  pctx.rotate(0);
  drawBunchou(pctx, scheme, 1.7);

  const label = document.createElement("span");
  label.textContent = scheme.label;

  card.appendChild(prevCanvas);
  card.appendChild(label);
  card.addEventListener("click", () => {
    selectedBird = key;
    document.querySelectorAll(".bird-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
  });
  birdPicker.appendChild(card);
});

// ---------- Screen wiring ----------
document.getElementById("start-btn").addEventListener("click", () => {
  startScreen.classList.add("hidden");
  charSelectScreen.classList.remove("hidden");
});
document.getElementById("confirm-bird-btn").addEventListener("click", () => {
  charSelectScreen.classList.add("hidden");
  resetGame();
});
document.getElementById("retry-btn").addEventListener("click", () => {
  gameoverScreen.classList.add("hidden");
  resetGame();
});
document.getElementById("restart-btn").addEventListener("click", () => {
  clearScreen.classList.add("hidden");
  charSelectScreen.classList.remove("hidden");
});

requestAnimationFrame(loop);
