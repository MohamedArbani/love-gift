/* =========================================================
   LOVE WEBSITE — script.js
   Romantic interactions, pixel characters, and animations
   ========================================================= */

'use strict';

/* ─────────────────────────────────────────────────
   1. CUSTOM HEART CURSOR
───────────────────────────────────────────────── */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  /* Use translate3d for GPU-composited positioning — no layout thrashing.
     The -10 offset centers the 20×20 cursor element on the pointer. */
  document.addEventListener('mousemove', (e) => {
    cursor.style.transform =
      `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
  });

  document.addEventListener('mousedown', () => cursor.classList.add('big'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('big'));

  /* hide cursor when leaving window */
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
})();

/* ─────────────────────────────────────────────────
   2. BACKGROUND HEARTS (floating ambient)
───────────────────────────────────────────────── */
(function initBgHearts() {
  const container = document.getElementById('bg-hearts');
  if (!container) return;
  const HEARTS = ['❤️','💕','💗','💓','✨','🌸'];

  function spawnHeart() {
    const el  = document.createElement('div');
    el.className = 'bg-heart';
    const size = 10 + Math.random() * 12;
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${size}px;
      animation-duration: ${12 + Math.random() * 18}s;
      animation-delay: ${Math.random() * 3}s;
      opacity: ${0.15 + Math.random() * 0.3};
    `;
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  /* spawn hearts periodically */
  spawnHeart();
  setInterval(spawnHeart, 2200);
})();

/* ─────────────────────────────────────────────────
   3. PARTICLE CANVAS (glowing dust)
───────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4 - 0.2;
      this.r  = 1 + Math.random() * 2.5;
      this.alpha = 0;
      this.maxAlpha = 0.25 + Math.random() * 0.35;
      this.life  = 0;
      this.maxLife = 120 + Math.random() * 160;
      /* soft pink/lavender colours */
      const hue = 300 + Math.random() * 60;
      this.color = `hsl(${hue}, 70%, 80%)`;
    }
    update() {
      this.life++;
      const t = this.life / this.maxLife;
      this.alpha = t < 0.2 ? (t / 0.2) * this.maxAlpha
                 : t > 0.7 ? ((1 - t) / 0.3) * this.maxAlpha
                 : this.maxAlpha;
      this.x += this.vx;
      this.y += this.vy;
      if (this.life > this.maxLife) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 80; i++) {
    const p = new Particle();
    p.life = Math.floor(Math.random() * p.maxLife); /* stagger */
    particles.push(p);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ─────────────────────────────────────────────────
   4. HERO — "Come Closer" button
───────────────────────────────────────────────── */
(function initHero() {
  const btn = document.getElementById('come-closer-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.getElementById('characters').scrollIntoView({ behavior: 'smooth' });
  });
})();

/* ─────────────────────────────────────────────────
   5. PIXEL CHARACTER SYSTEM
───────────────────────────────────────────────── */
(function initPixelCharacters() {
  const manCanvas    = document.getElementById('canvas-man');
  const womanCanvas  = document.getElementById('canvas-woman');
  const manWrap      = document.getElementById('char-man-wrap');
  const womanWrap    = document.getElementById('char-woman-wrap');
  const charHearts   = document.getElementById('char-hearts');
  const sparkleCanvas = document.getElementById('sparkle-canvas');
  const stage        = document.getElementById('character-stage');
  const footprintLayer = document.getElementById('footprints-layer');

  if (!manCanvas || !womanCanvas) return;

  const mCtx = manCanvas.getContext('2d');
  const wCtx = womanCanvas.getContext('2d');
  const sCtx = sparkleCanvas.getContext('2d');

  const SZ = 4; /* pixel size (each "pixel" is SZ×SZ actual pixels) */

  /* ── Pixel color palettes ── */
  const MAN_COLORS = {
    '.': null,
    'H': '#1a1a1a', /* black hair */
    'h': '#2e2e2e', /* hair highlight */
    'S': '#F5D6B8', /* warm beige skin */
    's': '#ECC9A5', /* skin shadow */
    'C': '#FFF5E1', /* cream shirt */
    'c': '#F0E0C4', /* shirt shadow/fold */
    'P': '#5C5068', /* dark soft pants */
    'p': '#4A3F55', /* pants shadow */
    'O': '#6B5344', /* shoes */
    'o': '#55402F', /* shoe shadow */
    'E': '#2C1810', /* eyes */
    'W': '#FFFFFF', /* eye whites */
    'U': '#E8967A', /* gentle smile */
    'B': '#FFAAAA', /* blush cheeks */
    'N': '#EDCAA8', /* neck shadow */
    'A': '#F5D6B8', /* arm skin */
    'T': '#DDD0B8', /* shirt collar detail */
  };

  const WOMAN_COLORS = {
    '.': null,
    'H': '#3D2B1F', /* soft long dark hair */
    'h': '#5A3E2B', /* hair highlight */
    'S': '#F5D6B8', /* warm beige skin */
    's': '#ECC9A5', /* skin shadow */
    'D': '#F4A0B8', /* soft pink dress */
    'd': '#E88BA5', /* dress shadow/fold */
    'K': '#F0889E', /* skirt deeper pink */
    'k': '#E07088', /* skirt shadow */
    'O': '#8B6B5A', /* shoes */
    'o': '#705040', /* shoe shadow */
    'E': '#2C1810', /* eyes */
    'W': '#FFFFFF', /* eye whites */
    'L': '#D06080', /* pink lips */
    'B': '#FFAAAA', /* blush cheeks */
    'N': '#EDCAA8', /* neck shadow */
    'R': '#FF7090', /* hair bow */
    'r': '#E85878', /* bow shadow */
    'A': '#F5D6B8', /* arm skin */
    'T': '#FFC0D0', /* dress collar/detail */
  };

  /* ── Husband sprite (20 wide × 28 tall) ── */
  const HUSBAND_SPRITE = [
    '.......hhhhh........',
    '......hHHHHHh.......',
    '.....hHHHHHHHh......',
    '.....HHHHHHHHH......',
    '....HHHSSSSSHH......',
    '....HSSSSSSSSH......',
    '....SWESSBSEWSH.....',
    '....SSSSSSSSSS......',
    '....sSSSUUSSSs......',
    '.....SSSSSSSS.......',
    '......sNNNNs........',
    '.....TTCCCCTT.......',
    '....CCCCCCCCCC......',
    '...ACCCCCCCCCcA.....',
    '...ACCCCCCCCCA......',
    '...ACCCCccCCCA......',
    '....CCCCccCCCC......',
    '....CCCCCCCCCC......',
    '.....CCCCCCCC.......',
    '.....PPP..PPP.......',
    '.....PPP..PPP.......',
    '.....PPP..PPP.......',
    '.....PPp..pPP.......',
    '.....PPP..PPP.......',
    '.....PPP..PPP.......',
    '....oOOO..OOOo......',
    '....OOOO..OOOO......',
    '....oooo..oooo......',
  ];

  /* ── Wife sprite (20 wide × 28 tall) ── */
  const WIFE_SPRITE = [
    '......Rrrr..........',
    '.....hHRHHHh........',
    '....hHHHHHHHh.......',
    '....HHHHHHHHH.......',
    '...HHHHSSSSHH.......',
    '...HHSSSSSSSSH......',
    '...HSWESSBSEWSH.....',
    '...HSSSSSSSSSS......',
    '....SSSLLLSSS.......',
    '....sSSSSSSSs.......',
    '.....HsNNNsH........',
    '....HTTDDDDTTH......',
    '....DDDDDDDDDD......',
    '...ADDDDDDDDDA......',
    '...ADDDDDDDDA.......',
    '....DDDDddDDDD......',
    '....DDDDDDDDD.......',
    '...KKKKKKKKKKK......',
    '...KKKKKKKKKKk......',
    '..KKKKKKKKKKKKk.....',
    '..KKKKKKKKKKKKk.....',
    '..kKKKKKKKKKKkk.....',
    '...kKKKKKKKKkk......',
    '....kKKKKKKkk.......',
    '.....kKKKKk.........',
    '....oOOO..OOOo......',
    '....OOOO..OOOO......',
    '....oooo..oooo......',
  ];

  /* ── Draw a sprite onto a canvas ── */
  function drawSprite(ctx, sprite, colors, blushing = false) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const rows = sprite.length;
    const cols = sprite[0].length;
    const offX = (ctx.canvas.width  - cols * SZ) / 2;
    const offY = (ctx.canvas.height - rows * SZ) / 2 + 4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = sprite[r][c];
        const color = colors[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(offX + c * SZ, offY + r * SZ, SZ, SZ);
      }
    }

    /* Blushing cheeks overlay (extra glow on top of built-in blush pixels) */
    if (blushing) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FF6B8A';
      /* left cheek */
      ctx.beginPath();
      ctx.ellipse(offX + 6 * SZ, offY + 7 * SZ, SZ * 1.8, SZ * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      /* right cheek */
      ctx.beginPath();
      ctx.ellipse(offX + 13 * SZ, offY + 7 * SZ, SZ * 1.8, SZ * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* initial draw */
  let manBlushing   = false;
  let womanBlushing = false;
  drawSprite(mCtx, HUSBAND_SPRITE, MAN_COLORS);
  drawSprite(wCtx, WIFE_SPRITE,    WOMAN_COLORS);

  /* start idle breathe animation */
  manCanvas.classList.add('char-breathe');
  womanCanvas.classList.add('char-breathe');

  /* ── State ── */
  let state = 'idle'; /* idle | hugging | kissing | walking */

  /* helper: reset to idle positions */
  function resetPositions(cb) {
    manWrap.style.transition   = 'left 0.9s cubic-bezier(0.4,0,0.2,1), right 0.9s cubic-bezier(0.4,0,0.2,1)';
    womanWrap.style.transition = 'left 0.9s cubic-bezier(0.4,0,0.2,1), right 0.9s cubic-bezier(0.4,0,0.2,1)';
    manWrap.style.left         = '';
    womanWrap.style.right      = '';
    manWrap.style.right        = '';
    womanWrap.style.left       = '';
    manCanvas.style.transform  = '';
    womanCanvas.style.transform = '';
    manBlushing   = false;
    womanBlushing = false;
    drawSprite(mCtx, HUSBAND_SPRITE, MAN_COLORS, false);
    drawSprite(wCtx, WIFE_SPRITE,    WOMAN_COLORS, false);
    clearFootprints();
    sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    charHearts.innerHTML = '';
    if (typeof cb === 'function') setTimeout(cb, 950);
  }

  /* ── Spawn floating hearts above stage ── */
  function spawnCharHearts(count = 5, cx = null) {
    const stageRect = stage.getBoundingClientRect();
    const centerX = cx !== null ? cx : stageRect.width / 2;
    for (let i = 0; i < count; i++) {
      const h = document.createElement('div');
      h.className = 'float-heart';
      h.textContent = ['❤️','💕','💗','💖'][Math.floor(Math.random() * 4)];
      h.style.cssText = `
        left: ${centerX + (Math.random() - 0.5) * 80}px;
        top: 10%;
        animation-delay: ${i * 0.15}s;
      `;
      charHearts.appendChild(h);
      h.addEventListener('animationend', () => h.remove(), { once: true });
    }
  }

  /* ── HUG ── */
  document.getElementById('btn-hug').addEventListener('click', () => {
    if (state !== 'idle') { resetPositions(() => { state = 'idle'; }); return; }
    state = 'hugging';

    /* move them together to center */
    const stageW = stage.offsetWidth;
    const charW  = 90;
    const center = stageW / 2;

    /* position via left (both from left side) */
    manWrap.style.left  = (center - charW * 0.9) + 'px';
    womanWrap.style.left = (center - charW * 0.1) + 'px';
    womanWrap.style.right = 'auto';

    setTimeout(() => {
      /* slight lean toward each other */
      manCanvas.style.transform    = 'rotate(8deg)';
      womanCanvas.style.transform  = 'rotate(-8deg)';

      /* bounce effect */
      manWrap.style.transform    = 'translateY(-8px)';
      womanWrap.style.transform  = 'translateY(-8px)';
      setTimeout(() => {
        manWrap.style.transform   = 'translateY(0)';
        womanWrap.style.transform = 'translateY(0)';
      }, 250);

      /* glow */
      manCanvas.classList.add('char-blush');
      womanCanvas.classList.add('char-blush');
      setTimeout(() => {
        manCanvas.classList.remove('char-blush');
        womanCanvas.classList.remove('char-blush');
      }, 2100);

      /* hearts */
      spawnCharHearts(8, center);

      setTimeout(() => { state = 'idle'; }, 2500);
    }, 900);
  });

  /* ── KISS ── */
  document.getElementById('btn-kiss').addEventListener('click', () => {
    if (state !== 'idle') { resetPositions(() => { state = 'idle'; }); return; }
    state = 'kissing';

    const stageW = stage.offsetWidth;
    const center = stageW / 2;
    const charW  = 90;

    /* move closer than hug */
    manWrap.style.left   = (center - charW * 1.1) + 'px';
    womanWrap.style.left = (center + charW * 0.1) + 'px';
    womanWrap.style.right = 'auto';

    setTimeout(() => {
      /* lean toward each other */
      manCanvas.style.transform    = 'rotate(18deg) translateX(8px)';
      womanCanvas.style.transform  = 'rotate(-18deg) translateX(-8px)';

      /* blushing faces */
      manBlushing   = true;
      womanBlushing = true;
      drawSprite(mCtx, HUSBAND_SPRITE, MAN_COLORS,    manBlushing);
      drawSprite(wCtx, WIFE_SPRITE,    WOMAN_COLORS,  womanBlushing);

      /* pop kiss heart */
      const kissH = document.createElement('div');
      kissH.className = 'kiss-heart';
      kissH.textContent = '💋';
      charHearts.appendChild(kissH);
      kissH.addEventListener('animationend', () => kissH.remove(), { once: true });

      /* sparkles */
      spawnSparkles(center, 80);
      spawnCharHearts(5, center);

      setTimeout(() => {
        drawSprite(mCtx, HUSBAND_SPRITE, MAN_COLORS,   false);
        drawSprite(wCtx, WIFE_SPRITE,    WOMAN_COLORS, false);
        state = 'idle';
      }, 2500);
    }, 900);
  });

  /* ── WALK TOGETHER ── */
  let walkAnim = null;
  document.getElementById('btn-walk').addEventListener('click', () => {
    if (state === 'walking') {
      cancelAnimationFrame(walkAnim);
      clearFootprints();
      resetPositions(() => { state = 'idle'; });
      return;
    }
    if (state !== 'idle') { resetPositions(() => { state = 'idle'; }); return; }
    state = 'walking';

    const stageW = stage.offsetWidth;
    /* place them side by side near left */
    manWrap.style.transition    = 'none';
    womanWrap.style.transition  = 'none';
    manWrap.style.left          = '60px';
    womanWrap.style.left        = '110px';
    womanWrap.style.right       = 'auto';

    /* hold-hands: lean toward each other */
    manCanvas.style.transform    = 'rotate(4deg)';
    womanCanvas.style.transform  = 'rotate(-4deg)';

    let posX  = 60;
    let step  = 0;
    let dir   = 1; /* 1 = right, -1 = left */
    let lastPrint = 0;

    function walkLoop(ts) {
      if (state !== 'walking') return;
      posX += dir * 0.8;

      /* bounce within stage */
      if (posX > stageW - 200) dir = -1;
      if (posX < 20) dir = 1;

      manWrap.style.left   = posX + 'px';
      womanWrap.style.left = (posX + 52) + 'px';

      /* scaleX flip when changing direction */
      const flip = dir < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      manCanvas.style.transform    = flip + ' rotate(4deg)';
      womanCanvas.style.transform  = (dir < 0 ? 'scaleX(-1) ' : '') + 'rotate(-4deg)';

      /* walking bob */
      step++;
      const bob = Math.sin(step * 0.18) * 3;
      manWrap.style.transform    = `translateY(${bob}px)`;
      womanWrap.style.transform  = `translateY(${-bob}px)`;

      /* footprints every 35 frames */
      if (step - lastPrint > 35) {
        dropFootprint(posX + 10, dir);
        dropFootprint(posX + 60, dir);
        lastPrint = step;
      }

      walkAnim = requestAnimationFrame(walkLoop);
    }

    walkAnim = requestAnimationFrame(walkLoop);

    /* hearts every 2s while walking */
    const walkHeartsInterval = setInterval(() => {
      if (state !== 'walking') { clearInterval(walkHeartsInterval); return; }
      spawnCharHearts(2, parseInt(manWrap.style.left) + 70);
    }, 2000);

    setTimeout(() => {
      if (state === 'walking') {
        state = 'idle';
        cancelAnimationFrame(walkAnim);
        clearInterval(walkHeartsInterval);
        manWrap.style.transition    = 'left 0.9s cubic-bezier(0.4,0,0.2,1)';
        womanWrap.style.transition  = 'left 0.9s cubic-bezier(0.4,0,0.2,1)';
        manCanvas.style.transform   = '';
        womanCanvas.style.transform = '';
        manWrap.style.transform     = '';
        womanWrap.style.transform   = '';
        clearFootprints();
        manWrap.style.left          = '';
        womanWrap.style.left        = '';
        womanWrap.style.right       = '18%';
        manWrap.style.left          = '18%';
      }
    }, 12000);
  });

  /* ── Drop footprint heart ── */
  function dropFootprint(x, dir) {
    const fp = document.createElement('div');
    fp.className = 'footprint';
    fp.textContent = '♥';
    fp.style.cssText = `
      left: ${x + (Math.random() - 0.5) * 20}px;
      color: rgba(233,30,99,0.4);
      font-size: 0.6rem;
      animation-duration: ${2.5 + Math.random()}s;
    `;
    footprintLayer.appendChild(fp);
    fp.addEventListener('animationend', () => fp.remove(), { once: true });
  }

  function clearFootprints() {
    footprintLayer.innerHTML = '';
  }

  /* ── Sparkle effect (canvas) ── */
  const sparks = [];
  function spawnSparkles(cx, cy) {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      sparks.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: 2 + Math.random() * 2,
        life: 0, maxLife: 50 + Math.random() * 30,
        color: `hsl(${320 + Math.random() * 60}, 90%, 70%)`,
      });
    }
    requestAnimationFrame(animateSparks);
  }

  function animateSparks() {
    sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    let alive = false;
    sparks.forEach((s, i) => {
      if (s.life >= s.maxLife) return;
      alive = true;
      s.life++;
      s.x  += s.vx;
      s.y  += s.vy;
      s.vy += 0.08;
      const alpha = 1 - s.life / s.maxLife;
      sCtx.save();
      sCtx.globalAlpha = alpha;
      sCtx.beginPath();
      sCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sCtx.fillStyle = s.color;
      sCtx.shadowColor = s.color;
      sCtx.shadowBlur = 6;
      sCtx.fill();
      sCtx.restore();
    });
    /* remove dead */
    for (let i = sparks.length - 1; i >= 0; i--) {
      if (sparks[i].life >= sparks[i].maxLife) sparks.splice(i, 1);
    }
    if (alive) requestAnimationFrame(animateSparks);
    else sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
  }
})();

/* ─────────────────────────────────────────────────
   6. LOVE CARDS — Intersection Observer reveal
───────────────────────────────────────────────── */
(function initCards() {
  const cards = document.querySelectorAll('.love-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.2 });

  cards.forEach(c => obs.observe(c));

  /* Heart click counter (secret message after 5 total clicks) */
  let heartClickCount = 0;
  const secretMsg = document.getElementById('secret-msg');
  const closeSecret = document.getElementById('close-secret');

  document.querySelectorAll('[data-heart]').forEach(icon => {
    icon.addEventListener('click', () => {
      heartClickCount++;
      /* pulse animation */
      icon.style.transform = 'scale(1.5)';
      setTimeout(() => { icon.style.transform = ''; }, 300);

      if (heartClickCount === 5 && secretMsg) {
        setTimeout(() => secretMsg.classList.add('show'), 400);
      }
    });
  });

  if (closeSecret) {
    closeSecret.addEventListener('click', () => secretMsg.classList.remove('show'));
  }
  if (secretMsg) {
    secretMsg.addEventListener('click', (e) => {
      if (e.target === secretMsg) secretMsg.classList.remove('show');
    });
  }
})();

/* ─────────────────────────────────────────────────
   7. NIGHT SKY — Stars
───────────────────────────────────────────────── */
(function initStars() {
  const canvas = document.getElementById('star-canvas');
  const section = document.getElementById('night-sky');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');

  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width  = section.offsetWidth;
    H = canvas.height = section.offsetHeight;
    generateStars();
  }

  function generateStars() {
    stars = [];
    const count = Math.floor((W * H) / 3000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     0.4 + Math.random() * 1.8,
        alpha: Math.random(),
        speed: 0.005 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  resize();
  window.addEventListener('resize', resize);

  let frame = 0;
  function animateStars() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    stars.forEach(s => {
      const alpha = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(s.phase + frame * s.speed));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = `rgba(255,240,200,${alpha})`;
      ctx.shadowBlur  = s.r * 3;
      ctx.fill();
    });
    requestAnimationFrame(animateStars);
  }

  animateStars();
})();

/* ─────────────────────────────────────────────────
   8. FIREFLIES (Night Sky section)
───────────────────────────────────────────────── */
(function initFireflies() {
  const container = document.getElementById('fireflies');
  const section   = document.getElementById('night-sky');
  if (!container || !section) return;

  for (let i = 0; i < 14; i++) {
    const ff = document.createElement('div');
    ff.className = 'firefly';
    const size = 3 + Math.random() * 3;
    ff.style.cssText = `
      left:  ${10 + Math.random() * 80}%;
      top:   ${20 + Math.random() * 70}%;
      width: ${size}px;
      height: ${size}px;
      animation-duration: ${6 + Math.random() * 10}s, ${1 + Math.random() * 2}s;
      animation-delay:    ${Math.random() * 6}s, ${Math.random() * 2}s;
    `;
    container.appendChild(ff);
  }
})();

/* ─────────────────────────────────────────────────
   9. TIMELINE — Intersection Observer
───────────────────────────────────────────────── */
(function initTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 150);
      }
    });
  }, { threshold: 0.25 });

  items.forEach(item => obs.observe(item));
})();

/* ─────────────────────────────────────────────────
   10. DOUBLE CLICK → Floating "I love you"
───────────────────────────────────────────────── */
(function initDoubleClick() {
  const phrases = [
    'I love you ❤️',
    'Forever yours 💕',
    'My heart is yours ✨',
    'Always & forever 💖',
    'You are my everything 🌸',
    'Amore mio 💗',
  ];

  document.addEventListener('dblclick', (e) => {
    const el = document.createElement('div');
    el.className = 'iloveyou-text';
    el.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    el.style.cssText = `
      left: ${Math.max(10, Math.min(e.clientX - 80, window.innerWidth - 180))}px;
      top:  ${Math.max(10, e.clientY - 20)}px;
      animation-delay: 0s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  });
})();

/* ─────────────────────────────────────────────────
   11. PARALLAX SCROLL
───────────────────────────────────────────────── */
(function initParallax() {
  const hero  = document.getElementById('hero');
  const moon  = document.getElementById('moon');

  function onScroll() {
    const scrollY = window.scrollY;

    /* hero parallax: slow down content */
    if (hero) {
      const heroContent = hero.querySelector('.hero-content');
      if (heroContent) {
        heroContent.style.transform = `translateY(${scrollY * 0.35}px)`;
        heroContent.style.opacity   = Math.max(0, 1 - scrollY / (hero.offsetHeight * 0.65));
      }
    }

    /* moon parallax */
    if (moon) {
      const nightSection = document.getElementById('night-sky');
      if (nightSection) {
        const nightTop = nightSection.getBoundingClientRect().top;
        moon.style.transform = `translateY(${nightTop * -0.08}px)`;
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ─────────────────────────────────────────────────
   12. MUSIC PLAYER (placeholder — user provides audio)
───────────────────────────────────────────────── */
(function initMusic() {
  const player  = document.getElementById('music-player');
  const btn     = document.getElementById('music-btn');
  const icon    = document.getElementById('music-icon');
  const label   = document.getElementById('music-label');
  const audio   = document.getElementById('bg-music');

  let playing = false;

  if (!btn || !audio) return;

  /* ── Helper: start playback with fade-in ── */
  function startMusic() {
    if (playing) return;
    playing = true;
    audio.volume = 0;
    audio.play().then(() => {
      let vol = 0;
      const fade = setInterval(() => {
        vol += 0.05;
        if (vol >= 0.45) { audio.volume = 0.45; clearInterval(fade); }
        else audio.volume = vol;
      }, 150);
      icon.textContent = '♪';
      label.textContent = 'Playing';
      player.classList.add('playing');
    }).catch(() => { playing = false; });
  }

  /* ── Helper: stop playback with fade-out ── */
  function stopMusic() {
    if (!playing) return;
    playing = false;
    let vol = audio.volume;
    const fade = setInterval(() => {
      vol -= 0.05;
      if (vol <= 0) { audio.volume = 0; audio.pause(); clearInterval(fade); }
      else audio.volume = vol;
    }, 150);
    icon.textContent = '♪';
    label.textContent = 'Music';
    player.classList.remove('playing');
  }

  /* ── Auto-play on first user interaction ──
     Browsers require a user gesture before playing audio.
     We listen for the very first click/touch/key anywhere
     on the page and start the music automatically.          */
  function autoPlayOnInteraction() {
    startMusic();
    document.removeEventListener('click', autoPlayOnInteraction);
    document.removeEventListener('touchstart', autoPlayOnInteraction);
    document.removeEventListener('keydown', autoPlayOnInteraction);
  }

  document.addEventListener('click', autoPlayOnInteraction, { once: true });
  document.addEventListener('touchstart', autoPlayOnInteraction, { once: true });
  document.addEventListener('keydown', autoPlayOnInteraction, { once: true });

  /* ── Toggle button still works ── */
  player.addEventListener('click', (e) => {
    e.stopPropagation(); /* don't trigger autoplay listener twice */
    if (playing) stopMusic();
    else startMusic();
  });
})();

/* ─────────────────────────────────────────────────
   13. SMOOTH CONTENT FADE-IN (on scroll)
   Targets inner content (not sections) so section
   backgrounds remain visible for seamless color flow.
───────────────────────────────────────────────── */
(function initSectionReveal() {
  const revealTargets = document.querySelectorAll(
    '#characters .section-inner, ' +
    '#love-notes .section-inner, ' +
    '#night-sky .night-content, ' +
    '#timeline .section-inner, ' +
    '#final .final-content'
  );

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });

  revealTargets.forEach(s => {
    s.style.opacity    = '0';
    s.style.transform  = 'translateY(35px)';
    s.style.transition = 'opacity 1.1s cubic-bezier(0.4,0,0.2,1), transform 1.1s cubic-bezier(0.4,0,0.2,1)';
    obs.observe(s);
  });

  /* Also reveal the moon separately with a floating entrance */
  const moon = document.getElementById('moon');
  if (moon) {
    moon.style.opacity    = '0';
    moon.style.transform  = 'translateY(30px)';
    moon.style.transition = 'opacity 1.5s cubic-bezier(0.4,0,0.2,1), transform 1.5s cubic-bezier(0.4,0,0.2,1)';
    const moonObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.01 });
    moonObs.observe(moon);
  }
})();

/* ─────────────────────────────────────────────────
   14. FINAL SECTION — beating heart glow
───────────────────────────────────────────────── */
(function initFinalHeart() {
  const heart = document.getElementById('beating-heart');
  if (!heart) return;

  /* Random soft pulse glow */
  setInterval(() => {
    const intensity = 20 + Math.random() * 20;
    heart.style.filter = `drop-shadow(0 0 ${intensity}px rgba(233,30,99,0.65))`;
  }, 700);
})();

/* ─────────────────────────────────────────────────
   15. RESPONSIVE CANVAS RESIZE
───────────────────────────────────────────────── */
(function handleResize() {
  const sparkleCanvas = document.getElementById('sparkle-canvas');
  const stage = document.getElementById('character-stage');

  function resizeSparkle() {
    if (!sparkleCanvas || !stage) return;
    sparkleCanvas.width  = stage.offsetWidth;
    sparkleCanvas.height = stage.offsetHeight;
  }

  resizeSparkle();
  window.addEventListener('resize', resizeSparkle);
})();

/* ─────────────────────────────────────────────────
   16. SMALL AMBIENT: random heart sparkle near cursor
───────────────────────────────────────────────── */
(function ambientCursorTrail() {
  let lastSpawn = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSpawn < 300) return; /* throttle */
    lastSpawn = now;

    if (Math.random() > 0.35) return; /* not every move */

    const el = document.createElement('div');
    el.className = 'iloveyou-text';
    el.textContent = ['✦', '❤', '✿', '♡'][Math.floor(Math.random() * 4)];
    el.style.cssText = `
      left: ${e.clientX + (Math.random() - 0.5) * 30}px;
      top:  ${e.clientY - 10}px;
      font-size: ${8 + Math.random() * 8}px;
      animation-duration: 1.5s;
      pointer-events: none;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  });
})();
