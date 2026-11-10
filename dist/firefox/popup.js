'use strict';
const $ = id => document.getElementById(id);
const colors = {grey:'#888',blue:'#5595fb',red:'#e46a6a',yellow:'#e3c054',green:'#57b984',pink:'#e28aca',purple:'#ae83e4',cyan:'#63c6d3',orange:'#ed9c57'};
let busy=false;
const expandedOpenGroups = new Set();
let scope = 'current';
const notice=(s,err=false)=>{$('status').textContent=s;$('status').classList.toggle('error',err);};
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
function btn(label,fn,cls='') {const b=el('button',cls,label);b.type='button';b.addEventListener('click',()=>run(fn));return b;}
async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button,select,input[type=file],input[type=checkbox]').forEach(x=>x.disabled=true);try{await fn();}catch(e){notice(`Error: ${e.message}`,true);}finally{busy=false;document.querySelectorAll('button,select,input[type=file],input[type=checkbox]').forEach(x=>x.disabled=false);}}
function card(group,info,actions){const a=el('article','card');const name=el('div','name');const dot=el('span','dot');dot.style.background=colors[group.color]||colors.grey;name.append(dot,document.createTextNode(TV.titleOf(group)));if(group.automatic) name.append(el('span','badge','auto'));a.append(name,el('div','meta',info));const row=el('div','row');for(const x of actions)row.append(btn(x.label,x.fn,x.cls||''));a.append(row);return a;}
// Live status is computed from Chrome's current grouped tabs. It does not
// mark a collection as idle just because Chrome is not focused.
function groupPresence(saved, liveGroups) {
 const wanted = (saved.tabs || []).filter(t=>TV.allowed(t.url)).map(t=>t.url);
 if (!wanted.length) return {kind:'closed', label:'Closed', count:0, total:0};
 // A group counts as open only when it is still a Chrome group with the
 // same name. Use a URL multiset to handle duplicate URLs reliably.
 let best=0;
 for (const live of liveGroups) {
  if (TV.titleOf(live) !== TV.titleOf(saved)) continue;
  const counts = new Map();
  for(const t of live.tabs) if(TV.allowed(t.url)) counts.set(t.url,(counts.get(t.url)||0)+1);
  let found=0;
  for(const url of wanted) {const n=counts.get(url)||0;if(n){found++;counts.set(url,n-1);}}
  best=Math.max(best,found);
 }
 if(best===0)return {kind:'closed',label:'Closed',count:0,total:wanted.length};
 if(best===wanted.length)return {kind:'open',label:'Open',count:best,total:wanted.length};
 return {kind:'partial',label:`Partially open (${best}/${wanted.length})`,count:best,total:wanted.length};
}
function statusBadge(p) {return el('span',`presence presence-${p.kind}`,p.label);}
// Open a search hit in its existing tab whenever possible; do not create duplicates.
async function focusOrOpen(url){
 if(!TV.allowed(url))throw Error('Unsupported tab URL.');
 const matches=(await chrome.tabs.query({})).filter(t=>t.url===url||t.pendingUrl===url);
 if(matches.length){
  const current=await chrome.windows.getCurrent();
  const chosen=matches.find(t=>t.windowId===current.id)||matches[0];
  if(chosen.groupId!==undefined&&chosen.groupId!==-1){
   try{await chrome.tabGroups.update(chosen.groupId,{collapsed:false});}catch{/* Group may have changed. */}
  }
  await chrome.windows.update(chosen.windowId,{focused:true});
  await chrome.tabs.update(chosen.id,{active:true});
  notice('Switched to an already-open tab.');
  return;
 }
 await chrome.tabs.create({url,active:true});
 notice('This URL was not open; opened a new tab.');
}
async function windowGroups(){if(scope==='all')return TV.openGroups();const w=await chrome.windows.getCurrent();return TV.openGroups(w.id);}
async function render(){const [open,saved,s,allLive]=await Promise.all([windowGroups(),TV.read(),TV.settings(),TV.openGroups()]);$('openGroups').replaceChildren();$('savedGroups').replaceChildren();$('workspaces').replaceChildren();$('auto').checked=s.auto;$('count').textContent=`${saved.length} snapshots`;
 if(!open.length)$('openGroups').append(el('div','empty','No open groups in this view.'));
 let lastWindow = null;
 for(const g of open){
  if(scope==='all' && lastWindow!==g.windowId){lastWindow=g.windowId;$('openGroups').append(el('div','window-label',`browser window ID ${g.windowId}`));}
  const n=g.tabs.filter(t=>TV.allowed(t.url)).length;
  const c=card(g,`${g.tabs.length} tabs · ${n} supported · ${g.tabs.length-n} skipped`,[
    {label:'Save copy',fn:()=>saveSelected([g],false)},
    {label:'Stash & close',cls:'primary',fn:()=>saveSelected([g],true)},
    {label:g.collapsed?'Expand in Chrome':'Show in Chrome',fn:async()=>{
      await chrome.tabGroups.update(g.id,{collapsed:false});
      const first=g.tabs[0];if(first){await chrome.windows.update(first.windowId,{focused:true});await chrome.tabs.update(first.id,{active:true});}
      notice('Opened group in Chrome.');await render();
    }}
  ]);
  const details=el('details');details.open=expandedOpenGroups.has(g.id);
  details.addEventListener('toggle',()=>{if(details.open)expandedOpenGroups.add(g.id);else expandedOpenGroups.delete(g.id);});
  details.append(el('summary','',`View tabs in this group (${g.tabs.length})`));
  for(const tab of g.tabs){
    const row=el('div','tab-link');
    row.append(btn('Go to tab',async()=>{
      const t=await chrome.tabs.get(tab.id);
      if(t.groupId!==-1)await chrome.tabGroups.update(t.groupId,{collapsed:false});
      await chrome.windows.update(t.windowId,{focused:true});
      await chrome.tabs.update(t.id,{active:true});
      notice('Switched to the original tab.');
    }));
    row.append(document.createTextNode(`${tab.title||tab.url||'(no URL)'} — ${tab.url||'Chrome internal page'}`));
    if(!TV.allowed(tab.url))row.append(el('span','badge','not saved'));
    details.append(row);
  }
  c.append(details);$('openGroups').append(c);
}
 await renderWorkspaces(allLive);
 const search=$('search').value.toLowerCase().trim();
 // Search live tabs across all windows, including tabs in other windows.
 $('liveResults').replaceChildren();
 if(search){
  const live=(await chrome.tabs.query({})).filter(t=>TV.allowed(t.url)&&`${t.title||''} ${t.url}`.toLowerCase().includes(search));
  if(!live.length)$('liveResults').append(el('div','empty','No matching currently open tabs.'));
  for(const t of live.slice(0,60)){
   const row=el('div','tab-link');
   row.append(btn('Switch to tab',()=>focusOrOpen(t.url)));
   row.append(document.createTextNode(`${t.title||t.url} — ${t.url}`));
   $('liveResults').append(row);
  }
  if(live.length>60)$('liveResults').append(el('div','empty',`Showing 60 of ${live.length} matching tabs.`));
 }
 const filtered=saved.filter(g=>`${g.title} ${g.tabs.map(t=>`${t.title} ${t.url}`).join(' ')}`.toLowerCase().includes(search));
 if(!filtered.length)$('savedGroups').append(el('div','empty',search?'No matching snapshots.':'No saved snapshots yet.'));
 for(const g of filtered){const p=groupPresence(g,allLive);const c=card(g,`${g.tabs.length} tabs · ${new Date(g.savedAt).toLocaleString()}`, [
 {label:'Restore here',cls:'primary',fn:()=>restore(g,false)},{label:'New window',fn:()=>restore(g,true)},
 {label:'Delete',cls:'danger',fn:()=>deleteSaved(g)}]);
 c.querySelector('.name').append(statusBadge(p));
 const details=el('details');if(search)details.open=true;details.append(el('summary','',`View tabs / switch to open one (${g.tabs.length})`));
 for(const tab of g.tabs.filter(t=>!search||`${t.title} ${t.url}`.toLowerCase().includes(search))){const line=el('div','tab-link');line.append(btn('Switch / Open',()=>focusOrOpen(tab.url)));line.append(document.createTextNode(`${tab.title||tab.url} — ${tab.url}`));details.append(line);}c.append(details);$('savedGroups').append(c);}
}
// Group metadata and tab URLs are refetched immediately before saving.
async function saveSelected(shown,close){const latest=await TV.openGroups();const set=new Set(shown.map(g=>g.id));const groups=latest.filter(g=>set.has(g.id));if(!groups.length)throw Error('These groups are no longer open. Refresh first.');
 const dedupe=$('dedup').checked;const entries=[];const closeCandidates=[];let skipped=0;
 for(const g of groups){const ordered=g.tabs.filter(t=>TV.allowed(t.url));const seen=new Set();const included=dedupe?ordered.filter(t=>{if(seen.has(t.url))return false;seen.add(t.url);return true;}):ordered;
 const entry=TV.snapshot({...g,tabs:included},false,false);if(!entry.tabs.length)continue;entries.push(entry);closeCandidates.push(...included.map(t=>({id:t.id,url:t.url,groupId:g.id})));skipped+=g.tabs.length-included.length;}
 if(!entries.length)throw Error('No supported URLs to save; nothing closed.');
 if(close&&!confirm(`Save ${entries.length} group(s) (${closeCandidates.length} tabs) and CLOSE only those captured tabs?\n${skipped} unsupported or deduplicated tab(s) will remain open.\n\nUnsaved forms and in-page state are NOT saved.`))return;
 const existing=await TV.read();
 // Reuse an identical snapshot: Save copy followed by Stash & close must
 // not produce another record. Only the exact captured tab IDs are eligible to close.
 const fingerprints=new Set(existing.map(TV.fingerprint));
 const additions=entries.filter(entry=>{
   const fp=TV.fingerprint(entry);
   if(fingerprints.has(fp))return false;
   fingerprints.add(fp);return true;
 });
 if(additions.length)await TV.write([...additions,...existing]);
 else if(close){const check=await TV.read();if(!TV.equivalent(check,existing))throw Error('Existing snapshot verification failed; no tabs closed.');}
 if(close){const now=await chrome.tabs.query({});const current=new Map(now.map(t=>[t.id,t]));const ids=closeCandidates.filter(x=>{const t=current.get(x.id);return t&&t.url===x.url&&t.groupId===x.groupId;}).map(x=>x.id);if(ids.length)await chrome.tabs.remove(ids);notice(`${additions.length} new snapshot(s), ${entries.length-additions.length} reused. Closed ${ids.length} verified tab(s); skipped tabs left open.`);}else notice(`${additions.length} new snapshot(s), ${entries.length-additions.length} identical snapshot(s) already saved. Tabs left open.`);
 await render();}
async function saveAll(close){const groups=await windowGroups();if(!groups.length)throw Error('No open groups in this view to save.');await saveSelected(groups,close);}
async function restore(group,newWindow){if(!group.tabs?.length)throw Error('This snapshot is empty.');const tabs=group.tabs.filter(t=>TV.allowed(t.url));if(!tabs.length)throw Error('No restorable web URLs.');
 const createdWindow=newWindow?await chrome.windows.create({focused:true}):null;const windowId=createdWindow?createdWindow.id:(await chrome.windows.getCurrent()).id;const starterTab=createdWindow?.tabs?.[0];const opened=[];
 try{for(const t of tabs){const created=await chrome.tabs.create({windowId,url:t.url,active:false});opened.push(created.id);}const groupId=await chrome.tabs.group({tabIds:opened,createProperties:{windowId}});await chrome.tabGroups.update(groupId,{title:group.title,color:TV.COLORS.has(group.color)?group.color:'grey',collapsed:!!group.collapsed});
 if(starterTab?.id&&['chrome://newtab/','about:blank'].includes(starterTab.pendingUrl||starterTab.url)) {try {await chrome.tabs.remove(starterTab.id);} catch { /* Leave the new window's starter tab if Chrome restricts removal. */ }}
 notice(`Restored ${opened.length} tabs in ${newWindow?'a new':'this'} window. Snapshot retained.`);}
 catch(e){throw Error(`${e.message}; ${opened.length} tabs may already be open. Nothing was automatically removed.`);}await render();}
async function deleteSaved(g){if(!confirm(`Delete snapshot “${g.title}” (${g.tabs.length} tabs)? This cannot be undone without a backup.`))return;await TV.write((await TV.read()).filter(x=>x.id!==g.id));notice('Deleted snapshot.');await render();}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const dated=()=>new Date().toISOString().slice(0,10);
async function exportJson(){const [groups,workspaces]=await Promise.all([TV.read(),WS.read()]);download(`tab-vault-${dated()}.json`,JSON.stringify({format:'tab-vault-v3',exportedAt:new Date().toISOString(),groups,workspaces},null,2),'application/json');notice(`Exported ${groups.length} snapshots and ${workspaces.length} workspaces.`);}
const mdEscape=s=>String(s).replace(/[\\[\]]/g,'\\$&').replace(/[\r\n]/g,' ').replace(/\|/g,'\\|');
async function exportMarkdown(){
 const [groups,workspaces]=await Promise.all([TV.read(),WS.read()]);
 const lines=['---','tags: [tab-vault, browser-sessions]','---','# Tab Vault — Saved Chrome Sessions','',`Exported: ${new Date().toISOString()}`,''];
 function appendGroup(g){
  lines.push(`#### ${String(g.title||'Untitled group').replace(/[\r\n#]/g,' ')} (${g.tabs.length} tabs)`,'',`Saved color: ${g.color} · Saved: ${g.savedAt||'unknown'}`,'');
  for(const t of g.tabs||[])if(TV.allowed(t.url)) lines.push(`- [${mdEscape(t.title||t.url)}](<${t.url.replace(/>/g,'%3E')}>)`);
  lines.push('');
 }
 lines.push('## Standalone saved groups','');
 for(const g of groups)appendGroup(g);
 lines.push('## Saved workspaces','');
 for(const ws of workspaces){
  lines.push(`### ${String(ws.name||'Unnamed workspace').replace(/[\r\n#]/g,' ')} (${ws.windows.length} windows)`,'',`Saved: ${ws.savedAt||'unknown'}`,'');
  for(const win of ws.windows){lines.push(`**${String(win.label||'browser window').replace(/[\r\n]/g,' ')}**`,'');for(const g of win.groups)appendGroup(g);}
 }
 download(`tab-vault-obsidian-${dated()}.md`,lines.join('\n'),'text/markdown');
 notice(`Exported ${groups.length} standalone groups and ${workspaces.length} workspaces to Markdown. URLs are plaintext.`);
}
// Imported JSON is untrusted: validate shape, schemes, lengths and count, never render HTML from it.
function validateImport(data){if(!data||!['tab-vault-v1','tab-vault-v2','tab-vault-v3'].includes(data.format)||!Array.isArray(data.groups))throw Error('Not a supported Tab Vault JSON export.');if(data.groups.length>2000)throw Error('Too many groups in backup.');return data.groups.map(g=>{
 if(!g||typeof g.title!=='string'||!Array.isArray(g.tabs)||g.tabs.length>2000)throw Error('Invalid group in backup.');
 const tabs=g.tabs.map(t=>{if(!t||typeof t.url!=='string'||t.url.length>8192||!TV.allowed(t.url))throw Error('Backup contains an unsupported URL.');return {title:String(t.title||t.url).slice(0,2048),url:t.url};});
 return {id:crypto.randomUUID(),title:g.title.slice(0,256),color:TV.COLORS.has(g.color)?g.color:'grey',collapsed:!!g.collapsed,savedAt:Number.isFinite(Date.parse(g.savedAt))?g.savedAt:new Date().toISOString(),automatic:!!g.automatic,tabs};});}
function validateWorkspaceImport(items){if(!Array.isArray(items))return [];if(items.length>100)throw Error('Too many workspaces in backup.');return items.map(w=>{if(!w||typeof w.name!=='string'||!Array.isArray(w.windows)||w.windows.length>30)throw Error('Invalid workspace.');return {id:crypto.randomUUID(),name:w.name.slice(0,120),savedAt:Number.isFinite(Date.parse(w.savedAt))?w.savedAt:new Date().toISOString(),windows:w.windows.map(win=>{if(!win||!Array.isArray(win.groups)||win.groups.length>200)throw Error('Invalid workspace window.');return {label:String(win.label||'browser window').slice(0,100),bounds:validBounds(win.bounds),groups:win.groups.map(g=>{if(!g||!Array.isArray(g.tabs)||g.tabs.length>1000)throw Error('Invalid workspace group.');return {id:crypto.randomUUID(),title:String(g.title||'Untitled group').slice(0,256),color:TV.COLORS.has(g.color)?g.color:'grey',collapsed:!!g.collapsed,tabs:g.tabs.map(t=>{if(!t||typeof t.url!=='string'||t.url.length>8192||!TV.allowed(t.url))throw Error('Unsupported URL in workspace backup.');return {title:String(t.title||t.url).slice(0,2048),url:t.url};})};})};})};});}
function validBounds(b){const r={state:b?.state==='normal'?'normal':'other'};for(const k of ['left','top','width','height'])if(Number.isInteger(b?.[k])&&Math.abs(b[k])<100001)r[k]=b[k];return r;}
async function importFile(file){if(!file)return;if(file.size>5*1024*1024)throw Error('Backup exceeds 5 MB import limit.');const parsed=JSON.parse(await file.text());const incoming=validateImport(parsed);const importedWorkspaces=validateWorkspaceImport(parsed.workspaces);const existingWorkspaces=await WS.read();const newWorkspaces=WS.uniqueAdditions(importedWorkspaces,existingWorkspaces);const existing=await TV.read();const fingerprints=new Set(existing.map(TV.fingerprint));const additions=incoming.filter(g=>{const k=TV.fingerprint(g);if(fingerprints.has(k))return false;fingerprints.add(k);return true;});if(!confirm(`Import ${additions.length} new snapshot(s) and ${newWorkspaces.length} new workspace(s)? Existing data stays intact.`))return;await TV.write([...additions,...existing]);if(newWorkspaces.length)await WS.write([...newWorkspaces,...existingWorkspaces]);notice(`Imported ${additions.length} snapshot(s) and ${newWorkspaces.length} workspace(s); skipped ${importedWorkspaces.length-newWorkspaces.length} duplicate workspace(s).`);await render();}

async function renderWorkspaces(allLive){
 const items=await WS.read();$('workspaceCount').textContent=`${items.length} saved`;
 $('closedGroups').replaceChildren();
 const closed=[];for(const ws of items)for(const win of ws.windows)for(const g of win.groups)if(groupPresence(g,allLive).kind==='closed')closed.push({ws,win,g});
 $('closedCount').textContent=`${closed.length} closed`;
 if(!closed.length)$('closedGroups').append(el('div','empty','No closed saved groups.'));
 for(const {ws,win,g} of closed){
   const item=card(g,`${ws.name} / ${win.label} · ${g.tabs.length} saved tabs`,[
    {label:'Restore here',cls:'primary',fn:async()=>{const current=await chrome.windows.getCurrent();const r=await WS.restoreGroup(g,current.id);notice(`Restored ${r.tabs} tabs from “${g.title}”.`);await render();}},
    {label:'New window',fn:async()=>{const r=await WS.restoreGroup(g);notice(`Restored ${r.tabs} tabs from “${g.title}” to a new window.`);await render();}}
   ]);item.querySelector('.name').append(statusBadge({kind:'closed',label:'Closed'}));$('closedGroups').append(item);
 } 
 if(!items.length)$('workspaces').append(el('div','empty','No saved workspaces yet.'));
 for(const ws of items){
  const num=ws.windows.reduce((n,w)=>n+w.groups.reduce((m,g)=>m+g.tabs.length,0),0);
  const presence=ws.windows.flatMap(w=>w.groups).map(g=>groupPresence(g,allLive));
  const closedCount=presence.filter(p=>p.kind==='closed').length;
  const c=card({title:ws.name,color:'cyan'},`${ws.windows.length} window(s) · ${num} tabs · ${closedCount} closed group(s) · ${new Date(ws.savedAt).toLocaleString()}`,[
   {label:'Restore windows',cls:'primary',fn:async()=>{
      if(!confirm(`Restore ${ws.windows.length} browser window(s) and ${num} tabs? New windows will be created; existing windows stay open.`))return;
      const result=await WS.restore(ws);notice(`Restored ${result.windows} window(s) and ${result.tabs} tab(s). Windows may need repositioning.`);
   }},
   {label:'Delete',cls:'danger',fn:async()=>{if(!confirm(`Delete workspace “${ws.name}”?`))return;await WS.write((await WS.read()).filter(x=>x.id!==ws.id));await render();notice('Workspace deleted.');}}
  ]);
  const d=el('details');d.append(el('summary','',`View ${ws.windows.length} saved window(s)`));
  ws.windows.forEach((w,i)=>{
   const windowBox=el('div','workspace-window-box');
   const header=el('div','workspace-window-header');
   header.append(el('span','window-label',`${w.label||`Window ${i+1}`} · ${w.groups.length} group(s) · ${w.groups.filter(g=>groupPresence(g,allLive).kind==='closed').length} closed`));
   header.append(btn('Restore window',async()=>{
     const count=w.groups.reduce((n,g)=>n+(g.tabs||[]).filter(t=>TV.allowed(t.url)).length,0);
     if(!confirm(`Restore this saved window with ${w.groups.length} group(s) and ${count} tab(s)? A NEW window will open; existing windows remain untouched.`))return;
     const result=await WS.restoreWindow(w);
     notice(`Restored window: ${result.groups} group(s), ${result.tabs} tab(s).`);
   },'primary'));
   windowBox.append(header);
   for(const g of w.groups){
    const gd=el('details','workspace-group');
    const summary=el('summary','',`${g.title} (${g.tabs.length} tabs) `);summary.append(statusBadge(groupPresence(g,allLive)));gd.append(summary);
    const actions=el('div','row workspace-group-actions');
    actions.append(btn('Restore group here',async()=>{
      const current=await chrome.windows.getCurrent();
      const result=await WS.restoreGroup(g,current.id);
      notice(`Restored “${g.title}” (${result.tabs} tabs) into this window.`);
    },'primary'));
    actions.append(btn('Group in new window',async()=>{
      const result=await WS.restoreGroup(g);
      notice(`Restored “${g.title}” (${result.tabs} tabs) in a new window.`);
    }));
    gd.append(actions);
    for(const t of g.tabs){
      const r=el('div','tab-link');
      r.append(btn('Switch / Open',()=>focusOrOpen(t.url)),document.createTextNode(`${t.title||t.url} — ${t.url}`));
      gd.append(r);
    }
    windowBox.append(gd);
   }
   d.append(windowBox);
  });
  c.append(d);$('workspaces').append(c);
 }
}
async function reviewDuplicates(){
 const [saved,workspaces,live]=await Promise.all([TV.read(),WS.read(),TV.openGroups()]);
 const records=[];
 for(const g of live) records.push({where:`Open / ${TV.titleOf(g)}`,tabs:g.tabs});
 for(const g of saved) records.push({where:`Saved / ${TV.titleOf(g)}`,tabs:g.tabs});
 for(const ws of workspaces) for(const win of ws.windows) for(const g of win.groups)
   records.push({where:`${ws.name} / ${win.label} / ${TV.titleOf(g)}`,tabs:g.tabs});
 const repeatedWithin=[];const locations=new Map();
 for(const record of records){
   for(const d of TV.duplicateUrls(record.tabs)) repeatedWithin.push({where:record.where,url:d.url});
   for(const url of new Set(record.tabs.filter(t=>TV.allowed(t.url)).map(t=>t.url))){
     if(!locations.has(url))locations.set(url,[]);
     locations.get(url).push(record.where);
   }
 }
 const across=[...locations.entries()].filter(([,where])=>where.length>1);
 const panel=$('duplicates');panel.replaceChildren();
 panel.append(el('div','meta',`${repeatedWithin.length} repeated tabs within collections · ${across.length} URLs shared between collections (including live groups). No tabs changed.`));
 for(const d of repeatedWithin.slice(0,25))panel.append(el('div','duplicate-row',`Within ${d.where}: ${d.url}`));
 for(const [url,where] of across.slice(0,25))panel.append(el('div','duplicate-row',`${url} — ${where.join(' | ')}`));
 if(repeatedWithin.length+across.length>50)panel.append(el('div','meta','Showing first 25 of each type.'));
 if(!repeatedWithin.length&&!across.length)panel.append(el('div','empty','No duplicate URLs detected in open groups or saved collections.'));
 notice('Duplicate review complete. Nothing was deleted.');
}
async function saveWorkspace(){
 const name=prompt('Workspace name (all open browser windows):',`Workspace ${new Date().toLocaleString()}`);
 if(name===null)return;
 if(!name.trim())throw Error('Workspace name cannot be empty.');
 const ws=await WS.capture(name.trim(),$('dedup').checked);
 const existing=await WS.read();
 if(!WS.uniqueAdditions([ws],existing).length){notice('An identical workspace is already saved; no duplicate created.');return;}
 const total=ws.windows.reduce((n,w)=>n+w.groups.length,0);
 await WS.write([ws,...existing]);
 await render();notice(`Saved ${ws.windows.length} browser window(s) with ${total} group(s). No tabs were closed.`);
}

async function autoChanged(){const want=$('auto').checked;await TV.setSettings({auto:want});const res=await chrome.runtime.sendMessage({type:'configureAutosave'});if(!res?.ok)throw Error(res?.error||'Could not update automatic snapshots.');notice(want?'Automatic snapshots enabled (30 min).':'Automatic snapshots disabled.');await render();}
$('scope').addEventListener('change',e=>{scope=e.target.value;run(render);});$('saveWorkspace').addEventListener('click',()=>run(saveWorkspace));
$('refresh').addEventListener('click',()=>run(render));$('saveAll').addEventListener('click',()=>run(()=>saveAll(false)));$('stashAll').addEventListener('click',()=>run(()=>saveAll(true)));
$('reviewDuplicates').addEventListener('click',()=>run(reviewDuplicates));$('exportJson').addEventListener('click',()=>run(exportJson));$('exportMd').addEventListener('click',()=>run(exportMarkdown));$('importJson').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',e=>{const f=e.target.files[0];run(()=>importFile(f));e.target.value='';});$('search').addEventListener('input',()=>run(render));$('auto').addEventListener('change',()=>run(autoChanged));run(render);
