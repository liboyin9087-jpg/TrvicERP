import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Card/Card';
import { Input } from '../../../components/ui/Input/Input';
import { Booking, Passenger, FlightInfo } from '../types';

interface BookingManagerProps {
  packageId: string;
  packageName: string;
  onSave: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingManager: React.FC<BookingManagerProps> = ({
  packageId,
  packageName,
  onSave,
  onCancel,
}) => {
  const [booking, setBooking] = useState<Partial<Booking>>({
    packageId,
    status: 'lead',
    passengers: [],
    totalPrice: 0,
    paidAmount: 0,
    balance: 0,
  });

  const [passengers, setPassengers] = useState<Passenger[]>([]);

  const addPassenger = () => {
    const newPassenger: Passenger = {
      id: `passenger_${Date.now()}`,
      bookingId: '',
      name: '',
      visaStatus: 'none',
      specialNeeds: '',
      roomAssignment: '',
    };
    setPassengers([...passengers, newPassenger]);
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setPassengers(updatedPassengers);
  };

  const removePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    // 這裡應該根據套裝價格、加購服務、乘客人數等計算總價
    const basePrice = 12000; // 暫時使用固定價格
    const passengerCount = passengers.length;
    const total = basePrice * passengerCount;
    
    setBooking({
      ...booking,
      passengers,
      totalPrice: total,
      balance: total - (booking.paidAmount || 0),
    });
  };

  React.useEffect(() => {
    calculateTotal();
  }, [passengers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const completeBooking: Booking = {
      id: `booking_${Date.now()}`,
      packageId,
      customerId: 'customer_1', // 暫時使用固定客戶ID
      status: booking.status || 'lead',
      passengers,
      totalPrice: booking.totalPrice || 0,
      paidAmount: booking.paidAmount || 0,
      balance: booking.balance || 0,
      specialRequests: booking.specialRequests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(completeBooking);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card title={`預訂管理 - ${packageName}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 預訂基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                預訂狀態
              </label>
              <select
                className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                value={booking.status}
                onChange={(e) => setBooking({ ...booking, status: e.target.value as any })}
              >
                <option value="lead">潛在客戶</option>
                <option value="quoted">已報價</option>
                <option value="confirmed">已確認</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <Input
              label="總金額 (NT$)"
              type="number"
              value={booking.totalPrice}
              onChange={(value) => setBooking({ ...booking, totalPrice: parseInt(value) || 0 })}
              disabled
            />
            <Input
              label="已付金額 (NT$)"
              type="number"
              value={booking.paidAmount}
              onChange={(value) => {
                const paid = parseInt(value) || 0;
                setBooking({
                  ...booking,
                  paidAmount: paid,
                  balance: (booking.totalPrice || 0) - paid,
                });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              特殊需求
            </label>
            <textarea
              className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md min-h-[100px]"
              value={booking.specialRequests || ''}
              onChange={(e) => setBooking({ ...booking, specialRequests: e.target.value })}
              placeholder="客戶特殊需求、飲食限制、無障礙需求等..."
            />
          </div>

          {/* 團員管理 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-neutral-900">團員資訊</h3>
              <Button variant="secondary" onClick={addPassenger}>
                + 新增團員
              </Button>
            </div>
            
            {passengers.map((passenger, index) => (
              <Card key={passenger.id} className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-neutral-800">
                    團員 {index + 1}
                  </h4>
                  <Button variant="danger" onClick={() => removePassenger(index)}>
                    刪除
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="姓名"
                    value={passenger.name}
                    onChange={(value) => updatePassenger(index, 'name', value)}
                    required
                  />
                  <Input
                    label="護照號碼"
                    value={passenger.passportNumber || ''}
                    onChange={(value) => updatePassenger(index, 'passportNumber', value)}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      簽證狀態
                    </label>
                    <select
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={passenger.visaStatus}
                      onChange={(e) => updatePassenger(index, 'visaStatus', e.target.value as any)}
                    >
                      <option value="none">無需簽證</option>
                      <option value="applied">申請中</option>
                      <option value="approved">已核准</option>
                      <option value="rejected">已拒絕</option>
                    </select>
                  </div>
                  <Input
                    label="房間分配"
                    value={passenger.roomAssignment || ''}
                    onChange={(value) => updatePassenger(index, 'roomAssignment', value)}
                    placeholder="例：雙人房A"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    特殊需求
                  </label>
                  <textarea
                    className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md min-h-[80px]"
                    value={passenger.specialNeeds || ''}
                    onChange={(e) => updatePassenger(index, 'specialNeeds', e.target.value)}
                    placeholder="飲食限制、過敏、無障礙需求等..."
                  />
                </div>
                
                {/* 航班資訊 */}
                <div className="mt-4">
                  <h5 className="text-md font-semibold text-neutral-800 mb-3">航班資訊</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="航班號碼"
                      value={passenger.flightInfo?.flightNumber || ''}
                      onChange={(value) => updatePassenger(index, 'flightInfo', {
                        ...(passenger.flightInfo || {}),
                        flightNumber: value,
                      })}
                    />
                    <Input
                      label="航空公司"
                      value={passenger.flightInfo?.airline || ''}
                      onChange={(value) => updatePassenger(index, 'flightInfo', {
                        ...(passenger.flightInfo || {}),
                        airline: value,
                      })}
                    />
                    <Input
                      label="出發地"
                      value={passenger.flightInfo?.departure || ''}
                      onChange={(value) => updatePassenger(index, 'flightInfo', {
                        ...(passenger.flightInfo || {}),
                        departure: value,
                      })}
                    />
                    <Input
                      label="目的地"
                      value={passenger.flightInfo?.arrival || ''}
                      onChange={(value) => updatePassenger(index, 'flightInfo', {
                        ...(passenger.flightInfo || {}),
                        arrival: value,
                      })}
                    />
                    <Input
                      label="出發時間"
                      type="datetime-local"
                      value={passenger.flightInfo?.departureTime || ''}
                      onChange={(value) => updatePassenger(index, 'flightInfo', {
                        ...(passenger.flightInfo || {}),
                        departureTime: value,
                      })}
                    />
                    <Input
                      label="抵達時間"
                      type="datetime-local"
                      value={passenger.flightInfo?.arrivalTime || ''}
                      onChange={(value) => updatePassenger(index, 'flightInfo', {
                        ...(passenger.flightInfo || {}),
                        arrivalTime: value,
                      })}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
            <Button variant="secondary" onClick={onCancel}>
              取消
            </Button>
            <Button variant="primary" type="submit">
              儲存預訂
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
