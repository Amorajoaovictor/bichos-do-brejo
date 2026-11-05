import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {extractSheetFigures} from './extract-sheet-figures.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const folder=new URL('../art/rosnaldo/repouso-v2/',import.meta.url);
await mkdir(new URL('quadros/',folder),{recursive:true});
const directions=['direita','esquerda','frente','costas'],cards=[],metadata=[];
for(const direction of directions){
  const path=fileURLToPath(new URL(direction+'.png',folder));
  const meta=await sharp(path).metadata();
  if(!meta.hasAlpha)throw new Error('Falta transparência: '+direction);
  const {frames,figures,scale}=await extractSheetFigures(path);
  for(const [i,frame] of frames.entries())await writeFile(new URL(`quadros/${direction}-${String(i+1).padStart(2,'0')}.png`,folder),frame);
  await sharp(frames,{join:{animated:true}}).gif({delay:160,loop:0,effort:6}).toFile(fileURLToPath(new URL(direction+'-animado.gif',folder)));
  const header=Buffer.from(`<svg width="362" height="410"><rect width="362" height="410" rx="14" fill="#33382e"/><text x="181" y="28" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#e7dcc5">Repouso · ${direction}</text></svg>`);
  cards.push(await Promise.all(frames.map(frame=>sharp(header).composite([{input:frame,left:0,top:44}]).png().toBuffer())));
  metadata.push({direction,sheet:[meta.width,meta.height],alpha:true,frames:12,frameSize:362,scale,figures});
}
const combined=[];
for(let i=0;i<12;i++)combined.push(await sharp({create:{width:724,height:820,channels:4,background:'#24291f'}}).composite(cards.map((frames,n)=>({input:frames[i],left:n%2*362,top:Math.floor(n/2)*410}))).png().toBuffer());
await sharp(combined,{join:{animated:true}}).gif({delay:160,loop:0,effort:7}).toFile(fileURLToPath(new URL('quatro-direcoes.gif',folder)));
await writeFile(new URL('comparacao.png',folder),combined[0]);
await writeFile(new URL('manifest.json',folder),JSON.stringify({character:'Rosnaldo',action:'repouso',version:2,design:'Cartoon de cores planas, feridas, sangue e necrose; sem ossos expostos.',status:'Integrado em PNG nas quatro direções.',frameDurationMs:160,durationMs:1920,frameCount:12,columns:4,rows:3,loop:true,directions:metadata},null,2)+'\n');
const viewer=await readFile(new URL('../art/rosnaldo/rugido-v5/index.html',import.meta.url),'utf8');
await writeFile(new URL('index.html',folder),viewer.replaceAll('Rugido','Repouso').replaceAll('value="300"','value="320"').replaceAll('value="150"','value="160"').replaceAll('value="100"','value="107"').replace('150 ms','160 ms'));
console.log('Repouso v2: 48 quadros transparentes, GIFs e visualizador.');
