export const demos = [
 {
  id:'office',number:'01',category:'ai',eyebrow:'AI WORK & COST METERING',title:'Office Lab',headline:'Same work. Two ways to run it.',
  description:'Build a manual team and an agent-assisted team. Run a shift, compare the modeled output and follow the AI spend into its records.',
  path:'/demos/office/',video:'/media/office-preview.mp4',poster:'/media/office-poster.jpg',preview:'Recorded office preview · simulated work and prices',
  tags:['Change the team','Compare cost per brief','Inspect & export'],
  tryThis:'Add an agent, remove a reviewer, then run a workweek. See which bottleneck changes the result.',
  modules:[
   {name:'Oracle ledger',text:'Stores the sample usage payloads captured with the Rust SDK, linked to a customer and task.'},
   {name:'Signed transactions',text:'Preserves the recorded writer, transaction hash and captured signature-verification result.'},
   {name:'Record queries',text:'The demo groups those captured calls by brief so you can inspect quantities, charges and exported evidence.'}
  ],
  application:'The application supplies the office, task scheduler, sample rates and staffing assumptions. People, agents, completion times and costs are modeled. The hosted browser replays captured SDK records; additional modeled calls create no new signatures.',
  takeaway:'See how a team could connect AI usage to a customer, a job and a cost, then use that data to decide what to change.',
  scope:'Modeled throughput and prices · captured SDK evidence',
  source:'Office Lab v59 · 9a14a08710baab6aed0cbf105bd817a67b432c42'
 },
 {
  id:'exchange',number:'02',category:'finance',eyebrow:'FINANCIAL APPS & SIGNED EXECUTION',title:'Exchange Lab',headline:'One order. A trail you can check.',
  description:'Step into a low-poly trading room. Watch a paper order get signed, verified and matched, then try a trade and inspect its evidence.',
  path:'/demos/exchange/',video:'/media/exchange-preview.mp4',poster:'/media/exchange-poster.png',preview:'Animated SDK playback · illustrative reference prices',
  tags:['Watch the walkthrough','Try a paper trade','Verify a signature'],
  tryThis:'Watch the first BTC trade, open its receipt, then alter the signature to see verification reject it.',
  modules:[
   {name:'CLOB matching engine',text:'The SDK matches compatible orders by price, then time, using the resting maker’s price.'},
   {name:'Transaction codec & cryptography',text:'Actual Rust SDK code runs as WebAssembly in the browser to sign, decode and verify each paper order.'},
   {name:'Signed order exports',text:'Inspect the original transaction bytes and IDs. The source project includes an offline signature verifier.'}
  ],
  application:'The application adds the paper wallet, balances, scripted traders and interface. Coinbase supplies live spot references and market candles in the full demo. Preview prices are illustrative. Trades are paper; this example does not deploy a validator network or settle real funds.',
  takeaway:'See how SDK modules can sit underneath a financial application, with signed intent, deterministic matching and inspectable transaction data.',
  scope:'Live market references in the demo · paper assets · SDK in browser',
  source:'Exchange Lab v4 · a8240784a81dc91ed6a3bad0929728d543bee01f'
 },
 {
  id:'robotics',number:'03',category:'robotics',eyebrow:'ROBOTICS & AUTONOMOUS SYSTEMS',title:'Robotics Lab',headline:'Autonomous work. A record you can check.',
  description:'Follow an autonomous robot from task assignment to verified completion. Inspect signed events, explore operational records and see how the SDK fits into software operating physical systems.',
  path:'/demos/robotics/',video:'/media/robotics-preview.mp4',poster:'/media/robotics-poster.png',preview:'Animated SDK run · simulated warehouse · 4× playback',
  tags:['Follow a delivery','Simulate a failure','Test a signed record'],
  tryThis:'Let a robot complete a delivery. Open its record, change the destination locally, then verify the original signature again.',
  modules:[
   {name:'Crypto & Common',text:'The original Rust SDK signs and verifies each Oracle transaction using the robot’s public demo identity.'},
   {name:'Oracle ledger & database adapter',text:'Actual SDK code appends namespaced operational payloads, derives record IDs and queries the application-provided in-memory store.'},
   {name:'Readback & inspectable evidence',text:'The application retrieves each stored event, checks it against the signed payload and exports the original transaction bytes. An offline verifier replays the evidence.'}
  ],
  application:'The application simulates the warehouse, robot movement, scheduling, battery, failure detection, reassignment and costs. SDK signing, record writes, reads, queries and signature checks execute locally in WebAssembly. Records are session-local. Public demo keys do not authenticate physical devices; signatures do not prove a delivery happened.',
  takeaway:'See how software coordinating autonomous systems can associate reported work with machines and tasks, preserve signed events and detect edits to the recorded message.',
  scope:'Simulated operations & costs · genuine SDK Crypto + Oracle',
  source:'Robotics Lab v1 · SDK eea35ced709f68c15d6fbc8bcc754696a7e44374'
 },
 {
  id:'operations',number:'04',category:'ai',eyebrow:'AI INFRASTRUCTURE & OPERATIONS',title:'AI Operations Center',headline:'Every agent. Every task. Every dollar.',
  description:'See how an organization can account for AI activity across departments, agents and customers. Investigate spending, inspect usage records and explore the SDK mechanics underneath.',
  path:'/demos/operations/',video:'/media/operations-preview.mp4',poster:'/media/operations-poster.png',preview:'Animated SDK run · synthetic usage and illustrative prices',
  tags:['Follow the AI spend','Investigate an agent','Audit a customer bill'],
  tryThis:'Open the runaway-agent example. Find the research agent, pause its workflow, then inspect and verify the usage behind the spike.',
  modules:[
   {name:'Oracle records & queries',text:'Original Rust SDK code records each newly generated usage payload and reads it back from a session-local memory store.'},
   {name:'Crypto & Common',text:'Twenty public demo identities sign genuine Oracle transactions. Actual SDK signature checks accept the original and reject an edited local payload.'},
   {name:'Inspectable evidence',text:'SDK-generated IDs, signer and signature bytes, original payloads and transaction bytes connect modeled accounting to actual recorded evidence.'}
  ],
  application:'The application simulates AI workflows, token quantities, tool use, pricing, budgets, alerts, billing and dashboard analytics. No provider is called. SDK signing, Oracle writes, reads and verification execute newly in browser WebAssembly. Local records clear on restart. Signatures authenticate messages, not external usage or pricing truth.',
  takeaway:'See how developers can build traceable usage accounting, customer billing and operational monitoring around SDK-backed application records.',
  scope:'Synthetic usage & modeled charges · genuine local SDK execution',
  source:'AI Operations Center v1 · SDK eea35ced709f68c15d6fbc8bcc754696a7e44374'
 },
 {
  id:'payments',number:'05',category:'payments',eyebrow:'FINANCIAL INFRASTRUCTURE & AUTONOMOUS AGENTS',title:'Agent Payment Network',headline:'Give agents a job. Follow every payment.',
  description:'Follow a research job as its agents buy data, search and analysis. Watch each payment move through spending rules, SDK execution and a signed record.',
  path:'/demos/payments/',video:'/media/payments-preview.mp4',poster:'/media/payments-poster.png',preview:'Animated SDK run · isolated demo credits and fictional services',
  tags:['Watch a complete job','Challenge the spending rules','Follow every payment'],
  tryThis:'Have the Research Agent purchase a dataset, inspect its payment, then attempt a purchase beyond its spending limit.',
  modules:[
   {name:'Coins ledger & balances',text:'Original SDK code creates an isolated demo asset and applies signed transfers between agent and provider accounts, with actual nonce and balance checks.'},
   {name:'Crypto & Common',text:'Original Rust transaction encoding, signing and verification run as WebAssembly. Altering a local amount fails verification against the original signature.'},
   {name:'Oracle service records',text:'A real signed and retrieved service-context record references the payment’s SDK transaction ID and the application request.'}
  ],
  application:'The application provides agent behavior, quotes, spending rules, manual approvals, duplicate-request tracking, fulfillment and the interface. All services are fictional. SDK Coins transfers, balances, signatures and Oracle records execute locally in memory. Public demo identities and credits have no real value; no network settlement or production payment security is claimed.',
  takeaway:'See how developers can combine SDK financial and cryptographic primitives with their own service and authorization systems.',
  scope:'Actual local SDK asset transfers · public test keys · demo credits only',
  source:'Agent Payment Network v1 · SDK eea35ced709f68c15d6fbc8bcc754696a7e44374'
 },
 {
  id:'bridge',number:'06',category:'crosschain',eyebrow:'CROSS-CHAIN SYSTEMS & VERIFICATION',title:'Bridge Lab',headline:'Two chains. One verified connection.',
  description:'Follow a threshold certificate between two local test networks. Pause the relay, inspect the source evidence and see the receiver accept or reject it.',
  path:'/demos/bridge/',video:'/media/bridge-preview.mp4',poster:'/media/bridge-poster.png',preview:'Animated SDK verification run · synthetic local network activity',
  tags:['Two independent test committees','Verified certificates','Inspect the evidence'],
  tryThis:'Watch a valid certificate cross the gap, then alter its proposal and compare the receiver’s real verification result.',
  modules:[{name:'Bridge verification & admission',text:'The pinned BridgeActor verification and submit method bodies execute unchanged through a synchronous browser adapter. Invalid evidence is rejected; valid older views are stale.'},{name:'DKG certificate types / Commonware crypto',text:'The same threshold scheme and Finalization types used by Nunchi DKG generate and verify genuine 3-of-4 BLS12-381 certificates. Keys come from a public local fixture, not a distributed DKG ceremony.'},{name:'Inspectable evidence',text:'Inspect encoded certificates, proposal digests, test keys and receiver decisions. An offline verifier replays exported local commands.'}],
  application:'The application provides two local network models, synthetic proposals, public test-key setup, the relay queue, guided playback and low-poly islands. No deployed chains, live distributed consensus, Authority module, asset transfer or public-network finality is claimed.',
  takeaway:'See how developers can reuse verification infrastructure when their application needs evidence from a separately configured network.',
  scope:'Genuine certificate checks · local fixtures · no asset bridge',
  source:'Bridge Lab v1 · SDK eea35ced709f68c15d6fbc8bcc754696a7e44374'
 }
];
