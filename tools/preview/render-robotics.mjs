import fs from 'node:fs/promises';
import {Window} from 'happy-dom';
import * as THREE from 'three';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {RoboticsSdk} from '../../robotics/src/sdk.js';
import {Warehouse,COLORS} from '../../robotics/src/simulation.js';
import {buildWarehouse,VIEW,cameraBounds} from '../../robotics/src/warehouse-model.js';
const output=process.argv[2];if(!output)throw Error('Provide a temporary frame directory.');await fs.mkdir(output,{recursive:true});
const sdk=await RoboticsSdk.create(await fs.readFile('robotics/src/sdk-engine.wasm')),model=new Warehouse(sdk,{session:()=> 'robotics-preview-20261016',now:()=>1792108800000});model.start();
const window=new Window();globalThis.document=window.document;const renderer=new SVGRenderer();renderer.setSize(960,540);renderer.setQuality('low');renderer.setPrecision(1);
const world=new THREE.Scene();world.add(new THREE.AmbientLight('#ffffff',.7));const light=new THREE.DirectionalLight('#fff4db',.55);light.position.set(4,10,5);world.add(light);
const geometry=buildWarehouse();world.add(geometry.root);geometry.root.traverse(o=>{if(o.material?.isMeshStandardMaterial)o.material=new THREE.MeshLambertMaterial({color:o.material.color,flatShading:true,side:o.material.side});if(o.parent===geometry.root&&o.position.y<.06)o.renderOrder=-100;});
const bounds=cameraBounds(960/540),camera=new THREE.OrthographicCamera(bounds.left,bounds.right,bounds.top,bounds.bottom,.1,70);camera.position.set(...VIEW.position);camera.lookAt(...VIEW.target);camera.updateMatrixWorld();
for(let i=0;i<96;i++){
 model.tick(.5);geometry.update(model.robots,0,model.seconds,false,model.tasks);renderer.render(world,camera);
 let svg=renderer.domElement.outerHTML,labels='';
 for(const r of model.robots){const point=new THREE.Vector3(r.position[0],.9,r.position[1]).project(camera),x=point.x*480,y=-point.y*270;labels+=`<rect x="${(x-10).toFixed(1)}" y="${(y-15).toFixed(1)}" width="20" height="15" rx="2" fill="${COLORS[r.index]}"/><text x="${x.toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle" font-family="monospace" font-size="8" fill="white">${r.index+1}</text>`;}
 const pickup=model.records.some(r=>r.payload.event_type==='pickup'),line=model.delivered?'Completion records written and verified.':pickup?'A pickup becomes a signed operational event.':'Six demo robots. Identifiable work.',stage=model.delivered?4:pickup?1:0;
 const flow=['Assign','Collect','Deliver','Record','Verify'].map((s,n)=>`<text x="${30+n*137}" y="524" fill="${n<=stage?'#315c3b':'#a7b298'}" font-family="monospace" font-size="9">${s}${n<4?'  →':''}</text>`).join('');
 const hud=`<g transform="translate(-480 -270)"><rect width="960" height="39" fill="#f0f4e8"/><text x="20" y="25" font-family="monospace" font-size="11" fill="#526d45">ROBOTICS LAB / LOCAL SDK</text><text x="940" y="25" text-anchor="end" font-family="monospace" font-size="10" fill="#798d66">${model.records.length} RECORDS · ${model.verifications} SIGNATURE CHECKS</text><rect y="474" width="960" height="66" fill="#f0f4e8"/><text x="25" y="500" font-family="Arial,sans-serif" font-size="18" fill="#344d30">${line}</text><text x="937" y="500" text-anchor="end" font-family="monospace" font-size="8" fill="#8d9d7a">SIMULATION · 4× PLAYBACK</text>${flow}</g>`;
 svg=svg.replace(/(<svg[^>]*>)/,'$1<rect x="-480" y="-270" width="960" height="540" fill="#e1e8dc"/>').replace('</svg>',labels+hud+'</svg>');
 await fs.writeFile(output+'/'+String(i).padStart(3,'0')+'.svg',svg);
}
await fs.writeFile('robotics/preview-capture.json',JSON.stringify(model.export()));console.log(JSON.stringify({frames:96,records:model.records.length,delivered:model.delivered}));window.close();
