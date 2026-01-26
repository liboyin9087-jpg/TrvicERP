// 單一 re-export 目標：避免在專案中維護兩份 `ErrorBoundary` 實作
// 將實際實作保留在 `src/components/ErrorBoundary.tsx`，此檔案只做轉發以維持相容性
export {
  default,
  withErrorBoundary,
  SectionErrorBoundary,
} from "../../src/components/ErrorBoundary";
