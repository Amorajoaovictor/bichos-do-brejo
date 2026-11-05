import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../art/esquilo/png-v1/',import.meta.url),size=512,views=['right','left','down','up'];
await mkdir(new URL('quadros/',root),{recursive:true});
function runs(values,threshold,gap=10){
  const groups=[];let start=-1,last=-1;
  for(let i=0;i<values.length;i++)if(values[i]>threshold){if(start<0)start=i;last=i;}else if(start>=0&&i-last>gap){groups.push([start,last+1]);start=-1;}
  if(start>=0)groups.push([start,last+1]);return groups;
}
async function extract(file,count){
  const {data,info}=await sharp(fileURLToPath(new URL(file,root))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,rows=Array(h).fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32)rows[y]++;
  const bands=runs(rows,4,2);if(bands.length!==count)throw new Error(`${file}: ${bands.length} linhas, esperado ${count}: ${JSON.stringify(bands)}`);
  const result=[];
  for(const [top,bottom] of bands){
    const cols=Array(w).fill(0);
    for(let y=top;y<bottom;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32)cols[x]++;
    const columns=runs(cols,1,14);if(columns.length!==4)throw new Error(`${file} linha ${top}: ${JSON.stringify(columns)}`);
    result.push(await Promise.all(columns.map(async([left,right])=>{
      // Keep a one-pixel alpha margin, then trim only transparent outer pixels.
      const x=Math.max(0,left-2),y=Math.max(0,top-2),width=Math.min(w-x,right-left+4),height=Math.min(h-y,bottom-top+4);
      const cut=await sharp(fileURLToPath(new URL(file,root))).extract({left:x,top:y,width,height}).png().toBuffer();
      const cropped=await sharp(cut).trim({threshold:1}).png().toBuffer();
      const meta=await sharp(cropped).metadata();return {buffer:cropped,width:meta.width,height:meta.height};
    })));
  }
  return {frames:result,bands,alpha:info.channels===4};
}
const motion=await extract('movimentos.png',6),reactions=await extract('reacoes.png',3);
const baseScale=405/Math.max(...motion.frames.flat().map(frame=>frame.width));
const frames=[];
for(let row=0;row<9;row++)for(let col=0;col<4;col++){
  const source=row<6?motion.frames[row][col]:reactions.frames[row-6][col];
  const scale=row<6?baseScale:baseScale*motion.frames[0][col].width/reactions.frames[0][col].width;
  const width=Math.round(source.width*scale),height=Math.round(source.height*scale);
  if(width>size-16||height>size-16)throw new Error('Quadro sem margem suficiente.');
  const sprite=await sharp(source.buffer).resize(width,height).png().toBuffer();
  const output=await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}}).composite([{input:sprite,left:Math.round((size-width)/2),top:452-height}]).png().toBuffer();
  await writeFile(new URL(`quadros/${views[col]}-${row}.png`,root),output);frames.push({view:views[col],pose:row,width,height});
}
const sequences={idle:[0,1,0,0,1,0],walk:[2,3,2,3],throw:[0,4,4,5,5,0],hit:[6,6,0],bleed:[6,0],death:[6,7,8,8]};
for(const [action,sequence] of Object.entries(sequences)){
  const width=640,height=640,images=[];
  for(const pose of sequence){
    images.push(await sharp({create:{width,height,channels:4,background:'#30382c'}}).composite(await Promise.all(views.map(async(view,i)=>({input:await sharp(fileURLToPath(new URL(`quadros/${view}-${pose}.png`,root))).resize(320,320).png().toBuffer(),left:i%2*320,top:Math.floor(i/2)*320})))).png().toBuffer());
  }
  const raws=await Promise.all(images.map(buffer=>sharp(buffer).raw().toBuffer()));
  const delay=action==='throw'?158:action==='walk'?80:action==='death'?270:120;
  await sharp(Buffer.concat(raws),{raw:{width,height:height*raws.length,channels:4,pageHeight:height}}).gif({loop:action==='death'?1:0,delay:Array(raws.length).fill(delay)}).toFile(fileURLToPath(new URL(`${action}.gif`,root)));
}
await sharp({create:{width:1024,height:512,channels:4,background:'#30382c'}}).composite(await Promise.all(views.map(async(view,i)=>({input:await sharp(fileURLToPath(new URL(`quadros/${view}-0.png`,root))).resize(256,256).png().toBuffer(),left:i*256,top:128})))).png().toFile(fileURLToPath(new URL('quatro-vistas.png',root)));
await writeFile(new URL('manifest.json',root),JSON.stringify({character:'Esquilo Histérico',format:'PNG transparente',integrated:true,views,posesPerView:9,frames:36,sequences,timing:{idle:.72,walk:.32,throw:.95,hit:.52,bleed:.7,death:1.05,release:.5,impact:.78},stats:{hp:12,damage:3,range:3,move:3,initiative:9},sourceSheets:['movimentos.png','reacoes.png'],cuts:{motion:motion.bands,reactions:reactions.bands},frameBounds:frames},null,2));
await writeFile(new URL('index.html',root),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Esquilo Histérico · animações</title><style>*{box-sizing:border-box}body{background:#242b22;color:#e5dbc2;font:16px system-ui;margin:0}main{max-width:1000px;margin:auto;padding:28px}h1{font:italic 34px Georgia}a{color:#d5c493}.controls{display:flex;gap:14px;flex-wrap:wrap;align-items:center;position:sticky;top:0;padding:16px;background:#242b22}button,select{background:#465238;color:inherit;padding:9px;border:1px solid #89926b;font:inherit}.grid{display:grid;grid-template-columns:1fr 1fr}.grid img{width:100%;background:#30382c}.grid figure{margin:8px}.grid figcaption{text-align:center}input{max-width:160px}p{line-height:1.6;color:#b9bca3}@media(max-width:600px){main{padding:12px}.controls{gap:8px;padding:8px}}</style><main><a href="/">← Jogar</a><h1>Esquilo Histérico</h1><p>Inimigo fraco e móvel. 12 de vida · Nozada: 3 de dano, alcance 3 · corre até 3 casas por turno. Primeiro encontro com três esquilos, seguido por Rosnaldo.</p><div class="controls"><select id="action">${Object.keys(sequences).map((key,i)=>`<option value="${key}">${['Repouso agitado','Corrida','Nozada','Dano','Sangramento','Derrota'][i]}</option>`).join('')}</select><button id="play">Pausar</button><input id="frame" type="range" min="0" max="5" value="0"><span id="count"></span><select id="speed"><option value=".5">0,5×</option><option selected value="1">1×</option><option value="1.5">1,5×</option></select></div><div class="grid">${views.map((view,i)=>`<figure><figcaption>${['Direita','Esquerda','Frente','Costas'][i]}</figcaption><img data-view="${view}" src="quadros/${view}-0.png" alt="Esquilo: ${view}"></figure>`).join('')}</div><p>Pranchas originais preservadas. Nozada solta a noz em 50% e causa dano em 78% da ação. Derrota segura o último quadro.</p></main><script>const sequences=${JSON.stringify(sequences)},durations={idle:.72,walk:.32,throw:.95,hit:.52,bleed:.7,death:1.05};let playing=true,elapsed=0,index=0,last=performance.now();const action=document.getElementById('action'),frame=document.getElementById('frame'),play=document.getElementById('play');function show(){const seq=sequences[action.value];frame.max=seq.length-1;frame.value=index;document.getElementById('count').textContent=(index+1)+' / '+seq.length;for(const img of document.querySelectorAll('[data-view]'))img.src='quadros/'+img.dataset.view+'-'+seq[index]+'.png';}play.onclick=()=>{playing=!playing;if(playing&&action.value==='death'&&index===3){elapsed=0;index=0;}play.textContent=playing?'Pausar':'Reproduzir';};action.onchange=()=>{elapsed=0;index=0;show();};frame.oninput=()=>{playing=false;play.textContent='Reproduzir';index=+frame.value;elapsed=index/sequences[action.value].length*durations[action.value];show();};function tick(now){if(playing){elapsed+=(now-last)/1000*+document.getElementById('speed').value;const duration=durations[action.value],seq=sequences[action.value];if(action.value==='death'&&elapsed>=duration){elapsed=duration;playing=false;play.textContent='Reproduzir';}index=Math.min(seq.length-1,Math.floor((action.value==='death'?elapsed:elapsed%duration)/duration*seq.length));show();}last=now;requestAnimationFrame(tick);}show();requestAnimationFrame(tick);</script>`);
console.log(JSON.stringify({frames:frames.length,cuts:{motion:motion.bands,reactions:reactions.bands}}));
