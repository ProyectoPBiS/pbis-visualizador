// Synthetic answers only. Deliberately distinguish absent cells, zero and No.
const C=require('../src/core.js');
function data(kind){
 const students=Array.from({length:4},(_,i)=>{
  const row=Object.fromEntries([...C.SCORE_COLUMNS,...C.COUNT_COLUMNS,'bullying_autorreporte'].map(field=>[field,null]));
  Object.assign(row,{ID:'PRUEBA'+(i+1),Centro:'Centro de prueba',Curso:'1.º ESO',Grupo:i<2?'A':'B',Nombre:'Prueba '+(i+1),respondio:'Sí'});
  if(kind==='empty'||(kind==='mixed'&&i>=2))return {...row,respondio:'No'};
  if(kind==='partial')return {...row,bullying_autorreporte:'No',crt_carrera_acierto:0,felicidad_soledad:0};
  for(const field of C.COUNT_COLUMNS)row[field]=0;
  Object.assign(row,{bullying_autorreporte:'No',mediacion_negativa_n:0,popularidad_reportada_n:0,centralidad_reportada_n:0,
   felicidad_centro:0,felicidad_diversion:0,felicidad_soledad:4,crt_aciertos:0,crt_carrera_acierto:0,crt_emilia_acierto:0,crt_biblioteca_acierto:0,
   amistad_clase_declarada_n:0,rechazo_clase_declarada_n:0,amistad_clase_reciproca_n:0});
  return row;
 });
 return C.validateAndJoin(students,null,[]);
}
module.exports={data};
