'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const UI=require('../src/consultation-ui.js');
test('headline bases: only completed self-reports, but two total nominations include everyone and self once',()=>{
 const rows=[
  {ID:'a',respondio:'Sí',bullying_autorreporte:'Sí',bullying_companeros_n:0},
  {ID:'b',respondio:'Sí',bullying_autorreporte:'Sí',bullying_companeros_n:1},
  {ID:'c',respondio:'Sí',bullying_autorreporte:'No',bullying_companeros_n:1},
  {ID:'d',respondio:null,bullying_autorreporte:'Sí',bullying_companeros_n:1},
  {ID:'e',respondio:'No',bullying_autorreporte:null,bullying_companeros_n:2},
  {ID:'f',respondio:'No',bullying_autorreporte:null,bullying_companeros_n:0}
 ];
 const h=UI.bullyingHighlights(rows);
 assert.deepEqual(h.bullying_self_completed,{count:2,denominator:3,percent:200/3});
 assert.deepEqual(h.bullying_two_total,{count:3,denominator:6,percent:50});
 assert.deepEqual(UI.filter(rows,'bullying_self_completed').map(r=>r.ID),['a','b']);
 assert.deepEqual(UI.filter(rows,'bullying_two_total').map(r=>r.ID),['b','d','e']);
});
test('missing observations do not appear as an observed zero; completed base does not exclude missing self answers',()=>{
 assert.equal(UI.bullyingHighlights([]).bullying_self_completed.percent,null);
 const missing=UI.bullyingHighlights([{ID:'x',respondio:null}]);
 assert.equal(missing.bullying_two_total.count,null);
 const rows=[{respondio:'Sí',bullying_autorreporte:'Sí',bullying_companeros_n:0},{respondio:'Sí',bullying_autorreporte:null,bullying_companeros_n:0}];
 assert.deepEqual(UI.bullyingHighlights(rows).bullying_self_completed,{count:1,denominator:2,percent:50});
});
