import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Card } from '../../../components/ui/Card/Card';
import { TourPackage, TourVariant, ExtraService } from '../types';

interface TourPackageFormProps {
  package?: TourPackage;
  onSave: (pkg: TourPackage) => void;
  onCancel: () => void;
}

export const TourPackageForm: React.FC<TourPackageFormProps> = ({
  package: initialPackage,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<TourPackage>>({
    name: '',
    description: '',
    duration: 1,
    basePrice: 0,
    costPrice: 0,
    minGroupSize: 1,
    maxGroupSize: 50,
    variants: [],
    extraServices: [],
    status: 'draft',
    ...initialPackage,
  });

  const [variants, setVariants] = useState<TourVariant[]>(initialPackage?.variants || []);
  const [extraServices, setExtraServices] = useState<ExtraService[]>(initialPackage?.extraServices || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completePackage: TourPackage = {
      id: initialPackage?.id || `pkg_${Date.now()}`,
      name: formData.name || '',
      description: formData.description || '',
      duration: formData.duration || 1,
      basePrice: formData.basePrice || 0,
      costPrice: formData.costPrice || 0,
      minGroupSize: formData.minGroupSize || 1,
      maxGroupSize: formData.maxGroupSize || 50,
      earlyBirdDiscount: formData.earlyBirdDiscount,
      groupDiscount: formData.groupDiscount,
      variants,
      extraServices,
      status: formData.status || 'draft',
      createdAt: initialPackage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(completePackage);
  };

  const addVariant = () => {
    const newVariant: TourVariant = {
      id: `var_${Date.now()}`,
      name: '',
      priceAdjustment: 0,
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, field: keyof TourVariant, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addExtraService = () => {
    const newService: ExtraService = {
      id: `svc_${Date.now()}`,
      name: '',
      price: 0,
      type: 'other',
      required: false,
    };
    setExtraServices([...extraServices, newService]);
  };

  const updateExtraService = (index: number, field: keyof ExtraService, value: any) => {
    const updatedServices = [...extraServices];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setExtraServices(updatedServices);
  };

  const removeExtraService = (index: number) => {
    setExtraServices(extraServices.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card title={initialPackage ? '編輯套裝行程' : '建立新套裝行程'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="套裝名稱"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            <Input
              label="天數"
              type="number"
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="售價 (NT$)"
              type="number"
              value={formData.basePrice}
              onChange={(value) => setFormData({ ...formData, basePrice: parseInt(value) })}
              required
            />
            <Input
              label="成本價 (NT$)"
              type="number"
              value={formData.costPrice}
              onChange={(value) => setFormData({ ...formData, costPrice: parseInt(value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="最低成團人數"
              type="number"
              value={formData.minGroupSize}
              onChange={(value) => setFormData({ ...formData, minGroupSize: parseInt(value) })}
              required
            />
            <Input
              label="最高成團人數"
              type="number"
              value={formData.maxGroupSize}
              onChange={(value) => setFormData({ ...formData, maxGroupSize: parseInt(value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="早鳥折扣 (%)"
              type="number"
              value={formData.earlyBirdDiscount || ''}
              onChange={(value) => setFormData({ ...formData, earlyBirdDiscount: parseFloat(value) || undefined })}
            />
            <Input
              label="團體折扣 (%)"
              type="number"
              value={formData.groupDiscount || ''}
              onChange={(value) => setFormData({ ...formData, groupDiscount: parseFloat(value) || undefined })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              套裝描述
            </label>
            <textarea
              className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md min-h-[120px] resize-vertical"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 變體設定 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">房型/艙等變體</h3>
              <Button variant="secondary" onClick={addVariant}>
                + 新增變體
              </Button>
            </div>
            {variants.map((variant, index) => (
              <Card key={variant.id} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="變體名稱"
                    value={variant.name}
                    onChange={(value) => updateVariant(index, 'name', value)}
                  />
                  <Input
                    label="價格調整 (NT$)"
                    type="number"
                    value={variant.priceAdjustment}
                    onChange={(value) => updateVariant(index, 'priceAdjustment', parseInt(value))}
                  />
                  <div className="flex items-end">
                    <Button variant="danger" onClick={() => removeVariant(index)}>
                      刪除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 加購服務 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">加購服務</h3>
              <Button variant="secondary" onClick={addExtraService}>
                + 新增服務
              </Button>
            </div>
            {extraServices.map((service, index) => (
              <Card key={service.id} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="服務名稱"
                    value={service.name}
                    onChange={(value) => updateExtraService(index, 'name', value)}
                  />
                  <Input
                    label="價格 (NT$)"
                    type="number"
                    value={service.price}
                    onChange={(value) => updateExtraService(index, 'price', parseInt(value))}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      服務類型
                    </label>
                    <select
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={service.type}
                      onChange={(e) => updateExtraService(index, 'type', e.target.value)}
                    >
                      <option value="insurance">旅遊保險</option>
                      <option value="single_room">單人房差</option>
                      <option value="visa">簽證費</option>
                      <option value="guide">專屬導遊</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="danger" onClick={() => removeExtraService(index)}>
                      刪除
                    </Button>
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
              {initialPackage ? '更新套裝' : '建立套裝'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
