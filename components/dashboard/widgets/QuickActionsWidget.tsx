import React from 'react';
import { DollarSign, Download, Plus, Users } from 'lucide-react';
import type { Widget } from '@/core/types/dashboard';
import { QUICK_ACTIONS } from '@/data/dashboardData';

const ICON_MAP = {
  'new-tour': Plus,
  'new-quote': DollarSign,
  'manage-customers': Users,
  'export-report': Download,
};

export default function QuickActionsWidget(_: { widget: Widget }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {QUICK_ACTIONS.map((action) => {
        const Icon = ICON_MAP[action.id as keyof typeof ICON_MAP] || Plus;
        return (
          <button
            key={action.id}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
          >
            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
              <Icon size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
