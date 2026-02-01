/**
 * Travel Insurance Module - Based on Odoo Travel Agency Design
 * Features: Insurance policy management, coverage tracking, claims
 * Reference: Browseinfo Odoo Tours & Travel Agency Management
 */

import React, { useState } from 'react';

// Types
export interface InsurancePolicy {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  tourId?: string;
  policyNumber: string;
  insuranceProvider: string;
  planType: 'basic' | 'standard' | 'premium' | 'comprehensive';
  coverageType: 'individual' | 'family' | 'group';
  startDate: string;
  endDate: string;
  destination: string;
  premium: number;
  currency: string;
  status: 'active' | 'expired' | 'cancelled' | 'claimed';
  coverageDetails: CoverageDetail[];
  beneficiaries: Beneficiary[];
  createdAt: string;
  updatedAt: string;
}

export interface CoverageDetail {
  type: string;
  description: string;
  maxAmount: number;
  currency: string;
}

export interface Beneficiary {
  name: string;
  relationship: string;
  percentage: number;
  phone?: string;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  claimNumber: string;
  claimType: string;
  incidentDate: string;
  incidentDescription: string;
  claimAmount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

// Insurance Providers in Taiwan
export const INSURANCE_PROVIDERS = [
  { id: 'cathay', name: '國泰人壽', logo: '🏛️' },
  { id: 'fubon', name: '富邦產險', logo: '🏦' },
  { id: 'nan_shan', name: '南山人壽', logo: '⛰️' },
  { id: 'shin_kong', name: '新光人壽', logo: '✨' },
  { id: 'taiwan_life', name: '台灣人壽', logo: '🇹🇼' },
  { id: 'allianz', name: '安聯產險', logo: '🌍' },
  { id: 'aig', name: 'AIG', logo: '🌐' },
  { id: 'msig', name: '明台產險', logo: '🔷' }
];

// Insurance Plans
export const INSURANCE_PLANS = [
  {
    type: 'basic',
    name: '基本型',
    description: '基本旅遊保障',
    coverages: [
      { type: '意外身故', maxAmount: 2000000 },
      { type: '意外醫療', maxAmount: 100000 },
      { type: '海外急難救助', maxAmount: 50000 }
    ],
    pricePerDay: 50
  },
  {
    type: 'standard',
    name: '標準型',
    description: '完整旅遊保障',
    coverages: [
      { type: '意外身故', maxAmount: 5000000 },
      { type: '意外醫療', maxAmount: 300000 },
      { type: '海外急難救助', maxAmount: 100000 },
      { type: '行李延誤', maxAmount: 10000 },
      { type: '班機延誤', maxAmount: 5000 }
    ],
    pricePerDay: 120
  },
  {
    type: 'premium',
    name: '豪華型',
    description: '高額保障方案',
    coverages: [
      { type: '意外身故', maxAmount: 10000000 },
      { type: '意外醫療', maxAmount: 500000 },
      { type: '海外急難救助', maxAmount: 200000 },
      { type: '行李延誤', maxAmount: 20000 },
      { type: '班機延誤', maxAmount: 10000 },
      { type: '旅程取消', maxAmount: 50000 },
      { type: '個人責任', maxAmount: 1000000 }
    ],
    pricePerDay: 250
  },
  {
    type: 'comprehensive',
    name: '全方位型',
    description: '最完整保障',
    coverages: [
      { type: '意外身故', maxAmount: 20000000 },
      { type: '意外醫療', maxAmount: 1000000 },
      { type: '海外急難救助', maxAmount: 500000 },
      { type: '行李延誤', maxAmount: 30000 },
      { type: '班機延誤', maxAmount: 20000 },
      { type: '旅程取消', maxAmount: 100000 },
      { type: '個人責任', maxAmount: 2000000 },
      { type: '緊急醫療轉送', maxAmount: 3000000 },
      { type: '居家竊盜', maxAmount: 100000 }
    ],
    pricePerDay: 450
  }
];

// Insurance Plan Selector Component
interface InsurancePlanSelectorProps {
  selectedPlan?: string;
  travelDays: number;
  onSelect: (planType: string, premium: number) => void;
}

export const InsurancePlanSelector: React.FC<InsurancePlanSelectorProps> = ({
  selectedPlan,
  travelDays,
  onSelect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {INSURANCE_PLANS.map((plan) => {
        const totalPremium = plan.pricePerDay * travelDays;
        const isSelected = selectedPlan === plan.type;

        return (
          <div
            key={plan.type}
            onClick={() => onSelect(plan.type, totalPremium)}
            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {plan.type === 'premium' && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                推薦
              </span>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
            
            <div className="text-2xl font-bold text-blue-600 mb-3">
              NT$ {totalPremium.toLocaleString()}
              <span className="text-sm font-normal text-gray-500">
                / {travelDays}天
              </span>
            </div>
            
            <ul className="space-y-1 text-sm">
              {plan.coverages.slice(0, 4).map((coverage, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  {coverage.type}: {(coverage.maxAmount / 10000).toLocaleString()}萬
                </li>
              ))}
              {plan.coverages.length > 4 && (
                <li className="text-blue-600">
                  +{plan.coverages.length - 4} 項保障...
                </li>
              )}
            </ul>

            {isSelected && (
              <div className="absolute top-2 left-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  ✓
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Insurance Policy Card Component
interface InsurancePolicyCardProps {
  policy: InsurancePolicy;
  onViewDetails: (policy: InsurancePolicy) => void;
  onFileClaim?: (policy: InsurancePolicy) => void;
}

export const InsurancePolicyCard: React.FC<InsurancePolicyCardProps> = ({
  policy,
  onViewDetails,
  onFileClaim
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'claimed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '生效中',
      expired: '已過期',
      cancelled: '已取消',
      claimed: '理賠中'
    };
    return labels[status] || status;
  };

  const provider = INSURANCE_PROVIDERS.find(p => p.id === policy.insuranceProvider);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{provider?.logo || '🛡️'}</span>
            <div>
              <h3 className="font-semibold">{provider?.name || policy.insuranceProvider}</h3>
              <p className="text-sm text-blue-100">保單號碼: {policy.policyNumber}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(policy.status)}`}>
            {getStatusLabel(policy.status)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">被保險人</p>
            <p className="font-medium">{policy.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">目的地</p>
            <p className="font-medium">{policy.destination}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">保險期間</p>
            <p className="font-medium text-sm">
              {policy.startDate} ~ {policy.endDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">保費</p>
            <p className="font-medium text-blue-600">
              {policy.currency} {policy.premium.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t pt-3 flex justify-between">
          <button
            onClick={() => onViewDetails(policy)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            查看詳情
          </button>
          {policy.status === 'active' && onFileClaim && (
            <button
              onClick={() => onFileClaim(policy)}
              className="text-orange-600 hover:text-orange-800 text-sm font-medium"
            >
              申請理賠
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Insurance Form Component
interface InsuranceFormProps {
  initialData?: Partial<InsurancePolicy>;
  customerId?: string;
  orderId?: string;
  travelDays?: number;
  destination?: string;
  onSubmit: (data: Partial<InsurancePolicy>) => void;
  onCancel: () => void;
}

export const InsuranceForm: React.FC<InsuranceFormProps> = ({
  initialData,
  customerId,
  orderId,
  travelDays = 5,
  destination = '',
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<InsurancePolicy>>({
    customerId: customerId || '',
    orderId: orderId || '',
    insuranceProvider: '',
    planType: 'standard',
    coverageType: 'individual',
    destination: destination,
    currency: 'TWD',
    ...initialData
  });

  const [selectedPlan, setSelectedPlan] = useState<string>(formData.planType || 'standard');
  const [calculatedPremium, setCalculatedPremium] = useState<number>(0);

  const handlePlanSelect = (planType: string, premium: number) => {
    setSelectedPlan(planType);
    setCalculatedPremium(premium);
    setFormData(prev => ({ 
      ...prev, 
      planType: planType as InsurancePolicy['planType'],
      premium: premium 
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      premium: calculatedPremium
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Insurance Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">保險公司 *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INSURANCE_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              onClick={() => setFormData(prev => ({ ...prev, insuranceProvider: provider.id }))}
              className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                formData.insuranceProvider === provider.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">{provider.logo}</span>
              <p className="text-sm font-medium mt-1">{provider.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">選擇方案 *</label>
        <InsurancePlanSelector
          selectedPlan={selectedPlan}
          travelDays={travelDays}
          onSelect={handlePlanSelect}
        />
      </div>

      {/* Coverage Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">投保類型</label>
          <select
            name="coverageType"
            value={formData.coverageType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="individual">個人</option>
            <option value="family">家庭</option>
            <option value="group">團體</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">起始日期</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">結束日期</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700">旅遊目的地</label>
        <input
          type="text"
          name="destination"
          value={formData.destination || ''}
          onChange={handleChange}
          placeholder="例如：日本、韓國、歐洲"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Premium Summary */}
      {calculatedPremium > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">預估保費</span>
            <span className="text-2xl font-bold text-blue-600">
              NT$ {calculatedPremium.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {INSURANCE_PLANS.find(p => p.type === selectedPlan)?.name} × {travelDays} 天
          </p>
        </div>
      )}

      {/* Form Actions */}
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
          {initialData?.id ? '更新保單' : '投保'}
        </button>
      </div>
    </form>
  );
};

// Insurance Claim Form Component
interface InsuranceClaimFormProps {
  policyId: string;
  onSubmit: (claim: Partial<InsuranceClaim>) => void;
  onCancel: () => void;
}

export const InsuranceClaimForm: React.FC<InsuranceClaimFormProps> = ({
  policyId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<InsuranceClaim>>({
    policyId,
    claimType: '',
    incidentDate: '',
    incidentDescription: '',
    claimAmount: 0,
    status: 'submitted'
  });

  const claimTypes = [
    { id: 'medical', name: '醫療費用' },
    { id: 'baggage', name: '行李損失/延誤' },
    { id: 'flight', name: '班機延誤/取消' },
    { id: 'trip_cancel', name: '旅程取消' },
    { id: 'accident', name: '意外傷害' },
    { id: 'liability', name: '個人責任' },
    { id: 'other', name: '其他' }
  ];

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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-yellow-800 mb-2">理賠申請須知</h4>
        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>請於事故發生後30天內提出申請</li>
          <li>請備齊相關證明文件</li>
          <li>理賠審核約需5-10個工作天</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">理賠類型 *</label>
          <select
            name="claimType"
            value={formData.claimType}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">請選擇</option>
            {claimTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">事故日期 *</label>
          <input
            type="date"
            name="incidentDate"
            value={formData.incidentDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">理賠金額 *</label>
          <input
            type="number"
            name="claimAmount"
            value={formData.claimAmount}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">事故說明 *</label>
        <textarea
          name="incidentDescription"
          value={formData.incidentDescription}
          onChange={handleChange}
          required
          rows={4}
          placeholder="請詳細描述事故經過..."
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
        >
          提交理賠申請
        </button>
      </div>
    </form>
  );
};

export default {
  InsurancePlanSelector,
  InsurancePolicyCard,
  InsuranceForm,
  InsuranceClaimForm,
  INSURANCE_PROVIDERS,
  INSURANCE_PLANS
};
