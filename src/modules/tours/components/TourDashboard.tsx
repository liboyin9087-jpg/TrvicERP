import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { TourPackage, Booking } from '../types';

interface KPICard {
  title: string;
  value: string;
  change: number;
  isPositive: boolean;
}

interface TourDashboardProps {
  onNewPackage: () => void;
  onNewBooking: () => void;
}

export const TourDashboard: React.FC<TourDashboardProps> = ({
  onNewPackage,
  onNewBooking,
}) => {
  const [kpiData, setKpiData] = useState<KPICard[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [popularPackages, setPopularPackages] = useState<TourPackage[]>([]);

  useEffect(() => {
    // 模擬 KPI 數據
    const mockKPI: KPICard[] = [
      { title: '本月預訂', value: '12筆', change: 15, isPositive: true },
      { title: '待確認金額', value: 'NT$980,000', change: -8, isPositive: false },
      { title: '已支付金額', value: 'NT$3.2M', change: 12, isPositive: true },
      { title: '成團率', value: '85%', change: 5, isPositive: true },
    ];
    setKpiData(mockKPI);

    // 模擬最近預訂
    const mockBookings: Booking[] = [
      {
        id: 'booking_1',
        packageId: 'pkg_1',
        customerId: 'customer_1',
        status: 'confirmed',
        passengers: [],
        totalPrice: 135000,
        paidAmount: 67500,
        balance: 67500,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
      },
      {
        id: 'booking_2',
        packageId: 'pkg_2',
        customerId: 'customer_2',
        status: 'quoted',
        passengers: [],
        totalPrice: 450000,
        paidAmount: 0,
        balance: 450000,
        createdAt: '2025-01-14T14:30:00Z',
        updatedAt: '2025-01-14T14:30:00Z',
      },
    ];
    setRecentBookings(mockBookings);

    // 模擬熱門套裝
    const mockPackages: TourPackage[] = [
      {
        id: 'pkg_1',
        name: '2025春遊阿里山',
        description: '賞櫻、品茶、觀日出',
        duration: 3,
        basePrice: 12000,
        costPrice: 8000,
        minGroupSize: 20,
        maxGroupSize: 50,
        variants: [],
        extraServices: [],
        status: 'published',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'pkg_2',
        name: '環島8日遊',
        description: '台灣經典景點全覽',
        duration: 8,
        basePrice: 28000,
        costPrice: 20000,
        minGroupSize: 15,
        maxGroupSize: 40,
        variants: [],
        extraServices: [],
        status: 'published',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];
    setPopularPackages(mockPackages);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '已確認';
      case 'quoted':
        return '已報價';
      case 'lead':
        return '潛在客戶';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            旅遊管理儀表板
          </h1>
          <p className="text-neutral-600">
            歡迎回來！這裡是您的旅遊業務總覽
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={onNewBooking}>
            + 新建預訂
          </Button>
          <Button variant="primary" onClick={onNewPackage}>
            + 新建套裝
          </Button>
        </div>
      </div>

      {/* KPI 卡片網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <div className="flex flex-col">
              <div className="text-sm text-neutral-600 mb-2">{kpi.title}</div>
              <div className="text-2xl font-bold text-primary-900 mb-3">
                {kpi.value}
              </div>
              <div className={`text-sm font-semibold ${
                kpi.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.isPositive ? '↑' : '↓'} {Math.abs(kpi.change)}% 對比上期
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近預訂 */}
        <Card title="最近預訂">
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="border-b border-neutral-200 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-neutral-900">
                      預訂 #{booking.id.slice(-6)}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {new Date(booking.createdAt).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-md ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <div className="text-sm font-semibold text-neutral-900 mt-1">
                      NT${booking.totalPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="tertiary">
              查看全部預訂
            </Button>
          </div>
        </Card>

        {/* 熱門套裝 */}
        <Card title="熱門套裝行程">
          <div className="space-y-4">
            {popularPackages.map((pkg) => (
              <div key={pkg.id} className="border-b border-neutral-200 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-neutral-900">
                      {pkg.name}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {pkg.duration} 天 • NT${pkg.basePrice.toLocaleString()}/人
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      {pkg.minGroupSize}-{pkg.maxGroupSize} 人成團
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-md ${
                      pkg.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pkg.status === 'published' ? '已發布' : '草稿'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="tertiary">
              管理所有套裝
            </Button>
          </div>
        </Card>
      </div>

      {/* 快速統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <Card title="本月銷售趨勢">
          <div className="h-64 flex items-center justify-center text-neutral-500">
            📊 銷售圖表 (需要圖表庫)
          </div>
        </Card>

        <Card title="團體狀態分佈">
          <div className="h-64 flex items-center justify-center text-neutral-500">
            🥧 圓餅圖 (需要圖表庫)
          </div>
        </Card>

        <Card title="快速操作">
          <div className="space-y-3">
            <Button variant="secondary" className="w-full justify-start">
              📋 生成月報表
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              💰 財務結算
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              👥 客戶管理
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              🏨 供應商管理
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
