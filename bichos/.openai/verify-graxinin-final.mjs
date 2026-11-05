import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
const output=new URL('./graxinin-review/',import.meta.url),art=new URL('../art/graxinin/vetor-v2/',import.meta.url);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});
 await page.evaluateOnNewDocument(()=>{window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.step=seconds=>{window.__now??=performance.now();for(let i=0,n=Math.ceil(seconds*120);i<n;i++){window.__now+=seconds/n*1000;window.__frame(window.__now);}};});
 await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
 await page.evaluate(async()=>{window.facing=await import('/facing.js');window.animation=await import('/animation.js');const {battle,state,rigs}=brejo;battle.restart();const c=battle.combat;c.cursor=c.order.indexOf(c.heroes[2]);c.resetTurnResources();state.selected=2;facing.setDirection(rigs[2],'down');state.paused=false;battle.render();step(.01);});
 assert((await page.$eval('#special-attack',e=>e.textContent)).includes('Garrafada'));
 const native=await page.evaluate(()=>{let meshes=0,textured=0;const rig=brejo.rigs[2];for(const view of Object.values(rig.views))view.art.traverse(o=>{if(o.isMesh){meshes++;textured+=!!o.material.map;}});return {id:rig.id,meshes,textured,eyesShareSkull:rig.parts.eyeL.parent===rig.parts.head.parent};});
 assert(native.meshes>0&&native.textured===0&&native.eyesShareSkull);
 await page.screenshot({path:fileURLToPath(new URL('no-jogo.png',output))});
 // The new character's fall must finish before its root is hidden.
 const fall=await page.evaluate(()=>{const {rigs,state}=brejo,rig=rigs[2];rig.death={elapsed:0,direction:1};step(1.2);const elapsed=rig.death.elapsed,pose=rig.joints.torso.position.y;state.paused=true;step(.1);const held=rig.joints.torso.position.y===pose;brejo.battle.restart();return {elapsed,held,reset:rig.death===null&&rig.root.visible};});
 assert(fall.elapsed>=1.15&&fall.held&&fall.reset);
 const viewer=await browser.newPage();await viewer.setViewport({width:1000,height:1100});
 await viewer.goto('http://127.0.0.1:4173/art/graxinin/vetor-v1/index.html',{waitUntil:'networkidle0'});await viewer.click('#play');
 for(const action of ['repouso','caminhada','arremesso','garrafada','dano','derrota']){
  await viewer.select('#action',action);
  for(const index of [0,11,15,29]){
   await viewer.$eval('#frame',(e,i)=>{e.value=i;e.dispatchEvent(new Event('input'));},index);
   await viewer.waitForFunction(()=>[...document.querySelectorAll('img')].every(img=>img.complete&&img.naturalWidth===420));
  }
 }
 await viewer.select('#action','garrafada');await viewer.$eval('#frame',e=>{e.value=11;e.dispatchEvent(new Event('input'));});
 await viewer.screenshot({path:fileURLToPath(new URL('visualizador.png',art)),fullPage:true});
 const cards=[];
 for(const [row,direction] of ['down','right','left','up'].entries())for(const [col,frame] of [1,9,12,16,21,30].entries()){
  const png=await sharp(fileURLToPath(new URL(`quadros/garrafada-${direction}-${String(frame).padStart(2,'0')}.svg`,art))).resize(210,210).png().toBuffer();cards.push({input:png,left:col*210,top:row*210});
 }
 await sharp({create:{width:1260,height:840,channels:4,background:'#33382e'}}).composite(cards).png().toFile(fileURLToPath(new URL('garrafada-poses.png',art)));
 assert.deepEqual(errors,[]);await writeFile(new URL('final.json',output),JSON.stringify({passed:true,native,fall,viewer:{actions:6,directions:4,selectedFrames:4},errors},null,2));console.log({passed:true,native,fall,viewerActions:6,errors});
}finally{await browser.close();}

