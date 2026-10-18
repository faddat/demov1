export const GUIDE_STAGES=[
 {title:'One robot. One delivery.',text:'This warehouse is simulated. Follow Robot 01, then inspect the SDK evidence behind its work.',at:0},
 {title:'The application assigns the work.',text:'An assignment event identifies the robot, task and package. The SDK signs it and writes it to the local Oracle ledger.',at:3},
 {title:'A pickup becomes an event.',text:'The application moves the robot and reports the pickup. Open a record to see the original signed payload.',at:15},
 {title:'A delivery leaves an inspectable record.',text:'The simulation reports completion. The SDK checks the signature, stores the payload and returns the same data on readback.',at:32},
 {title:'Retrieve the record by its SDK ID.',text:'The record is read from Oracle. It includes the task, writer, original payload and signed transaction bytes.',at:44},
 {title:'Verify what was signed.',text:'The SDK verifies the original transaction again. Try modifying a destination: the original signature will fail against the edited data.',at:55},
 {title:'Now explore the warehouse.',text:'Add work, adjust the fleet or simulate a failure. The application controls operations; the SDK records and verifies the reported events.',at:70},
];
export class WarehouseGuide{
 constructor(model,{onStage=()=>{},onRecord=()=>{}}={}){Object.assign(this,{model,onStage,onRecord});this.active=false;this.elapsed=0;this.index=0;this.lastRecord=null;}
 start(){this.model.reset({guided:true});this.elapsed=0;this.index=0;this.active=true;this.lastRecord=null;this.model.start();this.onStage(GUIDE_STAGES[0],0);}
 pause(){this.model.pause();}
 resume(){this.model.start();}
 stop(){this.active=false;this.model.guided=false;}
 enter(index){
  const w=this.model;this.index=index;
  if(index===1&&!w.robots[0].task&&!w.delivered)w.assign(w.robots[0],w.tasks[0]);
  if(index>=2&&!w.records.some(r=>r.payload.event_type==='pickup'))this.advanceWork(()=>w.records.some(r=>r.payload.event_type==='pickup'));
  if(index>=3&&!w.delivered)this.advanceWork(()=>w.delivered>0);
  if(index===4){this.lastRecord=w.sdk.record(w.records.find(r=>r.payload.event_type==='delivered').record_id);this.onRecord(this.lastRecord);}
  if(index===5){this.lastRecord=this.lastRecord||w.records.find(r=>r.payload.event_type==='delivered');const result=w.verify(this.lastRecord.record_id);if(!result.valid)throw Error('The SDK did not verify the completion record.');}
  if(index===6){this.active=false;w.pause();}
  this.onStage(GUIDE_STAGES[index],index);
 }
 advanceWork(done){const wasRunning=this.model.running;this.model.running=true;for(let i=0;i<2000&&!done();i++)this.model.tick(.1);this.model.running=wasRunning;if(!done())throw Error('The guided operation did not complete.');}
 tick(realDelta){if(!this.active||!this.model.running)return;this.elapsed+=realDelta;while(this.index<GUIDE_STAGES.length-1&&this.elapsed>=GUIDE_STAGES[this.index+1].at)this.enter(this.index+1);}
 next(){if(!this.active&&this.index!==6)return;if(this.index<6){this.elapsed=GUIDE_STAGES[this.index+1].at;this.enter(this.index+1);}}
}
