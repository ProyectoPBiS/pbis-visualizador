'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../src/core.js');
test('realistic demo is deterministic, imports the raw synthetic survey and keeps coherent centre-wide counts',async()=>{
 const {generateSurvey}=await import('../tools/synthetic-survey.mjs'),W=require('../src/raw-wave1.js');
 const model=JSON.parse(read('data/demo-model.json')),raw=generateSurvey(model),demo=JSON.parse(read('site/demo-data.json'));
 assert.deepEqual(raw,generateSurvey(model));assert.equal(raw.length,1512);assert.equal(new Set(raw.map(r=>r['Usuario Id'])).size,1512);
 assert.equal(new Set(raw.map(r=>r.Nombre+' '+r.Apellidos)).size,1512);
 assert(raw.every(r=>r.Apellidos.split(' ').length===2));assert.deepEqual(demo.keys,[]);
 for(const row of raw.filter(r=>r.bullying)){
  if(row.bullying!=='Nadie')assert.notEqual(row.fqbullying,'Nunca');
  assert.equal(row.conductas==='No he observado estas situaciones',row.fqbullying==='Nunca');
 }
 const expected=W.convert(raw);assert.deepEqual(demo.students,expected.students.map(s=>({...s,Campus:s.Centro})));
 const data=C.validateAndJoin(demo.students,null,demo.groups);assert.equal(data.groups.length,54);
 const by=new Map(raw.map(r=>[r['Usuario Id'],r])),incoming=new Map();
 const peerBallots=raw.filter(r=>r.bullying).map(r=>({id:r['Usuario Id'],peers:r.bullying.split(' | ').filter(id=>id!=='Nadie'&&id!==r['Usuario Id'])}));
 for(const row of data.students){
  const source=by.get(row.ID),all=row.relaciones_red||[];
  assert.equal(row.bullying_companeros_n,peerBallots.filter(b=>b.id!==row.ID&&b.peers.length<=15&&b.peers.includes(row.ID)).length);
  if(row.respondio==='No'){assert.equal(row.relaciones_red,null);assert.equal(row.bienestar_suma,null);assert.equal(row.bullying_autorreporte,null);continue;}
  assert.equal(row.felicidad_centro+row.felicidad_diversion+4-row.felicidad_soledad,row.bienestar_suma);
  const crt=['carrera','emilia','biblioteca'].map(k=>row['crt_'+k+'_acierto']);assert.equal(row.crt_aciertos,crt.includes(null)?null:crt.reduce((a,b)=>a+b,0));
  assert.equal(row.bullying_autorreporte,source.bullying.split(' | ').includes(row.ID)?'Sí':'No');
  for(const [type,field]of [['amistad','amistad_declarada_n'],['rechazo','rechazo_declarado_n']])assert.equal(all.filter(e=>e.tipo===type).length,row[field]);
  assert.equal(new Set(all.map(e=>e.id)).size,all.length);
  for(const e of all){assert.notEqual(e.id,row.ID);assert.equal(by.get(e.id).Estudio,source.Estudio);const key=e.id+':'+e.tipo;incoming.set(key,(incoming.get(key)||0)+1);}
 }
 for(const row of data.students){assert.equal(row.amistad_recibida_n,incoming.get(row.ID+':amistad')||0);assert.equal(row.rechazo_recibido_n,incoming.get(row.ID+':rechazo')||0);}
 const sizes=new Set(data.groups.map(g=>data.students.filter(r=>r.Centro===g.Centro&&r.Curso===g.Curso&&r.Grupo===g.Grupo).length));assert(sizes.size>=4);
 assert(data.students.filter(s=>s.respondio==='No').length>30);assert.equal(data.students.find(s=>s.ID==='00253').crt_aciertos,3);
 assert.equal(data.students.find(s=>s.ID==='00269').respondio,'No');
 assert(data.students.some(s=>(s.relaciones_red||[]).some(e=>by.get(e.id).Curso!==s.Curso)));
 assert(data.students.some(s=>s.bullying_declarado_n>15));
 const known=data.students.filter(s=>s.bullying_autorreporte!=null),self=known.filter(s=>s.bullying_autorreporte==='Sí').length/known.length,peers=data.students.filter(s=>s.bullying_companeros_n>=2).length/data.students.length;
 assert(self>.03&&self<.1);assert(peers>.1&&peers<.3);
 const html=read('site/DEMO.html'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 const policy=html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
 assert.deepEqual([...policy.matchAll(/'sha256-([^']+)'/g)].map(m=>m[1]),scripts.map(s=>crypto.createHash('sha256').update(s).digest('base64')));
 scripts.forEach(s=>assert.doesNotThrow(()=>new vm.Script(s)));
});

test('downloadable viewer embeds the same demo without fetching it and web links enter directly',()=>{
  const offline=read('release/PBIS.html');
  assert.doesNotMatch(offline,/window\.PBIS_DEMO_URL=/);
  const config=[...offline.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.startsWith('window.PBIS_DEMO_DATA='));
  const context={window:{}};vm.runInNewContext(config,context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.PBIS_DEMO_DATA)),JSON.parse(read('site/demo-data.json')));
  const viewer=read('site/PBIS.html');
  assert.match(viewer,/window\.PBIS_DEMO_URL='demo-data\.json\?v=[a-f0-9]{12}'/);
  assert.match(viewer,/Cargar datos demo/);
  assert.doesNotMatch(viewer,/window\.PBIS_DEMO=/);
  assert.doesNotMatch(read('site/index.html'),/Explorar demo|DEMO26/);
  assert.match(read('site/index.html'),/href="DEMO.html#demo"/);
  assert.match(read('release/index.html'),/href="PBIS.html#demo"/);
  assert.ok(fs.existsSync(path.join(root,'site/.nojekyll')));
});
