import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output=new URL('./facing-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
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
  await page.evaluate(async()=>{window.facing=await import('/facing.js');window.animation=await import('/animation.js');brejo.state.paused=false;window.step(.016);});
  const directions=['up','right','down','left'],axes={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
  // Exercise real movement and attacks on every side, without relying on the
  // pose preview to prove combat integration. Each scenario starts fresh.
  for(let index=0;index<3;index++)for(const direction of directions){
    const result=await page.evaluate(({index,direction,axis})=>{
      const {battle,rigs,state}=brejo;battle.restart();const c=battle.combat;
      c.cursor=c.order.indexOf(c.heroes[index]);c.points=2;state.selected=index;
      const actor=c.current,rig=rigs[index],start=c.tiles.find(t=>t.col===7&&t.row===3);
      actor.cell={...start};rig.cell={...start};rig.root.position.set(start.x,.08,start.z);
      const goal=c.tiles.find(t=>t.col===start.col+axis[0]&&t.row===start.row+axis[1]);
      const valid=c.canMove(goal);if(!valid.ok)return {valid};battle.move(goal);window.step(.1);
      const movingDirection=rig.direction;window.step(1);
      return {valid,movingDirection,finalDirection:rig.direction,busy:battle.busy,position:[rig.root.position.x,rig.root.position.z],expected:[goal.x,goal.z]};
    },{index,direction,axis:axes[direction]});
    assert.equal(result.valid.ok,true);assert.equal(result.movingDirection,direction);assert.equal(result.finalDirection,direction);assert.equal(result.busy,false);assert.deepEqual(result.position,result.expected);

    const attack=await page.evaluate(({index,direction})=>{
      const {battle,rigs,boss,state}=brejo;battle.restart();const c=battle.combat;c.cursor=c.order.indexOf(c.heroes[index]);c.points=2;state.selected=index;
      const cells={up:[4,4],right:[2,3],down:[4,1],left:[5,2]},[col,row]=cells[direction],cell=c.tiles.find(t=>t.col===col&&t.row===row);
      c.current.cell={...cell};const rig=rigs[index];rig.cell={...cell};rig.root.position.set(cell.x,.08,cell.z);
      facing.setDirection(rig,direction==='up'?'down':'up');const valid=c.canAttack();if(!valid.ok)return {valid};
      const hp=c.boss.hp;battle.attack();window.step(.25);const attackDirection=rig.direction;
      const before={direction:rig.direction,time:state.time,pose:animation.sampleAction(rig.id,.25)};state.paused=true;window.step(.5);
      const frozen=rig.direction===before.direction&&state.time===before.time;state.paused=false;window.step(1.6);
      return {valid,attackDirection,frozen,damage:hp-c.boss.hp,expectedDamage:c.damage(c.heroes[index]),busy:battle.busy,viewCount:Object.values(rig.views).filter(v=>v.art.visible).length};
    },{index,direction});
    assert.equal(attack.valid.ok,true);assert.equal(attack.attackDirection,direction);assert.equal(attack.frozen,true);assert.equal(attack.damage,attack.expectedDamage);assert.equal(attack.busy,false);assert.equal(attack.viewCount,1);
  }
  // A bent route must change direction at its corner, and stop on the last one.
  const corner=await page.evaluate(()=>{const {battle,rigs}=brejo;battle.restart();const c=battle.combat,rig=rigs[1],start=c.tiles.find(t=>t.col===7&&t.row===3);c.current.cell={...start};rig.cell={...start};rig.root.position.set(start.x,.08,start.z);battle.move(c.tiles.find(t=>t.col===8&&t.row===4));const path=rig.moving.path.map(t=>({x:t.x,z:t.z}));window.step(.1);const first=rig.direction;window.step(.59);const second=rig.direction;window.step(1);return {first,second,last:rig.direction,path,busy:battle.busy};});
  assert.notEqual(corner.first,corner.second);assert.equal(corner.last,corner.second);assert.equal(corner.busy,false);
  // Mutation visibility must survive every view and a restart must clear all.
  assert.equal(await page.evaluate(()=>{const {battle,rigs}=brejo;battle.restart();document.querySelector('[data-mutation="horn"]').click();const rig=rigs[1];const kept=['up','right','down','left'].every(d=>{facing.setDirection(rig,d);return rig.parts.mut_horn.visible;});battle.restart();return kept&&rigs.every(r=>Object.values(r.views).every(v=>!v.parts.mut_horn.visible&&!v.parts.rage.visible));}),true);

  await page.evaluate(()=>{brejo.battle.restart();window.step(.016);});
  await page.screenshot({path:new URL('arena.png',output).pathname.slice(1)});
  const frames=[];
  for(const pose of ['idle','attack'])for(let index=0;index<4;index++)for(const direction of directions){
    const clip=await page.evaluate(({index,direction,pose})=>{
      const {rigs,boss,camera,scene,renderer}=brejo,all=[...rigs,boss],rig=all[index];
      for(const r of all){r.root.visible=r===rig;r.shadow.visible=false;}boss.floor.visible=false;
      document.getElementById('labels').style.display='none';
      rig.root.position.set(0,.08,0);camera.zoom=index===3?1.05:2;camera.updateProjectionMatrix();
      facing.setDirection(rig,direction);animation.idlePose(rig,2);rig.parts.rage.visible=pose==='attack';
      if(pose==='attack')animation.actionPose(rig,index===3?'bite':rig.id,.49);
      renderer.render(scene,camera);
      const pos=rig.root.position.clone().project(camera),v=document.getElementById('viewport').getBoundingClientRect(),x=v.x+(pos.x*.5+.5)*v.width,y=v.y+(-pos.y*.5+.5)*v.height;
      return {x:x-120,y:y-255,width:240,height:280};
    },{index,direction,pose});
    const name=`${index}-${direction}-${pose}`;await page.screenshot({path:new URL(name+'.png',output).pathname.slice(1),clip});frames.push({name,index,direction,pose});
  }
  for(const pose of ['idle','attack']){
    const names=['Farrapo','Fusível','Bolota','Rosnaldo'],labels={up:'Cima · costas',right:'Direita',down:'Baixo · frente',left:'Esquerda'};
    await writeFile(new URL(pose+'.html',output),`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#30372d;color:#e4dcc9;font:14px system-ui}main{display:grid;grid-template-columns:repeat(4,240px);gap:8px;padding:8px}figure{margin:0}img{width:240px;height:280px}figcaption{padding:6px}</style><main>${frames.filter(f=>f.pose===pose).map(f=>`<figure><img src="${f.name}.png"><figcaption>${names[f.index]} · ${labels[f.direction]}</figcaption></figure>`).join('')}</main>`);
    await page.setViewport({width:1000,height:1280,deviceScaleFactor:1});await page.goto(new URL(pose+'.html',output).href);await page.screenshot({path:new URL(pose+'.png',output).pathname.slice(1),fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,scenarios:24,frames:frames.length,browserErrors:errors,checks:['all hero movements and attacks in four directions','turn at path corner','pause','damage','mutation views','restart'],output:output.pathname}));
}finally{await browser.close();}
