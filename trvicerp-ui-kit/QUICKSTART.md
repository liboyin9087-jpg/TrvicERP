# TrvicERP UI Kit - 快速開始指南

歡迎使用 TrvicERP UI Kit！這份指南將協助您在 10 分鐘內開始使用從 WowDash 和 One React 模板提取的核心組件。

## 立即開始的三個步驟

### 步驟一：安裝核心依賴（2 分鐘）

打開您的 TrvicERP 專案終端機，執行以下指令安裝最關鍵的依賴套件：

```bash
# 圖表組件（儀表板必備）
npm install apexcharts react-apexcharts

# 行事曆組件（團期管理）
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# Bootstrap UI 框架（WowDash 組件基礎）
npm install bootstrap react-bootstrap

# 通知系統（使用者體驗提升）
npm install react-toastify
```

如果您計劃使用 Ant Design 組件（表單系統），加入這一行：

```bash
npm install antd
```

### 步驟二：複製組件到您的專案（3 分鐘）

將 UI Kit 中的組件複製到您的 TrvicERP 專案結構中：

```bash
# 在您的 TrvicERP 專案根目錄執行
mkdir -p src/components/envato/wowdash
mkdir -p src/components/envato/one

# 複製 WowDash 核心組件
cp trvicerp-ui-kit/wowdash/components/*.jsx src/components/envato/wowdash/

# 複製 One React 核心組件（如需要）
cp trvicerp-ui-kit/one/components/*.js src/components/envato/one/
```

### 步驟三：測試第一個組件（5 分鐘）

讓我們整合最實用的行事曆組件來展示團期管理功能。

首先在您的專案中創建一個新的測試頁面，例如 `src/pages/CalendarTestPage.tsx`，並加入以下程式碼：

```typescript
import React from 'react';
import CalendarMainLayer from '@/components/envato/wowdash/CalendarMainLayer';

export default function CalendarTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">團期行事曆測試</h1>
      <CalendarMainLayer />
    </div>
  );
}
```

接著將這個頁面加入到您的路由系統中。如果使用 React Router，在您的 App.tsx 或路由設定檔中加入：

```typescript
<Route path="/calendar-test" element={<CalendarTestPage />} />
```

現在啟動開發伺服器並訪問 `http://localhost:5173/calendar-test`（端口號依您的設定），您應該能看到完整功能的行事曆組件。

## 下一步建議

組件測試成功後，您可以依照以下順序繼續整合其他組件：

**第一週目標**：整合核心資料展示組件。將 TableDataLayer 整合到團期列表頁面，替換現有的簡單表格。將 InvoiceListLayer 整合到財務管理模組，建立報價單管理功能。

**第二週目標**：優化儀表板。使用 DashBoardLayerOne 替換現有的主儀表板，加入 ApexCharts 圖表展示營收趨勢和關鍵指標。

**第三週目標**：加強表單體驗。引入 Ant Design 表單組件，提升資料輸入的使用者體驗。實作表單自動驗證和錯誤提示。

**第四週目標**：擴充特色功能。整合地圖組件到行程規劃頁面，加入 AI 文字生成功能協助撰寫行銷文案。

## 常見問題快速解答

**問題：組件顯示時樣式錯亂或缺少樣式**

這通常是因為缺少 Bootstrap CSS 檔案。請確認您的專案入口檔案（index.tsx 或 App.tsx）有引入 Bootstrap 樣式：

```typescript
import 'bootstrap/dist/css/bootstrap.min.css';
```

**問題：組件執行時出現 Module not found 錯誤**

這表示組件內部引用的路徑需要調整。打開組件檔案，檢查所有 import 語句，將相對路徑改為符合您的專案結構。例如將 `import { Icon } from '../utils/icons'` 改為 `import { Icon } from '@/utils/icons'`。

**問題：行事曆或圖表無法正確顯示**

確認您已經安裝對應的依賴套件，並且版本號與模板一致。可以查看 `trvicerp-ui-kit/wowdash/package.json` 確認正確的版本號，然後重新安裝。

**問題：TypeScript 類型錯誤**

WowDash 組件使用 JSX 而非 TypeScript。您可以將檔案副檔名從 .tsx 改為 .jsx，或者為組件加入適當的型別定義。建議在初期先使用 .jsx 格式快速整合，待功能穩定後再逐步加入型別定義。

## 取得協助

如果您在整合過程中遇到困難，請參考以下資源：

首先查看 `INTEGRATION-GUIDE.md` 文件，裡面包含詳細的整合步驟和常見問題解決方案。

其次檢查 `COMPONENTS-LIST.md` 了解每個組件的用途、依賴項和使用建議。

第三是參考模板原始文件，位於 `wowdash/documentation` 和 `one/documentation` 資料夾。

最後您可以查看官方文件，Bootstrap、Ant Design、FullCalendar、ApexCharts 都有完整的官方文件和社群支援。

## 重要提醒

整合組件是一個漸進的過程，不要急著一次性整合所有組件。先選擇最重要的功能開始，確保每個組件都能正常運作後再繼續下一個。這樣可以更容易追蹤和解決問題。

記得定期提交您的程式碼變更到版本控制系統，這樣如果整合過程中遇到問題，您可以輕鬆回復到穩定版本。

最後祝您整合順利，打造出卓越的旅遊 ERP 系統！
