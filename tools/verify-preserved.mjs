import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const previous=process.argv[2];
if(!previous)throw Error('Indica la carpeta congelada anterior, solo lectura.');
const files=['src/core.js','src/raw-wave1.js','src/parser-worker.js','src/protected-project.js','src/access-audit.js','src/audit-connection.js','src/project-accounts.js','src/project-admin.js','src/linked-feedback.js','src/feedback.js','src/pdf-crypto.js','src/pdf-crypto-worker.js','data/fixtures.json','data/profiles.json','tools/demo-fixture.mjs','tests/fixtures/network-reference-R.json'];
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const results=files.map(file=>({file,sha256:hash(file),unchanged:hash(file)===hash(path.join(previous,file))}));
fs.writeFileSync('test-results/relaunch/preserved-engine.json',JSON.stringify({date:'2026-11-11',results},null,2));
console.log(JSON.stringify({checked:results.length,unchanged:results.filter(x=>x.unchanged).length,differences:results.filter(x=>!x.unchanged).map(x=>x.file)}));
if(results.some(x=>!x.unchanged))process.exitCode=1;

