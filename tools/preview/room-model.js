import * as THREE from 'three';

export const OFFICE_CAMERA={position:[5.2,3.6,5.5],target:[0,1.3,.15],fov:44};
export const FIRST_PERSON_CAMERA={position:[0,2.06,1.43],target:[0,2.05,-.30],fov:58};
export const SCREEN={width:2.48,height:1.40,position:[0,2.12,-.287]};
export const MONITOR_SIZE={width:1024,height:600};
export function deskFov(aspect){const distance=FIRST_PERSON_CAMERA.position[2]-SCREEN.position[2];return THREE.MathUtils.radToDeg(2*Math.atan(Math.max(SCREEN.height/(2*distance*.82),SCREEN.width/(2*distance*aspect*.88))));}

export function buildRoom(screenTexture=null){
  const root=new THREE.Group();root.name='low-poly-trading-office';
  const materials=new Map(),unit=new THREE.BoxGeometry(1,1,1);
  const mat=(color,emissive=false)=>{const key=color+emissive;if(!materials.has(key))materials.set(key,emissive?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0,flatShading:true}));return materials.get(key);};
  const box=(w,h,d,color,x,y,z,parent=root)=>{const m=new THREE.Mesh(unit,mat(color));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const cylinder=(top,bottom,h,segments,color,x,y,z,parent=root)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,segments),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  function bone(start,end,radius,color,parent=root){const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),dir=b.clone().sub(a);const m=cylinder(radius,radius*.92,dir.length(),6,color,0,0,0,parent);m.position.copy(a.add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;}
  const floor=box(7.6,.16,6.3,'#c5c8ae',0,-.10,.05);floor.name='office-floor';
  for(let x=-3.5;x<=3.5;x+=.55)box(.018,.008,6.2,'#a7b19c',x,-.014,.05);
  box(.12,3.8,5.5,'#d7dbc6',-3.65,1.8,-.3);
  box(7.4,.9,.16,'#c0cebd',0,.42,-2.65);box(7.4,.44,.16,'#e1e5d3',0,3.75,-2.65);
  for(const x of [-3.5,-1.15,1.15,3.5])box(.075,2.9,.18,'#8fa89d',x,2.28,-2.65);
  box(7.1,.065,.24,'#a6b8aa',0,.9,-2.56);box(7.1,.06,.16,'#a2b8ab',0,3.52,-2.56);
  const windowGlass=new THREE.Mesh(new THREE.PlaneGeometry(7,2.6),new THREE.MeshBasicMaterial({color:'#4c97a8',transparent:true,opacity:.045,side:THREE.DoubleSide,depthWrite:false}));windowGlass.position.set(0,2.22,-2.62);root.add(windowGlass);
  const city=new THREE.Group();city.name='low-poly-city';root.add(city);
  const windowGeometry=new THREE.BoxGeometry(.08,.13,.016),windows=new THREE.InstancedMesh(windowGeometry,new THREE.MeshBasicMaterial({color:'#c0d7a3'}),360),dummy=new THREE.Object3D();let n=0;
  for(let i=0;i<15;i++){
    const x=(i-7)*.8,z=-4-(i%3)*1.15,h=1.3+((i*7)%9)*.37,w=.57+(i%3)*.12;
    box(w,h,.68,i%2?'#b3c4bb':'#9bb3ac',x,h/2-.1,z,city);
    for(let row=0;row<Math.floor(h/.32);row++)for(let col=0;col<3;col++)if((i*11+row*5+col)%4!==0&&n<360){dummy.position.set(x-w*.32+col*w*.32,row*.31+.17,z+.349);dummy.updateMatrix();windows.setMatrixAt(n,dummy.matrix);windows.setColorAt(n,new THREE.Color((i+row)%3===0?'#a6c3b0':'#477e91'));n++;}
  }
  windows.count=n;windows.instanceMatrix.needsUpdate=true;city.add(windows);
  box(3.7,.15,1.55,'#927957',0,1.22,.05).name='solid-polygon-desk';
  box(3.76,.035,1.57,'#baa27b',0,1.304,.05);
  for(const x of [-1.5,1.5])for(const z of [-.5,.62])box(.095,1.16,.095,'#162a30',x,.59,z);
  box(2.9,.08,.08,'#24373c',0,.24,-.5);

  const computer=new THREE.Group();computer.name='low-poly-computer';root.add(computer);
  box(.75,.055,.4,'#1e3138',0,1.345,-.43,computer);
  box(.13,.23,.13,'#32464d',0,1.47,-.46,computer);
  box(2.70,1.58,.24,'#26313c',0,2.12,-.43,computer).name='monitor-bezel';
  box(2.57,1.49,.035,'#131d27',0,2.12,-.300,computer);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.width,SCREEN.height),new THREE.MeshBasicMaterial({map:screenTexture,color:screenTexture?'#ffffff':'#0b1a20',toneMapped:false}));screen.position.set(...SCREEN.position);screen.name='physical-monitor-screen';computer.add(screen);
  box(.035,.012,.006,'#baf16e',.81,1.47,-.301,computer);
  box(.06,.026,.015,'#657d79',.73,1.47,-.299,computer);
  box(1.26,.048,.44,'#25373c',0,1.342,.48,computer).name='low-poly-keyboard';
  const keys=new THREE.InstancedMesh(new THREE.BoxGeometry(.071,.024,.069),mat('#b9c6bc'),49);let keyIndex=0;
  for(let row=0;row<4;row++)for(let col=0;col<12;col++){dummy.position.set(-.48+col*.087,1.376,.335+row*.088);dummy.updateMatrix();keys.setMatrixAt(keyIndex++,dummy.matrix);}
  dummy.position.set(0,1.376,.68);dummy.scale.set(5,1,1);dummy.updateMatrix();keys.setMatrixAt(keyIndex,dummy.matrix);keys.instanceMatrix.needsUpdate=true;computer.add(keys);
  box(.50,.014,.55,'#203039',1.04,1.326,.42,computer);
  const mouse=new THREE.Mesh(new THREE.SphereGeometry(.11,6,4),mat('#c1ccc2'));mouse.scale.set(.7,.42,1.13);mouse.position.set(1.04,1.37,.42);computer.add(mouse);
  box(.42,.76,.70,'#203038',1.48,1.70,-.35,computer).name='low-poly-pc-tower';
  box(.35,.69,.018,'#13232b',1.48,1.70,.008,computer);
  for(const y of [1.5,1.7,1.9]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.115,.012,4,10),mat('#8eccbb',true));ring.position.set(1.48,y,.025);computer.add(ring);cylinder(.025,.025,.014,6,'#7babb3',1.48,y,.028,computer).rotation.x=Math.PI/2;}
  box(.05,.015,.02,'#baf16e',1.6,2.025,.023,computer);

  const chair=new THREE.Group();chair.name='trader-chair';root.add(chair);
  box(.79,.12,.76,'#344e50',0,.72,1.47,chair);box(.78,.85,.12,'#304b4d',0,1.18,1.85,chair);
  box(.63,.64,.04,'#486360',0,1.2,1.77,chair);cylinder(.06,.07,.53,8,'#1c2e34',0,.4,1.46,chair);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;bone([0,.16,1.46],[Math.cos(a)*.5,.13,1.46+Math.sin(a)*.5],.035,'#24393d',chair);const wheel=cylinder(.065,.065,.06,6,'#101f25',Math.cos(a)*.5,.09,1.46+Math.sin(a)*.5,chair);wheel.rotation.z=Math.PI/2;}
  for(const x of [-.48,.48]){box(.07,.29,.08,'#263d40',x,.87,1.56,chair);box(.1,.055,.49,'#607874',x,1.04,1.47,chair);}

  const trader=new THREE.Group();trader.name='low-poly-human-trader';root.add(trader);
  const torso=box(.67,.61,.39,'#7c9886',0,1.36,1.42,trader);torso.rotation.x=-.08;
  box(.24,.48,.016,'#d5d9c7',0,1.42,1.207,trader);
  cylinder(.09,.11,.16,6,'#916448',0,1.75,1.40,trader);
  const head=new THREE.Group();head.position.set(0,1.97,1.39);head.name='trader-head';trader.add(head);
  const face=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,0),mat('#a37451'));face.scale.set(.89,1.13,.94);head.add(face);
  const hair=new THREE.Mesh(new THREE.IcosahedronGeometry(.235,0),mat('#1d292d'));hair.position.set(0,.09,.03);hair.scale.set(.94,.78,.96);head.add(hair);
  box(.29,.055,.035,'#263238',0,.015,-.185,head);box(.017,.10,.018,'#29383c',-.159,.015,-.09,head);box(.017,.10,.018,'#29383c',.159,.015,-.09,head);
  box(.055,.045,.035,'#a37451',0,-.045,-.214,head);
  const arms=[];
  for(const sign of [-1,1]){
    bone([sign*.32,1.59,1.39],[sign*.46,1.40,1.02],.095,'#7c9886',trader);
    const arm=new THREE.Group();arm.position.set(sign*.46,1.4,1.02);trader.add(arm);
    bone([0,0,0],[-sign*.14,-.045,-.46],.068,'#a37451',arm);
    const hand=new THREE.Mesh(new THREE.IcosahedronGeometry(.09,0),mat('#a37451'));hand.scale.set(.8,.45,1.08);hand.position.set(-sign*.14,-.06,-.49);arm.add(hand);arms.push(arm);
    bone([sign*.20,.69,1.36],[sign*.20,.50,.94],.12,'#23353d',trader);bone([sign*.20,.50,.94],[sign*.20,.13,.75],.105,'#23353d',trader);box(.20,.13,.33,'#15272e',sign*.20,.075,.64,trader);
  }

  // Desk lamp, mug, notebooks and a corner plant are all polygon geometry.
  cylinder(.16,.19,.055,8,'#264341',-1.3,1.356,-.16);
  bone([-1.3,1.38,-.16],[-1.3,1.86,-.24],.025,'#789387');bone([-1.3,1.86,-.24],[-.98,2.10,-.20],.024,'#789387');
  const shade=cylinder(.06,.22,.23,8,'#b3c2a6',-.97,2.05,-.2);shade.rotation.z=-.18;
  box(.44,.045,.31,'#6a887d',-.94,1.35,.49).rotation.y=.15;box(.41,.02,.29,'#dbd3ad',-.94,1.382,.49).rotation.y=.15;
  cylinder(.09,.075,.2,10,'#c4b58e',.78,1.42,-.22);cylinder(.073,.073,.006,10,'#392d24',.78,1.523,-.22);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.065,.016,4,8),mat('#c4b58e'));handle.position.set(.89,1.43,-.22);root.add(handle);
  function plant(x,z,size=1){
    cylinder(.26*size,.19*size,.44*size,7,'#bda581',x,.22*size,z);cylinder(.235*size,.235*size,.02,7,'#423d31',x,.45*size,z);
    for(let i=0;i<8;i++){const a=i*Math.PI*2/8,end=[x+Math.cos(a)*.4*size,.65*size+(i%3)*.22*size,z+Math.sin(a)*.4*size];bone([x,.4*size,z],end,.015*size,'#587752');const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.23*size,0),mat(i%2?'#7eaa62':'#557e57'));leaf.position.set(...end);leaf.scale.set(.6,1.8,.42);leaf.rotation.set(.4,Math.PI-a,.5);root.add(leaf);}
  }
  plant(-2.55,-1.75,1.35);plant(2.85,-1.75,.9);
  const poster=box(.028,1.0,.84,'#b9c1ac',-3.57,2.2,.2);poster.name='wall-print';
  for(let i=0;i<4;i++)box(.012,.08,.1+i*.12,'#456e65',-3.548,2.5-i*.18,.2);
  box(1.15,.7,.64,'#384c49',-2.53,.35,.1);box(1.18,.05,.67,'#b3aa8c',-2.53,.72,.1);

  const candleBodies=new THREE.InstancedMesh(unit,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),120);
  const candleWicks=new THREE.InstancedMesh(unit,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),120);
  // These few monitor instances are dynamic; an initially empty bounding sphere
  // must never cull the chart when the camera moves into the chair.
  candleBodies.frustumCulled=false;candleWicks.frustumCulled=false;
  candleBodies.name='low-poly-candle-bodies';candleWicks.name='low-poly-candle-wicks';candleBodies.count=0;candleWicks.count=0;computer.add(candleBodies,candleWicks);
  function setCandles(layout){
    const toX=p=>(p/MONITOR_SIZE.width-.5)*SCREEN.width,toY=p=>(.5-p/MONITOR_SIZE.height)*SCREEN.height;
    layout.bars.forEach((b,i)=>{
      const color=new THREE.Color(b.up?'#0ecb81':'#f6465d');
      dummy.position.set(toX(b.x),SCREEN.position[1]+toY((b.openY+b.closeY)/2),SCREEN.position[2]+.011);dummy.scale.set(b.width/MONITOR_SIZE.width*SCREEN.width,Math.max(.004,Math.abs(b.openY-b.closeY)/MONITOR_SIZE.height*SCREEN.height),.012);dummy.rotation.set(0,0,0);dummy.updateMatrix();candleBodies.setMatrixAt(i,dummy.matrix);candleBodies.setColorAt(i,color);
      dummy.position.set(toX(b.x),SCREEN.position[1]+toY((b.highY+b.lowY)/2),SCREEN.position[2]+.009);dummy.scale.set(.002,Math.max(.004,Math.abs(b.highY-b.lowY)/MONITOR_SIZE.height*SCREEN.height),.008);dummy.updateMatrix();candleWicks.setMatrixAt(i,dummy.matrix);candleWicks.setColorAt(i,color);
    });
    candleBodies.count=layout.bars.length;candleWicks.count=layout.bars.length;
    for(const m of [candleBodies,candleWicks]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.computeBoundingBox();}
  }
  function setFirstPerson(value){head.visible=!value;}
  return {root,head,arms,trader,screen,candleBodies,candleWicks,setCandles,setFirstPerson};
}
