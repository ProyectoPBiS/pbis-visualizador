// Regression journey for the local 0.13 redesign. Uses only synthetic files and intercepted mail.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('../../src/core.js'),X=require('../../vendor/xlsx.full.min.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site=process.env.PBIS_TEST_SITE?path.resolve(process.env.PBIS_TEST_SITE):path.join(root,'site');
const server=http.createServer((req,res)=>{
 const file=path.resolve(site,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',file.endsWith('.json')?'application/json':'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:1000}});
page.setDefaultTimeout(15000);
const errors=[],external=[],sent=[];
const demoData=JSON.parse(fs.readFileSync(path.join(site,'demo-data.json'),'utf8'));
const workbook=X.read(fs.readFileSync(path.join(root,'data/examples/datos_evaluacion.xlsx')),{type:'buffer'});
const sourceStudents=C.validateAndJoin(X.utils.sheet_to_json(workbook.Sheets.Datos),null,X.utils.sheet_to_json(workbook.Sheets.Grupos)).students;
const classRows=demoData.students.filter(s=>s.Centro==='Centro 3705'&&s.Curso==='1.º ESO'&&s.Grupo==='A');
const classIds=new Set(classRows.map(s=>s.ID));
const expectedMentionIds=classRows.filter(s=>s.bullying_companeros_n>=2).map(s=>s.ID).sort();
// Independent expectation: one same-sign mutual pair, no unilateral/mixed pairs.
const expectedEdges=[];
for(let i=0;i<classRows.length;i++)for(let j=i+1;j<classRows.length;j++){
 const a=classRows[i],b=classRows[j];
 const forward=(a.respondio==='No'?[]:a.relaciones_red||[]).filter(e=>e.id===b.ID);
 const reverse=(b.respondio==='No'?[]:b.relaciones_red||[]).filter(e=>e.id===a.ID);
 const links=[...forward,...reverse].filter(e=>['amistad','rechazo'].includes(e.tipo)&&[1,2].includes(e.intensidad));
 if(!forward.length||!reverse.length||new Set(links.map(e=>e.tipo)).size!==1)continue;
 const intensity=(Math.max(...forward.map(e=>e.intensidad))+Math.max(...reverse.map(e=>e.intensidad)))/2;
 expectedEdges.push([...([a.ID,b.ID].sort()),String(Number((intensity*1.6).toFixed(2)))]);
}
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,name,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',async route=>{
 const request=route.request(),url=request.url();
 if(url.startsWith(origin+'/')||url.startsWith('file:'))return route.continue();
 if(url==='https://formspree.io/f/mvkgydrn'){sent.push(request.postDataJSON());return route.fulfill({status:sent.length===1?503:200,contentType:'application/json',body:JSON.stringify({ok:sent.length!==1})});}
 external.push(url);return route.abort();
});
async function demo(url){await page.goto(url);if(await page.locator('#start-tour-login').isVisible())await page.locator('#start-tour-login').click();await page.locator('#tab-group:enabled').waitFor();assert.equal(await page.locator('#tour-panel').count(),0);assert.equal(await page.locator('#course').inputValue(),'1.º ESO');assert.equal(await page.locator('#group').inputValue(),'A');}
async function login(account){await page.locator('#username').fill(account.username);await page.locator('#password').fill(account.password);await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();}
async function upload(){await page.locator('#file-data').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));await page.locator('#sheet-data').selectOption('Datos');await page.locator('#show-reports').click();}
try{
 await demo(origin+'/PBIS.html');
 for(const width of [1360,390,320]){
  await page.setViewportSize({width,height:1000});await page.locator('#tab-group').click();
  await page.locator('[data-result="bullying_companeros"]').click();
  assert.equal(await page.locator('.roster-table tbody tr').count(),expectedMentionIds.length);
  assert.deepEqual((await page.locator('.roster-table tbody tr[data-student-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.studentId))).sort(),expectedMentionIds);
  if(width<=720)await page.locator('#roster-sort-select').selectOption('bullying_peers');
  else await page.locator('[data-roster-sort="bullying_peers"]').click();
  assert.ok(await page.locator('.roster-table tbody tr').count()>0);
  assert.equal(await page.locator('#tab-review').count(),0);
  await page.locator('#tab-network').click();
  const panel=page.locator('.class-network'),toggle=panel.locator('[data-class-network-layout-toggle]');
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  const signature=()=>panel.locator('[data-class-from]').evaluateAll(edges=>edges.map(e=>[e.dataset.classFrom,e.dataset.classTo,e.getAttribute('stroke-width')]));
  const before=await signature();assert.deepEqual([...before].sort(),[...expectedEdges].sort());
  await toggle.click();assert.equal(await panel.locator('.class-network-ring').count(),1);await toggle.click();assert.deepEqual(await signature(),before);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await panel.locator('[data-class-student="00253"]').click();assert.match(await page.locator('#back-to-roster').innerText(),/Volver a la red/);
  await page.locator('#back-to-roster').click();assert.equal(await page.locator('#tab-network').getAttribute('aria-selected'),'true');

 }
 await page.locator('#logout').click();assert.equal(sent.length,0);
 const profiles=JSON.parse(fs.readFileSync(path.join(root,'data/profiles.json'),'utf8'));
 for(const account of profiles){
  await page.goto(origin+'/PBIS.html');await login(account);
  assert.equal(await page.locator('#tab-center').count(),account.role==='orientador'?1:0);
  const permitted=C.scopeRows(sourceStudents,account);
  await upload();
  if(permitted.length){
   await page.locator('#report-content .report').waitFor();
   if(account.role==='tutor')assert.deepEqual(await page.locator('#course option').allTextContents(),[account.course]);
  }else{
   await page.locator('#import-error').filter({hasText:'No hay estudiantes del curso o aula asignados'}).waitFor();
   assert.equal(await page.locator('#tab-roster').isDisabled(),true);
   assert.equal(await page.locator('#report-content .report').count(),0);
  }
  await page.locator('#logout').click();
 }
 await page.context().setOffline(true);await demo(pathToFileURL(path.join(root,'release/PBIS.html')).href);
 await page.locator('#logout').click();assert.equal(sent.length,0);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log(JSON.stringify({ok:true,directDemo:true,clickableCounts:true,communities:true,teacherReviewsRemoved:true,profiles:profiles.length,offlineEmbeddedDemo:true,widths:[1360,390,320]}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

