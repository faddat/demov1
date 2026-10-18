//! Local Oracle execution for the Robotics Lab demonstration.
//! Original SDK sources run over application-provided volatile state.
use commonware_codec::{Encode, ReadExt};
use commonware_cryptography::{sha256::Digest, Hasher, Sha256};
use futures::executor::block_on;
use nunchi_common::{Address, Authorization, RuntimeContext, StateError, StateStore};
use nunchi_crypto::PrivateKey;
use nunchi_oracle::{IntervalKey, NamespaceId, OracleDB, OracleLedger, OracleOperation, OracleRecord, RecordId, Transaction};
use serde_json::{json, Value};
use std::cell::RefCell;
use std::collections::BTreeMap;

const SDK: &str = "eea35ced709f68c15d6fbc8bcc754696a7e44374";

#[derive(Clone, Default, Debug, Eq, PartialEq)]
struct MemoryStore(BTreeMap<Digest, Vec<u8>>);

impl StateStore for MemoryStore {
    async fn get(&self, key: &Digest) -> Result<Option<Vec<u8>>, StateError> { Ok(self.0.get(key).cloned()) }
    fn set(&mut self, key: Digest, value: Vec<u8>) { self.0.insert(key, value); }
    fn remove(&mut self, key: Digest) { self.0.remove(&key); }
}

fn key(robot: usize) -> PrivateKey { PrivateKey::from_seed(2026101600 + robot as u64) }
fn writer(robot: usize) -> Address { Address::external(&key(robot).public_key()) }
fn encoded(value: &impl Encode) -> String { hex::encode(value.encode().as_ref()) }
fn decode_tx(value: &str) -> Result<Transaction, String> {
    if value.len() > 140000 { return Err("Transaction is too large.".into()); }
    let bytes = hex::decode(value).map_err(|_| "Invalid transaction hex.")?;
    let mut cursor = bytes.as_slice();
    let tx = Transaction::read(&mut cursor).map_err(|e| e.to_string())?;
    if !cursor.is_empty() { return Err("Unexpected trailing transaction bytes.".into()); }
    Ok(tx)
}

struct Session {
    id: String,
    namespace: NamespaceId,
    ledger: OracleLedger<MemoryStore>,
    evidence: Vec<Value>,
}

impl Session {
    fn new(id: &str) -> Result<Self, String> {
        if id.len() < 8 || id.len() > 80 || !id.bytes().all(|c| c.is_ascii_alphanumeric() || b"-_".contains(&c)) { return Err("Invalid demo session ID.".into()); }
        Ok(Self { id: id.into(), namespace: NamespaceId(Sha256::hash(&[b"nunchi-robotics-lab/", id.as_bytes()])), ledger: OracleLedger::new(MemoryStore::default()), evidence: Vec::new() })
    }
    fn bucket(&self) -> IntervalKey { IntervalKey::new((self.evidence.len()/128) as u64) }
    fn record_json(record: &OracleRecord) -> Value {
        json!({"record_id":encoded(&record.id),"writer":encoded(&record.writer),"namespace":encoded(&record.namespace),"interval":record.interval.bucket,"payload":serde_json::from_slice::<Value>(&record.payload).unwrap_or(Value::Null),"payload_hex":hex::encode(&record.payload),"local_sequence":record.written_at_height,"application_timestamp_ms":record.written_at_ms})
    }
    fn records(&self, robot: Option<usize>) -> Result<Vec<Value>, String> {
        let end = IntervalKey::new((self.evidence.len()/128) as u64);
        let records = match robot {
            Some(robot) => block_on(self.ledger.records_by_writer(&writer(robot), IntervalKey::new(0), end)),
            None => block_on(self.ledger.records_by_namespace(&self.namespace, IntervalKey::new(0), end)),
        }.map_err(|e| e.to_string())?;
        Ok(records.iter().map(|r| {
            let mut value = Self::record_json(r);
            if let Some(proof) = self.evidence.iter().find(|e| e["record_id"] == value["record_id"]) { value.as_object_mut().unwrap().extend(proof.as_object().unwrap().clone()); }
            value
        }).collect())
    }
    fn validate(&self, payload: &Value) -> Result<usize, String> {
        if payload["session_id"].as_str() != Some(self.id.as_str()) { return Err("Event belongs to another session.".into()); }
        let robot = payload["robot_index"].as_u64().filter(|n| *n < 6).ok_or("Unknown demo robot.")? as usize;
        if payload["robot_id"] != format!("ROBOT-{:02}",robot+1) { return Err("Robot label does not match its demo identity.".into()); }
        if !matches!(payload["event_type"].as_str(),Some("assigned"|"pickup"|"delivered"|"failed"|"reassigned"|"charging"|"resumed")) { return Err("Unknown operational event.".into()); }
        if payload["simulated_ms"].as_u64().is_none() || payload["reported_at_ms"].as_u64().is_none() { return Err("Missing application timestamps.".into()); }
        if payload["estimated_cost_microusd"].as_u64().is_none() { return Err("Invalid modeled cost.".into()); }
        Ok(robot)
    }
    fn append(&mut self, payload: Value) -> Result<Value, String> {
        let robot = self.validate(&payload)?;
        let nonce = block_on(self.ledger.db().nonce(&writer(robot))).map_err(|e| e.to_string())?;
        let tx = Transaction::sign(&key(robot), nonce, OracleOperation::AppendRecord { namespace:self.namespace, interval:self.bucket(), payload:serde_json::to_vec(&payload).map_err(|e|e.to_string())?, proof:None });
        self.admit(tx)
    }
    fn admit(&mut self, tx: Transaction) -> Result<Value, String> {
        if self.evidence.len() >= 4096 { return Err("Export this session and reset before recording more operations.".into()); }
        tx.verify().map_err(|e| e.to_string())?;
        let OracleOperation::AppendRecord { namespace, interval, payload, .. } = &tx.payload.operation;
        let event: Value = serde_json::from_slice(payload).map_err(|e|e.to_string())?;
        let robot = self.validate(&event)?;
        if tx.account_id != writer(robot) { return Err("Signer does not match the configured demo robot.".into()); }
        if *namespace != self.namespace || *interval != self.bucket() { return Err("Unexpected demo namespace or interval.".into()); }
        let mut next = self.ledger.clone();
        block_on(next.apply_transaction(&tx, RuntimeContext {height:self.evidence.len() as u64+1,timestamp_ms:event["reported_at_ms"].as_u64().unwrap(),..Default::default()})).map_err(|e|e.to_string())?;
        let records = block_on(next.records_by_namespace(namespace, *interval, *interval)).map_err(|e|e.to_string())?;
        let written = records.last().ok_or("SDK query returned no record.")?;
        let stored = block_on(next.record(&written.id)).map_err(|e|e.to_string())?.ok_or("SDK read returned no record.")?;
        if stored.payload != *payload || stored.writer != tx.account_id { return Err("SDK readback did not match the signed operation.".into()); }
        let (public_key,signature) = match &tx.authorization { Authorization::Single {signer,signature} => (encoded(signer.as_ref()),encoded(signature)), _ => return Err("Expected a single demo signer.".into()) };
        let proof = json!({"record_id":encoded(&stored.id),"transaction_id":encoded(&tx.digest()),"signed_transaction":encoded(&tx),"public_key":public_key,"signature":signature,"nonce":tx.payload.nonce,"signature_valid":tx.verify().is_ok(),"signature_checks":2,"readback_matches":true,"sdk_commit":SDK});
        let mut result = Self::record_json(&stored);result.as_object_mut().unwrap().extend(proof.as_object().unwrap().clone());
        self.ledger = next;self.evidence.push(proof);
        Ok(result)
    }
    fn handle(&mut self, input: &Value) -> Result<Value,String> {
        match input["command"].as_str() {
            Some("reset") => { *self=Self::new(input["session_id"].as_str().unwrap_or(""))?;Ok(json!({"ok":true,"session_id":self.id,"namespace":encoded(&self.namespace),"identities":(0..6).map(|i|json!({"robot_index":i,"robot_id":format!("ROBOT-{:02}",i+1),"writer":encoded(&writer(i)),"public_key":encoded(&key(i).public_key()),"key_scope":"public deterministic demonstration key"})).collect::<Vec<_>>()})) },
            Some("append") => {let record=self.append(input["payload"].clone())?;Ok(json!({"ok":true,"record":record}))},
            Some("admit") => {let record=self.admit(decode_tx(input["signed_transaction"].as_str().unwrap_or(""))?)?;Ok(json!({"ok":true,"record":record}))},
            Some("query") => {let robot=match input["robot_index"].as_u64(){Some(n) if n<6=>Some(n as usize),Some(_)=>return Err("Unknown robot.".into()),None=>None};Ok(json!({"ok":true,"records":self.records(robot)?}))},
            Some("record") => {let bytes=hex::decode(input["record_id"].as_str().unwrap_or("")).map_err(|_|"Invalid record ID.")?;let mut cursor=bytes.as_slice();let id=RecordId::read(&mut cursor).map_err(|e|e.to_string())?;if !cursor.is_empty(){return Err("Invalid record ID length.".into());}let record=block_on(self.ledger.record(&id)).map_err(|e|e.to_string())?.ok_or("Record not found in this session.")?;let result=self.records(None)?.into_iter().find(|e|e["record_id"]==encoded(&record.id)).ok_or("Record evidence missing.")?;Ok(json!({"ok":true,"record":result}))},
            Some("verify") => {
                let mut tx=decode_tx(input["signed_transaction"].as_str().unwrap_or(""))?;
                if let Some(edited)=input.get("edited_payload"){let OracleOperation::AppendRecord{payload,..}=&mut tx.payload.operation;*payload=serde_json::to_vec(edited).map_err(|e|e.to_string())?;}
                let verification=tx.verify();let OracleOperation::AppendRecord{payload,namespace,interval,..}=&tx.payload.operation;
                Ok(json!({"ok":true,"valid":verification.is_ok(),"error":verification.err().map(|e|e.to_string()),"transaction_id":encoded(&tx.digest()),"payload":serde_json::from_slice::<Value>(payload).map_err(|e|e.to_string())?,"namespace":encoded(namespace),"interval":interval.bucket,"writer":encoded(&tx.account_id),"nonce":tx.payload.nonce}))
            },
            _ => Err("Unknown SDK bridge command.".into())
        }
    }
}

thread_local! { static STATE: RefCell<Session> = RefCell::new(Session::new("uninitialized").unwrap());static OUTPUT: RefCell<Vec<u8>> = const {RefCell::new(Vec::new())}; }

#[no_mangle]
pub extern "C" fn smoke() -> u32 {
    let tx=Transaction::sign(&key(0),0,OracleOperation::AppendRecord{namespace:NamespaceId(Sha256::hash(&[b"smoke"])),interval:IntervalKey::new(0),payload:b"sdk-smoke".to_vec(),proof:None});
    u32::from(tx.verify().is_ok())
}
#[no_mangle]
pub extern "C" fn alloc(len:usize)->*mut u8 {if len==0||len>200000{return std::ptr::null_mut();}Box::into_raw(vec![0u8;len].into_boxed_slice()) as *mut u8}
/// # Safety
/// The pointer must be a fresh allocation returned by alloc with this exact length.
#[no_mangle]
pub unsafe extern "C" fn process(ptr:*mut u8,len:usize){
    // SAFETY: The host transfers ownership of this allocation exactly once.
    let request=unsafe{Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr,len))};
    let result=serde_json::from_slice::<Value>(&request).map_err(|e|e.to_string()).and_then(|input|STATE.with(|s|s.borrow_mut().handle(&input)));
    let response=match result{Ok(v)=>v,Err(error)=>json!({"ok":false,"error":error})};
    OUTPUT.with(|v|*v.borrow_mut()=serde_json::to_vec(&response).unwrap());
}
#[no_mangle]
pub extern "C" fn output_ptr()->*const u8{OUTPUT.with(|v|v.borrow().as_ptr())}
#[no_mangle]
pub extern "C" fn output_len()->usize{OUTPUT.with(|v|v.borrow().len())}
