# TrvicERP UI 驗證與修正任務

我正在持續驗證迴圈中，負責 TrvicERP UI 元件的設計系統合規性檢查與修正。

## 驗證目標

目標目錄: {{TARGET_DIR}}
當前迭代: {{ITERATION}}

## 執行步驟

### 步驟 1：執行驗證檢查

依序執行以下命令並擷取結果：

```bash
# TypeScript 型別檢查
echo "=== TypeScript 檢查 ==="
cd /workspaces/TrvicERP
npx tsc --noEmit 2>&1 | head -50

# ESLint 設計系統規則
echo "=== ESLint 檢查 ==="
npx eslint {{TARGET_DIR}} --ext .ts,.tsx --format stylish 2>&1 | head -100

# 搜尋硬編碼顏色
echo "=== 顏色代碼檢查 ==="
grep -rn --include="*.tsx" --include="*.ts" -E "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}" {{TARGET_DIR}} | head -50
```

### 步驟 2：分析結果

評估標準：

- TypeScript 錯誤數量為 0
- ESLint 錯誤數量為 0
- 所有顏色都使用設計代碼（非硬編碼）

**重要：只有當所有檢查都通過時，才輸出 `<promise>VALIDATION_COMPLETE</promise>`**

如果存在問題，繼續步驟 3。

### 步驟 3：修復問題（每次最多 5 個）

優先順序：

1. TypeScript 編譯錯誤（最高優先）
2. ESLint 設計系統規則錯誤
3. 硬編碼顏色替換

修復完成後，重新執行步驟 1 的驗證。

## 設計系統規則參考

- 顏色使用：text-gray-800, bg-blue-500, border-slate-200
- 字體：font-medium, text-sm, text-lg
- 間距：p-4, m-2, gap-4
- 圓角：rounded-lg, rounded-md
- 陰影：shadow-sm, shadow-lg
