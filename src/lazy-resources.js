/* Static program resources only. Imported files and credentials never enter this cache. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports={create:factory};
  else root.PbisResources=factory(root);
})(typeof window==='undefined'?globalThis:window,function(root){
  'use strict';
  const pending=new Map(),embedded={parser:'PBIS_PARSER',pdf:'PBIS_PDF_CRYPTO_WORKER'};
  function worker(kind){
    if(!Object.hasOwn(embedded,kind))return Promise.reject(Error('Recurso de la aplicación no disponible.'));
    // Downloaded HTML remains self-contained, including when opened with file://.
    if(typeof root[embedded[kind]]==='string'&&root[embedded[kind]])return Promise.resolve(root[embedded[kind]]);
    if(pending.has(kind))return pending.get(kind);
    const entry=root.PBIS_WORKER_ASSETS?.[kind];
    if(!entry||!new RegExp('^assets/workers/'+kind+'\\.[a-f0-9]{12}\\.js$').test(entry.url)||!/^sha256-[A-Za-z0-9+/]{43}=$/.test(entry.integrity))return Promise.reject(Error('Recurso de la aplicación no disponible. Recarga la página.'));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
    const loading=Promise.resolve().then(()=>root.fetch(entry.url,{
      integrity:entry.integrity,credentials:'omit',redirect:'error',cache:'force-cache',signal:controller.signal
    })).then(response=>{
      if(!response.ok)throw Error('Resource unavailable');
      return response.text();
    }).catch(()=>{
      pending.delete(kind);
      throw Error('No se ha podido cargar una herramienta de la aplicación. Comprueba la conexión y vuelve a intentarlo.');
    }).finally(()=>clearTimeout(timer));
    pending.set(kind,loading);
    return loading;
  }
  return Object.freeze({worker});
});
