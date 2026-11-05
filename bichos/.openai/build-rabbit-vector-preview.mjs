import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Group} from '../dist/vendor/three.module.js';
import {creatures,articulatedParts,wrapSVG} from '../dist/characters.js';
import {directionalParts} from '../dist/directional-art.js';
import {rabbitProfile} from '../dist/rabbit-profile.js';
import {bindRig,idlePose,locomotionPose,actionPose,ACTIONS,barrageEmotion,barrageFlush} from '../dist/animation.js';
import {expressionSVG} from '../dist/expressions.js';

const output=new URL('../art/farrapo/vetor-aprovado-v1/',import.meta.url);
await mkdir(new URL('quadros/',output),{recursive:true});
const save=(name,data)=>writeFile(new URL(name,output),data);
const png=svg=>sharp(Buffer.from(svg)).png().toBuffer();
const actions={repouso:{kind:'idle',duration:2400},salto:{kind:'jump',duration:480},coice:{kind:'rabbit',duration:1050},rajada:{kind:'barrage',duration:2300,frameCount:70}};
const frames={},labels={right:'Direita',left:'Esquerda',down:'Frente',up:'Costas'};
for(const [direction,label] of Object.entries(labels)){
  const defs=direction==='down'?articulatedParts(creatures[0]):direction==='up'?directionalParts('rabbit','up'):rabbitProfile(direction),root=new Group(),art=new Group(),parts={};root.add(art);
  for(const def of defs){const p=new Group();p.position.set(...def.pivot,0);p.userData={baseX:def.pivot[0],baseY:def.pivot[1]};parts[def.name]=p;art.add(p);}
  const rig={root,art,parts,phase:0,direction,views:{}};bindRig(rig,'rabbit');rig.facing=direction==='left'?-1:1;
  for(const [name,{kind,duration,frameCount=12}] of Object.entries(actions)){
    const list=[];
    for(let i=0;i<frameCount;i++){
      const progress=i/(frameCount-1);idlePose(rig,kind==='idle'?2+i*duration/12000:2);
      if(kind==='jump')locomotionPose(rig,progress);
      else if(kind!=='idle')actionPose(rig,kind,progress);
      root.position.y=-rig.air/0.0047;root.updateMatrixWorld(true);
      let content='';
      for(const def of defs){
        if(def.name.startsWith('mut_')||def.name==='rage')continue;
        const p=parts[def.name],m=p.matrixWorld.elements;
        const emotion=kind==='barrage'?barrageEmotion(progress):null;
        const expressive=def.svg&&!def.expression?.hidden&&(def.name==='head'||(direction!=='up'&&['eyeL','eyeR','muzzle'].includes(def.name)));
        const svg=emotion&&expressive?expressionSVG('rabbit',emotion,def.name,...def.pivot,direction==='right'||direction==='left',def.expression,def.svg,barrageFlush(progress)):def.svg;
        content+=`<g transform="matrix(${m[0]} ${m[1]} ${m[4]} ${m[5]} ${m[12]} ${m[13]}) translate(${-def.pivot[0]} ${-def.pivot[1]})">${svg}</g>`;
      }
      const svg=wrapSVG(content).replace('viewBox="0 0 300 360"','width="330" height="450" viewBox="-15 -95 330 450"');
      const buffer=await png(svg);list.push(buffer);await save(`quadros/${name}-${direction}-${String(i+1).padStart(2,'0')}.png`,buffer);
    }
    frames[`${name}-${direction}`]=list;
    const delay=Array(frameCount).fill(Math.round(duration/frameCount));if(kind==='barrage')delay[frameCount-1]=900;
    await sharp(list,{join:{animated:true}}).gif({delay,loop:0}).toFile(fileURLToPath(new URL(`${name}-${direction}.gif`,output)));
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
for(const [action,{duration,frameCount=12}] of Object.entries(actions))for(let i=0;i<frameCount;i++){
  const heading=Buffer.from(`<svg width="660" height="36"><g fill="#e4dcc9" font-family="sans-serif" font-size="17"><text x="18" y="25">Direita · ${action}</text><text x="348" y="25">Esquerda · ${action}</text></g></svg>`);
  compact.push(await sharp({create:{width:660,height:486,channels:4,background:'#363b31'}}).composite([{input:heading,left:0,top:0},{input:frames[`${action}-right`][i],left:0,top:36},{input:frames[`${action}-left`][i],left:330,top:36}]).png().toBuffer());
  delays.push(action==='rajada'&&i===frameCount-1?900:Math.round(duration/frameCount));
}
await sharp(compact,{join:{animated:true}}).gif({delay:delays,loop:0}).toFile(fileURLToPath(new URL('perfis-animados.gif',output)));
const barrageComparison=[],barrageDelays=[];
for(let i=0;i<actions.rajada.frameCount;i++){
  const panels=['right','left','down','up'].map((direction,index)=>({input:frames[`rajada-${direction}`][i],left:index%2*330,top:Math.floor(index/2)*450}));
  barrageComparison.push(await sharp({create:{width:660,height:900,channels:4,background:'#363b31'}}).composite(panels).png().toBuffer());
  barrageDelays.push(i===actions.rajada.frameCount-1?900:Math.round(actions.rajada.duration/actions.rajada.frameCount));
}
await sharp(barrageComparison,{join:{animated:true}}).gif({delay:barrageDelays,loop:0}).toFile(fileURLToPath(new URL('rajada-quatro-direcoes.gif',output)));
await save('manifest.json',JSON.stringify({character:'Farrapo',version:3,directions:['right','left','down','up'],selectedAngle:'profile',framesPerAction:Object.fromEntries(Object.entries(actions).map(([name,action])=>[name,action.frameCount||12])),frameSize:[330,450],actions,events:{coice:{release:ACTIONS.rabbit.release,impact:ACTIONS.rabbit.impact},rajada:{release:ACTIONS.barrage.release,impact:ACTIONS.barrage.impact}},source:'dist/rabbit-approved-art.js',integration:'articulated-vector',approvedReferences:['../postura-original-v1/perfil-aprovado.png','../postura-original-v1/tres-quartos-aprovado.png'],notes:'Perfil completo escolhido pelo usuário. PNGs e GIFs são prévias renderizadas das articulações; o jogo usa apenas geometria vetorial do Farrapo. Três quartos preservado como estudo SVG.'},null,2));
await save('referencias.md','# Farrapo — vetores a partir dos estudos aprovados\n\nReferências: `../postura-original-v1/perfil-aprovado.png`, `tres-quartos-aprovado.png`, `postura-original-do-jogo.png` e `concept-do-usuario.png`. Os prompts das imagens aprovadas estão em `../postura-original-v1/prompts.md`.\n\nO usuário escolheu perfil completo, com um olho visível, para as laterais do jogo. Reconstrução em paths e elipses: `dist/rabbit-approved-art.js`, selecionada por `dist/rabbit-profile.js`. Tronco e membros reaproveitam as proporções do desenho frontal original de `dist/characters.js`. O estudo de três quartos foi preservado nos SVGs desta pasta.\n\nOs PNGs e GIFs são exportações de prévia dos vetores articulados. Não se carregam imagens do Farrapo como texturas no jogo. Frontal e costas mantêm os desenhos anteriores. Olho, marcas e orelhas respeitam o lado anatômico em cada perfil; a expressão atua somente no olho visível.\n');
await save('index.html',`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Farrapo · perfis refeitos</title><style>body{margin:24px auto;max-width:980px;background:#24291f;color:#e4dcc9;font:16px system-ui;padding:0 20px}h1{font:32px Georgia}header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}button,select{padding:10px;background:#414a35;color:inherit;border:1px solid #7c8568;border-radius:6px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:18px 0;background:#363b31;border-radius:12px;padding:14px}figure img{width:100%;max-height:480px;object-fit:contain}input{flex:1} .compare{width:100%}@media(max-width:550px){main{grid-template-columns:1fr}}</style><h1>Farrapo · perfis refeitos</h1><p><a style="color:#b4d394" href="../rajada-v2/index.html">Ver a rajada atual: rosto vermelho e esforço</a></p><p>Orelhas assimétricas, pelagem gasta e expressão nervosa.</p><header><button id="play">Pausar</button><select id="action">${Object.keys(actions).map(n=>`<option value="${n}">${n}</option>`).join('')}</select><select id="speed"><option value=".5">0,5×</option><option selected value="1">1×</option><option value="1.5">1,5×</option></select><input id="frame" type="range" min="0" max="11" value="0" aria-label="Quadro"><output id="count">1 / 12</output></header><main>${Object.entries(labels).map(([d,l])=>`<figure><figcaption>${l}</figcaption><img id="${d}" alt="Farrapo de perfil, ${l.toLowerCase()}" src="quadros/repouso-${d}-01.png"></figure>`).join('')}</main><p>Coice: contato próximo do quadro 6. Rajada: preparação, dez contrações curtas e alívio, mantendo os pés apoiados.</p><img class="compare" src="comparacao.png" alt="Desenho original, perfil anterior e novos perfis"><script>const frameCounts=${JSON.stringify(Object.fromEntries(Object.entries(actions).map(([n,a])=>[n,a.frameCount||12])))};const durations=${JSON.stringify(Object.fromEntries(Object.entries(actions).map(([n,a])=>[n,a.duration])))};let playing=true,index=0,last=0;const play=document.getElementById('play'),action=document.getElementById('action'),speed=document.getElementById('speed'),slider=document.getElementById('frame');function show(){for(const d of ['right','left','down','up'])document.getElementById(d).src='quadros/'+action.value+'-'+d+'-'+String(index+1).padStart(2,'0')+'.png';slider.value=index;document.getElementById('count').value=(index+1)+' / '+frameCounts[action.value]}play.onclick=()=>{playing=!playing;play.textContent=playing?'Pausar':'Reproduzir'};slider.oninput=()=>{playing=false;play.textContent='Reproduzir';index=+slider.value;show()};action.onchange=()=>{index=0;slider.max=frameCounts[action.value]-1;show()};function tick(t){if(playing&&t-last>durations[action.value]/frameCounts[action.value]/+speed.value){index=(index+1)%frameCounts[action.value];show();last=t}requestAnimationFrame(tick)}const requested=new URLSearchParams(location.search).get('acao');if(frameCounts[requested]){action.value=requested;slider.max=frameCounts[requested]-1;show()}requestAnimationFrame(tick)</script></html>`);
console.log(fileURLToPath(output));
