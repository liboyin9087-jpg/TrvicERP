/**
 * Visa Management Module - Based on Odoo Visa Management Design
 * Features: Visa application tracking, requirements database, status management
 * Reference: Odoo Employee Visa Passport Management Module
 */

import React, { useState, useEffect } from 'react';

// Types based on Odoo's visa management schema
export interface VisaApplication {
  id: string;
  passportId: string;
  customerId: string;
  customerName: string;
  country: string;
  countryName: string;
  visaType: 'tourist' | 'business' | 'work' | 'student' | 'transit' | 'other';
  visaNumber?: string;
  entries: 'single' | 'double' | 'multiple';
  applicationDate?: string;
  issueDate?: string;
  expiryDate?: string;
  durationOfStay?: number;
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  processingFee?: number;
  currency?: string;
  notes?: string;
  documents: VisaDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface VisaDocument {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  uploadedAt: string;
  verified: boolean;
}

export interface VisaRequirement {
  country: string;
  countryName: string;
  visaRequired: boolean;
  visaOnArrival: boolean;
  eVisaAvailable: boolean;
  maxStayDays: number;
  processingDays: number;
  requiredDocuments: string[];
  fees: {
    type: string;
    amount: number;
    currency: string;
  }[];
  notes?: string;
}

// Sample visa requirements database (Based on Taiwan passport holders)
export const VISA_REQUIREMENTS: Record<string, VisaRequirement> = {
  JP: {
    country: 'JP',
    countryName: '日本',
    visaRequired: false,
    visaOnArrival: false,
    eVisaAvailable: false,
    maxStayDays: 90,
    processingDays: 0,
    requiredDocuments: ['有效護照（6個月以上效期）', '回程機票', '住宿證明'],
    fees: [],
    notes: '免簽證，可停留90天'
  },
  KR: {
    country: 'KR',
    countryName: '韓國',
    visaRequired: false,
    visaOnArrival: false,
    eVisaAvailable: false,
    maxStayDays: 90,
    processingDays: 0,
    requiredDocuments: ['有效護照（6個月以上效期）', '回程機票'],
    fees: [],
    notes: '免簽證，可停留90天。需申請K-ETA'
  },
  US: {
    country: 'US',
    countryName: '美國',
    visaRequired: false,
    visaOnArrival: false,
    eVisaAvailable: true,
    maxStayDays: 90,
    processingDays: 3,
    requiredDocuments: ['有效護照（6個月以上效期）', 'ESTA授權', '回程機票', '住宿證明'],
    fees: [{ type: 'ESTA', amount: 21, currency: 'USD' }],
    notes: '需事先申請ESTA電子旅行授權'
  },
  CN: {
    country: 'CN',
    countryName: '中國大陸',
    visaRequired: true,
    visaOnArrival: false,
    eVisaAvailable: false,
    maxStayDays: 30,
    processingDays: 7,
    requiredDocuments: ['有效台胞證', '或申請落地簽證'],
    fees: [{ type: '台胞證', amount: 1700, currency: 'TWD' }],
    notes: '需持有效台胞證或辦理相關入境許可'
  },
  TH: {
    country: 'TH',
    countryName: '泰國',
    visaRequired: false,
    visaOnArrival: true,
    eVisaAvailable: true,
    maxStayDays: 30,
    processingDays: 0,
    requiredDocuments: ['有效護照（6個月以上效期）', '回程機票', '住宿證明', '財力證明'],
    fees: [{ type: '落地簽', amount: 2000, currency: 'THB' }],
    notes: '可免簽入境30天或申請落地簽'
  },
  VN: {
    country: 'VN',
    countryName: '越南',
    visaRequired: true,
    visaOnArrival: true,
    eVisaAvailable: true,
    maxStayDays: 30,
    processingDays: 3,
    requiredDocuments: ['有效護照（6個月以上效期）', '簽證申請表', '2吋照片', '邀請函（商務）'],
    fees: [
      { type: '電子簽證', amount: 25, currency: 'USD' },
      { type: '落地簽', amount: 25, currency: 'USD' }
    ],
    notes: '建議事先申請電子簽證'
  },
  AU: {
    country: 'AU',
    countryName: '澳洲',
    visaRequired: true,
    visaOnArrival: false,
    eVisaAvailable: true,
    maxStayDays: 90,
    processingDays: 5,
    requiredDocuments: ['有效護照（6個月以上效期）', 'ETA電子簽證申請'],
    fees: [{ type: 'ETA', amount: 20, currency: 'AUD' }],
    notes: '需申請ETA電子旅行授權'
  },
  EU: {
    country: 'EU',
    countryName: '申根區',
    visaRequired: false,
    visaOnArrival: false,
    eVisaAvailable: false,
    maxStayDays: 90,
    processingDays: 0,
    requiredDocuments: ['有效護照（6個月以上效期）', '回程機票', '住宿證明', '旅遊保險'],
    fees: [],
    notes: '免簽證，180天內可停留90天。2025年起需申請ETIAS'
  }
};

// Visa Status Badge Component
export const VisaStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-gray-100 text-gray-800', label: '草稿' },
    submitted: { color: 'bg-blue-100 text-blue-800', label: '已送件' },
    processing: { color: 'bg-yellow-100 text-yellow-800', label: '審核中' },
    approved: { color: 'bg-green-100 text-green-800', label: '已核發' },
    rejected: { color: 'bg-red-100 text-red-800', label: '已拒絕' },
    expired: { color: 'bg-gray-100 text-gray-800', label: '已過期' },
    cancelled: { color: 'bg-gray-100 text-gray-800', label: '已取消' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

// Visa Requirements Checker Component
interface VisaRequirementsCheckerProps {
  destinationCountry: string;
  nationality?: string;
}

export const VisaRequirementsChecker: React.FC<VisaRequirementsCheckerProps> = ({
  destinationCountry,
  nationality = 'TW'
}) => {
  const requirement = VISA_REQUIREMENTS[destinationCountry];

  if (!requirement) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">暫無 {destinationCountry} 的簽證資訊</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className={`px-4 py-3 ${requirement.visaRequired ? 'bg-orange-50' : 'bg-green-50'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {requirement.countryName} 簽證要求
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            requirement.visaRequired 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {requirement.visaRequired ? '需要簽證' : '免簽證'}
          </span>
        </div>
      </div>
      
      <div className="px-4 py-4 space-y-4">
        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-2xl font-bold text-blue-600">{requirement.maxStayDays}</p>
            <p className="text-xs text-gray-500">最長停留天數</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-2xl font-bold text-blue-600">{requirement.processingDays}</p>
            <p className="text-xs text-gray-500">處理工作天</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-lg font-bold">
              {requirement.visaOnArrival ? '✅' : '❌'}
            </p>
            <p className="text-xs text-gray-500">落地簽</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-lg font-bold">
              {requirement.eVisaAvailable ? '✅' : '❌'}
            </p>
            <p className="text-xs text-gray-500">電子簽證</p>
          </div>
        </div>

        {/* Required Documents */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">所需文件</h4>
          <ul className="space-y-1">
            {requirement.requiredDocuments.map((doc, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-2 text-xs">
                  {index + 1}
                </span>
                {doc}
              </li>
            ))}
          </ul>
        </div>

        {/* Fees */}
        {requirement.fees.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">簽證費用</h4>
            <div className="space-y-1">
              {requirement.fees.map((fee, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{fee.type}</span>
                  <span className="font-medium">{fee.amount} {fee.currency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {requirement.notes && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">備註：</span> {requirement.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Visa Application List Component
interface VisaApplicationListProps {
  applications: VisaApplication[];
  onEdit: (application: VisaApplication) => void;
  onViewDetails: (application: VisaApplication) => void;
}

export const VisaApplicationList: React.FC<VisaApplicationListProps> = ({
  applications,
  onEdit,
  onViewDetails
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請人</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目的地</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">簽證類型</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請日期</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{app.customerName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {app.countryName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {app.visaType === 'tourist' && '觀光簽證'}
                {app.visaType === 'business' && '商務簽證'}
                {app.visaType === 'work' && '工作簽證'}
                {app.visaType === 'student' && '學生簽證'}
                {app.visaType === 'transit' && '過境簽證'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {app.applicationDate || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <VisaStatusBadge status={app.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onViewDetails(app)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  查看
                </button>
                <button
                  onClick={() => onEdit(app)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  編輯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Visa Application Form Component
interface VisaApplicationFormProps {
  initialData?: Partial<VisaApplication>;
  passportId?: string;
  customerId?: string;
  onSubmit: (data: Partial<VisaApplication>) => void;
  onCancel: () => void;
}

export const VisaApplicationForm: React.FC<VisaApplicationFormProps> = ({
  initialData,
  passportId,
  customerId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<VisaApplication>>({
    passportId: passportId || '',
    customerId: customerId || '',
    country: '',
    visaType: 'tourist',
    entries: 'single',
    status: 'draft',
    ...initialData
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(formData.country || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'country') {
      setSelectedCountry(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">目的地國家 *</label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">請選擇</option>
            {Object.entries(VISA_REQUIREMENTS).map(([code, req]) => (
              <option key={code} value={code}>{req.countryName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">簽證類型 *</label>
          <select
            name="visaType"
            value={formData.visaType}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="tourist">觀光簽證</option>
            <option value="business">商務簽證</option>
            <option value="work">工作簽證</option>
            <option value="student">學生簽證</option>
            <option value="transit">過境簽證</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">入境次數</label>
          <select
            name="entries"
            value={formData.entries}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="single">單次入境</option>
            <option value="double">兩次入境</option>
            <option value="multiple">多次入境</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">申請日期</label>
          <input
            type="date"
            name="applicationDate"
            value={formData.applicationDate || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">簽證費用</label>
          <input
            type="number"
            name="processingFee"
            value={formData.processingFee || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">幣別</label>
          <select
            name="currency"
            value={formData.currency || 'TWD'}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TWD">TWD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
      </div>

      {/* Show visa requirements for selected country */}
      {selectedCountry && (
        <div className="mt-4">
          <VisaRequirementsChecker destinationCountry={selectedCountry} />
        </div>
      )}

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

export default {
  VisaStatusBadge,
  VisaRequirementsChecker,
  VisaApplicationList,
  VisaApplicationForm,
  VISA_REQUIREMENTS
};
