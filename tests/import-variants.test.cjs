'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/raw-wave1.js'),C=require('../src/core.js'),P=require('../src/protected-project.js');
function fixture(){
 return Array.from({length:3},(_,i)=>({'Usuario Id':'U'+i,'Alumno Id':'A'+i,Estudio:'TEST',Curso:'1º ESO',Grupo:i<2?'A':'B',
  dia:i===0?'Impar':'Par',mes:'Junio',start:null,end:null,
  redes1:null,redes2:null,beliefs1:null,beliefs2:null,carrera1:null,carrera2:null,emilia1:null,emilia2:null,library1:null,library2:null,
  general:null,fun:null,alone:null,bullying:null,mediador:null}));
}
const checked=rows=>{const result=W.convert(rows);return {...C.validateAndJoin(result.students,null,result.groups),importWarnings:result.warnings};};

test('reads each populated variant regardless of day, month, route metadata or missing entry events',()=>{
 const rows=fixture();
 Object.assign(rows[0],{redes1:'U1 (Buena relación) | U2 (Buena relación)',beliefs2:'U1 (Buena relación)',carrera2:'2',emilia1:'Emilia',library2:'47'});
 Object.assign(rows[1],{dia:'cualquier asignación',redes2:'U0 (Buena relación)',beliefs1:'U0 (Buena relación)'});
 Object.assign(rows[2],{redes1:'U0 (Buena relación)'});delete rows[2].dia;
 const before=structuredClone(rows),out=checked(rows).students;
 assert.deepEqual(rows,before);
 assert.equal(out[0].amistad_reciproca_n,2);
 assert.equal(out[0].amistad_clase_reciproca_n,1);
 assert.equal(out[2].amistad_clase_reciproca_n,0);
 assert.equal(out[0].pred_amistad_aciertos,1);
 assert.equal(out[0].crt_aciertos,3);
 assert.deepEqual(out.map(r=>r.amistad_declarada_n),[2,1,1]);
});

test('never selects silently between two populated variants, including identical answers',()=>{
 for(const base of ['redes','beliefs','carrera','emilia','library']){
  const rows=fixture(),value=['redes','beliefs'].includes(base)?'Nadie':'1';
  rows[0][base+'1']=value;rows[0][base+'2']=value;
  assert.throws(()=>W.convert(rows),/dos versiones contestadas/);
 }
});

test('entry timestamps do not create answers; explicit none differs from absent relationships',()=>{
 const rows=fixture();rows.forEach(r=>{r.eredes1='2026-11-01 -> ';r.eredes2='2026-11-01 -> ';});
 rows[0].redes2='2026-11-01 -> Nadie';rows[1].redes1='2026-11-01 -> ';
 const out=checked(rows).students;
 assert.deepEqual(out.map(r=>r.amistad_declarada_n),[0,null,null]);
 assert.deepEqual(out.map(r=>r.amistad_reciproca_n),[0,null,null]);
 assert.ok(out.every(r=>r.pred_amistad_n===null&&r.crt_aciertos===null));
});

test('completed questionnaire with empty bullying is not a self-report; an unconfirmed partial remains unknown',()=>{
 const rows=fixture();rows[0].end='2026-11-01 -> ';rows[1].general='Siempre';rows[1].ebullying='2026-11-01 -> ';
 const out=checked(rows).students;
 assert.deepEqual(out.map(r=>r.bullying_autorreporte),['No',null,null]);
 assert.deepEqual(out.map(r=>r.respondio),['Sí',null,'No']);
});

test('retains broad bullying ballots and counts distinct other people, excluding self',()=>{
 const rows=Array.from({length:18},(_,i)=>({...fixture()[0],'Usuario Id':'X'+i,'Alumno Id':'A'+i,bullying:'Nadie'}));
 rows[0].bullying=rows.map(r=>r['Usuario Id']).join(' | ');
 const out=checked(rows).students;
 assert.equal(out[0].bullying_autorreporte,'Sí');assert.equal(out[0].bullying_declarado_n,17);
 assert.deepEqual(out.map(r=>r.bullying_companeros_n),[0,...Array(17).fill(1)]);
 assert.ok(out.every(r=>r.bullying_filtro_excluidos_n===0&&r.bullying_filtro_max_otros===null));
});

test('normalizes SAL and descriptive aliases; conflicting and unknown values do not join the rest group',()=>{
 const rows=fixture();
 Object.assign(rows[0],{SAL_1:'Sí',SAL_2:'NO',SAL_3:'2'});
 Object.assign(rows[1],{'NEAE':'2026-11-01 -> NO','Inmigrante':'SI','Nueva incorporación':'3'});
 Object.assign(rows[2],{'sal 1':'SI',NEAE:'NO','SAL-2':'sin información',SAL_3:'4'});
 const out=checked(rows);
 const fields=C.DEMOGRAPHIC_COLUMNS;
 assert.deepEqual(out.students.map(r=>fields.map(f=>r[f])),[[true,false,true],[false,true,true],[null,null,null]]);
 assert.ok(out.importWarnings.some(w=>w.includes('contradictorios')));
 for(const value of ['0','1','NO']){rows[0].SAL_3=value;assert.equal(checked(rows).students[0].demografia_nueva_incorporacion,false);}
 rows[0].SAL_3='SI';assert.equal(checked(rows).students[0].demografia_nueva_incorporacion,true);
});

test('class negative counts and demographic fields survive a scoped snapshot without foreign identities',()=>{
 const rows=fixture();
 Object.assign(rows[0],{redes1:'U1 (Mala relación) | U2 (Mala relación)',SAL_1:'SI',SAL_2:'NO',SAL_3:'2'});
 rows[1].redes2='U0 (Mala relación)';rows[2].redes1='U0 (Mala relación)';
 const data=checked(rows),allowed=[P.classes(data)[0].key];
 const out=P.validateSnapshot(P.snapshot(data,allowed),allowed);
 assert.equal(out.students.length,2);assert.ok(!JSON.stringify(out).includes('U2'));
 assert.equal(out.students[0].rechazo_recibido_n,2);
 assert.equal(out.students[0].rechazo_clase_recibido_n,1);
 assert.equal(out.students[0].rechazo_clase_reciproco_n,1);
 assert.equal(out.students[0].demografia_neae,true);
 assert.equal(out.students[0].demografia_migrante,false);
 assert.equal(out.students[0].demografia_nueva_incorporacion,true);
 const corrupt=P.snapshot(data,allowed);corrupt.students[0].demografia_neae='inventado';
 assert.throws(()=>P.validateSnapshot(corrupt,allowed),/Indicador/);
 const legacy=P.snapshot(data,allowed);for(const r of legacy.students)for(const field of C.DEMOGRAPHIC_COLUMNS)delete r[field];
 assert.ok(P.validateSnapshot(legacy,allowed).students.every(r=>C.DEMOGRAPHIC_COLUMNS.every(f=>r[f]===null)));
});
