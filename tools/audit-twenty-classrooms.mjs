// Local QA with checked-in synthetic data only. Sequential, no network or stored credentials.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const C=require('../src/core.js'),P=require('../src/protected-project.js'),A=require('../src/project-accounts.js'),R=require('../src/roster-review.js');
const root=path.resolve(import.meta.dirname,'..');
const demo=JSON.parse(fs.readFileSync(path.join(root,'site/demo-data.json'),'utf8'));
const data=C.validateAndJoin(demo.students,demo.keys?.length?demo.keys:null,demo.groups);
const center='Centro 3705',plan=A.plan(data,center);
// Every educational stage and both A/B; two C classrooms complete the twenty.
const selected=plan.filter(c=>c.group==='A'||c.group==='B').concat(plan.filter(c=>c.group==='C').slice(0,2));
assert.equal(selected.length,20);
const accounts=A.accounts(selected,true,{orientationPassword:'FRJ508'});
const built=await P.build({data,center,accounts});
const orientation=await P.open(built.text,accounts[0].username,accounts[0].password);
assert.equal(orientation.data.students.length,data.students.filter(r=>r.Centro===center).length);
assert.equal(orientation.grant.role,'orientador');
const checks=[];
for(const [index,room] of selected.entries()){
 const account=accounts[index+1],opened=await P.open(built.text,account.username,account.password);
 const rows=opened.data.students,original=data.students.filter(r=>P.classKey(r)===room.key);
 assert.deepEqual(rows.map(r=>r.ID),original.map(r=>r.ID));
 assert.equal(opened.admin,null);assert.equal(opened.grant.role,'tutor');
 assert.equal(P.watermarkLabel(opened.grant),account.username);
 assert.equal(P.canExportPdf(opened.grant),true);
 const ids=new Set(rows.map(r=>r.ID));
 for(const row of rows){
  const source=original.find(r=>r.ID===row.ID);
  for(const field of [...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,'bullying_declarado_n','felicidad','crt_aciertos','centralidad_eigenvector'])assert.equal(row[field],source[field],account.username+': '+field);
  assert.ok((row.relaciones_red||[]).every(e=>ids.has(e.id)));
  if(row.respondio==='No'){assert.equal(row.bullying_declarado_n,null);assert.equal(row.felicidad,null);}
  else assert.equal(row.felicidad_centro+row.felicidad_diversion+4-row.felicidad_soledad,row.bienestar_suma);
 }
 const summary=C.aggregate(rows,opened.data.groups);
 const self=rows.filter(r=>r.respondio!=='No'&&r.bullying_autorreporte!=null),peers=rows.filter(r=>r.bullying_companeros_n!=null);
 for(const [id,valid,predicate] of [['bullying_declarado',self,r=>r.bullying_autorreporte==='Sí'],['bullying_companeros',peers,r=>r.bullying_companeros_n>=2]]){
  const metric=summary.attention.find(m=>m.id===id),count=valid.filter(predicate).length;
  assert.equal(metric.count,count);assert.equal(metric.denominator,valid.length);
  assert.equal(metric.percent,100*count/valid.length);
 }
 assert.deepEqual(summary,C.aggregate(original,data.groups));
 for(const direction of ['asc','desc']){
  const sorted=R.sortRows(rows,{key:'bullying_out',direction},R.createStore());
  const values=sorted.map(r=>r.bullying_declarado_n),valid=values.filter(v=>v!=null);
  assert.deepEqual(valid,[...valid].sort((a,b)=>direction==='asc'?a-b:b-a));
  assert.ok(values.slice(valid.length).every(v=>v==null));
 }
 await assert.rejects(P.open(built.text,account.username,accounts[(index+2)%accounts.length].password));
 const result={order:index+1,account:account.username,course:room.course,classroom:room.group,students:rows.length,answered:summary.responses,selfReports:summary.attention[0].count,peerReportsAtLeastTwo:summary.attention[1].count,scope:'PASS',indicators:'PASS',denominators:'PASS',sort:'PASS',wrongPassword:'PASS'};
 checks.push(result);console.log(`${result.order}/20 ${result.account}: PASS (${result.students} estudiantes, ${result.answered} respuestas)`);
}
const out=path.join(root,'test-results/relaunch/audit-twenty-classrooms.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({date:'2026-11-11',synthetic:true,mode:'Sequential Node checks of real account/encryption/analytics modules; separate browser evidence',center,orientationStudents:orientation.data.students.length,passed:checks.length,checks},null,2));
console.log('Sin red, sin datos reales y sin guardar contraseñas. '+out);
