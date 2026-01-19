import React, { useState } from 'react';
import { ShoppingBag, Plus, Check, Star, CheckCircle } from 'lucide-react';
import Modal from '../shared/Modal';
import { ButtonLoading } from '../shared/Loading';
import { useToast } from '@/store/useToastStore';

interface Addon { id: string; name: string; description: string; price: number; image: string; popular: boolean; selected: boolean; }

const MOCK_ADDONS: Addon[] = [
  { id: '1', name: '東京迪士尼一日券', description: '含園區內無限次乘坐', price: 2800, image: 'https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=400', popular: true, selected: false },
  { id: '2', name: '和服體驗', description: '淺草專業和服租借+攝影', price: 1500, image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400', popular: false, selected: false },
  { id: '3', name: '晴空塔展望台門票', description: '含 350m + 450m 兩層展望台', price: 800, image: 'https://images.unsplash.com/photo-1590253230532-a67f6bc61c9e?w=400', popular: true, selected: false },
];

export default function TourAddons() {
  const toast = useToast();

  const [addons, setAddons] = useState<Addon[]>(MOCK_ADDONS);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAddon = (id: string) => {
    setAddons(prev => prev.map(addon => addon.id === id ? { ...addon, selected: !addon.selected } : addon));
  };

  const selectedItems = addons.filter(a => a.selected);
  const totalPrice = selectedItems.reduce((sum, a) => sum + a.price, 0);

  const handleConfirmPurchase = async () => {
    if (selectedItems.length === 0) {
      toast.error('請先選擇項目');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`已成功選購 ${selectedItems.length} 項加購項目`);
      setShowConfirmModal(false);

      // Reset selections after successful purchase
      setAddons(prev => prev.map(addon => ({ ...addon, selected: false })));
    } catch (error) {
      toast.error('訂單提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <header className="bg-black text-white px-6 py-4">
        <div className="flex items-center gap-3"><ShoppingBag className="w-6 h-6" /><h1 className="text-xl font-bold">自費行程</h1></div>
        <p className="text-sm text-gray-400 mt-1">選購加值服務</p>
      </header>
      <main className="p-6 space-y-4 pb-24">
        {addons.map((addon) => (
          <div key={addon.id} className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${addon.selected ? 'border-brand-500' : 'border-gray-100'}`}>
            <div className="relative h-32">
              <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
              {addon.popular && <span className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Star className="w-3 h-3" />人氣</span>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div><h3 className="font-bold text-gray-900">{addon.name}</h3><p className="text-sm text-gray-500 mt-1">{addon.description}</p></div>
                <button onClick={() => toggleAddon(addon.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${addon.selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                  {addon.selected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-lg font-bold text-gray-900 mt-3">NT$ {addon.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </main>
      {totalPrice > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">已選 {selectedItems.length} 項</p><p className="text-xl font-bold text-gray-900">NT$ {totalPrice.toLocaleString()}</p></div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              確認選購
            </button>
          </div>
        </div>
      )}

      {/* Confirm Purchase Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="確認選購"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {selectedItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-700">NT$ {item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">總計 ({selectedItems.length} 項)</span>
              <span className="text-2xl font-bold text-gray-900">NT$ {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-xl flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">
              確認後將加入您的行程訂單，費用將於出發前統一收取。
            </p>
          </div>

          <button
            onClick={handleConfirmPurchase}
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <ButtonLoading />
                處理中...
              </>
            ) : (
              '確認訂購'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
