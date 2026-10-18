# Robotics Lab

An interactive warehouse example built with real Nunchi SDK Crypto, Common and
Oracle mechanics. The application simulates six mobile robots, tasks, telemetry,
failures, recovery and operating costs. This is an explainer and interactive demo.

Open `/demos/robotics/` from the Demo Hub. The 70-second walkthrough starts
automatically. Watch, pause, skip ahead, take control or choose a failure/tamper
scenario. WebGL2 renders the low-poly warehouse; a selectable 2D map is the fallback.

## Actual SDK execution

SDK release: **2026.9.0-alpha.1**.
Pinned commit: `eea35ced709f68c15d6fbc8bcc754696a7e44374`.

1. The application creates an event with a robot, delivery, package and session.
2. The SDK `Transaction::sign` creates an `OracleOperation::AppendRecord`.
3. `Transaction::verify` checks the transaction before admission. This is essential:
   `OracleLedger::apply_transaction` deliberately does not recheck the signature.
4. The original SDK `OracleLedger` applies the operation over a memory-backed
   application implementation of `StateStore`. The original `OracleDB` adapter
   writes encoded data using the SDK's namespace/key derivation.
5. `records_by_namespace` retrieves the appended record, and `record` reads it by
   the real SDK-generated ID. The bridge checks writer/payload equality.
6. A second `Transaction::verify` produces the on-write verification result.
7. The inspector queries the record again. Verification and edited-payload tests
   call the same original SDK verification code in WebAssembly.

The full Oracle source and the Common/Crypto source are vendored unchanged from
that commit. `engine/sdk-source-hashes.json` checks their bytes. Browser Cargo
manifests disable native Common storage. The Common adapter re-exports original
transaction/account primitives and supplies the original Namespace/StateStore
definitions plus matching RuntimeContext fields without a native QMDB backend.
The thin app bridge, memory store and simulation are original application code.
No RPC backend or network node is needed. Coins is not used.

SDK records, transaction IDs, encoded keys, signatures and results come from Rust
execution. The host bridge does not manufacture them in JavaScript. Every reset
gets a fresh session namespace; the six deterministic public demo keys remain
isolated software identities, with independent SDK nonces.

## Run and build

From the project root:

```sh
npm ci
npm run build
npm test
```

Serve `dist/` with any static host. The HTML includes all Three.js code, styles
and the compiled SDK WASM. The included WASM is sufficient for normal UI changes.
The build verifies its fingerprint against all Rust sources and manifests.

To change Rust code, use Rust 1.95+ and the `wasm32-unknown-unknown` target:

```sh
rustup target add wasm32-unknown-unknown
npm run build:robotics-engine
npm run build
npm test
```

`ROBOTICS_CARGO` can select a particular Cargo executable. Cargo.lock pins the
dependency graph. Vendored SDK code is dual licensed MIT/Apache-2.0.

## Export and independently replay

Export JSON in the demo, then run:

```sh
node tools/verify-robotics-export.mjs /path/to/session.json
```

This offline verifier creates a fresh WASM instance and Oracle store, re-admits
each original signed transaction and checks nonce order, transaction/record IDs,
signer/signature bytes, namespace, payload bytes, context metadata and parsed
payload equality. Duplicated, missing, altered or invalid signed records fail.
It verifies the exported evidence, not unsigned simulation totals or physical
events. The preview capture can be checked with the same command.

## Operations and assumptions

- A deterministic queue allocates work to healthy active robots in index order.
- Routes pass along marked aisles. Lowering active count affects new assignments;
  already assigned work finishes. This is not a physical navigation/safety system.
- On failure the application reports an event, interrupts the task, leaves a
  collected package at the failure location and reassigns it to another active
  healthy robot. The next signed event links to the failure record ID.
- Charging and resumed-service events use the same genuine recording path.
- Operating cost is modeled from robot time plus estimated electricity. Rates are
  configurable and applying them starts a fresh session. Signed events include
  the sample rates, cumulative robot cost and task cost. Fleet cost per delivery
  includes standby time. These are not SDK resource measurements.
- Event windows contain 128 records, below Oracle's 1,024-record bucket limit.
  At 4,096 records this local demo asks the visitor to export and reset.

## Validation and limits

Tests cover original-source hashes, import-free WASM startup, actual signing,
append/read/query, destination tampering, nonce replay, writer attribution,
session separation, delivery, failure/recovery, charging, cost attribution,
offline replay, UI controls, inspector, JSON export, guided timing, the usable
2D fallback, six independent Three.js robot hierarchies and camera bounds at
desktop/mobile aspect ratios. The final embedded HTML is also booted in a DOM
test. Existing Office Lab and Exchange Lab tests remain part of the suite.

Browser WebGL visual QA is unavailable in the managed environment. The animated
preview uses the same actual 3D geometry and SDK-driven simulation, rendered to
SVG frames and encoded as MP4; it is labeled an animated SDK run, not a browser
recording or physical warehouse footage. Rebuild it with
`node tools/preview/render-robotics.mjs <temporary-frame-directory>` and FFmpeg
at 8 fps. The preview plays 48 simulated seconds in 12 seconds.

The local store is volatile: refresh/reset clears it. No persistent QMDB,
authenticated state-root proof, validators, RPC service or network finality is
deployed. Context sequence and timestamps are application-supplied. Public demo
keys do not authenticate real devices. A valid signature proves the signed
message's integrity and signer; it does not prove that a package was delivered,
that a reported cost is correct or that a robot operated safely.
