'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Exercise the actual renderer without launching the full browser application.
const source=fs.readFileSync(path.join(__dirname,'..','src','app.js'),'utf8');
const feedbackHelper=source.slice(source.indexOf('function appFeedbackButton(section){'),source.indexOf('function renderReport(){'));
const start=source.indexOf('function studentReport(r,classRows=[r],visibleRows=classRows){');
const end=source.indexOf('\nfunction studentReportExpanded(r){',start);
assert(start>=0&&end>start,'No se encontró el generador del resumen individual');
const number=value=>Number(value).toLocaleString('es-ES',{maximumFractionDigits:1});
const E=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const classCell=(value,kind,unit='')=>`<span>${value==null?'Sin datos':`${number(value)}${unit}`}</span>`;
const known=(...values)=>values.every(value=>value!==null&&value!==undefined);
const reportHero=(name,subtitle)=>`<header>${E(name)} · ${E(subtitle)}</header>`;
const studentReportExpanded=()=>'<div>Indicadores ampliados</div>';
const studentNetworkSection=()=>'<section class="student-network">Red en estrella</section>';
const C={studentNetwork:()=>({})};
const studentReport=new Function('window','number','E','classCell','known','reportHero','studentReportExpanded','studentNetworkSection','C','networkCoverageNote',`${feedbackHelper}${source.slice(start,end)}\nreturn studentReport;`)({PbisFeedbackModel:require('../src/feedback-model.js')},number,E,classCell,known,reportHero,studentReportExpanded,studentNetworkSection,C,()=> '');
const expandedEnd=source.indexOf('\nfunction studentNetworkSection(',end);
const expanded=new Function('reading','section','metric','detail',`${source.slice(end+1,expandedEnd)}\nreturn studentReportExpanded;`)(()=>'',(_number,title)=>title,(title)=>`<div class="metric">${title}</div>`,(values,format)=>values.every(value=>value!=null)?format(...values):'Sin datos');
const base={ID:'00001',Curso:'4.º Primaria',Grupo:'A',Nombre:'Ana M.',respondio:'Sí',bullying_autorreporte:'No',bullying_companeros_n:0,amistad_recibida_n:16,amistad_declarada_n:6,amistad_reciproca_n:3,rechazo_recibido_n:0,rechazo_declarado_n:0,popularidad:5.9,centralidad:10,felicidad:7.5,felicidad_centro:3,felicidad_diversion:3,felicidad_soledad:1,mediacion_n:7,mediacion:2.6};


test('reference summary presents six cards and only the star inside the closed disclosure',()=>{
 const html=studentReport(base),more=html.indexOf('<details class="expanded-details student-network-details">');
 const titles=['Bullying','Relaciones de amistad y negativas','Posición','Bienestar','Mediador','Test cognitivo'];
 assert.deepEqual([...html.matchAll(/<h3>(.*?)<\/h3>/g)].map(m=>m[1]),titles);
 for(const title of titles)assert(html.indexOf('<h3>'+title+'</h3>')<more);
 assert.match(html.slice(more),/^<details[^>]*><summary>Ver más información[^]*<\/summary><section class="student-network">Red en estrella<\/section><\/details>/);
 assert.doesNotMatch(html,/Indicadores ampliados|Acierto de predicciones|Test de impulsividad/);
 assert.equal((html.match(/class="student-network"/g)||[]).length,1);
 assert.match(html,/id="previous-student"[^>]*disabled/);assert.match(html,/id="next-student"[^>]*disabled/);
});
test('reported position never substitutes calculated centrality, preserves ties and distinguishes missing from zero',()=>{
 for(const n of [0,1,4,null]){
  const row={...base,centralidad_reportada_n:n},html=studentReport(row,[row,{...base,ID:'2',centralidad_reportada_n:4}]);
  assert.ok(html.includes('Consideran que es central</span><strong>'+(n==null?'Sin dato':n+' compañero'+(n===1?'':'s'))));
  assert.match(html,n==null?/Sin respuestas de sus compañeros/:n===0?/Sin nominaciones registradas/:n===4?/Top 1 de la clase/:/Top 2 de la clase/);
 }
 assert.doesNotMatch(studentReport(base),/eigenvector|Centralidad calculada/);
});
test('relationships retain received counts, reciprocity and valid classroom means',()=>{
 const peer={...base,ID:'2',amistad_recibida_n:4,rechazo_recibido_n:2,amistad_reciproca_n:1,amistad_declarada_n:2};
 const html=studentReport(base,[base,peer]);
 assert.match(html,/16 compañeros señalan tener una buena relación/);assert.match(html,/Media de su clase: 10/);
 assert.match(html,/Media de su clase: 1/);assert.match(html,/3 de 6 elecciones de amistad tienen correspondencia registrada/);
 assert.match(html,/<strong>50 %<\/strong>/);
 const zero=studentReport({...base,amistad_declarada_n:0,amistad_reciproca_n:0});
 assert.match(zero,/No ha declarado elecciones/);assert.doesNotMatch(zero,/NaN|Infinity|0 de sus 0/);
});
test('bullying keeps each source and original answer separate, formats selections and escapes imported text',()=>{
 const html=studentReport({...base,bullying_autorreporte:'Sí',bullying_companeros_n:1,bullying_frecuencia:'Una o dos veces',bullying_dificultad:'Muy difícil',bullying_situaciones:'Insultos | Excluir <script>'});
 assert.match(html,/¿Se nombra como víctima\?<\/span><strong>SÍ/);
 assert.match(html,/¿Recibe nominaciones como víctima de bullying\?<\/span><strong>Sí, 1 compañero/);
 assert.match(html,/<dd>Una o dos veces<\/dd>/);assert.match(html,/<dd>Muy difícil<\/dd>/);
 assert.match(html,/<dd>Insultos; Excluir &lt;script&gt;<\/dd>/);
 assert.doesNotMatch(html,/<script>|1 compañeros/);
 for(const n of [1,2,3])assert.ok(studentReport({...base,bullying_companeros_n:n}).includes('Sí, '+n+' compañero'));
});
test('nonrespondents retain received information, without inventing their answers',()=>{
 const html=studentReport({...base,Nombre:null,respondio:'No',crt_aciertos:3,crt_carrera_acierto:1,bullying_companeros_n:2,bullying_autorreporte:'Sí',bullying_frecuencia:'Una vez'});
 assert.match(html,/Estudiante · 00001/);assert.match(html,/no ha realizado el test/);
 assert.match(html,/¿Se nombra como víctima\?<\/span><strong>Sin dato/);assert.match(html,/Sí, 2 compañeros/);
 assert.match(html,/No hay respuestas de bienestar/);assert.match(html,/<dd>Sin respuesta<\/dd>/);
 assert.doesNotMatch(html,/<dd>Una vez<\/dd>|answer-correct|NaN|Infinity/);
});
test('wellbeing uses the original loneliness response, and reports incomplete items honestly',()=>{
 const html=studentReport({...base,Nombre:'Ana <b>',felicidad_centro:3,felicidad_diversion:4,felicidad_soledad:0});
 assert.match(html,/Ana &lt;b&gt; se ha sentido <strong>casi siempre<\/strong> bien/);
 assert.match(html,/divertido <strong>siempre<\/strong>/);assert.match(html,/<strong>nunca<\/strong> se ha sentido solo\/a/);
 const partial=studentReport({...base,felicidad_centro:null});assert.match(partial,/Sin respuesta sobre cómo se ha sentido/);assert.match(partial,/<strong>casi nunca<\/strong> se ha sentido solo\/a/);
});
test('cognitive test shows total, each available result and the mean of valid respondents',()=>{
 const row={...base,crt_aciertos:2,crt_carrera_acierto:0,crt_emilia_acierto:1,crt_biblioteca_acierto:1};
 const html=studentReport(row,[row,{...base,crt_aciertos:1},{...base,crt_aciertos:3,respondio:'No'},{...base,crt_aciertos:null}]);
 assert.match(html,/<strong>2 \/ 3<\/strong>/);assert.match(html,/Media de su clase: 1,5 \/ 3/);
 assert.match(html,/Carrera<\/span><strong class="answer-incorrect">Error/);
 assert.match(html,/Emilia<\/span><strong class="answer-correct">Acierto/);
 assert.match(html,/Biblioteca<\/span><strong class="answer-correct">Acierto/);
 const legacy=studentReport({...base,crt_aciertos:2});assert.equal((legacy.match(/class="answer-missing"/g)||[]).length,3);
});
test('mediation and relation counts use singular wording and keep both mediation sources',()=>{
 const html=studentReport({...base,amistad_recibida_n:1,rechazo_recibido_n:1,mediacion_n:1,mediacion_negativa_n:0});
 assert.match(html,/1 compañero señala tener una buena relación/);assert.match(html,/1 compañero señala tener una mala relación/);
 assert.match(html,/Opinan que sí<\/span><strong>1 compañero/);assert.match(html,/Opinan que no<\/span><strong>0 compañeros/);
});
