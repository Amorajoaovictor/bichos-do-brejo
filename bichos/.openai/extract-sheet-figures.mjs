import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';

// A geração nem sempre respeita as células da grade. Os corpos, porém,
// continuam isolados por transparência. Localizamos cada figura inteira.
export async function extractSheetFigures(path,{columns=4,rows=3,frameSize=362}={}){
  const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info,seen=new Uint8Array(width*height),figures=[];
  for(let seed=0;seed<seen.length;seed++){
    if(seen[seed]||data[seed*channels+3]<32)continue;
    const stack=[seed],box={pixels:0,left:width,top:height,right:0,bottom:0};
    seen[seed]=1;
    while(stack.length){
      const pixel=stack.pop(),x=pixel%width,y=(pixel-x)/width;
      box.pixels++;
      box.left=Math.min(box.left,x);box.right=Math.max(box.right,x);
      box.top=Math.min(box.top,y);box.bottom=Math.max(box.bottom,y);
      for(const next of [pixel-1,pixel+1,pixel-width,pixel+width]){
        if(next<0||next>=seen.length||Math.abs(next%width-x)>1||seen[next]||data[next*channels+3]<32)continue;
        seen[next]=1;stack.push(next);
      }
    }
    if(box.pixels>5000)figures.push(box);
  }
  if(figures.length!==columns*rows)throw new Error(`Esperados ${columns*rows} corpos isolados em ${path}; encontrados ${figures.length}.`);
  const rowHeight=height/rows;
  figures.sort((a,b)=>{
    const rowA=Math.min(rows-1,Math.floor((a.top+a.bottom)/2/rowHeight));
    const rowB=Math.min(rows-1,Math.floor((b.top+b.bottom)/2/rowHeight));
    return rowA-rowB||a.left-b.left;
  });
  const maxWidth=Math.max(...figures.map(f=>f.right-f.left+1));
  const maxHeight=Math.max(...figures.map(f=>f.bottom-f.top+1));
  const scale=Math.min((frameSize-40)/maxWidth,(frameSize-32)/maxHeight,1);
  const frames=[];
  for(const figure of figures){
    const cropWidth=figure.right-figure.left+1,cropHeight=figure.bottom-figure.top+1;
    const resized=await sharp(path).extract({left:figure.left,top:figure.top,width:cropWidth,height:cropHeight})
      .resize(Math.max(1,Math.round(cropWidth*scale)),Math.max(1,Math.round(cropHeight*scale)),{fit:'fill'})
      .png().toBuffer();
    const meta=await sharp(resized).metadata();
    frames.push(await sharp({create:{width:frameSize,height:frameSize,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
      .composite([{input:resized,left:Math.round((frameSize-meta.width)/2),top:frameSize-16-meta.height}]).png().toBuffer());
  }
  return {frames,figures,scale};
}
