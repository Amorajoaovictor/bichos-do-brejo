import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {writeFile} from 'node:fs/promises';

// Tracer: turns one approved PNG frame into flat vector shapes. The game draws
// characters with SVGLoader, so the reference art has to become paths instead of
// hand-invented polygons. Colours are reduced with median cut, then each colour
// mask is outline-traced (outer contours and holes) and simplified.

const pixelsOf=async(path,size)=>{
  const {data,info}=await sharp(path).ensureAlpha().resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).raw().toBuffer({resolveWithObject:true});
  return {data,width:info.width,height:info.height};
};

function medianCut(samples,count){
  const bounds=list=>{
    const min={r:255,g:255,b:255},max={r:0,g:0,b:0};
    for(const pixel of list){min.r=Math.min(min.r,pixel.r);min.g=Math.min(min.g,pixel.g);min.b=Math.min(min.b,pixel.b);max.r=Math.max(max.r,pixel.r);max.g=Math.max(max.g,pixel.g);max.b=Math.max(max.b,pixel.b);}
    const entry=[...list];entry.min=min;entry.max=max;return entry;
  };
  let boxes=[bounds(samples)];
  while(boxes.length<count){
    let index=-1,score=-1;
    for(let i=0;i<boxes.length;i++){
      const box=boxes[i];if(box.length<8)continue;
      const spread=Math.max(box.max.r-box.min.r,box.max.g-box.min.g,box.max.b-box.min.b);
      const value=spread*Math.log2(box.length+1);
      if(value>score){score=value;index=i;}
    }
    if(index<0)break;
    const box=boxes[index],channel=['r','g','b'].sort((a,b)=>(box.max[b]-box.min[b])-(box.max[a]-box.min[a]))[0];
    const sorted=[...box].sort((a,b)=>a[channel]-b[channel]),mid=sorted.length>>1;
    boxes.splice(index,1,bounds(sorted.slice(0,mid)),bounds(sorted.slice(mid)));
  }
  return boxes.map(box=>{
    let r=0,g=0,b=0;for(const pixel of box){r+=pixel.r;g+=pixel.g;b+=pixel.b;}
    return {r:Math.round(r/box.length),g:Math.round(g/box.length),b:Math.round(b/box.length)};
  });
}

const hex=({r,g,b})=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');

// Marching squares with consistently oriented directed segments, stitched into
// closed loops. Outer boundaries and holes come out as separate loops, which the
// even-odd fill rule resolves without any nesting bookkeeping.
function loops(mask,w,h){
  const at=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&mask[y*w+x]?1:0;
  const vw=2*w+2;
  const vid=(x2,y2)=>y2*vw+x2;
  const segments=new Map();
  const add=(ax,ay,bx,by)=>segments.set(vid(ax,ay),{ax,ay,bx,by});
  for(let y=-1;y<h+1;y++)for(let x=-1;x<w+1;x++){
    const tl=at(x,y),tr=at(x+1,y),br=at(x+1,y+1),bl=at(x,y+1);
    const code=tl|(tr<<1)|(br<<2)|(bl<<3);
    if(code===0||code===15)continue;
    const top=[2*x+1,2*y],right=[2*x+2,2*y+1],bottom=[2*x+1,2*y+2],left=[2*x,2*y+1];
    const emit=(a,b)=>add(a[0],a[1],b[0],b[1]);
    switch(code){
      case 1:emit(top,left);break;
      case 2:emit(right,top);break;
      case 3:emit(right,left);break;
      case 4:emit(bottom,right);break;
      case 5:emit(bottom,right);emit(top,left);break;
      case 6:emit(bottom,top);break;
      case 7:emit(bottom,left);break;
      case 8:emit(left,bottom);break;
      case 9:emit(top,bottom);break;
      case 10:emit(left,top);emit(right,bottom);break;
      case 11:emit(right,bottom);break;
      case 12:emit(left,right);break;
      case 13:emit(top,right);break;
      case 14:emit(left,top);break;
      default:break;
    }
  }
  const result=[],used=new Set();
  for(const startId of segments.keys()){
    if(used.has(startId))continue;
    const loop=[];let id=startId;
    while(segments.has(id)&&!used.has(id)){
      const segment=segments.get(id);used.add(id);
      loop.push([segment.ax/2,segment.ay/2]);
      id=vid(segment.bx,segment.by);
    }
    if(loop.length>3)result.push(loop);
  }
  return result;
}

function simplify(points,epsilon){
  if(points.length<4)return points;
  const square=epsilon*epsilon;
  const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
  const stack=[[0,points.length-1]];
  while(stack.length){
    const [first,last]=stack.pop();
    let far=-1,distance=square;
    const [ax,ay]=points[first],[bx,by]=points[last];
    const dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy)||1;
    for(let i=first+1;i<last;i++){
      const [px,py]=points[i];
      const d=Math.abs(dy*px-dx*py+bx*ay-by*ax)/length;
      if(d>distance){distance=d;far=i;}
    }
    if(far>0){keep[far]=1;stack.push([first,far],[far,last]);}
  }
  return points.filter((_,i)=>keep[i]);
}

export async function trace(path,{size=340,colors=12,epsilon=1.1}={}){
  const {data,width:w,height:h}=await pixelsOf(path,size);
  const samples=[];
  for(let i=0;i<w*h;i++){
    if(data[i*4+3]<200)continue;
    samples.push({r:data[i*4],g:data[i*4+1],b:data[i*4+2]});
  }
  const stride=Math.max(1,Math.floor(samples.length/60000));
  const palette=medianCut(samples.filter((_,i)=>i%stride===0),colors);
  const index=new Uint8Array(w*h).fill(255);
  for(let i=0;i<w*h;i++){
    if(data[i*4+3]<110){index[i]=255;continue;}
    const r=data[i*4],g=data[i*4+1],b=data[i*4+2];
    let best=0,score=Infinity;
    for(let p=0;p<palette.length;p++){
      const c=palette[p],d=(c.r-r)**2+(c.g-g)**2+(c.b-b)**2;
      if(d<score){score=d;best=p;}
    }
    index[i]=best;
  }
  // Isolated pixels become their neighbours' colour: quantisation noise and
  // anti-aliased fringes would otherwise become one-pixel holes in the paths.
  for(let pass=0;pass<2;pass++){
    const next=Uint8Array.from(index);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const at=y*w+x;if(index[at]===255)continue;
      const neighbours=[];
      if(x>0&&index[at-1]!==255)neighbours.push(index[at-1]);
      if(x<w-1&&index[at+1]!==255)neighbours.push(index[at+1]);
      if(y>0&&index[at-w]!==255)neighbours.push(index[at-w]);
      if(y<h-1&&index[at+w]!==255)neighbours.push(index[at+w]);
      if(neighbours.length<2)continue;
      const same=neighbours.filter(value=>value===index[at]).length;
      if(same>0)continue;
      const counts=new Map();for(const value of neighbours)counts.set(value,(counts.get(value)||0)+1);
      next[at]=[...counts].sort((a,b)=>b[1]-a[1])[0][0];
    }
    index.set(next);
  }
  const groups=palette.map((color,p)=>{
    const strict=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++)if(index[i]===p)strict[i]=1;
    let area=0;for(let i=0;i<w*h;i++)area+=strict[i];
    return {color,area,strict};
  }).filter(group=>group.area>40).sort((a,b)=>b.area-a.area);
  // Neighbouring regions are grown by one pixel and painted from the largest to
  // the smallest, so they overlap slightly: no hairline cracks survive the
  // simplification, and the last, smallest details still land on top.
  const dilate=(mask,grow)=>{
    if(!grow)return mask;
    const out=Uint8Array.from(mask);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      if(mask[y*w+x])continue;
      if((x>0&&mask[y*w+x-1])||(x<w-1&&mask[y*w+x+1])||(y>0&&mask[(y-1)*w+x])||(y<h-1&&mask[(y+1)*w+x]))out[y*w+x]=1;
    }
    return out;
  };
  const silhouette=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++)if(index[i]!==255)silhouette[i]=1;
  const paths=[];
  const base=loops(silhouette,w,h).filter(loop=>loop.length>2).map(loop=>`M${simplify(loop,epsilon).map(([x,y])=>`${x} ${y}`).join('L')}Z`).join('');
  if(base)paths.push(`<path fill="${hex(groups[0].color)}" fill-rule="evenodd" d="${base}"/>`);
  for(const [order,group] of groups.entries()){
    if(order===0)continue;
    const mask=dilate(group.strict,group.area>3000);
    const shapes=loops(mask,w,h);
    const d=shapes.filter(loop=>loop.length>2).map(loop=>`M${simplify(loop,epsilon).map(([x,y])=>`${x} ${y}`).join('L')}Z`).join('');
    if(d)paths.push(`<path fill="${hex(group.color)}" fill-rule="evenodd" d="${d}"/>`);
  }
  return {svg:`<g>${paths.join('')}</g>`,colors:palette.length,paths:paths.length,groups:groups.length};
}

if(process.argv[1]?.endsWith('trace-frame.mjs')){
  const [input,output,...rest]=process.argv.slice(2);
  const options={size:Number(rest[0])||340,colors:Number(rest[1])||12,epsilon:Number(rest[2])||1.1};
  const result=await trace(input,options);
  await writeFile(output,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${options.size} ${options.size}" width="${options.size*2}" height="${options.size*2}">${result.svg}</svg>`);
  console.log(JSON.stringify({output,paths:result.paths,colors:result.colors}));
}
