# AI Operations Center

Five departments, twenty agents, three fictional customers and a $5,000 sample
budget. All workloads and provider usage are synthetic. All claimed SDK signing,
record writes, reads, queries and signature checks execute genuinely.

## Run

From the source root:

```sh
npm ci
npm run build
npm test
```

Serve dist/ with a static host. Open /demos/operations/. The standalone source
download builds this demo only. The full hub builds all four demos. The included
WASM is sufficient for UI changes.

## Actual SDK execution

SDK 2026.9.0-alpha.1, commit eea35ced709f68c15d6fbc8bcc754696a7e44374.

Original Crypto, Common and complete Oracle Rust sources are shared unchanged
with Robotics Lab under robotics/engine/. The source-hash manifest verifies
their bytes. Browser Cargo manifests disable native QMDB; the Common adapter
uses original Namespace/StateStore definitions and a matching RuntimeContext.

The application builds a synthetic usage payload with customer, department,
project, agent and task attribution, quantities, rate snapshot and microUSD
charge components. Actual Transaction::sign creates OracleOperation::AppendRecord.
Transaction::verify checks it before OracleLedger::apply_transaction executes.
The ledger deliberately does not recheck signatures: the application bridge
does so explicitly. Original OracleDB code writes to an app-provided memory
StateStore. records_by_namespace and record retrieve the SDK-generated record
and check payload/writer equality. A second actual signature check supplies the
verification result. Only a successful matching record enters analytics.

The evidence inspector retrieves the original record again. Verify and local
tampering call the same genuine SDK code. JavaScript does not manufacture any
SDK IDs, signatures, transaction digests or verification results.

shared/local-oracle-sdk.js is a thin reusable app transport, not a public SDK
API. RPC and Coins are not used. Twenty public deterministic software keys have
separate writer nonces. Resets create fresh namespaces. These are demonstration
identities, not organizational authorization or trusted device credentials.

## Scenarios

Normal operations: deterministic simulated workflows across five departments.
Four successful steps normally complete a workflow. Some failed calls incur
charges and require retries.

Runaway agent: AGENT-20 begins repeated retrievals after eight modeled minutes.
Application logic flags 60 tool invocations in a rolling five-minute window.
Pause/resume is app behavior. Before/after values show the actual observation
windows and are not claims of savings or SDK enforcement.

Billing audit: a fresh real SDK run advances a sixty-minute synthetic period,
then pauses for customer/project/task/event inspection. It is not captured replay.

## Accounting

Example Lite/Core/Pro and tool rates are illustrative, not provider quotes.
Input microUSD = round(input tokens * USD per million). Output uses the same
units. Tool microUSD = round(invocations * USD per call * 1,000,000).
Totals sum integer components before display rounding. Rate changes affect
future usage, preserving old signed rate snapshots. Retry cost is a subset of
model/tool charges, not an additional charge. Cost per completed workflow
includes all usage, including incomplete work. A tool event may batch multiple
invocations; each usage event, not each real external request, is signed.

Budgets warn at 80% and do not stop workflows. The eight-hour extrapolation uses
the observed rate and is not a forecast or measured ROI. Session generation is
bounded at one hour or 1,024 events, in 128-record Oracle buckets.

## Exports and independent verification

Usage CSV, accounting CSV, department/customer summary CSV and selected-customer
accounting CSV include IDs relating charges to events and SDK records.

Export Evidence JSON, then:

```sh
node tools/verify-operations-export.mjs /path/to/session.json
```

A fresh WASM instance re-admits original signed transactions, compares IDs,
nonces, signer/signature bytes, namespace, payload bytes and record readback,
then reconciles usage and aggregate totals from the signed quantities/rates.
An altered signed payload fails cryptography; altered summaries fail arithmetic.

## Rebuild the Rust bridge

Rust 1.95+ and wasm32-unknown-unknown:

```sh
rustup target add wasm32-unknown-unknown
npm run build:operations-engine
npm run build
npm test
```

OPERATIONS_CARGO selects a Cargo executable. Cargo.lock pins dependencies.
The build checks a source/WASM fingerprint. SDK licenses are included under
robotics/engine/ (MIT / Apache-2.0).

## Tests and limits

Checks cover real WASM signing, writes, queries, tampering, nonce replay, reset
separation, accounting reconciliation, rate changes, retries, budget monitoring,
runaway intervention, billing, export replay and functional DOM interactions.
The final embedded artifact is tested with actual WASM. Existing demos retain
their original artifacts and tests.

No provider requests, persistent QMDB, state-root proof, validators, RPC service,
network finality, external usage attestation or production billing is deployed.
Timestamps/context sequence are app-supplied. Local records clear on refresh or
restart. A signature authenticates signed data, not provider usage, price truth
or an invoice. Replay validates included evidence, not snapshot completeness.

Browser visual QA is unavailable in the managed environment. DOM and responsive
structure checks do not replace a real browser layout check. The preview is an
animated rendering of the same map and genuine SDK-driven state, not a browser
recording.

