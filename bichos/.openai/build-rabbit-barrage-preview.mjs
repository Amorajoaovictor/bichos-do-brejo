import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Group} from '../dist/vendor/three.module.js';
import {creatures,articulatedParts,wrapSVG} from '../dist/characters.js';
import {directionalParts} from '../dist/directional-art.js';
import {bindRig,idlePose,actionPose,ACTIONS,barrageEmotion,barrageFlush} from '../dist/animation.js';
import {expressionSVG} from '../dist/expressions.js';

const output=new URL('../art/farrapo/rajada-v2/',import.meta.url);
await mkdir(new URL('quadros/',output),{recursive:true});
const save=(name,data)=>writeFile(new URL(name,output),data);
const labels={right:'Direita',left:'Esquerda',down:'Frente',up:'Costas'};
const count=70,duration=ACTIONS.barrage.duration*1000,frames={};
const delays=Array.from({length:count},(_,i)=>i===count-1?1100:Math.round(duration/(count-1)));
const raster=svg=>sharp(Buffer.from(svg)).png().toBuffer();
for(const direction of Object.keys(labels)){
  const defs=direction==='down'?articulatedParts(creatures[0]):directionalParts('rabbit',direction);
  const root=new Group(),art=new Group(),parts={};root.add(art);
  for(const def of defs){const p=new Group();p.position.set(...def.pivot,0);p.userData={baseX:def.pivot[0],baseY:def.pivot[1]};parts[def.name]=p;art.add(p);}
  const rig={root,art,parts,phase:0,direction,views:{}};bindRig(rig,'rabbit');rig.facing=direction==='left'?-1:1;
  const list=[];
  for(let i=0;i<count;i++){
    const progress=i/(count-1),emotion=barrageEmotion(progress);
    idlePose(rig,2);actionPose(rig,'barrage',progress);root.updateMatrixWorld(true);
    let content='';
    for(const def of defs){
      if(def.name.startsWith('mut_')||def.name==='rage')continue;
      const m=parts[def.name].matrixWorld.elements;
      const expressive=def.svg&&!def.expression?.hidden&&(def.name==='head'||(direction!=='up'&&['eyeL','eyeR','muzzle'].includes(def.name)));
      const svg=expressive?expressionSVG('rabbit',emotion,def.name,...def.pivot,direction==='left'||direction==='right',def.expression,def.svg,barrageFlush(progress)):def.svg;
      content+=`<g transform="matrix(${m[0]} ${m[1]} ${m[4]} ${m[5]} ${m[12]} ${m[13]}) translate(${-def.pivot[0]} ${-def.pivot[1]})">${svg}</g>`;
    }
    const svg=wrapSVG(content).replace('viewBox="0 0 300 360"','width="330" height="450" viewBox="-15 -95 330 450"');
    const png=await raster(svg);list.push(png);
    await save(`quadros/rajada-${direction}-${String(i+1).padStart(2,'0')}.png`,png);
  }
  frames[direction]=list;
  await sharp(list,{join:{animated:true}}).gif({delay:delays,loop:0}).toFile(fileURLToPath(new URL(`rajada-${direction}.gif`,output)));
}
const combined=[],closeups=[];
const title=await raster('<svg width="660" height="40"><g fill="#e4dcc9" font-family="sans-serif" font-size="18"><text x="18" y="28">Perfil · esforço e desespero</text><text x="348" y="28">Frente · esforço e desespero</text></g></svg>');
for(let i=0;i<count;i++){
  combined.push(await sharp({create:{width:660,height:900,channels:4,background:'#363b31'}}).composite(Object.keys(labels).map((d,j)=>({input:frames[d][i],left:j%2*330,top:Math.floor(j/2)*450}))).png().toBuffer());
  const panels=await Promise.all(['right','down'].map(d=>sharp(frames[d][i]).extract({left:15,top:210,width:300,height:200}).resize(330,220).png().toBuffer()));
  closeups.push(await sharp({create:{width:660,height:260,channels:4,background:'#363b31'}}).composite([{input:title,left:0,top:0},...panels.map((input,j)=>({input,left:j*330,top:40}))]).png().toBuffer());
}
await sharp(combined,{join:{animated:true}}).gif({delay:delays,loop:0}).toFile(fileURLToPath(new URL('rajada-quatro-direcoes.gif',output)));
await sharp(closeups,{join:{animated:true}}).gif({delay:delays,loop:0}).toFile(fileURLToPath(new URL('rosto-animado.gif',output)));
const peak=14; // 0.467 s: first cramp, close to its maximum.
const before=await readFile(new URL('../vetor-aprovado-v1/quadros/rajada-right-15.png',output));
const heading=await raster('<svg width="660" height="40"><g fill="#e4dcc9" font-family="sans-serif" font-size="18"><text x="18" y="28">Antes</text><text x="348" y="28">Agora · rosto vermelho e contraído</text></g></svg>');
await sharp({create:{width:660,height:490,channels:4,background:'#363b31'}}).composite([{input:heading,left:0,top:0},{input:before,left:0,top:40},{input:frames.right[peak],left:330,top:40}]).png().toFile(fileURLToPath(new URL('antes-e-depois.png',output)));
await save('manifest.json',JSON.stringify({character:'Farrapo',action:'rajada',version:2,directions:Object.keys(labels),framesPerDirection:count,frameSize:[330,450],duration,previewFinalHold:1100,representation:'native-articulated-vector',sources:['dist/expressions.js','dist/animation.js'],expressions:['panic','strain','relief'],events:{firstRelease:420,releaseInterval:130,pellets:10},notes:'Rosto avermelhado nos paths originais; contrações faciais sincronizadas às emissões. Frente e perfis; costas sem rosto visível. PNGs e GIFs são apenas prévias.'},null,2));
await save('index.html',`<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Farrapo · sufoco na rajada</title>
<style>body{max-width:960px;margin:28px auto;padding:0 20px;background:#24291f;color:#e4dcc9;font:16px system-ui}h1{font:32px Georgia}header{display:flex;gap:12px;align-items:center;flex-wrap:wrap;position:sticky;top:0;padding:12px 0;background:#24291f}button,select{padding:10px;background:#414a35;color:inherit;border:1px solid #7c8568;border-radius:6px}input{flex:1;min-width:140px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:12px 0;background:#363b31;border-radius:12px;padding:14px}figure img{width:100%;max-height:450px;object-fit:contain}.compare{display:block;max-width:100%;margin:24px auto}a{color:#b4d394}@media(max-width:550px){main{grid-template-columns:1fr}}</style>
<h1>Farrapo · sufoco na rajada</h1><p>O rosto avermelha aos poucos com o esforço e recupera a cor gradualmente no final. Os olhos ficam espremidos durante a rajada, com a cabeça levemente baixa e a boca frontal original.</p>
<img class="compare" src="rosto-animado.gif" alt="Expressão animada do Farrapo em perfil e de frente">
<header><button id="play">Pausar</button><select id="speed" aria-label="Velocidade"><option value=".5">0,5×</option><option selected value="1">1×</option><option value="1.5">1,5×</option></select><input id="frame" type="range" min="0" max="69" value="0" aria-label="Quadro"><output id="count">1 / 70</output><output id="emotion">Desespero</output></header>
<main>${Object.entries(labels).map(([d,label])=>`<figure><figcaption>${label}</figcaption><img id="${d}" src="quadros/rajada-${d}-01.png" alt="Farrapo na rajada, ${label.toLowerCase()}"></figure>`).join('')}</main>
<img class="compare" src="antes-e-depois.png" alt="Comparação da expressão anterior com o rosto vermelho e contraído"><p><a href="/">Abrir o jogo</a></p>
<script>const emotions=${JSON.stringify(Array.from({length:count},(_,i)=>barrageEmotion(i/(count-1))))};const times=${JSON.stringify(delays)};const play=document.getElementById('play'),speed=document.getElementById('speed'),slider=document.getElementById('frame');let playing=true,index=0,last=0;const images=Array.from({length:70},(_,i)=>Object.keys(${JSON.stringify(labels)}).map(d=>{const img=new Image();img.src='quadros/rajada-'+d+'-'+String(i+1).padStart(2,'0')+'.png';return img}));function show(){for(const d of ['right','left','down','up'])document.getElementById(d).src='quadros/rajada-'+d+'-'+String(index+1).padStart(2,'0')+'.png';slider.value=index;document.getElementById('count').value=(index+1)+' / 70';document.getElementById('emotion').value={panic:'Desespero',strain:'Aperto!',relief:'Alívio'}[emotions[index]]}play.onclick=()=>{playing=!playing;last=performance.now();play.textContent=playing?'Pausar':'Reproduzir'};slider.oninput=()=>{playing=false;play.textContent='Reproduzir';index=+slider.value;show()};speed.onchange=()=>{last=performance.now()};function tick(t){if(playing&&t-last>=times[index]/+speed.value){index=(index+1)%70;show();last=t}requestAnimationFrame(tick)}requestAnimationFrame(tick)</script></html>`);
console.log(fileURLToPath(output));
