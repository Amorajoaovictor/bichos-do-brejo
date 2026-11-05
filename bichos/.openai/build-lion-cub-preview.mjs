import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {LION_CUB_STATS} from '../dist/encounters.js';
import {LION_CUB_VIEWS,LION_CUB_POSES,LION_CUB_LAYOUT,LION_CUB_TIMING,LION_CUB_EVENTS,LION_CUB_SEQUENCES,LION_CUB_STOPS,LION_CUB_ALIASES,lionCubFrame,lionCubSummonPose} from '../dist/lion-cub-frames.js';

const root=new URL('../art/leaozinho/png-v1/',import.meta.url);
const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
function runs(values,threshold=2,gap=1){
  const result=[];let start=-1,last=-1;
  for(let i=0;i<values.length;i++){
    if(values[i]>threshold){if(start<0)start=i;last=i;}
    else if(start>=0&&i-last>gap){result.push([start,last+1]);start=-1;}
  }
  if(start>=0)result.push([start,last+1]);return result;
}
function partitions(projection,count,gap){
  const bands=runs(projection,2,gap),length=projection.length;
  if(bands.length===count){
    const boundaries=[0,...bands.slice(1).map((band,i)=>Math.floor((bands[i][1]+band[0])/2)),length];
    return {mode:'gutters',bands,cells:bands.map((_,i)=>[boundaries[i],boundaries[i+1]])};
  }
  // Grid fallback is allowed only after looking for real transparent gutters.
  // Per-cell component validation below refuses a grid that cuts anatomy.
  return {mode:'grid',bands,cells:Array.from({length:count},(_,i)=>[Math.round(i*length/count),Math.round((i+1)*length/count)])};
}

// Connected foreground checks distinguish a whole animal from a neighboring
// tail, paw, or a few alpha specks left by background removal. These checks do
// not repaint the source. Extraction retains its original pixels and fringe.
function components(data,width,height,left,top,right,bottom){
  const w=right-left,h=bottom-top,seen=new Uint8Array(w*h),result=[];
  for(let offset=0;offset<seen.length;offset++){
    const ox=offset%w,oy=Math.floor(offset/w);
    if(seen[offset]||data[((oy+top)*width+ox+left)*4+3]<=32)continue;
    const queue=[offset];seen[offset]=1;let x0=w,y0=h,x1=0,y1=0;
    for(let k=0;k<queue.length;k++){
      const p=queue[k],x=p%w,y=Math.floor(p/w);
      x0=Math.min(x0,x);x1=Math.max(x1,x+1);y0=Math.min(y0,y);y1=Math.max(y1,y+1);
      // Eight-way adjacency retains thin diagonals in the mane and tail.
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;
        if(nx<0||nx>=w||ny<0||ny>=h)continue;
        const n=ny*w+nx;
        if(!seen[n]&&data[((ny+top)*width+nx+left)*4+3]>32){seen[n]=1;queue.push(n);}
      }
    }
    result.push({pixels:queue.length,left:left+x0,top:top+y0,right:left+x1,bottom:top+y1});
  }
  return result.sort((a,b)=>b.pixels-a.pixels);
}

export async function extractLionCubSheet(file,rowCount){
  const input=await readFile(new URL(file,root));
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height}=info,columns=Array(width).fill(0);let transparent=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const alpha=data[(y*width+x)*4+3];if(alpha===0)transparent++;if(alpha>32)columns[x]++;
  }
  if(transparent<width*height*.01)throw new Error(`${file}: a prancha precisa de fundo transparente.`);
  const columnCuts=partitions(columns,4,8),frames=Array.from({length:rowCount},()=>[]),rowCuts=[];
  for(let col=0;col<4;col++){
    const [left,right]=columnCuts.cells[col],rows=Array(height).fill(0);
    for(let y=0;y<height;y++)for(let x=left;x<right;x++)if(data[(y*width+x)*4+3]>32)rows[y]++;
    // Each view has its own vertical gutters. Unioning all columns can merge
    // adjacent rows when one mane rises above another view's feet.
    const cuts=partitions(rows,rowCount,1);rowCuts.push(cuts);
    for(let row=0;row<rowCount;row++){
      const [top,bottom]=cuts.cells[row],found=components(data,width,height,left,top,right,bottom);
      if(!found.length||found[0].pixels<100)throw new Error(`${file}: pose ${row}, ${LION_CUB_VIEWS[col]} vazia.`);
      const body=found[0];
      if(found[1]?.pixels>body.pixels*.1)throw new Error(`${file}: dois desenhos no recorte ${row}/${col}; revise as calhas.`);
      if((left>0&&body.left<=left)||(right<width&&body.right>=right)||(top>0&&body.top<=top)||(bottom<height&&body.bottom>=bottom)){
        throw new Error(`${file}: a grade atravessa o desenho ${row}/${col}; nenhum quadro foi salvo.`);
      }
      // Include real detached details, ignoring only tiny isolated alpha noise.
      const details=found.filter(component=>component.pixels>=20);
      const bounds={left:Math.min(...details.map(c=>c.left)),top:Math.min(...details.map(c=>c.top)),right:Math.max(...details.map(c=>c.right)),bottom:Math.max(...details.map(c=>c.bottom))};
      const x=Math.max(left,bounds.left-2),y=Math.max(top,bounds.top-2);
      const crop={left:x,top:y,width:Math.min(right,bounds.right+2)-x,height:Math.min(bottom,bounds.bottom+2)-y};
      const buffer=await sharp(input).extract(crop).png().toBuffer();
      frames[row][col]={buffer,crop,bounds,body,cell:{left,top,right,bottom},majorComponents:found.filter(c=>c.pixels>body.pixels*.1).length,ignoredSpecks:found.filter(c=>c.pixels<20).reduce((sum,c)=>sum+c.pixels,0)};
    }
  }
  // A single anchor per sheet and view, shared by all its poses. No per-pose
  // horizontal recentering: a reaching paw or curling tail keeps its motion.
  const anchors=LION_CUB_VIEWS.map((_,col)=>median(frames.map(row=>(row[col].bounds.left+row[col].bounds.right)/2)));
  return {file,input,width,height,frames,anchors,cuts:{columns:columnCuts,rowsByView:rowCuts}};
}

function previewHTML(){
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Leãozinho · animações</title>
<style>*{box-sizing:border-box}body{margin:0;background:#242b22;color:#e5dbc2;font:16px system-ui}main{max-width:1000px;margin:auto;padding:24px}h1{font:italic 34px Georgia}.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;position:sticky;top:0;padding:12px;background:#242b22;z-index:1}button,select{font:inherit;padding:8px;background:#465238;color:inherit;border:1px solid #89926b}input{max-width:160px}.grid{display:grid;grid-template-columns:1fr 1fr}.grid figure{margin:8px}.grid figcaption{text-align:center}.stage{overflow:hidden;background:#30382c;aspect-ratio:1;position:relative}.stage:after{content:'';position:absolute;left:8%;right:8%;top:${LION_CUB_LAYOUT.ground/LION_CUB_LAYOUT.size*100}%;border-top:1px solid #89926b44}.grid img{display:block;width:100%;transform-origin:50% ${LION_CUB_LAYOUT.ground/LION_CUB_LAYOUT.size*100}%}a{color:#d5c493}p{line-height:1.6}#status{color:#b9bca3}@media(max-width:600px){main{padding:10px}.controls{gap:8px;padding:8px}.grid figure{margin:3px}}</style></head>
<body><main><a href="/">← Jogar</a><h1>Leãozinho</h1><p>Mordidinha · quatro vistas. Mesma escala em todos os desenhos; patas e cauda preservadas.</p>
<div class="controls"><label>Ação <select id="action">${Object.keys(LION_CUB_SEQUENCES).map((key,i)=>`<option value="${key}">${['Repouso','Caminhada','Mordidinha','Dano','Sangramento','Derrota','Aparição'][i]}</option>`).join('')}</select></label><button id="play" disabled>Pausar</button><label>Velocidade <select id="speed"><option value=".5">0,5×</option><option value="1" selected>1×</option><option value="1.5">1,5×</option></select></label><label>Quadro <input id="frame" type="range" min="0" max="2" value="0"></label><output id="count"></output><label>Desenho <select id="pose"><option value="">Pela ação</option>${LION_CUB_POSES.map((name,i)=>`<option value="${i}">${i} · ${name}</option>`).join('')}</select></label></div>
<div class="grid">${LION_CUB_VIEWS.map((view,i)=>`<figure><figcaption>${['Direita','Esquerda','Frente','Costas'][i]}</figcaption><div class="stage"><img data-view="${view}" src="quadros/${view}-0.png" alt="Leãozinho: ${['direita','esquerda','frente','costas'][i]}"></div></figure>`).join('')}</div>
<p id="status" role="status">Carregando os 36 desenhos…</p><p>Mordida: 0,85 s, contato em 56% (0,476 s). Derrota: 1,05 s; segura o último desenho. Aparição: 0,45 s. Espaço pausa ou retoma.</p></main>
<script type="module">
import {LION_CUB_VIEWS,LION_CUB_POSES,LION_CUB_SEQUENCES,LION_CUB_STOPS,LION_CUB_TIMING,LION_CUB_LAYOUT,lionCubFrame,lionCubSequenceIndex,lionCubProgress,lionCubFrameURL,lionCubSummonPose} from '/lion-cub-frames.js';
const action=document.getElementById('action'),play=document.getElementById('play'),speed=document.getElementById('speed'),frame=document.getElementById('frame'),pose=document.getElementById('pose'),count=document.getElementById('count'),status=document.getElementById('status'),images=[...document.querySelectorAll('[data-view]')];
let playing=true,elapsed=0,last=performance.now();
function show(){
 const p=lionCubProgress(action.value,elapsed),index=lionCubSequenceIndex(action.value,p),drawing=pose.value===''?lionCubFrame(action.value,p):Number(pose.value);
 frame.max=LION_CUB_SEQUENCES[action.value].length-1;frame.value=index;count.textContent=(index+1)+' / '+LION_CUB_SEQUENCES[action.value].length+' · desenho '+drawing;
 const appearance=action.value==='summon'&&pose.value===''?lionCubSummonPose(p):lionCubSummonPose(1);
 for(const img of images){const url=lionCubFrameURL(img.dataset.view,drawing);if(img.getAttribute('src')!==url)img.setAttribute('src',url);img.style.transform='translateY('+(-appearance.rise/LION_CUB_LAYOUT.spriteSize*100)+'%) scale('+appearance.scale+')';img.style.opacity=appearance.opacity;}
 play.textContent=playing?'Pausar':'Reproduzir';
}
play.onclick=()=>{if(!playing){if(pose.value!==''){pose.value='';elapsed=0;}if(elapsed>=LION_CUB_TIMING[action.value]&&['death','summon'].includes(action.value))elapsed=0;}playing=!playing;show();};
action.onchange=()=>{pose.value='';elapsed=0;show();};
frame.oninput=()=>{pose.value='';playing=false;elapsed=LION_CUB_STOPS[action.value][Number(frame.value)]*LION_CUB_TIMING[action.value];show();};
pose.onchange=()=>{playing=false;show();};
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!event.target.matches('input,select,button')){event.preventDefault();play.click();}});
function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing){elapsed+=dt*Number(speed.value);if(['death','summon'].includes(action.value)&&elapsed>=LION_CUB_TIMING[action.value]){elapsed=LION_CUB_TIMING[action.value];playing=false;}show();}requestAnimationFrame(tick);}
try{await Promise.all(LION_CUB_VIEWS.flatMap(view=>LION_CUB_POSES.map(async(_,i)=>{const img=new Image();img.src=lionCubFrameURL(view,i);await img.decode();})));status.textContent='36 desenhos carregados. Arraste o quadro ou escolha um desenho para inspecionar.';play.disabled=false;show();last=performance.now();requestAnimationFrame(tick);}catch(error){status.textContent='Falha ao carregar os desenhos: '+error.message;}
</script></body></html>`;
}

async function cutOverlay(sheet){
  const rects=sheet.frames.flat().map(frame=>{const {left,top,width,height}=frame.crop;return `<rect x="${left}" y="${top}" width="${width}" height="${height}" fill="none" stroke="#4dffa5" stroke-width="1"/>`;}).join('');
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}">${rects}</svg>`);
  await sharp(sheet.input).composite([{input:svg}]).png().toFile(fileURLToPath(new URL(`cortes-${sheet.file}`,root)));
}

export async function buildLionCubPreview(){
  // Read and validate both originals before creating or replacing any outputs.
  const motion=await extractLionCubSheet('movimentos.png',5),reactions=await extractLionCubSheet('reacoes.png',4);
  const sources=Array.from({length:9},(_,pose)=>LION_CUB_VIEWS.map((view,col)=>{
    const sheet=pose<5?motion:reactions,source=sheet.frames[pose<5?pose:pose-5][col];
    return {...source,view,pose,sheet:sheet.file,anchorX:sheet.anchors[col]};
  })).flat();
  const {size,ground,margin,spriteSize}=LION_CUB_LAYOUT;
  // One scale for all 36 drawings, including both source sheets and all views.
  // Fit the largest left/right extent and full height; never fit each pose.
  const extent=Math.max(...sources.flatMap(f=>[f.anchorX-f.crop.left,f.crop.left+f.crop.width-f.anchorX]));
  const scale=Math.min((size/2-margin-2)/extent,(ground-margin-2)/Math.max(...sources.map(f=>f.crop.height)));
  const output=new Map(),frameBounds=[];
  for(const source of sources){
    const resized=await sharp(source.buffer).resize({width:Math.max(1,Math.round(source.crop.width*scale))}).png().toBuffer();
    const metadata=await sharp(resized).metadata(),width=metadata.width,height=metadata.height;
    const left=Math.round(size/2+(source.crop.left-source.anchorX)*scale),top=ground-height;
    if(left<margin||top<margin||left+width>size-margin||top+height>size-margin)throw new Error(`Margem insuficiente: ${source.view}/${source.pose}.`);
    const buffer=await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}}).composite([{input:resized,left,top}]).png().toBuffer();
    output.set(`${source.view}/${source.pose}`,buffer);
    frameBounds.push({view:source.view,pose:source.pose,sheet:source.sheet,sourceCrop:source.crop,sourceBounds:source.bounds,sourceCell:source.cell,anchorX:source.anchorX,scale,left,top,width,height,majorComponents:source.majorComponents,ignoredAlphaSpecks:source.ignoredSpecks});
  }
  await mkdir(new URL('quadros/',root),{recursive:true});
  for(const [key,buffer] of output)await writeFile(new URL(`quadros/${key.replace('/','-')}.png`,root),buffer);
  await writeFile(new URL('index.html',root),previewHTML());
  const manifest={character:'Leãozinho',format:'PNG transparente',integrated:true,stats:{...LION_CUB_STATS},views:LION_CUB_VIEWS,poses:LION_CUB_POSES,posesPerView:9,frames:36,frameSize:size,sequences:LION_CUB_SEQUENCES,aliases:LION_CUB_ALIASES,stops:LION_CUB_STOPS,timing:LION_CUB_TIMING,events:LION_CUB_EVENTS,eventUnits:'normalized progress; bite impact at 0.476 seconds',loop:{idle:true,walk:true,bite:true,hit:true,bleed:true,death:false,summon:false},layout:LION_CUB_LAYOUT,uniformScale:scale,sourceSheets:[motion.file,reactions.file],cuts:{motion:motion.cuts,reactions:reactions.cuts},anchors:{motion:motion.anchors,reactions:reactions.anchors},frameBounds,verification:{singleAnimalPerCrop:frameBounds.every(f=>f.majorComponents===1),allFramesInsideMargins:true,perPoseScaling:false},gifsReady:false};
  await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2));
  console.log('36 PNGs, HTML e manifesto prontos; iniciando prévias e GIFs.');
  for(const sheet of [motion,reactions])await cutOverlay(sheet);
  const sheetThumbs=await Promise.all(sources.map(async f=>({input:await sharp(output.get(`${f.view}/${f.pose}`)).resize(256,256).png().toBuffer(),left:LION_CUB_VIEWS.indexOf(f.view)*256,top:f.pose*256})));
  await sharp({create:{width:1024,height:2304,channels:4,background:'#30382c'}}).composite(sheetThumbs).png().toFile(fileURLToPath(new URL('prancha-quadros.png',root)));
  await sharp({create:{width:1024,height:256,channels:4,background:'#30382c'}}).composite(sheetThumbs.slice(0,4)).png().toFile(fileURLToPath(new URL('quatro-vistas.png',root)));
  for(const action of Object.keys(LION_CUB_SEQUENCES)){
    const duration=LION_CUB_TIMING[action],stops=action==='summon'?Array.from({length:18},(_,i)=>i/18):LION_CUB_STOPS[action];
    const raws=[],delays=[];
    for(let i=0;i<stops.length;i++){
      const p=stops[i],pose=lionCubFrame(action,p),appearance=action==='summon'?lionCubSummonPose(i/(stops.length-1)):lionCubSummonPose(1);
      const composites=await Promise.all(LION_CUB_VIEWS.map(async(view,col)=>{
        const side=Math.round(320*appearance.scale);
        const {data,info}=await sharp(output.get(`${view}/${pose}`)).resize(side,side).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        for(let n=3;n<data.length;n+=4)data[n]=Math.round(data[n]*appearance.opacity);
        const input=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
        const groundY=320*ground/size;
        return {input,left:col%2*320+Math.round((320-side)/2),top:Math.floor(col/2)*320+Math.round(groundY*(1-appearance.scale)-appearance.rise/spriteSize*320)};
      }));
      const raw=await sharp({create:{width:640,height:640,channels:4,background:'#30382c'}}).composite(composites).raw().toBuffer();raws.push(raw);
      // GIF delays have 10 ms precision; cumulative rounding preserves duration.
      delays.push(Math.max(10,Math.round((stops[i+1]??1)*duration*100)*10-Math.round(p*duration*100)*10));
    }
    await sharp(Buffer.concat(raws),{raw:{width:640,height:640*raws.length,channels:4,pageHeight:640}}).gif({loop:action==='death'||action==='summon'?1:0,delay:delays}).toFile(fileURLToPath(new URL(`${action}.gif`,root)));
    console.log(`GIF ${action} pronto.`);
  }
  manifest.gifsReady=true;
  await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({frames:36,scale,verification:manifest.verification,preview:'/art/leaozinho/png-v1/index.html'}));
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  await buildLionCubPreview();
}
