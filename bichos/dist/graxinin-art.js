// Native SVG curves, split at anatomical joints. PNG studies are references only.
import { graxininFaces } from './graxinin-face-v2.js';
const fur='#a59b88',shade='#847d6e',light='#d0c5ad',ink='#292b26';
const p=(name,x,y,svg='',expression)=>({name,pivot:[x,y],svg,expression});
const path=(fill,d,extra='')=>`<path fill="${fill}" d="${d}" ${extra}/>`;
const line=(d,color=ink,width=3)=>path('none',d,`stroke="${color}" stroke-width="${width}"`);
const oval=(fill,x,y,rx,ry,extra='')=>`<ellipse fill="${fill}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${extra}/>`;
export const canSVG=path('#b7695e','M128 116l45 5-3 59q-22 13-48-2Z')+path('#e9dfbf','M141 120q-8 15 3 25t-5 35l13 2q16-18 4-32t1-28Z','stroke="none"')+oval('#a59d89',151,119,25,10)+oval('#292b26',154,118,11,3,'stroke="none"')+line('M127 177q20 10 42 2','#804e46',2);
export const bottleSVG=path('#667b4f','M141 94l22 3-4 13-2 20 17 29-7 43q-21 9-39-5l5-43 14-26 1-20-9-5Z')+path('#d8d2ad','M132 158l37 5-4 25-36-6Z','stroke-width="3"')+line('M146 163l-3 17',ink,4)+line('M139 148l8-16','#93a777',3)+line('M143 100l16 2','#8f9e78',4);
const tail=()=>path(shade,'M125 303C78 328 27 292 24 252Q20 222 40 215Q66 208 82 247Q102 271 132 275Z')+path('#343630','M27 237q15-16 34-9l15 25q-21-7-40 17Z M58 293q17-21 31-31l25 13q-19 15-23 34Z','stroke="none"')+line('M125 303C78 328 27 292 24 252Q20 222 40 215Q66 208 82 247Q102 271 132 275Z');
const lid=(side)=>side?path('#999587','M123 236q-18 4-18 40t22 44l10-8-3-71Z')+line('M119 248q-9 32 5 55','#c0b9a5',4):oval('#aaa494',157,282,55,51)+oval('none',157,282,43,39,`stroke="#7c7b70" stroke-width="3"`)+path('#5e6057','M136 274h43l3 14h-9v-5h-28v5h-10Z')+line('M125 253l8 3m52 43 5 4m-59-1 7 1','#8d8270',4);
function ear(name,x,side=false,back=false){
  const left=name==='earL';
  const d=side?(left?'M124 124Q95 94 102 54Q106 40 119 49Q147 66 151 108Z':'M163 119Q173 66 208 50Q222 45 225 61Q234 97 210 129Z'):(left?'M91 131Q63 96 68 53Q71 40 82 47Q116 63 131 100Z':'M188 102Q209 62 235 47Q246 42 248 58Q253 103 229 134Z');
  const inner=left?'M82 63q23 15 31 39l-20 12q-12-23-11-51Z':'M233 63q-24 16-30 39l19 13q14-24 11-52Z';
  return p(name,x,123,path(fur,d)+(!back&&!side?path(light,inner,'stroke-width="3"'):side?line(left?'M115 64q19 17 21 38':'M211 65q-21 15-24 34',light,8):line(left?'M88 91l10 10':'M226 91l-10 10',shade,3)));
}
export function graxininParts(view='down',extras=true){
  const side=view==='right'||view==='left',back=view==='up',sleepy=view==='left';
  const defs=[p('tail',125,291,tail()),p('legL',132,300,path(shade,'M118 293l-8 35q10 10 32 3l6-31Z')+line('M119 326v6m9-5v6')),p('legR',193,300,path(fur,'M178 294l1 35q15 8 33 1l-7-34Z')+line('M187 326v7m9-7v7'))];
  if(side)defs.push(p('lid',121,270,lid(true)));
  defs.push(p('body',160,299,path(fur,side?'M144 224q-29 25-22 73 5 24 39 24 36 2 42-26 6-41-23-66Z':'M122 226q-22 29-14 70 7 26 54 25 48 2 54-27 6-42-24-66Z')+path(light,side?'M161 244q29 17 25 53-16 16-39 7Z':'M143 245q27-15 45 8l7 43q-26 24-53 3Z','stroke="none"')+path(shade,'M113 267l12-8 9 11-6 13-14-3Z M185 301l9-9 11 5-2 12Z','stroke="none"')+path('#946c46',side?'M137 231l53 25 3 11-60-27Z':'M115 231l97 38-3 10-98-38Z M200 231l-17 46-10-4 17-46Z','stroke-width="3"')));
  const ax=side?176:back?208:119,ay=248;
  defs.push(p('armL',side?149:back?114:207,250,path(shade,side?'M140 245q-10 25 1 57l12 2 8-11-5-44Z':back?'M107 244q-9 29-3 65l16 5 6-12-3-53Z':'M199 244q15 24 12 65l-14 9-10-8 1-58Z')));
  // Back skull has only fur; eyes, nose and teeth never paint through it.
  defs.push(ear('earL',104,side,back),ear('earR',211,side,back));
  const head=side?'M121 108l18-18 10 14 13-23 2 25 22-10-5 16q25 11 33 37l12 30 24 11-17 14 14 17-21 7 9 15-25 3q-59 9-103-8l-18-15 11-15-20-11 21-11-8-18 20-9Z':'M99 105l27-18 14 19 18-26 1 24 23-11-3 20q30 1 48 24l15 32 19 11-17 17 17 13-21 12 8 16-28 3q-66 16-121-4l-23-16 14-15-24-15 23-12-9-19 21-11Z';
  defs.push(p('head',side?170:160,231,path(fur,head)+path(light,side?'M152 203q37-15 76-6l7 18-27 18-48-1-26-15Z':'M89 211q17-28 56-12l26 5 43-5 23 16-19 19q-65 17-112-3Z','stroke="none"')+(!back?path('#343630',side?'M160 149q22-26 48-4 13 13 9 32-7 24-35 25l-26-18-8-16Z':'M88 154q25-23 54-1l19 8 32-15q28-14 44 11l-3 37-36 11-42-18-27 20-40-13Z','stroke="none"'):'')+(!back&&!side?line('M89 211l13 14m-16-4 19-11','#6c655b',4):'')+path(shade,back?'M128 126l11-8 7 14-10 8Z M204 200l9-5 5 11-12 8Z':'M108 232l8-7 9 5-7 10Z','stroke="none"')));
  if(back){
    // Reuse outline but replace the muzzle-colored lower panel with nape fur.
    defs.find(d=>d.name==='head').svg=path(fur,head)+line('M95 150l10-10m108 10-10-10',ink,4);
    defs.push(p('eyeL',118,173,'',{hidden:true}),p('eyeR',203,175,'',{hidden:true}),p('muzzle',166,217,''));
  }else if(side){
    const cx=188,cy=171,rx=26,ry=32;
    defs.push(p('eyeL',cx,cy,oval('#f1e9cc',cx,cy,rx,ry)+oval(ink,200,173,4.5,6,'stroke="none"')+(sleepy?path(shade,'M162 157q4-22 26-19 23 2 26 23l-52 1Z','stroke-width="4"'):''),{rx,ry,anatomical:sleepy?'left':'right'}),p('eyeR',188,171,'',{hidden:true}));
    defs.push(p('muzzle',232,199,path('#242923','M227 190q17-4 17 5l-9 10-9-5Z','stroke-width="3"')+line('M233 203v10l-13 3')+path('#eae3c7','M219 215l-1 19 12-1 3-20Z','stroke-width="3"')));
  }else{
    defs.push(p('eyeL',118,173,oval('#f1e9cc',118,173,31,38)+oval(ink,122,179,4.5,6,'stroke="none"'),{rx:31,ry:38}),p('eyeR',203,175,oval('#e8e2c6',203,175,25,29)+oval(ink,204,181,4,5,'stroke="none"')+path(shade,'M179 166q1-23 23-23 23 0 26 25Z','stroke-width="4"'),{rx:25,ry:29}));
    defs.push(p('muzzle',169,211,path('#252b25','M161 202q9-6 18 0l-8 9Z','stroke-width="3"')+line('M171 211v10m-17 4q15-11 32-1')+path('#eae3c7','M157 225l1 18 23 1 3-20Z','stroke-width="3.5"')+line('M170 227v14',ink,2.5)));
  }
  defs.push(p('armR',ax,ay,path(fur,`M${ax-10} ${ay-3}q-10 24-4 51l-3 13 8 3 5-7 3 9 7-2 1-9 6 6 6-6-8-16 0-35Z`)+line(`M${ax-5} ${ay+49}l1 9m8-11 1 9`,ink,2.5)));
  if(back)defs.push(p('lid',157,282,lid(false)));
  const canX=side?182:166;
  defs.push(p('can',canX,284,back?'':`<g transform="translate(${canX-151*.48} ${284-150*.48}) scale(.48)">${canSVG}</g>`));
  // Empty mouth joint is retained for shared reaction/reset compatibility.
  defs.push(p('openMouth',170,220,''));
  if(extras){
    defs.push(p('mut_tail',125,291,path('#827b67','M119 297Q51 335 30 265l-15-8 9-12-5-19 19 5 10-15 10 18 18-3-3 18q13 26 54 26Z')));
    defs.push(p('mut_horn',160,104,path('#d9c9a5','M149 108q-3-27 18-57-8 33 8 56Z')));
    defs.push(p('mut_eye',160,129,back?'':oval('#d9c9a5',160,129,12,15)+oval(ink,163,131,4,7,'stroke="none"')));
    defs.push(p('rage',160,149,''));
  }
  // Preserve the approved face's silhouette and asymmetric features as paths.
  // Ears are included in the traced skull silhouette; eyeballs keep their own
  // pivots, so blinking cannot distort the head or move the muzzle.
  const face=graxininFaces[view];
  for(const def of defs){
    if(['earL','earR','head','eyeL','eyeR','muzzle'].includes(def.name)){
      const approved=face.find(p=>p.name===def.name);
      if(approved)Object.assign(def,approved);
      else{def.svg='';if(def.name.startsWith('eye'))def.expression={hidden:true};}
    }
  }
  return defs;
}
export const graxinin={id:'raccoon',name:'Graxinin',type:'GUAXINIM',mood:'DESCONFIADO E MAL DORMIDO',species:'Guaxinim',gender:'♂',health:24,color:fur,phase:4.2,description:'Um olho no perigo, outro quase dormindo. A lata está sempre à mão.',idle:'Respiração, piscadas e cauda inquieta',position:[2.15,0,1.25],parts:graxininParts('down',false)};
export function graxininSockets(view){return {armR:view==='down'?[120,305]:view==='up'?[209,305]:[177,305],muzzle:view==='down'?[170,211]:[232,199],head:[160,170]};}

