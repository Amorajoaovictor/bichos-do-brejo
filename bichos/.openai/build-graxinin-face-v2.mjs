import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {quantize,paint,nearestColor} from './vectorizer.mjs';
const output=new URL('../art/graxinin/rosto-v2/',import.meta.url);await mkdir(output,{recursive:true});
const configs={
 down:{source:'frente',polygon:[[184,180],[426,180],[430,374],[380,389],[300,395],[242,389],[200,375],[201,347],[185,334],[205,316],[185,302],[204,286]],matrix:[1,0,0,1,-144,-148],eyes:[{name:'eyeL',cx:271,cy:310,rx:40,ry:41},{name:'eyeR',cx:365,cy:311,rx:31,ry:32}]},
 right:{source:'direita',polygon:[[212,186],[438,186],[438,369],[390,385],[300,386],[230,368],[211,341],[224,320],[212,304],[232,284]],matrix:[1,0,0,1,-147,-140],eyes:[{name:'eyeL',cx:357,cy:307,rx:32,ry:37}]},
 left:{source:'esquerda',polygon:[[128,190],[346,190],[346,343],[325,365],[257,385],[185,381],[135,366]],matrix:[-1,0,0,1,400,-139],eyes:[{name:'eyeL',cx:200,cy:308,rx:32,ry:32,anatomical:'left'}]},
 up:{source:'costas',polygon:[[174,187],[408,187],[413,325],[396,350],[362,368],[213,368],[184,349],[173,329]],matrix:[1,0,0,1,-140,-130],eyes:[]}
};
function inside(x,y,polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [a,b]=polygon[i],[c,d]=polygon[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)result=!result;}return result;}
const banks={};
function vectorize(data){
 return paint(data,{epsilon:1.05}).replace(/d="([^"]+)"/g,(_,path)=>'d="'+path.replace(/M([^Z]+)Z/g,(_,loop)=>{
  const points=loop.split('L').map(pair=>pair.trim().split(/\s+/).map(Number)),n=points.length;
  if(n<4)return 'M'+loop+'Z';
  const number=v=>Math.round(v*100)/100;
  let d='M'+points[0].join(' ');
  for(let i=0;i<n;i++){
   const a=points[(i+n-1)%n],b=points[i],c=points[(i+1)%n],e=points[(i+2)%n];
   const tension=.12;
   d+='C'+[b[0]+(c[0]-a[0])*tension,b[1]+(c[1]-a[1])*tension,c[0]-(e[0]-b[0])*tension,c[1]-(e[1]-b[1])*tension,...c].map(number).join(' ');
  }
  return d+'Z';
 })+'"');
}
for(const [direction,config] of Object.entries(configs)){
 const input=new URL(`../art/graxinin/arremesso-v1/quadros/${config.source}-01.png`,import.meta.url);
 const data=await quantize(fileURLToPath(input),{size:512,colors:22});
 // Collapse the reference's soft shading into a small flat vector palette.
 // A single fur base prevents dark hairline cracks between traced color bands.
 const flat=[{r:32,g:35,b:29},{r:65,g:64,b:54},{r:118,g:110,b:95},{r:160,g:150,b:132},{r:198,g:185,b:161},{r:239,g:231,b:205}];
 const mapping=data.palette.map(c=>{const light=c.r*.3+c.g*.59+c.b*.11;return light<45?0:light<92?1:light<133?2:light<181?3:light<218?4:5;});
 for(let i=0;i<data.index.length;i++)if(data.index[i]!==255)data.index[i]=mapping[data.index[i]];
 data.palette=flat;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(!inside(x,y,config.polygon))data.index[y*512+x]=255;
 if(direction==='down'||direction==='left')for(let y=direction==='down'?386:380;y<512;y++)for(let x=0;x<512;x++)data.index[y*512+x]=255;
 if(direction==='up'){
  const fur=nearestColor(data.palette,[162,151,132]);
  for(let y=325;y<369;y++)for(let x=222;x<369;x++)if(data.index[y*512+x]!==255&&((x-296)/69)**2+((y-393)/67)**2<1.1)data.index[y*512+x]=fur;
 }
 const snapshot=Uint8Array.from(data.index),defs=[];
 const wrap=svg=>`<g transform="matrix(${config.matrix.join(' ')})">${svg}</g>`;
 const black=nearestColor(data.palette,[40,42,35]);
 for(const eye of config.eyes){
  const eyeIndex=new Uint8Array(512*512).fill(255);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(((x-eye.cx)/eye.rx)**2+((y-eye.cy)/eye.ry)**2<=1&&snapshot[y*512+x]!==255){eyeIndex[y*512+x]=snapshot[y*512+x];data.index[y*512+x]=black;}
  const [a,,,d,tx,ty]=config.matrix;
  defs.push({name:eye.name,pivot:[eye.cx*a+tx,eye.cy*d+ty],svg:wrap(vectorize({...data,index:eyeIndex})),expression:{rx:eye.rx,ry:eye.ry,anatomical:eye.anatomical||'right',referenceTrace:true}});
 }
 const head=wrap(vectorize(data));
 const full=wrap(vectorize({...data,index:snapshot}));
 banks[direction]=[{name:'head',pivot:[160,231],svg:head},...defs];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${full}</svg>`;
 await writeFile(new URL(`${direction}.svg`,output),svg);await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL(`${direction}.png`,output)));
}
await writeFile(new URL('../dist/graxinin-face-v2.js',import.meta.url),'// Native paths traced from the approved PNG guide. No embedded image or texture.\nexport const graxininFaces='+JSON.stringify(banks)+';\n');
console.log(Object.fromEntries(Object.entries(banks).map(([d,parts])=>[d,{parts:parts.length,paths:parts.reduce((n,p)=>n+(p.svg.match(/<path /g)||[]).length,0)}])));
