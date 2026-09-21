const fs=require('fs');
async function main(){
 const tabs=await(await fetch('http://127.0.0.1:9223/json')).json();
 const original=tabs.find(t=>t.type==='page'&&t.url.startsWith('http://localhost:5173'));
 const tab=await(await fetch('http://127.0.0.1:9223/json/new?http://localhost:5173/login',{method:'PUT'})).json();
 const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map();const exceptions=[];
 ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.method==='Runtime.exceptionThrown')exceptions.push(d.params.exceptionDetails.text);if(pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,d=>d.error?reject(Error(JSON.stringify(d.error))):resolve(d.result));ws.send(JSON.stringify({id,method,params}))});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 await send('Page.enable');await send('Runtime.enable');
 const report={screens:[],dialogs:[],stress:[],exceptions};
 const scan=`(()=>{
  const color=s=>{const m=s.match(/[\\d.]+/g);return m?[+m[0],+m[1],+m[2],m.length>3?+m[3]:1]:[0,0,0,0]};
  const mix=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
  const background=el=>!el?[6,16,29,1]:mix(color(getComputedStyle(el).backgroundColor),background(el.parentElement));
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const bad=[];let checked=0;
  for(const el of document.querySelectorAll('body *')){
   if(!el.getClientRects().length||['SCRIPT','STYLE','SVG','PATH','OPTION'].includes(el.tagName))continue;
   if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
   const s=getComputedStyle(el),bg=background(el),fg=mix(color(s.color),bg),l1=lum(fg),l2=lum(bg),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&+s.fontWeight>=700);checked++;
   if(ratio<(large?3:4.5))bad.push({tag:el.tagName,class:el.className,ratio:+ratio.toFixed(2)});
  }
  return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,heading:!!document.querySelector('h1'),unlabeled:[...document.querySelectorAll('input,select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).length,contrastChecked:checked,contrastFailures:bad};
 })()`;
 for(const width of [320,360,375,390,768,1024,1280,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:false});
  for(const route of ['/login','/register','/forgot-password','/reset-password','/accept-invite','/dashboard','/projects/1']){
   await send('Page.navigate',{url:'http://localhost:5173'+route});
   for(let a=0;a<50;a++){if(await ev(`!!document.querySelector('h1')`))break;await wait(70)}await wait(120);
   report.screens.push({route,...await ev(scan)});
  }
 }
 await send('Page.navigate',{url:'http://localhost:5173/dashboard'});await wait(500);
 for(const width of [320,768,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:false});
  for(const title of ['New Project','Account settings']){
   await ev(`{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(title)});b.focus();b.click()}`);await wait(80);
   report.dialogs.push({title,...await ev(scan),...await ev(`({associatedTitle:!!document.getElementById(document.querySelector('[role=dialog]').getAttribute('aria-labelledby')),focusInside:!!document.activeElement.closest('[role=dialog]'),isolated:document.getElementById('root').inert,scrollable:document.querySelector('[role=dialog]').scrollHeight>=document.querySelector('[role=dialog]').clientHeight})`)});
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(80);
   report.dialogs.push({title,width,closed:!await ev(`!!document.querySelector('[role=dialog]')`),restored:await ev(`document.activeElement.textContent.trim()===${JSON.stringify(title)}`)});
  }
 }
 // Isolated DOM specimens stress presentation only. No API interception or data writes.
 const long='VeryLongUnbrokenProjectAndTaskName'.repeat(6),email='verylongemailaddress'.repeat(5)+'@example.com';
 const specimen=`<main class="workspace-main"><h1>${long}</h1><div class="project-heading flex flex-col sm:flex-row gap-4"><div><span class="badge badge-neutral">${email}</span></div><div class="flex gap-3"><button class="bg-brand-600 px-4 py-2">New Task</button></div></div><div class="task-filters flex flex-col sm:flex-row gap-4 p-4"><div class="flex gap-2"><label for="stress-filter">Assignee</label><select id="stress-filter"><option>${email}</option></select></div></div><div class="task-list"><div class="task-row"><div><h3><button class="task-title">${long}</button></h3><div class="task-meta"><span class="badge badge-warning">In review</span><span class="badge badge-danger">High</span><span class="badge badge-success">Completed</span><span class="flex px-2 bg-elevated">${email}</span><span class="badge badge-danger">Overdue: 2026-01-01</span></div></div><button class="px-3 py-2 bg-brand-50">Advance</button></div></div><div class="notice"><span>${long}</span></div><button disabled class="bg-brand-600 text-white disabled:opacity-50 px-4 py-3">Submitting</button><div class="skeleton-card"><div class="skeleton-line"></div></div></main>`;
 await ev(`document.getElementById('root').innerHTML=${JSON.stringify(specimen)}`);
 for(const width of [320,360,375,390,768,1024,1280,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:false});report.stress.push(await ev(scan))}
 await send('Emulation.setDeviceMetricsOverride',{width:720,height:450,deviceScaleFactor:2,mobile:false});
 report.zoom200={physicalViewport:'1440×900, effective CSS viewport 720×450',...await ev(scan)};
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 report.reducedMotion=await ev(`getComputedStyle(document.querySelector('.skeleton-line')).animationName`);
 await send('Page.navigate',{url:'http://localhost:5173/login'});await wait(400);
 await send('Emulation.clearDeviceMetricsOverride');
 fs.writeFileSync('artifacts/polish-browser-review.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({screens:report.screens.length,screenFailures:report.screens.filter(s=>s.overflow||s.unlabeled||s.contrastFailures.length||!s.heading),dialogFailures:report.dialogs.filter(s=>s.overflow||s.associatedTitle===false||s.focusInside===false||s.restored===false||s.contrastFailures?.length),stressFailures:report.stress.filter(s=>s.overflow||s.contrastFailures.length),zoom:report.zoom200,reducedMotion:report.reducedMotion,exceptions},null,2));
 await send('Page.close');ws.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
