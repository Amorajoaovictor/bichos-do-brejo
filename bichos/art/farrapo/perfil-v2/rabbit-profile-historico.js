// Both anatomical sides are drawn in right-facing rig space. Facing mirrors
// the complete skeleton once; eye, scars and ear overlap differ by side.
import { creatures, mutationPart } from './characters.js';

const fur='#d8ccb1', shade='#aaa18d', ink='#292b26';
const path=(fill,d,extra='')=>`<path fill="${fill}" d="${d}" ${extra}/>`;
const line=(d,color=ink,width=3)=>path('none',d,`stroke="${color}" stroke-width="${width}"`);
const part=(name,x,y,svg='')=>({name,pivot:[x,y],svg});

export function rabbitProfile(view){
  const opposite=view==='left';
  const tall=part('earL',139,158,
    path(fur,'M128 161C110 132 94 91 96 59L103 61 95 48C93 26 99 12 109 16C137 29 155 80 157 116L153 155Z')+
    path(opposite?shade:'#b57c78','M135 141C121 113 109 78 109 48Q110 34 119 49Q140 83 143 135Z','stroke="none"')+
    line('M97 62l8 1-2 11','#817c6b',2.5));
  const folded=part('earR',167,158,
    path(fur,'M156 154Q157 117 174 105Q187 96 203 108Q226 122 236 149L226 157 233 160 232 176Q219 190 207 176L195 147 181 139 178 163Z')+
    path(opposite?'#b57c78':'#ad9787','M198 141l10 13 5-9 7 11 7-2 6 7-1 15q-14 15-25 0Z','stroke-width="3"')+
    line('M179 120l19 22m-9-4-8 9','#817464',2.5));
  const defs=[
    part('tail',104,291,path(fur,'M105 278Q89 263 82 278Q64 275 70 290Q56 302 72 309Q80 325 95 314L110 302Z')+line('M76 292q6-6 12-3','#a69c83',2.5)),
    part('legL',133,291,path('#ada58e','M122 283Q112 302 120 317L147 322Q162 327 153 334L112 332Q100 326 102 312L105 290Z')+line('M139 323v8m8-7v7','#69665a',2.5)),
    part('armL',175,263,path('#ada58e','M169 259Q163 278 173 296L176 319 184 330Q198 334 201 325L193 315 191 289 184 261Z')+line('M187 322v7m7-7v6','#69665a',2.5)),
    part('body',148,321,path(fur,'M126 231Q104 240 100 265L95 278 101 280Q92 301 108 318Q129 331 158 325Q187 326 196 309Q202 289 191 267L179 237Z')+
      path(shade,'M113 250q-17 16-9 35l15-3 7-23Z M145 310l13-13 16 7-6 15-18 3Z','stroke="none"')+
      path('#e6d9bd','M158 259q22-1 24 23 2 23-20 26-17-17-4-49Z','stroke="none"')+
      path(fur,'M133 279Q113 271 103 289Q94 309 112 320L134 321','stroke-width="4"')+
      path('#c3b79d','M112 285q-12 13-1 24l13-5 5-15Z','stroke="none"')+
      line('M113 294l7 4m10 12-4 7','#918975',2.5)),
    // The thigh belongs to the torso; only the lower leg and paw extend in a
    // kick. Stretching the entire haunch used to flatten it into a loose loop.
    part('legR',125,307,path(fur,'M115 303Q109 315 121 321L147 322 162 326Q172 332 162 338L126 337Q111 334 108 322L107 309Z')+
      line('M149 328v8m8-7v7','#69665a',2.5)),
    ...(opposite?[tall,folded]:[folded,tall]),
    part('head',160,242,path(fur,'M131 157Q151 145 172 153L185 151 184 158Q199 165 202 186L205 201Q223 204 234 217L242 226Q244 237 232 245L219 248Q199 266 169 261Q138 262 119 244L108 242 114 236Q101 220 108 199L104 192 112 190Q113 168 131 157Z')+
      path(shade,opposite?'M170 174q18-10 24 7l-1 24-16 5-10-17Z M124 157l10-8 15 5-4 10-15 3Z':'M130 157q8-14 20-7 14-5 18 6-7 12-18 5-8 10-20-4 M117 187q-11 17-5 29l13 4 9-21Z','stroke="none"')+
      (opposite?line('M124 229l-12 4m15 5-13 9','#817b68',2.5):line('M138 216l-5 23m-8-19 22 13m-13-12 10-3','#b77972',3.5)+line('M114 223l-14 1m17 11-14 7','#696959',2.5))),
    part('eyeL',174,opposite?199:194,
      `<ellipse fill="#f0e8cd" cx="174" cy="${opposite?199:194}" rx="${opposite?18:24}" ry="${opposite?25:33}"/>`+
      `<ellipse fill="#252922" stroke="none" cx="${opposite?180:179}" cy="${opposite?207:206}" rx="${opposite?4:5}" ry="${opposite?5:7}"/>`+
      line(opposite?'M161 228q12 6 22-1':'M157 232q15 9 28-1','#6f705f',2.5)),
    part('eyeR',195,205),
    part('muzzle',230,226,
      path('#e2d5b8','M201 222Q213 216 228 224Q238 226 235 236Q231 244 218 242L206 248 196 243','stroke-width="3.5"')+
      path('#ede3c5','M216 239l-1 22 12 2 4-21Z M228 241l-1 21 10-2 3-23Z','stroke-width="3.5"')+
      path('#bd8580','M227 220q8-4 15 1l-8 8-8-4Z','stroke-width="3"')+
      line('M234 230l-3 6-13 3m-10-10-1 1m12-6-1 1m17 9 15 1m-17 6 12 6','#696959',2.5)),
    part('armR',180,264,path(fur,'M174 259Q166 277 177 294L180 321 184 333Q196 341 208 333L209 323 202 315 200 287 191 262Z')+
      path('#c3b79d','M181 291l7 23 10 3-2-18Z','stroke="none"')+line('M191 326v10m8-10v10','#69665a',2.5)),
    part('throat',193,250),part('openMouth',230,239),
  ];
  const source=creatures.find(c=>c.id==='rabbit');
  const horn=mutationPart(source,'horn'),eye=mutationPart(source,'eye'),tail=mutationPart(source,'tail');
  defs.push(part('mut_tail',94,289,`<g transform="translate(300 0) scale(-1 1)">${tail.svg}</g>`),
    part('mut_horn',170,horn.pivot[1],`<g transform="translate(20 0)">${horn.svg}</g>`),
    part('mut_eye',186,eye.pivot[1],`<g transform="translate(24 0)">${eye.svg}</g>`),
    part('rage',174,194,path(fur,'M149 171l45 13-2-9-38-12Z')+line('M208 244l8-4')));
  return defs;
}
