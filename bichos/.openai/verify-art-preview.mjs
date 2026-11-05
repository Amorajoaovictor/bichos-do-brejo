import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1000,height:1100});
  await page.goto(new URL('../art/rosnaldo/rugido-v2/index.html',import.meta.url).href,{waitUntil:'networkidle0'});
  await page.click('#play');assert.equal(await page.$eval('#play',e=>e.textContent),'Reproduzir');
  for(let i=0;i<12;i++){
    await page.$eval('#frame',(e,i)=>{e.value=i;e.dispatchEvent(new Event('input'));},i);
    await page.waitForFunction(()=>[...document.querySelectorAll('img[data-direction]')].every(im=>im.complete&&im.naturalWidth===362&&im.naturalHeight===362));
    assert.equal(await page.$eval('#counter',e=>e.textContent),`${i+1} / 12`);
  }
  await page.$eval('#frame',e=>{e.value=6;e.dispatchEvent(new Event('input'));});
  await page.screenshot({path:new URL('./facing-review/art-viewer.png',import.meta.url).pathname.slice(1),fullPage:true});
  await page.select('#speed','100');await page.click('#play');
  await page.waitForFunction(()=>document.getElementById('counter').textContent!=='7 / 12');
  await page.setViewport({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,framesChecked:48,checks:['all PNG frames load','frame selection','pause and playback','speed change','mobile layout'],errors}));
}finally{await browser.close();}
