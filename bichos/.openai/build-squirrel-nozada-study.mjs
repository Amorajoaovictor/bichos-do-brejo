import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const art=new URL('../art/esquilo/nozada-v3/',import.meta.url);
const path=name=>fileURLToPath(new URL(name,art));
const width=660,height=320,ground=258,scale=.58;
const spriteWidth=324,spriteHeight=235,pivotX=162,pivotY=208;
const rabbitX=558;
const transparent={r:0,g:0,b:0,alpha:0};
const studies={
  acidente:{
    x:[0,383,768,1152,1536],y:[0,345,685,1024],
    pivots:[[218,312],[579,313],[955,312],[1320,312],[148,635],[560,638],
      [939,638],[1349,637],[218,953],[583,977],[943,983],[1365,980]],
    exposure:[170,100,80,80,110,150,170,90,80,85,125,300],
    travel:[[0,182,0],[300,184,0],[400,192,5],[550,193,0],[860,193,0],
      [945,219,0],[1025,295,11],[1110,363,0],[1235,418,0],[1440,418,0]],
  },
  susto:{
    x:[0,371,721,1080,1448],y:[0,358,727,1086],
    pivots:[[224,318],[579,319],[908,329],[1272,315],[183,663],[541,674],
      [911,668],[1210,673],[155,1009],[528,1016],[874,1020],[1199,1022]],
    exposure:[170,120,95,50,115,65,85,65,65,65,65,65,65,145,250],
    drawings:[0,1,2,3,4,5,6,7,8,9,10,9,10,11,11],
    travel:[[0,418,0],[295,421,0],[385,421,0],[434,410,43],[500,401,59],
      [560,398,43],[615,395,10],[650,393,0],[775,382,0],[845,341,13],
      [910,294,3],[975,245,12],[1040,193,3],[1100,149,8],[1180,124,0],[1300,121,0]],
  },
};

async function cutSprites(id,study){
  const source=sharp(path(`${id}-prancha.png`));
  return Promise.all(study.pivots.map(async ([x,y],i)=>{
    const row=Math.floor(i/4),col=i%4,left=study.x[col],top=study.y[row];
    const region={left,top,width:study.x[col+1]-left,height:study.y[row+1]-top};
    const sprite=await source.clone().extract(region).resize(Math.round(region.width*scale)).png().toBuffer();
    const output=path(`quadros/${id}-${i+1}.png`);
    await sharp({create:{width:spriteWidth,height:spriteHeight,channels:4,background:transparent}})
      .composite([{input:sprite,left:Math.round(pivotX+(left-x)*scale),top:Math.round(pivotY+(top-y)*scale)}]).png().toFile(output);
    return output;
  }));
}

function interpolate(points,ms){
  const next=points.findIndex(([time])=>time>ms);
  if(next===-1)return points.at(-1).slice(1);
  if(next===0)return points[0].slice(1);
  const [start,x,y]=points[next-1],[end,tx,ty]=points[next],p=(ms-start)/(end-start);
  return [x+(tx-x)*p,y+(ty-y)*p];
}
function nutAt(ms){
  if(ms<350||ms>=1110)return null;
  const [x,y]=interpolate([[350,265,184],[570,rabbitX-16,197],[781,457,ground-15],[1109,457,ground-15]],ms);
  const lift=ms<570?34*Math.sin((ms-350)/220*Math.PI):ms<781?21*Math.sin((ms-570)/211*Math.PI):0;
  return [x,y-lift,ms<781?(ms-350)*.015:6.47];
}
function frameData(id,study){
  const end=study.exposure.reduce((a,b)=>a+b,0),frames=[];
  for(let ms=0;ms<end;ms+=40){
    let elapsed=0;
    const i=study.exposure.findIndex(duration=>(elapsed+=duration)>ms);
    const drawing=study.drawings?.[i]??i;
    const [x,lift]=interpolate(study.travel,ms);
    const hit=id==='acidente'&&ms>=570&&ms<714;
    frames.push({pose:drawing+1,x:Math.round(x),lift:Math.round(lift),hit,nut:id==='acidente'?nutAt(ms):null});
  }
  return frames;
}

const svg=content=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`);
const backdrop='<rect width="660" height="320" fill="#d0cbb2"/><path fill="#bebc9f" d="M0 258h660v62H0z"/><path d="M0 258h660" stroke="#aba98c"/>';
const nutDrawing='<path fill="#e6a84d" d="M-10-3q-1 15 10 16 11-1 10-16z"/><path fill="#80502f" d="M-12-2q0-11 12-11T12-2z"/><path fill="none" d="m0-12 3-5"/>';
const nutSvg=([x,y,angle])=>`<g transform="translate(${x} ${y}) rotate(${angle*180/Math.PI})" stroke="#251b12" stroke-width="2.5" stroke-linejoin="round">${nutDrawing}</g>`;

await mkdir(path('quadros'),{recursive:true});
const rabbitDir=new URL('../art/farrapo/png-v1/quadros/',import.meta.url);
for(const [name,file] of [['farrapo','left-00.png'],['farrapo-impacto','left-16.png']]){
  await sharp(fileURLToPath(new URL(file,rabbitDir))).resize(222).png().toFile(path(`${name}.png`));
}
const animation={};
for(const [id,study] of Object.entries(studies)){
  const drawings=await cutSprites(id,study),frames=frameData(id,study);
  animation[id]=frames;
  const images=[];
  for(const frame of frames){
    const {pose,x,lift,hit,nut}=frame;
    const targetX=rabbitX+(hit?9:0);
    const scene=svg(`${backdrop}<ellipse cx="${x}" cy="260" rx="${39-lift*.22}" ry="6" fill="#57573b" opacity=".2"/><ellipse cx="${targetX}" cy="260" rx="34" ry="6" fill="#57573b" opacity=".2"/>`);
    // Use an oversized compositing surface to keep the left end of the run in frame.
    const layers=[{input:scene,left:100,top:0},{input:path(hit?'farrapo-impacto.png':'farrapo.png'),left:targetX-111+100,top:62},
      {input:drawings[pose-1],left:x-pivotX+100,top:ground-lift-pivotY}];
    if(nut)layers.push({input:svg(nutSvg(nut)),left:100,top:0});
    const composite=await sharp({create:{width:width+200,height,channels:4,background:transparent}}).composite(layers).png().toBuffer();
    images.push(await sharp(composite).extract({left:100,top:0,width,height}).raw().toBuffer());
  }
  const delays=images.map((_,i)=>i===images.length-1?560:40);
  await sharp(Buffer.concat(images),{raw:{width,height:height*images.length,channels:4,pageHeight:height}})
    .gif({loop:0,delay:delays,dither:.45}).toFile(path(`${id}.gif`));
  console.log(`${id}: ${drawings.length} poses, ${frames.length} quadros de prévia`);
}
await writeFile(path('previa-dados.js'),`window.nozadaStudy=${JSON.stringify({animation,nutDrawing,rabbitX,ground,pivotX,pivotY})};\n`);
