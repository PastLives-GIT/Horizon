"""OG image extraction — lightweight concurrent metadata scraper.

Fetches article pages and extracts Open Graph / Twitter Card image URLs
for use as card backgrounds on the Horizon website.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import List, Optional
from urllib.parse import urljoin

import httpx

from .models import ContentItem
from .url_security import UnsafeURLError, safe_request

logger = logging.getLogger(__name__)

# Match <meta property="og:image" content="URL"> or
# <meta content="URL" property="og:image">
_OG_IMAGE_RE = re.compile(
    r'<meta\s[^>]*?\bproperty\s*=\s*["\']og:image["\'][^>]*?\bcontent\s*=\s*["\']([^"\']+)["\']',
    re.IGNORECASE,
)
_OG_IMAGE_REV = re.compile(
    r'<meta\s[^>]*?\bcontent\s*=\s*["\']([^"\']+)["\'][^>]*?\bproperty\s*=\s*["\']og:image["\']',
    re.IGNORECASE,
)

# Fallback: <meta name="twitter:image" content="URL">
_TWITTER_IMAGE_RE = re.compile(
    r'<meta\s[^>]*?\bname\s*=\s*["\']twitter:image["\'][^>]*?\bcontent\s*=\s*["\']([^"\']+)["\']',
    re.IGNORECASE,
)
_TWITTER_IMAGE_REV = re.compile(
    r'<meta\s[^>]*?\bcontent\s*=\s*["\']([^"\']+)["\'][^>]*?\bname\s*=\s*["\']twitter:image["\']',
    re.IGNORECASE,
)

# How many bytes of the response body to read (head lives early in HTML)
_MAX_READ_BYTES = 128 * 1024  # 128 KB
_DEFAULT_CONCURRENCY = 5
_DEFAULT_TIMEOUT = 10.0


class OgImageExtractor:
    """Fetch and parse OG / Twitter Card images from article pages."""

    def __init__(
        self,
        concurrency: int = _DEFAULT_CONCURRENCY,
        timeout: float = _DEFAULT_TIMEOUT,
    ):
        self._concurrency = max(concurrency, 1)
        self._timeout = timeout

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def extract_batch(self, items: List[ContentItem]) -> None:
        """Extract OG image URLs for *items* concurrently.

        Results are stored in ``item.metadata["og_image"]`` (a string URL
        or ``None``).  Failures are logged but never raised — this is a
        best-effort pass that must not block the pipeline.
        """
        if not items:
            return

        semaphore = asyncio.Semaphore(self._concurrency)
        timeout_config = httpx.Timeout(
            connect=5.0,
            read=self._timeout,
            write=5.0,
            pool=5.0,
        )

        async with httpx.AsyncClient(timeout=timeout_config) as client:

            async def _process(item: ContentItem) -> None:
                async with semaphore:
                    try:
                        await self._extract_one(item, client)
                    except Exception:
                        logger.debug(
                            "OG extraction failed for %s", item.id, exc_info=True
                        )

            await asyncio.gather(*(_process(it) for it in items))

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _extract_one(
        self, item: ContentItem, client: httpx.AsyncClient
    ) -> None:
        """Fetch *item.url*, parse its ``<head>``, and store the image URL."""
        url = str(item.url)

        try:
            response = await safe_request(client, "GET", url)
        except (UnsafeURLError, httpx.HTTPError):
            return

        if response.status_code != 200:
            return

        # Only read the first chunk — meta tags live in <head>
        content_type = response.headers.get("content-type", "")
        if "html" not in content_type and "text" not in content_type:
            return

        try:
            body = await response.aread()
        except httpx.HTTPError:
            return

        text = body.decode("utf-8", errors="replace")[:_MAX_READ_BYTES]
        image_url = self._parse_og_image(text)

        if image_url:
            # Resolve relative URLs against the article URL
            image_url = urljoin(url, image_url).strip()
            item.metadata["og_image"] = image_url

    @staticmethod
    def _parse_og_image(html_text: str) -> Optional[str]:
        """Return the first OG / Twitter image URL found in *html_text*.

        Priority: ``og:image`` → ``twitter:image`` → ``None``.
        """
        for pattern in (_OG_IMAGE_RE, _OG_IMAGE_REV):
            match = pattern.search(html_text)
            if match:
                url = match.group(1).strip()
                if url:
                    return url

        for pattern in (_TWITTER_IMAGE_RE, _TWITTER_IMAGE_REV):
            match = pattern.search(html_text)
            if match:
                url = match.group(1).strip()
                if url:
                    return url

        return None
