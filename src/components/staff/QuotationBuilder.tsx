import React, { useState, useMemo, useCallback } from 'react';
import { Calculator, Plus, Minus, FileText, Send, DollarSign, Mail, Eye } from 'lucide-react';
import Modal from '../shared/Modal';
import { ButtonLoading } from '../shared/Loading';
import PDFPreviewModal from '../shared/PDFPreviewModal'; // Assuming this component is robust

// --- 介面定義 (Config Props for Kintone Independence) ---

/**
 * 報價項目介面
 */
interface QuoteItem {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
}

/**
 * Toast 服務介面，用於接收外部傳入的 Toast 功能
 * 避免直接依賴全域 Store
 */
interface ToastService {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

/**
 * QuotationBuilder 元件的配置介面
 * 允許外部設定初始值，實現元件重用
 */
interface QuotationBuilderConfig {
  initialTripName?: string;
  initialPaxCount?: number;
  initialItems?: QuoteItem[];
  initialMarginRate?: number;
}

/**
 * QuotationBuilder 元件的 Props 介面
 * 包含配置和外部服務依賴
 */
interface QuotationBuilderProps {
  /**
   * 元件的初始配置
   */
  config: QuotationBuilderConfig;
  /**
   * Toast 服務實例，用於發送通知
   */
  toast: ToastService;
  /**
   * 發送報價的異步回調函數
   * 元件本身不處理發送邏輯，僅觸發此回調
   */
  onSendQuotation?: (
    data: {
      tripName: string;
      paxCount: number;
      sellingPrice: number;
      recipientEmail: string;
    }
  ) => Promise<void>;
}

// --- 報價單 HTML 生成工具函數 (依據單一職責原則提取) ---
/**
 * 生成用於列印或預覽的報價單 HTML 內容
 * 內部 CSS 使用 CSS 變數，以減少硬編碼並提高可維護性
 */
const generateQuotationPrintableHtml = (data: {
  tripName: string;
  paxCount: number;
  items: QuoteItem[];
  marginRate: number;
  totalCost: number;
  sellingPrice: number;
  totalRevenue: number;
  profit: number;
}): string => {
  const { tripName, paxCount, items, marginRate, totalCost, sellingPrice, totalRevenue, profit } = data;
  const currentDate = new Date().toLocaleDateString('zh-TW');
  const currentTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  // 使用 CSS 變數來管理顏色，避免硬編碼
  // 這些變數應與 Dashtail / Tailwind 的顏色系統概念上對齊
  const style = `
    :root {
      --text-color-dark: #1a1a1a;
      --text-color-medium: #666;
      --text-color-light: #888;
      --bg-light: #f5f5f5;
      --bg-category: #e5e5e5;
      --border-dark: #000;
      --border-light: #eee;
      --border-medium: #333;
      --accent-color: #06c167; /* 預設為綠色，可根據品牌定義 */
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans TC', sans-serif;
      padding: 40px;
      color: var(--text-color-dark);
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid var(--border-dark);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .logo-sub {
      color: var(--text-color-medium);
      font-size: 14px;
    }
    .trip-info {
      background: var(--bg-light);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .trip-name {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .meta {
      display: flex;
      gap: 32px;
      color: var(--text-color-medium);
      font-size: 14px;
    }
    h2 {
      font-size: 16px;
      color: var(--text-color-medium); /* 原本為 #333 */
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-light);
    }
    .items { margin-bottom: 32px; }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-light);
    }
    .item-name { font-weight: 500; }
    .item-category {
      display: inline-block;
      background: var(--bg-category);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      color: var(--text-color-medium);
      margin-right: 8px;
    }
    .item-price {
      font-weight: 600;
      font-family: 'SF Mono', Monaco, monospace; /* 固定字體為數字 */
    }
    .summary {
      background: var(--text-color-dark); /* 深色背景 */
      color: white;
      padding: 24px;
      border-radius: 12px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .summary-row.highlight {
      border-top: 1px solid var(--border-medium);
      margin-top: 12px;
      padding-top: 16px;
    }
    .summary-label { color: var(--text-color-light); }
    .summary-value {
      font-weight: bold;
      font-family: 'SF Mono', Monaco, monospace;
    }
    .summary-value.accent { color: var(--accent-color); }
    .summary-value.large { font-size: 24px; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-light);
      font-size: 12px;
      color: var(--text-color-light);
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
    }
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>報價單 - ${tripName}</title>
      <meta charset="UTF-8">
      <style>${style}</style>
    </head>
    <body>
      <div class="header">
        <div class="logo">TravelMaster</div>
        <div class="logo-sub">專業旅遊規劃報價單</div>
      </div>

      <div class="trip-info">
        <div class="trip-name">${tripName}</div>
        <div class="meta">
          <span>預估人數：${paxCount} 人</span>
          <span>製作日期：${currentDate}</span>
        </div>
      </div>

      <div class="items">
        <h2>成本明細</h2>
        ${items.map(item => `
          <div class="item">
            <span class="item-name">
              <span class="item-category">${item.category}</span>
              ${item.name}
            </span>
            <span class="item-price">NT$ ${item.unitPrice.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>

      <div class="summary">
        <div class="summary-row">
          <span class="summary-label">成本/人</span>
          <span class="summary-value">NT$ ${totalCost.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">利潤率</span>
          <span class="summary-value">${marginRate}%</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">售價/人</span>
          <span class="summary-value accent">NT$ ${sellingPrice.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">預估營收</span>
          <span class="summary-value">NT$ ${totalRevenue.toLocaleString()}</span>
        </div>
        <div class="summary-row highlight">
          <span class="summary-label" style="font-size: 16px; color: white;">預估利潤</span>
          <span class="summary-value accent large">NT$ ${profit.toLocaleString()}</span>
        </div>
      </div>

      <div class="footer">
        此報價單由 TravelMaster Enterprise 系統產生 | ${currentDate} ${currentTime}
      </div>
    </body>
    </html>
  `;
};

// --- QuotationBuilder 元件 ---
export default function QuotationBuilder({ config, toast, onSendQuotation }: QuotationBuilderProps) {
  // 從 Config Props 初始化內部狀態
  const [tripName, setTripName] = useState(config.initialTripName || '東京五日深度遊');
  const [paxCount, setPaxCount] = useState(config.initialPaxCount || 20);
  const [items, setItems] = useState<QuoteItem[]>(config.initialItems || [
    { id: '1', category: '機票', name: '台北-東京來回機票', unitPrice: 15000 },
    { id: '2', category: '住宿', name: '東京商務飯店 4晚', unitPrice: 12000 },
    { id: '3', category: '交通', name: '機場接送 + 市區交通', unitPrice: 3500 },
    { id: '4', category: '門票', name: '景點門票套票', unitPrice: 2500 },
    { id: '5', category: '餐飲', name: '含 8 餐', unitPrice: 4000 },
  ]);
  const [marginRate, setMarginRate] = useState(config.initialMarginRate || 15);

  // Modal and sending state
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 計算報價摘要，使用 useMemo 進行性能優化
  const { totalCost, sellingPrice, totalRevenue, profit } = useMemo(() => {
    const calculatedTotalCost = items.reduce((sum, item) => sum + item.unitPrice, 0);
    const calculatedSellingPrice = Math.round(calculatedTotalCost * (1 + marginRate / 100));
    const calculatedTotalRevenue = calculatedSellingPrice * paxCount;
    const calculatedProfit = calculatedTotalRevenue - calculatedTotalCost * paxCount;
    return {
      totalCost: calculatedTotalCost,
      sellingPrice: calculatedSellingPrice,
      totalRevenue: calculatedTotalRevenue,
      profit: calculatedProfit,
    };
  }, [items, marginRate, paxCount]);

  // 處理 PDF 列印/預覽
  const handleExportPDF = useCallback(() => {
    const printContent = generateQuotationPrintableHtml({
      tripName,
      paxCount,
      items,
      marginRate,
      totalCost,
      sellingPrice,
      totalRevenue,
      profit,
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      // Give the browser time to render before printing
      setTimeout(() => {
        printWindow.print();
      }, 250);
      toast.success('報價單已開啟列印預覽');
    } else {
      toast.error('無法開啟列印視窗，請檢查瀏覽器設定或允許彈出視窗');
    }
  }, [toast, tripName, paxCount, items, marginRate, totalCost, sellingPrice, totalRevenue, profit]);

  // 處理發送報價單
  const handleSendQuotation = useCallback(async () => {
    if (!recipientEmail) {
      toast.error('請輸入收件人 Email');
      return;
    }

    if (!recipientEmail.includes('@') || !recipientEmail.includes('.')) {
      toast.error('請輸入有效的 Email 地址');
      return;
    }

    setIsSending(true);

    try {
      if (onSendQuotation) {
        await onSendQuotation({ tripName, paxCount, sellingPrice, recipientEmail });
        toast.success(`報價單已成功發送至 ${recipientEmail}`);
        setShowSendModal(false);
        setRecipientEmail('');
      } else {
        // 如果沒有提供 onSendQuotation 回調，則模擬發送
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.info('模擬發送成功 (未提供 onSendQuotation 回調)');
        setShowSendModal(false);
        setRecipientEmail('');
      }
    } catch (error) {
      console.error('Failed to send quotation:', error);
      toast.error('發送失敗，請稍後再試');
    } finally {
      setIsSending(false);
    }
  }, [toast, onSendQuotation, recipientEmail, tripName, paxCount, sellingPrice]);


  return (
    // 標準 Card 結構，用於 Kintone Widget 的外觀一致性
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in max-w-5xl mx-auto space-y-6">
      {/* drag-handle 結構，確保元件可被拖曳 */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 drag-handle">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">報價計算器</h2>
          <p className="text-gray-500 mt-1 text-sm">建立行程報價單並管理其發送</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPDFPreview(true)}
            className="px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" /> 預覽 PDF
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            <FileText className="w-4 h-4" /> 列印 PDF
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-primary-900 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm"
          >
            <Send className="w-4 h-4" /> 發送報價
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">行程資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-2">行程名稱</label>
                <input
                  type="text"
                  id="tripName"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors text-base"
                />
              </div>
              <div>
                <label htmlFor="paxCount" className="block text-sm font-medium text-gray-700 mb-2">預估人數</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaxCount(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label="減少人數"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <input
                    type="number"
                    id="paxCount"
                    value={paxCount}
                    onChange={(e) => setPaxCount(parseInt(e.target.value) || 1)}
                    min="1"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors text-base"
                  />
                  <button
                    onClick={() => setPaxCount(prev => prev + 1)}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label="增加人數"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">成本項目</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">{item.category}</span>
                    <p className="font-semibold text-gray-900 mt-1 text-base">{item.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 font-mono">NT$ {item.unitPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">利潤設定</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={marginRate}
                onChange={(e) => setMarginRate(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:bg-primary-700 transition-colors"
              />
              <span className="w-16 text-right font-bold text-gray-900 text-base">{marginRate}%</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-primary-900 text-white p-6 rounded-2xl sticky top-6 h-fit shadow-lg">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-xl"><Calculator className="w-5 h-5" /> 報價摘要</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-primary-800">
              <span className="text-primary-300 text-sm">成本/人</span>
              <span className="font-mono font-bold text-base">NT$ {totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-primary-800">
              <span className="text-primary-300 text-sm">售價/人</span>
              <span className="font-mono font-bold text-brand-400 text-lg">NT$ {sellingPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-primary-800">
              <span className="text-primary-300 text-sm">預估營收</span>
              <span className="font-mono font-bold text-base">NT$ {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-semibold text-primary-100">預估利潤</span>
              <span className="text-2xl font-bold text-brand-400">NT$ {profit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Send Quotation Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => !isSending && setShowSendModal(false)}
        title="發送報價單"
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-2">
              收件人 Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="recipientEmail"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={isSending}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-50 disabled:cursor-not-allowed text-base"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">將發送以下報價資訊：</p>
            <p className="font-semibold text-gray-900 text-base">{tripName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>人數：{paxCount} 人</span>
              <span>售價：NT$ {sellingPrice.toLocaleString()}/人</span>
            </div>
          </div>

          <button
            onClick={handleSendQuotation}
            disabled={isSending}
            className="w-full bg-primary-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
          >
            {isSending ? (
              <>
                <ButtonLoading />
                發送中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                確認發送
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        data={{
          tripName,
          paxCount,
          items,
          marginRate,
          totalCost,
          sellingPrice,
          totalRevenue,
          profit,
        }}
        fileName={`${tripName}-報價單`}
        // 假設 PDFPreviewModal 內部會使用與 generateQuotationPrintableHtml 類似的邏輯來渲染預覽
        // 如果 PDFPreviewModal 也需要這個 HTML 字串來顯示，可以這樣傳遞
        // htmlContent={generateQuotationPrintableHtml({...})}
      />
    </div>
  );
}