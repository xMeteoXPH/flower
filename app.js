const svg = document.getElementById('garden-svg');
const btn = document.getElementById('waterBtn');
const hint = document.getElementById('hint');

// Lower ground = more tulip visible
const GROUND_Y = 530;

const COLORS = [
  { main: '#f48fb1', dark: '#c2185b', light: '#fce4ec', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // pink
  { main: '#ef5350', dark: '#b71c1c', light: '#ffcdd2', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // red
  { main: '#ffa726', dark: '#bf360c', light: '#ffe0b2', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // orange
  { main: '#90caf9', dark: '#1565c0', light: '#e3f2fd', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // blue
  { main: '#fff176', dark: '#f57f17', light: '#fffde7', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // yellow
  { main: '#ce93d8', dark: '#6a1b9a', light: '#f3e5f5', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // purple
  { main: '#f0f0f0', dark: '#9e9e9e', light: '#ffffff', leaf: '#4a7c3f', leafDark: '#2e5e25' }, // white
];

const TULIPS = [
  { x: 55,  h: 200, s: 0.85, ci: 0, tilt: -6,  delay: 0   },
  { x: 135, h: 230, s: 0.96, ci: 1, tilt: -2,  delay: 120 },
  { x: 215, h: 215, s: 0.90, ci: 2, tilt:  3,  delay: 240 },
  { x: 300, h: 240, s: 1.00, ci: 3, tilt: -4,  delay: 360 },
  { x: 385, h: 225, s: 0.93, ci: 4, tilt:  5,  delay: 480 },
  { x: 470, h: 235, s: 0.97, ci: 5, tilt: -3,  delay: 600 },
  { x: 555, h: 210, s: 0.87, ci: 6, tilt:  6,  delay: 720 },
  { x: 635, h: 222, s: 0.92, ci: 0, tilt: -5,  delay: 840 },
  { x: 718, h: 205, s: 0.86, ci: 1, tilt:  2,  delay: 960 },
  // second row (shorter)
  { x: 92,  h: 175, s: 0.73, ci: 2, tilt:  4,  delay: 60  },
  { x: 175, h: 182, s: 0.76, ci: 3, tilt: -5,  delay: 180 },
  { x: 258, h: 178, s: 0.74, ci: 4, tilt:  2,  delay: 300 },
  { x: 342, h: 185, s: 0.77, ci: 5, tilt: -6,  delay: 420 },
  { x: 428, h: 180, s: 0.75, ci: 6, tilt:  3,  delay: 540 },
  { x: 512, h: 188, s: 0.78, ci: 0, tilt: -2,  delay: 660 },
  { x: 596, h: 172, s: 0.72, ci: 1, tilt:  5,  delay: 780 },
  { x: 678, h: 180, s: 0.75, ci: 2, tilt: -4,  delay: 900 },
  { x: 758, h: 190, s: 0.79, ci: 3, tilt:  1,  delay: 1020},
];

function ns(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

// easing functions
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
const easeOutBack  = p => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

function lerp(a, b, t) { return a + (b - a) * t; }

// Animate a value over time, calling onUpdate(easedValue 0..1), then onDone
function animate(duration, easeFn, onUpdate, onDone) {
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    onUpdate(easeFn(p));
    if (p < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

// ── Build one tulip, returns { group, animateGrow, reset } ──
function makeTulip(t, idx) {
  const c  = COLORS[t.ci];
  const s  = t.s;
  const x  = t.x;
  const h  = t.h;

  const bw  = 38 * s;
  const bh  = 54 * s;
  const stemH = h - bh;           // stem-only height
  const bloomTopY = GROUND_Y - h; // final top of bloom
  const bloomBotY = GROUND_Y - h + bh; // bloom bottom = stem top

  const outer = ns('g');
  outer.setAttribute('transform', `rotate(${t.tilt}, ${x}, ${GROUND_Y})`);
  outer.setAttribute('class', 'tulip-group');

  // ── STEM (animated: grows from GROUND_Y upward) ──────────
  const stem = ns('rect');
  stem.setAttribute('x', x - 4 * s);
  stem.setAttribute('y', GROUND_Y);   // will animate
  stem.setAttribute('width', 8 * s);
  stem.setAttribute('height', 0);     // will animate
  stem.setAttribute('rx', 4 * s);
  stem.setAttribute('fill', c.leaf);
  outer.appendChild(stem);

  // ── LEFT LEAF (unfurls via clipPath) ─────────────────────
  const leafLClipId = `llc-${idx}`;
  const leafLClip = ns('clipPath');
  leafLClip.setAttribute('id', leafLClipId);
  const leafLRect = ns('rect');
  leafLRect.setAttribute('x', x - 100 * s);
  leafLRect.setAttribute('y', GROUND_Y);
  leafLRect.setAttribute('width', 110 * s);
  leafLRect.setAttribute('height', 0);
  leafLClip.appendChild(leafLRect);

  const lly = GROUND_Y - h * 0.52;
  const leafL = ns('path');
  leafL.setAttribute('d',
    `M ${x} ${lly}
     C ${x-42*s} ${lly-18*s}, ${x-60*s} ${lly-68*s}, ${x-24*s} ${lly-118*s}
     C ${x-7*s}  ${lly-84*s}, ${x-3*s}  ${lly-40*s}, ${x} ${lly} Z`
  );
  leafL.setAttribute('fill', c.leafDark);
  leafL.setAttribute('clip-path', `url(#${leafLClipId})`);

  // ── RIGHT LEAF ────────────────────────────────────────────
  const leafRClipId = `lrc-${idx}`;
  const leafRClip = ns('clipPath');
  leafRClip.setAttribute('id', leafRClipId);
  const leafRRect = ns('rect');
  leafRRect.setAttribute('x', x);
  leafRRect.setAttribute('y', GROUND_Y);
  leafRRect.setAttribute('width', 100 * s);
  leafRRect.setAttribute('height', 0);
  leafRClip.appendChild(leafRRect);

  const rly = GROUND_Y - h * 0.40;
  const leafR = ns('path');
  leafR.setAttribute('d',
    `M ${x} ${rly}
     C ${x+40*s} ${rly-16*s}, ${x+55*s} ${rly-62*s}, ${x+22*s} ${rly-112*s}
     C ${x+6*s}  ${rly-78*s}, ${x+2*s}  ${rly-36*s}, ${x} ${rly} Z`
  );
  leafR.setAttribute('fill', c.leaf);
  leafR.setAttribute('clip-path', `url(#${leafRClipId})`);

  // ── BLOOM group (fades + scales in after stem done) ───────
  const bloomG = ns('g');
  bloomG.setAttribute('opacity', '0');
  // bloom drawn at final position, we'll scale it from bud→open
  // using a nested group with transform-origin at bloom bottom

  const ty = bloomTopY;
  const by2 = bloomBotY;

  // shadow
  const shadow = ns('path');
  shadow.setAttribute('d',
    `M ${x-bw*0.25} ${ty+bh*0.18}
     C ${x-bw*1.05} ${ty+bh*0.5}, ${x-bw*0.9} ${by2}, ${x} ${by2}
     C ${x+bw*0.9}  ${by2}, ${x+bw*0.6} ${ty+bh*0.4}, ${x+bw*0.45} ${ty+bh*0.12} Z`
  );
  shadow.setAttribute('fill', c.dark);
  shadow.setAttribute('opacity', '0.28');
  bloomG.appendChild(shadow);

  // body
  const body = ns('path');
  body.setAttribute('d',
    `M ${x-bw*0.12} ${ty}
     C ${x-bw*1.08} ${ty+bh*0.22}, ${x-bw*1.05} ${ty+bh*0.82}, ${x} ${by2}
     C ${x+bw*1.05} ${ty+bh*0.82}, ${x+bw*1.08} ${ty+bh*0.22}, ${x+bw*0.12} ${ty} Z`
  );
  body.setAttribute('fill', c.main);
  bloomG.appendChild(body);

  // highlight
  const hl = ns('path');
  hl.setAttribute('d',
    `M ${x-bw*0.04} ${ty+bh*0.1}
     C ${x-bw*0.52} ${ty+bh*0.32}, ${x-bw*0.48} ${ty+bh*0.78}, ${x} ${ty+bh*0.9}
     C ${x+bw*0.48} ${ty+bh*0.78}, ${x+bw*0.52} ${ty+bh*0.32}, ${x+bw*0.04} ${ty+bh*0.1} Z`
  );
  hl.setAttribute('fill', c.light);
  hl.setAttribute('opacity', '0.38');
  bloomG.appendChild(hl);

  // left tip
  const tipL = ns('path');
  tipL.setAttribute('d',
    `M ${x-bw*0.55} ${ty+bh*0.14}
     C ${x-bw*1.15} ${ty-bh*0.12}, ${x-bw*0.85} ${ty-bh*0.32}, ${x-bw*0.1} ${ty}
     C ${x-bw*0.38} ${ty+bh*0.06}, ${x-bw*0.48} ${ty+bh*0.11}, ${x-bw*0.55} ${ty+bh*0.14} Z`
  );
  tipL.setAttribute('fill', c.dark); tipL.setAttribute('opacity', '0.62');
  bloomG.appendChild(tipL);

  // center tip
  const tipC = ns('path');
  tipC.setAttribute('d',
    `M ${x-bw*0.1} ${ty}
     C ${x-bw*0.06} ${ty-bh*0.28}, ${x+bw*0.06} ${ty-bh*0.28}, ${x+bw*0.1} ${ty} Z`
  );
  tipC.setAttribute('fill', c.dark); tipC.setAttribute('opacity', '0.52');
  bloomG.appendChild(tipC);

  // right tip
  const tipR = ns('path');
  tipR.setAttribute('d',
    `M ${x+bw*0.55} ${ty+bh*0.14}
     C ${x+bw*1.15} ${ty-bh*0.12}, ${x+bw*0.85} ${ty-bh*0.32}, ${x+bw*0.1} ${ty}
     C ${x+bw*0.38} ${ty+bh*0.06}, ${x+bw*0.48} ${ty+bh*0.11}, ${x+bw*0.55} ${ty+bh*0.14} Z`
  );
  tipR.setAttribute('fill', c.dark); tipR.setAttribute('opacity', '0.62');
  bloomG.appendChild(tipR);

  // Append everything
  const defs = svg.querySelector('defs');
  defs.appendChild(leafLClip);
  defs.appendChild(leafRClip);
  outer.appendChild(leafL);
  outer.appendChild(leafR);
  outer.appendChild(bloomG);

  // ── animateGrow: 3 phases ─────────────────────────────────
  // Phase 1 (0–700ms): stem grows up from ground
  // Phase 2 (400–900ms): leaves unfurl (overlaps stem end)
  // Phase 3 (800–1200ms): bloom fades+scales in from bud
  function animateGrow(onDone) {
    // Phase 1 — stem
    animate(900, easeOutCubic, p => {
      const currentH = stemH * p;
      stem.setAttribute('y', GROUND_Y - currentH);
      stem.setAttribute('height', currentH);
    }, () => {
      // Phase 3 — bloom grows from closed bud to open flower
      // start: scaleX=0.1 (tight bud), scaleY=0.55 (already some height)
      // end:   scaleX=1,   scaleY=1
      animate(700, easeOutBack, p => {
        const px = Math.max(0, Math.min(p, 1));
        bloomG.setAttribute('opacity', Math.min(p * 3, 1));
        const scaleX = lerp(0.1, 1, px);
        const scaleY = lerp(0.55, 1, px);
        bloomG.setAttribute('transform',
          `translate(${x},${by2}) scale(${scaleX},${scaleY}) translate(${-x},${-by2})`
        );
      }, () => {
        // snap to clean final state
        bloomG.setAttribute('opacity', '1');
        bloomG.removeAttribute('transform');
        outer.classList.add('sway');
        if (onDone) onDone();
      });
    });

    // Phase 2 — leaves (starts 350ms after stem begins)
    setTimeout(() => {
      const leafTotalH = h * 0.55;
      animate(700, easeOutCubic, p => {
        const revealH = leafTotalH * p;
        // reveal upward from mid-stem
        leafLRect.setAttribute('y', GROUND_Y - h * 0.52 - revealH);
        leafLRect.setAttribute('height', revealH + 20);
        leafRRect.setAttribute('y', GROUND_Y - h * 0.40 - revealH);
        leafRRect.setAttribute('height', revealH + 20);
      });
    }, 350);
  }

  function resetTulip() {
    outer.classList.remove('sway');
    stem.setAttribute('y', GROUND_Y);
    stem.setAttribute('height', 0);
    leafLRect.setAttribute('y', GROUND_Y); leafLRect.setAttribute('height', 0);
    leafRRect.setAttribute('y', GROUND_Y); leafRRect.setAttribute('height', 0);
    bloomG.setAttribute('opacity', '0');
    bloomG.removeAttribute('transform');
  }

  return { group: outer, animateGrow, resetTulip };
}

// ── Ground ───────────────────────────────────────────────────
function drawGround() {
  const fill = ns('path');
  fill.setAttribute('d', `M -50 ${GROUND_Y+6} Q 400 ${GROUND_Y-14} 850 ${GROUND_Y+6} L 850 700 L -50 700 Z`);
  fill.setAttribute('fill', '#4e8030');
  svg.appendChild(fill);

  const soil = ns('path');
  soil.setAttribute('d', `M -50 ${GROUND_Y+12} Q 400 ${GROUND_Y-2} 850 ${GROUND_Y+12} L 850 ${GROUND_Y+65} L -50 ${GROUND_Y+65} Z`);
  soil.setAttribute('fill', '#7a4f28');
  soil.setAttribute('opacity', '0.48');
  svg.appendChild(soil);

  const edge = ns('path');
  edge.setAttribute('d', `M -50 ${GROUND_Y+6} Q 400 ${GROUND_Y-14} 850 ${GROUND_Y+6}`);
  edge.setAttribute('stroke', '#78c840');
  edge.setAttribute('stroke-width', '7');
  edge.setAttribute('fill', 'none');
  svg.appendChild(edge);
}

// ── Build scene ──────────────────────────────────────────────
// defs first
const defs = ns('defs');
svg.appendChild(defs);

const tulips = TULIPS.map((t, i) => {
  const obj = makeTulip(t, i);
  svg.appendChild(obj.group);
  return obj;
});

drawGround(); // ground on top masks tulip bases

// ── Water drops ──────────────────────────────────────────────
function spawnDrops() {
  for (let i = 0; i < 24; i++) {
    const d = document.createElement('div');
    d.className = 'drop';
    d.style.left = `${5 + Math.random() * 90}vw`;
    d.style.top  = '0px';
    d.style.animationDelay = `${(Math.random() * 0.7).toFixed(2)}s`;
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
}

function grow() {
  tulips.forEach((obj, i) => {
    setTimeout(() => obj.animateGrow(), TULIPS[i].delay);
  });
}

function reset() {
  tulips.forEach(obj => obj.resetTulip());
}

let watered = false;

btn.addEventListener('click', () => {
  spawnDrops();
  if (!watered) {
    watered = true;
    btn.textContent = '🚿 Water Again';
    hint.textContent = 'They love it! 🌷';
    grow();
  } else {
    reset();
    hint.textContent = 'Growing again... 🌱';
    setTimeout(() => {
      grow();
      hint.textContent = 'Blooming beautifully! 🌷';
    }, 400);
  }
});
