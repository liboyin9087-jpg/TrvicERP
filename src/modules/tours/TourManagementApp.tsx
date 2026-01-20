import React, { useState } from 'react';
import { TourDashboard } from './components/TourDashboard';
import { TourPackageForm } from './components/TourPackageForm';
import { ItineraryBuilder } from './components/ItineraryBuilder';
import { BookingManager } from './components/BookingManager';
import { SupplierManager } from './components/SupplierManager';
import { TourPackage } from './types';

type ViewType = 'dashboard' | 'packages' | 'itinerary' | 'bookings' | 'suppliers';

export const TourManagementApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(null);

  const renderNavigation = () => (
    <div className="bg-white border-b border-neutral-300">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex gap-1">
          <button
            className={`px-4 py-3 text-base font-medium border-b-2 transition-colors ${
              currentView === 'dashboard'
                ? 'text-primary-900 border-primary-900'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            }`}
            onClick={() => setCurrentView('dashboard')}
          >
            儀表板
          </button>
          <button
            className={`px-4 py-3 text-base font-medium border-b-2 transition-colors ${
              currentView === 'packages'
                ? 'text-primary-900 border-primary-900'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            }`}
            onClick={() => setCurrentView('packages')}
          >
            套裝管理
          </button>
          <button
            className={`px-4 py-3 text-base font-medium border-b-2 transition-colors ${
              currentView === 'itinerary'
                ? 'text-primary-900 border-primary-900'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            }`}
            onClick={() => setCurrentView('itinerary')}
          >
            行程規劃
          </button>
          <button
            className={`px-4 py-3 text-base font-medium border-b-2 transition-colors ${
              currentView === 'bookings'
                ? 'text-primary-900 border-primary-900'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            }`}
            onClick={() => setCurrentView('bookings')}
          >
            預訂管理
          </button>
          <button
            className={`px-4 py-3 text-base font-medium border-b-2 transition-colors ${
              currentView === 'suppliers'
                ? 'text-primary-900 border-primary-900'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            }`}
            onClick={() => setCurrentView('suppliers')}
          >
            供應商管理
          </button>
        </nav>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <TourDashboard
            onNewPackage={() => setCurrentView('packages')}
            onNewBooking={() => setCurrentView('bookings')}
          />
        );
      
      case 'packages':
        return selectedPackage ? (
          <TourPackageForm
            package={selectedPackage}
            onSave={(pkg) => {
              console.log('套裝已儲存:', pkg);
              setSelectedPackage(null);
            }}
            onCancel={() => setSelectedPackage(null)}
          />
        ) : (
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">套裝行程管理</h2>
              <button
                className="px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-800 transition-colors"
                onClick={() => setSelectedPackage({} as TourPackage)}
              >
                + 新建套裝
              </button>
            </div>
            <div className="bg-white rounded-lg p-8 text-center text-neutral-500">
              <p className="text-lg mb-4">套裝列表功能開發中...</p>
              <p>請點擊「新建套裝」開始建立新的旅遊套裝</p>
            </div>
          </div>
        );
      
      case 'itinerary':
        return (
          <ItineraryBuilder
            packageId="pkg_1"
            duration={3}
            onSave={(itinerary) => {
              console.log('行程已儲存:', itinerary);
              setCurrentView('dashboard');
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      
      case 'bookings':
        return (
          <BookingManager
            packageId="pkg_1"
            packageName="2025春遊阿里山"
            onSave={(booking) => {
              console.log('預訂已儲存:', booking);
              setCurrentView('dashboard');
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      
      case 'suppliers':
        return (
          <SupplierManager
            onSupplierSave={(supplier) => {
              console.log('供應商已儲存:', supplier);
            }}
            onSupplierDelete={(supplierId) => {
              console.log('供應商已刪除:', supplierId);
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {renderNavigation()}
      {renderContent()}
    </div>
  );
};
