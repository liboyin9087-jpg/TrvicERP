# 五大核心功能模組完整指南

## 概述

TrvicERP 新增五大進階功能模組，專為旅遊業福委會作業流程設計：

1. **RFP需求規格書精靈** - 四步驟引導式表單，降低福委會操作門檻
2. **智能報價系統** - 一鍵調整日期/人數，自動重算所有費用
3. **匿名投票箱** - 員工選行程，隱藏價格，投票倒數計時
4. **座位搶位大戰** - 類電影院選位，5分鐘鎖定，即時同步
5. **版本差異比對** - Git-style 行程變更追蹤，視覺化標記

---

## 模組 1：RFP需求規格書精靈

### 功能特色

- **四步驟引導流程**，降低福委會填寫門檻
- **PDF自動生成**，標準化需求文件輸出
- **彈性預算區間設定**，支援多種旅遊風格標籤
- **無障礙需求與飲食限制管理**

### 資料庫結構

**表格：`rfp_requests`**

```sql
- request_number: RFP編號 (自動生成)
- company_name: 公司名稱
- contact_name/email/phone: 聯絡資訊
- employee_count: 員工人數
- budget_min/max: 預算範圍
- preferred_dates: 偏好日期陣列
- duration_days: 天數
- travel_style_tags: 旅遊風格標籤
- special_requirements: 特殊需求
- dietary_restrictions: 飲食限制
- accessibility_needs: 無障礙需求
- status: draft | submitted | quoted | accepted | rejected
- step_completed: 完成步驟 (1-4)
```

### 使用範例

#### 建立 RFP

```typescript
import { createRFP, TRAVEL_STYLE_TAGS } from './services/rfpService';

const rfp = await createRFP({
  company_name: '科技公司',
  contact_name: '王小明',
  contact_email: 'ming@company.com',
  contact_phone: '0912345678',
  employee_count: 50,
  budget_min: 15000,
  budget_max: 25000,
  duration_days: 3,
  preferred_dates: [
    { date: '2024-10-10', priority: 1 },
    { date: '2024-10-17', priority: 2 }
  ],
  travel_style_tags: ['relaxation', 'hot-spring', 'gourmet'],
  dietary_restrictions: ['vegetarian', 'no-seafood'],
  accessibility_needs: ['wheelchair', 'elderly-friendly'],
  step_completed: 4,
  status: 'draft'
});

console.log('RFP編號:', rfp.request_number);
```

#### 步驟式儲存

```typescript
import { saveRFPStep } from './services/rfpService';

// 步驟 1：基本資訊
const step1Data = await saveRFPStep(null, 1, {
  company_name: '科技公司',
  contact_name: '王小明',
  contact_email: 'ming@company.com',
  employee_count: 50
});

// 步驟 2：預算與日期
await saveRFPStep(step1Data.id, 2, {
  budget_min: 15000,
  budget_max: 25000,
  duration_days: 3,
  preferred_dates: [...]
});

// 步驟 3：旅遊風格
await saveRFPStep(step1Data.id, 3, {
  travel_style_tags: ['relaxation', 'hot-spring']
});

// 步驟 4：特殊需求
await saveRFPStep(step1Data.id, 4, {
  dietary_restrictions: ['vegetarian'],
  accessibility_needs: ['wheelchair']
});

// 提交 RFP
await submitRFP(step1Data.id);
```

#### 生成 PDF

```typescript
import { generateRFPPDF } from './services/rfpService';

const pdfUrl = await generateRFPPDF(rfpId);
// 返回 PDF 資料 URL，可用於下載或預覽
```

### 旅遊風格標籤選項

```typescript
TRAVEL_STYLE_TAGS = [
  { value: 'relaxation', label: '輕鬆休閒' },
  { value: 'adventure', label: '冒險刺激' },
  { value: 'cultural', label: '文化探索' },
  { value: 'nature', label: '自然生態' },
  { value: 'gourmet', label: '美食饗宴' },
  { value: 'shopping', label: '購物血拼' },
  { value: 'hot-spring', label: '溫泉療癒' },
  { value: 'team-building', label: '團隊建設' },
  { value: 'photography', label: '攝影之旅' },
  { value: 'wellness', label: '身心靈' }
];
```

---

## 模組 2：智能報價系統

### 功能特色

- **一鍵替換日期與人數**，所有費用自動重算
- **遊覽車均攤成本計算**，依人數動態調整車輛數
- **平假日差價乘數**，週末自動 1.2x
- **成本/報價即時編輯**，毛利率同步顯示
- **報價單複製功能**，快速產生變體報價

### 資料庫結構

**表格：`quotations`**

```sql
- quotation_number: 報價編號 (自動生成)
- rfp_id: 關聯 RFP
- itinerary_id: 關聯行程
- base_date: 基準日期
- participant_count: 參與人數
- is_weekend: 是否週末 (自動判斷)
- weekend_multiplier: 週末乘數 (預設 1.2)
- bus_cost_per_day: 遊覽車每日費用
- bus_capacity: 遊覽車容量 (預設 43)
- buses_needed: 需要車輛數 (自動計算)
- total_cost: 總成本
- quoted_price: 報價金額
- profit_margin: 毛利率
- status: draft | sent | accepted | rejected | expired
```

**表格：`quotation_line_items`**

```sql
- quotation_id: 報價單ID
- item_type: 項目類型 (hotel, meal, transport, activity, etc.)
- description: 描述
- unit_cost: 單位成本
- unit_price: 單位售價
- quantity: 數量
- day_number: 第幾天
- is_optional: 是否選配
```

### 使用範例

#### 建立報價單

```typescript
import {
  createQuotation,
  addLineItem,
  calculateBusesNeeded
} from './services/quotationService';

// 建立報價單
const quotation = await createQuotation({
  rfp_id: 'rfp-id',
  itinerary_id: 'itinerary-id',
  base_date: '2024-10-10',
  participant_count: 45,
  weekend_multiplier: 1.2,
  bus_cost_per_day: 12000,
  bus_capacity: 43,
  status: 'draft'
});

console.log('需要車輛數:', quotation.buses_needed); // 2 輛
console.log('是否週末:', quotation.is_weekend);

// 加入明細項目
await addLineItem(quotation.id, {
  item_type: 'hotel',
  description: '五星級飯店住宿',
  unit_cost: 2500,
  unit_price: 3500,
  quantity: 45,
  day_number: 1,
  is_optional: false
});

await addLineItem(quotation.id, {
  item_type: 'meal',
  description: '午餐 - 當地特色料理',
  unit_cost: 300,
  unit_price: 450,
  quantity: 45,
  day_number: 1,
  is_optional: false
});

await addLineItem(quotation.id, {
  item_type: 'activity',
  description: '溫泉體驗 (選配)',
  unit_cost: 500,
  unit_price: 800,
  quantity: 45,
  day_number: 2,
  is_optional: true
});
```

#### 一鍵複製並調整參數

```typescript
import { duplicateQuotation } from './services/quotationService';

// 複製報價單，調整日期與人數
const newQuotation = await duplicateQuotation(
  originalQuotationId,
  new Date('2024-10-17'), // 新日期
  55 // 新人數
);

// 系統會自動：
// 1. 判斷新日期是否為週末
// 2. 重新計算需要車輛數
// 3. 依比例調整數量
// 4. 重算總成本與報價
```

#### 查看報價摘要

```typescript
import {
  fetchLineItems,
  calculateQuotationSummary
} from './services/quotationService';

const items = await fetchLineItems(quotationId);
const summary = calculateQuotationSummary(items);

console.log('總成本:', summary.totalCost);
console.log('總報價:', summary.totalPrice);
console.log('毛利率:', summary.profitMargin.toFixed(2) + '%');

// 依類型統計
Object.keys(summary.byType).forEach(type => {
  console.log(`${type}:`, summary.byType[type]);
});

// 依天數統計
Object.keys(summary.byDay).forEach(day => {
  console.log(`第${day}天:`, summary.byDay[day]);
});
```

#### 遊覽車成本計算

```typescript
import { calculateBusesNeeded, calculateTotalBusCost } from './services/quotationService';

// 計算需要幾輛車
const buses = calculateBusesNeeded(45, 43); // 2 輛

// 計算總遊覽車費用
const busCost = calculateTotalBusCost(
  45, // 人數
  3,  // 天數
  12000, // 每車每日費用
  43  // 車輛容量
);

console.log('遊覽車費用:', busCost); // 72,000 (2車 x 3天 x 12,000)
```

---

## 模組 3：匿名投票箱

### 功能特色

- **員工匿名投票選行程**，隱藏實際價格
- **僅顯示方案亮點** (A vs B vs C)
- **投票倒數計時**，即時結果統計
- **分享連結功能**，可傳至 LINE 群組
- **防止重複投票**，使用 voter_token 機制

### 資料庫結構

**表格：`voting_campaigns`**

```sql
- campaign_code: 活動代碼 (自動生成)
- title: 標題
- description: 說明
- rfp_id: 關聯 RFP
- start_time: 開始時間
- end_time: 結束時間
- show_prices: 是否顯示價格
- max_votes_per_user: 每人投票數 (預設 1)
- status: draft | active | closed | cancelled
- total_voters: 總投票人數
```

**表格：`voting_options`**

```sql
- campaign_id: 投票活動ID
- option_code: 選項代碼 (A, B, C...)
- itinerary_id: 關聯行程
- quotation_id: 關聯報價單
- display_name: 顯示名稱
- highlights: 亮點陣列
- masked_price: 價格遮罩 (如 "NT$10,000-15,000")
- vote_count: 得票數
```

**表格：`votes`**

```sql
- campaign_id: 投票活動ID
- option_id: 選項ID
- voter_token: 投票者識別碼 (匿名)
- voter_ip: IP地址 (選填)
- voted_at: 投票時間
```

### 使用範例

#### 建立投票活動

```typescript
import { createCampaign, addVotingOption } from './services/votingService';

// 建立投票活動
const campaign = await createCampaign({
  title: '員工旅遊行程票選',
  description: '請選擇您最喜歡的行程方案',
  rfp_id: 'rfp-id',
  start_time: new Date('2024-10-01 00:00:00').toISOString(),
  end_time: new Date('2024-10-07 23:59:59').toISOString(),
  show_prices: false,
  max_votes_per_user: 1,
  status: 'active'
});

// 加入選項 A
await addVotingOption(campaign.id, {
  option_code: 'A',
  itinerary_id: 'itinerary-1',
  quotation_id: 'quotation-1',
  display_name: '溫泉療癒之旅',
  highlights: [
    '入住五星級溫泉飯店',
    '私人湯屋體驗',
    '在地美食饗宴',
    '悠閒放鬆行程'
  ],
  masked_price: 'NT$12,000-15,000'
});

// 加入選項 B
await addVotingOption(campaign.id, {
  option_code: 'B',
  display_name: '文化探索之旅',
  highlights: [
    '深度文化導覽',
    '傳統工藝體驗',
    '特色老街巡禮',
    '歷史古蹟參訪'
  ],
  masked_price: 'NT$10,000-12,000'
});

// 加入選項 C
await addVotingOption(campaign.id, {
  option_code: 'C',
  display_name: '戶外冒險之旅',
  highlights: [
    '登山健行挑戰',
    '溯溪探險體驗',
    '露營烤肉活動',
    '團隊建設遊戲'
  ],
  masked_price: 'NT$8,000-10,000'
});
```

#### 投票流程

```typescript
import {
  generateVoterToken,
  castVote,
  checkExistingVote
} from './services/votingService';

// 生成投票者識別碼 (儲存在 localStorage)
const voterToken = generateVoterToken();
localStorage.setItem('voter_token', voterToken);

// 檢查是否已投過票
const hasVoted = await checkExistingVote(campaignId, voterToken);

if (hasVoted) {
  alert('您已經投過票了！');
  return;
}

// 投票
const success = await castVote(
  campaignId,
  selectedOptionId,
  voterToken,
  clientIpAddress // 選填
);

if (success) {
  alert('投票成功！');
} else {
  alert('投票失敗，請稍後再試');
}
```

#### 查看即時結果

```typescript
import { fetchVotingResults, getRemainingTime } from './services/votingService';

// 取得投票結果
const results = await fetchVotingResults(campaignId);

console.log('投票活動:', results.campaign.title);
console.log('總投票數:', results.totalVotes);

results.options.forEach((option, index) => {
  console.log(`${index + 1}. ${option.display_name}`);
  console.log(`   得票數: ${option.vote_count} (${option.percentage.toFixed(1)}%)`);
});

if (results.winner) {
  console.log('獲勝方案:', results.winner.display_name);
}

// 倒數計時
const remaining = getRemainingTime(results.campaign);

if (remaining.isExpired) {
  console.log('投票已結束');
} else {
  console.log(`剩餘時間: ${remaining.days}天 ${remaining.hours}時 ${remaining.minutes}分 ${remaining.seconds}秒`);
}
```

#### 生成分享連結

```typescript
import { generateShareableLink } from './services/votingService';

const shareLink = generateShareableLink(campaign.campaign_code);
// 結果: https://your-domain.com/vote/VOTE20241001-1234

// 可直接分享至 LINE 或其他通訊軟體
```

---

## 模組 4：座位搶位大戰

### 功能特色

- **類電影院選位介面**，即時互動體驗
- **5分鐘座位鎖定機制**，附倒數計時
- **即時同步模擬**，其他用戶隨機搶位效果
- **多車輛選擇介面**，清楚顯示可用座位
- **自動釋放過期鎖定**

### 資料庫結構

**表格：`seating_sessions`**

```sql
- session_code: 場次代碼 (自動生成)
- quotation_id: 關聯報價單
- total_seats: 總座位數
- seats_per_bus: 每車座位數 (預設 43)
- bus_count: 車輛數
- lock_duration_minutes: 鎖定時長 (預設 5分鐘)
- start_time: 開始時間
- end_time: 結束時間
- status: scheduled | active | completed | cancelled
```

**表格：`seat_selections`**

```sql
- session_id: 場次ID
- bus_number: 車號
- seat_number: 座位號碼 (如 1A, 1B, 2C)
- user_id: 用戶ID
- user_name: 用戶姓名
- status: locked | confirmed | released
- locked_at: 鎖定時間
- confirmed_at: 確認時間
- lock_expires_at: 鎖定過期時間
```

### 使用範例

#### 建立選位場次

```typescript
import { createSeatingSession } from './services/seatingService';

const session = await createSeatingSession({
  quotation_id: 'quotation-id',
  total_seats: 86, // 2 輛車 x 43 座位
  seats_per_bus: 43,
  bus_count: 2,
  lock_duration_minutes: 5,
  start_time: new Date('2024-10-15 10:00:00').toISOString(),
  end_time: new Date('2024-10-15 12:00:00').toISOString(),
  status: 'active'
});

console.log('場次代碼:', session.session_code);
```

#### 鎖定座位

```typescript
import { lockSeat, checkSeatAvailability } from './services/seatingService';

// 檢查座位是否可用
const availability = await checkSeatAvailability(sessionId, 1, '3A');

if (!availability.available) {
  alert(availability.reason);
  return;
}

// 鎖定座位
const selection = await lockSeat(
  sessionId,
  1, // 車號
  '3A', // 座位號碼
  userId,
  userName,
  5 // 鎖定分鐘數
);

if (selection) {
  console.log('座位已鎖定，過期時間:', selection.lock_expires_at);

  // 啟動倒數計時器
  const expiresAt = new Date(selection.lock_expires_at);
  const countdown = setInterval(() => {
    const remaining = expiresAt.getTime() - Date.now();

    if (remaining <= 0) {
      clearInterval(countdown);
      alert('鎖定時間已過，座位已釋放');
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    console.log(`剩餘時間: ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, 1000);
}
```

#### 確認座位

```typescript
import { confirmSeat } from './services/seatingService';

// 用戶確認選擇後
const success = await confirmSeat(selectionId);

if (success) {
  alert('座位確認成功！');
} else {
  alert('確認失敗，請重新選擇');
}
```

#### 取得車輛座位配置

```typescript
import { getBusLayouts } from './services/seatingService';

const layouts = await getBusLayouts(sessionId);

layouts.forEach(layout => {
  console.log(`\n=== 第 ${layout.busNumber} 車 ===`);

  layout.seats.forEach(seat => {
    let status = '';

    switch (seat.status) {
      case 'available':
        status = '✓ 可選';
        break;
      case 'locked':
        status = `⏱ 鎖定中 (${seat.lockedBy})`;
        break;
      case 'confirmed':
        status = `✗ 已確認 (${seat.lockedBy})`;
        break;
      case 'unavailable':
        status = '- 不可用';
        break;
    }

    console.log(`${seat.seatNumber}: ${status}`);
  });
});
```

#### 即時同步模擬

```typescript
import {
  simulateRandomSelections,
  releaseExpiredSeats
} from './services/seatingService';

// 模擬其他用戶搶位 (用於展示)
await simulateRandomSelections(sessionId, 10);

// 自動釋放過期鎖定
setInterval(async () => {
  const releasedCount = await releaseExpiredSeats(sessionId);
  if (releasedCount > 0) {
    console.log(`已釋放 ${releasedCount} 個過期座位`);
  }
}, 30000); // 每 30 秒檢查一次
```

#### 座位配置生成

```typescript
import { generateSeatLayout } from './services/seatingService';

// 生成 11 排 x 4 列 = 44 座位
const seats = generateSeatLayout(11, 4);

console.log(seats);
// ['1A', '1B', '1C', '1D', '2A', '2B', ..., '11D']
```

---

## 模組 5：版本差異比對

### 功能特色

- **Git-style 行程變更追蹤**
- **視覺化標記**：新增（綠）、刪除（紅）、修改（黃）、移動（藍）
- **價格變動明細顯示**
- **版本標籤與摘要**
- **一鍵還原至指定版本**

### 資料庫結構

**表格：`itinerary_versions`**

```sql
- itinerary_id: 行程ID
- version_number: 版本號 (自動遞增)
- version_tag: 版本標籤 (如 v1.0, v1.1)
- snapshot_data: 完整快照 (JSONB)
- change_summary: 變更摘要
- created_by: 建立者
- created_at: 建立時間
```

**表格：`itinerary_changes`**

```sql
- version_id: 版本ID
- change_type: added | removed | modified | moved
- entity_type: item | price | schedule | description | metadata
- entity_id: 實體ID
- field_name: 欄位名稱
- old_value: 舊值 (JSONB)
- new_value: 新值 (JSONB)
- day_number: 天數
- sequence_order: 順序
```

### 使用範例

#### 建立版本快照

```typescript
import { createVersion } from './services/versionControlService';

// 每次修改行程後建立版本
const version = await createVersion(
  itineraryId,
  'v1.1', // 版本標籤
  '調整第二天行程，新增溫泉體驗', // 變更摘要
  userId // 建立者
);

console.log('版本號:', version.version_number);
console.log('版本標籤:', version.version_tag);
```

#### 查看版本歷史

```typescript
import { fetchAllVersions } from './services/versionControlService';

const versions = await fetchAllVersions(itineraryId);

console.log('版本歷史：');
versions.forEach(v => {
  console.log(`${v.version_tag} (${v.version_number})`);
  console.log(`  建立時間: ${v.created_at}`);
  console.log(`  變更摘要: ${v.change_summary}`);
  console.log('');
});
```

#### 比較兩個版本

```typescript
import {
  compareVersions,
  formatChangeDescription,
  getChangeColor,
  getChangeIcon
} from './services/versionControlService';

// 比較版本
const diff = await compareVersions(version1Id, version2Id);

console.log('=== 版本差異 ===');
console.log(`${diff.version1.version_tag} → ${diff.version2.version_tag}`);
console.log('');
console.log('變更統計:');
console.log(`  新增: ${diff.summary.added} 項`);
console.log(`  移除: ${diff.summary.removed} 項`);
console.log(`  修改: ${diff.summary.modified} 項`);
console.log(`  移動: ${diff.summary.moved} 項`);
console.log(`  總計: ${diff.summary.totalChanges} 處變更`);
console.log('');

console.log('變更明細:');
diff.changes.forEach(change => {
  const icon = getChangeIcon(change.change_type);
  const description = formatChangeDescription(change);

  console.log(`${icon} ${description}`);

  if (change.change_type === 'modified' && change.entity_type === 'price') {
    console.log(`   舊值: NT$${change.old_value?.toLocaleString()}`);
    console.log(`   新值: NT$${change.new_value?.toLocaleString()}`);
  }
});
```

#### 視覺化顯示 (UI 用)

```tsx
import {
  compareVersions,
  formatChangeDescription,
  getChangeColor
} from './services/versionControlService';

function VersionDiffView({ version1Id, version2Id }) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    loadDiff();
  }, [version1Id, version2Id]);

  const loadDiff = async () => {
    const result = await compareVersions(version1Id, version2Id);
    setDiff(result);
  };

  if (!diff) return <div>載入中...</div>;

  return (
    <div>
      <h2>版本差異比對</h2>
      <p>{diff.version1.version_tag} → {diff.version2.version_tag}</p>

      <div className="summary">
        <span className="badge bg-green-100 text-green-800">
          +{diff.summary.added}
        </span>
        <span className="badge bg-red-100 text-red-800">
          -{diff.summary.removed}
        </span>
        <span className="badge bg-yellow-100 text-yellow-800">
          ~{diff.summary.modified}
        </span>
        <span className="badge bg-blue-100 text-blue-800">
          →{diff.summary.moved}
        </span>
      </div>

      <div className="changes">
        {diff.changes.map((change, idx) => (
          <div
            key={idx}
            className={`change-item border-l-4 p-4 ${getChangeColor(change.change_type)}`}
          >
            <div className="flex items-start gap-3">
              <span className="font-bold text-lg">
                {getChangeIcon(change.change_type)}
              </span>
              <div className="flex-1">
                <p className="font-medium">
                  {formatChangeDescription(change)}
                </p>

                {change.change_type === 'modified' && (
                  <div className="mt-2 text-sm">
                    <div className="line-through opacity-60">
                      舊: {JSON.stringify(change.old_value)}
                    </div>
                    <div className="font-semibold">
                      新: {JSON.stringify(change.new_value)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 還原至指定版本

```typescript
import { restoreVersion } from './services/versionControlService';

// 還原至指定版本 (同時建立新版本記錄)
const success = await restoreVersion(versionId, true);

if (success) {
  alert('版本已還原！');
} else {
  alert('還原失敗');
}
```

---

## 整合使用範例

### 完整工作流程

```typescript
// 1. 福委會填寫 RFP
const rfp = await createRFP({
  company_name: '科技公司',
  employee_count: 50,
  budget_min: 15000,
  budget_max: 25000,
  duration_days: 3,
  travel_style_tags: ['relaxation', 'hot-spring']
});

// 2. 旅行社建立報價單
const quotation = await createQuotation({
  rfp_id: rfp.id,
  base_date: '2024-10-10',
  participant_count: 50
});

// 加入項目
await addLineItem(quotation.id, {
  item_type: 'hotel',
  description: '五星溫泉飯店',
  unit_cost: 2500,
  unit_price: 3500,
  quantity: 50,
  day_number: 1,
  is_optional: false
});

// 3. 建立行程版本
const version1 = await createVersion(
  itineraryId,
  'v1.0',
  '初版行程'
);

// 4. 建立投票活動
const campaign = await createCampaign({
  title: '員工旅遊票選',
  rfp_id: rfp.id,
  start_time: new Date('2024-10-01').toISOString(),
  end_time: new Date('2024-10-07').toISOString(),
  show_prices: false,
  max_votes_per_user: 1,
  status: 'active'
});

await addVotingOption(campaign.id, {
  option_code: 'A',
  quotation_id: quotation.id,
  display_name: '溫泉療癒之旅',
  highlights: ['五星飯店', '溫泉體驗', '美食饗宴']
});

// 5. 確認後開放選位
const seatingSession = await createSeatingSession({
  quotation_id: quotation.id,
  total_seats: 86,
  seats_per_bus: 43,
  bus_count: 2,
  lock_duration_minutes: 5,
  start_time: new Date('2024-10-15 10:00:00').toISOString(),
  status: 'active'
});

// 6. 員工選位
const selection = await lockSeat(
  seatingSession.id,
  1,
  '3A',
  userId,
  userName,
  5
);

await confirmSeat(selection.id);

// 7. 修改行程後比對版本
const version2 = await createVersion(
  itineraryId,
  'v1.1',
  '調整第二天行程'
);

const diff = await compareVersions(version1.id, version2.id);
console.log('變更數量:', diff.summary.totalChanges);
```

---

## API 端點建議

若需要建立 REST API，建議端點如下：

```
# RFP
POST   /api/rfp                     # 建立 RFP
GET    /api/rfp/:id                 # 取得 RFP
PUT    /api/rfp/:id                 # 更新 RFP
POST   /api/rfp/:id/submit          # 提交 RFP
GET    /api/rfp/:id/pdf             # 生成 PDF

# Quotation
POST   /api/quotations              # 建立報價單
GET    /api/quotations/:id          # 取得報價單
PUT    /api/quotations/:id          # 更新報價單
POST   /api/quotations/:id/duplicate # 複製報價單
POST   /api/quotations/:id/items    # 加入項目
PUT    /api/quotations/items/:id    # 更新項目
DELETE /api/quotations/items/:id    # 刪除項目

# Voting
POST   /api/voting/campaigns        # 建立投票活動
GET    /api/voting/campaigns/:code  # 取得活動 (by code)
POST   /api/voting/campaigns/:id/options # 加入選項
POST   /api/voting/campaigns/:id/vote    # 投票
GET    /api/voting/campaigns/:id/results # 取得結果

# Seating
POST   /api/seating/sessions        # 建立場次
GET    /api/seating/sessions/:code  # 取得場次 (by code)
GET    /api/seating/sessions/:id/layout # 取得座位配置
POST   /api/seating/sessions/:id/lock   # 鎖定座位
POST   /api/seating/selections/:id/confirm # 確認座位

# Versioning
POST   /api/itineraries/:id/versions     # 建立版本
GET    /api/itineraries/:id/versions     # 取得版本列表
GET    /api/versions/:id1/compare/:id2   # 比較版本
POST   /api/versions/:id/restore         # 還原版本
```

---

## 測試建議

### 單元測試

```typescript
// RFP Service 測試
describe('RFP Service', () => {
  it('should create RFP with generated number', async () => {
    const rfp = await createRFP({ company_name: 'Test Company' });
    expect(rfp.request_number).toMatch(/^RFP\d{8}-\d{4}$/);
  });

  it('should save RFP by step', async () => {
    const step1 = await saveRFPStep(null, 1, { company_name: 'Test' });
    const step2 = await saveRFPStep(step1.id, 2, { budget_min: 10000 });
    expect(step2.step_completed).toBe(2);
  });
});

// Quotation Service 測試
describe('Quotation Service', () => {
  it('should calculate buses needed correctly', () => {
    expect(calculateBusesNeeded(45, 43)).toBe(2);
    expect(calculateBusesNeeded(43, 43)).toBe(1);
    expect(calculateBusesNeeded(86, 43)).toBe(2);
  });

  it('should detect weekend correctly', () => {
    const saturday = new Date('2024-10-12'); // 六
    const monday = new Date('2024-10-14');   // 一
    expect(isWeekend(saturday)).toBe(true);
    expect(isWeekend(monday)).toBe(false);
  });
});

// Voting Service 測試
describe('Voting Service', () => {
  it('should prevent duplicate voting', async () => {
    const token = generateVoterToken();
    await castVote(campaignId, optionId, token);
    const result = await castVote(campaignId, optionId, token);
    expect(result).toBe(false);
  });
});
```

---

## 效能優化建議

1. **資料庫索引**：已建立所有必要索引
2. **快取策略**：使用 Supabase 自動快取
3. **批次操作**：複製報價單時一次處理多個項目
4. **即時更新**：使用 Supabase Realtime 訂閱座位變更
5. **過期清理**：定期執行 `releaseExpiredSeats()`

---

**版本：** 1.0.0
**最後更新：** 2026-01-03
**維護者：** TrvicERP Team
