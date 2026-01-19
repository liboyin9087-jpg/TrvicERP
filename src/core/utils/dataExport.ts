/**
 * 數據導出工具
 * Data Export Utilities
 */

/**
 * 導出格式
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

/**
 * 導出選項
 */
export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * 導出服務
 */
export class DataExportService {
  /**
   * 導出為 CSV
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions = {}
  ): void {
    if (data.length === 0) {
      alert('沒有數據可導出');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // 添加標題行
    if (options.includeHeaders !== false) {
      csvRows.push(headers.join(','));
    }

    // 添加數據行
    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // 處理包含逗號或引號的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `${options.filename || 'export'}.csv`, 'text/csv');
  }

  /**
   * 導出為 JSON
   */
  static exportToJSON<T>(data: T[], options: ExportOptions = {}): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    this.downloadFile(blob, `${options.filename || 'export'}.json`, 'application/json');
  }

  /**
   * 導出為 Excel（使用 CSV 格式，可被 Excel 打開）
   */
  static exportToExcel<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions = {}
  ): void {
    // 簡單實現：使用 CSV 格式（Excel 可以打開）
    // 如果需要完整的 Excel 功能，可以使用 SheetJS 等庫
    this.exportToCSV(data, { ...options, filename: options.filename || 'export' });
  }

  /**
   * 下載文件
   */
  private static downloadFile(
    blob: Blob,
    filename: string,
    mimeType: string
  ): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 格式化日期
   */
  static formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}
