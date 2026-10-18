import * as THREE from 'three';
export const VIEW={position:[15,13,18],target:[0,.3,0]};
export const COLORS=['#366bd4','#c69a43'];
export function cameraBounds(aspect){const half=aspect<1.35?9.4/aspect:6.3;return {left:-half*aspect,right:half*aspect,top:half,bottom:-half};}
export function buildWorld(){
 const root=new THREE.Group(),pickables=[],towers=[],blocks=[],rings=[];
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true,...extra});
 const cream=mat('#f7f7ee'),stone=mat('#9eaf9f'),dark=mat('#334d4e'),corridor=mat('#b8c9be'),blue=COLORS.map(c=>mat(c)),lit=COLORS.map(c=>mat(c,{emissive:c,emissiveIntensity:.25}));
 function mesh(geo,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(parent,x,y,z,w,h,d,material){return mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);}
 const floor=mesh(new THREE.PlaneGeometry(90,90),mat('#e7ece2'),root,0,-2.1,0);floor.rotation.x=-Math.PI/2;
 const grid=new THREE.GridHelper(45,45,'#ccd8c9','#dce4d7');grid.position.y=-2.08;root.add(grid);
 for(let n=0;n<2;n++){
  const group=new THREE.Group();group.position.x=n?5.5:-5.5;root.add(group);
  mesh(new THREE.CylinderGeometry(3.3,2.8,.6,6),stone,group,0,-.75,0).rotation.y=Math.PI/6;
  const platform=box(group,0,-.35,0,6.1,.32,4.7,cream);platform.userData={type:'chain',index:n};pickables.push(platform);
  for(let edge=-1;edge<=1;edge+=2)box(group,0,-.14,edge*2.1,5.5,.05,.06,blue[n]);
  box(group,0,.06,0,2.1,.35,1.65,dark);box(group,0,.3,0,1.6,.14,1.25,blue[n]);
  const ring=mesh(new THREE.TorusGeometry(1.05,.035,4,40),lit[n],group,0,.42,0);ring.rotation.x=-Math.PI/2;rings.push(ring);
  const nodes=[];[[-2,1.35],[2,1.35],[-2,-1.35],[2,-1.35]].forEach(([x,z],i)=>{
   const tower=new THREE.Group();tower.position.set(x,0,z);tower.userData={type:'validator',index:n*4+i};group.add(tower);nodes.push(tower);pickables.push(tower);
   box(tower,0,.05,0,.8,.18,.8,dark);box(tower,0,.6,0,.56,1,.56,cream);box(tower,0,1.2,0,.68,.18,.68,blue[n]);
   for(let j=0;j<3;j++)box(tower,0,.35+j*.23,.29,.31,.055,.035,blue[n]);
   const cap=mesh(new THREE.OctahedronGeometry(.21,0),lit[n],tower,0,1.55,0);tower.userData.cap=cap;
   const points=[new THREE.Vector3(x,.08,z),new THREE.Vector3(0,.4,0)];group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:COLORS[n],transparent:true,opacity:.35})));
  });towers.push(nodes);
  const cubes=[];for(let j=0;j<4;j++){const b=box(group,.45,.6+j*.34,0,.62,.27,.62,j===3?lit[n]:blue[n]);b.rotation.y=.25;b.userData={type:'block',index:n};cubes.push(b);pickables.push(b);}blocks.push(cubes);
  for(let j=0;j<3;j++){box(group,-.55+j*.5,-.05,-1.8,.34,.22,.5,corridor);}
 }
 for(let j=0;j<12;j++)box(root,-3.65+j*.66,-.24,0,.5,.055,.92,corridor);
 for(let j=-1;j<=1;j+=2){const points=[new THREE.Vector3(-3.9,.2,j*.6),new THREE.Vector3(0,.65,j*.6),new THREE.Vector3(3.9,.2,j*.6)];root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#9eafa4'})));}
 const courier=new THREE.Group();courier.userData={type:'relay',index:0};root.add(courier);pickables.push(courier);
 mesh(new THREE.OctahedronGeometry(.35,0),mat('#254f45'),courier);box(courier,0,.05,0,.7,.18,.48,cream);const packet=box(courier,0,.35,0,.24,.2,.18,lit[0]);
 [-.43,.43].forEach(x=>[-.28,.28].forEach(z=>{const rotor=mesh(new THREE.CylinderGeometry(.15,.15,.025,6),dark,courier,x,.18,z);rotor.userData.rotor=true;}));
 const gate=mesh(new THREE.TorusGeometry(.65,.06,5,24),mat('#799c77'),root,3.8,.9,0);gate.rotation.y=Math.PI/2;
 function update(m,reduced=false){
  const t=reduced?0:m.seconds;for(let n=0;n<2;n++){const h=m.state.networks[n].height;blocks[n].forEach((b,j)=>{b.visible=j<Math.min(4,h);});rings[n].rotation.z=t*.25;const accepted=m.state.networks[n].accepted_foreign_view;rings[n].material.emissiveIntensity=accepted?.45:.15;towers[n].forEach((tower,i)=>{tower.userData.cap.position.y=1.55+(h&&i<3&&!reduced?Math.sin(t*2+i)*.04:0);});}
  const reverse=(m.delivery||m.selected)?.source_index===1,p=reverse?1-m.transit:m.transit;courier.position.set(-3.8+p*7.6,1.05+Math.sin(p*Math.PI)*.4,reduced?0:Math.sin(t*2)*.035);courier.visible=!!m.delivery||m.stage>=2&&m.stage<=4;packet.rotation.y=t;
  const failed=m.result?.result==='rejected';gate.material.color.set(failed?'#c28652':m.result?.valid?'#6a9a68':'#8faba0');
 }
 return {root,pickables,towers,courier,update};
}
