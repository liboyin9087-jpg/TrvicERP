/**
 * TrvicERP Chrome Extension — Background Service Worker
 *
 * 職責：
 * 1. 接收 Content Script 擷取的資料
 * 2. 暫存到 chrome.storage.local
 * 3. POST 到 TrvicERP 後端 API (/api/import, /api/import/upsert)
 * 4. 發送通知告知匯入結果
 */

// ============ Config ============

const DEFAULT_CONFIG = {
  apiBaseUrl: "http://localhost:4000/api/v1",
  authToken: "",
  autoSync: false,       // 自動同步到後端
  batchSize: 50,         // 批次匯入上限
};

async function getConfig() {
  const result = await chrome.storage.local.get("trvicConfig");
  return { ...DEFAULT_CONFIG, ...result.trvicConfig };
}

async function saveConfig(config) {
  await chrome.storage.local.set({ trvicConfig: config });
}

// ============ Message Handler ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data } = message;

  switch (action) {
    case "SCRAPED_LIST":
      handleScrapedList(data, sender.tab).then(sendResponse);
      return true; // async

    case "SCRAPED_DETAIL":
      handleScrapedDetail(data, sender.tab).then(sendResponse);
      return true;

    case "EXPORT_JSON":
      handleExportJson().then(sendResponse);
      return true;

    case "SYNC_TO_BACKEND":
      handleSyncToBackend().then(sendResponse);
      return true;

    case "GET_SCRAPED_COUNT":
      getScrapedCount().then(sendResponse);
      return true;

    case "CLEAR_DATA":
      clearScrapedData().then(sendResponse);
      return true;

    case "GET_CONFIG":
      getConfig().then(sendResponse);
      return true;

    case "SAVE_CONFIG":
      saveConfig(data).then(() => sendResponse({ ok: true }));
      return true;
  }
});


// ============ Data Handlers ============

async function handleScrapedList(items, tab) {
  if (!items || !items.length) {
    return { ok: false, error: "沒有資料" };
  }

  // 從 storage 取得已存資料
  const existing = await getStoredData();

  let newCount = 0;
  let updateCount = 0;

  for (const item of items) {
    // 用 external_id 去重
    const idx = existing.findIndex(e => e.external_id === item.external_id);
    if (idx >= 0) {
      // Merge: 保留既有明細，更新列表欄位
      existing[idx] = { ...existing[idx], ...item, updated_at: new Date().toISOString() };
      updateCount++;
    } else {
      existing.push({
        ...item,
        source_url: tab?.url || "",
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false,
      });
      newCount++;
    }
  }

  await setStoredData(existing);

  // 自動同步
  const config = await getConfig();
  if (config.autoSync && config.authToken) {
    await syncToBackend(existing.filter(e => !e.synced));
  }

  const msg = `擷取完成: ${newCount} 新增, ${updateCount} 更新`;
  showNotification("TrvicERP", msg);
  return { ok: true, newCount, updateCount, total: existing.length };
}


async function handleScrapedDetail(detail, tab) {
  if (!detail || !detail.external_id) {
    return { ok: false, error: "缺少 external_id" };
  }

  const existing = await getStoredData();
  const idx = existing.findIndex(e => e.external_id === detail.external_id);

  if (idx >= 0) {
    // 合併明細到既有記錄
    existing[idx] = {
      ...existing[idx],
      ...detail,
      has_detail: true,
      updated_at: new Date().toISOString(),
      synced: false,
    };
  } else {
    existing.push({
      ...detail,
      source_url: tab?.url || "",
      has_detail: true,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    });
  }

  await setStoredData(existing);
  return { ok: true, total: existing.length };
}


// ============ Export ============

async function handleExportJson() {
  const data = await getStoredData();
  if (!data.length) {
    return { ok: false, error: "沒有資料可匯出" };
  }

  // 產生匯出格式
  const exportData = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    count: data.length,
    items: data.map(formatForExport),
  };

  return { ok: true, data: exportData };
}


function formatForExport(item) {
  return {
    external_id: item.external_id || "",
    company: item.company || "",
    product_name: item.product_name || "",
    depart_date: item.depart_date || "",
    return_date: item.return_date || "",
    destination: item.destination || "",
    days: item.days || 0,
    nights: item.nights || 0,
    total_price: item.total_price || 0,
    unit_price: item.unit_price || 0,
    participants: item.participants || 0,
    status: item.status || "",
    payment_status: item.payment_status || "",
    poi_list: item.poi_list || [],
    cost_breakdown: item.cost_breakdown || {},
    itinerary: item.itinerary || [],
    inclusions: item.inclusions || [],
    exclusions: item.exclusions || [],
    source_url: item.source_url || "",
    scraped_at: item.scraped_at || "",
  };
}


// ============ Sync to Backend ============

async function handleSyncToBackend() {
  const config = await getConfig();
  if (!config.authToken) {
    return { ok: false, error: "未設定 API Token" };
  }

  const data = await getStoredData();
  const unsynced = data.filter(e => !e.synced);

  if (!unsynced.length) {
    return { ok: true, message: "沒有需要同步的資料", synced: 0 };
  }

  const result = await syncToBackend(unsynced);
  return result;
}


async function syncToBackend(items) {
  const config = await getConfig();
  const url = `${config.apiBaseUrl}/import/upsert`;

  // 分批送出
  const batches = [];
  for (let i = 0; i < items.length; i += config.batchSize) {
    batches.push(items.slice(i, i + config.batchSize));
  }

  let totalSynced = 0;
  let errors = [];

  for (const batch of batches) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.authToken}`,
        },
        body: JSON.stringify({
          items: batch.map(formatForExport),
        }),
      });

      if (resp.ok) {
        const result = await resp.json();
        totalSynced += result.processed || batch.length;

        // 標記已同步
        const allData = await getStoredData();
        for (const item of batch) {
          const idx = allData.findIndex(e => e.external_id === item.external_id);
          if (idx >= 0) {
            allData[idx].synced = true;
            allData[idx].synced_at = new Date().toISOString();
          }
        }
        await setStoredData(allData);
      } else {
        const errText = await resp.text();
        errors.push(`HTTP ${resp.status}: ${errText.slice(0, 100)}`);
      }
    } catch (e) {
      errors.push(e.message);
    }
  }

  const msg = errors.length
    ? `同步: ${totalSynced} 成功, ${errors.length} 失敗`
    : `同步完成: ${totalSynced} 筆`;

  showNotification("TrvicERP Sync", msg);

  return {
    ok: errors.length === 0,
    synced: totalSynced,
    errors,
  };
}


// ============ Storage Helpers ============

async function getStoredData() {
  const result = await chrome.storage.local.get("scrapedData");
  return result.scrapedData || [];
}

async function setStoredData(data) {
  await chrome.storage.local.set({ scrapedData: data });
}

async function getScrapedCount() {
  const data = await getStoredData();
  return {
    total: data.length,
    synced: data.filter(e => e.synced).length,
    unsynced: data.filter(e => !e.synced).length,
    withDetail: data.filter(e => e.has_detail).length,
  };
}

async function clearScrapedData() {
  await chrome.storage.local.remove("scrapedData");
  return { ok: true };
}


// ============ Notifications ============

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title,
    message,
  });
}
