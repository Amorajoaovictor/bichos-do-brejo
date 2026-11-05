import { creatures,articulatedParts,mutationPart } from './characters.js';
import { rabbitProfile } from './rabbit-profile.js';
import { graxininParts,graxininSockets } from './graxinin-art.js';
// Arena-only views. Portraits continue to use the original front drawing.
// Profiles and backs are drawn as articulated vectors, never rotated flat faces.
const part=(name,x,y,svg='')=>({name,pivot:[x,y],svg});
const colors={rabbit:['#d8ccb1','#aaa18d','#bd8580'],rat:['#939099','#706d79','#b5837d'],frog:['#8d9c6c','#66774f','#c5b18b'],rosnaldo:['#d3c2a3','#a99c87','#9b7374']};
const path=(fill,d,extra='')=>`<path fill="${fill}" d="${d}" ${extra}/>`;

export function directionalParts(id,view){
  if(id==='raccoon')return graxininParts(view);
  if(id==='rosnaldo')return bossView(view);
  if(id==='rabbit'&&(view==='right'||view==='left'))return rabbitProfile(view);
  const [fur,shade,accent]=colors[id],frog=id==='frog',rat=id==='rat',rabbit=id==='rabbit',boss=id==='rosnaldo';
  const back=view==='up',defs=[];
  const add=(...args)=>defs.push(part(...args));
  if(back){
    add('legL',104,292,path(shade,frog?'M94 258Q56 259 58 294L47 317l17-2 5 13 13-9 9 9 17-23':'M88 288Q74 303 78 325Q93 335 119 326l-3-31Z'));
    add('legR',196,292,path(shade,frog?'M206 258Q244 259 242 294l11 23-17-2-5 13-13-9-9 9-17-23':'M212 288Q226 303 222 325Q207 335 181 326l3-31Z'));
    add('body',150,320,path(fur,frog?'M88 216Q57 238 77 285Q94 323 150 325Q206 323 223 285Q243 238 212 216Z':'M109 226Q77 251 88 300Q97 329 150 328Q203 329 212 300Q223 251 191 226Z')+path(shade,frog?'M142 235q-15 15-9 44l17 20 17-20q6-29-9-44Z':'M137 239q-11 28 0 66l13 10 13-10q11-38 0-66Z','stroke="none"')+path('none','M150 247v50','stroke="'+shade+'" stroke-width="3"'));
    if(boss)add('maneBack',150,185,path(accent,'M58 266L32 240l11-20-23-11 17-27-20-16 24-22-11-19 28-16-4-28 30-6 4-28 29 9 18-34 23 23 24-17 13 31 31-4 2 29 30 7-9 26 26 20-14 25 17 23-21 21 10 25-27 13 3 29-32-1-12 25-28-9-22 21-23-18-27 10-13-23Z')+path('none','M68 127l22 12m28-58 10 22m52-22-8 22m59 28-22 16M69 213l20-12m113 18 24 5','stroke="#795b5e" stroke-width="4"'));
    if(rabbit){
      add('earL',112,155,path(fur,'M101 158Q65 98 68 38Q71 9 85 15Q116 40 126 106l-2 45Z')+path(shade,'M78 41q7 51 30 96','fill="none" stroke="'+shade+'" stroke-width="4"'));
      add('earR',188,155,path(fur,'M177 153q13-56 36-60q34 3 51 38l-9 10 8 5-1 18q-19 17-31 4l-14-29-16 3-9 23Z'));
    }else if(!frog){
      add('earL',104,boss?108:153,path(fur,boss?'M99 120Q59 117 59 82l12-23 12 13 12-7 3 17 16-4q13 25-1 42Z':'M105 168Q58 170 61 128q5-33 37-29q34 8 27 41Z')+path(shade,boss?'M77 90q10 4 17 17':'M79 122q-4 21 20 29','stroke="'+shade+'" stroke-width="4"'));
      add('earR',196,boss?108:153,path(fur,boss?'M201 120q40-3 40-38l-12-23-12 13-12-7-3 17-16-4q-13 25 1 42Z':'M195 168q47 2 44-40q-5-33-37-29q-34 8-27 41Z'));
    }
    add('head',150,boss?203:245,path(fur,frog?'M78 188Q67 150 99 145q17 0 24 20 27-9 54 0 7-20 24-20 32 5 21 43Q252 211 232 241Q209 265 150 264Q91 265 68 241Q48 211 78 188Z':boss?'M97 106l17-11 18 9 18-9 20 9 18-9 18 12 25 30-4 54Q211 222 150 223Q89 222 73 191l3-54Z':'M102 151Q151 130 198 151Q233 176 231 211Q230 253 150 266Q70 253 69 211Q67 176 102 151Z')+path(shade,frog?'M95 195a9 8 0 1 0 1 0m105 4a8 7 0 1 0 1 0m-52-20a5 5 0 1 0 1 0':'M133 156l17 13 17-13-4 23-13 8-13-8Z','stroke="none"')+path('none',frog?'M103 222q47 19 94 0':'M128 238q22 8 44 0','stroke="'+shade+'" stroke-width="3"'));
    // Empty face joints keep attachment points available without showing eyes
    // or a mouth through the back of the skull.
    for(const name of ['eyeL','eyeR','muzzle','throat','openMouth','mouth','jaw','fangs','bib'])add(name,150,boss?130:170);
    add('armL',101,269,path(fur,frog?'M91 267l-5 37-14 18q1 9 12 0l9-9-1 17q8 4 13-15l5 15q10 0 3-20l3-39Z':'M90 266q-9 32 0 63q13 11 26-1l-2-57Z'));
    add('armR',199,269,path(fur,frog?'M209 267l5 37 14 18q-1 9-12 0l-9-9 1 17q-8 4-13-15l-5 15q-10 0-3-20l-3-39Z':'M210 266q9 32 0 63q-13 11-26-1l2-57Z'));
    if(!frog)add('tail',150,302,rabbit?path('#e6d9bd','M150 286q-23-14-28 4-18 2-10 18-9 15 9 18 10 15 24 4 18 7 23-10 15-9 5-20-2-16-23-14Z'):path('none','M150 303C150 348 208 349 219 312Q231 282 257 294','stroke="'+(rat?accent:'#9b7374')+'" stroke-width="12"'));
  }else{
    if(!frog)add('tail',110,289,rabbit?path('#e6d9bd','M108 272q-22-15-29 2-17-1-13 16-12 12 4 21 9 15 23 3l18-15Z'):path('none','M112 300C65 335 28 314 40 281Q50 255 23 249','stroke="'+(rat?accent:'#9b7374')+'" stroke-width="12"'));
    add('legL',133,289,path(shade,frog?'M122 252Q73 250 83 296l-17 25 26-4 9 10 33-20Z':'M122 286l-10 34q12 15 48 6l-4-13-13-25Z'));
    add('armL',167,262,path(shade,'M159 259l4 47 24 9 8-9-19-16-1-28Z'));
    add('body',150,320,path(fur,frog?'M116 216Q81 240 94 286Q105 321 164 323q46-1 53-30 14-49-32-73Z':'M130 225Q93 244 104 292q5 35 47 37 44-2 51-35 8-43-26-67Z')+path(shade,'M117 250q-14 25 1 46l18-8-2-33Z','stroke="none"'));
    if(boss)add('maneBack',142,180,path(accent,'M115 52l23-26 16 23 25-8 4 28 28 7-12 26 25 18-15 22 20 21-20 21 12 26-21 14 3 30-30-1-15 27-26-10-24 18-20-23-29 9-9-28-24-8 8-26-17-22 19-20-8-27 24-11-1-28 25 1 9-29Z')+path('none','M93 112l19 12m14-46 10 20M78 194l22-9m24 63 12-20','stroke="#795b5e" stroke-width="4"'));
    if(rabbit){
      add('earL',153,151,path(shade,'M144 152Q103 84 119 25q14-24 29 11 30 63 15 114Z'));
      add('earR',175,152,path(fur,'M163 155Q145 95 150 39q3-31 17-25 23 24 30 84l-8 57Z')+path('#b57c78','M172 135q-12-46-8-90 13 10 18 53l-1 39Z','stroke="none"'));
    }else if(!frog){
      add('earL',131,boss?111:154,path(shade,boss?'M133 117Q97 103 109 73l22-12 8 19 17 2-4 33Z':'M130 165q-43-5-40-39 9-37 39-25 29 11 21 43Z'));
      add('earR',161,boss?108:151,path(fur,boss?'M150 118Q121 93 144 67l18 3 7 20 13-3 2 24Z':'M154 166q-38-10-30-44 10-30 37-21 29 15 14 47Z')+path(rat?accent:'#b88782',boss?'M149 85q-6 13 11 21':'M147 123q-11 22 10 28 15-7 10-22Z','stroke="none"'));
    }
    add('head',161,boss?205:244,path(fur,frog?'M112 183q-10-34 20-40 28-3 32 29 37 3 58 24l28 24q9 18-14 30-30 20-87 9-54-4-57-36-2-22 20-40Z':rat?'M130 142q38-20 63 13l10 31 50 22q18 9 0 22l-48 22q-41 15-75-7-34-23-26-58 5-28 26-45Z':rabbit?'M129 149q41-19 67 17l9 26q27 5 37 24 10 18-6 29-27 22-62 18-48 0-64-28-26-46 19-86Z':'M119 103l18-6 12 10 21-9 25 19 8 22 36 14 13 29-10 24-31 17-30-4-32 12-32-24-16-42 7-38Z')+path(shade,frog?'M111 207a7 6 0 1 0 1 0m33-26a5 5 0 1 0 1 0':'M119 178q-14 26 5 48l15-13-2-28Z','stroke="none"'));
    add('eyeL',rat?178:frog?144:boss?178:174,rat?181:frog?170:boss?137:193,`<ellipse fill="${frog?'#d1bf7e':'#efe5c8'}" cx="${rat?178:frog?144:boss?178:174}" cy="${rat?181:frog?170:boss?137:193}" rx="${frog?22:19}" ry="${frog?25:27}"/><ellipse fill="#252922" stroke="none" cx="${rat?187:frog?154:boss?187:183}" cy="${rat?186:frog?172:boss?142:200}" rx="${frog?6:4.5}" ry="${frog?14:6}"/>`);
    add('eyeR',185,190);
    add('throat',196,252,frog?path(accent,'M164 246q31 6 61-3-2 46-39 47-27-7-22-44Z'): '');
    add('mouth',222,191,boss?path('#443333','M202 179q28-5 39 8l-9 38-26 7Z'):'');
    add('jaw',221,225,boss?path(fur,'M205 218q16 12 33-2l-5 24-19 13-15-10Z'):'');
    add('muzzle',frog?236:rat?247:boss?237:230,frog?229:rat?213:boss?171:232,
      frog?path('none','M157 235q45 16 87-6','stroke-width="4"')+path('#ede3c5','M215 242l5 10 7-14Z','stroke-width="3"'):
      boss?path('#dfd0af','M205 153q33-6 43 13 6 15-18 23l-26-7Z')+path('#af7d78','M234 156q20-5 16 9l-12 10-9-9Z'):
      path(accent,rat?'M242 202q24-5 17 10l-11 9-12-9Z':'M228 221q20-5 16 8l-10 9-10-10Z')+path('none',rat?'M245 222l-10 12-30 5m43-22 21-8m-20 16 22 2':'M235 239q-5 12-26 10m25-8 19 4','stroke-width="3"')+path('#ede3c5',rat?'M220 236l-3 18 12 1 5-23Z':'M218 249l-1 20 15-1 4-24Z','stroke-width="3"'));
    add('openMouth',237,232,frog?'<ellipse fill="#443b2d" cx="237" cy="232" rx="13" ry="10"/>':'');
    add('fangs',225,191,boss?path('#ede1bf','M231 185q-13 25 1 55-1-27 12-43Z','stroke-width="4"'):'');
    add('bib',160,243,boss?path(accent,'M131 210l17 15 4 31 15-9 11 30 16-13 5 25-25 22-20-21-20 8-9-27-19-5 5-26Z'):'');
    add('legR',151,287,path(frog?shade:fur,frog?'M143 258q-39-12-43 22-4 16 14 23l36 12-7 12-38-2-10-12-8-16q-9-42 36-47Z':'M146 283q-5 19 6 31l31 7q13 10-4 15l-46-2-14-13 4-34Z'));
    add('armR',182,261,path(fur,frog?'M177 265l4 36 26 16q10 9 14 2l-14-13 17 4q9-4-8-12l-18-7-3-29Z':'M174 258q-7 22 6 33l24 8 8-8-20-15-1-17Z')+(!frog?path(rat?accent:fur,'M200 285q17-2 18 11l-10 10-18-10Z','stroke-width="3"'):''));
  }
  const hornY=boss?103:rabbit?149:rat?139:175,hornX=back?150:170;
  add('mut_tail',back?150:110,298,path('#9c7a77',back?'M144 298q-6 42 44 30l22-15 13 4-1-14 16-7-13-8-1-16-13 8-12-11-5 19q-6 26-38 9Z':'M110 293Q62 310 61 276L48 260l-1 19-17-2 8 17-13 12 22 3 3 16 16-11q27 10 49-5Z')+path('#d5c59f',back?'M211 291l12-2-5 12Z':'M53 298l-11-6 2 13Z','stroke-width="3"'));
  add('mut_horn',hornX,hornY,path('#d9c9a5',`M${hornX-12} ${hornY+5}q-2-28 17-60-7 34 13 59Z`));
  add('mut_eye',back?150:190,hornY+28,back?'':`<ellipse fill="#ba7f72" cx="190" cy="${hornY+28}" rx="14" ry="17"/><ellipse fill="#e7d293" cx="194" cy="${hornY+28}" rx="8" ry="12"/><ellipse fill="#272a24" cx="197" cy="${hornY+28}" rx="3" ry="7" stroke="none"/>`);
  add('rage',back?150:180,boss?125:180,back?'':path(fur,boss?'M156 116l39 12-2-9-34-13Z':frog?'M125 146l40 14-4-12-29-11Z':'M157 168l42 9-1-10-36-9Z','stroke-width="4"'));
  return refineParts(defs,id,view);
}

function refineParts(defs,id,view){
  const back=view==='up',source=creatures.find(c=>c.id===id);
  const set=(name,x,y,svg)=>{const i=defs.findIndex(p=>p.name===name),p=part(name,x,y,svg);if(i<0)defs.push(p);else defs[i]=p;};
  const line=(d,color='#292b26',width=3)=>path('none',d,`stroke="${color||'#292b26'}" stroke-width="${width}"`);
  if(source){
    const originals=articulatedParts(source),get=name=>originals.find(p=>p.name===name);
    const copy=(name,dx=0,dy=0,sx=1,sy=1)=>{
      const p=get(name);if(!p)return;
      set(name,150+(p.pivot[0]-150)*sx+dx,p.pivot[1]*sy+dy,`<g transform="translate(${150+dx} ${dy}) scale(${sx} ${sy}) translate(-150 0)">${p.svg}</g>`);
    };
    if(back){
      for(const name of ['earL','earR']){const p=get(name);if(p)set(name,...p.pivot,(p.svg.match(/^<path[^>]*\/>/)||[''])[0]+line(name==='earL'?'M89 117l9 19':'M218 129l12 16','#938975',2.5));}
      // The back has nape fur and shoulder blades, rather than a face-shaped
      // oval with a smile. Preserve the species' asymmetric markings.
      const head=defs.find(p=>p.name==='head');
      head.svg=head.svg.replace(/<path fill="none"[^>]*\/>$/,'');
      head.svg+=id==='rabbit'?path('#aaa18d','M94 177q-8 21 2 33l16-10-1-18Z M161 147l-8 15 15 7 9-17Z','stroke="none"')+line('M106 231l14 9m12 5 10 5m35-10 13-7','#a69c83',2.5):id==='rat'?path('#777480','M92 176l12 13-6 16-11-9Z M174 150l6 11 9-5-5-10Z','stroke="none"')+line('M105 228l11 7m8 9 9 3m39-5 12-6','#706d79',2.5):path('#6e8055','M83 201a8 6 0 1 0 1 0m34-20a5 5 0 1 0 1 0m67-2a5 5 0 1 0 1 0m24 23a8 6 0 1 0 1 0m-72 31a4 3 0 1 0 1 0m31 7a3 3 0 1 0 1 0','stroke="none"');
      const body=defs.find(p=>p.name==='body');body.svg+=id==='frog'?path('#66774f','M99 275a6 5 0 1 0 1 0m91 8a7 5 0 1 0 1 0m-71 17a4 4 0 1 0 1 0','stroke="none"')+line('M112 249q-8 8-8 18m79-18q8 8 8 18','#71805a',2.5):line('M112 265l8 10m60-10-8 10m-42 21 8 7m28-7-8 7',id==='rat'?'#777480':'#aaa18d',2.5);
      for(const name of ['legL','legR','armL','armR']){
        const p=defs.find(p=>p.name===name);const x=p.pivot[0];p.svg+=line(`M${x-7} 320v7m8-7v8m8-8v7`,id==='frog'?'#536441':'#69665a',2.2);
      }
      if(id==='rat'){copy('tail',62,0,.85);const tail=defs.find(p=>p.name==='tail');tail.svg=`<g transform="translate(150 302) rotate(-30) translate(-150 -302)">${tail.svg}</g>`;}
    }else{
      // Reuse the actual character artwork wherever possible: eye expression,
      // scars, torn ears, toes and fur patches must survive a change of view.
      copy('body',4,0,.72);copy('tail',id==='rabbit'?38:10);
      copy('legL',3,0,.72);copy('legR',-32);copy('armL',20,0,.8);copy('armR',-8);
      if(id==='rabbit'){
        copy('earR',-38,-4,.9);copy('earL',43);
        // Far folded ear is painted first, then the tall near ear.
        const a=defs.findIndex(p=>p.name==='earL'),b=defs.findIndex(p=>p.name==='earR');[defs[a],defs[b]]=[defs[b],defs[a]];
        set('head',169,246,path('#d8ccb1','M135 150Q160 138 180 150Q204 165 204 190L222 201Q250 211 244 229Q240 245 220 253Q195 270 163 264Q127 263 114 239Q97 215 108 184Q116 159 135 150Z')+path('#aaa18d','M133 151q13-15 24-5 14-5 18 6-7 13-18 5-9 11-24-6M120 177q-13 15-7 31l13 5 10-18Z','stroke="none"')+line('M141 215l-5 25m-8-20 23 14m-15-12 11-3','#b77972',3.5)+line('M118 231l-15 2m18 8-16 8M198 254l7 4','#696959',2.5));
        copy('eyeL',44,-2,.93);copy('muzzle',62,-2,.9);
        set('rage',183,196,path('#d8ccb1','M146 169l46 13-2-10-39-12Z')+line('M198 244l9-6m18 2 8 4'));
      }else if(id==='rat'){
        copy('head');copy('earL',14,0,.8);copy('earR',-26,-4,.9);copy('eyeL',36,0,.92);copy('muzzle');
        set('rage',175,181,path('#939099','M141 162l45 16-1-10-40-16Z')+line('M199 231l16-4'));
      }else{
        copy('legL',10,0,.8);copy('legR',-36,0,.9);copy('armL',30,0,.75);copy('armR',-7,0,.9);
        set('head',165,253,path('#8d9c6c','M113 184Q104 159 120 146Q140 130 159 149L171 174Q202 176 226 199L246 217Q258 230 239 245Q215 268 168 266Q124 266 105 245Q88 224 101 202Z')+path('#b0af77','M130 220q37-16 65-7l49 10-8 23q-45 23-100 6Z','stroke="none"')+path('#6e8055','M112 201a7 6 0 1 0 1 0m66-9a5 4 0 1 0 1 0m-27-14a4 4 0 1 0 1 0m56 30a4 3 0 1 0 1 0','stroke="none"')+line('M120 214l4 3m85-8 4 3','#536441',2.5));
        copy('eyeL',46,-3,.94);copy('throat',39,0,.75);
        set('muzzle',237,232,line('M133 233Q187 256 247 228','',4)+line('M245 223l4 9m-96-12 3-1m22-1 3 1','',2.8)+path('#ede3c5','M216 242l6 11 7-16Z','stroke-width="3"')+`<ellipse fill="#bc7f67" stroke="none" cx="147" cy="241" rx="8" ry="4"/>`);
        set('rage',149,174,path('#8d9c6c','M122 146l42 14-3-12-31-12Z')+line('M179 187l6 8m44 40 9-4'));
      }
      set('eyeR',200,190,'');
      const horn=mutationPart(source,'horn');set('mut_horn',170,horn.pivot[1],`<g transform="translate(20 0)">${horn.svg}</g>`);
      const eye=mutationPart(source,'eye');set('mut_eye',186,eye.pivot[1],`<g transform="translate(24 0)">${eye.svg}</g>`);
      const tail=mutationPart(source,'tail');set('mut_tail',94,289,`<g transform="translate(300 0) scale(-1 1)">${tail.svg}</g>`);
    }
  }else if(!back){
    // Quadrupedal Rosnaldo, traced as separate anatomical layers from the
    // supplied lion reference. Hindquarters, chest and all four planted paws
    // remain readable below the mane; the jaw opens independently.
    set('tail',84,257,path('#9b7374','M100 251C71 270 45 251 41 227C36 210 41 195 53 195C69 197 78 187 66 179C47 166 28 181 25 201C17 240 45 279 78 274L103 266Z'));
    set('legL',106,273,path('#a99c87','M98 269l2 28 16 14-3 12 39 0q10-7 1-14l-17-7-9-37Z')+line('M132 311q6 3 4 11m9-8 1 7','',2.5));
    set('armL',203,267,path('#b5a88f','M192 261l-2 32 13 12-3 14h35q11-3 7-13l-20-7-4-37Z')+line('M221 307q5 4 3 12m8-11 1 9','',2.5));
    set('body',137,290,path('#d3c2a3','M104 218Q82 211 71 237Q58 255 67 279L91 294L128 286L176 283L184 235L149 214Z')+path('#b3a48b','M78 232q12-9 18 1l-4 19-12 5-7-9Z M103 276l19-9 15 7-11 14-22-2Z','stroke="none"'));
    set('legR',85,274,path('#d3c2a3','M70 255Q59 272 65 293L56 302L59 326L100 328Q110 320 99 313L90 305L94 280Z')+path('#b3a48b','M69 275l12 8 8-8-3-12-11-2Z','stroke="none"')+line('M76 313q7-1 6 13m8-10q5 2 4 11','',3));
    set('maneBack',156,184,path('#9b7374','M151 64L176 87L196 77L204 100L227 103L224 125L244 137L231 153L244 173L229 188L241 209L221 219L231 244L211 248L213 274L190 267L181 290L160 272L139 286L131 264L109 273L106 250L81 250L92 226L69 218L85 198L67 187L88 171L74 150L99 139L91 119L117 116L118 92L142 94Z')+path('#805e63','M98 141l23 10 9-11-13-10Z M90 207l24-5 7 10-17 5Z M177 102l10 16 12-11-8-13Z M113 242l16-7 12 22-15 7Z','stroke="none"')+line('M115 173l12 9m-9 43 11-5m70 17-7 13','#ae8583',2.5));
    set('earL',174,130,path('#b5a88f','M169 140l-18-12 4-21 13-6 17 12-2 22Z'));
    set('earR',194,125,path('#d3c2a3','M180 132l-2-22 12-11 11 7 4 22-9 13Z')+path('#b3a48b','M187 111l9 2 2 15-9-2Z','stroke="none"'));
    set('head',189,215,path('#d3c2a3','M169 130Q187 122 205 136L218 151L235 158L238 181L228 212L211 218L199 230L187 219L172 225L169 208L156 210L160 188L152 180L160 162L157 151Z')+path('#b3a48b','M169 188l17 4-2 27-12-6Z','stroke="none"')+line('M176 145l6-5m-19 30 6-9','#b5a88f',2.5));
    set('eyeL',212,153,'<ellipse fill="#efe5c8" cx="212" cy="153" rx="16" ry="20"/><ellipse fill="#242822" stroke="none" cx="219" cy="151" rx="4" ry="6"/>'+line('M195 135l32 6','',5));
    set('eyeR',230,155,'');
    set('mouth',238,185,path('#443333','M225 176l30 2-3 25-21 7-8-18Z')+path('#b17b77','M231 196q10-12 17 0l-1 9-14 0Z','stroke-width="2.5"'));
    set('jaw',235,201,path('#d3c2a3','M226 197q15 8 28-5l-1 14-16 10-13-3Z')+path('#e9ddbf','M229 198l5-9 7 8 7-10 4 9-2 9-20 4Z','stroke-width="2.5"'));
    set('muzzle',244,169,path('#dfd0af','M232 153l28 1 3 16-11 15-21-5Z')+path('#af7d78','M253 156l12 2-1 8-10 5-6-7Z','stroke-width="3.5"')+line('M252 173l-1 9m-14-19 1 1','',2.5));
    set('fangs',244,182,path('#ede1bf','M231 181l7 18 6-17m6-2 5 15 7-21Z','stroke-width="3"'));
    set('bib',177,241,path('#9b7374','M147 214l20 11 8 18 13-14 16 16 19-9-5 29-15-5-10 22-15-12-15 11-10-23-18 8-9-25Z')+path('#805e63','M155 236l13 16-7 9-11-19Z','stroke="none"'));
    set('armR',161,271,path('#d3c2a3','M148 260Q141 280 152 300L151 314L162 332L198 332Q211 329 207 320L191 311L180 288L178 268Z')+path('#b3a48b','M151 283l12 13 13-9-8-11Z','stroke="none"')+line('M172 317q8-3 9 13m9-11q8 0 8 11','',3));
    set('rage',212,141,path('#d3c2a3','M191 130l39 13 1-9-35-15Z')+line('M198 126l-1-8m8 10 3-8','',2.5));
  }else{
    const head=defs.find(p=>p.name==='head');head.svg=path('#d3c2a3','M99 107l21-8 15 10 15-7 20 9 20-5 18 12 14 32-5 41-17 17-29 10-31-7-26 7-21-17-13-27 6-27Z')+path('#b3a48b','M110 156l12 11-5 18-14-7Z M181 182l13-9 9 13-18 11Z','stroke="none"')+line('M127 205l11 4m27 0 12-6','#a99c87',2.5);
    defs.find(p=>p.name==='body').svg+=line('M111 269l12 13m52-12-12 12m-23 17 10 7','#a99c87',3);
  }
  if(id==='rosnaldo'&&!back){
    const order=['tail','legL','armL','body','legR','maneBack','bib','earL','earR','head','eyeL','eyeR','throat','mouth','jaw','muzzle','openMouth','fangs','armR','mut_tail','mut_horn','mut_eye','rage'];
    defs.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));
  }
  return defs;
}

export function viewSockets(id,view){
  if(id==='raccoon')return graxininSockets(view);
  if(id==='rosnaldo')return bossSockets(view);
  if(view==='up')return {muzzle:[150,165],mouth:[150,165],head:[150,190],armR:[202,315]};
  if(view==='down')return {};
  return {muzzle:id==='frog'?[246,232]:id==='rat'?[239,213]:[236,234],mouth:[244,200],head:[175,205],armR:id==='frog'?[196,314]:[177,282]};
}

// Rosnaldo's visible drawing uses the approved PNG frames. These light joints
// remain for action sockets and compatibility with the shared animation code.
function bossView(view){
  return ['body','head','earL','earR','eyeL','eyeR','muzzle','mouth','throat','openMouth','fangs','bib','maneBack','tail','legL','legR','armL','armR','mut_tail','mut_horn','mut_eye','rage']
    .map(name=>({name,pivot:[150,view==='up'?190:220],svg:''}));
}
function bossSockets(view){
  if(view==='up')return {muzzle:[150,210],mouth:[150,198],head:[150,212],armR:[150,320]};
  if(view==='left')return {muzzle:[86,198],mouth:[80,216],head:[150,190],armR:[95,300]};
  return {muzzle:[214,198],mouth:[220,216],head:[150,190],armR:[205,300]};
}
