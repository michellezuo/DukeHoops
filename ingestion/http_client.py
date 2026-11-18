"""Polite HTTP client shared by all ingestion scripts.

- On-disk JSON cache (so re-runs don't re-hit sources)
- Fixed delay between live requests (rate limiting)
- Retries with exponential backoff on network errors / 429 / 5xx
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Any

import requests

log = logging.getLogger("ingest.http")

CACHE_DIR = Path(__file__).parent / ".cache"
USER_AGENT = "duke-hoops-intel-ingest/0.1 (educational, non-commercial)"


class HttpClient:
    def __init__(self, delay_s: float = 0.35, max_retries: int = 4, cache_ttl_s: int | None = None):
        self.delay_s = delay_s
        self.max_retries = max_retries
        self.cache_ttl_s = cache_ttl_s  # None = cache forever
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self._last_request = 0.0
        self.live_requests = 0
        self.cache_hits = 0
        CACHE_DIR.mkdir(exist_ok=True)

    def _cache_path(self, url: str) -> Path:
        return CACHE_DIR / (hashlib.sha1(url.encode()).hexdigest() + ".json")

    def get_json(self, url: str, *, use_cache: bool = True, ttl_s: int | None = -1) -> Any | None:
        """GET a URL and parse JSON. Returns None on a 404 or after exhausting retries.

        ttl_s=-1 means "use the client default".
        """
        ttl = self.cache_ttl_s if ttl_s == -1 else ttl_s
        url = url.replace("http://", "https://", 1)
        path = self._cache_path(url)
        if use_cache and path.exists():
            age = time.time() - path.stat().st_mtime
            if ttl is None or age < ttl:
                self.cache_hits += 1
                return json.loads(path.read_text(encoding="utf-8"))

        for attempt in range(self.max_retries + 1):
            wait = self.delay_s - (time.time() - self._last_request)
            if wait > 0:
                time.sleep(wait)
            self._last_request = time.time()
            try:
                resp = self.session.get(url, timeout=20)
                self.live_requests += 1
                if resp.status_code == 404:
                    return None
                if resp.status_code == 429 or resp.status_code >= 500:
                    raise requests.HTTPError(f"HTTP {resp.status_code}")
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, dict) and data.get("error", {}).get("code") == 404:
                    return None
                path.write_text(json.dumps(data), encoding="utf-8")
                return data
            except (requests.RequestException, ValueError) as exc:
                backoff = min(30, 1.5 * 2**attempt)
                log.warning("GET %s failed (%s); retry %d in %.1fs", url, exc, attempt + 1, backoff)
                time.sleep(backoff)
        log.error("Giving up on %s", url)
        return None
