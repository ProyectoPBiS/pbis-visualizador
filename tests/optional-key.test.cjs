'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),core=require('../src/core.js'),fixtures=JSON.parse(fs.readFileSync(path.join(root,'data/fixtures.json')));
function table(name,records){const headers=[...new Set(records.flatMap(r=>Object.keys(r)))];return {name,rows:[headers,...records.map(r=>headers.map(h=>r[h]??null))]};}
function app(dataRows=fixtures.students,username='orientacion'){
 const elements=new Map();
 class Element{
  constructor(){this.files=[];this.value='';this.disabled=false;this.classList={add(){},remove(){},toggle(){}};this.html='';}
  set innerHTML(html){this.html=html;for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());}
  get innerHTML(){return this.html;}
  insertAdjacentHTML(_position,html){this.html+=html;for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());}
  addEventListener(){} setAttribute(){} focus(){} querySelectorAll(){return [];} querySelector(selector){return elements.get(selector.slice(1))||new Element();} showModal(){} close(){}
  closest(selector){return selector==='.usage-ack'?this:null;}
 }
 elements.set('root',new Element());elements.set('help',new Element());elements.set('close-help',new Element());
 const document={getElementById:id=>elements.get(id),querySelector:selector=>selector==='meta[name="pbis-distribution"]'?null:new Element(),querySelectorAll:()=>[],addEventListener(){},hidden:false};
 const classKeys=new Set(dataRows.map(r=>JSON.stringify([r.Campus||r.Centro,r.Curso,r.Grupo])));
 const books=[{sheets:[table('Datos',dataRows),table('Grupos',fixtures.groups.filter(r=>classKeys.has(JSON.stringify([r.Campus||r.Centro,r.Curso,r.Grupo]))))]}];
 class Worker{postMessage(){const book=books.shift();queueMicrotask(()=>this.onmessage({data:book}));}terminate(){}}
 const context={document,PbisFeedbackModel:require('../src/feedback-model.js'),PbisConsultationUI:require('../src/consultation-ui.js'),PbisLinkedFeedback:require('../src/linked-feedback.js'),PbisProtected:require('../src/protected-project.js'),PbisCore:core,PbisStudentNetwork:require('../src/student-network.js'),PbisClassNetwork:require('../src/class-network.js'),PbisRosterReview:require('../src/roster-review.js'),PbisReviewBatch:require('../src/review-batch.js'),PBIS_PROFILES:JSON.parse(fs.readFileSync(path.join(root,'data/profiles.json'))),PbisFeedback:{reset(){},startSession(){},closeContext(){},sessionSnapshot(){return {opinions:[]}},hasPending(){return false}},Worker,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){},addEventListener(){},console};context.PBIS_PARSER='test worker';context.window=context;
 for(const file of ['lazy-resources.js','usage-terms.js','comparison.js','integration.js','private-charts.js','tutor-validation.js','app.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context);
 const el=id=>elements.get(id);
 el('username').value=username;el('password').value=context.PBIS_PROFILES.find(profile=>profile.username===username).password;el('login-terms').checked=true;el('login-form').onsubmit({preventDefault(){}});
 const file=async(kind,name)=>{el('file-'+kind).files=[{name,size:100,arrayBuffer:async()=>new ArrayBuffer(1)}];await el('file-'+kind).onchange();el('sheet-'+kind).value='Datos';};
 return {el,file};
}
test('app loads one .pbis file, uses embedded names and invalidates on replacement',async()=>{
 const f=app();await f.file('data','datos.pbis');assert.equal(f.el('show-reports').disabled,false);
 assert.equal(f.el('file-key'),undefined);assert.equal(f.el('sheet-key'),undefined);
 f.el('show-reports').onclick();f.el('tab-student').onclick();
 assert.match(f.el('report-content').innerHTML,/<h2>00001<\/h2>/);
 f.el('file-data').files=[];await f.el('file-data').onchange();assert.equal(f.el('show-reports').disabled,true);
 assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha de estudiante/);
});

test('missing names remain codes, a missing value remains null and absent required columns are rejected',()=>{
 const rows=structuredClone(fixtures.students);
 for(const row of rows){delete row.Nombre;delete row.Apellidos;row.bienestar=null;}
 const result=core.validateAndJoin(rows,null,fixtures.groups);
 assert.equal(result.students[0].Nombre,null);
 assert.equal(result.students[0].bienestar,null);
 assert.equal(result.students[0].amistad_recibida_n,fixtures.students[0].amistad_recibida_n);
 for(const row of rows)delete row.bienestar;
 assert.throws(()=>core.validateAndJoin(rows,null,fixtures.groups),/bienestar/);
});
test('embedded given and family names show abbreviated names throughout the app',async()=>{
 const dataRows=fixtures.students.map(row=>row.ID==='00001'?{...row,Nombre:'María José',Apellidos:'García López'}:row);
 const f=app(dataRows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 f.el('tab-group').onclick();
 f.el('course').onchange({target:{value:'4.º Primaria'}});
 f.el('group').onchange({target:{value:'A'}});
 f.el('tab-student').onclick();f.el('student').onchange({target:{value:'00001'}});
 assert.match(f.el('report-content').innerHTML,/María J\. G\. L\./);
 assert.match(f.el('filters').innerHTML,/María J\. G\. L\./);
 f.el('tab-roster').onclick();assert.match(f.el('report-content').innerHTML,/María J\. G\. L\./);
});
test('removed technical coverage footer stays absent from simplified reports',async()=>{
 const rows=fixtures.students.map(row=>({...row,red_centro_pendiente_pct:9}));
 const f=app(rows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 for(const tab of ['center','group','roster','student']){
  f.el('tab-'+tab).onclick();
  const html=f.el('report-content').innerHTML;
  assert.doesNotMatch(html,/class="consultation-context"|Faltan respuestas sobre relaciones del 9 % del centro/);
  if(['center','group'].includes(tab))assert.match(html,/han respondido al cuestionario/);
 }
});
test('export errors remain visible in every view and disappear when selecting another centre',async()=>{
 const rows=fixtures.students.map((row,index)=>index===0?{...row,incidencias_calculo:['relaciones','predicciones','mediación']}:row);
 const f=app(rows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 for(const tab of ['center','group','roster','student']){
  f.el('tab-'+tab).onclick();
  assert.match(f.el('report-content').innerHTML,/3 respuestas del centro contienen «Error en relación»/);
  assert.match(f.el('report-content').innerHTML,/no se cuentan como ceros/);
 }
 const other=rows.find(row=>(row.Campus||row.Centro)!==(rows[0].Campus||rows[0].Centro));
 f.el('center').onchange({target:{value:other.Campus||other.Centro}});
 assert.doesNotMatch(f.el('report-content').innerHTML,/report-import-warning/);
});
test('a non-convergent centrality is explained without hiding other measures',async()=>{
 const f=app(fixtures.students.map(row=>({...row,centralidad_sin_convergencia:true})));
 await f.file('data','datos.pbis');f.el('show-reports').onclick();
 for(const tab of ['center','group','roster','student']){
  f.el('tab-'+tab).onclick();
  assert.match(f.el('report-content').innerHTML,/No se ha podido calcular la centralidad/);
  assert.match(f.el('report-content').innerHTML,/Los demás datos siguen disponibles/);
 }
});
test('orientation sees centre-wide totals while a class tutor has no centre tab',async()=>{
 const f=app();assert.ok(f.el('tab-center'));
 await f.file('data','datos.pbis');f.el('show-reports').onclick();
 assert.equal(f.el('tab-center').disabled,false);f.el('tab-center').onclick();
 assert.match(f.el('report-content').innerHTML,/Información general del colegio/);
 assert.match(f.el('report-content').innerHTML,/Comparativas entre cursos y clases/);
 assert.doesNotMatch(f.el('report-content').innerHTML,/Comunidades de relaciones|Comunidades de relaciones del centro|Separación entre comunidades/);
 assert.match(f.el('report-content').innerHTML,/Mediador/);
 assert.match(f.el('filters').innerHTML,/Centro/);
 assert.doesNotMatch(f.el('filters').innerHTML,/>Curso</);
 f.el('tab-group').onclick();
 assert.doesNotMatch(f.el('report-content').innerHTML,/overview-structure|Separación entre comunidades|Desigualdad de buenas relaciones|Centralización del aula/);
 assert.match(f.el('report-content').innerHTML,/Ver red de la clase/);
 f.el('open-current-network').onclick();assert.match(f.el('report-content').innerHTML,/class-network/);
 const tutor=app(fixtures.students,'tutoria4p');
 assert.equal(tutor.el('tab-center'),undefined);
});

test('orientation starts at Centro, tutoring at Aula, and a single centre needs no selector',async()=>{
 const center=fixtures.students[0].Campus||fixtures.students[0].Centro;
 const rows=fixtures.students.filter(r=>(r.Campus||r.Centro)===center);
 const f=app(rows);await f.file('data','datos.pbis');f.el('show-reports').onclick();
 assert.match(f.el('report-content').innerHTML,/Información general del colegio/);
 assert.equal(f.el('center'),undefined);assert.equal(f.el('filters').hidden,true);
 assert.equal(f.el('filters').innerHTML,'');assert.equal(f.el('tab-review'),undefined);
 for(const label of ['Aula','Estudiantes','Red de relaciones'])assert.ok(f.el('root').innerHTML.includes('<span>'+label+'</span>'));
 assert.doesNotMatch(f.el('root').innerHTML,/<span>Clase<\/span>|<span>Alumnos<\/span>|Valoración del tutor/);
 f.el('tab-group').onclick();assert.equal(f.el('filters').hidden,false);
 assert.match(f.el('filters').innerHTML,/id="course"/);assert.doesNotMatch(f.el('filters').innerHTML,/id="center"/);
 const tutor=app(rows,'tutoria4p');await tutor.file('data','datos.pbis');tutor.el('show-reports').onclick();
 assert.doesNotMatch(tutor.el('report-content').innerHTML,/Información general del colegio/);
 assert.match(tutor.el('filters').innerHTML,/id="course"/);assert.equal(tutor.el('tab-center'),undefined);
 const multiple=app();await multiple.file('data','datos.pbis');multiple.el('show-reports').onclick();
 assert.equal(multiple.el('filters').hidden,false);assert.ok(multiple.el('center'));
});
test('pilot account listing stays removed while tutor sees its course in both centers',async()=>{
 const orientacion=app();
 assert.equal(orientacion.el('open-accounts'),undefined);
 const tutor=app(fixtures.students,'tutoria1eso');
 assert.equal(tutor.el('open-accounts'),undefined);
 await tutor.file('data','datos.pbis');tutor.el('show-reports').onclick();
 assert.match(tutor.el('import-status').textContent,/168 estudiantes/);
 assert.match(tutor.el('filters').innerHTML,/Sevilla/);
 assert.match(tutor.el('filters').innerHTML,/Córdoba/);
 assert.doesNotMatch(tutor.el('filters').innerHTML,/4.º Primaria/);
});
test('Excel bytes used by .pbis files are readable by the actual parser worker',()=>{
 const bytes=fs.readFileSync(path.join(root,'data/examples/datos_evaluacion.xlsx'));
 let output;const context={self:{postMessage:value=>output=value},console};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'vendor/xlsx.full.min.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/parser-worker.js'),'utf8'),context);
 context.testBytes=Array.from(bytes);vm.runInContext("self.onmessage({data:Uint8Array.from(testBytes).buffer})",context);assert.equal(output.error,undefined);assert.ok(output.sheets.some(s=>s.name==='Datos'&&s.rows.length===1513));
});
