import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Group} from '../dist/vendor/three.module.js';
import {creatures,articulatedParts,wrapSVG} from '../dist/characters.js';
import {directionalParts} from '../dist/directional-art.js';
import {rabbitProfile} from '../dist/rabbit-profile.js';
import {bindRig,idlePose,locomotionPose,actionPose,ACTIONS} from '../dist/animation.js';
import {expressionSVG} from '../dist/expressions.js';

const output=new URL('../art/farrapo/perfil-v2/',import.meta.url);
await mkdir(new URL('quadros/',output),{recursive:true});
const save=(name,data)=>writeFile(new URL(name,output),data);
const png=svg=>sharp(Buffer.from(svg)).png().toBuffer();
const actions={repouso:{kind:'idle',duration:2400},salto:{kind:'jump',duration:480},coice:{kind:'rabbit',duration:1050},rajada:{kind:'barrage',duration:2300}};
const frames={},labels={right:'Direita',left:'Esquerda'};
for(const [direction,label] of Object.entries(labels)){
  const defs=rabbitProfile(direction),root=new Group(),art=new Group(),parts={};root.add(art);
  for(const def of defs){const p=new Group();p.position.set(...def.pivot,0);p.userData={baseX:def.pivot[0],baseY:def.pivot[1]};parts[def.name]=p;art.add(p);}
  const rig={root,art,parts,phase:0,direction,views:{}};bindRig(rig,'rabbit');rig.facing=direction==='left'?-1:1;
  for(const [name,{kind,duration}] of Object.entries(actions)){
    const list=[];
    for(let i=0;i<12;i++){
      const progress=i/11;idlePose(rig,kind==='idle'?2+i*duration/12000:2);
      if(kind==='jump')locomotionPose(rig,progress);
      else if(kind!=='idle')actionPose(rig,kind,progress);
      root.position.y=-rig.air/0.0047;root.updateMatrixWorld(true);
      let content='';
      for(const def of defs){
        if(def.name.startsWith('mut_')||def.name==='rage')continue;
        const p=parts[def.name],m=p.matrixWorld.elements;
        const svg=kind==='barrage'&&i>1&&i<10&&['eyeL','muzzle'].includes(def.name)?expressionSVG('rabbit','panic',def.name,...def.pivot,true):def.svg;
        content+=`<g transform="matrix(${m[0]} ${m[1]} ${m[4]} ${m[5]} ${m[12]} ${m[13]}) translate(${-def.pivot[0]} ${-def.pivot[1]})">${svg}</g>`;
      }
      const svg=wrapSVG(content).replace('viewBox="0 0 300 360"','width="330" height="450" viewBox="-15 -95 330 450"');
      const buffer=await png(svg);list.push(buffer);await save(`quadros/${name}-${direction}-${String(i+1).padStart(2,'0')}.png`,buffer);
    }
    frames[`${name}-${direction}`]=list;
    await sharp(list,{join:{animated:true}}).gif({delay:Math.round(duration/12),loop:0}).toFile(fileURLToPath(new URL(`${name}-${direction}.gif`,output)));
  }
}
const front=await png(wrapSVG(articulatedParts(creatures[0]).map(p=>p.svg).join('')).replace('<svg ','<svg width="300" height="360" '));
const old=await readFile(new URL('perfil-anterior.png',output)).catch(async()=>{
  const buffer=await png(wrapSVG(directionalParts('rabbit','right').filter(p=>!p.name.startsWith('mut_')&&p.name!=='rage').map(p=>p.svg).join('')).replace('<svg ','<svg width="300" height="360" '));
  await save('perfil-anterior.png',buffer);return buffer;
});
const revised=await Promise.all(['right','left'].map(direction=>sharp(frames[`repouso-${direction}`][0]).extract({left:15,top:95,width:300,height:355}).extend({bottom:5,background:'#00000000'}).png().toBuffer()));
const text=Buffer.from('<svg width="1200" height="40"><g fill="#e4dcc9" font-family="sans-serif" font-size="18"><text x="18" y="27">Original de frente</text><text x="318" y="27">Perfil anterior</text><text x="618" y="27">Novo: direita</text><text x="918" y="27">Novo: esquerda</text></g></svg>');
await sharp({create:{width:1200,height:410,channels:4,background:'#363b31'}}).composite([front,old,...revised].map((input,i)=>({input,left:i*300,top:45})).concat({input:text,left:0,top:0})).png().toFile(fileURLToPath(new URL('comparacao.png',output)));
const sequence=[];
for(let i=0;i<12;i++){
  const panels=[];
  for(const [row,action] of ['repouso','salto','coice'].entries())for(const [col,direction] of ['right','left'].entries())panels.push({input:frames[`${action}-${direction}`][i],left:col*330,top:row*450});
  sequence.push(await sharp({create:{width:660,height:1350,channels:4,background:'#363b31'}}).composite(panels).png().toBuffer());
}
await sharp(sequence,{join:{animated:true}}).gif({delay:110,loop:0}).toFile(fileURLToPath(new URL('previa-animada.gif',output)));
const compact=[],delays=[];
for(const [action,{duration}] of Object.entries(actions))for(let i=0;i<12;i++){
  const heading=Buffer.from(`<svg width="660" height="36"><g fill="#e4dcc9" font-family="sans-serif" font-size="17"><text x="18" y="25">Direita · ${action}</text><text x="348" y="25">Esquerda · ${action}</text></g></svg>`);
  compact.push(await sharp({create:{width:660,height:486,channels:4,background:'#363b31'}}).composite([{input:heading,left:0,top:0},{input:frames[`${action}-right`][i],left:0,top:36},{input:frames[`${action}-left`][i],left:330,top:36}]).png().toBuffer());
  delays.push(Math.round(duration/12));
}
await sharp(compact,{join:{animated:true}}).gif({delay:delays,loop:0}).toFile(fileURLToPath(new URL('perfis-animados.gif',output)));
await save('manifest.json',JSON.stringify({character:'Farrapo',version:2,directions:['right','left'],framesPerAction:12,frameSize:[330,450],actions,events:{coice:{release:ACTIONS.rabbit.release,impact:ACTIONS.rabbit.impact},rajada:{release:ACTIONS.barrage.release,impact:ACTIONS.barrage.impact}},source:'dist/rabbit-profile.js',integration:'articulated-vector',notes:'PNGs derivados das articulações usadas no jogo; lados com olho, marcas e sobreposição de orelhas próprios.'},null,2));
await save('referencias.md','# Farrapo — correção dos perfis\n\nReferência de identidade: `dist/assets/rabbit.svg` e partes originais de `dist/characters.js`. Perfis redesenhados em `dist/rabbit-profile.js`. Não há prompt de geração: PNGs renderizados diretamente da arte vetorial articulada para preservar o desenho do jogo. Mantidos pelagem creme gasta, orelha alta com falha, orelha caída rasgada, olhos assimétricos e dentes irregulares. As vistas frontal e traseira permanecem as originais.\n');
await save('index.html',`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Farrapo · perfis refeitos</title><style>body{margin:24px auto;max-width:980px;background:#24291f;color:#e4dcc9;font:16px system-ui;padding:0 20px}h1{font:32px Georgia}header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}button,select{padding:10px;background:#414a35;color:inherit;border:1px solid #7c8568;border-radius:6px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:18px 0;background:#363b31;border-radius:12px;padding:14px}figure img{width:100%;max-height:480px;object-fit:contain}input{flex:1} .compare{width:100%}@media(max-width:550px){main{grid-template-columns:1fr}}</style><h1>Farrapo · perfis refeitos</h1><p>Orelhas assimétricas, pelagem gasta e expressão nervosa.</p><header><button id="play">Pausar</button><select id="action">${Object.keys(actions).map(n=>`<option value="${n}">${n}</option>`).join('')}</select><select id="speed"><option value=".5">0,5×</option><option selected value="1">1×</option><option value="1.5">1,5×</option></select><input id="frame" type="range" min="0" max="11" value="0" aria-label="Quadro"><output id="count">1 / 12</output></header><main>${Object.entries(labels).map(([d,l])=>`<figure><figcaption>${l}</figcaption><img id="${d}" alt="Farrapo de perfil, ${l.toLowerCase()}" src="quadros/repouso-${d}-01.png"></figure>`).join('')}</main><p>Coice: contato próximo do quadro 6. A rajada mostra o desespero do Farrapo.</p><img class="compare" src="comparacao.png" alt="Desenho original, perfil anterior e novos perfis"><script>const durations=${JSON.stringify(Object.fromEntries(Object.entries(actions).map(([n,a])=>[n,a.duration])))};let playing=true,index=0,last=0;const play=document.getElementById('play'),action=document.getElementById('action'),speed=document.getElementById('speed'),slider=document.getElementById('frame');function show(){for(const d of ['right','left'])document.getElementById(d).src='quadros/'+action.value+'-'+d+'-'+String(index+1).padStart(2,'0')+'.png';slider.value=index;document.getElementById('count').value=(index+1)+' / 12'}play.onclick=()=>{playing=!playing;play.textContent=playing?'Pausar':'Reproduzir'};slider.oninput=()=>{playing=false;play.textContent='Reproduzir';index=+slider.value;show()};action.onchange=()=>{index=0;show()};function tick(t){if(playing&&t-last>durations[action.value]/12/+speed.value){index=(index+1)%12;show();last=t}requestAnimationFrame(tick)}requestAnimationFrame(tick)</script></html>`);
console.log(fileURLToPath(output));
