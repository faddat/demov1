import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Window} from 'happy-dom';
async function waitFor(fn){for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw Error('Demo did not settle.');}
function page(t,url){const w=new Window({url,settings:{enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true}});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.WebAssembly=WebAssembly;t.after(async()=>{w.dispatchEvent(new w.Event('pagehide'));await w.happyDOM.abort();w.close();});return w;}
test('the hosted Office Lab copy runs, exports captured evidence and resets enterprise from zero',async t=>{
 const w=page(t,'https://hub.test/demos/office/');w.fetch=async()=>{throw Error('Recorded replay only');};w.document.write(await fs.readFile(new URL('../dist/demos/office/index.html',import.meta.url),'utf8'));
 await waitFor(()=>w.NunchiOfficeEnterpriseBridge?.snapshot().ready&&!w.NunchiOfficeEnterpriseBridge.snapshot().busy);const b=w.NunchiOfficeEnterpriseBridge,app=w.NunchiEnterprise;
 assert.equal(w.document.querySelector('.hub-home').getAttribute('href'),'/');await app.setPeriod('week');w.document.getElementById('enterprise-toggle').click();w.document.getElementById('finish').click();await waitFor(()=>b.snapshot().metrics.complete);
 const out=app.exportRun();assert.equal(out.enterprise_projection.assisted.completed,290000);assert.equal(out.sdk_records.length,480);assert.equal(out.modeled_usage.model_tool_calls,600);
 w.document.getElementById('enterprise-toggle').click();assert.equal(b.snapshot().metrics.minutes,0);assert.equal(b.snapshot().records.length,0);assert.equal(b.snapshot().metrics.assisted.cost,0);
});
test('the hosted Exchange Lab copy signs and matches a paper order, verifies it, rejects tampering and exports',async t=>{
 const w=page(t,'https://hub.test/demos/exchange/'),quotes={BTC:68000,ETH:2600,SOL:160,USDC:.9998};
 w.fetch=async input=>{const url=String(input);if(url.includes('/spot')){const symbol=url.match(/prices\/([A-Z]+)-USD/)[1];return {ok:true,json:async()=>({data:{amount:String(quotes[symbol]),base:symbol,currency:'USD'}})};}const at=Math.floor(Date.now()/60000)*60;return {ok:true,json:async()=>Array.from({length:40},(_,i)=>[at-(39-i)*60,67000+i*3,67100+i*3,67030+i*3,67050+i*3,2])};};
 const blobs=[];w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:demo-test';};w.URL.revokeObjectURL=()=>{};
 const anchorPrototype=w.HTMLAnchorElement.prototype,click=anchorPrototype.click;anchorPrototype.click=function(){};t.after(()=>{anchorPrototype.click=click;});
 w.document.write(await fs.readFile(new URL('../dist/demos/exchange/index.html',import.meta.url),'utf8'));const d=w.document;
 await waitFor(()=>d.getElementById('feed-state')?.textContent.includes('LIVE')&&Number(d.getElementById('room-signatures').textContent)>0);
 d.querySelector('[data-mode="play"]').click();const before=Number(d.getElementById('room-signatures').textContent);d.getElementById('quick-buy').click();assert.ok(Number(d.getElementById('room-signatures').textContent)>before);assert.match(d.getElementById('simple-feedback').textContent,/Matched.*BTC/);
 d.getElementById('latest-receipt').click();d.getElementById('verify-button').click();assert.match(d.getElementById('verify-result').textContent,/Signature verified again/);d.getElementById('tamper-button').click();assert.match(d.getElementById('verify-result').textContent,/Rejected/);
 d.getElementById('export-button').click();assert.equal(blobs.length,1);const out=JSON.parse(await blobs[0].text());assert.equal(out.format,'nunchi-exchange-lab/2');assert.ok(out.records.length>0);assert.equal(out.price_feed.quotes.BTC,68000);assert.equal(d.querySelector('.hub-home').getAttribute('href'),'/');
});
