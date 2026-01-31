"""
Base scraper with session management, rate limiting, retry, and anti-detection.
基礎爬蟲：Session 管理、限速、重試、反偵測
"""
import time
import random
import logging
from abc import ABC, abstractmethod
from typing import Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# 常見瀏覽器 User-Agent 輪換池
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
]

# 常見 Accept-Language
ACCEPT_LANGUAGES = [
    "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "zh-TW,zh;q=0.9,en;q=0.8",
    "zh-TW,zh-Hant;q=0.9,en;q=0.8",
]


class BaseScraper(ABC):
    """
    爬蟲基底類別，提供：
    - requests.Session 管理 + 自動重試
    - User-Agent 隨機輪換
    - 請求間隔限速 (rate limiting)
    - 通用的 GET/POST 封裝
    """

    def __init__(
        self,
        min_delay: float = 2.0,
        max_delay: float = 5.0,
        max_retries: int = 3,
        timeout: int = 30,
    ):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.timeout = timeout
        self._last_request_time = 0.0

        # 建立帶重試機制的 Session
        self.session = requests.Session()
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

        # 設定基本 headers
        self._rotate_headers()

    def _rotate_headers(self):
        """隨機輪換 User-Agent 和 Accept-Language"""
        self.session.headers.update({
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": random.choice(ACCEPT_LANGUAGES),
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        })

    def _rate_limit(self):
        """確保兩次請求之間有隨機間隔"""
        elapsed = time.time() - self._last_request_time
        delay = random.uniform(self.min_delay, self.max_delay)
        if elapsed < delay:
            wait = delay - elapsed
            logger.debug(f"Rate limit: waiting {wait:.1f}s")
            time.sleep(wait)

    def get(self, url: str, params: Optional[dict] = None,
            extra_headers: Optional[dict] = None) -> requests.Response:
        """帶限速和反偵測的 GET 請求"""
        self._rate_limit()

        # 每 5 次請求輪換一次 headers
        if random.random() < 0.2:
            self._rotate_headers()

        headers = extra_headers or {}
        logger.info(f"GET {url}")

        try:
            resp = self.session.get(
                url, params=params, headers=headers, timeout=self.timeout
            )
            self._last_request_time = time.time()
            resp.raise_for_status()
            return resp
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 403:
                logger.warning(f"403 Forbidden - 可能被反爬阻擋: {url}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise

    def post(self, url: str, data: Optional[dict] = None,
             json_data: Optional[dict] = None,
             extra_headers: Optional[dict] = None) -> requests.Response:
        """帶限速和反偵測的 POST 請求"""
        self._rate_limit()

        if random.random() < 0.2:
            self._rotate_headers()

        headers = extra_headers or {}
        logger.info(f"POST {url}")

        try:
            resp = self.session.post(
                url, data=data, json=json_data,
                headers=headers, timeout=self.timeout
            )
            self._last_request_time = time.time()
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException as e:
            logger.error(f"POST request failed: {e}")
            raise

    def get_json(self, url: str, params: Optional[dict] = None,
                 extra_headers: Optional[dict] = None) -> dict:
        """GET 並解析 JSON 回應"""
        resp = self.get(url, params=params, extra_headers=extra_headers)
        return resp.json()

    @abstractmethod
    def scrape(self, **kwargs):
        """子類別實作主要爬取邏輯"""
        raise NotImplementedError
