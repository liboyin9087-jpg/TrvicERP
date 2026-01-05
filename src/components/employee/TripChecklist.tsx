/**
 * TripChecklist - 行前準備清單
 * 
 * 功能：
 * - 必備物品清單（可勾選）
 * - 智能提醒（依目的地/天氣）
 * - 證件到期檢查
 * - 倒數計時
 */

import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  name: string;
  category: 'documents' | 'clothes' | 'electronics' | 'toiletries' | 'medicine' | 'other';
  essential: boolean;
  checked: boolean;
  note?: string;
}

interface TripDetails {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  weather?: {
    avgTemp: number;
    conditions: string;
  };
}

const categoryIcons: Record<string, string> = {
  documents: '📄',
  clothes: '👕',
  electronics: '🔌',
  toiletries: '🧴',
  medicine: '💊',
  other: '📦',
};

const categoryNames: Record<string, string> = {
  documents: '證件文件',
  clothes: '衣物',
  electronics: '電子用品',
  toiletries: '盥洗用品',
  medicine: '藥品',
  other: '其他',
};

// 預設清單模板
const defaultChecklist: ChecklistItem[] = [
  // 證件
  { id: 'd1', name: '護照', category: 'documents', essential: true, checked: false, note: '效期需超過 6 個月' },
  { id: 'd2', name: '身分證', category: 'documents', essential: true, checked: false },
  { id: 'd3', name: '機票（電子檔）', category: 'documents', essential: true, checked: false },
  { id: 'd4', name: '飯店訂房確認', category: 'documents', essential: true, checked: false },
  { id: 'd5', name: '旅平險保單', category: 'documents', essential: false, checked: false },
  { id: 'd6', name: '信用卡', category: 'documents', essential: true, checked: false },
  { id: 'd7', name: '當地貨幣', category: 'documents', essential: true, checked: false },
  
  // 衣物
  { id: 'c1', name: '上衣 x 天數', category: 'clothes', essential: true, checked: false },
  { id: 'c2', name: '褲子/裙子', category: 'clothes', essential: true, checked: false },
  { id: 'c3', name: '內衣褲', category: 'clothes', essential: true, checked: false },
  { id: 'c4', name: '外套', category: 'clothes', essential: false, checked: false },
  { id: 'c5', name: '舒適好走的鞋', category: 'clothes', essential: true, checked: false },
  { id: 'c6', name: '拖鞋', category: 'clothes', essential: false, checked: false },
  { id: 'c7', name: '睡衣', category: 'clothes', essential: false, checked: false },
  
  // 電子用品
  { id: 'e1', name: '手機充電器', category: 'electronics', essential: true, checked: false },
  { id: 'e2', name: '行動電源', category: 'electronics', essential: true, checked: false },
  { id: 'e3', name: '萬用轉接頭', category: 'electronics', essential: true, checked: false },
  { id: 'e4', name: '相機', category: 'electronics', essential: false, checked: false },
  { id: 'e5', name: 'WiFi 分享器', category: 'electronics', essential: false, checked: false },
  { id: 'e6', name: '耳機', category: 'electronics', essential: false, checked: false },
  
  // 盥洗用品
  { id: 't1', name: '牙刷牙膏', category: 'toiletries', essential: true, checked: false },
  { id: 't2', name: '洗面乳', category: 'toiletries', essential: false, checked: false },
  { id: 't3', name: '保養品', category: 'toiletries', essential: false, checked: false },
  { id: 't4', name: '防曬乳', category: 'toiletries', essential: false, checked: false },
  { id: 't5', name: '面紙/濕紙巾', category: 'toiletries', essential: true, checked: false },
  
  // 藥品
  { id: 'm1', name: '個人常備藥', category: 'medicine', essential: false, checked: false },
  { id: 'm2', name: '暈車藥', category: 'medicine', essential: false, checked: false },
  { id: 'm3', name: '腸胃藥', category: 'medicine', essential: false, checked: false },
  { id: 'm4', name: '感冒藥', category: 'medicine', essential: false, checked: false },
  { id: 'm5', name: 'OK 繃', category: 'medicine', essential: false, checked: false },
  
  // 其他
  { id: 'o1', name: '雨傘/雨衣', category: 'other', essential: false, checked: false },
  { id: 'o2', name: '環保袋', category: 'other', essential: false, checked: false },
  { id: 'o3', name: '頸枕', category: 'other', essential: false, checked: false },
  { id: 'o4', name: '零食', category: 'other', essential: false, checked: false },
];

export default function TripChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('tripChecklist');
    return saved ? JSON.parse(saved) : defaultChecklist;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showOnlyUnchecked, setShowOnlyUnchecked] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>('other');

  // Mock 行程資訊
  const tripDetails: TripDetails = {
    name: '2024 日本京都員工旅遊',
    destination: '日本京都',
    startDate: '2024-03-15',
    endDate: '2024-03-19',
    weather: {
      avgTemp: 15,
      conditions: '晴時多雲',
    },
  };

  // 計算倒數天數
  const daysUntilTrip = Math.ceil(
    (new Date(tripDetails.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // 儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('tripChecklist', JSON.stringify(checklist));
  }, [checklist]);

  // 勾選項目
  const toggleItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // 新增項目
  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      name: newItemName,
      category: newItemCategory as any,
      essential: false,
      checked: false,
    };
    
    setChecklist(prev => [...prev, newItem]);
    setNewItemName('');
    setShowAddModal(false);
  };

  // 刪除項目
  const deleteItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  // 重置清單
  const resetChecklist = () => {
    if (confirm('確定要重置清單嗎？所有勾選將被清除。')) {
      setChecklist(defaultChecklist);
    }
  };

  // 統計
  const totalItems = checklist.length;
  const checkedItems = checklist.filter(item => item.checked).length;
  const essentialUnchecked = checklist.filter(item => item.essential && !item.checked).length;
  const progress = Math.round((checkedItems / totalItems) * 100);

  // 過濾清單
  const filteredChecklist = checklist.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (showOnlyUnchecked && item.checked) return false;
    return true;
  });

  // 按類別分組
  const groupedChecklist = filteredChecklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 頂部資訊 */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
        <h1 className="text-xl font-bold">{tripDetails.name}</h1>
        <p className="text-emerald-100 mt-1">📍 {tripDetails.destination}</p>
        
        {/* 倒數計時 */}
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-xl p-4 text-center flex-1">
            <p className="text-4xl font-bold">{daysUntilTrip > 0 ? daysUntilTrip : 0}</p>
            <p className="text-sm text-emerald-100">天後出發</p>
          </div>
          <div className="bg-white/20 rounded-xl p-4 text-center flex-1">
            <p className="text-4xl font-bold">{tripDetails.weather?.avgTemp}°</p>
            <p className="text-sm text-emerald-100">{tripDetails.weather?.conditions}</p>
          </div>
        </div>
      </header>

      {/* 進度條 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">打包進度</span>
          <span className="text-sm text-gray-500">{checkedItems}/{totalItems} 項目</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-green-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {essentialUnchecked > 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ 還有 {essentialUnchecked} 項必備物品未勾選
          </p>
        )}
        {progress === 100 && (
          <p className="text-sm text-green-600 mt-2">
            ✅ 太棒了！所有物品都準備好了！
          </p>
        )}
      </div>

      {/* 智能提醒 */}
      {tripDetails.weather && (
        <div className="mx-4 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-medium text-blue-800 flex items-center gap-2">
            <span>💡</span> 智能建議
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-700">
            {tripDetails.weather.avgTemp < 10 && (
              <li>• 天氣偏冷，建議攜帶保暖外套、圍巾、手套</li>
            )}
            {tripDetails.weather.avgTemp > 25 && (
              <li>• 天氣炎熱，記得帶防曬乳和遮陽帽</li>
            )}
            {tripDetails.weather.conditions.includes('雨') && (
              <li>• 預報有雨，建議攜帶雨具</li>
            )}
            <li>• 日本室內冷氣強，建議帶薄外套</li>
            <li>• 日本插座為兩腳扁插（Type A），電壓 100V</li>
          </ul>
        </div>
      )}

      {/* 篩選選項 */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filterCategory === null
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          全部
        </button>
        {Object.keys(categoryNames).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterCategory === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {categoryIcons[cat]} {categoryNames[cat]}
          </button>
        ))}
      </div>

      {/* 只顯示未勾選 */}
      <div className="px-4 mt-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showOnlyUnchecked}
            onChange={(e) => setShowOnlyUnchecked(e.target.checked)}
            className="rounded"
          />
          只顯示未勾選項目
        </label>
      </div>

      {/* 清單 */}
      <div className="p-4 space-y-6">
        {Object.entries(groupedChecklist).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-xl">{categoryIcons[category]}</span>
              <span className="font-medium text-gray-800">{categoryNames[category]}</span>
              <span className="text-sm text-gray-500">
                ({items.filter(i => i.checked).length}/{items.length})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex items-center gap-3 transition-all ${
                    item.checked ? 'bg-gray-50' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.checked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : item.essential
                        ? 'border-amber-400'
                        : 'border-gray-300'
                    }`}
                  >
                    {item.checked && '✓'}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {item.name}
                      {item.essential && !item.checked && (
                        <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          必備
                        </span>
                      )}
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                    )}
                  </div>
                  {item.id.startsWith('custom-') && (
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部操作列 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        <button
          onClick={resetChecklist}
          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
        >
          🔄 重置
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          ➕ 新增項目
        </button>
      </div>

      {/* 新增項目 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-800">新增項目</h2>
            
            <input
              type="text"
              placeholder="項目名稱"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full mt-4 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">選擇類別</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryNames).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => setNewItemCategory(key)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      newItemCategory === key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {categoryIcons[key]} {name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={addItem}
                disabled={!newItemName.trim()}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  newItemName.trim()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
