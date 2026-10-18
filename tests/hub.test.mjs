import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Script} from 'node:vm';
import {Window} from 'happy-dom';
import {mountHub} from '../src/app.js';
import {demos} from '../src/demos.js';
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(t,{reduced=false,saveData=false,Observer}={}){
 const w=new Window({url:'https://hub.test/',settings:{enableJavaScriptEvaluation:false}});w.document.write(html);
 const media={matches:reduced,addEventListener(){},removeEventListener(){}};w.matchMedia=()=>media;
 if(saveData)Object.defineProperty(w.navigator,'connection',{value:{saveData:true},configurable:true});
 for(const v of w.document.querySelectorAll('video')){v.play=async()=>{};v.pause=()=>{};v.load=()=>{};}
 const app=mountHub(w.document,{Observer});t.after(()=>{app.dispose();w.close();});return {w,d:w.document,app};
}
test('every catalog entry hosts its own demo and has a preview, scope, SDK modules and a launch path',async t=>{
 const {d}=setup(t);assert.equal(d.querySelectorAll('.demo-card').length,demos.length);assert.equal(d.getElementById('demo-count').textContent,demos.length+' interactive demos');
 for(const demo of demos){const card=d.getElementById('demo-'+demo.id);assert.equal(card.querySelector('.demo-launch').getAttribute('href'),demo.path);assert.equal(card.querySelector('.preview-link').getAttribute('href'),demo.path);assert.equal(card.querySelector('video').dataset.video,demo.video);assert.ok(card.textContent.includes(demo.application));for(const module of demo.modules)assert.ok(card.textContent.includes(module.name));for(const asset of [demo.path+'index.html',demo.video,demo.poster])assert.ok((await fs.stat(new URL('../dist'+asset,import.meta.url))).size>100);}
 assert.doesNotMatch(d.body.textContent,/200 organizations|Millions of AI decisions/);
 assert.equal(d.querySelector('h1').textContent,'One SDK.Multiple applications.');
});
test('the plus disclosures work without JavaScript and do not navigate away',t=>{
 const {d}=setup(t);for(const details of d.querySelectorAll('.sdk-details')){assert.equal(details.open,false);assert.equal(details.querySelector('.plus').textContent,'+');details.querySelector('summary').click();assert.equal(details.open,true);assert.ok(details.querySelector('h4').textContent.includes('application'));details.querySelector('summary').click();assert.equal(details.open,false);}
});
test('filters update the visible demos and accessible count while stopping hidden previews',async t=>{
 const {d}=setup(t);const video=d.querySelector('#demo-office video');let pauses=0;video.pause=()=>pauses++;
 d.querySelector('[data-filter="finance"]').click();assert.equal(d.getElementById('demo-office').hidden,true);assert.equal(d.getElementById('demo-exchange').hidden,false);assert.equal(d.getElementById('demo-count').textContent,'2 interactive demos');assert.equal(d.getElementById('demo-payments').hidden,false);assert.ok(pauses>0);assert.equal(d.querySelector('[data-filter="finance"]').getAttribute('aria-pressed'),'true');
 d.querySelector('[data-filter="ai"]').click();assert.equal(d.getElementById('demo-exchange').hidden,true);d.querySelector('[data-filter="robotics"]').click();assert.equal(d.getElementById('demo-robotics').hidden,false);assert.equal(d.getElementById('demo-office').hidden,true);assert.equal(d.getElementById('demo-count').textContent,'1 interactive demo');d.querySelector('[data-filter="all"]').click();assert.equal(d.querySelectorAll('.demo-card:not([hidden])').length,demos.length);
});
test('preview playback is lazy, muted and stops when its card leaves view',async t=>{
 let notify,observed=[];class Observer{constructor(fn){notify=fn;}observe(node){observed.push(node);}disconnect(){}}
 const {d}=setup(t,{Observer}),card=d.getElementById('demo-office'),video=card.querySelector('video'),button=card.querySelector('.preview-toggle');let plays=0,pauses=0;video.play=async()=>{plays++;};video.pause=()=>pauses++;
 assert.equal(observed.length,demos.length);assert.equal(video.getAttribute('src'),null);assert.equal(video.muted,true);
 notify([{target:card,isIntersecting:true}]);await settle();assert.equal(plays,1);assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(video.getAttribute('src'),'/media/office-preview.mp4');
 notify([{target:card,isIntersecting:false}]);assert.ok(pauses>0);assert.equal(button.getAttribute('aria-pressed'),'false');
 button.click();await settle();assert.equal(button.getAttribute('aria-pressed'),'true');button.click();assert.equal(button.getAttribute('aria-pressed'),'false');
});
test('reduced motion and data saving require an explicit play action',async t=>{
 for(const setting of [{reduced:true},{saveData:true}]){let notify;class Observer{constructor(fn){notify=fn;}observe(){}disconnect(){}}const {d,app}=setup(t,{...setting,Observer}),card=d.getElementById('demo-office'),video=card.querySelector('video');let plays=0;video.play=async()=>{plays++;};notify([{target:card,isIntersecting:true}]);await settle();assert.equal(plays,0);assert.equal(video.getAttribute('src'),null);card.querySelector('.preview-toggle').click();await settle();assert.equal(plays,1);app.dispose();}
});
test('an unavailable preview leaves the launch link and poster intact',async t=>{
 const {d}=setup(t),card=d.getElementById('demo-exchange'),video=card.querySelector('video'),button=card.querySelector('.preview-toggle');video.play=async()=>{throw Error('blocked');};button.click();await settle();assert.equal(button.getAttribute('aria-pressed'),'false');assert.match(button.title,/could not play/);assert.equal(card.querySelector('.demo-launch').getAttribute('href'),'/demos/exchange/');assert.ok(video.getAttribute('poster').endsWith('exchange-poster.png'));
});
test('the host allows SDK WebAssembly and both public market feeds and preserves executable demo bundles',async()=>{
 const headers=await fs.readFile(new URL('../dist/_headers',import.meta.url),'utf8');assert.match(headers,/wasm-unsafe-eval/);assert.match(headers,/https:\/\/api.coinbase.com/);assert.match(headers,/https:\/\/api.exchange.coinbase.com/);
 for(const demo of demos){const source=await fs.readFile(new URL('../dist'+demo.path+'index.html',import.meta.url),'utf8');assert.match(source,/<a[^>]*href="\/"[^>]*>← All demos<\/a>/);for(const [,script]of source.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g))new Script(script);}
 const capture=JSON.parse(await fs.readFile(new URL('../tools/preview/exchange-capture.json',import.meta.url),'utf8'));assert.equal(capture.order_verification.valid,true);assert.ok(capture.frames.at(-1).matchCount>capture.frames[0].matchCount);assert.match(capture.scope,/illustrative/);
});
