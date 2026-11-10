'use strict';
const ALARM = 'tab-vault-auto-snapshot';
async function configureAlarm() {
  const s = await TV.settings();
  if (s.auto) await chrome.alarms.create(ALARM, {periodInMinutes:30});
  else await chrome.alarms.clear(ALARM);
}
async function autoSnapshot() {
  if (!(await TV.settings()).auto) return;
  const groups = await TV.openGroups();
  const saved = await TV.read();
  let changed = false;
  for (const group of groups) {
    const entry = TV.snapshot(group, true, false);
    if (!entry.tabs.length) continue;
    const key = `${entry.title}\u0000${entry.color}`;
    const existing = saved.filter(g=>g.automatic && `${g.title}\u0000${g.color}`===key);
    if (existing.some(g=>TV.fingerprint(g)===TV.fingerprint(entry))) continue;
    saved.unshift(entry); changed = true;
    // Cap automatic history at three snapshots per title/color.
    const older = saved.filter(g=>g.automatic && `${g.title}\u0000${g.color}`===key).slice(3);
    for (const old of older) saved.splice(saved.findIndex(g=>g.id===old.id),1);
  }
  if (changed) await TV.write(saved);
}
chrome.runtime.onInstalled.addListener(()=>{configureAlarm().catch(console.error);});
chrome.runtime.onStartup.addListener(()=>{configureAlarm().catch(console.error);});
chrome.alarms.onAlarm.addListener(a=>{if(a.name===ALARM) autoSnapshot().catch(console.error);});
chrome.runtime.onMessage.addListener((m,_sender,reply)=>{
  if (m?.type !== 'configureAutosave') return;
  configureAlarm().then(()=>reply({ok:true})).catch(e=>reply({ok:false,error:e.message}));
  return true;
});
