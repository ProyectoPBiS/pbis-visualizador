const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../src/project-accounts.js'),P=require('../src/protected-project.js'),C=require('../src/core.js'),F=require('./protected-fixture.cjs'),PDF=require('../src/pdf-export.js');
test('automatic usernames cover stages, PDC, university initials, collisions and stable scopes',()=>{
 const labels=[['1.º ESO','A'],['4.º Primaria','B'],['2.º Bachillerato','C'],['3ºESO','PDCI'],['4.º ESO','PDC II'],['ADE1','A'],['PSI2','B'],['1.º ESO','A-'],['1.º ESO','Á']];
 const data={students:labels.map(([Curso,Grupo],i)=>({ID:''+i,Centro:'Centro X',Curso,Grupo}))};
 const rows=A.plan(data,'Centro X');assert.equal(new Set(rows.map(r=>r.username)).size,labels.length);
 for(const user of ['1ESOA','4PRIMB','2BACHC','3ESOPDCI','4ESOPDCII','ADE1A','PSI2B'])assert.ok(rows.some(r=>r.username===user),user);
 assert.deepEqual(A.plan({students:[...data.students].reverse()},'Centro X'),rows);
 assert.deepEqual(A.plan(data,'Otro centro'),[]);assert.ok(rows.every(r=>r.allowed.length===1&&r.allowed[0]===r.key));
 assert.equal(A.courseCode('4.º de Primaria'),'4PRIM');assert.equal(A.courseCode('2º Bachillerato'),'2BACH');
});
test('real synthetic workbook is parsed: 27 accounts per centre without hardcoded groups',()=>{
 const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../vendor/xlsx.full.min.js'),'utf8'),sandbox);
 const book=sandbox.XLSX.read(fs.readFileSync(require.resolve('../data/examples/datos_evaluacion.xlsx')),{type:'buffer'});
 const data=JSON.parse(JSON.stringify(sandbox.XLSX.utils.sheet_to_json(book.Sheets.Datos))),groups=JSON.parse(JSON.stringify(sandbox.XLSX.utils.sheet_to_json(book.Sheets.Grupos)));
 const valid=C.validateAndJoin(data,null,groups);
 for(const center of ['Sevilla','Córdoba']){const rows=A.plan(valid,center);assert.equal(rows.length,27);assert.equal(rows[0].username,'4PRIMA');assert.equal(rows.at(-1).username,'2BACHC');assert.ok(rows.some(r=>r.username==='1ESOA'));assert.ok(rows.every(r=>r.count===28));}
});
test('encrypted classroom accounts isolate data and rotate teachers while retaining orientation and global PDF choice',async()=>{
 const data=F.data(),center='Centro 4826',rows=A.plan(data,center),accounts=A.accounts(rows,true,{orientationPassword:'FRJ508'});
 assert.equal(accounts.length,3);assert.equal(new Set(accounts.map(a=>a.password)).size,3);assert.ok(accounts.every(a=>P.validPassword(a.password,a.username==='orientacion'?'orientador':'tutor')));
 const built=await P.build({data,center,accounts});
 for(const a of accounts){const open=await P.open(built.text,a.username.toLowerCase(),a.password);assert.equal(open.grant.canExportPdf,true);assert.equal(open.grant.accountType,'classroom');assert.equal(open.grant.maskedDni,'');
  const expected=a.username==='orientacion'?data.students:data.students.filter(r=>a.allowed.includes(P.classKey(r)));
  assert.deepEqual(open.data.students.map(r=>r.ID),expected.map(r=>r.ID));
  for(const row of open.data.students){const original=data.students.find(r=>r.ID===row.ID);for(const field of [...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,'centralidad_eigenvector'])assert.equal(row[field],original[field]);assert.ok(row.relaciones_red.every(l=>expected.some(r=>r.ID===l.id)));}
  assert.equal(P.watermarkLabel(open.grant),a.username==='orientacion'?'':a.username);
  assert.ok(!built.text.includes(a.password));assert.ok(!JSON.stringify(built.manifest).includes(a.password));
 }
 const mark=PDF.identity({role:'tutor',protectedProject:true,accountName:'1ESOA',sessionCode:'abcdefgh-1234'});assert.equal(mark.watermark,'1ESOA · abcdefgh');
 assert.throws(()=>PDF.identity({role:'tutor',protectedProject:true,accountName:'12345678Z',sessionCode:'abc'}),/marca/);
 const admin=await P.open(built.text,'orientacion',accounts[0].password),nextAccounts=A.accounts(rows.slice(0,1),false,{previous:admin.admin});
 const next=await P.build({data:admin.admin.data,center,accounts:nextAccounts,previous:admin.admin});
 assert.equal(nextAccounts[0].password,'');
 assert.equal((await P.open(next.text,'orientacion',accounts[0].password)).data.students.length,6);
 await assert.rejects(P.open(next.text,accounts[2].username,accounts[2].password),/incorrectos/);
 for(const a of nextAccounts)assert.equal((await P.open(next.text,a.username,a.password||accounts[0].password)).grant.canExportPdf,false);
 const full=await P.open(next.text,'orientacion',accounts[0].password);assert.equal(full.data.students.length,6);assert.equal(next.revision,2);
});
function unzip(value){let offset=0;const entries=new Map(),bytes=Buffer.from(value);while(bytes.readUInt32LE(offset)===0x04034b50){assert.equal(bytes.readUInt16LE(offset+6),0x800);assert.equal(bytes.readUInt16LE(offset+8),0);const size=bytes.readUInt32LE(offset+18),n=bytes.readUInt16LE(offset+26),start=offset+30+n;entries.set(bytes.subarray(offset+30,start).toString(),bytes.subarray(start,start+size));offset=start+size;}assert.equal(bytes.readUInt32LE(offset),0x02014b50);assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50);return entries;}
test('portable ZIP contains project and genuine DOCX with only classroom credentials',async()=>{
 const data=F.data(),center='Centro 4826',accounts=A.accounts(A.plan(data,center),false,{orientationPassword:'FRJ508'}),built=await P.build({data,center,accounts});
 const pack=A.bundle(built,center,accounts);assert.equal(pack.files.length,2);assert.ok(pack.files[0].name.endsWith('.pbis'));assert.ok(pack.files[1].name.endsWith('_ACCESOS.docx'));
 const outer=unzip(pack.bytes);assert.equal(outer.size,2);assert.equal(outer.get(pack.files[0].name).toString(),built.text);assert.deepEqual(outer.get(pack.files[1].name),Buffer.from(pack.files[1].bytes));
 const docx=unzip(pack.files[1].bytes),xml=docx.get('word/document.xml').toString(),all=[...docx.values()].map(x=>x.toString()).join('\n');
 assert.ok(docx.has('[Content_Types].xml'));assert.ok(docx.has('_rels/.rels'));assert.ok(docx.has('word/styles.xml'));assert.match(xml,/<w:tblHeader\/>/);assert.equal((xml.match(/<w:tr>/g)||[]).length,accounts.length);
 assert.doesNotMatch(all,/orientacion|FRJ508|La marca identifica|<w:altChunk|TargetMode="External"/);
 for(const a of accounts.slice(1)){assert.ok(xml.includes('>'+a.username+'</w:t>'));assert.ok(xml.includes('>'+a.password+'</w:t>'));assert.equal((await P.open(pack.files[0].text,a.username,a.password)).grant.username,a.username);}
 assert.throws(()=>A.zip([{name:'../x',text:'x'}]),/Nombre/);assert.throws(()=>A.zip([{name:'a.docx',bytes:'wrong'}]),/Contenido/);
 assert.throws(()=>A.accounts([],false),/Selecciona/);assert.throws(()=>A.accounts(A.plan(data,center),false),/orientación/);
});
test('custom orientation password survives renewal and never appears in the Word file',async()=>{
 const data=F.data(),center='Centro 4826',rows=A.plan(data,center),accounts=A.accounts(rows,true,{orientationPassword:'Nutria42Leon'}),built=await P.build({data,center,accounts});
 const original=await P.open(built.text,'orientacion','Nutria42Leon');
 const nextAccounts=A.accounts(rows,false,{previous:original.admin}),next=await P.build({data:original.admin.data,center,accounts:nextAccounts,previous:original.admin});
 const opened=await P.open(next.text,'orientacion','Nutria42Leon');assert.equal(opened.data.students.length,6);assert.equal(opened.grant.canExportPdf,false);
 await assert.rejects(P.open(next.text,'orientacion','FRJ508'),/incorrectos/);
 for(const result of [A.bundle(built,center,accounts),A.bundle(next,center,nextAccounts)])assert.doesNotMatch([...unzip(result.files[1].bytes).values()].map(x=>x.toString()).join(''),/Nutria42Leon|orientacion/);
 assert.equal((await P.open(built.text,accounts[1].username,accounts[1].password)).data.students.length,3);
 await assert.rejects(P.open(next.text,accounts[1].username,accounts[1].password),/incorrectos/);
});
test('Word escapes imported classroom text and preserves all rows in large projects',()=>{
 const accounts=[{username:'orientacion',password:'SECRETO'},{username:'1ESOA',password:'Toro05Leon',allowed:[JSON.stringify(['X','Curso & <Nombre>','A'])],canExportPdf:true}];
 const xml=unzip(A.credentialsDocx({center:'Centro <Prueba> & Córdoba',revision:1,accounts})).get('word/document.xml').toString();
 assert.match(xml,/Centro &lt;Prueba&gt; &amp; Córdoba/);assert.match(xml,/Curso &amp; &lt;Nombre&gt;/);assert.doesNotMatch(xml,/SECRETO|orientacion/);
 const many=Array.from({length:249},(_,i)=>({...accounts[1],username:'AULA'+i}));const large=unzip(A.credentialsDocx({center:'Prueba',revision:1,accounts:many})).get('word/document.xml').toString();assert.equal((large.match(/<w:tr>/g)||[]).length,250);assert.equal((large.match(/<w:cantSplit\/>/g)||[]).length,250);
});
