/* Local PDF edition. Reuses the consultation's aggregates; never opens source books.
 * Native PDF text and page watermarks; reports contain no networks.
 * No persistence, network, credentials, feedback or source-file attachment. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./consultation-ui.js'));
  else root.PbisPdf=factory(root.PbisCore,root.PbisConsultationUI);
})(typeof window==='undefined'?globalThis:window,function(C,UI){
  'use strict';
  const known=x=>typeof x==='number'&&Number.isFinite(x);
  const number=x=>known(x)?x.toLocaleString('es-ES',{maximumFractionDigits:1}):'Sin datos';
  const scale=(x,max=10)=>known(x)?number(x)+' / '+max:'Sin datos';
  const mean=values=>{const a=values.filter(known);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;};
  const ratio=(a,b)=>known(a)&&known(b)?`${number(a)} de ${number(b)}`:'Sin datos';
  const name=r=>C.displayName(r.Nombre||r.ID);
  const clean=x=>String(x??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/[–—−]/g,'-').replace(/→/g,' > ').replace(/[\u202f\u00a0]/g,' ');
  const classKey=r=>JSON.stringify([r.Campus||r.Centro,r.Curso,r.Grupo]);
  function identity({demo=false,role,maskedDni,username,accountName,sessionCode,protectedProject=false}){
    if(demo)return {header:'Datos simulados',watermark:'DATOS SIMULADOS'};
    if(role==='orientador')return {header:'Equipo orientador',watermark:null};
    if(role!=='tutor')throw Error('No se puede identificar el perfil para marcar el PDF.');
    if(!sessionCode)throw Error('Falta el código de sesión. Vuelve a entrar antes de descargar.');
    if(protectedProject&&accountName!=null&&(!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(accountName)||/^\d{8}[A-Z]$/.test(accountName)))throw Error('No se puede verificar la marca de agua de esta cuenta.');
    if(protectedProject&&accountName==null&&!/^.[*].[*][*].[*]..$/.test(maskedDni||''))throw Error('No se puede verificar la marca de agua de esta cuenta.');
    let account=protectedProject?(accountName??maskedDni):username;
    if(!account)throw Error('Falta la cuenta para marcar el PDF.');
    // Legacy imports can also use a DNI-shaped login: never print it in full.
    if(/^\d{8}[A-Z]$/i.test(account))account=[...account].map((x,i)=>[1,3,4,6].includes(i)?'*':x).join('');
    const label=clean(account)+' · '+clean(sessionCode).slice(0,8);
    return {header:'Copia de '+label,watermark:label};
  }
  function model({view,selection,students,groups=[],identity:mark,demo=false,mode='general',relationshipReach=view==='group'?'class':'school'}){
    if(!['center','group','student'].includes(view))throw Error('Selecciona una ficha de centro, aula o estudiante.');
    if(!mark?.header||(!mark.watermark&&mark.header!=='Equipo orientador'))throw Error('El PDF requiere una identificación válida.');
    if(view==='center'&&mark.header!=='Equipo orientador'&&!demo)throw Error('Esta cuenta no puede descargar el centro completo.');
    const center=students.filter(r=>(r.Campus||r.Centro)===selection.center);
    const classroom=center.filter(r=>r.Curso===selection.course&&r.Grupo===selection.group);
    const rows=view==='center'?center:classroom;
    if(!rows.length)throw Error('No hay datos autorizados para esta selección.');
    const r=classroom.find(r=>r.ID===selection.student);
    if(view==='student'&&!r)throw Error('El estudiante no está en esta aula autorizada.');
    const title=view==='student'?fullName(r):view==='center'?selection.center:selection.course+' '+selection.group;
    const report={type:view==='student'?'Ficha del alumno':view==='center'?'Informe del colegio':mode==='students'?'Fichas del alumnado':'Informe general de la clase',title,
      scope:selection.center+(view==='student'?' · '+r.Curso+' '+r.Grupo:''),context:[],identity:mark,sections:[],view,mode,networkNote:'',
      filename:'PBIS-'+(view==='group'&&mode==='students'?'alumnos':view)+'-'+(view==='student'?fullName(r):selection.center+(view==='group'?'-'+selection.course+'-'+selection.group:'')).replace(/[^a-z0-9_-]/gi,'_')+'.pdf'};
    if(view==='group'&&mode==='students'){
      report.students=classroom.slice().sort((a,b)=>fullName(a).localeCompare(fullName(b),'es',{numeric:true})).map(s=>model({view:'student',selection:{...selection,student:s.ID},students,groups,identity:mark,demo,relationshipReach}));
      return report;
    }
    const card=(question,answer,detail='')=>({question,answer:String(answer),detail});
    const section=(title,cards,extra={})=>report.sections.push({title,cards,...extra});
    const validFrequency=v=>Number.isInteger(v)&&v>=0&&v<=4;
    const freq=v=>validFrequency(v)?['nunca','casi nunca','algunas veces','casi siempre','siempre'][v]:'sin respuesta';
    const frequency=(v,reverse=false)=>({text:freq(v),emphasis:true,tone:!known(v)||v===2?'neutral':(reverse?v<=1:v>=3)?'positive':'negative'});
    const self=s=>s.respondio==='No'?'Sin dato':s.bullying_autorreporte??'Sin dato';
    const peers=s=>known(s.bullying_companeros_n)?s.bullying_companeros_n===0?'No':'Sí, '+number(s.bullying_companeros_n)+' '+(s.bullying_companeros_n===1?'compañero':'compañeros'):'Sin dato';
    const positiveClaim=(value,claim)=>known(value)?number(value)+' '+(value===1?'compañero opina':'compañeros opinan')+' que '+claim:'Sin dato';
    if(view==='student'){
      report.testStatus=r.respondio==='No'?'NO HA REALIZADO EL TEST':r.respondio!=='Sí'?'TEST INCOMPLETO':'';
      const reciprocal=known(r.amistad_reciproca_n)&&r.amistad_declarada_n>0?100*r.amistad_reciproca_n/r.amistad_declarada_n:null;
      section('Relaciones de amistad y negativas',[
        card('Amistades recibidas',number(r.amistad_recibida_n)),
        card('Rechazos recibidos',number(r.rechazo_recibido_n)),
        card('Amistades recíprocas',known(reciprocal)?number(reciprocal)+' %':r.amistad_declarada_n===0?'0 elecciones':'Sin dato',ratio(r.amistad_reciproca_n,r.amistad_declarada_n)),
        card('Amistades declaradas',number(r.amistad_declarada_n)),
        card('Relaciones negativas declaradas',number(r.rechazo_declarado_n))
      ]);
      section('Posición y mediación',[
        card('Popularidad',positiveClaim(r.popularidad_reportada_n,'es el más popular de la clase')),
        card('Centralidad',positiveClaim(r.centralidad_reportada_n,'es el más central de la clase')),
        card('Buen mediador',positiveClaim(r.mediacion_n,'es un buen mediador')),
        card('Mal mediador',positiveClaim(r.mediacion_negativa_n,'es un mal mediador'))
      ]);
      const parts=[];
      if([r.felicidad_centro,r.felicidad_diversion,r.felicidad_soledad].every(validFrequency))parts.push({text:fullName(r)+' '},frequency(r.felicidad_centro),{text:' se ha sentido bien en el colegio, '},frequency(r.felicidad_diversion),{text:' se ha divertido con sus amigos y '},frequency(r.felicidad_soledad,true),{text:' se ha sentido solo/a.'});
      else{
        for(const [value,before,after,reverse] of [[r.felicidad_centro,'',' se ha sentido bien en el colegio. ',false],[r.felicidad_diversion,'',' se ha divertido con sus amigos. ',false],[r.felicidad_soledad,'',' se ha sentido solo/a. ',true]]){
          if(validFrequency(value))parts.push({text:before},frequency(value,reverse),{text:after});
        }
        if(!parts.length)parts.push({text:'No hay respuestas de bienestar.'});
      }
      section('Bienestar',[{...card('Bienestar',scale(r.felicidad)),score:r.felicidad,maximum:10}],{parts});
      const crt=[['Carrera','carrera'],['Emilia','emilia'],['Biblioteca','biblioteca']].map(([label,key])=>{
        const value=r['crt_'+key+'_acierto'];return {...card(label,value===1?'Acierto':value===0?'Error':'Sin respuesta'),value};
      });
      section('Test cognitivo',[{...card('Preguntas acertadas',scale(r.crt_aciertos,3),'Media de la clase: '+scale(mean(classroom.filter(s=>s.respondio!=='No').map(s=>s.crt_aciertos)),3)),score:r.crt_aciertos,maximum:3},...crt]);
      section('Bullying',[card('¿Se nombra como víctima?',self(r)==='No'?'NO':self(r)),card('¿Otros compañeros lo nombran como víctima?',peers(r)==='No'?'NO':peers(r))],{
        self:r.bullying_autorreporte,peerCount:r.bullying_companeros_n,
        questions:[
          card('En los últimos dos meses, ¿con qué frecuencia has visto o sabido que ocurren estas situaciones?',r.bullying_frecuencia||'Sin respuesta'),
          card('Cuando esto ocurre, ¿hasta qué punto crees que resulta difícil defenderse o conseguir que esas situaciones paren?',r.bullying_dificultad||'Sin respuesta'),
          card('¿Qué situaciones de estas has visto o crees que ocurren en tu colegio?',r.bullying_situaciones?String(r.bullying_situaciones).replace(/\s*\|\s*/g,'; '):'Sin respuesta')
        ]
      });
    }else{
      const respondents=rows.filter(s=>s.respondio!=='No');
      const schoolRespondents=center.filter(s=>s.respondio!=='No');
      const expected=Math.max(0,...center.map(s=>known(s.n_centro)?s.n_centro:0));
      const hasSchoolReference=view!=='center'&&(mark.header==='Equipo orientador'||demo)&&(!expected||center.length>=expected);
      const schoolMetric=field=>hasSchoolReference?mean(schoolRespondents.map(s=>s[field])):null;
      const alone=respondents.filter(s=>known(s.felicidad_soledad)),schoolAlone=schoolRespondents.filter(s=>known(s.felicidad_soledad));
      const lonely=alone.filter(s=>s.felicidad_soledad>=3).length;
      report.context=[rows.filter(s=>s.respondio==='Sí').length+' de '+rows.length+' han respondido al cuestionario'];
      section(view==='center'?'Resumen del colegio':'Resumen de la clase',[
        {...card('Bienestar',scale(mean(respondents.map(s=>s.felicidad))),hasSchoolReference?'Media del colegio: '+scale(schoolMetric('felicidad')):''),metric:'wellbeing'},
        {...card('Se sienten solos siempre o casi siempre',alone.length?ratio(lonely,alone.length):'Sin dato',hasSchoolReference&&schoolAlone.length?'Media del colegio: '+number(100*schoolAlone.filter(s=>s.felicidad_soledad>=3).length/schoolAlone.length)+' %':''),metric:'alone',percent:alone.length?100*lonely/alone.length:null},
        {...card('Test cognitivo',scale(mean(respondents.map(s=>s.crt_aciertos)),3),hasSchoolReference?'Media del colegio: '+scale(schoolMetric('crt_aciertos'),3):''),metric:'cognitive'}
      ]);
      // An incomplete questionnaire can still contain usable item answers.
      // Keep those answers even when a combined score cannot be calculated.
      const overview=UI.overview(rows);
      if(!overview.wellbeing.n){
        const facts=[['feeling','Se sienten bien casi siempre o siempre'],['enjoyment','Disfrutan con amigos casi siempre o siempre']]
          .filter(([key])=>overview[key].denominator>0).map(([key,label])=>card(label,ratio(overview[key].count,overview[key].denominator)));
        if(facts.length)section('Respuestas de bienestar',facts);
      }
      if(!overview.crt.n){
        const items=UI.cognitiveBreakdown(rows).filter(q=>q.n>0).map(q=>card(q.label,ratio(q.correct,q.n),number(q.percent)+' % de aciertos'));
        if(items.length)section('Test cognitivo',items);
      }
      const highlights=UI.bullyingHighlights(rows);
      section('Bullying',[
        card('Alumnos que se autorreportan',number(highlights.bullying_self_completed.count),number(highlights.bullying_self_completed.percent)+' % entre quienes finalizan'),
        card('Alumnos con dos o más nominaciones',number(highlights.bullying_two_total.count),number(highlights.bullying_two_total.percent)+' % del alumnado registrado')
      ]);
      const classReach=view!=='center'&&relationshipReach==='class';
      const rel=respondents.filter(s=>known(s.amistad_declarada_n));
      const outgoing=s=>classReach?s.amistad_clase_declarada_n:s.amistad_declarada_n;
      const negatives=s=>classReach?s.rechazo_clase_declarado_n??s.rechazo_clase_declarada_n:s.rechazo_declarado_n;
      const mutual=s=>classReach?s.amistad_clase_reciproca_n:s.amistad_reciproca_n;
      section('Relaciones de amistad y negativas',[
        card('Media de relaciones positivas nombradas por alumno',number(mean(rel.map(outgoing)))),
        card('Media de relaciones negativas nombradas por alumno',number(mean(rel.map(negatives)))),
        card('Nº de alumnos con alguna amistad recíproca',rel.some(s=>known(mutual(s)))?number(rel.filter(s=>mutual(s)>0).length):'Sin dato'),
        card('Nº de alumnos sin amistades recíprocas',rel.some(s=>known(mutual(s)))?number(rel.filter(s=>mutual(s)===0).length):'Sin dato')
      ],{scope:classReach?'Dentro de su clase':'En el colegio'});
      const ranking=field=>{
        const sorted=rows.filter(s=>known(s[field])&&s[field]>0).slice().sort((a,b)=>b[field]-a[field]||fullName(a).localeCompare(fullName(b),'es'));
        const cutoff=sorted[Math.min(2,sorted.length-1)]?.[field];
        return sorted.filter(s=>s[field]>=cutoff).map(s=>({...card(fullName(s),number(s[field])),classLabel:[s.Curso,s.Grupo].filter(Boolean).join(' · '),rank:sorted.findIndex(other=>other[field]===s[field])+1,tied:sorted.filter(other=>other[field]===s[field]).length>1}));
      };
      section('Top 3 populares',ranking('popularidad_reportada_n'));
      section('Top 3 centrales',ranking('centralidad_reportada_n'));
      section('Top 3 mediadores',ranking('mediacion_n'));
      report.roster=rows.slice().sort((a,b)=>fullName(a).localeCompare(fullName(b),'es',{numeric:true})).map(s=>({name:fullName(s),course:s.Curso,group:s.Grupo,status:s.respondio==='No'?'NO HA REALIZADO EL TEST':s.respondio!=='Sí'?'Test incompleto':'',wellbeing:scale(s.felicidad),lonely:known(s.felicidad_soledad)?s.felicidad_soledad>=3?'Sí':'No':'Sin dato',self:self(s),peers:number(s.bullying_companeros_n),mediator:known(s.mediacion_n)&&known(s.mediacion_negativa_n)?s.mediacion_n-s.mediacion_negativa_n:null}));
    }
    if(view==='center'){
      const bridge=typeof module==='object'&&module.exports?require('./private-charts.js'):window.PbisPrivateCharts;
      const comparison=typeof module==='object'&&module.exports?require('./comparison.js'):window.PBISComparison;
      const integration=typeof module==='object'&&module.exports?require('./integration.js'):window.PBISIntegration;
      const school=bridge.model(center),relations=bridge.comparisonRows(center);
      report.schoolCharts={relations,bullying:comparison.sortBullying(comparison.bullyingRows(school),'any',true),alerts:comparison.nominationAlerts(school),
        distributionAvailable:center.some(s=>s.bullying_autorreporte!=null||known(s.bullying_companeros_n)),distribution:UI.bullyingDistribution(center).categories,overview:UI.overview(center),cognitive:UI.cognitiveBreakdown(center),
        integrations:['neae','newcomer','migrant'].map(group=>({group,metrics:integration.availableMetrics(school,group).map(metric=>({key:metric,...integration.summarize(school,group,metric),available:true}))})).filter(group=>group.metrics.length),
        classes:school.classes.map(c=>{const members=center.filter(s=>classKey(s)===c.id),a=UI.overview(members);return {label:c.label,wellbeing:a.wellbeing.value,crt:a.crt.value};})};
    }
    const available=UI.reportAvailability(view==='student'?[r]:rows,{student:view==='student',reach:relationshipReach});
    const sectionKeys={'Bullying':'bullying','Relaciones de amistad y negativas':'relationships','Bienestar':'wellbeing','Test cognitivo':'cognitive',
      'Top 3 populares':'popular','Top 3 centrales':'central','Top 3 mediadores':'mediation'};
    report.sections=report.sections.filter(s=>s.title==='Posición y mediación'?available.position||available.mediation:!sectionKeys[s.title]||available[sectionKeys[s.title]]);
    for(const s of report.sections){
      if(s.title.startsWith('Resumen de')){
        const a=UI.overview(rows);
        s.cards=s.cards.filter(c=>({wellbeing:a.wellbeing.n,alone:a.alone.denominator,cognitive:a.crt.n})[c.metric]>0);
      }
      if(s.title==='Posición y mediación')s.cards=s.cards.filter((c,i)=>i<2?available[i===0?'popular':'central']:available.mediation);
      if(view==='student'&&r.respondio==='No'&&s.title==='Bullying'){
        s.self=null;
        s.questions=s.questions.map(c=>({...c,answer:'Sin respuesta'}));
      }
    }
    report.sections=report.sections.filter(s=>!s.title.startsWith('Resumen de')||s.cards.length);
    return report;
  }
  function fullName(r){return C.displayName(r.Nombre||r.ID)||'';}

  // Capture a self-contained SVG with computed styles. No DOM from another view.
  function snapshotNetwork(element,view){
    if(!element)return null;
    const svg=element.cloneNode(true),original=[element,...element.querySelectorAll('*')],copy=[svg,...svg.querySelectorAll('*')];
    const properties=['fill','stroke','stroke-width','stroke-opacity','opacity','font-family','font-size','font-weight','text-anchor','dominant-baseline','stroke-dasharray','stroke-linecap','paint-order','stroke-linejoin'];
    original.forEach((el,i)=>{const style=getComputedStyle(el);copy[i].setAttribute('style',properties.map(p=>p+':'+style.getPropertyValue(p)).join(';'));copy[i].removeAttribute('href');copy[i].removeAttribute('tabindex');copy[i].removeAttribute('filter');});
    const box=element.viewBox.baseVal;svg.setAttribute('width',box.width);svg.setAttribute('height',box.height);
    // Interactive highlighting must not hide edges or labels in a complete report.
    copy.forEach(el=>el.style.opacity='1');
    svg.querySelectorAll('.class-network-hit').forEach(el=>el.remove());
    // Remove only empty canvas margins, including when the on-screen details are closed.
    const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
    host.append(svg);document.body.append(host);
    let w=box.width,h=box.height;
    try{const b=svg.getBBox();if(b.width>0&&b.height>0){w=b.width+30;h=b.height+30;svg.setAttribute('viewBox',`${b.x-15} ${b.y-15} ${w} ${h}`);svg.setAttribute('width',w);svg.setAttribute('height',h);}}
    finally{host.remove();}
    return {source:new XMLSerializer().serializeToString(svg),width:w,height:h,title:view==='group'?'Red del aula':'Red de relaciones del estudiante'};
  }
  async function raster(network){
    const image=new Image();
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('La red no ha podido prepararse. Reintenta la descarga.')),15000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('No se ha podido dibujar la red. Reintenta la descarga.'));};image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(network.source);});
    const factor=Math.min(3,4096/network.width,4096/network.height);
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(network.width*factor);canvas.height=Math.ceil(network.height*factor);
    const context=canvas.getContext('2d');if(!context)throw Error('No se ha podido preparar la imagen de la red.');
    context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    const result=canvas.toDataURL('image/png');canvas.width=canvas.height=0;image.src='';return result;
  }
  async function generate(report,{password,current=()=>true}={}){
    password=window.PbisPdfCrypto.normalizeDni(password);
    if(!current())throw Error('La consulta ha cambiado. Repite la descarga.');
    if(!report.identity?.header||(!report.identity.watermark&&report.identity.header!=='Equipo orientador'))throw Error('No se puede generar un PDF sin identificación.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    doc.setProperties({title:report.type+' · PBiS',author:'PBiS',subject:'Resultados disponibles del cuestionario',creator:'PBiS · Edición local PDF'});
    const colors={ink:'#2b211d',accent:'#a9442a',muted:'#6b5b51',line:'#e5d9cf',pale:'#faf7f2',positive:'#187552',negative:'#b43a42'};
    const margin=15,w=180,bottom=278;
    const font=(size=10,bold=false,color=colors.ink)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);};
    const lines=(value,width,size=10,bold=false)=>{font(size,bold);return doc.splitTextToSize(clean(value),width);};
    function paragraph(value,x,y,width,size=9,bold=false,color=colors.ink){const ls=lines(value,width,size,bold);font(size,bold,color);doc.text(ls,x,y,{lineHeightFactor:1.28});return y+ls.length*size*.452;}
    function rule(x,y,width){doc.setDrawColor(colors.line);doc.setLineWidth(.2);doc.line(x,y,x+width,y);}
    function box(x,y,width,height,title,score){doc.setDrawColor(colors.line);doc.setFillColor('#ffffff');doc.roundedRect(x,y,width,height,2,2,'FD');font(10,true);doc.text(title,x+4,y+7);if(score){font(12,true,colors.accent);doc.text(score,x+width-4,y+7,{align:'right'});}}
    function header(r){let y=31;const titleLines=lines(r.title,w,18,true);font(18,true);doc.text(titleLines,margin,y,{lineHeightFactor:1.12});y+=titleLines.length*7.1;return paragraph(r.scope,margin,y+1,w,8,false,colors.muted)+5;}
    function nextPage(){doc.addPage('a4','portrait');}
    function rich(parts,x,y,width,size=9){let px=x;const lh=size*.47;for(const part of parts){for(const token of clean(part.text).match(/\S+\s*|\s+/g)||[]){font(size,!!part.emphasis,colors[part.tone]||colors.ink);let tw=doc.getTextWidth(token);if(px>x&&px+tw>x+width){px=x;y+=lh;}if(tw>width){const chunks=lines(token,width,size,!!part.emphasis);for(const chunk of chunks){font(size,!!part.emphasis,colors[part.tone]||colors.ink);doc.text(chunk,px,y);px=x;y+=lh;}}else{font(size,!!part.emphasis,colors[part.tone]||colors.ink);doc.text(token,px,y);px+=tw;}}}return y+lh;}
    function studentPage(r){
      let y=header(r);if(!r.sections.length)y=paragraph('Sin datos disponibles para esta ficha.',15,y,w,9,false,colors.muted)+3;if(r.testStatus)y=paragraph(r.testStatus,margin,y,w,8,true,colors.accent)+3;
      const get=title=>r.sections.find(s=>s.title===title);
      const bully=get('Bullying');
      if(bully){
      const bullyingRows=bully.questions.map(c=>({q:lines(c.question,83,7.7),a:lines(c.answer,83,8.2)}));
      const bullyingHeight=34+bullyingRows.reduce((sum,row)=>sum+Math.max(row.q.length,row.a.length)*3.8+7,0);
      box(15,y,w,Math.min(bullyingHeight,bottom-y),'Bullying');
      bully.cards.forEach((c,i)=>{const x=19+i*90;const end=paragraph(c.question,x,y+15,82,8,true);font(11,true,(i===0?bully.self==='Sí':bully.peerCount>0)?colors.negative:colors.ink);doc.text(c.answer,x,end+2);});
      y+=34;
      for(const row of bullyingRows){
        const count=Math.max(row.q.length,row.a.length);
        for(let i=0;i<count;i++){
          if(y+8>bottom){nextPage();y=31;box(15,y,w,Math.min(bottom-y,14+(count-i)*3.8+7),'Bullying (continuación)');y+=14;}
          font(7.7,false,colors.muted);if(row.q[i])doc.text(row.q[i],19,y);
          font(8.2);if(row.a[i])doc.text(row.a[i],109,y);
          y+=3.8;
        }
        y+=7;
        if(row!==bullyingRows[bullyingRows.length-1])rule(19,y-5,172);
      }
      y+=5;
      }
      const rel=get('Relaciones de amistad y negativas'),position=get('Posición y mediación');
      if(rel||position){
      const relationHeight=54,positionHeight=position?Math.max(54,position.cards.reduce((sum,c)=>sum+lines(c.answer,78,8.4).length*4+2,19)):0;
      const topHeight=Math.max(rel?relationHeight:0,positionHeight);
      if(y+topHeight>bottom){nextPage();y=31;}
      if(rel){
        const width=position?87:w;box(15,y,width,topHeight,rel.title);
        let ry=y+15;for(const c of rel.cards){font(8.1);doc.text(c.question,19,ry);font(9,true,colors.accent);doc.text(c.answer,15+width-4,ry,{align:'right'});if(c.detail&&c.answer!=='Sin dato'){font(7.3,false,colors.muted);doc.text(c.detail,15+width-4,ry+3.7,{align:'right'});}ry+=8;}
      }
      if(position){
        const x=rel?108:15,width=rel?87:w;box(x,y,width,topHeight,position.title);
        let py=y+15;position.cards.forEach(c=>{py=paragraph(c.answer,x+4,py,width-8,8.4)+2;});
      }
      y+=topHeight+5;
      }
      const wellbeing=get('Bienestar');
      if(wellbeing){
      const wellbeingText=wellbeing.parts.map(p=>p.text).join('');
      const wellbeingHeight=Math.max(29,16+lines(wellbeingText,172,9).length*4.3);
      if(y+wellbeingHeight>bottom){nextPage();y=31;}
      box(15,y,w,wellbeingHeight,'Bienestar',wellbeing.cards[0].answer);rich(wellbeing.parts,19,y+17,172,9);y+=wellbeingHeight+5;
      }
      const crt=get('Test cognitivo');
      if(crt){
      if(y+29>bottom){nextPage();y=31;}
      box(15,y,w,29,crt.title,crt.cards[0].answer);
      paragraph(crt.cards[0].detail,19,y+14,172,8,false,colors.muted);
      crt.cards.slice(1).forEach((c,i)=>{font(8.5);doc.text(c.question+':',19+i*58,y+23);font(8.5,true,c.value===1?colors.positive:c.value===0?colors.negative:colors.muted);doc.text(c.answer,37+i*58,y+23);});y+=34;
      }
    }
    function schoolPages(r){
      const data=r.schoolCharts,green='#94c9b0',yellow='#eed387',red='#e8a49e';let y=0,title='';
      function page(label){nextPage();title=label;y=31;y=paragraph(label,15,y,w,15,true)+2;y=paragraph(r.title,15,y,w,8,false,colors.muted)+8;}
      function space(height){if(y+height>bottom)page(title+' (continuación)');}
      function legend(){font(8);[[green,'Ninguna'],[yellow,'Una'],[red,'Dos o más']].forEach(([color,label],i)=>{doc.setFillColor(color);doc.rect(15+i*48,y-3,3,3,'F');doc.text(label,20+i*48,y);});y+=9;}
      function stack(label,percent,value,available=true){
        const ls=lines(label,43,8),height=Math.max(14,ls.length*4+5);space(height);
        paragraph(label,15,y+3,43,8);let x=60;
        doc.setFillColor(colors.pale);doc.rect(x,y-1,110,8,'F');
        if(available){percent.forEach((v,i)=>{if(v>0){doc.setFillColor([green,yellow,red][i]);doc.rect(x,y-1,110*v/100,8,'F');if(v>=12){font(7);doc.text(number(v)+' %',x+55*v/100,y+4,{align:'center'});}x+=110*v/100;}});}
        else paragraph('Sin datos',61,y+4,100,8,false,colors.muted);
        font(8,true);doc.text(String(value),195,y+4,{align:'right'});y+=height;rule(15,y-3,w);
      }
      function bar(label,value,max,color,suffix='',reference=null){
        const ls=lines(label,43,8),height=Math.max(14,ls.length*4+5);space(height);paragraph(label,15,y+3,43,8);
        doc.setFillColor(colors.pale);doc.rect(60,y-1,110,8,'F');if(known(value)&&value>0){doc.setFillColor(color);doc.rect(60,y-1,110*Math.min(1,value/max),8,'F');}
        if(known(reference)){const x=60+110*Math.max(0,Math.min(1,reference/max));doc.setDrawColor(colors.ink);doc.setLineWidth(.55);doc.line(x,y-3,x,y+9);doc.setLineWidth(.2);}
        font(8,true);doc.text(known(value)?number(value)+suffix:'Sin datos',195,y+4,{align:'right'});y+=height;rule(15,y-3,w);
      }
      const facts=['feeling','enjoyment','alone'].filter(key=>data.overview[key].denominator>0);
      if(facts.length||data.cognitive.some(d=>d.n>0)||data.distributionAvailable)page('Resultados del colegio');
      for(const [key,label] of [['feeling','Se sienten bien casi siempre o siempre'],['enjoyment','Disfrutan con amigos casi siempre o siempre'],['alone','Se sienten solos siempre o casi siempre']]){
        const d=data.overview[key];if(!d.denominator)continue;space(22);y=paragraph(label,15,y,150,9,true)+5;y=paragraph(d.denominator?d.count+' de '+d.denominator+' alumnos':'Sin datos',15,y,w,9)+7;
      }
      if(data.cognitive.some(d=>d.n>0)){
      y=paragraph('Test cognitivo · Aciertos por pregunta',15,y,w,11,true)+6;
      for(const d of data.cognitive.filter(d=>d.n>0))bar(d.label,d.percent,100,'#f3b5a0',' %');
      }
      if(data.distributionAvailable){
      y+=5;y=paragraph('Distribución de nominaciones de bullying',15,y,w,11,true)+6;
      if(!data.distributionAvailable)y=paragraph('Sin datos de nominaciones disponibles.',15,y,w,9)+7;
      for(const d of data.distributionAvailable?data.distribution:[]){space(20);y=paragraph(d.label+' · '+d.count+' alumnos',15,y,w,9,true)+1;y=paragraph(d.description,15,y,w,8,false,colors.muted)+5;}
      }
      if(data.relations.some(d=>d.respondents>0)){
      page('% de Buenas y Malas relaciones');
      y=paragraph('Relaciones entre alumnos de la misma clase',15,y,w,9,false,colors.muted)+7;
      for(const d of data.relations.slice().sort((a,b)=>(b.good+b.bad?b.good/(b.good+b.bad):-1)-(a.good+a.bad?a.good/(a.good+a.bad):-1))){const total=d.good+d.bad;stack(d.label,[total?100*d.good/total:0,0,total?100*d.bad/total:0],total?number(100*d.good/total)+' %':d.respondents?'0 relaciones':'Sin datos',d.respondents>0);}
      space(12);y=paragraph('Verde: buenas relaciones. Coral: malas relaciones. A la derecha, porcentaje de buenas relaciones.',15,y+3,w,8,false,colors.muted)+5;
      for(const [key,label,color] of [['good','Relaciones positivas nombradas por alumno',green],['bad','Relaciones negativas nombradas por alumno',red]]){
        page(label);y=paragraph('Dentro de su clase · Entre quienes respondieron sobre relaciones',15,y,w,8,false,colors.muted)+7;
        const ordered=data.relations.map(d=>({...d,value:d.respondents?d[key]/d.respondents:null})).sort((a,b)=>(b.value??-1)-(a.value??-1));const max=Math.max(1,...ordered.map(d=>d.value??0));
        const base=data.relations.reduce((sum,d)=>sum+d.respondents,0),reference=base?data.relations.reduce((sum,d)=>sum+d[key],0)/base:null;
        y=paragraph('Línea vertical · Media del colegio: '+number(reference),15,y,w,8,false,colors.muted)+7;
        for(const d of ordered)bar(d.label,d.value,max,color,'',reference);
        space(16);y=paragraph('A la derecha, media de relaciones '+(key==='good'?'positivas':'negativas')+' nombradas por alumno dentro de su clase.',15,y+3,w,8,false,colors.muted)+5;
      }
      }
      if(data.bullying.some(d=>d.available)){
      page('Bullying por clases');y=paragraph('Ordenado por: Nº de nominaciones (Una + Dos o más)',15,y,w,8,false,colors.muted)+7;legend();
      for(const d of data.bullying)stack(d.label,d.percent,d.n,d.available);
      space(18);y=paragraph('Nominaciones registradas, incluida la propia. La cifra a la derecha es el alumnado de la clase.',15,y+3,w,8,false,colors.muted)+6;
      for(const alert of data.alerts){space(25);y=paragraph('Una misma respuesta puede influir en muchos resultados. '+alert.label+' ('+alert.classLabel+') ha señalado a '+alert.count+' compañeros como víctimas de bullying.',15,y,w,8,false,colors.muted)+5;}
      }
      for(const [key,label,max,suffix] of [['wellbeing','Bienestar por clases',10,' / 10'],['crt','Test cognitivo por clases',3,' / 3']]){
        if(!data.classes.some(d=>known(d[key])))continue;
        page(label);
        const reference=data.overview[key==='wellbeing'?'wellbeing':'crt'].value;
        y=paragraph('Línea vertical · Media del colegio: '+number(reference)+suffix,15,y,w,8,false,colors.muted)+7;
        for(const d of data.classes.slice().sort((a,b)=>(b[key]??-1)-(a[key]??-1))){
          let color='#f3b5a0';
          if(key==='wellbeing'&&known(d[key])){
            const t=Math.max(0,Math.min(1,d[key]/10)),stops=[[231,128,120],[231,207,112],[96,174,135]],a=stops[t<=.5?0:1],b=stops[t<=.5?1:2],fraction=t<=.5?t*2:(t-.5)*2;
            color='#'+a.map((v,i)=>Math.round(v+(b[i]-v)*fraction).toString(16).padStart(2,'0')).join('');
          }
          bar(d.label,d[key],max,color,suffix,reference);
        }
      }
      for(const group of data.integrations){
        page({neae:'Integración del alumnado NEAE',newcomer:'Integración del alumnado nuevo',migrant:'Integración por origen migrante'}[group.group]);
        for(const metric of group.metrics){
          space(metric.key==='bullying'?80:65);y=paragraph(metric.metric.title,15,y,w,10,true)+5;
          if(metric.key==='bullying')legend();
          const max=metric.metric.max||Math.max(1,...metric.rows.map(d=>d.value??0));
          for(const [i,d] of metric.rows.entries()){
            if(metric.key==='bullying')stack(d.label,d.percent,d.n,metric.available&&d.total>0);
            else bar(d.label,d.value,max,'#654735',metric.metric.unit);
          }
          const bases=metric.rows.map(d=>d.label+': '+(metric.key==='bullying'?d.total+' alumnos registrados':d.n+' de '+d.total+' alumnos con datos')).join(' · ');
          space(15);y=paragraph(bases+(metric.missing?' · '+metric.missing+' sin clasificación':''),15,y,w,7,false,colors.muted)+7;
        }
      }
    }
    function generalPages(r){
      let y=header(r);if(!r.sections.length)y=paragraph('Sin datos disponibles para esta ficha.',15,y,w,9,false,colors.muted)+3;for(const line of r.context)y=paragraph(line,15,y,w,9,false,colors.muted)+2;
      const bull=r.sections.find(s=>s.title==='Bullying');if(bull){box(15,y,w,38,'Bullying');bull.cards.forEach((c,i)=>{paragraph(c.question,19+i*90,y+15,83,8);font(20,true,c.answer!=='0'&&c.answer!=='Sin dato'?colors.negative:colors.ink);doc.text(c.answer,19+i*90,y+25);paragraph(c.detail,19+i*90,y+32,83,7.5,false,colors.muted);});y+=45;}
      const summary=r.sections.find(s=>s.title==='Resumen de la clase'||s.title==='Resumen del colegio');
      if(summary){const cardWidth=(w-(summary.cards.length-1)*6)/summary.cards.length;summary.cards.forEach((c,i)=>{const x=15+i*(cardWidth+6);box(x,y,cardWidth,45,c.metric==='alone'?'Soledad frecuente':c.question);if(r.view==='center')paragraph(c.metric==='alone'?'Alumnado del colegio':'Media del colegio',x+4,y+12,48,7.5,false,colors.muted);font(18,true,colors.accent);doc.text(c.metric==='alone'&&known(c.percent)?number(c.percent)+' %':c.answer,x+4,y+20);if(c.metric==='alone'&&known(c.percent))paragraph(c.answer,x+4,y+27,48,8);paragraph(c.detail,x+4,y+34,48,7.5,false,colors.muted);});y+=53;}
      const rel=r.sections.find(s=>s.title==='Relaciones de amistad y negativas');if(rel){box(15,y,w,52,rel.title);font(7.5,false,colors.muted);doc.text(rel.scope,191,y+7,{align:'right'});rel.cards.forEach((c,i)=>{const rowY=y+17+i*8+(i>=2?5:0);if(i===2)rule(19,rowY-5,172);paragraph(c.question,19,rowY,145,8.5);font(10,true,colors.accent);doc.text(c.answer,191,rowY,{align:'right'});});y+=59;}
      const rankings=r.sections.filter(s=>s.title.startsWith('Top 3'));
      for(const s of r.sections.filter(s=>['Respuestas de bienestar','Test cognitivo'].includes(s.title))){
        const height=16+s.cards.length*13;
        if(y+height>bottom){nextPage();y=31;}
        box(15,y,w,height,s.title);
        s.cards.forEach((c,i)=>{const cy=y+17+i*13;paragraph(c.question,19,cy,130,8.5);font(10,true,colors.accent);doc.text(c.answer,191,cy,{align:'right'});if(c.detail)paragraph(c.detail,19,cy+5,172,7.5,false,colors.muted);});
        y+=height+5;
      }
      // One shared frame and three columns for both school and classroom reports.
      // Keep the complete block together when it fits a page; continue ties otherwise.
      const pending=rankings.map(section=>({title:section.title,rows:section.cards.map(c=>({c,height:Math.max(8,lines(c.question,32,8).length*8*.452+3+(c.classLabel?lines(c.classLabel,32,7).length*7*.452+1:0)+(c.tied?4:0))})),offset:0}));
      let continuation=false;
      if(rankings.length)do{
        const desired=17+Math.max(8,...pending.map(col=>col.rows.slice(col.offset).reduce((sum,row)=>sum+row.height,0)));
        if(y+Math.min(desired,bottom-31)>bottom){nextPage();y=31;}
        const capacity=bottom-y-17;
        const chunks=pending.map(col=>{const rows=[];let used=0;while(col.offset<col.rows.length){const row=col.rows[col.offset];if(used+row.height>capacity)break;rows.push(row);used+=row.height;col.offset++;}return {title:col.title,rows,height:used};});
        const height=17+Math.max(8,...chunks.map(col=>col.height));
        doc.setDrawColor(colors.line);doc.setFillColor('#ffffff');doc.roundedRect(15,y,w,height,2,2,'FD');
        chunks.forEach((col,i)=>{const x=19+i*60;font(9,true);doc.text(col.title,x,y+7);
          let rowY=y+16;
          if(!col.rows.length)paragraph(continuation?'—':'Sin nominaciones',x,rowY,52,8,false,colors.muted);
          for(const {c,height:rh} of col.rows){font(8,true,colors.muted);doc.text(String(c.rank)+'.',x,rowY);let nameEnd=paragraph(c.question,x+6,rowY,32,8);if(c.classLabel)nameEnd=paragraph(c.classLabel,x+6,nameEnd+1,32,7,false,colors.muted);if(c.tied)paragraph('Empate',x+6,nameEnd+1,32,7,false,colors.muted);font(9,true,colors.accent);doc.text(c.answer,x+52,rowY,{align:'right'});rowY+=rh;}
        });
        y+=height+5;continuation=true;
      }while(pending.some(col=>col.offset<col.rows.length));
      if(r.schoolCharts)schoolPages(r);
    }
    function rosterPages(rosterGroup){
      const roster=rosterGroup.rows;let y;
      let offset=0;
      do{
        nextPage();y=31;font(15,true);doc.text('Listado de Alumnos',15,y);y+=8;paragraph(rosterGroup.title,15,y,w,9,false,colors.muted);y+=9;
        const columns=[15,85,110,133,152,173],widths=[70,25,23,19,21,22];
        doc.setFillColor(colors.pale);doc.rect(15,y-4,w,13,'F');
        ['Nombre y Apellidos','Bienestar','Soledad','Auto-\nBullying','Otros-\nBullying','Mediación'].forEach((v,i)=>paragraph(v,columns[i]+2,y,widths[i]-3,7.6,true));y+=14;
        while(offset<roster.length){
          const row=roster[offset],ls=lines(row.name,66,8.3,true);const rh=Math.max(6.4,ls.length*3.9+(row.status?6:2));if(y+rh>bottom)break;
          font(8.3,true);doc.text(ls,17,y);if(row.status)paragraph(row.status,17,y+ls.length*3.9,66,6.4,true,colors.accent);
          [row.wellbeing,row.lonely,row.self,row.peers].forEach((v,i)=>paragraph(v,columns[i+1]+2,y,widths[i+1]-3,7.8,false,i===2&&v==='Sí'?colors.negative:colors.ink));
          if(known(row.mediator)){const mid=184,half=9,max=Math.max(1,...roster.map(s=>known(s.mediator)?Math.abs(s.mediator):0));rule(175,y-1,18);doc.setDrawColor(colors.muted);doc.line(mid,y-3,mid,y+1);doc.setDrawColor(row.mediator<0?colors.negative:colors.positive);doc.setLineWidth(1.4);doc.line(mid,y-1,mid+half*Math.max(-1,Math.min(1,row.mediator/max)),y-1);doc.setLineWidth(.2);}else paragraph('Sin dato',175,y,18,7);
          y+=rh;rule(15,y-3,w);offset++;
        }
        if(y+17<bottom){const legendEnd=paragraph('Auto-Bullying: se nombra como víctima de bullying. Otros-Bullying: Nº de compañeros del colegio que lo nombran a él como víctima de bullying.',15,y+4,w,7,false,colors.muted);paragraph('Soledad: siempre o casi siempre. Mediación: balance de opiniones; derecha a favor, izquierda en contra.',15,legendEnd+2,w,7,false,colors.muted);}
      }while(offset<roster.length);
    }
    if(report.mode==='students')report.students.forEach((r,i)=>{if(i)nextPage();studentPage(r);});
    else if(report.view==='student')studentPage(report);
    else generalPages(report);
    const logo=window.PBIS_BRAND?.logo?await raster({source:atob(window.PBIS_BRAND.logo.split(',')[1]),width:424.12,height:412.95}):null;
    const stamp=new Date().toLocaleString('es-ES'),total=doc.getNumberOfPages();
    for(let p=1;p<=total;p++){
      doc.setPage(p);if(logo)doc.addImage(logo,'PNG',margin,7,10,10);font(15,true,colors.accent);doc.text('PBiS',margin+(logo?13:0),16);font(8,false,colors.muted);doc.text(report.identity.header,195,15,{align:'right'});rule(margin,21,w);
      font(7.5,false,colors.muted);doc.text('Uso confidencial · Solo para personas autorizadas',margin,285);doc.text('Generado: '+stamp,margin,290);doc.text(`${p} / ${total}`,195,290,{align:'right'});
      if(report.identity.watermark){
        // Retain the existing visible watermark in every content stream.
        doc.saveGraphicsState();doc.setGState(new doc.GState({opacity:.16}));const label=clean(report.identity.watermark);font(17,true,'#7d695b');const size=Math.min(17,17*90/Math.max(90,doc.getTextWidth(label)));font(size,true,'#7d695b');
        for(let row=0;row<4;row++)for(let col=0;col<2;col++)doc.text(label,margin+8+col*w/2,58+row*(297-90)/4,{angle:27});doc.restoreGraphicsState();
      }
    }
    if(!current())throw Error('La consulta ha cambiado. Repite la descarga.');
    return window.PbisPdfCrypto.protect(doc.output('arraybuffer'),password,{current});
  }

  function download(blob,filename){
    if(!(blob instanceof Blob)||blob.type!=='application/pdf')throw Error('No se ha preparado un PDF protegido.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  return Object.freeze({identity,model,snapshotNetwork,generate,download});
});
