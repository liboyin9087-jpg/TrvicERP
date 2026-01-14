import React, { useState } from 'react';
import { X, User, Phone, Mail, Plus, Minus, CreditCard, CheckCircle } from 'lucide-react';

interface BookingModalProps { isOpen: boolean; onClose: () => void; tripName?: string; price?: number; }

export default function BookingModal({ isOpen, onClose, tripName = '東京五日深度遊', price = 45800 }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [passengerCount, setPassengerCount] = useState(1);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', passengers: [{ name: '', idNumber: '', birthday: '' }] });

  if (!isOpen) return null;
  const totalPrice = price * passengerCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-900">預訂行程</h2><p className="text-sm text-gray-500 mt-1">{tripName}</p></div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div><h3 className="font-semibold text-gray-900 mb-4">聯絡人資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">姓名</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" placeholder="請輸入姓名" /></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">電話</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" placeholder="0912-345-678" /></div></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" placeholder="example@email.com" /></div></div>
                </div>
              </div>
              <div><div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">旅客資料</h3></div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="姓名" className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                    <input type="text" placeholder="身分證/護照號碼" className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                    <input type="date" className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">訂單建立成功！</h3>
              <p className="text-gray-500">我們將發送確認信至您的 Email</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-sm text-gray-500">總計金額</p><p className="text-2xl font-bold text-gray-900">NT$ {totalPrice.toLocaleString()}</p></div>
            <p className="text-sm text-gray-500">{passengerCount} 位旅客</p>
          </div>
          {step === 1 ? (
            <button onClick={() => setStep(2)} className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 flex items-center justify-center gap-2"><CreditCard className="w-5 h-5" />確認預訂</button>
          ) : (
            <button onClick={onClose} className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800">完成</button>
          )}
        </div>
      </div>
    </div>
  );
}
