# Bridge Lab

Interactive local certificate lab for Nunchi SDK `eea35ced709f68c15d6fbc8bcc754696a7e44374` (2026.9.0-alpha.1), using Commonware 2026.9.0.

`npm ci`, `npm run build`, then serve `dist/` through a static web host. The checked-in WASM and its generated browser import glue are bundled into one HTML file. The import glue uses the host’s Web Crypto random source. `npm test` exercises real certificate generation, receiver validation, tampering, stale submissions, independent test keys, queue behavior and UI controls.

To rebuild WASM: install Rust 1.95+, `rustup target add wasm32-unknown-unknown`, a clang capable of targeting WASM, and wasm-bindgen-cli 0.2.129. Run `npm run build:bridge-engine`. The build checks the pinned source hashes and records a source/WASM fingerprint. `node tools/verify-bridge-export.mjs session.json` replays an exported session independently.

## Actual implementation

The unchanged upstream `bridge/src/lib.rs` and `dkg/src/consensus.rs` are retained under `bridge/engine/sdk/`, alongside the full example README. `build.rs` extracts the exact `BridgeActor::verify_payload` and `submit` method bodies without edits. A synchronous `BridgeCore` supplies the same configured foreign Scheme and latest-certificate state. This executes actual SDK verification/admission logic without its async mailbox or actor runtime.

The Scheme and Finalization aliases match `nunchi-dkg::consensus`. Original Commonware threshold scheme code creates and verifies BLS12-381 VRF finalization certificates. The fixture is the same 4-share, 3-vote construction used in the upstream Bridge unit tests. Each network has an independent session-derived key setup and namespace. The receiver is configured with the other network's verifier. A synthetic JSON proposal is hashed, voted on with three shares, assembled, and verified. Altering its digest fails verification. Wrong-network input fails. Valid same/older views return `Stale`; valid newer views update local memory.

## Boundaries

The application supplies synthetic proposal contents, displayed chain heights, the relay queue, 3D world, timing and scenarios. This is not two running node networks. It does not execute networked consensus, a distributed DKG ceremony, the Authority module, Chain block integration, RPC, state-root/inclusion proofs, asset movement or settlement. Public deterministic test shares are not secure identities. Per-share participation shown in the local fixture is not externally attributable evidence for threshold signatures.

Accepted means “valid for the configured foreign network and newer than the receiver's cached view.” It does not mean an arbitrary external chain state or business claim has been proven. Reset creates a fresh session and empty state. At most 256 certificates are generated per session. Exports reproduce included local commands and results; they do not establish historical completeness or deployed-chain finality.

To run the full SDK node/relayer example, follow the pinned `examples/bridge-chain` README linked in the demo. That architecture launches independent validator processes and uses `bridge.latestFinalization`, `bridge.submitFinalization`, and `bridge.latestAccepted` RPC calls. Those processes are not hosted by this browser demo.

The preview uses the same Three.js geometry and actual WASM model, rendered into frames with SVGRenderer. It is an animated SDK run rather than a browser recording.
