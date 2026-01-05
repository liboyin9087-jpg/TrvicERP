/**
 * TripVoting - 員工投票系統
 * 
 * 功能：
 * - 餐廳投票
 * - 活動選擇
 * - 匿名投票
 * - 即時結果
 */

import React, { useState, useEffect } from 'react';

interface VotingOption {
  id: string;
  title: string;
  description?: string;
  image?: string;
  votes: number;
  voters?: string[];
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  type: 'single' | 'multiple';
  anonymous: boolean;
  deadline: string;
  status: 'active' | 'closed';
  options: VotingOption[];
  totalVotes: number;
  userVoted: string | null;
  createdBy: string;
}

export default function TripVoting() {
  const [activeTab, setActiveTab] = useState<'active' | 'results'>('active');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Mock 投票資料
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 'poll-1',
      title: '第三天晚餐選擇',
      description: '大家想吃什麼？請投票決定！',
      type: 'single',
      anonymous: false,
      deadline: '2024-03-16T18:00:00',
      status: 'active',
      totalVotes: 35,
      userVoted: null,
      createdBy: '王領隊',
      options: [
        {
          id: 'opt-1',
          title: '🍣 壽司大',
          description: '築地市場知名壽司店，新鮮海鮮',
          image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300',
          votes: 15,
        },
        {
          id: 'opt-2',
          title: '🍜 一蘭拉麵',
          description: '博多豚骨拉麵，24小時營業',
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300',
          votes: 12,
        },
        {
          id: 'opt-3',
          title: '🥩 敘敘苑燒肉',
          description: '頂級和牛燒肉，需預約',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300',
          votes: 8,
        },
      ],
    },
    {
      id: 'poll-2',
      title: '自由活動時間分配',
      description: '第四天下午，大家希望怎麼安排？',
      type: 'single',
      anonymous: true,
      deadline: '2024-03-15T12:00:00',
      status: 'active',
      totalVotes: 42,
      userVoted: null,
      createdBy: '李導遊',
      options: [
        {
          id: 'opt-a',
          title: '🛍️ 心齋橋購物 (3小時)',
          description: '藥妝、服飾、電器應有盡有',
          votes: 20,
        },
        {
          id: 'opt-b',
          title: '🎮 電器街探索 (3小時)',
          description: '秋葉原風格，動漫周邊',
          votes: 10,
        },
        {
          id: 'opt-c',
          title: '🏯 大阪城散步 (2小時)',
          description: '歷史名勝，櫻花季絕美',
          votes: 12,
        },
      ],
    },
    {
      id: 'poll-3',
      title: '旅遊紀念品團購',
      description: '想一起團購什麼？可複選！',
      type: 'multiple',
      anonymous: false,
      deadline: '2024-03-17T20:00:00',
      status: 'active',
      totalVotes: 58,
      userVoted: null,
      createdBy: '福委會',
      options: [
        { id: 'g-1', title: '🍪 白色戀人餅乾', votes: 25 },
        { id: 'g-2', title: '🍫 ROYCE 生巧克力', votes: 18 },
        { id: 'g-3', title: '🧴 藥妝福袋', votes: 8 },
        { id: 'g-4', title: '🎎 日本公仔', votes: 7 },
      ],
    },
  ]);

  // 投票
  const handleVote = (pollId: string, optionId: string) => {
    setIsVoting(true);
    
    // 模擬 API 呼叫
    setTimeout(() => {
      setPolls(prev => prev.map(poll => {
        if (poll.id !== pollId) return poll;
        
        return {
          ...poll,
          userVoted: optionId,
          totalVotes: poll.totalVotes + 1,
          options: poll.options.map(opt => ({
            ...opt,
            votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
          })),
        };
      }));
      setIsVoting(false);
    }, 800);
  };

  // 計算剩餘時間
  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    if (diff <= 0) return '已截止';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `剩餘 ${Math.floor(hours / 24)} 天`;
    }
    return `剩餘 ${hours} 小時 ${minutes} 分`;
  };

  // 計算百分比
  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 頂部 */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
        <h1 className="text-xl font-bold">🗳️ 投票中心</h1>
        <p className="text-purple-100 mt-1">參與決策，讓旅程更精彩！</p>
        
        {/* Tab 切換 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-white text-purple-600'
                : 'bg-purple-500/30 text-white'
            }`}
          >
            進行中
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'results'
                ? 'bg-white text-purple-600'
                : 'bg-purple-500/30 text-white'
            }`}
          >
            已結束
          </button>
        </div>
      </header>

      {/* 投票列表 */}
      <div className="p-4 space-y-4">
        {polls
          .filter(poll => activeTab === 'active' ? poll.status === 'active' : poll.status === 'closed')
          .map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              isVoting={isVoting}
              getTimeRemaining={getTimeRemaining}
              getPercentage={getPercentage}
            />
          ))}
        
        {polls.filter(poll => activeTab === 'active' ? poll.status === 'active' : poll.status === 'closed').length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl">📭</span>
            <p className="mt-2">目前沒有{activeTab === 'active' ? '進行中的' : '已結束的'}投票</p>
          </div>
        )}
      </div>

      {/* 快速投票入口 */}
      <div className="fixed bottom-4 right-4">
        <button className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-purple-700 transition-all active:scale-95">
          ➕
        </button>
      </div>
    </div>
  );
}

// 投票卡片組件
function PollCard({
  poll,
  onVote,
  isVoting,
  getTimeRemaining,
  getPercentage,
}: {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  isVoting: boolean;
  getTimeRemaining: (deadline: string) => string;
  getPercentage: (votes: number, total: number) => number;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const hasVoted = poll.userVoted !== null;
  const timeRemaining = getTimeRemaining(poll.deadline);
  const isExpired = timeRemaining === '已截止';

  const handleSubmitVote = () => {
    if (selectedOption && !hasVoted && !isExpired) {
      onVote(poll.id, selectedOption);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* 標題區 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-gray-800">{poll.title}</h2>
            {poll.description && (
              <p className="text-sm text-gray-600 mt-1">{poll.description}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full ${
              isExpired 
                ? 'bg-gray-100 text-gray-600' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {timeRemaining}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>👤 {poll.createdBy}</span>
          <span>📊 {poll.totalVotes} 票</span>
          {poll.anonymous && <span>🔒 匿名</span>}
          {poll.type === 'multiple' && <span>✅ 可複選</span>}
        </div>
      </div>

      {/* 選項區 */}
      <div className="p-4 space-y-3">
        {poll.options.map(option => {
          const percentage = getPercentage(option.votes, poll.totalVotes);
          const isSelected = selectedOption === option.id || poll.userVoted === option.id;
          const isWinning = option.votes === Math.max(...poll.options.map(o => o.votes)) && option.votes > 0;

          return (
            <div
              key={option.id}
              onClick={() => !hasVoted && !isExpired && setSelectedOption(option.id)}
              className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                hasVoted || isExpired
                  ? 'cursor-default'
                  : isSelected
                  ? 'border-purple-500'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {/* 進度條背景 */}
              {(hasVoted || isExpired) && (
                <div
                  className={`absolute inset-0 transition-all duration-500 ${
                    isWinning ? 'bg-purple-100' : 'bg-gray-100'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative p-4 flex items-center gap-4">
                {/* 圖片（如果有） */}
                {option.image && (
                  <img
                    src={option.image}
                    alt={option.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}

                {/* 選項內容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{option.title}</p>
                    {isWinning && (hasVoted || isExpired) && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        領先
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                  )}
                </div>

                {/* 投票指示 / 百分比 */}
                <div className="text-right">
                  {hasVoted || isExpired ? (
                    <div>
                      <p className="text-lg font-bold text-purple-600">{percentage}%</p>
                      <p className="text-xs text-gray-500">{option.votes} 票</p>
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 投票按鈕 */}
      {!hasVoted && !isExpired && (
        <div className="p-4 pt-0">
          <button
            onClick={handleSubmitVote}
            disabled={!selectedOption || isVoting}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              selectedOption && !isVoting
                ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-98'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isVoting ? '投票中...' : '確認投票'}
          </button>
        </div>
      )}

      {/* 已投票提示 */}
      {hasVoted && (
        <div className="px-4 pb-4">
          <div className="text-center text-sm text-green-600 bg-green-50 py-2 rounded-lg">
            ✅ 您已完成投票
          </div>
        </div>
      )}
    </div>
  );
}
