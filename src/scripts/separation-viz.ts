// Animated "separation" visual: a mixed waveform flows into an AI core and splits
// into one lane per stem. Pure canvas, no dependencies. Procedural audio-ish shapes
// so each stem has a recognisable character (spiky drums, slow bass, phrased vocals…).

export type StemKey = 'vocals' | 'instrumental' | 'drums' | 'bass' | 'piano' | 'other';

export const STEM_META: Record<StemKey, { label: string; color: string }> = {
  vocals: { label: 'Vocals', color: '#e879f9' },
  instrumental: { label: 'Instrumental', color: '#7c5cff' },
  drums: { label: 'Drums', color: '#a78bfa' },
  bass: { label: 'Bass', color: '#3b82f6' },
  piano: { label: 'Piano', color: '#22d3ee' },
  other: { label: 'Other', color: '#818cf8' },
};

const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const noise = (s: number) => {
  const i = Math.floor(s);
  const f = s - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
};
const clamp = (v: number) => Math.max(0.04, Math.min(1, v));

const shapes: Record<StemKey, (s: number) => number> = {
  vocals: (s) => {
    const phrase = noise(s / 26 + 3) > 0.38 ? 1 : 0.06;
    return clamp(phrase * (0.3 + 0.7 * noise(s / 3.2 + 100)));
  },
  drums: (s) => {
    const p = ((s % 8) + 8) % 8;
    const kick = Math.exp(-p * 0.95);
    const snare = 0.78 * Math.exp(-Math.abs(p - 4) * 1.3);
    const hat = 0.12 + 0.12 * hash(Math.floor(s) + 9);
    return clamp(Math.max(kick, snare, hat));
  },
  bass: (s) => clamp((0.3 + 0.5 * Math.abs(Math.sin(s * 0.17))) * (0.65 + 0.35 * noise(s / 14 + 50))),
  piano: (s) => {
    const q = ((s % 6) + 6) % 6;
    return clamp(Math.exp(-q * 0.42) * (0.35 + 0.65 * hash(Math.floor(s / 6) + 7)));
  },
  other: (s) => clamp(0.16 + 0.38 * noise(s / 5 + 300)),
  instrumental: (s) => clamp(0.34 * (shapes.drums(s) + shapes.bass(s) + shapes.piano(s) + shapes.other(s))),
};
const mixShape = (s: number) =>
  clamp(0.3 * (shapes.vocals(s) + shapes.drums(s) + shapes.bass(s) + shapes.piano(s) + shapes.other(s)));

export interface VizOptions {
  stems: StemKey[];
  muted?: Partial<Record<StemKey, boolean>>;
}

export function createSeparationViz(canvas: HTMLCanvasElement, opts: VizOptions) {
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stems = opts.stems.slice();
  const muted: Partial<Record<StemKey, boolean>> = { ...(opts.muted ?? {}) };
  const laneAlpha: Record<string, number> = {};
  let W = 0;
  let H = 0;
  let dpr = 1;
  let running = false;
  let visible = true;
  let raf = 0;
  let fade = 1; // 0→1 when the stem set changes
  const t0 = performance.now();

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) draw(performance.now());
  };

  const roundBar = (x: number, cy: number, w: number, h: number) => {
    const r = Math.min(w / 2, h);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, cy - h, w, h * 2, r);
    ctx.fill();
  };

  function draw(now: number) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    if (W < 10) return;

    const narrow = W < 520;
    const pad = narrow ? 10 : 18;
    const coreX = W * (narrow ? 0.4 : 0.42);
    const coreY = H / 2;
    const coreR = Math.max(16, Math.min(W, H) * (narrow ? 0.075 : 0.085));
    const rate = 9; // bars per second
    const T = t * rate;
    const frac = T - Math.floor(T);
    const base = Math.floor(T);

    // ---- Input mix waveform ----
    const mixX0 = pad;
    const mixX1 = coreX - coreR - (narrow ? 18 : 34);
    const mixGap = narrow ? 5 : 6;
    const mixBarW = narrow ? 2.6 : 3.2;
    const mixHalf = H * 0.26;
    const mixGrad = ctx.createLinearGradient(mixX0, 0, mixX1, 0);
    mixGrad.addColorStop(0, 'rgba(230,230,240,0.15)');
    mixGrad.addColorStop(0.5, 'rgba(230,230,240,0.75)');
    mixGrad.addColorStop(1, 'rgba(155,133,255,0.95)');
    ctx.fillStyle = mixGrad;
    const mixN = Math.floor((mixX1 - mixX0) / mixGap);
    for (let i = 0; i < mixN; i++) {
      const x = mixX0 + (i + frac) * mixGap;
      if (x > mixX1) continue;
      const a = mixShape(base - i + 400);
      roundBar(x, coreY, mixBarW, Math.max(1.5, a * mixHalf));
    }
    // label
    ctx.font = `500 ${narrow ? 9 : 10}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(183,185,204,0.7)';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('INPUT · song.mp3', mixX0, coreY - mixHalf - 14);

    // input connector + particles
    ctx.strokeStyle = 'rgba(155,133,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mixX1 + 4, coreY);
    ctx.lineTo(coreX - coreR, coreY);
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.9 + k / 3) % 1;
      const x = mixX1 + 4 + u * (coreX - coreR - mixX1 - 4);
      glowDot(x, coreY, 2.2, '#c4b5fd');
    }

    // ---- Lanes ----
    const n = stems.length;
    const laneX0 = coreX + coreR + (narrow ? 34 : 64);
    const laneX1 = W - pad;
    const top = pad + 6;
    const bottom = H - pad;
    const laneH = (bottom - top) / n;
    const half = Math.min(laneH * 0.3, 26);
    const gap = narrow ? 4.5 : 5.5;
    const barW = narrow ? 2.2 : 2.8;
    const laneN = Math.floor((laneX1 - laneX0) / gap);

    stems.forEach((key, idx) => {
      const meta = STEM_META[key];
      const target = muted[key] ? 0.16 : 1;
      laneAlpha[key] = laneAlpha[key] ?? target;
      laneAlpha[key] += (target - laneAlpha[key]) * 0.12;
      const alpha = laneAlpha[key] * fade;
      const cy = top + laneH * (idx + 0.5) + 6;

      // connector curve from core to lane
      const sx = coreX + coreR;
      const sy = coreY;
      const ex = laneX0 - 6;
      const c1x = sx + (ex - sx) * 0.55;
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(c1x, sy, sx + (ex - sx) * 0.45, cy, ex, cy);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      for (let k = 0; k < 2; k++) {
        const u = (t * 0.7 + k / 2 + idx * 0.13) % 1;
        const p = bezier(u, sx, sy, c1x, sy, sx + (ex - sx) * 0.45, cy, ex, cy);
        glowDot(p[0], p[1], 2, meta.color);
      }

      // bars
      const g = ctx.createLinearGradient(laneX0, 0, laneX1, 0);
      g.addColorStop(0, meta.color);
      g.addColorStop(1, hexA(meta.color, 0.18));
      ctx.fillStyle = g;
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = muted[key] ? 0 : 8;
      for (let i = 0; i < laneN; i++) {
        const x = laneX0 + (i + frac) * gap;
        if (x > laneX1) continue;
        const a = shapes[key](base - i - 4 + 400);
        roundBar(x, cy, barW, Math.max(1.2, a * half));
      }
      ctx.shadowBlur = 0;

      // label
      ctx.font = `600 ${narrow ? 9 : 10}px "JetBrains Mono", monospace`;
      ctx.fillStyle = meta.color;
      ctx.fillText(meta.label.toUpperCase(), laneX0, cy - half - 6);
      if (muted[key]) {
        const w = ctx.measureText(meta.label.toUpperCase()).width;
        ctx.fillStyle = 'rgba(139,142,163,0.9)';
        ctx.fillText('  · SKIPPED', laneX0 + w, cy - half - 6);
      }
      ctx.globalAlpha = 1;
    });

    // ---- AI core ----
    const pulse = 1 + mixShape(base + 400) * 0.08;
    const halo = ctx.createRadialGradient(coreX, coreY, coreR * 0.2, coreX, coreY, coreR * 2.6);
    halo.addColorStop(0, 'rgba(124,92,255,0.55)');
    halo.addColorStop(0.5, 'rgba(217,70,239,0.14)');
    halo.addColorStop(1, 'rgba(59,91,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(coreX, coreY, coreR * 2.6, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createLinearGradient(coreX - coreR, coreY - coreR, coreX + coreR, coreY + coreR);
    body.addColorStop(0, '#d946ef');
    body.addColorStop(0.5, '#7c5cff');
    body.addColorStop(1, '#3b5bff');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(coreX, coreY, coreR * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(7,7,13,0.55)';
    ctx.beginPath();
    ctx.arc(coreX, coreY, coreR * pulse - 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      const rr = coreR * (1.35 + k * 0.32);
      const a0 = t * (k ? -0.9 : 1.3) + k;
      ctx.strokeStyle = k ? 'rgba(34,211,238,0.6)' : 'rgba(217,70,239,0.7)';
      ctx.beginPath();
      ctx.arc(coreX, coreY, rr, a0, a0 + Math.PI * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(coreX, coreY, rr, a0 + Math.PI, a0 + Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.round(coreR * 0.62)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI', coreX, coreY + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (fade < 1) fade = Math.min(1, fade + 0.05);
  }

  function glowDot(x: number, y: number, r: number, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const loop = (now: number) => {
    draw(now);
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduced || !visible) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? start() : stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  resize();
  start();

  return {
    setStems(next: StemKey[]) {
      stems = next.slice();
      fade = running ? 0 : 1;
      if (!running) draw(performance.now());
    },
    setMuted(key: StemKey, value: boolean) {
      muted[key] = value;
      if (reduced) laneAlpha[key] = value ? 0.16 : 1;
      if (!running) draw(performance.now());
    },
  };
}

function bezier(u: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  const v = 1 - u;
  const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return [a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3];
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
