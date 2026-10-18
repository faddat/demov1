import {SDK_COMMIT} from './sdk.js';
export const COLORS=['#1246b6','#527d53','#a97537','#6363a1','#317c81','#a15e62'];
export const HOMES=Array.from({length:6},(_,i)=>[-4.3+i*1.72,-4.5]);
export const SHELVES=Array.from({length:6},(_,i)=>[(i%2?1:-1)*2.85,-2.6+Math.floor(i/2)*2.5]);
export const DESTINATIONS=[[3.8,4.15],[1.8,4.15]];
export const DEFAULT_ASSUMPTIONS={operatingRate:2.4,electricityRate:.2,movingWatts:80,idleWatts:12,chargingWatts:40,travelUnitsPerSecond:1.1};
const label=i=>'ROBOT-'+String(i+1).padStart(2,'0'),distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export class Warehouse{
 constructor(sdk,{now=()=>Date.now(),session=()=>globalThis.crypto.randomUUID(),onEvent=()=>{}}={}){if(!sdk)throw Error('A working Nunchi SDK instance is required.');Object.assign(this,{sdk,now,newSession:session,onEvent});this.reset();}
 reset({scenario='normal',guided=false,active=6,assumptions=this.assumptions||DEFAULT_ASSUMPTIONS}={}){
  const sessionId=this.newSession(),identity=this.sdk.reset(sessionId);
  this.sessionId=sessionId;this.namespace=identity.namespace;this.identities=identity.identities;this.scenario=scenario;this.guided=guided;this.activeCount=active;this.assumptions={...assumptions};this.minutes=0;this.seconds=0;this.running=false;this.records=[];this.activity=[];this.tasks=[];this.counter=0;this.delivered=0;this.failed=0;this.verifications=0;this.failureIntroduced=false;this.nextArrival=18;
  this.robots=HOMES.map((home,index)=>({index,id:label(index),position:[...home],home:[...home],battery:94-index*5,state:'idle',phase:'idle',task:null,completed:0,failed:false,enabled:index<active,distance:0,energyWh:0,operatingSeconds:0,cost:0,failedCost:0,records:[],route:[],routeIndex:0,heading:0,wait:0,lastOperation:'Ready',carrying:false}));
  for(let i=0;i<(guided||scenario!=='normal'?1:6);i++)this.enqueue(false);
  return this;
 }
 enqueue(dispatch=true){const index=this.counter++,pickup=SHELVES[index%SHELVES.length],destination=DESTINATIONS[index%2],task={id:'DELIVERY-'+String(index+1).padStart(3,'0'),packageId:'PKG-'+String(index+1).padStart(3,'0'),pickup:[...pickup],destination:[...destination],destinationLabel:index%2?'Dispatch B':'Dispatch A',state:'queued',robot:null,records:[],cost:0,recovery:null,attempts:0};this.tasks.push(task);this.log('simulation','New delivery entered the queue.',null,task);if(dispatch)this.dispatch();return task;}
 log(kind,text,robot=null,task=null,record=null){const entry={kind,text,robot:robot?.index??null,task:task?.id??null,record_id:record?.record_id??null,at:this.seconds};this.activity.push(entry);if(this.activity.length>200)this.activity.shift();this.onEvent(entry);}
 emit(robot,type,task=robot.task,extra={}){
  const payload={session_id:this.sessionId,robot_index:robot.index,robot_id:robot.id,task_id:task?.id??null,package_id:task?.packageId??null,event_type:type,destination:task?.destinationLabel??'Charging dock '+(robot.index+1),simulated_ms:Math.round(this.seconds*1000),reported_at_ms:this.now(),battery_percent:Number(robot.battery.toFixed(1)),distance_m:Number(robot.distance.toFixed(3)),energy_wh:Number(robot.energyWh.toFixed(4)),estimated_cost_microusd:robot.cost,task_cost_microusd:task?.cost??0,operating_rate_usd_per_hour:this.assumptions.operatingRate,electricity_usd_per_kwh:this.assumptions.electricityRate,cost_basis:'Application-defined operating time and electricity estimates',previous_record_id:task?.records.at(-1)??null,...extra};
  const record=this.sdk.append(payload);if(!record.signature_valid||!record.readback_matches)throw Error('The SDK did not confirm a matching, valid record.');
  this.records.push(record);robot.records.push(record.record_id);if(task)task.records.push(record.record_id);this.verifications+=record.signature_checks;robot.lastOperation=type;
  this.log('sdk','Signed → Oracle write → readback → signature valid',robot,task,record);return record;
 }
 assign(robot,task){
  const recovery=task.recovery;this.emit(robot,recovery?'reassigned':'assigned',task,recovery?{recovery_of_record_id:recovery.record_id,previous_robot:label(recovery.robot)}:{});
  robot.task=task;task.robot=robot.index;task.state='assigned';task.attempts++;robot.state='assigned';robot.phase='pickup';robot.wait=.7+robot.index*.25;robot.carrying=false;this.route(robot,task.pickup);this.log('simulation',robot.id+' assigned '+task.id+(recovery?' as a recovery.':'.'),robot,task);
 }
 dispatch(){for(const robot of this.robots){if(!robot.enabled||robot.failed||robot.task||!['idle','completed'].includes(robot.state))continue;if(this.guided&&robot.index!==0)continue;const task=this.tasks.find(t=>t.state==='queued');if(!task)break;if(robot.battery<20){this.toCharge(robot);continue;}this.assign(robot,task);}}
 route(robot,target){const lane=(robot.index-2.5)*.25,points=[[lane,robot.position[1]],[lane,target[1]],[...target]];robot.route=points.filter((p,i)=>distance(i?points[i-1]:robot.position,p)>.01);robot.routeIndex=0;}
 start(){this.running=true;if(!this.guided)this.dispatch();}
 pause(){this.running=false;}
 setActive(n){if(!Number.isInteger(n)||n<1||n>6)throw Error('Choose 1–6 active robots.');this.activeCount=n;this.robots.forEach(r=>r.enabled=r.index<n);if(this.running)this.dispatch();}
 setAssumptions(values){for(const [key,min,max]of [['operatingRate',0,100],['electricityRate',0,10]]){const value=Number(values[key]);if(!Number.isFinite(value)||value<min||value>max)throw Error('Choose valid nonnegative cost assumptions.');}this.reset({scenario:this.scenario,active:this.activeCount,assumptions:{...this.assumptions,operatingRate:Number(values.operatingRate),electricityRate:Number(values.electricityRate)}});}
 tick(delta){if(!this.running)return;const steps=Math.ceil(delta/.1),dt=delta/steps;for(let i=0;i<steps;i++)this.step(dt);}
 step(dt){
  this.seconds+=dt;this.minutes=this.seconds/60;
  if(!this.guided&&this.scenario==='normal'&&this.seconds>=this.nextArrival){this.enqueue(false);this.nextArrival+=18;}
  for(const r of this.robots){
   if(!r.enabled&&!r.task&&r.state!=='charging'&&r.phase!=='charge')continue;
   const moving=r.state==='moving',watts=r.state==='charging'?this.assumptions.chargingWatts:moving?this.assumptions.movingWatts:this.assumptions.idleWatts;
   if(!r.failed){const before=r.cost;r.operatingSeconds+=dt;r.energyWh+=watts*dt/3600;r.cost=Math.round((r.operatingSeconds*this.assumptions.operatingRate/3600+r.energyWh/1000*this.assumptions.electricityRate)*1e6);if(r.task)r.task.cost+=r.cost-before;r.battery=Math.max(0,r.battery-dt*(moving?.13:.012));}
   if(r.failed)continue;
   if(r.state==='assigned'){r.wait-=dt;if(r.wait<=0){r.state='moving';if(r.task)r.task.state='moving';}}
   else if(r.state==='moving')this.move(r,dt);
   else if(r.state==='picking_up'){r.wait-=dt;if(r.wait<=0){this.emit(r,'pickup');r.carrying=true;r.task.state='picked_up';r.phase='delivery';r.state='moving';this.route(r,r.task.destination);this.log('simulation',r.id+' collected '+r.task.packageId+'.',r,r.task);}}
   else if(r.state==='delivering'){r.wait-=dt;if(r.wait<=0){const task=r.task;this.emit(r,'delivered');r.completed++;this.delivered++;task.state='completed';r.carrying=false;r.task=null;r.state='completed';r.phase='idle';r.wait=1;this.log('simulation',r.id+' completed '+task.id+'.',r,task);}}
   else if(r.state==='completed'){r.wait-=dt;if(r.wait<=0){r.phase='return';r.state='moving';this.route(r,r.home);}}
   else if(r.state==='charging'){r.battery=Math.min(96,r.battery+dt*9);if(r.battery>=96){this.emit(r,'resumed',null);r.state='idle';r.phase='idle';this.log('simulation',r.id+' is ready after charging.',r);}}
   else if(r.state==='idle'&&r.battery<20)this.toCharge(r);
  }
  if(this.scenario==='failure'&&!this.failureIntroduced){const r=this.robots[0];if(r.carrying&&r.state==='moving'&&r.routeIndex>=1){this.fail(0);this.failureIntroduced=true;}}
  if(!this.guided)this.dispatch();
 }
 move(r,dt){let available=dt*this.assumptions.travelUnitsPerSecond;while(available>0&&r.routeIndex<r.route.length){const target=r.route[r.routeIndex],length=distance(r.position,target);if(length<.00001){r.routeIndex++;continue;}const moved=Math.min(available,length),dx=(target[0]-r.position[0])/length,dz=(target[1]-r.position[1])/length;r.position[0]+=dx*moved;r.position[1]+=dz*moved;r.heading=Math.atan2(dx,dz);r.distance+=moved;available-=moved;if(moved>=length-1e-8)r.routeIndex++;}
  if(r.routeIndex>=r.route.length){if(r.phase==='pickup'){r.state='picking_up';r.wait=1.5;}else if(r.phase==='delivery'){r.state='delivering';r.wait=1.5;}else if(r.phase==='return'){r.state='idle';r.phase='idle';}else{this.emit(r,'charging',null);r.state='charging';this.log('simulation',r.id+' reached its charging dock.',r);}}
 }
 toCharge(r){r.phase='charge';r.state='moving';this.route(r,r.home);}
 fail(index){const r=this.robots[index];if(!r||r.failed||!r.task)throw Error('Select a robot with a delivery in progress.');const task=r.task,record=this.emit(r,'failed',task,{failure_reason:'User-triggered simulated malfunction',carrying_package:r.carrying});r.failed=true;r.state='failed';r.failedCost+=task.cost;r.task=null;r.carrying=false;this.failed++;task.state='queued';task.robot=null;if(record.payload.carrying_package)task.pickup=[...r.position];task.recovery={robot:index,record_id:record.record_id};this.log('simulation',r.id+' stopped. '+task.id+' is queued for another healthy robot.',r,task,record);if(!this.guided)this.dispatch();return record;}
 repair(index){const r=this.robots[index];if(!r?.failed)return;this.emit(r,'resumed',null,{reason:'Application simulated a completed repair'});r.failed=false;r.state='idle';r.phase='idle';this.log('simulation',r.id+' returned to service.',r);if(this.running)this.dispatch();}
 verify(id,edited){const record=this.sdk.record(id),result=this.sdk.verify(record,edited);this.verifications++;this.log('sdk',result.valid?'SDK signature verification returned valid.':'SDK signature verification rejected the altered payload.',this.robots[record.payload.robot_index],this.tasks.find(t=>t.id===record.payload.task_id),record);return result;}
 get totals(){const total=this.robots.reduce((n,r)=>n+r.cost,0);return {delivered:this.delivered,failed:this.failed,records:this.records.length,verifications:this.verifications,cost:total,costPerDelivery:this.delivered?total/this.delivered:null,energyWh:this.robots.reduce((n,r)=>n+r.energyWh,0),distance:this.robots.reduce((n,r)=>n+r.distance,0)};}
 export(){return {format:'nunchi-robotics-lab/1',session_id:this.sessionId,sdk_commit:SDK_COMMIT,architecture:'Original Nunchi Oracle and Crypto Rust sources compiled to WASM over an application-provided in-memory StateStore.',keys:'Public deterministic demo keys; no physical-device identity attestation.',scope:'Robotics, telemetry, scheduling and costs are simulated. SDK signatures, Oracle record IDs, writes, reads and queries execute locally. No validators, consensus, persistent QMDB, hardware attestation or proof of physical delivery.',assumptions:{...this.assumptions},simulated_seconds:this.seconds,namespace:this.namespace,identities:this.identities,totals:this.totals,robots:this.robots.map(r=>({id:r.id,battery:r.battery,state:r.state,distance_m:r.distance,energy_wh:r.energyWh,estimated_cost_microusd:r.cost,completed:r.completed})),tasks:this.tasks,records:this.sdk.query()};}
}
