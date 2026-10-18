# Agent Payment Network

A genuine SDK asset-transfer demonstration around fictional agent service
purchases. All assets and identities are isolated tests. No real payment
provider or public network is connected.

## Run

```sh
npm ci
npm run build
npm test
```

Serve dist/ with a static host. Open /demos/payments/. The standalone source
download builds this demo only; the full hub builds all five demonstrations.
The compiled WASM is included. UI edits need no Rust build.

## Actual SDK mechanics

SDK 2026.9.0-alpha.1, commit eea35ced709f68c15d6fbc8bcc754696a7e44374.
Original Coins source is vendored unchanged under payments/engine/sdk-coins/src.
The source-hash manifest checks every original Rust file. Crypto/Common/Oracle
reuse the unchanged sources in robotics/engine/. Cargo manifests adapt the
build for WASM; native RPC, Mempool and QMDB are disabled.

A small payment Common adapter re-exports the original shared types, exposes
the original Namespace/StateStore through the expected state_db path, and
provides the original CommitState trait signature for compilation. Memory
does not implement CommitState: no commit or authenticated root is claimed.

SDK Ledger::apply_genesis creates DCR, a two-decimal demonstration asset, and
allocates 10,000 minor units to each of five agent-associated accounts. Five
providers and the issuer begin with zero. Total supply is 50,000 minor units
(500 credits). A session-specific CoinSpec yields a different real SDK asset ID
on reset. Demo signing keys are deterministic and public.

After application policy approval, Transaction::sign creates an actual
CoinOperation::Transfer from the agent to the selected provider.
Transaction::verify runs explicitly before submission and execution:
Ledger::apply_transaction deliberately does not recheck signatures.
The actual ledger enforces account authorization, nonces and balances.

Execution uses a cloned local ledger. On success, Ledger::balance queries
confirm matching sender debit and recipient credit, then the clone replaces
the active session state. On SDK failure the clone is discarded. No frontend
balance subtraction stands in for SDK asset execution.

After payment, the simulated service response is associated with a real
OracleOperation::AppendRecord transaction. Original SDK signing, verification,
OracleLedger::apply_transaction, records_by_namespace and record readback
produce the service record and its actual identifiers. The record references
the Coins transaction digest and request/task. Coins execution and service
recording are separate stages; a receipt failure can be retried without paying
again.

## Application layer and scenarios

The Rust bridge implements the demo service marketplace, quotes, spending
allocation, maximum purchase, approved providers, manual approvals, pauses,
request tracking and idempotency. This is application code, not native SDK
commerce or secure production authorization. The JavaScript layer schedules
and visualizes bridge commands; it does not own the financial ledger.

- Purchase: a research agent pays 15 credits for a fictional dataset.
- Policy violation: its single-purchase maximum starts at 10 credits. The
  application rejects before signing/submission. Adjust policy and retry.
- Duplicate: application tracking reuses an applied result by stable request ID.
  A separate test replays the original signed transaction against a discarded
  ledger clone and shows the actual SDK nonce rejection.
- Modify local amount: original SDK verification rejects the edited transaction
  payload with the original signature. Stored evidence remains unchanged.

Changing a policy invalidates pending approvals/signatures and requires current
policy evaluation. Changing prices affects future quotes; existing quotes keep
their original amount. Increasing spending authority never mints funds.
Amounts use integer minor units (100 = one credit), with bounded values.
No fees are configured. Every transfer preserves the fixed supply.
One provider per service makes provider earnings also the service breakdown.
The bridge caps a session at 128 requests.

The repository's Access Control scope/role module was inspected but is not
used for the demonstration's spending controls. RPC, Chain, Mempool and a
validator network are unnecessary for this in-process execution architecture.

## Export and verify independently

Export JSON in the interface, then:

```sh
node tools/verify-payments-export.mjs /path/to/session.json
```

A fresh genuine SDK WASM instance creates the same isolated genesis, replays
the included application commands, compares full state, transactions, Oracle
records and balances, rechecks signatures and reconciles all minor units.
Tampered transaction fields, receipts, state, journal or accounting fail.
This verifies the included local evidence, not export completeness, trusted
operator authority, real merchant fulfillment or network finality.

## Rebuild the Rust bridge

Rust 1.95+ and wasm32-unknown-unknown:

```sh
rustup target add wasm32-unknown-unknown
npm run build:payments-engine
npm run build
npm test
```

PAYMENTS_CARGO selects Cargo. Cargo.lock pins dependencies. The UI build checks
original source hashes plus a Rust-source/WASM fingerprint. Original SDK
MIT/Apache-2.0 licenses are included under robotics/engine/.

## Tests and limitations

Tests exercise SDK transfers and balance readback, authorization rejection,
manual approvals, nonce replay, invalid signatures, insufficient funds,
duplicate protection, quote changes, resets, Oracle linkage, export replay
and functional UI controls. The final embedded artifact runs real WASM in DOM
checks. The earlier four demos and their tests are retained unchanged.

All records and ledger state are local volatile memory. Refresh/reset clears
them. Public test keys are not production credentials. No real funds, external
merchant integrations, persistent QMDB, authenticated state roots, RPC service,
validators or public-network settlement are deployed. Local context metadata
are application-supplied. Browser visual QA is unavailable in this managed
environment; DOM and responsive-structure checks do not verify real layout.
The preview is rendered from the same map and actual SDK-driven state, not a
browser recording.


## Guided job

The default walkthrough is an application-scripted research job. Research Agent buys a dataset (15 credits), Data Agent buys a search (2), and Reporting Agent buys analysis (12). Three actual SDK payments and related Oracle records total 29 demo credits at default prices. Each agent uses its separate pre-existing SDK account and spending policy. The service outputs and final research brief are illustrative; no external service or agent model is called. Manual exploration, policy failure and duplicate scenarios remain available.
