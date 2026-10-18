//! Local certificate fixture and synchronous adapter for the pinned Nunchi BridgeActor core.
use std::cell::RefCell;
use commonware_codec::{DecodeExt, Encode};
use commonware_consensus::{Viewable, simplex::{scheme::bls12381_threshold::vrf, types::{Finalization as CFinalization, Finalize, Proposal}}, types::{Epoch, Round, View}};
use commonware_cryptography::{bls12381::{certificate::threshold::mocks, primitives::variant::MinSig}, ed25519, sha256::Digest, Hasher, Sha256};
use commonware_parallel::Sequential;
use commonware_utils::{non_empty, N3f1};
use rand::{rngs::StdRng, CryptoRng, Rng, SeedableRng};
use serde_json::{json, Value};

// Same Scheme and Finalization aliases exported by nunchi-dkg::consensus.
type Scheme = vrf::Scheme<ed25519::PublicKey, MinSig>;
type Finalization = CFinalization<Scheme, Digest>;
type BridgePayload = Option<Finalization>;
include!(concat!(env!("OUT_DIR"), "/bridge-core.rs"));

struct Network { schemes: Vec<Scheme>, participants: Vec<ed25519::PublicKey>, height: u64, latest: Option<Finalization>, receiver: BridgeCore }
struct Session { id: String, networks: Vec<Network>, rng: StdRng, records: Vec<Value>, accepted: Vec<Value> }
fn encoded<T: Encode>(value: &T) -> String { hex::encode(value.encode()) }
fn seed(value: &[u8]) -> [u8; 32] { let digest = Sha256::hash(&[value]); let mut seed=[0;32]; seed.copy_from_slice(digest.as_ref()); seed }
fn fixture(id: &str, network: usize) -> commonware_cryptography::certificate::mocks::Fixture<Scheme> {
    let mut rng=StdRng::from_seed(seed(format!("bridge-lab/{id}/{network}").as_bytes()));
    let namespace=format!("nunchi-bridge-lab/{id}/{network}");
    mocks::fixture::<_, MinSig, _, N3f1>(&mut rng, namespace.as_bytes(), 4,
        |namespace, participants, polynomial, share| Scheme::signer(namespace, participants, polynomial, share),
        |namespace, participants, polynomial| Scheme::verifier(namespace, participants, polynomial))
}
impl Session {
 fn new(id: &str) -> Result<Self,String> {
    if id.is_empty() || id.len()>128 { return Err("Session ID must contain 1–128 characters.".into()); }
    let a=fixture(id,0); let b=fixture(id,1);
    let receiver_a=BridgeCore{foreign_network:b.verifier.clone(),state:State{latest:None}};
    let receiver_b=BridgeCore{foreign_network:a.verifier.clone(),state:State{latest:None}};
    Ok(Self{id:id.into(),networks:vec![Network{schemes:a.schemes,participants:a.participants,height:0,latest:None,receiver:receiver_a},Network{schemes:b.schemes,participants:b.participants,height:0,latest:None,receiver:receiver_b}],rng:StdRng::from_seed(seed(id.as_bytes())),records:vec![],accepted:vec![]})
 }
 fn snapshot(&self) -> Value {
    json!({"session_id":self.id,"networks":self.networks.iter().enumerate().map(|(i,n)|json!({"index":i,"name":if i==0{"Chain A"}else{"Chain B"},"height":n.height,"validators":n.participants.iter().enumerate().map(|(j,p)|json!({"index":j,"public_key":encoded(p),"role":"public test identity","signed_latest_fixture":n.height>0&&j<3})).collect::<Vec<_>>(),"accepted_foreign_view":n.receiver.state.latest.as_ref().map(|f|f.view().get()),"latest_payload":n.latest.as_ref().map(|f|encoded(&f.proposal.payload))})).collect::<Vec<_>>(),"certificates":self.records,"submissions":self.accepted})
 }
 fn produce(&mut self, index: usize) -> Result<Value,String> {
    if self.records.len()>=256 {return Err("Session contains 256 certificates. Reset to create a fresh session.".into());}
    let network=&mut self.networks[index]; let height=network.height+1;
    let block=json!({"format":"bridge-lab/synthetic-block/1","session_id":self.id,"network":index,"height":height,"parent_payload":network.latest.as_ref().map(|f|encoded(&f.proposal.payload)),"work":"Local test proposal; not a deployed node block"});
    let bytes=serde_json::to_vec(&block).unwrap();
    let proposal=Proposal::new(Round::new(Epoch::zero(),View::new(height)),View::new(height-1),Sha256::hash(&[&bytes]));
    let votes:Vec<_>=network.schemes.iter().take(3).map(|s|Finalize::sign(s,proposal.clone()).unwrap()).collect();
    let finalization=CFinalization::from_finalizes(&network.schemes[0],non_empty![@votes.iter()],&Sequential).map_err(|e|format!("Certificate assembly failed: {e:?}"))?;
    let valid=finalization.verify(&mut self.rng,&network.schemes[0],&Sequential);
    if !valid {return Err("New fixture certificate did not verify.".into());}
    let proof=encoded(&finalization); let id=encoded(&Sha256::hash(&[proof.as_bytes()]));
    let record=json!({"id":id,"source_index":index,"destination_index":1-index,"height":height,"view":finalization.view().get(),"epoch":0,"payload_digest":encoded(&finalization.proposal.payload),"certificate_hex":proof,"certificate_bytes":finalization.encode().len(),"synthetic_block":block,"generated_by":"Commonware Finalize::sign + Finalization::from_finalizes, matching Nunchi Bridge tests","source_verified":valid,"fixture_signers":[0,1,2],"threshold":"3 of 4 public test shares"});
    network.height=height;network.latest=Some(finalization);self.records.push(record.clone());Ok(record)
 }
 fn inspect_proof(&mut self, input: &Value, commit: bool) -> Result<Value,String> {
    let destination=input["destination_index"].as_u64().filter(|i|*i<2).ok_or("Choose destination 0 or 1.")? as usize;
    let hex=input["certificate_hex"].as_str().ok_or("No certificate supplied.")?;
    if hex.len()>8192 {return Err("Certificate is too large.".into());}
    let parsed=hex::decode(hex).map_err(|e|e.to_string()).and_then(|b|Finalization::decode(b.as_slice()).map_err(|e|e.to_string()));
    let before=self.networks[destination].receiver.state.latest.as_ref().map(|f|f.view().get());
    let (result,valid,error,payload,view)=match parsed {
      Err(e)=>("rejected",false,Some(format!("Certificate decoding failed: {e}")),None,None),
      Ok(mut f)=>{
       if input["tamper"].as_bool()==Some(true) { f.proposal.payload=Sha256::hash(&[b"modified proposal payload"]); }
       let valid=self.networks[destination].receiver.verify_payload(&mut self.rng,&Some(f.clone()));
       let result=if commit {match self.networks[destination].receiver.submit(&mut self.rng,f.clone()) {SubmitResult::Updated=>"updated",SubmitResult::Stale=>"stale",SubmitResult::Rejected=>"rejected"}}else if valid {"valid"}else{"rejected"};
       (result,valid,if valid{None}else{Some("Threshold certificate does not verify against this receiver’s configured foreign network and proposal.".into())},Some(encoded(&f.proposal.payload)),Some(f.view().get()))
      }
    };
    let after=self.networks[destination].receiver.state.latest.as_ref().map(|f|f.view().get());
    let output=json!({"result":result,"valid":valid,"error":error,"destination_index":destination,"view":view,"checked_payload":payload,"tampered":input["tamper"].as_bool().unwrap_or(false),"accepted_before":before,"accepted_after":after,"state_committed":commit&&result=="updated","certificate_id":encoded(&Sha256::hash(&[hex.as_bytes()])),"implementation":"Pinned Nunchi BridgeActor verify_payload/submit bodies + original Commonware BLS12-381 verification"});
    if commit {self.accepted.push(output.clone());} Ok(output)
 }
 fn handle(&mut self,input:&Value)->Result<Value,String>{
    match input["command"].as_str().unwrap_or("") {
     "reset"=>{*self=Self::new(input["session_id"].as_str().unwrap_or(""))?;Ok(self.snapshot())},
     "snapshot"=>Ok(self.snapshot()),
     "produce"=>{let i=input["source_index"].as_u64().filter(|i|*i<2).ok_or("Choose source 0 or 1.")? as usize;let certificate=self.produce(i)?;Ok(json!({"certificate":certificate,"snapshot":self.snapshot()}))},
     "verify"=>self.inspect_proof(input,false),
     "submit"=>{let result=self.inspect_proof(input,true)?;Ok(json!({"verification":result,"snapshot":self.snapshot()}))},
     _=>Err("Unknown bridge command.".into())
    }
 }
}
thread_local!{static STATE:RefCell<Option<Session>>=const{RefCell::new(None)};static OUTPUT:RefCell<Vec<u8>>=const{RefCell::new(Vec::new())};}
#[no_mangle]pub extern "C" fn smoke()->u32{1}
#[no_mangle]pub extern "C" fn alloc(len:usize)->*mut u8{if len==0||len>500000{return std::ptr::null_mut();}Box::into_raw(vec![0u8;len].into_boxed_slice()) as *mut u8}
/// # Safety
/// The host supplies a fresh alloc pointer and its exact allocated length once.
#[no_mangle]pub unsafe extern "C" fn process(ptr:*mut u8,len:usize){let bytes=unsafe{Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr,len))};let result=serde_json::from_slice::<Value>(&bytes).map_err(|e|e.to_string()).and_then(|v|STATE.with(|s|{let mut s=s.borrow_mut();if s.is_none(){*s=Some(Session::new("startup")?);}s.as_mut().unwrap().handle(&v)}));let reply=match result{Ok(v)=>json!({"ok":true,"data":v}),Err(e)=>json!({"ok":false,"error":e})};OUTPUT.with(|out|*out.borrow_mut()=serde_json::to_vec(&reply).unwrap());}
#[no_mangle]pub extern "C" fn output_ptr()->*const u8{OUTPUT.with(|o|o.borrow().as_ptr())}
#[no_mangle]pub extern "C" fn output_len()->usize{OUTPUT.with(|o|o.borrow().len())}
