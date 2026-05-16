/**
 * NewsRAG — Render Engine
 * Transforms raw analysis data from the RAG pipeline into HTML cards.
 */

// === HELPERS ===

function verdictEmoji(type) {
  const map = {
    confirmed: '✅', misleading: '⚠️', false: '❌',
    balanced: '⚖️', controversial: '🔥', developing: '📡', unverified: '🔍'
  };
  return map[type] || '📋';
}

function claimEmoji(status) {
  const map = { true: '✅', false: '❌', misleading: '⚠️', unverified: '🔍' };
  return map[status] || '🔍';
}

function trustColor(val) {
  if (val >= 0.8) return '#1a6b4a';
  if (val >= 0.6) return '#d4550a';
  return '#c0392b';
}

function biasStyle(bias) {
  const styles = {
    left:          'background:#fce8e8; color:#8b0000;',
    'center-left': 'background:#fff3e0; color:#7a3800;',
    center:        'background:#e8f0fe; color:#1a3a6b;',
    'center-right':'background:#e8f5e9; color:#1b4a2a;',
    right:         'background:#f3e5f5; color:#4a1a6b;',
  };
  return styles[bias] || styles.center;
}

function modeLabel(mode) {
  return { full: 'Full Report', debate: 'Debate', factcheck: 'Fact-Check', sentiment: 'Sentiment' }[mode] || mode;
}

// === CARD BUILDERS ===

function buildLoadingCard(topic) {
  const steps = [
    'Querying live news sources',
    'Retrieving & ranking articles',
    'Extracting key claims',
    'Cross-referencing sources',
    'Generating analysis',
  ];
  return `
    <div class="loading-card" id="loadingCard">
      <div class="loading-topic">Analyzing: ${escapeHtml(topic)}</div>
      <div class="loading-subtitle">RAG pipeline active · web search running</div>
      <div class="loading-steps">
        ${steps.map((s, i) => `
          <div class="step" id="step-${i}">
            <div class="step-dot pending" id="dot-${i}"></div>
            <span class="step-label muted" id="slabel-${i}">${s}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function buildSummaryCard(data, topic, mode) {
  const emoji = verdictEmoji(data.verdictType);
  return `
    <div class="result-card">
      <div class="card-head">
        <span class="card-head-icon">◧</span>
        <h3>${escapeHtml(topic)}</h3>
        <span class="tag tag-orange">${modeLabel(mode)}</span>
      </div>
      <div class="card-body-inner">
        <p class="summary-text">${escapeHtml(data.summary || '')}</p>
        <div class="verdict-box">
          <div class="verdict-emoji">${emoji}</div>
          <div>
            <div class="verdict-label">VERDICT</div>
            <div class="verdict-body">${escapeHtml(data.verdict || '')}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function buildSourcesCard(sources) {
  if (!sources?.length) return '';
  const cards = sources.slice(0, 4).map(s => {
    const pct = Math.round((s.trust || 0.7) * 100);
    const color = trustColor(s.trust || 0.7);
    return `
      <div class="source-card">
        <div class="source-name">${escapeHtml(s.name || 'Unknown')}</div>
        <div class="source-snip">${escapeHtml(s.snippet || '')}</div>
        <div class="source-meta">
          <div class="trust-wrap">
            <div class="trust-fill" style="width:${pct}%; background:${color};"></div>
          </div>
          <span class="trust-pct" style="color:${color}">${pct}%</span>
          <span class="bias-tag" style="${biasStyle(s.bias)}">${escapeHtml(s.bias || 'center')}</span>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="result-card">
      <div class="card-head">
        <span class="card-head-icon">⬡</span>
        <h3>Retrieved sources</h3>
        <span class="tag tag-green">${sources.length} sources</span>
      </div>
      <div class="card-body-inner">
        <div class="sources-grid">${cards}</div>
      </div>
    </div>`;
}

function buildDebateCard(pro, con) {
  if (!pro?.length && !con?.length) return '';
  const proPts = (pro || []).map(p => `
    <div class="debate-point">
      <span class="dp-bullet">+</span>
      <span>${escapeHtml(p)}</span>
    </div>`).join('');
  const conPts = (con || []).map(p => `
    <div class="debate-point">
      <span class="dp-bullet">−</span>
      <span>${escapeHtml(p)}</span>
    </div>`).join('');
  return `
    <div class="result-card">
      <div class="card-head">
        <span class="card-head-icon">⚡</span>
        <h3>Debate analysis</h3>
        <span class="tag tag-gray">Both sides</span>
      </div>
      <div class="card-body-inner">
        <div class="debate-grid">
          <div class="debate-col pro">
            <div class="debate-col-title">SUPPORTING ↑</div>
            ${proPts}
          </div>
          <div class="debate-col con">
            <div class="debate-col-title">OPPOSING ↓</div>
            ${conPts}
          </div>
        </div>
      </div>
    </div>`;
}

function buildFactCheckCard(claims) {
  if (!claims?.length) return '';
  const rows = claims.map(c => `
    <div class="claim-row">
      <div class="claim-status-icon">${claimEmoji(c.status)}</div>
      <div>
        <div class="claim-text">${escapeHtml(c.claim || '')}</div>
        <div class="claim-exp">${escapeHtml(c.explanation || '')}</div>
      </div>
    </div>`).join('');
  return `
    <div class="result-card">
      <div class="card-head">
        <span class="card-head-icon">✓</span>
        <h3>Fact-check claims</h3>
        <span class="tag tag-orange">${claims.length} claims</span>
      </div>
      <div class="card-body-inner">
        <div class="claims-list">${rows}</div>
      </div>
    </div>`;
}

function buildSentimentCard(sentiment) {
  if (!sentiment) return '';
  const s = sentiment;
  return `
    <div class="result-card">
      <div class="card-head">
        <span class="card-head-icon">◎</span>
        <h3>Media sentiment</h3>
        <span class="tag tag-gray">${escapeHtml(s.overallTone || 'mixed')}</span>
      </div>
      <div class="card-body-inner">
        <div class="sentiment-bars">
          <div class="sent-row">
            <span class="sent-label">Positive</span>
            <div class="sent-bar-wrap"><div class="sent-bar" style="width:${s.positive||0}%; background:#1a6b4a;"></div></div>
            <span class="sent-pct">${s.positive||0}%</span>
          </div>
          <div class="sent-row">
            <span class="sent-label">Neutral</span>
            <div class="sent-bar-wrap"><div class="sent-bar" style="width:${s.neutral||0}%; background:#7a7570;"></div></div>
            <span class="sent-pct">${s.neutral||0}%</span>
          </div>
          <div class="sent-row">
            <span class="sent-label">Negative</span>
            <div class="sent-bar-wrap"><div class="sent-bar" style="width:${s.negative||0}%; background:#d4550a;"></div></div>
            <span class="sent-pct">${s.negative||0}%</span>
          </div>
        </div>
        <div class="sent-tone">
          <span class="sent-tone-label">Overall tone —</span>
          <span class="sent-tone-val">${escapeHtml(s.overallTone || 'mixed')}</span>
        </div>
      </div>
    </div>`;
}

/**
 * renderResults
 * Orchestrates rendering all analysis cards into the results zone.
 */
function renderResults(data, topic, mode) {
  const zone = document.getElementById('resultsZone');
  zone.innerHTML = [
    buildSummaryCard(data, topic, mode),
    buildSourcesCard(data.sources),
    buildDebateCard(data.proArguments, data.conArguments),
    buildFactCheckCard(data.claims),
    buildSentimentCard(data.sentiment),
  ].filter(Boolean).join('');
}

function renderError(message) {
  document.getElementById('resultsZone').innerHTML = `
    <div class="result-card">
      <div class="card-head">
        <span class="card-head-icon">⚠</span>
        <h3>Analysis failed</h3>
        <span class="tag tag-orange">Error</span>
      </div>
      <div class="card-body-inner">
        <p style="color:#7a7570; font-size:14px;">${escapeHtml(message)}</p>
        <p style="color:#7a7570; font-size:12px; margin-top:8px; font-family: 'DM Mono', monospace;">
          Check your API key in config and try again.
        </p>
      </div>
    </div>`;
}

// === ANIMATION ===

async function animateLoadingSteps(stepCount = 5) {
  for (let i = 0; i < stepCount; i++) {
    const dot = document.getElementById('dot-' + i);
    const label = document.getElementById('slabel-' + i);
    if (!dot) break;
    dot.className = 'step-dot active';
    label.className = 'step-label';
    await sleep(800);
    dot.className = 'step-dot done';
  }
}

// === UTILS ===

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
