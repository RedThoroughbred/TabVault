const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const storage = new Map();
const tabs = [
  {id:1,windowId:10,groupId:3,index:0,url:'https://example.com/a',title:'A'},
  {id:2,windowId:10,groupId:3,index:1,url:'https://example.com/a',title:'A again'},
  {id:3,windowId:11,groupId:4,index:0,url:'https://example.com/b',title:'B'}
];
const groups=[{id:3,windowId:10,title:'Docs',color:'blue',collapsed:true}, {id:4,windowId:11,title:'Work',color:'red',collapsed:false}];
const chrome={storage:{local:{async get(k){return {[k]: storage.get(k)}},async set(obj){for(const [k,v] of Object.entries(obj))storage.set(k,structuredClone(v))}}},
 tabGroups:{async query(q){return groups.filter(g=>q.windowId===undefined || g.windowId===q.windowId)}},
 tabs:{async query(q){return tabs.filter(t=>q.windowId===undefined || t.windowId===q.windowId)}},
 windows:{async getAll(){return [{id:10,left:0,top:0,width:1000,height:800,state:'normal'},{id:11,left:1000,top:0,width:1000,height:800,state:'normal'}]}}};
const context=vm.createContext({chrome,crypto:require('node:crypto').webcrypto,URL,console,Date,Set,Map,JSON});
for(const file of ['core.js','workspace.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context,{filename:file});
const TV=vm.runInContext('TV',context), WS=vm.runInContext('WS',context);
test('URLs: permit only http and https',()=>{assert.equal(TV.allowed('https://example.com'),true);assert.equal(TV.allowed('javascript:alert(1)'),false);assert.equal(TV.allowed('file:///etc/passwd'),false)});
test('captures groups from two windows, preserves grouping',async()=>{const w=await WS.capture('Test',true);assert.equal(w.windows.length,2);assert.equal(w.windows[0].groups[0].tabs.length,1);assert.equal(w.windows[1].groups[0].title,'Work')});
test('duplicate URLs found without deleting',()=>{const result=TV.duplicateUrls(tabs);assert.equal(result.length,1);assert.equal(tabs.length,3)});
test('equivalent ignores object key ordering',()=>{assert.equal(TV.equivalent({a:1,b:2},{b:2,a:1}),true)});
test('workspace duplicate detection excludes IDs and timestamps',async()=>{const a=await WS.capture('Test');const b=await WS.capture('Different name');assert.equal(WS.uniqueAdditions([b],[a]).length,0)});
test('storage round trip and legacy keys',async()=>{const a=await WS.capture('Saved');await WS.write([a]);assert.equal((await WS.read()).length,1);assert.equal(WS.KEY,'tabVaultWorkspacesV1');await TV.write([TV.snapshot({...groups[0],tabs:tabs.slice(0,2)})]);assert.equal((await TV.read()).length,1);assert.equal(TV.KEY,'tabVaultGroupsV1')});
test('both manifest files use same popup and Firefox has background scripts',()=>{const c=JSON.parse(fs.readFileSync(path.join(root,'manifests/chrome.json')));const f=JSON.parse(fs.readFileSync(path.join(root,'manifests/firefox.json')));assert.equal(c.action.default_popup,f.action.default_popup);assert.ok(c.background.service_worker);assert.ok(f.background.scripts.includes('core.js'));assert.equal(f.browser_specific_settings.gecko.strict_min_version,'140.0');assert.deepEqual(f.browser_specific_settings.gecko.data_collection_permissions,{required:['none']})});
test('each browser build has its four icon sizes',()=>{for(const d of ['icons','icons-firefox'])for(const n of [16,32,48,128])assert.ok(fs.existsSync(path.join(root,'src',d,`icon${n}.png`)),`${d}/icon${n}.png is missing`)});
