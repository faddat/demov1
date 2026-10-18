export const SDK_COMMIT='eea35ced709f68c15d6fbc8bcc754696a7e44374';
export class PaymentsSdk{
constructor(instance){this.wasm=instance.exports;this.encoder=new TextEncoder();this.decoder=new TextDecoder();}
static async create(bytes){const {instance}=await WebAssembly.instantiate(bytes,{});if(instance.exports.smoke()!==1)throw Error('SDK signature startup check failed.');return new PaymentsSdk(instance);}
call(input){const bytes=this.encoder.encode(JSON.stringify(input)),ptr=this.wasm.alloc(bytes.length);if(!ptr)throw Error('Request exceeds the bridge limit.');new Uint8Array(this.wasm.memory.buffer,ptr,bytes.length).set(bytes);this.wasm.process(ptr,bytes.length);const r=JSON.parse(this.decoder.decode(new Uint8Array(this.wasm.memory.buffer,this.wasm.output_ptr(),this.wasm.output_len())));if(!r.ok)throw Error(r.error);return r.data;}
reset(session){return this.call({command:'reset',session_id:session});}
snapshot(){return this.call({command:'snapshot'});}
}

