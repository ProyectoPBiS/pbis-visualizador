/* Local observation tool, deliberately independent of historical feedback delivery. */
(function(root){'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reasons=['Faltó solo ese día','Falta de manera recurrente','No se ha permitido que lo haga','Ha abandonado el centro','Otros'];
function scopeOf(rows,source=''){return JSON.stringify([source,rows.map(r=>[r.Campus,r.Curso,r.Grupo,r.ID,r.Periodo??r.periodo??r.fecha??null,r.respondio,r.bullying_autorreporte,r.bullying_companeros_n]).sort()]);}
function parse(payload,rows,source=''){
 const scope=scopeOf(rows,source),key=r=>JSON.stringify([r.Campus,r.Curso,r.Grupo,r.ID]);
 if(payload.format!=='pbis-tutor-observations-v1'||payload.scope!==scope||!Array.isArray(payload.entries)||payload.entries.length!==rows.length)throw Error('Este archivo no corresponde a esta clase y sus resultados.');
 const allowed=new Set(rows.map(key)),seen=new Set(),pending=[];
 for(const entry of payload.entries){if(!allowed.has(entry.key)||seen.has(entry.key))throw Error('El archivo contiene alumnos duplicados o ajenos a esta clase.');seen.add(entry.key);pending.push([entry.key,{self:entry.self===true,peers:entry.peers===true,reviewed:entry.reviewed===true,reason:reasons.includes(entry.reason)?entry.reason:null}]);}
 return pending;
}
function create(){
 let values=new Map(),orders=new Map();
 function clear(){values.clear();orders.clear();}
 function mount(host,rows,source=''){
  const scope=scopeOf(rows,source);
  if(!orders.has(scope)){const order=rows.map(r=>r.ID);for(let i=order.length-1;i>0;i--){const random=new Uint32Array(1);root.crypto.getRandomValues(random);const j=random[0]%(i+1);[order[i],order[j]]=[order[j],order[i]];}orders.set(scope,order);}
  const key=r=>JSON.stringify([r.Campus,r.Curso,r.Grupo,r.ID]),get=r=>values.get(key(r))||{};
  function draw(){
   const completed=rows.filter(r=>r.respondio==='No'?get(r).reason:get(r).reviewed).length;
   host.innerHTML=`<section class="tutor-validation"><div class="validation-heading"><div><h2>¿Te sorprenden las respuestas de los alumnos?</h2><strong>${completed} de ${rows.length} alumnos completados</strong></div><div class="validation-actions"><button class="quiet" data-save-validation>Guardar valoraciones</button><button class="quiet" data-load-validation>Cargar valoraciones</button><input type="file" accept="application/json,.json" data-validation-file hidden></div></div><p>Marca 😮 solo en las respuestas que te sorprenden. Al terminar, confirma la revisión de la clase.</p><div class="validation-rows">${orders.get(scope).map(id=>rows.find(r=>r.ID===id)).filter(Boolean).map(r=>{const v=get(r);return `<div class="validation-row"><strong>${esc(r.Nombre||r.ID)}</strong>${r.respondio==='No'?`<div class="validation-absent"><b>NO HA REALIZADO EL TEST</b><label>¿Por qué no lo ha hecho?<select data-reason="${esc(r.ID)}"><option value="">Selecciona el motivo</option>${reasons.map(reason=>`<option ${v.reason===reason?'selected':''}>${reason}</option>`).join('')}</select></label></div>`:`<div><span>Se nombra a sí mismo víctima de bullying</span><b>${r.bullying_autorreporte==null?'Sin dato':r.bullying_autorreporte}</b><button class="surprise-toggle" data-surprise="self" data-id="${esc(r.ID)}" aria-pressed="${v.self===true}" aria-label="Me sorprende su autorreporte">😮</button></div><div><span>${Number.isFinite(r.bullying_companeros_n)?r.bullying_companeros_n+' '+(r.bullying_companeros_n===1?'compañero lo nombra':'compañeros lo nombran')+' como víctima de bullying':'Sin datos de nominaciones'}</span><button class="surprise-toggle" data-surprise="peers" data-id="${esc(r.ID)}" aria-pressed="${v.peers===true}" aria-label="Me sorprenden las nominaciones recibidas">😮</button></div>`}</div>`;}).join('')}</div><div class="validation-footer"><button class="btn" data-complete-validation>He revisado la clase</button><span data-validation-status role="status">Estas valoraciones se guardan solo al descargar el archivo.</span></div></section>`;
   host.querySelectorAll('[data-surprise]').forEach(b=>b.onclick=()=>{const r=rows.find(r=>r.ID===b.dataset.id),v={...get(r)};v[b.dataset.surprise]=!v[b.dataset.surprise];values.set(key(r),v);b.setAttribute('aria-pressed',String(v[b.dataset.surprise]));});
   host.querySelectorAll('[data-reason]').forEach(s=>s.onchange=()=>{const r=rows.find(r=>r.ID===s.dataset.reason);values.set(key(r),{...get(r),reason:reasons.includes(s.value)?s.value:null});draw();});
   host.querySelector('[data-complete-validation]').onclick=()=>{for(const r of rows)if(r.respondio!=='No')values.set(key(r),{self:false,peers:false,...get(r),reviewed:true});draw();};
   host.querySelector('[data-save-validation]').onclick=()=>{const entries=rows.map(r=>({key:key(r),...get(r)}));const blob=new Blob([JSON.stringify({format:'pbis-tutor-observations-v1',scope,entries},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PBIS-valoraciones-tutor.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
   const input=host.querySelector('[data-validation-file]');host.querySelector('[data-load-validation]').onclick=()=>input.click();
   input.onchange=async()=>{try{const f=input.files[0];if(!f||f.size>1000000)throw Error('Archivo no válido.');const data=JSON.parse(await f.text());const pending=parse(data,rows,source);for(const [k,v]of pending)values.set(k,v);draw();}catch(error){host.querySelector('[data-validation-status]').textContent=error.message;}};
  }draw();
 }
 return {mount,clear};
}
root.PbisTutorValidation={create,scopeOf,parse};
})(typeof globalThis==='undefined'?this:globalThis);
