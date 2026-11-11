import assert from 'node:assert/strict';
import {generateProject} from './classroom-helpers.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),P=require('../../src/protected-project.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),out=path.join(root,'test-results/pdf-permissions');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PBIS_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const page=await browser.newPage({viewport:{width:1360,height:960},acceptDownloads:true}),errors=[],external=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(window,key,{get(){throw Error('Persistent storage forbidden');}});});
await page.route('**/*',route=>{if(route.request().url().startsWith('file:'))return route.continue();external.push(route.request().url());return route.abort();});
async function login(user='orientacion',password='FRJ508',file){await page.locator('#username').fill(user);await page.locator('#password').fill(password);await page.locator('#login-terms').check();await page.locator('#login-form button[type=submit]').click();if(file){await page.locator('#file-data').setInputFiles(file);await page.locator('#tab-group:not([disabled])').waitFor();}}
async function logout(){await page.locator('#logout').click();await page.locator('#login-form').waitFor();}
async function checkViews(allowed,center=false){for(const tab of [...(center?['center']:[]),'group','student']){await page.locator('#tab-'+tab).click();assert.equal(await page.locator('#export-pdf').count(),allowed?1:0);assert.equal(await page.locator('#pdf-dialog').count(),0);}}
try{
 await page.goto(pathToFileURL(path.join(root,'release/PBIS.html')).href);await login();await page.locator('#admin-project').click();
 await page.locator('#admin-file').setInputFiles(path.join(root,'data/examples/datos_evaluacion.xlsx'));await page.locator('#admin-source-status').filter({hasText:'estudiantes preparados'}).waitFor();
 assert.equal(await page.locator('#admin-pdf-all').isChecked(),false);
 const first=await generateProject(page,out,'permisos-v1'),teacher=first.accounts.find(a=>a.username==='1ESOA');
 assert.equal((await P.open(await fs.readFile(first.project),teacher.username,teacher.password)).grant.canExportPdf,false);
 await page.locator('.protected-dialog [data-close]').click();await logout();
 await login(teacher.username,teacher.password,first.project);await checkViews(false);assert.match(await page.locator('.protected-watermark').innerText(),/1ESOA/);await logout();
 await login('orientacion',first.orientation.password,first.project);await checkViews(false,true);await page.locator('#admin-project').click();await page.locator('#admin-pdf-all').check();
 const second=await generateProject(page,out,'permisos-v2'),nextTeacher=second.accounts.find(a=>a.username===teacher.username);
 await page.locator('#admin-pdf-all').uncheck();assert.equal(await page.locator('#admin-download').isVisible(),false);
 for(const width of [390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('.protected-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.locator('#admin-pdf-all').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'permiso-movil-'+width+'.png')});}
 await page.locator('.protected-dialog [data-close]').click();await logout();
 await login(nextTeacher.username,nextTeacher.password,second.project);await checkViews(true);await page.locator('#export-pdf').click();assert.equal(await page.locator('#pdf-dni').count(),1);await page.locator('#pdf-dni').fill('12345678Z');
 assert.match(await page.locator('.pdf-identity').innerText(),/1ESOA/);const pdfWait=page.waitForEvent('download');await page.locator('#pdf-terms').check();await page.locator('#pdf-confirm').click();await (await pdfWait).saveAs(path.join(out,'docente-autorizado.pdf'));await page.locator('#pdf-cancel').click();await logout();
 await login('orientacion',second.orientation.password,second.project);await checkViews(true,true);assert.equal(await page.locator('.protected-watermark').count(),0);await logout();
 assert.equal((await P.open(await fs.readFile(second.project),'orientacion',first.orientation.password)).grant.role,'orientador'); assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join('\n'));
 console.log(JSON.stringify({ok:true,creation:true,globalPermissionsAndPasswordRotation:true,encryptedPermissions:true,teacherAllowedAndDenied:true,orientationAllowedAndDenied:true,download:true,mobile:[390,320],noExternalRequests:true,noBrowserPersistence:true}));
}finally{await browser.close();}
