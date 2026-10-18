import {createBindings} from './wasm-bindings.js';
export const SDK_COMMIT='eea35ced709f68c15d6fbc8bcc754696a7e44374';
export class BridgeSdk{
 constructor(instance){this.wasm=instance.exports||instance;this.encoder=new TextEncoder();this.decoder=new TextDecoder();}
 static async create(bytes){return new BridgeSdk(createBindings(bytes));}
 call(input){const bytes=this.encoder.encode(JSON.stringify(input)),ptr=this.wasm.alloc(bytes.length);if(!ptr)throw Error('Bridge input is too large.');new Uint8Array(this.wasm.memory.buffer,ptr,bytes.length).set(bytes);this.wasm.process(ptr,bytes.length);const r=JSON.parse(this.decoder.decode(new Uint8Array(this.wasm.memory.buffer,this.wasm.output_ptr(),this.wasm.output_len())));if(!r.ok)throw Error(r.error);return r.data;}
 reset(id){return this.call({command:'reset',session_id:id});}
}
