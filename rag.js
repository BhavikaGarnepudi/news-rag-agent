/**
 * NewsRAG — RAG Pipeline Core
 * Handles Claude API calls with web_search tool enabled.
 * This is the heart of the Retrieval-Augmented Generation pipeline.
 */

const RAG_CONFIG = {
  apiEndpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1500,
};

/**
 * MODE PROMPTS
 * Each mode instructs Claude to search the web and return structured JSON.
 * The web_search tool is what makes this a RAG system — Claude retrieves
 * live documents and augments its generation with real sources.
 */
const MODE_PROMPTS = {
  full: `You are a professional AI news analyst with access to live web search.
Search for recent news about the given topic from multiple sources.
Analyze the retrieved articles and return ONLY a valid JSON object (no markdown, no backticks, no preamble):
{
  "summary": "2-3 sentence executive summary of current state of this topic",
  "sources": [
    {"name": "Source outlet name", "snippet": "Key point from this source (max 20 words)", "trust": 0.85, "bias": "center"}
  ],
  "keyFacts": ["Verified fact 1", "Verified fact 2", "Verified fact 3"],
  "proArguments": ["Strong argument supporting one side", "Another supporting argument", "Third supporting point"],
  "conArguments": ["Strong argument against", "Another opposing argument", "Third opposing point"],
  "verdict": "Your balanced analytical synthesis and verdict on the topic",
  "verdictType": "balanced|controversial|misleading|confirmed|developing",
  "claims": [
    {"claim": "A specific verifiable claim in the news", "status": "true|false|misleading|unverified", "explanation": "Evidence-based explanation"}
  ],
  "sentiment": {"positive": 35, "negative": 40, "neutral": 25, "overallTone": "cautious"}
}
Bias values: left, center-left, center, center-right, right. Trust 0.0-1.0.`,

  debate: `You are a debate moderator AI with live web search access.
Search for multiple perspectives on the given topic and structure a rigorous debate.
Return ONLY valid JSON (no markdown, no backticks):
{
  "summary": "Topic overview and why it is contested",
  "sources": [
    {"name": "Source name", "snippet": "Their stance or key point (max 20 words)", "trust": 0.8, "bias": "center-left"}
  ],
  "keyFacts": ["Agreed-upon fact 1", "Agreed-upon fact 2"],
  "proArguments": ["Evidence-backed argument FOR", "Data point supporting", "Stakeholder perspective in favor"],
  "conArguments": ["Evidence-backed argument AGAINST", "Data point opposing", "Stakeholder perspective opposed"],
  "verdict": "Moderator's balanced synthesis — what the debate reveals about the complexity of this issue",
  "verdictType": "controversial",
  "claims": [
    {"claim": "Central contested claim", "status": "unverified", "explanation": "Why experts disagree"}
  ],
  "sentiment": {"positive": 40, "negative": 40, "neutral": 20, "overallTone": "divided"}
}`,

  factcheck: `You are a rigorous AI fact-checker with live web search access.
Search authoritative sources to verify claims about the given topic.
Return ONLY valid JSON (no markdown, no backticks):
{
  "summary": "What is being claimed and why fact-checking it matters",
  "sources": [
    {"name": "Authoritative source", "snippet": "Evidence they provide (max 20 words)", "trust": 0.92, "bias": "center"}
  ],
  "keyFacts": ["Verified fact from primary source", "Corroborating data point"],
  "proArguments": ["Evidence that supports the claim", "Corroborating source finding"],
  "conArguments": ["Evidence that contradicts", "Alternative interpretation from data"],
  "verdict": "Fact-check verdict with confidence level (e.g. Mostly True — 80% confidence)",
  "verdictType": "confirmed|misleading|false|unverified",
  "claims": [
    {"claim": "Specific verifiable sub-claim", "status": "true|false|misleading|unverified", "explanation": "What the evidence actually shows"}
  ],
  "sentiment": {"positive": 30, "negative": 30, "neutral": 40, "overallTone": "analytical"}
}`,

  sentiment: `You are a media sentiment analyst with live web search access.
Search multiple news outlets covering the given topic and analyze their tone, framing, and bias.
Return ONLY valid JSON (no markdown, no backticks):
{
  "summary": "Overview of how different media outlets are framing this topic",
  "sources": [
    {"name": "Media outlet", "snippet": "Their angle or framing of the story (max 20 words)", "trust": 0.8, "bias": "center-right"}
  ],
  "keyFacts": ["Objective fact all outlets agree on", "Another shared data point"],
  "proArguments": ["Positive/optimistic framing used by media", "Hopeful narrative angle"],
  "conArguments": ["Negative/pessimistic framing used by media", "Alarming narrative angle"],
  "verdict": "Overall media sentiment analysis — what the coverage pattern reveals about institutional biases",
  "verdictType": "balanced|controversial",
  "claims": [
    {"claim": "Dominant media narrative claim", "status": "unverified", "explanation": "How this narrative is being pushed and by whom"}
  ],
  "sentiment": {"positive": 45, "negative": 35, "neutral": 20, "overallTone": "mixed"}
}`
};

/**
 * runRAGPipeline
 * The core RAG function. Sends topic + mode prompt to Claude API
 * with web_search enabled. Claude autonomously retrieves sources
 * and generates a structured analysis.
 *
 * @param {string} topic - The news topic to analyze
 * @param {string} mode - One of: full, debate, factcheck, sentiment
 * @returns {Promise<Object>} - Parsed analysis object
 */
async function runRAGPipeline(topic, mode = 'full') {
  const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.full;

  const requestBody = {
    model: RAG_CONFIG.model,
    max_tokens: RAG_CONFIG.maxTokens,
    // 🔑 This is what makes it RAG: web_search lets Claude retrieve
    // live documents before generating its response
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search'
      }
    ],
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this news topic: "${topic}"\n\nSearch for the most recent and relevant sources. Return your complete analysis as a single JSON object.`
      }
    ]
  };

  const response = await fetch(RAG_CONFIG.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // API key is injected by the Anthropic proxy — do not hardcode here
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  // Collect all text blocks from the response (Claude may interleave
  // tool_use and text blocks when using web search)
  const fullText = data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  return parseRAGResponse(fullText);
}

/**
 * parseRAGResponse
 * Robustly extracts JSON from Claude's response, handling
 * markdown fences or stray text around the JSON object.
 *
 * @param {string} text - Raw text from Claude
 * @returns {Object} - Parsed analysis data
 */
function parseRAGResponse(text) {
  // Strip markdown code fences if present
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(clean);
  } catch (_) {
    // Extract first JSON object from the text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Could not extract structured data from response.');
  }
}
