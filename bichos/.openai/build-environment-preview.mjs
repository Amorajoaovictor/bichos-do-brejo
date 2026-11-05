import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('../art/cenario/interativos-v1/',import.meta.url),review=new URL('./environment-review/',import.meta.url);
await mkdir(new URL('previa/',root),{recursive:true});
const frames=[];
for(let i=0;i<15;i++){
  const input=fileURLToPath(new URL(`tronco-${String(i).padStart(2,'0')}.png`,review));
  const frame=await sharp(input).extract({left:365,top:210,width:720,height:520}).resize(720,520).ensureAlpha().raw().toBuffer();frames.push(frame);
  await sharp(frame,{raw:{width:720,height:520,channels:4}}).png().toFile(fileURLToPath(new URL(`previa/${i}.png`,root)));
}
const delay=frames.map((_,i)=>i===0?500:i===14?900:80);
await sharp(Buffer.concat(frames),{raw:{width:720,height:520*frames.length,channels:4,pageHeight:520}}).gif({loop:0,delay}).toFile(fileURLToPath(new URL('tronco-em-combate.gif',root)));
await writeFile(new URL('manifest.json',root),JSON.stringify({integrated:true,format:'PNG com transparência',assets:['rock.png','log.png'],originals:['rock-original.png','log-original.png'],generation:'image_gen integrado',animation:'Sprites estáticos completos; deslocamento, arco e giro na cena. Prévia capturada do combate real, não prancha de redesenhos.',preview:{frames:15,delays:delay,width:720,height:520},rules:{bonusPerTurn:1,rocks:4,logs:2,stone:{damage:4,range:3},log:{damage:8,range:4,perEnemyHits:1,consumedAfterUse:true},graxinin:{carriedAtStart:'Lata amassada',capacity:1,pickupCosts:'1 bônus',throwCosts:'1 ataque',damage:8,range:4}},verification:'../../../.openai/environment-review/report.json'},null,2));
console.log('Prévia do tronco e manifesto atualizados.');
