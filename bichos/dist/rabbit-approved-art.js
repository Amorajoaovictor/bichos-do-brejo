// Native vector reconstruction of the approved Farrapo studies. Every feature
// is a path/ellipse attached to the existing skeleton, never a raster texture.
import {creatures,articulatedParts,mutationPart} from './characters.js';

const fur='#d8ccb1',shade='#aaa18d',ink='#292b26';
const path=(fill,d,extra='')=>`<path fill="${fill}" d="${d}" ${extra}/>`;
const line=(d,color=ink,width=3)=>path('none',d,`stroke="${color||ink}" stroke-width="${width}"`);
const part=(name,x,y,svg='',expression)=>({name,pivot:[x,y],svg,expression});
const source=creatures.find(c=>c.id==='rabbit');

export function rabbitApprovedArt(view,angle='three-quarter'){
  const left=view==='left',profile=angle==='profile',defs=[];
  const add=(...args)=>defs.push(part(...args));
  const original=articulatedParts(source);
  const copy=(name,dx=0,sx=1)=>{
    const p=original.find(p=>p.name===name);
    add(name,150+(p.pivot[0]-150)*sx+dx,p.pivot[1],`<g transform="translate(${150+dx} 0) scale(${sx} 1) translate(-150 0)">${p.svg}</g>`);
  };
  // Preserve the original vertical torso and its hanging limbs. There is no
  // horizontal rabbit haunch or new crouching stance in the approved drawing.
  copy('tail',profile?36:18);
  copy('legL',profile?20:10,profile?.76:.88);
  copy('legR',profile?-34:-16,profile?.8:.9);
  copy('armL',profile?28:16,profile?.7:.88);
  copy('body',profile?6:8,profile?.66:.87);
  const tall=part('earL',profile?153:126,153,
    profile?path(fur,'M142 155Q117 111 110 69L112 55 105 57Q98 29 111 12Q131 16 147 47Q165 84 168 120L163 153Z')+
      path(left?shade:'#b57c78','M147 137Q128 98 123 66Q118 40 125 39Q142 58 151 91L156 135Z','stroke="none"')+line('M109 57l8 1-2 12','#827b6b',2.5):
      path(fur,'M114 157C92 127 72 82 74 52L82 54 73 43C74 19 82 7 92 13C121 32 143 88 140 127L137 150Z')+
      path(left?shade:'#b57c78','M121 139Q95 98 91 58Q87 30 100 41Q128 77 129 134Z','stroke="none"')+line('M75 54l9 1-2 13','#827b6b',2.5));
  const folded=part('earR',profile?179:191,155,
    profile?path(fur,'M167 155Q164 119 178 104Q201 109 214 139L203 143 210 151 205 165Q189 177 181 163L174 145Z')+
      path(left?'#b57c78':'#ad9787','M181 140l12 7 6-4 8 8-3 14q-12 12-23-2Z','stroke-width="3"'):
      path(fur,'M178 152Q191 108 211 99Q237 103 258 127L250 139 258 143 264 162Q251 183 238 174L224 146 209 137 198 160Z')+
      path(left?'#b57c78':'#b57c78','M224 144l10 11 5-12 9 11 8-10 5 9 3 9q-12 20-26 12Z','stroke-width="3"')+
      line('M210 118l16 26m-9-6-10 7','#817464',2.5));
  defs.push(...(left?[tall,folded]:[folded,tall]));
  if(profile){
    add('head',166,244,path(fur,'M143 146Q169 140 192 158Q213 176 217 200L222 219 238 225Q246 230 240 237L229 244Q218 263 191 267Q159 271 137 257Q111 244 109 222Q104 198 117 178Q127 156 143 146Z')+
      path(shade,left?'M187 174q19-8 24 11l-2 25-14 6-14-20Z M146 150q10-9 19-4l10 9-15 9-13-4Z':'M139 152q7-12 18-7 12-4 18 5l-6 12-17-2-9 7-12-5Z M122 172q-15 15-11 33l13 5 13-21Z','stroke="none"')+
      (left?line('M120 229l-13 3m17 7-13 7','#817b68',2.5):line('M155 214l-6 23m-8-18 23 12m-13-10 10-3','#b77972',3.5)+line('M115 223l-12 2m14 8-13 7','#696959',2.5)));
    const name=left?'eyeR':'eyeL';
    add(name,192,199,eyeSVG(192,199,left?21:26,left?28:34,199,207),{rx:left?21:26,ry:left?28:34,angle});
    add(left?'eyeL':'eyeR',212,204,'',{hidden:true});
    add('muzzle',234,234,path('#bd8580','M230 224q8-3 13 2l-7 8-8-6Z','stroke-width="3.5"')+
      path('#ede3c5','M222 243l-1 22 11 1 4-24Z M234 241l-3 24 9-3 3-25Z','stroke-width="3.5"')+
      line('M236 234l-3 7-17 6m16-6 11-6','',3.5),{angle});
  }else{
    add('head',160,246,path(fur,'M119 147Q144 137 169 146Q201 150 218 174Q232 192 233 211L240 216Q246 233 231 247Q212 263 184 267Q151 273 119 261Q90 253 81 231Q73 211 82 190Q91 161 119 147Z')+
      path(shade,left?'M190 168q15-7 26 7l2 22-14 11-15-12Z M128 147q9-12 20-6 14-4 19 7l-10 12-17-3Z':'M118 147q9-14 21-8 15-4 21 7-4 13-18 9-8 10-24-2Z M94 169q-14 15-13 34l15 8 15-21Z M216 177q-11-5-18 7l3 19 18-8Z','stroke="none"')+
      (left?line('M221 229l7 9m-6-3 9-1','#b77972',2.6):line('M108 213l-6 23m-8-18 24 12m-13-10 11-3','#b77972',3.5))+
      line('M86 221l-14 2m16 10-14 7m149-5 16 5m-18 3 13 8','#696959',2.5));
    const eyes=left?
      [['eyeR',145,199,19,26,150,207],['eyeL',219,207,20,29,220,215]]:
      [['eyeL',146,197,28,36,141,209],['eyeR',220,211,17,24,218,216]];
    for(const [name,x,y,rx,ry,px,py] of eyes)add(name,x,y,eyeSVG(x,y,rx,ry,px,py),{rx,ry,angle});
    add('muzzle',198,243,path('#bd8580','M190 229q8-4 16 0l-8 9-8-5Z','stroke-width="3.5"')+
      path('#ede3c5','M182 246l-1 21q15 5 29 0l3-22-15 1Z','stroke-width="3.8"')+
      line('M198 238v9m-22 5q20-19 40-2M197 249l-1 18','',3.5),{angle});
  }
  copy('armR',profile?-13:-2,profile?.8:.93);
  add('throat',190,251);add('openMouth',profile?234:198,248);
  const horn=mutationPart(source,'horn'),eye=mutationPart(source,'eye'),tail=mutationPart(source,'tail');
  const foreheadX=profile?172:165;
  add('mut_tail',94,289,`<g transform="translate(300 0) scale(-1 1)">${tail.svg}</g>`);
  add('mut_horn',foreheadX,horn.pivot[1],`<g transform="translate(${foreheadX-150} 0)">${horn.svg}</g>`);
  add('mut_eye',profile?187:184,eye.pivot[1],`<g transform="translate(${profile?24:16} 0)">${eye.svg}</g>`);
  add('rage',profile?192:146,178,path(fur,profile?'M166 169l46 13-2-9-39-13Z':'M119 167l51 17-2-10-45-15Z')+
    (profile?'':path(fur,'M203 190l31-8-2-7-29 6Z')));
  return defs;
}

function eyeSVG(x,y,rx,ry,px,py){
  return `<ellipse fill="#f0e8cd" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/><ellipse fill="#252922" stroke="none" cx="${px}" cy="${py}" rx="${rx>24?4.8:3.8}" ry="${ry>30?6.4:5.2}"/>`+
    line(`M${x-rx*.62} ${y+ry+3}q${rx*.66} 8 ${rx*1.3} -1`,'#6f705f',2.6);
}
