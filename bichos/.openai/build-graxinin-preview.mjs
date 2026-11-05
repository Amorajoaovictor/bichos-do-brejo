import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Every action keeps its original generated sheet untouched; frames, GIFs and
// the viewer are derived files. Generated sheets rarely place their 4x3 grid on
// exact quarters or thirds, so the grid is measured from the transparent gutters
// instead of assumed: each frame is then cropped inside its real cell and never
// carries a fragment of a neighbouring pose.
const root=new URL('../art/graxinin/',import.meta.url);
const actions=JSON.parse(process.argv[2]||await readFile(new URL('../art/graxinin/preview-config.json',import.meta.url),'utf8'));
if(!actions.length)throw new Error('Informe as ações: [{"folder":"repouso-v1",...}]');

const viewer=(title)=>`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Graxinin · ${title}</title><style>*{box-sizing:border-box}body{margin:0;background:#24291f;color:#e7dcc5;font:16px system-ui}main{max-width:900px;margin:auto;padding:28px}h1{font:32px Georgia;margin:0 0 10px}p{color:#b8b79e;line-height:1.5}.controls{position:sticky;top:0;display:flex;gap:15px;align-items:center;flex-wrap:wrap;padding:16px;background:#24291ff5;z-index:1}button,select{padding:9px 14px;border:1px solid #777b61;border-radius:6px;background:#424b37;color:#f1e5c9;font:inherit}input{accent-color:#a7767c;flex:1;min-width:120px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;background:#33382e;border-radius:14px;padding:12px;overflow:hidden}figcaption{font-size:14px;color:#b8b79e;margin-bottom:8px}.grid img{width:100%;display:block}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style><main><h1>Graxinin · ${title}</h1><p>Estudo de movimento em quatro direções para orientar a animação vetorial. A lata deixa a mão no quadro 7; o projétil será animado separadamente. Use os controles para pausar e observar cada pose.</p><div class="controls"><button id="play">Pausar</button><label>Quadro <input id="frame" type="range" min="0" max="11" value="0"></label><span id="counter">1 / 12</span><select id="speed"><option value="100">1×</option><option value="200">0,5×</option><option value="67">1,5×</option></select></div><div class="grid">${['direita','esquerda','frente','costas'].map((d,i)=>`<figure><figcaption>${['Direita','Esquerda','Frente · baixo','Costas · cima'][i]}</figcaption><img data-direction="${d}" alt="${d}" src="quadros/${d}-01.png"></figure>`).join('')}</div></main><script>const frames=[...document.querySelectorAll('img[data-direction]')],range=document.getElementById('frame'),counter=document.getElementById('counter'),speed=document.getElementById('speed'),play=document.getElementById('play');let index=0,timer=null;const show=i=>{index=i;for(const img of frames)img.src='quadros/'+img.dataset.direction+'-'+String(i+1).padStart(2,'0')+'.png';range.value=i;counter.textContent=(i+1)+' / 12';};const stop=()=>{clearInterval(timer);timer=null;play.textContent='Reproduzir';};const start=()=>{stop();timer=setInterval(()=>show((index+1)%12),Number(speed.value));play.textContent='Pausar';};play.onclick=()=>timer?stop():start();range.oninput=()=>{stop();show(Number(range.value));};speed.onchange=()=>{if(timer)start();};show(0);start();</script>`;

// A gutter is a thin empty band; content is any run wider than a few pixels.
function bands(sums,threshold){
  const runs=[];let start=-1;
  for(let i=0;i<sums.length;i++){
    if(sums[i]>threshold){if(start<0)start=i;}
    else if(start>=0){runs.push([start,i-1]);start=-1;}
  }
  if(start>=0)runs.push([start,sums.length-1]);
  // Merge runs separated by a hairline gap so a stray antialiased pixel does not
  // split one pose into two bands.
  const merged=[];
  for(const run of runs){
    const last=merged[merged.length-1];
    if(last&&run[0]-last[1]<=4)last[1]=run[1];else merged.push([...run]);
  }
  return merged;
}
// Generated grids drift a few percent from exact thirds/quarters, so each inner
// boundary is placed on the emptiest line inside a window around its expected
// position. That lands inside the real transparent gutter without ever clipping a
// pose or borrowing a fragment from the next cell.
function gutters(sums,count){
  const size=sums.length,step=size/count,bounds=[];
  for(let i=1;i<count;i++){
    const expected=Math.round(i*step),window=Math.round(step*.16);
    let best=expected,value=Infinity;
    for(let at=Math.max(1,expected-window);at<=Math.min(size-2,expected+window);at++){
      const score=sums[at-1]+sums[at]+sums[at+1];
      if(score<value){value=score;best=at;}
    }
    bounds.push(best);
  }
  return bounds;
}
async function gridFor(path,w,h){
  const {data}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x,y)=>data[(y*w+x)*4+3];
  const rows=new Array(h).fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=alpha(x,y);if(a>24)rows[y]+=a;}
  const rowCuts=[0,...gutters(rows,3),h];
  // Columns are measured inside each row band: a wide pose can spill across the
  // sheet, and only the per-row gutter sits between two poses.
  const colsForRow=[];
  for(let band=0;band<3;band++){
    const cols=new Array(w).fill(0);
    for(let y=rowCuts[band];y<rowCuts[band+1];y++)for(let x=0;x<w;x++){const a=alpha(x,y);if(a>24)cols[x]+=a;}
    colsForRow.push([0,...gutters(cols,4),w]);
  }
  return {rows:rowCuts,colsForRow};
}

async function cleanCell(cell){
  const {data,info}=await sharp(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,seen=new Uint8Array(w*h),components=[];
  for(let start=0;start<w*h;start++){
    if(seen[start]||data[start*4+3]<=16)continue;
    const stack=[start],pixels=[];seen[start]=1;
    let minX=w,maxX=0,minY=h,maxY=0;
    while(stack.length){
      const at=stack.pop(),x=at%w,y=(at-x)/w;pixels.push(at);
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      for(const next of [at-1,at+1,at-w,at+w]){
        if(next<0||next>=w*h||seen[next])continue;
        const nx=next%w,ny=(next-nx)/w;if(Math.abs(nx-x)+Math.abs(ny-y)!==1)continue;
        if(data[next*4+3]<=16)continue;
        seen[next]=1;stack.push(next);
      }
    }
    components.push({pixels,minX,maxX,minY,maxY});
  }
  if(components.length<2)return cell;
  const main=components.reduce((a,b)=>a.pixels.length>=b.pixels.length?a:b);
  const gap=Math.max(6,Math.max(w,h)*.015);
  const nearMain=c=>c.minX-gap<=main.maxX&&c.maxX+gap>=main.minX&&c.minY-gap<=main.maxY&&c.maxY+gap>=main.minY;
  const inEdgeBand=c=>c.minY<h*.06||c.maxY>h*.94||c.minX<w*.045||c.maxX>w*.955;
  // Detached droplets next to the pose stay. Slivers of the next cell sit in the
  // outer band of the frame and are erased, whether or not they look attached.
  let removed=false;
  for(const component of components){
    if(component===main)continue;
    const speck=component.pixels.length<main.pixels.length*.25;
    if(!nearMain(component)||(speck&&inEdgeBand(component))){
      for(const at of component.pixels)data[at*4+3]=0;removed=true;
    }
  }
  if(!removed)return cell;
  return sharp(data,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
}
const report=[];
for(const entry of actions){
  const folder=new URL(entry.folder+'/',root),framesFolder=new URL('quadros/',folder);
  await mkdir(framesFolder,{recursive:true});
  const cards=[],meta=[],sizes=[];
  for(const direction of ['direita','esquerda','frente','costas']){
    const path=fileURLToPath(new URL(direction+'.png',folder));
    const info=await sharp(path).metadata();
    if(!info.hasAlpha)throw new Error('Prancha sem transparência: '+entry.folder+'/'+direction);
    const {rows,colsForRow}=await gridFor(path,info.width,info.height);
    const widths=[],heights=[];
    for(const cols of colsForRow)for(let i=0;i<4;i++)widths.push(cols[i+1]-cols[i]);
    for(let i=1;i<rows.length;i++)heights.push(rows[i]-rows[i-1]);
    sizes.push({w:Math.max(...widths),h:Math.max(...heights)});
    const frames=[],dirCards=[];
    for(let index=0;index<12;index++){
      const col=index%4,row=Math.floor(index/4),cols=colsForRow[row];
      const cellW=cols[col+1]-cols[col],cellH=rows[row+1]-rows[row];
      const raw=await sharp(path).extract({left:cols[col],top:rows[row],width:cellW,height:cellH}).png().toBuffer();
      const cell=await cleanCell(raw);
      frames.push({cell,width:cellW,height:cellH});
    }
    const size=512;
    const header=Buffer.from(`<svg width="${size}" height="${size+56}"><rect width="${size}" height="${size+56}" rx="16" fill="#33382e"/><text x="${size/2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#e7dcc5">${entry.title} · ${direction}</text></svg>`);
    const gifFrames=[];
    for(const [index,frame] of frames.entries()){
      // Register all supporting feet against the same floor without rescaling
      // individual drawings or changing their horizontal action displacement.
      const pixels=await sharp(frame.cell).ensureAlpha().raw().toBuffer();
      let first=frame.height,last=-1;
      for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++)if(pixels[(y*frame.width+x)*4+3]>24){first=Math.min(first,y);last=Math.max(last,y);}
      if(last<first)throw new Error('Quadro vazio: '+direction+'/'+index);
      const grounded=await sharp(frame.cell).extract({left:0,top:first,width:frame.width,height:last-first+1}).png().toBuffer();
      const padded=await sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:grounded,left:Math.round((size-frame.width)/2),top:size-24-(last-first+1)}]).png().toBuffer();
      await writeFile(new URL(`${direction}-${String(index+1).padStart(2,'0')}.png`,framesFolder),padded);gifFrames.push(padded);
      dirCards.push(await sharp(header).composite([{input:await sharp(padded).resize(size-16,size-16,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer(),left:8,top:44}]).png().toBuffer());
    }
    await sharp(gifFrames,{join:{animated:true}}).gif({delay:entry.frameDurationMs,loop:0,effort:6}).toFile(fileURLToPath(new URL(direction+'-animado.gif',folder)));
    cards.push(dirCards);meta.push({direction,sheet:[info.width,info.height],cells:{rows:[...new Set(heights)],cols:[...new Set(widths)]},frameSize:size,alpha:info.hasAlpha,frames:12});
  }
  const size=512,half=Math.round((size+56)*.5)*2;
  const combined=[];
  for(let index=0;index<12;index++){
    combined.push(await sharp({create:{width:half*2,height:half*2,channels:4,background:{r:36,g:41,b:31,alpha:1}}}).composite(cards.map((dirFrames,i)=>({input:dirFrames[index],left:(i%2)*half,top:Math.floor(i/2)*half}))).png().toBuffer());
  }
  await sharp(combined,{join:{animated:true}}).gif({delay:entry.frameDurationMs,loop:0,effort:7}).toFile(fileURLToPath(new URL('quatro-direcoes.gif',folder)));
  await writeFile(new URL('comparacao.png',folder),combined[0]);
  await writeFile(new URL('index.html',folder),viewer(entry.title));
  await writeFile(new URL('manifest.json',folder),JSON.stringify({character:'Graxinin',action:entry.action,version:1,design:'Guaxinim da referência do usuário; olhos assimétricos, cauda listrada e tampa nas costas.',status:entry.status,frameDurationMs:entry.frameDurationMs,frameCount:12,columns:4,rows:3,events:entry.events,directions:meta},null,2)+'\n');
  report.push({folder:entry.folder,action:entry.action,frames:48,frameSize:size,preview:'quatro-direcoes.gif'});
}
console.log(JSON.stringify({done:report},null,2));



