import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/art/cenario/interativos-v1/',{waitUntil:'networkidle0'});
  // The local static server serves explicit filenames rather than directory indexes.
  if(await page.title()!=='Objetos do brejo · prévia')await page.goto('http://127.0.0.1:4173/art/cenario/interativos-v1/index.html',{waitUntil:'networkidle0'});
  await page.click('#play');assert.equal(await page.$eval('#play',e=>e.textContent),'Reproduzir');
  await page.$eval('#scrub',e=>{e.value=9;e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#count',e=>e.textContent),'10 / 15');assert.ok(await page.$eval('#frame',e=>e.src.endsWith('/previa/9.png')));
  assert.ok(await page.$$eval('.objects img',images=>images.every(i=>i.complete&&i.naturalWidth>0)));
  await page.select('#speed','0.5');await page.click('#play');assert.equal(await page.$eval('#play',e=>e.textContent),'Pausar');assert.deepEqual(errors,[]);
  console.log('Prévia: PNGs, pausa, seleção de quadro e velocidade funcionando.');
}finally{await browser.close();}
