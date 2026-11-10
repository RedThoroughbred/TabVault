'use strict';
// Shared by the popup and service worker. No third-party dependencies.
const TV = (() => {
  const KEY = 'tabVaultGroupsV1'; // Deliberately reuse v0.1's key for seamless upgrades.
  const SETTINGS = 'tabVaultSettingsV2';
  const COLORS = new Set(['grey','blue','red','yellow','green','pink','purple','cyan','orange']);
  const allowed = url => {
    try { return ['http:', 'https:'].includes(new URL(url).protocol); }
    catch { return false; }
  };
  const titleOf = g => (typeof g.title === 'string' && g.title.trim()) || 'Untitled group';
  const dedupTabs = tabs => {
    const seen = new Set();
    return tabs.filter(t => {
      if (!allowed(t.url) || seen.has(t.url)) return false;
      seen.add(t.url); return true;
    }).map(t => ({title: String(t.title || t.url).slice(0,2048), url: t.url}));
  };
  // Content identity: changing collapse state or timestamp does not create a duplicate.
  // Preserve ordered URLs (including repeated URLs when deduplication was disabled).
  const fingerprint = g => JSON.stringify([titleOf(g), g.color, (g.tabs || []).map(t=>t.url)]);
  const duplicateUrls = tabs => {
    const first = new Map(), duplicates = [];
    for (const [index, tab] of tabs.entries()) {
      if (!allowed(tab.url)) continue;
      if (first.has(tab.url)) duplicates.push({url:tab.url,firstIndex:first.get(tab.url),index});
      else first.set(tab.url,index);
    }
    return duplicates;
  };
  const read = async () => {
    const item = await chrome.storage.local.get(KEY);
    return Array.isArray(item[KEY]) ? item[KEY] : [];
  };
  // Chrome's storage serialization can reorder object properties. Comparing raw
  // JSON.stringify output can therefore report a false mismatch even though
  // every saved tab is present. Canonicalize keys for a semantic comparison.
  const canonical = value => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
    }
    return value;
  };
  const equivalent = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  const write = async items => {
    await chrome.storage.local.set({[KEY]:items});
    const check = await read();
    // Keep a strict fail-closed policy: no tabs may be closed unless
    // every group and tab survived the round trip to persistent storage.
    if (!equivalent(check, items)) {
      throw new Error(`Storage verification failed (expected ${items.length} groups, found ${check.length}). Saved data could not be confirmed; tabs were not changed.`);
    }
  };
  const settings = async () => {
    const item = await chrome.storage.local.get(SETTINGS);
    return {auto: item[SETTINGS]?.auto === true};
  };
  const setSettings = async s => chrome.storage.local.set({[SETTINGS]: {auto: !!s.auto}});
  const openGroups = async (windowId) => {
    const query = windowId === undefined ? {} : {windowId};
    const [groups,tabs] = await Promise.all([chrome.tabGroups.query(query), chrome.tabs.query(query)]);
    return groups.map(g=>({...g,tabs:tabs.filter(t=>t.groupId===g.id).sort((a,b)=>a.index-b.index)}));
  };
  const snapshot = (group, automatic=false, dedupe=false) => {
    const tabs = group.tabs.filter(t=>allowed(t.url)).map(t=>({title:String(t.title||t.url).slice(0,2048),url:t.url}));
    const clean = dedupe ? dedupTabs(tabs) : tabs;
    return {id:crypto.randomUUID(), title:titleOf(group), color:COLORS.has(group.color)?group.color:'grey', collapsed:!!group.collapsed,
      savedAt:new Date().toISOString(), automatic, tabs:clean};
  };
  return {KEY, SETTINGS, COLORS, allowed, titleOf, dedupTabs, fingerprint, duplicateUrls, equivalent, read, write, settings, setSettings, openGroups, snapshot};
})();
