import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Check, Star, CheckCircle, GripVertical } from 'lucide-react';
import Modal from '../shared/Modal';
import { ButtonLoading } from '../shared/Loading';

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  popular: boolean;
  selected: boolean;
}

export interface TourAddonsProps {
  initialAddons?: Addon[];
  onPurchaseAddons: (selectedAddons: Addon[]) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

const DEFAULT_ADDONS: Addon[] = [
  { id: '1', name: '東京迪士尼一日券', description: '含園區內無限次乘坐', price: 2800, image: 'https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=400', popular: true, selected: false },
  { id: '2', name: '和服體驗', description: '淺草專業和服租借+攝影', price: 1500, image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400', popular: false, selected: false },
  { id: '3', name: '晴空塔展望台門票', description: '含 350m + 450m 兩層展望台', price: 800, image: 'https://images.unsplash.com/photo-1590253230532-a67f6bc61c9e?w=400', popular: true, selected: false },
];

export default function TourAddons({
  initialAddons = DEFAULT_ADDONS,
  onPurchaseAddons,
  onShowToast,
  className,
}: TourAddonsProps) {
  const [addons, setAddons] = useState<Addon[]>(
    initialAddons.map(addon => ({ ...addon, selected: false }))
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAddons(initialAddons.map(addon => ({ ...addon, selected: false })));
  }, [initialAddons]);

  const toggleAddon = (id: string) => {
    setAddons(prev => prev.map(addon => addon.id === id ? { ...addon, selected: !addon.selected } : addon));
  };

  const selectedItems = addons.filter(a => a.selected);
  const totalPrice = selectedItems.reduce((sum, a) => sum + a.price, 0);

  const handleConfirmPurchase = async () => {
    if (selectedItems.length === 0) {
      onShowToast('請先選擇加購項目', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await onPurchaseAddons(selectedItems);
      
      onShowToast(`已成功選購 ${selectedItems.length} 項加購項目`, 'success');
      setShowConfirmModal(false);

      setAddons(prev => prev.map(addon => ({ ...addon, selected: false })));
    } catch (error) {
      onShowToast('訂單提交失敗，請稍後再試', 'error');
      console.error('Purchase failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden relative ${className || ''} animate-fade-in`}>
      <header className="flex items-center justify-between bg-primary-900 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6" />
          <h1 className="text-xl font-bold">自費行程</h1>
        </div>
        <div className="drag-handle p-2 cursor-grab text-primary-200 hover:text-white transition-colors duration-200" title="Drag to move">
          <GripVertical className="w-6 h-6" />
        </div>
      </header>
      <p className="text-sm text-gray-400 mt-1 px-6 pb-4 bg-primary-900">選購加值服務</p>
      
      <main className="p-6 space-y-4 pb-24">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className={`
              bg-white rounded-lg border-2 overflow-hidden transition-all duration-200 ease-in-out
              ${addon.selected ? 'border-brand-500 shadow-md' : 'border-gray-200 hover:border-brand-300'}
              focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-500
              active:border-brand-600
            `}
          >
            <div className="relative h-32">
              <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
              {addon.popular && (
                <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-900" />人氣
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{addon.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                </div>
                <button
                  onClick={() => toggleAddon(addon.id)}
                  className={`
                    flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out
                    ${addon.selected
                      ? 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus:ring-2 focus:ring-brand-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 active:bg-gray-300 focus:ring-2 focus:ring-gray-300'
                    }
                  `}
                  aria-label={addon.selected ? `取消選擇 ${addon.name}` : `選擇 ${addon.name}`}
                >
                  {addon.selected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xl font-bold text-brand-700 mt-3">NT$ {addon.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </main>
      {totalPrice > 0 && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
          <div className="max-w-screen-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已選 {selectedItems.length} 項</p>
              <p className="text-2xl font-bold text-gray-900">NT$ {totalPrice.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="
                bg-primary-900 text-white px-6 py-3 rounded-lg font-semibold
                hover:bg-primary-800 transition-colors duration-200 ease-in-out
                focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 active:bg-primary-700
              "
            >
              確認選購
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="確認選購"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {selectedItems.map(item => (
              <div key={item.id} className="
                flex justify-between items-center p-3 bg-gray-50 rounded-lg
                focus:outline-none focus-within:ring-2 focus-within:ring-brand-300
              ">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-800">NT$ {item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">總計 ({selectedItems.length} 項)</span>
              <span className="text-3xl font-bold text-brand-700">NT$ {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg flex items-start gap-2 border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              確認後將加入您的行程訂單，費用將於出發前統一收取。
            </p>
          </div>

          <button
            onClick={handleConfirmPurchase}
            disabled={isSubmitting}
            className="
              w-full bg-brand-600 text-white py-3 rounded-lg font-semibold
              hover:bg-brand-700 transition-colors duration-200 ease-in-out
              flex items-center justify-center gap-2
              disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400
              focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 active:bg-brand-800
            "
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