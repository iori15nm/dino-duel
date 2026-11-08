// ===== 게임 본체: 전투, CPU, 연출, 화면 =====
const SC = 0.92, CUT_T = 84;
const DIFF = [
  { name: '쉬움', react: 36, agg: 0.35, guard: 0.12, dodge: 0.05, dmg: 0.6 },
  { name: '보통', react: 20, agg: 0.55, guard: 0.35, dodge: 0.15, dmg: 0.85 },
  { name: '어려움', react: 10, agg: 0.75, guard: 0.5, dodge: 0.3, dmg: 1.05 },
];
// 선택 카드에 맞추기 위한 대략적인 그림 높이
const VH = { trex: 215, trice: 235, stego: 245, ankylo: 175, spino: 335, theri: 320, pachy: 180, ptera: 280 };

// 이미지 교체: assets/<공룡키>_idle.png, _attack.png, bg_forest.png 가 있으면 사용
const IMG = {};
// 경기장 배경: 대결을 시작할 때마다 이 중 하나를 무작위로 고른다 (없는 파일은 건너뜀)
const STAGES = ['forest', 'meadow', 'desert', 'lava', 'meteor'];
const STAGE_NAMES = ['숲', '초원', '사막', '용암', '운석'];
// 난이도 화면 배치 (터치 판정에서도 같이 씀)
const DIFF_BOX = { x0: W / 2 - 330, y: 98, h: 60 };
const STAGE_BOX = { x0: (W - (5 * 200 + 4 * 18)) / 2, y: 202, w: 200, h: 112, gap: 18 };
let stage = 'forest', stageIdx = 0, diffRow = 0; // 난이도 화면에서 고른 경기장 (diffRow: 0=난이도 줄, 1=경기장 줄)
[...DINOS.flatMap(d => [d.key + '_idle.png', d.key + '_attack.png']), ...STAGES.map(k => 'bg_' + k + '.jpg')].forEach(f => {
  const im = new Image(); im.onload = () => { IMG[f.split('.')[0]] = im; }; im.src = 'assets/' + f;
});
function drawDino(def, p, strike) {
  const idle = IMG[def.key + '_idle'];
  if (!idle) return def.draw(p);
  const im = (strike && IMG[def.key + '_attack']) || idle, w = def.len * (def.imgScale || 1.05), h = im.height * (w / im.width);
  ctx.save(); ctx.translate(p.hx * 0.6, Math.sin(p.t * 0.1) * 1.5 + p.hy * 0.3); ctx.rotate(p.hr * 0.25);
  if (p.stride) { ctx.translate(0, -Math.abs(Math.sin(p.walk)) * p.stride * 0.55); ctx.rotate(Math.sin(p.walk) * 0.035 * p.stride / 18); }
  if (p.dash) ctx.scale(1.08, 0.95);
  if (def.imgLift) { ctx.translate(0, -def.imgLift + Math.sin(p.t * 0.09) * 8); ctx.scale(1, 1 + 0.05 * Math.sin(p.t * 0.2)); } // 나는 동물: 떠 있고 날갯짓
  ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
}
// 화면에 그려질 실제 크기 (실사 이미지가 있으면 이미지 기준)
const visW = d => IMG[d.key + '_idle'] ? d.len * (d.imgScale || 1.05) : d.len;
const visH = d => { const im = IMG[d.key + '_idle']; return im ? im.height * visW(d) / im.width + (d.imgLift || 0) : VH[d.key]; };
const basePose = t => ({ t, walk: 0, stride: 0, jaw: 0, hx: 0, hy: 0, hr: 0, tail: 0, arm: 0, wing: 0, lean: 0, spin: 0 });
function showDino(def, x, y, facing, s, p) { ctx.save(); ctx.translate(x, y); ctx.scale(facing * s, s); drawDino(def, p, p.jaw > 0.5 || p.arm > 0.5); ctx.restore(); }

// ===== 파티클 / 투사체 / 글자 =====
let particles = [], projs = [], texts = [], hazards = [], hazardT = 0, finaleShown = false;
const R = Math.random;
function dust(x, y, n) { for (let i = 0; i < n; i++) particles.push({ type: 'dust', x: x + (R() - 0.5) * 80, y: y - R() * 10, vx: (R() - 0.5) * 3, vy: -R() * 1.5, life: 50, max: 50, r: 8 + R() * 12 }); }
function burst(x, y, big, col = '#fff2a8') {
  const n = big ? 26 : 12;
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, s = 4 + R() * (big ? 13 : 7); particles.push({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 18, max: 18, col }); }
  particles.push({ type: 'ring', x, y, r: 10, life: 16, max: 16, grow: big ? 10 : 6, col: big ? col : '#ffffff' });
}
function slashFx(x, y, col, flip) { particles.push({ type: 'slash', x, y, r: 70 + R() * 30, a: (R() - 0.5) * 1.2 + (flip ? Math.PI : 0), life: 14, max: 14, col }); }
function rocks(x, y, n) { for (let i = 0; i < n; i++) particles.push({ type: 'rock', x: x + (R() - 0.5) * 60, y, vx: (R() - 0.5) * 8, vy: -6 - R() * 10, g: 0.6, life: 50, max: 50, r: 4 + R() * 8, rot: R() * 6 }); }
function drops(x, y, n) { for (let i = 0; i < n; i++) particles.push({ type: 'drop', x: x + (R() - 0.5) * 70, y, vx: (R() - 0.5) * 7, vy: -6 - R() * 12, g: 0.55, life: 45, max: 45, r: 3 + R() * 5 }); }
function fire(x, y, n) { for (let i = 0; i < n; i++) particles.push({ type: 'fire', x: x + (R() - 0.5) * 40, y: y + (R() - 0.5) * 40, vx: (R() - 0.5) * 2, vy: -1 - R() * 2, life: 26, max: 26, r: 10 + R() * 16 }); }
function aura(f) { const c = f.def.aura; for (let i = 0; i < 5; i++) particles.push({ type: 'aura', x: f.x + (R() - 0.5) * f.def.len * 0.8, y: f.y - R() * f.def.h * 1.1, vx: 0, vy: -2 - R() * 3, life: 32, max: 32, r: 4 + R() * 7, col: c }); }
function streak(x, y, dir, col = 'rgba(255,255,255,.8)') { particles.push({ type: 'streak', x, y, vx: -dir * (14 + R() * 8), vy: 0, life: 12, max: 12, len: 60 + R() * 80, col }); }
function popText(s, x, y, col = '#fff', size = 34) { texts.push({ s, x, y, life: 50, max: 50, col, size }); }
function updParticles() {
  for (const p of particles) {
    p.x += p.vx || 0; p.y += p.vy || 0; p.life--; if (p.g) p.vy += p.g;
    if (p.type === 'dust') { p.r += 0.4; p.vx *= 0.95; } else if (p.type === 'spark') { p.vx *= 0.88; p.vy *= 0.88; }
    else if (p.type === 'ring') p.r += p.grow; else if (p.type === 'fire') p.r *= 0.95;
    else if ((p.type === 'rock' || p.type === 'drop') && p.y > GROUND + 8) { p.y = GROUND + 8; p.vy *= -0.3; p.vx *= 0.6; }
  }
  particles = particles.filter(p => p.life > 0);
  for (const t of texts) { t.y -= 1.2; t.life--; } texts = texts.filter(t => t.life > 0);
}
function drawParticles() {
  for (const p of particles) {
    const a = p.life / p.max; ctx.globalAlpha = 1;
    switch (p.type) {
      case 'dust': ctx.fillStyle = `rgba(165,140,100,${a * 0.45})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); break;
      case 'spark': ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5); ctx.stroke(); break;
      case 'ring': ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineWidth = 5 * a + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke(); break;
      case 'slash': {
        ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); const sw = (1 - a) * 2.2;
        ctx.lineCap = 'round'; ctx.strokeStyle = p.col; ctx.lineWidth = 14 * a; ctx.beginPath(); ctx.arc(0, 0, p.r, -1.2 + sw * 0.3, 0.6 + sw * 0.3); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5 * a; ctx.beginPath(); ctx.arc(0, 0, p.r, -1.0 + sw * 0.3, 0.5 + sw * 0.3); ctx.stroke(); ctx.restore(); break;
      }
      case 'rock': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + p.life * 0.1); ctx.fillStyle = '#6a5638'; ctx.strokeStyle = '#2a2014'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-p.r, -p.r * 0.4); ctx.lineTo(-p.r * 0.2, -p.r); ctx.lineTo(p.r, -p.r * 0.2); ctx.lineTo(p.r * 0.5, p.r * 0.8); ctx.lineTo(-p.r * 0.6, p.r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); break;
      case 'drop': ctx.globalAlpha = Math.min(1, a * 1.5); ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); break;
      case 'fire': case 'aura': {
        ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        if (p.type === 'fire') { g.addColorStop(0, `rgba(255,240,180,${a})`); g.addColorStop(0.4, `rgba(255,120,30,${a * 0.8})`); g.addColorStop(1, 'rgba(120,20,0,0)'); }
        else { g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.3, p.col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = a; }
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (p.type === 'aura' ? 3 : 1), 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; break;
      }
      case 'horn': { // 세 갈래 뿔 모양 빛줄기
        const prog = 1 - a, len = 60 + 140 * Math.min(1, prog * 2); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        for (const ang of [-0.4, 0, 0.4]) {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang + (p.dir < 0 ? Math.PI : 0));
          const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, '#fff6d0'); g.addColorStop(1, 'rgba(255,170,60,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(len, 0); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over'; break;
      }
      case 'bite': { // 위아래 이빨이 콱 다무는 모양
        const prog = 1 - a, off = 46 * Math.max(0, 1 - prog * 2.5); ctx.globalAlpha = Math.min(1, a * 2);
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1.4, 1.4); ctx.translate(-p.x, -p.y);
        for (const d of [-1, 1]) {
          const y = p.y + d * off; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#b02a1a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(p.x - 70, y + d * 6); ctx.quadraticCurveTo(p.x, y - d * 22, p.x + 70, y + d * 6); ctx.stroke();
          for (let i = 0; i < 7; i++) { const tx = p.x - 54 + i * 18, ty = y - d * (14 - Math.abs(i - 3) * 3); ctx.beginPath(); ctx.moveTo(tx - 6, ty); ctx.lineTo(tx, ty + d * 16); ctx.lineTo(tx + 6, ty); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        }
        ctx.restore(); break;
      }
      case 'pillar': { // 하늘까지 솟는 빛기둥
        const w = 200 * (0.4 + 0.6 * a); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(p.x - w / 2, 0, p.x + w / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, hexA(p.col, 0.55 * a)); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(p.x - w / 2, -100, w, GROUND + 100);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`; ctx.fillRect(p.x - w * 0.08, -100, w * 0.16, GROUND + 100); ctx.globalCompositeOperation = 'source-over'; break;
      }
      case 'streak': ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.sign(p.vx) * p.len, p.y); ctx.stroke(); break;
    }
  }
  ctx.globalAlpha = 1;
  for (const t of texts) { ctx.globalAlpha = Math.min(1, t.life / 15); txt(t.s, t.x, t.y, t.size, t.col, 'center', '#000', 6); }
  ctx.globalAlpha = 1;
}

// ===== 투사체 (안킬로 지진파, 스피노 물기둥) =====
function spawnProj(f, opp, m) {
  if (m.proj === 'laser') { // 스테고 레이저: 골판에서 화면 끝까지 뻗는 광선 (웅크리면 피함)
    projs.push({ kind: 'laser', owner: f, x0: f.x + f.facing * f.def.len * 0.2, y: f.y - f.def.h * 0.85, dir: f.facing, age: 0, life: 22, m, hit: false });
    shake = Math.max(shake, 7); f.kb = -f.facing * 5; Sound.sfx(1400, 0.4, 'sawtooth', 0.08, 0.3); Sound.sfx(700, 0.4, 'square', 0.05, 0.5);
  } else if (m.proj === 'tornado') { // 워터 토네이도: 천천히 다가가며 여러 번 휘감음
    projs.push({ kind: 'tornado', owner: f, x: f.x + f.facing * 170, vx: f.facing * 5, age: 0, life: 120, m, hit: false, maxHits: 4, n: 0, cd: 0 });
    Sound.splash(); drops(f.x + f.facing * 170, GROUND, 20);
  } else if (m.proj === 'clones') { // 쉐도우 분신술: 그림자 분신 2마리가 차례로 돌진
    for (let i = 0; i < 2; i++) projs.push({ kind: 'clone', owner: f, x: f.x, vx: f.facing * 17, dir: f.facing, age: -i * 9, life: 48, m, hit: false, last: i === 1 });
    Sound.whoosh(); particles.push({ type: 'ring', x: f.x, y: f.y - f.def.h * 0.5, r: 20, life: 16, max: 16, grow: 10, col: '#b197fc' });
  } else if (m.proj === 'feather') { // 독깃털 3개를 부채꼴로
    for (const ang of [-0.13, 0, 0.13]) projs.push({ kind: 'feather', owner: f, x: f.x + f.facing * f.def.len * 0.35, y: f.y - f.def.h * 0.62, vx: f.facing * 14, vy: ang * 14, dir: f.facing, age: 0, life: 70, m, hit: false });
    Sound.whoosh();
  } else if (m.proj === 'string') { // 미스터리 스트링: 줄을 쏘아 잡기
    projs.push({ kind: 'string', owner: f, len: 0, dir: f.facing, y: f.y - f.def.h * 0.55, age: 0, life: 40, m, hit: false });
    Sound.sfx(900, 0.25, 'triangle', 0.08, 0.4);
  } else if (m.proj === 'stomp') { // 쿵! 땅을 타고 달려가는 작은 충격파
    projs.push({ kind: 'quake', small: true, owner: f, x0: f.x + f.facing * 110, x: f.x + f.facing * 110, vx: f.facing * 12, age: 0, life: 50, m, hit: false });
    shake = Math.max(shake, 7); rocks(f.x + f.facing * 110, GROUND, 6); dust(f.x + f.facing * 90, GROUND, 6); Sound.boom(0.4, 0.3);
    particles.push({ type: 'ring', x: f.x + f.facing * 100, y: GROUND, r: 12, life: 14, max: 14, grow: 9, col: '#e8d9b0' });
  } else if (m.proj === 'sonic') {
    projs.push({ kind: 'sonic', owner: f, x: f.x + f.facing * f.def.len * 0.42, y: f.y - f.def.h * 0.78, vx: f.facing * 12, dir: f.facing, age: 0, life: 80, m, hit: false });
    Sound.roar(); Sound.boom(0.3, 0.25); shake = Math.max(shake, 8); f.kb = -f.facing * 7;
    for (const [r, g] of [[15, 8], [30, 12]]) particles.push({ type: 'ring', x: f.x + f.facing * f.def.len * 0.4, y: f.y - f.def.h * 0.78, r, life: 16, max: 16, grow: g, col: '#bff3ff' });
    burst(f.x + f.facing * f.def.len * 0.42, f.y - f.def.h * 0.78, false, '#e6fbff'); dust(f.x - f.facing * 40, GROUND, 6);
  } else if (m.proj === 'quake') {
    projs.push({ kind: 'quake', owner: f, x0: f.x + f.facing * 120, x: f.x + f.facing * 120, vx: f.facing * 11, age: 0, life: 80, m, hit: false });
    shake = 14; Sound.boom(0.6, 0.6); rocks(f.x + f.facing * 120, GROUND, 14);
  } else {
    const sx = f.x + f.facing * 200, ex = clamp(opp.x + f.facing * 20, XMIN, XMAX);
    for (let i = 0; i < 3; i++) projs.push({ kind: 'geyser', owner: f, x: lerp(sx, ex, i / 2), age: -i * 12, life: 40, m: { ...m, dmg: m.dmg / 3, air: true }, hit: false, last: i === 2 });
  }
}
function updProjs() {
  for (const p of projs) {
    p.age++; if (p.age < 0) continue;
    const tgt = p.owner === P1 ? P2 : P1;
    let box;
    if (p.cd > 0) p.cd--;
    if (p.kind === 'laser') {
      box = p.age >= 2 && p.age <= 16 ? { x1: Math.min(p.x0, p.dir > 0 ? W : 0), x2: Math.max(p.x0, p.dir > 0 ? W : 0), y1: p.y - 26, y2: p.y + 26 } : null;
    } else if (p.kind === 'tornado') {
      p.x += p.vx; if (p.x < 60 || p.x > W - 60) p.vx = 0; if (p.age % 3 === 0) drops(p.x, GROUND - R() * 260, 2);
      box = p.age < p.life - 10 ? { x1: p.x - 70, x2: p.x + 70, y1: GROUND - 300, y2: GROUND + 5 } : null;
    } else if (p.kind === 'clone') {
      p.x += p.vx; const d = p.owner.def; if (p.age % 3 === 0) dust(p.x - p.dir * 40, GROUND, 1);
      box = { x1: p.x - d.bw / 2, x2: p.x + d.bw / 2, y1: GROUND - d.h, y2: GROUND };
    } else if (p.kind === 'feather') {
      p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.age = p.life;
      box = { x1: p.x - 22, x2: p.x + 22, y1: p.y - 18, y2: p.y + 18 };
    } else if (p.kind === 'string') {
      const o = p.owner; p.len = Math.min(640, p.len + 30); const tx = o.x + p.dir * (o.def.len * 0.35 + p.len); p.tx = tx; p.y = o.y - o.def.h * 0.55;
      if (p.len >= 640) p.age = p.life;
      const hu = tgt.hurtbox();
      if (!p.hit && tgt.state !== 'ko' && !tgt.grab && tx > hu.x1 && tx < hu.x2 && p.y > hu.y1 - 30 && p.y < hu.y2 + 30) {
        p.hit = true; p.age = p.life;
        if (tgt.inv) popText('회피!', tgt.x, tgt.y - tgt.def.h - 30, '#9ad8ff');
        else if (tgt.shielding) shieldBlock(o, tgt, tx, p.y);
        else { tgt.grab = { by: o, t: 0, m: p.m }; tgt.setState('hit'); popText('잡았다!', tgt.x, tgt.y - tgt.def.h - 40, '#d0a8ff', 38); Sound.sfx(500, 0.2, 'square', 0.08, 1.6); }
      }
      box = null;
    } else if (p.kind === 'sonic') {
      p.x += p.vx; if (p.x < 0 || p.x > W) p.age = p.life;
      box = { x1: p.x - 45, x2: p.x + 45, y1: p.y - 65, y2: p.y + 65 };
    } else if (p.kind === 'quake') {
      p.x += p.vx; if (p.age % 3 === 0) { rocks(p.x, GROUND, 2); dust(p.x, GROUND, 1); }
      if (p.x < 40 || p.x > W - 40) p.age = p.life;
      box = { x1: p.x - 45, x2: p.x + 45, y1: GROUND - 90, y2: GROUND + 5 };
    } else {
      if (p.age === 1) { Sound.splash(); drops(p.x, GROUND, 18); }
      if (p.age % 2 === 0 && p.age < 32) drops(p.x, GROUND - geyserH(p), 3);
      box = p.age >= 6 && p.age <= 30 ? { x1: p.x - 50, x2: p.x + 50, y1: GROUND - 320, y2: GROUND + 5 } : null;
    }
    if (box && !p.hit && !(p.cd > 0) && tgt.state !== 'ko' && !tgt.grab) {
      const hu = tgt.hurtbox();
      if (box.x1 < hu.x2 && box.x2 > hu.x1 && box.y1 < hu.y2 && box.y2 > hu.y1) {
        p.hit = true; if (p.maxHits) { p.n++; p.hit = p.n >= p.maxHits; p.cd = 14; p.last = p.hit; } // 토네이도는 여러 번
        if (tgt.inv || (!p.m.air && !tgt.grounded)) popText('회피!', tgt.x, tgt.y - tgt.def.h - 30, '#9ad8ff');
        else applyHit(p.owner, tgt, p.m, p.kind === 'feather' || p.kind === 'laser' ? clamp(p.x || tgt.x, hu.x1, hu.x2) : tgt.x, p.kind === 'feather' || p.kind === 'laser' ? p.y : GROUND - 80, p.kind === 'quake' || p.last || (!p.maxHits && p.kind !== 'clone'));
      }
    }
  }
  projs = projs.filter(p => p.age < p.life);
}
const geyserH = p => p.age < 8 ? p.age / 8 * 300 : p.age > 28 ? Math.max(0, (40 - p.age) / 12) * 300 : 300 + Math.sin(p.age) * 10;
function drawProjs() {
  for (const p of projs) {
    if (p.age < 0) continue;
    if (p.kind === 'laser') { // 굵은 분홍 광선 + 흰 심지
      const k = p.age < 3 ? p.age / 3 : p.age > 14 ? Math.max(0, (22 - p.age) / 8) : 1, x2 = p.dir > 0 ? W : 0, w = (30 + Math.sin(p.age * 1.7) * 6) * k;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,93,143,${0.45 * k})`; ctx.fillRect(Math.min(p.x0, x2), p.y - w, Math.abs(x2 - p.x0), w * 2);
      ctx.fillStyle = `rgba(255,220,235,${0.9 * k})`; ctx.fillRect(Math.min(p.x0, x2), p.y - w * 0.35, Math.abs(x2 - p.x0), w * 0.7);
      const g = ctx.createRadialGradient(p.x0, p.y, 0, p.x0, p.y, 70); g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,93,143,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x0, p.y, 70, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      continue;
    }
    if (p.kind === 'tornado') { // 빙글빙글 도는 물 회오리
      const fade = Math.min(1, (p.life - p.age) / 12, p.age / 8);
      for (let i = 0; i < 12; i++) {
        const y = GROUND - i * 26, rx = 22 + i * 8, ph = p.age * 0.35 + i * 0.6, ox = Math.sin(ph) * 8;
        ctx.strokeStyle = `rgba(170,225,255,${0.75 * fade})`; ctx.lineWidth = 4; ctx.fillStyle = `rgba(70,140,220,${0.18 * fade})`;
        ctx.beginPath(); ctx.ellipse(p.x + ox, y, rx, 9, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * fade})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x + ox, y, rx, 9, 0, ph % 6.28, ph % 6.28 + 1.4); ctx.stroke();
      }
      continue;
    }
    if (p.kind === 'clone') { // 반투명 보라 그림자 분신
      const o = p.owner, pp = basePose(frame + p.age * 3); pp.stride = 30; pp.walk = p.age * 0.5; pp.lean = 0.15; pp.hr = 0.25;
      ctx.globalAlpha = 0.5 * Math.min(1, (p.life - p.age) / 10); drawBody(o, p.x, GROUND, p.dir, false, pp, 'atk', 0);
      ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'lighter'; drawBody(o, p.x - p.dir * 30, GROUND, p.dir, false, pp, 'atk', 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; continue;
    }
    if (p.kind === 'feather') { // 보라·초록 독깃털
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
      const g = ctx.createLinearGradient(-24, 0, 24, 0); g.addColorStop(0, 'rgba(120,230,90,.2)'); g.addColorStop(0.5, '#9b5de5'); g.addColorStop(1, '#8ce99a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(0, -9, -22, 0); ctx.quadraticCurveTo(0, 9, 24, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,60,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(24, 0); ctx.stroke(); ctx.restore(); continue;
    }
    if (p.kind === 'string') { // 반짝이는 보라 줄 + 끝의 갈고리
      const o = p.owner, hx = o.x + p.dir * o.def.len * 0.35;
      ctx.strokeStyle = 'rgba(208,168,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, p.y);
      for (let i = 1; i <= 10; i++) { const x = lerp(hx, p.tx, i / 10); ctx.lineTo(x, p.y + Math.sin(i * 1.3 + p.age) * 5); } ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.tx, p.y, 8, 0, 7); ctx.fill(); continue;
    }
    if (p.kind === 'sonic') { // 음파: ))) 모양 고리가 커지며 날아감
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const x = p.x - p.dir * i * 26, r = 34 + i * 10 + Math.sin(p.age * 0.5 + i) * 4, a = 0.9 - i * 0.2;
        ctx.strokeStyle = `rgba(190,245,255,${a})`; ctx.lineWidth = 9 - i * 1.5;
        ctx.beginPath(); ctx.arc(x - p.dir * r * 0.6, p.y, r, p.dir > 0 ? -0.9 : Math.PI - 0.9, p.dir > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 3; ctx.stroke();
      }
      continue;
    }
    if (p.kind === 'quake') {
      ctx.strokeStyle = 'rgba(30,20,10,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x0, GROUND + 4);
      for (let x = p.x0; Math.abs(x - p.x) > 10; x += Math.sign(p.vx) * 18) ctx.lineTo(x, GROUND + 4 + Math.sin(x * 0.3) * 4);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const x = p.x - Math.sign(p.vx) * i * 22, h = (70 - i * 14) * (0.8 + 0.2 * Math.sin(p.age * 0.8 + i)) * (p.small ? 0.6 : 1);
        ctx.beginPath(); ctx.moveTo(x - 18, GROUND + 6); ctx.lineTo(x - 4, GROUND - h); ctx.lineTo(x + 6, GROUND - h * 0.7); ctx.lineTo(x + 18, GROUND + 6); ctx.closePath();
        const g = ctx.createLinearGradient(0, GROUND - h, 0, GROUND); g.addColorStop(0, '#b8a07a'); g.addColorStop(1, '#4a3a24');
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#21180c'; ctx.lineWidth = 2; ctx.stroke();
      }
    } else {
      const h = geyserH(p), w = 70 + Math.sin(p.age * 0.7) * 6;
      const g = ctx.createLinearGradient(p.x - w / 2, 0, p.x + w / 2, 0);
      g.addColorStop(0, 'rgba(40,120,200,.55)'); g.addColorStop(0.5, 'rgba(220,245,255,.9)'); g.addColorStop(1, 'rgba(40,120,200,.55)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x - w / 2 - 10, GROUND + 5); ctx.quadraticCurveTo(p.x - w / 2, GROUND - h * 0.5, p.x - w * 0.3, GROUND - h);
      ctx.lineTo(p.x + w * 0.3, GROUND - h); ctx.quadraticCurveTo(p.x + w / 2, GROUND - h * 0.5, p.x + w / 2 + 10, GROUND + 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(p.x - 30 + i * 15, GROUND - h + Math.sin(p.age + i) * 6, 14, 0, 7); ctx.fill(); }
    }
  }
}

// ===== 경기장 위험 요소: 용암=화산탄, 운석=운석 파편 (떨어질 자리에 경고 표시가 먼저 나옴) =====
const HZ_WARN = 75, HZ_R = 95;
const finale = () => stage === 'meteor' && timer < 600;
function updHazards() {
  if (stage !== 'lava' && stage !== 'meteor') return;
  if (finale() && !finaleShown) { finaleShown = true; popText('운석이 쏟아진다!', W / 2, 220, '#ff6b6b', 52); Sound.roar(); }
  if (--hazardT <= 0) {
    hazardT = finale() ? 55 + Math.floor(R() * 45) : 200 + Math.floor(R() * 160);
    const near = R() < 0.65 ? (R() < 0.5 ? P1 : P2).x + (R() - 0.5) * 220 : XMIN + R() * (XMAX - XMIN), x = clamp(near, XMIN, XMAX);
    hazards.push({ x, t: 0, sx: stage === 'lava' ? x + (R() < 0.5 ? -1 : 1) * (150 + R() * 200) : x - 420 - R() * 200, sy: -90, kind: stage });
  }
  for (const h of hazards) {
    h.t++;
    if (h.t < HZ_WARN) { const [hx, hy] = hazardPos(h); fire(hx, hy, h.kind === 'meteor' ? 2 : 1); }
    if (h.t === HZ_WARN) {
      shake = Math.max(shake, 12); Sound.boom(0.55, 0.45); rocks(h.x, GROUND, 12); fire(h.x, GROUND - 20, 14); dust(h.x, GROUND, 10);
      particles.push({ type: 'ring', x: h.x, y: GROUND - 10, r: 20, life: 18, max: 18, grow: 9, col: '#ffb347' });
      for (const f of [P1, P2]) if (Math.abs(f.x - h.x) < HZ_R && f.y > GROUND - 220) hazardHit(f, h.x);
    }
  }
  hazards = hazards.filter(h => h.t < HZ_WARN + 5);
}
function hazardPos(h) { const p = Math.min(1, h.t / HZ_WARN); return [lerp(h.sx, h.x, p), lerp(h.sy, GROUND - 25, p * p)]; }
function hazardHit(f, x) {
  if (f.state === 'ko') return;
  if (f.shielding) { f.shieldFlash = 10; popText('방어!', f.x, f.y - f.def.h - 30, '#9ad8ff', 34); burst(f.x, f.y - f.def.h * 0.6, false, '#bfe9ff'); return; }
  if (f.inv) { popText('회피!', f.x, f.y - f.def.h - 30, '#9ad8ff'); return; }
  const guard = f.guarding && f.onGround, d = guard ? 8 : 35;
  f.hp = Math.max(1, f.hp - d); // 위험 요소로는 쓰러지지 않음
  if (!guard) { f.setState('hit'); f.kb = (f.x < x ? -1 : 1) * 10; f.vy = -6; f.y -= 1; f.flash = 8; }
  popText(String(d), f.x, f.y - f.def.h - 20, '#ff922b', 30); Sound.sfx(150, 0.18, 'square', 0.18, 0.4);
}
function drawHazards(front) {
  for (const h of hazards) {
    const p = Math.min(1, h.t / HZ_WARN);
    if (!front) {
      const pul = 0.5 + 0.5 * Math.sin(h.t * 0.5);
      ctx.fillStyle = `rgba(255,60,30,${0.12 + 0.18 * p})`; ctx.beginPath(); ctx.ellipse(h.x, GROUND + 4, HZ_R * (0.5 + 0.5 * p), 16, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,90,40,${0.5 + 0.5 * pul})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(h.x, GROUND + 4, HZ_R, 18, 0, 0, 7); ctx.stroke();
      if (h.t < HZ_WARN) txt('!', h.x, GROUND - 30 - pul * 8, 46, '#ff4d2e', 'center', '#000', 6);
    } else if (h.t < HZ_WARN) {
      const [x, y] = hazardPos(h), r = h.kind === 'meteor' ? 24 : 18;
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
      if (h.kind === 'meteor') { g.addColorStop(0, '#fff6c0'); g.addColorStop(0.4, '#ff9a2a'); g.addColorStop(1, '#5a1a08'); }
      else { g.addColorStop(0, '#ffe08a'); g.addColorStop(0.35, '#ff6a1a'); g.addColorStop(1, '#2a1208'); }
      ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 3); gg.addColorStop(0, 'rgba(255,150,50,.6)'); gg.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(40,15,5,.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  if (front && finale()) { ctx.fillStyle = `rgba(255,40,0,${0.08 + 0.05 * Math.sin(frame * 0.2)})`; ctx.fillRect(-100, -100, W + 200, H + 200); }
}

// ===== 파이터 =====
class Fighter {
  constructor(def, isCPU, diff) { Object.assign(this, { def, isCPU, diff, wins: 0, sp: 0, walkPh: 0 }); }
  reset(x, facing) {
    Object.assign(this, { grab: null, dizzy: 0, poison: 0, x, y: GROUND, vx: 0, vy: 0, kb: 0, facing, hp: this.def.hp, dispHp: this.def.hp, state: 'idle', st: 0, move: null, flash: 0, guarding: false, crouch: false, trail: [], target: x });
    this.setState('idle');
  }
  get grounded() { return this.y >= GROUND - 40; }
  get onGround() { return this.y >= GROUND; }
  get shielding() { const m = this.move; return this.state === 'atk' && m.kind === 'shield' && this.st > m.startup && this.st <= m.startup + m.active; }
  get inv() { return (this.state === 'dash' && this.st <= 13) || (this.state === 'special' && (this.st <= this.move.startup || this.y < GROUND - 300)); }
  setState(s, move) { this.state = s; this.st = 0; this.move = move || null; this.hitCount = 0; this.lastHit = -99; this.dodgeShown = false; }
  update(inp, opp) {
    this.st++; if (this.flash > 0) this.flash--; if (this.shieldFlash > 0) this.shieldFlash--;
    if (this.dizzy > 0) { this.dizzy--; if (this.state !== 'hit') this.dizzy = 0; }
    if (this.poison > 0 && this.state !== 'ko') { // 독: 1초마다 6씩 (독으로는 쓰러지지 않음)
      this.poison--; if (this.poison % 30 === 0) { this.hp = Math.max(1, this.hp - 6); popText('6', this.x, this.y - this.def.h - 10, '#8ce99a', 24); }
      if (frame % 6 === 0) particles.push({ type: 'aura', x: this.x + (R() - 0.5) * this.def.len * 0.5, y: this.y - R() * this.def.h, vx: 0, vy: -1.5, life: 24, max: 24, r: 3, col: 'rgba(120,230,90,.9)' });
    }
    if (this.grab) { this.updGrab(); return; }
    const back = this.facing > 0 ? inp.left : inp.right, fwd = this.facing > 0 ? inp.right : inp.left, backTap = this.facing > 0 ? inp.leftP : inp.rightP;
    this.guarding = false; this.crouch = false;
    switch (this.state) {
      case 'ko': this.vx *= 0.9; break;
      case 'hit': this.vx = 0; if (this.st > 18 && this.onGround && !(this.dizzy > 0)) this.setState('idle'); break;
      case 'dash': { const k = 1 - this.st / 18; this.vx = this.dashDir * 19 * Math.max(0.15, k); if (this.st % 2 === 0) { dust(this.x - this.dashDir * 50, GROUND, 2); streak(this.x - this.dashDir * 90, this.y - 20 - R() * this.def.h * 0.8, this.dashDir, 'rgba(255,255,255,.75)'); } if (this.st >= 18) this.setState('idle'); break; }
      case 'atk': case 'special': this.updMove(opp); break;
      default: this.updFree(inp, back, fwd, backTap);
    }
    if (!this.onGround || this.vy < 0) {
      this.vy += this.def.grav; this.y += this.vy;
      if (this.y >= GROUND) { this.y = GROUND; this.vy = 0; this.land(); }
    }
    this.x = clamp(this.x + this.vx + this.kb, XMIN, XMAX); this.kb *= 0.85; if (Math.abs(this.kb) < 0.1) this.kb = 0;
    if (['idle', 'walk', 'crouch', 'jump'].includes(this.state)) this.facing = opp.x > this.x ? 1 : -1;
    if (this.state === 'walk') this.walkPh += 0.2 * (this.vx * this.facing >= 0 ? 1 : -1);
    if (this.state === 'dash') this.walkPh += 0.45;
    if (this.state === 'walk' && this.onGround && frame % 12 === 0) dust(this.x - this.facing * 30, GROUND, 1); // 걸을 때 발밑 흙먼지
    if (this.state === 'special' && this.st > this.move.startup) { this.walkPh += 0.4; aura(this); }
    const ghost = (this.state === 'special' && this.st > this.move.startup) || this.state === 'dash' || (this.state === 'jump' && this.airJumped) || (this.state === 'atk' && !this.move.special && this.striking());
    if (ghost && frame % 3 === 0) { this.trail.push({ x: this.x, y: this.y, facing: this.facing, p: poseOf(this) }); if (this.trail.length > 4) this.trail.shift(); }
    else if (!ghost && this.trail.length && frame % 3 === 0) this.trail.shift();
    if (this.dispHp < this.hp) this.dispHp = this.hp; else this.dispHp += (this.hp - this.dispHp) * 0.05;
  }
  // 미스터리 스트링에 잡힘: 끌려가 들어 올려졌다가 쿵! 내리꽂힘
  updGrab() {
    const g = this.grab, by = g.by; g.t++; this.state = 'hit'; this.st = 1; this.vx = this.vy = this.kb = 0;
    const tx = by.x + by.facing * (by.def.len * 0.45 + this.def.len * 0.3);
    this.x = clamp(lerp(this.x, tx, 0.12), XMIN, XMAX); this.y = GROUND - Math.sin(Math.min(1, g.t / 36) * Math.PI) * 160;
    if (g.t >= 36) {
      this.grab = null; this.y = GROUND; const dmg = g.m.dmg * (by.isCPU ? DIFF[by.diff].dmg : 1);
      this.hp = Math.max(0, this.hp - dmg); this.setState('hit'); this.flash = 8; this.kb = -by.facing * 6; by.sp = Math.min(100, by.sp + 12);
      shake = 16; hitstop = 10; burst(this.x, GROUND - 40, true, '#d0a8ff'); dust(this.x, GROUND, 12); rocks(this.x, GROUND, 8); Sound.boom(0.6, 0.4);
      popText(String(Math.round(dmg)), this.x, GROUND - this.def.h - 20, '#fff', 36); popText('쿵!', this.x, GROUND - this.def.h - 70, '#d0a8ff', 54);
      if (this.hp <= 0) { this.setState('ko'); slow = 50; }
    }
  }
  updFree(inp, back, fwd, backTap) {
    if (!this.onGround) {
      if (inp.z || inp.x) { this.setState('atk', this.def.moves.j); Sound.whoosh(); return; }
      const dir = inp.right ? 1 : inp.left ? -1 : 0, max = Math.max(10.5, this.def.speed * 2.8); // 느린 공룡도 상대를 넘을 수 있게 최소 속도 보장
      if (inp.up && !this.airJumped) { // 2단 점프: 더 높이, 누른 방향(없으면 원래 방향)으로 → 상대를 넘어갈 수 있음
        this.airJumped = true; this.vy = -Math.max(14, this.def.jump * 0.95); this.vx = (dir || Math.sign(this.vx)) * max;
        Sound.whoosh(); Sound.sfx(600, 0.12, 'triangle', 0.08, 1.8);
        particles.push({ type: 'ring', x: this.x, y: this.y - 20, r: 15, life: 16, max: 16, grow: 7, col: '#ffffff' });
      } else if (dir) this.vx = clamp(this.vx + dir * 0.3, -max, max);
      return;
    }
    if (inp.c && this.sp < 100 && !this.isCPU && frame - (this.spWarn || -99) > 30) { this.spWarn = frame; popText('게이지가 아직 부족해요', this.x, this.y - this.def.h - 40, '#9ad8ff', 24); Sound.sfx(220, 0.1, 'triangle', 0.06); }
    if (inp.c && this.sp >= 100) { this.sp = 0; this.setState('special', this.def.moves.c); startCutin(this); return; }
    if (inp.z || inp.x) { this.setState('atk', this.def.moves[inp.down ? (inp.z ? 'dz' : 'dx') : (inp.z ? 'z' : 'x')]); if (this.move.heavy) Sound.sfx(110, 0.35, 'sawtooth', 0.1, 0.6); Sound.whoosh(); return; }
    // 같은 방향을 빠르게 두 번 누르면 대시 (그 방향으로 쌩 이동, 잠깐 무적)
    const tapDir = inp.dash || (inp.leftP ? -1 : inp.rightP ? 1 : 0);
    if (tapDir) {
      if (inp.dash || (this.lastTapDir === tapDir && frame - this.lastTap < 16)) { this.dashDir = tapDir; this.setState('dash'); this.lastTap = -99; Sound.whoosh(); Sound.sfx(420, 0.14, 'triangle', 0.08, 2.2); dust(this.x, GROUND, 6); return; }
      this.lastTap = frame; this.lastTapDir = tapDir;
    }
    if (inp.up) { this.vy = -this.def.jump; this.y -= 1; this.vx = (inp.right ? 1 : inp.left ? -1 : 0) * this.def.speed * 2.2; this.airJumped = false; this.setState('jump'); }
    else if (inp.down) { this.crouch = true; this.vx = 0; this.state = 'crouch'; this.guarding = back; }
    else if (back) { this.guarding = true; this.vx = -this.facing * this.def.speed * 0.6; this.state = 'walk'; }
    else if (fwd) { this.vx = this.facing * this.def.speed; this.state = 'walk'; }
    else { this.vx = 0; this.state = 'idle'; }
  }
  updMove(opp) {
    const m = this.move, s = this.st, a = m.startup, b = a + m.active, act = s > a && s <= b;
    if (this.state === 'atk') { if (m.lunge && act) this.vx = this.facing * m.lunge; else if (this.onGround) this.vx *= 0.7; if (m.proj && (m.stompAt ? m.stompAt.includes(s - a) : s === a)) spawnProj(this, opp, m);
      if (m.anim === 'tailsmash' && s === a + 1) { slashFx(this.x + this.facing * 150, this.y - 95, '#ffffff', this.facing < 0); Sound.sfx(180, 0.2, 'sawtooth', 0.08, 0.5); } }
    else switch (m.kind) {
      case 'dash': this.vx = act ? m.dash * this.facing : this.vx * 0.8; if (act && s % 2 === 0) { dust(this.x - this.facing * 80, GROUND, 2); streak(this.x - this.facing * 100, this.y - R() * this.def.h, this.facing); } break;
      case 'multi': this.vx = act ? (m.lunge || 0) * this.facing : 0; break;
      case 'proj': this.vx = 0; if (s === a) spawnProj(this, opp, m); break;
      case 'leap':
        if (s < m.rise) this.vx = 0;
        else if (s === m.rise) { this.target = clamp(opp.x, XMIN, XMAX); this.vy = -36; this.y -= 1; this.vx = 0; Sound.whoosh(); dust(this.x, GROUND, 8); }
        else if (s === a) {
          this.facing = this.target >= this.x ? 1 : -1;
          const sx = clamp(this.target - this.facing * m.from, XMIN, XMAX), g = this.def.grav, d = GROUND + 220, T = (-24 + Math.sqrt(576 + 2 * g * d)) / g;
          this.x = sx; this.y = -220; this.vy = 24; this.vx = (this.target - sx) / T;
        }
        if (s > a && !this.onGround) { if (m.fx === 'meteor') fire(this.x + this.facing * 40, this.y - this.def.h * 0.6, 3); else streak(this.x + (R() - 0.5) * 100, this.y - R() * this.def.h, this.facing); }
        break;
    }
    if (this.state === 'special' && s === 1) { particles.push({ type: 'pillar', x: this.x, life: 34, max: 34, col: this.def.aura }); for (let i = 0; i < 2; i++) particles.push({ type: 'ring', x: this.x, y: this.y - this.def.h * 0.5, r: 30 + i * 30, life: 22, max: 22, grow: 12, col: this.def.aura }); shake = Math.max(shake, 10); }
    if (this.state === 'special' && m.anim === 'hornattack' && s <= a && s % 5 === 0) { dust(this.x - this.facing * 70, GROUND, 3); if (s % 10 === 0) Sound.sfx(90, 0.12, 'sawtooth', 0.06, 0.7); }
    if (this.state === 'special' && m.fx === 'roar' && s === 2) { for (let i = 0; i < 3; i++) particles.push({ type: 'ring', x: this.x + this.facing * 200, y: this.y - 160, r: 20 + i * 30, life: 24, max: 24, grow: 12, col: this.def.aura }); Sound.roar(); }
    if (s >= b + m.recovery) this.setState(this.onGround ? 'idle' : 'jump');
  }
  land() {
    this.airJumped = false; this.landAt = frame;
    if (this.state === 'jump') { this.state = 'idle'; dust(this.x, GROUND, 5); }
    else if (this.state === 'atk' && this.move === this.def.moves.j) this.setState('idle');
    else if (this.state === 'special' && this.move.kind === 'leap' && this.st > this.move.startup) {
      this.st = this.move.startup + this.move.active; this.vx = 0; shake = 16; Sound.boom(0.7, 0.6);
      rocks(this.x, GROUND, 16); dust(this.x, GROUND, 14); burst(this.x, GROUND - 30, true, this.def.aura);
      if (this.move.fx === 'meteor') fire(this.x, GROUND - 30, 16);
    } else if (this.state !== 'ko') dust(this.x, GROUND, 3);
  }
  hurtbox() {
    const h = this.crouch ? this.def.h * 0.6 : this.def.h, lo = this.def.hurtLow || 0;
    return { x1: this.x - this.def.bw / 2, x2: this.x + this.def.bw / 2, y1: this.y - h, y2: this.y - lo };
  }
  hitbox() {
    const m = this.move, h = this.def.h, y = this.y;
    if (m.zone === 'body') return { x1: this.x - this.def.bw / 2 - 30, x2: this.x + this.def.bw / 2 + 30, y1: y - h - 10, y2: y + 10 };
    const a = this.x + this.facing * (m.reach - m.width), b = this.x + this.facing * m.reach;
    const z = { high: [y - h - 30, y - h * 0.55], mid: [y - h - 10, y - 25], low: [y - 75, y + 5], up: [y - h - 170, y - h * 0.4], air: [y - h - 10, y + 80] }[m.zone];
    return { x1: Math.min(a, b), x2: Math.max(a, b), y1: z[0], y2: z[1] };
  }
  striking() { const m = this.move; return (this.state === 'atk' || this.state === 'special') && m.kind !== 'proj' && m.kind !== 'shield' && !m.proj && this.st > m.startup && this.st <= m.startup + m.active; }
}

// ===== 맞히기 =====
function tryHit(a, d) {
  if (!a.striking() || d.state === 'ko') return;
  const m = a.move, hits = m.hits || 1;
  if (a.hitCount >= hits || a.st - a.lastHit < (m.interval || 0)) return;
  const hb = a.hitbox(), hu = d.hurtbox();
  if (!(hb.x1 < hu.x2 && hb.x2 > hu.x1 && hb.y1 < hu.y2 && hb.y2 > hu.y1)) return;
  if (d.inv || (!m.air && !d.grounded)) {
    if (!a.dodgeShown) { a.dodgeShown = true; popText('회피!', d.x, d.y - d.def.h - 30, '#9ad8ff'); Sound.sfx(900, 0.1, 'triangle', 0.1, 1.5); }
    return;
  }
  a.hitCount++; a.lastHit = a.st;
  applyHit(a, d, m, (Math.max(hb.x1, hu.x1) + Math.min(hb.x2, hu.x2)) / 2, (Math.max(hb.y1, hu.y1) + Math.min(hb.y2, hu.y2)) / 2, a.hitCount >= hits);
}
function shieldBlock(a, d, hx, hy) {
  const sx = d.x + d.facing * d.def.len * 0.36, sy = d.y - d.def.h * 0.58;
  burst(hx, hy, true, '#bfe9ff'); burst(sx, sy, false, d.def.aura);
  for (const [r, g] of [[20, 10], [40, 14]]) particles.push({ type: 'ring', x: sx, y: sy, r, life: 18, max: 18, grow: g, col: '#bfe9ff' });
  d.shieldFlash = 10; d.sp = Math.min(100, d.sp + 15); hitstop = 8; shake = 8;
  popText('방어!', d.x, d.y - d.def.h - 40, '#9ad8ff', 42); Sound.sfx(900, 0.15, 'square', 0.12, 0.6); Sound.boom(0.3, 0.2);
  if (Math.abs(a.x - d.x) < 520 && a.state !== 'ko') { a.setState('hit'); a.kb = (a.x < d.x ? -1 : 1) * 14; a.flash = 6; } // 가까이서 공격한 상대는 튕겨나가며 휘청
}
function applyHit(a, d, m, hx, hy, last) {
  if (d.shielding) { shieldBlock(a, d, hx, hy); return; }
  const dmg = m.dmg * (a.isCPU ? DIFF[a.diff].dmg : 1);
  if (d.guarding && d.onGround && d.state !== 'hit') {
    d.hp = Math.max(1, d.hp - dmg * (m.special ? 0.3 : 0.15)); d.kb = a.facing * m.kb * 0.5; d.sp = Math.min(100, d.sp + 4);
    burst(hx, hy, false, '#9ad8ff'); popText('막기!', d.x, d.y - d.def.h - 30, '#9ad8ff', 28); Sound.sfx(700, 0.08, 'triangle', 0.12); hitstop = 4;
  } else {
    d.hp = Math.max(0, d.hp - dmg); d.setState('hit'); d.kb = a.facing * m.kb; d.flash = 8;
    if (m.poison) { d.poison = m.poison; popText('독!', d.x + 40, d.y - d.def.h - 40, '#8ce99a', 26); }
    if (m.dizzy && !(d.dizzy > 0)) { d.dizzy = m.dizzy; popText('어질어질~', d.x, d.y - d.def.h - 60, '#ffe066', 30); }
    if (m.launch && last) { d.vy = -11; d.y -= 1; }
    d.sp = Math.min(100, d.sp + 7); if (!m.special) a.sp = Math.min(100, a.sp + 12);
    popText(String(Math.round(dmg)), hx, hy - 30, m.special ? '#ffd43b' : '#fff', m.special ? 44 : 32);
    Sound.sfx(150, 0.18, 'square', 0.2, 0.4); Sound.sfx(80, 0.25, 'sawtooth', 0.1, 0.5);
    if (m.special) {
      burst(hx, hy, true, a.def.aura); burst(hx, hy, true, '#ffffff');
      if (m.fx === 'slash') { slashFx(hx, hy, a.def.aura, a.hitCount % 2); slashFx(hx, hy, '#fff', a.hitCount % 2 === 0); }
      if (m.fx === 'slash' && last) for (const fl of [0.7, 2.4]) particles.push({ type: 'slash', x: hx, y: hy, r: 150, a: fl, life: 18, max: 18, col: '#d0a8ff' });
      if (m.fx === 'arrow') { for (let i = 0; i < 8; i++) streak(hx + a.facing * 40, hy + (R() - 0.5) * 120, -a.facing, 'rgba(200,240,255,.9)'); particles.push({ type: 'ring', x: hx, y: hy, r: 20, life: 18, max: 18, grow: 13, col: '#bff3ff' }); }
      if (m.fx === 'horn') particles.push({ type: 'horn', x: hx, y: hy, dir: a.facing, life: 20, max: 20 });
      if (m.fx === 'bite') particles.push({ type: 'bite', x: hx, y: hy, life: 18, max: 18 });
      if (m.fx === 'quake') rocks(hx, GROUND, 12); if (m.fx === 'water') drops(hx, hy, 20); if (m.fx === 'meteor') fire(hx, hy, 18);
      hitstop = last ? 14 : 5; shake = last ? 20 : 8;
      if (last) {
        flashT = 14; flashCol = a.def.aura; cam = { x: hx, y: hy, t: 30, z: 0.32 }; slow = Math.max(slow, 24); shake = 26; Sound.boom(0.8, 0.7); Sound.roar();
        for (let i = 0; i < 3; i++) particles.push({ type: 'ring', x: hx, y: hy, r: 20 + i * 25, life: 26, max: 26, grow: 14 + i * 4, col: i % 2 ? '#ffffff' : a.def.aura });
        burst(hx, hy, true, a.def.aura); burst(hx, hy, true, '#fff6c0'); rocks(hx, GROUND, 14); dust(hx, GROUND, 14);
        popText(m.name + '!', W / 2, 250, '#ffd43b', fitFont(m.name + '!', 66, 900)); popText('필살!', W / 2, 185, a.def.aura, 50);
      }
    } else {
      const claw = m.anim === 'claw' || m.anim === 'clawup' || m.anim === 'lowclaw';
      if (m.hitFx === 'water') drops(hx, hy, 18);
      if (m.heavy && (last || !(m.hits > 1))) { // 강한 공격: 큰 섬광 + 충격파 + 화면 확대 + 긴 멈춤 + "쾅!"
        burst(hx, hy, true, '#ffb347'); burst(hx, hy, true, '#ffffff'); dust(d.x, GROUND, 8);
        particles.push({ type: 'ring', x: hx, y: hy, r: 20, life: 20, max: 20, grow: 14, col: '#ff922b' });
        hitstop = 13; shake = 15; cam = { x: hx, y: hy, t: 12 }; Sound.boom(0.5, 0.35);
        popText('쾅!', hx, hy - 75, '#ff922b', 58); if (claw) slashFx(hx, hy, '#ffd43b', false);
      } else if (m.anim === 'tailsmash') { // 꼬리치기: 묵직한 타격 + 반동
        burst(hx, hy, true, '#ffd43b'); dust(d.x, GROUND, 6); particles.push({ type: 'ring', x: hx, y: hy, r: 14, life: 16, max: 16, grow: 11, col: '#ffffff' });
        hitstop = 9; shake = 10; a.kb = -a.facing * 6; popText(m.hitText || '스매싱!', hx, hy - 70, '#ffd43b', 42); Sound.boom(0.35, 0.25);
      } else { // 빠른 공격: 작은 불꽃 + 짧은 멈춤
        burst(hx, hy, false, '#fff2a8'); burst(hx, hy, false, '#ffffff'); particles.push({ type: 'ring', x: hx, y: hy, r: 10, life: 12, max: 12, grow: 8, col: '#ffffff' });
        hitstop = 6; shake = 6; popText('탁!', hx, hy - 60, '#fff2a8', 34);
        if (claw) slashFx(hx, hy, '#fff2a8', false);
      }
    }
  }
  if (d.hp <= 0) { d.setState('ko'); d.kb = a.facing * 16; d.vy = -8; d.y -= 1; slow = 50; cam = { x: hx, y: hy, t: 40 }; flashT = 8; }
}

// ===== CPU =====
class AI {
  constructor(f) { this.f = f; this.cd = 20; this.hold = 0; this.plan = null; this.walk = null; this.reacted = false; this.airAtk = false; }
  input(opp) {
    const f = this.f, d = DIFF[f.diff], inp = { left: false, right: false, leftP: false, rightP: false, up: false, down: false, z: false, x: false, c: false };
    const dx = opp.x - f.x, dist = Math.abs(dx), toward = dx > 0 ? 'right' : 'left', away = dx > 0 ? 'left' : 'right';
    if (this.airAtk && f.onGround && f.state !== 'jump') this.airAtk = false;
    if (this.airAtk) { if (dist < 360 && f.vy > -6) { inp.z = true; this.airAtk = false; } return inp; }
    if (this.hold > 0) { this.hold--; if (this.plan) inp[this.plan] = true; return inp; }
    const hz = hazards.find(h => h.t < HZ_WARN - 12 && Math.abs(h.x - f.x) < HZ_R + 20);
    if (hz && this.dodgedHz !== hz && R() < d.dodge + 0.25) { this.dodgedHz = hz; this.plan = hz.x > f.x ? 'left' : 'right'; this.hold = 24; inp[this.plan] = true; return inp; }
    if (hz) this.dodgedHz = hz;
    const threat = (opp.state === 'atk' || opp.state === 'special') && dist < 560;
    if (threat && !this.reacted) {
      this.reacted = true; const r = R();
      if (r < d.guard) { if (f.def.moves.x.kind === 'shield' && R() < 0.6) { inp.x = true; return inp; } this.plan = away; this.hold = 22; inp[away] = true; return inp; }
      if (r < d.guard + d.dodge) { if (R() < 0.5 && !opp.move.air) inp.up = true; else inp.dash = away === 'left' ? -1 : 1; return inp; }
    }
    if (!threat) this.reacted = false;
    if (--this.cd > 0) { if (this.walk) inp[this.walk === 't' ? toward : away] = true; return inp; }
    this.cd = d.react + Math.floor(R() * d.react); this.walk = null;
    const range = (f.def.moves.z.reach || 300) + opp.def.bw / 2 - 20;
    if (dist > range && f.def.moves.x.proj && R() < d.agg * 0.35) { inp.x = true; return inp; }
    if (f.sp >= 100 && dist < 700 && R() < d.agg) { inp.c = true; return inp; }
    if (!opp.grounded && dist < range + 40 && R() < d.agg) { inp.down = true; inp.x = true; return inp; }
    if (dist > range) { this.walk = 't'; inp[toward] = true; if (R() < 0.12 * d.agg) { inp.up = true; this.airAtk = true; } return inp; }
    const r = R();
    if (r < d.agg) { const k = ['z', 'z', 'x', 'dz', 'x'][Math.floor(R() * 5)]; if (k === 'dz') { inp.down = true; inp.z = true; } else inp[k] = true; this.cd = Math.ceil(d.react / 2); }
    else if (r < d.agg + 0.15) this.walk = 'a';
    return inp;
  }
}

// ===== 포즈 =====
function animPose(p, m, s, f) {
  const a = m.startup, b = a + m.active, k = s <= a ? -0.6 * s / a : s <= b ? 1 : Math.max(0, 1 - (s - b) / m.recovery);
  const wind = Math.min(1, s / a), rec = s > b ? Math.max(0, 1 - (s - b) / m.recovery) : 1, kp = Math.max(0, k);
  switch (m.anim) {
    case 'thrust': p.hx = k * 35; p.hr = k * 0.14; p.hy = kp * 6; p.lean = k * 0.05; break;
    case 'bite': p.jaw = s <= a ? wind : 0.15 * rec; p.hx = k * 45; p.hr = k * 0.15 - (s <= a ? 0.12 * wind : 0); break;
    case 'upbite': p.jaw = s <= a ? wind : 0.2 * rec; p.hr = -k * 0.5; p.hx = k * 15; p.lean = -kp * 0.15; break;
    case 'bigbite': p.jaw = s > b ? rec : 1; p.hx = 25 * kp; p.hr = s <= a ? -0.3 * wind : 0.08; p.arm = 0.5; break;
    case 'toss': p.hr = s <= a ? 0.3 * wind : -0.5 * k; p.hx = k * 20; p.lean = -kp * 0.12; break;
    case 'stomp': p.lean = s <= a ? -0.22 * wind : 0.06 * rec; break;
    case 'spin': p.spin = s <= a ? wind : rec; break;
    case 'whirl': p.spin = s <= a ? wind : s <= b ? 0.5 + 0.5 * Math.cos((s - a) * 0.35) : rec * 0.5; break;
    case 'slam': p.spin = s <= a ? wind : rec; p.lean = s <= a ? -0.15 * wind : 0.08 * rec; break;
    case 'claw': p.arm = k; p.hx = k * 8; p.lean = k * 0.04; break;
    case 'lowclaw': p.arm = k * 0.8; p.lean = kp * 0.18; p.hy = kp * 20; break;
    case 'clawup': p.arm = s <= a ? -0.4 * wind : 1.6 * k; p.lean = -kp * 0.12; p.hr = -k * 0.2; break;
    case 'flurry': p.arm = s <= a ? -0.5 * wind : s <= b ? Math.sin((s - a) * 0.9) * 1.1 + 0.3 : 0; p.lean = 0.05; break;
    case 'ram': p.hr = 0.25 * kp + (s <= a ? 0.2 * wind : 0); p.hx = k * 20; p.stride = s > a && s <= b ? 24 : 0; break;
    case 'dive': p.hr = 0.5 * Math.max(0.2, k); p.lean = 0.25 * kp; p.wing = -0.8; if (f.state === 'special' && f.vy < 0) { p.hr = -0.3; p.lean = -0.2; p.wing = 0.6; } break;
    case 'swoop': p.hr = 0.4 * kp; p.hy = kp * 30; p.lean = 0.15 * kp; p.wing = -0.5 * kp; break;
    case 'swooplow': p.hr = 0.6 * kp; p.hy = kp * 70; p.lean = 0.2 * kp; p.wing = -0.7 * kp; break;
    case 'wingup': p.wing = s <= a ? 0.6 * wind : -1.2 * k; p.hr = -0.3 * k; break;
    case 'charge': p.hr = s <= a ? 0.35 * wind : s <= b ? 0.35 : 0.35 * rec; p.hx = 15; p.stride = s > a && s <= b ? 30 : 0; break;
    case 'roar': p.jaw = s <= b ? Math.min(1, s / 8) : rec; p.hr = -0.3 * Math.min(1, s / 8) * rec; p.lean = -0.1 * rec; p.arm = 0.6; break;
    case 'roll': { p.custom = true; // 웅크림 → 공처럼 말려 굴러감 → 착지 출렁
      const T = m.active + m.recovery * 0.5, prog = clamp((s - a) / T, 0, 1);
      if (s <= a) { p.sy2 = 1 - 0.1 * wind; p.sx2 = 1 + 0.05 * wind; p.lunge = -10 * wind; }
      else if (prog < 1) { p.roll = prog * Math.PI * 2 * (m.turns || 2); p.stride = 0; }
      else { const t = (s - a - T) / (m.recovery * 0.5), w = Math.exp(-4 * t) * Math.cos(t * 13); p.sy2 = 1 - 0.08 * w; p.sx2 = 1 + 0.08 * w; p.lunge = 10 * w; }
      break;
    }
    case 'laser': { p.custom = true; // 골판에 힘 모으기 → 발사 반동
      if (s <= a) { p.lean = -0.1 * wind; p.sy2 = 1 + 0.05 * wind; p.lunge = -6 * wind + Math.sin(s * 1.6) * 2 * wind; }
      else { const t = (s - a) / (m.active + m.recovery), w = Math.exp(-5 * t) * Math.cos(t * 15); p.lunge = -26 * w; p.lean = -0.12 * w; p.sx2 = 1 - 0.07 * w; p.sy2 = 1 + 0.06 * w; }
      break;
    }
    case 'quakeslam': { p.custom = true; // 몸을 번쩍 들었다가 쿵! 내려찍고 출렁
      if (s <= a) { p.lean = -0.28 * wind; p.sy2 = 1 + 0.06 * wind; p.lunge = -8 * wind; }
      else if (s <= b) { p.lean = 0.1; p.sx2 = 1.1; p.sy2 = 0.88; p.lunge = 10; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.lean = 0.1 * w; p.sx2 = 1 + 0.1 * w; p.sy2 = 1 - 0.1 * w; p.lunge = 10 * w; }
      break;
    }
    case 'hammer': { p.custom = true; // 천천히 몸을 비틀어 힘 모으기 → 곤봉 꼬리로 두 번 빙글 강타
      if (s <= a) { p.spin = 0.35 * wind; p.lean = 0.1 * wind; p.sy2 = 1 - 0.07 * wind; p.lunge = -12 * wind; }
      else if (s <= b) { p.spin = 0.5 - 0.5 * Math.cos((s - a) * 0.48 + Math.PI * 0.7); p.lunge = 22; p.sx2 = 1.1; p.sy2 = 0.92; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.spin = 0; p.lunge = 22 * w; p.sx2 = 1 + 0.1 * w; p.sy2 = 1 - 0.08 * w; }
      break;
    }
    case 'waterbite': { p.custom = true; // 입을 크게 벌려 젖힘 → 콱 물고 좌우로 물어뜯기 → 출렁
      if (s <= a) { p.jaw = wind; p.hr = -0.25 * wind; p.lean = -0.1 * wind; p.lunge = -14 * wind; }
      else if (s <= b) { p.jaw = 0.1; p.hx = 30; p.lunge = 40; p.hr = Math.sin((s - a) * 1.6) * 0.14; p.sx2 = 1.1; p.sy2 = 0.94; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.jaw = 0.1 * rec; p.lunge = 40 * w; p.hx = 30 * rec; }
      break;
    }
    case 'speedturn': { p.custom = true; // 빙글빙글 빠르게 돌기
      if (s <= a) { p.lean = -0.08 * wind; p.sy2 = 1 - 0.06 * wind; }
      else if (s <= b) { p.spin = 0.5 - 0.5 * Math.cos((s - a) * 0.95); p.lunge = 14; p.hy = -Math.abs(Math.sin((s - a) * 0.95)) * 8; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.lunge = 14 * w; p.sx2 = 1 + 0.08 * w; p.sy2 = 1 - 0.06 * w; }
      break;
    }
    case 'clone': { p.custom = true; // 웅크렸다가 번쩍 (분신이 튀어나감)
      if (s <= a) { p.sy2 = 1 - 0.1 * wind; p.sx2 = 1 + 0.05 * wind; p.hr = 0.2 * wind; }
      else { const t = (s - a) / (m.active + m.recovery), w = Math.exp(-5 * t) * Math.cos(t * 14); p.lunge = -16 * w; p.sy2 = 1 + 0.08 * w; p.sx2 = 1 - 0.06 * w; }
      break;
    }
    case 'wingbeat': { p.custom = true; // 날개를 크게 들었다가 힘껏 내려침 → 반동
      if (s <= a) { p.wing = 0.9 * wind; p.lunge = -12 * wind; p.hr = -0.15 * wind; }
      else if (s <= b) { p.wing = -1.3; p.lunge = 26; p.hr = 0.15; p.sx2 = 1.08; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.wing = -1.3 * rec; p.lunge = 26 * w; }
      break;
    }
    case 'peck': { p.custom = true; // 부리로 콕콕콕
      if (s <= a) { p.hr = -0.25 * wind; p.lunge = -10 * wind; }
      else if (s <= b) { const q = Math.abs(Math.sin((s - a) * 0.63)); p.hx = 34 * q; p.hr = 0.3 * q; p.lunge = 10 + 12 * q; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.lunge = 10 * w; }
      break;
    }
    case 'arrow': { p.custom = true; // 날개를 접고 화살처럼 일직선
      if (s <= a) { p.wing = 0.8 * wind; p.lunge = -24 * wind; p.hr = -0.2 * wind; p.hy = -20 * wind; }
      else if (s <= b) { p.wing = -1.3; p.hr = 0.1; p.sx2 = 1.22; p.sy2 = 0.84; p.stride = 0; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.wing = -1.3 * rec; p.sx2 = 1 + 0.15 * w; p.sy2 = 1 - 0.1 * w; }
      break;
    }
    case 'throw': { p.custom = true; // 팔을 뒤로 → 휙 던지며 깃털 날리기 → 반동
      if (s <= a) { p.arm = -0.7 * wind; p.lean = -0.08 * wind; p.lunge = -8 * wind; }
      else { const t = (s - a) / (m.active + m.recovery), w = Math.exp(-5 * t) * Math.cos(t * 14); p.arm = 1.3 * Math.max(0, 1 - t * 1.5); p.lunge = 14 * w; p.lean = 0.1 * w; }
      break;
    }
    case 'stringcast': { p.custom = true; // 팔을 들어 줄을 휙 → 당기기
      if (s <= a) { p.arm = -0.5 * wind; p.lean = -0.1 * wind; }
      else { const t = (s - a) / (m.active + m.recovery); p.arm = t < 0.5 ? 1.2 : 1.2 - (t - 0.5) * 2.4; p.lean = t < 0.5 ? 0.06 : -0.08; p.lunge = t < 0.5 ? 10 : -10 * (1 - t); }
      break;
    }
    case 'stomp2': { p.custom = true; // 앞발 들기 → 쿵! → 다시 들기 → 쿵! → 출렁
      if (s <= a) { p.lean = -0.22 * wind; p.lunge = -8 * wind; p.sx2 = 1 - 0.03 * wind; p.sy2 = 1 + 0.05 * wind; p.hr = -0.1 * wind; }
      else if (s <= b) { const q = (s - a) % 12;
        if (q < 3) { const u = q / 3; p.lean = lerp(-0.22, 0.07, u); p.lunge = lerp(-8, 14, u); }
        else if (q < 6) { p.lean = 0.07; p.lunge = 14; p.sx2 = 1.08; p.sy2 = 0.9; }
        else { const u = (q - 6) / 6; p.lean = lerp(0.07, -0.2, u); p.lunge = lerp(14, -6, u); p.sy2 = 1 + 0.04 * u; } }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.lean = -0.12 * w; p.lunge = -6 * w; p.sy2 = 1 + 0.05 * w; }
      break;
    }
    case 'shield': { p.custom = true; const k2 = s <= a ? s / a : s <= b ? 1 : rec, fl = (f.shieldFlash || 0) / 10; // 머리를 숙여 프릴을 방패처럼, 막으면 뒤로 움찔
      p.hr = 0.38 * k2; p.hx = -10 * k2; p.lean = 0.06 * k2; p.sx2 = 1 - 0.04 * k2; p.sy2 = 1 + 0.03 * k2; p.lunge = -14 * fl; break;
    }
    case 'hornattack': { p.custom = true; // 발로 땅 긁으며 웅크림 → 폭발 돌진 → 출렁
      if (s <= a) { p.lean = -0.12 * wind; p.hr = 0.25 * wind; p.lunge = -16 * wind + Math.sin(s * 0.9) * 5; p.sx2 = 1 - 0.05 * wind; p.sy2 = 1 + 0.05 * wind; p.stride = 0; }
      else if (s <= b) { p.hr = 0.4; p.lean = 0.12; p.lunge = 40; p.sx2 = 1.15; p.sy2 = 0.9; p.stride = 34; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 13); p.lunge = 40 * w; p.hr = 0.4 * rec; p.sx2 = 1 + 0.1 * w; p.sy2 = 1 - 0.07 * w; }
      break;
    }
    case 'tailsmash': { p.custom = true; // 웅크려 힘 모으기 → 채찍처럼 휙 회전 → 반동으로 출렁
      if (s <= a) { p.lean = 0.14 * wind; p.sx2 = 1 + 0.06 * wind; p.sy2 = 1 - 0.08 * wind; p.lunge = -14 * wind; p.spin = 0.15 * wind; }
      else if (s <= b) { const q = (s - a) / m.active; p.spin = Math.min(1, 0.15 + q * 2.4); p.lunge = 32; p.sx2 = 1.14; p.sy2 = 0.9; p.lean = -0.1; p.tail = -14; }
      else { const t = (s - b) / m.recovery, w = Math.exp(-4 * t) * Math.cos(t * 14); p.spin = Math.max(0, 1 - t * 1.5); p.lunge = 32 * w; p.sx2 = 1 + 0.12 * w; p.sy2 = 1 - 0.09 * w; p.lean = -0.1 * w; }
      break;
    }
    case 'sonic': { p.custom = true; // 숨 들이쉬며 몸 젖히기 → 발사 순간 반동으로 뒤로 밀리며 출렁
      if (s <= a) { p.jaw = 0.6 * wind; p.hr = -0.35 * wind; p.lean = -0.15 * wind; p.lunge = -12 * wind; p.sx2 = 1 + 0.05 * wind; p.sy2 = 1 + 0.06 * wind; }
      else { const t = (s - a) / (m.active + m.recovery), e = Math.exp(-5 * t), w = e * Math.cos(t * 15);
        p.jaw = s <= b ? 1 : rec; p.hr = -0.3 * w; p.lean = -0.16 * w; p.lunge = -34 * w; p.sx2 = 1 - 0.09 * w; p.sy2 = 1 + 0.07 * w; }
      break;
    }
    case 'megabite': p.chomp = true; p.jaw = s <= a ? wind : s <= b ? 0.5 + 0.5 * Math.cos((s - a) * 0.7) : rec; p.hx = 25; p.hr = 0.08; break; // 콱콱 연속 물기
    case 'leap': if (s <= m.rise) p.lean = -0.1; else if (f.vy < 0) { p.lean = -0.3; p.hr = -0.2; } else { p.lean = 0.9; p.hr = 0.3; } break;
  }
  // 강한 공격: 몸을 뒤로 젖히며 웅크렸다가(힘 모으기) → 앞으로 크게 늘어나며 내지름 / 빠른 공격: 짧게 툭
  // 고무줄 탄성 (모든 기술 공통): 당기듯 웅크림 → 탁 놓으며 튀어나감 → 출렁출렁 제자리
  { const amp = (p.custom ? 0.6 : 1) * (m.special ? 1.3 : 1);
    if (s <= a) { const pull = wind * wind; p.elL = -16 * pull * amp; p.elX = 1 - 0.1 * pull * amp; p.elY = 1 + 0.1 * pull * amp; }
    else { const r = s - a, f2 = Math.exp(-r / 7) * Math.cos(r * 0.5); p.elL = 20 * f2 * amp; p.elX = 1 + 0.12 * f2 * amp; p.elY = 1 - 0.1 * f2 * amp; } }
  if (p.custom) { /* 기술 전용 동작이 있으면 공통 동작은 건너뜀 */ }
  else if (m.heavy) {
    if (s <= a) { p.lunge = -24 * wind; p.sx2 = 1 - 0.06 * wind; p.sy2 = 1 + 0.06 * wind; p.hr -= 0.08 * wind; }
    else if (s <= b) { p.lunge = 48; p.sx2 = 1.12; p.sy2 = 0.93; }
    else { p.lunge = 48 * rec; p.sx2 = 1 + 0.12 * rec; p.sy2 = 1 - 0.07 * rec; }
  } else if (!m.special && m !== f.def.moves.j) {
    if (s <= a) { p.lunge = -10 * wind; p.sx2 = 1 - 0.03 * wind; p.sy2 = 1 + 0.03 * wind; }
    else if (s <= b) { p.lunge = 28; p.sx2 = 1.06; p.sy2 = 0.97; }
    else { p.lunge = 28 * rec; p.sx2 = 1 + 0.06 * rec; p.sy2 = 1 - 0.03 * rec; }
  }
}
function poseOf(f) {
  const p = basePose(frame + (f === P2 ? 50 : 0)); p.walk = f.walkPh;
  if (f.state === 'walk') p.stride = 18;
  if (f.state === 'dash') { p.stride = 30; p.dash = f.dashDir * f.facing; p.lean = 0.14 * p.dash; } // 앞으로 대시면 앞으로 숙이고, 뒤로면 젖힘
  if (f.state === 'jump') { p.stride = 10; p.walk = 1.2; if (f.airJumped) { p.lean = 0.25; p.stride = 4; } }
  if (f.state === 'special' && f.st > f.move.startup) p.stride = 28;
  if (f.state === 'atk' || f.state === 'special') animPose(p, f.move, f.st, f);
  else if (f.state === 'hit') { p.hx = -15; p.hr = -0.2; p.lean = -0.06; const j = Math.exp(-f.st / 5) * Math.cos(f.st * 0.9); p.elX = 1 + 0.14 * j; p.elY = 1 - 0.14 * j; }
  else if (f.guarding && f.state !== 'crouch') { const o = f === P1 ? P2 : P1; if (o.state === 'atk' || o.state === 'special') { p.hx = -12; p.hr = 0.25; p.arm = -0.3; } }
  if ((scene === 'roundEnd' || scene === 'matchEnd') && f === roundWinner && f.state === 'idle') { p.jaw = 0.5 + 0.4 * Math.sin(frame * 0.08); p.hr = -0.15; p.arm = 0.3 * Math.sin(frame * 0.08); }
  const lr = frame - (f.landAt || -99);
  if (lr < 14 && f.state !== 'atk' && f.state !== 'special') { const j = Math.exp(-lr / 4) * Math.cos(lr * 0.9); p.elX = (p.elX || 1) * (1 + 0.12 * j); p.elY = (p.elY || 1) * (1 - 0.15 * j); }
  if (f.state === 'special') p.big = 1.12 + 0.03 * Math.sin(frame * 0.3);
  return p;
}
function drawBody(f, x, y, facing, crouch, p, state, st) {
  ctx.save(); ctx.translate(x, y);
  let sx = facing * SC; if (p.spin) { const c = Math.cos(p.spin * Math.PI); sx *= (c < 0 ? -1 : 1) * Math.max(0.12, Math.abs(c)); }
  if (p.lunge || p.elL) ctx.translate(facing * ((p.lunge || 0) + (p.elL || 0)) * SC, 0); // 회전(꼬리) 공격이어도 항상 상대 쪽으로 내지름
  ctx.scale(sx, SC * (crouch ? 0.84 : 1));
  if (p.sx2) ctx.scale(p.sx2, p.sy2);
  if (p.elX) ctx.scale(p.elX, p.elY);
  if (p.big) ctx.scale(p.big, p.big);
  if (state === 'ko') { const k = Math.min(1, st / 25); ctx.translate(0, k * 12); ctx.rotate(-0.16 * k); }
  if (p.lean) { const py = -f.def.h * 0.5; ctx.translate(0, py); ctx.rotate(p.lean); ctx.translate(0, -py); }
  if (p.roll) { const py = -f.def.h * 0.45; ctx.translate(0, py); ctx.rotate(p.roll); ctx.scale(0.82, 0.82); ctx.translate(0, -py); }
  drawDino(f.def, p, p.chomp ? p.jaw > 0.5 : (p.jaw > 0.5 || p.arm > 0.5 || state === 'special' || state === 'atk'));
  ctx.restore();
}
function drawFighter(f) {
  const hgt = Math.max(0, GROUND - f.y);
  ctx.fillStyle = `rgba(20,15,5,${0.35 * Math.max(0.2, 1 - hgt / 400)})`;
  ctx.beginPath(); ctx.ellipse(f.x, GROUND + 6, f.def.len * 0.36 * Math.max(0.3, 1 - hgt / 800), 14, 0, 0, 7); ctx.fill();
  if (f.state === 'special' && f.move.kind === 'leap' && f.st >= f.move.rise && f.y < GROUND - 50) {
    const pul = 0.5 + 0.5 * Math.sin(frame * 0.5);
    ctx.strokeStyle = `rgba(255,60,40,${0.5 + pul * 0.5})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(f.target, GROUND + 4, 90, 18, 0, 0, 7); ctx.stroke();
    txt('!', f.target, GROUND - 40 - pul * 10, 60, '#ff4d2e', 'center', '#000', 6);
  }
  ctx.globalCompositeOperation = 'lighter';
  f.trail.forEach((g, i) => { ctx.globalAlpha = 0.12 + i * 0.05; drawBody(f, g.x, g.y, g.facing, false, g.p, 'atk', 0); });
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (f.state === 'special') {
    const cx = f.x, cy = f.y - f.def.h * 0.5, r = f.def.len * (0.6 + 0.05 * Math.sin(frame * 0.4));
    ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r); g.addColorStop(0, hexA(f.def.aura, 0.5)); g.addColorStop(1, hexA(f.def.aura, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = hexA(f.def.aura, 0.6 + 0.3 * Math.sin(frame * 0.5)); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(f.x, GROUND + 4, f.def.len * 0.45, 20, 0, 0, 7); ctx.stroke();
  }
  if (f.flash > 0 && f.flash % 2 === 0) ctx.filter = 'brightness(2.2)';
  if (f.inv && f.state === 'dash') ctx.globalAlpha = 0.8;
  drawBody(f, f.x, f.y, f.facing, f.crouch, poseOf(f), f.state, f.st);
  ctx.filter = 'none'; ctx.globalAlpha = 1;
  // 스테고 레이저 충전: 골판을 따라 분홍 빛
  if (f.state === 'atk' && f.move.anim === 'laser' && f.st <= f.move.startup) {
    const k = f.st / f.move.startup; ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const px = f.x + f.facing * f.def.len * (-0.32 + i * 0.09), py = f.y - f.def.h * (0.95 + Math.sin(i / 6 * Math.PI) * 0.15), r = 16 + 18 * k;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(255,220,235,${0.8 * k})`); g.addColorStop(1, 'rgba(255,93,143,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  if (f.dizzy > 0) for (let i = 0; i < 3; i++) { const an = frame * 0.15 + i * 2.09; txt('★', f.x + Math.cos(an) * 34, f.y - f.def.h - 28 + Math.sin(an) * 9, 22, '#ffe066', 'center', 'rgba(0,0,0,.5)', 3); }
  if (f.grab) { const by = f.grab.by, hx = by.x + by.facing * by.def.len * 0.35, hy = by.y - by.def.h * 0.55; ctx.strokeStyle = 'rgba(208,168,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + f.x) / 2, Math.min(hy, f.y - f.def.h) - 40, f.x, f.y - f.def.h * 0.6); ctx.stroke(); }
  // 쉴드 프릴 방어: 앞쪽에 반원 보호막 (막는 순간 번쩍)
  if (f.state === 'atk' && f.move.kind === 'shield') {
    const m = f.move, s = f.st, a = m.startup, b = a + m.active, k = s <= a ? s / a : s <= b ? 1 : Math.max(0, 1 - (s - b) / m.recovery);
    const cx = f.x + f.facing * f.def.len * 0.36, cy = f.y - f.def.h * 0.58, R0 = 100 + 6 * Math.sin(frame * 0.3), fl = (f.shieldFlash || 0) / 10;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, R0 * 0.2, cx, cy, R0);
    g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(0.7, `rgba(120,200,255,${0.22 * k + 0.3 * fl})`); g.addColorStop(1, `rgba(220,245,255,${0.6 * k + 0.4 * fl})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, R0 * 0.55, R0, 0, f.facing > 0 ? -Math.PI / 2 : Math.PI / 2, f.facing > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.fill();
    ctx.strokeStyle = `rgba(210,245,255,${0.55 * k + 0.4 * fl})`; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { const y = cy + i * R0 * 0.26, half = R0 * 0.55 * Math.sqrt(Math.max(0, 1 - (i * 0.26) ** 2)); ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + f.facing * half, y); ctx.stroke(); }
    ctx.restore();
  }
  // 강한 공격 힘 모으기: 머리 앞에 주황 빛이 점점 커짐
  if (f.state === 'atk' && f.move.heavy && f.st <= f.move.startup) {
    const k = f.st / f.move.startup, gx = f.x + f.facing * f.def.len * 0.3, gy = f.y - f.def.h * 0.72, r = 25 + 55 * k;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(255,245,210,${0.7 * k})`); g.addColorStop(0.45, `rgba(255,150,40,${0.45 * k})`); g.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, r, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  }
}

// ===== 배경 (실사풍 숲, 한 번 그려서 저장) =====
function conifer(g, x, base, h) {
  const w = h * 0.3; g.beginPath(); g.moveTo(x, base - h);
  for (let i = 0; i < 5; i++) { const yy = base - h + (i + 1) * h / 5.5, ww = w * (i + 1) / 5; g.lineTo(x + ww, yy); g.lineTo(x + ww * 0.45, yy - h * 0.04); }
  g.lineTo(x + w * 0.12, base); g.lineTo(x - w * 0.12, base);
  for (let i = 4; i >= 0; i--) { const yy = base - h + (i + 1) * h / 5.5, ww = w * (i + 1) / 5; g.lineTo(x - ww * 0.45, yy - h * 0.04); g.lineTo(x - ww, yy); }
  g.closePath(); g.fill();
}
function fern(g, x, y, len, ang, col) {
  g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.35, len, -len * 0.05); g.stroke();
  for (let i = 1; i < 16; i++) {
    const t = i / 16, u = 1 - t, px = 2 * u * t * len * 0.5 + t * t * len, py = 2 * u * t * -len * 0.35 + t * t * -len * 0.05, s = (1 - t) * 16 + 4;
    for (const d of [-1, 1]) { g.beginPath(); g.ellipse(px + 3, py + d * s * 0.6, s, s * 0.28, d * 0.9, 0, 7); g.fill(); }
  }
  g.restore();
}
const BG = (() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), Rn = rng(7);
  const haze = a => { g.fillStyle = `rgba(235,220,195,${a})`; g.fillRect(0, 0, W, H); };
  let gr = g.createLinearGradient(0, 0, 0, GROUND);
  gr.addColorStop(0, '#4c7bb2'); gr.addColorStop(0.45, '#9cc2dc'); gr.addColorStop(0.8, '#f0d6a2'); gr.addColorStop(1, '#f4c886');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const sx = 960, sy = 190;
  gr = g.createRadialGradient(sx, sy, 10, sx, sy, 440); gr.addColorStop(0, 'rgba(255,246,220,.95)'); gr.addColorStop(0.15, 'rgba(255,230,170,.5)'); gr.addColorStop(1, 'rgba(255,220,160,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(sx, sy, 34, 0, 7); g.fill();
  for (let i = 0; i < 8; i++) {
    const cx = Rn() * W, cy = 50 + Rn() * 170, s = 60 + Rn() * 90;
    for (let j = 0; j < 7; j++) {
      const x = cx + (Rn() - 0.5) * s * 2.2, y = cy + (Rn() - 0.5) * s * 0.35, r = s * (0.35 + Rn() * 0.35), cg = g.createRadialGradient(x, y, 0, x, y, r);
      cg.addColorStop(0, 'rgba(255,250,240,.5)'); cg.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }
  const ridge = (base, amp, col, step, seed) => {
    const r = rng(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, H); let y = base;
    for (let x = 0; x <= W + step; x += step) { y += (r() - 0.5) * amp; y = Math.max(base - amp * 2.2, Math.min(base + amp * 0.6, y)); g.lineTo(x, y); }
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  ridge(330, 60, '#8fa6ba', 36, 3); haze(0.3);
  ridge(400, 40, '#6f8a94', 28, 5); haze(0.22);
  const forest = (base, minH, maxH, col, count, seed) => { const r = rng(seed); g.fillStyle = col; for (let i = 0; i < count; i++) conifer(g, r() * W, base + r() * 20, minH + r() * (maxH - minH)); g.fillRect(0, base + 12, W, H); };
  forest(470, 60, 130, '#58746f', 80, 11); haze(0.22);
  forest(530, 90, 190, '#3d5a49', 50, 13); haze(0.1);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const a = 1.9 + i * 0.22; g.fillStyle = 'rgba(255,225,170,.045)'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * 1600, sy + Math.sin(a) * 1600); g.lineTo(sx + Math.cos(a + 0.07) * 1600, sy + Math.sin(a + 0.07) * 1600); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  for (const [x, h] of [[30, 420], [120, 330], [1180, 380], [1265, 450]]) { g.fillStyle = '#3a2a1a'; g.fillRect(x - 7, GROUND - 60, 14, 50); g.fillStyle = '#26402e'; conifer(g, x, GROUND - 20, h); }
  gr = g.createLinearGradient(0, GROUND - 32, 0, H); gr.addColorStop(0, '#6c7a3c'); gr.addColorStop(0.18, '#8a7a4a'); gr.addColorStop(1, '#44361f');
  g.fillStyle = gr; g.fillRect(0, GROUND - 32, W, H);
  for (let i = 0; i < 1600; i++) { g.fillStyle = Rn() < 0.5 ? 'rgba(40,30,15,.25)' : 'rgba(230,210,160,.15)'; g.fillRect(Rn() * W, GROUND - 10 + Rn() * 110, 2 + Rn() * 3, 1 + Rn() * 2); }
  for (let i = 0; i < 1100; i++) {
    const x = Rn() * W, y = GROUND - 30 + Rn() * 26; g.strokeStyle = `hsl(${70 + Rn() * 35},${30 + Rn() * 25}%,${22 + Rn() * 22}%)`; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (Rn() - 0.5) * 6, y - 6, x + (Rn() - 0.5) * 10, y - 8 - Rn() * 16); g.stroke();
  }
  fern(g, -10, GROUND - 10, 170, -0.5, '#2f5a2a'); fern(g, 10, GROUND, 140, -0.15, '#3a6a30');
  g.save(); g.translate(W, 0); g.scale(-1, 1); fern(g, -10, GROUND - 10, 170, -0.5, '#2f5a2a'); fern(g, 10, GROUND, 140, -0.15, '#3a6a30'); g.restore();
  return c;
})();
const motes = Array.from({ length: 30 }, (_, i) => ({ x: R() * W, y: 150 + R() * 400, s: 0.2 + R() * 0.4, ph: i }));
function drawBG(dim) {
  const im = IMG['bg_' + stage] || IMG.bg_forest;
  if (im) { const s = Math.max(W / im.width, H / im.height); ctx.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s); }
  else ctx.drawImage(BG, 0, 0);
  for (const m of motes) { m.x += m.s; if (m.x > W) m.x = 0; ctx.fillStyle = `rgba(255,240,200,${0.3 + 0.3 * Math.sin(frame * 0.03 + m.ph)})`; ctx.beginPath(); ctx.arc(m.x, m.y + Math.sin(frame * 0.02 + m.ph) * 10, 1.6, 0, 7); ctx.fill(); }
  if (dim) { ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(0, 0, W, H); }
}

// ===== 상태 =====
let scene = 'title', selIdx = 0, diffIdx = 0, P1, P2, ai, round = 1, timer = 0, phaseT = 0, roundWinner = null, roundMsg = '';
let flashCol = null;
let lossStreak = 0, paused = false, hitstop = 0, shake = 0, cut = null, slow = 0, frame = 0, flashT = 0, cam = null, muteMsg = 0;
const NOIN = { left: false, right: false, leftP: false, rightP: false, up: false, down: false, z: false, x: false, c: false };

function startMatch() {
  const others = DINOS.filter((_, i) => i !== selIdx), opp = others[Math.floor(R() * others.length)];
  stage = STAGES[stageIdx];
  P1 = new Fighter(DINOS[selIdx], false, 0); P2 = new Fighter(opp, true, diffIdx); ai = new AI(P2); round = 1; resetRound();
}
function resetRound() {
  P1.reset(360, 1); P2.reset(W - 360, -1); P1.sp = Math.min(P1.sp, 100); timer = 60 * 60; particles = []; projs = []; texts = []; hazards = []; hazardT = 180; finaleShown = false;
  scene = 'intro'; phaseT = round === 1 ? 190 : 110; paused = false; cut = null; cam = null;
}
function startCutin(f) { cut = { f, t: CUT_T }; Sound.roar(); Sound.sfx(200, 0.5, 'sawtooth', 0.12, 4); }
function endRound(ko) {
  let w = null;
  if (P2.hp <= 0 && P1.hp > 0) w = P1; else if (P1.hp <= 0 && P2.hp > 0) w = P2;
  else if (!ko) { const a = P1.hp / P1.def.hp, b = P2.hp / P2.def.hp; w = a > b ? P1 : b > a ? P2 : null; }
  if (w) { w.wins++; if (w.state !== 'ko') w.setState('idle'); }
  roundWinner = w; roundMsg = ko ? 'K.O.!' : '시간 종료!'; scene = 'roundEnd'; phaseT = 170; setTimeout(Sound.roar, 300);
}
function separate() {
  const min = (P1.def.len + P2.def.len) / 2 * 0.7, dx = P2.x - P1.x, s = Math.sign(dx) || 1; let ov = min - Math.abs(dx);
  if (ov <= 0 || Math.abs(P1.y - P2.y) > 140) return;
  if ((P1.airJumped && !P1.onGround) || (P2.airJumped && !P2.onGround)) return; // 2단 점프 중에는 상대 위로 넘어갈 수 있음
  P1.x -= s * ov / 2; P2.x += s * ov / 2;
  for (const f of [P1, P2]) f.x = clamp(f.x, XMIN, XMAX);
  ov = min - Math.abs(P2.x - P1.x);
  if (ov > 0) { if (P1.x <= XMIN || P1.x >= XMAX) P2.x += s * ov; else P1.x -= s * ov; }
}
function p1Input() {
  return { left: !!keys.ArrowLeft, right: !!keys.ArrowRight, leftP: !!pressed.ArrowLeft, rightP: !!pressed.ArrowRight, up: !!pressed.ArrowUp, down: !!keys.ArrowDown, z: !!pressed.KeyZ, x: !!pressed.KeyX, c: !!pressed.KeyC };
}
const MUSIC = { title: 'title', select: 'title', diff: 'title', intro: 'battle', fight: 'battle', roundEnd: 'battle' };

function update() {
  const enter = pressed.Enter || pressed.Space, esc = pressed.Escape;
  if (pressed.KeyM) { Sound.toggle(); muteMsg = 90; }
  if (muteMsg > 0) muteMsg--;
  if (MUSIC[scene]) Sound.play(MUSIC[scene]);
  if (!cut && !paused) updParticles();
  if (flashT > 0 && --flashT === 0) flashCol = null;
  if (cam && --cam.t <= 0) cam = null;
  if (scene === 'title') { if (enter) { scene = 'select'; Sound.roar(); } }
  else if (scene === 'select') {
    const c = selIdx % 4, r = Math.floor(selIdx / 4);
    if (pressed.ArrowLeft) selIdx = r * 4 + (c + 3) % 4; if (pressed.ArrowRight) selIdx = r * 4 + (c + 1) % 4;
    if (pressed.ArrowUp || pressed.ArrowDown) selIdx = (selIdx + 4) % 8;
    if (pressed.ArrowLeft || pressed.ArrowRight || pressed.ArrowUp || pressed.ArrowDown) Sound.sfx(500, 0.06, 'triangle', 0.08);
    if (enter) { scene = 'diff'; Sound.sfx(800, 0.1, 'square', 0.08); } if (esc) scene = 'title';
  }
  else if (scene === 'diff') {
    if (pressed.ArrowUp) diffRow = 0; if (pressed.ArrowDown) diffRow = 1;
    if (pressed.ArrowUp || pressed.ArrowDown) Sound.sfx(500, 0.05, 'triangle', 0.06);
    const dl = pressed.ArrowLeft ? -1 : pressed.ArrowRight ? 1 : 0;
    if (dl) { if (diffRow === 0) diffIdx = clamp(diffIdx + dl, 0, 2); else stageIdx = (stageIdx + dl + STAGES.length) % STAGES.length; Sound.sfx(600, 0.06, 'triangle', 0.08); }
    if (enter) startMatch(); if (esc) scene = 'select';
  }
  else if (scene === 'intro') { P1.update(NOIN, P2); P2.update(NOIN, P1); if (--phaseT <= 0) scene = 'fight'; if (phaseT === 35) Sound.sfx(300, 0.3, 'square', 0.12, 2); }
  else if (scene === 'fight') {
    if (paused) { if (enter) paused = false; if (esc) scene = 'select'; }
    else if (enter || esc) paused = true;
    else if (cut) { if (--cut.t <= 0) cut = null; }
    else if (hitstop > 0) hitstop--;
    else if (!(slow > 0 && slow-- && frame % 3)) {
      P1.update(p1Input(), P2); P2.update(ai.input(P1), P1);
      tryHit(P1, P2); tryHit(P2, P1); updProjs(); updHazards(); separate();
      if (finale() && frame % 40 === 0) shake = Math.max(shake, 4);
      if (shake > 0) shake--;
      if (P1.hp <= 0 || P2.hp <= 0) { if (slow <= 0) endRound(true); }
      else if (--timer <= 0) endRound(false);
    }
  }
  else if (scene === 'roundEnd') {
    P1.update(NOIN, P2); P2.update(NOIN, P1); if (shake > 0) shake--;
    if (--phaseT <= 0) {
      if (P1.wins >= 2 || P2.wins >= 2 || round >= 5) {
        scene = 'matchEnd'; const win = P1.wins > P2.wins; lossStreak = win ? 0 : lossStreak + 1; Sound.play(win ? 'victory' : 'defeat');
      } else { round++; resetRound(); }
    }
  }
  else if (scene === 'matchEnd') { P1.update(NOIN, P2); P2.update(NOIN, P1); if (enter) scene = 'select'; if (esc) scene = 'title'; }
  for (const k in pressed) pressed[k] = false;
}

// ===== UI =====
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function hpBar(f, left) {
  const w = 500, h = 30, x = left ? 40 : W - 40 - w, y = 28, r = f.hp / f.def.hp, dr = f.dispHp / f.def.hp;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(x - 4, y - 4, w + 8, h + 8, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(left ? x : x + w - w * dr, y, w * dr, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (r > 0.3) { g.addColorStop(0, '#ffe066'); g.addColorStop(1, '#f08c00'); } else { g.addColorStop(0, '#ff8a80'); g.addColorStop(1, '#d32f2f'); }
  ctx.fillStyle = g; ctx.fillRect(left ? x : x + w - w * r, y, w * r, h);
  txt(f.def.name + (f.isCPU ? ' (CPU)' : ' (나)'), left ? x : x + w, y + 54, 24, '#fff', left ? 'left' : 'right');
  for (let i = 0; i < 2; i++) { const cx = left ? x + w - 14 - i * 30 : x + 14 + i * 30; ctx.beginPath(); ctx.arc(cx, y + 54, 10, 0, 7); ctx.fillStyle = i < f.wins ? '#ffd43b' : 'rgba(0,0,0,.5)'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
}
function spBar(f, left) {
  const w = 300, h = 18, x = left ? 40 : W - 40 - w, y = isTouch() ? 134 : H - 66, full = f.sp >= 100;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(x - 3, y - 3, w + 6, h + 6, 6); ctx.fill();
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#4dabf7'); g.addColorStop(1, full ? f.def.aura : '#845ef7');
  ctx.fillStyle = g; ctx.fillRect(left ? x : x + w - w * f.sp / 100, y, w * f.sp / 100, h);
  if (full && frame % 30 < 20) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; rr(x - 3, y - 3, w + 6, h + 6, 6); ctx.stroke(); }
  txt(full ? (f.isCPU ? '필살기 준비!' : 'C 키로 필살기!') : '필살 게이지', left ? x : x + w, y - 16, 18, full ? '#ffd43b' : '#fff', left ? 'left' : 'right', 'rgba(0,0,0,.8)', 4);
}
function drawHUD() {
  hpBar(P1, true); hpBar(P2, false); spBar(P1, true); spBar(P2, false);
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.beginPath(); ctx.arc(W / 2, 46, 38, 0, 7); ctx.fill();
  const sec = Math.ceil(timer / 60); txt(String(sec), W / 2, 47, 36, sec <= 10 ? '#ff6b6b' : '#fff', 'center', null);
  if (!isTouch()) txt('← → 이동   ←← →→ 대시(회피)   뒤로 꾹=가드   ↑ 점프(↑↑ 2단)   ↓ 웅크리기   Z·X 공격   ↓+Z 낮은 공격   ↓+X 올려치기   C 필살기   M 음악', W / 2, H - 18, 15, 'rgba(255,255,255,.92)', 'center', 'rgba(0,0,0,.75)', 4);
}
function fitFont(s, max, maxW) { let size = max; ctx.font = `bold ${size}px ${FONT}`; while (ctx.measureText(s).width > maxW && size > 20) { size -= 3; ctx.font = `bold ${size}px ${FONT}`; } return size; }
function drawCutin() {
  const f = cut.f, t = CUT_T - cut.t, col = f.def.aura;
  const open = Math.min(1, t / 8), close = cut.t < 10 ? cut.t / 10 : 1, hh = 150 * open * close;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.015); ctx.globalAlpha = 0.28 * close; ctx.fillStyle = col;
  for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI * 2 / 18); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, -60); ctx.lineTo(900, 60); ctx.closePath(); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = 1;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, H / 2 - hh - 40); ctx.lineTo(W, H / 2 - hh + 40); ctx.lineTo(W, H / 2 + hh + 40); ctx.lineTo(0, H / 2 + hh - 40); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#120604'); g.addColorStop(0.45, col); g.addColorStop(1, '#120604');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 30; i++) { const y = H / 2 - 200 + ((i * 53) % 400), x = W - ((i * 97 + t * 70) % (W + 400)); ctx.lineWidth = 1 + (i % 3); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120 + (i % 4) * 40, y); ctx.stroke(); }
  const ease = 1 - Math.pow(1 - Math.min(1, t / 14), 3), px = -420 + ease * 700 + (t > 14 ? Math.sin(t * 1.3) * 3 : 0);
  const p = basePose(frame); p.jaw = 1; p.hr = -0.15; p.arm = 0.8 + 0.4 * Math.sin(t * 0.4); p.wing = 0.6 * Math.sin(t * 0.5); p.stride = 18; p.walk = t * 0.3;
  const ph = visH(f.def), s = Math.min(1.35, 300 / ph, 640 / visW(f.def));
  showDino(f.def, px, H / 2 + ph * s * 0.5 + 10, 1, s, p);
  ctx.restore();
  for (let i = 0; i < 6; i++) { const a = (t * 0.2 + i) % 1; ctx.globalAlpha = 1 - a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(600 + ((i * 131 + t * 9) % 640), H / 2 - 120 + ((i * 71) % 240), 3 + 4 * a, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  if (t > 6) { const k = Math.min(1, (t - 6) / 6); txt('필살기!', 900, H / 2 - 80, 44 * (1.6 - 0.6 * k), '#ffe066', 'center', '#000', 8); }
  if (t > 12) {
    const k = Math.min(1, (t - 12) / 8), sc = 2.2 - 1.2 * (1 - Math.pow(1 - k, 3)) + (k >= 1 ? Math.sin(t * 0.6) * 0.02 : 0), size = fitFont(f.move.name, 76, 560);
    ctx.save(); ctx.translate(900, H / 2 + 20); ctx.scale(sc, sc); ctx.globalAlpha = k;
    txt(f.move.name, 0, 0, size, col, 'center', col, 26); txt(f.move.name, 0, 0, size, '#fff', 'center', '#000', 10); ctx.restore(); ctx.globalAlpha = 1;
  }
  if (t < 6) { ctx.fillStyle = `rgba(255,255,255,${1 - t / 6})`; ctx.fillRect(0, 0, W, H); }
}
function dinoCard(d, x, y, w, h, sel, i) {
  ctx.fillStyle = sel ? 'rgba(70,45,10,.9)' : 'rgba(0,0,0,.6)'; rr(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = sel ? '#ffd43b' : 'rgba(255,255,255,.25)'; ctx.lineWidth = sel ? 5 : 2; rr(x, y, w, h, 14); ctx.stroke();
  ctx.save(); rr(x, y, w, h, 14); ctx.clip();
  const p = basePose(frame + i * 20); if (sel) { p.jaw = 0.3 + 0.25 * Math.sin(frame * 0.07); p.arm = 0.2 * Math.sin(frame * 0.07); }
  const s = Math.min((w - 24) / visW(d), (h - 52) / visH(d));
  showDino(d, x + w / 2, y + h - 38, 1, s, p);
  ctx.restore();
  txt(d.name, x + w / 2, y + h - 18, fitFont(d.name, 22, w - 20), sel ? '#ffd43b' : '#fff', 'center', 'rgba(0,0,0,.9)', 5);
}

function render() {
  ctx.save();
  if (scene === 'title') {
    drawBG(0.15);
    const p = basePose(frame), q = basePose(frame + 40); p.jaw = 0.3 + 0.3 * Math.sin(frame * 0.05);
    showDino(DINO.trex, 330, 600, 1, 1, p); showDino(DINO.trice, 960, 600, -1, 1, q);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 90, W, 190);
    txt('다이노 듀얼', W / 2, 160, 104, '#ffb347', 'center', '#2b1300', 12);
    txt('공룡 최강전', W / 2, 245, 46, '#fff', 'center', '#2b1300', 8);
    if (frame % 60 < 42) txt(isTouch() ? '화면을 눌러 시작!' : 'Enter 키를 눌러 시작!', W / 2, 330, 36, '#ffe066');
  } else if (scene === 'select') {
    drawBG(0.5);
    txt('나의 공룡을 골라요!', W / 2, 48, 42, '#ffe066');
    const cw = 290, ch = 175, gx = 16, x0 = (W - (cw * 4 + gx * 3)) / 2;
    DINOS.forEach((d, i) => dinoCard(d, x0 + (i % 4) * (cw + gx), 85 + Math.floor(i / 4) * (ch + 14), cw, ch, i === selIdx, i));
    const d = DINOS[selIdx];
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(40, 468, W - 80, 150, 14); ctx.fill();
    txt(d.name, 70, 500, 34, '#ffd43b', 'left'); txt(d.type, 70, 540, 24, '#fff', 'left', null);
    txt('힘 ' + stars(d.stars[0]) + '   체력 ' + stars(d.stars[1]) + '   속도 ' + stars(d.stars[2]), 70, 580, 20, '#ddd', 'left', null);
    const mvL = [['Z', d.moves.z.name], ['X', d.moves.x.name], ['↓+Z', d.moves.dz.name], ['↓+X', d.moves.dx.name], ['점프+Z', d.moves.j.name], ['C 필살기', d.moves.c.name]];
    mvL.forEach(([k, n], i) => { const x = 560 + (i % 2) * 340, y = 495 + Math.floor(i / 2) * 40; txt(k, x, y, 20, i === 5 ? '#ff922b' : '#9ad8ff', 'left', null); txt(n, x + 95, y, fitFont(n, 22, 235), i === 5 ? '#ff922b' : '#fff', 'left', null); });
    if (isTouch()) confirmBtn('이 공룡으로 결정!'); else txt('방향키로 고르기     Enter 결정     Esc 뒤로', W / 2, 650, 24, '#fff');
    if (lossStreak >= 3) txt('도움말: 상대 공격은 점프나 뒤로 톡 눌러서 피할 수 있어요! 난이도를 쉬움으로 바꿔도 좋아요.', W / 2, 692, 20, '#9ad8ff');
  } else if (scene === 'diff') {
    stage = STAGES[stageIdx]; drawBG(0.5); // 고른 경기장을 배경으로 미리 보여줌
    txt('난이도와 경기장을 골라요', W / 2, 40, 38, '#ffe066');
    const rowLabel = (s, x, y, row) => txt((diffRow === row && !isTouch() ? '▶ ' : '') + s, x, y, 24, diffRow === row && !isTouch() ? '#ffd43b' : '#fff', 'left');
    rowLabel('난이도', DIFF_BOX.x0, 80, 0);
    DIFF.forEach((df, i) => {
      const x = DIFF_BOX.x0 + i * 230, sel = i === diffIdx, col = ['#8ce99a', '#ffe066', '#ff8787'][i];
      ctx.fillStyle = sel ? 'rgba(70,45,10,.9)' : 'rgba(0,0,0,.6)'; rr(x, DIFF_BOX.y, 200, DIFF_BOX.h, 14); ctx.fill();
      ctx.strokeStyle = sel ? col : 'rgba(255,255,255,.25)'; ctx.lineWidth = sel ? 5 : 2; rr(x, DIFF_BOX.y, 200, DIFF_BOX.h, 14); ctx.stroke();
      txt(df.name, x + 100, DIFF_BOX.y + DIFF_BOX.h / 2, 30, sel ? col : '#fff');
    });
    rowLabel('경기장', STAGE_BOX.x0, 186, 1);
    STAGES.forEach((k, i) => {
      const x = STAGE_BOX.x0 + i * (STAGE_BOX.w + STAGE_BOX.gap), y = STAGE_BOX.y, w = STAGE_BOX.w, h = STAGE_BOX.h, sel = i === stageIdx, im = IMG['bg_' + k];
      ctx.save(); rr(x, y, w, h, 12); ctx.clip();
      if (im) { const sc = Math.max(w / im.width, h / im.height); ctx.drawImage(im, x + (w - im.width * sc) / 2, y + (h - im.height * sc) / 2, im.width * sc, im.height * sc); }
      else ctx.drawImage(BG, x, y, w, h);
      if (!sel) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, w, h); }
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, y + h - 30, w, 30); ctx.restore();
      txt(STAGE_NAMES[i], x + w / 2, y + h - 15, 20, sel ? '#ffd43b' : '#fff', 'center', null);
      ctx.strokeStyle = sel ? '#ffd43b' : 'rgba(255,255,255,.3)'; ctx.lineWidth = sel ? 5 : 2; rr(x, y, w, h, 12); ctx.stroke();
    });
    const d = DINOS[selIdx], p = basePose(frame); p.jaw = 0.3 + 0.3 * Math.sin(frame * 0.06);
    const s = Math.min(1, 250 / visH(d), 480 / visW(d)); showDino(d, 320, 590, 1, s, p);
    txt(d.name, 320, 625, 32, '#ffd43b');
    txt('VS', W / 2, 470, 80, '#ff6b6b', 'center', '#000', 10); txt('?', 980, 470, 130, '#fff', 'center', '#000', 10); txt('누가 나올까요?', 980, 570, 26, '#ddd');
    if (isTouch()) confirmBtn('대결 시작!'); else txt('↑ ↓ 줄 바꾸기     ← → 고르기     Enter 대결 시작!     Esc 뒤로', W / 2, 690, 22, '#fff');
  } else {
    drawBG(0);
    if (cam) { const z = 1 + (cam.z || 0.18) * Math.min(1, cam.t / 26); ctx.translate(cam.x, cam.y); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y); }
    if (shake > 0) ctx.translate((R() - 0.5) * shake, (R() - 0.5) * shake);
    { const sf = P1.state === 'special' ? P1 : P2.state === 'special' ? P2 : null;
      if (sf) { const k = Math.min(1, sf.st / 10), cx = sf.x, cy = sf.y - sf.def.h * 0.5;
        ctx.fillStyle = `rgba(10,0,20,${0.45 * k})`; ctx.fillRect(-100, -100, W + 200, H + 200);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(frame * 0.012); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.15 * k; ctx.fillStyle = sf.def.aura;
        for (let i = 0; i < 24; i++) { ctx.rotate(Math.PI * 2 / 24); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, -45); ctx.lineTo(1500, 45); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        const g = ctx.createRadialGradient(cx, cy, 80, cx, cy, 800); g.addColorStop(0, hexA(sf.def.aura, 0.22 * k)); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, hexA(sf.def.aura, 0.25 * k));
        ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200); } }
    drawHazards(false); drawProjs();
    const order = (P1.state === 'atk' || P1.state === 'special') ? [P2, P1] : [P1, P2];
    order.forEach(drawFighter); drawHazards(true); drawParticles();
    ctx.restore(); ctx.save();
    drawHUD();
    if (scene === 'intro') {
      if (round === 1 && phaseT > 110) {
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 220, W, 200);
        const k = Math.min(1, (190 - phaseT) / 15);
        txt(P1.def.name, lerp(-200, 320, k), 320, 46, '#ffd43b'); txt(P2.def.name, lerp(W + 200, W - 320, k), 320, 46, '#ff8787');
        txt('VS', W / 2, 320, 90 * (2 - k), '#fff', 'center', '#000', 10);
      } else txt(phaseT > 35 ? '라운드 ' + round : '싸워라!', W / 2, H / 2 - 40, 100, phaseT > 35 ? '#fff' : '#ff922b', 'center', '#000', 12);
    }
    if (scene === 'roundEnd') {
      txt(roundMsg, W / 2, H / 2 - 70, 110, '#ff6b6b', 'center', '#000', 12);
      txt(roundWinner ? roundWinner.def.name + ' 승리!' : '무승부!', W / 2, H / 2 + 30, 50, '#fff', 'center', '#000', 8);
    }
    if (scene === 'matchEnd') {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H);
      const win = P1.wins > P2.wins;
      txt(win ? '승리!' : '아쉬워요!', W / 2, 220, 120, win ? '#ffd43b' : '#9ad8ff', 'center', '#000', 12);
      txt(win ? '멋진 승리! 최강의 공룡은 바로 너야!' : '조금만 더 하면 이길 수 있어요. 다시 도전!', W / 2, 320, 38, '#fff', 'center', '#000', 8);
      if (frame % 60 < 42) txt(isTouch() ? '화면을 눌러 다시 하기' : 'Enter 다시 하기     Esc 처음 화면', W / 2, 400, 30, '#ffe066');
    }
    if (cut) drawCutin();
    if (flashT > 0) { ctx.fillStyle = flashCol && flashT > 7 ? hexA(flashCol, (flashT - 7) / 7 * 0.75) : `rgba(255,255,255,${Math.min(1, flashT / 12)})`; ctx.fillRect(0, 0, W, H); }
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      txt('일시정지', W / 2, H / 2 - 40, 90, '#fff'); txt(isTouch() ? '화면을 누르면 계속     ↩ 뒤로: 공룡 고르기' : 'Enter 계속하기     Esc 공룡 고르기로', W / 2, H / 2 + 50, 30, '#ffe066');
    }
  }
  if (muteMsg > 0) txt(Sound.muted ? '음악 끔 (M)' : '음악 켬 (M)', W - 20, 110, 22, '#fff', 'right');
  drawTouch();
  if (!isTouch() && (scene === 'title' || scene === 'select' || scene === 'diff')) txt('M: 음악 켜기/끄기', W - 20, H - 18, 16, 'rgba(255,255,255,.8)', 'right', 'rgba(0,0,0,.7)', 4);
  ctx.restore();
}

// ===== 메인 루프 (60fps 고정 업데이트) =====
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; frame++; }
  render(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
