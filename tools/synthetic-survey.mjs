/* Seeded synthetic survey. Model contains blended class-level probabilities only. */
export function generateSurvey(model){
 let seed=model.seed>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),pick=a=>a[Math.floor(rnd()*a.length)];
 const shuffle=a=>a.map(v=>({v,r:rnd()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
 const choose=(a,n,weight=()=>1)=>a.map(v=>({v,r:-Math.log(Math.max(1e-9,rnd()))/Math.max(.001,weight(v))})).sort((a,b)=>a.r-b.r).slice(0,n).map(x=>x.v);
 const sample=(probs,u=rnd())=>{const total=probs.reduce((a,b)=>a+b,0);let s=0;for(let i=0;i<probs.length;i++){s+=probs[i]/total;if(u<=s)return i;}return probs.length-1;};
 const distribute=(probs,n)=>{const counts=probs.map(p=>Math.floor(n*p/probs.reduce((a,b)=>a+b,0)));while(counts.reduce((a,b)=>a+b,0)<n){const i=counts.map((c,i)=>({i,r:n*probs[i]-c})).sort((a,b)=>b.r-a.r)[0].i;counts[i]++;}return shuffle(counts.flatMap((c,i)=>Array(c).fill(i)));};
 const firstNames=['Lucía','Mateo','Sofía','Hugo','Julia','Pablo','Valeria','Martín','Paula','Daniel','Alba','Diego','Vega','Álvaro','Lara','Marcos','Irene','Lucas','Nora','Adrián','Clara','Bruno','Alicia','Manuel','Elena','Javier','Sara','Leo','Carla','Jaime','Olivia','Nicolás','Emma','Gabriel','Noa','Mario','Inés','Alejandro','Celia','Samuel'];
 const surnames=['Santos','Romero','Medina','Suárez','Navarro','Molina','Pascual','Herrera','Campos','Serrano','Cabrera','Morales','Cortés','Vidal','Soler','Peña','Garrido','Fuentes','Vargas','Ramos','Luna','Rivas','Ortega','Marín','Castro','Delgado','Reyes','Calvo','Prieto','Lorenzo','Montes','Blanco','Domínguez','Fernández'];
 const names=new Set(),students=[],classes=[];let seq=0;
 for(const m of model.classes){
  const rows=Array.from({length:m.n},(_,i)=>{const id=String(++seq).padStart(5,'0');let name,family,full;do{name=pick(firstNames);family=pick(surnames)+' '+pick(surnames);full=name+' '+family;}while(names.has(full));names.add(full);
   if(id==='00253'){name='Ana';family='Montes Salas';}if(id==='00269'){name='Zoe';family='Vidal Campos';}
   return{id,name,family,m,community:Math.floor(rnd()*3),pop:.25+Math.pow(rnd(),1.5)*2,neg:.1+Math.pow(rnd(),3)*2,emotion:rnd(),answers:true,links:new Map(),bully:new Set(),self:false,med:[],pred:[]};
  });
  const missing=Math.max(1,Math.round(m.n*(1-m.answered)));let absent=shuffle(rows).slice(0,missing);
  if(m.center==='3705'&&m.course==='1.º ESO'&&m.group==='A')absent=[rows.find(s=>s.id==='00269'),...absent.filter(s=>!['00253','00269'].includes(s.id)).slice(0,missing-1)];
  absent.forEach(s=>s.answers=false);classes.push({m,rows});students.push(...rows);
 }
 // Generate each graph independently; shared pair noise creates plausible reciprocity.
 for(const {m,rows}of classes){
  const pair=new Map();for(const a of rows)for(const b of rows)if(a.id<b.id)pair.set(a.id+'|'+b.id,rnd());
  const shared=(a,b)=>pair.get([a.id,b.id].sort().join('|'));
  const candidates=rows.filter(s=>s.answers).flatMap(a=>rows.filter(b=>a!==b).map(b=>({a,b,score:.43*shared(a,b)+.28*rnd()+.21*(a.community===b.community)+.08*b.pop})));
  candidates.sort((a,b)=>b.score-a.score);const positive=candidates.slice(0,Math.round(candidates.length*m.density));
  positive.forEach(({a,b})=>a.links.set(b.id,{type:'amistad',strong:rnd()<m.strongPositive}));
  const negative=candidates.filter(({a,b})=>!a.links.has(b.id)).map(p=>({...p,rank:rnd()+.4*p.b.neg+.1*(p.a.community!==p.b.community)})).sort((a,b)=>b.rank-a.rank).slice(0,Math.round(candidates.length*m.negativeDensity));
  negative.forEach(({a,b})=>a.links.set(b.id,{type:'rechazo',strong:rnd()<m.strongNegative}));
  const outside=students.filter(s=>s.m.center===m.center&&s.m!==m),targetCross=Math.round((positive.length+negative.length)*m.crossRate/(1-m.crossRate));
  let emitted=0;const responders=rows.filter(s=>s.answers);
  while(emitted<targetCross){const a=pick(responders),pool=outside.filter(b=>!a.links.has(b.id));if(!pool.length)break;const b=choose(pool,1,b=>b.m.course===m.course?10:1)[0];const pos=rnd()<m.density/(m.density+m.negativeDensity);a.links.set(b.id,{type:pos?'amistad':'rechazo',strong:rnd()<(pos?m.strongPositive:m.strongNegative)});emitted++;}
 }
 for(const {m,rows}of classes){
  const responders=rows.filter(s=>s.answers),peerCounts=distribute(m.peerDistribution,rows.length),centre=students.filter(s=>s.m.center===m.center&&s.answers);
  // A small number of synthetic broad ballots exercise the existing >15 filter.
  const broad=m.group==='C'&&m.course==='2.º ESO'?responders.at(-1):null;
  rows.forEach((target,i)=>{
   const available=centre.filter(s=>s!==target&&s!==broad&&s.bully.size<15);
   choose(available,Math.min(peerCounts[i],available.length),s=>s.m===m?12:s.m.course===m.course?3:1).forEach(s=>s.bully.add(target.id));
  });
  if(broad)choose(students.filter(s=>s.m.center===m.center&&s!==broad),18).forEach(s=>broad.bully.add(s.id));
  choose(responders,Math.round(responders.length*m.selfRate),s=>1+peerCounts[rows.indexOf(s)]*.6).forEach(s=>s.self=true);
  const crtTotals=distribute(m.crt,responders.length);
  responders.forEach((s,i)=>{
   const peers=students.filter(t=>t.m.center===m.center&&t!==s),medN=clamp(Math.round(m.mediator*rows.length/responders.length*(.45+rnd())),0,peers.length),negN=Math.round(m.negativeMediator*(.4+rnd()));
   const good=choose(peers,medN,t=>(t.m===m?8:1)*(s.links.get(t.id)?.type==='amistad'?2:1)*(t.pop+.4));
   const bad=choose(peers.filter(t=>!good.includes(t)),negN,t=>(t.m===m?8:1)*(s.links.get(t.id)?.type==='rechazo'?3:1)*(.2+t.neg));
   s.med=[...good.map(t=>`${t.id} (${rnd()<.45?'Muy buena':'Buena'} mediación)`),...bad.map(t=>`${t.id} (${rnd()<.3?'Muy mala':'Mala'} mediación)`)];
   s.popular=rnd()<m.popular?choose(rows.filter(t=>t!==s),1,t=>t.pop**3)[0].id:'Nadie';
   s.central=rnd()<m.central?choose(rows.filter(t=>t!==s),1,t=>(.4+t.pop)*(t.community===1?2:1))[0].id:'Nadie';
   const crt=s.id==='00253'?3:crtTotals[i];s.crt=[0,0,0];choose([0,1,2],crt,k=>m.crtItems[k]+.05).forEach(k=>s.crt[k]=1);
   if(s.id!=='00253'&&rnd()<.035)s.crt[Math.floor(rnd()*3)]=null;
   // Correlated but different draws: low mood need not imply peer nominations.
   s.general=sample(m.general,.6*s.emotion+.4*rnd());s.fun=sample(m.fun,.6*s.emotion+.4*rnd());s.alone=sample(m.alone,.55*(1-s.emotion)+.45*rnd());
   s.pred=choose(peers,Math.max(1,Math.round(s.links.size*(.5+rnd()*.4))),t=>t.links.get(s.id)?.type==='amistad'?12:1).map(t=>`${t.id} (${t.links.get(s.id)?.type==='rechazo'?'Mala':'Buena'} relación)`);
  });
 }
 const headers=['Usuario Id','Alumno Id','Nombre','Apellidos','Estudio','Curso','Grupo','start','end','dia','eredes1','redes1','eredes2','redes2','ebeliefs1','beliefs1','ebeliefs2','beliefs2','carrera1','carrera2','emilia1','emilia2','library1','library2','egeneral','general','efun','fun','ealone','alone','ebullying','bullying','fqbullying','stopbullying','conductas','emediador','mediador','popular','central'];
 const freq=['Nunca','Casi nunca','Algunas veces','Casi siempre','Siempre'],stamp='2026-11-01 10:00:00',list=a=>a.length?a.join(' | '):'Nadie';
 return students.map((s,i)=>{
  const row=Object.fromEntries(headers.map(h=>[h,'']));Object.assign(row,{'Usuario Id':s.id,'Alumno Id':'SIM'+s.id,Nombre:s.name,Apellidos:s.family,Estudio:s.m.center,Curso:s.m.course,Grupo:s.m.group});if(!s.answers)return row;
  const suffix=i%2?'1':'2';row.start=stamp;row.end='2026-11-01 10:16:00';row.dia=i%2?'Par':'Impar';row['eredes'+suffix]=stamp;row['redes'+suffix]=list([...s.links].map(([id,e])=>`${id} (${e.strong?'Muy ':''}${e.type==='amistad'?(e.strong?'buena':'Buena'):(e.strong?'mala':'Mala')} relación)`));row['ebeliefs'+suffix]=stamp;row['beliefs'+suffix]=list(s.pred);
  ['carrera','emilia','library'].forEach((q,j)=>row[q+suffix]=s.crt[j]===null?'':s.crt[j]?['Segundo','Emilia','47'][j]:['Primero','María','24'][j]);
  for(const q of ['general','fun','alone']){row['e'+q]=stamp;row[q]=freq[s[q]];}
  row.ebullying=stamp;row.bullying=list([...s.bully,...(s.self?[s.id]:[])]);row.fqbullying=s.self?pick(['Dos o tres veces al mes','Una vez a la semana']):s.bully.size?pick(['Una o dos veces','Dos o tres veces al mes']):pick(['Nunca','Una o dos veces']);row.stopbullying=s.self?pick(['Difícil','Muy difícil']):pick(['Algo difícil','No lo sé']);row.conductas=pick(row.fqbullying==='Nunca'?['No he observado estas situaciones']:['Insultar o poner motes','Excluir de actividades','Insultar o poner motes | Amenazar o asustar']);row.emediador=stamp;row.mediador=list(s.med);row.popular=s.popular;row.central=s.central;return row;
 });
}
