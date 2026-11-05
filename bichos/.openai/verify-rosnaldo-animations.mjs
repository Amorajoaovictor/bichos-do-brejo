import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=new URL('./rosnaldo-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',userDataDir:new URL('./rosnaldo-review/browser-profile/',import.meta.url).pathname.slice(1),headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;
      try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(()=>{
    const {battle,boss,camera,state,rigs}=brejo;battle.restart();state.paused=false;
    for(const rig of rigs){rig.root.visible=false;rig.shadow.visible=false;}
    camera.zoom=2.1;camera.updateProjectionMatrix();
    document.getElementById('labels').style.display='none';
    document.querySelectorAll('.party-hud,.boss-hud,.bottom-hud,.location-hud,.selected-hud,.boss-status,.combat-actions,.outcome').forEach(el=>el.style.display='none');
  });
  const box=async()=>page.evaluate(async()=>{
    const {Box3,Vector3}=await import('/vendor/three.module.js');
    const {boss,camera}=brejo,v=document.getElementById('viewport').getBoundingClientRect();
    const b=new Box3().setFromObject(boss.frameArt),min=b.min.clone(),max=b.max.clone();
    const corners=[];
    for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z])corners.push(new Vector3(x,y,z).project(camera));
    const xs=Array.from(corners,x=>(x.x*.5+.5)*v.width+v.x),ys=Array.from(corners,y=>(-y.y*.5+.5)*v.height+v.y);
    return {x:Math.round(Math.min(...xs)-26),y:Math.round(Math.min(...ys)-26),width:Math.round(Math.max(...xs)-Math.min(...xs)+52),height:Math.round(Math.max(...ys)-Math.min(...ys)+52)};
  });
  const shoot=async name=>{
    const buffer=await page.screenshot({clip:await box()});
    await sharp(buffer).toFile(new URL(name+'.png',output).pathname.slice(1));
  };
  await page.evaluate(()=>brejo.boss.prepareActionFrames('idle','down'));
  await page.evaluate(()=>window.step(.8));await shoot('01-idle-frente');
  const posed=await page.evaluate(async()=>{
    const {boss}=brejo;
    const f=await import('/facing.js'),a=await import('/animation.js');
    const render=()=>brejo.renderer.render(brejo.scene,brejo.camera);
    const hold=(kind,progress)=>{for(let i=0;i<3;i++){a.idlePose(boss,2);a.actionPose(boss,kind,progress);}render();};
    f.setDirection(boss,'right');a.idlePose(boss,2);render();
    window.__posed={hold,a,f};
    return {direction:boss.direction,rot:Object.keys(boss.parts).filter(n=>n.startsWith('rot')).length};
  });
  await page.evaluate(()=>brejo.boss.prepareActionFrames('idle','right'));
  await page.evaluate(()=>{brejo.boss.showActionFrame('idle',0);brejo.renderer.render(brejo.scene,brejo.camera);});
  await shoot('02-repouso-perfil');
  await page.evaluate(()=>brejo.boss.prepareActionFrames('bite','left'));
  await page.evaluate(()=>brejo.boss.prepareActionFrames('idle','left'));
  await page.evaluate(()=>{const {boss}=brejo,{a,f}=window.__posed;f.setDirection(boss,'left');a.idlePose(boss,2);boss.showActionFrame('idle',0);brejo.renderer.render(brejo.scene,brejo.camera);});
  await shoot('02b-repouso-esquerda');
  await page.evaluate(()=>window.__posed.hold('bite',.5));await shoot('03b-mordida-esquerda');
  await page.evaluate(()=>{const {boss}=brejo,{a,f}=window.__posed;f.setDirection(boss,'right');a.idlePose(boss,2);boss.showActionFrame('idle',0);brejo.renderer.render(brejo.scene,brejo.camera);});
  await page.evaluate(()=>brejo.boss.prepareActionFrames('bite','right'));
  await page.evaluate(()=>window.__posed.hold('bite',.5));await shoot('03-mordida-contato');
  await page.evaluate(()=>brejo.boss.prepareActionFrames('roar','right'));
  await page.evaluate(()=>window.__posed.hold('roar',.59));await shoot('04-rugido-pico');
  await page.evaluate(()=>brejo.boss.prepareActionFrames('hit','right'));
  await page.evaluate(()=>{const {boss}=brejo,a=window.__posed.a;
    boss.death=null;boss.bleedTick=null;boss.recoil=null;a.idlePose(boss,2);a.startRecoil(boss,-1,10);boss.recoil.ready=true;
    for(let i=0;i<22;i++){a.idlePose(boss,2);a.reactionPose(boss,1/120);}boss.showActionFrame('hit',boss.recoil.elapsed/boss.recoil.duration);brejo.renderer.render(brejo.scene,brejo.camera);});
  await shoot('05-dano-pico');
  await page.evaluate(()=>brejo.boss.prepareActionFrames('bleed','down'));
  await page.evaluate(async()=>{const {boss}=brejo,a=window.__posed.a,f=await import('/facing.js');
    boss.recoil=null;f.setDirection(boss,'down');a.idlePose(boss,2);a.startBleedTick(boss,1);boss.bleedTick.ready=true;
    for(let i=0;i<16;i++){a.idlePose(boss,2);a.reactionPose(boss,1/120);}boss.showActionFrame('bleed',boss.bleedTick.elapsed/boss.bleedTick.duration);brejo.renderer.render(brejo.scene,brejo.camera);});
  await shoot('06-sangramento-frente');
  await page.evaluate(()=>brejo.boss.prepareActionFrames('death','right'));
  await page.evaluate(async()=>{const {boss}=brejo,a=window.__posed.a,f=await import('/facing.js');
    boss.bleedTick=null;f.setDirection(boss,'right');boss.death={elapsed:0,direction:1,ready:true};
    for(let i=0;i<200;i++){a.idlePose(boss,2);a.reactionPose(boss,1/120);}boss.showActionFrame('death',1);brejo.renderer.render(brejo.scene,brejo.camera);});
  await shoot('07-derrota-sustentada');
  const death=await page.evaluate(()=>{const {boss}=brejo;return {elapsed:boss.death.elapsed,torsoY:boss.joints.torso.position.y,artY:boss.art.position.y};});
  await page.evaluate(()=>brejo.boss.prepareActionFrames('idle','up'));
  await page.evaluate(async()=>{const {boss}=brejo,a=window.__posed.a,f=await import('/facing.js');
    boss.death=null;f.setDirection(boss,'up');a.idlePose(boss,2);boss.showActionFrame('idle',0);brejo.renderer.render(brejo.scene,brejo.camera);});
  await shoot('08-costas');
  const plan=await page.evaluate(()=>{const {battle,state}=brejo;battle.restart();state.paused=false;const c=battle.combat;c.advance();c.advance();return c.planEnemyAttack()?.skill;});
  assert.match(plan,/Rugido/);
  await page.evaluate(()=>brejo.boss.prepareActionFrames('roar','down'));
  await page.evaluate(()=>window.step(.9));
  await page.evaluate(()=>window.step(.85));
  const combatRoar=await page.evaluate(()=>({active:brejo.boss.actionActive,view:brejo.boss.direction,frame:brejo.boss.frameArt.children[0].material.map?.image?.src,health:brejo.battle.combat.heroes.map(hero=>hero.hp)}));
  assert.equal(combatRoar.active,true);
  assert.match(combatRoar.frame,/rugido-v5/);
  await shoot('09-rugido-no-combate');
  await page.evaluate(()=>window.step(.22));
  const impact=await page.evaluate(()=>({frame:brejo.boss.frameArt.children[0].material.map?.image?.src,health:brejo.battle.combat.heroes.map(hero=>hero.hp)}));
  assert.ok(impact.health.some((hp,i)=>hp<combatRoar.health[i]),'dano só após o contato do rugido');
  assert.match(impact.frame,/rugido-v5/);
  assert.deepEqual(errors,[]);
  assert.equal(posed.rot,0,'sem camadas soltas de ferida');
  assert.ok(death.elapsed>1.15,'a queda chegou à pose final');
  const rendering=await page.evaluate(()=>({drawCalls:brejo.renderer.info.render.calls,triangles:brejo.renderer.info.render.triangles,bossMeshes:(()=>{let count=0;brejo.boss.frameArt.traverse(node=>{if(node.isMesh)count++;});return count;})()}));
  const transition=await page.evaluate(async()=>{
    const {boss,battle}=brejo,{setDirection}=await import('/facing.js');
    await boss.prepareActionFrames('roar','right');setDirection(boss,'right');boss.showActionFrame('roar',1);
    boss.clearActionFrame();
    const held=boss.frameArt.visible&&!boss.art.visible;
    setDirection(boss,'left');const turned=boss.frameArt.visible&&!boss.art.visible;
    battle.restart();await boss.prepareActionFrames('idle',boss.direction);window.step(.02);
    const restarted=boss.frameArt.visible&&!boss.art.visible&&!boss.death;
    const frame=boss.frameArt.children[0].material.map.image.src;
    return {held,turned,restarted,frame};
  });
  assert.equal(transition.held,true);assert.equal(transition.turned,true);assert.equal(transition.restarted,true);
  assert.match(transition.frame,/repouso-v2/);
  // The review page uses the same placement and durations as the arena.
  const preview=await browser.newPage();preview.on('pageerror',e=>errors.push(e.message));
  await preview.setViewport({width:1000,height:1100});
  await preview.goto('http://127.0.0.1:4173/art/rosnaldo/index.html',{waitUntil:'networkidle0'});
  for(const kind of ['idle','bite','roar','hit','bleed','death']){
    await preview.select('#action',kind);
    await preview.waitForFunction(()=>document.getElementById('status').textContent.startsWith('12 quadros'));
    await preview.$eval('#frame',e=>{e.value=6;e.dispatchEvent(new Event('input'));});
    assert.equal(await preview.$eval('#counter',e=>e.textContent),'7 / 12');
    assert.equal(await preview.$eval('#play',e=>e.textContent),'Reproduzir');
  }
  await preview.select('#speed','1.5');await preview.click('#play');
  await preview.waitForFunction(()=>document.getElementById('counter').textContent==='12 / 12'&&document.getElementById('play').textContent==='Reproduzir');
  await preview.select('#action','idle');await preview.waitForFunction(()=>document.getElementById('status').textContent.startsWith('12 quadros'));
  await preview.screenshot({path:new URL('visualizador.png',output).pathname.slice(1),fullPage:true});
  await preview.setViewport({width:390,height:900});
  assert.ok(await preview.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({transition,preview:'6 ações × 4 direções; pausa, quadros, velocidade, derrota e tela estreita conferidos'}));
  console.log(JSON.stringify({passed:true,posed,death,rendering,combatRoar,impact,errors,output:output.pathname},null,1));
}finally{await browser.close();}
