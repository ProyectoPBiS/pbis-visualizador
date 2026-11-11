'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const profiles=JSON.parse(read('data/profiles.json')),demo=JSON.parse(read('site/demo-data.json'));
function fixture({failSend=false,data=demo,waitForSend=null,distribution=null,protocol="https:"}={}){
 const elements=new Map(),fetches=[],navigations=[],listeners={};let opinions=[],demoMode=false,resets=0,feedbackTarget=null,now=Date.now(),interval,idCounter=0;
 class Clock extends Date{static now(){return now;}}
 class Element{
  constructor(id=''){this.id=id;this.value='';this.disabled=false;this.isConnected=true;this.dataset={};this.classList={add(){},remove(){},toggle(){}};this.listeners={};this.children=[];this.html='';}
  set innerHTML(value){if(this.id==='root')for(const id of [...elements.keys()])if(!['root','help','close-help'].includes(id))elements.delete(id);this.html=value;for(const [,id]of value.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element(id));if(value.includes('brand-home'))elements.set('brand',new Element('brand'));if(this.id.startsWith('sheet-'))this.value=value.match(/<option value="([^"]*)"/)?.[1]||'';}
  get innerHTML(){return this.html;}
  insertAdjacentHTML(_,value){this.html+=value;for(const [,id]of value.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element(id));}
  addEventListener(event,fn){const previous=this.listeners[event];this.listeners[event]=e=>{previous?.(e);fn(e);};}setAttribute(){}focus(){}showModal(){}close(){}scrollIntoView(){}
  querySelectorAll(){return [];}querySelector(selector){return elements.get(selector.slice(1))||new Element();}
  closest(selector){return selector==='.usage-ack'?this:null;}
  append(child){this.children.push(child);if(child.id)elements.set(child.id,child);}after(child){this.append(child);}
  replaceChildren(){this.children=[];}remove(){elements.delete(this.id);}
 }
 for(const id of ['root','help','close-help'])elements.set(id,new Element(id));
 const body=new Element('body'),document={body,getElementById:id=>elements.get(id),querySelector:selector=>selector==='meta[name="pbis-distribution"]'?(distribution?{getAttribute:()=>distribution}:null):selector==='.brand-home'?elements.get('brand'):body,querySelectorAll:selector=>selector==='.brand-home'?[elements.get('brand')].filter(Boolean):[],createElement:()=>new Element(),addEventListener(){}};
 const table=(name,rows)=>{const headers=[...new Set(rows.flatMap(row=>Object.keys(row)))];return {name,rows:[headers,...rows.map(row=>headers.map(h=>row[h]??null))]};};
 class Worker{postMessage(){queueMicrotask(()=>this.onmessage({data:{sheets:[table('Datos',data.students),table('Grupos',data.groups)]}}));}terminate(){}}
 const context={Date:Clock,document,Worker,Blob,AbortController,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},console,setTimeout(){return 1},clearTimeout(){},setInterval(fn){interval=fn;},addEventListener(type,fn){listeners[type]=fn;},location:{hash:'',protocol,assign:url=>navigations.push(url)},PBIS_HOME:'index.html',PBIS_PROFILES:profiles,PBIS_DEMO_DATA:demo,PBIS_BATCH:{endpoint:'https://test.invalid/form'},PbisProtected:require('../src/protected-project.js'),PbisCore:require('../src/core.js'),PbisStudentNetwork:require('../src/student-network.js'),PbisClassNetwork:require('../src/class-network.js'),PbisRosterReview:require('../src/roster-review.js'),PbisConsultationUI:require('../src/consultation-ui.js'),PbisFeedbackModel:{...require('../src/feedback-model.js'),classCode:async()=> 'AULA-test',newId:()=> require('node:crypto').randomUUID()},PBIS_FEEDBACK:{version:'0.10.17',recipient:'pbis_usuario@outlook.es'},PbisLinkedFeedback:require('../src/linked-feedback.js'),PbisReviewBatch:{studentCode:async(c,id)=>'coded-'+id,create:value=>({...value,message:'batch-test'})},PbisFeedback:{reset(){resets++;opinions=[];demoMode=false},open(value){feedbackTarget=value.scope==='app'?value:value.target},startSession(_role,{demo=false}={}){demoMode=demo},closeContext(){},sessionSnapshot:()=>({sessionCode:'00000000-0000-4000-8000-000000000001',opinions}),hasPending:()=>false,acknowledge(){opinions=[];}},fetch:async(url,options)=>{fetches.push({url,options});if(waitForSend)await waitForSend;return {ok:!failSend,status:failSend?500:200,json:async()=>({ok:!failSend})}}};
 context.window=context;vm.runInNewContext(read('src/usage-terms.js'),context);vm.runInNewContext(read('src/app.js'),context);
 const el=id=>elements.get(id);
 const login=(username,password=profiles.find(p=>p.username===username).password)=>{el('username').value=username;el('password').value=password;el('login-terms').checked=true;el('login-form').onsubmit({preventDefault(){}});};
 const upload=async()=>{el('file-data').files=[{name:'datos.pbis',size:100,arrayBuffer:async()=>new ArrayBuffer(1)}];await el('file-data').onchange();el('sheet-data').value='Datos';el('show-reports').onclick();};
 // Inject a scoped opinion to test the retained delivery engine separately from the new review screen.
 const addOpinion=async()=>{
  const filters=el('filters').innerHTML,course=filters.match(/<select id="course">[\s\S]*?value="([^"]+)" selected/)?.[1]||data.students[0].Curso;
  const row=data.students.find(r=>r.Curso===course)||data.students[0];
  feedbackTarget={center:row.Centro||row.Campus,course:row.Curso,group:row.Grupo,studentId:null,period:null};
  opinions.push({eventId:'opinion-test',target:feedbackTarget,classCode:'AULA-test',studentCode:null,sheet:'group',rating:4,comment:'Prueba sin envío real'});context.PBIS_UPDATE_CLOSE?.();
 };

 const addAppOpinion=(sheet,section,rating,comment,kind='opinion')=>{opinions.push(context.PbisFeedbackModel.makeAppOpinion({scope:'app',sessionCode:'00000000-0000-4000-8000-000000000001',role:'tutor',sheet,section,rating,comment,kind,version:'0.10.17'}));context.PBIS_UPDATE_CLOSE?.();};
 return {el,login,upload,addOpinion,addAppOpinion,feedbackTarget:()=>feedbackTarget,fetches,navigations,demoMode:()=>demoMode,resets:()=>resets,listeners,tick:ms=>{now+=ms;return interval();},setFailSend:value=>{failSend=value;},setDraftCount:value=>{context.PbisFeedback.draftCount=()=>value;}};
}
test('class circle opens only a current-class student and stays after the expanded indicators',async()=>{
 for(const username of ['orientacion','tutoria1eso']){
  const f=fixture();f.login(username);await f.upload();
  const html=f.el('report-content').innerHTML;
  const currentCourse=username==='orientacion'?'4.º Primaria':'1.º ESO';assert.equal((html.match(/data-class-student=/g)||[]).length,demo.students.filter(r=>r.Campus==='Centro 3705'&&r.Curso===currentCourse&&r.Grupo==='A').length);
  assert.ok(html.indexOf('class-network-heading')>html.indexOf('Información complementaria'));
  const click=id=>f.el('report-content').listeners.click({preventDefault(){},target:{closest:selector=>selector==='a[data-class-student]'?{dataset:{classStudent:id}}:null}});
  click('not-in-this-class');assert.match(f.el('report-content').innerHTML,/Ficha de aula/);
  const id=html.match(/data-class-student="([^"]+)"/)[1];click(id);
  assert.match(f.el('report-content').innerHTML,/Resumen de la ficha/);assert.ok(f.el('filters').innerHTML.includes('value="'+id+'" selected'));
  assert.doesNotMatch(f.el('report-content').innerHTML,/class-network-heading/);
  assert.equal(f.fetches.length,0);
 }
});
test('every account signs in, loads its exact course scope and signs out without data leaking into the next session',async()=>{
 const f=fixture();
 f.login('orientacion','1234');assert.ok(f.el('file-data'));assert.equal(f.el('admin-project'),undefined);await f.upload();assert.match(f.el('import-error').textContent,/No tienes permisos/);assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha de aula/);await f.el('logout').onclick();
 for(const p of profiles.filter(p=>!p.group)){
  f.login(p.username);assert.equal(f.el('open-accounts'),undefined);assert.equal(f.el('accounts-dialog'),undefined);assert.equal(f.el('open-demo'),undefined);assert.equal(f.el('start-tour'),undefined);assert.equal(f.el('load-demo'),undefined);
  await f.upload();assert.match(f.el('import-status').textContent,new RegExp(`${p.role==='orientador'?1512:168} estudiantes`));
  assert.match(f.el('filters').innerHTML,/Centro 3705/);assert.match(f.el('filters').innerHTML,/Centro 3884/);
  if(p.role==='tutor')for(const other of profiles.filter(x=>x.role==='tutor'&&x.course!==p.course))assert.ok(!f.el('filters').innerHTML.includes(`>${other.course}</option>`));
  await f.el('logout').onclick();assert.ok(f.el('login-form'));assert.equal(f.el('report-content'),undefined);
 }
 assert.equal(f.fetches.length,0);
});
test('demo is independent of accounts, cannot import a file, and closing brand never sends practice feedback',async()=>{
 const f=fixture();f.login('demo','DEMO26');await f.el('load-demo').onclick();assert.equal(f.demoMode(),true);
 assert.equal(f.el('open-accounts'),undefined);assert.equal(f.el('start-tour'),undefined);assert.equal(f.el('open-demo'),undefined);assert.equal(f.el('change-files'),undefined);
 assert.ok(f.el('tab-center'));assert.match(f.el('report-content').innerHTML,/Ficha de aula/);
 f.el('file-data').files=[{name:'not-allowed.pbis',size:100,arrayBuffer:()=>{throw Error('Demo must never read uploaded files')}}];await f.el('file-data').onchange();
 await f.addOpinion();assert.equal(f.el('logout').textContent,'Cerrar sesión');await f.el('brand').onclick();
 assert.deepEqual(f.navigations,['index.html']);assert.equal(f.fetches.length,0);assert.equal(f.demoMode(),false);assert.ok(f.el('login-form'));
 f.login('tutoria1eso');assert.match(f.el('root').innerHTML,/Selecciona el archivo/);
});
test('demo credentials enter directly with simulated data and no guide overlay',async()=>{
 const f=fixture();await f.login('demo','DEMO26');
 assert.equal(f.demoMode(),true);assert.match(f.el('report-content').innerHTML,/Ficha de aula/);
 assert.equal(f.el('tour-panel'),undefined);assert.equal(f.fetches.length,0);
});

test('initial form accepts arbitrary credentials repeatedly but grants no access before file authorization',async()=>{
 const f=fixture();
 for(let i=0;i<7;i++){
  f.login(i%2?'orientacion':'12345678Z','CualquierClave'+i);
  assert.ok(f.el('file-data'));assert.equal(f.el('admin-project'),undefined);assert.equal(f.el('open-protected'),undefined);
  assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha de aula/);
  await f.upload();assert.match(f.el('import-error').textContent,/No tienes permisos/);
  assert.equal(f.el('show-reports').disabled,true);assert.equal(f.fetches.length,0);
  await f.el('change-access').onclick();assert.ok(f.el('login-form'));
 }
});
test('one demo button opens the fixture without credentials and logout sends nothing',async()=>{
 const f=fixture();assert.doesNotMatch(f.el('root').innerHTML,/DEMO26/);
 await f.el('start-tour-login').onclick();assert.match(f.el('report-content').innerHTML,/Ficha de aula/);
 assert.equal(f.el('tour-panel'),undefined);assert.match(f.el('filters').innerHTML,/value="1.º ESO" selected/);
 await f.el('logout').onclick();assert.ok(f.el('login-form'));assert.equal(f.fetches.length,0);
});

test('brand waits for a confirmed batch before clearing the session and navigating home',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();await f.addOpinion();await f.el('brand').onclick();
 assert.equal(f.fetches.length,0);assert.ok(f.el('report-content'));await f.el('review-preview-send').onclick();
 assert.equal(f.fetches.length,1);assert.equal(f.fetches[0].options.method,'POST');
 assert.deepEqual(f.navigations,['index.html']);assert.ok(f.el('login-form'));assert.equal(f.el('report-content'),undefined);
});
test('network cards open the related class and preserve course restrictions and feedback state',async()=>{
 const C=require('../src/core.js'),make=(id,course,group,links)=>{
  const row={...demo.students[0],ID:id,Campus:'Centro 3705',Centro:'Centro 3705',Curso:course,Grupo:group,Nombre:null,n_clase:1,n_centro:3,ambito_nominaciones:'centro',escala_indicadores:'comparativa',relaciones_red:links,centralidad_eigenvector:null,centralidad_reportada_n:null,popularidad_reportada_n:null,mediacion_negativa_n:null};
  for(const key of [...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,...Object.keys(row).filter(k=>k.startsWith('pred_')||k.includes('_clase_')&&k.endsWith('_n'))])row[key]=null;
  row.amistad_declarada_n=links.filter(x=>x.tipo==='amistad').length;row.rechazo_declarado_n=links.filter(x=>x.tipo==='rechazo').length;
  return row;
 };
 const data={students:[make('X1','1.º ESO','A',[{id:'X2',tipo:'amistad',intensidad:2}]),make('X2','2.º ESO','B',[{id:'X1',tipo:'rechazo',intensidad:1}]),make('X3','3.º ESO','C',[])],groups:[]};
 const click=(f,id)=>f.el('report-content').listeners.click({preventDefault(){},target:{closest:selector=>selector==='a[data-network-student]'?{dataset:{networkStudent:id}}:null}});
 const f=fixture({data});f.login('orientacion');await f.upload();assert.equal(f.el('import-error').textContent,'');f.el('tab-student').onclick();await f.addOpinion();
 click(f,'X3');assert.match(f.el('filters').innerHTML,/value="X1" selected/);
 click(f,'X2');assert.match(f.el('filters').innerHTML,/value="2.º ESO" selected/);assert.match(f.el('filters').innerHTML,/value="B" selected/);assert.match(f.el('filters').innerHTML,/value="X2" selected/);assert.equal(f.fetches.length,0);
 await f.el('logout').onclick();assert.equal(f.fetches.length,0);await f.el('review-preview-send').onclick();assert.equal(f.fetches.length,1,'Opening a peer must preserve the opinion until explicit confirmation');
 const tutor=fixture({data});tutor.login('tutoria1eso');await tutor.upload();tutor.el('tab-student').onclick();
 assert.doesNotMatch(tutor.el('report-content').innerHTML,/data-network-student="X2"/);
 click(tutor,'X2');assert.match(tutor.el('filters').innerHTML,/value="X1" selected/);assert.equal(tutor.fetches.length,0);
});
test('a failed close retains data, retries to the original home destination and offers explicit discard',async()=>{
 const f=fixture({failSend:true});f.login('tutoria1eso');await f.upload();await f.addOpinion();await f.el('brand').onclick();
 await f.el('review-preview-send').onclick();
 assert.deepEqual(f.navigations,[]);assert.ok(f.el('report-content'));assert.match(f.el('close-status').children[0].textContent,/No se ha podido confirmar/);
 await f.el('brand').onclick();await f.el('review-preview-send').onclick();assert.equal(f.fetches.length,2);assert.equal(f.fetches[0].options.body,f.fetches[1].options.body,'Retry must preserve the exact payload, including its timestamp');assert.deepEqual(f.navigations,[]);
 const discard=f.el('close-status').children.find(child=>child.textContent==='Cerrar sin enviar');assert.ok(discard);discard.onclick();
 assert.deepEqual(f.navigations,['index.html']);assert.equal(f.el('report-content'),undefined);
});

test('PDC sign-in loads the exact group in each center and can open individual cards',async()=>{
 const data=structuredClone(demo);
 for(const r of [...data.students,...data.groups]){
  if(r.Curso==='3.º ESO'&&r.Grupo==='A')r.Grupo='PDCI';
  if(r.Curso==='4.º ESO'&&r.Grupo==='A')r.Grupo='PDC II';
 }
 for(const p of profiles.filter(p=>p.group)){
  const f=fixture({data});f.login(p.username);await f.upload();
  assert.equal(f.el('import-error').textContent,'');
  assert.match(f.el('import-status').textContent,new RegExp(data.students.filter(r=>r.Curso===p.course&&r.Grupo.startsWith('PDC')).length+' estudiantes'));
  assert.equal(f.el('open-accounts'),undefined);assert.equal(f.el('tab-center'),undefined);
  assert.match(f.el('filters').innerHTML,p.group==='PDC I'?/value="PDCI" selected/:/value="PDC II" selected/);
  assert.doesNotMatch(f.el('filters').innerHTML,/>A<\/option>|>B<\/option>|>C<\/option>/);
  assert.match(f.el('filters').innerHTML,/Centro 3705/);assert.match(f.el('filters').innerHTML,/Centro 3884/);
  f.el('tab-roster').onclick();assert.match(f.el('report-content').innerHTML,/Lista de aula/);
  f.el('tab-student').onclick();assert.match(f.el('report-content').innerHTML,/Resumen de la ficha/);
  await f.el('logout').onclick();assert.ok(f.el('login-form'));assert.equal(f.fetches.length,0);
 }
});
test('PDC credentials cannot fall back to other groups, and renamed accounts reject former credentials',async()=>{
 const f=fixture();
 for(const [username,password] of [['orientador','FRJ508'],['orientacion','NU6WY3'],['tutor1eso',profiles.find(p=>p.username==='tutoria1eso').password]]){
  f.login(username,password);assert.ok(f.el('file-data'));await f.upload();assert.match(f.el('import-error').textContent,/No tienes permisos/);assert.equal(f.el('show-reports').disabled,true);await f.el('logout').onclick();
 }
 f.login('tutoria3esopdci');await f.upload();
 assert.match(f.el('import-error').textContent,/curso o aula asignados/);
 assert.doesNotMatch(f.el('report-content').innerHTML,/Ficha de aula/);
});

test('sending locks editing until the result; a failed request restores the consultation',async()=>{
 let release;const waitForSend=new Promise(resolve=>{release=resolve;});
 const f=fixture({failSend:true,waitForSend});f.login('tutoria1eso');await f.upload();await f.addOpinion();
 await f.el('logout').onclick();const pending=f.el('review-preview-send').onclick();assert.equal(f.el('main').inert,true);
 release();await pending;assert.equal(f.el('main').inert,false);assert.ok(f.el('report-content'));
 assert.equal(f.el('logout').textContent,'Cerrar sesión');assert.match(f.el('close-status').children[0].textContent,/No se ha podido confirmar/);
});

test('confirmed submission keeps consultation open, clears only pending reviews and does not resend on logout',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();await f.addOpinion();
 await f.el('review-send-preview').onclick();assert.equal(f.fetches.length,0);
 await f.el('review-preview-send').onclick();assert.equal(f.fetches.length,1);assert.ok(f.el('report-content'));
 assert.equal(f.el('review-send-preview'),undefined);assert.equal(f.el('review-pending-state'),undefined);
 assert.match(f.el('close-status').children[0].textContent,/confirmado el registro/);
 await f.el('logout').onclick();assert.equal(f.fetches.length,1);assert.ok(f.el('login-form'));
});
test('offline failure can be recovered with the same batch, followed by a distinct batch for new feedback',async()=>{
 const f=fixture({failSend:true});f.login('tutoria1eso');await f.upload();await f.addOpinion();
 await f.el('review-send-preview').onclick();await f.el('review-preview-send').onclick();
 assert.ok(f.el('report-content'));f.setFailSend(false);
 await f.el('review-send-preview').onclick();await f.el('review-preview-send').onclick();
 assert.equal(f.fetches[0].options.body,f.fetches[1].options.body);
 await f.addOpinion();await f.el('review-send-preview').onclick();await f.el('review-preview-send').onclick();
 assert.notEqual(JSON.parse(f.fetches[1].options.body).eventId,JSON.parse(f.fetches[2].options.body).eventId);
});
test('inactivity sends pending feedback before closing; tab exit warns and demo never sends',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();await f.addOpinion();
 let prevented=false;const event={preventDefault(){prevented=true;}};f.listeners.beforeunload(event);assert.equal(prevented,true);
 await f.tick(13*60*1000+1);assert.ok(f.el('continue-session'));assert.ok(f.el('report-content'));assert.equal(f.fetches.length,0);
 f.el('continue-session').onclick();await f.tick(15*60*1000+1);assert.match(f.el('root').innerHTML,/confirmado el registro/);assert.equal(f.fetches.length,1);
 f.login('demo','DEMO26');await f.el('load-demo').onclick();await f.addOpinion();prevented=false;f.listeners.beforeunload(event);assert.equal(prevented,false);
});

test('an inactivity send failure retains all feedback and retries the identical batch',async()=>{
 const f=fixture({failSend:true});f.login('tutoria1eso');await f.upload();await f.addOpinion();
 await f.tick(15*60*1000+1);assert.ok(f.el('report-content'));assert.equal(f.fetches.length,1);assert.ok(f.el('review-pending-state'));
 f.setFailSend(false);await f.tick(15*60*1000+1);
 assert.equal(f.fetches.length,2);assert.equal(f.fetches[0].options.body,f.fetches[1].options.body);assert.ok(f.el('login-form'));
});

test('inactivity never drops an incomplete opinion or sends it as a completed response',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();await f.addOpinion();f.setDraftCount(1);
 await f.tick(15*60*1000+1);assert.ok(f.el('report-content'));assert.ok(f.el('review-incomplete-open'));assert.equal(f.fetches.length,0);
 await f.tick(60*1000);assert.ok(f.el('report-content'));assert.equal(f.fetches.length,0);
 f.setDraftCount(0);await f.tick(60*1000);assert.equal(f.fetches.length,1);assert.ok(f.el('login-form'));
});

test('one app feedback button per block without bringing back student assessments',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();
 assert.equal(f.el('tab-review'),undefined);
 for(const [tab,block] of [['group','group'],['roster','roster'],['student','roster'],['network','network']]){
  f.el('tab-'+tab).onclick();
  const html=f.el('report-content').innerHTML;
  assert.equal((html.match(/data-app-feedback=/g)||[]).length,1);
  assert.match(html,new RegExp('data-app-feedback="'+block+'"'));
 }
 f.el('tab-group').onclick();
 assert.doesNotMatch(f.el('report-content').innerHTML,/Valoración docente|data-surprise|Guardar valoraciones/);
 f.el('tab-roster').onclick();assert.doesNotMatch(f.el('report-content').innerHTML,/data-roster-confidence|data-roster-reaction|data-surprise|valoración está en el menú/);
 await f.el('logout').onclick();assert.equal(f.fetches.length,0);
});

test('three app contributions produce one confirmed close request, with no student data or PDF changes',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();
 f.el('report-content').listeners.click({target:{closest:s=>s==='button[data-app-feedback]'?{dataset:{appFeedback:'group'}}:null}});
 assert.deepEqual(JSON.parse(JSON.stringify(f.feedbackTarget())),{scope:'app',sheet:'group',section:'group'});
 f.addAppOpinion('group','wellbeing',4,'Claro');
 f.el('tab-roster').onclick();assert.match(f.el('report-content').innerHTML,/data-app-feedback="roster"/);
 f.addAppOpinion('roster','roster',null,'Quiero buscar por código','improvement');
 f.el('tab-network').onclick();f.addAppOpinion('network','network',3,'Mejorar el tamaño');
 assert.equal(f.fetches.length,0);await f.el('logout').onclick();assert.equal(f.fetches.length,0);
 assert.match(f.el('review-send-dialog').innerHTML,/único correo/);assert.doesNotMatch(f.el('review-send-dialog').innerHTML,/código de estudiante/);
 await f.el('review-preview-send').onclick();assert.equal(f.fetches.length,1);assert.ok(f.el('login-form'));
 const packet=JSON.parse(f.fetches[0].options.body);assert.equal(packet.recordCount,'3');assert.equal(JSON.parse(packet.feedback_json).records.length,3);
 assert.doesNotMatch(JSON.stringify(packet),/sourceSha256|studentId|amistad_recibida|Nombre|password/);
});

test('an offline app-feedback close retains all contributions and retries the identical mail',async()=>{
 const f=fixture({failSend:true});f.login('tutoria1eso');await f.upload();
 f.addAppOpinion('individual','cognitive',null,'La escala se ve pequeña','problem');
 await f.el('logout').onclick();await f.el('review-preview-send').onclick();assert.ok(f.el('report-content'));
 assert.match(f.el('close-status').children[0].textContent,/No se ha podido confirmar/);
 f.setFailSend(false);await f.el('logout').onclick();await f.el('review-preview-send').onclick();
 assert.equal(f.fetches.length,2);assert.equal(f.fetches[0].options.body,f.fetches[1].options.body);assert.ok(f.el('login-form'));
});
test('count navigation does not expand the selected classroom or expose the centre to tutoring',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();
 const button={dataset:{result:'bullying_companeros'}};
 f.el('report-content').listeners.click({target:{closest:selector=>selector==='button[data-result]'?button:null}});
 const html=f.el('report-content').innerHTML;
 assert.equal((html.match(/<tr data-student-id=/g)||[]).length,demo.students.filter(r=>r.Campus==='Centro 3705'&&r.Curso==='1.º ESO'&&r.Grupo==='A'&&r.bullying_companeros_n>=2).length);
 assert.match(html,/Reciben al menos 2 menciones de acoso/);
 assert.equal(f.el('tab-center'),undefined);
});

test('each bullying category opens the matching authorized list for tutoring and orientation',async()=>{
 const C=require('../src/core.js'),UI=require('../src/consultation-ui.js'),joined=C.validateAndJoin(demo.students,null,demo.groups);
 for(const username of ['tutoria1eso','orientacion']){
  const f=fixture();f.login(username);await f.upload();
  const isCenter=username==='orientacion';
  const members=joined.students.filter(r=>r.Campus==='Centro 3705'&&(isCenter||r.Curso==='1.º ESO'&&r.Grupo==='A'));
  for(const key of UI.bullyingDistribution(members).categories.map(c=>c.key)){
   f.el(isCenter?'tab-center':'tab-group').onclick();
   const button={dataset:{result:key}};
   f.el('report-content').listeners.click({target:{closest:s=>s==='button[data-result]'?button:null}});
   const html=f.el('report-content').innerHTML;
   const shown=[...html.matchAll(/<tr data-student-id="([^"]+)"/g)].map(m=>m[1]).sort();
   assert.deepEqual(shown,UI.filter(members,key).map(r=>r.ID).sort(),username+' '+key);
   assert.match(html,isCenter?/Lista del centro/:/Lista de aula/);
  }
  assert.equal(f.fetches.length,0);
 }
});


test('student list includes outgoing bullying, distinct one/two colours and equivalent mobile labels',async()=>{
 const f=fixture();f.login('demo','DEMO26');await f.el('load-demo').onclick();f.el('tab-roster').onclick();
 const html=f.el('report-content').innerHTML;
 assert.match(html,/Menciones de acoso declaradas/);assert.match(html,/data-roster-sort="bullying_out"/);assert.match(html,/roster-cell-label/);assert.match(html,/roster-sort-select/);
 assert.match(html,/class-value tone-single[^>]*>1</);assert.match(html,/class-value tone-danger[^>]*>[2-9]</);
 assert.match(html,/No respondió/);assert.doesNotMatch(html,/data-surprise/);
});

test('centre result lists identify every classroom and offer scoped search, without duplicating it in classroom lists',async()=>{
 const f=fixture();f.login('orientacion');await f.upload();f.el('tab-center').onclick();
 const button={dataset:{result:'bullying_companeros'}};
 f.el('report-content').listeners.click({target:{closest:selector=>selector==='button[data-result]'?button:null}});
 const centerHtml=f.el('report-content').innerHTML;
 assert.match(centerHtml,/Lista del centro/);assert.match(centerHtml,/id="roster-search"/);
 assert.doesNotMatch(f.el('filters').innerHTML,/id="course"|id="group"/);
 assert.match(centerHtml,/class="roster-class">4.º Primaria · Aula A/);
 assert.match(centerHtml,/class="roster-class">2.º Bachillerato · Aula C/);
 assert.equal((centerHtml.match(/class="roster-class"/g)||[]).length,(centerHtml.match(/<tr data-student-id=/g)||[]).length);
 f.el('center').onchange({target:{value:'Centro 3884'}});
 assert.match(f.el('report-content').innerHTML,/Lista del centro/);assert.match(f.el('report-content').innerHTML,/Centro 3884/);
 assert.doesNotMatch(f.el('filters').innerHTML,/id="course"|id="group"/);
 f.el('tab-roster').onclick();assert.doesNotMatch(f.el('report-content').innerHTML,/class="roster-class"/);
 assert.equal(f.fetches.length,0);
});


test('all five displayed categories open exact, disjoint lists in every demo classroom and centre',async()=>{
 const C=require('../src/core.js'),joined=C.validateAndJoin(demo.students,null,demo.groups),before=JSON.stringify(demo);
 const keys=['bullying_none','bullying_one_peer','bullying_self_only','bullying_multiple_peers','bullying_self_and_peers'];
 // Independent expected membership, checked against the rendered counts and actual click handlers.
 const expected=rows=>{
  const groups=Object.fromEntries(keys.map(key=>[key,[]]));
  for(const r of rows){
   const self=r.respondio!=='No'&&r.bullying_autorreporte==='Sí',peers=r.bullying_companeros_n??0;
   let i;if(self)i=peers>0?4:2;else i=peers>=2?3:peers===1?1:0;
   groups[keys[i]].push(r.ID);
  }
  return groups;
 };
 const f=fixture();f.login('orientacion');await f.upload();const evidence=[];
 const verify=(rows,scope)=>{
  const report=f.el('report-content').innerHTML,buckets=expected(rows),counts={},allIds=[];
  assert.doesNotMatch(report,/asignar categoría|bullying_unclassified/);
  for(const key of keys){
   const number=report.match(new RegExp('data-result="'+key+'"[^>]*><strong>([0-9]+)</strong>'));
   assert.ok(number,'Missing category button '+key);counts[key]=Number(number[1]);
   assert.equal(counts[key],buckets[key].length,scope+' '+key+' display');
   const button={dataset:{result:key}};
   f.el('report-content').listeners.click({target:{closest:s=>s==='button[data-result]'?button:null}});
   const html=f.el('report-content').innerHTML,ids=[...html.matchAll(/<tr data-student-id="([^"]+)"/g)].map(m=>m[1]);
   assert.deepEqual(ids.slice().sort(),buckets[key].slice().sort(),scope+' '+key+' membership');
   assert.equal(ids.length,counts[key]);assert.match(html,scope==='center'?/Lista del centro/:/Lista de aula/);
   assert.match(html,/<input id="roster-search"[^>]*value=""/,'The category opens unfiltered');
   allIds.push(...ids);f.el('clear-result').onclick();
   assert.match(f.el('report-content').innerHTML,scope==='center'?/Ficha de centro/:/Ficha de aula/);
  }
  assert.equal(new Set(allIds).size,rows.length);assert.deepEqual(allIds.sort(),rows.map(r=>r.ID).sort());
  assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),rows.length);
  evidence.push({scope,center:rows[0].Campus,course:scope==='group'?rows[0].Curso:null,classroom:scope==='group'?rows[0].Grupo:null,total:rows.length,counts,listsChecked:5,idsMatch:true});
 };
 for(const center of [...new Set(joined.students.map(r=>r.Campus))]){
  f.el('tab-center').onclick();f.el('center').onchange({target:{value:center}});
  const members=joined.students.filter(r=>r.Campus===center);verify(members,'center');
  for(const group of joined.groups.filter(g=>g.Campus===center)){
   f.el('tab-group').onclick();f.el('course').onchange({target:{value:group.Curso}});f.el('group').onchange({target:{value:group.Grupo}});
   verify(members.filter(r=>r.Curso===group.Curso&&r.Grupo===group.Grupo),'group');
  }
 }
 assert.equal(evidence.length,56);assert.equal(evidence.reduce((n,r)=>n+r.listsChecked,0),280);assert.equal(f.fetches.length,0);assert.equal(JSON.stringify(demo),before);
 const output={centers:2,classrooms:54,listsChecked:280,allPassed:true,syntheticDataOnly:true,results:evidence};
 if(process.env.PBIS_CATEGORY_AUDIT==='1')fs.writeFileSync(path.join(root,'test-results/relaunch/category-navigation-audit.json'),JSON.stringify(output,null,2));
});


test('nonempty one-peer and self-only lists work alongside missing self-reports in class and centre',async()=>{
 const data=structuredClone(demo);data.groups=[];
 const rows=data.students.filter(r=>r.Campus==='Centro 3705'&&r.Curso==='1.º ESO'&&r.Grupo==='A');
 const targets=rows.filter(r=>r.respondio!=='No').slice(0,5);
 const cases=[['No',0,'bullying_none'],['No',1,'bullying_one_peer'],['Sí',0,'bullying_self_only'],['No',2,'bullying_multiple_peers'],['Sí',1,'bullying_self_and_peers']];
 targets.forEach((r,i)=>Object.assign(r,{bullying_autorreporte:cases[i][0],bullying_companeros_n:cases[i][1]}));
 const absent=rows.find(r=>r.respondio==='No');absent.bullying_companeros_n=1;
 const f=fixture({data});f.login('orientacion');await f.upload();assert.equal(f.el('import-error').textContent,'');
 f.el('course').onchange({target:{value:'1.º ESO'}});f.el('group').onchange({target:{value:'A'}});
 for(const scope of ['group','center'])for(let i=0;i<cases.length;i++){
  f.el('tab-'+scope).onclick();const key=cases[i][2],report=f.el('report-content').innerHTML;
  const count=Number(report.match(new RegExp('data-result="'+key+'"[^>]*><strong>([0-9]+)</strong>'))[1]);assert.ok(count>0);
  const button={dataset:{result:key}};f.el('report-content').listeners.click({target:{closest:s=>s==='button[data-result]'?button:null}});
  const html=f.el('report-content').innerHTML,ids=[...html.matchAll(/<tr data-student-id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,count);assert.ok(ids.includes(targets[i].ID));
  for(let j=0;j<targets.length;j++)assert.equal(ids.includes(targets[j].ID),i===j);
  assert.equal(ids.includes(absent.ID),key==='bullying_one_peer','Nonresponse plus one peer is 1 (C)');
 }
 assert.equal(absent.bullying_autorreporte,null);assert.equal(absent.respondio,'No');assert.equal(f.fetches.length,0);
});


test('individual previous and next fully update the selected student within the authorized classroom',async()=>{
 const f=fixture();f.login('tutoria1eso');await f.upload();f.el('tab-student').onclick();
 const selected=()=>f.el('filters').innerHTML.match(/<select id="student">[\s\S]*?value="([^"]+)" selected/)?.[1];
 const first=selected();assert.ok(first);
 const initial=f.el('report-content').innerHTML;
 f.el('next-student').onclick();const next=selected();assert.ok(next);assert.notEqual(next,first);
 assert.notEqual(f.el('report-content').innerHTML,initial);assert.match(f.el('report-content').innerHTML,new RegExp('Código '+next));
 assert.ok(f.el('report-content').innerHTML.includes('student-network-details'));assert.doesNotMatch(f.el('report-content').innerHTML,/<details[^>]*\bopen\b/);
 const current=demo.students.find(r=>r.ID===next),original=demo.students.find(r=>r.ID===first);
 assert.equal(current.Campus,original.Campus);assert.equal(current.Curso,original.Curso);assert.equal(current.Grupo,original.Grupo);
 f.el('previous-student').onclick();assert.equal(selected(),first);assert.equal(f.el('report-content').innerHTML,initial);
 assert.equal(f.fetches.length,0);
});


test('downloads use the packaged universal ZIP only for the unified website',()=>{
 const normal=fixture(),unified=fixture({distribution:'universal'}),local=fixture({distribution:'universal',protocol:'file:'});
 assert.match(normal.el('root').innerHTML,/downloads\/PBIS-Windows.zip/);
 assert.match(unified.el('root').innerHTML,/downloads\/PBIS.zip/);
 assert.doesNotMatch(unified.el('root').innerHTML,/downloads\/PBIS-Windows.zip/);
 assert.match(local.el('root').innerHTML,/https:\/\/proyectopbis.github.io\/pbis-visualizador\/downloads\/PBIS-Windows.zip/);
});
