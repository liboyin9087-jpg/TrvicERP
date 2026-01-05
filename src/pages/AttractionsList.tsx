import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface Attraction {
  id: number;
  category: string;
  name: string;
  location: string;
  tags: string;
  suitable_for: string;
  additional_info: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export default function AttractionsList() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'all',
    '綠色永續景點',
    '山林秘境',
    '海岸離島',
    '文化深度體驗',
    '農村慢旅',
    '都市邊緣秘境'
  ];

  useEffect(() => {
    fetchAttractions();
  }, []);

  async function fetchAttractions() {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      setAttractions(data || []);
    } catch (err: any) {
      console.error('Error fetching attractions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredAttractions = attractions.filter((attr) => {
    const matchesCategory = selectedCategory === 'all' || attr.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-black text-xl">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-red-600 text-xl">錯誤: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-black">台灣景點資料庫</h1>
        
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="搜尋景點名稱、地點或標籤..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black'
                }`}
              >
                {category === 'all' ? '全部' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-black">
          顯示 {filteredAttractions.length} / {attractions.length} 個景點
        </div>

        {/* Attractions list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttractions.map((attraction) => (
            <div
              key={attraction.id}
              className="border border-gray-300 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="mb-2">
                <span className="inline-block px-3 py-1 text-sm bg-gray-100 text-black rounded-full border border-gray-300">
                  {attraction.category}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-black">{attraction.name}</h3>
              
              <div className="text-black mb-2">
                <span className="font-semibold">📍</span> {attraction.location}
              </div>
              
              {attraction.tags && (
                <div className="text-sm text-gray-700 mb-2">
                  {attraction.tags}
                </div>
              )}
              
              {attraction.suitable_for && (
                <div className="text-sm text-black mb-2">
                  <span className="font-semibold">適合:</span> {attraction.suitable_for}
                </div>
              )}
              
              {attraction.additional_info && Object.keys(attraction.additional_info).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm space-y-1">
                  {Object.entries(attraction.additional_info).map(([key, value]) => (
                    <div key={key} className="text-black">
                      <span className="font-semibold">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAttractions.length === 0 && (
          <div className="text-center py-12 text-black">
            <p className="text-xl">沒有找到符合條件的景點</p>
          </div>
        )}
      </div>
    </div>
  );
}
