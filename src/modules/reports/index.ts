import React from 'react';

/**
 * 報表模組配置接口
 * Report Module Widget Configuration Interface
 *
 * 為了實現 Kintone 獨立性，所有配置應透過 props 傳入，而非依賴全域 Store。
 * To achieve Kintone independence, all configurations should be passed via props
 * instead of relying on a global store.
 */
export interface ReportWidgetConfig {
  /**
   * 報表標題
   */
  title: string;
  /**
   * 報表類型，例如 'sales', 'inventory', 'financial'
   */
  reportType: 'sales' | 'inventory' | 'financial' | string;
  /**
   * 數據來源的 ID 或 URL，例如 Kintone App ID
   */
  dataSourceId: string;
  /**
   * 報表顯示的日期範圍預設值
   */
  defaultDateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  /**
   * 其他任何報表所需的參數，例如篩選條件、顯示欄位等
   */
  params?: Record<string, any>;
}

/**
 * 報表模組主要 Widget 元件
 * Main Report Module Widget Component
 *
 * 此元件設計為可獨立拖曳和配置的 Widget，符合 Kintone 獨立性和 Dashtail UI 規範。
 * This component is designed as a standalone, draggable, and configurable widget,
 * adhering to Kintone independence and Dashtail UI guidelines.
 */
export const ReportWidget: React.FC<ReportWidgetConfig> = ({
  title,
  reportType,
  dataSourceId,
  defaultDateRange = 'month',
  params,
}) => {
  // 這裡應整合 reportService 和 useReports。
  // 重要的是，reportService 和 useReports 需修改為接收配置作為參數，而非依賴全域 Store。
  // 例如:
  // const { data, loading, error } = useReports({ reportType, dataSourceId, defaultDateRange, params });
  // const reportData = reportService.fetchReportData({ reportType, dataSourceId, defaultDateRange, params });

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full">
      {/* 拖曳區域，遵循 Dashtail UI 規範 */}
      <div className="drag-handle bg-primary-100 h-6 -mx-4 -mt-4 mb-4 rounded-t-lg flex items-center justify-center cursor-grab">
        <span className="text-primary-700 text-sm font-medium">拖曳此處移動報表</span>
      </div>

      {/* Widget 內容 */}
      <div className="flex-grow flex flex-col">
        <h3 className="text-xl font-semibold text-primary-900 mb-4">{title} ({reportType})</h3>
        <p className="text-gray-600 mb-2">數據來源 ID: <span className="text-primary-700 font-medium">{dataSourceId}</span></p>
        <p className="text-gray-600 mb-4">預設日期範圍: <span className="text-primary-700 font-medium">{defaultDateRange}</span></p>

        {/* 這裡可以放置實際的報表圖表或數據顯示 */}
        <div className="flex-grow bg-gray-50 border border-gray-200 rounded p-4 flex items-center justify-center text-gray-500 italic">
          {/*
            {loading && <p>加載報表中...</p>}
            {error && <p className="text-danger-600">錯誤: {error.message}</p>}
            {!loading && !error && data && (
              <pre className="overflow-auto w-full text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          */}
          <p>報表內容將顯示在此 (基於 {reportType} 類型)</p>
        </div>

        {params && Object.keys(params).length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <h4 className="font-semibold text-gray-700">額外參數:</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(params, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 原始的服務和 hooks 可以繼續匯出，但請務必確認其內部實作已符合 Kintone 獨立性原則。
// 這意味著它們應該透過參數接收所需的資料或配置，而非直接依賴全域 Store。
export * from './services/reportService';
export * from './hooks/useReports';
export type * from './services/reportService'; // Re-exporting types from service is generally fine.