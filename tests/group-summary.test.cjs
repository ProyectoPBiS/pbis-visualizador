'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js'),UI=require('../src/consultation-ui.js'),demo=require('../site/demo-data.json');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/app.js'),'utf8');
const feedbackHelper=source.slice(source.indexOf('function appFeedbackButton(section){'),source.indexOf('function renderReport(){'));
const start=source.indexOf('function centerReport(rows){'),end=source.indexOf('function groupReport(rows,meta){',start);
const dataset=C.validateAndJoin(demo.students,null,demo.groups),selection={center:'Centro 3705',course:'1.º ESO',group:'A'};
let centerAllowed=true;
const render=new Function('window','C','G','dataset','selection','canViewCenter','reportHero','networkCoverageNote','E','number','percent',feedbackHelper+source.slice(start,end)+';return overviewReport;')(
 {PbisConsultationUI:UI,PbisFeedbackModel:require('../src/feedback-model.js')},C,{view:()=>'<section>Red del aula</section>'},dataset,selection,()=>centerAllowed,(title,subtitle,type)=>`<header>${title} · ${subtitle} · ${type}</header>`,()=>'',v=>String(v),v=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:1}),v=>Number(v).toFixed(1)+' %');
const center=dataset.students.filter(r=>r.Campus===selection.center),rows=center.filter(r=>r.Curso===selection.course&&r.Grupo===selection.group);
test('class and centre show six cards from the retained measures, clickable counts and no teacher review',()=>{
 for(const [members,isCenter] of [[rows,false],[center,true]]){
  const html=render(members,null,isCenter),aggregate=isCenter?C.aggregateCenter(members):C.aggregate(members);
  for(const label of ['Bullying','Relaciones de amistad y negativas','Bienestar','Posición','Mediador','Test cognitivo'])assert.ok(html.includes('<h3>'+label+'</h3>'));
  assert.equal((html.match(/class="overview-card /g)||[]).length,6);
  for(const key of ['con_reciprocas','sin_reciprocas','sin_respuesta_relaciones','popularidad_reportada','centralidad_reportada','mediacion_positiva']){
   const control=html.match(new RegExp('<button[^>]*data-result="'+key+'"[^>]*>[\\s\\S]*?</button>'))?.[0];
   if(control)assert.ok(control.includes('<small>de '+members.length+'</small>'),key);
  }
  for(const item of aggregate.attention.filter(x=>['bullying_declarado','bullying_companeros','sin_reciprocas'].includes(x.id))){assert.ok(html.includes('data-result="'+item.id+'"'));assert.ok(html.includes('<strong>'+item.count));}
  assert.doesNotMatch(html,/Me sorprende|Valoración docente|data-surprise|asignar categoría|bullying_unclassified|overview-pending/);
  assert.equal(UI.bullyingDistribution(members).categories.reduce((sum,c)=>sum+c.count,0),members.length);
  assert.ok(html.includes('Top 3 centrales'));
  assert.equal(html.includes('Red del aula'),!isCenter);
  const distribution=UI.bullyingDistribution(members);
  for(const category of distribution.categories){assert.ok(html.includes(`data-result="${category.key}"`));assert.ok(html.includes(category.description));}
  assert.match(html,/Se autorreportan/);assert.match(html,/Señalados por otros/);assert.match(html,/Con dos o más menciones de compañeros/);
  assert.match(html,/compañeros opinan que es el más popular de la clase/);assert.match(html,/compañeros opinan que es el más central de la clase/);assert.doesNotMatch(html,/de centralidad calculada en su aula/);
  assert.doesNotMatch(html,/overview-structure|Separación entre comunidades|Centralización del aula/);
 }
});
test('class comparison never pretends a limited tutoring dataset is the whole centre',()=>{
 centerAllowed=false;try{assert.doesNotMatch(render(rows,null,false),/Media del colegio/);}finally{centerAllowed=true;}
 assert.match(render(rows,null,false),/Media del colegio/);
});
test('missing scores remain unavailable, not zero or favourable',()=>{
 const row={ID:'x',Campus:'Centro 3705',Curso:'1.º ESO',Grupo:'A',respondio:'No',n_centro:1};
 const html=render([row],null,false);assert.match(html,/Sin datos/);assert.doesNotMatch(html,/width:NaN|NaN|undefined/);
});

test('reported centrality uses its own count and never falls back to eigenvector when missing',()=>{
 const original=structuredClone(rows),custom=rows.map(r=>({...r,centralidad_reportada_n:null,centralidad:9.9}));
 let html=render(custom,null,false);let ranking=html.slice(html.indexOf('Top 3 centrales'),html.indexOf('<h3>Mediador'));
 assert.match(ranking,/Sin respuestas disponibles/);assert.doesNotMatch(ranking,/9,9/);
 custom[0].centralidad_reportada_n=4;
 html=render(custom,null,false);ranking=html.slice(html.indexOf('Top 3 centrales'),html.indexOf('<h3>Mediador'));
 assert.match(ranking,/<strong>4<\/strong> compañeros opinan que es el más central de la clase/);assert.doesNotMatch(ranking,/9,9|\/ 10/);
 assert.deepEqual(rows,original);
});


test('unanswered students stay in the distribution while aggregate response denominators remain unchanged',()=>{
 const original=structuredClone(rows),html=render(rows,null,false),d=UI.bullyingDistribution(rows);
 assert.deepEqual(d.categories.map(c=>c.count),[rows.filter(r=>r.bullying_autorreporte!=='Sí'&&r.bullying_companeros_n===0).length,rows.filter(r=>r.bullying_autorreporte!=='Sí'&&r.bullying_companeros_n===1).length,rows.filter(r=>r.bullying_autorreporte==='Sí'&&r.bullying_companeros_n===0).length,rows.filter(r=>r.bullying_autorreporte!=='Sí'&&r.bullying_companeros_n>=2).length,rows.filter(r=>r.bullying_autorreporte==='Sí'&&r.bullying_companeros_n>=1).length]);
 assert.equal(d.categories.reduce((sum,c)=>sum+c.count,0),28);
 assert.equal(C.aggregate(rows).attention.find(m=>m.id==='bullying_declarado').denominator,rows.filter(r=>r.bullying_autorreporte!==null).length);
 assert.doesNotMatch(html,/asignar categoría|bullying_unclassified/);
 assert.equal(rows.find(r=>r.respondio==='No').bullying_autorreporte,null);
 assert.deepEqual(rows,original);
});
