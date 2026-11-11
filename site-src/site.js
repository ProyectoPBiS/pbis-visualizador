
/* ---------- año ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- reduced motion (global) ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- cifras: conteo 0 -> objetivo ---------- */
(function(){
  const stats = document.querySelector('.stats');
  if(!stats) return;
  const fmt = (n,sep,prefix,suffix)=>{ n=Math.round(n); const s = sep ? n.toLocaleString('es-ES') : ''+n; return (prefix||'')+s+(suffix||''); };
  function run(){
    document.querySelectorAll('.stat .num[data-count]').forEach(el=>{
      const target=+el.dataset.count, sep=el.dataset.sep, prefix=el.dataset.prefix, suffix=el.dataset.suffix, dur=1500, t0=performance.now();
      if(reduceMotion){ el.textContent = fmt(target,sep,prefix,suffix); return; }
      function step(t){ let p=Math.min(1,(t-t0)/dur); p=1-Math.pow(1-p,3); el.textContent=fmt(target*p,sep,prefix,suffix); if(p<1) requestAnimationFrame(step); else el.textContent=fmt(target,sep,prefix,suffix); }
      requestAnimationFrame(step);
    });
  }
  const io = new IntersectionObserver(es=>{ es.forEach(x=>{ if(x.isIntersecting){ run(); io.disconnect(); } }); },{threshold:.4});
  io.observe(stats);
})();

/* ---------- menú móvil ---------- */
const menuBtn = document.getElementById('menuBtn'), mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', ()=>{
  const open = mobileMenu.classList.toggle('show');
  menuBtn.setAttribute('aria-expanded', open);
});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.classList.remove('show');menuBtn.setAttribute('aria-expanded',false);}));

/* ---------- FAQ ---------- */
const faqs = [
  ["¿Qué es el PBiS?","PBiS es un proyecto de transferencia de conocimiento que ayuda a los centros a mejorar el clima de convivencia y a detectar de forma temprana situaciones de riesgo relacional. Se basa en un cuestionario breve y no intrusivo sobre las relaciones del aula, y ofrece resultados casi inmediatos."],
  ["¿Qué hago si mi centro quiere participar?","Escríbenos a través del <a href='#contacto'>formulario de contacto</a>. Tu consulta llega al equipo PBIS en pbis_usuario@outlook.es."],
  ["¿Cuándo va a tener lugar este proyecto?","En los cursos académicos 2026-2027 y 2027-2028."],
  ["¿Cuánto tiempo tarda un estudiante en realizar el cuestionario?","Alrededor de 15 minutos."],
  ["¿Qué se necesita para hacer el cuestionario?","Un dispositivo electrónico, preferiblemente ordenador, y acceso a internet para entrar en la web. También puede responderse desde una tablet o un teléfono móvil."],
  ["¿Qué formato tienen las listas de los estudiantes?","Las listas se suben en formato Excel, con un formato determinado. Se facilita la plantilla."],
  ["¿Qué pasa si subo mal una lista de estudiantes?","Las listas pueden subirse y corregirse hasta activar el test; una vez comenzado, no pueden modificarse."],
  ["¿Cómo reciben los estudiantes sus credenciales?","Al subir las listas, la web genera un documento con usuarios y contraseñas únicos para cada estudiante, que se imprimen y reparten en clase antes de la prueba."],
  ["¿Qué pasa si un estudiante pierde su credencial?","Pueden volver a generarse o consultarse en la web."],
  ["¿Qué pasa si un estudiante se sale de la aplicación o se cae la red?","Todas las respuestas dadas quedan guardadas: se puede continuar donde se dejó."],
  ["¿Quién puede consultar los resultados?","El centro distribuye los accesos a las personas autorizadas. Los proyectos protegidos cifran los datos por aulas. La consulta mediante códigos o apellidos abreviados no convierte los datos en anónimos."],
  ["¿Y si un estudiante se equivoca?","Se puede reiniciar el test de cada estudiante individualmente, borrando sus respuestas o manteniéndolas para modificarlas."],
  ["¿Si tengo un problema durante la sesión de recogida de datos, a dónde puedo recurrir?","Se facilita un teléfono de emergencia en el que siempre habrá alguien que pueda ayudar a resolver la incidencia."],
  ["¿Cuándo tengo acceso a los resultados?","Casi de inmediato: pueden consultarse en la aplicación al día siguiente de la recogida de datos."],
  ["¿Cómo puedo entender los resultados de mi clase y de mi centro?","Se facilita un manual sencillo de interpretación. También habrá un teléfono para hablar con alguien que ayude en la lectura de la información que proporciona la herramienta."],
  ["¿Qué debe hacer un profesor, un equipo de orientación o un equipo de dirección con los resultados?","Leerlos con detalle y valorar, desde su propio criterio experto y con el apoyo de las estructuras del centro, si conviene tomar alguna acción educativa. Decidir qué hacer —no hacer nada, hacer seguimiento, adoptar medidas desde la tutoría o desde orientación…— es siempre criterio de cada centro."],
  ["¿Se pueden consultar las dudas con un experto educativo?","Sí. En caso necesario se tendrá acceso a un experto educativo para resolver dudas sobre la información de PBiS o sobre la toma de decisiones del centro."]
];
const faqCol = document.getElementById('faqCol');
const faqMore = document.createElement('details');
faqMore.className='faq-more';
faqMore.innerHTML='<summary><span class="faq-more-open">Ver más</span><span class="faq-more-close">Ver menos</span></summary>';
faqs.forEach(([q,a],index)=>{
  const featured=index<2;
  const item = document.createElement(featured?'section':'details');
  item.className=featured?'faq-item faq-featured':'faq-item';
  item.innerHTML = featured
    ? `<h3 class="faq-q">${q}</h3><div class="faq-a"><p>${a}</p></div>`
    : `<summary class="faq-q">${q}</summary><div class="faq-a"><p>${a}</p></div>`;
  (featured?faqCol:faqMore).appendChild(item);
});
faqCol.appendChild(faqMore);

/* Legal texts are built from the same documents as the viewer. */
let legalOpener=null;
document.querySelectorAll('[data-modal]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();const dialog=document.getElementById(button.dataset.modal);if(!dialog)return;
  legalOpener=button;dialog.showModal();dialog.querySelector('[data-close]').focus();
}));
document.querySelectorAll('.legal-dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>legalOpener?.focus());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}});
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileMenu.classList.contains('show')){mobileMenu.classList.remove('show');menuBtn.setAttribute('aria-expanded','false');menuBtn.focus();}});

/* =====================================================================
   REDES INTERACTIVAS (D3)
===================================================================== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

const COMM = ['#ea8366','#5aa17d','#e0b64e','#8f6fb0','#5b8bd0'];

/* ---- generadores de datos ---- */
function makeCentro(seed, communities, opts){
  const rnd = mulberry32(seed);
  const nodes=[], links=[]; let id=0;
  const anchors = communities.map((c,i)=>{
    const ang = (i/communities.length)*Math.PI*2 - Math.PI/2;
    return {x: Math.cos(ang)*c.spread, y: Math.sin(ang)*c.spread + (c.dy||0)};
  });
  communities.forEach((c,ci)=>{
    const start=id;
    for(let k=0;k<c.n;k++){ nodes.push({id:id++, c:ci, ax:anchors[ci].x, ay:anchors[ci].y, deg:0}); }
    // intra links
    for(let a=start;a<id;a++)for(let b=a+1;b<id;b++){ if(rnd()<c.p){links.push({source:a,target:b,neg:false});} }
  });
  // inter-community links
  for(let e=0;e<opts.inter;e++){
    let ca=Math.floor(rnd()*communities.length), cb=Math.floor(rnd()*communities.length);
    if(ca===cb) continue;
    const na = nodes.filter(n=>n.c===ca), nb = nodes.filter(n=>n.c===cb);
    if(!na.length||!nb.length) continue;
    links.push({source:na[Math.floor(rnd()*na.length)].id, target:nb[Math.floor(rnd()*nb.length)].id, neg:false});
  }
  // isolated extras
  for(let k=0;k<(opts.isolated||0);k++){ nodes.push({id:id++, c:opts.isoComm||0, ax:opts.isoX||0, ay:opts.isoY||0, deg:0, iso:true}); }
  links.forEach(l=>{ const s=nodes.find(n=>n.id===l.source), t=nodes.find(n=>n.id===l.target); if(s)s.deg++; if(t)t.deg++; });
  return {nodes,links,mode:'centro'};
}
function makeAlumno(seed, spec){
  const rnd = mulberry32(seed), D=Math.PI/180, rand=(a,b)=>a+(b-a)*rnd();
  const neigh=[];
  for(let i=0;i<spec.pos;i++){
    let ang,r;
    if(spec.layout==='split'){ ang=(60+(300-60)*(i/Math.max(1,spec.pos-1))+rand(-8,8))*D; r=rand(.42,.72); }
    else { ang=(i/spec.pos*360+rand(-9,9))*D; r=rand(.5,1); }
    neigh.push({sign:1, ang, r, strong: rnd()<.38, dir: rnd()<.7?'out':'in', cid:10000+Math.floor(rnd()*39000)});
  }
  for(let i=0;i<spec.neg;i++){
    let ang,r;
    if(spec.negTarget==='bottom'){ ang=(88+rand(-7,7))*D; r=rand(1.3,1.45); }
    else { ang=(-58+116*(i/Math.max(1,spec.neg-1))+rand(-6,6))*D; r=rand(.55,1.4); }
    neigh.push({sign:-1, ang, r, strong: rnd()<.26, dir: rnd()<.75?'out':'in', cid:10000+Math.floor(rnd()*39000)});
  }
  return {mode:'alumno', neigh, color:spec.color, egoColor:spec.egoColor, pocas:!!spec.pocas};
}

/* ---- datos ---- */
const centroNets = [
  { title:"Un aula cohesionada",
    desc:"Se distinguen tres grupos claros con muchas relaciones dentro de cada uno, pero también bastantes conexiones entre ellos: buena comunicación general. Algunos estudiantes actúan de puente y no hay nadie aislado.",
    data: makeCentro(11,[{n:11,p:.42,spread:150},{n:10,p:.42,spread:150},{n:10,p:.42,spread:150}],{inter:14}) },
  { title:"Un aula fragmentada",
    desc:"Se observan varios grupos bastante separados, con pocas conexiones entre ellos. La zona inferior queda más aislada. Aunque hay estudiantes muy conectados dentro de su grupo, faltan puentes que unan a toda la clase: baja cohesión.",
    data: makeCentro(23,[{n:8,p:.5,spread:210},{n:8,p:.5,spread:210},{n:7,p:.5,spread:210},{n:7,p:.55,spread:250,dy:120}],{inter:3}) },
  { title:"Un aula con un eje central",
    desc:"Tres grupos con muchas relaciones internas y varias conexiones entre ellos. El grupo central está muy bien conectado y actúa como eje de la red. Aun así, se aprecia un estudiante más aislado, con pocas conexiones respecto al resto.",
    data: makeCentro(31,[{n:13,p:.5,spread:20},{n:9,p:.4,spread:200},{n:9,p:.4,spread:200}],{inter:16,isolated:1,isoComm:1,isoX:260,isoY:-190}) }
];
const alumnoNets = [
  { title:"Un estudiante con muchas relaciones",
    desc:"El estudiante está en el centro de una red amplia: predominan claramente las relaciones positivas (verde) hacia muchos compañeros. Al mostrar las negativas apenas surge algún vínculo puntual (rojo).",
    data: makeAlumno(7,{pos:40, neg:2, layout:'flower', negTarget:'bottom', color:'#25e0e0', egoColor:'#22c9d0', pocas:false}) },
  { title:"Un estudiante con pocas relaciones",
    desc:"El estudiante tiene una red más pequeña. En este ejemplo hay nueve relaciones positivas (verde) y dos negativas (rojo), que puedes mostrar con el interruptor.",
    data: makeAlumno(9,{pos:9, neg:2, layout:'split', negTarget:'right', color:'#6f9fb3', egoColor:'#8fb4c4', pocas:true}) }
];

/* ---- render ---- */
const stage = document.getElementById('vizStage');
const tip = document.getElementById('vizTip');
let sim=null;
function sizeStage(){ return {w: stage.clientWidth, h: stage.clientHeight}; }

function render(g){
  if(g.mode==='alumno') return renderAlumno(g);
  d3.select(stage).select('svg').remove();
  if(sim) sim.stop();
  const {w,h} = sizeStage();
  const svg = d3.select(stage).append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('preserveAspectRatio','xMidYMid meet');
  const root = svg.append('g');
  const links = g.links;

  const link = root.append('g').attr('stroke-linecap','round')
    .selectAll('line').data(links).join('line')
    .attr('stroke','rgba(247,242,236,.28)').attr('stroke-width',1.3);

  const node = root.append('g').selectAll('circle').data(g.nodes).join('circle')
    .attr('r', d=> Math.max(6, Math.min(16, 5+d.deg*1.15)))
    .attr('fill', d=> COMM[d.c % COMM.length])
    .attr('stroke','rgba(36,26,22,.5)').attr('stroke-width',1).style('cursor','pointer');

  node.on('mousemove', (ev,d)=>{
    const r = stage.getBoundingClientRect();
    tip.style.left = (ev.clientX - r.left + 14)+'px';
    tip.style.top = (ev.clientY - r.top - 6)+'px';
    tip.style.opacity = 1;
    tip.textContent = d.iso ? 'Alumno aislado · 0 conexiones' : `Alumno · ${d.deg} conexion${d.deg===1?'':'es'}`;
    link.attr('opacity', l=> (l.source.id===d.id||l.target.id===d.id)?1:.12);
    node.attr('opacity', n=> n.id===d.id?1:.35);
  }).on('mouseleave', ()=>{ tip.style.opacity=0; link.attr('opacity',1); node.attr('opacity',1); });

  const forces = d3.forceSimulation(g.nodes)
    .force('link', d3.forceLink(links).id(d=>d.id).distance(38).strength(.5))
    .force('charge', d3.forceManyBody().strength(-95))
    .force('center', d3.forceX(w/2).strength(.05)).force('centerY', d3.forceY(h/2).strength(.05))
    .force('collide', d3.forceCollide().radius(14))
    .force('cx', d3.forceX(d=> w/2 + d.ax).strength(.14))
    .force('cy', d3.forceY(d=> h/2 + d.ay).strength(.14));

  forces.on('tick', ()=>{
    g.nodes.forEach(d=>{ d.x=Math.max(18,Math.min(w-18,d.x)); d.y=Math.max(18,Math.min(h-18,d.y)); });
    link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node.attr('cx',d=>d.x).attr('cy',d=>d.y);
  });
  if(reduceMotion){ forces.alpha(1); for(let i=0;i<240;i++) forces.tick(); forces.stop();
    link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node.attr('cx',d=>d.x).attr('cy',d=>d.y); }
  sim = forces;

  const drag = d3.drag()
    .on('start',(ev,d)=>{ if(!ev.active) forces.alphaTarget(.3).restart(); d.fx=d.x; d.fy=d.y; })
    .on('drag',(ev,d)=>{ d.fx=ev.x; d.fy=ev.y; })
    .on('end',(ev,d)=>{ if(!ev.active) forces.alphaTarget(0); d.fx=null; d.fy=null; });
  node.call(drag);
}

/* ---- render radial del estudiante (ego-red tipo "flor") ---- */
function renderAlumno(g){
  d3.select(stage).select('svg').remove();
  if(sim){ sim.stop(); sim=null; }
  const {w,h}=sizeStage();
  const cx=w/2, cy=h/2, baseR=Math.min(w,h)*0.30;
  const showNeg = negToggle.checked;
  const svg=d3.select(stage).append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('preserveAspectRatio','xMidYMid meet');
  const defs=svg.append('defs');
  function mk(id,color){ defs.append('marker').attr('id',id).attr('viewBox','0 0 10 10').attr('refX',9).attr('refY',5)
    .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto-start-reverse')
    .append('path').attr('d','M0,0 L10,5 L0,10 z').attr('fill',color); }
  mk('arrG','#31c24f'); mk('arrR','#e8443a');
  const root=svg.append('g');

  const list=g.neigh.filter(n=> showNeg || n.sign>0).map((n,i)=>{
    const r=baseR*n.r; return Object.assign({},n,{i, x:cx+Math.cos(n.ang)*r, y:cy+Math.sin(n.ang)*r});
  });
  const col=d=> d.sign>0 ? (d.strong?'#31c24f':'#9fdca6') : (d.strong?'#e8443a':'#f0a79f');

  const edges=root.append('g').attr('fill','none').attr('stroke-linecap','round')
    .selectAll('path').data(list).join('path')
    .attr('d',d=>{ const sx=cx,sy=cy,tx=d.x,ty=d.y,mx=(sx+tx)/2,my=(sy+ty)/2,dx=tx-sx,dy=ty-sy,off=.24,
      pxp=mx-dy*off, pyp=my+dx*off;
      return d.dir==='out' ? `M${sx},${sy} Q${pxp},${pyp} ${tx},${ty}` : `M${tx},${ty} Q${pxp},${pyp} ${sx},${sy}`; })
    .attr('stroke',col).attr('stroke-width',d=>d.strong?3:1.3).attr('opacity',d=>d.strong?.95:.5)
    .attr('marker-end',d=> d.sign>0?'url(#arrG)':'url(#arrR)');

  if(g.pocas){ root.append('g').selectAll('text').data(list).join('text')
    .attr('x',d=>d.x+9).attr('y',d=>d.y+3).text(d=>d.cid)
    .attr('fill','rgba(247,242,236,.45)').attr('font-size','9px').attr('font-family','"Space Grotesk",sans-serif')
    .style('pointer-events','none'); }

  const nodes=root.append('g').selectAll('circle').data(list).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r', g.pocas?7:5.5).attr('fill',g.color)
    .attr('stroke','rgba(15,10,8,.4)').attr('stroke-width',1).style('cursor','pointer');

  const ego=root.append('circle').attr('cx',cx).attr('cy',cy).attr('r', g.pocas?15:13)
    .attr('fill',g.egoColor).attr('stroke','#f7f2ec').attr('stroke-width',3).style('cursor','pointer');

  const rect=()=>stage.getBoundingClientRect();
  nodes.on('mousemove',(ev,d)=>{ const r=rect(); tip.style.left=(ev.clientX-r.left+14)+'px'; tip.style.top=(ev.clientY-r.top-6)+'px';
      tip.style.opacity=1; tip.textContent=d.sign>0?'Relación positiva':'Relación negativa';
      edges.attr('opacity',e=>e.i===d.i?1:.07); nodes.attr('opacity',n=>n.i===d.i?1:.25); })
    .on('mouseleave',()=>{ tip.style.opacity=0; edges.attr('opacity',e=>e.strong?.95:.5); nodes.attr('opacity',1); });
  ego.on('mousemove',(ev)=>{ const r=rect(); tip.style.left=(ev.clientX-r.left+14)+'px'; tip.style.top=(ev.clientY-r.top-6)+'px';
      tip.style.opacity=1; tip.textContent='Alumno de referencia'; }).on('mouseleave',()=>{ tip.style.opacity=0; });
}

/* ---- estado / controles ---- */
let curView='centro', curCentro=0, curAlumno=0;
const vizTitle=document.getElementById('vizTitle'), vizDesc=document.getElementById('vizDesc'),
      vizChip=document.getElementById('vizChip'), vizLegend=document.getElementById('vizLegend'),
      negWrap=document.getElementById('negToggleWrap'), negToggle=document.getElementById('negToggle'),
      ctrlCentro=document.getElementById('ctrlCentro'), ctrlAlumno=document.getElementById('ctrlAlumno');

function paint(){
  if(curView==='centro'){
    const net=centroNets[curCentro];
    vizChip.textContent='Clima del centro';
    vizTitle.textContent=net.title; vizDesc.textContent=net.desc;
    negWrap.style.display='none';
    vizLegend.innerHTML=`<div class="lg"><span class="dot" style="background:#ea8366"></span>Cada color es un grupo de relaciones (comunidad)</div>
      <div class="lg"><span class="dot" style="background:#f7f2ec"></span>Cuanto mayor es el punto, más conexiones tiene el estudiante</div>`;
    render(net.data);
  }else{
    const net=alumnoNets[curAlumno];
    vizChip.textContent='Perfil de un estudiante';
    vizTitle.textContent=net.title; vizDesc.textContent=net.desc;
    negWrap.style.display='inline-flex';
    vizLegend.innerHTML=`<div class="lg"><span class="dot" style="background:#5aa17d"></span>Relación positiva (se lleva bien)</div>
      <div class="lg"><span class="dot" style="background:#d8695f"></span>Relación negativa (oculta por defecto)</div>`;
    render(net.data);
  }
}
document.querySelectorAll('.viz-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.viz-tab').forEach(x=>x.setAttribute('aria-selected',false));
  t.setAttribute('aria-selected',true);
  curView=t.dataset.view;
  ctrlCentro.style.display = curView==='centro'?'flex':'none';
  ctrlAlumno.style.display = curView==='alumno'?'flex':'none';
  negToggle.checked=false;
  paint();
}));
ctrlCentro.querySelectorAll('.mini-tab').forEach(b=>b.addEventListener('click',()=>{
  ctrlCentro.querySelectorAll('.mini-tab').forEach(x=>x.setAttribute('aria-selected',false));
  b.setAttribute('aria-selected',true); curCentro=+b.dataset.net; paint();
}));
ctrlAlumno.querySelectorAll('.mini-tab').forEach(b=>b.addEventListener('click',()=>{
  ctrlAlumno.querySelectorAll('.mini-tab').forEach(x=>x.setAttribute('aria-selected',false));
  b.setAttribute('aria-selected',true); curAlumno=+b.dataset.net; paint();
}));
negToggle.addEventListener('change',()=>paint());

let rt; window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(paint,220);});

/* pinta cuando la sección es visible (para que el stage tenga tamaño) */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ paint(); io.disconnect(); } });
},{threshold:.15});
io.observe(document.getElementById('informes'));

/* =====================================================================
   HERO — red ambiental (canvas)
===================================================================== */
(function(){
  const canvas=document.getElementById('hero-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d'); let W,H,pts,raf;
  const N = 46;
  function resize(){ const r=canvas.parentElement.getBoundingClientRect(); W=canvas.width=r.width*devicePixelRatio; H=canvas.height=r.height*devicePixelRatio; canvas.style.width=r.width+'px'; canvas.style.height=r.height+'px'; }
  function init(){ resize(); pts=[]; for(let i=0;i<N;i++){ pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.18*devicePixelRatio,vy:(Math.random()-.5)*.18*devicePixelRatio,r:(Math.random()*2.4+1.6)*devicePixelRatio}); } }
  const maxD = 150*devicePixelRatio;
  function frame(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<pts.length;i++){ const p=pts[i]; p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; }
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
      if(d<maxD){ ctx.strokeStyle=`rgba(234,131,102,${(1-d/maxD)*.28})`; ctx.lineWidth=1*devicePixelRatio; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
    }
    for(const p of pts){ ctx.fillStyle='rgba(234,131,102,.55)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
    raf=requestAnimationFrame(frame);
  }
  init();
  if(reduceMotion){ // dibujo estático
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){ const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y); if(d<maxD){ctx.strokeStyle=`rgba(234,131,102,${(1-d/maxD)*.22})`;ctx.lineWidth=1*devicePixelRatio;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();} }
    for(const p of pts){ctx.fillStyle='rgba(234,131,102,.5)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
  } else { frame(); }
  let hrt; window.addEventListener('resize',()=>{clearTimeout(hrt);hrt=setTimeout(()=>{cancelAnimationFrame(raf);init();if(!reduceMotion)frame();},220);});
})();
