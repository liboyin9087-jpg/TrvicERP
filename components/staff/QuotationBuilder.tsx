import React, { useState, useMemo, memo } from 'react';
import { Calculator, Plus, Minus, FileText, Send, DollarSign, Mail, Eye } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { ButtonLoading } from '../shared/Loading';
import { useToast } from '@/store/useToastStore';
import PDFPreviewModal from '../shared/PDFPreviewModal';
import { useCreateQuotation, useQuotationPreview } from '@/modules/quotations/hooks/useQuotations';
import type { QuotationItem, ItemCategory, CostType, Currency } from '@/core/types/quotation';
import { ItemCategory as CoreItemCategory, CostType as CoreCostType, Currency as CoreCurrency } from '@/core/types/quotation';
import { AuthService } from '@/core/services/authService';

interface QuoteItem {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
}

/**
 * Convert QuoteItem to QuotationItem
 */
function convertQuoteItemToQuotationItem(item: QuoteItem): QuotationItem {
  const categoryMap: Record<string, ItemCategory> = {
    '機票': CoreItemCategory.FLIGHT,
    '住宿': CoreItemCategory.HOTEL,
    '交通': CoreItemCategory.TRANSPORT,
    '門票': CoreItemCategory.TICKET,
    '餐飲': CoreItemCategory.MEAL,
  };

  return {
    id: item.id,
    category: categoryMap[item.category] || CoreItemCategory.OTHER,
    name: item.name,
    costType: CoreCostType.PER_PAX, // Default to per_pax for simplicity
    unitCost: item.unitPrice as any,
    quantity: 1,
    currency: CoreCurrency.TWD,
    description: item.name,
  };
}

interface QuotationBuilderProps {
  initialTripName?: string;
  initialPaxCount?: number;
  initialMarginRate?: number;
}

const QuotationBuilder: React.FC<QuotationBuilderProps> = memo(({
  initialTripName = '東京五日深度遊',
  initialPaxCount = 20,
  initialMarginRate = 15
}) => {
  const toast = useToast();
  const { createQuotation, loading: createLoading } = useCreateQuotation();
  const { calculatePreview } = useQuotationPreview();

  const [tripName, setTripName] = useState(initialTripName);
  const [paxCount, setPaxCount] = useState(initialPaxCount);
  const [items] = useState<QuoteItem[]>([
    { id: '1', category: '機票', name: '台北-東京來回機票', unitPrice: 15000 },
    { id: '2', category: '住宿', name: '東京商務飯店 4晚', unitPrice: 12000 },
    { id: '3', category: '交通', name: '機場接送 + 市區交通', unitPrice: 3500 },
    { id: '4', category: '門票', name: '景點門票套票', unitPrice: 2500 },
    { id: '5', category: '餐飲', name: '含 8 餐', unitPrice: 4000 },
  ]);
  const [marginRate, setMarginRate] = useState(initialMarginRate);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Use service layer calculation for consistency
  const { totalCost, sellingPrice, totalRevenue, profit } = useMemo(() => {
    const quotationItems = items.map(convertQuoteItemToQuotationItem);
    const preview = calculatePreview(quotationItems, paxCount, marginRate);
    
    return {
      totalCost: preview.costBreakdown.total,
      sellingPrice: preview.sellingPrice,
      totalRevenue: preview.totalAmount,
      profit: preview.totalAmount - (preview.costBreakdown.total * paxCount),
    };
  }, [items, marginRate, paxCount, calculatePreview]);

  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>報價單 - ${tripName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans TC', sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          .header {
            border-bottom: 3px solid #000;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .logo-sub {
            color: #666;
            font-size: 14px;
          }
          .trip-info {
            background: #f5f5f5;
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
            color: #666;
            font-size: 14px;
          }
          h2 {
            font-size: 16px;
            color: #333;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
          }
          .items { margin-bottom: 32px; }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .item-name { font-weight: 500; }
          .item-category {
            display: inline-block;
            background: #e5e5e5;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: #666;
            margin-right: 8px;
          }
          .item-price {
            font-weight: 600;
            font-family: 'SF Mono', Monaco, monospace;
          }
          .summary {
            background: #1a1a1a;
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
            border-top: 1px solid #333;
            margin-top: 12px;
            padding-top: 16px;
          }
          .summary-label { color: #888; }
          .summary-value {
            font-weight: bold;
            font-family: 'SF Mono', Monaco, monospace;
          }
          .summary-value.accent { color: #06c167; }
          .summary-value.large { font-size: 24px; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #888;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TrvicERP</div>
          <div class="logo-sub">專業旅遊規劃報價單</div>
        </div>

        <div class="trip-info">
          <div class="trip-name">${tripName}</div>
          <div class="meta">
            <span>預估人數：${paxCount} 人</span>
            <span>製作日期：${new Date().toLocaleDateString('zh-TW')}</span>
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
          此報價單由 TrvicERP 系統產生 | ${new Date().toLocaleString('zh-TW')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
      toast.success('報價單已開啟列印預覽');
    } else {
      toast.error('無法開啟列印視窗，請檢查瀏覽器設定');
    }
  };

  const handleSendQuotation = async () => {
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
      // Get current user for quotation creation
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        toast.error('請先登入');
        setIsSending(false);
        return;
      }

      // Convert items to QuotationItem format
      const quotationItems = items.map(convertQuoteItemToQuotationItem);

      // Create quotation via service layer
      const result = await createQuotation({
        customerId: 'temp_customer' as any, // TODO: Get from customer selection
        customerName: recipientEmail.split('@')[0], // Temporary: use email prefix as name
        sessionId: null,
        items: quotationItems,
        profitMargin: marginRate as any,
        paxCount,
        validDays: 30,
        currency: CoreCurrency.TWD,
        notes: `報價單：${tripName}`,
      });

      if (result.success) {
        toast.success(`報價單已成功建立並發送至 ${recipientEmail}`);
        setShowSendModal(false);
        setRecipientEmail('');
      } else {
        toast.error('建立報價失敗，請稍後再試');
      }
    } catch (error) {
      toast.error('發送失敗，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  const handlePaxCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPaxCount(isNaN(value) ? 1 : Math.max(1, value));
  };

  const handleMarginRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarginRate(parseInt(e.target.value));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in" role="main" aria-label="報價計算器">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">報價計算器</h1>
          <p className="text-gray-500 mt-1">建立行程報價單</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPDFPreview(true)}
            className="px-4 py-2 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
            aria-label="預覽PDF"
          >
            <Eye className="w-4 h-4" /> 預覽 PDF
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
            aria-label="列印PDF"
          >
            <FileText className="w-4 h-4" /> 列印 PDF
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-black text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors"
            aria-label="發送報價"
          >
            <Send className="w-4 h-4" /> 發送報價
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">行程資訊</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-2">行程名稱</label>
                <input
                  id="tripName"
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  aria-label="行程名稱"
                />
              </div>
              <div>
                <label htmlFor="paxCount" className="block text-sm font-medium text-gray-700 mb-2">預估人數</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaxCount(Math.max(1, paxCount - 1))}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                    aria-label="減少人數"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="paxCount"
                    type="number"
                    value={paxCount}
                    onChange={handlePaxCountChange}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-black"
                    aria-label="預估人數"
                  />
                  <button
                    onClick={() => setPaxCount(paxCount + 1)}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                    aria-label="增加人數"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">成本項目</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl" aria-label={`${item.category}項目`}>
                  <div className="flex-1">
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">{item.category}</span>
                    <p className="font-semibold text-gray-900 mt-1">{item.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">NT$ {item.unitPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">利潤設定</h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={marginRate}
                onChange={handleMarginRateChange}
                className="flex-1"
                aria-label="利潤率滑桿"
              />
              <span className="w-16 text-right font-bold text-gray-900">{marginRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-black text-white p-6 rounded-2xl sticky top-6 h-fit">
          <h2 className="font-bold mb-6 flex items-center gap-2"><Calculator className="w-5 h-5" /> 報價摘要</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
              <span className="text-gray-400">成本/人</span>
              <span className="font-mono font-bold">NT$ {totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
              <span className="text-gray-400">售價/人</span>
              <span className="font-mono font-bold text-brand-400">NT$ {sellingPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
              <span className="text-gray-400">預估營收</span>
              <span className="font-mono font-bold">NT$ {totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-semibold">預估利潤</span>
              <span className="text-2xl font-bold text-brand-400">NT$ {profit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

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
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={isSending}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:cursor-not-allowed"
                aria-label="收件人Email"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">將發送以下報價資訊：</p>
            <p className="font-semibold text-gray-900">{tripName}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>人數：{paxCount} 人</span>
              <span>售價：NT$ {sellingPrice.toLocaleString()}/人</span>
            </div>
          </div>

          <button
            onClick={handleSendQuotation}
            disabled={isSending}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label="確認發送報價單"
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
        fileName="報價單"
      />
    </div>
  );
});

export default QuotationBuilder;