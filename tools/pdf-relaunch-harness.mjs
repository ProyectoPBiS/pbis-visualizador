import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=path.join(root,'test-results/relaunch');
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'release/PBIS.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const last=scripts.at(-1)[0];
const harness=`
(async()=>{
 const status=document.getElementById('test-status');
 try {
  window.fetch=()=>{throw Error('La prueba no permite conexiones.');};
  const data=PbisCore.validateAndJoin(PBIS_DEMO_DATA.students,null,PBIS_DEMO_DATA.groups);
  const selection={center:'Centro 3705',course:'1.º ESO',group:'A',student:'00253'};
  const rows=data.students.filter(r=>r.Campus===selection.center&&r.Curso===selection.course&&r.Grupo==='A');
  document.getElementById('test-network').innerHTML=PbisClassNetwork.view(rows);
  const network=PbisPdf.snapshotNetwork(document.querySelector('.class-network-svg'),'group');
  const report=PbisPdf.model({view:'group',selection,students:rows,groups:data.groups,identity:PbisPdf.identity({demo:true})});
  const blob=await PbisPdf.generate(report,{network,password:'12345678Z'});
  const link=document.getElementById('test-download');link.href=URL.createObjectURL(blob);link.download='PBIS-prueba-identidad.pdf';link.hidden=false;
  status.textContent='CORRECTO: PDF generado con logo, red de comunidades, marca DATOS SIMULADOS y cifrado. '+blob.size+' bytes. Sin conexiones externas.';
 }catch(error){status.textContent='ERROR: '+error.message;}
})();
`.replaceAll('</script','<\\/script');
html=html.replace(last,'<script>'+harness+'</script>');
const scriptHash=createHash('sha256').update(harness).digest('base64');
html=html.replace("script-src 'wasm-unsafe-eval'","script-src 'wasm-unsafe-eval' 'sha256-"+scriptHash+"'");
html=html.replace('<div id="root"></div>','<main style="padding:30px"><h1>Prueba técnica local · Datos simulados</h1><p id="test-status">Generando PDF…</p><a id="test-download" hidden>Descargar PDF de prueba</a><div id="test-network"></div></main>');
fs.writeFileSync(path.join(out,'pdf-prueba.html'),html);
console.log('Harness PDF preparado solo en test-results/relaunch.');


