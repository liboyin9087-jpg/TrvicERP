# TrvicERP — UI/UX 設計系統評估報告

日期：2026-01-26

本報告彙整專案程式碼觀察、無障礙檢核與設計系統缺口，並提供可執行的短中長期改進建議。

**重要引用檔案**

- App 入口與導航設定： [App.tsx](App.tsx)
- 儀表板： [components/dashboard/DraggableDashboard.tsx](components/dashboard/DraggableDashboard.tsx)
- 錯誤邊界： [components/shared/ErrorBoundary.tsx](components/shared/ErrorBoundary.tsx)
- Tailwind 設定： [tailwind.config.js](tailwind.config.js)

**摘要**

- 發現主要議題集中在導航可視性、元件一致性（顏色/間距）、設計 token 未充分應用，以及無障礙（a11y）不足。

---

## 1. UX 評估 — 使用者體驗問題（觀察與證據）

- 角色切換不明顯：`getNavGroups` 在 [App.tsx](App.tsx) 中定義三種角色（`staff` / `welfare` / `traveler`），但 UI 目前只在側邊欄 logo 區域以小字呈現角色，缺乏明顯切換器與狀態提示（見 App.tsx 的 `getNavGroups` 與側欄 logo 區塊）。
- 側邊欄收合導致文字隱藏：`FloatingSidebar` 使用 `isSidebarOpen` 以動態寬度顯示/隱藏文字 (App.tsx)，當收合時僅剩圖示，對新使用者不利。建議提供 hover tooltip 或可見的分層標籤。
- 多層級導航缺階層提示：目前 `NavGroup` 與 `NavItem` 為扁平呈現，若某功能有子選項（例如行程/子頁面），應在視覺上或交互上呈現階層（折疊列表或 tree）。

- 功能切換感受跳動：`ViewRenderer` 直接以 `Suspense` + 動態組件切換（App.tsx），缺少明確的過渡動畫或「節點卸載/掛載」過渡，造成視覺跳動。建議採用 motion-safe 的 fade/slide 過渡。
- 儀表板編輯狀態不明：`DraggableDashboard`（[components/dashboard/DraggableDashboard.tsx](components/dashboard/DraggableDashboard.tsx)）有 `isEditMode`，UI 以 toolbar 和邊框變化提示，但缺少全域頂部或明顯的浮動狀態列（例如帶顏色橫幅或 persistent badge），且沒有鍵盤模式提示。
- 錯誤恢復指引不足：錯誤邊界存在兩個實作（`components/shared/ErrorBoundary.tsx` 和 `src/components/ErrorBoundary.tsx`），預設提供「重試/重新整理」按鈕，但未針對錯誤類型（網路、驗證、資料缺失）給予不同恢復建議或逃生路徑（例如回到安全頁面、回報錯誤連結、匯出錯誤詳情）。

---

## 2. 視覺設計一致性（審查要點）

- 色彩：`tailwind.config.js` 已定義 `brand` 色階與語義顏色，但程式中仍可見硬編碼色值（例如 `#1f6feb` 在 config 中直接定義）。建議統一以 CSS 變數（`--color-brand-500`）為單一真 source-of-truth，並在 Tailwind 中映射到變數。
- 排版與間距：專案內混用 Tailwind class 與 inline style（見多處 component），缺少垂直韻律規範（baseline grid）。建議建立 spacing scale（如 4,8,12,16...）與表單元件 spacing 樣式。

---

## 3. 元件庫完整性（差距）

- 已有：Widget 系統（KPI/Chart）、`Modal`、`Toast`、若干表單控件。
- 缺少：
  - Data Grid（含分頁、排序、篩選） — 高優先
  - Date Range Picker — 高優先
  - 統一表單驗證狀態樣式（error/success/helper） — 中優先
  - Stepper（多步驟表單） — 中優先
  - Tree Navigation（多層次側邊導覽） — 中優先

Design Token 應用：`tailwind.config.js` 已宣告色票與 boxShadow，但建議把 token 推到 `:root` CSS 變數，並在 Tailwind 中引用（見建議範例）。

---

## 4. 無障礙檢核（a11y）

- 對比度：玻璃面板 (`glass-panel`) 上淺色文字對比度不足，需調整文字色或背景磨砂強度以達到 4.5:1。
- 焦點狀態：自訂按鈕 `.btn-pill` 缺少 `:focus-visible` 樣式。建議加入至少 2px 寬的可見 outline 與外圈陰影。
- 表單標籤與 ARIA：檢索發現多處 input 包含 placeholder 但未見對應 `<label>` 或 `aria-label`，需補齊。
- 動態互動通知：儀表板拖曳/儲存等動作應提供 ARIA live region 或 toast 通知，讓使用輔助工具的使用者能知悉狀態改變。

改善範例（CSS）：

```css
.btn-pill:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(31, 111, 235, 0.3);
}
```

---

## 5. 建議新增元件清單（優先級）

| 元件              |       使用場景 | 優先級 |
| ----------------- | -------------: | :----: |
| Data Grid         |   CRM/訂單管理 |   高   |
| Date Range Picker | 報表篩選、行程 |   高   |
| File Upload       |   護照掃描上傳 |   中   |
| Stepper           | 報價多步驟流程 |   中   |
| Tour Guide        |       新手導覽 |   低   |

---

## 6. 具體技術/設計規格建議（可直接套用）

- 導航 UX：新增 `RoleSwitcher` 元件，並在側邊欄頂部展示當前 role 與切換按鈕，且在收合狀態提供 tooltip。

範例（React 組件）：

```tsx
function RoleSwitcher({ roles, currentRole, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={
            r.id === currentRole
              ? "text-brand-500 font-semibold"
              : "text-gray-400"
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
```

- 過渡/動畫規範（尊重 reduce-motion）:

```css
@media (prefers-reduced-motion: no-preference) {
  .view-transition {
    animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-in;
  }
}
```

- Tailwind 與 CSS 變數：將主色 token 換成 `:root` 變數，並在 `tailwind.config.js` map 到 `var(--...)`，例如：

```css
:root {
  --color-brand-50: #eef4ff;
  --color-brand-500: #1f6feb;
}
```

並在 `tailwind.config.js` 中使用：

```js
colors: { brand: { 50: 'var(--color-brand-50)', 500: 'var(--color-brand-500)' } }
```

---

## 7. 執行優先建議（時間估算）

- 短期 (1–2 週)
  - 統一所有色彩使用 CSS 變數（PR：變更少數硬編碼色）
  - 為關鍵互動加入簡短過渡（`ViewRenderer` + 側邊欄）
  - 補強表單的 label / aria 屬性

- 中期 (3–4 週)
  - 建立 Design Token（:root + tailwind mapping）與設計規範文檔
  - 開發 Data Grid、Date Range Picker 等核心元件
  - 儀表板的可存取性改造（鍵盤模式、aria-live）

- 長期
  - 導入 Storybook 作為元件庫與設計驗收平台
  - 建立 UX 文案與使用者測試計畫

---

如需，我可以：

- 產生一個小型 PR 範例，將 `tailwind.config.js` 中 `brand.500` 改為 `var(--color-brand-500)` 並新增 `:root` 變數樣板；
- 或直接實作 `RoleSwitcher` 與 `btn-pill:focus-visible` 的變更並提交 patch。請告訴我你希望我先做哪一項。

---

報告結束。
