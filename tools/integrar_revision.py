from pathlib import Path
import re,base64,json
r=Path(__file__).resolve().parents[1]
a=r.parent
def read(p):return (r/p).read_text('utf-8')
def write(p,s):(r/p).write_text(s,encoding='utf-8')
src=read('src/app.js')
src=src.replace("let demoSession=false,closeDestination='login';","let demoSession=false,closeDestination='login';\nlet resultFilter=null,reviewMessage='',studentOrigin='roster';")
src=re.sub(r"const brand=\(\)=>[^\n]+", 'const brand=()=>`<button class="brand brand-home" type="button" aria-label="PBIS: cerrar sesión y volver al inicio"><img src="${window.PBIS_BRAND.logo}" alt=""><span>PBiS</span></button>`;',src)
src=src.replace("document.getElementById('usage-terms-dialog')?.close();pdfAccountDni", "resultFilter=null;reviewMessage='';studentOrigin='roster';document.getElementById('usage-terms-dialog')?.close();pdfAccountDni")
src=src.replace("if(isDemoEntry())return enterDemo(true);","if(isDemoEntry())return enterDemo(false);")
src=src.replace("document.getElementById('start-tour-login').onclick=startTour;","document.getElementById('start-tour-login').onclick=()=>enterDemo(false);")
src=src.replace("if(hasDemo&&['#demo','#guia'].includes(window.location?.hash))startTour();","if(hasDemo&&['#demo','#guia'].includes(window.location?.hash))enterDemo(false);")
old_demo='${hasDemo?`<div class="demo-access"><button id="start-tour-login" class="btn" type="button">Comenzar práctica guiada →</button></div>`:\'\'}'
assert old_demo in src
src=src.replace(old_demo,'')
src=src.replace('</button></form><p class="login-note">','</button></form>${hasDemo?`<div class="demo-access"><p>¿No tienes contraseña?</p><button id="start-tour-login" class="btn secondary" type="button">Pulsa aquí para hacer una demo →</button></div>`:\'\'}<p class="login-note">',1)
src=src.replace('Cada vínculo<br>cuenta.','Entender las relaciones.<br>Cuidar el grupo.')
src=src.replace('Edición de evaluación · 0.12.2','Consulta local')
src=src.replace('Usuario o DNI<input id="username"','Usuario<input id="username"')
src=src.replace('<div class="tabs" role="tablist" aria-label="Tipo de ficha">','<nav class="tabs" role="tablist" aria-label="Consultas" aria-orientation="vertical">')
src=src.replace('</button></div><div id="filters"', '</button><button id="tab-network" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>Red de relaciones</button><button id="tab-review" class="tab" role="tab" aria-selected="false" aria-controls="report-content" tabindex="-1" disabled>Valoración docente</button></nav><div id="filters"',1)
src=src.replace("${svg('people')}Ficha de aula","${svg('people')}Aula").replace('disabled>Lista de aula</button>','disabled>Estudiantes</button>').replace("${svg('network')}Ficha de centro","${svg('network')}Centro")
src=src.replace("reportContent.addEventListener('click',rosterReviewClick);","reportContent.addEventListener('click',rosterReviewClick);\nreportContent.addEventListener('click',resultClick);\nreportContent.addEventListener('click',simpleReviewClick);")
src=src.replace("document.getElementById('tab-group').onclick=()=>changeView('group');", "document.getElementById('tab-group').onclick=()=>{resultFilter=null;changeView('group');};\ndocument.getElementById('tab-network').onclick=()=>{resultFilter=null;changeView('network');};\ndocument.getElementById('tab-review').onclick=()=>{resultFilter=null;changeView('review');};")
src=src.replace("document.getElementById('tab-roster').onclick=()=>changeView('roster');","document.getElementById('tab-roster').onclick=()=>{resultFilter=null;changeView('roster');};")
src=src.replace("['center','group','roster','student']:['group','roster','student']", "['center','group','roster','network','review','student']:['group','roster','network','review','student']")
src=src.replace("['ArrowLeft','ArrowRight','Home','End']", "['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']")
src=src.replace("(e.key==='ArrowRight'?1:views.length-1)","(['ArrowRight','ArrowDown'].includes(e.key)?1:views.length-1)")
src=src.replace("['tab-group','tab-roster','tab-student','tab-center']","['tab-group','tab-roster','tab-student','tab-center','tab-network','tab-review']")
src=src.replace("'group','roster','student'];for(const id of tabs)", "'group','roster','network','review','student'];for(const id of tabs)")
src=src.replace("button.disabled=true;document.getElementById('demo-source')", "document.querySelector('.demo-banner').hidden=true;button.disabled=true;document.getElementById('demo-source')")
src=src.replace("sourceMode='none';document.getElementById('demo-source').textContent=error.name", "sourceMode='none';document.querySelector('.demo-banner').hidden=false;document.getElementById('demo-source').textContent=error.name")
src=src.replace("selection[kind]=e.target.value;renderFilters();","resultFilter=null;selection[kind]=e.target.value;renderFilters();")
src=src.replace("tab.tabIndex=chosen?0:-1;", "tab.tabIndex=chosen?0:-1;if(id==='student')tab.hidden=next!=='student';")
start=src.index('function renderReport(){');end=src.index('\nfunction consultationContext',start)
src=src[:start]+read('tools/new-render-report.txt')+src[end:]
src=src.replace('<strong>${E(datum(value))}</strong>', '${value?.count==null?\'<strong>Sin datos</strong>\':`<button class="result-count" type="button" data-result="${E(value.id)}" aria-label="${E(question)}: ${E(datum(value))}. Ver estudiantes">${E(datum(value))}<span aria-hidden="true"> ↗</span></button>`}')
src=src.replace("toggle&&dataset&&view==='group'","toggle&&dataset&&['group','network'].includes(view)").replace("!link||!dataset||view!=='group'","!link||!dataset||!['group','network'].includes(view)")
start=src.index('function reviewCell(row,column,rowIndex){');end=src.index('\nconst confidenceLabel',start)
src=src[:start]+"""function reviewCell(row,column,rowIndex){
 const [key,label,field,kind]=column,value=key==='bullying_self'&&row.respondio==='No'?null:row[field];
 const missing=row.respondio==='No'&&['bullying_self','happiness','friendship_out','rejection_out'].includes(key)?'No respondió':'Datos insuficientes';
 return classCell(value,kind,key==='happiness'&&value!=null?' / 10':'',missing);
}
"""+src[end:]
src=src.replace("<td>${confidenceCell(row)}</td>","").replace("${sortHeader('confidence','Confianza en los datos o motivo')}","")
src=src.replace('Ordena por una columna. Pulsa un dato para valorarlo o un nombre para abrir su ficha.','Ordena por una columna o pulsa un nombre para abrir su ficha. La valoración está en el menú.')
note_start=src.index('<details class="roster-method">');note_end=src.index('</details>',note_start)+len('</details>')
src=src[:note_start]+'''<details class="roster-method"><summary>Cómo se leen estos datos</summary><p>Bienestar combina las respuestas sobre el centro, la diversión y la soledad invertida, en una escala de 0 a 10. Las menciones pueden proceder de todo el centro. La ficha muestra el recuento individual; el resumen cuenta estudiantes con 2 o más menciones válidas. Una respuesta ausente no equivale a cero.</p></details>'''+src[note_end:]
src=src.replace("const reviewChoices=[['ok','👍','OK'],['mal','👎','Revisar'],['sorpresa','😮','Me sorprende']];","const reviewChoices=[['sorpresa','😮','Me sorprende']];")
src=src.replace("for(const event of ['pointerdown'",read('src/consultation-handlers.js')+"\nfor(const event of ['pointerdown'")
write('src/app.js',src)
net=read('src/class-network.js')
net=net.replace("const missing=total-network.respondents;","const clustered=network.students.some(row=>String(row.comunidad_amistad??'').trim());\n    const missing=total-network.respondents;")
net=net.replace('data-class-network-layout="circle"','data-class-network-layout="${clustered?\'communities\':\'circle\'}"').replace('aria-pressed="false" aria-controls="class-network-stage"','aria-pressed="${clustered}" aria-controls="class-network-stage"')
net=net.replace('>Ver comunidades</button>','>${clustered?\'Ver círculo\':\'Ver comunidades\'}</button>').replace('data-class-community-legend hidden','data-class-community-legend ${clustered?\'\':\'hidden\'}')
net=net.replace('${svg(network)}</div>','${svg(network,clustered?\'communities\':\'circle\')}</div>')
write('src/class-network.js',net)
landing=(a/'entradas/wetransfer/pbis_web.html').read_text('utf-8')
logo=re.findall(r'<svg\b[\s\S]*?</svg>',landing)[0]
uri='data:image/svg+xml;base64,'+base64.b64encode(logo.encode()).decode()
favicon='data:image/svg+xml;base64,'+base64.b64encode((a/'entradas/wetransfer/PBiS_favicon.svg').read_bytes()).decode()
write('src/brand.js','window.PBIS_BRAND='+json.dumps({'logo':uri,'favicon':favicon})+';\n')
write('site-src/assets/pbis-logo.svg',logo)
write('site-src/assets/pbis-favicon.svg',(a/'entradas/wetransfer/PBiS_favicon.svg').read_text('utf-8'))
html=read('src/app.html').replace('<!--STYLE-->','<link rel="icon" href="'+favicon+'">\n<!--STYLE-->')
html=html.replace('En la pantalla de entrada, pulsa «Comenzar práctica guiada» y utiliza el acceso que te indica la simulación. «Cargar datos demo» prepara el ejemplo y continúa la guía.','En la pantalla de acceso, pulsa «Pulsa aquí para hacer una demo». Entrarás con el ejemplo cargado, sin escribir una contraseña.')
html=html.replace('En la lista, pulsa una columna para ordenar y un dato para marcar OK, Revisar o Me sorprende.','En la lista, pulsa una columna para ordenar. En «Valoración docente», marca las respuestas que te sorprenden.')
html=html.replace('Confianza en los datos va de −5 (muy baja) a +5 (muy alta). No modifica las respuestas.','«Me sorprende» expresa tu criterio sobre un dato. No modifica las respuestas.')
write('src/app.html',html)
build=read('tools/build.mjs')
build=build.replace("await read('src/core.js')","await read('src/brand.js'),await read('src/consultation-ui.js'),await read('src/core.js')",1)
build=build.replace("await read('src/protected-project.css');","await read('src/protected-project.css')+'\\n'+await read('src/relaunch.css');")
build=build.replace('Pulsa Comenzar práctica guiada; la simulación te mostrará la cuenta y contraseña.','Pulsa Probar la demo; el ejemplo se carga directamente, sin contraseña.')
build=build.replace(".replaceAll('href=\"DEMO.html#guia\"','href=\"PBIS.html#guia\"')",".replaceAll('href=\"DEMO.html#guia\"','href=\"PBIS.html#demo\"').replaceAll('href=\"DEMO.html#demo\"','href=\"PBIS.html#demo\"')")
write('tools/build.mjs',build)
print('Interfaz integrada en copia local; motor analítico sin cambios.')

