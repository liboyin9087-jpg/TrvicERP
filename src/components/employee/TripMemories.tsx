/**
 * TripMemories - 旅後回憶與問卷
 * 
 * 功能：
 * - 共享相簿
 * - 滿意度問卷
 * - AI 生成旅遊回憶錄
 * - 感謝卡片
 */

import React, { useState } from 'react';

// ============================================
// 共享相簿組件
// ============================================

interface Photo {
  id: string;
  url: string;
  uploader: string;
  avatar: string;
  caption?: string;
  location?: string;
  timestamp: string;
  likes: number;
  liked: boolean;
}

export function SharedAlbum() {
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
      uploader: '陳小明',
      avatar: '👨‍💻',
      caption: '金閣寺的倒影太美了！',
      location: '金閣寺',
      timestamp: 'Day 2',
      likes: 24,
      liked: false,
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600',
      uploader: '林美玲',
      avatar: '👩‍💼',
      caption: '嵐山竹林，彷彿走進另一個世界',
      location: '嵐山竹林',
      timestamp: 'Day 2',
      likes: 31,
      liked: true,
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600',
      uploader: '張大偉',
      avatar: '👨‍💼',
      caption: '清水舞台眺望京都市區',
      location: '清水寺',
      timestamp: 'Day 3',
      likes: 28,
      liked: false,
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600',
      uploader: '黃小華',
      avatar: '👩‍🏫',
      caption: '伏見稻荷大社的千本鳥居',
      location: '伏見稻荷大社',
      timestamp: 'Day 4',
      likes: 35,
      liked: true,
    },
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const toggleLike = (photoId: string) => {
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId
          ? {
              ...photo,
              liked: !photo.liked,
              likes: photo.liked ? photo.likes - 1 : photo.likes + 1,
            }
          : photo
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 頂部 */}
      <header className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6">
        <h1 className="text-xl font-bold">📸 旅遊相簿</h1>
        <p className="text-pink-100 mt-1">2024 日本京都員工旅遊</p>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-pink-100">{photos.length} 張照片</p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/20' : ''}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-lg ${viewMode === 'timeline' ? 'bg-white/20' : ''}`}
            >
              ≡
            </button>
          </div>
        </div>
      </header>

      {/* 照片網格 */}
      {viewMode === 'grid' ? (
        <div className="p-2 grid grid-cols-2 gap-2">
          {photos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                <p className="text-white/70 text-xs">❤️ {photo.likes}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {photos.map(photo => (
            <div key={photo.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="p-3 flex items-center gap-3">
                <span className="text-2xl">{photo.avatar}</span>
                <div>
                  <p className="font-medium text-gray-800">{photo.uploader}</p>
                  <p className="text-xs text-gray-500">📍 {photo.location} · {photo.timestamp}</p>
                </div>
              </div>
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full aspect-video object-cover"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="p-3">
                {photo.caption && <p className="text-gray-800">{photo.caption}</p>}
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => toggleLike(photo.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      photo.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    {photo.liked ? '❤️' : '🤍'} <span className="text-sm">{photo.likes}</span>
                  </button>
                  <button className="text-gray-500 hover:text-blue-500">
                    💬 留言
                  </button>
                  <button className="text-gray-500 hover:text-green-500">
                    📤 分享
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上傳按鈕 */}
      <div className="fixed bottom-4 right-4">
        <button className="w-14 h-14 bg-pink-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-pink-700 transition-all">
          📷
        </button>
      </div>

      {/* 照片詳情 Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="w-full rounded-xl"
            />
            <div className="mt-4 text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedPhoto.avatar}</span>
                <div>
                  <p className="font-medium">{selectedPhoto.uploader}</p>
                  <p className="text-sm text-gray-400">📍 {selectedPhoto.location}</p>
                </div>
              </div>
              {selectedPhoto.caption && (
                <p className="mt-3">{selectedPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 滿意度問卷組件
// ============================================

interface SurveyQuestion {
  id: string;
  type: 'rating' | 'choice' | 'text' | 'nps';
  question: string;
  options?: string[];
  required: boolean;
}

export function FeedbackSurvey() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const questions: SurveyQuestion[] = [
    {
      id: 'overall',
      type: 'rating',
      question: '整體而言，您對這次員工旅遊的滿意度如何？',
      required: true,
    },
    {
      id: 'accommodation',
      type: 'rating',
      question: '您對住宿安排的滿意度如何？',
      required: true,
    },
    {
      id: 'meals',
      type: 'rating',
      question: '您對餐食安排的滿意度如何？',
      required: true,
    },
    {
      id: 'itinerary',
      type: 'rating',
      question: '您對行程安排的滿意度如何？',
      required: true,
    },
    {
      id: 'guide',
      type: 'rating',
      question: '您對領隊/導遊服務的滿意度如何？',
      required: true,
    },
    {
      id: 'highlight',
      type: 'choice',
      question: '這次旅程中，您最喜歡的部分是？',
      options: ['景點參觀', '美食體驗', '購物時間', '團隊活動', '自由活動', '其他'],
      required: true,
    },
    {
      id: 'improvement',
      type: 'text',
      question: '您認為哪些地方可以改進？',
      required: false,
    },
    {
      id: 'nps',
      type: 'nps',
      question: '您會向同事推薦參加公司的員工旅遊嗎？',
      required: true,
    },
    {
      id: 'comments',
      type: 'text',
      question: '其他建議或感想（選填）',
      required: false,
    },
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const setAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    return answer !== undefined && answer !== '';
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Survey answers:', answers);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800">感謝您的回饋！</h1>
          <p className="text-gray-600 mt-2">
            您的意見對我們非常重要，我們會持續改進，讓下次旅程更加精彩！
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部 */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className={`text-gray-600 ${currentStep === 0 ? 'invisible' : ''}`}>
            ← 上一題
          </button>
          <span className="text-sm text-gray-500">
            {currentStep + 1} / {questions.length}
          </span>
          <div className="w-16" />
        </div>
        
        {/* 進度條 */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 問題區 */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {currentQuestion.question}
          {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
        </h2>

        {/* 評分題 */}
        {currentQuestion.type === 'rating' && (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => setAnswer(rating)}
                className={`w-14 h-14 rounded-xl text-2xl transition-all ${
                  answers[currentQuestion.id] === rating
                    ? 'bg-emerald-500 text-white scale-110'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {rating <= 2 ? '😞' : rating === 3 ? '😐' : rating === 4 ? '😊' : '🤩'}
              </button>
            ))}
          </div>
        )}

        {/* NPS 題 */}
        {currentQuestion.type === 'nps' && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>完全不會</span>
              <span>非常願意</span>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <button
                  key={score}
                  onClick={() => setAnswer(score)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    answers[currentQuestion.id] === score
                      ? score <= 6
                        ? 'bg-red-500 text-white'
                        : score <= 8
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 選擇題 */}
        {currentQuestion.type === 'choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map(option => (
              <button
                key={option}
                onClick={() => setAnswer(option)}
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                  answers[currentQuestion.id] === option
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <span className="font-medium text-gray-800">{option}</span>
              </button>
            ))}
          </div>
        )}

        {/* 文字題 */}
        {currentQuestion.type === 'text' && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="請輸入您的想法..."
            className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        )}
      </div>

      {/* 下一步按鈕 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-4 rounded-xl font-medium transition-all ${
            canProceed()
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentStep < questions.length - 1 ? '下一題' : '送出問卷'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// 旅遊回憶錄組件
// ============================================

export function TripMemoir() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [memoir, setMemoir] = useState<string | null>(null);

  const tripStats = {
    destination: '日本京都',
    duration: '5天4夜',
    totalPhotos: 128,
    totalSteps: 52847,
    favoriteSpot: '金閣寺',
    bestMeal: '和牛燒肉',
    totalMembers: 45,
  };

  const generateMemoir = () => {
    setIsGenerating(true);
    
    // 模擬 AI 生成
    setTimeout(() => {
      setMemoir(`
# 2024 京都之旅回憶錄 🌸

## 五天四夜的精彩旅程

這是一趟充滿驚喜與感動的旅程。45位夥伴一同踏上古都京都，在櫻花初綻的季節，留下了難忘的回憶。

### 最難忘的時刻

**金閣寺的倒影** - 當陽光灑落在鏡湖池上，金閣寺的倒影如夢似幻，讓所有人都忍不住驚呼。這一幕將永遠留在我們心中。

**嵐山竹林漫步** - 走在翠綠的竹林中，聽著竹葉沙沙作響，彷彿進入了另一個世界。

**和牛燒肉之夜** - 那一晚的敘敘苑燒肉，讓大家吃得心滿意足，也讓同事間的感情更加緊密。

### 旅程數據

- 📸 共拍攝 128 張照片
- 👟 累計步行 52,847 步
- 🍜 品嚐了 15 種當地美食
- 🛍️ 購物戰績豐碩

### 感謝

感謝王領隊的用心安排，感謝每一位夥伴的參與，讓這趟旅程如此圓滿。期待下一次的相聚！

---
*此回憶錄由 AI 根據旅程資料自動生成*
      `);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* 頂部 */}
      <header className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
        <h1 className="text-xl font-bold">📖 旅遊回憶錄</h1>
        <p className="text-amber-100 mt-1">用 AI 為這趟旅程留下美好記錄</p>
      </header>

      <div className="p-4 space-y-4">
        {/* 旅程統計 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">📊 旅程統計</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-3xl">📸</p>
              <p className="text-2xl font-bold text-gray-800">{tripStats.totalPhotos}</p>
              <p className="text-sm text-gray-500">張照片</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-3xl">👟</p>
              <p className="text-2xl font-bold text-gray-800">{tripStats.totalSteps.toLocaleString()}</p>
              <p className="text-sm text-gray-500">步</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-3xl">⭐</p>
              <p className="text-lg font-bold text-gray-800">{tripStats.favoriteSpot}</p>
              <p className="text-sm text-gray-500">最愛景點</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-3xl">🍽️</p>
              <p className="text-lg font-bold text-gray-800">{tripStats.bestMeal}</p>
              <p className="text-sm text-gray-500">最愛美食</p>
            </div>
          </div>
        </div>

        {/* 生成回憶錄 */}
        {!memoir ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-gray-800">AI 回憶錄生成器</h2>
            <p className="text-gray-600 mt-2">
              根據您的旅程照片與資料，自動生成專屬回憶錄
            </p>
            <button
              onClick={generateMemoir}
              disabled={isGenerating}
              className={`mt-6 px-8 py-4 rounded-xl font-medium transition-all ${
                isGenerating
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  AI 正在撰寫中...
                </span>
              ) : (
                '🪄 生成回憶錄'
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="prose prose-amber max-w-none">
              {memoir.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold text-gray-800 mt-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold text-gray-700 mt-4">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-bold text-gray-700 mt-3">{line.slice(4)}</h3>;
                }
                if (line.startsWith('**')) {
                  const content = line.replace(/\*\*/g, '');
                  return <p key={i} className="font-medium text-gray-800 mt-2">{content}</p>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-gray-600 ml-4">{line.slice(2)}</li>;
                }
                if (line.trim()) {
                  return <p key={i} className="text-gray-600 mt-2">{line}</p>;
                }
                return null;
              })}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-3 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200">
                📤 分享
              </button>
              <button className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
                📥 下載 PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default {
  SharedAlbum,
  FeedbackSurvey,
  TripMemoir,
};
