import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import {mkdir} from 'node:fs/promises';
const label=process.argv[2]||'current',folder=new URL('./render-review/',import.meta.url);await mkdir(folder,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(()=>brejo.boss.prepareActionFrames('idle',brejo.boss.direction));
  const result=await page.evaluate(async()=>{
    const {renderer,scene,camera,rigs,boss,state}=brejo;
    state.paused=true;
    const {idlePose}=await import('/animation.js');
    rigs.forEach(rig=>idlePose(rig,0));idlePose(boss,0);boss.showActionFrame('idle',0);
    renderer.render(scene,camera);
    const calls=renderer.info.render.calls,triangles=renderer.info.render.triangles;
    const count=root=>{let meshes=0;root.traverse(node=>{if(node.isMesh&&node.visible){let parent=node.parent,shown=true;while(parent&&parent!==root){shown&&=parent.visible;parent=parent.parent;}if(shown)meshes++;}});return meshes;};
    for(let i=0;i<2;i++)renderer.render(scene,camera);
    const start=performance.now();for(let i=0;i<8;i++)renderer.render(scene,camera);
    return {calls,triangles,msPerRender:(performance.now()-start)/8,heroMeshes:rigs.map(rig=>count(rig.root)),bossMeshes:count(boss.root),programs:renderer.info.programs?.length};
  });
  await page.$eval('#viewport canvas',canvas=>canvas.toDataURL('image/png')).then(async data=>{
    const {writeFile}=await import('node:fs/promises');await writeFile(new URL(`${label}.png`,folder),Buffer.from(data.split(',')[1],'base64'));
  });
  console.log(JSON.stringify({label,...result,pageErrors:errors},null,2));
}finally{await browser.close();}
