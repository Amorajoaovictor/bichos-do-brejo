import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const artRoot = fileURLToPath(new URL('./art/', import.meta.url));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const art=pathname.startsWith('/art/'),base=art?artRoot:root;
    const relative=art?pathname.slice('/art/'.length):pathname==='/'?'index.html':pathname.slice(1);
    const file = path.resolve(base, relative);
    if(path.relative(base,file).startsWith('..')||path.isAbsolute(path.relative(base,file))) {res.writeHead(403);res.end();return;}
    const data = await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  } catch {res.writeHead(404);res.end('Arquivo não encontrado.');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Bichos do Brejo: http://127.0.0.1:4173'));
