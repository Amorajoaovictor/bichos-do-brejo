import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SQUIRREL_IDLE_EXPOSURE,SQUIRREL_IDLE_POSES,SQUIRREL_IDLE_VIEWS } from '../dist/squirrel-idle-frames.js';

const art=new URL('../art/esquilo/idle-v2/',import.meta.url);
const file=(name)=>fileURLToPath(new URL(name,art));
const size=384,scale=size/512,transparent={r:0,g:0,b:0,alpha:0};
const raw=path=>sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
await mkdir(file('quadros'),{recursive:true});

function splitAtGaps(data,{width,height},region,axis,count){
  const vertical=axis==='y',start=vertical?region.top:region.left,end=vertical?region.bottom:region.right;
  const spans=[];let from=-1;
  for(let pos=start;pos<=end;pos++){
    let solid=0;
    for(let other=vertical?region.left:region.top;pos<end&&other<(vertical?region.right:region.bottom);other++){
      const x=vertical?other:pos,y=vertical?pos:other;
      if(data[(y*width+x)*4+3]>=48&&++solid>=3)break;
    }
    if(solid>=3&&from===-1)from=pos;
    if(solid<3&&from!==-1){spans.push([from,pos]);from=-1;}
  }
  if(spans.length<count)throw new Error(`Esperava ${count} faixas no eixo ${axis}, encontrei ${spans.length} (${width}×${height}).`);
  const gaps=spans.slice(1).map(([start],i)=>({i:i+1,length:start-spans[i][1]}))
    .sort((a,b)=>b.length-a.length).slice(0,count-1).map(({i})=>i).sort((a,b)=>a-b);
  const cuts=[0,...gaps,spans.length];
  return cuts.slice(0,-1).map((start,i)=>[spans[start][0],spans[cuts[i+1]-1][1]]);
}
function geometry(data,{width},region){
  let left=Infinity,right=-1,top=Infinity,bottom=-1;
  for(let y=region.top;y<region.bottom;y++)for(let x=region.left;x<region.right;x++){
    if(data[(y*width+x)*4+3]<48)continue;
    left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
  }
  if(bottom<0)throw new Error('Quadro vazio.');
  let footSum=0,footCount=0;
  for(let y=Math.max(top,bottom-Math.round((bottom-top)*.14));y<bottom;y++)for(let x=left;x<right;x++){
    if(data[(y*width+x)*4+3]>=100){footSum+=x;footCount++;}
  }
  return {left,right,top,bottom,height:bottom-top,footX:footSum/footCount};
}

const results={};
for(const view of SQUIRREL_IDLE_VIEWS){
  const sheet=file(`${view}-prancha.png`);
  const {data,info}=await raw(sheet);
  const area={left:0,top:0,right:info.width,bottom:info.height};
  const cuts=splitAtGaps(data,info,area,'y',2).flatMap(([top,bottom])=>{
    const columns=splitAtGaps(data,info,{...area,top,bottom},'x',4);
    return columns.map(([left,right])=>geometry(data,info,{left,right,top,bottom}));
  });
  const reference=await raw(file(`../png-v1/quadros/${view}-0.png`));
  const base=geometry(reference.data,reference.info,{left:0,top:0,right:reference.info.width,bottom:reference.info.height});
  const ordered=cuts.map(({height})=>height).sort((a,b)=>a-b);
  const factor=base.height/((ordered[3]+ordered[4])/2)*scale;
  results[view]=await Promise.all(cuts.map(async (pose,i)=>{
    const left=Math.max(0,pose.left-2),top=Math.max(0,pose.top-2);
    const width=Math.min(info.width,pose.right+2)-left,height=Math.min(info.height,pose.bottom+2)-top;
    const sprite=await sharp(sheet).extract({left,top,width,height}).resize(Math.round(width*factor)).png().toBuffer();
    const x=Math.round(base.footX*scale-(pose.footX-left)*factor),y=Math.round(base.bottom*scale-(pose.bottom-top)*factor);
    const {width:w,height:h}=await sharp(sprite).metadata();
    if(x<0||y<0||x+w>size||y+h>size)throw new Error(`Recorte sem margem: ${view}/${i+1}.`);
    await sharp({create:{width:size,height:size,channels:4,background:transparent}}).composite([{input:sprite,left:x,top:y}])
      .png().toFile(file(`quadros/${view}-${i}.png`));
    return {source:[left,top,width,height],placed:[x,y,w,h]};
  }));
  console.log(`${view}: ${cuts.length} poses em PNG`);
}

const frameWidth=584,frameHeight=432,tileW=292,tileH=216;
const labels=['Direita','Esquerda','Frente','Costas'];
const panel=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="584" height="432"><path fill="#31382d" d="M0 0h584v432H0z"/>${labels.map((label,i)=>{
  const x=i%2*292,y=Math.floor(i/2)*216;
  return `<rect x="${x+7}" y="${y+7}" width="278" height="202" rx="7" fill="#d1c8ab"/><ellipse cx="${x+146}" cy="${y+181}" rx="51" ry="6" fill="#64563c" opacity=".22"/><text x="${x+20}" y="${y+32}" font-family="sans-serif" font-size="14" fill="#3c3e29">${label}</text>`;
}).join('')}</svg>`);
const frames=await Promise.all(Array.from({length:SQUIRREL_IDLE_POSES},async(_,i)=>{
  const layers=await Promise.all(SQUIRREL_IDLE_VIEWS.map(async(view,j)=>({
    input:await sharp(file(`quadros/${view}-${i}.png`)).resize(258).extract({left:0,top:61,width:258,height:195}).png().toBuffer(),
    left:j%2*tileW+17,top:Math.floor(j/2)*tileH+14,
  })));
  return sharp(panel).composite(layers).ensureAlpha().raw().toBuffer();
}));
await sharp(Buffer.concat(SQUIRREL_IDLE_EXPOSURE.map(([i])=>frames[i])),{
  raw:{width:frameWidth,height:frameHeight*SQUIRREL_IDLE_EXPOSURE.length,channels:4,pageHeight:frameHeight},
}).gif({loop:0,delay:SQUIRREL_IDLE_EXPOSURE.map(([,ms])=>ms),dither:.45}).toFile(file('repouso-quatro-vistas.gif'));
await writeFile(file('previa-dados.js'),`window.idleExposure=${JSON.stringify(SQUIRREL_IDLE_EXPOSURE)};\n`);
await writeFile(file('manifest.json'),JSON.stringify({poses:SQUIRREL_IDLE_POSES,exposure:SQUIRREL_IDLE_EXPOSURE,views:results},null,2)+'\n');
