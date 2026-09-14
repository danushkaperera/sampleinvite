const envelope = document.getElementById("envelope");
const card = document.getElementById("card");
const hint = document.getElementById("hint");
const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");
let opened = false;
let touchStartY = 0;
let fireworksAnimation = 0;

const COLORS = ["#f4d27a", "#fff4d8", "#f08a5d", "#e23e3e", "#7ec8e3", "#f7a1c4", "#ffe066"];

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createBurst(x, y, color) {
  const count = 70 + Math.floor(Math.random() * 36);
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + random(-0.18, 0.18);
    const speed = random(2.2, 8.2);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: random(0.008, 0.015),
      size: random(2.2, 4.4),
      color: Math.random() > 0.7 ? "#fff7e4" : color,
      gravity: 0.038,
    });
  }
  return particles;
}

function createRocket() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const leftSide = Math.random() > 0.5;
  return {
    x: leftSide
      ? random(canvas.width * 0.06, canvas.width * 0.28)
      : random(canvas.width * 0.72, canvas.width * 0.94),
    y: canvas.height + 8,
    vy: random(-9.5, -7.2),
    vx: random(-0.55, 0.55),
    targetY: random(canvas.height * 0.1, canvas.height * 0.38),
    color,
    trail: [],
  };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function startFireworks() {
  if (prefersReducedMotion()) return;
  window.cancelAnimationFrame(fireworksAnimation);

  const rockets = [];
  const sparks = [];
  const startedAt = performance.now();
  const celebrateFor = 8000;

  const launch = () => rockets.push(createRocket());
  const boom = (xRatio, yRatio, color) => {
    sparks.push(...createBurst(canvas.width * xRatio, canvas.height * yRatio, color));
  };

  launch();
  launch();
  boom(0.14, 0.18, COLORS[0]);
  boom(0.86, 0.14, COLORS[2]);
  boom(0.08, 0.32, COLORS[6]);
  boom(0.92, 0.3, COLORS[4]);

  const timers = [
    window.setTimeout(launch, 280),
    window.setTimeout(() => boom(0.12, 0.22, COLORS[4]), 500),
    window.setTimeout(launch, 700),
    window.setTimeout(launch, 1100),
    window.setTimeout(() => boom(0.88, 0.16, COLORS[5]), 1300),
    window.setTimeout(launch, 1600),
    window.setTimeout(launch, 2300),
    window.setTimeout(() => boom(0.1, 0.26, COLORS[1]), 2500),
    window.setTimeout(launch, 3100),
    window.setTimeout(() => boom(0.9, 0.24, COLORS[3]), 3600),
    window.setTimeout(launch, 4200),
    window.setTimeout(launch, 5400),
  ];

  function tick(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (let i = rockets.length - 1; i >= 0; i -= 1) {
      const rocket = rockets[i];
      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      rocket.vy += 0.05;
      rocket.trail.push({ x: rocket.x, y: rocket.y });
      if (rocket.trail.length > 12) rocket.trail.shift();

      if (rocket.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = rocket.color;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.9;
        ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
        rocket.trail.forEach((dot) => ctx.lineTo(dot.x, dot.y));
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff8dc";
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, 3, 0, Math.PI * 2);
      ctx.fill();

      if (rocket.y <= rocket.targetY || rocket.vy >= -0.3) {
        sparks.push(...createBurst(rocket.x, rocket.y, rocket.color));
        rockets.splice(i, 1);
      }
    }

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.vx *= 0.986;
      spark.vy *= 0.986;
      spark.vy += spark.gravity;
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= spark.decay;

      if (spark.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.color;
      ctx.shadowBlur = 16;
      ctx.shadowColor = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (now - startedAt < celebrateFor || rockets.length || sparks.length) {
      fireworksAnimation = window.requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timers.forEach((id) => window.clearTimeout(id));
    }
  }

  fireworksAnimation = window.requestAnimationFrame(tick);
}

function openEnvelope() {
  if (opened) return;
  opened = true;
  envelope.classList.add("open");
  document.body.classList.add("is-open");
  envelope.setAttribute("aria-label", "Housewarming invitation");
  card.setAttribute("aria-hidden", "false");
  hint.classList.add("hidden");
  window.setTimeout(() => {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 450);
  window.setTimeout(startFireworks, 200);
}

envelope.addEventListener("click", openEnvelope);
envelope.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openEnvelope();
  }
});

window.addEventListener(
  "wheel",
  (event) => {
    if (event.deltaY > 24) openEnvelope();
  },
  { passive: true }
);

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.touches[0].clientY;
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  (event) => {
    const distance = touchStartY - event.changedTouches[0].clientY;
    if (distance > 48) openEnvelope();
  },
  { passive: true }
);
