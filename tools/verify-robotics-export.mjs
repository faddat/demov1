import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {RoboticsSdk,SDK_COMMIT} from '../robotics/src/sdk.js';
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export async function verifyRoboticsExport(data,bytes){
 if(data.format!=='nunchi-robotics-lab/1'||data.sdk_commit!==SDK_COMMIT||!Array.isArray(data.records))throw Error('Unsupported Robotics Lab export.');
 const sdk=await RoboticsSdk.create(bytes),session=sdk.reset(data.session_id);if(session.namespace!==data.namespace)throw Error('Session namespace differs.');
 const seen=new Set();
 for(const expected of data.records){
  if(seen.has(expected.record_id))throw Error('Duplicate record ID.');seen.add(expected.record_id);
  const actual=sdk.admit(expected.signed_transaction);
  for(const field of ['record_id','transaction_id','writer','public_key','signature','namespace','interval','nonce','payload_hex','local_sequence','application_timestamp_ms'])if(actual[field]!==expected[field])throw Error('Record evidence differs: '+field);
  if(canonical(actual.payload)!==canonical(expected.payload))throw Error('Exported payload differs from the signed operation.');
 }
 return {valid:true,records:seen.size,namespace:data.namespace,scope:'Verified SDK transaction signatures, nonces, record IDs and payload readback by replaying into a fresh local Oracle store. This does not prove a physical delivery, trusted device identity, network consensus or persistent storage.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{if(!process.argv[2])throw Error('Usage: node tools/verify-robotics-export.mjs session.json');const data=JSON.parse(await fs.readFile(process.argv[2],'utf8')),bytes=await fs.readFile(new URL('../robotics/src/sdk-engine.wasm',import.meta.url));console.log(JSON.stringify(await verifyRoboticsExport(data,bytes),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
