import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const temp='C:/Users/user/AppData/Local/Temp/';
const art=new URL('../art/rosnaldo/',import.meta.url);
const sheets={
  'repouso-v1':{direita:'omp-image-15bd78e459094222',esquerda:'omp-image-15bd795010c94225',frente:'omp-image-15bd798445494227',costas:'omp-image-15bd79be8d094229'},
  'mordida-v1':{direita:'omp-image-15bd79f5dec9422b',esquerda:'omp-image-15bd7a66c5094231',frente:'omp-image-15bd7aa290494233',costas:'omp-image-15bd7ae460894235'},
  'dano-v1':{direita:'omp-image-15bd7b265a094237',esquerda:'omp-image-15bd7b848e094239',frente:'omp-image-15bd7bc5e509423b',costas:'omp-image-15bd7bfd5109423d'},
  'sangramento-v1':{direita:'omp-image-15bd7c2c4409423f',esquerda:'omp-image-15bd7c84bec94241',frente:'omp-image-15bd7cc158c94243',costas:'omp-image-15bd7cfd42894245'},
  'derrota-v1':{direita:'omp-image-15bd7d2d9d094247',esquerda:'omp-image-15bd7d7571c94249',frente:'omp-image-15bd7da6db89424b',costas:'omp-image-15bd7dcbb689424d'},
};
const report=[];
for(const [folder,map] of Object.entries(sheets)){
  const dir=new URL(folder+'/',art);await mkdir(dir,{recursive:true});
  for(const [direction,name] of Object.entries(map)){
    const source=temp+name+'.webp';
    const info=await sharp(source).metadata();
    const png=await sharp(source).png().toBuffer();
    await writeFile(new URL(direction+'.png',dir),png);
    report.push({folder,direction,width:info.width,height:info.height,alpha:info.hasAlpha,channels:info.channels});
  }
}
console.log(JSON.stringify(report,null,2));
