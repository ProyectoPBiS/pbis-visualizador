import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyRelease,zipEntries} from '../tools/verify-release.mjs';
test('release checks text checksums, manifests, exact ZIP contents and public file allowlist',()=>{
  assert.equal(verifyRelease().downloads,4);
});
test('release verification rejects checksum corruption and unexpected public files',t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pbis-release-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  for(const folder of ['site','release'])fs.cpSync(new URL('../'+folder,import.meta.url),path.join(temp,folder),{recursive:true});
  fs.copyFileSync(new URL('../package.json',import.meta.url),path.join(temp,'package.json'));
  const sums=path.join(temp,'site/downloads/SHA256SUMS.txt'),original=fs.readFileSync(sums);
  fs.writeFileSync(sums,'invalid');assert.throws(()=>verifyRelease(temp),/SHA256SUMS/);
  fs.writeFileSync(sums,original);fs.writeFileSync(path.join(temp,'site/private.json'),'{}');
  assert.throws(()=>verifyRelease(temp),/público no previsto/);
  fs.unlinkSync(path.join(temp,'site/private.json'));
  fs.copyFileSync(new URL('../data/examples/llave_evaluacion.xlsx',import.meta.url),path.join(temp,'site/downloads/llave_evaluacion.xlsx'));
  assert.throws(()=>verifyRelease(temp),/público no previsto/,'Even a synthetic key must not become a public download again.');
});
test('landing assets and demo data carry fingerprints derived from their bytes',()=>{
  const base=new URL('../site/',import.meta.url),html=fs.readFileSync(new URL('index.html',base),'utf8');
  for(const name of ['site.css','site.js','assets/ficha-grupo-ejemplo.png']){
    const digest=createHash('sha256').update(fs.readFileSync(new URL(name,base))).digest('hex').slice(0,12);
    assert.ok(html.includes(name+'?v='+digest));
  }
  const demoHash=createHash('sha256').update(fs.readFileSync(new URL('demo-data.json',base))).digest('hex').slice(0,12);
  assert.ok(fs.readFileSync(new URL('PBIS.html',base),'utf8').includes('demo-data.json?v='+demoHash));
});

test('downloaded portal keeps all its local navigation and reference documents inside each ZIP',()=>{
  for(const platform of ['Windows','macOS','Linux','Universal']){
    const entries=zipEntries(fs.readFileSync(new URL('../site/downloads/PBIS-'+platform+'.zip',import.meta.url)));
    for(const name of ['index.html','guia.html','privacidad.html','condiciones.html','cookies.html','metodologia.html']){
      const source=entries.get('PBIS/'+name);
      assert.ok(source,platform+': missing '+name);
      const html=source.toString('utf8');
      for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
        if(/^(?:[a-z]+:|\/\/|#)/i.test(href))continue;
        const target=decodeURIComponent(href.split(/[?#]/)[0]);
        assert.ok(entries.has('PBIS/'+target),platform+': broken '+name+' → '+href);
      }
    }
    const home=entries.get('PBIS/index.html').toString('utf8');
    assert.match(home,/href="metodologia.html"/,'Methodology must be readable offline');
    assert.doesNotMatch(home,/href="https:[^"]*\/metodologia.html"/);
  }
});
