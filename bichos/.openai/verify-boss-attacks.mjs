import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'.openai/boss-attacks-review');await mkdir(output,{recursive:true});
const html=`<!doctype html><style>body{margin:0;background:#33382e}</style><script type="importmap">{"imports":{"three":"/vendor/three.module.js"}}</script><script type="module">
import * as THREE from '/vendor/three.module.js';import {createBoss} from '/boss.js';
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.5,2.5,3.7,-1.3,.1,100);camera.position.z=10;
const renderer=new THREE.WebGLRenderer({alpha:true,preserveDrawingBuffer:true});renderer.setSize(480,480);document.body.append(renderer.domElement);
const vectorPart=def=>{const p=new THREE.Group();p.position.set(...def.pivot,0);p.userData={baseX:def.pivot[0],baseY:def.pivot[1]};return p;};
const boss=createBoss(scene,camera,vectorPart,()=>{},renderer);boss.root.position.set(0,0,0);boss.floor.visible=false;boss.shadow.visible=false;
await boss.prepareAllActionFrames();window.brejo={boss,renderer,scene,camera};
</script>`;
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(name==='/favicon.ico'){res.writeHead(204);res.end();return;}const file=path.join(root,name.startsWith('/art/')?name.slice(1):'dist/'+name.slice(1));const data=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',userDataDir:path.join(output,'browser-profile-'+Date.now()),headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror',e.message);});page.on('response',r=>{if(r.status()>=400){requests.push({url:r.url(),status:r.status()});console.log('HTTP',r.status(),r.url());}});page.on('requestfailed',r=>requests.push({url:r.url(),error:r.failure()?.errorText}));await page.setViewport({width:1280,height:900});
 await page.evaluateOnNewDocument(()=>{requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.step=seconds=>{window.__now??=performance.now();for(let i=0;i<Math.ceil(seconds*60);i++){window.__now+=1000/60;window.__frame?.(window.__now);}};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo,{timeout:60000,polling:100});
 let lateLoads=0;page.on('request',r=>{if(r.url().includes('/art/rosnaldo/'))lateLoads++;});
 const result=await page.evaluate(async()=>{
  const {boss,renderer}=brejo,{setDirection}=await import('/facing.js'),{actionPose,ACTIONS}=await import('/animation.js');const frames=[],timing=[];
  for(const view of ['right','left','up','down'])for(const kind of ['bite','roar']){
   setDirection(boss,view);await boss.prepareActionFrames(kind,view);boss.actionActive=true;
   for(let i=0;i<12;i++){boss.update(0,0);actionPose(boss,kind,(i+.1)/12);boss.syncActionFrame();renderer.render(brejo.scene,brejo.camera);const plane=boss.frameArt.children[0],gl=renderer.getContext(),pixels=new Uint8Array(480*480*4);gl.readPixels(0,0,480,480,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let visiblePixels=0;for(let n=3;n<pixels.length;n+=4)if(pixels[n]>110)visiblePixels++;frames.push({view,kind,i,visible:boss.root.visible&&boss.frameArt.visible,visiblePixels,source:plane.material.map?.image?.src,scale:plane.scale.toArray(),position:boss.frameArt.position.toArray()});}
   for(const speed of [.5,1,1.5]){
    const duration=ACTIONS[kind].duration;let elapsed=0,advanced=0,previous='';
    while(elapsed<duration){elapsed=Math.min(duration,elapsed+speed/60);boss.update(0,speed/60);actionPose(boss,kind,elapsed/duration);const source=boss.frameArt.children[0].material.map.image.src;if(source!==previous)advanced++;previous=source;}
    actionPose(boss,kind,.55);const held=boss.frameArt.children[0].material.map;
    for(let n=0;n<5;n++){boss.update(0,0);actionPose(boss,kind,.55);}
    timing.push({kind,view,speed,advanced,paused:held===boss.frameArt.children[0].material.map,contact:held.image.src.endsWith('-07.png')});
   }
   boss.actionActive=false;boss.clearActionFrame();
  }
  boss.clearActionFrame();return {frames,timing,textures:renderer.info.memory.textures};
 });
 await page.waitForNetworkIdle();
 const live=await page.evaluate(()=>({visible:brejo.boss.root.visible&&brejo.boss.frameArt.visible,src:brejo.boss.frameArt.children[0].material.map?.image?.src}));
 await page.screenshot({path:path.join(output,'combate.png')});
 await writeFile(path.join(output,'report.json'),JSON.stringify({errors,requests,result,live},null,2));
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 assert.equal(lateLoads,0,'nenhum carregamento ou descarte no meio dos ataques');
 for(const t of result.timing){assert.equal(t.advanced,12);assert.ok(t.paused);assert.ok(t.contact);}
 for(const f of result.frames){assert.ok(f.visible);assert.ok(f.visiblePixels>3000,`${f.kind}/${f.view}/${f.i} desenhou o corpo`);assert.match(f.source,new RegExp(f.kind==='bite'?'mordida-v1':'rugido-v5'));}
 console.log(JSON.stringify({errors,requests,lateLoads,frames:result.frames.length,textures:result.textures,live},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
