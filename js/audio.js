// ===== 배경음악 + 효과음 (WebAudio로 직접 합성, 파일 불필요) =====
// 악보 표기: 칸 하나 = 16분음표. 음이름=새 음, '-'=이어서, '.'=쉼표, '|'=마디 구분(무시)
const Sound = (() => {
  let AC = null, master, music, fx, noise, muted = false, want = null, cur = null, step = 0, nextT = 0;
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = n => { const m = n.match(/^([A-G]#?)(\d)$/); return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };
  function parse(s) {
    const tk = s.split(/\s+/).filter(x => x && x !== '|'), ev = [];
    for (let i = 0; i < tk.length; i++) {
      if (tk[i] === '-' || tk[i] === '.') continue;
      let len = 1; while (tk[i + len] === '-') len++;
      ev[i] = tk[i].length === 1 && 'khs'.includes(tk[i]) ? { d: tk[i] } : { f: freq(tk[i]), len };
    }
    return { ev, n: tk.length };
  }
  const bassOf = roots => roots.map(r => `${r}2 . ${r}3 . ${r}2 . ${r}3 . ${r}2 . ${r}3 . ${r}2 ${r}2 ${r}3 .`).join(' ');
  const arpOf = chords => chords.map(c => { const [a, b, d] = c.split(','); return `${a} ${b} ${d} ${b} `.repeat(4); }).join(' ');
  const SONGS = {
    title: { bpm: 112, loop: true, tracks: [
      ['lead', 'E5 - - - G5 - - - C5 - - - D5 - E5 - | D5 - - - B4 - - - G4 - - - B4 - D5 - | C5 - - - E5 - - - A5 - - - G5 - E5 - | F5 - - - - - E5 - D5 - - - C5 - - - | E5 - - - G5 - - - C6 - - - B5 - A5 - | G5 - - - D5 - - - B4 - - - D5 - G5 - | A5 - - - F5 - - - G5 - - - D5 - - - | C5 - - - - - - - . . . . . . . .'],
      ['bass', bassOf(['C', 'G', 'A', 'F', 'C', 'G', 'F', 'C'])],
      ['arp', arpOf(['C4,E4,G4', 'B3,D4,G4', 'C4,E4,A4', 'C4,F4,A4', 'C4,E4,G4', 'B3,D4,G4', 'C4,F4,A4', 'C4,E4,G4'])],
      ['drum', 'k . . . s . . . k . k . s . . h '.repeat(8)]] },
    battle: { bpm: 144, loop: true, tracks: [
      ['lead', 'A4 - - C5 - - E5 - D5 - C5 - B4 - C5 - | A4 - - - F4 - A4 - C5 - - - A4 - - - | B4 - - D5 - - G5 - F5 - E5 - D5 - B4 - | E5 - - - G#4 - B4 - E5 - - - D5 - B4 - | A4 - - C5 - - E5 - A5 - - - G5 - E5 - | F5 - - E5 - - C5 - A4 - C5 - F5 - E5 - | D5 - - B4 - - G4 - E5 - - - G#5 - - - | A5 - - - E5 - - - A4 - - - . . . .'],
      ['bass', bassOf(['A', 'F', 'G', 'E', 'A', 'F', 'G', 'A'])],
      ['arp', arpOf(['A3,C4,E4', 'A3,C4,F4', 'B3,D4,G4', 'B3,E4,G#4', 'A3,C4,E4', 'A3,C4,F4', 'B3,D4,G4', 'A3,C4,E4'])],
      ['drum', 'k . h . s . h k k . h . s . h h '.repeat(8)]] },
    victory: { bpm: 150, loop: false, tracks: [
      ['lead', 'C5 - E5 - G5 - C6 - - - G5 - C6 - - - - - - - . . . .'],
      ['bass', 'C3 - - - - - - - G2 - - - C3 - - - - - - - . . . .'],
      ['drum', 'k . . . k . . . s . . . k . s . s s s s . . . .']] },
    defeat: { bpm: 96, loop: false, tracks: [
      ['lead', 'E5 - - D5 - - C5 - - B4 - - A4 - - - - - . . . . . .'],
      ['bass', 'A2 - - - - - G2 - - - - - F2 - - - - - E2 - - - - -']] },
  };
  for (const k in SONGS) SONGS[k].tracks = SONGS[k].tracks.map(([inst, s]) => ({ inst, ...parse(s) }));

  function init() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = AC.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(AC.destination);
    music = AC.createGain(); music.gain.value = 0.32; music.connect(master);
    fx = AC.createGain(); fx.gain.value = 0.7; fx.connect(master);
    noise = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(tick, 25);
    if (want) { const w = want; want = null; play(w); }
  }
  function tone(f, t, dur, type, vol, dest, cutoff) {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o; if (cutoff) { const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; o.connect(lp); n = lp; }
    n.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function hit(t, hp, dur, vol, dest) {
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(t) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.2); }
  function tick() {
    if (!cur || !AC) return;
    const sd = 60 / cur.bpm / 4;
    while (nextT < AC.currentTime + 0.12) {
      for (const tr of cur.tracks) {
        const e = tr.ev[step % tr.n]; if (!e) continue;
        if (e.d) { if (e.d === 'k') kick(nextT); else if (e.d === 's') { hit(nextT, 1200, 0.14, 0.35, music); tone(190, nextT, 0.08, 'triangle', 0.2, music); } else hit(nextT, 7000, 0.04, 0.12, music); continue; }
        const dur = e.len * sd * 0.95;
        if (tr.inst === 'lead') { tone(e.f, nextT, dur, 'square', 0.09, music, 2600); tone(e.f * 1.005, nextT, dur, 'sawtooth', 0.04, music, 1800); }
        else if (tr.inst === 'bass') tone(e.f, nextT, dur, 'sawtooth', 0.16, music, 500);
        else tone(e.f, nextT, dur, 'triangle', 0.05, music);
      }
      nextT += sd; step++;
      const len = Math.max(...cur.tracks.map(t => t.n));
      if (step >= len) { if (cur.loop) step = 0; else { cur = null; break; } }
    }
  }
  function play(name) {
    if (!AC) { want = name; return; }
    if (cur && cur.name === name) return;
    cur = { ...SONGS[name], name }; step = 0; nextT = AC.currentTime + 0.05;
  }
  function sfx(f, d, type = 'square', vol = 0.15, slide = 0) {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(fx); o.start(); o.stop(t + d);
  }
  function boom(vol = 0.5, dur = 0.4) { if (AC) { hit(AC.currentTime, 60, dur, vol, fx); sfx(70, dur, 'sine', vol, 0.4); } }
  function whoosh() { if (AC) hit(AC.currentTime, 2500, 0.12, 0.15, fx); }
  function splash() { if (AC) { hit(AC.currentTime, 800, 0.5, 0.3, fx); } }
  function roar() { sfx(120, 0.7, 'sawtooth', 0.16, 0.45); sfx(90, 0.8, 'square', 0.08, 0.5); if (AC) hit(AC.currentTime, 300, 0.6, 0.12, fx); }
  function toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.9; return muted; }
  return { init, play, sfx, boom, whoosh, splash, roar, toggle, get muted() { return muted; } };
})();
