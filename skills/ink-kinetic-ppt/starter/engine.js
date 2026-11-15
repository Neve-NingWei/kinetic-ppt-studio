/* Bespoke Kinetic Engine — 玄墨金锋 七绝转场引擎
 * 1. blade   : Katana Diagonal Blade Split (斜角刀刃劈裂)
 * 2. fire    : Click-Origin Ink-Fire Paper Burn-Away (点屏水墨焚纸)
 * 3. fists   : Multi-Fist Martial Shatter Through Paper (乱拳击穿碎纸)
 * 4. cranes  : Origami Paper Crane Flock Carrying Scene Away (千纸鹤衔卷飞散)
 * 5. curtain : Draped Silk-Ink Curtain Center Parting (黑金帷幔居中拉开)
 * 6. wind    : Gale-Force Ink Wind Lifting & Blowing Page Away (狂风鼓浪吹卷)
 * 7. crumple : Rapid Center Paper Crumple & Parabolic Toss-Out (捏皱纸团抛飞丢出)
 */
(() => {
  'use strict';

  const hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP) {
    const plugins = [window.CustomEase, window.SplitText, window.DrawSVGPlugin].filter(Boolean);
    if (plugins.length) window.gsap.registerPlugin(...plugins);
    if (window.CustomEase) {
      window.CustomEase.create('bladeCut', 'M0,0 C0.32,0 0.22,1 1,1');
      window.CustomEase.create('fireSpread', 'M0,0 C0.18,0.06 0.56,0.72 1,1');
      window.CustomEase.create('craneGust', 'M0,0 C0.25,0.05 0.45,0.85 1,1');
      window.CustomEase.create('curtainPull', 'M0,0 C0.37,0 0.22,1 1,1');
      window.CustomEase.create('windGust', 'M0,0 C0.38,0.02 0.34,0.94 1,1');
    }
  }

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('#slides-root > .slide'));
  const transitionHost = document.getElementById('transition-host');
  const hudDots = Array.from(document.querySelectorAll('.hud-dot'));
  const hudModeBtns = Array.from(document.querySelectorAll('.hud-mode-btn'));
  const hudThemeBtn = document.getElementById('hud-theme-btn');
  const hudHideBtn = document.getElementById('hud-hide-btn');
  const hudFsBtn = document.getElementById('hud-fs-btn');

  const THEMES = ['obsidian-gold', 'vermilion-palace', 'jade-mist', 'cyber-noir', 'keynote-slate', 'clean-lecture'];

  const INK_BALL_TONES = [
    '#14161e', '#2c2721', '#d6ccba', '#9c7844',
    '#1c1e26', '#eae2d2', '#52493e', '#c69a5a',
    '#101218', '#cfc3ad', '#363029', '#e6c58b',
  ];
  const SLATE_BALL_TONES = [
    '#162032', '#263449', '#e2e8f0', '#60a5fa',
    '#1e293b', '#f1f5f9', '#475569', '#38bdf8',
    '#0f172a', '#cbd5e1', '#334155', '#93c5fd',
  ];
  const LIGHT_BALL_TONES = [
    '#ffffff', '#e2e8f0', '#cbd5e1', '#93c5fd',
    '#f8fafc', '#dbeafe', '#94a3b8', '#60a5fa',
    '#f1f5f9', '#bfdbfe', '#64748b', '#eff6ff',
  ];

  const THEME_FX_MAP = {
    'keynote-slate': {
      isMinimal: true,
      isLight: false,
      seam: '#7cc4ff',
      bladeGlow: 'rgba(56, 189, 248, 0.72)',
      bladeShadow: '#38bdf8',
      bladeCore: '#ffffff',
      bladeComposite: 'screen',
      shockRgb: '124, 196, 255',
      sparkRgb: '186, 230, 253',
      fistFill: 'rgba(15, 23, 38, 0.94)',
      fistThumbFill: '#1e293b',
      fistStroke: '#7cc4ff',
      fistArc: 'rgba(124, 196, 255, 0.75)',
      fistCrease: '#38bdf8',
      fistFlash: 'rgba(224, 242, 254, 0.8)',
      fistRim: '#7cc4ff',
      craneFar: '#3b82f6',
      craneMid: '#cbd5e1',
      craneLight: '#f8fafc',
      craneStroke: 'rgba(186, 230, 253, 0.65)',
      craneWingStops: ['#ffffff', '#bae6fd', '#38bdf8'],
      craneCrease: 'rgba(255, 255, 255, 0.78)',
      railStops: ['#f8fafc', '#94a3b8', '#334155'],
      ringStroke: '#7cc4ff',
      ringSpec: '#ffffff',
      windPrimary: '124, 196, 255',
      windAlt: '226, 232, 240',
      paperTones: SLATE_BALL_TONES,
      ballStreak: 'rgba(124, 196, 255, 0.75)',
      ballShadow: 'rgba(0, 0, 0, 0.85)',
      ballBevelLight: 'rgba(224, 242, 254, 0.7)',
      ballBevelDark: 'rgba(15, 23, 42, 0.78)',
      ballFleck: 'rgba(56, 189, 248, 0.35)',
      ballCrease: 'rgba(124, 196, 255, 0.48)',
      ballRim: 'rgba(186, 230, 253, 0.82)',
      creaseLight: 'rgba(124, 196, 255, 0.78)',
      creaseDark: 'rgba(8, 12, 20, 0.85)',
      ptFeather: '124, 196, 255',
      ptPaper: '226, 232, 240',
      ptStroke: '56, 189, 248',
    },
    'clean-lecture': {
      isMinimal: true,
      isLight: true,
      seam: '#2563eb',
      bladeGlow: 'rgba(37, 99, 235, 0.78)',
      bladeShadow: 'rgba(37, 99, 235, 0.5)',
      bladeCore: '#ffffff',
      bladeComposite: 'source-over',
      shockRgb: '37, 99, 235',
      sparkRgb: '37, 99, 235',
      fistFill: 'rgba(30, 41, 59, 0.94)',
      fistThumbFill: '#334155',
      fistStroke: '#60a5fa',
      fistArc: 'rgba(37, 99, 235, 0.78)',
      fistCrease: '#93c5fd',
      fistFlash: 'rgba(255, 255, 255, 0.85)',
      fistRim: '#334155',
      craneFar: '#64748b',
      craneMid: '#cbd5e1',
      craneLight: '#ffffff',
      craneStroke: 'rgba(30, 41, 59, 0.72)',
      craneWingStops: ['#ffffff', '#dbeafe', '#93c5fd'],
      craneCrease: 'rgba(30, 41, 59, 0.45)',
      railStops: ['#ffffff', '#94a3b8', '#475569'],
      ringStroke: '#2563eb',
      ringSpec: '#ffffff',
      windPrimary: '37, 99, 235',
      windAlt: '71, 85, 105',
      paperTones: LIGHT_BALL_TONES,
      ballStreak: 'rgba(37, 99, 235, 0.65)',
      ballShadow: 'rgba(15, 23, 42, 0.34)',
      ballBevelLight: 'rgba(255, 255, 255, 0.9)',
      ballBevelDark: 'rgba(51, 65, 85, 0.65)',
      ballFleck: 'rgba(37, 99, 235, 0.22)',
      ballCrease: 'rgba(51, 65, 85, 0.55)',
      ballRim: 'rgba(30, 41, 59, 0.72)',
      creaseLight: 'rgba(37, 99, 235, 0.72)',
      creaseDark: 'rgba(15, 23, 42, 0.68)',
      ptFeather: '59, 130, 246',
      ptPaper: '241, 245, 249',
      ptStroke: '51, 65, 85',
    },
  };

  const DEFAULT_INK_FX = {
    isMinimal: false,
    isLight: false,
    seam: '#f7deb0',
    bladeGlow: 'rgba(244, 202, 122, 0.65)',
    bladeShadow: '#ffb95e',
    bladeCore: 'rgba(255, 252, 240, 1)',
    bladeComposite: 'screen',
    shockRgb: '244, 214, 156',
    sparkRgb: '255, 224, 150',
    fistFill: 'rgba(10, 11, 16, 0.94)',
    fistThumbFill: '#171922',
    fistStroke: '#f4d69c',
    fistArc: 'rgba(244, 214, 156, 0.72)',
    fistCrease: '#d4a664',
    fistFlash: 'rgba(255, 244, 200, 0.75)',
    fistRim: '#d8c8a8',
    craneFar: '#a87d43',
    craneMid: '#d6bc8c',
    craneLight: '#efe7d6',
    craneStroke: 'rgba(244, 214, 156, 0.5)',
    craneWingStops: ['#f5eedf', '#eccb8d', '#cf9d56'],
    craneCrease: 'rgba(255, 250, 238, 0.72)',
    railStops: ['#fff2cc', '#cfa365', '#583f1f'],
    ringStroke: '#f4d69c',
    ringSpec: '#fff5d8',
    windPrimary: '244, 214, 156',
    windAlt: '235, 226, 208',
    paperTones: INK_BALL_TONES,
    ballStreak: 'rgba(244, 214, 156, 0.72)',
    ballShadow: 'rgba(0, 0, 0, 0.92)',
    ballBevelLight: 'rgba(248, 236, 206, 0.65)',
    ballBevelDark: 'rgba(18, 16, 14, 0.72)',
    ballFleck: 'rgba(207, 163, 101, 0.35)',
    ballCrease: 'rgba(244, 214, 156, 0.45)',
    ballRim: 'rgba(222, 194, 142, 0.78)',
    creaseLight: 'rgba(255, 240, 200, 0.78)',
    creaseDark: 'rgba(12, 10, 8, 0.85)',
    ptFeather: '244, 214, 156',
    ptPaper: '232, 220, 198',
    ptStroke: '207, 163, 101',
  };

  function getThemeFx() {
    const active = document.documentElement.getAttribute('data-theme') || THEMES[0];
    return THEME_FX_MAP[active] || DEFAULT_INK_FX;
  }

  function setTheme(name) {
    const valid = THEMES.includes(name) ? name : THEMES[0];
    document.documentElement.setAttribute('data-theme', valid);
    const fx = THEME_FX_MAP[valid] || DEFAULT_INK_FX;
    const flameEl = document.getElementById('burn-ring-flame');
    const emberEl = document.getElementById('burn-ring-ember');
    if (flameEl) {
      flameEl.style.mixBlendMode = fx.isLight ? 'normal' : 'screen';
      flameEl.setAttribute('stroke', fx.isLight ? '#ea580c' : '#ff5500');
    }
    if (emberEl) {
      emberEl.style.mixBlendMode = fx.isLight ? 'normal' : 'screen';
      emberEl.setAttribute('stroke', fx.isLight ? '#fde047' : '#fff3c4');
    }
    return valid;
  }
  function cycleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || THEMES[0];
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    return setTheme(next);
  }
  const urlTheme = new URLSearchParams(window.location.search).get('theme');
  setTheme(urlTheme || document.documentElement.getAttribute('data-theme') || THEMES[0]);

  // Shared SVG Overlay & Mask Elements
  const maskSvg = document.getElementById('burn-mask-svg');
  const burnFilter = document.getElementById('burn-erode-filter');
  const flameBlur = document.getElementById('flame-blur');
  const burnTurb = document.getElementById('burn-turb');
  const burnDisp = document.getElementById('burn-disp');
  const burnMask = document.getElementById('ink-burn-mask');
  const burnMaskBg = document.getElementById('burn-mask-bg');
  const burnHole = document.getElementById('burn-hole-circle');
  const burnFlameGroup = document.getElementById('burn-flame-group');
  const burnRingSoot = document.getElementById('burn-ring-soot');
  const burnRingFlame = document.getElementById('burn-ring-flame');
  const burnRingEmber = document.getElementById('burn-ring-ember');

  const fistsFilter = document.getElementById('fists-tear-filter');
  const fistsTurb = document.getElementById('fists-turb');
  const fistsMask = document.getElementById('ink-fists-mask');
  const fistsMaskBg = document.getElementById('fists-mask-bg');
  const fistsHolesGroup = document.getElementById('fists-holes-group');
  const fistsRimsGroup = document.getElementById('fists-rims-group');

  const cranesFilter = document.getElementById('cranes-wind-filter');
  const cranesMask = document.getElementById('ink-cranes-mask');
  const cranesMaskRect = document.getElementById('cranes-mask-rect');
  const cranesGrad = document.getElementById('cranes-sweep-grad');
  const cranesStop0 = document.getElementById('cranes-stop-0');
  const cranesStop1 = document.getElementById('cranes-stop-1');
  const cranesStop2 = document.getElementById('cranes-stop-2');

  const windFilter = document.getElementById('wind-billow-filter');
  const windTurb = document.getElementById('wind-turb');
  const windDisp = document.getElementById('wind-disp');

  const crumpleFilter = document.getElementById('crumple-crease-filter');
  const crumpleTurb = document.getElementById('crumple-turb');
  const crumpleDisp = document.getElementById('crumple-disp');

  const fxCanvas = document.getElementById('fx-canvas');
  const ctx = fxCanvas.getContext('2d');

  const AUTO_CYCLE = ['blade', 'fire', 'fists', 'cranes', 'curtain', 'wind', 'crumple'];
  let currentIdx = 0;
  let selectedMode = 'auto';
  let autoStep = 0;
  let activeCleanup = null;
  let entranceTl = null;
  const splitInstances = new Map();

  // ======================== Coordinate & SVG Viewport Sync ========================
  function getStageDims() {
    const rect = stage.getBoundingClientRect();
    return { w: Math.max(320, Math.round(rect.width)), h: Math.max(240, Math.round(rect.height)) };
  }

  function syncViewport() {
    const { w, h } = getStageDims();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    fxCanvas.width = Math.round(w * dpr);
    fxCanvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 420;
    maskSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    [burnFilter, flameBlur, fistsFilter, cranesFilter, windFilter, crumpleFilter].forEach(el => {
      if (!el) return;
      el.setAttribute('x', -pad);
      el.setAttribute('y', -pad);
      el.setAttribute('width', w + pad * 2);
      el.setAttribute('height', h + pad * 2);
    });
    [burnMask, fistsMask, cranesMask].forEach(el => {
      if (!el) return;
      el.setAttribute('x', 0);
      el.setAttribute('y', 0);
      el.setAttribute('width', w);
      el.setAttribute('height', h);
    });
    [burnMaskBg, fistsMaskBg].forEach(el => {
      if (!el) return;
      el.setAttribute('width', w);
      el.setAttribute('height', h);
    });
    if (cranesMaskRect) {
      cranesMaskRect.setAttribute('x', -180);
      cranesMaskRect.setAttribute('y', -180);
      cranesMaskRect.setAttribute('width', w + 360);
      cranesMaskRect.setAttribute('height', h + 360);
    }
  }

  // ======================== Canvas Particle / Fist / Crane / Wind / Ball FX System ========================
  const particles = [];
  const ambientMotes = [];
  const activeFists = [];
  const activeCranes = [];
  const shockRings = [];
  const windStreaks = [];
  let katanaSlash = null;
  let fireOriginFlash = null;
  let curtainRail = null;
  let activePaperBall = null;

  function initAmbientMotes() {
    ambientMotes.length = 0;
    const { w, h } = getStageDims();
    for (let i = 0; i < 18; i++) {
      ambientMotes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.7 + Math.random() * 1.3,
        vx: (Math.random() - 0.5) * 8,
        vy: -5 - Math.random() * 9,
        alpha: 0.1 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function spawnBladeSparks(xTop, xBot, H) {
    const dx = xBot - xTop;
    const len = Math.hypot(dx, H);
    const nx = H / len;
    const ny = -dx / len;
    for (let i = 0; i < 64; i++) {
      const t = Math.random();
      const px = xTop + dx * t;
      const py = H * t;
      const side = Math.random() > 0.5 ? 1 : -1;
      const speed = 120 + Math.random() * 380;
      const spread = (Math.random() - 0.5) * 0.9;
      particles.push({
        kind: 'spark',
        x: px + (Math.random() - 0.5) * 6,
        y: py,
        vx: nx * side * speed + Math.cos(spread) * 65 * side,
        vy: ny * side * speed - 40 + Math.random() * 120,
        life: 0,
        maxLife: 0.42 + Math.random() * 0.55,
        size: 1.2 + Math.random() * 2.4,
      });
    }
  }

  function emitBurnPerimeterParticles(cx, cy, r, w, h) {
    if (r < 8) return;
    const count = Math.min(18, Math.max(5, Math.round(r / 34)));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const jitterR = r + (Math.random() - 0.5) * 75;
      const px = cx + Math.cos(angle) * jitterR;
      const py = cy + Math.sin(angle) * jitterR;
      if (px < -60 || px > w + 60 || py < -60 || py > h + 60) continue;

      const isAsh = Math.random() < 0.34;
      particles.push({
        kind: isAsh ? 'ash' : 'ember',
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 58 + Math.cos(angle) * 24,
        vy: isAsh ? (-35 - Math.random() * 75) : (-45 - Math.random() * 115),
        life: 0,
        maxLife: isAsh ? (0.65 + Math.random() * 0.65) : (0.42 + Math.random() * 0.62),
        size: isAsh ? (2.4 + Math.random() * 3.6) : (1.3 + Math.random() * 2.8),
        wobble: Math.random() * Math.PI * 2,
      });
    }
  }

  function spawnPaperBurstParticles(px, py, count, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (110 + Math.random() * 340) * speedScale;
      const isPaper = Math.random() < 0.58;
      particles.push({
        kind: isPaper ? 'paper' : 'spark',
        x: px + (Math.random() - 0.5) * 22,
        y: py + (Math.random() - 0.5) * 22,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 50,
        life: 0,
        maxLife: isPaper ? (0.48 + Math.random() * 0.55) : (0.28 + Math.random() * 0.32),
        size: isPaper ? (4 + Math.random() * 8) : (1.6 + Math.random() * 2.2),
        wobble: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 14,
      });
    }
  }

  function emitCraneWakeFeathers(x, y, vx, vy, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        kind: 'feather',
        x: x + (Math.random() - 0.5) * 48,
        y: y + (Math.random() - 0.5) * 48,
        vx: vx * (0.22 + Math.random() * 0.25) + (Math.random() - 0.5) * 60,
        vy: vy * (0.22 + Math.random() * 0.25) + (Math.random() - 0.5) * 50,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.65,
        size: 3.5 + Math.random() * 5.5,
        wobble: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 9,
      });
    }
  }

  // Stylized Martial Foreshortened Fist Renderer
  function drawInkFist(fist) {
    const fx = getThemeFx();
    const p = fist.life / fist.maxLife;
    const hitTime = 0.36; // plunges rapidly 0..0.36, rebounds & fades 0.36..1.0
    const slam = p < hitTime ? p / hitTime : 1 - ((p - hitTime) / (1 - hitTime)) * 0.22;
    const alpha = p < hitTime ? (0.4 + 0.6 * slam) : Math.max(0, 1 - (p - hitTime) / (1 - hitTime));
    const scale = p < hitTime ? (2.35 - 1.38 * slam) : (0.97 + 0.08 * ((p - hitTime) / (1 - hitTime)));
    const radius = fist.size * scale;

    ctx.save();
    ctx.translate(fist.x, fist.y);
    ctx.rotate(fist.angle);
    ctx.globalAlpha = alpha;

    // Foreshortened motion speed trails converging behind punch
    ctx.strokeStyle = fx.fistArc;
    ctx.lineWidth = 1.6;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-radius * 2.1, i * radius * 0.28);
      ctx.lineTo(-radius * 0.72, i * radius * 0.16);
      ctx.stroke();
    }

    // Wrist & Forearm Silhouette
    ctx.fillStyle = fx.fistFill;
    ctx.strokeStyle = fx.fistStroke;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.75, -radius * 0.32, radius * 0.68, radius * 0.64, radius * 0.12);
    ctx.fill();
    ctx.stroke();

    // Main Clenched Fist Knuckle Block
    ctx.beginPath();
    ctx.moveTo(-radius * 0.25, -radius * 0.52);
    ctx.lineTo(radius * 0.52, -radius * 0.46);
    ctx.quadraticCurveTo(radius * 0.76, -radius * 0.24, radius * 0.72, radius * 0.22);
    ctx.quadraticCurveTo(radius * 0.68, radius * 0.48, radius * 0.36, radius * 0.52);
    ctx.lineTo(-radius * 0.28, radius * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Knuckle bevel ridges + dynamic shock arc
    ctx.strokeStyle = fx.fistArc;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(radius * 0.36, 0, radius * 0.78, -0.85, 0.85);
    ctx.stroke();

    // 4 Finger Ridge Creases + Tucked Thumb Plane
    ctx.strokeStyle = fx.fistCrease;
    ctx.lineWidth = 1.7;
    for (let k = -1; k <= 1; k++) {
      const yPos = k * radius * 0.25;
      ctx.beginPath();
      ctx.moveTo(radius * 0.08, yPos);
      ctx.lineTo(radius * 0.62, yPos);
      ctx.stroke();
    }
    // Tucked lower thumb fold
    ctx.fillStyle = fx.fistThumbFill;
    ctx.strokeStyle = fx.fistStroke;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.08, radius * 0.16, radius * 0.55, radius * 0.28, radius * 0.1);
    ctx.fill();
    ctx.stroke();

    // Luminous Knuckle Flash Highlight
    if (p >= hitTime - 0.12 && p <= hitTime + 0.18) {
      ctx.fillStyle = fx.fistFlash;
      ctx.beginPath();
      ctx.arc(radius * 0.42, 0, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Faceted Origami Paper Crane Renderer (千纸鹤)
  function drawOrigamiCrane(crane, nowSec) {
    const fx = getThemeFx();
    const flap = Math.sin(nowSec * crane.flapSpeed + crane.phase);
    const s = crane.size;

    ctx.save();
    ctx.translate(crane.x, crane.y);
    ctx.rotate(crane.heading);
    ctx.globalAlpha = crane.alpha;

    const farWingY = -s * (0.18 - 0.48 * flap);
    const nearWingY = -s * (0.34 + 0.56 * flap);

    // 1. Far Shaded Wing
    ctx.fillStyle = fx.craneFar;
    ctx.strokeStyle = fx.craneStroke;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -s * 0.04);
    ctx.lineTo(s * 0.25, -s * 0.06);
    ctx.lineTo(-s * 0.05, farWingY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Tail Spike (Rear-upward origami tail)
    ctx.fillStyle = fx.craneMid;
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, s * 0.04);
    ctx.lineTo(-s * 0.96, -s * 0.42);
    ctx.lineTo(-s * 0.42, s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Slender Neck + Folded Beak Crest (Forward-upward silhouette anchor)
    ctx.fillStyle = fx.craneLight;
    ctx.beginPath();
    ctx.moveTo(s * 0.22, s * 0.06);
    ctx.lineTo(s * 0.78, -s * 0.44);
    ctx.lineTo(s * 1.04, -s * 0.28); // pointed beak tip
    ctx.lineTo(s * 0.74, -s * 0.30);
    ctx.lineTo(s * 0.38, s * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Folded Diamond Body Core
    ctx.fillStyle = fx.craneLight;
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, s * 0.06);
    ctx.lineTo(s * 0.02, -s * 0.14);
    ctx.lineTo(s * 0.42, s * 0.08);
    ctx.lineTo(s * 0.02, s * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Near Illuminated Wing + Center Fold Seam
    const wingGrad = ctx.createLinearGradient(0, 0, -s * 0.15, nearWingY);
    wingGrad.addColorStop(0, fx.craneWingStops[0]);
    wingGrad.addColorStop(0.55, fx.craneWingStops[1]);
    wingGrad.addColorStop(1, fx.craneWingStops[2]);
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, s * 0.05);
    ctx.lineTo(s * 0.34, s * 0.05);
    ctx.lineTo(-s * 0.12, nearWingY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crisp origami valley fold crease
    ctx.strokeStyle = fx.craneCrease;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.05);
    ctx.lineTo(-s * 0.12, nearWingY * 0.88);
    ctx.stroke();

    ctx.restore();
  }

  // Curtain Rail & Glider Rings Renderer (帷幔滑轨与环扣)
  function drawCurtainRailAndRings(rail, w) {
    if (!rail || rail.alpha <= 0.01) return;
    const fx = getThemeFx();
    ctx.save();
    ctx.globalAlpha = rail.alpha;

    const rodY = 12;
    const rodGrad = ctx.createLinearGradient(0, rodY - 3, 0, rodY + 3);
    rodGrad.addColorStop(0, fx.railStops[0]);
    rodGrad.addColorStop(0.5, fx.railStops[1]);
    rodGrad.addColorStop(1, fx.railStops[2]);
    ctx.fillStyle = rodGrad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = fx.isLight ? 'rgba(15, 23, 42, 0.32)' : 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, rodY - 2, w, 4);
    ctx.shadowBlur = 0;

    const rings = [];
    const countPerSide = 8;
    const halfW = w * 0.5;
    if (rail.leftWing && hasGSAP) {
      const lsx = Number(window.gsap.getProperty(rail.leftWing, 'scaleX'));
      const lx = Number(window.gsap.getProperty(rail.leftWing, 'x')) || 0;
      const lw = halfW * lsx;
      for (let i = 0; i < countPerSide; i++) {
        rings.push(lx + ((i + 0.5) / countPerSide) * lw);
      }
    }
    if (rail.rightWing && hasGSAP) {
      const rsx = Number(window.gsap.getProperty(rail.rightWing, 'scaleX'));
      const rxOff = Number(window.gsap.getProperty(rail.rightWing, 'x')) || 0;
      const rw = halfW * rsx;
      const rStart = w + rxOff - rw;
      for (let i = 0; i < countPerSide; i++) {
        rings.push(rStart + ((i + 0.5) / countPerSide) * rw);
      }
    }

    for (let i = 0; i < rings.length; i++) {
      const rx = rings[i];
      if (rx < -12 || rx > w + 12) continue;
      ctx.strokeStyle = fx.ringStroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(rx, rodY + 2, 4.2, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = fx.ringSpec;
      ctx.beginPath();
      ctx.arc(rx - 1, rodY - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Gale-Force Wind Streamlines & Airborne Ink Ribbons (狂风气流线)
  function spawnWindGust(w, h, count) {
    for (let i = 0; i < count; i++) {
      const isGold = Math.random() < 0.45;
      windStreaks.push({
        x: -160 - Math.random() * w * 0.55,
        y: h * (0.25 + Math.random() * 0.85),
        vx: w * (1.55 + Math.random() * 0.85),
        vy: -h * (0.42 + Math.random() * 0.36),
        len: 140 + Math.random() * 260,
        curve: (Math.random() - 0.5) * 48,
        width: isGold ? (1.2 + Math.random() * 1.8) : (2.0 + Math.random() * 2.8),
        isGold,
        life: 0,
        maxLife: 0.52 + Math.random() * 0.42,
      });
    }
  }

  // Faceted Black-Gold Crumpled Xuan Paper Ball Renderer (真实揉皱折痕纸团)
  function createPaperBallModel(cx, cy, radius) {
    const numVerts = 13;
    const verts = [];
    for (let i = 0; i < numVerts; i++) {
      const a = (i / numVerts) * Math.PI * 2 + (Math.random() - 0.5) * 0.34;
      const r = radius * (0.72 + Math.random() * 0.36);
      verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }

    // Asymmetrical interior crumple nodes (avoids radial pinwheel symmetry)
    const nodes = [
      { x: -radius * 0.34, y: -radius * 0.28 },
      { x: radius * 0.26, y: -radius * 0.32 },
      { x: radius * 0.38, y: radius * 0.16 },
      { x: -radius * 0.12, y: radius * 0.36 },
      { x: -radius * 0.04, y: -radius * 0.03 },
    ];

    const tones = getThemeFx().paperTones;

    // Connect outer segments cleanly to nearest asymmetrical fold hub + central bridge creases
    const facets = [];
    for (let i = 0; i < numVerts; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % numVerts];
      const mx = (v1.x + v2.x) * 0.5;
      const my = (v1.y + v2.y) * 0.5;
      let best = nodes[4];
      let bestDist = Infinity;
      for (let k = 0; k < nodes.length - 1; k++) {
        const d = Math.hypot(mx - nodes[k].x, my - nodes[k].y);
        if (d < bestDist) { bestDist = d; best = nodes[k]; }
      }
      facets.push({
        pts: [v1, v2, best],
        fill: tones[(i * 5 + 1) % tones.length],
        highlight: i % 4 === 1,
        inkFlecks: i % 3 === 0,
      });
    }

    // Internal crushed polygonal bridge planes wrapping the center fold
    const bridges = [
      [nodes[0], nodes[1], nodes[4]],
      [nodes[1], nodes[2], nodes[4]],
      [nodes[2], nodes[3], nodes[4]],
      [nodes[3], nodes[0], nodes[4]],
    ];
    bridges.forEach((pts, idx) => {
      facets.push({
        pts,
        fill: tones[(idx * 3 + 2) % tones.length],
        highlight: idx % 2 === 0,
        inkFlecks: idx === 1,
      });
    });

    // Extra crisp cross-crease scratches for crushed-paper texture
    const microCreases = [
      [verts[1], nodes[4]],
      [verts[4], nodes[1]],
      [verts[7], nodes[2]],
      [verts[10], nodes[3]],
      [nodes[0], nodes[2]],
      [nodes[1], nodes[3]],
    ];

    return {
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      gravity: 0,
      rot: 0,
      rotSpeed: 0,
      scale: 1,
      alpha: 0,
      isThrown: false,
      verts,
      facets,
      microCreases,
    };
  }

  function drawCrumpledPaperBall(ball) {
    if (!ball || ball.alpha <= 0.01) return;
    const fx = getThemeFx();
    ctx.save();
    ctx.translate(ball.x, ball.y);

    // Motion streak wake once hurled
    if (ball.isThrown) {
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 40) {
        const ux = -ball.vx / speed;
        const uy = -ball.vy / speed;
        ctx.save();
        ctx.globalAlpha = ball.alpha * 0.58;
        ctx.strokeStyle = fx.ballStreak;
        ctx.lineWidth = 2.2;
        for (let i = -1; i <= 1; i++) {
          const px = -uy * i * 26 * ball.scale;
          const py = ux * i * 26 * ball.scale;
          ctx.beginPath();
          ctx.moveTo(px + ux * 40, py + uy * 40);
          ctx.lineTo(px + ux * 205, py + uy * 205);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    ctx.rotate(ball.rot);
    ctx.scale(ball.scale, ball.scale);
    ctx.globalAlpha = ball.alpha;

    ctx.shadowBlur = 32;
    ctx.shadowColor = fx.ballShadow;

    for (let i = 0; i < ball.facets.length; i++) {
      const f = ball.facets[i];
      ctx.fillStyle = f.fill;
      ctx.beginPath();
      ctx.moveTo(f.pts[0].x, f.pts[0].y);
      ctx.lineTo(f.pts[1].x, f.pts[1].y);
      ctx.lineTo(f.pts[2].x, f.pts[2].y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Crinkled ridge bevel
      ctx.strokeStyle = f.highlight ? fx.ballBevelLight : fx.ballBevelDark;
      ctx.lineWidth = f.highlight ? 1.3 : 1.0;
      ctx.stroke();

      if (f.inkFlecks) {
        const cxF = (f.pts[0].x + f.pts[1].x + f.pts[2].x) / 3;
        const cyF = (f.pts[0].y + f.pts[1].y + f.pts[2].y) / 3;
        ctx.fillStyle = fx.ballFleck;
        ctx.fillRect(cxF - 5, cyF - 2, 10, 4);
      }
    }

    // Crisp asymmetrical crinkle fractures
    ctx.strokeStyle = fx.ballCrease;
    ctx.lineWidth = 0.9;
    for (let i = 0; i < ball.microCreases.length; i++) {
      const [a, b] = ball.microCreases[i];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo((a.x + b.x) * 0.5 + (i % 2 ? 6 : -5), (a.y + b.y) * 0.5 - 4);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Soft outer irregular paper edge rim
    ctx.strokeStyle = fx.ballRim;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ball.verts.forEach((v, idx) => (idx === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  let lastFrameTs = performance.now();
  function tickCanvas(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTs) / 1000));
    lastFrameTs = now;
    const nowSec = now / 1000;

    const { w, h } = getStageDims();
    const fx = getThemeFx();
    ctx.clearRect(0, 0, w, h);

    // Subtle floating ink-gold motes (auto-muted in minimal keynote/lecture presets)
    if (!prefersReduced && !fx.isMinimal) {
      for (let i = 0; i < ambientMotes.length; i++) {
        const m = ambientMotes[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.phase += dt * 1.4;
        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;
        const a = m.alpha * (0.65 + 0.35 * Math.sin(m.phase));
        ctx.fillStyle = `rgba(${fx.shockRgb}, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fire origin flare
    if (fireOriginFlash) {
      fireOriginFlash.life += dt;
      const p = fireOriginFlash.life / fireOriginFlash.maxLife;
      if (p >= 1) {
        fireOriginFlash = null;
      } else {
        const alpha = (1 - p) * 0.9;
        const rad = 18 + p * 115;
        const g = ctx.createRadialGradient(fireOriginFlash.x, fireOriginFlash.y, 1, fireOriginFlash.x, fireOriginFlash.y, rad);
        g.addColorStop(0, `rgba(255, 245, 200, ${alpha})`);
        g.addColorStop(0.32, `rgba(255, 136, 28, ${(alpha * 0.72).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fireOriginFlash.x, fireOriginFlash.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Katana slash beam
    if (katanaSlash && katanaSlash.alpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = fx.bladeComposite;
      const curX = katanaSlash.xTop + (katanaSlash.xBot - katanaSlash.xTop) * katanaSlash.progress;
      const curY = h * katanaSlash.progress;

      ctx.strokeStyle = fx.bladeGlow;
      ctx.lineWidth = katanaSlash.width * 3.4;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 24;
      ctx.shadowColor = fx.bladeShadow;
      ctx.beginPath();
      ctx.moveTo(katanaSlash.xTop, -10);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      ctx.strokeStyle = fx.bladeCore;
      ctx.globalAlpha = katanaSlash.alpha;
      ctx.lineWidth = katanaSlash.width;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(katanaSlash.xTop, -10);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.restore();
    }

    // Punch Shockwave Rings
    for (let i = shockRings.length - 1; i >= 0; i--) {
      const sr = shockRings[i];
      sr.life += dt;
      if (sr.life >= sr.maxLife) { shockRings.splice(i, 1); continue; }
      const p = sr.life / sr.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(${fx.shockRgb}, ${((1 - p) * 0.85).toFixed(3)})`;
      ctx.lineWidth = 3.2 * (1 - p);
      ctx.beginPath();
      ctx.arc(sr.x, sr.y, 16 + p * sr.maxR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Martial Ink Fist Strikes
    for (let i = activeFists.length - 1; i >= 0; i--) {
      const f = activeFists[i];
      f.life += dt;
      if (f.life >= f.maxLife) { activeFists.splice(i, 1); continue; }
      drawInkFist(f);
    }

    // Flying Origami Cranes (sorted back-to-front via natural insertion)
    for (let i = activeCranes.length - 1; i >= 0; i--) {
      const c = activeCranes[i];
      c.x += c.vx * dt;
      c.y += (c.vy + Math.sin(nowSec * 3.5 + c.phase) * 28) * dt;
      c.life += dt;
      if (c.life > c.maxLife) {
        activeCranes.splice(i, 1);
        continue;
      }
      const edgeFade = Math.min(1, c.life * 6) * Math.min(1, (c.maxLife - c.life) * 4);
      c.alpha = c.baseAlpha * edgeFade;
      drawOrigamiCrane(c, nowSec);
    }

    // Silk Curtain Top Rod & Gold Glider Rings
    if (curtainRail) {
      drawCurtainRailAndRings(curtainRail, w);
    }

    // Atmospheric Gale-Force Wind Streamlines
    for (let i = windStreaks.length - 1; i >= 0; i--) {
      const ws = windStreaks[i];
      ws.life += dt;
      if (ws.life >= ws.maxLife) { windStreaks.splice(i, 1); continue; }
      ws.x += ws.vx * dt;
      ws.y += ws.vy * dt;
      const wp = ws.life / ws.maxLife;
      const wa = Math.sin(wp * Math.PI) * 0.85;
      const spd = Math.hypot(ws.vx, ws.vy);
      const ux = ws.vx / spd;
      const uy = ws.vy / spd;
      const tx = ws.x - ux * ws.len;
      const ty = ws.y - uy * ws.len;
      const mx = (ws.x + tx) * 0.5 - uy * ws.curve;
      const my = (ws.y + ty) * 0.5 + ux * ws.curve;

      ctx.save();
      ctx.strokeStyle = ws.isGold
        ? `rgba(${fx.windPrimary}, ${wa.toFixed(3)})`
        : `rgba(${fx.windAlt}, ${(wa * 0.55).toFixed(3)})`;
      ctx.lineWidth = ws.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my, ws.x, ws.y);
      ctx.stroke();
      ctx.restore();
    }

    // Faceted Crumpled Paper Ball & Parabolic Throw
    if (activePaperBall) {
      if (activePaperBall.isThrown) {
        activePaperBall.vy += activePaperBall.gravity * dt;
        activePaperBall.x += activePaperBall.vx * dt;
        activePaperBall.y += activePaperBall.vy * dt;
        activePaperBall.rot += activePaperBall.rotSpeed * dt;
      }
      drawCrumpledPaperBall(activePaperBall);
    }

    // Mixed Particles (sparks, embers, ash, torn paper scraps, origami feathers)
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life += dt;
      if (pt.life >= pt.maxLife) { particles.splice(i, 1); continue; }
      const p = pt.life / pt.maxLife;
      const inv = 1 - p;

      if (pt.kind === 'spark') {
        pt.vx *= 0.96;
        pt.vy += 190 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        ctx.strokeStyle = `rgba(${fx.sparkRgb}, ${(inv * 0.95).toFixed(3)})`;
        ctx.lineWidth = pt.size;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x - pt.vx * 0.032, pt.y - pt.vy * 0.032);
        ctx.stroke();
      } else if (pt.kind === 'ember') {
        pt.wobble += dt * 7;
        pt.vx += Math.sin(pt.wobble) * 55 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        const r = pt.size * (0.4 + 0.6 * inv);
        ctx.fillStyle = p < 0.35 ? `rgba(255, 240, 180, ${inv})` : `rgba(255, 98, 22, ${inv})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.kind === 'ash') {
        pt.wobble += dt * 5;
        pt.x += (pt.vx + Math.cos(pt.wobble) * 28) * dt;
        pt.y += pt.vy * dt;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.wobble);
        ctx.fillStyle = `rgba(18, 12, 8, ${(inv * 0.82).toFixed(3)})`;
        ctx.strokeStyle = `rgba(214, 120, 42, ${(inv * 0.5).toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.fillRect(-pt.size, -pt.size * 0.55, pt.size * 2, pt.size * 1.1);
        ctx.strokeRect(-pt.size, -pt.size * 0.55, pt.size * 2, pt.size * 1.1);
        ctx.restore();
      } else if (pt.kind === 'paper' || pt.kind === 'feather') {
        pt.wobble += (pt.rotSpeed || 6) * dt;
        pt.vx *= 0.985;
        if (pt.kind === 'paper') pt.vy += 240 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.wobble);
        ctx.fillStyle = pt.kind === 'feather'
          ? `rgba(${fx.ptFeather}, ${(inv * 0.88).toFixed(3)})`
          : `rgba(${fx.ptPaper}, ${(inv * 0.9).toFixed(3)})`;
        ctx.strokeStyle = `rgba(${fx.ptStroke}, ${(inv * 0.65).toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-pt.size, pt.size * 0.5);
        ctx.lineTo(pt.size * 0.85, 0);
        ctx.lineTo(-pt.size * 0.2, -pt.size * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    requestAnimationFrame(tickCanvas);
  }

  // ======================== Slide Content Entrance Animation ========================
  function prepareSplitText() {
    if (!hasGSAP || !window.SplitText) return;
    slides.forEach((slide, idx) => {
      const heads = slide.querySelectorAll('.anim-split');
      const splits = [];
      heads.forEach(el => {
        try {
          splits.push(window.SplitText.create(el, { type: 'lines', mask: 'lines' }));
        } catch {
          // Ignore split error on hidden nodes
        }
      });
      splitInstances.set(idx, splits);
    });
  }

  function primeSlideEntrance(slideIdx) {
    if (!hasGSAP || prefersReduced) return;
    if (entranceTl) entranceTl.kill();
    const slide = slides[slideIdx];
    if (!slide) return;
    const artImg = slide.querySelector('.slide-art img');
    const drawLines = slide.querySelectorAll('.draw-line');
    const rises = slide.querySelectorAll('.anim-rise');
    const splits = splitInstances.get(slideIdx) || [];
    const splitLines = splits.flatMap(s => s.lines || []);

    if (artImg) gsap.set(artImg, { scale: 1.085 });
    if (window.DrawSVGPlugin && drawLines.length) gsap.set(drawLines, { drawSVG: '0%' });
    if (splitLines.length) gsap.set(splitLines, { yPercent: 108, autoAlpha: 0 });
    if (rises.length) gsap.set(rises, { y: 24, autoAlpha: 0 });
  }

  function animateSlideEntrance(slideIdx, immediate = false) {
    if (!hasGSAP) return;
    if (entranceTl) entranceTl.kill();
    const slide = slides[slideIdx];
    if (!slide) return;

    const artImg = slide.querySelector('.slide-art img');
    const drawLines = slide.querySelectorAll('.draw-line');
    const rises = slide.querySelectorAll('.anim-rise');
    const splits = splitInstances.get(slideIdx) || [];
    const splitLines = splits.flatMap(s => s.lines || []);

    if (prefersReduced || immediate) {
      gsap.set([...splitLines, ...rises], { autoAlpha: 1, y: 0, clearProps: 'transform' });
      if (artImg) gsap.set(artImg, { scale: 1.03 });
      if (window.DrawSVGPlugin && drawLines.length) gsap.set(drawLines, { drawSVG: '100%' });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    entranceTl = tl;

    if (artImg) {
      tl.fromTo(artImg, { scale: 1.085 }, { scale: 1.03, duration: 2.2, ease: 'power2.out' }, 0);
    }
    if (window.DrawSVGPlugin && drawLines.length) {
      tl.fromTo(drawLines, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, stagger: 0.12, ease: 'power2.inOut' }, 0.08);
    }
    if (splitLines.length) {
      tl.fromTo(splitLines, { yPercent: 108, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.72, stagger: 0.09, ease: 'power3.out' }, 0.1);
    }
    if (rises.length) {
      tl.fromTo(rises, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.62, stagger: 0.08, ease: 'power2.out' }, 0.24);
    }
  }

  function makeCleanClone(slideEl) {
    const clone = slideEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    clone.classList.remove('is-under');
    clone.classList.add('is-active');
    return clone;
  }

  function updateHUD(idx) {
    hudDots.forEach((btn, i) => btn.classList.toggle('is-current', i === idx));
  }

  function finishActiveTransition(interrupted = false) {
    if (typeof activeCleanup === 'function') {
      const fn = activeCleanup;
      activeCleanup = null;
      fn();
      if (interrupted) animateSlideEntrance(currentIdx, true);
    }
  }

  function fallbackSwap(toIdx) {
    slides.forEach((s, i) => {
      s.classList.remove('is-under');
      s.classList.toggle('is-active', i === toIdx);
    });
    currentIdx = toIdx;
    updateHUD(toIdx);
    animateSlideEntrance(toIdx, true);
  }

  // ======================== Transition 1: Katana Diagonal Blade Split ========================
  function transitionWithBlade(fromIdx, toIdx, clickPoint) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    const slantHalf = Math.round(w * 0.068);
    const pivotX = clickPoint ? Math.max(w * 0.28, Math.min(w * 0.72, clickPoint.x)) : w * 0.5;
    const pivotY = clickPoint ? clickPoint.y : h * 0.5;
    const slope = -(slantHalf * 2) / h;
    const xTop = Math.round(pivotX - slope * pivotY);
    const xBot = Math.round(xTop + slope * h);

    function buildShard(polygonCss) {
      const shard = document.createElement('div');
      shard.className = 'blade-shard';
      shard.style.clipPath = polygonCss;
      shard.style.webkitClipPath = polygonCss;
      shard.appendChild(makeCleanClone(fromSlide));

      const seamSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      seamSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      seamSvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;';
      const seamLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      seamLine.setAttribute('x1', xTop);
      seamLine.setAttribute('y1', 0);
      seamLine.setAttribute('x2', xBot);
      seamLine.setAttribute('y2', h);
      seamLine.setAttribute('stroke', getThemeFx().seam);
      seamLine.setAttribute('stroke-width', '2.5');
      seamLine.setAttribute('opacity', '0');
      seamSvg.appendChild(seamLine);
      shard.appendChild(seamSvg);
      return { shard, seamLine };
    }

    const left = buildShard(`polygon(0px 0px, ${xTop}px 0px, ${xBot}px ${h}px, 0px ${h}px)`);
    const right = buildShard(`polygon(${xTop}px 0px, ${w}px 0px, ${w}px ${h}px, ${xBot}px ${h}px)`);
    transitionHost.appendChild(left.shard);
    transitionHost.appendChild(right.shard);

    const dir = toIdx >= fromIdx ? 1 : -1;
    katanaSlash = { xTop, xBot, progress: 0, alpha: 1, width: 3.6 };

    const tl = gsap.timeline({ onComplete: finishActiveTransition });

    activeCleanup = () => {
      tl.kill();
      katanaSlash = null;
      gsap.set(stage, { x: 0, y: 0 });
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    tl.to(katanaSlash, {
      progress: 1,
      duration: 0.21,
      ease: 'power4.in',
      onComplete: () => {
        spawnBladeSparks(xTop, xBot, h);
        gsap.fromTo(stage, { x: -3, y: 2 }, { x: 0, y: 0, duration: 0.16, ease: 'elastic.out(1.2, 0.35)' });
      },
    }, 0)
      .to([left.seamLine, right.seamLine], { opacity: 0.95, duration: 0.08 }, 0.12)
      .to(katanaSlash, { alpha: 0, duration: 0.22, ease: 'power2.out' }, 0.22)
      .to(left.shard, { x: -16, y: -22 * dir, duration: 0.12, ease: 'power2.out' }, 0.18)
      .to(right.shard, { x: 16, y: 22 * dir, duration: 0.12, ease: 'power2.out' }, 0.18)
      .to(left.shard, { x: -w * 0.64, y: -h * 0.07 * dir, rotation: -2.6, duration: 0.88, ease: 'bladeCut' }, 0.28)
      .to(right.shard, { x: w * 0.64, y: h * 0.07 * dir, rotation: 2.6, duration: 0.88, ease: 'bladeCut' }, 0.28)
      .to([left.shard, right.shard], { opacity: 0, duration: 0.26, ease: 'power1.in' }, 0.88)
      .fromTo(
        toSlide,
        { scale: 0.92, opacity: 0.32 },
        { scale: 1, opacity: 1, duration: 0.88, ease: 'power3.out', onStart: () => animateSlideEntrance(toIdx) },
        0.26
      );
  }

  // ======================== Transition 2: Click-Origin Ink-Fire Burn-Away ========================
  function transitionWithFire(fromIdx, toIdx, clickPoint) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];
    syncViewport();

    const cx = clickPoint ? Math.max(0, Math.min(w, clickPoint.x)) : w * 0.52;
    const cy = clickPoint ? Math.max(0, Math.min(h, clickPoint.y)) : h * 0.48;
    const maxCorner = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy)
    );
    const maxR = Math.round(maxCorner + 390);

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    const burnContainer = document.createElement('div');
    burnContainer.className = 'burn-outgoing';
    burnContainer.appendChild(makeCleanClone(fromSlide));
    transitionHost.appendChild(burnContainer);

    burnTurb.setAttribute('seed', String(Math.floor(Math.random() * 900) + 1));
    [burnHole, burnRingSoot, burnRingFlame, burnRingEmber].forEach(c => {
      c.setAttribute('cx', String(Math.round(cx)));
      c.setAttribute('cy', String(Math.round(cy)));
      c.setAttribute('r', '10');
    });

    burnDisp.setAttribute('scale', '42');
    gsap.set(burnFlameGroup, { opacity: 1 });
    fireOriginFlash = { x: cx, y: cy, life: 0, maxLife: 0.36 };

    const state = { r: 10, disp: 42, freqOffset: 0 };
    const tl = gsap.timeline({ onComplete: finishActiveTransition });

    activeCleanup = () => {
      tl.kill();
      gsap.set(burnFlameGroup, { opacity: 0 });
      burnHole.setAttribute('r', '0');
      [burnRingSoot, burnRingFlame, burnRingEmber].forEach(c => c.setAttribute('r', '0'));
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    tl.to(state, {
      r: maxR,
      duration: 1.65,
      ease: 'fireSpread',
      onUpdate: () => {
        const rVal = state.r.toFixed(1);
        burnHole.setAttribute('r', rVal);
        burnRingSoot.setAttribute('r', String((state.r + 14).toFixed(1)));
        burnRingFlame.setAttribute('r', rVal);
        burnRingEmber.setAttribute('r', rVal);
        if (state.r < maxCorner + 140) emitBurnPerimeterParticles(cx, cy, state.r, w, h);
      },
    }, 0)
      .to(state, {
        disp: 270,
        duration: 0.42,
        ease: 'power2.out',
        onUpdate: () => burnDisp.setAttribute('scale', state.disp.toFixed(1)),
      }, 0)
      .to(state, {
        freqOffset: 0.003,
        duration: 1.65,
        ease: 'none',
        onUpdate: () => {
          const f1 = (0.012 + state.freqOffset).toFixed(4);
          const f2 = (0.014 - state.freqOffset * 0.5).toFixed(4);
          burnTurb.setAttribute('baseFrequency', `${f1} ${f2}`);
        },
      }, 0)
      .fromTo(
        toSlide,
        { opacity: 0.25, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 1.05, ease: 'power2.out', onStart: () => animateSlideEntrance(toIdx) },
        0.34
      )
      .to(burnFlameGroup, { opacity: 0, duration: 0.24, ease: 'power1.out' }, 1.41);
  }

  // ======================== Transition 3: Multi-Fist Paper Puncture & Shatter ========================
  function makeTornStarPoints(cx, cy, radius, spikes = 9) {
    const pts = [];
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (i / (spikes * 2)) * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
      const r = i % 2 === 0
        ? radius * (0.84 + Math.random() * 0.42)
        : radius * (0.48 + Math.random() * 0.24);
      pts.push(`${Math.round(cx + Math.cos(ang) * r)},${Math.round(cy + Math.sin(ang) * r)}`);
    }
    return pts.join(' ');
  }

  function transitionWithFists(fromIdx, toIdx, clickPoint) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];
    syncViewport();

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    fistsTurb.setAttribute('seed', String(Math.floor(Math.random() * 800) + 1));
    fistsHolesGroup.innerHTML = '';
    fistsRimsGroup.innerHTML = '';
    gsap.set(fistsRimsGroup, { opacity: 1 });

    // Build 12 radial torn polygon wedges around smash epicenter so holes persist seamlessly during shatter!
    const epiX = clickPoint ? Math.max(w * 0.18, Math.min(w * 0.82, clickPoint.x)) : w * 0.5;
    const epiY = clickPoint ? Math.max(h * 0.18, Math.min(h * 0.82, clickPoint.y)) : h * 0.5;
    const outerDist = Math.hypot(w, h) + 200;
    const shardCount = 12;
    const angles = [];
    for (let i = 0; i < shardCount; i++) {
      angles.push((i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.18);
    }

    const shards = [];
    for (let i = 0; i < shardCount; i++) {
      const a1 = angles[i];
      const a2 = angles[(i + 1) % shardCount];
      const p1x = Math.round(epiX + Math.cos(a1) * outerDist);
      const p1y = Math.round(epiY + Math.sin(a1) * outerDist);
      const p2x = Math.round(epiX + Math.cos(a2) * outerDist);
      const p2y = Math.round(epiY + Math.sin(a2) * outerDist);
      const poly = `polygon(${Math.round(epiX)}px ${Math.round(epiY)}px, ${p1x}px ${p1y}px, ${p2x}px ${p2y}px)`;

      const shard = document.createElement('div');
      shard.className = 'fists-shard';
      shard.style.clipPath = poly;
      shard.style.webkitClipPath = poly;
      shard.style.webkitMask = 'url(#ink-fists-mask)';
      shard.style.mask = 'url(#ink-fists-mask)';
      shard.style.transformOrigin = `${Math.round(epiX)}px ${Math.round(epiY)}px`;
      shard.appendChild(makeCleanClone(fromSlide));
      transitionHost.appendChild(shard);

      const midAngle = a1 + ((a2 - a1 + Math.PI * 2) % (Math.PI * 2)) * 0.5;
      shards.push({ el: shard, midAngle });
    }

    // Plan 7 cascading punch impacts + 1 heavy center breakthrough
    const punchPlan = [
      { x: epiX, y: epiY, t: 0.0, radius: 118, fistSize: 66 },
      { x: w * 0.24, y: h * 0.30, t: 0.09, radius: 105, fistSize: 58 },
      { x: w * 0.76, y: h * 0.28, t: 0.18, radius: 112, fistSize: 60 },
      { x: w * 0.34, y: h * 0.72, t: 0.27, radius: 108, fistSize: 58 },
      { x: w * 0.72, y: h * 0.70, t: 0.36, radius: 116, fistSize: 62 },
      { x: w * 0.50, y: h * 0.24, t: 0.45, radius: 112, fistSize: 60 },
      { x: w * 0.19, y: h * 0.56, t: 0.54, radius: 106, fistSize: 58 },
    ];

    const tl = gsap.timeline({ onComplete: finishActiveTransition });

    activeCleanup = () => {
      tl.kill();
      activeFists.length = 0;
      shockRings.length = 0;
      fistsHolesGroup.innerHTML = '';
      fistsRimsGroup.innerHTML = '';
      gsap.set(fistsRimsGroup, { opacity: 0 });
      gsap.set(stage, { x: 0, y: 0 });
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    punchPlan.forEach((p, idx) => {
      tl.call(() => {
        // Launch animated martial ink-fist toward target spot
        const dx = p.x - w * 0.5;
        const dy = p.y - h * 0.5;
        const angle = Math.atan2(dy, dx) * 0.35 + (idx % 2 === 0 ? -0.25 : 0.25);
        activeFists.push({ x: p.x, y: p.y, size: p.fistSize, angle, life: 0, maxLife: 0.24 });

        // At fist contact (~75ms into 240ms fist dive): rip ragged hole & shockwave
        gsap.delayedCall(0.07, () => {
          if (!activeCleanup) return;
          const pts = makeTornStarPoints(p.x, p.y, p.radius, 9);
          const hole = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          hole.setAttribute('points', pts);
          hole.setAttribute('fill', 'black');
          fistsHolesGroup.appendChild(hole);

          const rim = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          rim.setAttribute('points', pts);
          rim.setAttribute('fill', 'none');
          rim.setAttribute('stroke', getThemeFx().fistRim);
          rim.setAttribute('stroke-width', '2.5');
          rim.setAttribute('opacity', '0.88');
          fistsRimsGroup.appendChild(rim);

          shockRings.push({ x: p.x, y: p.y, maxR: p.radius * 1.45, life: 0, maxLife: 0.34 });
          spawnPaperBurstParticles(p.x, p.y, 18, 0.9);
          gsap.fromTo(stage, { x: (Math.random() - 0.5) * 9, y: (Math.random() - 0.5) * 9 }, { x: 0, y: 0, duration: 0.11, ease: 'power2.out' });
        });
      }, null, p.t);
    });

    // Final Breakthrough Punch at t = 0.68s shatters ALL 12 perforated shards outward!
    tl.call(() => {
      activeFists.push({ x: epiX, y: epiY, size: 96, angle: 0, life: 0, maxLife: 0.3 });
    }, null, 0.65)
      .call(() => {
        if (!activeCleanup) return;
        shockRings.push({ x: epiX, y: epiY, maxR: Math.max(w, h) * 0.52, life: 0, maxLife: 0.5 });
        spawnPaperBurstParticles(epiX, epiY, 44, 1.4);
        gsap.fromTo(stage, { x: -7, y: 6 }, { x: 0, y: 0, duration: 0.22, ease: 'elastic.out(1.2, 0.35)' });
      }, null, 0.74)
      .to(fistsRimsGroup, { opacity: 0, duration: 0.25 }, 0.76)
      .to(
        shards.map(s => s.el),
        {
          x: i => Math.cos(shards[i].midAngle) * w * (0.76 + Math.random() * 0.34),
          y: i => Math.sin(shards[i].midAngle) * h * (0.88 + Math.random() * 0.36) + 110,
          rotation: () => (Math.random() - 0.5) * 68,
          scale: 0.58,
          opacity: 0,
          duration: 0.72,
          stagger: { amount: 0.05, from: 'center' },
          ease: 'power3.out',
        },
        0.74
      )
      .fromTo(
        toSlide,
        { scale: 0.93, opacity: 0.42 },
        { scale: 1, opacity: 1, duration: 0.76, ease: 'power3.out', onStart: () => animateSlideEntrance(toIdx) },
        0.74
      );
  }

  // ======================== Transition 4: Origami Crane Flock Carrying Scene Away ========================
  function transitionWithCranes(fromIdx, toIdx, clickPoint) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];
    syncViewport();

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    const cranesContainer = document.createElement('div');
    cranesContainer.className = 'cranes-outgoing';
    cranesContainer.appendChild(makeCleanClone(fromSlide));
    transitionHost.appendChild(cranesContainer);

    // Gradient sweeps from lower-left (0,1) toward upper-right (1,0), revealing Slide B seamlessly behind
    cranesGrad.setAttribute('x1', '0');
    cranesGrad.setAttribute('y1', '1');
    cranesGrad.setAttribute('x2', '1');
    cranesGrad.setAttribute('y2', '0');
    cranesStop0.setAttribute('offset', '0%');
    cranesStop1.setAttribute('offset', '0%');
    cranesStop2.setAttribute('offset', '4%');

    // Spawn 38 origami paper cranes staggered cleanly across diagonal wind stream
    const diagLen = Math.hypot(w, h);
    const dirX = w / diagLen;
    const dirY = -h / diagLen; // flight vector: lower-left -> upper-right
    const perpX = -dirY;
    const perpY = dirX;
    const baseSpeed = diagLen * 1.15;

    activeCranes.length = 0;
    const totalCranes = 52;
    for (let i = 0; i < totalCranes; i++) {
      const waveT = i / totalCranes; // 0..1 leading to trailing
      const spreadAcrossBand = (Math.random() - 0.5) * Math.min(w, h) * 1.48;
      const startAlong = -210 - waveT * 520 + (clickPoint ? -50 : 0);
      const startX = w * 0.25 + dirX * startAlong + perpX * spreadAcrossBand;
      const startY = h * 0.78 + dirY * startAlong + perpY * spreadAcrossBand;
      const spdMult = 0.88 + Math.random() * 0.34;
      const isHero = i % 6 === 0;

      activeCranes.push({
        x: startX,
        y: startY,
        vx: dirX * baseSpeed * spdMult,
        vy: dirY * baseSpeed * spdMult,
        heading: Math.atan2(dirY, dirX),
        size: isHero ? (42 + Math.random() * 20) : (16 + Math.random() * 20),
        flapSpeed: 8.5 + Math.random() * 5.8,
        phase: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: 1.62 + Math.random() * 0.38,
        baseAlpha: isHero ? 0.96 : (0.7 + Math.random() * 0.26),
        alpha: 0,
      });
    }

    const wipeState = { progress: -0.06, lastFeatherT: 0 };
    const tl = gsap.timeline({ onComplete: finishActiveTransition });

    activeCleanup = () => {
      tl.kill();
      activeCranes.length = 0;
      cranesStop0.setAttribute('offset', '0%');
      cranesStop1.setAttribute('offset', '0%');
      cranesStop2.setAttribute('offset', '0%');
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    tl.to(wipeState, {
      progress: 1.18,
      duration: 1.36,
      ease: 'craneGust',
      onUpdate: () => {
        const edge = Math.max(-8, Math.min(118, wipeState.progress * 100));
        const lead = Math.max(-2, Math.min(122, edge + 14));
        cranesStop1.setAttribute('offset', `${edge.toFixed(1)}%`);
        cranesStop2.setAttribute('offset', `${lead.toFixed(1)}%`);

        // Emit golden folded-paper fragments along the swept lifting border
        if (wipeState.progress > 0.05 && wipeState.progress < 0.96 && wipeState.progress - wipeState.lastFeatherT > 0.04) {
          wipeState.lastFeatherT = wipeState.progress;
          const fx = w * wipeState.progress;
          const fy = h * (1 - wipeState.progress);
          const off = (Math.random() - 0.5) * 320;
          emitCraneWakeFeathers(fx + perpX * off, fy + perpY * off, dirX * baseSpeed, dirY * baseSpeed, 4);
        }
      },
    }, 0.14)
      // Old slide lifts and drifts gently up-right as if carried off by the crane flock
      .to(cranesContainer, {
        x: 110,
        y: -62,
        scale: 0.96,
        duration: 1.42,
        ease: 'power2.inOut',
      }, 0.06)
      .fromTo(
        toSlide,
        { opacity: 0.35, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 1.05, ease: 'power2.out', onStart: () => animateSlideEntrance(toIdx) },
        0.48
      );
  }

  // ======================== Transition 5: Draped Silk Curtain Center Parting (Zero-Flicker GPU Dual-Wing) ========================
  function transitionWithCurtain(fromIdx, toIdx) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];
    syncViewport();

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    const curtainStage = document.createElement('div');
    curtainStage.className = 'curtain-stage';
    transitionHost.appendChild(curtainStage);

    const halfW = w * 0.5;

    function buildCurtainWing(isLeft) {
      const wing = document.createElement('div');
      wing.className = `curtain-wing ${isLeft ? 'is-left' : 'is-right'}`;
      wing.style.transformOrigin = isLeft ? 'left top' : 'right top';

      const clone = makeCleanClone(fromSlide);
      clone.style.top = '0px';
      clone.style.right = 'auto';
      clone.style.bottom = 'auto';
      clone.style.left = isLeft ? '0px' : `${-halfW}px`;
      clone.style.width = `${w}px`;
      clone.style.height = `${h}px`;
      wing.appendChild(clone);

      const pleatLayer = document.createElement('div');
      pleatLayer.className = 'curtain-pleat-layer';
      wing.appendChild(pleatLayer);

      const trim = document.createElement('div');
      trim.className = `curtain-hem-glow ${isLeft ? 'is-left-seam' : 'is-right-seam'}`;
      wing.appendChild(trim);

      return { wing, pleatLayer, trim };
    }

    const left = buildCurtainWing(true);
    const right = buildCurtainWing(false);
    curtainStage.appendChild(left.wing);
    curtainStage.appendChild(right.wing);

    curtainRail = {
      alpha: 0,
      leftWing: left.wing,
      rightWing: right.wing,
    };

    gsap.set(toSlide, { scale: 0.98, opacity: 0.88 });
    const tl = gsap.timeline({ onComplete: () => finishActiveTransition(false) });

    activeCleanup = () => {
      tl.kill();
      curtainRail = null;
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    // Pure GPU 2-wing smooth pull: zero seams, zero per-frame DOM thrash, zero flicker
    tl.to(curtainRail, { alpha: 0.96, duration: 0.18, ease: 'sine.out' }, 0)
      .to([left.trim, right.trim], { opacity: 1, duration: 0.18, ease: 'sine.out' }, 0)
      .to([left.pleatLayer, right.pleatLayer], { opacity: 0.9, duration: 0.45, ease: 'power2.out' }, 0.04)
      .to(left.wing, { scaleX: 0.14, duration: 1.05, ease: 'curtainPull' }, 0.04)
      .to(right.wing, { scaleX: 0.14, duration: 1.05, ease: 'curtainPull' }, 0.04)
      // Smooth continuous momentum sweep without jitter
      .to(left.wing, { skewX: -3.2, duration: 0.42, ease: 'sine.inOut' }, 0.06)
      .to(right.wing, { skewX: 3.2, duration: 0.42, ease: 'sine.inOut' }, 0.06)
      .to([left.wing, right.wing], { skewX: 0, duration: 0.56, ease: 'sine.inOut' }, 0.48)
      // Glide gathered silk pleats off frame edges
      .to(left.wing, { x: -halfW * 0.18, opacity: 0, duration: 0.36, ease: 'power2.in' }, 0.94)
      .to(right.wing, { x: halfW * 0.18, opacity: 0, duration: 0.36, ease: 'power2.in' }, 0.94)
      .to(curtainRail, { alpha: 0, duration: 0.24, ease: 'sine.out' }, 1.02)
      .to(
        toSlide,
        { scale: 1, opacity: 1, duration: 0.96, ease: 'power2.out', onStart: () => animateSlideEntrance(toIdx) },
        0.10
      );
  }

  // ======================== Transition 6: Gale-Force Ink Wind Blow-Away ========================
  function transitionWithWind(fromIdx, toIdx) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];
    syncViewport();

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    const windContainer = document.createElement('div');
    windContainer.className = 'wind-outgoing';
    windContainer.appendChild(makeCleanClone(fromSlide));

    const glint = document.createElement('div');
    glint.className = 'wind-billow-glint';
    windContainer.appendChild(glint);
    transitionHost.appendChild(windContainer);

    windTurb.setAttribute('seed', String(Math.floor(Math.random() * 800) + 1));
    windDisp.setAttribute('scale', '0');

    const windState = { disp: 0, freq: 0.005 };
    const tl = gsap.timeline({ onComplete: finishActiveTransition });

    activeCleanup = () => {
      tl.kill();
      windStreaks.length = 0;
      windDisp.setAttribute('scale', '0');
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    // Gust 1: Ripple wave lifts sheet edge & sprays initial ink-wind ribbons
    tl.call(() => {
      spawnWindGust(w, h, 20);
      spawnPaperBurstParticles(w * 0.22, h * 0.72, 26, 1.15);
    }, null, 0.02)
      .call(() => {
        spawnWindGust(w, h, 24);
        spawnPaperBurstParticles(w * 0.56, h * 0.45, 22, 1.25);
      }, null, 0.28)
      .to(windState, {
        disp: 92,
        duration: 0.92,
        ease: 'power2.in',
        onUpdate: () => windDisp.setAttribute('scale', windState.disp.toFixed(1)),
      }, 0)
      .to(windState, {
        freq: 0.011,
        duration: 0.95,
        ease: 'none',
        onUpdate: () => windTurb.setAttribute('baseFrequency', `${windState.freq.toFixed(4)} ${(windState.freq * 2.2).toFixed(4)}`),
      }, 0)
      .to(glint, { opacity: 0.92, duration: 0.18, ease: 'power1.out' }, 0.05)
      .to(glint, { xPercent: 115, duration: 0.72, ease: 'power2.inOut' }, 0.08)
      // Phase 1 flutter curl
      .to(windContainer, {
        y: -24,
        scaleX: 0.94,
        scaleY: 0.96,
        skewY: -4.2,
        rotation: 4.5,
        duration: 0.34,
        ease: 'power2.out',
      }, 0.02)
      // Phase 2 caught in full gale — swept off diagonal upper-right
      .to(windContainer, {
        x: w * 1.16,
        y: -h * 0.46,
        rotation: 26,
        skewX: -18,
        scaleX: 0.54,
        scaleY: 0.76,
        opacity: 0,
        duration: 0.88,
        ease: 'windGust',
      }, 0.30)
      .fromTo(
        toSlide,
        { scale: 0.95, opacity: 0.38 },
        { scale: 1, opacity: 1, duration: 0.92, ease: 'power2.out', onStart: () => animateSlideEntrance(toIdx) },
        0.26
      );
  }

  // ======================== Transition 7: Rapid Paper Crumple & Parabolic Toss-Out ========================
  function transitionWithCrumple(fromIdx, toIdx) {
    const { w, h } = getStageDims();
    const fromSlide = slides[fromIdx];
    const toSlide = slides[toIdx];
    syncViewport();

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-under');
      if (i === toIdx) s.classList.add('is-under');
    });

    if (prefersReduced || !hasGSAP) { fallbackSwap(toIdx); return; }

    const cx = w * 0.5;
    const cy = h * 0.48;
    const ballRadius = Math.max(66, Math.min(w, h) * 0.105);

    const crumpleContainer = document.createElement('div');
    crumpleContainer.className = 'crumple-outgoing';
    crumpleContainer.style.transformOrigin = `${Math.round(cx)}px ${Math.round(cy)}px`;
    crumpleContainer.appendChild(makeCleanClone(fromSlide));

    // Geometric paper crinkle crease lines overlay during inward pinch
    const creaseSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    creaseSvg.setAttribute('class', 'crumple-crease-svg');
    creaseSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    creaseSvg.setAttribute('preserveAspectRatio', 'none');
    const creaseLines = [
      [0, 0, cx - 22, cy - 14], [w, 0, cx + 18, cy - 16], [0, h, cx - 16, cy + 20], [w, h, cx + 22, cy + 16],
      [w * 0.5, 0, cx + 12, cy - 28], [w * 0.5, h, cx - 10, cy + 28], [0, h * 0.5, cx - 32, cy], [w, h * 0.5, cx + 30, cy],
      [w * 0.22, 0, cx - 12, cy], [w * 0.78, h, cx + 12, cy], [0, h * 0.28, w, h * 0.72], [w * 0.26, h, w * 0.74, 0],
    ];
    const fx = getThemeFx();
    creaseLines.forEach(([x1, y1, x2, y2], idx) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', x1);
      l.setAttribute('y1', y1);
      l.setAttribute('x2', x2);
      l.setAttribute('y2', y2);
      l.setAttribute('stroke', idx % 2 === 0 ? fx.creaseLight : fx.creaseDark);
      l.setAttribute('stroke-width', idx % 2 === 0 ? '2.5' : '4');
      creaseSvg.appendChild(l);
    });
    crumpleContainer.appendChild(creaseSvg);
    transitionHost.appendChild(crumpleContainer);

    crumpleTurb.setAttribute('seed', String(Math.floor(Math.random() * 800) + 1));
    crumpleDisp.setAttribute('scale', '0');

    const numRays = 14;
    const outerDist = Math.hypot(w, h) * 0.85;
    const endClipR = Math.min(w, h) * 0.42; // combined with scale 0.26 => ~100px faceted paper ball!
    const rays = Array.from({ length: numRays }, (_, i) => ({
      ang: (i / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.2,
      jit: 0.74 + Math.random() * 0.36,
    }));

    activePaperBall = createPaperBallModel(cx, cy, ballRadius);

    const cState = { pinch: 0, disp: 0 };
    const tl = gsap.timeline({ onComplete: finishActiveTransition });

    activeCleanup = () => {
      tl.kill();
      activePaperBall = null;
      crumpleDisp.setAttribute('scale', '0');
      gsap.set(stage, { x: 0, y: 0 });
      transitionHost.innerHTML = '';
      slides.forEach((s, i) => {
        s.classList.remove('is-under');
        s.classList.toggle('is-active', i === toIdx);
      });
      gsap.set(toSlide, { clearProps: 'transform,opacity,filter' });
      currentIdx = toIdx;
      updateHUD(toIdx);
    };

    function updatePolygonClip() {
      const r = outerDist + (endClipR - outerDist) * cState.pinch;
      const polyPts = rays
        .map(ray => {
          const px = Math.round(cx + Math.cos(ray.ang) * r * ray.jit);
          const py = Math.round(cy + Math.sin(ray.ang) * r * ray.jit);
          return `${px}px ${py}px`;
        })
        .join(', ');
      const clip = `polygon(${polyPts})`;
      crumpleContainer.style.clipPath = clip;
      crumpleContainer.style.webkitClipPath = clip;
    }
    updatePolygonClip();

    // Stage 1 (0..0.46s): Rapidly pinch slide toward center with crinkle distortion & dust
    tl.to(cState, {
      pinch: 1,
      duration: 0.44,
      ease: 'power3.inOut',
      onUpdate: updatePolygonClip,
    }, 0)
      .to(cState, {
        disp: 145,
        duration: 0.42,
        ease: 'power2.out',
        onUpdate: () => crumpleDisp.setAttribute('scale', cState.disp.toFixed(1)),
      }, 0)
      .to(creaseSvg, { opacity: 0.96, duration: 0.28, ease: 'power2.out' }, 0.04)
      .to(crumpleContainer, {
        scale: 0.25,
        rotation: -24,
        duration: 0.44,
        ease: 'power3.inOut',
      }, 0)
      .call(() => {
        spawnPaperBurstParticles(cx, cy, 34, 0.92);
        gsap.fromTo(stage, { x: -4, y: 3 }, { x: 0, y: 0, duration: 0.14, ease: 'power2.out' });
      }, null, 0.24)
      .fromTo(
        toSlide,
        { scale: 0.94, opacity: 0.28 },
        { scale: 1, opacity: 1, duration: 0.85, ease: 'power3.out', onStart: () => animateSlideEntrance(toIdx) },
        0.18
      )
      // Stage 2 (0.40..0.52s): Faceted paper ball snaps solid in center
      .to(activePaperBall, { alpha: 1, scale: 1.04, duration: 0.08, ease: 'power2.out' }, 0.39)
      .to(crumpleContainer, { opacity: 0, duration: 0.08, ease: 'none' }, 0.41)
      // Stage 3 (0.52s -> out): Parabolic toss right & slightly up before arcing out!
      .call(() => {
        if (!activePaperBall) return;
        activePaperBall.isThrown = true;
        activePaperBall.vx = w * 1.18;
        activePaperBall.vy = -h * 0.74;
        activePaperBall.gravity = h * 2.45;
        activePaperBall.rotSpeed = 11.5;
        spawnPaperBurstParticles(cx, cy, 24, 1.35);
      }, null, 0.52)
      .to(activePaperBall, {
        scale: 0.56,
        alpha: 0,
        duration: 0.58,
        ease: 'power1.in',
      }, 0.56);
  }

  // ======================== Master Navigation Router ========================
  function navigateTo(targetIdx, forcedKind = null, clickPoint = null) {
    const total = slides.length;
    const normalized = ((targetIdx % total) + total) % total;
    if (normalized === currentIdx) return;

    finishActiveTransition(true);
    const fromIdx = currentIdx;
    primeSlideEntrance(normalized);

    let kind = forcedKind;
    if (!kind) {
      if (selectedMode === 'auto') {
        kind = (slides[fromIdx] && slides[fromIdx].dataset.outTransition) || AUTO_CYCLE[fromIdx % AUTO_CYCLE.length];
      } else {
        kind = selectedMode;
      }
    }

    if (kind === 'fire') {
      transitionWithFire(fromIdx, normalized, clickPoint);
    } else if (kind === 'fists') {
      transitionWithFists(fromIdx, normalized, clickPoint);
    } else if (kind === 'cranes') {
      transitionWithCranes(fromIdx, normalized, clickPoint);
    } else if (kind === 'curtain') {
      transitionWithCurtain(fromIdx, normalized);
    } else if (kind === 'wind') {
      transitionWithWind(fromIdx, normalized);
    } else if (kind === 'crumple') {
      transitionWithCrumple(fromIdx, normalized);
    } else {
      transitionWithBlade(fromIdx, normalized, clickPoint);
    }
  }

  window.__inkDeck = {
    getCurrent: () => currentIdx,
    getTotal: () => slides.length,
    getMode: () => selectedMode,
    setMode: m => setMode(m),
    getTheme: () => document.documentElement.getAttribute('data-theme') || THEMES[0],
    getThemes: () => [...THEMES],
    setTheme: name => setTheme(name),
    cycleTheme: () => cycleTheme(),
    getTransitions: () => [...AUTO_CYCLE],
    go: (idx, kind, x, y) => navigateTo(idx, kind, typeof x === 'number' && typeof y === 'number' ? { x, y } : null),
  };

  function setMode(mode) {
    selectedMode = mode;
    hudModeBtns.forEach(btn => btn.classList.toggle('is-active', btn.dataset.mode === mode));
  }

  // ======================== Interactive Listeners ========================
  stage.addEventListener('click', e => {
    if (e.target.closest('#deck-hud, button, a, .skill-row, [data-trigger-trans]')) return;
    const rect = stage.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const nextIdx = (currentIdx + 1) % slides.length;
    // In 'auto' mode, direct canvas clicks prioritize spatial transitions (fire -> fists -> cranes -> blade) centered on click!
    navigateTo(nextIdx, selectedMode === 'auto' ? null : selectedMode, point);
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-trigger-trans]');
    if (!btn) return;
    const rawKind = btn.dataset.triggerTrans;
    const target = btn.dataset.target === 'next' ? currentIdx + 1 : Number(btn.dataset.target || 0);
    const rect = stage.getBoundingClientRect();
    if (rawKind === 'auto-cycle') {
      setMode('auto');
      navigateTo(target, null, { x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }
    navigateTo(target, rawKind, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  });

  hudDots.forEach(dot => {
    dot.addEventListener('click', () => {
      navigateTo(Number(dot.dataset.jump), selectedMode === 'auto' ? null : selectedMode);
    });
  });

  hudModeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  if (hudThemeBtn) {
    hudThemeBtn.addEventListener('click', () => cycleTheme());
  }

  hudHideBtn.addEventListener('click', () => document.body.classList.toggle('hud-hidden'));

  hudFsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      navigateTo(currentIdx + 1);
    } else if (e.key === 'Enter' && !e.target.closest('button, a, input, textarea, select')) {
      e.preventDefault();
      navigateTo(currentIdx + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      navigateTo(currentIdx - 1);
    } else if (k === 'b') {
      setMode('blade');
      navigateTo(currentIdx + 1, 'blade');
    } else if (k === 'g') {
      setMode('fire');
      navigateTo(currentIdx + 1, 'fire');
    } else if (k === 'p') {
      setMode('fists');
      navigateTo(currentIdx + 1, 'fists');
    } else if (k === 'c') {
      setMode('cranes');
      navigateTo(currentIdx + 1, 'cranes');
    } else if (k === 'm') {
      setMode('curtain');
      navigateTo(currentIdx + 1, 'curtain');
    } else if (k === 'w') {
      setMode('wind');
      navigateTo(currentIdx + 1, 'wind');
    } else if (k === 'r') {
      setMode('crumple');
      navigateTo(currentIdx + 1, 'crumple');
    } else if (k === 't') {
      cycleTheme();
    } else if (k === 'f' && !e.ctrlKey && !e.metaKey) {
      hudFsBtn.click();
    } else if (k === 'h') {
      document.body.classList.toggle('hud-hidden');
    } else if (e.key >= '1' && e.key <= '9') {
      const target = Number(e.key) - 1;
      if (target < slides.length) navigateTo(target);
    }
  });

  window.addEventListener('resize', () => {
    syncViewport();
    initAmbientMotes();
  });

  // ======================== Boot ========================
  syncViewport();
  initAmbientMotes();
  prepareSplitText();
  animateSlideEntrance(0);
  updateHUD(0);
  requestAnimationFrame(tickCanvas);
})();
