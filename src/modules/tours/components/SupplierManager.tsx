import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Card/Card';
import { Input } from '../../../components/ui/Input/Input';
import { Supplier, ContactInfo } from '../types';

interface SupplierManagerProps {
  onSupplierSave: (supplier: Supplier) => void;
  onSupplierDelete: (supplierId: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
  onSupplierSave,
  onSupplierDelete,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 'supplier_1',
      name: '阿里山賓館',
      type: 'hotel',
      contactInfo: {
        phone: '05-2777166',
        email: 'alishan@hotel.com',
        address: '嘉義縣阿里山鄉中正村39號',
        person: '陳經理',
      },
      contractRate: 2500,
      paymentTerms: '月結30天',
    },
    {
      id: 'supplier_2',
      name: '台灣客運',
      type: 'transport',
      contactInfo: {
        phone: '02-2349-5678',
        email: 'service@taiwanbus.com',
        address: '台北市重慶北路一段',
        person: '林小姐',
      },
      contractRate: 8000,
      paymentTerms: '月結60天',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier>>({
    name: '',
    type: 'hotel',
    contactInfo: {
      phone: '',
      email: '',
      address: '',
      person: '',
    },
    contractRate: 0,
    paymentTerms: '',
  });

  const [filter, setFilter] = useState<string>('all');

  const filteredSuppliers = filter === 'all' 
    ? suppliers 
    : suppliers.filter(s => s.type === filter);

  const handleSaveSupplier = () => {
    if (!editingSupplier.name || !editingSupplier.contactInfo?.phone) {
      alert('請填寫供應商名稱和聯絡電話');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier.id || `supplier_${Date.now()}`,
      name: editingSupplier.name,
      type: editingSupplier.type as any,
      contactInfo: editingSupplier.contactInfo as ContactInfo,
      contractRate: editingSupplier.contractRate || 0,
      paymentTerms: editingSupplier.paymentTerms || '',
    };

    if (editingSupplier.id) {
      // 更新現有供應商
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? newSupplier : s));
    } else {
      // 新增供應商
      setSuppliers([...suppliers, newSupplier]);
    }

    onSupplierSave(newSupplier);
    setShowAddForm(false);
    setEditingSupplier({
      name: '',
      type: 'hotel',
      contactInfo: {
        phone: '',
        email: '',
        address: '',
        person: '',
      },
      contractRate: 0,
      paymentTerms: '',
    });
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowAddForm(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (confirm('確定要刪除這個供應商嗎？')) {
      setSuppliers(suppliers.filter(s => s.id !== supplierId));
      onSupplierDelete(supplierId);
    }
  };

  const getSupplierTypeText = (type: string) => {
    switch (type) {
      case 'hotel':
        return '飯店';
      case 'transport':
        return '交通';
      case 'restaurant':
        return '餐廳';
      case 'guide':
        return '導遊';
      case 'attraction':
        return '景點';
      default:
        return type;
    }
  };

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800';
      case 'transport':
        return 'bg-green-100 text-green-800';
      case 'restaurant':
        return 'bg-orange-100 text-orange-800';
      case 'guide':
        return 'bg-purple-100 text-purple-800';
      case 'attraction':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card title="供應商管理">
        {/* 篩選和新增按鈕 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              variant={filter === 'hotel' ? 'primary' : 'secondary'}
              onClick={() => setFilter('hotel')}
            >
              飯店
            </Button>
            <Button
              variant={filter === 'transport' ? 'primary' : 'secondary'}
              onClick={() => setFilter('transport')}
            >
              交通
            </Button>
            <Button
              variant={filter === 'restaurant' ? 'primary' : 'secondary'}
              onClick={() => setFilter('restaurant')}
            >
              餐廳
            </Button>
            <Button
              variant={filter === 'guide' ? 'primary' : 'secondary'}
              onClick={() => setFilter('guide')}
            >
              導遊
            </Button>
            <Button
              variant={filter === 'attraction' ? 'primary' : 'secondary'}
              onClick={() => setFilter('attraction')}
            >
              景點
            </Button>
          </div>
          <Button variant="primary" onClick={() => setShowAddForm(true)}>
            + 新增供應商
          </Button>
        </div>

        {/* 供應商列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {supplier.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md mt-1 ${getSupplierTypeColor(supplier.type)}`}>
                    {getSupplierTypeText(supplier.type)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="tertiary" onClick={() => handleEditSupplier(supplier)}>
                    編輯
                  </Button>
                  <Button variant="danger" onClick={() => handleDeleteSupplier(supplier.id)}>
                    刪除
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">聯絡人：</span>
                  <span className="font-medium">{supplier.contactInfo.person}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">電話：</span>
                  <span className="font-medium">{supplier.contactInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Email：</span>
                  <span className="font-medium">{supplier.contactInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">合約費率：</span>
                  <span className="font-medium">NT${supplier.contractRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">付款條件：</span>
                  <span className="font-medium">{supplier.paymentTerms}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="text-xs text-neutral-500">
                  📍 {supplier.contactInfo.address}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 新增/編輯供應商表單 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                {editingSupplier.id ? '編輯供應商' : '新增供應商'}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="供應商名稱"
                    value={editingSupplier.name}
                    onChange={(value) => setEditingSupplier({
                      ...editingSupplier,
                      name: value,
                    })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      供應商類型
                    </label>
                    <select
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={editingSupplier.type}
                      onChange={(e) => setEditingSupplier({
                        ...editingSupplier,
                        type: e.target.value as any,
                      })}
                    >
                      <option value="hotel">飯店</option>
                      <option value="transport">交通</option>
                      <option value="restaurant">餐廳</option>
                      <option value="guide">導遊</option>
                      <option value="attraction">景點</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="聯絡人"
                    value={editingSupplier.contactInfo?.person || ''}
                    onChange={(value) => setEditingSupplier({
                      ...editingSupplier,
                      contactInfo: {
                        ...editingSupplier.contactInfo!,
                        person: value,
                      },
                    })}
                    required
                  />
                  <Input
                    label="電話"
                    value={editingSupplier.contactInfo?.phone || ''}
                    onChange={(value) => setEditingSupplier({
                      ...editingSupplier,
                      contactInfo: {
                        ...editingSupplier.contactInfo!,
                        phone: value,
                      },
                    })}
                    required
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={editingSupplier.contactInfo?.email || ''}
                  onChange={(value) => setEditingSupplier({
                    ...editingSupplier,
                    contactInfo: {
                      ...editingSupplier.contactInfo!,
                      email: value,
                    },
                  })}
                />

                <Input
                  label="地址"
                  value={editingSupplier.contactInfo?.address || ''}
                  onChange={(value) => setEditingSupplier({
                    ...editingSupplier,
                    contactInfo: {
                      ...editingSupplier.contactInfo!,
                      address: value,
                    },
                  })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="合約費率 (NT$)"
                    type="number"
                    value={editingSupplier.contractRate}
                    onChange={(value) => setEditingSupplier({
                      ...editingSupplier,
                      contractRate: parseInt(value) || 0,
                    })}
                  />
                  <Input
                    label="付款條件"
                    value={editingSupplier.paymentTerms}
                    onChange={(value) => setEditingSupplier({
                      ...editingSupplier,
                      paymentTerms: value,
                    })}
                    placeholder="例：月結30天"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-neutral-200">
                <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
                <Button variant="primary" onClick={handleSaveSupplier}>
                  {editingSupplier.id ? '更新' : '新增'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};
