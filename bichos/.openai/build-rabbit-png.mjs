import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {extractSheetFigures} from './extract-sheet-figures.mjs';

const root=new URL('../art/farrapo/png-v1/',import.meta.url);
async function isolate(buffer){
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const w=info.width,h=info.height,seen=new Uint8Array(w*h),groups=[];
  for(let seed=0;seed<w*h;seed++){
    if(seen[seed]||data[seed*4+3]<8)continue;
    const group=[],stack=[seed];seen[seed]=1;
    while(stack.length){const at=stack.pop(),x=at%w;group.push(at);for(const n of [at-1,at+1,at-w,at+w])if(n>=0&&n<w*h&&Math.abs(n%w-x)<=1&&!seen[n]&&data[n*4+3]>=8){seen[n]=1;stack.push(n);}}
    groups.push(group);
  }
  groups.sort((a,b)=>b.length-a.length);
  const keep=new Uint8Array(w*h);for(const at of groups[0])keep[at]=1;
  for(let i=0;i<w*h;i++)if(!keep[i])data[i*4+3]=0;
  return sharp(data,{raw:{width:w,height:h,channels:4}}).trim({threshold:1}).png().toBuffer();
}
await mkdir(new URL('referencias/',root),{recursive:true});
const {figures}=await extractSheetFigures(fileURLToPath(new URL('quatro-vistas.png',root)),{columns:2,rows:2,frameSize:512});
const views=['right','left','down','up'];
for(let i=0;i<4;i++){
  const f=figures[i],height=f.bottom-f.top+1,width=f.right-f.left+1;
  const source=await sharp(fileURLToPath(new URL('quatro-vistas.png',root))).extract({left:f.left,top:f.top,width,height}).png().toBuffer();
  const sprite=await sharp(await isolate(source)).resize({height:448}).png().toBuffer();
  const meta=await sharp(sprite).metadata();
  await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:sprite,left:Math.round((512-meta.width)/2),top:480-meta.height}]).png().toFile(fileURLToPath(new URL(`referencias/${views[i]}.png`,root)));
}
if(process.argv.includes('--references')){console.log('Quatro referências PNG extraídas.');process.exit(0);}

function runs(values,gap=5){
  const out=[];let first=-1,last=-1;
  for(let i=0;i<values.length;i++){
    if(values[i]>2){if(first<0)first=i;last=i;}
    else if(first>=0&&i-last>gap){out.push([first,last+1]);first=-1;}
  }
  if(first>=0)out.push([first,last+1]);return out;
}
function cells(values,count){
  const edges=[0],step=values.length/count;
  for(let i=1;i<count;i++){
    const expected=Math.round(i*step),radius=Math.round(step*.18);let best=expected,score=Infinity;
    for(let p=expected-radius;p<=expected+radius;p++){
      const value=values[p-1]+values[p]+values[p+1];
      if(value<score||(value===score&&Math.abs(p-expected)<Math.abs(best-expected))){score=value;best=p;}
    }
    edges.push(best);
  }
  edges.push(values.length);return edges.slice(0,-1).map((left,i)=>[left,edges[i+1]]);
}
await mkdir(new URL('quadros/',root),{recursive:true});
const bounds=[];
for(const view of views){
  const file=fileURLToPath(new URL(`prancha-${view}.png`,root));
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,rows=new Array(h).fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32)rows[y]++;
  const rowBands=cells(rows,6);
  if(rowBands.length!==6)throw new Error(`${view}: esperadas 6 linhas, recebidas ${rowBands.length}: ${JSON.stringify(rowBands)}`);
  const cuts=[];
  for(const [top,bottom] of rowBands){
    const cols=new Array(w).fill(0);
    for(let y=top;y<bottom;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32)cols[x]++;
    const bands=cells(cols,4);
    if(bands.length!==4)throw new Error(`${view}: linha ${top}: esperadas 4 colunas: ${JSON.stringify(bands)}`);
    for(const [left,right] of bands){
      const cut=await isolate(await sharp(file).extract({left,top,width:right-left,height:bottom-top}).png().toBuffer());
      const meta=await sharp(cut).metadata();cuts.push({cut,width:meta.width,height:meta.height});
    }
  }
  // A single scale per view preserves shrinking crouches and horizontal falls.
  const scale=Math.min(448/cuts[0].height,480/Math.max(...cuts.map(c=>c.width)),480/Math.max(...cuts.map(c=>c.height)));
  for(let i=0;i<cuts.length;i++){
    let cut=cuts[i];
    if(view==='up'&&i===14){
      const buffer=await isolate(await sharp(fileURLToPath(new URL('contracao-costas.png',root))).png().toBuffer());
      const resized=await sharp(buffer).resize({height:cuts[13].height-1}).png().toBuffer(),meta=await sharp(resized).metadata();
      cut={cut:resized,width:meta.width,height:meta.height};
    }
    const width=Math.round(cut.width*scale),height=Math.round(cut.height*scale),top=480-height;
    let anchor=cut.width/2;
    if(i<20){
      const {data,info}=await sharp(cut.cut).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let sum=0,count=0;
      for(let y=Math.floor(info.height*.97);y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>64){sum+=x;count++;}
      if(count)anchor=sum/count;
    }
    const left=Math.max(8,Math.min(504-width,Math.round(256-anchor*scale)));
    await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:await sharp(cut.cut).resize(width,height).png().toBuffer(),left,top}]).png().toFile(fileURLToPath(new URL(`quadros/${view}-${String(i).padStart(2,'0')}.png`,root)));
    bounds.push({view,index:i,width,height,left,top});
  }
}
await writeFile(new URL('cortes.json',root),JSON.stringify(bounds,null,2));
await writeFile(new URL('manifest.json',root),JSON.stringify({character:'Farrapo',format:'PNG transparente',integrated:true,views,posesPerView:24,frames:96,frameSize:512,groundY:480,sourceSheets:views.map(view=>`prancha-${view}.png`),overrides:{'up-14':'contracao-costas.png'},rows:['idle','walk','rabbit','barrage','hit','death'],timing:{idle:1.92,walk:.48,rabbit:1.05,barrage:2.3,hit:.52,bleed:.7,death:1.15},events:{kickImpact:.48,firstPellet:.42,pelletInterval:.13,pelletFlight:.34,pellets:10},barrage:{closedEyes:[13,14],relief:15,flush:'barrageFlush compartilhada com animation.js',pulse:'barragePulse compartilhada com animation.js'},viewer:'index.html',generator:'.openai/build-rabbit-png.mjs',verification:'.openai/verify-rabbit-png.mjs'},null,2));
console.log(JSON.stringify({frames:bounds.length,views}));
