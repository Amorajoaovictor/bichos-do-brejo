import {loadArt,renderRig,originalFrame,VIEWS,SLOTS,LABELS,MUTATIONS,DURATIONS} from './rig.js';

const $=id=>document.getElementById(id);
const state={action:'idle',elapsed:0,playing:true,speed:1,view:'down',mode:'assembled',isolate:'head',guides:false,mutations:Object.fromEntries(SLOTS.map(s=>[s,true]))};
const frames={},stages=[];
let art,last=performance.now();
for(const slot of SLOTS){
  const label=document.createElement('label');label.className='slot';label.textContent=LABELS[slot];
  const select=document.createElement('select');select.id=`slot-${slot}`;select.setAttribute('aria-label',LABELS[slot]);
  select.innerHTML=`<option value="0">Original</option><option value="1" selected>${MUTATIONS[slot]}</option>`;
  select.onchange=()=>{state.mutations[slot]=select.value==='1';show();};label.append(select);$('slots').append(label);
  const option=document.createElement('option');option.value=slot;option.textContent=LABELS[slot];$('isolate').append(option);
}

function makeStages(){
  $('stages').replaceChildren();stages.length=0;
  $('stages').className=state.view==='all'?'all-views':'';
  const names={right:'PERFIL DIREITO',left:'PERFIL ESQUERDO',down:'FRENTE',up:'COSTAS'};
  for(const view of state.view==='all'?VIEWS:[state.view]){
    const section=document.createElement('div');section.className='stage';
    const title=document.createElement('p');title.className='view-title';title.textContent=names[view];section.append(title);
    const wrap=document.createElement('div');wrap.className='canvas-wrap';
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=560;canvas.setAttribute('aria-label',`Comparação de Farrapo: ${names[view].toLowerCase()}`);wrap.append(canvas);section.append(wrap);
    const captions=document.createElement('div');captions.className='captions';captions.innerHTML='<span>ATUAL · QUADROS COMPLETOS</span><span>PNG · PEÇAS ORIGINAIS</span><span>PNG · SUA COMBINAÇÃO</span>';section.append(captions);
    $('stages').append(section);stages.push({view,canvas,ctx:canvas.getContext('2d')});
  }
  show();
}

function renderCharacter(ctx,view,kind,index){
  ctx.save();
  const expanded=state.mode==='exploded',scale=expanded?.64:.87;
  ctx.translate(index*400+200,490);ctx.scale(scale,scale);ctx.translate(-256,-480);
  if(kind==='original'){
    const frame=originalFrame(state.action,state.elapsed),image=frames[`${view}-${frame}`];
    if(image){
      // The existing viewer supplies vertical travel separately from its walk PNGs.
      const progress=state.elapsed/.48;
      const lift=state.action==='walk'?Math.sin(Math.max(0,Math.min(1,(progress-.15)/.68))*Math.PI)*47:0;
      ctx.drawImage(image,0,-lift,512,512);
    }
  }else renderRig(ctx,art,{view,action:state.action,elapsed:state.elapsed,mutations:kind==='mutant'?state.mutations:{},mode:state.mode,isolate:state.isolate,guides:state.guides});
  ctx.restore();
}

function show(){
  if(!art)return;
  for(const {view,ctx,canvas} of stages){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<3;i++){
      ctx.save();ctx.fillStyle='#11190f36';ctx.beginPath();ctx.ellipse(i*400+200,496,91,9,0,0,Math.PI*2);ctx.fill();ctx.restore();
      renderCharacter(ctx,view,['original','normal','mutant'][i],i);
    }
    ctx.strokeStyle='#b8c2a51c';ctx.lineWidth=1;
    for(const x of [400,800]){ctx.beginPath();ctx.moveTo(x,40);ctx.lineTo(x,520);ctx.stroke();}
  }
  $('frame').value=Math.round(state.elapsed/DURATIONS[state.action]*1000);
  if(document.activeElement!==$('seconds'))$('seconds').value=state.elapsed.toFixed(2);
  $('seconds').max=DURATIONS[state.action];
  const n=Object.values(state.mutations).filter(Boolean).length;
  $('status').textContent=`${n} de ${SLOTS.length} partes alteradas · ${state.action==='barrage'&&state.elapsed>=2.3?'alívio · ':''}${state.playing?'em reprodução':'pausado'}`;
  $('play').textContent=state.playing?'Pausar':'Reproduzir';
  $('isolate-wrap').hidden=state.mode!=='isolate';
}

function setMutations(fn){for(const [i,slot] of SLOTS.entries()){state.mutations[slot]=!!fn(slot,i);$(`slot-${slot}`).value=state.mutations[slot]?'1':'0';}show();}
$('all').onclick=()=>setMutations(()=>true);
$('none').onclick=()=>setMutations(()=>false);
$('random').onclick=()=>setMutations(()=>Math.random()>.5);
$('action').onchange=()=>{state.action=$('action').value;state.elapsed=0;show();};
$('speed').onchange=()=>{state.speed=+$('speed').value;};
$('play').onclick=()=>{if(state.action==='death'&&state.elapsed>=DURATIONS.death)state.elapsed=0;state.playing=!state.playing;last=performance.now();show();};
$('restart').onclick=()=>{state.elapsed=0;show();};
$('frame').oninput=()=>{state.playing=false;state.elapsed=+$('frame').value/1000*DURATIONS[state.action];show();};
$('seconds').oninput=()=>{state.playing=false;state.elapsed=Math.max(0,Math.min(DURATIONS[state.action],+$('seconds').value));show();};
$('mode').onchange=()=>{state.mode=$('mode').value;show();};
$('isolate').onchange=()=>{state.isolate=$('isolate').value;show();};
$('guides').onchange=()=>{state.guides=$('guides').checked;show();};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
  state.view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));makeStages();
});
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!['SELECT','INPUT','BUTTON'].includes(event.target.tagName)){event.preventDefault();$('play').click();}});

try{
  art=await loadArt();
  await Promise.all(VIEWS.flatMap(view=>Array.from({length:24},async(_,i)=>{
    const image=new Image();image.src=`/art/farrapo/png-v1/quadros/${view}-${String(i).padStart(2,'0')}.png`;await image.decode();frames[`${view}-${i}`]=image;
  })));
  makeStages();last=performance.now();
  function tick(now){
    if(state.playing){
      state.elapsed+=Math.min(.05,(now-last)/1000)*state.speed;
      if(state.action==='death'&&state.elapsed>=DURATIONS.death){state.elapsed=DURATIONS.death;state.playing=false;}
      else state.elapsed%=DURATIONS[state.action];
      show();
    }
    last=now;requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  window.rabbitLayers={state,art,frames,stages,show,makeStages,renderRig};
}catch(error){$('status').textContent=`Não foi possível abrir a prévia: ${error.message}`;console.error(error);}
