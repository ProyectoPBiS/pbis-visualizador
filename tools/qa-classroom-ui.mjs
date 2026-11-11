/* Isolated local UI check. Only acknowledgement copy is replaced by non-contractual
 * test labels; application handlers, encryption, parsing and downloads are unchanged. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'.qa/classroom-ui');
await fs.mkdir(dir,{recursive:true});let html=await fs.readFile(path.join(root,'release/PBIS.html'),'utf8');
const before=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const source of before){
 if(!source.includes('window.PBIS_TERMS_TEXT='))continue;
 const next=source.replace(/window.PBIS_TERMS_TEXT=.*?;\n/,"window.PBIS_TERMS_TEXT='PRUEBA LOCAL CON DATOS SINTÉTICOS. No constituye aceptación contractual.';\n")
  .replace('He leído y acepto las condiciones de uso. Cuento con autorización para consultar los datos.','Confirmar entrada de prueba con datos sintéticos.')
  .replace('He revisado las aulas y los permisos. Entregaré cada acceso solo a su destinatario.','Confirmar aulas de prueba y permisos simulados.')
  .replace('Custodiaré este informe y lo compartiré solo con personas autorizadas.','Confirmar exportación de prueba con datos sintéticos.');
 html=html.replace(source,()=>next).replace(createHash('sha256').update(source).digest('base64'),createHash('sha256').update(next).digest('base64'));
}
await fs.writeFile(path.join(dir,'PBIS.html'),html);
console.log('Copia aislada de comprobación preparada en .qa/classroom-ui/PBIS.html');
