import fs from 'node:fs/promises';
import {demos} from '../src/demos.js';
import './build-robotics.mjs';
import './build-operations.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=d=>`<article class="demo-card" id="demo-${esc(d.id)}" data-category="${esc(d.category)}" aria-labelledby="title-${esc(d.id)}">
 <div class="preview-block"><div class="preview-topline"><span><i aria-hidden="true"></i> ${esc(d.title.toUpperCase())}</span><span>INTERACTIVE DEMO / ${esc(d.number)}</span></div><a class="preview-link" href="${esc(d.path)}" aria-label="Open ${esc(d.title)}"><video class="demo-preview" muted loop playsinline preload="none" poster="${esc(d.poster)}" aria-label="${esc(d.preview)}" data-video="${esc(d.video)}"></video><span class="preview-open">Open demo <span aria-hidden="true">↗</span></span></a><div class="preview-caption"><span>${esc(d.preview)}</span><button type="button" class="preview-toggle" data-preview="${esc(d.id)}" aria-pressed="false" aria-label="Play ${esc(d.title)} preview">▶ Preview</button></div></div>
 <div class="demo-copy"><p class="eyebrow">${esc(d.number)} / ${esc(d.eyebrow)}</p><h3 id="title-${esc(d.id)}">${esc(d.title)}</h3><p class="demo-headline">${esc(d.headline)}</p><p class="demo-description">${esc(d.description)}</p><ul class="demo-tags" aria-label="Things to explore">${d.tags.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><a class="button demo-launch" href="${esc(d.path)}">Open ${esc(d.title)} <span aria-hidden="true">↗</span></a><details class="sdk-details"><summary><span>What’s powered by the SDK?</span><span class="plus" aria-hidden="true">+</span></summary><div class="sdk-content"><ul>${d.modules.map(m=>`<li><strong>${esc(m.name)}</strong><p>${esc(m.text)}</p></li>`).join('')}</ul><h4>What the application adds</h4><p>${esc(d.application)}</p><h4>Why it matters</h4><p>${esc(d.takeaway)}</p><a class="text-link" href="${esc(d.path)}">Try this example <span aria-hidden="true">↗</span></a></div></details></div>
 <div class="try-this"><span class="try-label">TRY THIS</span><p>${esc(d.tryThis)}</p><span class="demo-scope">${esc(d.scope)}</span></div>
</article>`;
await fs.mkdir('dist/assets',{recursive:true});
const template=await fs.readFile('src/index.html','utf8');
if(template.split('<!--DEMO_CATALOG-->').length!==2)throw Error('Demo insertion point missing.');
await fs.writeFile('dist/index.html',template.replace('<!--DEMO_CATALOG-->',demos.map(card).join('\n')).replaceAll('__DEMO_COUNT__',demos.length).replaceAll('__PADDED_COUNT__',String(demos.length).padStart(2,'0')));
for(const file of ['style.css','app.js'])await fs.copyFile('src/'+file,'dist/'+file);
await fs.writeFile('dist/catalog.json',JSON.stringify(demos,null,2));
await fs.writeFile('dist/assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#1246b6"/><path d="M15 48V16h9l16 22V16h9v32h-9L24 26v22Z" fill="#fff"/></svg>');
await fs.writeFile('dist/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; font-src 'self'; connect-src 'self' https://api.coinbase.com https://api.exchange.coinbase.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com\n`);
console.log('Built '+demos.length+' demo entries.');
