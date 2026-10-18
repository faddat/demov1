import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {verifySdkSources,engineDigest,sha} from './robotics-source.mjs';
await verifySdkSources();
const bytes=await fs.readFile('robotics/src/sdk-engine.wasm'),fingerprint=JSON.parse(await fs.readFile('robotics/engine/build-fingerprint.json','utf8'));
if(fingerprint.wasm_sha256!==sha(bytes)||fingerprint.engine_source_sha256!==await engineDigest())throw Error('Robotics SDK source/WASM fingerprint differs. Rebuild the engine before publishing.');
const css=await fs.readFile('robotics/src/style.css','utf8'),result=await build({entryPoints:['robotics/src/main.js'],bundle:true,format:'iife',target:'es2022',write:false,minify:true,legalComments:'inline'}),js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
let html=await fs.readFile('robotics/src/index.html','utf8');for(const [from,to]of [['/*ROBOTICS_STYLE*/',css],['/*ROBOTICS_SCRIPT*/',js],['ROBOTICS_WASM',bytes.toString('base64')]]){if(html.split(from).length!==2)throw Error('Robotics insertion point differs: '+from);html=html.replace(from,()=>to);}
await fs.mkdir('dist/demos/robotics',{recursive:true});await fs.writeFile('dist/demos/robotics/index.html',html);console.log('Built Robotics Lab:',Buffer.byteLength(html),'bytes.');
