import { ZEBRA_SEQUENCES,ZEBRA_DURATIONS,ZEBRA_IMPACT } from '../dist/zebra-png-frames.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../art/zebra/png-v1/',import.meta.url),size=512,views=['right','left','down','up'];
await mkdir(new URL('quadros/',root),{recursive:true});
function runs(values,threshold,gap=10){
  const groups=[];let start=-1,last=-1;
  for(let i=0;i<values.length;i++)if(values[i]>threshold){if(start<0)start=i;last=i;}else if(start>=0&&i-last>gap){groups.push([start,last+1]);start=-1;}
  if(start>=0)groups.push([start,last+1]);return groups;
}
async function extract(file,count){
  const {data,info}=await sharp(fileURLToPath(new URL(file,root))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,rows=Array(h).fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>128)rows[y]++;
  const bands=runs(rows,4,0);if(bands.length!==count)throw new Error(`${file}: ${bands.length} linhas, esperado ${count}: ${JSON.stringify(bands)}`);
  const result=[];
  for(const [top,bottom] of bands){
    const cols=Array(w).fill(0);
    for(let y=top;y<bottom;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>128)cols[x]++;
    const columns=runs(cols,1,14);if(columns.length!==4)throw new Error(`${file} linha ${top}: ${JSON.stringify(columns)}`);
    result.push(await Promise.all(columns.map(async([left,right])=>{
      // Keep a one-pixel alpha margin, then trim only transparent outer pixels.
      const bandIndex=bands.findIndex(band=>band[0]===top);
      const upper=bandIndex?Math.ceil((bands[bandIndex-1][1]+top)/2):0;
      const lower=bandIndex<bands.length-1?Math.floor((bottom+bands[bandIndex+1][0])/2):h;
      const x=Math.max(0,left-2),y=Math.max(upper,top-2),width=Math.min(w-x,right-left+4),height=Math.min(lower,bottom+2)-y;
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
const sequences=ZEBRA_SEQUENCES;
const allFrames=[],allDelays=[];
for(const [action,sequence] of Object.entries(sequences)){
  const width=640,height=640,images=[];
  for(const pose of sequence){
    images.push(await sharp({create:{width,height,channels:4,background:'#30382c'}}).composite(await Promise.all(views.map(async(view,i)=>({input:await sharp(fileURLToPath(new URL(`quadros/${view}-${pose}.png`,root))).resize(320,320).png().toBuffer(),left:i%2*320,top:Math.floor(i/2)*320})))).png().toBuffer());
  }
  const raws=await Promise.all(images.map(buffer=>sharp(buffer).raw().toBuffer()));
  const delay=Math.round(ZEBRA_DURATIONS[action]*1000/sequence.length);
  allFrames.push(...raws);allDelays.push(...raws.map((_,i)=>action==='death'&&i===raws.length-1?1800:delay));
  await sharp(Buffer.concat(raws),{raw:{width,height:height*raws.length,channels:4,pageHeight:height}}).gif({loop:action==='death'?1:0,delay:Array(raws.length).fill(delay)}).toFile(fileURLToPath(new URL(`${action}.gif`,root)));
}
await sharp(Buffer.concat(allFrames),{raw:{width:640,height:640*allFrames.length,channels:4,pageHeight:640}}).gif({loop:0,delay:allDelays}).toFile(fileURLToPath(new URL('animacoes-quatro-direcoes.gif',root)));
await sharp({create:{width:1024,height:512,channels:4,background:'#30382c'}}).composite(await Promise.all(views.map(async(view,i)=>({input:await sharp(fileURLToPath(new URL(`quadros/${view}-0.png`,root))).resize(256,256).png().toBuffer(),left:i*256,top:128})))).png().toFile(fileURLToPath(new URL('quatro-vistas.png',root)));
await writeFile(new URL('manifest.json',root),JSON.stringify({character:'Zebra',format:'PNG transparente',integrated:true,views,posesPerView:9,frames:36,sequences,timing:{...ZEBRA_DURATIONS,impact:ZEBRA_IMPACT},stats:{hp:18,damage:5,range:1,move:3,initiative:8},sourceSheets:['movimentos.png','reacoes.png'],cuts:{motion:motion.bands,reactions:reactions.bands},frameBounds:frames},null,2));

