'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const UI=require('../src/consultation-ui.js'),comparison=require('../src/comparison.js'),integration=require('../src/integration.js');
const context={PbisConsultationUI:UI};context.globalThis=context;vm.createContext(context);
for(const f of ['private-charts.js','tutor-validation.js'])vm.runInContext(fs.readFileSync(require.resolve('../src/'+f),'utf8'),context);
const Charts=context.PbisPrivateCharts,T=context.PbisTutorValidation;
const base={Campus:'C',Curso:'5º PRIMARIA',Grupo:'A',n_clase:3,n_centro:3,respondio:'Sí',amistad_declarada_n:1,rechazo_declarado_n:0,amistad_clase_declarada_n:1,rechazo_clase_declarada_n:0,amistad_reciproca_n:1,amistad_clase_reciproca_n:0,rechazo_recibido_n:0,bullying_autorreporte:'No',bullying_companeros_n:0,demografia_neae:true};
const rows=[{...base,ID:'a',demografia_nueva_incorporacion:true},{...base,ID:'b',demografia_neae:false,demografia_nueva_incorporacion:false,amistad_reciproca_n:0,bullying_companeros_n:1},{...base,ID:'c',demografia_neae:null,demografia_nueva_incorporacion:null,respondio:'No',amistad_declarada_n:null,amistad_reciproca_n:null,bullying_autorreporte:null,bullying_companeros_n:2}];
test('authorized adapter preserves school reciprocity, unknown demographics and nonresponse',()=>{
 const before=JSON.stringify(rows),school=Charts.model(rows);
 assert.equal(school.students.length,3);assert.equal(school.students[2].selfReport,null);assert.equal(school.students[2].demographics.neae,null);
 const groups=integration.summarize(school,'neae','mutual');assert.equal(groups.rows[0].value,100);assert.equal(groups.rows[1].value,0);assert.equal(groups.missing,1);
 assert.equal(UI.filter(rows,'sin_reciprocas','school').length,1);assert.equal(UI.filter(rows,'sin_reciprocas','class').length,2);
 assert.equal(JSON.stringify(rows),before);
});
test('comparison counts only authorized within-class choices and uses responding denominator',()=>{
 const group=Charts.comparisonRows(rows)[0];assert.equal(group.respondents,2);assert.equal(group.good,2);assert.equal(group.bad,0);
 assert.equal(comparison.averages([group],'good')[0].mean,1);
 const school=Charts.model(rows);assert.deepEqual([...comparison.bullyingRows(school)[0].counts],[1,1,1]);
 const empty=Charts.model(rows.map(r=>({...r,bullying_autorreporte:null,bullying_companeros_n:null})));assert.equal(comparison.bullyingRows(empty)[0].available,false);
 assert.equal(Charts.model(rows.slice(0,1)).students.length,1,'No rows are fetched or inferred outside the supplied subset');
});
test('bullying sort defaults to any nomination and threshold warning includes exactly fifteen',()=>{
 const input=[{label:'A',n:10,counts:[3,6,1]},{label:'B',n:10,counts:[6,0,4]}];
 assert.equal(comparison.sortBullying(input)[0].label,'A');assert.equal(comparison.sortBullying(input,'two')[0].label,'B');assert.equal(comparison.sortBullying(input,'any',false)[0].label,'B');
 const school=Charts.model(rows.map((r,i)=>({...r,bullying_declarado_n:[14,15,16][i]})));assert.deepEqual(comparison.nominationAlerts(school).map(r=>r.count),[16,15]);
});
test('local tutor validation is bound to exact authorized results and rejects duplicates atomically',()=>{
 const payload={format:'pbis-tutor-observations-v1',scope:T.scopeOf(rows),entries:rows.map(r=>({key:JSON.stringify([r.Campus,r.Curso,r.Grupo,r.ID]),self:false,peers:true,reviewed:true}))};
 assert.equal(T.parse(payload,rows).length,3);
 assert.throws(()=>T.parse(payload,rows.map((r,i)=>i? r:{...r,bullying_companeros_n:9})));
 assert.throws(()=>T.parse(payload,rows.map(r=>({...r,periodo:'2027-01'}))));
 assert.throws(()=>T.parse(payload,rows.map(r=>({...r,Periodo:'2027-01'}))));
 const sourced={...payload,scope:T.scopeOf(rows,'source-wave-1')};
 assert.equal(T.parse(sourced,rows,'source-wave-1').length,3);
 assert.throws(()=>T.parse(sourced,rows,'source-wave-2'));
 assert.throws(()=>T.parse({...payload,entries:[payload.entries[0],payload.entries[0],payload.entries[2]]},rows));
 assert.throws(()=>T.parse(payload,rows.slice(0,2)));
 assert.equal(payload.entries[0].peers,true);
});
