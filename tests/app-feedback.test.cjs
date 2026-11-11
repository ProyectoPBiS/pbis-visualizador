'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/feedback-model.js');
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
