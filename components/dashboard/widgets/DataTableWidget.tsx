import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import StatusBadge from '../ui/StatusBadge';

interface OrderData {
  id: string;
  company: string;
  trip: string;
  date: string;
  pax: number;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Approved' | 'Rejected';
}

export interface DataTableWidgetConfig {
  tableRowLimit?: number;
  data: OrderData[];
  title?: string;
}

interface DataTableHeaderProps {
  columns: {
    label: string;
    align?: 'left' | 'right' | 'center';
  }[];
}

function DataTableHeader({ columns }: DataTableHeaderProps) {
  return (
    <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase">
      <tr>
        {columns.map((col, index) => (
          <th
            key={index}
            scope="col"
            className={`px-3 py-2 font-medium ${
              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
            }`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface DataTableWidgetProps {
  widget: Widget<DataTableWidgetConfig>;
}

export default function DataTableWidget({ widget }: DataTableWidgetProps) {
  const { config } = widget;
  const limit = config.tableRowLimit || 5;
  const rows = config.data ? config.data.slice(0, limit) : [];

  const tableColumns = [
    { label: 'Company', align: 'left' },
    { label: 'Trip', align: 'left' },
    { label: 'Date', align: 'left' },
    { label: 'Pax', align: 'right' },
    { label: 'Amount', align: 'right' },
    { label: 'Status', align: 'center' },
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-neutral-200">
        <h3 className="text-base font-semibold text-neutral-900">{config.title || widget.title || 'Recent Orders'}</h3>
        <div className="drag-handle w-6 h-6 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </div>
      </div>

      <div className="flex-grow overflow-x-auto relative text-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-neutral-500">
            <svg className="w-12 h-12 mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-lg font-medium">No recent orders found</p>
            <p className="text-sm">There is no data to display in this widget.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-100">
            <DataTableHeader columns={tableColumns} />
            <tbody className="divide-y divide-neutral-100">
              {rows.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium text-neutral-900">{order.company}</td>
                  <td className="px-3 py-2 text-neutral-600">{order.trip}</td>
                  <td className="px-3 py-2 text-neutral-500">{order.date}</td>
                  <td className="px-3 py-2 text-right text-neutral-600">{formatNumber(order.pax)}</td>
                  <td className="px-3 py-2 text-right text-neutral-900">{formatCurrency(order.amount)}</td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}