/**
 * 文件匯出服務
 * Export Service for various document formats (CSV, Excel, PDF)
 */

import type { TourSession, Booking, RoomAssignment, SeatAssignment, MeetingInfo } from '../../types';
import { exportToCSVInternal } from './export/csvExportService';
import { exportToExcelInternal } from './export/excelExportService';
import { exportToPDFInternal } from './export/pdfExportService';

/**
 * Common interface for export options, ensuring Kintone independence by receiving data via props.
 */
export interface ExportOptions {
  session: TourSession;
  bookings?: Booking[]; // Optional as not all reports need bookings
  roomAssignments?: RoomAssignment[];
  seatAssignments?: SeatAssignment[];
  meetingInfo?: MeetingInfo;
}

/**
 * Defines the types of documents that can be exported.
 */
export type DocumentType = 'itinerary' | 'room_list' | 'seat_chart' | 'roster' | 'meeting_info';

/**
 * 統一匯出 PDF
 * @param type 文件類型
 * @param options 匯出資料選項
 */
export function exportToPDF(type: DocumentType, options: ExportOptions): void {
  exportToPDFInternal(type, options);
}

/**
 * 統一匯出 Excel
 * @param type 文件類型
 * @param options 匯出資料選項
 */
export function exportToExcel(type: DocumentType, options: ExportOptions): void {
  exportToExcelInternal(type, options);
}

/**
 * 統一匯出 CSV (目前僅限名單清冊)
 * @param options 匯出資料選項 (目前僅使用 bookings 和 session)
 */
export function exportRosterToCSV(options: ExportOptions): void {
  exportToCSVInternal(options);
}

---

**新增檔案: `/workspaces/TrvicERP/src/lib/export/utils.ts`**

/**
 * exportService 的通用工具函式和常數
 */

// ============================================
// 常數 (Tailwind Token 對應值)
// ============================================

// Excel header background color (對應 Tailwind gray-100)
export const EXCEL_HEADER_BG_COLOR_HEX = '#F3F4F6'; // gray-100

// PDF 基礎樣式顏色 (對應 Tailwind 顏色盤)
export const PDF_COLOR_TEXT_PRIMARY_HEX = '#1F2937'; // gray-800
export const PDF_COLOR_TEXT_SECONDARY_HEX = '#6B7280'; // gray-500
export const PDF_COLOR_TEXT_TERTIARY_HEX = '#9CA3AF'; // gray-400
export const PDF_COLOR_BORDER_LIGHT_HEX = '#E5E7EB'; // gray-200
export const PDF_COLOR_BACKGROUND_LIGHT_HEX = '#F9FAFB'; // gray-50
export const PDF_COLOR_BACKGROUND_BLUE_LIGHT_HEX = '#DBEAFE'; // blue-100
export const PDF_COLOR_BLUE_PRIMARY_HEX = '#3B82F6'; // blue-500
export const PDF_COLOR_BACKGROUND_GREEN_LIGHT_HEX = '#F0FDF4'; // green-50
export const PDF_COLOR_GREEN_PRIMARY_HEX = '#22C55E'; // green-500
export const PDF_COLOR_GRAY_DARK_HEX = '#374151'; // gray-700
export const PDF_COLOR_GRAY_MEDIUM_HEX = '#666'; // custom, or use gray-600

// PDF 基礎樣式間距 (對應 Tailwind 間距盤)
export const PDF_SPACING_BASE_PX = '16px'; // roughly p-4
export const PDF_SPACING_LG_PX = '20px'; // roughly p-5
export const PDF_SPACING_XL_PX = '30px'; // roughly p-7.5
export const PDF_SPACING_XXL_PX = '40px'; // roughly p-10

// ============================================
// 字串處理工具
// ============================================

/**
 * 轉義用於 CSV 的字串
 */
export function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * 轉義用於 XML 的字串
 */
export function escapeXML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ============================================
// 瀏覽器 API 錯誤處理
// ============================================

/**
 * 安全地執行瀏覽器下載操作
 */
export function safeBrowserDownload(
  content: string | Blob,
  filename: string,
  mimeType: string,
  extension: string,
  bom: boolean = false
): void {
  try {
    let finalContent: Blob;
    if (bom && typeof content === 'string') {
      finalContent = new Blob(['\uFEFF' + content], { type: mimeType });
    } else if (typeof content === 'string') {
      finalContent = new Blob([content], { type: mimeType });
    } else {
      finalContent = content;
    }

    const url = URL.createObjectURL(finalContent);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下載文件失敗:', error);
    alert('下載文件失敗，請檢查瀏覽器設定或稍後再試。');
  }
}

/**
 * 安全地打開新視窗並執行列印操作
 */
export function safeWindowOpenAndPrint(htmlContent: string, title: string): void {
  let printWindow: Window | null = null;
  try {
    printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('無法打開新視窗，可能被瀏覽器阻擋。');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = title;

    // 等待內容載入後觸發列印
    printWindow.onload = () => {
      if (printWindow) {
        try {
          printWindow.print();
          // printWindow.close(); // 某些瀏覽器會在列印後自動關閉，或用戶手動關閉
        } catch (printError) {
          console.error('列印失敗:', printError);
          alert('執行列印操作失敗，請檢查印表機設定。');
        }
      }
    };
    printWindow.onerror = (message, source, lineno, colno, error) => {
      console.error('新視窗載入錯誤:', message, error);
      alert('準備列印內容時發生錯誤，請稍後再試。');
      if (printWindow) printWindow.close();
    };
  } catch (error) {
    console.error('準備列印失敗:', error);
    alert(`準備列印失敗：${(error as Error).message || '未知錯誤'}。`);
    if (printWindow) printWindow.close();
  }
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('日期格式化錯誤:', error, dateString);
    return dateString; // 返回原始值以防萬一
  }
}

/**
 * 產生文件檔案名稱
 */
export function generateFilename(
  prefix: string,
  session: TourSession,
  suffix: string = ''
): string {
  const groupIdentifier = session.group_number || session.series_id || '未知團號';
  const datePart = formatDate(new Date().toISOString());
  return `${prefix}_${groupIdentifier}_${datePart}${suffix}`;
}

---

**新增檔案: `/workspaces/TrvicERP/src/lib/export/csvExportService.ts`**

/**
 * CSV 匯出服務
 */

import { ExportOptions } from '../exportService';
import { escapeCSV, safeBrowserDownload, generateFilename } from './utils';

// ============================================
// CSV Export
// ============================================

/**
 * 將數據轉換為 CSV 格式
 * @param headers CSV 標題列
 * @param rows CSV 數據列
 * @returns CSV 格式字串
 */
function arrayToCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));

  return [headerLine, ...dataLines].join('\n');
}

/**
 * 匯出名單清冊為 CSV
 * @param options 匯出資料選項
 */
export function exportToCSVInternal(options: ExportOptions): void {
  const { session, bookings } = options;
  if (!bookings) {
    console.error('匯出 CSV 名單清冊缺少 bookings 資料。');
    alert('匯出失敗：缺少名單清冊資料。');
    return;
  }

  const filename = generateFilename('名單清冊', session);

  const headers = ['序號', '姓名', '英文姓名', '護照號碼', '身分證字號', '性別', '房間號', '座位號', '特殊需求', '備註'];

  const rows = bookings.map((booking, idx) => [
    String(idx + 1),
    booking.customer_name || '',
    (booking.passport_data as any)?.english_name || booking.passport_data?.name || '',
    booking.passport_data?.passport_number || '',
    booking.passport_data?.personal_id || '',
    (booking as any).gender || (booking.passport_data as any)?.gender || '',
    booking.assigned_room || '',
    booking.assigned_seat || '',
    booking.special_needs || '',
    booking.special_needs || '', // 備註暫時同特殊需求，可根據實際需求調整
  ]);

  const csvContent = arrayToCSV(headers, rows);
  safeBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;', 'csv', true);
}

---

**新增檔案: `/workspaces/TrvicERP/src/lib/export/excelExportService.ts`**

/**
 * Excel 匯出服務
 */

import { ExportOptions, DocumentType } from '../exportService';
import { escapeXML, safeBrowserDownload, EXCEL_HEADER_BG_COLOR_HEX, generateFilename, formatDate } from './utils';

// ============================================
// Excel Export (使用原生方式，無需額外依賴)
// ============================================

/**
 * 生成 Excel XML (可直接用 Excel 開啟的 XML 格式)
 * @param sheetName 工作表名稱
 * @param headers 標題列
 * @param rows 數據列
 * @returns Excel XML 格式字串
 */
function generateExcelXML(sheetName: string, headers: string[], rows: string[][]): string {
  const headerCells = headers
    .map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`)
    .join('');

  const dataCells = rows
    .map(
      row =>
        `<Row>${row
          .map(cell => `<Cell><Data ss:Type="String">${escapeXML(cell)}</Data></Cell>`)
          .join('')}</Row>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="${EXCEL_HEADER_BG_COLOR_HEX}" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXML(sheetName)}">
    <Table>
      <Row ss:StyleID="Header">${headerCells}</Row>
      ${dataCells}
    </Table>
  </Worksheet>
</Workbook>`;
}

// ============================================
// Document Export Functions (Excel Specific)
// ============================================

/**
 * 匯出名單清冊為 Excel
 */
export function exportRosterToExcel(options: ExportOptions): void {
  const { session, bookings } = options;
  if (!bookings) {
    console.error('匯出 Excel 名單清冊缺少 bookings 資料。');
    alert('匯出失敗：缺少名單清冊資料。');
    return;
  }

  const filename = generateFilename('名單清冊', session);

  const headers = ['序號', '姓名', '英文姓名', '護照號碼', '身分證字號', '性別', '房間號', '座位號', '特殊需求', '備註'];

  const rows = bookings.map((booking, idx) => [
    String(idx + 1),
    booking.customer_name || '',
    (booking.passport_data as any)?.english_name || booking.passport_data?.name || '',
    booking.passport_data?.passport_number || '',
    booking.passport_data?.personal_id || '',
    (booking as any).gender || (booking.passport_data as any)?.gender || '',
    booking.assigned_room || '',
    booking.assigned_seat || '',
    booking.special_needs || '',
    booking.special_needs || '',
  ]);

  const excelContent = generateExcelXML('名單清冊', headers, rows);
  safeBrowserDownload(excelContent, filename, 'application/vnd.ms-excel', 'xls');
}

/**
 * 匯出分房表為 Excel
 */
export function exportRoomListToExcel(options: ExportOptions): void {
  const { session, roomAssignments = [] } = options;
  const filename = generateFilename('分房表', session);

  const headers = ['房號', '房型', '入住旅客', '備註'];

  const rows = roomAssignments.map(room => [
    room.roomNumber || '',
    room.roomType || '',
    room.occupants?.map(o => o.name).join('、') || '',
    room.notes || '',
  ]);

  const excelContent = generateExcelXML('分房表', headers, rows);
  safeBrowserDownload(excelContent, filename, 'application/vnd.ms-excel', 'xls');
}

/**
 * 匯出座位表為 Excel
 */
export function exportSeatChartToExcel(options: ExportOptions): void {
  const { session, seatAssignments = [] } = options;
  const filename = generateFilename('座位表', session);

  const headers = ['座位號', '旅客姓名', '狀態'];

  const rows = seatAssignments.map(seat => [
    seat.seat_number || '',
    seat.passenger_name || '',
    seat.is_assigned ? '已分配' : '空位',
  ]);

  const excelContent = generateExcelXML('座位表', headers, rows);
  safeBrowserDownload(excelContent, filename, 'application/vnd.ms-excel', 'xls');
}

/**
 * 匯出行程表為 Excel
 */
export function exportItineraryToExcel(options: ExportOptions): void {
  const { session } = options;
  const filename = generateFilename('行程表', session);

  const headers = ['日期', '天數', '行程內容', '餐食', '住宿'];

  // 如果有行程資料則使用，否則顯示基本資訊
  const itineraryDays =
    (session as any).itinerary_days ?? session.itinerary_versions?.[0]?.itinerary_data?.days ?? [];

  const rows = itineraryDays?.map((day: any, idx: number) => [
    formatDate(day.date) || '',
    `第 ${idx + 1} 天`,
    day.activities?.join('、') || '',
    day.meals?.join('、') || '',
    day.hotel || '',
  ]) || [
    [formatDate(session.start_date), '第 1 天', '行程資料待補充', '', ''],
    [formatDate(session.end_date), '最後一天', '行程結束', '', ''],
  ];

  const excelContent = generateExcelXML('行程表', headers, rows);
  safeBrowserDownload(excelContent, filename, 'application/vnd.ms-excel', 'xls');
}

/**
 * 匯出集合資訊為 Excel
 */
export function exportMeetingInfoToExcel(options: ExportOptions): void {
  const { session, meetingInfo } = options;
  const filename = generateFilename('集合資訊', session);

  const headers = ['項目', '內容'];

  const rows = [
    ['團號', session.group_number || session.series_id || ''],
    ['出發日期', formatDate(session.start_date) || ''],
    ['集合地點', meetingInfo?.location || ''],
    ['地址', meetingInfo?.address || ''],
    ['集合時間', meetingInfo?.meeting_time || ''],
    ['聯絡人', meetingInfo?.contact_person || ''],
    ['聯絡電話', meetingInfo?.contact_phone || ''],
    ['備註', meetingInfo?.notes || ''],
  ];

  const excelContent = generateExcelXML('集合資訊', headers, rows);
  safeBrowserDownload(excelContent, filename, 'application/vnd.ms-excel', 'xls');
}

/**
 * 內部使用的統一 Excel 匯出函數
 * @param type 文件類型
 * @param options 匯出資料選項
 */
export function exportToExcelInternal(type: DocumentType, options: ExportOptions): void {
  switch (type) {
    case 'itinerary':
      exportItineraryToExcel(options);
      break;
    case 'room_list':
      exportRoomListToExcel(options);
      break;
    case 'seat_chart':
      exportSeatChartToExcel(options);
      break;
    case 'roster':
      exportRosterToExcel(options);
      break;
    case 'meeting_info':
      exportMeetingInfoToExcel(options);
      break;
    default:
      console.warn(`未知的 Excel 匯出類型: ${type}`);
      alert(`不支持的匯出類型: ${type}`);
  }
}

---

**新增檔案: `/workspaces/TrvicERP/src/lib/export/pdfExportService.ts`**

/**
 * PDF 匯出服務 (透過瀏覽器列印功能)
 */

import { ExportOptions, DocumentType } from '../exportService';
import {
  safeWindowOpenAndPrint,
  PDF_COLOR_TEXT_PRIMARY_HEX,
  PDF_COLOR_TEXT_SECONDARY_HEX,
  PDF_COLOR_TEXT_TERTIARY_HEX,
  PDF_COLOR_BORDER_LIGHT_HEX,
  PDF_COLOR_BACKGROUND_LIGHT_HEX,
  PDF_COLOR_BACKGROUND_BLUE_LIGHT_HEX,
  PDF_COLOR_BLUE_PRIMARY_HEX,
  PDF_COLOR_BACKGROUND_GREEN_LIGHT_HEX,
  PDF_COLOR_GREEN_PRIMARY_HEX,
  PDF_COLOR_GRAY_DARK_HEX,
  PDF_COLOR_GRAY_MEDIUM_HEX,
  PDF_SPACING_BASE_PX,
  PDF_SPACING_LG_PX,
  PDF_SPACING_XL_PX,
  PDF_SPACING_XXL_PX,
  generateFilename,
  formatDate,
} from './utils';

// ============================================
// PDF Export (使用瀏覽器列印功能)
// ============================================

/**
 * 生成 PDF 文件的基礎樣式，使用 Tailwind-like 的值。
 * 這裡無法直接使用 Tailwind class，因此將其值對應為 inline CSS。
 */
function getBasePDFStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Microsoft JhengHei', 'Noto Sans TC', 'Heiti TC', sans-serif;
        padding: ${PDF_SPACING_XXL_PX}; /* p-10 */
        max-width: 800px; /* max-w-2xl */
        margin: 0 auto;
        color: ${PDF_COLOR_TEXT_PRIMARY_HEX}; /* text-gray-800 */
        line-height: 1.6; /* leading-relaxed */
        font-size: ${PDF_SPACING_BASE_PX}; /* text-base */
      }
      .header {
        border-bottom: 3px solid ${PDF_COLOR_GRAY_DARK_HEX}; /* border-gray-700 */
        padding-bottom: ${PDF_SPACING_LG_PX}; /* pb-5 */
        margin-bottom: ${PDF_SPACING_XL_PX}; /* mb-7.5 */
      }
      .title {
        font-size: 28px; /* text-3xl */
        font-weight: bold; /* font-bold */
        margin-bottom: 10px; /* mb-2.5 */
        color: ${PDF_COLOR_GRAY_DARK_HEX}; /* text-gray-700 */
      }
      .subtitle {
        color: ${PDF_COLOR_TEXT_SECONDARY_HEX}; /* text-gray-500 */
        font-size: 14px; /* text-sm */
      }
      .section {
        margin-bottom: ${PDF_SPACING_XL_PX}; /* mb-7.5 */
      }
      .section-title {
        font-size: 18px; /* text-lg */
        font-weight: bold; /* font-bold */
        margin-bottom: 15px; /* mb-3.5 */
        padding-bottom: 8px; /* pb-2 */
        border-bottom: 2px solid ${PDF_COLOR_BORDER_LIGHT_HEX}; /* border-gray-200 */
        color: ${PDF_COLOR_GRAY_DARK_HEX}; /* text-gray-700 */
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px; /* mt-3.5 */
        font-size: 14px; /* text-sm */
      }
      th, td {
        padding: 12px; /* p-3 */
        text-align: left;
        border: 1px solid ${PDF_COLOR_BORDER_LIGHT_HEX}; /* border-gray-200 */
      }
      th {
        background: ${PDF_COLOR_BACKGROUND_LIGHT_HEX}; /* bg-gray-50 */
        font-weight: 600; /* font-semibold */
        color: ${PDF_COLOR_GRAY_DARK_HEX}; /* text-gray-700 */
      }
      tr:nth-child(even) {
        background: ${PDF_COLOR_BACKGROUND_LIGHT_HEX}; /* bg-gray-50 */
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: ${PDF_SPACING_LG_PX}; /* gap-5 */
        margin-top: ${PDF_SPACING_LG_PX}; /* mt-5 */
      }
      .info-item {
        background: ${PDF_COLOR_BACKGROUND_LIGHT_HEX}; /* bg-gray-50 */
        padding: 15px; /* p-3.5 */
        border-radius: 8px; /* rounded-lg */
      }
      .info-label {
        font-size: 12px; /* text-xs */
        color: ${PDF_COLOR_TEXT_SECONDARY_HEX}; /* text-gray-500 */
        margin-bottom: 5px; /* mb-1.5 */
      }
      .info-value {
        font-size: 16px; /* text-base */
        font-weight: 600; /* font-semibold */
        color: ${PDF_COLOR_TEXT_PRIMARY_HEX}; /* text-gray-800 */
      }
      .footer {
        margin-top: ${PDF_SPACING_XXL_PX}; /* mt-10 */
        padding-top: ${PDF_SPACING_LG_PX}; /* pt-5 */
        border-top: 1px solid ${PDF_COLOR_BORDER_LIGHT_HEX}; /* border-gray-200 */
        font-size: 12px; /* text-xs */
        color: ${PDF_COLOR_TEXT_TERTIARY_HEX}; /* text-gray-400 */
        text-align: center;
      }
      @media print {
        body { padding: ${PDF_SPACING_LG_PX}; } /* p-5 */
        @page { margin: 1.5cm; }
      }
    </style>
  `;
}

// ============================================
// Document Export Functions (PDF Specific)
// ============================================

/**
 * 匯出名單清冊為 PDF
 */
export function exportRosterToPDF(options: ExportOptions): void {
  const { session, bookings } = options;
  if (!bookings) {
    console.error('匯出 PDF 名單清冊缺少 bookings 資料。');
    alert('匯出失敗：缺少名單清冊資料。');
    return;
  }

  const filename = generateFilename('名單清冊', session);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">名單清冊</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          出發日期：${formatDate(session.start_date)} ~ ${formatDate(session.end_date)} |
          總人數：${bookings.length} 人
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>序號</th>
            <th>姓名</th>
            <th>英文姓名</th>
            <th>護照號碼</th>
            <th>房間</th>
            <th>座位</th>
            <th>特殊需求</th>
          </tr>
        </thead>
        <tbody>
          ${bookings
            .map(
              (booking, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${booking.customer_name || ''}</td>
              <td>${(booking.passport_data as any)?.english_name || booking.passport_data?.name || ''}</td>
              <td>${booking.passport_data?.passport_number || ''}</td>
              <td>${booking.assigned_room || '-'}</td>
              <td>${booking.assigned_seat || '-'}</td>
              <td>${booking.special_needs || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        列印日期：${new Date().toLocaleDateString('zh-TW')} | TrvicERP 旅遊管理系統
      </div>
    </body>
    </html>
  `;

  safeWindowOpenAndPrint(html, filename);
}

/**
 * 匯出分房表為 PDF
 */
export function exportRoomListToPDF(options: ExportOptions): void {
  const { session, roomAssignments = [] } = options;
  const filename = generateFilename('分房表', session);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">分房表</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          出發日期：${formatDate(session.start_date)}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>房號</th>
            <th>房型</th>
            <th>入住旅客</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          ${roomAssignments
            .map(
              room => `
            <tr>
              <td>${room.roomNumber || ''}</td>
              <td>${room.roomType || ''}</td>
              <td>${room.occupants?.map(o => o.name).join('、') || ''}</td>
              <td>${room.notes || ''}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        列印日期：${new Date().toLocaleDateString('zh-TW')} | TrvicERP 旅遊管理系統
      </div>
    </body>
    </html>
  `;

  safeWindowOpenAndPrint(html, filename);
}

/**
 * 匯出座位表為 PDF
 */
export function exportSeatChartToPDF(options: ExportOptions): void {
  const { session, seatAssignments = [] } = options;
  const filename = generateFilename('座位表', session);

  const seatGridHTML = seatAssignments
    .map(
      seat => `
      <div style="
        display: inline-block;
        width: 80px; /* w-20 */
        margin: 5px; /* m-1.5 */
        padding: 10px; /* p-2.5 */
        border: 2px solid ${seat.is_assigned ? PDF_COLOR_BLUE_PRIMARY_HEX : PDF_COLOR_GREEN_PRIMARY_HEX}; /* border-blue-500 / border-green-500 */
        background: ${seat.is_assigned ? PDF_COLOR_BACKGROUND_BLUE_LIGHT_HEX : PDF_COLOR_BACKGROUND_GREEN_LIGHT_HEX}; /* bg-blue-100 / bg-green-50 */
        border-radius: 8px; /* rounded-lg */
        text-align: center;
      ">
        <div style="font-weight: bold; font-size: 14px;">${seat.seat_number}</div>
        ${seat.passenger_name ? `<div style="font-size: 11px; margin-top: 5px;">${seat.passenger_name}</div>` : `<div style="font-size: 11px; margin-top: 5px; color: ${PDF_COLOR_TEXT_TERTIARY_HEX};">空位</div>`}
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      ${getBasePDFStyles()}
      <style>
        .seat-legend {
          display: flex;
          gap: ${PDF_SPACING_LG_PX}; /* gap-5 */
          margin: ${PDF_SPACING_LG_PX} 0; /* my-5 */
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px; /* gap-2 */
          font-size: 14px; /* text-sm */
          color: ${PDF_COLOR_TEXT_PRIMARY_HEX}; /* text-gray-800 */
        }
        .legend-box {
          width: 20px; /* w-5 */
          height: 20px; /* h-5 */
          border-radius: 4px; /* rounded */
          border: 2px solid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">座位表</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          交通工具：${seatAssignments[0]?.vehicle_type || 'N/A'}
        </div>
      </div>
      <div class="seat-legend">
        <div class="legend-item">
          <div class="legend-box" style="background: ${PDF_COLOR_BACKGROUND_BLUE_LIGHT_HEX}; border-color: ${PDF_COLOR_BLUE_PRIMARY_HEX};"></div>
          <span>已分配</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background: ${PDF_COLOR_BACKGROUND_GREEN_LIGHT_HEX}; border-color: ${PDF_COLOR_GREEN_PRIMARY_HEX};"></div>
          <span>空位</span>
        </div>
      </div>
      <div style="margin-top: ${PDF_SPACING_XL_PX};">
        ${seatGridHTML}
      </div>
      <div class="footer">
        列印日期：${new Date().toLocaleDateString('zh-TW')} | TrvicERP 旅遊管理系統
      </div>
    </body>
    </html>
  `;

  safeWindowOpenAndPrint(html, filename);
}

/**
 * 匯出集合資訊為 PDF
 */
export function exportMeetingInfoToPDF(options: ExportOptions): void {
  const { session, meetingInfo } = options;
  const filename = generateFilename('集合資訊', session);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">集合資訊</div>
        <div class="subtitle">團號：${session.group_number || 'N/A'}</div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">集合地點</div>
          <div class="info-value">${meetingInfo?.location || '-'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">集合時間</div>
          <div class="info-value">${meetingInfo?.meeting_time || '-'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">聯絡人</div>
          <div class="info-value">${meetingInfo?.contact_person || '-'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">聯絡電話</div>
          <div class="info-value">${meetingInfo?.contact_phone || '-'}</div>
        </div>
      </div>
      ${
        meetingInfo?.address
          ? `
        <div class="section" style="margin-top: ${PDF_SPACING_XL_PX};">
          <div class="section-title">詳細地址</div>
          <p>${meetingInfo.address}</p>
        </div>
      `
          : ''
      }
      ${
        meetingInfo?.notes
          ? `
        <div class="section">
          <div class="section-title">注意事項</div>
          <p>${meetingInfo.notes}</p>
        </div>
      `
          : ''
      }
      <div class="footer">
        列印日期：${new Date().toLocaleDateString('zh-TW')} | TrvicERP 旅遊管理系統
      </div>
    </body>
    </html>
  `;

  safeWindowOpenAndPrint(html, filename);
}

/**
 * 匯出行程表為 PDF
 */
export function exportItineraryToPDF(options: ExportOptions): void {
  const { session } = options;
  const filename = generateFilename('團體行程表', session);

  const itineraryDays = (session as any).itinerary_days ?? session.itinerary_versions?.[0]?.itinerary_data?.days ?? [];

  const itineraryHTML = itineraryDays
    ?.map(
      (day: any, idx: number) => `
      <div class="section">
        <div class="section-title">第 ${idx + 1} 天 - ${formatDate(day.date) || ''}</div>
        <div style="padding-left: 15px;">
          ${day.activities?.map((a: any) => `<p>• ${a}</p>`).join('') || '<p>行程資料待補充</p>'}
          ${day.meals ? `<p style="color: ${PDF_COLOR_GRAY_MEDIUM_HEX}; margin-top: 10px;">餐食：${day.meals.join('、')}</p>` : ''}
          ${day.hotel ? `<p style="color: ${PDF_COLOR_GRAY_MEDIUM_HEX};">住宿：${day.hotel}</p>` : ''}
        </div>
      </div>
    `
    )
    .join('') ||
    `
    <div class="section">
      <p style="color: ${PDF_COLOR_TEXT_SECONDARY_HEX};">行程資料尚未設定，請聯繫業務人員。</p>
      <p style="color: ${PDF_COLOR_TEXT_SECONDARY_HEX};">出發日期：${formatDate(session.start_date)}</p>
      <p style="color: ${PDF_COLOR_TEXT_SECONDARY_HEX};">回程日期：${formatDate(session.end_date)}</p>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">團體行程表</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          出發日期：${formatDate(session.start_date)} ~ ${formatDate(session.end_date)} |
          人數：${session.current_pax}/${session.max_pax}
        </div>
      </div>
      ${itineraryHTML}
      <div class="footer">
        列印日期：${new Date().toLocaleDateString('zh-TW')} | TrvicERP 旅遊管理系統
      </div>
    </body>
    </html>
  `;

  safeWindowOpenAndPrint(html, filename);
}

/**
 * 內部使用的統一 PDF 匯出函數
 * @param type 文件類型
 * @param options 匯出資料選項
 */
export function exportToPDFInternal(type: DocumentType, options: ExportOptions): void {
  switch (type) {
    case 'itinerary':
      exportItineraryToPDF(options);
      break;
    case 'room_list':
      exportRoomListToPDF(options);
      break;
    case 'seat_chart':
      exportSeatChartToPDF(options);
      break;
    case 'roster':
      exportRosterToPDF(options);
      break;
    case 'meeting_info':
      exportMeetingInfoToPDF(options);
      break;
    default:
      console.warn(`未知的 PDF 匯出類型: ${type}`);
      alert(`不支持的匯出類型: ${type}`);
  }
}