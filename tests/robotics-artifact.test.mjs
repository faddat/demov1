import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Script} from 'node:vm';
import {Window} from 'happy-dom';
import {verifyRoboticsExport} from '../tools/verify-robotics-export.mjs';
const html=await fs.readFile('dist/demos/robotics/index.html','utf8'),bytes=await fs.readFile('robotics/src/sdk-engine.wasm');
test('the final self-contained Robotics Lab boots the actual WASM and supports all three scenarios',async t=>{
 const w=new Window({url:'https://hub.test/demos/robotics/',settings:{enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true}});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.WebAssembly=WebAssembly;let network=0;w.fetch=async()=>{network++;throw Error('Robotics must work locally');};w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 t.after(async()=>{w.dispatchEvent(new w.Event('pagehide'));await w.happyDOM.abort();w.close();});w.document.write(html);
 for(let i=0;i<200&&!w.RoboticsLab;i++)await new Promise(r=>setTimeout(r,10));assert.ok(w.RoboticsLab,w.document.getElementById('sdk-error')?.textContent);const app=w.RoboticsLab;
 assert.equal(app.guide.active,true);app.tick(33);assert.equal(app.model.delivered,1);assert.ok(app.model.records.every(r=>r.signature_valid&&r.readback_matches));
 app.scenario('failure');app.tick(65);assert.equal(app.model.failed,1);assert.equal(app.model.delivered,1);
 app.scenario('tamper');app.tick(40);assert.equal(w.document.getElementById('record-inspector').open,true);app.modify();app.verify();assert.equal(w.document.getElementById('verification-result').dataset.valid,'false');app.restore();app.verify();assert.equal(w.document.getElementById('verification-result').dataset.valid,'true');
 assert.equal((await verifyRoboticsExport(JSON.parse(JSON.stringify(app.model.export())),bytes)).valid,true);assert.equal(network,0);
});
test('the embedded script parses, all required paths exist and the preview contains verifiable SDK evidence',async()=>{
 for(const [,script]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(script);
 assert.doesNotMatch(html,/ROBOTICS_WASM|ROBOTICS_SCRIPT|ROBOTICS_STYLE/);assert.match(html,/id="robotics-wasm"/);assert.match(html,/What’s powered by the SDK/);assert.match(html,/Simulation Assumptions &amp; SDK Details|Simulation Assumptions & SDK Details/);
 for(const file of ['dist/media/robotics-preview.mp4','dist/media/robotics-poster.png','dist/demos/robotics/index.html'])assert.ok((await fs.stat(file)).size>1000);
 const preview=JSON.parse(await fs.readFile('robotics/preview-capture.json','utf8'));assert.ok(preview.records.length>10);assert.equal((await verifyRoboticsExport(preview,bytes)).valid,true);
});
