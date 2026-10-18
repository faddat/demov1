export const SDK_COMMIT='eea35ced709f68c15d6fbc8bcc754696a7e44374';
export class RoboticsSdk{
 constructor(instance){this.wasm=instance.exports;this.encoder=new TextEncoder();this.decoder=new TextDecoder();}
 static async create(bytes){const {instance}=await WebAssembly.instantiate(bytes,{});if(instance.exports.smoke()!==1)throw Error('The Nunchi SDK failed its signature startup check.');return new RoboticsSdk(instance);}
 call(input){const bytes=this.encoder.encode(JSON.stringify(input)),pointer=this.wasm.alloc(bytes.length);if(!pointer)throw Error('SDK request exceeds the local bridge limit.');new Uint8Array(this.wasm.memory.buffer,pointer,bytes.length).set(bytes);this.wasm.process(pointer,bytes.length);const result=JSON.parse(this.decoder.decode(new Uint8Array(this.wasm.memory.buffer,this.wasm.output_ptr(),this.wasm.output_len())));if(!result.ok)throw Error(result.error||'SDK operation failed.');return result;}
 reset(session){return this.call({command:'reset',session_id:session});}
 append(payload){return this.call({command:'append',payload}).record;}
 query(robot){return this.call({command:'query',...(robot===undefined?{}:{robot_index:robot})}).records;}
 record(id){return this.call({command:'record',record_id:id}).record;}
 verify(record,edited){return this.call({command:'verify',signed_transaction:record.signed_transaction,...(edited===undefined?{}:{edited_payload:edited})});}
 admit(signed){return this.call({command:'admit',signed_transaction:signed}).record;}
}
