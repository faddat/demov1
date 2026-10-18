import fs from 'node:fs/promises';
import * as THREE from 'three';
import {Window} from 'happy-dom';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {buildRoom,OFFICE_CAMERA,SCREEN} from './room-model.js';
import {candlesFromFills,candleLayout} from './candles.js';
const output=process.argv[2];if(!output)throw Error('Provide a temporary frame-output directory.');
await fs.mkdir(output,{recursive:true});
const capture=JSON.parse(await fs.readFile(new URL('./exchange-capture.json',import.meta.url),'utf8'));
if(!capture.order_verification.valid)throw Error('Preview order signature failed.');
const window=new Window();globalThis.document=window.document;
const renderer=new SVGRenderer();renderer.setSize(960,540);renderer.setQuality('low');renderer.setPrecision(2);renderer.setClearColor('#dfe7dc');
const scene=new THREE.Scene();scene.background=new THREE.Color('#dfe7dc');scene.add(new THREE.AmbientLight('#ffffff',.7));
const light=new THREE.DirectionalLight('#fff7df',.5);light.position.set(3,7,5);scene.add(light);
const model=buildRoom();scene.add(model.root);
const flat=m=>m.isMeshStandardMaterial?new THREE.MeshLambertMaterial({color:m.color,flatShading:true,side:m.side}):m;
const instanced=[];model.root.traverse(o=>{if(o.material)o.material=flat(o.material);if(o.isInstancedMesh)instanced.push(o);});
const expansions=[];
for(const source of instanced){
 const group=new THREE.Group();source.updateMatrix();group.matrix.copy(source.matrix);group.matrixAutoUpdate=false;source.parent.add(group);source.visible=false;
 const meshes=[];for(let i=0;i<source.instanceMatrix.count;i++){const mesh=new THREE.Mesh(source.geometry,source.material.clone());mesh.matrixAutoUpdate=false;group.add(mesh);meshes.push(mesh);}expansions.push({source,meshes});
}
const camera=new THREE.PerspectiveCamera(OFFICE_CAMERA.fov,960/540,.04,50),color=new THREE.Color();
const phrases=['A paper order starts here.','The SDK signs the order.','The signature is verified.','Compatible orders match.','Inspect the signed trail.'];
for(let i=0;i<capture.frames.length;i++){
 const frame=capture.frames[i],layout=candleLayout(candlesFromFills(frame.fills),{x:30,y:151,width:665,height:266,slots:Math.max(12,Math.ceil(frame.fills.length/3)+2)});model.setCandles(layout);
 for(const {source,meshes}of expansions)meshes.forEach((mesh,n)=>{mesh.visible=n<source.count;if(mesh.visible){source.getMatrixAt(n,mesh.matrix);if(source.instanceColor){source.getColorAt(n,color);mesh.material.color.copy(color);}}});
 const angle=Math.sin(i/capture.frames.length*Math.PI*2)*.035,radius=Math.hypot(OFFICE_CAMERA.position[0],OFFICE_CAMERA.position[2]),base=Math.atan2(OFFICE_CAMERA.position[0],OFFICE_CAMERA.position[2]);
 camera.position.set(Math.sin(base+angle)*radius,3.6,Math.cos(base+angle)*radius);camera.lookAt(...OFFICE_CAMERA.target);model.head.rotation.y=Math.sin(i*.24)*.035;model.arms.forEach((arm,j)=>arm.rotation.x=Math.sin(i*(.5+j*.03))*.025);
 renderer.render(scene,camera);
 let svg=renderer.domElement.outerHTML;
 const point=(x,y)=>{const p=new THREE.Vector3((x/1024-.5)*SCREEN.width,SCREEN.position[1]+(.5-y/600)*SCREEN.height,SCREEN.position[2]+.012).project(camera);return [p.x*480,-p.y*270];};
 const points=coords=>coords.map(p=>point(...p).map(n=>n.toFixed(2)).join(',')).join(' ');
 let screen=`<polygon points="${points([[0,0],[1024,0],[1024,600],[0,600]])}" fill="#101b25" stroke="#698c82" stroke-width="1"/>`;
 for(const y of [170,260,350,440])screen+=`<polyline points="${points([[30,y],[985,y]])}" stroke="#29404b" stroke-width=".55"/>`;
 for(const b of layout.bars){screen+=`<polyline points="${points([[b.x,b.highY],[b.x,b.lowY]])}" stroke="${b.up?'#0ecb81':'#f6465d'}" stroke-width="1"/><polygon points="${points([[b.x-b.width/2,b.openY],[b.x+b.width/2,b.openY],[b.x+b.width/2,b.closeY],[b.x-b.width/2,b.closeY]])}" fill="${b.up?'#0ecb81':'#f6465d'}"/>`;}
 const title=point(45,75),baseline=point(45,550);screen+=`<text x="${title[0]}" y="${title[1]}" fill="#e6ebd7" font-family="monospace" font-size="9">BTC / USDC</text><text x="${baseline[0]}" y="${baseline[1]}" fill="#7da491" font-family="monospace" font-size="6">SDK PAPER FILLS</text>`;
 const progress=[0,1,2,3,4].map(n=>`<rect x="${24+n*181}" y="510" width="168" height="3" fill="${n<=frame.phase?'#1246b6':'#c6d2c0'}"/>`).join('');
 const hud=`<g transform="translate(-480 -270)"><rect x="0" y="0" width="960" height="49" fill="#eff2e9"/><text x="22" y="29" fill="#38513b" font-family="monospace" font-size="12">BTC / USDC · PAPER SESSION</text><text x="938" y="29" text-anchor="end" fill="#6b7b63" font-family="monospace" font-size="11">${frame.matchCount} MATCHES · ${frame.recordCount} SIGNED ORDERS</text><rect x="0" y="462" width="960" height="78" fill="#eff2e9"/><text x="24" y="491" fill="#263e2c" font-family="Arial,sans-serif" font-size="19">${phrases[frame.phase]}</text><text x="934" y="491" text-anchor="end" fill="#829078" font-family="monospace" font-size="9">ILLUSTRATIVE PRICES</text>${progress}</g>`;
 svg=svg.replace(/(<svg[^>]*>)/,'$1<rect x="-480" y="-270" width="960" height="540" fill="#dfe7dc"/>').replace('</svg>',screen+hud+'</svg>');
 await fs.writeFile(output+'/'+String(i).padStart(3,'0')+'.svg',svg);
}
console.log(JSON.stringify({frames:capture.frames.length,output}));window.close();
