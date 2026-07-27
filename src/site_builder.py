"""Static site builder — generates HTML pages and manifest for GitHub Pages.

Separate from DailySummarizer so that email/webhook/archive continue using
Markdown while the website gets pre-rendered HTML.
"""

from __future__ import annotations

import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote, urlsplit

from ._file_utils import _atomic_write_text
from .models import ContentItem

_CJK = r"[一-鿿㐀-䶿]"
_ASCII = r"[A-Za-z0-9]"
_URL_SAFE_CHARS = ":/?#[]@!$&'*,;=~%+"


def _safe_url(value: object) -> Optional[str]:
    raw = str(value).strip()
    if not raw or any(ord(c) < 32 or ord(c) == 127 for c in raw):
        return None
    try:
        parsed = urlsplit(raw)
        if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
            return None
    except (TypeError, ValueError):
        return None
    encoded = quote(raw, safe=_URL_SAFE_CHARS)
    return html.escape(encoded, quote=True)


def _escape_html_text(value: str) -> str:
    return html.escape(value, quote=True)


def _pangu(text: str) -> str:
    text = re.sub(rf"({_CJK})({_ASCII})", r"\1 \2", text)
    text = re.sub(rf"({_ASCII})({_CJK})", r"\1 \2", text)
    return text


def _score_tier(score: float) -> str:
    if score >= 9:
        return "high"
    elif score >= 7:
        return "good"
    elif score >= 5:
        return "mid"
    return "low"


LABELS = {
    "en": {
        "header": "Horizon Daily",
        "source": "Source",
        "background": "Background",
        "discussion": "Discussion",
        "references": "References",
        "tags": "Tags",
        "selected_items": "From {total} items, {selected} important content pieces were selected",
        "empty_analyzed": "Analyzed {total} items, but none met the importance threshold.",
        "empty_body": (
            "<p>No significant developments today. This might indicate:</p>"
            "<ul><li>A quiet day in your tracked sources</li>"
            "<li>The AI score threshold is too high</li>"
            "<li>Your information sources need expansion</li></ul>"
            "<p>Consider:</p>"
            "<ol><li>Lowering the <code>ai_score_threshold</code> in config.json</li>"
            "<li>Adding more diverse information sources</li>"
            "<li>Checking if the AI model is working correctly</li></ol>"
        ),
        "site_title": "Horizon Daily",
        "nav_home": "Home",
        "nav_docs": "Docs",
        "nav_github": "GitHub",
        "toc_heading": "Today's Picks",
    },
    "zh": {
        "header": "Horizon 每日速递",
        "source": "来源",
        "background": "背景",
        "discussion": "社区讨论",
        "references": "参考链接",
        "tags": "标签",
        "selected_items": "从 {total} 条内容中筛选出 {selected} 条重要资讯。",
        "empty_analyzed": "已分析 {total} 条内容，但没有达到重要性阈值的条目。",
        "empty_body": (
            "<p>今日暂无重要动态，可能原因：</p>"
            "<ul><li>今天关注的信息源较平静</li>"
            "<li>AI 评分阈值设置过高</li>"
            "<li>信息源种类有待扩充</li></ul>"
            "<p>建议：</p>"
            "<ol><li>在 config.json 中降低 <code>ai_score_threshold</code></li>"
            "<li>添加更多多样化的信息源</li>"
            "<li>检查 AI 模型是否正常工作</li></ol>"
        ),
        "site_title": "Horizon 每日速递",
        "nav_home": "首页",
        "nav_docs": "文档",
        "nav_github": "GitHub",
        "toc_heading": "今日精选",
    },
}


class SiteBuilder:
    """Generates static HTML pages and manifest for the Horizon website."""

    def __init__(self, docs_dir: str = "docs"):
        self.docs_dir = Path(docs_dir)
        self.posts_dir = self.docs_dir / "posts"
        self.manifest_path = self.docs_dir / "manifest.json"
        self.posts_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_post_html(
        self,
        items: List[ContentItem],
        date: str,
        total_fetched: int,
        language: str = "en",
    ) -> str:
        """Generate a complete HTML page for a daily summary.

        Args:
            items: High-scoring, enriched content items (score-descending).
            date: YYYY-MM-DD date string.
            total_fetched: Count before filtering.
            language: ``"en"`` or ``"zh"``.
        """
        labels = LABELS.get(language, LABELS["en"])
        other_lang = "zh" if language == "en" else "en"
        return self._render_page(items, date, total_fetched, language, other_lang, labels)

    def write_post(
        self,
        items: List[ContentItem],
        date: str,
        total_fetched: int,
        language: str = "en",
    ) -> Path:
        """Generate and atomically write a post HTML file.

        Returns the path to the written file.
        """
        html_content = self.generate_post_html(items, date, total_fetched, language)
        filename = f"{date}-{language}.html"
        filepath = self.posts_dir / filename
        _atomic_write_text(filepath, html_content)
        return filepath

    def update_manifest(
        self,
        items: List[ContentItem],
        date: str,
        language: str,
        total_fetched: int,
    ) -> Dict[str, Any]:
        """Update manifest.json with the latest post, return the full manifest dict.

        Reads existing manifest (if any), upserts the entry for (date, language),
        rebuilds stats, and writes back.
        """
        manifest = self._load_manifest()

        # Upsert post entry
        post_entry = self._build_manifest_entry(items, date, language, total_fetched)
        existing = False
        for i, p in enumerate(manifest.get("posts", [])):
            if p["date"] == date and p["lang"] == language:
                manifest["posts"][i] = post_entry
                existing = True
                break
        if not existing:
            manifest.setdefault("posts", []).append(post_entry)
            manifest["posts"].sort(key=lambda p: p["date"], reverse=True)

        # Rebuild stats
        all_posts = manifest["posts"]
        all_tags: List[str] = []
        for p in all_posts:
            for item in p.get("items", []):
                all_tags.extend(item.get("tags", []))
        tag_counts: Dict[str, int] = {}
        for t in all_tags:
            tag_counts[t] = tag_counts.get(t, 0) + 1
        top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:30]

        manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
        manifest["stats"] = {
            "total_posts": len(all_posts),
            "languages": sorted({p["lang"] for p in all_posts}),
            "all_tags": [t for t, _ in top_tags],
        }

        # Write
        content = json.dumps(manifest, ensure_ascii=False, indent=2)
        _atomic_write_text(self.manifest_path, content + "\n")
        return manifest

    def ensure_manifest_exists(self) -> Path:
        """Create an empty manifest if none exists. Idempotent."""
        if not self.manifest_path.exists():
            empty = {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "stats": {"total_posts": 0, "languages": [], "all_tags": []},
                "posts": [],
            }
            content = json.dumps(empty, ensure_ascii=False, indent=2)
            _atomic_write_text(self.manifest_path, content + "\n")
        return self.manifest_path

    # ------------------------------------------------------------------
    # Internal: manifest helpers
    # ------------------------------------------------------------------

    def _load_manifest(self) -> Dict[str, Any]:
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return {"posts": []}

    def _build_manifest_entry(
        self,
        items: List[ContentItem],
        date: str,
        language: str,
        total_fetched: int,
    ) -> Dict[str, Any]:
        item_entries: List[Dict[str, Any]] = []
        for item in items:
            entry: Dict[str, Any] = {
                "title": item.metadata.get(f"title_{language}") or item.title,
                "score": item.ai_score,
                "tags": item.ai_tags,
                "summary": (
                    item.metadata.get(f"detailed_summary_{language}")
                    or item.metadata.get("detailed_summary")
                    or item.ai_summary
                    or ""
                ),
                "source_type": item.source_type.value,
                "og_image": item.metadata.get("og_image"),
            }
            published = item.published_at
            if published:
                entry["published_at"] = published.isoformat()
            item_entries.append(entry)

        return {
            "date": date,
            "lang": language,
            "url": f"posts/{date}-{language}.html",
            "item_count": len(items),
            "total_fetched": total_fetched,
            "top_score": max(
                (it.ai_score or 0 for it in items), default=0
            ),
            "items": item_entries,
        }

    # ------------------------------------------------------------------
    # Internal: HTML rendering
    # ------------------------------------------------------------------

    def _render_page(
        self,
        items: List[ContentItem],
        date: str,
        total_fetched: int,
        language: str,
        other_lang: str,
        labels: Dict[str, str],
    ) -> str:
        body_content = self._render_body(items, date, total_fetched, language, labels)
        return f"""<!DOCTYPE html>
<html lang="{language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{labels['header']} - {date}</title>
<meta name="description" content="AI-curated daily digest — {len(items)} items selected from {total_fetched}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>{chr(0x1F305)}</text></svg>">
<link rel="stylesheet" href="../assets/css/horizon.css">
<script defer src="../assets/js/horizon.js"></script>
</head>
<body>
<nav class="hz-nav">
  <a class="hz-nav-brand" href="../index.html">{chr(0x1F305)} Horizon</a>
  <div class="hz-nav-links">
    <a href="../index.html">{labels['nav_home']}</a>
    <a href="../configuration.html">{labels['nav_docs']}</a>
    <a href="https://github.com/Thysrael/Horizon" target="_blank" rel="noopener">{labels['nav_github']}</a>
    <a class="hz-nav-lang" href="{date}-{other_lang}.html">{other_lang.upper()}</a>
  </div>
</nav>
<main class="hz-post">
{body_content}
</main>
<footer class="hz-footer">
  <p>Generated by <a href="https://github.com/Thysrael/Horizon">Horizon</a> — AI-driven information aggregation</p>
</footer>
</body>
</html>"""

    def _render_body(
        self,
        items: List[ContentItem],
        date: str,
        total_fetched: int,
        language: str,
        labels: Dict[str, str],
    ) -> str:
        if not items:
            return self._render_empty(date, total_fetched, labels)

        selected = len(items)
        header_html = (
            f'<header class="post-header">\n'
            f'  <h1>{_escape_html_text(labels["header"])} — {date}</h1>\n'
            f'  <p class="post-epigraph">'
            f'{labels["selected_items"].format(total=total_fetched, selected=selected)}'
            f'</p>\n'
            f'</header>\n'
        )

        # TOC
        toc_items = []
        for i, item in enumerate(items):
            title = _escape_html_text(
                item.metadata.get(f"title_{language}") or item.title
            )
            if language == "zh":
                title = _pangu(title)
            score = item.ai_score or 0
            tier = _score_tier(score)
            toc_items.append(
                f'    <li>'
                f'<a href="#item-{i + 1}">{title}</a> '
                f'<span class="score-badge" data-tier="{tier}">{score}</span>'
                f'</li>'
            )
        toc_html = (
            f'<nav class="post-toc" aria-label="{labels["toc_heading"]}">\n'
            f'  <h2>{labels["toc_heading"]}</h2>\n'
            f'  <ol>\n'
            + "\n".join(toc_items) +
            f'\n  </ol>\n'
            f'</nav>\n'
        )

        # Item blocks
        item_blocks = [
            self._render_item(item, labels, language, idx)
            for idx, item in enumerate(items, start=1)
        ]

        return header_html + toc_html + "\n".join(item_blocks)

    def _render_item(
        self,
        item: ContentItem,
        labels: Dict[str, str],
        language: str,
        index: int,
    ) -> str:
        """Render a single ContentItem as an HTML section."""
        title = _escape_html_text(
            item.metadata.get(f"title_{language}") or item.title
        )
        if language == "zh":
            title = _pangu(title)

        raw_url = str(item.url)
        url = _safe_url(raw_url)
        score = item.ai_score or 0
        tier = _score_tier(score)

        # Summary
        summary = (
            item.metadata.get(f"detailed_summary_{language}")
            or item.metadata.get("detailed_summary")
            or item.ai_summary
            or ""
        )
        summary = _escape_html_text(summary)
        if language == "zh":
            summary = _pangu(summary)

        # Source line
        source_parts = [
            _escape_html_text(item.source_type.value),
        ]
        meta = item.metadata
        if meta.get("subreddit"):
            source_parts.append(_escape_html_text(f"r/{meta['subreddit']}"))
        if meta.get("feed_name"):
            source_parts.append(_escape_html_text(meta["feed_name"]))
        elif item.author:
            source_parts.append(_escape_html_text(item.author))
        if item.published_at:
            if language == "zh":
                source_parts.append(
                    f"{item.published_at.month}月{item.published_at.day}日 "
                    f"{item.published_at:%H:%M}"
                )
            else:
                day = item.published_at.strftime("%d").lstrip("0")
                source_parts.append(
                    item.published_at.strftime(f"%b {day}, %H:%M")
                )
        source_line = " · ".join(source_parts)

        discussion_url = meta.get("discussion_url")
        if discussion_url:
            safe_disc = _safe_url(discussion_url)
            if safe_disc and str(discussion_url) != raw_url:
                source_line += (
                    f' · <a href="{safe_disc}" rel="noopener">'
                    f'{_escape_html_text(labels["discussion"])}</a>'
                )

        # Title link
        title_html = (
            f'<a href="{url}" target="_blank" rel="noopener">{title}</a>'
            if url
            else title
        )

        parts = [
            f'<article class="hz-item" id="item-{index}">',
            f'  <h2>{title_html} '
            f'<span class="score-badge" data-tier="{tier}">{score}</span></h2>',
            f'  <p class="item-summary">{summary}</p>',
            f'  <p class="source-line">{source_line}</p>',
        ]

        # Background
        bg = meta.get(f"background_{language}") or meta.get("background") or ""
        if bg:
            bg = _escape_html_text(bg)
            if language == "zh":
                bg = _pangu(bg)
            parts.append(
                f'  <div class="item-background">'
                f'<strong>{_escape_html_text(labels["background"])}:</strong> {bg}'
                f'</div>'
            )

        # References
        sources = meta.get("sources") or []
        if sources:
            ref_items = []
            for src in sources:
                s_title = _escape_html_text(str(src.get("title", "")))
                s_url = _safe_url(src.get("url", ""))
                if s_url:
                    ref_items.append(
                        f'<li><a href="{s_url}" rel="noopener">{s_title}</a></li>'
                    )
                else:
                    ref_items.append(f"<li>{s_title}</li>")
            refs_html = "".join(ref_items)
            parts.append(
                f'  <details class="item-references">'
                f'<summary>{_escape_html_text(labels["references"])}</summary>'
                f'<ul>{refs_html}</ul>'
                f'</details>'
            )

        # Discussion
        disc = (
            meta.get(f"community_discussion_{language}")
            or meta.get("community_discussion")
            or ""
        )
        if disc:
            disc = _escape_html_text(disc)
            if language == "zh":
                disc = _pangu(disc)
            parts.append(
                f'  <div class="item-discussion">'
                f'<strong>{_escape_html_text(labels["discussion"])}:</strong> {disc}'
                f'</div>'
            )

        # Tags
        if item.ai_tags:
            tag_html = " ".join(
                f'<code>#{_escape_html_text(t)}</code>' for t in item.ai_tags
            )
            parts.append(
                f'  <p class="tag-line">'
                f'<strong>{_escape_html_text(labels["tags"])}:</strong> {tag_html}'
                f'</p>'
            )

        parts.append("</article>")
        return "\n".join(parts)

    def _render_empty(
        self,
        date: str,
        total_fetched: int,
        labels: Dict[str, str],
    ) -> str:
        return (
            f'<header class="post-header">\n'
            f'  <h1>{_escape_html_text(labels["header"])} — {date}</h1>\n'
            f'  <p class="post-epigraph">'
            f'{labels["empty_analyzed"].format(total=total_fetched)}'
            f'</p>\n'
            f'</header>\n'
            f'<div class="empty-state">{labels["empty_body"]}</div>\n'
        )
