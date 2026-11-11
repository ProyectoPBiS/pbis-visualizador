const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const accepted=()=>({ok:true,json:async()=>({ok:true})});
const script=fs.readFileSync('site-src/contact.js','utf8');
function setup(fetcher,options={}){
 let handler,resets=0,calls=[];const fields={nombre:{value:' Persona de prueba '},centro:{value:' Centro sintético '},email:{value:'test@example.invalid'},mensaje:{value:'Consulta técnica de prueba'}};
 const ack={checked:options.accept!==false},status={textContent:'',dataset:{},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}},button={disabled:false,textContent:'Enviar mensaje'};
 for(const el of [...Object.values(fields),ack]){el.focus=function(){this.focused=true};el.scrollIntoView=function(){this.scrolled=true};}
 const form={elements:{namedItem:n=>fields[n]},querySelector:q=>q==='[type="submit"]'?button:ack,addEventListener:(n,h)=>handler=h,reportValidity:()=>options.valid!==false,setAttribute(){},removeAttribute(){},reset(){resets++}};
 const context={document:{getElementById:id=>id==='contForm'?form:status},navigator:{onLine:options.online!==false},fetch:async(...args)=>{calls.push(args);return fetcher(...args)},AbortController,setTimeout,clearTimeout,TypeError};
 vm.runInNewContext(script,context);return {fields,ack,status,button,calls,get resets(){return resets},send:()=>handler({preventDefault(){}})};
}
test('contact: sends only form fields, waits for acceptance, then resets',async()=>{const f=setup(async()=>accepted());await f.send();assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'https://formspree.io/f/mvkgydrn');const b=JSON.parse(f.calls[0][1].body);assert.equal(b.email,'test@example.invalid');assert.equal(b.nombre,'Persona de prueba');assert.equal(b.message,'Consulta técnica de prueba');assert.deepEqual(Object.keys(b).sort(),['_subject','centro','consentimiento','email','message','nombre','tipo']);assert.equal(f.resets,1);assert.match(f.status.textContent,/Consulta enviada con éxito/);assert.equal(f.status.dataset.state,'success');assert.equal(f.status.focused,true);assert.equal(f.status.scrolled,true);});
test('contact: no success or reset on offline, server error or failed connection',async()=>{for(const mode of ['offline','http','network','timeout']){const f=setup(async()=>{if(mode==='network')throw new TypeError('failed');if(mode==='timeout'){const e=new Error('Timeout');e.name='AbortError';throw e;}return{ok:false,status:503}},{online:mode!=='offline'});await f.send();assert.equal(f.resets,0);assert.equal(f.fields.mensaje.value,'Consulta técnica de prueba');assert.doesNotMatch(f.status.textContent,/Consulta enviada/);assert.notEqual(f.status.dataset.state,'success');assert.equal(f.status.focused,true);assert.equal(f.button.disabled,false);if(mode==='offline')assert.equal(f.calls.length,0);}});
test('contact: retries explicitly and blocks double submit',async()=>{let resolve;const f=setup(()=>new Promise(r=>resolve=r));const pending=f.send();await f.send();assert.equal(f.calls.length,1);assert.notEqual(f.status.dataset.state,'success');assert.match(f.status.textContent,/Enviando/);resolve({ok:false,status:429});await pending;assert.match(f.status.textContent,/demasiadas/);const retry=f.send();assert.equal(f.calls.length,2);resolve(accepted());await retry;assert.equal(f.resets,1);});
test('contact: requires privacy acknowledgement and valid nonempty inputs',async()=>{for(const options of [{accept:false},{valid:false}]){const f=setup(async()=>accepted(),options);await f.send();assert.equal(f.calls.length,0);}const f=setup(async()=>accepted());f.fields.nombre.value='  ';await f.send();assert.equal(f.calls.length,0);});
test('portal: original sections and local dependencies, real destinations, no fake cookie storage',()=>{const h=fs.readFileSync('site/index.html','utf8'),js=fs.readFileSync('site/site.js','utf8'),off=fs.readFileSync('release/index.html','utf8');for(const id of ['programa','como','informes','centro','participar','faqs','contacto'])assert.match(h,new RegExp('id="'+id+'"'));assert.equal((h.match(/Tu área privada/g)||[]).length,1);assert.match(h,/DEMO.html#demo/);assert.doesNotMatch(h,/href="downloads\//);assert.doesNotMatch(js,/localStorage|sessionStorage|indexedDB/);assert.doesNotMatch(h,/fonts.googleapis|cdnjs.cloudflare|Texto orientativo|cookieBanner/);assert.match(off,/PBIS.html#demo/);assert.match(off,/data:font\/ttf;base64/);assert.match(off,/cookies y almacenamiento/i);assert.match(h,/name="email"/);assert.match(h,/https:\/\/formspree.io\/f\/mvkgydrn/);});


test('contact: HTTP success without explicit acceptance keeps the message and offers recovery',async()=>{
 for(const confirmation of [null,{}, {ok:false}]){
  const f=setup(async()=>({ok:true,json:async()=>confirmation}));await f.send();
  assert.equal(f.resets,0);assert.equal(f.fields.mensaje.value,'Consulta técnica de prueba');
  assert.match(f.status.textContent,/No hemos recibido confirmación/);assert.equal(f.status.focused,true);
  assert.equal(f.status.dataset.state,'error');assert.equal(f.button.disabled,false);
 }
 const f=setup(async()=>({ok:true,json:async()=>{throw Error('Invalid JSON')}}));await f.send();assert.equal(f.resets,0);
});

test('contact: whitespace-only field gets focus and never starts an upload',async()=>{
 const f=setup(async()=>accepted());f.fields.centro.value='  ';await f.send();
 assert.equal(f.fields.centro.focused,true);assert.equal(f.calls.length,0);assert.equal(f.resets,0);
});
