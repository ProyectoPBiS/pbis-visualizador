const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../src/lazy-resources.js');
const integrity='sha256-'+Buffer.alloc(32).toString('base64');
const entry={url:'assets/workers/parser.abcdef123456.js',integrity};

test('offline resources never fetch, and the caller can replace an embedded worker',async()=>{
  const root={PBIS_PARSER:'embedded',PBIS_PDF_CRYPTO_WORKER:'pdf',fetch(){throw Error('Unexpected network');}};
  const loader=create(root);
  assert.equal(await loader.worker('parser'),'embedded');
  assert.equal(await loader.worker('pdf'),'pdf');
  root.PBIS_PDF_CRYPTO_WORKER='replacement';assert.equal(await loader.worker('pdf'),'replacement');
});

test('concurrent requests share one verified static fetch and successful source is reused',async()=>{
  const calls=[];
  const loader=create({PBIS_WORKER_ASSETS:{parser:entry},fetch:async(url,options)=>{
    calls.push({url,options});return {ok:true,text:async()=> 'worker source'};
  }});
  assert.deepEqual(await Promise.all([loader.worker('parser'),loader.worker('parser')]),['worker source','worker source']);
  await loader.worker('parser');assert.equal(calls.length,1);
  assert.equal(calls[0].url,entry.url);assert.equal(calls[0].options.integrity,integrity);
  assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.redirect,'error');
  assert.equal(calls[0].options.body,undefined);
});

test('failed worker fetch is not cached and can be retried',async()=>{
  let tries=0;
  const loader=create({PBIS_WORKER_ASSETS:{parser:entry},fetch:async()=>{
    if(++tries===1)throw Error('offline');return {ok:true,text:async()=> 'source'};
  }});
  await assert.rejects(loader.worker('parser'),/Comprueba la conexión/);
  assert.equal(await loader.worker('parser'),'source');assert.equal(tries,2);
});

test('HTTP errors, unknown workers, external URLs and missing integrity fail closed',async()=>{
  for(const invalid of [{...entry,url:'https://other.invalid/parser.js'},{...entry,url:'../parser.abcdef123456.js'},{...entry,integrity:''}]){
    let fetched=false;
    const loader=create({PBIS_WORKER_ASSETS:{parser:invalid},fetch:async()=>{fetched=true;}});
    await assert.rejects(loader.worker('parser'),/Recurso/);assert.equal(fetched,false);
  }
  const loader=create({PBIS_WORKER_ASSETS:{parser:entry},fetch:async()=>({ok:false})});
  await assert.rejects(loader.worker('parser'),/Comprueba la conexión/);
  await assert.rejects(loader.worker('anything'),/Recurso/);
});
