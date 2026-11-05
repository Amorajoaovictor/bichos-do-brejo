import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {fileURLToPath} from 'node:url';

const input=process.argv[2];
if(!input)throw new Error('Informe a prancha PNG.');
const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height,channels}=info,seen=new Uint8Array(width*height),components=[];
for(let seed=0;seed<seen.length;seed++){
  if(seen[seed]||data[seed*channels+3]<128)continue;
  const stack=[seed],box={pixels:0,left:width,top:height,right:0,bottom:0};
  seen[seed]=1;
  while(stack.length){
    const pixel=stack.pop(),x=pixel%width,y=(pixel-x)/width;
    box.pixels++;
    box.left=Math.min(box.left,x);box.right=Math.max(box.right,x);
    box.top=Math.min(box.top,y);box.bottom=Math.max(box.bottom,y);
    for(const next of [pixel-1,pixel+1,pixel-width,pixel+width]){
      if(next<0||next>=seen.length||Math.abs(next%width-x)>1||seen[next]||data[next*channels+3]<128)continue;
      seen[next]=1;stack.push(next);
    }
  }
  if(box.pixels>100)components.push(box);
}
console.log(JSON.stringify({file:input,width,height,components:components.sort((a,b)=>b.pixels-a.pixels).slice(0,20)},null,2));
