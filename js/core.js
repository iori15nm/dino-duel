// ===== 공통: 화면, 입력, 그리기 도우미 =====
const W = 1280, H = 720, GROUND = 620, XMIN = 130, XMAX = W - 130;
const FONT = "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
cv.width = W; cv.height = H;
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }
addEventListener('resize', fit); fit();

// 입력 (e.code: 한글 입력 상태에서도 Z/X/C 동작)
const keys = {}, pressed = {};
addEventListener('keydown', e => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true; Sound.init();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// 수학/텍스트
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function bez(t, a, b, c, d) { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
function rot(v, a) { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function txt(s, x, y, size, col = '#fff', align = 'center', stroke = 'rgba(0,0,0,.85)', sw = 6) {
  ctx.font = `bold ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}

// ===== 피부 질감 패턴 =====
function tilePattern(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.save(); g.translate(ox, oy); draw(g); g.restore(); }
  return ctx.createPattern(c, 'repeat');
}
function scaleTiles(size, n, seed) {
  return tilePattern(size, g => {
    const R = rng(seed), s = size / n;
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      const x = col * s + (row % 2 ? s / 2 : 0), y = row * s, r = s * 0.55 * (0.85 + R() * 0.3);
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,240,210,.28)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.42)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, 7); g.fill();
    }
  });
}
const PAT_FINE = scaleTiles(36, 6, 3);
const PAT_BIG = scaleTiles(72, 5, 9);
const PAT_NOISE = tilePattern(96, g => {
  const R = rng(5);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.22})`; g.beginPath(); g.arc(R() * 96, R() * 96, 0.6 + R() * 1.6, 0, 7); g.fill(); }
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,240,200,${R() * 0.14})`; g.beginPath(); g.arc(R() * 96, R() * 96, 0.6 + R() * 1.2, 0, 7); g.fill(); }
});
const PAT_FEATHER = tilePattern(48, g => {
  const R = rng(11); g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = R() * 48, y = R() * 48, l = 5 + R() * 7;
    g.strokeStyle = R() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(255,235,200,.22)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - l * 0.4, y + l * 0.3, x - l, y + l * 0.2); g.stroke();
  }
});

// ===== 몸통 칠하기: 3단 그라데이션 + 비늘 + 조명 + 림라이트 + 외곽선 =====
function skin(pathFn, cols, y0, y1, o = {}) {
  ctx.beginPath(); pathFn();
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, cols[0]); g.addColorStop(0.5, cols[1]); g.addColorStop(1, cols[2]);
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = o.feather ? PAT_FEATHER : o.big ? PAT_BIG : PAT_FINE; ctx.globalAlpha = o.pa ?? 0.9; ctx.fillRect(-600, -700, 1200, 800);
  ctx.globalAlpha = 1; ctx.fillStyle = PAT_NOISE; ctx.fillRect(-600, -700, 1200, 800);
  if (o.mark) o.mark();
  const lg = ctx.createLinearGradient(0, y0, 0, y1);
  lg.addColorStop(0, 'rgba(255,236,196,.30)'); lg.addColorStop(0.3, 'rgba(255,236,196,0)'); lg.addColorStop(0.72, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.38)');
  ctx.fillStyle = lg; ctx.fillRect(-600, -700, 1200, 800);
  ctx.translate(0, 3); ctx.beginPath(); pathFn(); ctx.strokeStyle = 'rgba(255,238,205,.32)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  ctx.beginPath(); pathFn(); ctx.strokeStyle = 'rgba(16,11,5,.8)'; ctx.lineWidth = o.lw || 2; ctx.lineJoin = 'round'; ctx.stroke();
}
// 끝이 둥근 사다리꼴(근육질 팔다리 한 마디)
function capsule(a, b, wa, wb) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ang = Math.atan2(dy, dx);
  ctx.moveTo(a[0] + nx * wa / 2, a[1] + ny * wa / 2); ctx.lineTo(b[0] + nx * wb / 2, b[1] + ny * wb / 2);
  ctx.arc(b[0], b[1], wb / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(a[0] - nx * wa / 2, a[1] - ny * wa / 2);
  ctx.arc(a[0], a[1], wa / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  ctx.closePath();
}
// 관절 팔다리: 아래 마디부터 그려서 위 마디가 덮도록
function limb(pts, ws, cols, o) {
  for (let i = pts.length - 2; i >= 0; i--) {
    const a = pts[i], b = pts[i + 1];
    skin(() => capsule(a, b, ws[i], ws[i + 1]), cols, Math.min(a[1], b[1]) - ws[i] / 2, Math.max(a[1], b[1]) + ws[i + 1] / 2, o || { pa: 0.7 });
  }
}
// 발톱/손톱
function claw(x, y, ang, len, w, col = '#d9cfb6') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.quadraticCurveTo(len * 0.65, -w * 0.7, len, w * 0.9); ctx.quadraticCurveTo(len * 0.5, w * 0.25, 0, w / 2); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, '#241d16'); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(15,10,5,.8)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
}
// 파충류 눈
function eye(x, y, r) {
  ctx.fillStyle = 'rgba(10,6,2,.45)'; ctx.beginPath(); ctx.ellipse(x - 1, y + 1, r * 1.9, r * 1.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#120b05'; ctx.beginPath(); ctx.ellipse(x, y, r + 1.4, r, 0, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#ffe08a'); g.addColorStop(0.6, '#d9901a'); g.addColorStop(1, '#6b3a08');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.82, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.ellipse(x + 0.4, y, r * 0.24, r * 0.76, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x - r * 0.38, y - r * 0.32, r * 0.22, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(10,6,2,.85)'; ctx.lineWidth = Math.max(1.5, r * 0.45);
  ctx.beginPath(); ctx.moveTo(x - r * 1.5, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 1.5, x + r * 1.5, y - r * 0.3); ctx.stroke();
}
// 톱니 이빨
function teeth(x0, x1, y, dir, n, size) {
  ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(40,30,20,.7)';
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * i / (n - 1), s = size * (0.75 + 0.35 * Math.abs(Math.sin(i * 1.7)));
    const g = ctx.createLinearGradient(0, y, 0, y + dir * s * 1.9); g.addColorStop(0, '#cbbf9e'); g.addColorStop(1, '#fbf6e6');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.quadraticCurveTo(x + s * 0.1, y + dir * s, x + 1.5, y + dir * s * 1.9); ctx.lineTo(x + s * 0.5, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
// 뿔/가시 (밑동 → 끝), 결 무늬 포함
function horn(bx, by, tx, ty, w, col = '#efe5c8', base = '#6b5a3c') {
  const mx = (bx + tx) / 2, my = (by + ty) / 2, dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  ctx.beginPath(); ctx.moveTo(bx + nx * w / 2, by + ny * w / 2);
  ctx.quadraticCurveTo(mx + nx * w * 0.45, my + ny * w * 0.45, tx, ty);
  ctx.quadraticCurveTo(mx - nx * w * 0.2, my - ny * w * 0.2, bx - nx * w / 2, by - ny * w / 2); ctx.closePath();
  const g = ctx.createLinearGradient(bx, by, tx, ty); g.addColorStop(0, base); g.addColorStop(0.6, col); g.addColorStop(1, '#fffaf0');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(25,18,8,.8)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.strokeStyle = 'rgba(80,60,30,.35)'; ctx.lineWidth = 1;
  for (const f of [-0.2, 0.15]) { ctx.beginPath(); ctx.moveTo(bx + nx * w * f, by + ny * w * f); ctx.quadraticCurveTo(mx + nx * w * f * 0.6, my + ny * w * f * 0.6, lerp(bx, tx, 0.85), lerp(by, ty, 0.85)); ctx.stroke(); }
}
// 주름/근육 선
function fold(pts, a = 0.3, w = 2) {
  ctx.strokeStyle = `rgba(20,14,6,${a})`; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); ctx.stroke();
  ctx.strokeStyle = `rgba(255,236,200,${a * 0.6})`; ctx.lineWidth = w * 0.7;
  ctx.beginPath(); ctx.moveTo(pts[0] + 1, pts[1] + 2); ctx.quadraticCurveTo(pts[2] + 1, pts[3] + 2, pts[4] + 1, pts[5] + 2); ctx.stroke();
}
