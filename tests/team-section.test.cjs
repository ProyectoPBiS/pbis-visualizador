const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n?/g,'\n');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('team editorial module preserves all people, profiles and local portraits',()=>{
 const component=read('site-src/equipo-pbis/equipo-pbis.html');
 const people=JSON.parse(read('site-src/equipo-pbis/equipo.json'));
 const images=JSON.parse(read('site-src/equipo-pbis/assets-manifest.json'));
 assert.equal(people.length,22);assert.equal(images.length,22);
 const names=[...component.matchAll(/<h4>([^<]+)<\/h4>/g)].map(match=>match[1]);
 assert.deepEqual(names,people.map(person=>person.nombre_visible));
 assert.deepEqual([...component.matchAll(/class="profile-link" href="([^"]+)"/g)].map(match=>match[1]),people.filter(person=>person.perfil).map(person=>person.perfil));
 assert.equal((component.match(/class="profile-link"/g)||[]).length,21);
 assert.equal((component.match(/class="profile-note"/g)||[]).length,1);
 assert.doesNotMatch(component,/<h1|<script|<header|src="https?:/);
 assert.match(component,/<h2>Equipo <span>PBiS<\/span><\/h2>/);
 for(const image of images){
  const bytes=fs.readFileSync(path.join(root,'site-src/equipo-pbis',image.archivo));
  assert.equal(sha(bytes),image.sha256);
  assert.ok(component.includes('src="assets/equipo-pbis/'+path.posix.basename(image.archivo)+'"'));
 }
});

test('built online and offline home include the same team without external portrait dependencies',()=>{
 const online=read('site/index.html'),offline=read('release/index.html');
 const component=read('site-src/equipo-pbis/equipo-pbis.html').trim();
 assert.ok(online.includes(component));
 for(const home of [online,offline]){
  assert.equal((home.match(/id="pbis-equipo"/g)||[]).length,1);
  assert.equal((home.match(/href="#pbis-equipo"/g)||[]).length,2);
  assert.ok(home.indexOf('id="contacto"')<home.indexOf('id="pbis-equipo"'));
  assert.doesNotMatch(home,/<!--PBIS_TEAM_SECTION-->/);
 }
 const assets=JSON.parse(read('site-src/equipo-pbis/assets-manifest.json'));
 for(const image of assets){
  const file='assets/equipo-pbis/'+path.posix.basename(image.archivo);
  const bytes=fs.readFileSync(path.join(root,'site',file));
  assert.equal(sha(bytes),image.sha256);
  const mime=file.endsWith('.png')?'image/png':'image/jpeg';
  assert.ok(offline.includes('src="data:'+mime+';base64,'+bytes.toString('base64')+'"'));
 }
 assert.doesNotMatch(offline,/src="assets\/equipo-pbis\//);
});
