# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Horizon is an AI-driven news aggregation system. It fetches items from multiple sources (Hacker News, RSS, Reddit, Telegram, Twitter/X, GitHub, OpenBB, GDELT, Google News), deduplicates across sources, scores and filters with AI, enriches with background context and community comments, then generates bilingual (EN/ZH) Markdown daily briefings delivered via GitHub Pages, email, webhooks, or an MCP server.

## Commands

```bash
# Install dependencies
uv sync                          # core deps
uv sync --extra dev              # + pytest
uv sync --extra twitter          # + playwright for Twitter scraping
uv sync --extra openbb           # + OpenBB financial news SDK
uv sync --extra trafilatura      # + full article extraction

# Run
uv run horizon                   # 24h window (default)
uv run horizon --hours 48        # custom window
uv run horizon-wizard            # interactive config setup
uv run horizon-mcp               # MCP server
uv run horizon-webhook           # webhook CLI

# Tests
uv run pytest                    # all tests
uv run pytest tests/test_analyzer.py       # single file
uv run pytest tests/test_rss.py -k "name"  # single test

# Docker
docker compose run --rm horizon
docker compose run --rm horizon --hours 48

# Type checks / linting (no formal tool configured; follow existing style)
```

## Architecture

```
src/
├── main.py              # CLI entry point, argparse, banner
├── orchestrator.py      # HorizonOrchestrator: the main pipeline
├── models.py            # All Pydantic config models + ContentItem + SourceType enum
├── url_security.py      # URL validation for webhook delivery
├── _file_utils.py       # Atomic file writes (tempfile + os.replace)
│
├── ai/                  # AI layer
│   ├── client.py        # AIClient ABC + Anthropic/OpenAI/Azure/Gemini + ChainedAIClient (fallback)
│   ├── analyzer.py      # ContentAnalyzer: batch score items with structured JSON output
│   ├── summarizer.py    # DailySummarizer: generate Markdown briefing per language
│   ├── enricher.py      # ContentEnricher: web-search background context per item
│   ├── prompts.py       # All system/user prompt strings
│   ├── tokens.py        # Token usage tracking (per-provider counters)
│   ├── markdown_utils.py
│   └── utils.py         # JSON response parsing helpers
│
├── scrapers/            # One scraper per source type
│   ├── base.py          # BaseScraper ABC: fetch(since: datetime) -> List[ContentItem]
│   ├── hackernews.py    # HN via Firebase API
│   ├── rss.py           # RSS/Atom via feedparser
│   ├── reddit.py        # Subreddit + user posts (.json API)
│   ├── telegram.py      # Public channel HTML scraping
│   ├── twitter.py       # Apify actor mode
│   ├── twitter_playwright.py  # Playwright browser mode (free, cookie-based)
│   ├── github.py        # User events + repo releases via GitHub API
│   ├── openbb.py        # Financial news via OpenBB Platform SDK
│   ├── ossinsight.py    # Trending repos from OSS Insight API
│   ├── gdelt.py         # GDELT 2.0 DOC API (key-less global news)
│   └── google_news.py   # Google News RSS search feed
│
├── extractors/          # Full-article content extraction for RSS feeds
│   ├── base.py          # BaseExtractor ABC
│   ├── registry.py      # ExtractorRegistry: maps RSS config to extractor instances
│   └── trafilatura.py   # Trafilatura-based extraction
│
├── storage/
│   └── manager.py       # StorageManager: config load/save, ${VAR} expansion, summary/subscriber persistence
│
├── services/
│   ├── email.py         # SMTP sending + IMAP subscribe/unsubscribe handling
│   ├── webhook.py       # WebhookNotifier: Feishu, DingTalk, Slack, Discord, generic
│   └── webhook_cli.py   # CLI for webhook testing
│
├── setup/
│   ├── wizard.py        # Interactive wizard: asks interests → generates config.json
│   ├── ai_recommend.py  # AI-driven source recommendation
│   ├── presets.py       # Pre-built source lists
│   ├── prompts.py       # Wizard-specific prompts
│   └── tag_aliases.py   # Interest tag normalization
│
└── mcp/
    ├── server.py        # FastMCP server exposing pipeline as tools
    ├── service.py       # HorizonPipelineService wrapping orchestrator stages
    ├── horizon_adapter.py  # Adapter for external MCP tool invocation
    ├── run_store.py     # Run state persistence
    └── errors.py        # HorizonMcpError
```

## Key Architectural Patterns

### Pipeline Flow (in `orchestrator.py`)

1. **Fetch** — all configured scrapers run concurrently via `asyncio.gather`. Each source gets an `httpx.AsyncClient(timeout=30)`.
2. **Cross-source dedup** — items pointing to the same URL (after stripping tracking params) are merged, keeping the richest-content item as primary.
3. **AI Analysis** — `ContentAnalyzer.analyze_batch()` scores items 0–10 with structured JSON (score, reason, summary, tags). Concurrency controlled by `ai.analysis_concurrency`.
4. **Score threshold** — items below `filtering.ai_score_threshold` are dropped.
5. **Topic dedup** — AI semantic dedup via `merge_topic_duplicates()` identifies items covering the same real-world event.
6. **Balanced digest** — category quotas from `filtering.category_groups` cap items per group, then `filtering.max_items` caps total.
7. **Enrichment** — `ContentEnricher.enrich_batch()` adds background context via web search for items passing the threshold.
8. **Summarization** — `DailySummarizer.generate_summary()` produces Markdown per configured language.
9. **Delivery** — saves to `data/summaries/`, copies to `docs/_posts/` for GitHub Pages, sends email/webhook if configured.

### AI Client Patterns

- `create_ai_client(config)` is the factory. It routes to Anthropic, Azure OpenAI, Gemini, or OpenAI-compatible (OpenAI, Ali Qianwen, Doubao, MiniMax, DeepSeek, Ollama) based on `provider`.
- `provider_chain` in config enables automatic fallback: if the primary provider returns 429/401/403/5xx, the next provider tries. `ChainedAIClient` manages this with lazy client instantiation.
- MiniMax supports both OpenAI-compatible (`/v1`) and Anthropic-compatible (`/anthropic`) endpoints — detected by `base_url` suffix.
- Newer models (o1/o3/o4/gpt-5) use `max_completion_tokens` instead of `max_tokens`; clients auto-adapt on first error.
- Token usage is tracked globally via `src/ai/tokens.py` (`record_usage`, `get_usage_snapshot`).

### Config Patterns

- `data/config.json` is the only config file. `StorageManager.load_config()` runs `${VAR}` expansion on all string values before Pydantic validation, so API keys, private URLs, and credentials stay in `.env`.
- `api_key_env` in AI config names the env var holding the key, never the key itself. The client resolves it at runtime.
- All config models are in `src/models.py` — Pydantic with `field_validator` guards.

### Scraper Patterns

- Every scraper extends `BaseScraper` and implements `async fetch(since: datetime) -> List[ContentItem]`.
- Items have `id` format `{source}:{subtype}:{native_id}`, generated via `BaseScraper._generate_id()`.
- Per-item metadata (subreddit, channel, repo, feed_name, etc.) feeds the `_sub_source_label()` breakdown shown during fetch.
- Twitter has two modes: Apify (default, needs `APIFY_TOKEN`) and Playwright (free, needs browser cookies in `data/x_cookies_*.json`). Only Apify mode supports reply text expansion.

### File I/O

- All persistent writes use `_atomic_write_text()` (temp file + `os.replace`).
- `safe_output_path(root, filename)` prevents path traversal when constructing output paths.

### Configuration & Data Files

- `data/config.json` — runtime config (not committed)
- `data/config.example.json` — reference template
- `data/config.github.json` — GitHub Actions variant
- `data/presets.json` — wizard source presets
- `.env` — API keys and secrets (not committed)
- `.env.example` — documented env var template
- Generated output: `data/summaries/horizon-{date}-{lang}.md`, also copied to `docs/_posts/{date}-summary-{lang}.md`

### Docker

- `Dockerfile`: multi-stage using `uv` from the official image, runs as unprivileged user `horizon` (UID 10001).
- `docker-compose.yml`: mounts `./data` and `./.env` as volumes, runs `--hours 24` by default.
