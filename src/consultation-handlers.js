
/* New consultation entry points use only the already-authorized dataset. */
function resultClick(event){
 const button=event.target.closest('button[data-result]');
 if(!button||!dataset)return;
 const scope=view==='center'?'center':'group',key=button.dataset.result;
 if(!Object.hasOwn(window.PbisConsultationUI.labels,key))return;
 resultFilter={key,scope};changeView('roster');
}
function simpleReviewClick(event){
 const button=event.target.closest('button[data-surprise]');
 if(!button||!dataset||view!=='review')return;
 const row=currentRows().find(r=>r.ID===button.dataset.studentId),source=button.dataset.surprise;
 if(!row||!['self','peers'].includes(source)||window.PbisConsultationUI.observed(row,source)===null)return;
 const key=source==='self'?'bullying_self':'bullying_peers';
 const selected=rosterReviews.toggle(row.ID,key,'sorpresa');
 button.setAttribute('aria-pressed',String(selected==='sorpresa'));
 button.classList.toggle('selected',selected==='sorpresa');
 button.title=selected?'Quitar marca de sorpresa':'Me sorprende';
 updateCloseAction();
}
function simpleReview(rows){
 const UI=window.PbisConsultationUI;
 const cell=(row,source)=>{
  const value=UI.observed(row,source),key=source==='self'?'bullying_self':'bullying_peers',selected=rosterReviews.get(row.ID).reactions[key]==='sorpresa';
  if(value===null)return '<span class="missing">Sin datos suficientes</span>';
  return '<div class="simple-review-cell"><span>'+E(source==='self'?value:(value+' '+(value===1?'mención':'menciones')) )+'</span><button type="button" class="surprise-toggle'+(selected?' selected':'')+'" data-surprise="'+source+'" data-student-id="'+E(row.ID)+'" aria-pressed="'+selected+'" aria-label="'+E('Me sorprende '+(source==='self'?'su declaración':'las menciones recibidas')+': '+(row.Nombre||row.ID))+'" title="'+(selected?'Quitar marca de sorpresa':'Me sorprende')+'"><span aria-hidden="true">😮</span><span>Me sorprende</span></button></div>';
 };
 return '<article class="report">'+reportHero(selection.course+' · '+selection.group,rows.length+' estudiantes · '+selection.center,'Valoración docente')+'<div class="report-body"><div class="simple-review-heading"><div><h3>¿Te sorprenden estas respuestas?</h3><p>Marca los datos que quieras contrastar. Una casilla sin marcar queda pendiente.</p></div><div class="review-file-actions"><button id="save-simple-review" type="button" class="quiet">Guardar valoraciones</button><label class="quiet">Cargar valoraciones<input id="load-simple-review" type="file" accept=".json" class="review-file-input"></label></div></div><p id="simple-review-status" role="status">'+E(reviewMessage)+'</p><div class="roster-scroll"><table class="roster-table simple-review-table"><thead><tr><th>Estudiante</th><th>Declara haber sufrido acoso</th><th>Menciones de otras personas</th></tr></thead><tbody>'+rows.map(row=>'<tr class="'+(row.respondio==='No'?'roster-no-response':'')+'"><th scope="row"><button type="button" class="student-link" data-student-id="'+E(row.ID)+'">'+E(row.Nombre||row.ID)+'</button>'+(row.respondio==='No'?'<small class="participation-tag">No ha respondido</small>':'')+'</th><td>'+(row.respondio==='No'?nonParticipationCell(row):cell(row,'self'))+'</td><td>'+cell(row,'peers')+'</td></tr>').join('')+'</tbody></table></div><div class="simple-review-footer"><p>'+(demoSession?'Las valoraciones de esta demo son de práctica y no se envían.':'Las marcas permanecen en esta sesión. Revisa y envía tu valoración antes de cerrar.')+'</p><button id="send-simple-review" class="btn" type="button">'+(demoSession?'Ver cómo se enviaría':'Revisar y enviar valoración')+'</button></div></div></article>';
}
function simpleReviewSource(){return {sha256:books.data?.sha256||'demo',sheet:document.getElementById('sheet-data').value,center:selection.center,course:selection.course,group:selection.group};}
function bindSimpleReview(){
 document.getElementById('send-simple-review').onclick=()=>demoSession?(document.getElementById('simple-review-status').textContent='En una consulta real verás qué datos se comparten y confirmarás el envío. Esta demo no envía nada.'):showReviewPreview();
 document.getElementById('save-simple-review').onclick=()=>{
  const payload=window.PbisConsultationUI.exportReviews(currentRows(),rosterReviews,simpleReviewSource());
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='PBIS-valoraciones-'+(selection.course+'-'+selection.group).replace(/[^\p{L}\p{N}_-]/gu,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  document.getElementById('simple-review-status').textContent='Descarga preparada. Guarda el archivo para recuperar las marcas.';
 };
 document.getElementById('load-simple-review').onchange=async event=>{
  const file=event.target.files[0],ticket=generation,source=simpleReviewSource();if(!file)return;
  try{
   if(file.size>4*1024*1024)throw Error('La valoración supera el tamaño admitido.');
   const payload=JSON.parse(await file.text());
   if(ticket!==generation||view!=='review'||JSON.stringify(source)!==JSON.stringify(simpleReviewSource()))return;
   window.PbisConsultationUI.restoreReviews(payload,currentRows(),rosterReviews,source,window.PbisRosterReview.nonParticipationReasons);
   reviewMessage='Valoraciones recuperadas. Puedes revisarlas y enviarlas.';renderReport();updateCloseAction();
  }catch(error){if(ticket===generation&&document.getElementById('simple-review-status'))document.getElementById('simple-review-status').textContent=error.message;}
  finally{event.target.value='';}
 };
}

