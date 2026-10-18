import * as THREE from 'three';
import {COLORS,HOMES,SHELVES,DESTINATIONS} from './simulation.js';
export const VIEW={position:[11,12,15],target:[0,0,0],span:11.7};
export function cameraBounds(aspect){const height=Math.max(VIEW.span,18.8/aspect);return {left:-height*aspect/2,right:height*aspect/2,top:height/2,bottom:-height/2};}
export function buildWarehouse(){
 const root=new THREE.Group(),bots=[],unit=new THREE.BoxGeometry(1,1,1),materials=new Map();
 const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.88,flatShading:true}));return materials.get(color);};
 const box=(w,h,d,color,x,y,z,parent=root)=>{const mesh=new THREE.Mesh(unit,mat(color));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const cylinder=(r,h,color,x,y,z,parent=root)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
 box(12.5,.18,11.6,'#d1d5c3',0,-.13,0);box(12.4,.12,.16,'#8a9b81',0,.02,-5.7);box(.16,.12,11.4,'#8a9b81',-6.1,.02,0);
 for(let x=-6;x<=6;x+=1)box(.014,.01,11.3,'#bcc6b2',x,-.03,0);
 for(let z=-5.5;z<=5.5;z+=1)box(12.2,.01,.014,'#bcc6b2',0,-.03,z);
 box(1.8,.012,9.9,'#e3e7da',0,-.014,0);box(10.4,.013,1.05,'#e3e7da',0,-.012,3.9);box(10.4,.013,.9,'#e3e7da',0,-.012,-4.5);
 for(let z=-4;z<=3;z+=.65)box(.05,.02,.25,'#9aad8e',0,.003,z);
 for(let x=-4;x<=4;x+=.65)box(.25,.02,.045,'#9aad8e',x,.004,3.9);
 for(let i=0;i<SHELVES.length;i++){
  const [service,z]=SHELVES[i],x=Math.sign(service)*4.3;
  for(const level of [.08,.85,1.65])box(2.2,.11,1.25,'#9c9e81',x,level,z);
  for(const dx of [-1.05,1.05])for(const dz of [-.56,.56])box(.07,2.15,.07,'#5d786a',x+dx,1.02,z+dz);
  for(let j=0;j<6;j++){const dx=(j%3-1)*.58,y=j<3?.38:1.17;box(.46,.5,.62,j%2?'#bca27a':'#ceb58a',x+dx,y,z);box(.07,.012,.63,'#eadbb1',x+dx,y+.255,z);box(.22,.12,.012,'#eee9d6',x+dx,y,z+.317);}
  box(.6,.016,.7,'#8bb0a2',service,.01,z);
 }
 HOMES.forEach(([x,z],i)=>{box(1.2,.035,.9,'#6b8175',x,.015,z);box(.82,.06,.46,'#eceddf',x,.065,z);box(.82,.30,.14,'#627e71',x,.20,z-.4);box(.35,.025,.035,'#aaca87',x,.35,z-.31);});
 DESTINATIONS.forEach(([x,z],i)=>{box(1.45,.02,1.35,i?'#9db6a8':'#adc49a',x,.012,z);for(const dx of [-.6,.6])box(.07,.9,.07,'#597361',x+dx,.45,z+.55);box(1.3,.12,.8,'#b5a181',x,.94,z+.55);box(.5,.34,.4,'#c6ab7d',x,1.15,z+.55);});
 box(1.8,.9,.85,'#8caa97',-4.4,.45,4.5);box(1.9,.08,.92,'#d1c5a0',-4.4,.94,4.5);for(let i=0;i<3;i++)box(.35,.35,.35,'#b99f75',-4.9+i*.45,1.17,4.5);
 // A restrained backdrop keeps the lanes and robot states readable.
 for(let i=0;i<5;i++){box(1.8,.7,.2,'#c5cfbe',-4.6+i*2.3,.3,-5.65);box(.08,1.6,.08,'#8ba18d',-5.6+i*2.3,.75,-5.6);}
 const robotRoots=[];
 for(let i=0;i<6;i++){
  const group=new THREE.Group();group.name='robot-'+i;root.add(group);const body=new THREE.Group();group.add(body);
  box(.72,.26,.82,'#374e4b',0,.23,0,body);box(.66,.16,.75,COLORS[i],0,.43,0,body);box(.49,.025,.45,'#edf1e2',0,.522,0,body);
  box(.36,.10,.025,'#263d3c',0,.37,.422,body);for(const x of [-.21,.21])box(.095,.05,.025,'#c4e8bf',x,.38,.439,body);
  const beacon=cylinder(.08,.08,'#b8d69e',0,.59,-.24,body);beacon.material=beacon.material.clone();cylinder(.16,.035,'#58736c',0,.53,-.24,body);
  const wheels=[];for(const x of [-.36,.36])for(const z of [-.23,.23]){const wheel=cylinder(.14,.09,'#253735',x,.16,z,body);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}
  const packageMesh=box(.48,.40,.48,'#c1a374',0,.74,.04,body);box(.125,.03,1.02,'#eddfb9',0,.515,0,packageMesh);packageMesh.visible=false;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.49,.54,24),new THREE.MeshBasicMaterial({color:COLORS[i],side:THREE.DoubleSide,transparent:true,opacity:.5}));ring.rotation.x=-Math.PI/2;ring.position.y=.023;group.add(ring);
  const fail=new THREE.Mesh(new THREE.OctahedronGeometry(.13),mat('#bb624d'));fail.position.set(0,1.05,0);fail.visible=false;group.add(fail);
  const robot={group,body,beacon,wheels,packageMesh,ring,fail,index:i};bots.push(robot);robotRoots.push(group);
 }
 const dropped=Array.from({length:6},()=>{const mesh=box(.36,.32,.36,'#c1a374',0,.18,0);mesh.visible=false;return mesh;});
 function update(robots,selected=0,clock=0,reduced=false,tasks=[]){for(const r of robots){const mesh=bots[r.index];mesh.group.position.set(r.position[0],0,r.position[1]);mesh.body.rotation.y=r.heading;mesh.packageMesh.visible=r.carrying;mesh.fail.visible=r.failed;mesh.ring.material.opacity=r.index===selected?.9:.22;mesh.ring.scale.setScalar(r.index===selected?1.15:1);mesh.body.position.y=!reduced&&r.state==='moving'?Math.sin(clock*12+r.index)*.012:0;for(const wheel of mesh.wheels)wheel.rotation.x=!reduced&&r.state==='moving'?clock*8:0;mesh.group.visible=true;mesh.beacon.material.color.set(r.failed?'#bd634e':r.state==='charging'?'#e6b96a':r.enabled?'#a9d493':'#8a9a90');}const waiting=tasks.filter(t=>t.recovery&&!['picked_up','completed'].includes(t.state));dropped.forEach((mesh,i)=>{mesh.visible=!!waiting[i];if(waiting[i])mesh.position.set(waiting[i].pickup[0]+.42,.18,waiting[i].pickup[1]);});}
 return {root,bots,robotRoots,update};
}
