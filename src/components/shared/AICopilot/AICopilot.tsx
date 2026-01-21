import React, { useState } from 'react';
import { AICopilotChat } from './AICopilotChat';
import { AISuggestion, AIContext } from '@/services/aiCopilotService';
import { Card } from '../../ui/Card';

interface AICopilotProps {
  tourInfo?: Record<string, any>;
  className?: string;
}

export function AICopilot({ tourInfo = {}, className }: AICopilotProps) {
  const [itineraryData, setItineraryData] = useState<Record<string, any>[]>([
    { '天數': 'Day 1', '時間': '09:00', '行程內容': '淺草寺參拜', '停留時間': '2小時', '餐食': '--', '備註': '' },
    { '天數': 'Day 1', '時間': '14:00', '行程內容': '東京迪士尼', '停留時間': '8小時', '餐食': '團體午餐', '備註': '' },
    { '天數': 'Day 2', '時間': '10:00', '行程內容': '富士山五合目', '停留時間': '3小時', '餐食': '--', '備註': '' },
  ]);
  
  const [costData, setCostData] = useState<Record<string, any>[]>([
    { '項目': '機票', '單價': 15000, '人數': 30, '小計': 450000, '幣別': 'TWD', '備註': '桃園-成田' },
    { '項目': '住宿', '單價': 3000, '人數': 30, '小計': 90000, '幣別': 'TWD', '備註': '雙人房' },
    { '項目': '門票', '單價': 2000, '人數': 30, '小計': 60000, '幣別': 'TWD', '備註': '迪士尼門票' },
  ]);
  
  const [passengersData, setPassengersData] = useState<Record<string, any>[]>([
    { '姓名': '王小明', '英文姓名': 'WANG XIAO MING', '護照號碼': 'T123456789', '特殊需求': '無', '房型': '雙人房' },
    { '姓名': '李小華', '英文姓名': 'LI XIAO HUA', '護照號碼': 'T987654321', '特殊需求': '素食', '房型': '雙人房' },
  ]);
  
  const [activeTab, setActiveTab] = useState<'itinerary' | 'cost' | 'passengers' | 'marketing'>('itinerary');
  const [marketingText, setMarketingText] = useState('');

  const context: AIContext = {
    tourInfo: {
      '團號': 'JP20240101',
      '團名': '東京迪士尼5日遊',
      '出發日': '2024-01-15',
      '回程日': '2024-01-19',
      '人數': 30,
      '領隊': '張小華',
      '目的地': '東京',
      ...tourInfo
    },
    itinerary: itineraryData,
    cost: costData,
    passengers: passengersData
  };

  const handleSuggestionExecute = (suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case 'add_row':
        if (suggestion.target === 'itinerary') {
          setItineraryData(prev => [...prev, suggestion.data]);
          setActiveTab('itinerary');
        } else if (suggestion.target === 'cost') {
          setCostData(prev => [...prev, suggestion.data]);
          setActiveTab('cost');
        }
        break;
      
      case 'add_cost':
        setCostData(prev => [...prev, suggestion.data]);
        setActiveTab('cost');
        break;
      
      case 'set_marketing_text':
        setMarketingText(suggestion.data.text || '');
        setActiveTab('marketing');
        break;
      
      case 'update_row':
      case 'delete_row':
        // TODO: 實現更新和刪除功能
        console.log('TODO: 實現', suggestion.type, suggestion);
        break;
    }
  };

  const renderDataTable = () => {
    const data = activeTab === 'itinerary' ? itineraryData : 
                 activeTab === 'cost' ? costData : 
                 activeTab === 'passengers' ? passengersData : [];

    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-neutral-500">
          暫無資料
        </div>
      );
    }

    const columns = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {columns.map((col) => (
                <th key={col} className="text-left p-3 font-semibold text-sm text-neutral-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                {columns.map((col) => (
                  <td key={col} className="p-3 text-sm text-neutral-700">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMarketingEditor = () => {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleSuggestionExecute({
              type: 'set_marketing_text',
              target: 'marketing',
              data: { text: generateMarketingText('B2C') },
              description: '生成 B2C 文案'
            })}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
          >
            B2C 文案
          </button>
          <button
            onClick={() => handleSuggestionExecute({
              type: 'set_marketing_text',
              target: 'marketing',
              data: { text: generateMarketingText('B2B') },
              description: '生成 B2B 文案'
            })}
            className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm"
          >
            B2B 文案
          </button>
          <button
            onClick={() => handleSuggestionExecute({
              type: 'set_marketing_text',
              target: 'marketing',
              data: { text: generateMarketingText('企業') },
              description: '生成企業提案'
            })}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm"
          >
            企業提案
          </button>
        </div>
        
        <textarea
          value={marketingText}
          onChange={(e) => setMarketingText(e.target.value)}
          placeholder="點擊上方按鈕生成文案，或直接輸入..."
          className="w-full h-64 p-3 border border-neutral-300 rounded-md resize-none"
        />
      </div>
    );
  };

  const generateMarketingText = (type: 'B2C' | 'B2B' | '企業'): string => {
    const tourName = context.tourInfo['團名'] || '日本精選之旅';
    const departureDate = context.tourInfo['出發日'] || '';
    
    switch (type) {
      case 'B2C':
        return `✈️ ${tourName}\n\n🗓 出發日期：${departureDate}\n\n【行程亮點】\n✨ 淺草寺參拜\n✨ 東京迪士尼樂園\n✨ 富士山五合目\n\n【團費包含】\n✅ 來回機票（含稅金）\n✅ 全程住宿\n✅ 行程表所列景點門票\n✅ 500萬履約責任險\n\n📞 立即報名，座位有限！\n\n#日本旅遊 #親子旅遊 #東京`;
      
      case 'B2B':
        return `【同業收客】${tourName}\n\n📅 出發日期：${departureDate}\n👥 成團人數：30人\n💰 同業價：歡迎來電詢價\n\n✨ 產品特色：\n• 無乘車進店、純玩團\n• 行程亮點：淺草寺、迪士尼、富士山\n• 全程四星住宿\n\n📞 聯絡窗口：業務部\n🔖 團號：${context.tourInfo['團號'] || ''}\n\n#同業收客 #保證出團 #日本團`;
      
      case '企業':
        return `【企業旅遊提案】${tourName}\n\n致：貴公司人資部/福委會\n\n感謝貴公司考慮本次員工旅遊活動。我們為貴公司量身規劃以下行程：\n\n📋 行程規劃\n• 淺草寺參拜 - 體驗日本文化\n• 東京迪士尼 - 團隊同樂\n• 富士山五合目 - 自然風光\n\n💎 服務特色\n• 專人規劃，彈性客製\n• 全程專屬領隊服務\n• 可安排 Team Building 活動\n• 統一發票，便於核銷\n\n📞 專案聯絡：業務部 王小明\n📧 Email: service@trvic.com`;
      
      default:
        return '';
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 h-full ${className}`}>
      {/* 左側：資料編輯區 */}
      <div className="flex flex-col">
        <Card title="ERP 資料編輯器" className="flex-1">
          {/* Tab 切換 */}
          <div className="flex border-b border-neutral-200 mb-4">
            {[
              { key: 'itinerary', label: '📅 行程表' },
              { key: 'cost', label: '💰 成本表' },
              { key: 'passengers', label: '👥 團員名單' },
              { key: 'marketing', label: '📝 行銷文案' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-900 text-primary-900'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 內容區域 */}
          <div className="flex-1 min-h-0">
            {activeTab === 'marketing' ? renderMarketingEditor() : renderDataTable()}
          </div>
        </Card>
      </div>

      {/* 右側：AI Copilot 聊天區 */}
      <div className="flex flex-col">
        <AICopilotChat
          context={context}
          onSuggestionExecute={handleSuggestionExecute}
          className="flex-1"
        />
      </div>
    </div>
  );
}
