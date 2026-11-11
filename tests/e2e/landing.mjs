import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {zipEntries} from '../../tools/verify-release.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site=path.join(root,'site'),out=path.join(root,'test-results/landing');
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.zip':'application/zip'};
const server=http.createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(site,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(await fs.readFile(file));}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:1000},acceptDownloads:true});
const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin+'/')||url.startsWith('file:'))return route.continue();external.push(url);return route.abort();});
try{
 async function loadGuidedDemo(){
  await page.locator('#tab-group:enabled').waitFor();
  assert.equal(await page.locator('#tour-panel').count(),0);
  assert.equal(await page.locator('#course').inputValue(),'1.º ESO');
  assert.equal(await page.locator('#group').inputValue(),'A');
  assert.match(await page.locator('#report-content').innerText(),/estudiantes/);
  await page.locator('#logout').click();await page.locator('#login-form').waitFor();
  assert.equal(await page.locator('#login-terms').isChecked(),false);
 }

 await page.goto(origin+'/');
 assert.match(await page.locator('.private-access').innerText(),/Tu área privada/);
 assert.match(await page.locator('.hero-cta a').innerText(),/¿Quieres ver cómo funciona/);
 assert.equal(await page.locator('a[href^="downloads/"]').count(),0);
 for(const width of [1360,768,390,320]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+width);
  await page.screenshot({path:path.join(out,'portada-'+width+'.png'),fullPage:width===1360});
  if(await page.locator('#menuBtn').isVisible()){
   await page.locator('#menuBtn').click();assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'true');
   await page.locator('#mobileMenu a[href="#contacto"]').click();
   assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'false');
   await page.locator('#menuBtn').click();await page.keyboard.press('Escape');
   assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'false');
  }
 }
 assert.equal(await page.locator('.faq-featured').count(),2);
 const faq=page.locator('.faq-more > summary');
 assert.equal(await page.locator('.faq-more').getAttribute('open'),null);
 await faq.focus();await page.keyboard.press('Enter');
 assert.notEqual(await page.locator('.faq-more').getAttribute('open'),null);
 assert.equal(await page.locator('.faq-more details').count(),15);
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('.faq-more').getAttribute('open'),null);
 await page.locator('[data-modal=avisoLegal]').click();assert.match(await page.locator('#avisoLegal').innerText(),/Equipo PBIS/);
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:1360,height:1000});
 await page.locator('.private-access').click();await page.locator('#login-form').waitFor();
 assert.equal(await page.locator('#report-content').count(),0);
 await page.locator('.offline-access summary').click();
 for(const platform of ['Windows','macOS','Linux']){
  const download=page.waitForEvent('download');await page.locator('a[href="downloads/PBIS-'+platform+'.zip"]').click();
  const file=path.join(out,'PBIS-'+platform+'.zip');await (await download).saveAs(file);
  assert.deepEqual(await fs.readFile(file),await fs.readFile(path.join(site,'downloads','PBIS-'+platform+'.zip')));
 }
 await page.goto(origin+'/');await page.locator('.hero-cta a').click();await page.locator('#tab-group:enabled').waitFor();
 await loadGuidedDemo();
 // CI may open the downloaded copy. The desktop review cannot run file://.
 const entries=zipEntries(await fs.readFile(path.join(out,'PBIS-Windows.zip')));
 const local=path.join(out,'offline');await fs.mkdir(local,{recursive:true});
 for(const [name,body]of entries){const target=path.join(local,name.slice('PBIS/'.length));await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,body);}
 await page.context().setOffline(true);
 await page.goto(pathToFileURL(path.join(local,'index.html')).href);
 assert.ok(await page.locator('.private-access').isVisible());
 await page.locator('.art[href="metodologia.html"]').click();
 assert.match(await page.title(),/Metodología/);
 assert.equal(await page.locator('main h1').innerText(),'Cómo leer PBIS');
 await page.goto(pathToFileURL(path.join(local,'index.html')).href);
 await page.locator('.hero-cta a').click();await page.locator('#tab-group:enabled').waitFor();
 await loadGuidedDemo();
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 console.log(JSON.stringify({ok:true,viewportWidths:[1360,768,390,320],downloads:3,accountEntry:true,directDemoEntry:true,demoLoadOnlineAndOffline:true,demoNoRealDataAcknowledgement:true,realAccountAcknowledgementRestored:true,offlineHomeAndEntry:true,noExternalRequests:true}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
