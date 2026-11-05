// Face replacements share the existing eye/muzzle joints, including side views.
const ink='#292b26';
import { graxininParts } from './graxinin-art.js';
import { creatures } from './characters.js';
const flushPalette={'#d8ccb1':'#d57568','#aaa18d':'#ac6259'};
export function rabbitFlushColor(base,amount){
  const target=flushPalette[base];if(!target)return base;
  const a=parseInt(base.slice(1),16),b=parseInt(target.slice(1),16),t=Math.max(0,Math.min(1,amount));
  return '#'+[16,8,0].map(shift=>Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t).toString(16).padStart(2,'0')).join('');
}
function flushedHead(svg,amount){
  for(const base of Object.keys(flushPalette))svg=svg.replaceAll(`fill="${base}"`,`fill="${rabbitFlushColor(base,amount)}" data-rabbit-flush="${base}"`);
  return svg;
}
function expressionShapes(id,emotion,name,x,y,profile=false,feature,original='',flush){
  if(id==='rabbit'&&name==='head'){
    // Repaint the native head paths so the flush follows its exact silhouette,
    // fur markings and skull joint, without a floating blush sticker.
    return flushedHead(original,flush??(emotion==='strain'?1:emotion==='panic'?.35:0));
  }
  // The front view keeps the original rabbit mouth and its two incisors.
  // Effort reads through the flushed head, eyelids and brows, without a grin
  // or an extra row of teeth competing with the character's buck teeth.
  if(id==='rabbit'&&!profile&&name==='muzzle')return original||creatures.find(c=>c.id==='rabbit').parts.find(p=>p.name==='muzzle').svg;
  if(id==='raccoon'){
    const direction=profile?(feature?.anatomical==='left'?'left':'right'):'down';
    const original=graxininParts(direction,false).find(p=>p.name===name)?.svg||'';
    if(name==='muzzle')return original;
    if(feature?.referenceTrace)return original;
    const rx=feature?.rx??(profile?26:name==='eyeL'?31:25),ry=feature?.ry??(profile?32:name==='eyeL'?38:29);
    if(emotion==='relief')return `<path fill="#e8e2c6" d="M${x-rx} ${y}q${rx} ${-ry} ${rx*2} 0q${-rx} ${ry} ${-rx*2} 0Z"/><path fill="none" stroke-width="4" d="M${x-rx+4} ${y}q${rx-4} 9 ${rx*2-8} 0"/>`;
    if(emotion==='anger')return original+`<path fill="none" stroke-width="5" d="M${x-rx} ${y-ry+4}l${rx*2} 12"/>`;
    return original;
  }
  const frog=id==='frog',rat=id==='rat',fur=frog?'#8d9c6c':rat?'#939099':'#d8ccb1';
  const eye=name.startsWith('eye'),right=name==='eyeR',s=right?-1:1;
  if(id==='rabbit'&&profile&&name==='muzzle'){
    // A side muzzle keeps its projecting nose and paired incisors. Frontal
    // mouth replacements used to turn the profile into a detached beak.
    const nose=`<path fill="#bd8580" stroke-width="3.5" d="M${x-4} ${y-10}q8-3 13 2l-7 8-8-6Z"/>`;
    const teeth=`<path fill="#ede3c5" stroke-width="3.5" d="M${x-12} ${y+9}l-1 22 11 1 4-24Z M${x} ${y+7}l-3 24 9-3 3-25Z"/>`;
    if(emotion==='strain')return `<path fill="#ede3c5" stroke-width="3.5" d="M${x-34} ${y+3}q13-7 25 1l-4 12q-14 1-23-5Z"/><path fill="none" stroke-width="2.5" d="M${x-34} ${y+9}l23 1m-16-6v9m8-10v10M${x-42} ${y+4}l-3 6m4 4 4 4"/>${teeth}${nose}`;
    if(emotion==='panic')return `<path fill="none" stroke-width="3.5" d="M${x+2} ${y}l-3 7-17 6m-7 1 5-3"/>${teeth}${nose}`;
    if(emotion==='relief')return `${teeth}${nose}<path fill="none" stroke-width="3" d="M${x+4} ${y+5}l-4 7q-12 9-24 1"/>`;
    if(emotion==='anger')return `${teeth}${nose}<path fill="none" stroke-width="3.5" d="M${x+4} ${y+5}l-5 5-23 7"/>`;
  }
  if(eye){
    const rabbitSide=id==='rabbit'&&profile;
    const rx=feature?.rx??(rabbitSide?(y===199?18:24):profile?19:right?19:frog?24:rat?25:29),ry=feature?.ry??(rabbitSide?(y===199?25:33):profile?27:right?25:frog?27:rat?29:37);
    // Original eyes are hidden by setExpression. A skin-coloured rectangle is
    // unnecessary here and used to protrude past the side of the round head.
    if(id==='rabbit'&&emotion==='relief')return `<path fill="none" stroke-width="4" d="M${x-rx+3} ${y+4}q${rx-3} 15 ${rx*2-6} 0m-${rx*2-7} 10q${rx-4} 8 ${rx*2-8} 0"/>`;
    if(id==='rabbit'&&(emotion==='panic'||emotion==='strain')){
      const outer=rabbitSide?1:s;
      const sweat=`<path fill="#91bdc5" stroke-width="2.5" d="M${x-outer*(rx+9)} ${y-ry*.55}q${-outer*13} 17 ${-outer*6} 23q${outer*14} 6 ${outer*6} -23Z M${x-outer*(rx+15)} ${y-ry*.55-15}q${-outer*7} 9 ${-outer*3} 12q${outer*8} 2 ${outer*3} -12Z"/>`;
      const folds=`<path fill="none" stroke="#854e48" stroke-width="2.5" d="M${x-rx*.5} ${y+ry*.72}l-3 7m10-6-2 7m10-6-1 6"/>`;
      if(emotion==='strain')return `<path fill="#d57568" stroke-width="3.5" d="M${x-rx} ${y-ry*.3}q${rx} ${-ry*.5} ${rx*2} 0q${-rx*.1} ${ry*.85} ${-rx} ${ry*.9}q${-rx*.9} 0 ${-rx} ${-ry*.9}Z"/><path fill="none" stroke-width="5" d="M${x-rx*.77} ${y-ry*.12}l${rx*1.15} ${ry*.18}l${-rx*.9} ${ry*.23}m${rx*.75} ${-ry*.23}l${rx*.55} ${-ry*.22}M${x-rx*.85} ${y-ry*.64}q${rx*.85} ${-ry*.34} ${rx*1.7} ${ry*.12}"/><path fill="none" stroke="#854e48" stroke-width="2.5" d="M${x-rx*.4} ${y-ry*.92}l4-7m6 9 4-7"/>${folds}${sweat}`;
      return `<ellipse fill="#f6ebd0" cx="${x}" cy="${y}" rx="${rx*1.02}" ry="${ry}"/><ellipse fill="${ink}" stroke="none" cx="${x+outer*3}" cy="${y-3}" rx="3" ry="4.5"/><path fill="none" stroke-width="4.5" d="M${x-rx*.92} ${y-ry-5}q${rx*.9} -12 ${rx*1.8} 4M${x-rx*.65} ${y+ry-2}q${rx*.65} 9 ${rx*1.3} 0"/>${folds}${sweat}`;
    }
    if(emotion==='panic')return `<ellipse fill="#f6ebd0" cx="${x}" cy="${y}" rx="${rx*1.08}" ry="${ry*1.04}"/><ellipse fill="${ink}" stroke="none" cx="${x}" cy="${y+4}" rx="3" ry="5"/><path fill="none" stroke-width="4" d="M${x-rx} ${y-ry-7}q${rx} -15 ${rx*2} -3"/><path fill="#91bdc5" stroke-width="2" d="M${x+rx+7} ${y-10}q-12 18-3 22q16 3 3-22Z"/>`;
    if(emotion==='relief')return `<path fill="${fur}" stroke="none" d="M${x-rx-4} ${y-ry}h${rx*2+8}v${ry*2}h-${rx*2+8}Z"/><path fill="none" stroke-width="4" d="M${x-rx+3} ${y+4}q${rx-3} 15 ${rx*2-6} 0m-${rx*2-7} 10q${rx-4} 8 ${rx*2-8} 0"/>`;
    if(emotion==='anger')return `<ellipse fill="#efe5c8" cx="${x}" cy="${y}" rx="${rx}" ry="${ry*.63}"/><ellipse fill="${ink}" stroke="none" cx="${x+s*5}" cy="${y+6}" rx="4" ry="6"/><path fill="${fur}" stroke-width="4" d="M${x-rx} ${y-ry*.7-s*6}l${rx*2} ${s*13}v-15l${-rx*2} ${-s*13}Z"/>`;
  }
  if(name==='muzzle'){
    if(emotion==='panic')return `<path fill="#bd8580" stroke-width="3" d="M${x-8} ${y-13}q8-5 16 0l-8 8Z"/><path fill="#503e34" stroke-width="4" d="M${x-23} ${y+8}q23-22 46 0l-3 21q-20-12-40 0Z"/><path fill="#ede3c5" stroke-width="2" d="M${x-17} ${y+4}q17-9 34 0v10h-34Z"/>`;
    if(emotion==='relief')return `<path fill="none" stroke-width="4" d="M${x-(frog&&!profile?65:22)} ${y}q${frog&&!profile?65:22} ${frog?27:22} ${frog&&!profile?130:44} -2"/><path fill="none" stroke="#b18472" stroke-width="3" d="M${x-26} ${y+8}l-3 6m7-4-2 6m46-8 3 6"/>${frog?'':`<path fill="#bd8580" stroke-width="3" d="M${x-7} ${y-13}q7-4 14 0l-7 6Z"/>`}`;
    if(emotion==='anger')return `<path fill="#b5837d" stroke-width="3" d="M${x-6} ${y-10}q10-4 15 2l-7 8Z"/><path fill="#e7d8b4" stroke-width="3" d="M${x-24} ${y+10}l34-7-2 15-30 4Z"/><path fill="none" stroke-width="2" d="M${x-10} ${y+9}v12m12-15v11"/>`;
  }
  return '';
}

export function expressionSVG(id,emotion,name,x,y,profile=false,feature,original='',flush){
  const svg=expressionShapes(id,emotion,name,x,y,profile,feature,original,flush);
  if(id==='rabbit'&&name.startsWith('eye')&&emotion==='strain')return svg.replace('fill="#d57568"',`fill="${rabbitFlushColor('#d8ccb1',flush??1)}" data-rabbit-flush="#d8ccb1"`);
  return svg;
}

export function expressiveArtwork(creature,emotion,flush){
  if(!emotion||emotion==='neutral')return creature;
  return {...creature,parts:creature.parts.map(p=>{
    if(!['eyeL','eyeR','muzzle',...(creature.id==='rabbit'?['head']:[])].includes(p.name))return p;
    return {...p,svg:expressionSVG(creature.id,emotion,p.name,...p.pivot,false,creature.id==='raccoon'?p.expression:undefined,p.svg,flush)||p.svg};
  })};
}

export function installExpressions(rig,vectorPart){
  if(rig.pngRig)return;
  for(const [direction,view] of Object.entries(rig.views??{down:rig})){
    view.expressions=[];view.faceTints=[];
    if(direction==='up'){
      // The nape flushes with the same curve, while the rear drawing keeps no
      // eyes, mouth or frontal expression layers.
      if(rig.id==='rabbit')view.parts.head?.traverse(o=>{
        if(!o.isMesh||!o.material.color)return;
        const base='#'+o.material.color.getHexString();
        if(flushPalette[base])view.faceTints.push({color:o.material.color,base});
      });
      continue;
    }
    for(const name of ['eyeL','eyeR','muzzle',...(rig.id==='rabbit'?['head']:[])]){
      const part=view.parts[name];if(!part)continue;
      const feature=part.userData.expression;
      if(feature?.hidden||(direction!=='down'&&name==='eyeR'&&!feature))continue;
      const originals=[...part.children],variants={};
      for(const emotion of ['panic','relief','anger',...(rig.id==='rabbit'?['strain']:[])]){
        const pivot=[part.userData.baseX,part.userData.baseY];
        const layer=vectorPart({pivot,svg:expressionSVG(rig.id,emotion,name,...pivot,direction!=='down'&&feature?.angle!=='three-quarter',feature,part.userData.svg)},part.children[0]?.userData.baseOrder??250);
        // Preserve the original feature's depth alongside other facial joints.
        const orders=[],localOrders=[];part.traverse(o=>{if(o.isMesh){orders.push(o.renderOrder);localOrders.push(o.userData.localOrder??o.renderOrder);}});
        let order=0;layer.traverse(o=>{if(o.isMesh){const offset=.01+order++*.0001;o.renderOrder=(orders.length?Math.min(...orders):250)+offset;o.userData.localOrder=(localOrders.length?Math.min(...localOrders):250)+offset;}});
        layer.position.set(0,0,0);layer.visible=false;part.add(layer);variants[emotion]=layer;
      }
      view.expressions.push({originals,variants});
    }
    if(rig.id==='rabbit')for(const name of ['head','eyeL','eyeR'])view.parts[name]?.traverse(o=>{
      if(!o.isMesh||!o.material.color)return;
      const hex='#'+o.material.color.getHexString();
      const base=['#d8ccb1','#d57568',rabbitFlushColor('#d8ccb1',.35)].includes(hex)?'#d8ccb1':['#aaa18d','#ac6259',rabbitFlushColor('#aaa18d',.35)].includes(hex)?'#aaa18d':null;
      if(base)view.faceTints.push({color:o.material.color,base});
    });
  }
  rig.expression='neutral';rig.emotionLeft=0;setFaceFlush(rig,0);
}

export function setFaceFlush(rig,amount){
  if(rig.setFaceFlush){rig.setFaceFlush(amount);return;}
  rig.faceFlush=amount;
  for(const view of Object.values(rig.views??{down:rig}))for(const {color,base} of view.faceTints??[])color.setStyle(rabbitFlushColor(base,amount));
}

export function setExpression(rig,emotion='neutral'){
  rig.expression=emotion;
  rig.onExpression?.(emotion);
  for(const view of Object.values(rig.views??{down:rig}))for(const {originals,variants} of view.expressions??[]){
    originals.forEach(p=>p.visible=emotion==='neutral');
    for(const [name,layer] of Object.entries(variants))layer.visible=name===emotion;
  }
  if(emotion==='neutral')setFaceFlush(rig,0);
}
