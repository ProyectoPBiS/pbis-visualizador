/* Presentation adapter only: no analytical recomputation or access expansion. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PbisConsultationUI=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const predicates={
 bullying_declarado:r=>r.respondio!=='No'&&r.bullying_autorreporte==='Sí',
 bullying_companeros:r=>typeof r.bullying_companeros_n==='number'&&r.bullying_companeros_n>=2,
 soledad:r=>r.respondio!=='No'&&r.soledad_frecuente==='Sí',
 sin_reciprocas:r=>r.amistad_reciproca_n===0,
 con_reciprocas:r=>r.amistad_reciproca_n>0,
 sin_respuesta_relaciones:r=>r.respondio==='No'||!Number.isFinite(r.amistad_declarada_n),
 mediacion_positiva:r=>Number.isFinite(r.mediacion_negativa_n)&&r.mediacion_n>0,
 mediacion_negativa:r=>r.mediacion_negativa_n>0
};
predicates.popularidad_reportada=r=>r.popularidad_reportada_n>0;
predicates.centralidad_reportada=r=>r.centralidad_reportada_n>0;
const labels={bullying_declarado:'Declaran haber sufrido acoso',bullying_companeros:'Reciben al menos 2 menciones de acoso',soledad:'Indican soledad frecuente',sin_reciprocas:'Sin buenas relaciones mutuas registradas'};
Object.assign(labels,{con_reciprocas:'Con buenas relaciones mutuas registradas',sin_respuesta_relaciones:'Sin respuesta de relaciones',mediacion_positiva:'Con menciones de buena mediación',mediacion_negativa:'Con menciones de mala mediación'});
Object.assign(labels,{popularidad_reportada:'Estudiantes señalados como populares',centralidad_reportada:'Estudiantes señalados como centrales'});
const bullyingCategories=Object.freeze([
 {key:'bullying_none',label:'Ninguna',description:'Sin menciones de compañeros ni autodeclaración registradas.'},
 {key:'bullying_one_peer',label:'1 (C)',description:'Lo nombra un compañero, sin autonominación.'},
 {key:'bullying_self_only',label:'1 (A)',description:'Se nombra únicamente a sí mismo.'},
 {key:'bullying_multiple_peers',label:'2+ (C)',description:'Lo nombran dos o más compañeros, sin autonominación.'},
 {key:'bullying_self_and_peers',label:'2+ (C+A)',description:'Se nombra a sí mismo y lo nombra al menos un compañero.'}
].map(Object.freeze));
function bullyingCategory(row){
 // Display-only grouping: missing self-report means no recorded self-selection.
 // Missing peer counts mean no recorded peer mentions here, never an imputed answer.
 const self=row.respondio!=='No'&&row.bullying_autorreporte==='Sí';
 const peers=Number.isInteger(row.bullying_companeros_n)&&row.bullying_companeros_n>=0?row.bullying_companeros_n:0;
 if(self)return peers>0?'bullying_self_and_peers':'bullying_self_only';
 return peers===0?'bullying_none':peers===1?'bullying_one_peer':'bullying_multiple_peers';
}
for(const category of bullyingCategories){
 predicates[category.key]=row=>bullyingCategory(row)===category.key;
 labels[category.key]='Bullying · '+category.label+' · '+category.description;
}
function bullyingDistribution(rows){
 const counts=new Map(bullyingCategories.map(c=>[c.key,0]));
 for(const row of rows){const category=bullyingCategory(row);counts.set(category,counts.get(category)+1);}
 return {categories:bullyingCategories.map(c=>({...c,count:counts.get(c.key)}))};
}
function filter(rows,key){if(!Object.hasOwn(predicates,key))throw Error('Resultado no válido.');return rows.filter(predicates[key]);}
function searchStudents(rows,query){
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
 const words=normalize(query).split(/\s+/).filter(Boolean);
 return rows.filter(row=>{const label=normalize((row.Nombre||'')+' '+row.ID);return words.every(word=>label.includes(word));});
}
function mean(rows,field,own=false){
 const values=rows.filter(r=>!own||r.respondio!=='No').map(r=>r[field]).filter(Number.isFinite);
 return {value:values.length?values.reduce((sum,v)=>sum+v,0)/values.length:null,n:values.length};
}
function frequency(rows,field){
 const valid=rows.filter(r=>r.respondio!=='No'&&Number.isFinite(r[field]));
 return {count:valid.length?valid.filter(r=>r[field]>=3).length:null,denominator:valid.length};
}
function ranking(rows,field){
 const ordered=rows.filter(r=>Number.isFinite(r[field])&&r[field]>0).slice().sort((a,b)=>b[field]-a[field]||String(a.Nombre||a.ID).localeCompare(String(b.Nombre||b.ID),'es'));
 const cutoff=ordered[Math.min(2,ordered.length-1)]?.[field];
 return ordered.filter(r=>r[field]>=cutoff).map(row=>({row,rank:1+ordered.filter(r=>r[field]>row[field]).length}));
}
// Directed, within-class choices / answered-student-to-classmate opportunities.
// This display metric does not replace the centre-wide individual counts.
function relationshipRates(rows){
 const groups=new Map();
 for(const row of rows){const key=JSON.stringify([row.Campus||row.Centro,row.Curso,row.Grupo]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
 let positive=0,negative=0,possible=0,responses=0,unavailable=false;
 for(const members of groups.values()){
  const ids=new Set(members.map(r=>r.ID));
  if(members.some(r=>Number.isFinite(r.n_clase)&&r.n_clase!==members.length)){unavailable=true;continue;}
  for(const row of members){
   if(row.respondio==='No'||!Number.isFinite(row.amistad_declarada_n)||!Number.isFinite(row.rechazo_declarado_n))continue;
   let pos=row.amistad_clase_declarada_n,neg=row.rechazo_clase_declarada_n;
   if(!Number.isFinite(pos)||!Number.isFinite(neg)){
    if(Array.isArray(row.relaciones_red)){
     pos=new Set(row.relaciones_red.filter(l=>l.tipo==='amistad'&&l.id!==row.ID&&ids.has(l.id)).map(l=>l.id)).size;
     neg=new Set(row.relaciones_red.filter(l=>l.tipo==='rechazo'&&l.id!==row.ID&&ids.has(l.id)).map(l=>l.id)).size;
    }else if(row.ambito_nominaciones!=='centro'){pos=row.amistad_declarada_n;neg=row.rechazo_declarado_n;}
    else {unavailable=true;continue;}
   }
   if(pos<0||neg<0||pos+neg>members.length-1){unavailable=true;continue;}
   positive+=pos;negative+=neg;possible+=Math.max(0,members.length-1);responses++;
  }
 }
 return {positive:unavailable?null:positive,negative:unavailable?null:negative,possible,responses,
  positivePercent:!unavailable&&possible?100*positive/possible:null,negativePercent:!unavailable&&possible?100*negative/possible:null};
}
function cognitiveBreakdown(rows){
 return ['carrera','emilia','biblioteca'].map((key,i)=>{
  const values=rows.filter(r=>r.respondio!=='No').map(r=>r['crt_'+key+'_acierto']).filter(v=>v===0||v===1);
  const correct=values.reduce((sum,v)=>sum+v,0);
  return {label:['Carrera','Emilia','Biblioteca'][i],correct:values.length?correct:null,n:values.length,percent:values.length?100*correct/values.length:null};
 });
}
function overview(rows){
 return {wellbeing:mean(rows,'felicidad',true),crt:mean(rows,'crt_aciertos',true),positive:mean(rows,'amistad_declarada_n',true),negative:mean(rows,'rechazo_declarado_n',true),
 feeling:frequency(rows,'felicidad_centro'),enjoyment:frequency(rows,'felicidad_diversion'),alone:frequency(rows,'felicidad_soledad'),
 mutual:filter(rows,'con_reciprocas').length,missingRelations:filter(rows,'sin_respuesta_relaciones').length,
 crtDistribution:[0,1,2,3].map(score=>rows.filter(r=>r.respondio!=='No'&&r.crt_aciertos===score).length)};
}
const sources={self:'bullying_self',peers:'bullying_peers'};
function observed(row,source){return source==='self'?(row.respondio==='No'?null:row.bullying_autorreporte??null):row.bullying_companeros_n??null;}
function exportReviews(rows,store,source){
 return {format:'pbis.review.simple.v1',source,records:rows.map(row=>({
 studentId:row.ID,center:row.Centro||row.Campus,course:row.Curso,group:row.Grupo,
 self:observed(row,'self'),peers:observed(row,'peers'),
 surprise:Object.entries(sources).filter(([name,key])=>observed(row,name)!==null&&store.get(row.ID).reactions[key]==='sorpresa').map(([name])=>name),
 nonParticipation:store.get(row.ID).nonParticipation
 })),createdAt:new Date().toISOString()};
}
function restoreReviews(payload,rows,store,source,reasons){
 if(payload?.format!=='pbis.review.simple.v1'||JSON.stringify(payload.source)!==JSON.stringify(source)||!Array.isArray(payload.records)||payload.records.length!==rows.length)throw Error('La valoración no corresponde a este archivo y aula.');
 const byId=new Map(rows.map(r=>[r.ID,r])),seen=new Set(),checked=[];
 for(const entry of payload.records){
  const row=byId.get(entry.studentId);
  if(!row||seen.has(row.ID)||entry.center!==(row.Centro||row.Campus)||entry.course!==row.Curso||entry.group!==row.Grupo||entry.self!==observed(row,'self')||entry.peers!==observed(row,'peers')||!Array.isArray(entry.surprise)||new Set(entry.surprise).size!==entry.surprise.length||entry.surprise.some(s=>!Object.hasOwn(sources,s)||observed(row,s)===null))throw Error('La valoración contiene datos incompatibles o fuera del aula.');
  const reason=entry.nonParticipation;
  if(reason!=null&&(row.respondio!=='No'||!Object.hasOwn(reasons,reason.reason)||typeof reason.detail!=='string'||reason.detail.length>300||(reason.reason==='other'?!reason.detail.trim():reason.detail!=='')))throw Error('Revisa el motivo de no participación.');
  seen.add(row.ID);checked.push({row,entry});
 }
 // Validate everything before changing the current session.
 for(const {row,entry} of checked){
  for(const [sourceName,key] of Object.entries(sources)){
   const previous=store.get(row.ID).reactions[key];
   if(previous)store.toggle(row.ID,key,previous);
   if(entry.surprise.includes(sourceName))store.toggle(row.ID,key,'sorpresa');
  }
  store.setNonParticipation(row.ID,entry.nonParticipation?.reason??null,entry.nonParticipation?.detail||'');
 }
 return checked.length;
}
return Object.freeze({filter,searchStudents,labels,mean,ranking,overview,relationshipRates,cognitiveBreakdown,bullyingCategory,bullyingDistribution,observed,exportReviews,restoreReviews});
});

