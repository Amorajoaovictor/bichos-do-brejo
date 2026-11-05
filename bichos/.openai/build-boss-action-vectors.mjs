import {mkdir,writeFile} from 'node:fs/promises';
import {quantize,paint,boundsOf} from './vectorizer.mjs';

// Trace the approved action PNGs as complete vector poses. Keeping each frame
// intact preserves the wound map, jaw and silhouette during fast attacks.
const actions={bite:'mordida-v1',roar:'rugido-v2'};
const directions={right:'direita',left:'esquerda',down:'frente',up:'costas'};
const SIZE=240;
for(const [action,folder] of Object.entries(actions))for(const [view,prefix] of Object.entries(directions)){
  const out=`dist/boss-frames/${action}/${view}`;await mkdir(out,{recursive:true});
  const frames=[];
  for(let number=1;number<=12;number++){
    const path=`art/rosnaldo/${folder}/quadros/${prefix}-${String(number).padStart(2,'0')}.png`;
    frames.push(await quantize(path,{size:SIZE,colors:18}));
  }
  const boxes=frames.map(frame=>boundsOf(frame.index,frame.w,frame.h));
  const width=Math.max(...boxes.map(b=>b.width)),height=Math.max(...boxes.map(b=>b.height));
  const k=Math.min(300/width,330/height);
  const reference=boxes[0],tx=150-(reference.minX+reference.maxX)*k/2,ty=333-reference.maxY*k;
  const transform=`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  let bytes=0;
  for(let i=0;i<frames.length;i++){
    const drawing=paint(frames[i],{epsilon:1});
    const svg=`<g transform="${transform}">${drawing}</g>`;
    const filename=`${out}/${String(i+1).padStart(2,'0')}.svg`;
    await writeFile(filename,svg);bytes+=svg.length;
  }
  console.log(action,view,Math.round(bytes/1024)+' KiB');
}
