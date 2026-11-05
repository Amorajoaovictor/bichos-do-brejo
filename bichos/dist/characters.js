import { graxinin,graxininParts } from './graxinin-art.js';
// Original vector artwork. Every animated part remains a separate SVG path group.
const ink = '#292b26';
export const wrapSVG = (content, cls='') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" class="${cls}"><g stroke="${ink}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`;
const part = (name, x, y, svg) => ({name, pivot:[x,y], svg});
export const creatures = [
  {id:'rabbit',name:'Farrapo',type:'COELHO',mood:'TEMPERAMENTO NERVOSO',species:'Oryctolagus incomum',gender:'♂',health:18,color:'#b39d77',phase:0.4,
    description:'Uma orelha a menos de ter um dia bom. Desconfia de cenouras e de quase todo o resto.',
    idle:'Respiração, orelha inquieta e piscadas', position:[-2.05,0,.65],
    parts:[
      part('tail',67,285,`<path fill="#d8ccb1" d="M75 267C56 251 47 263 48 276C26 275 31 295 42 299C30 313 51 326 65 315L83 302Z"/><path fill="none" stroke="#a69c83" stroke-width="3" d="M47 292q8-9 14-4"/>`),
      part('backfeet',150,325,`<path fill="#ada58e" d="M81 291q-10 17-7 31q11 14 36 5l11-29M184 300l8 29q27 9 35-6l-10-30"/>`),
      part('body',146,325,`<path fill="#d8ccb1" d="M104 239C81 252 77 288 86 311L89 331Q101 339 114 330L116 315Q148 329 179 315L181 331Q194 341 207 331L210 310C222 276 206 249 185 240Z"/><path fill="#aaa18d" stroke="none" d="M94 258q-15 14-5 32q21 2 24-20q1-11-19-12M166 307q10-17 24-4l-6 14l-18 1"/><path fill="#e6d9bd" stroke="none" d="M123 275q18-24 38 2q16 27-20 31q-30-4-18-33"/><path fill="none" stroke-width="3" d="M97 326v7m9-8v8m84-8v9m9-9v8M131 313l-3 10m35-13l3 11"/>`),
      part('earL',108,154,`<path fill="#d8ccb1" d="M100 157C75 129 54 80 58 51L67 51L58 41C59 17 71 3 81 10C116 34 133 91 123 146Z"/><path fill="#b57c78" stroke="none" d="M107 139C87 107 72 75 74 44C75 29 85 33 94 50Q119 86 114 137Z"/><path fill="none" stroke-width="3" d="M58 53l10 1-3 13"/>`),
      part('earR',186,155,`<path fill="#d8ccb1" d="M175 149Q192 91 210 91Q249 99 269 135L257 143L264 146L267 166Q247 189 233 176L218 145L205 138L192 161Z"/><path fill="#b57c78" d="M225 143l6 9 6-15 7 13 13-7 7 4 3 19q-16 24-31 10Z"/><path fill="none" stroke-width="3.5" d="M208 115l17 29M215 133l-10 10"/>`),
      part('head',150,246,`<path fill="#d8ccb1" d="M107 144C81 154 62 186 65 218C65 244 88 261 125 266C169 278 220 259 228 234C245 204 221 171 195 157Q152 133 107 144Z"/><path fill="#aaa18d" stroke="none" d="M106 148q7-16 22-8q17-4 18 8q-8 14-22 5q-8 12-18-5M204 176q-15-10-22 5q-7 18 6 25l20-8Z"/><path fill="none" stroke="#b77972" stroke-width="4" d="M87 211l-6 27m-6-20l20 15m-13-15l10-4"/><path fill="none" stroke-width="3" d="M70 222l-17 2m19 12l-18 8m161-14l24 7m-26 6l20 13"/>`),
      part('eyeL',125,197,`<ellipse fill="#f0e8cd" cx="125" cy="198" rx="29" ry="37"/><ellipse fill="#252922" stroke="none" cx="116" cy="211" rx="5.5" ry="7"/><path fill="none" stroke="#6f705f" stroke-width="3" d="M108 237q16 9 28-1"/>`),
      part('eyeR',202,212,`<ellipse fill="#f0e8cd" cx="201" cy="211" rx="19" ry="25"/><ellipse fill="#252922" stroke="none" cx="198" cy="216" rx="4" ry="5"/>`),
      part('muzzle',163,242,`<path fill="none" stroke-width="4" d="M141 250q19-19 39-4M164 235v15"/><path fill="#bd8580" stroke-width="3.5" d="M155 228q7-4 16 0l-7 8Z"/><path fill="#ede3c5" stroke-width="4" d="M148 246l2 23q15 5 26 0l2-24l-14 1Z"/><path fill="none" stroke-width="3" d="M163 249v17"/>`),
    ]},
  {id:'rat',name:'Fusível',type:'RATO',mood:'PÉSSIMAS INTENÇÕES',species:'Rattus duvidósus',gender:'♂',health:14,color:'#969199',phase:2.3,
    description:'Coleciona coisas que não deveria. Tem um dente torto e um plano que não vai contar.',
    idle:'Focinho farejando e cauda sinuosa',position:[.5,0,-1.3],
    parts:[
      part('tail',89,301,`<path fill="none" stroke-width="16" d="M97 302C46 338 20 312 32 277C42 250 9 244 15 221"/><path fill="none" stroke="#bd8580" stroke-width="8" d="M97 302C46 338 20 312 32 277C42 250 9 244 15 221"/><path fill="none" stroke="#765f5b" stroke-width="2" d="M40 310l5-7m-13-2l7-3m-8-13l8 1m-8-17l8 4m-21-24l9-2"/>`),
      part('backfeet',147,326,`<path fill="#b5837d" d="M97 303l-16 16q-14 17 25 13l20-20m52-5l12 23q24 6 29-4l-17-22"/>`),
      part('body',148,328,`<path fill="#939099" d="M112 225Q77 258 94 303L102 324Q109 334 120 325L125 309Q143 323 169 309L174 325q11 13 24 1l4-22q20-38-14-72Z"/><path fill="#b7aba6" stroke="none" d="M123 251q31-27 46 7q15 37-14 45q-35 1-32-52"/><path fill="none" stroke="#777480" stroke-width="4" d="M98 277l9 5m-3-16l6 5m79 17l-9 4"/><path fill="none" stroke-width="3" d="M109 323v6m8-8v6m66-3v7m8-6v5"/>`),
      part('earL',107,159,`<path fill="#939099" d="M101 170C52 166 46 125 65 103C83 77 121 91 127 121L121 155Z"/><path fill="#b5837d" d="M97 152q-33-8-27-31q9-24 29-8q18 13 9 31"/><path fill="none" stroke="#d3ad8a" stroke-width="4" d="M63 145C49 169 72 176 77 156"/>`),
      part('earR',188,156,`<path fill="#939099" d="M179 151q-8-48 24-53q42-5 35 29l-8 1 5 9q-17 31-44 26Z"/><path fill="#b5837d" stroke="none" d="M195 143q-7-27 12-29q22-2 13 18q-7 17-25 11"/>`),
      part('head',150,235,`<path fill="#939099" d="M112 135Q80 154 83 193Q76 223 110 240Q135 258 185 245L237 218Q250 208 232 198L208 190Q200 147 167 137L159 124L149 138L136 126L132 140Z"/><path fill="#b7aba6" stroke="none" d="M190 193q28 0 43 13l-18 20q-36 23-44 8q-12-24 19-41"/><path fill="none" stroke="#706d79" stroke-width="3" d="M97 207l-10 9m13 0l-7 9M173 144l4 10m-20-13l3 9"/><path fill="none" stroke="#ad7773" stroke-width="3.5" d="M112 211l13 16m-15-3l16-13"/>`),
      part('eyeL',128,184,`<ellipse fill="#e8ddba" cx="129" cy="184" rx="25" ry="29"/><ellipse fill="#252922" stroke="none" cx="139" cy="192" rx="5" ry="6"/><path fill="#939099" d="M104 177l50 1q-7-26-28-22q-18 0-22 21Z"/>`),
      part('eyeR',187,183,`<ellipse fill="#e8ddba" cx="186" cy="184" rx="18" ry="24"/><ellipse fill="#252922" stroke="none" cx="194" cy="191" rx="4" ry="5"/><path fill="#939099" d="M168 175l36 1q-7-20-20-16q-14 1-16 15Z"/>`),
      part('muzzle',213,213,`<path fill="#b5837d" d="M229 199q21-5 16 9l-10 10-11-10Z"/><path fill="none" stroke-width="3" d="M233 217l-8 13q-22 11-37 2m43-20l23-8m-25 16l27 2m-25 6l18 10M213 230l-3 12"/><path fill="#d8c789" stroke-width="3.5" d="M200 232l-3 23 13 1 6-25"/>`),
      part('hands',154,283,`<path fill="#b5837d" d="M116 270q-9 6 4 20l17 1 4-6-10-6-2-10M182 270q13 0 9 14l-14 10-10-7 9-9-1-6"/><path fill="none" stroke-width="2.5" d="M125 283l3 6m53-6l3 4"/>`),
    ]},
  graxinin,
];

// The portraits keep the original drawing. In the arena, limbs have their own
// shoulder/hip pivots, including the portions previously baked into the torso.
export function articulatedParts(creature){
  if(creature.id==='raccoon')return creature.parts.map(p=>({...p}));
  const defs=creature.parts.filter(p=>!['backfeet','hands'].includes(p.name)).map(p=>({...p}));
  const replaceBody=(before,after)=>{const body=defs.find(p=>p.name==='body');body.svg=body.svg.replace(before,after);};
  let rear,front;
  if(creature.id==='rabbit'){
    replaceBody('L89 331Q101 339 114 330L116 315Q148 329 179 315L181 331Q194 341 207 331L210 310','Q148 331 210 310');
    replaceBody('M97 326v7m9-8v8m84-8v9m9-9v8M131 313l-3 10m35-13l3 11','M131 313l-3 10m35-13l3 11');
    rear=[part('legL',103,289,'<path fill="#ada58e" d="M81 291q-10 17-7 31q11 14 36 5l11-29"/>'),part('legR',198,289,'<path fill="#ada58e" d="M184 300l8 29q27 9 35-6l-10-30"/>')];
    front=[part('armL',101,275,'<path fill="#d8ccb1" d="M88 276q-6 21 1 55Q101 339 114 330l2-26 1-27"/><path fill="none" stroke-width="3" d="M97 326v7m9-8v8"/>'),part('armR',195,275,'<path fill="#d8ccb1" d="M181 278l-2 27 2 26Q194 341 207 331l3-23-2-29"/><path fill="none" stroke-width="3" d="M190 325v9m9-9v8"/>')];
  }else if(creature.id==='rat'){
    replaceBody('L102 324Q109 334 120 325L125 309Q143 323 169 309L174 325q11 13 24 1l4-22','Q143 329 202 304');
    replaceBody('M109 323v6m8-8v6m66-3v7m8-6v5','M109 307l8 5m66-5l8-3');
    rear=[part('legL',109,299,'<path fill="#b5837d" d="M97 303l-16 16q-14 17 25 13l20-20"/>'),part('legR',190,300,'<path fill="#b5837d" d="M178 307l12 23q24 6 29-4l-17-22"/>')];
    front=[part('armL',111,254,'<path fill="#939099" d="M101 253q-8 20 15 32l13-9-8-21"/><path fill="#b5837d" d="M116 270q-9 6 4 20l17 1 4-6-10-6-2-10"/><path fill="none" stroke-width="2.5" d="M125 283l3 6"/>'),part('armR',185,238,'<path fill="#939099" d="M175 253l1 27 15 4q15-16 5-30"/><path fill="#b5837d" d="M182 270q13 0 9 14l-14 10-10-7 9-9-1-6"/><path fill="none" stroke-width="2.5" d="M181 283l3 4"/>')];
  }else{
    rear=[part('legL',95,259,'<path fill="#78865a" d="M95 253Q58 254 56 293l-13 24 17-2 3 13 15-9 9 11 19-22"/>'),part('legR',204,259,'<path fill="#78865a" d="M198 257q39-7 47 34l15 24-18-1-4 14-13-9-11 11-20-24"/>')];
    front=[part('armL',103,269,'<path fill="#8d9c6c" d="M94 265l-7 38-17 18q-1 10 11 3l10-9-3 16q6 7 12-10l4-6 4 16q8 5 7-8l-3-24 6-28"/><path fill="#6f7d50" stroke="none" d="M99 286a4 4 0 1 0 1 0"/>'),part('armR',197,269,'<path fill="#8d9c6c" d="M205 266l9 38 17 17q0 10-11 3l-11-9 4 16q-6 7-12-10l-5-6-3 16q-8 5-8-8l3-24-6-28"/><path fill="#6f7d50" stroke="none" d="M203 278a4 4 0 1 0 1 0"/>')];
    defs.push(part('openMouth',151,232,'<ellipse fill="#443b2d" stroke-width="4" cx="151" cy="232" rx="32" ry="16"/><path fill="#a2b357" stroke-width="2.5" d="M128 241q23-15 46 0q-23 13-46 0Z"/>'));
  }
  const tail=defs.filter(p=>p.name==='tail');
  return [...tail,...rear,...defs.filter(p=>p.name!=='tail'),...front];
}

export const mutations = [
  {id:'horn',name:'Chifre ósseo',detail:'Uma ideia que saiu da cabeça.',icon:'♮'},
  {id:'eye',name:'Terceiro olho',detail:'Agora a paranoia faz sentido.',icon:'◉'},
  {id:'tail',name:'Cauda espinhosa',detail:'Um pequeno problema a mais.',icon:'ϟ'},
];
export function ragePart(creature){
  if(creature.id==='raccoon')return graxininParts('down').find(p=>p.name==='rage');
  if(creature.id==='rabbit')return part('rage',163,205,`<path fill="#d8ccb1" stroke-width="5" d="M101 173L150 188L147 179L108 163Z M181 195L218 183L213 177L184 186Z"/><path fill="none" stroke-width="3" d="M157 179l4 9m7-12l-3 10M142 251l9-6m26 2l7 5"/>`);
  if(creature.id==='rat')return part('rage',160,184,`<path fill="#939099" stroke-width="5" d="M104 162L151 180L151 170L110 152Z M169 179L203 165L198 157L170 170Z"/><path fill="none" stroke-width="3" d="M157 156l4 10m6-13l-3 12M199 231l16-4"/>`);
  return part('rage',151,194,`<path fill="#8d9c6c" stroke-width="5" d="M77 150L121 168L119 155L86 143Z M180 165L225 147L217 139L182 153Z"/><path fill="none" stroke-width="3.5" d="M138 188l7 8m21-8l-7 8M83 225l11-3m120 0l11-4"/>`);
}
export function mutationPart(creature, id) {
  if(creature.id==='raccoon')return graxininParts('down').find(p=>p.name==='mut_'+id);
  const y = creature.id === 'rabbit' ? 149 : creature.id === 'rat' ? 139 : 175;
  if(id==='horn') return part('mut_horn',150,y,`<path fill="#d9c9a5" d="M137 ${y+4}Q136 ${y-31} 158 ${y-64}Q148 ${y-28} 171 ${y-1}Z"/><path fill="none" stroke="#a99b7e" stroke-width="2.5" d="M143 ${y-12}l14-3m-12-10l10-2"/>`);
  if(id==='eye') return part('mut_eye',163,y+26,`<path fill="#ba7f72" stroke-width="3.5" d="M145 ${y+25}Q162 ${y+3} 180 ${y+25}Q166 ${y+48} 145 ${y+25}Z"/><ellipse fill="#e7d293" stroke-width="3" cx="164" cy="${y+25}" rx="10" ry="12"/><ellipse fill="#272a24" stroke="none" cx="166" cy="${y+26}" rx="4" ry="7"/>`);
  return part('mut_tail',206,289,`<path fill="#9c7a77" d="M199 290Q246 298 255 268Q265 244 245 224L254 209L264 228L276 219L273 241L289 240L280 259L290 267L272 277Q256 315 208 311Z"/><path fill="none" stroke="#c19a8d" stroke-width="4" d="M216 298q37 2 47-28"/><path fill="#d5c59f" stroke-width="3" d="M253 262l13-5-1 13Z"/>`);
}
export function portraitSVG(creature, active = new Set(), animated = false) {
  const ordered = [...creature.parts];
  if(active.has('tail')) ordered.unshift(mutationPart(creature,'tail'));
  let content = ordered.filter(p=>!(p.name==='tail'&&active.has('tail'))).map(p=>`<g class="${animated&&p.name.startsWith('ear')?'portrait-ear':''}">${p.svg}</g>`).join('');
  for(const id of ['horn','eye']) if(active.has(id)) content += mutationPart(creature,id).svg;
  return wrapSVG(`<g class="${animated?'portrait-breathe':''}">${content}</g>`);
}


