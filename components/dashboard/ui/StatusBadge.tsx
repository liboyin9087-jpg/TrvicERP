import React from 'react';

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  quoted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Quoted' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
  ongoing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ongoing' },
  completed: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Paid' },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
