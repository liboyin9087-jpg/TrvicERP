/**
 * TrvicERP Chrome Extension — Content Script
 *
 * 在旅行社網站上自動偵測頁面類型，擷取：
 * - 列表頁: external_id, company, depart_date, total
 * - 明細頁: poi_list, cost_breakdown, payment_status, itinerary
 *
 * 支援平台:
 * - 雄獅 (liontravel.com)
 * - 山富 (settour.com.tw)
 * - 五福 (lifetour.com.tw)
 * - 可樂 (colatour.com.tw)
 * - 易遊網 (eztravel.com.tw)
 */

(function () {
  "use strict";

  // ============ 平台偵測 ============

  const PLATFORM_DETECTORS = {
    liontravel: {
      match: () => location.hostname.includes("liontravel.com"),
      name: "雄獅旅遊",
      listScraper: scrapeLionList,
      detailScraper: scrapeLionDetail,
      isListPage: () =>
        /\/(group|package|tour)\/(list|search)/i.test(location.pathname) ||
        document.querySelectorAll("[class*='product-card'], [class*='tour-item']").length > 3,
      isDetailPage: () =>
        /\/(group|package|tour)\/\w+/i.test(location.pathname) &&
        !/(list|search)/i.test(location.pathname),
    },
    settour: {
      match: () => location.hostname.includes("settour.com.tw"),
      name: "山富旅遊",
      listScraper: scrapeSettourList,
      detailScraper: scrapeSettourDetail,
      isListPage: () =>
        /\/(tour|travel)\/(list|search)/i.test(location.pathname) ||
        document.querySelectorAll(".tour-list-item, .product-item").length > 3,
      isDetailPage: () =>
        /\/(tour|travel)\/\w+/i.test(location.pathname) &&
        !/(list|search)/i.test(location.pathname),
    },
    lifetour: {
      match: () => location.hostname.includes("lifetour.com.tw"),
      name: "五福旅遊",
      listScraper: scrapeGenericList,
      detailScraper: scrapeGenericDetail,
      isListPage: () => document.querySelectorAll(".product-card, .tour-card").length > 3,
      isDetailPage: () => document.querySelector(".tour-detail, .product-detail") !== null,
    },
    colatour: {
      match: () => location.hostname.includes("colatour.com.tw"),
      name: "可樂旅遊",
      listScraper: scrapeGenericList,
      detailScraper: scrapeGenericDetail,
      isListPage: () => document.querySelectorAll(".group-item, .tour-item").length > 3,
      isDetailPage: () => document.querySelector("#tourDetail, .detail-content") !== null,
    },
    eztravel: {
      match: () => location.hostname.includes("eztravel.com.tw"),
      name: "易遊網",
      listScraper: scrapeGenericList,
      detailScraper: scrapeGenericDetail,
      isListPage: () => document.querySelectorAll("[class*='ProductCard']").length > 3,
      isDetailPage: () => document.querySelector("[class*='ProductDetail']") !== null,
    },
  };


  // ============ 主流程 ============

  function detectPlatform() {
    for (const [key, detector] of Object.entries(PLATFORM_DETECTORS)) {
      if (detector.match()) return { key, ...detector };
    }
    return null;
  }

  function init() {
    const platform = detectPlatform();
    if (!platform) return;

    console.log(`[TrvicERP] 偵測到平台: ${platform.name}`);

    // 注入浮動按鈕
    injectFloatingButton(platform);

    // 自動偵測頁面類型
    if (platform.isListPage()) {
      console.log("[TrvicERP] 偵測到列表頁");
      addScrapeButton("list", platform);
    } else if (platform.isDetailPage()) {
      console.log("[TrvicERP] 偵測到明細頁");
      addScrapeButton("detail", platform);
    }
  }


  // ============ UI 注入 ============

  function injectFloatingButton(platform) {
    const container = document.createElement("div");
    container.id = "trvic-erp-float";
    container.innerHTML = `
      <div class="trvic-float-btn" id="trvic-main-btn" title="TrvicERP 資料擷取">
        <span class="trvic-icon">T</span>
      </div>
      <div class="trvic-float-menu" id="trvic-menu" style="display:none">
        <div class="trvic-menu-header">TrvicERP — ${platform.name}</div>
        <button class="trvic-menu-btn" id="trvic-scrape-list">擷取列表</button>
        <button class="trvic-menu-btn" id="trvic-scrape-detail">擷取明細</button>
        <button class="trvic-menu-btn" id="trvic-export">匯出 JSON</button>
        <button class="trvic-menu-btn" id="trvic-sync">同步到後端</button>
        <div class="trvic-menu-status" id="trvic-status">就緒</div>
      </div>
    `;
    document.body.appendChild(container);

    // Toggle menu
    document.getElementById("trvic-main-btn").addEventListener("click", () => {
      const menu = document.getElementById("trvic-menu");
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });

    // Buttons
    document.getElementById("trvic-scrape-list").addEventListener("click", () => {
      scrapeAndSend("list", platform);
    });

    document.getElementById("trvic-scrape-detail").addEventListener("click", () => {
      scrapeAndSend("detail", platform);
    });

    document.getElementById("trvic-export").addEventListener("click", async () => {
      const resp = await chrome.runtime.sendMessage({ action: "EXPORT_JSON" });
      if (resp.ok) {
        downloadJson(resp.data, `trvic_export_${Date.now()}.json`);
        setStatus("已匯出 JSON");
      } else {
        setStatus(resp.error || "匯出失敗");
      }
    });

    document.getElementById("trvic-sync").addEventListener("click", async () => {
      setStatus("同步中...");
      const resp = await chrome.runtime.sendMessage({ action: "SYNC_TO_BACKEND" });
      setStatus(resp.ok ? `已同步 ${resp.synced} 筆` : resp.error || "同步失敗");
    });
  }

  function addScrapeButton(type, platform) {
    // 在頁面上方加一個提示條
    const bar = document.createElement("div");
    bar.className = "trvic-notice-bar";
    bar.innerHTML = `
      <span>TrvicERP: 偵測到${type === "list" ? "列表" : "明細"}頁</span>
      <button class="trvic-notice-btn" id="trvic-auto-scrape">
        一鍵擷取${type === "list" ? "列表" : "明細"}
      </button>
    `;
    document.body.prepend(bar);

    document.getElementById("trvic-auto-scrape").addEventListener("click", () => {
      scrapeAndSend(type, platform);
    });
  }

  function setStatus(msg) {
    const el = document.getElementById("trvic-status");
    if (el) el.textContent = msg;
  }


  // ============ Scrape & Send ============

  async function scrapeAndSend(type, platform) {
    setStatus("擷取中...");

    try {
      let data;
      if (type === "list") {
        data = platform.listScraper();
        if (data && data.length) {
          const resp = await chrome.runtime.sendMessage({
            action: "SCRAPED_LIST",
            data,
          });
          setStatus(`列表: ${resp.newCount || 0} 新增, ${resp.updateCount || 0} 更新`);
        } else {
          setStatus("沒有找到列表資料");
        }
      } else {
        data = platform.detailScraper();
        if (data && data.external_id) {
          const resp = await chrome.runtime.sendMessage({
            action: "SCRAPED_DETAIL",
            data,
          });
          setStatus(`明細已擷取 (ID: ${data.external_id})`);
        } else {
          setStatus("沒有找到明細資料");
        }
      }
    } catch (e) {
      console.error("[TrvicERP] 擷取失敗:", e);
      setStatus("擷取失敗: " + e.message);
    }
  }


  // ============ 雄獅旅遊 Scrapers ============

  function scrapeLionList() {
    const items = [];
    const cards = document.querySelectorAll(
      "[class*='product-card'], [class*='tour-item'], .group-list-item, .product_item"
    );

    cards.forEach((card) => {
      const item = {
        external_id: extractId(card),
        company: "雄獅旅遊",
        product_name: getText(card, "[class*='title'], .product-name, h3, h4"),
        depart_date: getText(card, "[class*='date'], .depart-date, .date"),
        return_date: "",
        destination: getText(card, "[class*='destination'], .area, .country"),
        days: parseDays(getText(card, "[class*='days'], .trip-day")),
        nights: 0,
        total_price: parsePrice(getText(card, "[class*='price'], .sale-price, .price")),
        unit_price: parsePrice(getText(card, "[class*='unit-price'], .per-price")),
        participants: 0,
        status: getText(card, "[class*='status'], .booking-status"),
        source_platform: "liontravel",
      };

      // 從天數推算夜數
      if (item.days > 0) item.nights = item.days - 1;

      // 連結
      const link = card.querySelector("a[href]");
      if (link) item.detail_url = link.href;

      if (item.product_name || item.external_id) {
        items.push(item);
      }
    });

    return items;
  }

  function scrapeLionDetail() {
    const detail = {
      external_id: extractIdFromUrl(),
      company: "雄獅旅遊",
      product_name: getText(document, "h1, .tour-title, [class*='product-name']"),
      source_platform: "liontravel",
    };

    // 行程 POI
    detail.poi_list = [];
    const dayBlocks = document.querySelectorAll(
      "[class*='day-block'], .itinerary-day, .day-schedule"
    );
    dayBlocks.forEach((block, idx) => {
      const dayTitle = getText(block, "h3, h4, .day-title, [class*='day-num']");
      const spots = block.querySelectorAll(
        "[class*='spot'], [class*='poi'], .scenic-spot, li"
      );
      spots.forEach((spot) => {
        const name = spot.textContent.trim();
        if (name && name.length < 50) {
          detail.poi_list.push({
            day: idx + 1,
            day_title: dayTitle,
            name: name,
          });
        }
      });
    });

    // 行程陣列
    detail.itinerary = [];
    dayBlocks.forEach((block, idx) => {
      detail.itinerary.push({
        day: idx + 1,
        title: getText(block, "h3, h4, .day-title"),
        description: getText(block, "p, .day-desc, [class*='content']"),
        meals: {
          breakfast: getText(block, "[class*='breakfast']"),
          lunch: getText(block, "[class*='lunch']"),
          dinner: getText(block, "[class*='dinner']"),
        },
        hotel: getText(block, "[class*='hotel'], [class*='accommodation']"),
      });
    });

    // 費用
    detail.cost_breakdown = {};
    const costRows = document.querySelectorAll(
      "[class*='cost-item'], .fee-item, .price-detail tr"
    );
    costRows.forEach((row) => {
      const label = getText(row, "td:first-child, .label, .item-name");
      const value = getText(row, "td:last-child, .value, .item-price");
      if (label && value) {
        detail.cost_breakdown[label] = value;
      }
    });

    // 包含/不包含
    detail.inclusions = extractListItems("[class*='include'], .tour-include");
    detail.exclusions = extractListItems("[class*='exclude'], .tour-exclude, [class*='not-include']");

    // 付款狀態
    detail.payment_status = getText(document, "[class*='payment-status'], .pay-status") || "";

    // 日期
    detail.depart_date = getText(document, "[class*='depart'], .start-date") || "";
    detail.return_date = getText(document, "[class*='return'], .end-date") || "";

    // 價格
    detail.total_price = parsePrice(
      getText(document, "[class*='total-price'], .total, .sale-price")
    );

    return detail;
  }


  // ============ 山富旅遊 Scrapers ============

  function scrapeSettourList() {
    const items = [];
    const cards = document.querySelectorAll(
      ".tour-list-item, .product-item, [class*='TourCard'], tr[class*='tour']"
    );

    cards.forEach((card) => {
      const item = {
        external_id: extractId(card),
        company: "山富旅遊",
        product_name: getText(card, ".tour-name, .product-title, h3, td:nth-child(2)"),
        depart_date: getText(card, ".tour-date, .depart-date, td:nth-child(3)"),
        destination: getText(card, ".destination, .area, td:nth-child(1)"),
        days: parseDays(getText(card, ".tour-days, .days, td:nth-child(4)")),
        nights: 0,
        total_price: parsePrice(getText(card, ".tour-price, .price, td:last-child")),
        status: getText(card, ".status, .booking-status"),
        source_platform: "settour",
      };

      if (item.days > 0) item.nights = item.days - 1;

      const link = card.querySelector("a[href]");
      if (link) item.detail_url = link.href;

      if (item.product_name || item.external_id) {
        items.push(item);
      }
    });

    return items;
  }

  function scrapeSettourDetail() {
    const detail = {
      external_id: extractIdFromUrl(),
      company: "山富旅遊",
      product_name: getText(document, "h1, .tour-title"),
      source_platform: "settour",
      poi_list: [],
      itinerary: [],
      cost_breakdown: {},
      inclusions: extractListItems(".include-list, [class*='include']"),
      exclusions: extractListItems(".exclude-list, [class*='exclude']"),
      depart_date: getText(document, ".depart-date, .start-date"),
      total_price: parsePrice(getText(document, ".total-price, .price")),
      payment_status: getText(document, ".payment-status"),
    };

    // 行程
    document.querySelectorAll(".day-item, .itinerary-day, [class*='DayBlock']").forEach(
      (block, idx) => {
        detail.itinerary.push({
          day: idx + 1,
          title: getText(block, "h3, h4, .day-title"),
          description: getText(block, ".day-content, p"),
          hotel: getText(block, ".hotel-name, [class*='hotel']"),
        });

        block.querySelectorAll(".spot, .poi, .scenic li").forEach((spot) => {
          const name = spot.textContent.trim();
          if (name && name.length < 50) {
            detail.poi_list.push({ day: idx + 1, name });
          }
        });
      }
    );

    return detail;
  }


  // ============ Generic Scrapers (通用) ============

  function scrapeGenericList() {
    const items = [];
    const cards = document.querySelectorAll(
      ".product-card, .tour-card, .group-item, .tour-item, " +
      "[class*='ProductCard'], [class*='TourItem'], " +
      "article[class*='product'], li[class*='tour']"
    );

    cards.forEach((card) => {
      const item = {
        external_id: extractId(card),
        company: detectCompanyName(),
        product_name: getText(card, "h2, h3, h4, [class*='title'], [class*='name']"),
        depart_date: getText(card, "[class*='date'], time"),
        destination: getText(card, "[class*='dest'], [class*='area'], [class*='country']"),
        days: parseDays(getText(card, "[class*='day'], [class*='duration']")),
        nights: 0,
        total_price: parsePrice(getText(card, "[class*='price'], .amount")),
        status: getText(card, "[class*='status']"),
        source_platform: location.hostname.split(".")[0],
      };

      if (item.days > 0) item.nights = item.days - 1;

      const link = card.querySelector("a[href]");
      if (link) item.detail_url = link.href;

      if (item.product_name) {
        items.push(item);
      }
    });

    return items;
  }

  function scrapeGenericDetail() {
    return {
      external_id: extractIdFromUrl(),
      company: detectCompanyName(),
      product_name: getText(document, "h1, [class*='product-title'], [class*='tour-title']"),
      source_platform: location.hostname.split(".")[0],
      poi_list: scrapeGenericPoi(),
      itinerary: scrapeGenericItinerary(),
      cost_breakdown: {},
      inclusions: extractListItems("[class*='include']"),
      exclusions: extractListItems("[class*='exclude'], [class*='not-include']"),
      depart_date: getText(document, "[class*='depart-date'], [class*='start-date']"),
      total_price: parsePrice(getText(document, "[class*='total'], [class*='price']")),
      payment_status: "",
    };
  }

  function scrapeGenericPoi() {
    const pois = [];
    document.querySelectorAll(
      "[class*='day-block'], [class*='itinerary-day'], [class*='DayBlock']"
    ).forEach((block, idx) => {
      block.querySelectorAll(
        "[class*='spot'], [class*='poi'], [class*='scenic'], li"
      ).forEach((el) => {
        const name = el.textContent.trim();
        if (name && name.length > 1 && name.length < 50) {
          pois.push({ day: idx + 1, name });
        }
      });
    });
    return pois;
  }

  function scrapeGenericItinerary() {
    const days = [];
    document.querySelectorAll(
      "[class*='day-block'], [class*='itinerary-day'], [class*='DayBlock']"
    ).forEach((block, idx) => {
      days.push({
        day: idx + 1,
        title: getText(block, "h3, h4, [class*='day-title']"),
        description: getText(block, "p, [class*='content'], [class*='desc']"),
      });
    });
    return days;
  }


  // ============ Utility ============

  function getText(parent, selector) {
    const el = parent.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function extractId(card) {
    // 嘗試從 data 屬性或連結取 ID
    const dataId =
      card.dataset.id ||
      card.dataset.productId ||
      card.dataset.tourId ||
      card.getAttribute("data-product-id") ||
      "";
    if (dataId) return dataId;

    // 從連結提取
    const link = card.querySelector("a[href]");
    if (link) {
      const match = link.href.match(/[?&/](id|pid|tourId|productId)=?[/]?(\w+)/i);
      if (match) return match[2];

      // 最後一段路徑
      const parts = new URL(link.href).pathname.split("/").filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }

    return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function extractIdFromUrl() {
    const match = location.href.match(/[?&/](id|pid|tourId|productId)=?[/]?(\w+)/i);
    if (match) return match[2];

    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : location.pathname;
  }

  function parsePrice(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^\d.]/g, "");
    return cleaned ? parseFloat(cleaned) : 0;
  }

  function parseDays(text) {
    if (!text) return 0;
    const match = text.match(/(\d+)\s*[天日dD]/);
    return match ? parseInt(match[1]) : 0;
  }

  function extractListItems(selector) {
    const items = [];
    document.querySelectorAll(selector).forEach((section) => {
      section.querySelectorAll("li, p").forEach((el) => {
        const text = el.textContent.trim();
        if (text) items.push(text);
      });
    });
    return items;
  }

  function detectCompanyName() {
    const host = location.hostname;
    if (host.includes("liontravel")) return "雄獅旅遊";
    if (host.includes("settour")) return "山富旅遊";
    if (host.includes("lifetour")) return "五福旅遊";
    if (host.includes("colatour")) return "可樂旅遊";
    if (host.includes("eztravel")) return "易遊網";
    if (host.includes("startravel")) return "燦星旅遊";
    return host;
  }

  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }


  // ============ Init ============

  // 等 DOM 完全載入
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
