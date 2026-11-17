/* Presentation bridge. It receives only the rows already authorized by app.js. */
(function(root){'use strict';
const finite=Number.isFinite;
const UI=typeof module==='object'&&module.exports?require('./consultation-ui.js'):root.PbisConsultationUI;
const Integration=typeof module==='object'&&module.exports?require('./integration.js'):root.PBISIntegration;
function model(rows){
 const key=r=>JSON.stringify([r.Campus,r.Curso,r.Grupo]),classes=new Map();
 for(const r of rows)if(!classes.has(key(r)))classes.set(key(r),{id:key(r),label:[r.Curso,r.Grupo].filter(Boolean).join(' ')});
 return {classes:[...classes.values()],students:rows.map(r=>({id:r.ID,label:r.Nombre||r.ID,classId:key(r),course:r.Curso,group:r.Grupo,
  relationsAnswered:r.respondio!=='No'&&finite(r.amistad_declarada_n)&&finite(r.amistad_reciproca_n),schoolMutualCount:r.amistad_reciproca_n,
  schoolNegativeIn:r.rechazo_recibido_n,schoolRelationsIncomingN:finite(r.rechazo_recibido_n)?1:0,alone:r.respondio==='No'?null:r.felicidad_soledad,
  selfReport:r.respondio==='No'||!['Sí','No'].includes(r.bullying_autorreporte)?null:r.bullying_autorreporte==='Sí',peerCount:r.bullying_companeros_n,nominationCount:r.bullying_declarado_n,
  demographics:{neae:r.demografia_neae,newcomer:r.demografia_nueva_incorporacion,migrant:r.demografia_migrante}}))};
}
function comparisonRows(rows){
 const groups=new Map();for(const r of rows){const key=JSON.stringify([r.Campus,r.Curso,r.Grupo]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 return [...groups].map(([id,members])=>{const rates=UI.relationshipRates(members);return {id,label:[members[0].Curso,members[0].Grupo].join(' '),course:members[0].Curso,n:members.length,respondents:rates.positive===null?0:rates.responses,good:rates.positive??0,bad:rates.negative??0};});
}
function mount(host,rows,onList){
 const school=model(rows);
 const relationsHost=host.querySelector('[data-relations-comparison]'),bullyingHost=host.querySelector('[data-bullying-comparison]');
 if(relationsHost)root.PBISComparison.mountRows(relationsHost,comparisonRows(rows));
 if(bullyingHost)root.PBISComparison.mountBullying(bullyingHost,school);
 for(const kind of ['neae','newcomer'])root.PBISIntegration.mount(host.querySelector('[data-integration="'+kind+'"]'),school,kind,key=>{
  const match=/^integration_(neae|newcomer|migrant)_([01])$/.exec(key);if(!match)return;
  const selected=school.students.filter(s=>s.demographics[match[1]]===(match[2]==='0')&&s.relationsAnswered&&s.schoolMutualCount===0);
  onList(selected.map(s=>s.id),'Sin amistad recíproca · '+({neae:'Alumnado NEAE',newcomer:'Nueva incorporación',migrant:'Origen migrante'}[match[1]])+(match[2]==='1'?' · Resto del alumnado':''));
 });
}
function html(rows=[]){
 const school=model(rows),panels=['neae','newcomer'].filter(kind=>Integration.availableGroups(school,kind).length);
 const relations=comparisonRows(rows).some(d=>d.respondents>0),bullying=school.students.some(s=>finite(s.peerCount)||typeof s.selfReport==='boolean');
 return (relations||bullying?'<section class="school-comparisons"><h2 class="school-section-heading">Comparativas entre cursos y clases</h2>'+(relations?'<section class="comparison-panel" data-relations-comparison></section>':'')+(bullying?'<section class="comparison-panel bullying-comparison" data-bullying-comparison></section>':'')+'</section>':'')+(panels.length?'<section class="school-other-charts"><h2 class="school-section-heading">Otros gráficos</h2>'+panels.map(kind=>'<section class="comparison-panel integration-panel" data-integration="'+kind+'"></section>').join('')+'</section>':'');
}
const api={model,comparisonRows,mount,html};if(typeof module==='object'&&module.exports)module.exports=api;else root.PbisPrivateCharts=api;
})(typeof globalThis==='undefined'?this:globalThis);
