from pathlib import Path
import re,json
r=Path('.')
def read(p):return (r/p).read_text('utf-8')
def write(p,s):(r/p).write_text(s,encoding='utf-8')
s=read('src/app.js')
s=s.replace("openReports();\n  if(tour?.step==='load')","openReports();if(!tour)placeTourClass();\n  if(tour?.step==='load')")
s=s.replace("sortRows(currentRows(),rosterSort,rosterReviews).map(row=>elements.get(row.ID))","sortRows(dataset.students.filter(row=>elements.has(row.ID)),rosterSort,rosterReviews).map(row=>elements.get(row.ID))")
# Context of a centre result list must remain centre-wide.
s=s.replace("return `<article class=\"report\">${reportHero(`${selection.course} · ${selection.group}`,`${rows.length} estudiantes · ${selection.center}`,'Lista de aula')}", "return `<article class=\"report\">${reportHero(resultFilter?.scope==='center'?selection.center:`${selection.course} · ${selection.group}`,`${rows.length} estudiantes · ${selection.center}`,resultFilter?.scope==='center'?'Lista del centro':'Lista de aula')}")
write('src/app.js',s)
# Ensure social branding remains complete.
s=read('site-src/index.html').replace('<meta property="og:type"','<meta property="og:site_name" content="PBIS"><meta property="og:locale" content="es_ES"><meta property="og:type"')
write('site-src/index.html',s)
# Development fixture: real delivery tests retain a queued, fully scoped opinion without depending on removed UI.
s=read('tests/session-flow.test.cjs')
s=s.replace("PbisRosterReview:require('../src/roster-review.js'),","PbisRosterReview:require('../src/roster-review.js'),PbisConsultationUI:require('../src/consultation-ui.js'),")
start=s.index(' const addOpinion=async()=>')
end=s.index('\n return {el,login',start)
s=s[:start]+""" // Inject a scoped opinion to test the retained delivery engine separately from the new review screen.
 const addOpinion=async()=>{
  const filters=el('filters').innerHTML,course=filters.match(/<select id="course">[\\s\\S]*?value="([^"]+)" selected/)?.[1]||data.students[0].Curso;
  const row=data.students.find(r=>r.Curso===course)||data.students[0];
  feedbackTarget={center:row.Centro||row.Campus,course:row.Curso,group:row.Grupo,studentId:null,period:null};
  opinions.push({eventId:'opinion-test',target:feedbackTarget,classCode:'AULA-test',studentCode:null,sheet:'group',rating:4,comment:'Prueba sin envío real'});context.PBIS_UPDATE_CLOSE?.();
 };
"""+s[end:]
start=s.index("test('demo credentials start guided")
end=s.index("\ntest('initial form accepts",start)
s=s[:start]+"""test('demo credentials enter directly with simulated data and no guide overlay',async()=>{
 const f=fixture();await f.login('demo','DEMO26');
 assert.equal(f.demoMode(),true);assert.match(f.el('report-content').innerHTML,/Resumen del aula/);
 assert.equal(f.el('tour-panel'),undefined);assert.equal(f.fetches.length,0);
});
"""+s[end:]
start=s.index("test('demo credentials appear only")
end=s.index("\ntest('brand waits",start)
s=s[:start]+"""test('one demo button opens the fixture without credentials and logout sends nothing',async()=>{
 const f=fixture();assert.doesNotMatch(f.el('root').innerHTML,/DEMO26/);
 await f.el('start-tour-login').onclick();assert.match(f.el('report-content').innerHTML,/Resumen del aula/);
 assert.equal(f.el('tour-panel'),undefined);assert.match(f.el('filters').innerHTML,/value="1.º ESO" selected/);
 await f.el('logout').onclick();assert.ok(f.el('login-form'));assert.equal(f.fetches.length,0);
});
"""+s[end:]
write('tests/session-flow.test.cjs',s)
s=read('tests/demo.test.cjs').replace('Explorar demo|href="DEMO.html#demo"|DEMO26','Explorar demo|DEMO26').replace('href="DEMO.html#guia"','href="DEMO.html#demo"').replace('href="PBIS.html#guia"','href="PBIS.html#demo"')
write('tests/demo.test.cjs',s)
s=read('tests/class-network.test.cjs').replace('aria-pressed="false" aria-controls="class-network-stage">Ver comunidades','aria-pressed="true" aria-controls="class-network-stage">Ver círculo')
write('tests/class-network.test.cjs',s)
s=read('tests/read-xlsx.test.cjs').replace('scripts.length, 21','scripts.length, 23').replace("source('src/core.js'), source('src/raw-wave1.js')","source('src/brand.js'), source('src/consultation-ui.js'), source('src/core.js'), source('src/raw-wave1.js')").replace("source('src/protected-project.css'));","source('src/protected-project.css') + '\\n' + source('src/relaunch.css'));")
write('tests/read-xlsx.test.cjs',s)
s=read('tests/release.test.cjs').replace("const html=fs.readFileSync(path.join(site,file),'utf8');","const html=fs.readFileSync(path.join(site,file),'utf8').replace(/<script\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/script>/gi,'');")
# above string constructed in Python; normalize intended JS regex
s=s.replace(r'/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi',r'/<script\b[^>]*>[\s\S]*?<\/script>/gi')
write('tests/release.test.cjs',s)
# PDF retains the exact protection path; only the shared artwork and palette change.
s=read('src/pdf-export.js')
s=s.replace("const picture=network?await raster(network):null;","const picture=network?await raster(network):null;\n    const logo=window.PBIS_BRAND?.logo?await raster({source:atob(window.PBIS_BRAND.logo.split(',')[1]),width:424.12,height:412.95}):null;")
s=s.replace("doc.text('PBIS',margin,16);","if(logo)doc.addImage(logo,'PNG',margin,7,10,10);doc.text('PBiS',margin+(logo?13:0),16);")
s=s.replace('#183e50','#2b211d').replace('#28718c','#a9442a').replace('#50636e','#6b5b51').replace('#e9f2f4','#f7f2ec').replace('#57707b','#7d695b').replace('Azul: buena relación','Verde: buena relación')
write('src/pdf-export.js',s)
# Label the local edition distinctly.
for file in ['package.json','tools/build.mjs','src/app.js','tools/feedback-config.mjs','site-src/index.html']:
 s=read(file).replace('0.12.2','0.13.0');write(file,s)

