# 🎨 Kintone Design System

## 概述

TrvicERP 現代化設計系統，採用 Kintone UI 風格，支援響應式設計與手機優化。

## ✨ 主要特色

### 1. Kintone 風格設計
- 基於 Kintone UI Component 設計語言
- 統一的顏色系統和間距規範
- 符合企業級應用標準

### 2. 函數式 UI 控制（Copilot 風格）
- 提供命令式 API 進行 UI 操作
- 支援程式化畫面控制
- 類似 GitHub Copilot 的互動模式

### 3. 響應式與手機優化
- 適配手機、平板、桌面三種螢幕尺寸
- 最小觸控目標 44px（符合手機無障礙標準）
- 支援橫向/直向螢幕自動調整

### 4. 組件模組化
- 每個組件完全獨立
- 清晰的 Props 介面
- TypeScript 完整支援

## 📦 安裝

已安裝套件：
```bash
npm install kintone-ui-component
```

## 🎨 設計系統結構

```
src/design-system/
├── kintone/
│   ├── theme.ts          # 顏色、間距、字型等設計 tokens
│   ├── types.ts          # TypeScript 類型定義
│   └── ui-commands.ts    # UI 命令系統
├── components/
│   ├── KintoneButton.tsx
│   ├── KintoneInput.tsx
│   └── KintoneModal.tsx
├── contexts/
│   ├── UICommandContext.tsx  # UI 命令執行上下文
│   └── MobileContext.tsx     # 手機裝置偵測
└── index.ts              # 統一匯出
```

## 🎯 使用方法

### 基本設置

在 App.tsx 中包裹 Providers：

```tsx
import { UICommandProvider, MobileProvider } from './src/design-system';

function App() {
  return (
    <BrowserRouter>
      <MobileProvider>
        <UICommandProvider>
          {/* 你的應用程式 */}
        </UICommandProvider>
      </MobileProvider>
    </BrowserRouter>
  );
}
```

### 使用組件

```tsx
import { KintoneButton, KintoneInput, KintoneModal } from './src/design-system';

function MyComponent() {
  return (
    <>
      <KintoneButton 
        variant="primary" 
        size="medium"
        onClick={() => console.log('Clicked!')}
      >
        點擊我
      </KintoneButton>

      <KintoneInput
        label="使用者名稱"
        placeholder="請輸入使用者名稱"
        required
      />
    </>
  );
}
```

### 函數式 UI 控制

```tsx
import { useCommand, useMobile } from './src/design-system';

function MyComponent() {
  const executeCommand = useCommand();
  const { isMobile } = useMobile();

  const handleNavigate = async () => {
    await executeCommand('navigate', { path: '/dashboard' });
  };

  const showNotification = async () => {
    await executeCommand('showToast', {
      message: '操作成功！',
      type: 'success',
      duration: 3000
    });
  };

  return (
    <div>
      <button onClick={handleNavigate}>前往儀表板</button>
      <button onClick={showNotification}>顯示通知</button>
      {isMobile && <p>手機版介面</p>}
    </div>
  );
}
```

## 🎨 設計 Tokens

### 顏色系統

```tsx
import { kintoneColors } from './src/design-system';

// Primary (Kintone Blue)
kintoneColors.primary[500]  // #2196F3
kintoneColors.success[500]  // #4CAF50
kintoneColors.warning[500]  // #FF9800
kintoneColors.danger[500]   // #F44336
kintoneColors.info[500]     // #00BCD4
```

### 間距

```tsx
import { kintoneSpacing } from './src/design-system';

kintoneSpacing.xs   // 4px
kintoneSpacing.sm   // 8px
kintoneSpacing.md   // 16px
kintoneSpacing.lg   // 24px
kintoneSpacing.xl   // 32px
```

### 響應式斷點

```tsx
import { kintoneBreakpoints } from './src/design-system';

kintoneBreakpoints.mobile      // 640px
kintoneBreakpoints.tablet      // 768px
kintoneBreakpoints.desktop     // 1024px
kintoneBreakpoints.wide        // 1280px
kintoneBreakpoints.ultraWide   // 1536px
```

## 📱 手機優化

### 觸控目標
所有互動元素最小尺寸 44x44px，符合 WCAG 無障礙標準。

### 響應式字體
- 桌面：16px 基準
- 手機：15px 基準
- 自動調整行高與間距

### 手機專用主題
```tsx
import { kintoneMobileTheme } from './src/design-system';
```

## 🚀 UI 命令系統

### 可用命令

#### 導航命令
- `navigate` - 導航到特定路由
- `goBack` - 返回上一頁

#### UI 操作命令
- `showComponent` - 顯示組件
- `hideComponent` - 隱藏組件
- `updateComponentProps` - 更新組件屬性

#### 模態框命令
- `openModal` - 開啟模態框
- `closeModal` - 關閉模態框

#### 通知命令
- `showToast` - 顯示 Toast 通知
- `showAlert` - 顯示警告對話框

#### 資料命令
- `fetchData` - 獲取 API 資料
- `updateData` - 更新狀態資料

#### 狀態管理命令
- `setState` - 設置狀態值
- `getState` - 獲取狀態值

### 命令使用範例

```tsx
// 導航
await executeCommand('navigate', { path: '/admin/dashboard' });

// 顯示通知
await executeCommand('showToast', {
  message: '儲存成功！',
  type: 'success',
  duration: 3000
});

// 開啟模態框
await executeCommand('openModal', {
  modalId: 'user-settings',
  props: { userId: 123 }
});

// 更新組件狀態
await executeCommand('updateComponentProps', {
  componentId: 'data-table',
  props: { loading: false, data: [] }
});
```

## 🎯 組件 Props 介面

### KintoneButton

```tsx
interface KintoneButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}
```

### KintoneInput

```tsx
interface KintoneInputProps {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}
```

### KintoneModal

```tsx
interface KintoneModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
}
```

## 🔧 自訂命令

可以擴展命令系統：

```tsx
import { uiCommandRegistry } from './src/design-system';

// 註冊自訂命令
uiCommandRegistry.registerCommand({
  id: 'customAction',
  name: 'Custom Action',
  description: '執行自訂操作',
  category: 'ui',
  execute: async (params) => {
    // 你的邏輯
    return { success: true, message: '完成' };
  },
});
```

## 📊 手機裝置偵測

```tsx
import { useMobile } from './src/design-system';

function MyComponent() {
  const { 
    isMobile,      // < 768px
    isTablet,      // 768px - 1024px
    isDesktop,     // >= 1024px
    orientation,   // 'portrait' | 'landscape'
    screenWidth,
    screenHeight,
    touchEnabled
  } = useMobile();

  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

## 🎨 Envato 範本參考

基於以下現代 ERP 範本設計：
- Attex - React Responsive Tailwind CSS Admin Dashboard
- Material UI Dashboard Templates
- DevExtreme React UI Templates

設計理念：
1. 清晰的視覺層級
2. 符合手機優先原則
3. 企業級專業外觀
4. 高效能與可訪問性

## 🔄 遷移指南

### 從舊組件遷移到 Kintone 組件

```tsx
// 舊版
<button className="btn btn-primary" onClick={handleClick}>
  點擊
</button>

// 新版
<KintoneButton variant="primary" onClick={handleClick}>
  點擊
</KintoneButton>
```

## 🚧 開發規範

1. **組件獨立性**：每個組件應完全獨立，不依賴外部狀態
2. **TypeScript 優先**：所有組件必須有完整的類型定義
3. **手機優先**：設計時優先考慮手機體驗
4. **無障礙**：遵循 WCAG 2.1 AA 標準
5. **效能**：使用 React.memo 和 useCallback 優化

## 📚 更多資源

- [Kintone UI Component 官方文檔](https://ui-component.kintone.dev/)
- [Material Design 指南](https://material.io/design)
- [WCAG 無障礙標準](https://www.w3.org/WAI/WCAG21/quickref/)

## 🐛 故障排除

### 命令執行失敗
確保已正確包裹 UICommandProvider。

### 手機偵測不準確
檢查是否已包裹 MobileProvider。

### 樣式不生效
確認已導入 Tailwind CSS 配置。

## 📝 TODO

- [ ] 添加更多 Kintone 組件（Select、Table、Card 等）
- [ ] 完善命令系統的錯誤處理
- [ ] 添加組件單元測試
- [ ] 建立 Storybook 文檔
- [ ] 支援暗黑模式
- [ ] 國際化支援

## 📄 授權

MIT License
