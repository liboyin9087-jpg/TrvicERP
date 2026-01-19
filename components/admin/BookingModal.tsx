import React, { useState, memo, useMemo } from 'react';
import { X, User, Phone, Mail, Plus, Minus, CreditCard, CheckCircle } from 'lucide-react';

interface PassengerData {
  name: string;
  idNumber: string;
  birthday: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  passengers: PassengerData[];
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripName?: string;
  price?: number;
}

const BookingModal: React.FC<BookingModalProps> = memo(({ 
  isOpen, 
  onClose, 
  tripName = '東京五日深度遊', 
  price = 45800 
}) => {
  const [step, setStep] = useState(1);
  const [passengerCount, setPassengerCount] = useState(1);
  const [formData, setFormData] = useState<FormData>({ 
    name: '', 
    phone: '', 
    email: '', 
    passengers: [{ name: '', idNumber: '', birthday: '' }] 
  });

  const totalPrice = useMemo(() => price * passengerCount, [price, passengerCount]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePassengerInputChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    index: number, 
    field: keyof PassengerData
  ) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: e.target.value };
    setFormData(prev => ({ ...prev, passengers: updatedPassengers }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">預訂行程</h2>
            <p className="text-sm text-gray-500 mt-1">{tripName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">聯絡人資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange(e, 'name')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="請輸入姓名"
                        aria-required="true"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">電話</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange(e, 'phone')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="0912-345-678"
                        aria-required="true"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange(e, 'email')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="example@email.com"
                        aria-required="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">旅客資料</h3>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="姓名"
                      value={formData.passengers[0].name}
                      onChange={(e) => handlePassengerInputChange(e, 0, 'name')}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      aria-label="旅客姓名"
                    />
                    <input
                      type="text"
                      placeholder="身分證/護照號碼"
                      value={formData.passengers[0].idNumber}
                      onChange={(e) => handlePassengerInputChange(e, 0, 'idNumber')}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      aria-label="旅客身分證或護照號碼"
                    />
                    <input
                      type="date"
                      value={formData.passengers[0].birthday}
                      onChange={(e) => handlePassengerInputChange(e, 0, 'birthday')}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      aria-label="旅客生日"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-brand-600" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">訂單建立成功！</h3>
              <p className="text-gray-500">我們將發送確認信至您的 Email</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">總計金額</p>
              <p className="text-2xl font-bold text-gray-900">NT$ {totalPrice.toLocaleString()}</p>
            </div>
            <p className="text-sm text-gray-500">{passengerCount} 位旅客</p>
          </div>
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 flex items-center justify-center gap-2"
              aria-label="確認預訂"
            >
              <CreditCard className="w-5 h-5" aria-hidden="true" />
              確認預訂
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800"
              aria-label="完成"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default BookingModal;