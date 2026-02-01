"""
Booking.com Hotel Scraper
爬取 Booking.com 飯店資料與房型細項（不含價格）

策略：
1. 搜尋結果頁 → 取得飯店列表 + 基本資料
2. 飯店詳情頁 → 取得房型、設施、照片、評分
3. 解析 JSON-LD (schema.org/Hotel) 結構化資料
"""
import re
import json
import logging
from typing import Optional
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

from scrapers.base import BaseScraper
from scrapers.models import Hotel, RoomType
from scrapers.config import (
    BOOKING_DESTINATIONS, RATE_LIMIT,
    MAX_HOTELS_PER_CITY, MAX_PAGES_PER_SEARCH,
)

logger = logging.getLogger(__name__)


class BookingScraper(BaseScraper):
    """Booking.com 飯店爬蟲"""

    BASE_URL = "https://www.booking.com"

    def __init__(self):
        rate = RATE_LIMIT["booking"]
        super().__init__(min_delay=rate["min_delay"], max_delay=rate["max_delay"])
        # Booking.com 特定 headers
        self.session.headers.update({
            "Referer": "https://www.booking.com/",
        })

    def scrape(self, cities: Optional[list[str]] = None,
               max_per_city: int = MAX_HOTELS_PER_CITY) -> list[Hotel]:
        """
        爬取指定城市的飯店資料

        Args:
            cities: 要爬的城市列表，None = 全部
            max_per_city: 每城市最多抓幾間
        Returns:
            Hotel 列表
        """
        targets = cities or list(BOOKING_DESTINATIONS.keys())
        all_hotels: list[Hotel] = []

        for city_name in targets:
            if city_name not in BOOKING_DESTINATIONS:
                logger.warning(f"未知城市: {city_name}, 跳過")
                continue

            logger.info(f"=== Booking.com 開始爬取: {city_name} ===")
            city_hotels = self._scrape_city(city_name, max_per_city)
            all_hotels.extend(city_hotels)
            logger.info(f"=== {city_name} 完成: {len(city_hotels)} 間飯店 ===")

        return all_hotels

    def _scrape_city(self, city_name: str, max_hotels: int) -> list[Hotel]:
        """爬取單一城市的飯店列表"""
        dest = BOOKING_DESTINATIONS[city_name]
        hotels: list[Hotel] = []

        # 設定搜尋日期（未來 30 天，住 1 晚）— 只為了觸發搜尋結果
        checkin = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        checkout = (datetime.now() + timedelta(days=31)).strftime("%Y-%m-%d")

        for page in range(MAX_PAGES_PER_SEARCH):
            if len(hotels) >= max_hotels:
                break

            offset = page * 25
            params = {
                "ss": city_name,
                "dest_id": dest["dest_id"],
                "dest_type": dest["dest_type"],
                "checkin": checkin,
                "checkout": checkout,
                "group_adults": "2",
                "no_rooms": "1",
                "group_children": "0",
                "selected_currency": "TWD",
                "lang": "zh-tw",
                "offset": str(offset),
            }

            try:
                resp = self.get(f"{self.BASE_URL}/searchresults.zh-tw.html", params=params)
                page_hotels = self._parse_search_results(resp.text, city_name)

                if not page_hotels:
                    logger.info(f"第 {page + 1} 頁沒有更多結果")
                    break

                hotels.extend(page_hotels)
                logger.info(f"第 {page + 1} 頁: 取得 {len(page_hotels)} 間 (累計 {len(hotels)})")

            except Exception as e:
                logger.error(f"搜尋第 {page + 1} 頁失敗: {e}")
                break

        # 對每間飯店抓詳情
        detailed_hotels = []
        for hotel in hotels[:max_hotels]:
            try:
                detail = self._scrape_hotel_detail(hotel)
                detailed_hotels.append(detail)
            except Exception as e:
                logger.warning(f"飯店詳情抓取失敗 [{hotel.name}]: {e}")
                detailed_hotels.append(hotel)  # 保留搜尋頁的基本資料

        return detailed_hotels

    def _parse_search_results(self, html: str, city_name: str) -> list[Hotel]:
        """解析搜尋結果頁 HTML"""
        soup = BeautifulSoup(html, "html.parser")
        hotels: list[Hotel] = []

        # Booking.com 搜尋結果卡片
        property_cards = soup.select('[data-testid="property-card"]')

        if not property_cards:
            # 嘗試備用選擇器
            property_cards = soup.select(".sr_property_block, .js-sr-card")

        for card in property_cards:
            try:
                hotel = self._parse_property_card(card, city_name)
                if hotel:
                    hotels.append(hotel)
            except Exception as e:
                logger.debug(f"解析卡片失敗: {e}")
                continue

        return hotels

    def _parse_property_card(self, card, city_name: str) -> Optional[Hotel]:
        """解析單張飯店卡片"""
        # 名稱
        name_el = card.select_one('[data-testid="title"]')
        if not name_el:
            name_el = card.select_one(".sr-hotel__name, .fcab3ed991")
        if not name_el:
            return None

        name = name_el.get_text(strip=True)

        # 連結
        link_el = card.select_one('a[data-testid="title-link"]')
        if not link_el:
            link_el = card.select_one("a.hotel_name_link, a.js-sr-hotel-link")

        source_url = ""
        source_id = ""
        if link_el and link_el.get("href"):
            href = link_el["href"]
            if not href.startswith("http"):
                href = self.BASE_URL + href
            source_url = href.split("?")[0]  # 去掉 query params
            # 從 URL 提取 hotel ID
            id_match = re.search(r"/hotel/[^/]+/([^/.]+)", source_url)
            if id_match:
                source_id = id_match.group(1)

        # 地址
        address_el = card.select_one('[data-testid="address"]')
        address = address_el.get_text(strip=True) if address_el else ""

        # 評分
        review_score = None
        review_count = 0
        score_el = card.select_one('[data-testid="review-score"]')
        if score_el:
            badge = score_el.select_one(".d10a6220b4, .b5cd09854e")
            if badge:
                try:
                    review_score = float(badge.get_text(strip=True).replace(",", "."))
                except ValueError:
                    pass
            count_el = score_el.select_one(".d8eab2cf7f, .c90c0a70d3")
            if count_el:
                count_text = count_el.get_text(strip=True)
                count_match = re.search(r"[\d,]+", count_text.replace(",", ""))
                if count_match:
                    try:
                        review_count = int(count_match.group().replace(",", ""))
                    except ValueError:
                        pass

        # 星等
        star_rating = None
        stars_el = card.select('[data-testid="rating-stars"] span')
        if stars_el:
            star_rating = float(len(stars_el))
        else:
            stars_el = card.select(".bui-rating--smaller .fcd9eec8fb")
            if stars_el:
                star_rating = float(len(stars_el))

        # 物件類型
        property_type = ""
        type_el = card.select_one('[data-testid="accommodation-type-name"]')
        if type_el:
            property_type = type_el.get_text(strip=True)

        # 照片
        photos = []
        img_el = card.select_one("img[data-testid='image']")
        if img_el and img_el.get("src"):
            photos.append(img_el["src"])

        hotel = Hotel(
            name=name,
            source="booking",
            source_id=source_id,
            source_url=source_url,
            address=address,
            city=city_name,
            country="台灣",
            star_rating=star_rating,
            review_score=review_score,
            review_count=review_count,
            property_type=property_type,
            photos=photos,
        )

        return hotel

    def _scrape_hotel_detail(self, hotel: Hotel) -> Hotel:
        """爬取飯店詳情頁，補充房型和設施"""
        if not hotel.source_url:
            return hotel

        resp = self.get(hotel.source_url, extra_headers={
            "Referer": f"{self.BASE_URL}/searchresults.zh-tw.html",
        })
        soup = BeautifulSoup(resp.text, "html.parser")

        # 1. 嘗試解析 JSON-LD 結構化資料
        self._parse_json_ld(soup, hotel)

        # 2. 解析設施
        self._parse_facilities(soup, hotel)

        # 3. 解析房型
        self._parse_room_types(soup, hotel)

        # 4. 解析入住/退房時間
        self._parse_checkin_info(soup, hotel)

        # 5. 解析照片
        self._parse_photos(soup, hotel)

        # 6. 解析永續旅遊資訊
        self._parse_sustainability(soup, hotel)

        # 7. 解析描述
        desc_el = soup.select_one('[data-testid="property-description"]')
        if not desc_el:
            desc_el = soup.select_one("#property_description_content, .hp_desc_main_content")
        if desc_el:
            hotel.description = desc_el.get_text(strip=True)[:500]

        # 8. 座標
        self._parse_coordinates(soup, hotel)

        return hotel

    def _parse_json_ld(self, soup: BeautifulSoup, hotel: Hotel):
        """解析 schema.org JSON-LD 結構化資料"""
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    for item in data:
                        if item.get("@type") == "Hotel":
                            data = item
                            break
                    else:
                        continue

                if data.get("@type") not in ("Hotel", "LodgingBusiness", "Accommodation"):
                    continue

                # 補充資料
                if not hotel.address and data.get("address"):
                    addr = data["address"]
                    if isinstance(addr, dict):
                        parts = [addr.get("streetAddress", ""),
                                 addr.get("addressLocality", ""),
                                 addr.get("addressRegion", "")]
                        hotel.address = " ".join(p for p in parts if p)
                        hotel.district = addr.get("addressLocality", "")

                if not hotel.review_score and data.get("aggregateRating"):
                    rating = data["aggregateRating"]
                    try:
                        hotel.review_score = float(rating.get("ratingValue", 0))
                        hotel.review_count = int(rating.get("reviewCount", 0))
                    except (ValueError, TypeError):
                        pass

                if not hotel.star_rating and data.get("starRating"):
                    try:
                        sr = data["starRating"]
                        if isinstance(sr, dict):
                            hotel.star_rating = float(sr.get("ratingValue", 0))
                        else:
                            hotel.star_rating = float(sr)
                    except (ValueError, TypeError):
                        pass

                if data.get("image"):
                    imgs = data["image"]
                    if isinstance(imgs, list):
                        hotel.photos.extend(imgs[:10])
                    elif isinstance(imgs, str):
                        hotel.photos.append(imgs)

                if not hotel.description and data.get("description"):
                    hotel.description = data["description"][:500]

                if data.get("checkinTime"):
                    hotel.check_in_time = data["checkinTime"]
                if data.get("checkoutTime"):
                    hotel.check_out_time = data["checkoutTime"]

                if data.get("geo"):
                    geo = data["geo"]
                    try:
                        hotel.latitude = float(geo.get("latitude", 0))
                        hotel.longitude = float(geo.get("longitude", 0))
                    except (ValueError, TypeError):
                        pass

                break  # 找到 Hotel type 就停止

            except (json.JSONDecodeError, AttributeError):
                continue

    def _parse_facilities(self, soup: BeautifulSoup, hotel: Hotel):
        """解析飯店設施"""
        # 方法1: data-testid 選擇器
        facility_items = soup.select('[data-testid="facility-list-group"] li')
        if facility_items:
            for item in facility_items:
                text = item.get_text(strip=True)
                if text and text not in hotel.facilities:
                    hotel.facilities.append(text)
            return

        # 方法2: 傳統 class 選擇器
        facility_sections = soup.select(".facilitiesChecklist__row, .hp-facility-group")
        for section in facility_sections:
            items = section.select("li, .bui-list__description")
            for item in items:
                text = item.get_text(strip=True)
                if text and text not in hotel.facilities:
                    hotel.facilities.append(text)

        # 方法3: 熱門設施 badge
        popular = soup.select('[data-testid="property-most-popular-facilities-wrapper"] span')
        for span in popular:
            text = span.get_text(strip=True)
            if text and text not in hotel.facilities:
                hotel.facilities.append(text)

    def _parse_room_types(self, soup: BeautifulSoup, hotel: Hotel):
        """解析房型資料"""
        # 方法1: 可用性表格 (hprt-table)
        room_rows = soup.select("table.hprt-table tbody tr, [data-testid='availability-row']")

        seen_names = set()
        for row in room_rows:
            try:
                room = self._parse_room_row(row)
                if room and room.name not in seen_names:
                    seen_names.add(room.name)
                    hotel.room_types.append(room)
            except Exception:
                continue

        # 方法2: 如果表格沒東西，嘗試房型區塊
        if not hotel.room_types:
            room_blocks = soup.select(".room-info, .hprt-roomtype-block, [data-room-id]")
            for block in room_blocks:
                try:
                    room = self._parse_room_block(block)
                    if room and room.name not in seen_names:
                        seen_names.add(room.name)
                        hotel.room_types.append(room)
                except Exception:
                    continue

    def _parse_room_row(self, row) -> Optional[RoomType]:
        """解析房型表格中的一行"""
        # 房型名稱
        name_el = row.select_one(".hprt-roomtype-icon-link, [data-testid='room-type-link']")
        if not name_el:
            name_el = row.select_one("a.hprt-roomtype-link, span.hprt-roomtype-name")
        if not name_el:
            return None

        name = name_el.get_text(strip=True)
        if not name:
            return None

        room = RoomType(name=name)

        # 床型
        bed_el = row.select_one(".hprt-roomtype-bed, [data-testid='bed-type']")
        if bed_el:
            room.bed_type = bed_el.get_text(strip=True)

        # 入住人數
        occ_els = row.select(".hprt-occupancy-occupancy-info .bui-u-sr-only, .hprt-occupancy-occupancy-info")
        if occ_els:
            occ_text = occ_els[0].get_text(strip=True)
            occ_match = re.search(r"(\d+)", occ_text)
            if occ_match:
                room.max_occupancy = int(occ_match.group(1))

        # 房間面積
        size_el = row.select_one(".hprt-roomtype-icon-group .bui-u-sr-only")
        if size_el:
            size_text = size_el.get_text(strip=True)
            size_match = re.search(r"([\d.]+)\s*(?:m²|平方公尺|sqm)", size_text)
            if size_match:
                room.room_size_sqm = float(size_match.group(1))

        # 房型設施
        facility_els = row.select(".hprt-facilities-facility, .hprt-roomtype-icons span")
        for el in facility_els:
            text = el.get_text(strip=True)
            if text:
                room.amenities.append(text)
                # 偵測特定屬性
                lower = text.lower()
                if "wifi" in lower or "wi-fi" in lower or "網路" in text:
                    room.has_wifi = True
                if "早餐" in text or "breakfast" in lower:
                    room.has_breakfast = True
                if "禁菸" in text or "non-smoking" in lower:
                    room.is_smoking = False
                if "吸菸" in text and "禁" not in text:
                    room.is_smoking = True

        # 景觀
        for amenity in room.amenities:
            if "海景" in amenity or "sea view" in amenity.lower():
                room.view_type = "海景"
            elif "山景" in amenity or "mountain" in amenity.lower():
                room.view_type = "山景"
            elif "市景" in amenity or "city view" in amenity.lower():
                room.view_type = "市景"
            elif "花園" in amenity or "garden" in amenity.lower():
                room.view_type = "花園景"
            elif "湖景" in amenity or "lake" in amenity.lower():
                room.view_type = "湖景"
            elif "河景" in amenity or "river" in amenity.lower():
                room.view_type = "河景"

        return room

    def _parse_room_block(self, block) -> Optional[RoomType]:
        """解析獨立房型區塊"""
        name_el = block.select_one("h3, .room-info__name, [data-testid='room-name']")
        if not name_el:
            return None

        name = name_el.get_text(strip=True)
        if not name:
            return None

        room = RoomType(name=name)

        # 描述
        desc_el = block.select_one(".room-info__description, p")
        if desc_el:
            room.description = desc_el.get_text(strip=True)[:300]

        # 面積
        size_el = block.select_one(".room-info__size")
        if size_el:
            text = size_el.get_text(strip=True)
            match = re.search(r"([\d.]+)\s*(?:m²|平方公尺)", text)
            if match:
                room.room_size_sqm = float(match.group(1))

        # 照片
        imgs = block.select("img")
        for img in imgs[:3]:
            src = img.get("src") or img.get("data-lazy")
            if src:
                room.photos.append(src)

        return room

    def _parse_checkin_info(self, soup: BeautifulSoup, hotel: Hotel):
        """解析入住/退房時間"""
        if hotel.check_in_time and hotel.check_out_time:
            return

        checkin_el = soup.select_one('[data-testid="check-in-time"]')
        if checkin_el:
            time_text = checkin_el.get_text(strip=True)
            time_match = re.search(r"(\d{1,2}:\d{2})", time_text)
            if time_match:
                hotel.check_in_time = time_match.group(1)

        checkout_el = soup.select_one('[data-testid="check-out-time"]')
        if checkout_el:
            time_text = checkout_el.get_text(strip=True)
            time_match = re.search(r"(\d{1,2}:\d{2})", time_text)
            if time_match:
                hotel.check_out_time = time_match.group(1)

    def _parse_photos(self, soup: BeautifulSoup, hotel: Hotel):
        """解析飯店照片（補充到最多 20 張）"""
        if len(hotel.photos) >= 20:
            return

        gallery = soup.select('[data-testid="photo-gallery"] img, .bh-photo-grid img')
        for img in gallery:
            if len(hotel.photos) >= 20:
                break
            src = img.get("src") or img.get("data-lazy")
            if src and src not in hotel.photos:
                # 取得較大尺寸的圖片
                src = re.sub(r"/max\d+/", "/max500/", src)
                hotel.photos.append(src)

    def _parse_sustainability(self, soup: BeautifulSoup, hotel: Hotel):
        """解析永續旅遊認證資訊"""
        sus_el = soup.select_one('[data-testid="sustainability-banner"], .bh-sustainability')
        if sus_el:
            hotel.sustainability_info = sus_el.get_text(strip=True)[:200]

        # Travel Sustainable badge
        badge = soup.select_one('[data-testid="badge-sustainability"]')
        if badge:
            badge_text = badge.get_text(strip=True)
            if badge_text:
                hotel.sustainability_info = (
                    hotel.sustainability_info + " | " + badge_text
                    if hotel.sustainability_info else badge_text
                )

    def _parse_coordinates(self, soup: BeautifulSoup, hotel: Hotel):
        """解析座標"""
        if hotel.latitude and hotel.longitude:
            return

        # 從地圖連結或 data 屬性取得
        map_el = soup.select_one("#hotel_sidebar_static_map, [data-atlas-latlng]")
        if map_el:
            latlng = map_el.get("data-atlas-latlng", "")
            if "," in latlng:
                parts = latlng.split(",")
                try:
                    hotel.latitude = float(parts[0].strip())
                    hotel.longitude = float(parts[1].strip())
                except ValueError:
                    pass
