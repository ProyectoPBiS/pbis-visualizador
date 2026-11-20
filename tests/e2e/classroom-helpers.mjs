import fs from 'node:fs/promises';
import path from 'node:path';
function unzip(bytes){const files=[];let offset=0;while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),n=bytes.readUInt16LE(offset+26),start=offset+30+n;files.push({name:bytes.subarray(offset+30,start).toString(),bytes:bytes.subarray(start,start+size)});offset=start+size;}return files;}
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
export function readAccessAccounts(docx){
 const xml=unzip(Buffer.from(docx)).find(f=>f.name==='word/document.xml').bytes.toString('utf8');
 const rows=[...xml.matchAll(/<w:tr>([\s\S]*?)<\/w:tr>/g)].slice(1);
 return rows.map(row=>{const cells=[...row[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(m=>decode(m[1]));return {username:cells[1],password:cells[2]};});
}
export async function generateProject(page,out,name,orientationPassword='FRJ508'){
 const downloads=[];const collect=d=>downloads.push(d);page.on('download',collect);
 await page.locator('#admin-terms').check();await page.locator('#admin-build').click();
 await page.waitForFunction(()=>!document.querySelector('#admin-recovery').hidden);
 const deadline=Date.now()+20000;while(downloads.length<2&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
 page.off('download',collect);
 if(downloads.length!==2)throw Error('Expected two direct downloads');
 const direct={};for(const d of downloads){const ext=path.extname(d.suggestedFilename());const file=path.join(out,name+'-direct'+ext);await d.saveAs(file);direct[ext]=await fs.readFile(file);}
 const waiting=page.waitForEvent('download');await page.locator('#admin-download').click();
 const download=await waiting,zip=path.join(out,name+'.zip');await download.saveAs(zip);const files=unzip(await fs.readFile(zip));
 const project=path.join(out,name+'.pbis'),docx=files.find(f=>f.name.endsWith('.docx')).bytes;await fs.writeFile(project,files.find(f=>f.name.endsWith('.pbis')).bytes);
 await fs.writeFile(path.join(out,name+'-ACCESOS.docx'),docx);
 if(!direct['.pbis']?.equals(files.find(f=>f.name.endsWith('.pbis')).bytes)||!direct['.docx']?.equals(docx))throw Error('Direct files differ from ZIP');
 const accounts=readAccessAccounts(docx);
 // Orientation is known by the test session, never recovered from the document.
 return {project,accounts,orientation:{username:'orientacion',password:orientationPassword},zip,docx};
}
