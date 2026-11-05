import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Group,Vector3} from '../dist/vendor/three.module.js';
import {graxininParts,graxininSockets,canSVG,bottleSVG} from '../dist/graxinin-art.js';
import {wrapSVG} from '../dist/characters.js';
import {bindRig,idlePose,actionPose,locomotionPose,reactionPose,startRecoil,socketPosition} from '../dist/animation.js';
const folder=new URL('../art/graxinin/vetor-v2/',import.meta.url);await mkdir(new URL('quadros/',folder),{recursive:true});
const directions=['down','right','left','up'],labels=['Frente','Direita','Esquerda','Costas'];
const actions={repouso:2400,caminhada:620,arremesso:1200,garrafada:1200,dano:520,derrota:1150},all={};
for(const direction of directions){
  const defs=graxininParts(direction,false),root=new Group(),art=new Group(),parts={};root.add(art);
  for(const def of defs){const item=new Group();item.position.set(...def.pivot,0);item.userData={baseX:def.pivot[0],baseY:def.pivot[1]};parts[def.name]=item;art.add(item);}
  const rig={root,art,parts,direction,views:{},phase:0};bindRig(rig,'raccoon');rig.direction=direction;rig.facing=direction==='left'?-1:1;rig.sockets=graxininSockets(direction);
  idlePose(rig,2);actionPose(rig,'raccoon',.5);const release=socketPosition(rig,'armR',177,305,new Vector3());
  for(const [action,duration] of Object.entries(actions)){
    const buffers=[];all[action]??={};
    for(let i=0;i<30;i++){
      const progress=i/29;rig.death=null;rig.recoil=null;idlePose(rig,action==='repouso'?2+progress*2.4:2);
      if(action==='arremesso'||action==='garrafada')actionPose(rig,action==='garrafada'?'bottle':'raccoon',progress);
      if(action==='caminhada')locomotionPose(rig,progress);
      if(action==='dano'){startRecoil(rig,1,8);reactionPose(rig,progress*.52);}
      if(action==='derrota'){rig.death={elapsed:0,direction:1};reactionPose(rig,progress*1.15);}
      root.updateMatrixWorld(true);
      let content='';
      for(const def of defs){const item=parts[def.name];if(!item.visible)continue;const m=item.matrixWorld.elements;content+=`<g transform="matrix(${m[0]} ${m[1]} ${m[4]} ${m[5]} ${m[12]} ${m[13]}) translate(${-def.pivot[0]} ${-def.pivot[1]})">${def.svg}</g>`;}
      if((action==='arremesso'||action==='garrafada')&&progress>.08&&progress<.76){
        const hand=socketPosition(rig,'armR',177,305,new Vector3()),flight=Math.max(0,(progress-.5)/.26),target=direction==='right'?[330,170]:direction==='left'?[-30,170]:direction==='up'?[160,110]:[160,325];
        const x=flight?release.x+(target[0]-release.x)*flight:hand.x,y=flight?release.y+(target[1]-release.y)*flight-Math.sin(flight*Math.PI)*30:hand.y;
        content+=`<g transform="translate(${x} ${y}) scale(${action==='garrafada'?.624:.48}) translate(-150 -150)">${action==='garrafada'?bottleSVG:canSVG}</g>`;
      }
      const svg=wrapSVG(content).replace('viewBox="0 0 300 360"','width="420" height="420" viewBox="-60 -40 420 420"');
      const filename=`${action}-${direction}-${String(i+1).padStart(2,'0')}`;
      await writeFile(new URL(`quadros/${filename}.svg`,folder),svg);
      const png=await sharp(Buffer.from(svg)).png().toBuffer();buffers.push(png);
    }
    all[action][direction]=buffers;
    if(action==='repouso')await writeFile(new URL(`${direction}.svg`,folder),await sharp(buffers[0]).metadata().then(()=>wrapSVG(defs.map(p=>p.svg).join(''))));
  }
}
for(const [action,duration] of Object.entries(actions)){
  const frames=[];
  for(let i=0;i<30;i++)frames.push(await sharp({create:{width:840,height:840,channels:4,background:'#33382e'}}).composite(directions.map((d,j)=>({input:all[action][d][i],left:j%2*420,top:Math.floor(j/2)*420}))).png().toBuffer());
  const delay=Array(30).fill(Math.round(duration/30));delay[29]=action==='derrota'?1200:action==='arremesso'?500:delay[29];
  await sharp(frames,{join:{animated:true}}).gif({delay,loop:0,effort:5}).toFile(fileURLToPath(new URL(`${action}-quatro-direcoes.gif`,folder)));
  if(action==='repouso')await writeFile(new URL('comparacao.png',folder),frames[0]);
}
await writeFile(new URL('index.html',folder),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Graxinin · vetor articulado</title><style>body{background:#24291f;color:#eee3c9;font:16px system-ui;margin:24px}main{max-width:900px;margin:auto}button,select{font:inherit;background:#454d39;color:inherit;border:1px solid #7f846e;border-radius:6px;padding:9px}nav{display:flex;gap:15px;align-items:center;flex-wrap:wrap}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;background:#33382e;border-radius:12px;padding:8px}img{width:100%;display:block}input{accent-color:#b7695e}@media(max-width:550px){.grid{grid-template-columns:1fr}}</style><main><h1>Graxinin · vetor articulado</h1><p>Quatro direções. Escolha uma ação e pause para observar cada pose.</p><nav><select id="action">${Object.keys(actions).map(a=>`<option>${a}</option>`).join('')}</select><button id="play">Pausar</button><input id="frame" aria-label="Quadro" type="range" min="0" max="29" value="0"><span id="counter">1 / 30</span><select id="speed"><option value="1">1×</option><option value=".5">0,5×</option><option value="1.5">1,5×</option></select></nav><div class="grid">${directions.map((d,i)=>`<figure><figcaption>${labels[i]}</figcaption><img data-direction="${d}" src="quadros/repouso-${d}-01.svg"></figure>`).join('')}</div></main><script>const durations=${JSON.stringify(actions)},action=document.querySelector('#action'),play=document.querySelector('#play'),range=document.querySelector('#frame'),counter=document.querySelector('#counter'),speed=document.querySelector('#speed');let i=0,running=true,last=0;const show=()=>{document.querySelectorAll('img').forEach(img=>img.src='quadros/'+action.value+'-'+img.dataset.direction+'-'+String(i+1).padStart(2,'0')+'.svg');range.value=i;counter.textContent=(i+1)+' / 30'};play.onclick=()=>{running=!running;play.textContent=running?'Pausar':'Reproduzir'};range.oninput=()=>{running=false;play.textContent='Reproduzir';i=+range.value;show()};action.onchange=()=>{i=0;show()};function tick(t){const delay=i===29&&action.value==='derrota'?1200:durations[action.value]/30;if(running&&t-last>delay/+speed.value){i=(i+1)%30;show();last=t}requestAnimationFrame(tick)}show();requestAnimationFrame(tick);</script>`);
await writeFile(new URL('manifest.json',folder),JSON.stringify({character:'Graxinin',representation:'Native articulated SVG paths; no PNG character plane.',directions,actions,framesPerAction:30,release:.5,impact:.76,status:'Integrated in place of Bolota. PNG and GIF are previews of the vector rig.'},null,2));
console.log('Graxinin: vetores, visualizador e cinco prévias animadas salvos.');

