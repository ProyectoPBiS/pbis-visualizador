(function(global){'use strict';
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rows(school){return school.classes.map(c=>{const a=PBISData.summarize(school,c.id),student=school.students.find(s=>s.classId===c.id);return {id:c.id,label:c.label,n:a.n,respondents:a.relationsN,good:a.positiveEdges,bad:a.negativeEdges,course:student?.course||c.label,group:student?.group||c.label,total:a.positiveEdges+a.negativeEdges,goodShare:a.positiveEdges+a.negativeEdges?a.positiveEdges/(a.positiveEdges+a.negativeEdges)*100:null,badShare:a.positiveEdges+a.negativeEdges?a.negativeEdges/(a.positiveEdges+a.negativeEdges)*100:null,student};}).sort((a,b)=>a.student&&b.student?PBISData.compareStudents(a.student,b.student):a.label.localeCompare(b.label,'es',{numeric:true})).map(({student,...row})=>row);}
// Squarified rectangles preserve the area of each positive weight.
function layout(items,width=100,height=100){
 const total=items.reduce((s,d)=>s+d.value,0);if(!total)return [];
 const pending=items.filter(d=>d.value>0).map(d=>({...d,area:d.value/total*width*height})).sort((a,b)=>b.area-a.area),out=[];
 let x=0,y=0,w=width,h=height;
 const worst=(row,side)=>{const sum=row.reduce((s,d)=>s+d.area,0);return Math.max(side*side*Math.max(...row.map(d=>d.area))/(sum*sum),sum*sum/(side*side*Math.min(...row.map(d=>d.area))));};
 while(pending.length){const row=[pending.shift()],side=Math.min(w,h);while(pending.length&&worst([...row,pending[0]],side)<=worst(row,side))row.push(pending.shift());const area=row.reduce((s,d)=>s+d.area,0);if(w>=h){const strip=area/h;let yy=y;for(const d of row){const hh=d.area/strip;out.push({...d,x,y:yy,w:strip,h:hh});yy+=hh;}x+=strip;w=Math.max(0,w-strip);}else{const strip=area/w;let xx=x;for(const d of row){const ww=d.area/strip;out.push({...d,x:xx,y,w:ww,h:strip});xx+=ww;}y+=strip;h=Math.max(0,h-strip);}}
 return out;
}
function averages(data,kind){return data.map(d=>({...d,mean:d.respondents?d[kind]/d.respondents:null})).sort((a,b)=>a.mean===null?(b.mean===null?a.label.localeCompare(b.label,'es',{numeric:true}):1):b.mean===null?-1:b.mean-a.mean||a.label.localeCompare(b.label,'es',{numeric:true}));}
// Nominations, not diagnosed cases. Explicit product rule: no recorded nomination
// is category zero even when the pupil did not submit a questionnaire.
function bullyingRows(school){
 return school.classes.map(c=>{
  const students=school.students.filter(s=>s.classId===c.id),counts=[0,0,0];
  for(const s of students){const nominations=(s.selfReport===true?1:0)+(s.peerCount||0);counts[Math.min(2,nominations)]++;}
  const n=students.length;return {id:c.id,label:c.label,n,available:students.some(s=>Number.isFinite(s.peerCount)||s.selfReport===true),counts,percent:counts.map(v=>n?v/n*100:0),noSelfResponse:students.filter(s=>s.selfReport===null).length};
 }).sort((a,b)=>b.percent[2]-a.percent[2]||b.percent[1]-a.percent[1]||a.label.localeCompare(b.label,'es',{numeric:true}));
}
function nominationConcentration(school){
 const byId=new Map(school.students.map(s=>[s.id,s])),byClass=new Map(school.classes.map(c=>[c.id,{id:c.id,label:c.label,n:0,maxFromOne:0}]));
 for(const s of school.students){const group=byClass.get(s.classId);if(group)group.n++;}
 for(const sender of school.students){const counts=new Map();for(const id of new Set(sender.nominations||[])){if(id===sender.id)continue;const target=byId.get(id);if(target&&byClass.has(target.classId))counts.set(target.classId,(counts.get(target.classId)||0)+1);}for(const [id,n]of counts)byClass.get(id).maxFromOne=Math.max(byClass.get(id).maxFromOne,n);}
 return [...byClass.values()].sort((a,b)=>b.maxFromOne-a.maxFromOne||a.label.localeCompare(b.label,'es',{numeric:true}));
}
function nominationAlerts(school){
 const known=new Set(school.students.map(s=>s.id)),classes=new Map(school.classes.map(c=>[c.id,c.label]));
 return school.students.map(s=>({id:s.id,label:s.label||s.id,classLabel:classes.get(s.classId)||[s.course,s.group].filter(Boolean).join(' '),count:Number.isFinite(s.nominationCount)?s.nominationCount:[...new Set(s.nominations||[])].filter(id=>id!==s.id&&known.has(id)).length})).filter(s=>s.count>=15).sort((a,b)=>b.count-a.count||String(a.label).localeCompare(String(b.label),'es'));
}
function sortBullying(data,criterion='any',descending=true){
 const value=d=>criterion==='any'?(d.counts[1]+d.counts[2])/d.n:d.counts[{none:0,one:1,two:2}[criterion]]/d.n;
 return data.slice().sort((a,b)=>{if(!a.n||!b.n)return a.n?-1:b.n?1:a.label.localeCompare(b.label,'es',{numeric:true});return (descending?-1:1)*(value(a)-value(b))||a.label.localeCompare(b.label,'es',{numeric:true});});
}
function mountBullying(host,school){
 let descending=true,selected=null,criterion='any';const criteria=[['any','Una + Dos o más'],['none','Ninguna'],['one','Una'],['two','Dos o más']];const data=bullyingRows(school),names=['Ninguna','Una','Dos o más'],fmt=v=>v.toLocaleString('es',{maximumFractionDigits:1});
 const description=d=>`${d.label} · ${d.n} alumnos: ${names.map((name,i)=>`${name}: ${d.counts[i]} (${fmt(d.percent[i])}%)`).join(' · ')}`;
 const alerts=nominationAlerts(school);
 const warning=()=>alerts.length?`<div class="bullying-response-notice" role="note"><strong>Una misma respuesta puede influir en muchos resultados.</strong>${alerts.map(s=>`<p>El alumno <b>${escape(s.label)}</b>, de ${escape(s.classLabel)}, ha señalado que <b>${s.count} compañeros</b> están sufriendo bullying, lo que influye en la distribución del gráfico.</p>`).join('')}</div>`:'';
 function draw(){
 if(!data.some(d=>d.available)){host.innerHTML='<div class="comparison-heading"><h2>Bullying por clases</h2></div><p>Sin datos de nominaciones disponibles.</p>';return;}
 const ordered=sortBullying(data,criterion,descending);
 host.innerHTML=`<div class="comparison-heading"><h2>Bullying por clases</h2><div class="bullying-sort-controls"><label>Nº de nominaciones<select data-bullying-criterion>${criteria.map(([key,label])=>`<option value="${key}" ${criterion===key?'selected':''}>${label}</option>`).join('')}</select></label><button class="bullying-order-button" data-bullying-order aria-label="Cambiar a orden ${descending?'ascendente':'descendente'}">${descending?'↓ Descendente':'↑ Ascendente'}</button></div></div><div class="bullying-order-criterion">Ordenado por: Nº de nominaciones (${criteria.find(([key])=>key===criterion)[1]})</div><div class="bullying-compare-legend" aria-label="Nominaciones registradas">${names.map((name,i)=>`<span><i class="bullying-category-${i}" aria-hidden="true"></i>${name}</span>`).join('')}</div><div class="bullying-compare-bars"><div class="bullying-compare-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>${ordered.map(d=>`<button class="bullying-compare-row" data-bullying-class="${escape(d.id)}" aria-pressed="${selected===d.id}" aria-label="${escape(description(d))}" title="${escape(description(d))}"><span class="bullying-compare-label">${escape(d.label)}</span><span class="bullying-compare-stack" aria-hidden="true">${!d.available?'<span class="bullying-empty">Sin datos</span>':d.counts.map((count,i)=>count?`<span class="bullying-category-${i}" style="width:${d.percent[i]}%">${d.percent[i]>=10?Math.round(d.percent[i])+'%':''}</span>`:'').join('')}${!d.n?'<span class="bullying-empty">Sin alumnado</span>':''}</span><strong>${d.n}</strong></button>`).join('')}</div><p class="bullying-compare-note">Ninguna nominación registrada · Una · Dos o más, incluida la propia.</p><div class="bullying-compare-detail" aria-live="polite">${selected?escape(description(data.find(d=>d.id===selected))):'La cifra a la derecha es el alumnado de la clase.'}</div>${warning()}`;
 host.querySelector('[data-bullying-criterion]').onchange=ev=>{if(!criteria.some(([key])=>key===ev.target.value))return;criterion=ev.target.value;draw();};
 host.querySelector('[data-bullying-order]').onclick=()=>{descending=!descending;draw();};
 host.querySelectorAll('[data-bullying-class]').forEach(b=>b.onclick=()=>{selected=selected===b.dataset.bullyingClass?null:b.dataset.bullyingClass;const d=data.find(row=>row.id===selected);host.querySelector('.bullying-compare-detail').textContent=d?description(d)+(d.noSelfResponse?` · ${d.noSelfResponse} sin respuesta propia registrada.`:''):'La cifra a la derecha es el alumnado de la clase.';host.querySelectorAll('[data-bullying-class]').forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.bullyingClass===selected)));});
 }
 draw();
}
function mount(host,school){return mountRows(host,rows(school));}
function mountRows(host,input){
 host.pbisComparisonDispose?.();
 const ids=new Set();const data=input.map(d=>{if(!d.label||!d.course)throw new Error('Falta el nombre de clase o curso');if(!d.id||ids.has(String(d.id)))throw new Error('Clase duplicada o sin identificador');ids.add(String(d.id));for(const k of ['n','respondents','good','bad'])if(!Number.isInteger(d[k])||d[k]<0)throw new Error('Recuento inválido: '+k);if(d.respondents>d.n||(!d.respondents&&(d.good||d.bad)))throw new Error('Cobertura incompatible con relaciones');const total=d.good+d.bad;if(total>d.respondents*Math.max(0,d.n-1))throw new Error('Relaciones superiores a las posibles');return {id:String(d.id),label:String(d.label),course:String(d.course),n:d.n,respondents:d.respondents,good:d.good,bad:d.bad,total,goodShare:total?d.good/total*100:null,badShare:total?d.bad/total*100:null};});
 let mode='both',selected=null;const treeModes={both:false,good:false,bad:false};
  const detail=d=>`${d.label}: ${d.good} buenas · ${d.bad} malas · ${d.respondents} de ${d.n} respondieron sobre relaciones`;
 function equalView(){
  const stage=c=>/INFANTIL/i.test(c)?0:/PRIMARIA/i.test(c)?1:/ESO|SECUNDARIA/i.test(c)?2:/BACHILLER/i.test(c)?3:4;
  const ordered=data.slice().sort((a,b)=>stage(a.course)-stage(b.course)||(parseInt(a.course)||0)-(parseInt(b.course)||0)||a.course.localeCompare(b.course,'es',{numeric:true})||a.label.localeCompare(b.label,'es',{numeric:true})),groups=new Map();
  for(const d of ordered){if(!groups.has(d.course))groups.set(d.course,[]);groups.get(d.course).push(d);}
  return `<div class="comparison-equal-groups" role="group" aria-label="Clases del mismo tamaño, ordenadas por curso">${[...groups].map(([course,classes])=>`<section class="comparison-equal-course"><h3>${escape(course)}</h3><div class="comparison-equal-classes">${classes.map(d=>`<button class="comparison-equal-cell ${d.total?'both':'empty'}" aria-pressed="${selected===d.id}" data-comparison-class="${escape(d.id)}" aria-label="${escape(detail(d))}" title="${escape(detail(d))}" style="--good-share:${d.goodShare??0}%"><span class="comparison-class-label">${escape(d.label)}</span><strong>${d.total?Math.round(d.goodShare)+'%':d.respondents?'Sin relaciones':'Sin dato'}</strong></button>`).join('')}</div></section>`).join('')}</div>`;
 }
 function barsView(){
  const ordered=averages(data,mode),maximum=Math.max(1,...ordered.map(d=>d.mean??0)),ceiling=Math.ceil(maximum),fmt=v=>v.toLocaleString('es',{maximumFractionDigits:1});
  return `<div class="comparison-bars ${mode}" role="group" aria-label="Media por alumno, clases ordenadas de mayor a menor"><div class="comparison-bar-axis" aria-hidden="true"><span>0</span><span>${fmt(ceiling)}</span></div>${ordered.map(d=>`<button class="comparison-bar-row" data-comparison-class="${escape(d.id)}" aria-pressed="${selected===d.id}" aria-label="${escape(d.label)}: ${d.mean===null?'sin respuestas de relaciones':fmt(d.mean)+' relaciones por alumno que respondió'}. ${escape(detail(d))}"><span class="comparison-bar-label">${escape(d.label)}</span><span class="comparison-bar-track" aria-hidden="true"><span class="comparison-bar-fill" style="width:${d.mean===null?0:d.mean/ceiling*100}%"></span></span><strong>${d.mean===null?'Sin dato':fmt(d.mean)}</strong></button>`).join('')}</div>`;
 }
 function treeView(){
  const groups=new Map(),value=d=>mode==='both'?d.total:d.respondents?d[mode]/d.respondents:0;
  for(const d of data.filter(d=>value(d)>0)){if(!groups.has(d.course))groups.set(d.course,{label:d.course,value:0,children:[]});const g=groups.get(d.course);g.value+=value(d);g.children.push({...d,value:value(d)});}
  const width=Math.max(1,(host.clientWidth||900)-32),height=width<600?520:420;
  const courses=layout([...groups.values()],width,height);
  const tiles=courses.map(g=>`<section class="comparison-course" style="left:${g.x/width*100}%;top:${g.y/height*100}%;width:${g.w/width*100}%;height:${g.h/height*100}%"><h3>${escape(g.label)}</h3><div class="comparison-course-classes">${layout(g.children,g.w,g.h).map(d=>`<button class="comparison-leaf ${mode} ${d.w<95||d.h<70?'compact':''} ${d.w<45||d.h<32?'tiny':''}" data-comparison-class="${escape(d.id)}" aria-pressed="${selected===d.id}" aria-label="${escape(detail(d))}" title="${escape(detail(d))}" style="left:${d.x/g.w*100}%;top:${d.y/g.h*100}%;width:${d.w/g.w*100}%;height:${d.h/g.h*100}%;--good-share:${d.goodShare??0}%"><span class="comparison-leaf-content"><span class="comparison-class-label">${escape(d.label)}</span><strong>${mode==='both'?Math.round(d.goodShare)+'%':d.value.toLocaleString('es',{maximumFractionDigits:1})}</strong></span></button>`).join('')}</div></section>`).join('');
  const excluded=data.filter(d=>!value(d));
  return `<div class="comparison-tree" style="height:${height}px" role="group" aria-label="Treemap por curso y clase">${tiles||'<div class="comparison-empty">Sin relaciones para representar.</div>'}</div>${excluded.length?`<div class="comparison-zero-classes">${excluded.map(d=>`<button data-comparison-class="${escape(d.id)}" aria-pressed="${selected===d.id}">${escape(d.label)} · ${!d.respondents?'Sin dato':mode==='both'?'Sin relaciones':'0'}</button>`).join('')}</div>`:''}`;
 }
 function draw(){
  host.innerHTML=`<div class="comparison-heading"><h2>Relaciones entre clases</h2><div class="comparison-controls" role="group" aria-label="Relaciones por clase">${[['both','% de Buenas y Malas relaciones'],['good','Buenas relaciones'],['bad','Malas relaciones']].map(([key,label])=>`<button data-comparison-mode="${key}" aria-pressed="${mode===key}">${label}</button>`).join('')}</div></div><div class="comparison-key">${mode==='both'?'<span class="comparison-dot good"></span> Buenas <span class="comparison-dot bad"></span> Malas':mode==='good'?'Relaciones positivas nombradas por alumno':'Relaciones negativas nombradas por alumno'}</div>${mode!=='both'?`<div class="comparison-view-switch"><button data-comparison-view aria-pressed="${treeModes[mode]}">${treeModes[mode]?'Ver como barras':'Ver como treemap'}</button></div>`:''}${mode==='both'?equalView():treeModes[mode]?treeView():barsView()}<div class="comparison-detail" aria-live="polite">${selected?escape(detail(data.find(d=>d.id===selected))):mode==='both'?(treeModes[mode]?'Porcentaje de buenas relaciones. Tamaño: total de relaciones.':'Porcentaje de buenas relaciones. Todas las clases tienen el mismo tamaño.'):'Media entre quienes respondieron sobre relaciones. Solo dentro de su clase.'}</div>`;
  host.querySelectorAll('[data-comparison-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.comparisonMode;draw();});
  const viewButton=host.querySelector('[data-comparison-view]');if(mode!=='both'&&viewButton)viewButton.onclick=()=>{treeModes[mode]=!treeModes[mode];draw();};
  host.querySelectorAll('[data-comparison-class]').forEach(b=>b.onclick=()=>{selected=selected===b.dataset.comparisonClass?null:b.dataset.comparisonClass;showSelection();});
 }
 function showSelection(){const d=data.find(d=>d.id===selected);host.querySelector('.comparison-detail').textContent=d?`${detail(d)}${d.total?' · '+d.goodShare.toLocaleString('es',{maximumFractionDigits:1})+' % buenas / '+d.badShare.toLocaleString('es',{maximumFractionDigits:1})+' % malas':''}`:'Selecciona una clase para ver sus datos.';host.querySelectorAll('[data-comparison-class]').forEach(b=>b.setAttribute?.('aria-pressed',String(b.dataset.comparisonClass===selected)));}
 draw();
 let observer=null,lastWidth=host.clientWidth;if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>{if(!host.isConnected){observer.disconnect();return;}if(Math.abs(host.clientWidth-lastWidth)>1){lastWidth=host.clientWidth;draw();}});observer.observe(host);}
 const dispose=()=>observer?.disconnect();host.pbisComparisonDispose=dispose;return {dispose};
}
const api={rows,layout,averages,bullyingRows,sortBullying,nominationConcentration,nominationAlerts,mountBullying,mount,mountRows};if(typeof module==='object'&&module.exports)module.exports=api;else global.PBISComparison=api;
})(typeof globalThis!=='undefined'?globalThis:this);
