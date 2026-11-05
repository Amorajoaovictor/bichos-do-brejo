import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../art/farrapo/mutacoes-camadas-v1/',import.meta.url),raws=[];
// Browser captures are saved at 1/1.1 of the document's CSS dimensions.
// Canvas document bounds in the verified desktop layout: 142.63,407.16,1084.22,505.97.
for(let i=0;i<42;i++){
  const input=await readFile(new URL(`previas/rajada/${String(i).padStart(3,'0')}.png`,root));
  const meta=await sharp(input).metadata();
  const bounds=meta.width===1523&&meta.height===1170?{left:130,top:370,width:985,height:460}:meta.width===1265&&meta.height===1181?{left:55,top:408,width:849,height:396}:null;
  if(!bounds)throw new Error(`Captura ${i} fora do tamanho verificado: ${meta.width}x${meta.height}`);
  const crop=await sharp(input).extract(bounds).resize(900,420).png().toBuffer();
  const labels=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="448"><rect x="0" y="420" width="900" height="28" fill="#252d24"/><g fill="#d5d7c2" font-family="sans-serif" font-size="11" text-anchor="middle"><text x="150" y="438">QUADROS ATUAIS</text><text x="450" y="438">PNG EM CAMADAS</text><text x="750" y="438">CAMADAS + MUTAÇÕES</text></g></svg>');
  const frame=await sharp({create:{width:900,height:448,channels:4,background:'#2b3329'}}).composite([{input:crop,left:0,top:0},{input:labels,left:0,top:0}]).png().toBuffer();
  if(i===10)await writeFile(new URL('previas/comparacao-rajada.png',root),frame);
  raws.push(await sharp(frame).ensureAlpha().raw().toBuffer());
}
await sharp(Buffer.concat(raws),{raw:{width:900,height:448*raws.length,channels:4,pageHeight:448}}).gif({loop:0,delay:Array(42).fill(100),colours:128}).toFile(fileURLToPath(new URL('rajada-camadas.gif',root)));
console.log(JSON.stringify({frames:42,width:900,height:448,gif:'rajada-camadas.gif'}));
