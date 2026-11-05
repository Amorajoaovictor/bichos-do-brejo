import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const output=new URL('./rabbit-png-review/',import.meta.url),art=new URL('../art/farrapo/png-v1/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage(),errors=[],failures=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failures.push({url:r.url(),status:r.status()});});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,options){return getContext.call(this,kind,kind.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options);};
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const n=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;try{for(let i=0;i<n;i++){if(renderer)renderer.render=i===n-1?render:()=>{};window.__now+=seconds/n*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}};
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>window.brejo,{timeout:60000});
  const step=t=>page.evaluate(t=>window.step(t),t);
  const stats=()=>page.evaluate(()=>{const b=brejo,r=b.rigs[0],c=b.battle.combat;return {current:c.current.id,busy:b.battle.busy,hp:c.boss.hp,mana:c.heroes[0].mana,moves:c.movesRemaining,attacks:c.attacksRemaining,frame:r.frameIndex,kind:r.frameKind,flush:r.faceFlush,emotion:r.expression,direction:r.direction};});
  await step(.02);
  const anatomy=await page.evaluate(()=>{const r=brejo.rigs[0];let meshes=0;r.art.traverse(o=>{if(o.isMesh)meshes++;});return {png:r.pngRig,meshes,views:!!r.views,url:r.parts.sprite.material.map.image.src};});
  assert.equal(anatomy.png,true);assert.equal(anatomy.meshes,1);assert.equal(anatomy.views,false);assert.match(anatomy.url,/farrapo\/png-v1\/quadros/);
  await page.keyboard.press('e');await step(.02);assert.equal((await stats()).current,'rabbit');
  assert.equal(await page.$$eval('[data-rabbit-portrait]',nodes=>nodes.length),2);
  assert.equal(await page.$$eval('#portrait svg,[data-unit="rabbit"] svg',nodes=>nodes.length),0);
  await page.screenshot({path:fileURLToPath(new URL('jogo.png',output))});
  const destination=await page.evaluate(()=>{const c=brejo.battle.combat;return c.tiles.find(t=>{const m=c.canMove(t);return m.ok&&m.path.length>0&&Math.min(...c.cellsOf(c.boss).map(b=>Math.abs(b.col-t.col)+Math.abs(b.row-t.row)))===1;});});
  assert.ok(destination,'há um destino válido adjacente ao boss');
  await page.evaluate(t=>brejo.battle.move(t),destination);
  await step(.12);assert.equal((await stats()).kind,'walk');assert.equal((await stats()).frame,5);
  await step(1.5);assert.equal((await stats()).busy,false);assert.equal((await stats()).moves,0);assert.equal((await stats()).attacks,1);
  const landed=await page.evaluate(()=>{const r=brejo.rigs[0];return {cell:r.cell,position:r.root.position.toArray()};});
  assert.equal(landed.position[0],destination.x);assert.equal(landed.position[2],destination.z);assert.equal(landed.position[1],.08);
  await page.evaluate(()=>brejo.battle.attack(false));await step(.3);assert.equal((await stats()).hp,120);
  await step(.23);assert.equal((await stats()).hp,110);assert.equal((await stats()).frame,10);
  await page.screenshot({path:fileURLToPath(new URL('coice.png',output))});
  await step(.8);assert.equal((await stats()).attacks,0);assert.equal((await stats()).busy,false);
  await page.evaluate(()=>brejo.battle.attack(true));await step(.35);assert.equal((await stats()).hp,110);assert.equal((await stats()).mana,2);
  await page.click('#pause');const paused=await stats();await step(1);assert.deepEqual(await stats(),paused);await page.click('#pause');
  await step(.55);let s=await stats();assert.ok(s.hp<110);assert.ok(s.frame===13||s.frame===14);assert.equal(s.emotion,'strain');assert.ok(s.flush>.9);
  await page.screenshot({path:fileURLToPath(new URL('rajada.png',output))});
  await step(2.2);s=await stats();assert.equal(s.busy,false);assert.ok(s.hp>=90&&s.hp<=100);assert.equal(s.frame,15);assert.equal(s.emotion,'relief');assert.equal(s.flush,0);
  await step(1.9);assert.equal((await stats()).emotion,'neutral');
  // Both direction changes and every action use PNGs, without exposing SVGs.
  const views=await page.evaluate(async()=>{const {setDirection}=await import('/facing.js'),{actionPose,locomotionPose,startRecoil}=await import('/animation.js'),r=brejo.rigs[0],result=[];for(const direction of ['right','left','down','up']){setDirection(r,direction);r.resetPose();actionPose(r,'barrage',.5);result.push({direction,url:r.parts.sprite.material.map.image.src,frame:r.frameIndex});locomotionPose(r,.5);}r.setFaceFlush(0);startRecoil(r,1,8);return result;});
  for(const v of views){assert.match(v.url,new RegExp(`${v.direction}-1[34]\\.png`));assert.ok(v.frame===13||v.frame===14);}
  await step(.2);assert.equal((await stats()).kind,'hit');await step(.5);
  await page.evaluate(()=>{brejo.rigs[0].death={elapsed:0,ready:true,direction:1};});await step(1.3);assert.equal((await stats()).frame,23);await step(2);assert.equal((await stats()).frame,23);
  await page.evaluate(()=>brejo.battle.restart());await step(.02);s=await stats();assert.equal(s.hp,120);assert.equal(s.mana,10);assert.equal(s.flush,0);assert.equal(s.emotion,'neutral');assert.ok(s.frame<4);
  // Restart in a running volley must clear every animation and effect flag.
  await page.keyboard.press('e');await step(.02);await page.evaluate(()=>brejo.battle.attack(true));await step(.6);assert.equal((await stats()).busy,true);await page.evaluate(()=>brejo.battle.restart());await step(.02);s=await stats();assert.equal(s.busy,false);assert.equal(s.mana,10);assert.equal(s.flush,0);assert.ok(s.frame<4);
  const flags=await page.evaluate(()=>{const r=brejo.rigs[0];return [r.death,r.recoil,r.moving,r.actionActive];});assert.deepEqual(flags,[null,null,null,false]);
  for(const speed of [.5,1.5]){
    const before=await page.evaluate(speed=>{brejo.state.speed=speed;return brejo.state.time;},speed);
    await step(.2);const after=await page.evaluate(()=>brejo.state.time);assert.ok(Math.abs(after-before-.2*speed)<.0001);
  }
  await page.evaluate(()=>brejo.state.speed=1);
  // The first encounter must keep both the PNG ally's and squirrels' movement.
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);await step(.02);await page.keyboard.press('e');await step(.02);assert.equal((await stats()).current,'rabbit');
  await page.screenshot({path:fileURLToPath(new URL('encontro-esquilos.png',output))});
  await page.goto('http://127.0.0.1:4173/art/farrapo/png-v1/index.html',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.rabbitPreview);
  await page.setViewport({width:1000,height:1120,deviceScaleFactor:1});
  await page.evaluate(()=>{document.getElementById('play').click();rabbitPreview.show();});
  await page.screenshot({path:fileURLToPath(new URL('visualizador.png',output))});
  await page.select('#action','barrage');await page.click('#play');
  await step(2.45);
  const previewFrames=()=>page.evaluate(()=>rabbitPreview.rigs.map(r=>({index:r.frameIndex,flush:r.faceFlush})));
  assert.deepEqual(await previewFrames(),Array.from({length:4},()=>({index:15,flush:0})));
  await step(1.2);assert.deepEqual(await previewFrames(),Array.from({length:4},()=>({index:15,flush:0})));
  await step(.6);assert.ok((await previewFrames()).every(r=>r.index===12));
  await page.click('#play');
  await page.evaluate(()=>{const slider=document.getElementById('frame');slider.value=820;slider.dispatchEvent(new Event('input'));});
  assert.deepEqual(await previewFrames(),Array.from({length:4},()=>({index:15,flush:0})));
  await page.screenshot({path:fileURLToPath(new URL('alivio.png',output))});
  const raws=[],delays=[],barrageRaws=[],barrageDelays=[];let gifWidth,gifHeight;
  if(!process.argv.includes('--quick')){
  for(const [action,duration,count] of [['idle',1.92,12],['walk',.48,12],['rabbit',1.05,16],['barrage',4.1,125],['hit',.52,12],['death',1.15,16]]){
    for(let i=0;i<count;i++){
      const png=await page.evaluate(({action,p})=>{const a=document.getElementById('action');a.value=action;a.dispatchEvent(new Event('change'));const slider=document.getElementById('frame');slider.value=Math.round(p*1000);slider.dispatchEvent(new Event('input'));rabbitPreview.show();return rabbitPreview.renderer.domElement.toDataURL('image/png').split(',')[1];},{action,p:i/(count-1)});
      const resized=await sharp(Buffer.from(png,'base64')).resize({width:512}).flatten({background:'#30382c'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      gifWidth=resized.info.width;gifHeight=resized.info.height;raws.push(resized.data);delays.push(Math.max(20,Math.round(duration/count*1000)));
      if(action==='barrage'){barrageRaws.push(resized.data);barrageDelays.push(Math.max(20,Math.round(duration/count*1000)));}
    }
  }
  for(const [file,images,times] of [['animacoes-quatro-direcoes.gif',raws,delays],['rajada-quatro-direcoes.gif',barrageRaws,barrageDelays]])await sharp(Buffer.concat(images),{raw:{width:gifWidth,height:gifHeight*images.length,channels:4,pageHeight:gifHeight}}).gif({loop:0,delay:times}).toFile(fileURLToPath(new URL(file,art)));
  }
  assert.deepEqual(failures,[]);assert.deepEqual(errors.filter(e=>!e.includes('favicon.ico')&&!e.includes('404')),[]);
  const report={ok:true,checks:['PNG único sem geometria do personagem vetorial','retratos em PNG','movimento próprio preservado e chegada exata','coice causa dano no contato','mana e contadores independentes','rajada com impactos por projétil','pausa e velocidades 0,5× e 1,5×','quatro vistas sem fallback vetorial','reação a dano','derrota mantida','reinício normal e durante rajada','encontro com esquilos','visualizador com as animações reais'],networkFailures:failures,browserErrors:errors.filter(e=>!e.includes('404')),frames:96};
  await writeFile(new URL('verificacao.json',art),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
