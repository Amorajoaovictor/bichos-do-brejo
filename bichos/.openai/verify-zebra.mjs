import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=new URL('./zebra-review/',import.meta.url);await mkdir(output,{recursive:true});
const base=process.env.ZEBRA_REVIEW_URL??'http://127.0.0.1:4173';
const baselineRabbit=process.argv.includes('--baseline-rabbit');
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage(),errors=[];
  // Isolate the zebra from a parallel Farrapo change whose extra drawings may
  // still be generating. This response override is test-only: no game file or
  // asset is changed. Normal verification never substitutes missing art.
  if(baselineRabbit){
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      if(request.url().endsWith('/rabbit-png-frames.js')){
        const response=await fetch(request.url()),body=(await response.text()).replace('RABBIT_PNG_POSES=27','RABBIT_PNG_POSES=24').replace(/export const rabbitReliefFrame=.*?;/,'export const rabbitReliefFrame=()=>15;').replace('p>=1?24','p>=1?15');
        await request.respond({status:200,contentType:'text/javascript',body});
      }else await request.continue();
    });
  }
  page.on('pageerror',e=>{errors.push(e.message);console.error('Erro no jogo:',e.message);});page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico')){errors.push(`${r.status()} ${r.url()}`);console.error('Resposta inválida:',r.status(),r.url());}});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{
    const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,opts){return get.call(this,kind,kind.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*100),renderer=window.brejo?.renderer,render=renderer?.render;try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}};
  });
  await page.goto(base,{waitUntil:'networkidle0'});assert.deepEqual(errors,[],'Falha no carregamento do jogo');await page.waitForFunction(()=>window.brejo,{timeout:90000});
  const step=t=>page.evaluate(t=>window.step(t),t);
  const state=()=>page.evaluate(()=>{const c=brejo.battle.combat;return {status:c.status,turn:c.current.id,busy:brejo.battle.busy,enemies:c.enemies.map(e=>({id:e.id,hp:e.hp,kind:e.kind,cell:{col:e.cell?.col,row:e.cell?.row}})),heroes:c.heroes.map(h=>h.hp),zebraPos:brejo.zebras[0].root.position.toArray(),direction:brejo.zebras[0].direction};});
  await step(.02);const initial=await state();assert.deepEqual(initial.enemies.map(e=>e.kind),['squirrel','squirrel','zebra']);assert.equal(initial.enemies[2].hp,18);
  assert.ok(await page.evaluate(()=>brejo.zebras[0].root.visible&&!brejo.squirrels[2].root.visible&&!brejo.boss.root.visible));
  await page.screenshot({path:fileURLToPath(new URL('encontro.png',output))});
  // Observe a genuine planned path and stop time during movement.
  await page.evaluate(()=>{const c=brejo.battle.combat;c.cursor=c.order.findIndex(e=>e.kind==='zebra');c.resetTurnResources();brejo.battle.render();});
  await step(.85);assert.equal((await state()).busy,true);const moving=await state();assert.ok(await page.evaluate(()=>brejo.zebras[0].moving));
  await page.click('#pause');await step(2);assert.deepEqual((await state()).zebraPos,moving.zebraPos);await page.click('#pause');
  await step(.3);await page.screenshot({path:fileURLToPath(new URL('caminhada.png',output))});await step(2);
  const moved=await state();assert.notDeepEqual(moved.zebraPos,initial.zebraPos);assert.ok(Math.abs(moved.enemies[2].cell.col-3)+Math.abs(moved.enemies[2].cell.row)<=3);
  await page.evaluate(()=>brejo.battle.restart());await step(.02);assert.deepEqual((await state()).enemies,initial.enemies);assert.deepEqual((await state()).zebraPos,initial.zebraPos);
  // Put a real hero adjacent, then let enemy AI trigger the whole kick.
  await page.evaluate(()=>{const b=brejo.battle,c=b.combat,z=c.enemies.find(e=>e.kind==='zebra'),h=c.heroes[1],cell=c.tiles.find(t=>t.col===z.cell.col+1&&t.row===z.cell.row);if(!cell||cell.blocked)throw Error('Casa de verificação indisponível');h.cell={...cell};brejo.rigs[1].root.position.set(cell.x,.08,cell.z);c.cursor=c.order.indexOf(z);c.resetTurnResources();b.render();});
  const beforeKick=await state();await step(.85);assert.equal((await state()).busy,true);assert.equal((await state()).direction,'left');await step(.43);assert.deepEqual((await state()).heroes,beforeKick.heroes);
  await step(.18);const afterKick=await state();assert.equal(beforeKick.heroes[1]-afterKick.heroes[1],5);assert.equal(beforeKick.heroes[0],afterKick.heroes[0]);
  assert.ok(await page.evaluate(()=>{let src='';brejo.zebras[0].art.traverse(o=>{if(o.isMesh&&o.material.map)src=o.material.map.image.src;});return src.endsWith('/left-5.png');}));
  await page.screenshot({path:fileURLToPath(new URL('coice.png',output))});await step(.8);
  assert.equal((await state()).heroes[1],afterKick.heroes[1]);
  // Select the zebra through the same target controls used by the player.
  await page.evaluate(()=>{brejo.battle.restart();const c=brejo.battle.combat,z=c.enemies.find(e=>e.kind==='zebra'),h=c.current;const cell=c.tiles.find(t=>t.col===4&&t.row===0);h.cell={...cell};brejo.rigs[h.index].root.position.set(cell.x,.08,cell.z);z.hp=7;brejo.battle.render();});
  await page.click('#attack');const point=await page.evaluate(()=>{const p=brejo.zebras[0].root.position.clone();p.y=.55;p.project(brejo.camera);const r=document.getElementById('viewport').getBoundingClientRect();return {x:r.x+(p.x*.5+.5)*r.width,y:r.y+(-p.y*.5+.5)*r.height};});
  await page.mouse.click(point.x,point.y);assert.equal((await state()).busy,true);await step(2.5);assert.equal((await state()).enemies[2].hp,0);assert.equal((await state()).status,'playing');
  assert.ok(await page.evaluate(()=>{let src='';brejo.zebras[0].art.traverse(o=>{if(o.isMesh&&o.material.map)src=o.material.map.image.src;});return /-8.png$/.test(src)&&brejo.zebras[0].root.visible;}));
  await step(2);await page.screenshot({path:fileURLToPath(new URL('derrota.png',output))});
  // Win using legal moves, basics and skills, including the complete mixed AI.
  await page.evaluate(()=>brejo.battle.restart());let actions=0;
  while((await state()).status==='playing'&&actions++<160){
    if((await state()).busy){await step(3);continue;}
    const decision=await page.evaluate(()=>{const b=brejo.battle,c=b.combat;if(!c.playerTurn)return 'wait';const target=c.enemies.find(e=>c.canAttack(false,e).ok);if(target){b.attack(false,target);return 'attack';}const special=c.enemies.find(e=>c.canAttack(true,e).ok);if(special){b.attack(true,special);return 'special';}const choices=c.tiles.map(cell=>({cell,r:c.canMove(cell)})).filter(x=>x.r.ok&&x.r.path.length).sort((a,b)=>Math.min(...c.enemies.filter(e=>e.hp>0).map(e=>c.distance({cell:a.cell},e)))-Math.min(...c.enemies.filter(e=>e.hp>0).map(e=>c.distance({cell:b.cell},e))));if(choices.length){b.move(choices[0].cell);return 'move';}document.getElementById('end-turn').click();return 'pass';});await step(decision==='wait'?3:2.6);
  }
  await step(2);assert.equal((await state()).status,'victory',JSON.stringify(await state()));await page.screenshot({path:fileURLToPath(new URL('vitoria.png',output))});
  await page.click('#next-encounter');await step(.02);assert.equal(await page.evaluate(()=>brejo.battle.encounterIndex),1);assert.equal(await page.evaluate(()=>brejo.zebras[0].root.visible),false);assert.ok(await page.evaluate(()=>brejo.battle.combat.heroes.every(h=>h.hp===h.maxHp&&h.mana===10)));
  // Preview uses all four views, pauses, chooses drawings, changes speed and holds defeat.
  const preview=await browser.newPage();await preview.setViewport({width:1000,height:1100});preview.on('pageerror',e=>errors.push(e.message));
  await preview.goto(`${base}/art/zebra/png-v1/index.html`,{waitUntil:'networkidle0'});await preview.click('#play');await preview.$eval('#frame',e=>{e.value='3';e.dispatchEvent(new Event('input'));});
  assert.ok(await preview.$$eval('.grid img',imgs=>imgs.every(img=>img.complete&&img.naturalWidth===512&&img.src.endsWith('-5.png'))));
  await preview.select('#speed','1.5');await preview.select('#action','death');await preview.click('#restart');await new Promise(resolve=>setTimeout(resolve,850));
  assert.ok(await preview.$$eval('.grid img',imgs=>imgs.every(img=>img.src.endsWith('-8.png'))));assert.equal(await preview.$eval('#play',e=>e.textContent),'Reproduzir');
  await preview.screenshot({path:fileURLToPath(new URL('visualizador.png',output)),fullPage:true});await preview.close();
  // Every extracted sprite has clean transparent margins on all four edges.
  for(const view of ['right','left','down','up'])for(let i=0;i<9;i++){const {data,info}=await sharp(fileURLToPath(new URL(`../art/zebra/png-v1/quadros/${view}-${i}.png`,import.meta.url))).raw().toBuffer({resolveWithObject:true});assert.equal(info.channels,4);for(let x=0;x<512;x++){assert.equal(data[x*4+3],0);assert.equal(data[((511*512)+x)*4+3],0);}for(let y=0;y<512;y++){assert.equal(data[(y*512)*4+3],0);assert.equal(data[(y*512+511)*4+3],0);}}
  assert.deepEqual(errors,[]);await writeFile(new URL(baselineRabbit?'verificacao-isolada.json':'verificacao.json',output),JSON.stringify({passed:true,baselineRabbit,actions,errors,limitation:baselineRabbit?'Somente na resposta do navegador de teste, Farrapo usa seus 24 desenhos existentes e o alívio anterior; arquivos do jogo preservados. A execução normal ainda depende dos novos quadros de Farrapo.':null,checks:['mixed encounter','path and facing','pause during movement','restart','rear kick orientation','damage at contact','explicit target click','defeat holds final pose','complete legal victory','transition to Rosnaldo','interactive preview','PNG alpha and margins']},null,2));console.log('Zebra: fluxo completo verificado.');
}finally{await browser.close();}
