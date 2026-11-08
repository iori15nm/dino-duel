// ===== 공룡 8종: 그림(오른쪽을 보는 기준, 원점=엉덩이 아래 지면) + 능력치 + 기술 =====
// 포즈 p: t(시간) walk/stride(걸음) jaw(입) hx,hy,hr(머리 이동/회전) arm(앞발 휘두르기) wing(날개) tail(꼬리 들썩)

// ---------- 공통 뒷다리 (수각류) ----------
function theroLeg(p, ph, far, o) {
  const sw = Math.sin(ph) * p.stride, lift = Math.max(0, Math.cos(ph)) * p.stride * 0.7, hx = o.x + (far ? -16 : 0);
  const C = far ? o.far : o.near, k = o.k;
  const knee = [hx + 30 * k + sw * 0.3, -72 * k], ank = [hx - 8 * k + sw * 0.8, -26 * k - lift], toe = [hx + 30 * k + sw, -6 - lift * 0.4];
  for (const d of [-0.12, 0.04, 0.2]) claw(toe[0] + 6 * k, toe[1] - 1, 0.2 + d, 16 * k, 6 * k);
  limb([[hx + 10 * k, -96 * k], knee, ank, toe], [36 * k, 24 * k, 15 * k, 13 * k], C, { pa: 0.4 });
  ctx.strokeStyle = 'rgba(20,14,6,.4)'; ctx.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) { const x = lerp(ank[0], toe[0], i / 5), y = lerp(ank[1], toe[1], i / 5); ctx.beginPath(); ctx.moveTo(x - 6 * k, y - 3); ctx.lineTo(x + 6 * k, y + 1); ctx.stroke(); }
  skin(() => ctx.ellipse(hx + 8 * k, -106 * k, 38 * k, 50 * k, 0.35, 0, 7), C, -160 * k, -56 * k, { pa: 0.45, lw: 1.3 });
  fold([hx - 10 * k, -130 * k, hx + 20 * k, -115 * k, hx + 30 * k, -82 * k], 0.28, 3);
}
function smallArm(p, s, far, C, k = 1) {
  const a = -p.arm * 0.7, e = add(s, rot([12 * k, 14 * k], a)), h = add(e, rot([11 * k, -2 * k], a));
  limb([s, e, h], [11 * k, 8 * k, 6 * k], far ? [C[0], C[0], C[1]] : C);
  claw(h[0], h[1], a + 0.6, 8 * k, 3); claw(h[0], h[1] + 2, a + 1.0, 7 * k, 3);
}

// ---------- 티라노사우루스 ----------
function drawTrex(p) {
  const t = p.t, sw = Math.sin(t * 0.06) * 6 + p.tail, br = Math.sin(t * 0.1) * 2;
  const C = ['#33281c', '#76603f', '#d6c19a'], L = { near: ['#33281c', '#6e5940', '#b39a74'], far: ['#1d160e', '#433626', '#6a573c'], k: 1, x: 4 };
  theroLeg(p, p.walk + Math.PI, true, L);
  smallArm(p, [94, -126], true, ['#2a2016', '#4a3b28', '#6e5a3e']);
  skin(() => {
    ctx.moveTo(-222, -150 + sw); ctx.quadraticCurveTo(-120, -194 + sw * 0.4, -20, -191 - br);
    ctx.bezierCurveTo(40, -193 - br, 85, -183, 118, -172 + p.hy * 0.4); ctx.lineTo(134, -140 + p.hy * 0.4);
    ctx.bezierCurveTo(105, -106, 60, -92, 15, -96); ctx.bezierCurveTo(-30, -100, -60, -115, -100, -130);
    ctx.quadraticCurveTo(-160, -142 + sw * 0.6, -222, -146 + sw); ctx.closePath();
  }, C, -196, -94, { big: 1, mark: () => {
    ctx.strokeStyle = 'rgba(22,15,8,.5)'; ctx.lineCap = 'round';
    for (let i = 0; i < 11; i++) { const x = -190 + i * 28, by = x < -20 ? -160 + (x + 190) / 170 * -30 + sw * 0.5 : -190 + (x + 20) / 140 * 16; ctx.lineWidth = 7 - Math.abs(i - 5) * 0.4; ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x - 4, by + 16, x - 12, by + 30); ctx.stroke(); }
    ctx.fillStyle = 'rgba(240,225,190,.25)'; ctx.beginPath(); ctx.ellipse(40, -100, 80, 14, -0.1, 0, 7); ctx.fill();
  } });
  fold([-60, -150, -20, -125, 30, -118], 0.25, 3); fold([70, -165, 95, -145, 98, -118], 0.3, 2.5); fold([88, -168, 110, -150, 116, -128], 0.3, 2);
  // 머리
  ctx.save(); ctx.translate(120 + p.hx, -162 + p.hy); ctx.rotate(p.hr);
  const ja = p.jaw * 0.62, jt = [10 + 94 * Math.cos(ja), 6 + 94 * Math.sin(ja)];
  const mg = ctx.createLinearGradient(0, 0, 0, 40); mg.addColorStop(0, '#5a1f18'); mg.addColorStop(1, '#2a0c08');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(104, 4); ctx.lineTo(jt[0], jt[1]); ctx.closePath(); ctx.fill();
  if (p.jaw > 0.05) { ctx.fillStyle = '#8a3a34'; ctx.beginPath(); ctx.ellipse(40 + 20 * Math.cos(ja), 12 + 30 * Math.sin(ja), 28, 6, ja * 0.6, 0, 7); ctx.fill(); teeth(24, 100, 5, 1, 12, 5.5); }
  ctx.save(); ctx.translate(10, 6); ctx.rotate(ja);
  if (p.jaw > 0.05) teeth(16, 88, 1, -1, 10, 4.6);
  skin(() => { ctx.moveTo(-8, 0); ctx.lineTo(94, 0); ctx.quadraticCurveTo(90, 15, 72, 20); ctx.lineTo(8, 23); ctx.quadraticCurveTo(-12, 16, -8, 0); }, ['#4a3a28', '#80694a', '#e0cca4'], 0, 23);
  fold([10, 12, 40, 16, 70, 13], 0.25, 1.5);
  ctx.restore();
  skin(() => {
    ctx.moveTo(-16, -22); ctx.bezierCurveTo(18, -42, 70, -38, 96, -24); ctx.quadraticCurveTo(108, -18, 111, -6); ctx.lineTo(108, 5);
    ctx.lineTo(20, 7); ctx.quadraticCurveTo(2, 14, -6, 22); ctx.lineTo(-22, 2); ctx.closePath();
  }, ['#2c2217', '#6a553a', '#b09676'], -40, 22, { mark: () => {
    ctx.fillStyle = 'rgba(25,16,8,.35)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(64 + i * 4.5, -30 + Math.sin(i) * 3 + i * 1.3, 2.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(20,12,5,.35)'; ctx.beginPath(); ctx.ellipse(36, -6, 15, 7, -0.1, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,235,200,.18)'; ctx.beginPath(); ctx.ellipse(6, -2, 14, 11, 0, 0, 7); ctx.fill();
  } });
  teeth(30, 98, 5, 1, 9, 2.3);
  ctx.strokeStyle = 'rgba(15,10,5,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(108, 5); ctx.quadraticCurveTo(60, 9, 20, 7); ctx.stroke();
  ctx.fillStyle = '#3a2c1c'; ctx.beginPath(); ctx.moveTo(46, -33); ctx.quadraticCurveTo(54, -44, 62, -34); ctx.closePath(); ctx.fill();
  fold([40, -30, 56, -36, 72, -28], 0.6, 3.5);
  eye(57, -22, 4.6);
  ctx.fillStyle = '#120b05'; ctx.beginPath(); ctx.ellipse(101, -15, 3.2, 2, 0.4, 0, 7); ctx.fill();
  ctx.restore();
  theroLeg(p, p.walk, false, L);
  smallArm(p, [100, -122], false, C);
}

// ---------- 트리케라톱스 ----------
function quadLeg(x, y, p, ph, far, w, C, h = 1) {
  const sw = Math.sin(ph) * p.stride * 0.8, lift = Math.max(0, Math.cos(ph)) * p.stride * 0.5;
  const kn = [x + 6 + sw * 0.4, lerp(y, 0, 0.5) - lift * 0.5], ft = [x + sw, -12 - lift];
  limb([[x, y], kn, ft], [w, w * 0.72, w * 0.64], far ? [C[0], C[0], C[1]] : C);
  ctx.fillStyle = far ? '#151a10' : '#22291a'; ctx.beginPath(); ctx.ellipse(ft[0] + 3, ft[1] + 5, w * 0.42, 8, 0, 0, 7); ctx.fill();
  if (!far) { ctx.fillStyle = '#cfc4a4'; for (const d of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.ellipse(ft[0] + 6 + d * w, ft[1] + 9, 4, 3, 0, 0, 7); ctx.fill(); } }
}
function drawTrice(p) {
  const t = p.t, br = Math.sin(t * 0.09) * 1.5, sw = Math.sin(t * 0.06) * 4 + p.tail;
  const C = ['#323d2a', '#6b7752', '#c9c9a0'], LC = ['#2c3624', '#56633f', '#8f9a6c'];
  quadLeg(-62, -112, p, p.walk + Math.PI, true, 46, LC); quadLeg(66, -104, p, p.walk, true, 38, LC);
  skin(() => {
    ctx.moveTo(-198, -80 + sw); ctx.quadraticCurveTo(-130, -114 + sw * 0.5, -70, -154 - br);
    ctx.bezierCurveTo(-20, -184 - br, 50, -174 - br, 95, -140); ctx.bezierCurveTo(118, -120, 116, -85, 100, -70);
    ctx.bezierCurveTo(50, -52, -30, -50, -85, -68); ctx.quadraticCurveTo(-130, -82 + sw * 0.5, -198, -76 + sw); ctx.closePath();
  }, C, -180, -52, { big: 1, mark: () => {
    ctx.fillStyle = 'rgba(30,24,14,.32)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-150 + i * 30, -140 + Math.abs(i - 4) * 7 + (i < 2 ? 20 : 0), 12, 7, 0.2, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.beginPath(); ctx.ellipse(10, -62, 90, 10, 0, 0, 7); ctx.fill();
  } });
  for (const x of [-40, -5, 30]) fold([x, -168, x + 12, -122, x + 2, -72], 0.28, 3);
  fold([60, -150, 80, -120, 92, -82], 0.3, 2.5);
  quadLeg(-46, -108, p, p.walk, false, 50, LC); quadLeg(84, -98, p, p.walk + Math.PI, false, 42, LC);
  // 머리
  ctx.save(); ctx.translate(92 + p.hx, -112 + p.hy); ctx.rotate(p.hr);
  const frill = () => { ctx.moveTo(20, 10); ctx.bezierCurveTo(-25, 0, -58, -60, -30, -104); ctx.bezierCurveTo(-2, -132, 44, -94, 46, -30); ctx.closePath(); };
  skin(frill, ['#5a3a22', '#a8622e', '#d79a48'], -125, 10, { pa: 0.5, mark: () => {
    ctx.strokeStyle = 'rgba(160,40,24,.55)'; ctx.lineWidth = 16; ctx.beginPath(); frill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,30,12,.45)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.28; ctx.beginPath(); ctx.moveTo(14, -12); ctx.quadraticCurveTo(14 + Math.cos(a) * 40, -12 + Math.sin(a) * 40 - 6, 14 + Math.cos(a) * 95, -12 + Math.sin(a) * 95); ctx.stroke(); }
    ctx.fillStyle = 'rgba(40,20,8,.4)'; for (const [x, y] of [[-24, -70], [-6, -92], [16, -84], [-34, -40]]) { ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0.6, 0, 7); ctx.fill(); }
  } });
  const ep = (s, a0, a1, a2, a3, b0, b1, b2, b3) => { const x = bez(s, a0, a1, a2, a3), y = bez(s, b0, b1, b2, b3), dx = x - 6, dy = y + 40, L = Math.hypot(dx, dy); horn(x - dy / L * 5, y + dx / L * 5, x + dx / L * 10, y + dy / L * 10, 9, '#e8dcb8', '#8a6a40'); };
  for (let i = 2; i < 10; i++) ep(i / 10, 20, -25, -58, -30, 10, 0, -60, -104);
  for (let i = 1; i < 9; i++) ep(i / 9, -30, -2, 44, 46, -104, -132, -94, -30);
  horn(26, -26, 104, -80, 15, '#d8cba6');
  skin(() => {
    ctx.moveTo(8, -32); ctx.bezierCurveTo(45, -42, 85, -18, 108, 8); ctx.lineTo(112, 22); ctx.lineTo(98, 27);
    ctx.bezierCurveTo(70, 35, 30, 32, 6, 20); ctx.closePath();
  }, ['#3c4630', '#728058', '#b9bd92'], -42, 34, { mark: () => { ctx.fillStyle = 'rgba(255,240,200,.15)'; ctx.beginPath(); ctx.ellipse(40, 18, 30, 8, 0, 0, 7); ctx.fill(); } });
  horn(24, 14, 6, 34, 10, '#d8cba6');
  const bg = ctx.createLinearGradient(96, 0, 116, 28); bg.addColorStop(0, '#1d1913'); bg.addColorStop(0.5, '#4a4236'); bg.addColorStop(1, '#141210');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(98, 2); ctx.lineTo(118, 20); ctx.lineTo(100, 29); ctx.quadraticCurveTo(94, 16, 98, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(101, 6); ctx.lineTo(112, 18); ctx.stroke();
  horn(40, -30, 122, -72, 16, '#f2e8cc');
  horn(80, -6, 94, -34, 11, '#f2e8cc');
  fold([34, -22, 46, -28, 60, -20], 0.7, 3.5);
  eye(48, -14, 4.3);
  ctx.fillStyle = '#120b05'; ctx.beginPath(); ctx.ellipse(92, 0, 3, 2, 0.5, 0, 7); ctx.fill();
  ctx.restore();
}

// ---------- 스테고사우루스 ----------
function plate(x, y, s, far) {
  ctx.beginPath(); ctx.moveTo(x - s * 0.42, y + 8); ctx.quadraticCurveTo(x - s * 0.58, y - s * 0.5, x - s * 0.18, y - s * 1.15);
  ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.55, x + s * 0.42, y + 8); ctx.closePath();
  const g = ctx.createLinearGradient(x, y + 8, x - s * 0.18, y - s * 1.15);
  g.addColorStop(0, far ? '#3e3c22' : '#6b6a3a'); g.addColorStop(0.45, far ? '#8a4a22' : '#d9782e'); g.addColorStop(1, far ? '#7a2414' : '#d2341c');
  ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(90,20,8,.45)'; ctx.lineWidth = 1.4;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.quadraticCurveTo(x + i * s * 0.08, y - s * 0.4, x + i * s * 0.16 - s * 0.1, y - s * 1.1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,230,180,.18)'; ctx.beginPath(); ctx.ellipse(x - s * 0.2, y - s * 0.5, s * 0.12, s * 0.4, -0.2, 0, 7); ctx.fill();
  ctx.restore(); ctx.strokeStyle = 'rgba(20,10,5,.85)'; ctx.lineWidth = 1.6; ctx.stroke();
}
function drawStego(p) {
  const t = p.t, br = Math.sin(t * 0.09) * 1.5, sw = Math.sin(t * 0.06) * 5 + p.tail;
  const C = ['#363c27', '#737548', '#d6cc9e'], LC = ['#2c3020', '#5a5c38', '#8d8b5c'];
  const back = [[-172, -150, 22], [-134, -161, 32], [-94, -171, 44], [-54, -177, 52], [-12, -178, 55], [28, -168, 48], [62, -150, 38], [88, -128, 28], [106, -108, 18]];
  for (const [x, y, s] of back) plate(x + 16, y + 2 - br, s * 0.88, true);
  horn(-212, -124 + sw, -246, -174 + sw, 12, '#cdbf98', '#4a4630'); horn(-228, -120 + sw, -272, -150 + sw, 11, '#cdbf98', '#4a4630');
  quadLeg(-40, -118, p, p.walk + Math.PI, true, 52, LC); quadLeg(84, -84, p, p.walk, true, 30, LC);
  skin(() => {
    ctx.moveTo(-238, -120 + sw); ctx.quadraticCurveTo(-150, -152 + sw * 0.5, -50, -174 - br);
    ctx.bezierCurveTo(10, -184 - br, 70, -150, 100, -112); ctx.bezierCurveTo(112, -98, 120, -92, 128, -90); ctx.lineTo(132, -72);
    ctx.bezierCurveTo(95, -60, 50, -50, 5, -53); ctx.bezierCurveTo(-50, -56, -95, -80, -125, -98);
    ctx.quadraticCurveTo(-180, -116 + sw * 0.6, -238, -114 + sw); ctx.closePath();
  }, C, -180, -50, { big: 1, mark: () => {
    ctx.strokeStyle = 'rgba(30,26,12,.42)'; ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) { ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-200 + i * 32, -170); ctx.quadraticCurveTo(-205 + i * 32, -130, -195 + i * 32, -100); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,200,.2)'; ctx.beginPath(); ctx.ellipse(0, -58, 100, 10, 0, 0, 7); ctx.fill();
  } });
  fold([-80, -140, -50, -110, -40, -70], 0.25, 3); fold([60, -130, 80, -110, 88, -80], 0.28, 2.5);
  for (const [x, y, s] of back) plate(x, y - br, s, false);
  horn(-206, -126 + sw, -238, -180 + sw, 13, '#efe3c0', '#5a5636'); horn(-222, -122 + sw, -262, -158 + sw, 12, '#efe3c0', '#5a5636');
  quadLeg(-24, -112, p, p.walk, false, 56, LC); quadLeg(98, -80, p, p.walk + Math.PI, false, 32, LC);
  ctx.save(); ctx.translate(126 + p.hx, -84 + p.hy); ctx.rotate(p.hr);
  skin(() => { ctx.moveTo(-8, -12); ctx.bezierCurveTo(10, -19, 38, -16, 54, -7); ctx.lineTo(60, 2); ctx.lineTo(52, 9); ctx.bezierCurveTo(35, 13, 10, 13, -8, 9); ctx.closePath(); }, ['#3a3f28', '#7b7c4c', '#d0c69a'], -19, 13);
  ctx.fillStyle = '#26221a'; ctx.beginPath(); ctx.moveTo(52, -6); ctx.lineTo(61, 2); ctx.lineTo(52, 9); ctx.quadraticCurveTo(48, 2, 52, -6); ctx.fill();
  ctx.strokeStyle = 'rgba(15,10,5,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(52, 3); ctx.lineTo(18, 6); ctx.stroke();
  eye(20, -5, 3); ctx.fillStyle = '#120b05'; ctx.beginPath(); ctx.arc(48, -6, 1.6, 0, 7); ctx.fill();
  ctx.restore();
}

// ---------- 안킬로사우루스 ----------
function scute(x, y, r, spike) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r * 1.2);
  g.addColorStop(0, '#e2cfa4'); g.addColorStop(0.6, '#a08a62'); g.addColorStop(1, '#4f4028');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.68, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(25,18,8,.8)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(40,30,15,.55)'; ctx.beginPath(); ctx.moveTo(x - r * 0.7, y); ctx.lineTo(x, y - r * (spike ? 0.9 : 0.35)); ctx.lineTo(x + r * 0.7, y); ctx.stroke();
}
function drawAnkylo(p) {
  const t = p.t, br = Math.sin(t * 0.09) * 1.2, sw = Math.sin(t * 0.07) * 5 + p.tail;
  const C = ['#3a3124', '#7a6748', '#cbb58c'], LC = ['#2c2519', '#5a4a33', '#8a7656'];
  quadLeg(-62, -64, p, p.walk + Math.PI, true, 40, LC, 0.6); quadLeg(70, -64, p, p.walk, true, 34, LC, 0.6);
  // 꼬리 곤봉
  skin(() => { ctx.ellipse(-222, -68 + sw, 28, 20, 0, 0, 7); }, ['#5a4a33', '#a8926a', '#d6c29a'], -90 + sw, -48 + sw, { big: 1 });
  skin(() => { ctx.ellipse(-244, -66 + sw, 19, 16, 0, 0, 7); }, ['#5a4a33', '#a8926a', '#d6c29a'], -84 + sw, -50 + sw, { big: 1 });
  skin(() => {
    ctx.moveTo(-205, -74 + sw); ctx.quadraticCurveTo(-150, -88 + sw * 0.5, -105, -110);
    ctx.bezierCurveTo(-60, -152 - br, 60, -152 - br, 100, -110); ctx.lineTo(118, -92);
    ctx.bezierCurveTo(110, -56, 60, -42, 0, -42); ctx.bezierCurveTo(-60, -42, -108, -54, -140, -66);
    ctx.quadraticCurveTo(-175, -72 + sw * 0.6, -205, -62 + sw); ctx.closePath();
  }, C, -150, -42, { big: 1 });
  // 등 갑옷
  for (let r = 0; r < 4; r++) for (let x = -95 + (r % 2) * 12; x <= 95; x += 24) {
    const y = -146 + Math.pow(x / 108, 2) * 40 + r * 19 - br; if (y > -60) continue;
    scute(x, y, 11 - r * 1.3, r === 0);
  }
  for (let x = -190; x <= -110; x += 18) scute(x, -82 + (x + 190) * -0.25 + sw * (1 - (x + 190) / 80), 7, true);
  for (let x = -110; x <= 80; x += 28) horn(x, -66 + Math.abs(x) * 0.06, x - 10, -44 + Math.abs(x) * 0.06, 12, '#e8dbb8', '#5a4a33');
  horn(80, -126, 104, -150, 14, '#efe3c0', '#5a4a33'); horn(56, -138, 72, -164, 13, '#efe3c0', '#5a4a33');
  quadLeg(-48, -60, p, p.walk, false, 44, LC, 0.6); quadLeg(84, -60, p, p.walk + Math.PI, false, 38, LC, 0.6);
  ctx.save(); ctx.translate(112 + p.hx, -88 + p.hy); ctx.rotate(p.hr);
  horn(-2, -14, -18, -32, 12, '#efe3c0', '#5a4a33');
  skin(() => { ctx.moveTo(-8, -18); ctx.lineTo(30, -24); ctx.bezierCurveTo(46, -22, 54, -10, 56, 0); ctx.lineTo(52, 9); ctx.bezierCurveTo(30, 13, 8, 13, -6, 9); ctx.closePath(); }, ['#4a3e2c', '#8a7552', '#cdb88e'], -24, 13, { big: 1 });
  horn(2, 6, -10, 22, 11, '#efe3c0', '#5a4a33');
  for (const [x, y] of [[10, -18], [24, -20], [38, -16]]) scute(x, y, 5, false);
  ctx.fillStyle = '#26221a'; ctx.beginPath(); ctx.moveTo(52, -4); ctx.lineTo(58, 2); ctx.lineTo(52, 9); ctx.fill();
  eye(22, -7, 3.2);
  ctx.restore();
}

// ---------- 스피노사우루스 ----------
function drawSpino(p) {
  const t = p.t, sw = Math.sin(t * 0.06) * 7 + p.tail, br = Math.sin(t * 0.1) * 2;
  const C = ['#2b3536', '#617068', '#d4cca8'], L = { near: ['#263031', '#566560', '#9aa392'], far: ['#141b1c', '#344040', '#5a6662'], k: 0.82, x: -6 };
  // 꼬리 지느러미
  skin(() => { ctx.moveTo(-100, -150); ctx.quadraticCurveTo(-185, -205 + sw * 0.6, -266, -126 + sw); ctx.quadraticCurveTo(-190, -86 + sw * 0.6, -110, -116); ctx.closePath(); }, ['#5a2a1e', '#8a4a30', '#3a4a48'], -200, -90, { pa: 0.5, mark: () => {
    ctx.strokeStyle = 'rgba(30,15,8,.45)'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const x = -110 - i * 13; ctx.beginPath(); ctx.moveTo(x, -170 + i * 2); ctx.lineTo(x - 4, -95); ctx.stroke(); }
  } });
  theroLeg(p, p.walk + Math.PI, true, L);
  smallArm(p, [112, -128], true, ['#1c2526', '#344040', '#5a6662'], 1.6);
  // 돛
  const sail = () => { ctx.moveTo(-104, -152); ctx.bezierCurveTo(-84, -284 - br, 40, -326 - br, 104, -160); ctx.lineTo(60, -166); ctx.lineTo(-20, -170); ctx.closePath(); };
  skin(sail, ['#9e1f1f', '#d9672b', '#5f6f6a'], -320, -150, { pa: 0.35, mark: () => {
    ctx.strokeStyle = 'rgba(40,10,5,.55)'; ctx.lineWidth = 3;
    for (let i = 0; i <= 14; i++) { const s = i / 14, x = bez(s, -104, -84, 40, 104), y = bez(s, -152, -284 - br, -326 - br, -160); ctx.beginPath(); ctx.moveTo(lerp(-90, 95, s), -160); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(40,20,10,.3)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-60 + i * 32, -210 - Math.sin(i) * 20, 9, 22, 0, 0, 7); ctx.fill(); }
  } });
  skin(() => {
    ctx.moveTo(-262, -120 + sw); ctx.quadraticCurveTo(-170, -142 + sw * 0.5, -80, -162 - br);
    ctx.bezierCurveTo(-20, -174 - br, 60, -172, 110, -160); ctx.lineTo(140, -152 + p.hy * 0.4); ctx.lineTo(146, -125 + p.hy * 0.4);
    ctx.bezierCurveTo(110, -108, 60, -94, 10, -97); ctx.bezierCurveTo(-40, -100, -80, -112, -120, -122);
    ctx.quadraticCurveTo(-190, -128 + sw * 0.6, -262, -114 + sw); ctx.closePath();
  }, C, -175, -94, { big: 1, mark: () => {
    ctx.fillStyle = 'rgba(15,22,24,.42)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-220 + i * 34, -150 + Math.abs(i - 6) * 2, 7, 18, 0.15, 0, 7); ctx.fill(); }
  } });
  fold([40, -150, 70, -128, 80, -104], 0.3, 2.5); fold([100, -158, 120, -140, 124, -118], 0.3, 2);
  ctx.save(); ctx.translate(138 + p.hx, -142 + p.hy); ctx.rotate(p.hr);
  const ja = p.jaw * 0.45, jl = 128;
  ctx.fillStyle = '#4a1a14'; ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(132, 4); ctx.lineTo(8 + jl * Math.cos(ja), 6 + jl * Math.sin(ja)); ctx.closePath(); ctx.fill();
  if (p.jaw > 0.05) teeth(20, 128, 5, 1, 15, 4);
  ctx.save(); ctx.translate(8, 6); ctx.rotate(ja);
  if (p.jaw > 0.05) teeth(14, 118, 0, -1, 13, 3.6);
  skin(() => { ctx.moveTo(-8, 0); ctx.lineTo(126, -1); ctx.quadraticCurveTo(128, 8, 116, 12); ctx.lineTo(10, 18); ctx.quadraticCurveTo(-10, 14, -8, 0); }, ['#3a4442', '#6f7d74', '#d8d0ae'], 0, 18);
  ctx.restore();
  skin(() => {
    ctx.moveTo(-14, -16); ctx.bezierCurveTo(14, -32, 40, -26, 70, -16); ctx.quadraticCurveTo(110, -10, 128, -10);
    ctx.quadraticCurveTo(142, -6, 138, 4); ctx.lineTo(10, 7); ctx.lineTo(-16, 16); ctx.closePath();
  }, ['#253031', '#5a6a64', '#a6ad98'], -30, 16, { mark: () => { ctx.fillStyle = 'rgba(15,22,24,.35)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(60 + i * 9, -12 + Math.sin(i * 2) * 2, 2, 0, 7); ctx.fill(); } } });
  teeth(30, 134, 5, 1, 13, 2.2);
  ctx.fillStyle = '#7a2a1e'; ctx.beginPath(); ctx.moveTo(18, -24); ctx.quadraticCurveTo(30, -36, 44, -24); ctx.closePath(); ctx.fill();
  eye(30, -14, 4); ctx.fillStyle = '#120b05'; ctx.beginPath(); ctx.ellipse(74, -15, 3, 1.6, 0, 0, 7); ctx.fill();
  ctx.restore();
  theroLeg(p, p.walk, false, L);
  smallArm(p, [118, -124], false, ['#263031', '#566560', '#9aa392'], 1.6);
}

// ---------- 테리지노사우루스 ----------
function fluff(pts, len, col1, col2) {
  ctx.lineCap = 'round';
  for (let i = 0; i < pts.length; i++) {
    const [x, y, a] = pts[i], l = len * (0.7 + 0.3 * Math.sin(i * 2.3));
    ctx.strokeStyle = i % 2 ? col1 : col2; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
}
function theriArm(p, far) {
  const C = far ? ['#1f150c', '#3e2c1c', '#5e4630'] : ['#3a2a1c', '#6e5034', '#b4946a'];
  ctx.save(); ctx.translate(far ? 52 : 62, far ? -188 : -184); ctx.rotate(-p.arm * 1.05 + Math.sin(p.t * 0.05) * 0.04);
  const e = [22, 52], h = [48, 78];
  const fp = []; for (let i = 0; i <= 10; i++) fp.push([lerp(4, h[0], i / 10), lerp(10, h[1], i / 10), 2.2]);
  fluff(fp, 30, far ? '#1a120a' : '#2a1d12', far ? '#4a3a2a' : '#e8dcc4');
  limb([[0, 0], e, h], [24, 18, 14], C, { feather: 1, pa: 0.8 });
  for (const d of [-0.35, -0.1, 0.15]) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(0.5 + d);
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(70, -14, 100, 40); ctx.quadraticCurveTo(62, 6, 0, 5); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 100, 40); g.addColorStop(0, '#2a2016'); g.addColorStop(0.5, far ? '#8a8068' : '#cfc4a4'); g.addColorStop(1, '#fffaf0');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(15,10,5,.85)'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
function drawTheri(p) {
  const t = p.t, sw = Math.sin(t * 0.06) * 5 + p.tail, br = Math.sin(t * 0.1) * 2;
  const C = ['#3a2a1a', '#7a5a38', '#dcc49a'], L = { near: ['#3a2a1c', '#6e5034', '#a88a64'], far: ['#1f150c', '#3e2c1c', '#5e4630'], k: 1, x: -4 };
  theroLeg(p, p.walk + Math.PI, true, L);
  theriArm(p, true);
  const nx = 110 + p.hx, ny = -296 + p.hy;
  const backF = []; for (let i = 0; i <= 40; i++) { const s = i / 40; backF.push([bez(s, -150, -100, -10, 60), bez(s, -150 + sw, -180, -236 - br, -206) - 2, -1.9 - s * 0.3]); }
  const neckF = []; for (let i = 0; i <= 26; i++) { const s = i / 26; neckF.push([bez(s, 48, 52, 70, nx - 6), bez(s, -206, -255, -285, ny), -2.6 + s * 0.4]); }
  fluff(backF, 16, '#4a3422', '#8a6a48'); fluff(neckF, 12, '#4a3422', '#8a6a48');
  skin(() => { ctx.moveTo(42, -200); ctx.bezierCurveTo(52, -258, 76, -288, nx - 4, ny - 4); ctx.lineTo(nx + 4, ny + 12); ctx.bezierCurveTo(92, -266, 82, -236, 80, -190); ctx.closePath(); }, C, -300, -190, { feather: 1 });
  skin(() => {
    ctx.moveTo(-152, -148 + sw); ctx.quadraticCurveTo(-100, -178 + sw * 0.5, -50, -192);
    ctx.bezierCurveTo(-10, -232 - br, 50, -238 - br, 72, -206); ctx.lineTo(80, -190);
    ctx.bezierCurveTo(88, -138, 62, -86, 10, -82); ctx.bezierCurveTo(-40, -79, -72, -108, -92, -134);
    ctx.quadraticCurveTo(-122, -150 + sw * 0.6, -152, -144 + sw); ctx.closePath();
  }, C, -235, -80, { feather: 1, mark: () => {
    ctx.fillStyle = 'rgba(255,240,215,.25)'; ctx.beginPath(); ctx.ellipse(40, -120, 34, 50, 0.2, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(25,15,6,.35)'; ctx.lineWidth = 5; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-130 + i * 26, -175 + i * -6); ctx.lineTo(-138 + i * 26, -150 + i * -6); ctx.stroke(); }
  } });
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(p.hr);
  skin(() => { ctx.moveTo(-10, -9); ctx.bezierCurveTo(4, -16, 26, -14, 38, -4); ctx.lineTo(44, 3); ctx.lineTo(34, 8); ctx.bezierCurveTo(18, 10, 0, 10, -10, 5); ctx.closePath(); }, ['#3a2a1a', '#7a5a38', '#d8c09a'], -16, 10, { feather: 1 });
  ctx.fillStyle = '#2a241c'; ctx.beginPath(); ctx.moveTo(32, -5); ctx.lineTo(45, 3); ctx.lineTo(34, 9); ctx.quadraticCurveTo(28, 2, 32, -5); ctx.fill();
  ctx.strokeStyle = 'rgba(15,10,5,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(42, 3); ctx.lineTo(12, 5); ctx.stroke();
  eye(12, -4, 3.2);
  ctx.restore();
  theroLeg(p, p.walk, false, L);
  theriArm(p, false);
}

// ---------- 파키케팔로사우루스 ----------
function drawPachy(p) {
  const t = p.t, sw = Math.sin(t * 0.07) * 5 + p.tail, br = Math.sin(t * 0.11) * 1.6;
  const C = ['#26303d', '#5a6e82', '#dacfb2'], L = { near: ['#26303d', '#536679', '#9aa6ae'], far: ['#141a22', '#323f4c', '#56636e'], k: 0.78, x: 0 };
  theroLeg(p, p.walk + Math.PI, true, L);
  smallArm(p, [70, -100], true, ['#141a22', '#323f4c', '#56636e'], 0.9);
  skin(() => {
    ctx.moveTo(-178, -110 + sw); ctx.quadraticCurveTo(-100, -142 + sw * 0.4, -20, -141 - br);
    ctx.bezierCurveTo(30, -143 - br, 60, -133, 80, -124 + p.hy * 0.3); ctx.lineTo(94, -112 + p.hy * 0.3);
    ctx.bezierCurveTo(70, -86, 40, -74, 5, -76); ctx.bezierCurveTo(-30, -78, -55, -90, -80, -98);
    ctx.quadraticCurveTo(-130, -106 + sw * 0.6, -178, -104 + sw); ctx.closePath();
  }, C, -145, -74, { mark: () => {
    ctx.fillStyle = 'rgba(15,20,28,.4)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(-160 + i * 17, -128 + Math.sin(i * 1.3) * 6 + (i < 4 ? 10 : 0), 4 + (i % 3), 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(240,225,190,.25)'; ctx.beginPath(); ctx.ellipse(10, -80, 70, 9, 0, 0, 7); ctx.fill();
  } });
  fold([40, -126, 60, -110, 66, -92], 0.3, 2);
  ctx.save(); ctx.translate(88 + p.hx, -124 + p.hy); ctx.rotate(p.hr);
  skin(() => { ctx.moveTo(-6, -6); ctx.bezierCurveTo(10, -6, 30, -4, 42, 6); ctx.lineTo(42, 15); ctx.bezierCurveTo(25, 19, 5, 17, -8, 11); ctx.closePath(); }, ['#2e3a48', '#647a8e', '#d0c6aa'], -8, 19);
  for (const [x, y, a] of [[-14, -6, 2.6], [-16, 2, 2.9], [-12, 10, 3.3], [30, -6, -1.4], [38, -2, -1.0], [22, -10, -1.7]]) horn(x, y, x + Math.cos(a) * 9, y + Math.sin(a) * 9, 6, '#e8dcb8', '#5a5040');
  ctx.beginPath(); ctx.ellipse(8, -18, 26, 21, -0.25, 0, 7);
  const dg = ctx.createRadialGradient(0, -30, 2, 8, -18, 28); dg.addColorStop(0, '#fff6dc'); dg.addColorStop(0.5, '#d9c494'); dg.addColorStop(1, '#7a6440');
  ctx.fillStyle = dg; ctx.fill(); ctx.strokeStyle = 'rgba(25,18,8,.85)'; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(110,80,40,.4)'; ctx.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(8, -14, 26 - i * 6, 21 - i * 5, -0.25, Math.PI, 2 * Math.PI); ctx.stroke(); }
  ctx.restore();
  eye(16, -1, 3.4); ctx.fillStyle = '#120b05'; ctx.beginPath(); ctx.arc(38, 4, 1.6, 0, 7); ctx.fill();
  ctx.restore();
  theroLeg(p, p.walk, false, L);
  smallArm(p, [74, -96], false, ['#26303d', '#536679', '#9aa6ae'], 0.9);
}

// ---------- 프테라노돈 (익룡) ----------
function wing(a, far) {
  ctx.save(); ctx.rotate(a);
  const mem = () => { ctx.moveTo(0, 0); ctx.lineTo(-40, -18); ctx.lineTo(-76, -8); ctx.quadraticCurveTo(-150, -36, -235, -10); ctx.quadraticCurveTo(-150, 18, -62, 32); ctx.quadraticCurveTo(-25, 28, 0, 14); ctx.closePath(); };
  skin(mem, far ? ['#3a2016', '#5a3020', '#7a4a30'] : ['#5a2c1a', '#a0603a', '#d89a68'], -36, 32, { pa: 0.25, mark: () => {
    ctx.strokeStyle = far ? 'rgba(20,8,4,.35)' : 'rgba(60,20,8,.35)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) { const s = i / 16, x = lerp(-76, -232, s); ctx.beginPath(); ctx.moveTo(x, -10 - Math.sin(s * Math.PI) * 16); ctx.lineTo(x + 30 + s * 20, 20 - s * 18); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,220,170,.14)'; ctx.beginPath(); ctx.ellipse(-120, 4, 70, 9, -0.05, 0, 7); ctx.fill();
  } });
  ctx.strokeStyle = far ? '#2a160c' : '#4a2616'; ctx.lineCap = 'round'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -18); ctx.lineTo(-76, -8); ctx.quadraticCurveTo(-150, -36, -235, -10); ctx.stroke();
  for (const d of [0.4, 0.8, 1.2]) claw(-74, -8, -1.6 + d, 9, 3);
  ctx.restore();
}
function drawPtera(p) {
  const t = p.t, bob = Math.sin(t * 0.09) * 6 + p.hy * 0.5, f = Math.sin(t * 0.18) * 0.45 + p.wing;
  ctx.save(); ctx.translate(0, bob);
  ctx.save(); ctx.translate(14, -156); wing(0.75 + f * 0.6, true); ctx.restore();
  ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const o of [0, 8]) { ctx.beginPath(); ctx.moveTo(-26 + o, -142); ctx.lineTo(-44 + o, -116 + Math.sin(t * 0.09 + o) * 3); ctx.stroke(); claw(-44 + o, -116, 1.2, 8, 3); }
  const fur = []; for (let i = 0; i <= 14; i++) fur.push([lerp(-36, 30, i / 14), -160 - Math.sin(i / 14 * Math.PI) * 6, -1.8]);
  fluff(fur, 9, '#3a2618', '#a07858');
  skin(() => { ctx.ellipse(-2, -148, 44, 18, 0.12, 0, 7); }, ['#4a3828', '#8a6b52', '#dcc6a0'], -166, -130, { feather: 1 });
  skin(() => { ctx.moveTo(24, -160); ctx.quadraticCurveTo(40, -172, 54 + p.hx, -168 + p.hy * 0.3); ctx.lineTo(56 + p.hx, -156 + p.hy * 0.3); ctx.quadraticCurveTo(40, -154, 28, -142); ctx.closePath(); }, ['#4a3828', '#8a6b52', '#dcc6a0'], -172, -142, { feather: 1 });
  ctx.save(); ctx.translate(56 + p.hx, -164 + p.hy * 0.3); ctx.rotate(p.hr);
  skin(() => { ctx.moveTo(-2, -6); ctx.quadraticCurveTo(-34, -30, -82, -36); ctx.quadraticCurveTo(-40, -14, -4, 4); ctx.closePath(); }, ['#8a1e12', '#e0462a', '#ffb03a'], -36, 4, { pa: 0.2 });
  const ja = p.jaw * 0.35;
  ctx.save(); ctx.rotate(ja);
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(98, 3); ctx.quadraticCurveTo(50, 12, -2, 10); ctx.closePath();
  let g = ctx.createLinearGradient(0, 0, 100, 0); g.addColorStop(0, '#a08a62'); g.addColorStop(1, '#efe3c4'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(25,18,8,.85)'; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-4, -8); ctx.quadraticCurveTo(50, -8, 104, 1); ctx.quadraticCurveTo(50, 6, -4, 4); ctx.closePath();
  g = ctx.createLinearGradient(0, 0, 104, 0); g.addColorStop(0, '#b09a70'); g.addColorStop(1, '#fff6e0'); ctx.fillStyle = g; ctx.fill(); ctx.stroke();
  skin(() => { ctx.ellipse(0, -1, 13, 10, 0, 0, 7); }, ['#4a3828', '#8a6b52', '#cdb490'], -11, 9);
  eye(4, -3, 3.4);
  ctx.restore();
  ctx.save(); ctx.translate(18, -150); wing(0.25 + f * 0.9, false); ctx.restore();
  ctx.restore();
}

// ===== 기술 데이터 =====
// zone: high(웅크리면 피함) / mid / low / up(위로, 공중 적 맞춤) / body(몸통 낙하)
// air: true면 공중의 적도 맞춤 (아니면 점프로 피할 수 있음)
const mv = (name, anim, zone, s, a, r, reach, width, dmg, kb, x = {}) => ({ name, anim, zone, startup: s, active: a, recovery: r, reach, width, dmg, kb, ...x });
const DINOS = [
  { key: 'trex', name: '티라노사우루스', type: '파워형', hp: 1000, speed: 3.4, jump: 16, grav: 0.8, bw: 200, h: 200, len: 450, imgScale: 1.3, draw: drawTrex, stars: [5, 3, 3], aura: '#ff4d2e',
    moves: {
      z: mv('티라노 풀스매싱 꼬리치기', 'tailsmash', 'mid', 9, 7, 16, 320, 170, 60, 13),
      x: mv('티라노 씽 음파 발사', 'sonic', 'mid', 16, 8, 24, 0, 0, 95, 12, { proj: 'sonic' }),
      dz: mv('꼬리 휘감기', 'spin', 'low', 10, 6, 18, 300, 140, 60, 9),
      dx: mv('올려 물기', 'upbite', 'up', 10, 7, 20, 280, 140, 80, 10, { air: true }),
      j: mv('공중 물기', 'bite', 'air', 5, 10, 8, 270, 140, 65, 8, { air: true }),
      c: mv('메가 바이트 물기', 'megabite', 'mid', 20, 32, 24, 330, 190, 85, 8, { special: true, kind: 'dash', dash: 13, hits: 3, interval: 9, launch: true, fx: 'bite' }) } },
  { key: 'trice', name: '트리케라톱스', type: '돌진형', hp: 1080, speed: 3.0, jump: 14, grav: 0.8, bw: 210, h: 190, len: 420, imgScale: 1.15, draw: drawTrice, stars: [4, 4, 3], aura: '#ff9f1c',
    moves: {
      z: mv('트리케라 쿵쿵거리기', 'stomp2', 'low', 10, 20, 16, 0, 0, 30, 8, { proj: 'stomp', stompAt: [3, 15] }),
      x: mv('트리케라 쉴드 프릴 방어', 'shield', 'mid', 4, 42, 12, 0, 0, 0, 0, { kind: 'shield' }),
      dz: mv('발 구르기', 'stomp', 'low', 12, 6, 18, 290, 150, 60, 9),
      dx: mv('뿔 올려치기', 'toss', 'up', 10, 7, 20, 280, 140, 80, 10, { air: true }),
      j: mv('공중 뿔 찍기', 'thrust', 'air', 5, 10, 8, 270, 140, 65, 8, { air: true }),
      c: mv('트리플 혼 어택', 'hornattack', 'mid', 26, 26, 28, 310, 190, 240, 24, { special: true, kind: 'dash', dash: 20, launch: true, fx: 'horn' }) } },
  { key: 'stego', name: '스테고사우루스', type: '반격형', hp: 1100, speed: 2.7, jump: 13, grav: 0.8, bw: 210, h: 190, len: 450, imgScale: 1.15, draw: drawStego, stars: [4, 4, 2], aura: '#ff5d8f',
    moves: {
      z: mv('풀스윙', 'tailsmash', 'mid', 9, 7, 16, 320, 180, 60, 13, { hitText: '풀스윙!' }),
      x: mv('스테고 레이저', 'laser', 'mid', 18, 8, 22, 0, 0, 95, 10, { proj: 'laser' }),
      dz: mv('낮은 꼬리 쓸기', 'spin', 'low', 11, 7, 18, 310, 150, 60, 9),
      dx: mv('골판 올려치기', 'toss', 'up', 11, 7, 20, 270, 150, 80, 10, { air: true }),
      j: mv('공중 몸통 박치기', 'thrust', 'air', 5, 10, 8, 260, 150, 65, 8, { air: true }),
      c: mv('롤링 스매싱', 'roll', 'mid', 18, 36, 22, 300, 220, 62, 7, { special: true, kind: 'dash', dash: 13, hits: 4, interval: 8, turns: 5, launch: true, fx: 'slash' }) } },
  { key: 'ankylo', name: '안킬로사우루스', type: '방어형', hp: 1200, speed: 2.4, jump: 12, grav: 0.8, bw: 230, h: 140, len: 470, imgScale: 1.1, draw: drawAnkylo, stars: [4, 5, 1], aura: '#d9a24a',
    moves: {
      z: mv('지진 일으키기', 'quakeslam', 'low', 12, 6, 18, 0, 0, 55, 10, { proj: 'quake' }),
      x: mv('롤링 안킬로 스매싱', 'roll', 'mid', 14, 14, 20, 300, 210, 100, 14, { lunge: 12, turns: 2 }),
      dz: mv('낮은 꼬리 휩쓸기', 'spin', 'low', 12, 7, 18, 320, 160, 65, 9),
      dx: mv('갑옷 들이받기', 'toss', 'up', 11, 7, 20, 270, 150, 75, 10, { air: true }),
      j: mv('공중 갑옷 낙하', 'thrust', 'air', 5, 10, 8, 260, 160, 70, 8, { air: true }),
      c: mv('아머 해머 꼬리치기', 'hammer', 'mid', 22, 30, 28, 340, 230, 115, 16, { special: true, kind: 'multi', hits: 2, interval: 13, lunge: 4, launch: true, fx: 'quake' }) } },
  { key: 'spino', name: '스피노사우루스', type: '리치형', hp: 1050, speed: 3.1, jump: 15, grav: 0.8, bw: 210, h: 200, len: 500, imgScale: 1.15, draw: drawSpino, stars: [4, 3, 3], aura: '#3fa7ff',
    moves: {
      z: mv('스피노 롤링', 'roll', 'mid', 8, 12, 14, 290, 200, 55, 9, { lunge: 11, turns: 2 }),
      x: mv('워터 바이트', 'waterbite', 'mid', 15, 8, 22, 345, 150, 100, 11, { hitFx: 'water' }),
      dz: mv('꼬리 쓸기', 'spin', 'low', 11, 7, 18, 320, 150, 60, 9),
      dx: mv('올려 물기', 'upbite', 'up', 10, 7, 20, 290, 150, 80, 10, { air: true }),
      j: mv('공중 할퀴기', 'claw', 'air', 5, 10, 8, 270, 150, 65, 8, { air: true }),
      c: mv('워터 토네이도', 'roar', 'mid', 22, 30, 24, 0, 0, 65, 8, { special: true, kind: 'proj', proj: 'tornado', launch: true, fx: 'water' }) } },
  { key: 'theri', name: '테리지노사우루스', type: '연속기형', hp: 980, speed: 3.0, jump: 15, grav: 0.8, bw: 180, h: 280, len: 380, imgScale: 1.25, draw: drawTheri, stars: [4, 3, 3], aura: '#b07cff',
    moves: {
      z: mv('독깃털 날리기', 'throw', 'mid', 9, 6, 16, 0, 0, 15, 4, { proj: 'feather', poison: 90 }),
      x: mv('미스터리 스트링', 'stringcast', 'mid', 12, 16, 30, 0, 0, 90, 8, { proj: 'string' }),
      dz: mv('낮은 발톱 쓸기', 'lowclaw', 'low', 10, 7, 18, 310, 150, 60, 9),
      dx: mv('올려 베기', 'clawup', 'up', 10, 7, 20, 290, 160, 80, 10, { air: true }),
      j: mv('공중 발톱', 'claw', 'air', 5, 10, 8, 280, 160, 65, 8, { air: true }),
      c: mv('나이트 스매싱', 'flurry', 'mid', 14, 44, 22, 330, 220, 42, 4, { special: true, kind: 'multi', hits: 6, interval: 7, lunge: 2.5, launch: true, fx: 'slash' }) } },
  { key: 'pachy', name: '파키케팔로사우루스', type: '돌격형', hp: 950, speed: 3.8, jump: 17, grav: 0.8, bw: 170, h: 165, len: 340, imgScale: 1.25, draw: drawPachy, stars: [3, 3, 5], aura: '#ff7a1a',
    moves: {
      z: mv('스피드 턴', 'speedturn', 'mid', 7, 12, 14, 280, 180, 35, 6, { dizzy: 45 }),
      x: mv('파키케 쉐도우 분신술', 'clone', 'mid', 12, 6, 22, 0, 0, 45, 10, { proj: 'clones' }),
      dz: mv('꼬리 쓸기', 'spin', 'low', 10, 6, 16, 280, 140, 55, 8),
      dx: mv('올려 박치기', 'toss', 'up', 9, 7, 18, 260, 140, 80, 10, { air: true }),
      j: mv('공중 박치기', 'dive', 'air', 5, 10, 8, 250, 150, 70, 9, { air: true }),
      c: mv('스톤 헤드 박치기', 'leap', 'body', 34, 40, 24, 0, 0, 240, 18, { special: true, kind: 'leap', rise: 10, from: 0, launch: true, fx: 'meteor' }) } },
  { key: 'ptera', name: '프테라노돈', type: '공중형', hp: 880, speed: 3.9, jump: 13, grav: 0.45, bw: 150, h: 200, hurtLow: 95, len: 400, imgScale: 1.1, imgLift: 70, draw: drawPtera, stars: [3, 2, 5], aura: '#7fd1ff',
    moves: {
      z: mv('프테라 윙 날개치기', 'wingbeat', 'mid', 8, 6, 14, 290, 180, 50, 10),
      x: mv('부리 쪼기', 'peck', 'mid', 10, 16, 18, 300, 140, 34, 5, { hits: 3, interval: 5, lunge: 3 }),
      dz: mv('발톱 낚아채기', 'swooplow', 'low', 10, 7, 18, 290, 150, 55, 8),
      dx: mv('날개 치기', 'wingup', 'up', 9, 8, 18, 270, 170, 75, 10, { air: true }),
      j: mv('공중 쪼기', 'dive', 'air', 5, 10, 8, 270, 150, 65, 8, { air: true }),
      c: mv('프테라 애로우', 'arrow', 'mid', 22, 20, 24, 300, 230, 230, 20, { special: true, kind: 'dash', dash: 26, air: true, launch: true, fx: 'arrow' }) } },
];
const DINO = Object.fromEntries(DINOS.map(d => [d.key, d]));
// 강한 공격(X, ↓+X)은 힘 모으기·크게 내지르기·"쾅!" 연출을 받는다
DINOS.forEach(d => { d.moves.x.heavy = true; d.moves.dx.heavy = true; });
