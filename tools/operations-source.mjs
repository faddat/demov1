import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {engineDigest,verifySdkSources,sha} from './robotics-source.mjs';export {sha};
export async function operationsDigest(){await verifySdkSources();const h=createHash('sha256');h.update(await engineDigest());for(const f of ['operations/engine/Cargo.toml','operations/engine/Cargo.lock','operations/engine/src/lib.rs']){h.update(f);h.update(await fs.readFile(f));}return h.digest('hex');}

