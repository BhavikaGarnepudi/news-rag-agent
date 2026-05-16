# 📰 NewsRAG — AI News Analyst Agent

> A Retrieval-Augmented Generation (RAG) powered news analyst that searches live sources, cross-references claims, debates both sides, and delivers a structured verdict.

![NewsRAG Demo](https://img.shields.io/badge/Claude-Sonnet_4-orange?style=flat-square)
![Web Search](https://img.shields.io/badge/RAG-Web_Search-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🧠 What is RAG?

**Retrieval-Augmented Generation (RAG)** is an AI architecture where the model:

1. **Retrieves** relevant documents from external sources (here: live web)
2. **Augments** its context with the retrieved information
3. **Generates** a grounded, factual response based on real sources

In NewsRAG, Claude uses its built-in `web_search` tool to retrieve live news articles before generating any analysis. This means every report is grounded in current, real-world sources — not just training data.

```
User Query → Claude Web Search → Retrieved Articles → Analysis Generation → Structured Report
    ↑                                                                              ↓
    └─────────────────────── RAG Pipeline ────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Full Report** | Executive summary, sources, key facts, debate, fact-check, and sentiment |
| **Debate Mode** | Structured pro/con breakdown with evidence-backed arguments |
| **Fact-Check** | Claim-by-claim verification with ✅ ❌ ⚠️ verdicts |
| **Sentiment Analysis** | Media tone analysis across positive/negative/neutral dimensions |
| **Source Trust Scoring** | Each source rated 0–100% trustworthiness |
| **Bias Detection** | Political bias classification per outlet (left → right spectrum) |
| **Live Web Search** | Every analysis pulls from real-time sources via Claude's search tool |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/news-rag-agent.git
cd news-rag-agent
```

### 2. Set up your API key

This project uses Claude's API through Anthropic. You need an API key from [console.anthropic.com](https://console.anthropic.com).

> ⚠️ **Security**: Never hardcode your API key in source files. Use a local proxy or environment variable.

**Option A — Use with claude.ai Artifacts** (no setup needed):
The app is designed to work directly inside Claude.ai where the API key is injected automatically.

**Option B — Local proxy** (recommended for self-hosting):

```bash
# Install a simple CORS proxy
npm install -g local-cors-proxy

# Set your API key
export ANTHROPIC_API_KEY=your_key_here

# Update src/utils/rag.js to point to your proxy
```

**Option C — Simple server**:

```bash
# Python (no install needed)
python3 -m http.server 8080

# Node.js
npx serve .
```

### 3. Open the app

```
http://localhost:8080
```

---

## 📁 Project Structure

```
news-rag-agent/
├── index.html                 # Main HTML shell + layout
├── src/
│   ├── styles/
│   │   └── main.css           # Full design system (Syne + DM Sans)
│   └── utils/
│       ├── rag.js             # 🔑 RAG pipeline core (API + prompts)
│       ├── render.js          # HTML card renderer
│       └── main.js            # App controller + UI events
└── README.md
```

### Key File: `src/utils/rag.js`

This is the heart of the RAG system:

```javascript
// The web_search tool is what makes this RAG
tools: [
  {
    type: 'web_search_20250305',
    name: 'web_search'
  }
]
```

Claude autonomously decides when and what to search based on the topic, retrieves multiple sources, and then generates a structured JSON analysis grounded in those sources.

---

## 🔧 Configuration

Edit `src/utils/rag.js` to change:

```javascript
const RAG_CONFIG = {
  model: 'claude-sonnet-4-20250514',  // Claude model
  maxTokens: 1500,                     // Response length
};
```

---

## 🎨 Design

- **Typography**: Syne (display) + DM Sans (body) + DM Mono (code/labels)
- **Aesthetic**: Editorial / brutalist — high contrast, bold type, raw borders
- **Theme**: Light with cream background, charcoal black, burnt orange accent
- **Fully responsive**: Mobile-first grid collapses

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Built With

- [Claude API](https://anthropic.com) — AI backbone + web search RAG
- [Syne Font](https://fonts.google.com/specimen/Syne) — Display typography
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) — Body font

---

> **Disclaimer**: For informational purposes only. Always verify news from primary sources. NewsRAG is an AI tool and may make errors.
