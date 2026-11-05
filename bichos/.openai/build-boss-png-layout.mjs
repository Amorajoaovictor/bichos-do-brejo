import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {writeFile} from 'node:fs/promises';

// One transform per action/view keeps every supplied frame on the same ground
// plane while matching the arena's 300 x 330 drawing coordinates.
const actions={idle:'repouso-v2',bite:'mordida-v1',roar:'rugido-v5',hit:'dano-v1',bleed:'sangramento-v1',death:'derrota-v1'};
const directions={right:'direita',left:'esquerda',down:'frente',up:'costas'};
const layouts={};
for(const [kind,folder] of Object.entries(actions)){
  layouts[kind]={};
  for(const [view,prefix] of Object.entries(directions)){
    const boxes=[],feet=[];let size=0;
    for(let number=1;number<=12;number++){
      const file=`art/rosnaldo/${folder}/quadros/${prefix}-${String(number).padStart(2,'0')}.png`;
      const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      if(info.width!==info.height)throw new Error(`Quadro não quadrado: ${file}`);
      if(size&&info.width!==size)throw new Error(`Tamanho inconsistente: ${file}`);
      size=info.width;
      let minX=size,minY=size,maxX=-1,maxY=-1;
      for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(data[(y*size+x)*4+3]>=110){
        minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
      }
      if(maxX<0)throw new Error(`Quadro vazio: ${file}`);
      boxes.push({minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1});
      let footSum=0,footCount=0;
      for(let y=Math.max(0,maxY-55);y<=maxY;y++)for(let x=0;x<size;x++)if(data[(y*size+x)*4+3]>=200){footSum+=x;footCount++;}
      feet.push(footSum/footCount);
    }
    const width=Math.max(...boxes.map(box=>box.width)),height=Math.max(...boxes.map(box=>box.height));
    const k=Math.min(300/width,330/height),first=boxes[0];
    const tx=150-(first.minX+first.maxX)*k/2,ty=333-first.maxY*k;
    const offsets=boxes.map((box,i)=>[
      ['idle','roar','bleed'].includes(kind)?+(k*(feet[0]-feet[i])).toFixed(3):0,
      +(k*(first.maxY-box.maxY)).toFixed(3),
    ]);
    layouts[kind][view]={folder,prefix,size,k:+k.toFixed(6),tx:+tx.toFixed(3),ty:+ty.toFixed(3),offsets};
  }
}
await writeFile('dist/boss-png-layout.js',`// Generated from the approved transparent PNG frames.\nexport const bossPngLayout=${JSON.stringify(layouts)};\n`);
console.log('wrote layouts for',Object.keys(layouts).join(', '));
