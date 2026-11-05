import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {extractSheetFigures} from './extract-sheet-figures.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const version=process.argv[2]||'rugido-v2';
const folder=new URL(`../art/rosnaldo/${version}/`,import.meta.url),framesFolder=new URL('quadros/',folder);
await mkdir(framesFolder,{recursive:true});
const directions=[['direita','Direita'],['esquerda','Esquerda'],['frente','Frente · baixo'],['costas','Costas · cima']],all=[],report=[];
const cardWidth=340,cardHeight=380;
for(const [direction,title] of directions){
  const file=new URL(direction+'.png',folder),meta=await sharp(fileURLToPath(file)).metadata();
  if(!meta.hasAlpha||meta.width%4||meta.height%3)throw new Error('Prancha inválida: '+direction);
  const width=meta.width/4,height=meta.height/3,frames=[],cards=[];
  const isolated=version==='rugido-v2'?null:await extractSheetFigures(fileURLToPath(file));
  const header=Buffer.from(`<svg width="340" height="380"><rect width="340" height="380" rx="16" fill="#33382e"/><text x="170" y="28" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#e7dcc5">${title}</text></svg>`);
  for(let index=0;index<12;index++){
    const frame=isolated?isolated.frames[index]:await sharp(fileURLToPath(file)).extract({left:(index%4)*width,top:Math.floor(index/4)*height,width,height}).png().toBuffer();
    await writeFile(new URL(`${direction}-${String(index+1).padStart(2,'0')}.png`,framesFolder),frame);frames.push(frame);
    const image=await sharp(frame).resize(324,324,{fit:'contain'}).png().toBuffer();
    cards.push(await sharp(header).composite([{input:image,left:8,top:44}]).png().toBuffer());
  }
  await sharp(frames,{join:{animated:true}}).gif({delay:150,loop:0,effort:6}).toFile(fileURLToPath(new URL(direction+'-animado.gif',folder)));
  all.push(cards);report.push({direction,width:meta.width,height:meta.height,alpha:meta.hasAlpha,frames:frames.length});
}
const combined=[];
for(let index=0;index<12;index++){
  combined.push(await sharp({create:{width:cardWidth*2,height:cardHeight*2,channels:4,background:'#24291f'}}).composite(all.map((frames,i)=>({input:frames[index],left:(i%2)*cardWidth,top:Math.floor(i/2)*cardHeight}))).png().toBuffer());
}
await sharp(combined,{join:{animated:true}}).gif({delay:150,loop:0,effort:7}).toFile(fileURLToPath(new URL('quatro-direcoes.gif',folder)));
await writeFile(new URL('comparacao.png',folder),combined[0]);
await writeFile(new URL('manifest.json',folder),JSON.stringify({character:'Rosnaldo',action:'rugido',version:Number(version.match(/v(\d+)$/)?.[1]||2),design:'Grotesco cartunesco, cores planas, sangue e necrose; sem ossos expostos.',status:version==='rugido-v2'?'Integrado ao jogo como animação PNG quadro a quadro nas quatro direções.':'Nova referência cartunesca em avaliação; ainda não integrada ao jogo.',frameDurationMs:150,frameCount:12,columns:4,rows:3,events:{release:.47,impact:.55,contactFrame:7},directions:report},null,2)+'\n');
await writeFile(new URL('index.html',folder),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rosnaldo · Rugido</title><style>*{box-sizing:border-box}body{margin:0;background:#24291f;color:#e7dcc5;font:16px system-ui}main{max-width:900px;margin:auto;padding:28px}h1{font:32px Georgia;margin:0 0 10px}p{color:#b8b79e;line-height:1.5}.controls{position:sticky;top:0;display:flex;gap:15px;align-items:center;flex-wrap:wrap;padding:16px;background:#24291ff5;z-index:1}button,select{padding:9px 14px;border:1px solid #777b61;border-radius:6px;background:#424b37;color:#f1e5c9;font:inherit}input{accent-color:#a7767c;flex:1;min-width:120px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;background:#33382e;border:1px solid #50573f;border-radius:16px;overflow:hidden}figcaption{padding:14px 18px;display:flex;justify-content:space-between;gap:10px}img{display:block;width:100%;aspect-ratio:1;object-fit:contain;padding:12px}a{color:#dcc4a6;font-size:14px}footer{margin-top:20px;color:#a7ad95;font-size:14px}@media(max-width:500px){main{padding:14px}.grid{grid-template-columns:1fr}.controls{padding:12px 0}}</style><main><h1>Rosnaldo · Rugido</h1><p>Arte quadro a quadro nas quatro direções. Sangue, feridas e podridão, sem ossos expostos.</p><div class="controls"><button id="play">Pausar</button><input id="frame" aria-label="Quadro" type="range" min="0" max="11" value="0"><span id="counter">1 / 12</span><label>Velocidade <select id="speed"><option value="300">0,5×</option><option value="150" selected>1×</option><option value="100">1,5×</option></select></label></div><div class="grid">${directions.map(([id,title])=>`<figure><figcaption><b>${title}</b><a href="${id}.png">Abrir PNG</a></figcaption><img data-direction="${id}" src="quadros/${id}-01.png" alt="Rosnaldo: ${title}"></figure>`).join('')}</div><footer>12 quadros por direção · 150 ms por quadro · fundo transparente. Estas pranchas serão a referência para a etapa vetorial.</footer></main><script>let frame=0,playing=true,last=performance.now();const slider=document.getElementById('frame'),play=document.getElementById('play'),counter=document.getElementById('counter'),speed=document.getElementById('speed');for(const direction of ${JSON.stringify(directions.map(d=>d[0]))})for(let n=1;n<=12;n++){const im=new Image();im.src='quadros/'+direction+'-'+String(n).padStart(2,'0')+'.png';}function draw(){slider.value=frame;counter.textContent=(frame+1)+' / 12';document.querySelectorAll('img[data-direction]').forEach(im=>im.src='quadros/'+im.dataset.direction+'-'+String(frame+1).padStart(2,'0')+'.png');}play.onclick=()=>{playing=!playing;play.textContent=playing?'Pausar':'Reproduzir';last=performance.now();};slider.oninput=()=>{frame=Number(slider.value);playing=false;play.textContent='Reproduzir';draw();};function tick(now){if(playing&&now-last>=Number(speed.value)){frame=(frame+1)%12;last=now;draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);</script></html>`);
if(version==='rugido-v4'||version==='rugido-v5'){
  const page=new URL('index.html',folder),manifestFile=new URL('manifest.json',folder);
  await writeFile(page,(await readFile(page,'utf8')).replace('Estas pranchas serão a referência para a etapa vetorial.','Quadros PNG integrados ao jogo.'));
  const manifest=JSON.parse(await readFile(manifestFile,'utf8'));
  manifest.status='Integrado ao jogo como animação PNG quadro a quadro nas quatro direções.';
  await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
}
console.log(JSON.stringify({output:fileURLToPath(folder),directions:report,preview:'quatro-direcoes.gif'}));
