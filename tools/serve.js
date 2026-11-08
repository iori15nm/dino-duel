// 로컬 개발 서버: dino-duel 폴더를 127.0.0.1:5173 으로 제공.
// PUT /__save/<파일명> 으로 받은 이미지를 assets/ 에 저장 (이미지 손질 도구 tools/cutout.html 용, 이 PC 안에서만 접근 가능)
const h = require('http'), f = require('fs'), p = require('path');
const root = p.resolve(__dirname, '..'), assets = p.join(root, 'assets');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.md': 'text/plain; charset=utf-8' };
h.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (q.method === 'PUT' && u.startsWith('/__save/')) {
    const name = p.basename(u.slice(8));
    if (!/^[a-z_]+\.(png|jpg)$/.test(name)) return s.writeHead(400).end('bad name');
    const chunks = []; q.on('data', c => chunks.push(c));
    q.on('end', () => { f.writeFile(p.join(assets, name), Buffer.concat(chunks), e => s.writeHead(e ? 500 : 200).end(e ? 'fail' : 'ok')); });
    return;
  }
  if (u === '/') u = '/index.html';
  const fp = p.join(root, u); if (!fp.startsWith(root)) return s.writeHead(403).end();
  f.readFile(fp, (e, d) => { if (e) return s.writeHead(404).end(); s.writeHead(200, { 'Content-Type': types[p.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(d); });
}).listen(5173, '127.0.0.1');
