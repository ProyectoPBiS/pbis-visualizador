import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(root,'test-results/lazy-resources');await fs.mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{
 const file=path.resolve(root,'site','.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(path.join(root,'site')+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200).end(await fs.readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
const requests=[],errors=[],external=[];let corruptParser=true,failPdf=true;
await context.addInitScript(()=>{for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,name,{get(){throw Error('Persistent storage forbidden');}});});
page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',async route=>{
 const req=route.request(),url=req.url();
 if(!url.startsWith(origin+'/')){external.push(url);return route.abort();}
 requests.push({url,method:req.method(),body:req.postData()});
 if(url.includes('/workers/parser.')&&corruptParser){corruptParser=false;return route.fulfill({status:200,body:'self.onmessage=()=>postMessage({sheets:[]});'});}
 if(url.includes('/workers/pdf.')&&failPdf){failPdf=false;return route.fulfill({status:503,body:'unavailable'});}
 return route.continue();
});
try{
 await page.goto(origin+'/PBIS.html');
 const workerRequests=kind=>requests.filter(r=>r.url.includes('/workers/'+kind+'.'));
 assert.equal(workerRequests('parser').length,0);assert.equal(workerRequests('pdf').length,0);
 await page.locator('#username').fill('orientacion');await page.locator('#password').fill('FRJ508');
 await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();
 const excel=path.join(root,'data/examples/datos_evaluacion.xlsx');
 await page.locator('#file-data').setInputFiles(excel);
 await page.locator('#import-error').filter({hasText:'Comprueba la conexión'}).waitFor();
 assert.equal(await page.locator('#show-reports').isDisabled(),true,'Altered worker must not parse a file');
 assert.equal(workerRequests('parser').length,1);
 await page.locator('#file-data').setInputFiles([]);await page.locator('#file-data').setInputFiles(excel);
 await page.locator('#show-reports:enabled').waitFor();await page.locator('#show-reports').click();
 await page.locator('#tab-center:enabled').waitFor();assert.equal(workerRequests('parser').length,2);
 assert.equal(workerRequests('pdf').length,0);
 // PDF crypto is fetched only on confirmation. HTTP failure has no plaintext fallback.
 await page.locator('#export-pdf').click();await page.locator('#pdf-dni').fill('11223344B');await page.locator('#pdf-terms').check();
 let downloads=0;page.on('download',()=>downloads++);
 await page.locator('#pdf-confirm').click();await page.locator('#pdf-status').filter({hasText:'Comprueba la conexión'}).waitFor();
 assert.equal(downloads,0);assert.equal(workerRequests('pdf').length,1);
 await page.locator('#pdf-dni').fill('11223344B');await page.locator('#pdf-terms').check();
 const ready=page.waitForEvent('download');await page.locator('#pdf-confirm').click();
 const download=await ready;const destination=path.join(output,'protected.pdf');await download.saveAs(destination);
 assert.match((await fs.readFile(destination)).toString('latin1'),/\/Encrypt/);assert.equal(downloads,1);
 assert.equal(workerRequests('pdf').length,2);
 // Both sources now live in memory, so a second load needs no HTTP request.
 await page.evaluate(()=>Promise.all([PbisResources.worker('parser'),PbisResources.worker('pdf')]));
 assert.equal(workerRequests('parser').length,2);assert.equal(workerRequests('pdf').length,2);
 const cancelled=await page.evaluate(async()=>{
   const original=PbisResources,NativeWorker=Worker;let complete,current=true,created=0;
   window.PbisResources={worker:()=>new Promise(resolve=>{complete=resolve;})};
   window.Worker=class extends NativeWorker{constructor(...args){created++;super(...args);}};
   try{
     const pending=PbisPdfCrypto.protect(new ArrayBuffer(10),'12345678Z',{current:()=>current}).catch(error=>error.message);
     current=false;complete('unused worker');return {message:await pending,created};
   }finally{window.PbisResources=original;window.Worker=NativeWorker;}
 });
 assert.match(cancelled.message,/consulta ha cambiado/);assert.equal(cancelled.created,0);
 assert.equal(external.length,0);assert.ok(requests.every(r=>r.method==='GET'&&r.body===null));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,onDemand:true,integrityRejectsTampering:true,retry:true,pdfEncrypted:true,codeReused:true,cancelDuringFetch:true,noDataUpload:true,noPersistentStorage:true}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
