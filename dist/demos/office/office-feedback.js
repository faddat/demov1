(() => {
  const document = globalThis.document;
  if (!document || document.body.dataset.feedbackRevision === 'office-2026-10-16') return;
  document.body.dataset.feedbackRevision = 'office-2026-10-16';

  const $ = (selector) => document.querySelector(selector);
  const setText = (selector, value) => {
    const node = $(selector);
    if (node) node.textContent = value;
    return node;
  };

  document.title = 'Nunchi Meter / Office Lab';
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = 'Compare a manual team with an agent-assisted team, then open the signed usage record behind every software charge.';

  setText('.intro-subtitle', 'Same tasks. Same requirements. One shared deadline.');
  setText('.assisted-label small', 'AGENT-ASSISTED TEAM');
  setText('.setup .roster:nth-child(3) .eyebrow', 'AGENT-ASSISTED TEAM');
  setText('.assisted-team .team-heading h2', 'Agent-assisted team');

  const assumptionsButton = $('#assumptions-open');
  if (assumptionsButton) assumptionsButton.textContent = 'Timing & cost ↗';

  const comparison = $('.comparison');
  let speedProof;
  if (comparison) {
    speedProof = document.createElement('section');
    speedProof.className = 'speed-proof';
    speedProof.setAttribute('aria-label', 'Current modeled speed comparison');
    speedProof.innerHTML = `
      <div class="speed-proof-copy"><span class="eyebrow">CURRENT MODELED SPEED</span><strong>See the time difference immediately.</strong><small>Uses the timing assumptions selected above. This is a scenario estimate, not measured production latency.</small></div>
      <div class="speed-proof-value manual"><span class="metric-label">Manual first task</span><strong id="speed-manual">—</strong><span class="speed-note">current model</span></div>
      <div class="speed-proof-value assisted"><span class="metric-label">Agent-assisted first task</span><strong id="speed-assisted">—</strong><span class="speed-note">current model</span></div>
      <div class="speed-proof-value delta"><span class="metric-label">Time saved</span><strong id="speed-delta">—</strong><span class="speed-note">first completed task</span></div>`;
    comparison.after(speedProof);
  }

  const ledgerHeading = $('.ledger-heading');
  if (ledgerHeading) {
    const lead = document.createElement('p');
    lead.className = 'ledger-lead';
    lead.textContent = 'Pick any task to see the agent, usage, charge and signed SDK evidence behind each call.';
    ledgerHeading.after(lead);

    const chain = document.createElement('section');
    chain.className = 'record-chain';
    chain.setAttribute('aria-labelledby', 'record-chain-title');
    chain.innerHTML = `
      <div class="record-chain-header">
        <div><p class="eyebrow">NUNCHI SDK / SIGNED RECORD CHAIN</p><h3 id="record-chain-title">From software call to cost record.</h3><p class="record-chain-intro">Meter the usage, attach the cost, sign the payload, append it to the Oracle ledger, then query or export it.</p></div>
        <div class="chain-height"><span>Local test ledger height</span><strong id="chain-height">#000</strong><small>captured session</small></div>
      </div>
      <div class="record-chain-track" aria-label="Software call to signed SDK record flow">
        <div class="chain-packet" aria-hidden="true"></div>
        <article class="chain-block"><span>01 / CALL</span><strong>Model or tool runs</strong><small>Customer, task and agent are attached.</small></article>
        <article class="chain-block"><span>02 / METER</span><strong>Usage becomes cost</strong><small>Tokens and tools use your pricing rules.</small></article>
        <article class="chain-block"><span>03 / SIGN</span><strong>Payload is signed</strong><small>The recorder and unchanged data can be checked.</small></article>
        <article class="chain-block"><span>04 / APPEND</span><strong>Oracle record is stored</strong><small>The accepted record advances the local ledger.</small></article>
        <article class="chain-block"><span>05 / USE</span><strong>Inspect or export</strong><small>Group spend by customer, task or agent.</small></article>
      </div>
      <div class="chain-state"><strong id="chain-live-state">Waiting for the first accepted call.</strong><span id="chain-live-record">No signed record selected yet.</span></div>
      <p class="chain-boundary">This browser replays a captured SDK test session. “Ledger height” here means accepted record position in that local capture, not a public-network block height.</p>`;
    lead.after(chain);
  }

  setText('#integration-title', 'Connect each charge to the work behind it.');
  setText('.integration-lead', 'Nunchi adds a signed cost record around the software and tools your application already uses: who made the call, what ran, what it used, what it cost and which task it belonged to.');
  const steps = $('.integration-steps');
  if (steps) {
    steps.innerHTML = `
      <li><span class="integration-step-number">01 / METER EVERY CALL</span><h3>Capture usage and cost.</h3><p>Attach the customer, task and agent to each model or tool call. Apply your own prices to the reported quantities.</p></li>
      <li><span class="integration-step-number">02 / CREATE EVIDENCE</span><h3>Sign and append the record.</h3><p>The SDK verifies the signed payload and stores it in the Oracle ledger with its record and transaction identifiers.</p></li>
      <li><span class="integration-step-number">03 / USE THE RECORDS</span><h3>Inspect, group or export.</h3><p>Bring the records back into your dashboard for cost analysis, customer reporting or billing.</p></li>`;
  }
  setText('.integration-boundary', 'Nunchi does not perform the office work or run the agents. It meters and records the calls around that work. This hosted example replays records made from sample usage and prices; your application supplies the real usage and pricing.');

  const replacements = [
    [/Team \+ agents/g, 'Agent-assisted team'],
    [/team \+ agents/g, 'agent-assisted team'],
    [/(?<!agent-)assisted team/gi, (match) => match === match.toUpperCase() ? 'AGENT-ASSISTED TEAM' : match[0] === match[0].toUpperCase() ? 'Agent-assisted team' : 'agent-assisted team'],
    [/\bBriefs\b/g, 'Tasks'],
    [/\bbriefs\b/g, 'tasks'],
    [/\bBrief\b/g, 'Task'],
    [/\bbrief\b/g, 'task']
  ];

  const shouldSkip = (textNode) => textNode.parentElement?.closest('script, style, pre, code, textarea');
  const normalizeTextNode = (textNode) => {
    if (shouldSkip(textNode)) return;
    let value = textNode.nodeValue;
    for (const [pattern, replacement] of replacements) value = value.replace(pattern, replacement);
    if (value !== textNode.nodeValue) textNode.nodeValue = value;
  };
  const normalizeTree = (root) => {
    if (!root) return;
    if (root.nodeType === 3) return normalizeTextNode(root);
    if (root.nodeType !== 1 || root.matches?.('script, style, pre, code, textarea')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) normalizeTextNode(node);
  };
  normalizeTree(document.body);

  const readMinutes = (selector) => {
    const match = $(selector)?.textContent.match(/([\d,.]+)\s*min/i);
    return match ? Number(match[1].replaceAll(',', '')) : null;
  };
  const updateSpeed = () => {
    const manual = readMinutes('#manual-first');
    const assisted = readMinutes('#assisted-first');
    if (!Number.isFinite(manual) || !Number.isFinite(assisted)) return;
    setText('#speed-manual', `${manual.toLocaleString('en-US')} min`);
    setText('#speed-assisted', `${assisted.toLocaleString('en-US')} min`);
    const delta = manual - assisted;
    setText('#speed-delta', delta > 0 ? `${delta.toLocaleString('en-US')} min sooner` : delta < 0 ? `${Math.abs(delta).toLocaleString('en-US')} min slower` : 'Same time');
  };

  let previousCount = -1;
  const updateChain = () => {
    const snapshot = globalThis.NunchiOfficeEnterpriseBridge?.snapshot?.();
    const records = Array.isArray(snapshot?.records) ? snapshot.records : [];
    const count = records.length;
    setText('#chain-height', `#${String(count).padStart(3, '0')}`);
    if (count === previousCount) return;
    previousCount = count;
    const blocks = [...document.querySelectorAll('.chain-block')];
    blocks.forEach((block, index) => block.classList.toggle('is-active', count > 0 && index <= ((count - 1) % blocks.length)));
    if (!count) {
      setText('#chain-live-state', 'Waiting for the first accepted call.');
      setText('#chain-live-record', 'No signed record selected yet.');
      return;
    }
    const record = records[count - 1];
    const amount = Number(record?.payload?.cost_microusd || 0) / 1e6;
    const name = record?.payload?.call?.name || 'model / tool call';
    const id = String(record?.record_id || record?.id || '').slice(0, 12);
    setText('#chain-live-state', `${name} accepted · $${amount.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 4})}`);
    setText('#chain-live-record', id ? `record ${id}…` : `record ${count}`);
  };

  updateSpeed();
  updateChain();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') normalizeTextNode(mutation.target);
      for (const node of mutation.addedNodes || []) normalizeTree(node);
    }
    updateSpeed();
  });
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
  const chainTimer = globalThis.setInterval(updateChain, 400);
  globalThis.NunchiOfficeFeedback = {updateSpeed, updateChain};
  globalThis.addEventListener('pagehide', () => {
    observer.disconnect();
    globalThis.clearInterval(chainTimer);
  }, {once: true});
})();
