/**
 * NewsRAG — App Controller
 * Manages UI state, user interactions, and orchestrates the RAG pipeline.
 */

let currentMode = 'full';
let isAnalyzing = false;

// === MODE SWITCHING ===

function switchMode(btn, mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// === QUICK TOPIC SETTER ===

function setTopic(topic) {
  document.getElementById('topicInput').value = topic;
  document.getElementById('topicInput').focus();
}

// === MAIN ANALYZE FLOW ===

async function analyze() {
  if (isAnalyzing) return;

  const input = document.getElementById('topicInput');
  const topic = input.value.trim();
  if (!topic) {
    input.focus();
    input.style.borderColor = '#d4550a';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  isAnalyzing = true;
  setButtonState(true);

  // Show loading UI
  const zone = document.getElementById('resultsZone');
  zone.innerHTML = buildLoadingCard(topic);

  // Animate steps concurrently with API call
  const animPromise = animateLoadingSteps(5);

  try {
    const data = await runRAGPipeline(topic, currentMode);
    await animPromise; // Let animation finish gracefully
    renderResults(data, topic, currentMode);
  } catch (err) {
    await animPromise;
    renderError(err.message || 'Unknown error occurred.');
    console.error('[NewsRAG] Pipeline error:', err);
  } finally {
    isAnalyzing = false;
    setButtonState(false);
  }
}

function setButtonState(loading) {
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = loading;
  btn.querySelector('.btn-label').textContent = loading ? 'Analyzing...' : 'Analyze';
  btn.querySelector('.btn-arrow').textContent = loading ? '⟳' : '→';
}

// === EVENT LISTENERS ===

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('topicInput');

  // Enter key triggers analysis
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyze();
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Header visibility on scroll
  const header = document.querySelector('.site-header');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 100 && y > lastScroll) {
      header.style.transform = 'translateY(-100%)';
      header.style.transition = 'transform 0.3s ease';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScroll = y;
  });
});
