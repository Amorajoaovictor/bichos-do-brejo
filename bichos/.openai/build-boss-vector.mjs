import {writeFile} from 'node:fs/promises';
import {quantize,paint,boundsOf,ellipseMask,rectMask,nearestColor} from './vectorizer.mjs';

// Historical vector study. The game now renders the approved PNG frames directly.
// The full drawing stays one body layer; the face and the jaw are cut out of it
// and the cut is filled with mane colour, so moving them never opens a hole.
const views=[
  {
    view:'down',source:'art/rosnaldo/repouso-v1/quadros/frente-01.png',size:420,
    face:{cx:240,cy:235,rx:64,ry:74},jaw:[218,252,288,306],hinge:[253,252],facePivot:[240,235],
  },
  {
    view:'right',source:'art/rosnaldo/repouso-v1/quadros/direita-01.png',size:409,
    face:{cx:330,cy:205,rx:54,ry:64},jaw:[316,212,386,262],hinge:[318,214],facePivot:[330,205],
  },
  {
    view:'left',source:'art/rosnaldo/repouso-v1/quadros/esquerda-01.png',size:409,
    face:{cx:80,cy:205,rx:54,ry:64},facePivot:[80,205],
  },
  {view:'up',source:'art/rosnaldo/repouso-v1/quadros/costas-01.png',size:420},
];

const TARGET=[150,333,300,330];
const out={};
for(const config of views){
  const {index,palette,w,h}=await quantize(config.source,{size:config.size,colors:32});
  const bounds=boundsOf(index,w,h);
  const k=Math.min(TARGET[2]/bounds.width,TARGET[3]/bounds.height);
  const tx=TARGET[0]-((bounds.minX+bounds.maxX)/2)*k,ty=TARGET[1]-bounds.maxY*k;
  const place=([x,y])=>[Math.round((x*k+tx)*10)/10,Math.round((y*k+ty)*10)/10];
  const wrap=svg=>`<g transform="translate(${Math.round(tx*10)/10} ${Math.round(ty*10)/10}) scale(${Math.round(k*1000)/1000})">${svg}</g>`;
  const parts=[];
  if(config.face){
    const mane=nearestColor(palette,[168,80,95]);
    const faceMask=ellipseMask(w,h,config.face.cx,config.face.cy,config.face.rx,config.face.ry);
    // The jaw is cut along the mouth line, not as a box: the seam then opens
    // exactly where the mouth is and keeps the muzzle silhouette intact.
    // A mandíbula recortada abria uma caixa escura quando o queixo descia: o
    // recorte fica apenas no rosto, com a boca fechada como no repouso da prancha.
    // The cut is filled only where the lion actually exists: the fill is the fur
    // that sits behind the face and the mouth dark that sits behind the jaw, so
    // moving either layer never uncovers the swamp background.
    const cutIndex=Uint8Array.from(index);
    const cut=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++){
      if(index[i]===255)continue;
      if(faceMask[i]){cut[i]=1;cutIndex[i]=mane;}
    }
    parts.push({name:'body',pivot:place([(bounds.minX+bounds.maxX)/2,bounds.maxY]),svg:wrap(paint({index:cutIndex,palette,w,h},{epsilon:.6}))});
    const outsideFace=Uint8Array.from(faceMask,y=>y?0:1);
    parts.push({name:'head',pivot:place(config.facePivot),svg:wrap(paint({index,palette,w,h},{epsilon:.5,region:outsideFace,fill:null}))});

  }else{
    parts.push({name:'body',pivot:place([(bounds.minX+bounds.maxX)/2,bounds.maxY]),svg:wrap(paint({index,palette,w,h},{epsilon:.6}))});
  }
  out[config.view]=parts;
  console.log(config.view,'pivot',parts.map(p=>p.name+':'+p.pivot.join(',')).join(' | '),'bytes',parts.reduce((sum,p)=>sum+p.svg.length,0));
}
const file=`// Historical vector study generated from the approved PNG sheets.
// The game renders the PNG frames directly; this file is not loaded at runtime.
export const bossArt=${JSON.stringify(out,null,0)};
`;
await writeFile('dist/boss-art.js',file);
console.log('wrote dist/boss-art.js',file.length,'bytes');
