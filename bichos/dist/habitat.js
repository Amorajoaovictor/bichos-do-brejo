import * as THREE from 'three';

export const TILE_SIZE=1.23;
export const COLS=9, ROWS=7;

// Inked, resolution-independent scenery. The grid is painted into the clearing,
// while reeds, roots and shrubs stand on its edge like cut-out illustrations.
export function buildHabitat(scene,camera,vectorPart){
  let seed=812;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:opacity===1});
  const floor=(points,color,y,opacity=1)=>{
    const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color,opacity));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;scene.add(mesh);return mesh;
  };
  const stroke=(points,color,opacity=1)=>{const geometry=new THREE.BufferGeometry().setFromPoints(points.map(([x,y,z])=>new THREE.Vector3(x,y,z)));const item=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity}));scene.add(item);return item;};
  const patch=(x,z,rx,rz,color,y=.013,opacity=.25)=>{const mesh=new THREE.Mesh(new THREE.CircleGeometry(1,11),material(color,opacity));mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rand()*6;mesh.scale.set(rx,rz,1);mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
  floor([[-20,-20],[20,-20],[20,20],[-20,20]],'#364030',-.12);
  const clearing=[[-6.5,-2.9],[-5.2,-4.55],[-3.8,-4.72],[-2.4,-5.3],[.1,-5.13],[2.1,-5.25],[4.5,-4.45],[5.3,-3.3],[6.45,-2.3],[6.48,-.3],[6.2,1.5],[5.4,3.35],[3.9,4.37],[2.1,4.8],[.3,5.08],[-1.4,4.7],[-3.8,4.66],[-5.2,3.47],[-6.5,1.85],[-6.32,.1],[-6.7,-1.25]];
  floor(clearing.map(([x,z])=>[x*1.12,z*1.15]),'#525d43',-.08);
  floor(clearing.map(([x,z],i)=>[x*1.035+(i%2)*.1,z*1.035]),'#939b7e',-.035);
  floor(clearing,'#c4c7b2',0);
  const tiles=[],blocked=new Set(['2,2','5,1','1,4']);
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
    if((col===0||col===COLS-1)&&(row===0||row===ROWS-1))continue;
    const x=(col-(COLS-1)/2)*TILE_SIZE,z=(row-(ROWS-1)/2)*TILE_SIZE;
    const tile=new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE,TILE_SIZE),material((row+col)%2?'#b9bda7':'#d6d5c1',.32));
    tile.rotation.x=-Math.PI/2;tile.position.set(x,.007,z);tile.userData={tile:true,col,row,x,z,blocked:blocked.has(`${col},${row}`)};tiles.push(tile);scene.add(tile);
    if(rand()>.5){const px=x+(rand()-.5),pz=z+(rand()-.5);stroke([[px,.019,pz],[px+.08,.019,pz-.04],[px+.14,.019,pz-.02]],'#8e9980',.4);}
    if(rand()>.66)patch(x+(rand()-.5)*.8,z+(rand()-.5)*.8,.19,.11,'#909e86',.016,.16);
  }
  for(let i=0;i<100;i++){
    const a=rand()*Math.PI*2,rx=5.8+rand()*.8,rz=4.6+rand()*.45,x=Math.cos(a)*rx,z=Math.sin(a)*rz;
    patch(x,z,.13+rand()*.3,.05+rand()*.16,'#899674',.012,.28);
    if(i%3===0){const points=[[x,.023,z],[x+.1,.023,z-.11],[x+.18,.023,z-.08],[x+.25,.023,z-.18]];stroke(points,'#717f62',.56);}
  }
  for(let i=0;i<30;i++){
    const x=(rand()-.5)*10,z=(rand()-.5)*7;
    if(i%4===0)patch(x,z,.05,.035,'#6c7a62',.02,.44);
  }
  function prop(svg,x,z,scale=.005,order=40){
    const root=new THREE.Group();root.position.set(x,.025,z);root.quaternion.copy(camera.quaternion);
    const art=new THREE.Group();art.scale.set(scale,-scale,scale);art.position.set(-150*scale,330*scale,0);
    art.add(vectorPart({svg,pivot:[0,0]},order));root.add(art);scene.add(root);return root;
  }
  function reeds(x,z,s=1,dark=false){
    const fill=dark?'#35442f':'#687c52',ink=dark?'#26362b':'#495f41';
    let svg='';
    for(let i=0;i<10;i++){let px=90+i*13,h=rand()*90+35;svg+=`<path fill="${fill}" stroke="${ink}" stroke-width="3" d="M${px} 331Q${px-25} ${300-h} ${px-20-rand()*25} ${280-h}Q${px+10} ${290-h} ${px+8} 330Z"/>`;}
    return prop(svg,x,z,.0035*s,dark?2000020:24);
  }
  const stump=`<path fill="#6e7b59" d="M77 319L111 280L109 205L92 187L89 144L111 166L129 152L135 104L153 92L168 112L166 196L193 179L206 140L218 152L213 196L178 232L183 290L223 319L181 314L151 335L126 313Z"/><path fill="#536549" stroke="none" d="M143 122l10 7-5 162 14 30-14 12-18-19 15-34Z"/><path fill="none" stroke="#384e39" stroke-width="4" d="M126 197l6 87-13 21m44-98l-4 87m-48-115l9 14m67 8l-16 11"/><ellipse fill="#b0af87" cx="149" cy="109" rx="13" ry="7"/><path fill="none" stroke="#718061" stroke-width="3" d="M143 110h10"/><path fill="#384b34" stroke-width="3" d="M117 246q-25-20-22-1q9 13 22 10m54 10q23-24 27-7q-5 13-27 16"/>`;
  const fungus=`<path fill="#a9a383" d="M122 321l7-89h24l10 91Z"/><path fill="#8c6856" d="M66 241Q69 164 137 154Q200 153 222 230Q174 251 66 241Z"/><path fill="none" stroke="#b79977" stroke-width="3" d="M83 231q71 7 124-6"/><path fill="#c3b494" stroke="none" d="M108 190a7 4 0 1 0 1 0m43-16a8 5 0 1 0 1 0m24 30a6 4 0 1 0 1 0"/><path fill="#a9a383" d="M200 329l-6-39 14-4 7 42Z"/><path fill="#8c6856" d="M172 291q6-44 31-45q34 0 39 38Z"/>`;
  const shrub=(dark=false)=>`<path fill="${dark?'#293a2b':'#536745'}" stroke="${dark?'#213127':'#344b34'}" stroke-width="5" d="M39 330Q11 302 42 281Q12 257 43 234Q28 202 61 194Q45 160 82 158Q74 127 107 130Q120 104 141 129Q170 97 189 128Q220 113 222 146Q253 140 249 175Q286 181 264 213Q292 239 267 258Q294 284 263 298L277 330Z"/><path fill="${dark?'#34472f':'#62774e'}" stroke="none" d="M52 239q2-31 24-20q17-34 32-12q21-11 29 3q-15 26-7 44q-46-17-57 9Z"/><path fill="none" stroke="${dark?'#1e3026':'#3c5537'}" stroke-width="5" d="M130 329l7-98m-4 47l-35-32m39 3l33-30m19 110l-9-67m2 22l29-23"/><path fill="none" stroke="${dark?'#42543a':'#7a8a60'}" stroke-width="3" d="M82 185l8-7m107-26l12 9m21 66l9-10M56 285l10 6"/>`;
  const bone=`<path fill="#d4cfb3" stroke="#65705a" stroke-width="3.5" d="M71 310q-14-13-3-20q-5-13 6-16q14 0 14 14l74-29q0-19 14-16q12 2 7 14q15 7 4 18q-9 8-17-1L92 302q1 17-11 17Z"/>`;
  for(const tile of tiles.filter(t=>t.userData.blocked)){const {x,z,col}=tile.userData;patch(x,z,.46,.3,'#6d7e59',.023,.25);prop(col===5?fungus:stump,x,z,col===5?.0042:.0052,100);reeds(x-.3,z+.1,.8);}
  prop(bone,-1.8,2.8,.0034,30);prop(bone,3.8,-2.4,.0027,30);
  for(let i=0;i<23;i++){
    const a=i/23*Math.PI*2;
    const x=Math.cos(a)*(6.4+rand()*.55),z=Math.sin(a)*(5.2+rand()*.35);
    const front=z>3.4||x>6.1;
    prop(shrub(front),x,z,.0043+rand()*.003,front?2000000:15);
    if(i%2===0)reeds(x*.9,z*.9,.9+rand()*.8,front);
    if(i%4===0)prop(stump,x*.98,z*.98,.0065,front?2000010:30);
  }
  // Foreground foliage makes the scene feel like a clearing inside a larger place.
  prop(shrub(true),-5.7,5.9,.009,2000030);prop(shrub(true),5.7,5.7,.009,2000030);
  for(const [x,z] of [[-4.4,-3.2],[4.3,2.7],[-4.8,2],[1.6,-3.8],[3.8,-3.7],[-1.8,3.9]])reeds(x,z,.85);
  function squareRing(outer,inner,color){const s=new THREE.Shape();s.moveTo(-outer,-outer);s.lineTo(outer,-outer);s.lineTo(outer,outer);s.lineTo(-outer,outer);s.closePath();const hole=new THREE.Path();hole.moveTo(-inner,-inner);hole.lineTo(-inner,inner);hole.lineTo(inner,inner);hole.lineTo(inner,-inner);hole.closePath();s.holes.push(hole);const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s),material(color));mesh.rotation.x=-Math.PI/2;return mesh;}
  const selection=new THREE.Group();selection.position.y=.041;const border=squareRing(.57,.49,'#394533');const inner=squareRing(.545,.512,'#ede8ce');inner.position.y=.002;selection.add(border,inner);scene.add(selection);
  const hover=new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE-.025,TILE_SIZE-.025),material('#e5cc93',.27));hover.rotation.x=-Math.PI/2;hover.position.y=.031;hover.visible=false;scene.add(hover);
  return {tiles,selection,hover};
}
