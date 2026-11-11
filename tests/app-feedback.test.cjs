'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/feedback-model.js');
const L=require('../src/linked-feedback.js');
const sessionCode=M.newId();
const input=extra=>({scope:'app',sessionCode,role:'tutor',sheet:'group',section:'wellbeing',kind:'opinion',rating:4,comment:'',version:'0.13.0',...extra});
const batch=opinions=>M.makeAppBatch({eventId:M.newId(),username:'1ESOA',role:'tutor',sessionCode,version:'0.13.0',opinions});
test('application feedback supports each view, optional voting, and requires a meaningful contribution',()=>{
 for(const sheet of Object.keys(M.views))for(const section of Object.keys(M.sections))assert.equal(M.makeAppOpinion(input({sheet,section})).section,section);
 assert.equal(M.makeAppOpinion(input({rating:null,kind:'improvement',comment:'Letras más grandes'})).rating,null);
 assert.throws(()=>M.makeAppOpinion(input({rating:null,comment:' '})),/valoración o escribe/);
 assert.throws(()=>M.makeAppOpinion(input({kind:'problem',comment:''})),/Describe/);
 for(const rating of [0,6,NaN,'4',undefined])assert.throws(()=>M.makeAppOpinion(input({rating})));
 for(const field of ['studentId','target','Nombre','password','values','sourceSha256'])assert.throws(()=>M.makeAppOpinion(input({[field]:'private'})),/campos no permitidos/);
});

test('participation reasons and app opinions share one email but keep separate structured records',()=>{
 const options={eventId:M.newId(),username:'1ESOA',role:'tutor',sessionCode,version:'0.13.0'};
 const row={respondio:'No',Nombre:'Nombre privado',password:'No enviar',bullying_companeros_n:4};
 const linkedBatch=L.create({...options,source:{sha256:'a'.repeat(64),sheet:'Datos'},roster:[{target:{center:'Centro 4826',course:'1.º ESO',group:'A',studentId:'00012',period:'Noviembre 2026'},values:row,reactions:{},confidence:null,nonParticipation:{reason:'absent_day',detail:''}}]});
 const opinion=M.makeAppOpinion(input({sheet:'network',section:'network',rating:null,comment:'Quiero ampliar la red.'}));
 const packet=M.makeSessionBatch({...options,linkedBatch,opinions:[opinion]});
 const result=JSON.parse(packet.feedback_json);
 assert.equal(result.schemaVersion,'pbis.session-feedback.v1');assert.equal(packet.recordCount,'2');
 assert.deepEqual(result.parts.map(p=>p.schemaVersion),['pbis.feedback.v2','pbis.app-feedback.v1']);
 assert.equal(result.parts[0].records[0].studentId,'00012');
 assert.equal(result.parts[0].records[0].nonParticipationReason,'absent_day');
 assert.equal(result.parts[0].records[0].observedValue,null);
 assert.equal(result.parts[1].records[0].rating,null);
 assert.match(packet.message,/Ausencia el día de la encuesta/);assert.match(packet.message,/Quiero ampliar la red/);
 assert.doesNotMatch(packet.feedback_json,/Nombre privado|No enviar|bullying_companeros_n/);
 assert.equal(M.makeSessionBatch({...options,linkedBatch,opinions:[]}),linkedBatch);
 assert.equal(M.makeSessionBatch({...options,opinions:[opinion]}).schemaVersion,'pbis.app-feedback.v1');
 assert.throws(()=>M.makeSessionBatch({...options,username:'other',linkedBatch,opinions:[opinion]}),/sesión/);
});
test('one readable mail and a compact structured envelope preserve section, kind, zero votes and Unicode',()=>{
 const opinions=[M.makeAppOpinion(input({comment:'Útil 👍'})),M.makeAppOpinion(input({sheet:'individual',section:'network',rating:null,kind:'improvement',comment:'Poder ampliar las flechas.'}))];
 const packet=batch(opinions),data=JSON.parse(packet.feedback_json);
 assert.equal(packet.recordCount,'2');assert.equal(data.records.length,2);
 assert.match(packet.message,/Aula · Bienestar/);assert.match(packet.message,/Ficha de estudiante · Red de relaciones/);
 assert.match(packet.message,/Utilidad: 4\/5/);assert.doesNotMatch(packet.message,/null\/5|undefined/);
 assert.deepEqual(data.records,opinions);assert.equal(data.username,'1ESOA');
 assert.equal(data.schemaVersion,'pbis.app-feedback.v1');
 assert.doesNotMatch(packet.feedback_json,/studentCode|classCode|sourceSha256|observedValue|password/);
 assert.throws(()=>batch([opinions[0],opinions[0]]),/duplicada/);
 assert.throws(()=>batch([M.makeAppOpinion(input({sessionCode:M.newId()}))]),/sesión/);
});
