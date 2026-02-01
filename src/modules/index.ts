/**
 * 模組統一匯出
 * Unified Module Exports
 * Based on Odoo and Open Source Travel ERP Best Practices
 */

// 訂單管理
export * from './orders';

// 報價管理
export * from './quotations';

// 報表
export * from './reports';

// 團次管理
export * from './sessions';

// 客戶管理
export * from './customers';

// 企業客戶管理
export * from './corporate';

// 行程產品
export * from './tours';

// 行程安排
export * from './itineraries';

// 護照管理 (Based on Odoo Passport Management)
export * from './passport/PassportManagement';

// 簽證管理 (Based on Odoo Visa Management)
export * from './visa/VisaManagement';

// 保險管理 (Based on Odoo Travel Insurance Module)
export * from './insurance/InsuranceManagement';

// 費用管理 (Based on Odoo Expense Module)
export * from './expense/ExpenseManagement';

// 行程編輯器 (Based on Open Source Travel Templates)
export * from './itinerary-builder/ItineraryBuilder';

// 財務類型
export * from './financial/types';

// 供應商類型
export * from './supplier/types';
