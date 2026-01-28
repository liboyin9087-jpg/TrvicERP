import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Phone, Mail, Plus, Minus, CreditCard, CheckCircle } from 'lucide-react';

interface Passenger {
  name: string;
  idNumber: string;
  birthday: string;
}

interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  passengers: Passenger[];
}

export interface BookingModalConfig {
  tripName: string;
  price: number;
  onBook: (data: { bookingDetails: BookingFormData; totalPrice: number; tripName: string; pricePerPassenger: number }) => Promise<void>;
}

interface UseBookingFormResult {
  step: number;
  passengerCount: number;
  formData: BookingFormData;
  totalPrice: number;
  handlePassengerCountChange: (delta: number) => void;
  handlePassengerChange: (index: number, field: keyof Passenger, value: string) => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitBooking: () => Promise<void>;
}

function useBookingForm(config: BookingModalConfig, isOpen: boolean, onBookingSuccess: () => void): UseBookingFormResult {
  const { price, onBook, tripName } = config;

  const initialFormData: BookingFormData = {
    name: '',
    phone: '',
    email: '',
    passengers: [{ name: '', idNumber: '', birthday: '' }],
  };

  const [step, setStep] = useState(1);
  const [passengerCount, setPassengerCount] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPassengerCount(1);
      setFormData(initialFormData);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.passengers.length !== passengerCount) {
      const newPassengers = Array.from({ length: passengerCount }, (_, i) => {
        return formData.passengers[i] || { name: '', idNumber: '', birthday: '' };
      });
      setFormData(prev => ({ ...prev, passengers: newPassengers }));
    }
  }, [passengerCount, formData.passengers]);

  const totalPrice = price * passengerCount;

  const handlePassengerCountChange = useCallback((delta: number) => {
    setPassengerCount(prev => Math.max(1, prev + delta));
  }, []);

  const handlePassengerChange = useCallback((index: number, field: keyof Passenger, value: string) => {
    setFormData(prev => {
      const newPassengers = [...prev.passengers];
      newPassengers[index] = { ...newPassengers[index], [field]: value };
      return { ...prev, passengers: newPassengers };
    });
  }, []);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const submitBooking = useCallback(async () => {
    try {
      await onBook({
        bookingDetails: formData,
        totalPrice,
        tripName,
        pricePerPassenger: price
      });
      setStep(2);
      onBookingSuccess();
    } catch (error) {
      console.error("Booking failed:", error);
    }
  }, [formData, totalPrice, tripName, price, onBook, onBookingSuccess]);

  return {
    step,
    passengerCount,
    formData,
    totalPrice,
    handlePassengerCountChange,
    handlePassengerChange,
    handleFormChange,
    submitBooking,
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BookingModalConfig;
}

export default function BookingModal({ isOpen, onClose, config }: BookingModalProps) {
  const {
    step,
    passengerCount,
    formData,
    totalPrice,
    handlePassengerCountChange,
    handlePassengerChange,
    handleFormChange,
    submitBooking,
  } = useBookingForm(config, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-900/60" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full sm:max-w-lg md:max-w-xl lg:max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4 drag-handle cursor-grab active:cursor-grabbing">
            <h2 className="text-xl font-bold text-gray-900">預訂行程</h2>
            <p className="text-sm text-gray-500 mt-1">{config.tripName}</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon btn-secondary"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">聯絡人資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contactName"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="input-base pl-10"
                        placeholder="請輸入姓名"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">電話</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contactPhone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="input-base pl-10"
                        placeholder="0912-345-678"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contactEmail"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="input-base pl-10"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">旅客資料</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePassengerCountChange(-1)}
                      disabled={passengerCount <= 1}
                      className="btn btn-icon btn-secondary-sm"
                      aria-label="減少旅客數量"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-gray-900 font-medium text-sm">{passengerCount}</span>
                    <button
                      onClick={() => handlePassengerCountChange(1)}
                      className="btn btn-icon btn-secondary-sm"
                      aria-label="增加旅客數量"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {formData.passengers.map((passenger, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg mb-4 last:mb-0 border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">旅客 {index + 1}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="姓名"
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                        className="input-base"
                      />
                      <input
                        type="text"
                        placeholder="身分證/護照號碼"
                        value={passenger.idNumber}
                        onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                        className="input-base"
                      />
                      <input
                        type="date"
                        value={passenger.birthday}
                        onChange={(e) => handlePassengerChange(index, 'birthday', e.target.value)}
                        className="input-base text-gray-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">訂單建立成功！</h3>
              <p className="text-gray-500 text-sm">我們將發送確認信至您的 Email</p>
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
              onClick={submitBooking}
              className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />確認預訂
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn btn-primary btn-lg w-full"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}