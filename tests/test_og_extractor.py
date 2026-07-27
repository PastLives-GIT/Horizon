"""Tests for OgImageExtractor."""

import pytest
from src.og_extractor import OgImageExtractor


class TestParseOgImage:
    """Unit tests for _parse_og_image static method."""

    def test_og_image_standard(self):
        html = (
            '<html><head>'
            '<meta property="og:image" content="https://example.com/thumb.jpg">'
            '</head></html>'
        )
        assert OgImageExtractor._parse_og_image(html) == "https://example.com/thumb.jpg"

    def test_og_image_reversed_attrs(self):
        html = (
            '<html><head>'
            '<meta content="https://example.com/img.png" property="og:image">'
            '</head></html>'
        )
        assert OgImageExtractor._parse_og_image(html) == "https://example.com/img.png"

    def test_og_image_with_extra_attrs(self):
        html = (
            '<meta property="og:image" content="https://a.com/pic.jpg" '
            'itemprop="image" data-test="foo">'
        )
        assert OgImageExtractor._parse_og_image(html) == "https://a.com/pic.jpg"

    def test_twitter_image_fallback(self):
        html = (
            '<html><head>'
            '<meta name="twitter:image" content="https://example.com/card.jpg">'
            '</head></html>'
        )
        assert OgImageExtractor._parse_og_image(html) == "https://example.com/card.jpg"

    def test_twitter_image_reversed_attrs(self):
        html = (
            '<meta content="https://a.com/tweet.png" name="twitter:image">'
        )
        assert OgImageExtractor._parse_og_image(html) == "https://a.com/tweet.png"

    def test_og_beats_twitter(self):
        html = (
            '<meta property="og:image" content="https://a.com/og.jpg">'
            '<meta name="twitter:image" content="https://a.com/tw.jpg">'
        )
        assert OgImageExtractor._parse_og_image(html) == "https://a.com/og.jpg"

    def test_no_image_returns_none(self):
        html = (
            '<html><head>'
            '<meta name="description" content="Just a page">'
            '</head></html>'
        )
        assert OgImageExtractor._parse_og_image(html) is None

    def test_empty_html_returns_none(self):
        assert OgImageExtractor._parse_og_image("") is None
        assert OgImageExtractor._parse_og_image("<html></html>") is None

    def test_relative_url_preserved_as_is(self):
        """Relative URLs are returned as-is; the caller resolves them."""
        html = '<meta property="og:image" content="/images/thumb.png">'
        assert OgImageExtractor._parse_og_image(html) == "/images/thumb.png"

    def test_single_quotes(self):
        html = (
            "<meta property='og:image' content='https://example.com/img.jpg'>"
        )
        assert OgImageExtractor._parse_og_image(html) == "https://example.com/img.jpg"

    def test_no_trailing_slash_in_meta_tag(self):
        html = '<meta property="og:image" content="https://x.com/pic.jpg">'
        assert OgImageExtractor._parse_og_image(html) == "https://x.com/pic.jpg"

    def test_real_world_html_snippet(self):
        """Simulates a realistic <head> excerpt from a news site."""
        html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Some Article</title>
<meta name="description" content="An interesting article about technology.">
<meta property="og:title" content="Some Article">
<meta property="og:description" content="An interesting article about technology.">
<meta property="og:image" content="https://cdn.example.com/2024/07/article-hero.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://cdn.example.com/2024/07/article-hero-tw.jpg">
<link rel="stylesheet" href="/main.css">
</head>
<body>..."""
        assert OgImageExtractor._parse_og_image(html) == (
            "https://cdn.example.com/2024/07/article-hero.jpg"
        )
