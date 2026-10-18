import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function engineDigest(){
 const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.name==='target')continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.rs$|Cargo\.(toml|lock)$|sdk-source-hashes\.json$/.test(p))files.push(p);}}
 await walk('robotics/engine');files.sort();const h=createHash('sha256');for(const file of files){h.update(file);h.update(await fs.readFile(file));}return h.digest('hex');
}
export async function verifySdkSources(){const manifest=JSON.parse(await fs.readFile('robotics/engine/sdk-source-hashes.json','utf8'));for(const [file,expected]of Object.entries(manifest.files))if(sha(await fs.readFile('robotics/engine/'+file))!==expected)throw Error('Pinned SDK source changed: '+file);return manifest;}
