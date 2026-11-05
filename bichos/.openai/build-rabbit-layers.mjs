import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../art/farrapo/mutacoes-camadas-v1/',import.meta.url);
const views=['right','left','down','up'];
const rows=['head','body','armR','armL','legR','legL','tail'];
await mkdir(new URL('pecas/',root),{recursive:true});

async function keepFigure(buffer){
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const n=info.width*info.height,seen=new Uint8Array(n);let largest=[];
  // Remove saturated red/yellow edge residue from the generated transparency.
  // The painted palette uses muted pink/ivory, never these chroma-key colors.
  for(let i=0;i<n;i++){const o=i*4;if(data[o]>220&&data[o+2]<70&&(data[o+1]<80||data[o+1]>180))data[o+3]=0;}
  for(let seed=0;seed<n;seed++){
    if(seen[seed]||data[seed*4+3]<12)continue;
    const stack=[seed],group=[];seen[seed]=1;
    while(stack.length){
      const at=stack.pop(),x=at%info.width;group.push(at);
      for(const next of [at-1,at+1,at-info.width,at+info.width])if(next>=0&&next<n&&Math.abs(next%info.width-x)<=1&&!seen[next]&&data[next*4+3]>=12){seen[next]=1;stack.push(next);}
    }
    if(group.length>largest.length)largest=group;
  }
  const keep=new Uint8Array(n);for(const p of largest)keep[p]=1;
  for(let i=0;i<n;i++)if(!keep[i])data[i*4+3]=0;
  return sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
}

// Read transparent gutters, instead of assuming image generation obeyed equal rows.
function boundaries(projection,count){
  const size=projection.length,gaps=[];
  let begin=-1;
  for(let i=0;i<=size;i++){
    if(i<size&&projection[i]===0){if(begin<0)begin=i;}
    else if(begin>=0){if(begin>0&&i<size&&i-begin>=3)gaps.push({begin,end:i});begin=-1;}
  }
  if(gaps.length>=count-1){
    const middle=gaps.sort((a,b)=>(b.end-b.begin)-(a.end-a.begin)).slice(0,count-1).sort((a,b)=>a.begin-b.begin);
    return [0,...middle.map(g=>Math.round((g.begin+g.end)/2)),size];
  }
  const edges=[0];
  for(let i=1;i<count;i++){
    const expected=size*i/count,radius=size/count*.36;
    let best=Math.round(expected),score=Infinity;
    for(let p=Math.floor(expected-radius);p<=Math.ceil(expected+radius);p++){
      const density=(projection[p-2]||0)+(projection[p-1]||0)+(projection[p]||0)+(projection[p+1]||0)+(projection[p+2]||0);
      const value=density*1000+Math.abs(p-expected);
      if(value<score){score=value;best=p;}
    }
    edges.push(best);
  }
  edges.push(size);return edges;
}

const assets={};
for(const type of process.argv.includes('--base-only')?['base']:process.argv.includes('--without-expressions')?['base','mutation']:['base','mutation','expressions']){
  const file=fileURLToPath(new URL(`originais/${type}.png`,root));
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const rowCount=type==='expressions'?4:7;
  const ys=new Uint32Array(info.height),xs=new Uint32Array(info.width);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){ys[y]++;xs[x]++;}
  const xCuts=boundaries(xs,4),columnCuts=[];
  for(let col=0;col<4;col++){
    const projection=new Uint32Array(info.height);
    for(let y=0;y<info.height;y++)for(let x=xCuts[col];x<xCuts[col+1];x++)if(data[(y*info.width+x)*4+3]>32)projection[y]++;
    columnCuts.push(boundaries(projection,rowCount));
  }
  for(let row=0;row<rowCount;row++)for(let col=0;col<4;col++){
    const yCuts=columnCuts[col];
    const part=type==='expressions'?['panic','strain','relief','defeat'][row]:type==='mutation'&&row===0?'horn':rows[row];
    const name=`${type}-${views[col]}-${part}`,path=`pecas/${name}.png`;
    const region={left:xCuts[col],top:yCuts[row],width:xCuts[col+1]-xCuts[col],height:yCuts[row+1]-yCuts[row]};
    const regionPng=await sharp(file).extract(region).png().toBuffer();
    const cut=await sharp(await keepFigure(regionPng)).trim({threshold:2}).png().toBuffer();
    const meta=await sharp(cut).metadata();
    await writeFile(new URL(path,root),cut);
    assets[name]={url:path,width:meta.width,height:meta.height};
  }
}
const manifest={character:'Farrapo',version:1,integrated:false,format:'PNG transparente em peças sobrepostas',views,slots:['head','body','armR','armL','legR','legL','tail','fur'],assets,actions:['idle','walk','rabbit','barrage','hit','bleed','death'],timing:{idle:1.92,walk:.48,rabbit:1.05,barrage:2.3,relief:1.8,hit:.52,bleed:.7,death:1.15},animation:'Peças PNG articuladas; estudo visual, não substitui as animações quadro a quadro do jogo.',generator:'.openai/build-rabbit-layers.mjs',viewer:'index.html'};
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({pieces:Object.keys(assets).length,views,yourPreview:'/art/farrapo/mutacoes-camadas-v1/index.html'}));
