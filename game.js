"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const heartsEl = document.getElementById("hearts");
const stageNumEl = document.getElementById("stage-num");
const scoreNumEl = document.getElementById("score-num");
const stageBanner = document.getElementById("stage-banner");
const progressWrap = document.getElementById("progress-wrap");
const progressLabel = document.getElementById("progress-label");
const progressInner = document.getElementById("progress-inner");
const levelLabelEl = document.getElementById("level-label");
const xpBarInner = document.getElementById("xp-bar-inner");

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

  g.fillStyle = scheme.head;
  g.beginPath();
  g.moveTo(-10, -4);
  g.lineTo(-21, 0);
  g.lineTo(-10, 4);
  g.closePath();
  g.fill();

  g.fillStyle = scheme.body;
  g.beginPath();
  g.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = scheme.head;
  g.beginPath();
  g.arc(9, -2, 8, 0, Math.PI * 2);
  g.fill();

  if (scheme.cheek) {
    g.fillStyle = scheme.cheek;
    g.beginPath();
    g.ellipse(10.5, 1, 4, 3.2, 0, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = scheme.beak;
  g.beginPath();
  g.moveTo(16, -3.2);
  g.lineTo(22.5, 0);
  g.lineTo(16, 3.2);
  g.closePath();
  g.fill();

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

function drawSparrow(g, scale) {
  g.save();
  g.scale(scale, scale);

  g.fillStyle = "#6b5638";
  g.beginPath();
  g.moveTo(-8, -3);
  g.lineTo(-16, 0);
  g.lineTo(-8, 3);
  g.closePath();
  g.fill();

  g.fillStyle = "#a9835a";
  g.beginPath();
  g.ellipse(0, 0, 10, 7.5, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#8b6b45";
  g.beginPath();
  g.arc(7, -1.5, 6, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "rgba(40,30,20,0.55)";
  g.beginPath();
  g.ellipse(8, 2, 3, 2, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#5b4636";
  g.beginPath();
  g.moveTo(12, -2.4);
  g.lineTo(17, 0);
  g.lineTo(12, 2.4);
  g.closePath();
  g.fill();

  g.fillStyle = "#1a1a1a";
  g.beginPath();
  g.arc(8.5, -3, 1, 0, Math.PI * 2);
  g.fill();

  g.restore();
}

function drawHawk(g, color, r, wingPhase) {
  const flap = Math.sin(wingPhase) * 8;
  g.fillStyle = "#5c3317";
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(-r * 1.6, -r * 0.9 - flap);
  g.lineTo(-r * 0.9, -r * 0.3);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(-r * 1.6, r * 0.9 + flap);
  g.lineTo(-r * 0.9, r * 0.3);
  g.closePath();
  g.fill();

  g.fillStyle = color;
  g.beginPath();
  g.ellipse(0, 0, r * 0.85, r * 0.6, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#78350f";
  g.beginPath();
  g.arc(r * 0.6, 0, r * 0.42, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#fde68a";
  g.beginPath();
  g.moveTo(r * 0.95, -6);
  g.lineTo(r * 1.3, 0);
  g.lineTo(r * 0.95, 6);
  g.closePath();
  g.fill();
}

// ---------- Stage definitions ----------
// Side-scrolling: the world drifts left at scrollSpeed; reaching `distance`
// clears the stage. `spawns` gives [min,max] seconds between hazard spawns;
// omitting a hazard key (e.g. hail on stages 1-2) disables it entirely.
const STAGES = [
  {
    name: "青空",
    theme: { sky: ["#8fd3ff", "#e6f7ff"], ambient: "clouds" },
    scrollSpeed: 95,
    distance: 2600,
    hideoutStyle: "cloud",
    hawk: false,
    spawns: { wind: [4.5, 6.5], debris: [2.4, 3.6], crow: [5.5, 7.5], hideout: [1.8, 2.8], food: [2.6, 4] },
  },
  {
    name: "雨雲",
    theme: { sky: ["#5b6b7d", "#98a6b3"], ambient: "rain" },
    scrollSpeed: 108,
    distance: 3000,
    hideoutStyle: "cloud",
    hawk: false,
    spawns: { wind: [4, 6], debris: [2.1, 3.2], crow: [4.5, 6.5], hideout: [1.6, 2.6], food: [2.6, 4] },
  },
  {
    name: "夕焼け山脈",
    theme: { sky: ["#3b2350", "#ff8a5c"], ambient: "sunset" },
    scrollSpeed: 118,
    distance: 3400,
    hideoutStyle: "leaf",
    hawk: true,
    spawns: {
      wind: [3.6, 5.4],
      debris: [2, 3],
      hail: [1.8, 2.8],
      crow: [4, 6],
      hideout: [1.5, 2.4],
      food: [2.6, 4],
    },
  },
];

function rand(range) {
  return range[0] + Math.random() * (range[1] - range[0]);
}

// ---------- Leveling: food -> XP -> new avoidance techniques ----------
const LEVEL_UPS = [
  { threshold: 50, label: "Lv.2 わかどり", msg: "威嚇の間合いが広がった!", apply: (p) => (p.shooRadius = 170) },
  { threshold: 140, label: "Lv.3 はばたきどり", msg: "強い風にも負けなくなった!", apply: (p) => (p.windResist = 0.5) },
  { threshold: 280, label: "Lv.4 エースバード", msg: "とっさのかわし技をおぼえた!", apply: (p) => (p.dashUnlocked = true) },
];

// ---------- Input ----------
const keys = new Set();
window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
function mod(n, m) {
  return ((n % m) + m) % m;
}

// ---------- Entities ----------
class Player {
  constructor(scheme) {
    this.scheme = scheme;
    this.x = 200;
    this.y = H / 2;
    this.r = 14;
    this.xMin = 60;
    this.xMax = 560;
    this.followX = 420;
    this.frameScroll = 0;
    this.yMin = 50;
    this.yMax = 550;
    this.baseSpeed = 240;
    this.maxHearts = 5;
    this.hearts = this.maxHearts;
    this.invuln = 0;
    this.hidden = false;
    this.vy = 0;
    this.level = 1;
    this.xp = 0;
    this.shooRadius = 120;
    this.shooCooldownMax = 2.2;
    this.shooCooldown = 0;
    this.windResist = 1;
    this.dashUnlocked = false;
    this.dashCooldownMax = 3.5;
    this.dashCooldown = 0;
    this.dashTimer = 0;
  }

  gainXp(amount) {
    this.xp += amount;
    while (this.level - 1 < LEVEL_UPS.length && this.xp >= LEVEL_UPS[this.level - 1].threshold) {
      const lv = LEVEL_UPS[this.level - 1];
      lv.apply(this);
      this.level++;
      showBanner(`${lv.label} — ${lv.msg}`, 1800);
      spawnExplosion(this.x, this.y, "#fde68a", 20);
    }
  }

  update(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;
    this.vy = dy;

    let spd = this.baseSpeed;
    if (this.dashTimer > 0) spd *= 2.6;
    let moveX = 0;
    let moveY = 0;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      moveX = (dx / len) * spd * dt;
      moveY = (dy / len) * spd * dt;
    }
    this.y = clamp(this.y + moveY, this.yMin, this.yMax);

    // Pushing right past the follow line advances the world itself — the
    // bunchou's own forward flight is what moves the story along, not a
    // timer. Stop flying forward and the scenery (and story) stop too.
    let newX = this.x + moveX;
    this.frameScroll = 0;
    if (newX > this.followX) {
      this.frameScroll = newX - this.followX;
      newX = this.followX;
    }
    this.x = clamp(newX, this.xMin, this.followX);

    this.shooCooldown -= dt;
    if (keys.has(" ") && this.shooCooldown <= 0) {
      this.shooCooldown = this.shooCooldownMax;
      doShoo(this.x, this.y, this.shooRadius);
    }

    this.dashCooldown -= dt;
    if (this.dashUnlocked && keys.has("shift") && this.dashCooldown <= 0) {
      this.dashCooldown = this.dashCooldownMax;
      this.dashTimer = 0.25;
      this.invuln = Math.max(this.invuln, 0.35);
    }
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.invuln > 0) this.invuln -= dt;
  }

  hit(amount, kbx, kby, strong) {
    if (this.invuln > 0) return;
    this.hearts -= amount;
    this.invuln = strong ? 1.2 : 0.9;
    shake = Math.min(shake + (strong ? 10 : 6), 18);
    const klen = Math.hypot(kbx, kby) || 1;
    const kb = strong ? 110 : 50;
    this.x = clamp(this.x + (kbx / klen) * kb, this.xMin, this.xMax);
    this.y = clamp(this.y + (kby / klen) * kb, this.yMin, this.yMax);
    if (this.hearts <= 0) {
      this.hearts = 0;
      onGameOver();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    } else if (this.hidden) {
      ctx.globalAlpha = 0.5;
    }
    const bank = clamp(this.vy * 0.35, -0.35, 0.35);
    ctx.rotate(bank);
    drawBunchou(ctx, this.scheme, 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

// Wild sparrow: wanders until the player flies close, then becomes a
// permanent companion (max one) that trails the player and, once it sees a
// crow actively chasing, helps shoo it away.
class Sparrow {
  constructor() {
    this.x = 120 + Math.random() * (W - 240);
    this.y = 120 + Math.random() * (H - 240);
    this.r = 9;
    this.state = "wild";
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.shooCooldown = 0;
  }
  update(dt, player, crows) {
    if (this.state === "wild") {
      this.wanderAngle += (Math.random() - 0.5) * 2 * dt;
      this.x += Math.cos(this.wanderAngle) * 45 * dt;
      this.y += Math.sin(this.wanderAngle) * 45 * dt;
      this.x = clamp(this.x, 40, W - 40);
      this.y = clamp(this.y, 40, H - 40);
      if (dist(this.x, this.y, player.x, player.y) < this.r + player.r + 10) {
        this.state = "companion";
        showBanner("スズメと なかまに なった!", 1800);
      }
      return;
    }

    const targetX = player.x - 26;
    const targetY = player.y - 6;
    this.x += (targetX - this.x) * Math.min(1, dt * 5);
    this.y += (targetY - this.y) * Math.min(1, dt * 5);

    this.shooCooldown -= dt;
    if (this.shooCooldown <= 0) {
      for (const c of crows) {
        if (c.dead || c.state !== "chase") continue;
        if (dist(this.x, this.y, c.x, c.y) < 160) {
          c.shoo();
          this.shooCooldown = 2.5;
          shooRings.push(new ShooRing(this.x, this.y));
          break;
        }
      }
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    drawSparrow(ctx, this.state === "companion" ? 0.9 : 0.8);
    ctx.restore();
  }
}

// Wind gust: a wide translucent band drifting left. No damage, just a
// steady push while the player is inside it — dodge it or steer through.
class WindGust {
  constructor() {
    this.x = W + 100;
    this.bandY = 60 + Math.random() * (H - 260);
    this.bandH = 150;
    this.width = 170;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.pushStrength = 120;
    this.dead = false;
  }
  update(dt, player, scroll) {
    this.x -= scroll;
    if (this.x < -this.width - 60) this.dead = true;
    if (
      player.x > this.x - this.width / 2 &&
      player.x < this.x + this.width / 2 &&
      player.y > this.bandY &&
      player.y < this.bandY + this.bandH
    ) {
      const push = this.pushStrength * player.windResist;
      player.y = clamp(player.y + this.dir * push * dt, player.yMin, player.yMax);
    }
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(this.x - this.width / 2, this.bandY, this.width, this.bandH);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#bfe3ff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const cy = this.bandY + (this.bandH * (i + 0.5)) / 3;
      const yOff = this.dir * 9;
      ctx.beginPath();
      ctx.moveTo(this.x - this.width / 2 + 10, cy);
      ctx.lineTo(this.x, cy + yOff);
      ctx.lineTo(this.x + this.width / 2 - 10, cy);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Flying debris: leaves / twigs / a stray bag drifting in on a light sine
// wave. A single touch costs a heart and the debris disperses.
class Debris {
  constructor(windSpeed) {
    const kinds = ["leaf", "twig", "bag"];
    this.kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.x = W + 40;
    this.baseY = 60 + Math.random() * (H - 120);
    this.y = this.baseY;
    this.selfSpeed = windSpeed * 0.5 + 40 + Math.random() * 40;
    this.amp = 20 + Math.random() * 30;
    this.freq = 1.5 + Math.random();
    this.t = Math.random() * 10;
    this.r = 12;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 3;
    this.dead = false;
  }
  update(dt, player, scroll) {
    this.t += dt;
    this.x -= scroll + this.selfSpeed * dt;
    this.y = this.baseY + Math.sin(this.t * this.freq) * this.amp;
    this.rot += this.rotSpeed * dt;
    if (this.x < -60) this.dead = true;
    if (dist(this.x, this.y, player.x, player.y) < this.r + player.r) {
      player.hit(1, player.x - this.x, player.y - this.y, false);
      this.dead = true;
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.kind === "leaf") {
      ctx.fillStyle = "#65a30d";
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r, this.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3f6212";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-this.r, 0);
      ctx.lineTo(this.r, 0);
      ctx.stroke();
    } else if (this.kind === "twig") {
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-this.r, -4);
      ctx.lineTo(this.r, 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.strokeStyle = "rgba(148,163,184,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r, this.r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Hailstone hazard for the mountain stage: falls in on a diagonal, blown
// by the same wind as everything else.
class Hail {
  constructor() {
    this.x = W + 40 + Math.random() * 100;
    this.y = -30;
    this.vy = 260 + Math.random() * 90;
    this.r = 8 + Math.random() * 5;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 4;
    this.dead = false;
  }
  update(dt, player, scroll) {
    this.x -= scroll * 0.6;
    this.y += this.vy * dt;
    this.rot += this.rotSpeed * dt;
    if (this.y > H + 60 || this.x < -60) this.dead = true;
    if (dist(this.x, this.y, player.x, player.y) < this.r + player.r) {
      player.hit(1, player.x - this.x, player.y - this.y, false);
      this.dead = true;
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = "#e2f3ff";
    ctx.strokeStyle = "#9fc9e8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const spikes = 6;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const rr = this.r * (0.8 + ((i * 23) % 10) / 30);
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Hideout: a big soft cloud/leaf cluster/rock overhang the player can duck
// into. While overlapping, crows can't spot them.
class Hideout {
  constructor(style) {
    this.style = style;
    this.kind =
      style === "cloud"
        ? Math.random() < 0.5
          ? "puffy"
          : "wispy"
        : Math.random() < 0.5
        ? "leafCluster"
        : "rockOverhang";
    this.x = W + 120;
    this.y = 60 + Math.random() * (H - 160);
    this.r = 80 + Math.random() * 30;
    this.dead = false;
  }
  update(dt, scroll) {
    this.x -= scroll * 0.65;
    if (this.x < -this.r - 100) this.dead = true;
  }
  contains(player) {
    return dist(this.x, this.y, player.x, player.y) < this.r * 0.85;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    if (this.kind === "puffy") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r, this.r * 0.62, 0, 0, Math.PI * 2);
      ctx.ellipse(this.x + this.r * 0.5, this.y - this.r * 0.2, this.r * 0.6, this.r * 0.42, 0, 0, Math.PI * 2);
      ctx.ellipse(this.x - this.r * 0.5, this.y + this.r * 0.1, this.r * 0.55, this.r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === "wispy") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 1.3, this.r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(this.x - this.r * 0.5, this.y - this.r * 0.15, this.r * 0.8, this.r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === "leafCluster") {
      ctx.fillStyle = "#2f6e3a";
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rr = this.r * (0.8 + ((i * 31) % 10) / 30);
        const px = this.x + Math.cos(a) * rr;
        const py = this.y + Math.sin(a) * rr * 0.75;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#6b625c";
      ctx.beginPath();
      ctx.moveTo(this.x - this.r, this.y + this.r * 0.5);
      ctx.lineTo(this.x - this.r * 0.6, this.y - this.r * 0.6);
      ctx.lineTo(this.x - this.r * 0.1, this.y - this.r * 0.2);
      ctx.lineTo(this.x + this.r * 0.4, this.y - this.r * 0.75);
      ctx.lineTo(this.x + this.r, this.y - this.r * 0.1);
      ctx.lineTo(this.x + this.r * 0.7, this.y + this.r * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

// Food: 粟玉/木の実/フルーツ drifting in from the right. Collecting one
// grants XP toward the player's next level and technique.
const FOOD_KINDS = [
  { type: "awadama", xp: 10, color: "#fde68a", r: 5, weight: 0.55 },
  { type: "nut", xp: 18, color: "#b8895f", r: 6, weight: 0.3 },
  { type: "fruit", xp: 28, color: "#f87171", r: 7, weight: 0.15 },
];

class Food {
  constructor() {
    const roll = Math.random();
    let acc = 0;
    let kind = FOOD_KINDS[0];
    for (const k of FOOD_KINDS) {
      acc += k.weight;
      if (roll <= acc) {
        kind = k;
        break;
      }
    }
    this.type = kind.type;
    this.xp = kind.xp;
    this.color = kind.color;
    this.r = kind.r;
    this.x = W + 40;
    this.y = 60 + Math.random() * (H - 120);
    this.bob = Math.random() * Math.PI * 2;
    this.dead = false;
  }
  update(dt, player, scroll) {
    this.x -= scroll;
    this.bob += dt * 3;
    if (this.x < -40) this.dead = true;
    if (dist(this.x, this.y, player.x, player.y) < this.r + player.r + 4) {
      this.dead = true;
      player.gainXp(this.xp);
      spawnExplosion(this.x, this.y, this.color, 8);
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y + Math.sin(this.bob) * 2, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Crow: perches/patrols in place (drifting by with the world) until the
// player gets close and is not hidden, then chases for a bit. A shoo
// (player Space, or the companion's auto-shoo) sends it back to patrol.
class Crow {
  constructor() {
    this.x = W + 40;
    this.y = 60 + Math.random() * (H - 140);
    this.homeY = this.y;
    this.r = 15;
    this.state = "patrol";
    this.alertT = 0;
    this.immuneT = 0;
    this.wingPhase = Math.random() * 10;
    this.t = Math.random() * 10;
    this.dead = false;
  }
  update(dt, player, scroll) {
    this.wingPhase += dt * 8;
    this.t += dt;
    if (this.immuneT > 0) this.immuneT -= dt;

    if (this.state === "patrol") {
      this.x -= scroll;
      this.y = this.homeY + Math.sin(this.t * 1.3) * 18;
      if (!player.hidden && this.immuneT <= 0) {
        if (dist(this.x, this.y, player.x, player.y) < 200) {
          this.state = "alert";
          this.alertT = 0.5;
        }
      }
      if (this.x < -60) this.dead = true;
    } else if (this.state === "alert") {
      this.alertT -= dt;
      this.x -= scroll * 0.3;
      if (player.hidden) this.state = "patrol";
      else if (this.alertT <= 0) this.state = "chase";
    } else if (this.state === "chase") {
      const ang = Math.atan2(player.y - this.y, player.x - this.x);
      const speed = 150;
      this.x += Math.cos(ang) * speed * dt;
      this.y += Math.sin(ang) * speed * dt;
      const d = dist(this.x, this.y, player.x, player.y);
      if (player.hidden || d > 340) {
        this.state = "patrol";
        this.homeY = this.y;
      } else if (d < this.r + player.r) {
        player.hit(1, player.x - this.x, player.y - this.y, false);
        this.state = "patrol";
        this.homeY = this.y;
        this.immuneT = 1.5;
      }
    }
  }
  shoo() {
    this.state = "patrol";
    this.homeY = this.y;
    this.immuneT = 2;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#374151";
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
    ctx.restore();
    if (this.state === "alert") {
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", this.x, this.y - this.r - 8);
    }
  }
}

// Hawk: the un-shooable climax hazard on the mountain stage's home stretch.
// It hovers, telegraphs a dive at the player's current lane, then swoops
// through — dodge it, don't fight it.
class Hawk {
  constructor() {
    this.homeX = W - 140;
    this.homeY = 110;
    this.x = this.homeX;
    this.y = this.homeY;
    this.r = 32;
    this.state = "hover";
    this.cooldown = 1.6;
    this.telegraph = 0;
    this.targetY = this.y;
    this.diveVX = 0;
    this.diveVY = 0;
    this.wingPhase = 0;
  }
  update(dt, player) {
    this.wingPhase += dt * 5;
    if (this.state === "hover") {
      this.y = this.homeY + Math.sin(performance.now() * 0.001) * 16;
      this.x += (this.homeX - this.x) * Math.min(1, dt * 1.5);
      this.cooldown -= dt;
      if (this.cooldown <= 0) {
        this.state = "telegraph";
        this.telegraph = 0.7;
        this.targetY = player.y;
      }
    } else if (this.state === "telegraph") {
      this.telegraph -= dt;
      if (this.telegraph <= 0) {
        this.state = "dive";
        const ang = Math.atan2(this.targetY - this.y, 120 - this.x);
        const speed = 620;
        this.diveVX = Math.cos(ang) * speed;
        this.diveVY = Math.sin(ang) * speed;
      }
    } else if (this.state === "dive") {
      this.x += this.diveVX * dt;
      this.y += this.diveVY * dt;
      if (this.x < -80 || this.x > W + 80 || this.y < -80 || this.y > H + 80) {
        this.state = "reposition";
      }
    } else if (this.state === "reposition") {
      this.x += (this.homeX - this.x) * Math.min(1, dt * 2);
      this.y += (this.homeY - this.y) * Math.min(1, dt * 2);
      if (dist(this.x, this.y, this.homeX, this.homeY) < 12) {
        this.state = "hover";
        this.cooldown = 2 + Math.random() * 0.8;
      }
    }

    if (dist(this.x, this.y, player.x, player.y) < this.r + player.r) {
      player.hit(1, player.x - this.x, player.y - this.y, true);
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.state === "dive") {
      const ang = Math.atan2(this.diveVY, this.diveVX);
      ctx.rotate(ang);
    }
    drawHawk(ctx, "#92400e", this.r, this.wingPhase);
    ctx.restore();

    if (this.state === "telegraph") {
      ctx.save();
      ctx.strokeStyle = "rgba(220,38,38,0.7)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(120, this.targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", this.x, this.y - this.r - 10);
      ctx.restore();
    }
  }
}

class ShooRing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 10;
    this.life = 0.4;
    this.maxLife = 0.4;
    this.dead = false;
  }
  update(dt) {
    this.r += 260 * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw() {
    ctx.globalAlpha = clamp(this.life / this.maxLife, 0, 1) * 0.7;
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function doShoo(x, y, radius) {
  for (const c of crows) {
    if (c.dead) continue;
    if (dist(x, y, c.x, c.y) < radius) c.shoo();
  }
  shooRings.push(new ShooRing(x, y));
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

// ---------- Game state ----------
let player, sparrow, hazards, crows, hideouts, foods, particles, shooRings, hawk;
let stageIndex, distance, score, shake, running;
let windTimer, debrisTimer, hailTimer, crowTimer, hideoutTimer, foodTimer;

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
  distance = 0;
  hazards = [];
  crows = [];
  hideouts = [];
  foods = [];
  hawk = null;

  const st = STAGES[idx];
  windTimer = rand(st.spawns.wind);
  debrisTimer = rand(st.spawns.debris);
  hailTimer = st.spawns.hail ? rand(st.spawns.hail) : Infinity;
  crowTimer = rand(st.spawns.crow);
  hideoutTimer = rand(st.spawns.hideout);
  foodTimer = rand(st.spawns.food);

  stageNumEl.textContent = String(idx + 1);
  progressLabel.textContent = st.name;
  showBanner(`STAGE ${idx + 1} - ${st.name}`, 1600);
}

function resetGame() {
  player = new Player(BIRD_SCHEMES[selectedBird]);
  sparrow = new Sparrow();
  particles = [];
  shooRings = [];
  score = 0;
  shake = 0;
  scoreNumEl.textContent = "0";
  startStage(0);
  running = true;
}

function onGameOver() {
  running = false;
  gameoverDetail.textContent = `ステージ ${stageIndex + 1} で力尽きてしまった。飼い主のもとには帰れなかった…… スコア: ${Math.floor(score)}`;
  gameoverScreen.classList.remove("hidden");
}

function onAllClear() {
  running = false;
  const companionNote = sparrow.state === "companion" ? "スズメの相棒と一緒に、" : "";
  clearDetail.textContent = `ついに、なつかしい我が家が見えてきた。${companionNote}大好きな飼い主のもとへ帰り着いた! Lv.${player.level} / スコア: ${Math.floor(score)}`;
  clearScreen.classList.remove("hidden");
}

// ---------- Update / draw loop ----------
function update(dt) {
  const st = STAGES[stageIndex];

  player.update(dt);
  const scroll = player.frameScroll;
  distance += scroll;
  score += scroll * 0.4;

  windTimer -= dt;
  if (windTimer <= 0) {
    hazards.push(new WindGust());
    windTimer = rand(st.spawns.wind);
  }
  debrisTimer -= dt;
  if (debrisTimer <= 0) {
    hazards.push(new Debris(st.scrollSpeed));
    debrisTimer = rand(st.spawns.debris);
  }
  if (st.spawns.hail) {
    hailTimer -= dt;
    if (hailTimer <= 0) {
      hazards.push(new Hail());
      hailTimer = rand(st.spawns.hail);
    }
  }
  crowTimer -= dt;
  if (crowTimer <= 0 && crows.length < 6) {
    crows.push(new Crow());
    crowTimer = rand(st.spawns.crow);
  }
  hideoutTimer -= dt;
  if (hideoutTimer <= 0 && hideouts.length < 9) {
    hideouts.push(new Hideout(st.hideoutStyle));
    hideoutTimer = rand(st.spawns.hideout);
  }
  foodTimer -= dt;
  if (foodTimer <= 0 && foods.length < 3) {
    foods.push(new Food());
    foodTimer = rand(st.spawns.food);
  }

  hazards.forEach((h) => h.update(dt, player, scroll));
  hazards = hazards.filter((h) => !h.dead);

  hideouts.forEach((h) => h.update(dt, scroll));
  player.hidden = hideouts.some((h) => !h.dead && h.contains(player));
  hideouts = hideouts.filter((h) => !h.dead);

  crows.forEach((c) => c.update(dt, player, scroll));
  crows = crows.filter((c) => !c.dead);

  foods.forEach((f) => f.update(dt, player, scroll));
  foods = foods.filter((f) => !f.dead);

  sparrow.update(dt, player, crows);

  if (st.hawk) {
    if (!hawk && distance / st.distance >= 0.6) {
      hawk = new Hawk();
      showBanner("タカだ! よけろ!", 1400);
    }
    if (hawk) hawk.update(dt, player);
  }

  particles.forEach((p) => p.update(dt));
  particles = particles.filter((p) => p.life > 0);
  shooRings.forEach((r) => r.update(dt));
  shooRings = shooRings.filter((r) => !r.dead);

  if (shake > 0) shake = Math.max(0, shake - dt * 40);

  if (distance >= st.distance) {
    if (stageIndex + 1 < STAGES.length) {
      stageIndex++;
      startStage(stageIndex);
    } else {
      onAllClear();
    }
  }

  heartsEl.textContent = "❤".repeat(player.hearts) + "🤍".repeat(player.maxHearts - player.hearts);
  const frac = clamp(distance / STAGES[stageIndex].distance, 0, 1);
  progressInner.style.width = `${frac * 100}%`;
  scoreNumEl.textContent = String(Math.floor(score));

  levelLabelEl.textContent = `Lv.${player.level}`;
  const nextLevel = LEVEL_UPS[player.level - 1];
  if (nextLevel) {
    const prevThreshold = player.level > 1 ? LEVEL_UPS[player.level - 2].threshold : 0;
    const xpFrac = (player.xp - prevThreshold) / (nextLevel.threshold - prevThreshold);
    xpBarInner.style.width = `${clamp(xpFrac * 100, 0, 100)}%`;
  } else {
    xpBarInner.style.width = "100%";
  }
}

// Background parallax: every layer's horizontal position is driven by the
// stage's traveled `distance` (not wall-clock time), so the whole sky
// freezes exactly when the player stops flying forward, just like the
// hazards — and moves visibly faster in the foreground than the
// background, which is what actually reads as "flying forward."
function drawTiledLayer(distanceVal, parallax, spacing, count, itemFn) {
  const patternW = spacing * count;
  const shift = mod(distanceVal * parallax, patternW);
  for (let rep = -1; rep <= 2; rep++) {
    const base = -shift + rep * patternW;
    for (let i = 0; i < count; i++) {
      itemFn(base + i * spacing, i);
    }
  }
}

function drawCloudPuff(x, y, scale, alpha) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(x, y, 42 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 26 * scale, y - 8 * scale, 28 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 24 * scale, y + 4 * scale, 24 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountainRidge(distanceVal, parallax, spacing, count, color, groundY, ampMin, ampMax, seed) {
  const patternW = spacing * count;
  const shift = mod(distanceVal * parallax, patternW);
  ctx.fillStyle = color;
  for (let rep = -1; rep <= 2; rep++) {
    const startX = -shift + rep * patternW;
    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    for (let i = 0; i <= count; i++) {
      const px = startX + i * spacing;
      const h = ampMin + (((i * 53 + seed * 17) % 100) / 100) * (ampMax - ampMin);
      ctx.lineTo(px, groundY - h);
    }
    ctx.lineTo(startX + count * spacing, groundY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCloudsAmbient(distanceVal) {
  ctx.fillStyle = "#ffffff";
  // far: pale, slow-moving haze
  drawTiledLayer(distanceVal, 0.12, 300, 4, (x, i) => {
    drawCloudPuff(x, 90 + (i % 2) * 70, 1.7, 0.16);
  });
  // mid: the familiar puffy clouds
  drawTiledLayer(distanceVal, 0.45, 170, 6, (x, i) => {
    drawCloudPuff(x, 60 + ((i * 83) % (H - 260)), 1, 0.55);
  });
  // near: small wisps that zip past quickly — the speed cue
  drawTiledLayer(distanceVal, 0.85, 130, 7, (x, i) => {
    drawCloudPuff(x, 400 + ((i * 61) % 150), 0.45, 0.4);
  });
  ctx.globalAlpha = 1;
}

function drawRainAmbient(distanceVal) {
  const t = performance.now() * 0.001;

  // far: heavy, dark storm clouds, barely moving
  drawTiledLayer(distanceVal, 0.1, 340, 3, (x, i) => {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#3c4252";
    ctx.beginPath();
    ctx.ellipse(x, 80 + (i % 2) * 50, 110, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // mid rain: horizontal position tied to distance, fall tied to time
  // (gravity keeps pulling it down even mid-pause)
  ctx.strokeStyle = "rgba(220,235,255,0.35)";
  ctx.lineWidth = 1;
  drawTiledLayer(distanceVal, 0.5, 60, 15, (x, i) => {
    const speed = 400 + (i % 5) * 60;
    const y = mod(((i * 47) % H) + t * speed, H + 40) - 20;
    const drift = y * 0.35;
    ctx.beginPath();
    ctx.moveTo(x + drift, y);
    ctx.lineTo(x + drift - 6, y - 14);
    ctx.stroke();
  });

  // near rain: closer, faster, brighter — the speed cue
  ctx.strokeStyle = "rgba(230,240,255,0.55)";
  ctx.lineWidth = 1.4;
  drawTiledLayer(distanceVal, 0.95, 90, 8, (x, i) => {
    const speed = 520 + (i % 4) * 50;
    const y = mod(((i * 71) % H) + t * speed, H + 40) - 20;
    const drift = y * 0.4;
    ctx.beginPath();
    ctx.moveTo(x + drift, y);
    ctx.lineTo(x + drift - 8, y - 18);
    ctx.stroke();
  });
}

function drawSunsetAmbient(distanceVal) {
  // far: a lighter, hazier second mountain range peeking up behind
  drawMountainRidge(distanceVal, 0.08, 150, 6, "rgba(120,70,90,0.35)", H - 60, 60, 130, 11);

  // warm haze clouds
  ctx.fillStyle = "#ffd8a8";
  drawTiledLayer(distanceVal, 0.3, 220, 5, (x, i) => {
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.ellipse(x, 50 + i * 40, 70, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // main mountain silhouette, now actually scrolling by
  drawMountainRidge(distanceVal, 0.22, 170, 6, "rgba(30,15,40,0.55)", H, 90, 170, 3);

  // foreground treetops skimming past — the speed cue
  ctx.fillStyle = "#1f2d1a";
  drawTiledLayer(distanceVal, 0.95, 46, 20, (x, i) => {
    const h = 26 + (i % 3) * 10;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + 14, H - h);
    ctx.lineTo(x + 28, H);
    ctx.closePath();
    ctx.fill();
  });
}

function drawSkyBackground(theme, distanceVal) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.sky[0]);
  grad.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (theme.ambient === "clouds") drawCloudsAmbient(distanceVal);
  else if (theme.ambient === "rain") drawRainAmbient(distanceVal);
  else if (theme.ambient === "sunset") drawSunsetAmbient(distanceVal);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  drawSkyBackground(STAGES[stageIndex].theme, distance);

  hideouts.forEach((h) => h.draw());
  foods.forEach((f) => f.draw());
  hazards.forEach((h) => h.draw());
  crows.forEach((c) => c.draw());
  if (hawk) hawk.draw();
  particles.forEach((p) => p.draw());
  shooRings.forEach((r) => r.draw());
  sparrow.draw();
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
