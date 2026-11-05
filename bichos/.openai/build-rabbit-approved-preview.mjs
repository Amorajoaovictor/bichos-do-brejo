import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {rabbitApprovedArt} from '../dist/rabbit-approved-art.js';
import {wrapSVG} from '../dist/characters.js';

const output=new URL('../art/farrapo/vetor-aprovado-v1/',import.meta.url);await mkdir(output,{recursive:true});
for(const angle of ['three-quarter','profile'])for(const direction of ['right','left']){
  const content=rabbitApprovedArt(direction,angle).filter(p=>!p.name.startsWith('mut_')&&p.name!=='rage').map(p=>`<g id="${p.name}">${p.svg}</g>`).join('');
  const svg=wrapSVG(direction==='left'?`<g transform="translate(300 0) scale(-1 1)">${content}</g>`:content);
  const name=`${angle}-${direction}`;
  await writeFile(new URL(name+'.svg',output),svg);
  await sharp(Buffer.from(svg),{density:144}).png().toFile(fileURLToPath(new URL(name+'.png',output)));
}
console.log(fileURLToPath(output));
