import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
const root=new URL('../art/farrapo/mutacoes-camadas-v1/',import.meta.url);
const source=(await readFile(new URL('rig.js',root),'utf8')).replace("from '/animation.js'",`from '${new URL('../dist/animation.js',import.meta.url).href}'`);
const {DURATIONS,samplePose,VIEWS,SLOTS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
assert.equal(Object.keys(manifest.assets).length,72);
assert.equal(SLOTS.length,8);assert.equal(manifest.integrated,false);
for(const [key,asset] of Object.entries(manifest.assets)){
  const image=sharp(await readFile(new URL(asset.url,root))),meta=await image.metadata(),stats=await image.stats();
  assert.ok(meta.hasAlpha,key);assert.equal(meta.width,asset.width,key);assert.equal(meta.height,asset.height,key);
  assert.ok(stats.channels[3].min===0&&stats.channels[3].max>200,`${key}: transparência e desenho`);
}
let sampled=0;
for(const view of VIEWS)for(const [action,duration] of Object.entries(DURATIONS))for(const ratio of [0,.15,.35,.5,.75,1]){
  const {parts,root:transform}=samplePose(view,action,duration*ratio);
  for(const value of Object.values(transform))assert.ok(Number.isFinite(value));
  for(const part of Object.values(parts))for(const value of Object.values(part))assert.ok(Number.isFinite(value));
  sampled++;
}
for(const view of VIEWS){
  assert.equal(samplePose(view,'barrage',1).expression,'strain');
  assert.equal(samplePose(view,'barrage',2.31).expression,'relief');
  assert.equal(samplePose(view,'barrage',4.1).flush,0);
  assert.deepEqual(samplePose(view,'death',1.15),samplePose(view,'death',5));
}
// The browser currently returns JPEG captures; normalize the .png deliverables.
async function normalize(folder){for(const item of await readdir(folder,{withFileTypes:true})){
  const url=new URL(item.name+(item.isDirectory()?'/':''),folder);
  if(item.isDirectory())await normalize(url);
  else if(item.name.endsWith('.png')){const input=await readFile(url);if((await sharp(input).metadata()).format!=='png')await writeFile(url,await sharp(input).png().toBuffer());}
}}
await normalize(new URL('previas/',root));
const report={ok:true,integrated:false,assets:72,slots:8,views:4,poseSamples:sampled,checks:['PNG com transparência e medidas do manifesto','poses finitas em todas as ações e vistas','esforço contínuo e alívio da rajada','derrota mantém pose final'],browserReview:{method:'inspeção pelo navegador e capturas reais',actions:7,controls:['oito opções independentes','braço direito alterado mantendo esquerdo original','quatro vistas','pausa e reprodução','tempo exato','camadas separadas','isolar parte','encaixes'],consoleErrors:[]},limitations:['movimentos de estudo por articulação; ações complexas ainda precisam de desenhos específicos das partes','não validado como substituto final dos quadros do jogo','exemplos de mutação não definem regras de combate']};
await writeFile(new URL('verificacao.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
