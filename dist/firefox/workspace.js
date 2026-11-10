'use strict';
// Workspace operations are deliberately separate from the legacy group snapshots.
const WS = (() => {
  const KEY = 'tabVaultWorkspacesV1';
  const windowTypes = ['normal'];
  // Compare content, not generated IDs, timestamps or browser window coordinates.
  // Window order and group order are significant for restore layout.
  function fingerprint(workspace) {
    return JSON.stringify((workspace.windows || []).map(w =>
      (w.groups || []).map(g => TV.fingerprint(g))));
  }
  function uniqueAdditions(incoming, existing) {
    const seen = new Set(existing.map(fingerprint));
    return incoming.filter(w => {
      const key = fingerprint(w);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  async function read() {
    const data = await chrome.storage.local.get(KEY);
    return Array.isArray(data[KEY]) ? data[KEY] : [];
  }
  async function write(items) {
    await chrome.storage.local.set({[KEY]: items});
    const after = await read();
    if (!TV.equivalent(after, items)) throw Error('Workspace storage verification failed; existing tabs were not modified.');
  }
  async function capture(name, deduplicate = false) {
    const windows = await chrome.windows.getAll({windowTypes, populate:false});
    const groups = await TV.openGroups();
    const content = windows.map((w, index) => {
      const contained = groups.filter(g=>g.windowId===w.id).map(g=>TV.snapshot(g,false,deduplicate)).filter(g=>g.tabs.length);
      return {
        label:`Window ${index+1}`,
        bounds: {left:w.left,top:w.top,width:w.width,height:w.height,state:w.state},
        groups: contained
      };
    }).filter(w=>w.groups.length);
    if(!content.length) throw Error('No restorable tab groups are open in your normal browser windows.');
    return {id:crypto.randomUUID(), name:name.slice(0,120),savedAt:new Date().toISOString(),windows:content};
  }
  // Restore a single group into a specified existing browser window, or create one.
  // Never delete the saved group or modify existing tabs in the target window.
  async function restoreGroup(group, targetWindowId) {
    const urls=(group?.tabs||[]).filter(t=>TV.allowed(t.url));
    if(!urls.length)throw Error('This group contains no restorable HTTP(S) tabs.');
    let windowId=targetWindowId;
    let starter=null;
    if(windowId===undefined){
      const win=await chrome.windows.create({url:urls[0].url,focused:true,type:'normal'});
      windowId=win.id;starter=win.tabs?.[0];
    }
    let opened=0;
    const ids=[];
    try {
      for(let i=0;i<urls.length;i++){
        if(i===0 && starter?.id){ids.push(starter.id);opened++;continue;}
        const tab=await chrome.tabs.create({windowId,url:urls[i].url,active:false});
        ids.push(tab.id);opened++;
      }
      const id=await chrome.tabs.group({tabIds:ids,createProperties:{windowId}});
      await chrome.tabGroups.update(id,{
        title:String(group.title||'Untitled group').slice(0,256),
        color:TV.COLORS.has(group.color)?group.color:'grey',
        collapsed:!!group.collapsed
      });
      return {windowId,tabs:opened};
    } catch(e) {
      throw Error(`${e.message}; ${opened} tab(s) may already have been opened. Existing tabs were not removed.`);
    }
  }

  // Restore one saved window with all of its groups, keeping the same order.
  // The saved coordinates are best effort; Chrome controls actual monitor placement.
  async function restoreWindow(savedWindow) {
    const groups=(savedWindow?.groups||[]).filter(g=>(g.tabs||[]).some(t=>TV.allowed(t.url)));
    if(!groups.length)throw Error('This saved window contains no restorable tab groups.');
    const firstUrl=groups[0].tabs.find(t=>TV.allowed(t.url)).url;
    const b=savedWindow.bounds||{};
    const opts={url:firstUrl,focused:true,type:'normal'};
    if(b.state==='normal'){
      if(Number.isInteger(b.width)&&b.width>=300)opts.width=Math.min(b.width,10000);
      if(Number.isInteger(b.height)&&b.height>=200)opts.height=Math.min(b.height,10000);
      if(Number.isInteger(b.left)&&Math.abs(b.left)<=100000)opts.left=b.left;
      if(Number.isInteger(b.top)&&Math.abs(b.top)<=100000)opts.top=b.top;
    }
    let win;
    try{win=await chrome.windows.create(opts);}
    catch{win=await chrome.windows.create({url:firstUrl,focused:true,type:'normal'});}
    const starter=win.tabs?.[0];
    let used=false, count=0;
    try{
      for(const group of groups){
        const ids=[];
        for(const t of group.tabs){
          if(!TV.allowed(t.url))continue;
          if(!used && starter?.id && t.url===firstUrl){
            ids.push(starter.id);used=true;count++;continue;
          }
          const tab=await chrome.tabs.create({windowId:win.id,url:t.url,active:false});
          ids.push(tab.id);count++;
        }
        if(ids.length){
          const id=await chrome.tabs.group({tabIds:ids,createProperties:{windowId:win.id}});
          await chrome.tabGroups.update(id,{
            title:String(group.title||'Untitled group').slice(0,256),
            color:TV.COLORS.has(group.color)?group.color:'grey',collapsed:!!group.collapsed
          });
        }
      }
      if(starter?.id&&!used){try{await chrome.tabs.remove(starter.id);}catch{}}
      return {windows:1,groups:groups.length,tabs:count};
    }catch(e){throw Error(`${e.message}; a new window with ${count} tab(s) may exist. Nothing was automatically closed.`);}
  }

  async function restore(workspace){
    if(!Array.isArray(workspace?.windows)||!workspace.windows.length)throw Error('Workspace contains no windows.');
    const summary={windows:0,groups:0,tabs:0};
    for(const savedWindow of workspace.windows){
      if(!(savedWindow.groups||[]).some(g=>(g.tabs||[]).some(t=>TV.allowed(t.url))))continue;
      const result=await restoreWindow(savedWindow);
      summary.windows+=result.windows;summary.groups+=result.groups;summary.tabs+=result.tabs;
    }
    if(!summary.windows)throw Error('No restorable windows in this workspace.');
    return summary;
  }
  return {KEY,read,write,capture,restore,restoreWindow,restoreGroup,fingerprint,uniqueAdditions};
})();
