import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=new URL('./facing-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;
      try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  const clip=await page.evaluate(()=>{
    const {battle,rigs,boss,state,camera}=brejo;battle.restart();state.paused=false;const c=battle.combat;
    const cell=c.tiles.find(t=>t.col===6&&t.row===2);c.heroes[0].cell={...cell};rigs[0].root.position.set(cell.x,.08,cell.z);
    c.heroes[1].hp=0;c.heroes[2].hp=0;c.cursor=c.order.indexOf(c.boss);c.points=2;
    camera.zoom=1.65;camera.updateProjectionMatrix();for(const rig of rigs){rig.root.visible=false;rig.shadow.visible=false;}boss.floor.visible=false;
    document.getElementById('labels').style.display='none';document.querySelectorAll('.party-hud,.boss-hud').forEach(el=>el.style.visibility='hidden');window.step(.81);
    const v=document.getElementById('viewport').getBoundingClientRect(),p=boss.root.position.clone().project(camera);
    const x=v.x+(p.x*.5+.5)*v.width,y=v.y+(-p.y*.5+.5)*v.height;
    return {x:Math.round(x-190),y:Math.round(y-385),width:380,height:410};
  });
  const frames=[];
  for(let i=0;i<30;i++){frames.push(await page.screenshot({clip}));await page.evaluate(()=>window.step(.08));}
  await sharp(frames,{join:{animated:true}}).gif({delay:80,loop:0,effort:7}).toFile(new URL('rosnaldo-rugido.gif',output).pathname.slice(1));
  const samples=[0,3,5,7,9,11,13,15,17,19,22,27];
  await sharp({create:{width:380*4,height:410*3,channels:3,background:'#30372d'}}).composite(samples.map((n,i)=>({input:frames[n],left:(i%4)*380,top:Math.floor(i/4)*410}))).png().toFile(new URL('roar-sequence.png',output).pathname.slice(1));
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>brejo.boss.direction),'right');
  console.log(JSON.stringify({passed:true,frames:frames.length,errors,output:output.pathname}));
}finally{await browser.close();}
