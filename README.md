# Nunchi / Demo Lab

A static, responsive gallery that hosts Office Lab, Exchange Lab and Robotics Lab on one origin.
Each example has a muted video preview, a native “+” disclosure explaining the SDK,
a launch link, a suggested interaction and an explicit simulation boundary.

Run `npm ci`, `npm run build`, then `npm test`. Serve `dist/` on a static host.
Live prices in Exchange Lab require Coinbase’s public spot and candle APIs.

## Add a demo

1. Add the self-contained app under `dist/demos/<name>/index.html`.
2. Add a muted MP4 and poster under `dist/media/`.
3. Add an entry to `src/demos.js`, including its actual SDK modules, application
   rules, scope, URL, preview paths and a useful action to try.
4. Run the build and tests. The gallery and `catalog.json` are generated together.

Keep examples, modeled outcomes, captured evidence and actual SDK execution
clearly distinguished. New categories need a corresponding filter in the template.

## Demo provenance

- Office Lab v59: `9a14a08710baab6aed0cbf105bd817a67b432c42`, from the existing
  Nunchi SDK experience project. The hosted example replays captured SDK Oracle
  records. Workload, performance, usage beyond the capture and prices are modeled.
- Exchange Lab v4: `a8240784a81dc91ed6a3bad0929728d543bee01f`, from the existing
  Exchange Lab project. The actual SDK Rust matcher and transaction/signature code
  run as WebAssembly. Wallet rules and settlement are the application’s paper logic.
- All three use SDK revision `eea35ced709f68c15d6fbc8bcc754696a7e44374`.
- Robotics Lab uses that same SDK revision with genuine Crypto/Common/Oracle
  WebAssembly execution. See `robotics/README.md` for the exact APIs, source
  hashes, architecture, verification flow, assumptions and limitations.
- Original demo bundles are preserved except for gallery navigation. Their existing
  sites and access settings are unchanged.

## Preview assets

- Office: a cropped, muted 14-second excerpt of the retained October 14 office
  recording at the user-provided outreach reference’s `media/office.mp4`. It shows
  an earlier sample configuration, not a current productivity measurement.
- Exchange: a 10-second rendered animation of the actual Exchange Lab room
  geometry and local SDK paper fills. Its reference quotes are illustrative
  fixtures. It is labeled an animated SDK playback, not a browser recording or
  live market feed. Capture metadata and the successful order verification are
  retained in `tools/preview/exchange-capture.json`.
- `tools/preview/room-model.js` and `candles.js` are unchanged copies from Exchange
  Lab v4. The SVG renderer expands instanced geometry for offline asset rendering.
  Generate SVG frames with `node tools/preview/render-exchange.mjs <temp-directory>`
  and encode at 8 fps with FFmpeg. This does not verify browser WebGL rendering.
- General Sans font is retained from the supplied Nunchi reference site.
- Three.js retains its MIT license in the vendored dependency and app bundle.

Native HTML links and disclosures work without JavaScript. JavaScript adds filters,
lazy video playback and pausing when videos leave view. Reduced-motion and data-
saving visitors get posters until they explicitly choose Preview.
