/* Contact is independent from the viewer: no student data or credentials. */
(function(){
  'use strict';
  const form=document.getElementById('contForm');if(!form)return;
  const status=document.getElementById('contact-status'),submit=form.querySelector('[type="submit"]');
  let sending=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||!form.reportValidity())return;
    const values=Object.fromEntries(['nombre','centro','email','mensaje'].map(name=>[name,form.elements.namedItem(name).value.trim()]));
    if(Object.values(values).some(value=>!value)){status.textContent='Completa todos los campos antes de enviar.';return;}
    if(!form.querySelector('#contact-privacy').checked){status.textContent='Lee y acepta la política de privacidad antes de enviar.';return;}
    if(navigator.onLine===false){status.textContent='No hay conexión. Conservamos tu mensaje en esta pantalla para que lo envíes cuando vuelva Internet.';return;}
    sending=true;submit.disabled=true;form.setAttribute('aria-busy','true');
    const original=submit.textContent;submit.textContent='Enviando…';status.textContent='Enviando tu consulta…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch('https://formspree.io/f/mvkgydrn',{
        method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},credentials:'omit',signal:controller.signal,
        body:JSON.stringify({tipo:'Contacto web PBIS',nombre:values.nombre,centro:values.centro,email:values.email,message:values.mensaje,consentimiento:'Acepta el uso de los datos de contacto para atender esta consulta.',_subject:'PBIS · Consulta de un centro'})
      });
      if(!response.ok)throw new Error(response.status===429?'El servicio ha recibido demasiadas solicitudes. Espera un momento y vuelve a intentarlo.':'No se ha podido enviar. Tu mensaje sigue en esta pantalla; puedes reintentarlo.');
      form.reset();status.textContent='Consulta enviada. Gracias por contactar con el equipo PBIS.';
    }catch(error){
      status.textContent=error.name==='AbortError'?'No hemos recibido confirmación del envío. Tu mensaje sigue aquí; comprueba la conexión antes de reintentarlo.':(error instanceof TypeError?'No hemos recibido confirmación. Revisa la conexión; tu mensaje sigue en esta pantalla.':error.message);
    }finally{clearTimeout(timer);sending=false;submit.disabled=false;submit.textContent=original;form.removeAttribute('aria-busy');}
  });
})();
