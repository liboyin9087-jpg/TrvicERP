/**
 * Passport Management Module - Based on Odoo Travel Agency Module Design
 * Features: Document tracking, expiry alerts, compliance checking
 * Reference: Odoo Employee Visa Passport Management Module
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types based on Odoo's passport management schema
export interface PassportDocument {
  id: string;
  customerId: string;
  customerName: string;
  passportNumber: string;
  nationality: string;
  surname: string;
  givenNames: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'X';
  placeOfBirth?: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority?: string;
  passportType: 'ordinary' | 'diplomatic' | 'official' | 'service';
  mrzLine1?: string;
  mrzLine2?: string;
  scanUrl?: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'cancelled';
  daysUntilExpiry: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassportFilters {
  status?: string;
  nationality?: string;
  expiringWithinDays?: number;
  searchTerm?: string;
}

// Utility functions
export const calculatePassportStatus = (expiryDate: string): { status: string; days: number } => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'expired', days: diffDays };
  if (diffDays < 30) return { status: 'expiring_soon', days: diffDays };
  if (diffDays < 180) return { status: 'valid_limited', days: diffDays };
  return { status: 'valid', days: diffDays };
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'valid': return 'bg-green-100 text-green-800';
    case 'valid_limited': return 'bg-yellow-100 text-yellow-800';
    case 'expiring_soon': return 'bg-orange-100 text-orange-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    valid: '有效',
    valid_limited: '效期有限',
    expiring_soon: '即將到期',
    expired: '已過期',
    cancelled: '已取消'
  };
  return labels[status] || status;
};

// Passport List Component
interface PassportListProps {
  passports: PassportDocument[];
  onEdit: (passport: PassportDocument) => void;
  onDelete: (id: string) => void;
  onViewDetails: (passport: PassportDocument) => void;
}

export const PassportList: React.FC<PassportListProps> = ({
  passports,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              旅客資訊
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              護照號碼
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              國籍
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              到期日
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              狀態
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {passports.map((passport) => (
            <tr key={passport.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {passport.surname.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {passport.surname}, {passport.givenNames}
                    </div>
                    <div className="text-sm text-gray-500">
                      {passport.customerName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {passport.passportNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {passport.nationality}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{passport.expiryDate}</div>
                <div className="text-sm text-gray-500">
                  {passport.daysUntilExpiry > 0 
                    ? `剩餘 ${passport.daysUntilExpiry} 天`
                    : `已過期 ${Math.abs(passport.daysUntilExpiry)} 天`}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(passport.status)}`}>
                  {getStatusLabel(passport.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onViewDetails(passport)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  查看
                </button>
                <button
                  onClick={() => onEdit(passport)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  編輯
                </button>
                <button
                  onClick={() => onDelete(passport.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Passport Expiry Alerts Component (Based on Odoo's notification system)
interface ExpiryAlertsProps {
  passports: PassportDocument[];
  alertDays?: number;
}

export const PassportExpiryAlerts: React.FC<ExpiryAlertsProps> = ({
  passports,
  alertDays = 180
}) => {
  const expiringPassports = passports.filter(
    p => p.daysUntilExpiry >= 0 && p.daysUntilExpiry <= alertDays
  ).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  if (expiringPassports.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700">✓ 沒有即將到期的護照</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-orange-50 border-b border-orange-200">
        <h3 className="text-lg leading-6 font-medium text-orange-900">
          ⚠️ 護照到期提醒 ({expiringPassports.length})
        </h3>
        <p className="mt-1 text-sm text-orange-700">
          以下護照將在 {alertDays} 天內到期，請提醒客戶辦理續期
        </p>
      </div>
      <ul className="divide-y divide-gray-200">
        {expiringPassports.map((passport) => (
          <li key={passport.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mr-3 ${
                  passport.daysUntilExpiry < 30 ? 'bg-red-400' :
                  passport.daysUntilExpiry < 90 ? 'bg-orange-400' : 'bg-yellow-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {passport.surname}, {passport.givenNames}
                  </p>
                  <p className="text-sm text-gray-500">
                    護照號碼: {passport.passportNumber}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {passport.expiryDate}
                </p>
                <p className={`text-sm ${
                  passport.daysUntilExpiry < 30 ? 'text-red-600 font-semibold' :
                  passport.daysUntilExpiry < 90 ? 'text-orange-600' : 'text-yellow-600'
                }`}>
                  剩餘 {passport.daysUntilExpiry} 天
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Passport Form Component
interface PassportFormProps {
  initialData?: Partial<PassportDocument>;
  customerId?: string;
  onSubmit: (data: Partial<PassportDocument>) => void;
  onCancel: () => void;
}

export const PassportForm: React.FC<PassportFormProps> = ({
  initialData,
  customerId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<PassportDocument>>({
    customerId: customerId || '',
    passportNumber: '',
    nationality: 'TW',
    surname: '',
    givenNames: '',
    dateOfBirth: '',
    gender: 'M',
    issueDate: '',
    expiryDate: '',
    passportType: 'ordinary',
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Personal Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700">姓氏 (Surname) *</label>
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="如護照所示"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">名字 (Given Names) *</label>
          <input
            type="text"
            name="givenNames"
            value={formData.givenNames}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="如護照所示"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">護照號碼 *</label>
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">國籍 *</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TW">台灣 (Taiwan)</option>
            <option value="CN">中國 (China)</option>
            <option value="HK">香港 (Hong Kong)</option>
            <option value="JP">日本 (Japan)</option>
            <option value="KR">韓國 (Korea)</option>
            <option value="US">美國 (USA)</option>
            <option value="OTHER">其他</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">出生日期 *</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">性別 *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="M">男 (Male)</option>
            <option value="F">女 (Female)</option>
            <option value="X">其他 (Other)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">發照日期 *</label>
          <input
            type="date"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">到期日期 *</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">護照類型</label>
          <select
            name="passportType"
            value={formData.passportType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ordinary">普通護照</option>
            <option value="diplomatic">外交護照</option>
            <option value="official">公務護照</option>
            <option value="service">服務護照</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">發照機關</label>
          <input
            type="text"
            name="issuingAuthority"
            value={formData.issuingAuthority || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">備註</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {initialData?.id ? '更新' : '新增'}
        </button>
      </div>
    </form>
  );
};

// Travel Readiness Check Component (Based on Odoo's compliance feature)
interface TravelReadinessProps {
  customerId: string;
  destination: string;
  travelDate: string;
}

export const TravelReadinessCheck: React.FC<TravelReadinessProps> = ({
  customerId,
  destination,
  travelDate
}) => {
  const [readinessData, setReadinessData] = useState<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkReadiness = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/passports/check/travel-ready?customer_id=${customerId}&destination_country=${destination}&travel_date=${travelDate}`
      );
      const data = await response.json();
      setReadinessData(data);
    } catch (error) {
      console.error('Failed to check travel readiness:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId, destination, travelDate]);

  useEffect(() => {
    if (customerId && destination && travelDate) {
      checkReadiness();
    }
  }, [customerId, destination, travelDate, checkReadiness]);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />;
  }

  if (!readinessData) return null;

  return (
    <div className={`rounded-lg p-4 ${readinessData.ready ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center mb-3">
        <span className={`text-2xl mr-2 ${readinessData.ready ? '' : ''}`}>
          {readinessData.ready ? '✅' : '❌'}
        </span>
        <h4 className={`font-medium ${readinessData.ready ? 'text-green-800' : 'text-red-800'}`}>
          {readinessData.ready ? '旅行文件已備齊' : '旅行文件有問題'}
        </h4>
      </div>
      
      {readinessData.issues.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-red-700 mb-1">問題:</p>
          <ul className="list-disc list-inside text-sm text-red-600">
            {readinessData.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      {readinessData.recommendations.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">建議:</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {readinessData.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default {
  PassportList,
  PassportExpiryAlerts,
  PassportForm,
  TravelReadinessCheck
};
