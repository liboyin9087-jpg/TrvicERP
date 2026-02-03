import React from 'react';

interface StatusBadgeConfigEntry {
  bg: string;
  text: string;
  label: string;
}

type DefaultStatusKey = 'draft' | 'quoted' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'pending' | 'paid';

const DEFAULT_STATUS_BADGE_CONFIG: Record<DefaultStatusKey, StatusBadgeConfigEntry> = {
  draft: { bg: 'bg-primary-100', text: 'text-primary-800', label: 'Draft' },
  quoted: { bg: 'bg-secondary-100', text: 'text-secondary-800', label: 'Quoted' },
  confirmed: { bg: 'bg-success-100', text: 'text-success-800', label: 'Confirmed' },
  ongoing: { bg: 'bg-info-100', text: 'text-info-800', label: 'Ongoing' },
  completed: { bg: 'bg-neutral-200', text: 'text-neutral-700', label: 'Completed' },
  cancelled: { bg: 'bg-danger-100', text: 'text-danger-800', label: 'Cancelled' },
  pending: { bg: 'bg-warning-100', text: 'text-warning-800', label: 'Pending' },
  paid: { bg: 'bg-success-200', text: 'text-success-900', label: 'Paid' },
};

const UNKNOWN_STATUS_CONFIG_ENTRY: StatusBadgeConfigEntry = {
  bg: 'bg-neutral-100',
  text: 'text-neutral-600',
  label: 'Unknown',
};

interface StatusBadgeProps {
  status: DefaultStatusKey | string;
  statusConfig?: Partial<Record<DefaultStatusKey | string, StatusBadgeConfigEntry>>;
  fallbackStatus?: DefaultStatusKey | string;
  className?: string;
}

export default function StatusBadge({
  status,
  statusConfig,
  fallbackStatus = 'draft',
  className,
}: StatusBadgeProps) {
  const mergedConfig: Record<string, StatusBadgeConfigEntry> = {
    ...DEFAULT_STATUS_BADGE_CONFIG,
    ...(statusConfig as Record<string, StatusBadgeConfigEntry>),
  };

  let config = mergedConfig[status];

  if (!config) {
    if (fallbackStatus && mergedConfig[fallbackStatus]) {
      config = mergedConfig[fallbackStatus];
    } else if (mergedConfig.draft) {
      config = mergedConfig.draft;
    } else {
      config = UNKNOWN_STATUS_CONFIG_ENTRY;
    }
  }

  const baseClasses = `inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold`;

  return (
    <span className={`${baseClasses} ${config.bg} ${config.text} ${className || ''}`}>
      {config.label}
    </span>
  );
}