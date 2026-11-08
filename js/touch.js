// ===== 터치 조작 (아이패드 등): 화면 버튼을 키보드 키를 누른 것과 똑같이 처리 =====
// 좌하단: 십자 버튼(◀▶ 이동·연타 대시, ▲ 점프, ▼ 웅크리기) / 우하단: 점프 · 빠른 공격 · 강한 공격 · 필살기
const TOUCH = { on: false, held: {}, down: new Set(), coarse: matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 };
const isTouch = () => TOUCH.on || TOUCH.coarse;
const CONFIRM = { x: W / 2 - 160, y: 622, w: 320, h: 58 };
const BTNS = {
  fight: [
    { k: 'ArrowLeft', x: 80, y: 582, r: 46, arrow: Math.PI },
    { k: 'ArrowRight', x: 260, y: 582, r: 46, arrow: 0 },
    { k: 'ArrowUp', x: 170, y: 494, r: 44, arrow: -Math.PI / 2 },
    { k: 'ArrowDown', x: 170, y: 668, r: 44, arrow: Math.PI / 2 },
    { k: 'ArrowUp', x: 1190, y: 640, r: 54, label: '↑', sub: '점프' },
    { k: 'KeyZ', x: 1060, y: 655, r: 52, label: 'Z', sub: '빠른 공격' },
    { k: 'KeyX', x: 1110, y: 528, r: 58, label: 'X', sub: '강한 공격' },
    { k: 'KeyC', x: 975, y: 548, r: 46, label: 'C', sub: '필살기', sp: true },
    { k: 'Enter', x: W / 2, y: 124, r: 24, pause: true },
  ],
  menu: [
    { k: 'Escape', x: 70, y: 655, r: 40, label: '↩', sub: '뒤로' },
    { k: 'KeyM', x: W - 50, y: 50, r: 30, label: '♪' },
  ],
};
const touchMode = () => (['fight', 'intro', 'roundEnd'].includes(scene) && !paused) ? 'fight' : 'menu';
function toCanvas(t) { const b = cv.getBoundingClientRect(); return [(t.clientX - b.left) * W / b.width, (t.clientY - b.top) * H / b.height]; }
const inRect = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
// 가장 가까운 버튼 (버튼 크기보다 조금 넓게 인정, 겹치는 곳은 더 가까운 쪽)
function btnAt(x, y) {
  let best = null, bd = Infinity;
  for (const b of BTNS[touchMode()]) {
    if (b.k === 'Escape' && scene === 'title') continue;
    const d = Math.hypot(x - b.x, y - b.y) / b.r;
    if (d < 1.25 && d < bd) { bd = d; best = b; }
  }
  return best;
}
// 지금 화면에 닿아 있는 손가락들 → 눌린 키 목록 (멀티터치: 이동 + 공격/점프 동시 가능)
function syncTouches(list) {
  const now = {}; TOUCH.down = new Set(); // 실제로 손가락이 닿은 버튼만 빛나게 (점프 버튼과 ▲는 같은 키라서)
  for (const t of list) { const b = btnAt(...toCanvas(t)); if (b) { now[b.k] = 1; TOUCH.down.add(b); } }
  for (const k in now) { if (!keys[k]) pressed[k] = true; keys[k] = true; }
  for (const k in TOUCH.held) if (!now[k]) keys[k] = false;
  TOUCH.held = now;
}
// 메뉴 화면: 카드/버튼을 직접 눌러 고르기
function menuTap(x, y) {
  if (btnAt(x, y) || touchMode() === 'fight') return;
  if (scene === 'title' || scene === 'matchEnd' || (scene === 'fight' && paused)) { pressed.Enter = true; return; }
  if (scene === 'select' || scene === 'diff') {
    if (inRect(x, y, CONFIRM)) { pressed.Enter = true; return; }
    if (scene === 'select') {
      const cw = 290, ch = 175, gx = 16, x0 = (W - (cw * 4 + gx * 3)) / 2;
      for (let i = 0; i < 8; i++) if (inRect(x, y, { x: x0 + (i % 4) * (cw + gx), y: 85 + Math.floor(i / 4) * (ch + 14), w: cw, h: ch })) { selIdx = i; Sound.sfx(500, 0.06, 'triangle', 0.08); }
    } else {
      for (let i = 0; i < 3; i++) if (inRect(x, y, { x: DIFF_BOX.x0 + i * 230, y: DIFF_BOX.y, w: 200, h: DIFF_BOX.h })) { diffIdx = i; diffRow = 0; Sound.sfx(600, 0.06, 'triangle', 0.08); }
      for (let i = 0; i < STAGES.length; i++) if (inRect(x, y, { x: STAGE_BOX.x0 + i * (STAGE_BOX.w + STAGE_BOX.gap), y: STAGE_BOX.y, w: STAGE_BOX.w, h: STAGE_BOX.h })) { stageIdx = i; diffRow = 1; Sound.sfx(600, 0.06, 'triangle', 0.08); }
    }
  }
}
addEventListener('touchstart', e => {
  e.preventDefault(); TOUCH.on = true; Sound.init();
  for (const t of e.changedTouches) menuTap(...toCanvas(t));
  syncTouches(e.touches);
}, { passive: false });
for (const ev of ['touchmove', 'touchend', 'touchcancel']) addEventListener(ev, e => { e.preventDefault(); if (ev === 'touchend') Sound.init(); syncTouches(e.touches); }, { passive: false });

// ===== 버튼 그리기 (반투명) =====
function confirmBtn(label) {
  ctx.fillStyle = 'rgba(255,212,59,.85)'; rr(CONFIRM.x, CONFIRM.y, CONFIRM.w, CONFIRM.h, 16); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  txt(label, W / 2, CONFIRM.y + CONFIRM.h / 2 + 1, 28, '#3a2400', 'center', null);
}
// 필살기 버튼: 준비되면 공룡 색으로 빛나며 커졌다 작아짐 / 아니면 흐리게 + 테두리에 게이지가 얼마나 찼는지 표시
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function drawSpBtn(b) {
  const sp = P1 ? P1.sp : 0, col = P1 ? P1.def.aura : '#ffd43b';
  if (sp >= 100) {
    const pul = Math.sin(frame * 0.2), r = b.r * (1.08 + 0.07 * pul);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(b.x, b.y, r * 0.6, b.x, b.y, r * 1.9); g.addColorStop(0, hexA(col, 0.55 + 0.2 * pul)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r * 1.9, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = hexA(col, TOUCH.down.has(b) ? 1 : 0.92); ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    txt('C', b.x, b.y - 10, r * 0.62, '#fff', 'center', 'rgba(0,0,0,.55)', 5);
    txt('필살기!', b.x, b.y + r * 0.45, 17, '#fff', 'center', 'rgba(0,0,0,.6)', 4);
  } else {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgba(120,120,120,.25)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    txt('C', b.x, b.y - 9, b.r * 0.62, 'rgba(255,255,255,.8)', 'center', 'rgba(0,0,0,.3)', 3);
    txt('필살기', b.x, b.y + b.r * 0.45, 15, 'rgba(255,255,255,.75)', 'center', 'rgba(0,0,0,.3)', 3);
    ctx.globalAlpha = 0.85; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sp / 100); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
function drawTouch() {
  if (!isTouch()) return;
  const mode = touchMode(), soft = 'rgba(255,255,255,.12)', edge = 'rgba(255,255,255,.45)';
  ctx.save();
  for (const b of BTNS[mode]) {
    if (b.k === 'Escape' && scene === 'title') continue;
    if (b.sp) { drawSpBtn(b); continue; }
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7);
    ctx.fillStyle = TOUCH.down.has(b) ? 'rgba(255,255,255,.35)' : soft; ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.stroke();
    if (b.pause) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(b.x - 9, b.y - 10, 6, 20); ctx.fillRect(b.x + 3, b.y - 10, 6, 20); continue; }
    if (b.arrow !== undefined) { // 이동 버튼: 큰 삼각형
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.arrow); ctx.fillStyle = TOUCH.down.has(b) ? 'rgba(255,230,120,.95)' : 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -22); ctx.lineTo(-12, 22); ctx.closePath(); ctx.fill(); ctx.restore(); continue;
    }
    txt(b.label, b.x, b.y - (b.sub ? 9 : 0), b.r * 0.62, 'rgba(255,255,255,.9)', 'center', 'rgba(0,0,0,.35)', 4);
    if (b.sub) txt(b.sub, b.x, b.y + b.r * 0.45, 15, 'rgba(255,255,255,.8)', 'center', 'rgba(0,0,0,.4)', 3);
    if (b.k === 'KeyM' && Sound.muted) { ctx.strokeStyle = 'rgba(255,90,90,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x - 18, b.y + 18); ctx.lineTo(b.x + 18, b.y - 18); ctx.stroke(); }
  }
  if (innerHeight > innerWidth) {
    ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.fillRect(0, 0, W, H);
    txt('아이패드를 가로로 돌려 주세요', W / 2, H / 2, 56, '#ffe066');
  }
  ctx.restore();
}
