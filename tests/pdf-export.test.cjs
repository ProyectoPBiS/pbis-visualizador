const {test}=require('node:test'),assert=require('node:assert/strict');
const PDF=require('../src/pdf-export.js'),P=require('../src/protected-project.js');
const data=require('./protected-fixture.cjs').data();
const orient=PDF.identity({role:'orientador'}),selection={center:'Centro 4826',course:'1.º ESO',group:'A',student:'S1'};
test('PDF identity preserves masking, demo and orientation; never silently omits a teacher mark',()=>{
 assert.equal(PDF.identity({role:'tutor',protectedProject:true,maskedDni:'1*3**6*8Z',sessionCode:'abcdefgh-1234'}).watermark,'1*3**6*8Z · abcdefgh');
 assert.equal(PDF.identity({role:'tutor',username:'12345678Z',sessionCode:'abcdef'}).watermark,'1*3**6*8Z · abcdef');
 assert.equal(orient.watermark,null);assert.equal(PDF.identity({demo:true}).watermark,'DATOS SIMULADOS');
 assert.throws(()=>PDF.identity({role:'tutor',username:'a'}),/sesión/);assert.throws(()=>PDF.identity({role:'tutor',protectedProject:true,maskedDni:'12345678Z',sessionCode:'abc'}),/marca/);
});
test('individual model uses reported nominations, abbreviated names and shared phrasing',()=>{
 const input=structuredClone(data);Object.assign(input.students[0],{Nombre:'Ana Nombre Compuesto Apellido Segundo',popularidad_reportada_n:2,centralidad_reportada_n:1,popularidad:9.9,centralidad:8.7,felicidad_soledad:3,bullying_companeros_n:2});
 const before=JSON.stringify(input),s=PDF.model({view:'student',selection,...input,identity:orient});
 assert.equal(s.title,'Ana N. C. A. S.');assert.doesNotMatch(s.scope,/Código/);
 const crt=s.sections.find(x=>x.title==='Test cognitivo');assert.equal(crt.cards[0].answer,'3 / 3');assert.match(crt.cards[0].detail,/Media de la clase: 3 \/ 3/);assert.equal(crt.cards[1].answer,'Acierto');
 const p=s.sections.find(x=>x.title==='Posición y mediación');assert.match(p.cards[0].answer,/2 compañeros opinan que es el más popular de la clase/);assert.match(p.cards[1].answer,/1 compañero opina que es el más central de la clase/);assert.doesNotMatch(JSON.stringify(p),/9,9|8,7/);
 const wellbeing=s.sections.find(x=>x.title==='Bienestar');assert.match(wellbeing.parts.map(p=>p.text).join(''),/y casi siempre se ha sentido solo/);assert.ok(wellbeing.parts.some(p=>p.text==='casi siempre'&&p.tone==='negative'));
 const b=s.sections.find(x=>x.title==='Bullying');assert.equal(b.cards[1].answer,'Sí, 2 compañeros');assert.match(b.questions[2].question,/tu colegio/);assert.equal(s.networkNote,'');assert.equal(JSON.stringify(input),before);
});
test('PDF retains zero versus unanswered and missing values',()=>{
 const students=structuredClone(data.students);Object.assign(students[0],{respondio:'No',bullying_autorreporte:null,bullying_companeros_n:0,crt_aciertos:null,crt_carrera_acierto:null,felicidad:null,felicidad_centro:null,felicidad_diversion:null,felicidad_soledad:null});
 const m=PDF.model({view:'student',selection,students,groups:data.groups,identity:orient});assert.equal(m.testStatus,'NO HA REALIZADO EL TEST');const b=m.sections.find(s=>s.title==='Bullying');assert.equal(b.cards[0].answer,'Sin dato');assert.equal(b.cards[1].answer,'No');
 assert.ok(!m.sections.some(x=>['Bienestar','Test cognitivo'].includes(x.title)));
 assert.ok(b.questions.every(c=>c.answer==='Sin respuesta'));
});
test('class general PDF and student bundle differ; bundle reuses individual model',()=>{
 const general=PDF.model({view:'group',selection,...data,identity:orient});assert.equal(general.roster.length,3);assert.ok(general.sections.find(s=>s.title==='Resumen de la clase').cards[0].detail.startsWith('Media del colegio:'));
 const bundle=PDF.model({view:'group',mode:'students',selection,...data,identity:orient});assert.equal(bundle.students.length,3);assert.equal(bundle.roster,undefined);assert.deepEqual(bundle.students[0],PDF.model({view:'student',selection,...data,identity:orient}));
 const classRel=general.sections.find(s=>s.title==='Relaciones de amistad y negativas'),schoolRel=PDF.model({view:'group',relationshipReach:'school',selection,...data,identity:orient}).sections.find(s=>s.title==='Relaciones de amistad y negativas');assert.equal(classRel.scope,'Dentro de su clase');assert.notEqual(schoolRel.cards[0].answer,classRel.cards[0].answer);
});
test('teacher PDF consumes only its decrypted compartment and never invents school averages',async()=>{
 const aulas=P.classes(data),built=await P.build({data,center:'Centro 4826',accounts:[{username:'orientacion',password:'FRJ508'},{username:'12345678Z',password:'Toro05Leon',allowed:[aulas[0].key]}]});const opened=await P.open(built.text,'12345678Z','Toro05Leon');
 const identity=PDF.identity({role:'tutor',protectedProject:true,maskedDni:opened.grant.maskedDni,sessionCode:'session1'}),m=PDF.model({view:'student',selection,...opened.data,identity});assert.equal(m.sections.find(x=>x.title==='Relaciones de amistad y negativas').cards[0].answer,String(data.students[0].amistad_recibida_n));assert.ok(!JSON.stringify(m).includes('Bruno'));
 const group=PDF.model({view:'group',selection,...opened.data,identity});assert.ok(group.sections.find(s=>s.title==='Resumen de la clase').cards.every(c=>!c.detail.includes('colegio')));const bundle=PDF.model({view:'group',mode:'students',selection,...opened.data,identity});assert.equal(bundle.students.length,3);assert.ok(!JSON.stringify(bundle).includes('Bruno'));
 assert.throws(()=>PDF.model({view:'center',selection,...opened.data,identity}),/centro completo/);assert.throws(()=>PDF.model({view:'student',selection:{...selection,student:'S4'},...opened.data,identity}),/autorizada/);
});
test('PDF renderer ignores networks, retains encryption delegation and cancels stale exports',async()=>{
 const previous=global.window;let protectedCount=0;
 global.window={jspdf:require('../vendor/jspdf.umd.min.js'),PbisPdfCrypto:{normalizeDni:value=>{assert.equal(value,'test-password');return value;},protect:async(bytes,password,{current})=>{assert.equal(password,'test-password');assert.equal(current(),true);assert.ok(Buffer.from(bytes).subarray(0,4).equals(Buffer.from('%PDF')));protectedCount++;return new Blob([bytes],{type:'application/pdf'});}}};
 try{
  const report=PDF.model({view:'group',mode:'students',selection,...data,identity:orient});
  const network={get source(){throw Error('A removed network must never be rasterized');}};
  const blob=await PDF.generate(report,{password:'test-password',network});assert.equal(blob.type,'application/pdf');assert.equal(protectedCount,1);
  await assert.rejects(PDF.generate(report,{password:'test-password',current:()=>false}),/consulta ha cambiado/);assert.equal(protectedCount,1);
 }finally{global.window=previous;}
});

test('school report reuses web comparisons and excludes other centres',()=>{
 const bridge=require('../src/private-charts.js'),cmp=require('../src/comparison.js'),integration=require('../src/integration.js');
 const input=structuredClone(data);input.students.forEach((s,i)=>Object.assign(s,{demografia_neae:i===0?true:i===1?null:false,demografia_nueva_incorporacion:i<2,demografia_migrante:i===2}));
 const source=structuredClone(input.students);input.students.push({...source[0],ID:'OUTSIDE',Campus:'Other centre',Nombre:'Outside Person'});
 const report=PDF.model({view:'center',selection,...input,identity:orient});
 assert.equal(report.roster.length,source.length);assert.ok(!JSON.stringify(report).includes('Outside Person'));
 assert.ok(report.sections.find(s=>s.title==='Resumen del colegio'));assert.ok(report.sections.find(s=>s.title==='Resumen del colegio').cards.every(c=>!c.detail.includes('Media del colegio')));
 assert.deepEqual(report.schoolCharts.relations,bridge.comparisonRows(source));
 assert.deepEqual(report.schoolCharts.bullying,cmp.sortBullying(cmp.bullyingRows(bridge.model(source)),'any',true));
 const neae=report.schoolCharts.integrations.find(g=>g.group==='neae').metrics.find(m=>m.key==='mutual');
 assert.equal(neae.missing,1);assert.deepEqual(neae.rows,integration.summarize(bridge.model(source),'neae','mutual').rows);
});

test('school report preserves missing bullying rather than presenting it as no nominations',()=>{
 const input=structuredClone(data);input.students.forEach(s=>{s.bullying_companeros_n=null;s.bullying_autorreporte=null;s.demografia_neae=true;});
 const report=PDF.model({view:'center',selection,...input,identity:orient});
 assert.equal(report.schoolCharts.distributionAvailable,false);
 assert.ok(report.schoolCharts.bullying.every(d=>!d.available));
 assert.ok(report.schoolCharts.integrations.length>0);
 assert.ok(report.schoolCharts.integrations.every(g=>!g.metrics.some(m=>m.key==='bullying')));
});

test('PDF omits optional integration pages without data and retains valid zeros',()=>{
 const input=structuredClone(data);
 for(const s of input.students)for(const field of ['demografia_neae','demografia_nueva_incorporacion','demografia_migrante'])delete s[field];
 assert.deepEqual(PDF.model({view:'center',selection,...input,identity:orient}).schoolCharts.integrations,[]);
 input.students.forEach(s=>{s.demografia_neae=false;});
 const groups=PDF.model({view:'center',selection,...input,identity:orient}).schoolCharts.integrations;
 assert.deepEqual(groups.map(g=>g.group),['neae']);
 assert.ok(groups[0].metrics.some(m=>m.key==='negative'));
});

test('empty centre, class and student PDFs have no result sections; zeros and partial answers survive',async()=>{
 const fixture=require('./empty-cards-fixture.cjs'),choice={center:'Centro de prueba',course:'1.º ESO',group:'A',student:'PRUEBA1'};
 const previous=global.window;
 global.window={jspdf:require('../vendor/jspdf.umd.min.js'),PbisPdfCrypto:{normalizeDni:v=>v,protect:async bytes=>new Blob([bytes],{type:'application/pdf'})}};
 try{
  for(const kind of ['empty','zero','partial'])for(const view of ['center','group','student']){
   const input=fixture.data(kind),before=JSON.stringify(input);
   const report=PDF.model({view,selection:choice,...input,identity:PDF.identity({demo:true}),demo:true});
   if(kind==='empty')assert.deepEqual(report.sections,[]);
   else{
    const bullying=report.sections.find(s=>s.title==='Bullying');assert.ok(bullying);
    if(view==='student')assert.equal(bullying.cards[0].answer,'No');
    if(kind==='zero'){
     assert.ok(report.sections.find(s=>s.title==='Relaciones de amistad y negativas'));
     const cognitive=report.sections.find(s=>s.title==='Test cognitivo');
     if(view==='student')assert.equal(cognitive.cards[0].answer,'0 / 3');
     else assert.ok(report.sections.find(s=>s.title.startsWith('Resumen')).cards.some(c=>c.metric==='cognitive'&&c.answer==='0 / 3'));
    }
   }
   assert.ok((await PDF.generate(report,{password:'test'})).size>1000);
   assert.equal(JSON.stringify(input),before);
  }
 }finally{global.window=previous;}
});
