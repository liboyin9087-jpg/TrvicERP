"""
Agoda Hotel Scraper
爬取 Agoda 飯店資料與房型細項（不含價格）

策略：
1. 搜尋結果頁 HTML → 解析內嵌的 JSON 資料 (window.__NEXT_DATA__ 或 __APP_DATA__)
2. 飯店詳情頁 → 解析 JSON-LD + HTML 房型/設施
3. Agoda 搜尋結果大量使用 SSR JSON，比純 HTML 解析更可靠
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
    AGODA_DESTINATIONS, RATE_LIMIT,
    MAX_HOTELS_PER_CITY, MAX_PAGES_PER_SEARCH,
)

logger = logging.getLogger(__name__)


class AgodaScraper(BaseScraper):
    """Agoda 飯店爬蟲"""

    BASE_URL = "https://www.agoda.com"

    def __init__(self):
        rate = RATE_LIMIT["agoda"]
        super().__init__(min_delay=rate["min_delay"], max_delay=rate["max_delay"])
        self.session.headers.update({
            "Referer": "https://www.agoda.com/",
        })

    def scrape(self, cities: Optional[list[str]] = None,
               max_per_city: int = MAX_HOTELS_PER_CITY) -> list[Hotel]:
        """爬取指定城市的飯店"""
        targets = cities or list(AGODA_DESTINATIONS.keys())
        all_hotels: list[Hotel] = []

        for city_name in targets:
            if city_name not in AGODA_DESTINATIONS:
                logger.warning(f"未知城市: {city_name}, 跳過")
                continue

            logger.info(f"=== Agoda 開始爬取: {city_name} ===")
            city_hotels = self._scrape_city(city_name, max_per_city)
            all_hotels.extend(city_hotels)
            logger.info(f"=== {city_name} 完成: {len(city_hotels)} 間飯店 ===")

        return all_hotels

    def _scrape_city(self, city_name: str, max_hotels: int) -> list[Hotel]:
        """爬取單一城市"""
        dest = AGODA_DESTINATIONS[city_name]
        hotels: list[Hotel] = []

        checkin = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        checkout = (datetime.now() + timedelta(days=31)).strftime("%Y-%m-%d")

        for page in range(1, MAX_PAGES_PER_SEARCH + 1):
            if len(hotels) >= max_hotels:
                break

            # Agoda 搜尋 URL
            search_url = (
                f"{self.BASE_URL}/zh-tw/search?"
                f"city={dest['city_id']}"
                f"&checkIn={checkin}"
                f"&checkOut={checkout}"
                f"&rooms=1&adults=2&children=0"
                f"&page={page}"
                f"&currency=TWD"
                f"&cid=-1"
            )

            try:
                resp = self.get(search_url)
                page_hotels = self._parse_search_page(resp.text, city_name)

                if not page_hotels:
                    logger.info(f"第 {page} 頁沒有更多結果")
                    break

                hotels.extend(page_hotels)
                logger.info(f"第 {page} 頁: 取得 {len(page_hotels)} 間 (累計 {len(hotels)})")

            except Exception as e:
                logger.error(f"搜尋第 {page} 頁失敗: {e}")
                break

        # 爬取詳情
        detailed = []
        for hotel in hotels[:max_hotels]:
            try:
                detail = self._scrape_hotel_detail(hotel)
                detailed.append(detail)
            except Exception as e:
                logger.warning(f"詳情抓取失敗 [{hotel.name}]: {e}")
                detailed.append(hotel)

        return detailed

    def _parse_search_page(self, html: str, city_name: str) -> list[Hotel]:
        """解析搜尋結果頁"""
        hotels: list[Hotel] = []

        # 策略1: 嘗試解析 __NEXT_DATA__ JSON
        next_data = self._extract_next_data(html)
        if next_data:
            hotels = self._parse_next_data_hotels(next_data, city_name)
            if hotels:
                return hotels

        # 策略2: 解析 HTML 卡片
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select('[data-selenium="hotel-item"], .PropertyCard, .hotel-list-item')

        for card in cards:
            try:
                hotel = self._parse_hotel_card(card, city_name)
                if hotel:
                    hotels.append(hotel)
            except Exception as e:
                logger.debug(f"解析卡片失敗: {e}")
                continue

        return hotels

    def _extract_next_data(self, html: str) -> Optional[dict]:
        """從 HTML 提取 __NEXT_DATA__ 或類似的 SSR JSON"""
        # 方法1: Next.js 的 __NEXT_DATA__
        match = re.search(
            r'<script\s+id="__NEXT_DATA__"\s+type="application/json">(.*?)</script>',
            html, re.DOTALL
        )
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        # 方法2: Agoda 自有的 app data
        match = re.search(
            r'window\.__APP_DATA__\s*=\s*(\{.*?\});?\s*</script>',
            html, re.DOTALL
        )
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        return None

    def _parse_next_data_hotels(self, data: dict, city_name: str) -> list[Hotel]:
        """從 __NEXT_DATA__ 解析飯店列表"""
        hotels: list[Hotel] = []

        # 嘗試各種可能的 JSON 路徑
        search_results = None

        # Next.js pageProps 路徑
        try:
            props = data.get("props", {}).get("pageProps", {})
            search_results = (
                props.get("searchResult", {}).get("results", [])
                or props.get("properties", [])
                or props.get("hotelList", [])
            )
        except (AttributeError, TypeError):
            pass

        if not search_results:
            return hotels

        for item in search_results:
            try:
                hotel = Hotel(
                    name=item.get("propertyName", item.get("hotelName", "")),
                    source="agoda",
                    source_id=str(item.get("propertyId", item.get("hotelId", ""))),
                    city=city_name,
                    country="台灣",
                )

                # URL
                slug = item.get("slug", item.get("propertyUrl", ""))
                if slug:
                    hotel.source_url = f"{self.BASE_URL}{slug}" if slug.startswith("/") else slug

                # 地址
                addr = item.get("address", {})
                if isinstance(addr, dict):
                    hotel.address = addr.get("line1", "")
                    hotel.district = addr.get("area", addr.get("district", ""))
                elif isinstance(addr, str):
                    hotel.address = addr

                # 座標
                geo = item.get("geoInfo", item.get("coordinate", {}))
                if isinstance(geo, dict):
                    hotel.latitude = geo.get("latitude", geo.get("lat"))
                    hotel.longitude = geo.get("longitude", geo.get("lng"))

                # 評分
                review = item.get("review", item.get("reviewScore", {}))
                if isinstance(review, dict):
                    hotel.review_score = review.get("score", review.get("ratingScore"))
                    hotel.review_count = review.get("count", review.get("reviewCount", 0))
                elif isinstance(review, (int, float)):
                    hotel.review_score = float(review)

                # 星等
                hotel.star_rating = item.get("starRating", item.get("star"))

                # 物件類型
                hotel.property_type = item.get("propertyType", item.get("accommodationType", ""))

                # 照片
                images = item.get("images", item.get("propertyImages", []))
                if isinstance(images, list):
                    for img in images[:5]:
                        if isinstance(img, dict):
                            url = img.get("url", img.get("uri", ""))
                        elif isinstance(img, str):
                            url = img
                        else:
                            continue
                        if url:
                            hotel.photos.append(url)

                if hotel.name:
                    hotels.append(hotel)

            except Exception as e:
                logger.debug(f"解析 JSON 飯店項目失敗: {e}")
                continue

        return hotels

    def _parse_hotel_card(self, card, city_name: str) -> Optional[Hotel]:
        """解析 HTML 飯店卡片"""
        # 名稱
        name_el = card.select_one(
            '[data-selenium="hotel-name"], .PropertyCard__HotelName, '
            'h3.propertyCard__name, a.PropertyCardItem'
        )
        if not name_el:
            return None

        name = name_el.get_text(strip=True)
        if not name:
            return None

        hotel = Hotel(name=name, source="agoda", city=city_name, country="台灣")

        # 連結
        link_el = card.select_one("a[href*='/hotel/'], a[href*='/zh-tw/']")
        if link_el and link_el.get("href"):
            href = link_el["href"]
            if not href.startswith("http"):
                href = self.BASE_URL + href
            hotel.source_url = href.split("?")[0]

            # 提取 ID
            id_match = re.search(r'/(\d+)\.html', href)
            if id_match:
                hotel.source_id = id_match.group(1)

        # 評分
        score_el = card.select_one(
            '[data-selenium="review-score"], .PropertyCard__ReviewScore, '
            '.Review-score'
        )
        if score_el:
            try:
                hotel.review_score = float(score_el.get_text(strip=True).replace(",", "."))
            except ValueError:
                pass

        count_el = card.select_one(
            '[data-selenium="review-count"], .PropertyCard__ReviewCount'
        )
        if count_el:
            match = re.search(r"[\d,]+", count_el.get_text(strip=True).replace(",", ""))
            if match:
                try:
                    hotel.review_count = int(match.group())
                except ValueError:
                    pass

        # 星等
        stars = card.select('[data-selenium="star"] svg, .ficon-star-full, i.ficon-star')
        if stars:
            hotel.star_rating = float(len(stars))

        # 地址
        addr_el = card.select_one('[data-selenium="area-name"], .PropertyCard__Area')
        if addr_el:
            hotel.district = addr_el.get_text(strip=True)

        # 照片
        img = card.select_one("img[data-selenium='hotel-img'], img.PropertyCard__Image")
        if img:
            src = img.get("src") or img.get("data-src")
            if src:
                hotel.photos.append(src)

        return hotel

    def _scrape_hotel_detail(self, hotel: Hotel) -> Hotel:
        """爬取飯店詳情頁"""
        if not hotel.source_url:
            return hotel

        resp = self.get(hotel.source_url, extra_headers={
            "Referer": f"{self.BASE_URL}/zh-tw/search",
        })
        soup = BeautifulSoup(resp.text, "html.parser")

        # 1. JSON-LD
        self._parse_json_ld(soup, hotel)

        # 2. __NEXT_DATA__ 內的詳情
        next_data = self._extract_next_data(resp.text)
        if next_data:
            self._parse_detail_next_data(next_data, hotel)

        # 3. HTML 設施
        self._parse_facilities(soup, hotel)

        # 4. HTML 房型
        self._parse_room_types(soup, hotel)

        # 5. 描述
        if not hotel.description:
            desc_el = soup.select_one(
                '[data-selenium="hotel-description"], '
                '.PropertyDescription, '
                '#property-description'
            )
            if desc_el:
                hotel.description = desc_el.get_text(strip=True)[:500]

        # 6. 入住退房
        self._parse_checkin(soup, hotel)

        return hotel

    def _parse_json_ld(self, soup: BeautifulSoup, hotel: Hotel):
        """解析 JSON-LD"""
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    for item in data:
                        if item.get("@type") in ("Hotel", "LodgingBusiness"):
                            data = item
                            break
                    else:
                        continue

                if data.get("@type") not in ("Hotel", "LodgingBusiness", "Accommodation"):
                    continue

                if not hotel.address and data.get("address"):
                    addr = data["address"]
                    if isinstance(addr, dict):
                        hotel.address = addr.get("streetAddress", "")
                        hotel.district = addr.get("addressLocality", "")

                if not hotel.review_score and data.get("aggregateRating"):
                    r = data["aggregateRating"]
                    try:
                        hotel.review_score = float(r.get("ratingValue", 0))
                        hotel.review_count = int(r.get("reviewCount", 0))
                    except (ValueError, TypeError):
                        pass

                if data.get("geo"):
                    geo = data["geo"]
                    try:
                        hotel.latitude = float(geo.get("latitude", 0))
                        hotel.longitude = float(geo.get("longitude", 0))
                    except (ValueError, TypeError):
                        pass

                if data.get("image"):
                    imgs = data["image"]
                    if isinstance(imgs, list):
                        hotel.photos = list(set(hotel.photos + imgs[:10]))
                    elif isinstance(imgs, str) and imgs not in hotel.photos:
                        hotel.photos.append(imgs)

                if data.get("checkinTime"):
                    hotel.check_in_time = data["checkinTime"]
                if data.get("checkoutTime"):
                    hotel.check_out_time = data["checkoutTime"]

                break
            except (json.JSONDecodeError, AttributeError):
                continue

    def _parse_detail_next_data(self, data: dict, hotel: Hotel):
        """從詳情頁 __NEXT_DATA__ 提取詳細資料"""
        try:
            props = data.get("props", {}).get("pageProps", {})
            hotel_data = (
                props.get("hotelDetail", {})
                or props.get("propertyDetail", {})
                or props.get("property", {})
            )
            if not hotel_data:
                return

            # 設施
            facilities = hotel_data.get("facilities", hotel_data.get("amenities", []))
            if isinstance(facilities, list):
                for f in facilities:
                    if isinstance(f, dict):
                        name = f.get("name", f.get("facilityName", ""))
                        if name and name not in hotel.facilities:
                            hotel.facilities.append(name)
                        # 子設施
                        sub = f.get("items", f.get("subFacilities", []))
                        for s in sub:
                            sname = s.get("name", "") if isinstance(s, dict) else str(s)
                            if sname and sname not in hotel.facilities:
                                hotel.facilities.append(sname)
                    elif isinstance(f, str) and f not in hotel.facilities:
                        hotel.facilities.append(f)

            # 房型
            rooms = hotel_data.get("rooms", hotel_data.get("roomTypes", []))
            if isinstance(rooms, list):
                for r in rooms:
                    if not isinstance(r, dict):
                        continue
                    room_name = r.get("roomName", r.get("name", ""))
                    if not room_name:
                        continue
                    # 檢查是否已存在
                    if any(rt.name == room_name for rt in hotel.room_types):
                        continue

                    room = RoomType(name=room_name)
                    room.max_occupancy = r.get("maxOccupancy", r.get("maxGuests", 2))
                    room.room_size_sqm = r.get("size", r.get("roomSize"))
                    room.bed_type = r.get("bedType", r.get("bedInfo", ""))
                    room.description = r.get("description", "")[:300]

                    # 房型設施
                    room_amenities = r.get("amenities", r.get("facilities", []))
                    if isinstance(room_amenities, list):
                        for a in room_amenities:
                            name = a.get("name", "") if isinstance(a, dict) else str(a)
                            if name:
                                room.amenities.append(name)

                    # 照片
                    room_imgs = r.get("images", r.get("photos", []))
                    if isinstance(room_imgs, list):
                        for img in room_imgs[:3]:
                            url = img.get("url", "") if isinstance(img, dict) else str(img)
                            if url:
                                room.photos.append(url)

                    hotel.room_types.append(room)

            # 永續
            sustainability = hotel_data.get("sustainability", {})
            if isinstance(sustainability, dict):
                level = sustainability.get("level", "")
                practices = sustainability.get("practices", [])
                if level:
                    hotel.sustainability_info = f"Level: {level}"
                if practices:
                    items = [p.get("name", "") if isinstance(p, dict) else str(p) for p in practices[:5]]
                    hotel.sustainability_info += " | " + ", ".join(i for i in items if i)

        except (AttributeError, TypeError, KeyError) as e:
            logger.debug(f"解析 __NEXT_DATA__ 詳情失敗: {e}")

    def _parse_facilities(self, soup: BeautifulSoup, hotel: Hotel):
        """從 HTML 解析設施"""
        sections = soup.select(
            '[data-selenium="hotel-facility-group"], '
            '.PropertyFacilities__Group, '
            '.FacilityGroup'
        )
        for section in sections:
            items = section.select(
                '[data-selenium="facility-item"], '
                '.PropertyFacilities__Item, li'
            )
            for item in items:
                text = item.get_text(strip=True)
                if text and text not in hotel.facilities:
                    hotel.facilities.append(text)

        # 熱門設施
        highlights = soup.select(
            '[data-selenium="popular-facility"], '
            '.PropertyHighlight__Text'
        )
        for h in highlights:
            text = h.get_text(strip=True)
            if text and text not in hotel.facilities:
                hotel.facilities.append(text)

    def _parse_room_types(self, soup: BeautifulSoup, hotel: Hotel):
        """從 HTML 解析房型"""
        seen = {rt.name for rt in hotel.room_types}

        room_sections = soup.select(
            '[data-selenium="RoomCard"], '
            '.RoomCard, '
            '.MasterRoom, '
            '[data-element-name="room-card"]'
        )

        for section in room_sections:
            name_el = section.select_one(
                '[data-selenium="RoomName"], '
                '.MasterRoom__HotelRoomName, '
                '.RoomCard__RoomName, '
                'h3'
            )
            if not name_el:
                continue

            name = name_el.get_text(strip=True)
            if not name or name in seen:
                continue
            seen.add(name)

            room = RoomType(name=name)

            # 面積
            size_el = section.select_one(
                '[data-selenium="RoomSize"], .RoomCard__RoomSize'
            )
            if size_el:
                text = size_el.get_text(strip=True)
                match = re.search(r"([\d.]+)\s*(?:m²|sqm|平方)", text)
                if match:
                    room.room_size_sqm = float(match.group(1))

            # 床型
            bed_el = section.select_one(
                '[data-selenium="BedType"], .RoomCard__BedType'
            )
            if bed_el:
                room.bed_type = bed_el.get_text(strip=True)

            # 入住人數
            occ_el = section.select_one(
                '[data-selenium="MaxOccupancy"], .RoomCard__Occupancy'
            )
            if occ_el:
                match = re.search(r"(\d+)", occ_el.get_text(strip=True))
                if match:
                    room.max_occupancy = int(match.group(1))

            # 房型設施
            amenity_els = section.select(
                '[data-selenium="RoomFacility"], .RoomCard__Facility, '
                '.RoomFacility__Text'
            )
            for el in amenity_els:
                text = el.get_text(strip=True)
                if text:
                    room.amenities.append(text)
                    lower = text.lower()
                    if "wifi" in lower or "網路" in text:
                        room.has_wifi = True
                    if "早餐" in text or "breakfast" in lower:
                        room.has_breakfast = True

            # 照片
            imgs = section.select("img")
            for img in imgs[:3]:
                src = img.get("src") or img.get("data-src")
                if src:
                    room.photos.append(src)

            hotel.room_types.append(room)

    def _parse_checkin(self, soup: BeautifulSoup, hotel: Hotel):
        """解析入住退房時間"""
        if hotel.check_in_time and hotel.check_out_time:
            return

        policy_els = soup.select(
            '[data-selenium="checkin-time"], '
            '.PropertyPolicy__CheckInOut, '
            '.CheckInOut'
        )
        for el in policy_els:
            text = el.get_text(strip=True)
            if not hotel.check_in_time:
                match = re.search(r"入住.*?(\d{1,2}:\d{2})", text)
                if match:
                    hotel.check_in_time = match.group(1)
            if not hotel.check_out_time:
                match = re.search(r"退房.*?(\d{1,2}:\d{2})", text)
                if match:
                    hotel.check_out_time = match.group(1)
