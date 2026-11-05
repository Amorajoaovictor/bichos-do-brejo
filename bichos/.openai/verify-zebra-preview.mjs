import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=new URL('./zebra-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1000,height:1100});
  await page.goto(`${process.env.ZEBRA_REVIEW_URL??'http://127.0.0.1:4173'}/art/zebra/png-v1/index.html`,{waitUntil:'networkidle0'});
  await page.click('#play');await page.$eval('#frame',e=>{e.value='3';e.dispatchEvent(new Event('input'));});
  assert.ok(await page.$$eval('.grid img',imgs=>imgs.every(img=>img.complete&&img.naturalWidth===512&&img.src.endsWith('-5.png'))));
  await page.screenshot({path:fileURLToPath(new URL('visualizador-coice.png',output)),fullPage:true});
  await page.select('#speed','1.5');await page.select('#action','death');await page.click('#restart');await new Promise(resolve=>setTimeout(resolve,850));
  assert.ok(await page.$$eval('.grid img',imgs=>imgs.every(img=>img.src.endsWith('-8.png'))));assert.equal(await page.$eval('#play',e=>e.textContent),'Reproduzir');
  await page.screenshot({path:fileURLToPath(new URL('visualizador-derrota.png',output)),fullPage:true});
  for(const view of ['right','left','down','up'])for(let i=0;i<9;i++){
    const {data,info}=await sharp(fileURLToPath(new URL(`../art/zebra/png-v1/quadros/${view}-${i}.png`,import.meta.url))).raw().toBuffer({resolveWithObject:true});
    assert.equal(info.channels,4);assert.equal(info.width,512);assert.equal(info.height,512);
    for(let x=0;x<512;x++){assert.equal(data[x*4+3],0);assert.equal(data[((511*512)+x)*4+3],0);}
    for(let y=0;y<512;y++){assert.equal(data[(y*512)*4+3],0);assert.equal(data[(y*512+511)*4+3],0);}
  }
  assert.deepEqual(errors,[]);await writeFile(new URL('verificacao-previa.json',output),JSON.stringify({passed:true,errors,frames:36,checks:['four views','pause and scrubbing','kick extension','speed control','defeat holds final drawing','transparent edges']},null,2));console.log('Zebra: prévia e transparência verificadas.');
}finally{await browser.close();}
