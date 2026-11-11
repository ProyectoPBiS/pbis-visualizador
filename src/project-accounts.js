/* Classroom account planning and portable downloads. No persistence or network. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./protected-project.js'),require('./core.js'));
 else root.PbisProjectAccounts=factory(root.PbisProtected,root.PbisCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(P,C){
 'use strict';
 const ascii=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const compact=value=>ascii(value).replace(/[^A-Z0-9]/g,'');
 function courseCode(value){
  const text=ascii(value),match=text.match(/^\s*(\d{1,2})\s*[.º°ª]*\s*(?:DE\s+)?(PRIMARIA|PRIM|ESO|BACHILLERATO|BACH)\s*$/);
  return match?match[1]+(match[2].startsWith('PRIM')?'PRIM':match[2].startsWith('BACH')?'BACH':'ESO'):compact(value)||'CURSO';
 }
 function plan(data,center){
  const rows=P.classes(data).filter(c=>c.center===center).sort((a,b)=>C.compareCourses(a.course,b.course)||a.group.localeCompare(b.group,'es',{numeric:true})||a.key.localeCompare(b.key));
  if(rows.length>249)throw Error('Este centro tiene más de 249 aulas. Reduce el archivo antes de generar accesos.');
  const used=new Set(['ORIENTACION','DEMO']);
  return rows.map(c=>{
   let base=(courseCode(c.course)+compact(c.group)).slice(0,52);
   if(/^\d{8}[A-Z]$/.test(base))base='AULA'+base;
   let username=base,index=2;while(used.has(username))username=base+'-'+index++;
   used.add(username);return {...c,username,allowed:[c.key],count:data.students.filter(r=>P.classKey(r)===c.key).length};
  });
 }
 function accounts(rows,canExportPdf,{orientationPassword='',previous=null}={}){
  if(!Array.isArray(rows)||!rows.length)throw Error('Selecciona al menos un aula para generar sus accesos.');
  if(typeof canExportPdf!=='boolean')throw Error('Revisa la opción de descarga PDF.');
  const retaining=!!previous?.accounts?.some(a=>a.username==='orientacion');
  if(!retaining&&!P.validPassword(orientationPassword,'orientador'))throw Error('Vuelve a entrar con tu cuenta de orientación antes de generar el proyecto.');
  const seen=new Set(),used=new Set(orientationPassword?[orientationPassword]:[]);
  const password=()=>{let pass;do{pass=P.password();}while(used.has(pass));used.add(pass);return pass;};
  const result=[{username:'orientacion',password:retaining?'':orientationPassword,accountType:'classroom',canExportPdf}];
  for(const row of rows){const username=P.normalizeUser(row.username);if(seen.has(username)||username==='orientacion')throw Error('Hay nombres de cuenta repetidos.');seen.add(username);result.push({username,password:password(),accountType:'classroom',allowed:[...row.allowed],canExportPdf});}
  return result;
 }
 function credentialsDocx({center,revision,accounts}){
  const xml=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const run=(text,props='')=>`<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
  const para=(text,style='Normal')=>`<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${run(text)}</w:p>`;
  const widths=[3200,1800,3100,1538];
  const row=(values,heading=false)=>`<w:tr><w:trPr><w:cantSplit/>${heading?'<w:tblHeader/>':''}</w:trPr>${values.map((value,i)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/>${heading?'<w:shd w:fill="F1EAE2"/>':''}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>${run(value,heading?'<w:b/>':i===1||i===2?'<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/>':'')}</w:p></w:tc>`).join('')}</w:tr>`;
  // Only classroom credentials are part of this document, never orientation.
  const teachers=accounts.filter(a=>a.username!=='orientacion'&&a.role!=='orientador');
  const table=`<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DED6CC"/><w:bottom w:val="single" w:sz="4" w:color="DED6CC"/><w:insideH w:val="single" w:sz="4" w:color="DED6CC"/></w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${row(['Aula','Usuario','Contraseña','Descargar PDF'],true)}${teachers.map(a=>row([a.allowed.map(k=>{const c=JSON.parse(k);return c[1]+' · Aula '+c[2];}).join(' / '),a.username,a.password,a.canExportPdf?'Sí':'No'])).join('')}</w:tbl>`;
  const header='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const body=para('Accesos de PBiS','Title')+para(center+' · Versión '+revision,'Subtitle')+para('Entrega a cada docente el acceso de su aula. Guarda este documento separado del archivo .pbis.')+para('Para entrar, abre PBiS, introduce tu usuario y contraseña y carga el archivo .pbis de esta versión. Respeta las mayúsculas y minúsculas de la contraseña.')+table+para('Al generar otra versión se renuevan las contraseñas de las aulas. Las copias anteriores conservan sus propios accesos.','Note');
  return zip([
   {name:'[Content_Types].xml',text:header+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
   {name:'_rels/.rels',text:header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
   {name:'word/document.xml',text:header+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1134" w:bottom="1000" w:left="1134" w:header="0" w:footer="0"/></w:sectPr></w:body></w:document>'},
   {name:'word/_rels/document.xml.rels',text:header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
   {name:'word/styles.xml',text:header+'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:color w:val="222222"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="260" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="42"/><w:color w:val="000000"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="200"/></w:pPr><w:rPr><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160" w:after="0"/></w:pPr><w:rPr><w:sz w:val="18"/><w:color w:val="555555"/></w:rPr></w:style></w:styles>'}
  ]);
 }
 // ZIP STORE: UTF-8 names, standard CRC-32, no dependency or OS-specific executable.
 function zip(files){
  const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;
  const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  function header(size){const bytes=new Uint8Array(size),v=new DataView(bytes.buffer);return {bytes,v};}
  for(const file of files){
   if(typeof file.name!=='string'||!file.name.split('/').every(part=>/^[A-Za-z0-9_\[\].-]+$/.test(part)&&part!=='.'&&part!=='..'))throw Error('Nombre de archivo no válido.');
   if(!(file.bytes instanceof Uint8Array)&&typeof file.text!=='string')throw Error('Contenido de archivo no válido.');
   const name=encoder.encode(file.name),data=file.bytes instanceof Uint8Array?file.bytes:encoder.encode(file.text),sum=crc(data),h=header(30+name.length);
   h.v.setUint32(0,0x04034b50,true);h.v.setUint16(4,20,true);h.v.setUint16(6,0x800,true);h.v.setUint16(12,33,true);h.v.setUint32(14,sum,true);h.v.setUint32(18,data.length,true);h.v.setUint32(22,data.length,true);h.v.setUint16(26,name.length,true);h.bytes.set(name,30);chunks.push(h.bytes,data);
   const c=header(46+name.length);c.v.setUint32(0,0x02014b50,true);c.v.setUint16(4,20,true);c.v.setUint16(6,20,true);c.v.setUint16(8,0x800,true);c.v.setUint16(14,33,true);c.v.setUint32(16,sum,true);c.v.setUint32(20,data.length,true);c.v.setUint32(24,data.length,true);c.v.setUint16(28,name.length,true);c.v.setUint32(42,offset,true);c.bytes.set(name,46);central.push(c.bytes);offset+=h.bytes.length+data.length;
  }
  const size=central.reduce((n,x)=>n+x.length,0),end=header(22);end.v.setUint32(0,0x06054b50,true);end.v.setUint16(8,files.length,true);end.v.setUint16(10,files.length,true);end.v.setUint32(12,size,true);end.v.setUint32(16,offset,true);
  const result=new Uint8Array(offset+size+22);let cursor=0;for(const part of [...chunks,...central,end.bytes]){result.set(part,cursor);cursor+=part.length;}return result;
 }
 function bundle(result,center,accounts){
  const base='PBIS_'+(compact(center).slice(0,50)||'CENTRO')+'_v'+result.revision;
  const files=[{name:base+'.pbis',text:result.text},{name:base+'_ACCESOS.docx',bytes:credentialsDocx({...result,center,accounts})}];
  return {name:base+'.zip',bytes:zip(files),files};
 }
 return Object.freeze({courseCode,plan,accounts,credentialsDocx,zip,bundle});
});
