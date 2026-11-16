(function(root){
'use strict';
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const metrics={
 mutual:{label:'Amistades recíprocas',title:'Con alguna amistad recíproca registrada',unit:'%',max:100,valid:s=>s.relationsAnswered===true,value:s=>Number(s.schoolMutualCount>0),percent:true,note:''},
 negative:{label:'Relaciones negativas',title:'Relaciones negativas recibidas por alumno',unit:'',valid:s=>s.schoolRelationsIncomingN>0&&finite(s.schoolNegativeIn),value:s=>s.schoolNegativeIn,note:''},
 positive:{label:'Relaciones positivas',title:'Relaciones positivas recibidas por alumno',unit:'',valid:s=>s.schoolRelationsIncomingN>0&&finite(s.schoolFriendIn),value:s=>s.schoolFriendIn,note:''},
 alone:{label:'Soledad',title:'Se sienten solos siempre o casi siempre',unit:'%',max:100,valid:s=>finite(s.alone),value:s=>Number(s.alone>=3),percent:true,note:'Entre quienes respondieron a la pregunta de soledad.'},
 bullying:{label:'Bullying',title:'Nº de nominaciones de bullying',unit:'%',max:100,valid:s=>s.bullyingIncomingN>0&&finite(s.peerCount),value:s=>Number(s.peerCount>0),percent:true,note:'Ninguna nominación registrada · Una · Dos o más, incluida la propia.'},
 wellbeing:{label:'Bienestar',title:'Bienestar medio',unit:' / 10',max:10,valid:s=>finite(s.wellbeing),value:s=>s.wellbeing,note:'Entre quienes respondieron las tres preguntas de bienestar.'}
};
const groups={neae:['Alumnado NEAE','Resto del alumnado'],newcomer:['Nueva incorporación','Resto del alumnado'],migrant:['Origen migrante','Resto del alumnado']};
function summarize(school,group,metric){
 if(!groups[group]||!metrics[metric])throw new Error('Comparación no reconocida');
 const m=metrics[metric],students=school.students;
 const rows=[true,false].map((flag,i)=>{const members=students.filter(s=>s.demographics?.[group]===flag);if(metric==='bullying'){const counts=[0,0,0];for(const s of members)counts[Math.min(2,(s.peerCount||0)+Number(s.selfReport===true))]++;return {label:groups[group][i],total:members.length,n:members.length,counts,percent:counts.map(v=>members.length?v/members.length*100:0),value:members.length?100:null};}const available=members.filter(m.valid),sum=available.reduce((a,s)=>a+m.value(s),0);return {label:groups[group][i],total:members.length,n:available.length,numerator:m.percent?sum:null,value:available.length?sum/available.length*(m.percent?100:1):null};});
 return {rows,missing:students.filter(s=>typeof s.demographics?.[group]!=='boolean').length,metric:m};
}
function mount(host,school,kind,onList=()=>{}){
 let group=kind==='neae'?'neae':'newcomer',metric='mutual';
 const choices=['mutual','negative','alone','bullying'];
 const fmt=v=>v.toLocaleString('es',{maximumFractionDigits:1});
 function draw(){
  const result=summarize(school,group,metric),m=result.metric,maximum=m.max||Math.max(1,Math.ceil(Math.max(...result.rows.map(r=>r.value??0))));
  const unavailable=result.rows.every(r=>r.total===0)||(metric==='bullying'&&!school.students.some(s=>Number.isFinite(s.peerCount)||s.selfReport===true));
  host.innerHTML=`<div class="comparison-heading"><h2>${kind==='neae'?'Integración del alumnado NEAE':group==='migrant'?'Integración del alumnado de origen migrante':'Integración del alumnado nuevo'}</h2>${kind!=='neae'?`<label class="integration-group-label">Comparar por<select data-integration-group aria-label="Grupo de alumnado"><option value="newcomer" ${group==='newcomer'?'selected':''}>Nueva incorporación</option><option value="migrant" ${group==='migrant'?'selected':''}>Origen migrante</option></select></label>`:''}</div><div class="comparison-controls integration-controls" role="group" aria-label="Indicador de integración">${choices.map(key=>`<button data-integration-metric="${key}" aria-pressed="${key===metric}">${metrics[key].label}</button>`).join('')}</div><div class="integration-question-heading"><h3 class="integration-question">${m.title}</h3></div>${unavailable?'<div class="integration-empty">No hay información disponible para esta comparación.</div>':`${metric==='bullying'?'<div class="bullying-compare-legend integration-legend"><span><i class="bullying-category-0"></i>Ninguna</span><span><i class="bullying-category-1"></i>Una</span><span><i class="bullying-category-2"></i>Dos o más</span></div>':'<div class="integration-legend" aria-hidden="true"></div>'}<div class="integration-axis" aria-hidden="true"><span>0${m.unit==='%'?'%':''}</span><span>${maximum}${m.unit==='%'?'%':''}</span></div><div class="integration-bars">${result.rows.map((r,i)=>`<div class="integration-row"><div class="integration-label"><strong>${r.label}</strong><span>${r.total} alumnos</span>${metric==='mutual'&&r.n?`<button class="integration-list-link" data-integration-list="integration_${group}_${i}">${r.n-r.numerator} sin amistad recíproca →</button>`:''}</div>${metric==='bullying'?`<div class="integration-track integration-stack" role="img" aria-label="${escape(r.label+': '+r.counts.map((n,j)=>['Ninguna','Una','Dos o más'][j]+': '+n).join(', '))}">${r.counts.map((n,j)=>n?`<span class="bullying-category-${j}" style="width:${r.percent[j]}%" title="${['Ninguna','Una','Dos o más'][j]}: ${n} alumnos (${fmt(r.percent[j])}%)">${r.percent[j]>=10?fmt(r.percent[j])+'%':''}</span>`:'').join('')}</div><div class="integration-value"><strong>${r.total}</strong><span>alumnos</span></div>`:`<div class="integration-track" role="img" aria-label="${escape(r.label+': '+(r.value===null?'Sin datos disponibles':fmt(r.value)+m.unit))}"><span class="integration-fill group-${i}" style="width:${r.value===null?0:r.value/maximum*100}%"></span></div><div class="integration-value"><strong>${r.value===null?'Sin dato':fmt(r.value)+m.unit}</strong><span>${r.value===null?(r.total?'Sin respuestas disponibles':'Sin alumnado en este grupo'):m.percent?`${r.numerator} de ${r.n} alumnos`:`${r.n} alumnos con datos`}</span></div>`}</div>`).join('')}</div><p class="integration-note">${m.note}${result.missing?` ${result.missing} alumnos sin clasificación disponible.`:''}</p>`}`;
  host.querySelectorAll('[data-integration-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.integrationMetric;draw();});
  host.querySelectorAll('[data-integration-list]').forEach(b=>b.onclick=()=>onList(b.dataset.integrationList));
  const selector=host.querySelector('[data-integration-group]');if(selector)selector.onchange=ev=>{if(!['newcomer','migrant'].includes(ev.target.value))return;group=ev.target.value;draw();};
 }
 draw();
}
const api={summarize,mount};if(typeof module==='object'&&module.exports)module.exports=api;else root.PBISIntegration=api;
})(typeof globalThis!=='undefined'?globalThis:this);
