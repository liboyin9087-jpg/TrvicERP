"""
Scraper configuration - target areas, routes, search parameters.
爬蟲設定：目標地區、航線、搜尋參數
"""

# ============ 飯店搜尋目標 ============

# Booking.com dest_id (台灣主要旅遊城市/地區)
BOOKING_DESTINATIONS = {
    "台北": {"dest_id": "-2637882", "dest_type": "city"},
    "台中": {"dest_id": "-2637432", "dest_type": "city"},
    "高雄": {"dest_id": "-2637710", "dest_type": "city"},
    "台南": {"dest_id": "-2637816", "dest_type": "city"},
    "花蓮": {"dest_id": "-2637602", "dest_type": "city"},
    "台東": {"dest_id": "-2637770", "dest_type": "city"},
    "墾丁": {"dest_id": "-2637682", "dest_type": "region"},
    "日月潭": {"dest_id": "-2637538", "dest_type": "region"},
    "阿里山": {"dest_id": "-2637378", "dest_type": "region"},
    "宜蘭": {"dest_id": "-2637976", "dest_type": "city"},
    "嘉義": {"dest_id": "-2637438", "dest_type": "city"},
    "新竹": {"dest_id": "-2637570", "dest_type": "city"},
    "淡水": {"dest_id": "-2637482", "dest_type": "region"},
    "九份": {"dest_id": "-2637422", "dest_type": "region"},
    "綠島": {"dest_id": "-2637656", "dest_type": "region"},
    "澎湖": {"dest_id": "-2637742", "dest_type": "region"},
    "金門": {"dest_id": "-2637646", "dest_type": "region"},
}

# Agoda city IDs (台灣主要旅遊城市)
AGODA_DESTINATIONS = {
    "台北": {"city_id": 14690, "area_name": "Taipei"},
    "台中": {"city_id": 14700, "area_name": "Taichung"},
    "高雄": {"city_id": 14693, "area_name": "Kaohsiung"},
    "台南": {"city_id": 14699, "area_name": "Tainan"},
    "花蓮": {"city_id": 14686, "area_name": "Hualien"},
    "台東": {"city_id": 14698, "area_name": "Taitung"},
    "墾丁": {"city_id": 15857, "area_name": "Kenting"},
    "日月潭": {"city_id": 18498, "area_name": "Sun Moon Lake"},
    "阿里山": {"city_id": 18497, "area_name": "Alishan"},
    "宜蘭": {"city_id": 14707, "area_name": "Yilan"},
    "嘉義": {"city_id": 14681, "area_name": "Chiayi"},
    "新竹": {"city_id": 14687, "area_name": "Hsinchu"},
    "澎湖": {"city_id": 14695, "area_name": "Penghu"},
    "金門": {"city_id": 14691, "area_name": "Kinmen"},
    "綠島": {"city_id": 46741, "area_name": "Green Island"},
}


# ============ 航班搜尋目標 ============

# 台灣出發的熱門航線 (出發機場 -> 目的地機場)
FLIGHT_ROUTES = [
    # 東北亞
    {"from": "TPE", "to": "NRT", "label": "桃園→東京成田"},
    {"from": "TPE", "to": "HND", "label": "桃園→東京羽田"},
    {"from": "TPE", "to": "KIX", "label": "桃園→大阪關西"},
    {"from": "TPE", "to": "ICN", "label": "桃園→首爾仁川"},
    {"from": "TPE", "to": "CTS", "label": "桃園→札幌新千歲"},
    {"from": "TPE", "to": "OKA", "label": "桃園→沖繩那霸"},
    {"from": "TPE", "to": "FUK", "label": "桃園→福岡"},
    {"from": "TPE", "to": "NGO", "label": "桃園→名古屋"},
    # 東南亞
    {"from": "TPE", "to": "BKK", "label": "桃園→曼谷"},
    {"from": "TPE", "to": "SIN", "label": "桃園→新加坡"},
    {"from": "TPE", "to": "MNL", "label": "桃園→馬尼拉"},
    {"from": "TPE", "to": "SGN", "label": "桃園→胡志明市"},
    {"from": "TPE", "to": "HAN", "label": "桃園→河內"},
    {"from": "TPE", "to": "DPS", "label": "桃園→峇里島"},
    {"from": "TPE", "to": "KUL", "label": "桃園→吉隆坡"},
    # 港澳中國
    {"from": "TPE", "to": "HKG", "label": "桃園→香港"},
    {"from": "TPE", "to": "PVG", "label": "桃園→上海浦東"},
    {"from": "TPE", "to": "PEK", "label": "桃園→北京"},
    # 長線
    {"from": "TPE", "to": "LAX", "label": "桃園→洛杉磯"},
    {"from": "TPE", "to": "SFO", "label": "桃園→舊金山"},
    {"from": "TPE", "to": "AMS", "label": "桃園→阿姆斯特丹"},
    {"from": "TPE", "to": "FRA", "label": "桃園→法蘭克福"},
    {"from": "TPE", "to": "LHR", "label": "桃園→倫敦"},
    {"from": "TPE", "to": "SYD", "label": "桃園→雪梨"},
    # 高雄出發
    {"from": "KHH", "to": "NRT", "label": "高雄→東京成田"},
    {"from": "KHH", "to": "KIX", "label": "高雄→大阪關西"},
    {"from": "KHH", "to": "ICN", "label": "高雄→首爾仁川"},
    {"from": "KHH", "to": "HKG", "label": "高雄→香港"},
    {"from": "KHH", "to": "BKK", "label": "高雄→曼谷"},
]

# 台灣相關航空公司 (飛台灣航線的主要航空)
TAIWAN_AIRLINES = [
    "中華航空", "長榮航空", "星宇航空", "台灣虎航",
    "日本航空", "全日空", "樂桃航空", "酷航",
    "國泰航空", "香港快運", "大韓航空", "韓亞航空",
    "真航空", "濟州航空", "泰國航空", "泰國獅子航空",
    "越捷航空", "菲律賓航空", "宿霧太平洋航空",
    "新加坡航空", "亞洲航空", "馬來西亞航空",
    "聯合航空", "美國航空", "達美航空",
    "荷蘭皇家航空", "土耳其航空", "阿聯酋航空",
]

# Skyscanner locale/market settings
SKYSCANNER_CONFIG = {
    "locale": "zh-TW",
    "market": "TW",
    "currency": "TWD",
}

# ============ 通用設定 ============

OUTPUT_DIR = "scrapers/output"

# 限速設定 (秒)
RATE_LIMIT = {
    "booking": {"min_delay": 3.0, "max_delay": 7.0},
    "agoda": {"min_delay": 3.0, "max_delay": 7.0},
    "skyscanner": {"min_delay": 2.0, "max_delay": 5.0},
}

MAX_HOTELS_PER_CITY = 50       # 每個城市最多爬幾間飯店
MAX_PAGES_PER_SEARCH = 3       # 每次搜尋最多翻幾頁
