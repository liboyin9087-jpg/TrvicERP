/**
 * 行程產品管理模組統一匯出
 * Tour Product Management Module Exports
 */

export * from './services/tourService';
export * from './hooks/useTours';
export type * from '@/core/types/tour';

// 新增的旅遊管理組件
export { TourManagementApp } from './TourManagementApp';
export * from './types';
export { TourDashboard } from './components/TourDashboard';
export { TourPackageForm } from './components/TourPackageForm';
export { ItineraryBuilder } from './components/ItineraryBuilder';
export { BookingManager } from './components/BookingManager';
export { SupplierManager } from './components/SupplierManager';

// 新增團體旅遊核心功能
export { default as CustomerPortal } from './components/CustomerPortal';
export { default as CRMPipeline } from './components/CRMPipeline';
export { default as AdvancedReports } from './components/AdvancedReports';
export { default as GroupManagement } from './components/GroupManagement';
export { default as FinancialManagement } from './components/FinancialManagement';
