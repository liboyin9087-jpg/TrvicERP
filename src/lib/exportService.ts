/**
 * 文件匯出服務
 * Export Service for PDF and Excel generation
 */

import type { TourSession, Booking, RoomAssignment, SeatAssignment, MeetingInfo } from '../../types';

// ============================================
// Excel Export (使用原生方式，無需額外依賴)
// ============================================

/**
 * 將數據轉換為 CSV 格式
 */
function arrayToCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));

  return [headerLine, ...dataLines].join('\n');
}

/**
 * 下載 CSV 文件
 */
function downloadCSV(content: string, filename: string): void {
  // 添加 BOM 以確保 Excel 正確識別 UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成 Excel XML (可直接用 Excel 開啟的 XML 格式)
 */
function generateExcelXML(sheetName: string, headers: string[], rows: string[][]): string {
  const escapeXML = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const headerCells = headers
    .map(h => `<Cell><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`)
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
      <Interior ss:Color="#F0F0F0" ss:Pattern="Solid"/>
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

/**
 * 下載 Excel XML 文件
 */
function downloadExcelXML(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// PDF Export (使用瀏覽器列印功能)
// ============================================

/**
 * 生成並下載 PDF（透過列印對話框）
 */
function printToPDF(html: string, title: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = title;

    // 等待內容載入後觸發列印
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * 使用 canvas 生成 PDF Blob（簡化版）
 */
async function generatePDFBlob(html: string): Promise<Blob> {
  // 簡化實作：將 HTML 轉換為可列印格式
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  return new Blob([fullHtml], { type: 'text/html' });
}

// ============================================
// Document Export Functions
// ============================================

export interface ExportOptions {
  session: TourSession;
  bookings: Booking[];
  roomAssignments?: RoomAssignment[];
  seatAssignments?: SeatAssignment[];
  meetingInfo?: MeetingInfo;
}

/**
 * 匯出名單清冊為 Excel
 */
export function exportRosterToExcel(options: ExportOptions): void {
  const { session, bookings } = options;
  const filename = `名單清冊_${session.group_number || session.series_id}_${new Date().toISOString().split('T')[0]}`;

  const headers = ['序號', '姓名', '英文姓名', '護照號碼', '身分證字號', '性別', '房間號', '座位號', '特殊需求', '備註'];

  const rows = bookings.map((booking, idx) => [
    String(idx + 1),
    booking.customer_name || '',
    booking.passport_data?.english_name || '',
    booking.passport_data?.passport_number || '',
    booking.passport_data?.id_number || '',
    booking.passport_data?.gender || '',
    booking.assigned_room || '',
    booking.assigned_seat || '',
    booking.special_needs || '',
    booking.notes || '',
  ]);

  const excelContent = generateExcelXML('名單清冊', headers, rows);
  downloadExcelXML(excelContent, filename);
}

/**
 * 匯出分房表為 Excel
 */
export function exportRoomListToExcel(options: ExportOptions): void {
  const { session, roomAssignments = [] } = options;
  const filename = `分房表_${session.group_number || session.series_id}_${new Date().toISOString().split('T')[0]}`;

  const headers = ['房號', '房型', '入住旅客', '備註'];

  const rows = roomAssignments.map(room => [
    room.roomNumber || '',
    room.roomType || '',
    room.occupants?.map(o => o.name).join('、') || '',
    room.notes || '',
  ]);

  const excelContent = generateExcelXML('分房表', headers, rows);
  downloadExcelXML(excelContent, filename);
}

/**
 * 匯出座位表為 Excel
 */
export function exportSeatChartToExcel(options: ExportOptions): void {
  const { session, seatAssignments = [] } = options;
  const filename = `座位表_${session.group_number || session.series_id}_${new Date().toISOString().split('T')[0]}`;

  const headers = ['座位號', '旅客姓名', '狀態'];

  const rows = seatAssignments.map(seat => [
    seat.seat_number || '',
    seat.passenger_name || '',
    seat.is_assigned ? '已分配' : '空位',
  ]);

  const excelContent = generateExcelXML('座位表', headers, rows);
  downloadExcelXML(excelContent, filename);
}

/**
 * 匯出行程表為 Excel
 */
export function exportItineraryToExcel(options: ExportOptions): void {
  const { session } = options;
  const filename = `行程表_${session.group_number || session.series_id}_${new Date().toISOString().split('T')[0]}`;

  const headers = ['日期', '天數', '行程內容', '餐食', '住宿'];

  // 如果有行程資料則使用，否則顯示基本資訊
  const rows = session.itinerary_days?.map((day, idx) => [
    day.date || '',
    `第 ${idx + 1} 天`,
    day.activities?.join('、') || '',
    day.meals?.join('、') || '',
    day.hotel || '',
  ]) || [
    [session.start_date, '第 1 天', '行程資料待補充', '', ''],
    [session.end_date, '最後一天', '行程結束', '', ''],
  ];

  const excelContent = generateExcelXML('行程表', headers, rows);
  downloadExcelXML(excelContent, filename);
}

/**
 * 匯出集合資訊為 Excel
 */
export function exportMeetingInfoToExcel(options: ExportOptions): void {
  const { session, meetingInfo } = options;
  const filename = `集合資訊_${session.group_number || session.series_id}_${new Date().toISOString().split('T')[0]}`;

  const headers = ['項目', '內容'];

  const rows = [
    ['團號', session.group_number || session.series_id || ''],
    ['出發日期', session.start_date || ''],
    ['集合地點', meetingInfo?.location || ''],
    ['地址', meetingInfo?.address || ''],
    ['集合時間', meetingInfo?.meeting_time || ''],
    ['聯絡人', meetingInfo?.contact_person || ''],
    ['聯絡電話', meetingInfo?.contact_phone || ''],
    ['備註', meetingInfo?.notes || ''],
  ];

  const excelContent = generateExcelXML('集合資訊', headers, rows);
  downloadExcelXML(excelContent, filename);
}

// ============================================
// PDF Export Functions
// ============================================

/**
 * 生成 PDF 文件的基礎樣式
 */
function getBasePDFStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Microsoft JhengHei', 'Noto Sans TC', 'Heiti TC', sans-serif;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
        color: #333;
        line-height: 1.6;
      }
      .header {
        border-bottom: 3px solid #1a1a1a;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #1a1a1a;
      }
      .subtitle {
        color: #666;
        font-size: 14px;
      }
      .section {
        margin-bottom: 30px;
      }
      .section-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
        color: #374151;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      th, td {
        padding: 12px;
        text-align: left;
        border: 1px solid #e5e7eb;
      }
      th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
      }
      tr:nth-child(even) {
        background: #f9fafb;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-top: 20px;
      }
      .info-item {
        background: #f9fafb;
        padding: 15px;
        border-radius: 8px;
      }
      .info-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 5px;
      }
      .info-value {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
      }
      @media print {
        body { padding: 20px; }
        @page { margin: 1.5cm; }
      }
    </style>
  `;
}

/**
 * 匯出名單清冊為 PDF
 */
export function exportRosterToPDF(options: ExportOptions): void {
  const { session, bookings } = options;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>名單清冊 - ${session.group_number || session.series_id}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">名單清冊</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          出發日期：${session.start_date} ~ ${session.end_date} |
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
              <td>${booking.passport_data?.english_name || ''}</td>
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

  printToPDF(html, `名單清冊_${session.group_number || session.series_id}`);
}

/**
 * 匯出分房表為 PDF
 */
export function exportRoomListToPDF(options: ExportOptions): void {
  const { session, roomAssignments = [] } = options;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>分房表 - ${session.group_number || session.series_id}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">分房表</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          出發日期：${session.start_date}
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

  printToPDF(html, `分房表_${session.group_number || session.series_id}`);
}

/**
 * 匯出座位表為 PDF
 */
export function exportSeatChartToPDF(options: ExportOptions): void {
  const { session, seatAssignments = [] } = options;

  const seatGridHTML = seatAssignments
    .map(
      seat => `
      <div style="
        display: inline-block;
        width: 80px;
        margin: 5px;
        padding: 10px;
        border: 2px solid ${seat.is_assigned ? '#3b82f6' : '#22c55e'};
        background: ${seat.is_assigned ? '#dbeafe' : '#f0fdf4'};
        border-radius: 8px;
        text-align: center;
      ">
        <div style="font-weight: bold; font-size: 14px;">${seat.seat_number}</div>
        ${seat.passenger_name ? `<div style="font-size: 11px; margin-top: 5px;">${seat.passenger_name}</div>` : '<div style="font-size: 11px; margin-top: 5px; color: #999;">空位</div>'}
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>座位表 - ${session.group_number || session.series_id}</title>
      ${getBasePDFStyles()}
      <style>
        .seat-legend {
          display: flex;
          gap: 20px;
          margin: 20px 0;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-box {
          width: 20px;
          height: 20px;
          border-radius: 4px;
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
          <div class="legend-box" style="background: #dbeafe; border-color: #3b82f6;"></div>
          <span>已分配</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background: #f0fdf4; border-color: #22c55e;"></div>
          <span>空位</span>
        </div>
      </div>
      <div style="margin-top: 30px;">
        ${seatGridHTML}
      </div>
      <div class="footer">
        列印日期：${new Date().toLocaleDateString('zh-TW')} | TrvicERP 旅遊管理系統
      </div>
    </body>
    </html>
  `;

  printToPDF(html, `座位表_${session.group_number || session.series_id}`);
}

/**
 * 匯出集合資訊為 PDF
 */
export function exportMeetingInfoToPDF(options: ExportOptions): void {
  const { session, meetingInfo } = options;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>集合資訊 - ${session.group_number || session.series_id}</title>
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
        <div class="section" style="margin-top: 30px;">
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

  printToPDF(html, `集合資訊_${session.group_number || session.series_id}`);
}

/**
 * 匯出行程表為 PDF
 */
export function exportItineraryToPDF(options: ExportOptions): void {
  const { session } = options;

  const itineraryHTML = session.itinerary_days
    ?.map(
      (day, idx) => `
      <div class="section">
        <div class="section-title">第 ${idx + 1} 天 - ${day.date || ''}</div>
        <div style="padding-left: 15px;">
          ${day.activities?.map(a => `<p>• ${a}</p>`).join('') || '<p>行程資料待補充</p>'}
          ${day.meals ? `<p style="color: #666; margin-top: 10px;">餐食：${day.meals.join('、')}</p>` : ''}
          ${day.hotel ? `<p style="color: #666;">住宿：${day.hotel}</p>` : ''}
        </div>
      </div>
    `
    )
    .join('') ||
    `
    <div class="section">
      <p>行程資料尚未設定，請聯繫業務人員。</p>
      <p>出發日期：${session.start_date}</p>
      <p>回程日期：${session.end_date}</p>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>團體行程表 - ${session.group_number || session.series_id}</title>
      ${getBasePDFStyles()}
    </head>
    <body>
      <div class="header">
        <div class="title">團體行程表</div>
        <div class="subtitle">
          團號：${session.group_number || 'N/A'} |
          出發日期：${session.start_date} ~ ${session.end_date} |
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

  printToPDF(html, `行程表_${session.group_number || session.series_id}`);
}

// ============================================
// Unified Export Interface
// ============================================

export type DocumentType = 'itinerary' | 'room_list' | 'seat_chart' | 'roster' | 'meeting_info';

/**
 * 統一匯出 PDF
 */
export function exportToPDF(type: DocumentType, options: ExportOptions): void {
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
  }
}

/**
 * 統一匯出 Excel
 */
export function exportToExcel(type: DocumentType, options: ExportOptions): void {
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
  }
}
