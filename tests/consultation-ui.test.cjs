'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const UI=require('../src/consultation-ui.js'),R=require('../src/roster-review.js'),C=require('../src/core.js');
const demo=require('../site/demo-data.json');

test('bullying display classifies missing self-reports as no recorded self-selection without changing the source',()=>{
 const cases=[['No',0,'bullying_none'],['No',1,'bullying_one_peer'],['Sí',0,'bullying_self_only'],['No',2,'bullying_multiple_peers'],['No',9,'bullying_multiple_peers'],['Sí',1,'bullying_self_and_peers'],['Sí',2,'bullying_self_and_peers'],[null,0,'bullying_none'],[null,1,'bullying_one_peer'],[null,2,'bullying_multiple_peers'],[undefined,3,'bullying_multiple_peers'],['No',null,'bullying_none'],['Sí',undefined,'bullying_self_only'],[null,null,'bullying_none']];
 const rows=cases.map(([self,peers],i)=>({ID:String(i),respondio:'Sí',bullying_autorreporte:self,bullying_companeros_n:peers}));
 for(const peers of [0,1,2,5])rows.push({ID:'absent'+peers,respondio:'No',bullying_autorreporte:null,bullying_companeros_n:peers});
 const before=structuredClone(rows);
 cases.forEach(([, ,expected],i)=>assert.equal(UI.bullyingCategory(rows[i]),expected));
 assert.deepEqual(rows.slice(-4).map(UI.bullyingCategory),['bullying_none','bullying_one_peer','bullying_multiple_peers','bullying_multiple_peers']);
 assert.equal(UI.filter([rows[5]],'bullying_self_and_peers').length,1);
 assert.equal(UI.filter([rows[5]],'bullying_companeros').length,0); // Self + one peer is not two peers.
 const d=UI.bullyingDistribution(rows);
 assert.deepEqual(d.categories.map(c=>c.count),[5,3,2,6,2]);
 for(const c of d.categories)assert.equal(UI.filter(rows,c.key).length,c.count);
 assert.equal(d.categories.reduce((n,c)=>n+c.count,0),rows.length);
 assert.equal(UI.observed(rows.at(-1),'self'),null,'The student list still distinguishes nonresponse');
 assert.deepEqual(rows,before);
});

test('category counts partition every demo classroom and centre without crossing the supplied scope',()=>{
 const {students,groups}=C.validateAndJoin(demo.students,null,demo.groups);
 const scopes=[...new Set(students.map(r=>r.Campus))].map(c=>students.filter(r=>r.Campus===c));
 for(const g of groups)scopes.push(students.filter(r=>r.Campus===g.Campus&&r.Curso===g.Curso&&r.Grupo===g.Grupo));
 for(const rows of scopes){const d=UI.bullyingDistribution(rows),ids=[];
  for(const c of d.categories){const members=UI.filter(rows,c.key);assert.equal(members.length,c.count);ids.push(...members.map(r=>r.ID));}
  assert.equal(ids.length,rows.length);assert.equal(new Set(ids).size,rows.length);
 }
});

test('student search respects the supplied scope, accents, leading-zero codes and unmodified records',()=>{
 const rows=[{ID:'00123',Nombre:'Álvaro G. M.'},{ID:'00124',Nombre:'Álvaro L. P.'},{ID:'00001',Nombre:null}];
 const original=JSON.stringify(rows);
 assert.deepEqual(UI.searchStudents(rows,'  ALVARO 00123 ').map(r=>r.ID),['00123']);
 assert.deepEqual(UI.searchStudents(rows,'álvaro').map(r=>r.ID),['00123','00124']);
 assert.deepEqual(UI.searchStudents(rows.slice(0,1),'00124'),[]);
 assert.deepEqual(UI.searchStudents(rows,'00001').map(r=>r.ID),['00001']);
 assert.deepEqual(UI.searchStudents(rows,'null'),[]);
 assert.deepEqual(UI.searchStudents(rows,' '),rows);
 assert.deepEqual(UI.searchStudents(rows,'<script>'),[]);
 assert.equal(JSON.stringify(rows),original);
});
test('every clickable count resolves to exactly the existing aggregate, for every demo class and centre',()=>{
 const original=JSON.stringify(demo),joined=C.validateAndJoin(demo.students,null,demo.groups);
 const verify=(rows,summary)=>['bullying_declarado','bullying_companeros','soledad','sin_reciprocas'].forEach(key=>{
  const expected=summary.attention.find(m=>m.id===key).count;
  assert.equal(UI.filter(rows,key).length,expected??0,key);
 });
 for(const center of new Set(joined.students.map(r=>r.Campus))){
  const rows=joined.students.filter(r=>r.Campus===center);verify(rows,C.aggregateCenter(rows));
  for(const meta of joined.groups.filter(g=>g.Campus===center)){
   const classroom=rows.filter(r=>r.Curso===meta.Curso&&r.Grupo===meta.Grupo);
   verify(classroom,C.aggregate(classroom,meta));
  }
 }
 // Nonresponse is not an extra filter for reciprocal relations: preserve the analytical engine.
 const edge=[{ID:'a',Campus:'C',Curso:'ESO',Grupo:'A',respondio:'No',amistad_reciproca_n:0},
 {ID:'b',Campus:'C',Curso:'ESO',Grupo:'A',respondio:'Sí',amistad_reciproca_n:null}];
 verify(edge,C.aggregate(edge));
 assert.equal(JSON.stringify(demo),original);
});
const source={sha256:'a'.repeat(64),sheet:'Datos',center:'Centro 4826',course:'1.º ESO',group:'A'};
const rows=[
 {ID:'S1',Nombre:'Nombre privado',Centro:source.center,Curso:source.course,Grupo:'A',respondio:'Sí',bullying_autorreporte:'No',bullying_companeros_n:2},
 {ID:'S2',Nombre:'Otro nombre',Centro:source.center,Curso:source.course,Grupo:'A',respondio:'No',bullying_autorreporte:null,bullying_companeros_n:0}
];
test('simplified reviews round-trip zero, independent sources and absence reasons without names or credentials',()=>{
 const store=R.createStore();store.toggle('S1','bullying_self','sorpresa');store.toggle('S1','bullying_peers','sorpresa');store.setNonParticipation('S2','absent_day');
 const payload=UI.exportReviews(rows,store,source),target=R.createStore();
 assert.equal(payload.records[1].peers,0);assert.equal(payload.records[1].self,null);
 assert.doesNotMatch(JSON.stringify(payload),/Nombre privado|Otro nombre|password|contraseña/);
 UI.restoreReviews(payload,rows,target,source,R.nonParticipationReasons);
 assert.deepEqual(target.snapshot(),store.snapshot());
 assert.equal(UI.observed(rows[1],'self'),null);
 const blank=UI.exportReviews(rows,R.createStore(),source);
 UI.restoreReviews(blank,rows,target,source,R.nonParticipationReasons);
 assert.deepEqual(target.snapshot(),[]); // Unticked means pending, never agreement.
});
test('review import rejects changed data, other files/aulas, duplicate IDs, missing values and unauthorized rows atomically',()=>{
 const store=R.createStore();store.toggle('S1','bullying_self','sorpresa');
 const original=store.snapshot(),valid=UI.exportReviews(rows,store,source);
 const edits=[
  p=>p.source.sha256='b'.repeat(64),
  p=>p.records[1].studentId='outside',
  p=>p.records[1].studentId='S1',
  p=>p.records[0].peers=99,
  p=>p.records[0].group='B',
  p=>p.records[1].surprise=['self'],
  p=>p.records[0].nonParticipation={reason:'absent_day',detail:''},
  p=>p.records[1].nonParticipation={reason:'other',detail:''},
  p=>p.records[0].surprise=['unknown'],
  p=>p.records.pop()
 ];
 for(const edit of edits){
  const copy=structuredClone(valid);copy.records[0].surprise=[];edit(copy);
  assert.throws(()=>UI.restoreReviews(copy,rows,store,source,R.nonParticipationReasons));
  assert.deepEqual(store.snapshot(),original);
 }
 assert.throws(()=>UI.filter(rows,'private-field'));
});


test('overview uses valid responses, preserves zero and keeps third-place ties without modifying records',()=>{
 const rows=[{ID:'a',respondio:'Sí',felicidad:0,crt_aciertos:0,felicidad_centro:0,amistad_recibida_n:6},{ID:'b',respondio:'Sí',felicidad:10,crt_aciertos:3,felicidad_centro:4,amistad_recibida_n:5},{ID:'c',respondio:'No',felicidad:8,crt_aciertos:2,felicidad_centro:4,amistad_recibida_n:4},{ID:'d',respondio:'Sí',felicidad:null,crt_aciertos:null,amistad_recibida_n:4}];
 const before=JSON.stringify(rows),a=UI.overview(rows);
 assert.deepEqual(a.wellbeing,{value:5,n:2});assert.deepEqual(a.crt,{value:1.5,n:2});assert.deepEqual(a.feeling,{count:1,denominator:2});assert.deepEqual(a.crtDistribution,[1,0,0,1]);
 assert.deepEqual(UI.ranking(rows,'amistad_recibida_n').map(x=>x.rank),[1,2,3,3]);assert.equal(JSON.stringify(rows),before);
 const empty=UI.overview([{ID:'x',respondio:'No'}]);assert.equal(empty.wellbeing.value,null);assert.equal(empty.crt.value,null);assert.equal(empty.feeling.count,null);
});


test('relationship percentages reproduce 18.2 and 9.1 with eleven respondents and twelve classmates',()=>{
 const rows=Array.from({length:12},(_,i)=>({ID:String(i),Campus:'C',Curso:'ESO',Grupo:'A',n_clase:12,respondio:i===11?'No':'Sí',amistad_declarada_n:i===11?null:2,rechazo_declarado_n:i===11?null:1,amistad_clase_declarada_n:i===11?null:2,rechazo_clase_declarada_n:i===11?null:1}));
 const before=structuredClone(rows),a=UI.relationshipRates(rows);
 assert.equal(a.positive,22);assert.equal(a.negative,11);assert.equal(a.possible,121);assert.equal(a.responses,11);
 assert.equal(a.positivePercent.toFixed(1),'18.2');assert.equal(a.negativePercent.toFixed(1),'9.1');assert.deepEqual(rows,before);
 assert.equal(UI.relationshipRates(rows.slice(0,11)).positivePercent,null,'Incomplete classroom must not invent a smaller denominator');
 assert.equal(UI.relationshipRates(rows.map(r=>({...r,respondio:'No'}))).positivePercent,null);
});

test('school reference weights respondent-to-classmate pairs and counts only links inside each class',()=>{
 const rows=[...Array(3)].map((_,i)=>({ID:'A'+i,Campus:'C',Curso:'ESO',Grupo:'A',n_clase:3,respondio:'Sí',amistad_declarada_n:2,rechazo_declarado_n:0,ambito_nominaciones:'centro',relaciones_red:[{id:'A'+((i+1)%3),tipo:'amistad'},{id:'B0',tipo:'amistad'}]}));
 rows.push(...[0,1].map(i=>({ID:'B'+i,Campus:'C',Curso:'ESO',Grupo:'B',n_clase:2,respondio:'Sí',amistad_declarada_n:0,rechazo_declarado_n:0,ambito_nominaciones:'centro',relaciones_red:[]})));
 const before=structuredClone(rows),a=UI.relationshipRates(rows);
 assert.equal(a.positivePercent,37.5);assert.equal(a.negativePercent,0);assert.equal(a.possible,8);
 assert.equal(UI.relationshipRates(rows.slice(0,3)).positivePercent,50);assert.equal(UI.relationshipRates(rows.slice(3)).positivePercent,0);
 assert.deepEqual(rows,before);assert.equal(rows[0].amistad_declarada_n,2,'Individual centre-wide count stays unchanged');
 rows[0].relaciones_red.push({id:'A0',tipo:'amistad'},{id:'A1',tipo:'amistad'});assert.equal(UI.relationshipRates(rows).positive,3,'Self and duplicate edges do not inflate density');
 delete rows[0].relaciones_red;assert.equal(UI.relationshipRates(rows).positivePercent,null,'Centre totals alone cannot tell within-class density');
});

test('question-level CRT bars retain partial responses and do not infer answers from total scores',()=>{
 const rows=[{respondio:'Sí',crt_aciertos:2,crt_carrera_acierto:1,crt_emilia_acierto:1,crt_biblioteca_acierto:0},{respondio:'Sí',crt_aciertos:null,crt_carrera_acierto:0,crt_emilia_acierto:null,crt_biblioteca_acierto:1},{respondio:'No',crt_carrera_acierto:1,crt_emilia_acierto:1,crt_biblioteca_acierto:1},{crt_aciertos:3}];
 assert.deepEqual(UI.cognitiveBreakdown(rows),[{label:'Carrera',correct:1,n:2,percent:50},{label:'Emilia',correct:1,n:1,percent:100},{label:'Biblioteca',correct:1,n:2,percent:50}]);
 assert.ok(UI.cognitiveBreakdown([{crt_aciertos:3}]).every(q=>q.percent===null&&q.correct===null&&q.n===0));
});
