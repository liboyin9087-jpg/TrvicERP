import React from 'react';

/**
 * Empty State Illustrations
 * SVG illustrations for empty states with travel theme
 */

/**
 * No Customers - Hot Air Balloon
 * SVG illustration for empty customer list state
 */
export const NoCustomersIllustration: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hot air balloon illustration representing no customers yet">
    {/* Sky Background */}
    <rect width="200" height="200" fill="#e0f2fe" />
    
    {/* Clouds */}
    <ellipse cx="40" cy="50" rx="15" ry="10" fill="white" opacity="0.7" />
    <ellipse cx="50" cy="48" rx="12" ry="8" fill="white" opacity="0.7" />
    <ellipse cx="160" cy="60" rx="18" ry="12" fill="white" opacity="0.6" />
    
    {/* Hot Air Balloon - Left stripe */}
    <ellipse cx="85" cy="80" rx="40" ry="50" fill="#60a5fa" />
    {/* Hot Air Balloon - Center stripe */}
    <ellipse cx="100" cy="80" rx="40" ry="50" fill="#3b82f6" />
    {/* Hot Air Balloon - Right stripe */}
    <ellipse cx="115" cy="80" rx="40" ry="50" fill="#fb923c" />
    
    {/* Balloon Bottom */}
    <path d="M 70 130 Q 100 135 130 130" fill="none" stroke="#1e293b" strokeWidth="2" />
    
    {/* Ropes */}
    <line x1="75" y1="130" x2="85" y2="150" stroke="#64748b" strokeWidth="1.5" />
    <line x1="125" y1="130" x2="115" y2="150" stroke="#64748b" strokeWidth="1.5" />
    
    {/* Basket */}
    <rect x="85" y="150" width="30" height="25" rx="2" fill="#a0522d" stroke="#654321" strokeWidth="2" />
    <line x1="85" y1="160" x2="115" y2="160" stroke="#654321" strokeWidth="1" />
    <line x1="95" y1="150" x2="95" y2="175" stroke="#654321" strokeWidth="1" />
    <line x1="105" y1="150" x2="105" y2="175" stroke="#654321" strokeWidth="1" />
  </svg>
);

/**
 * No Sessions - Airplane on Runway
 * SVG illustration for empty sessions list state
 */
export const NoSessionsIllustration: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Airplane on runway illustration representing no sessions scheduled">
    {/* Sky */}
    <rect width="200" height="120" fill="#bfdbfe" />
    
    {/* Runway */}
    <rect y="120" width="200" height="80" fill="#64748b" />
    
    {/* Runway Lines */}
    <rect x="10" y="155" width="30" height="10" fill="#fbbf24" />
    <rect x="50" y="155" width="30" height="10" fill="#fbbf24" />
    <rect x="90" y="155" width="30" height="10" fill="#fbbf24" />
    <rect x="130" y="155" width="30" height="10" fill="#fbbf24" />
    <rect x="170" y="155" width="30" height="10" fill="#fbbf24" />
    
    {/* Airplane Body */}
    <ellipse cx="100" cy="140" rx="35" ry="12" fill="#3b82f6" />
    
    {/* Airplane Wings */}
    <ellipse cx="100" cy="140" rx="55" ry="8" fill="#60a5fa" />
    
    {/* Airplane Tail */}
    <polygon points="65,140 60,135 60,145" fill="#3b82f6" />
    <polygon points="60,135 55,130 60,135" fill="#60a5fa" />
    
    {/* Windows */}
    <circle cx="95" cy="138" r="2" fill="#e0f2fe" />
    <circle cx="100" cy="138" r="2" fill="#e0f2fe" />
    <circle cx="105" cy="138" r="2" fill="#e0f2fe" />
    <circle cx="110" cy="138" r="2" fill="#e0f2fe" />
  </svg>
);

/**
 * No Orders - Empty Suitcase
 * SVG illustration for empty orders list state
 */
export const NoOrdersIllustration: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Empty suitcase illustration representing no orders found">
    {/* Background */}
    <rect width="200" height="200" fill="#fef3c7" />
    
    {/* Suitcase Body */}
    <rect x="60" y="90" width="80" height="70" rx="8" fill="#fb923c" stroke="#ea580c" strokeWidth="3" />
    
    {/* Suitcase Handle */}
    <path d="M 90 90 Q 90 70 100 70 Q 110 70 110 90" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
    
    {/* Suitcase Straps */}
    <line x1="60" y1="120" x2="140" y2="120" stroke="#ea580c" strokeWidth="2" />
    <line x1="100" y1="90" x2="100" y2="160" stroke="#ea580c" strokeWidth="2" />
    
    {/* Lock */}
    <rect x="95" y="125" width="10" height="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
    <circle cx="100" cy="129" r="1.5" fill="#ea580c" />
    
    {/* Wheels */}
    <circle cx="75" cy="160" r="5" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
    <circle cx="125" cy="160" r="5" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
    
    {/* Travel Stickers */}
    <rect x="70" y="100" width="15" height="10" rx="2" fill="#10b981" opacity="0.8" />
    <rect x="115" y="140" width="15" height="10" rx="2" fill="#3b82f6" opacity="0.8" />
  </svg>
);

/**
 * No Quotes - Blank Map
 * SVG illustration for empty quotes list state
 */
export const NoQuotesIllustration: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blank map illustration representing no quotes available">
    {/* Background */}
    <rect width="200" height="200" fill="#f1f5f9" />
    
    {/* Map Paper */}
    <rect x="40" y="40" width="120" height="120" fill="white" stroke="#cbd5e1" strokeWidth="2" />
    
    {/* Fold Lines */}
    <line x1="100" y1="40" x2="100" y2="160" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5,5" />
    <line x1="40" y1="100" x2="160" y2="100" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5,5" />
    
    {/* Grid Lines */}
    <line x1="70" y1="40" x2="70" y2="160" stroke="#f1f5f9" strokeWidth="1" />
    <line x1="130" y1="40" x2="130" y2="160" stroke="#f1f5f9" strokeWidth="1" />
    <line x1="40" y1="70" x2="160" y2="70" stroke="#f1f5f9" strokeWidth="1" />
    <line x1="40" y1="130" x2="160" y2="130" stroke="#f1f5f9" strokeWidth="1" />
    
    {/* Compass Rose */}
    <circle cx="100" cy="100" r="20" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="100" y1="80" x2="100" y2="120" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="80" y1="100" x2="120" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
    <text x="100" y="75" fontSize="10" fill="#64748b" textAnchor="middle">N</text>
    
    {/* Question Mark (no routes) */}
    <text x="100" y="145" fontSize="32" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">?</text>
  </svg>
);

/**
 * Empty State Component Props
 */
interface EmptyStateProps {
  type: 'customers' | 'sessions' | 'orders' | 'quotes';
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Empty State Component
 * Renders appropriate illustration based on type
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  title, 
  description,
  className = "" 
}) => {
  const illustrations = {
    customers: NoCustomersIllustration,
    sessions: NoSessionsIllustration,
    orders: NoOrdersIllustration,
    quotes: NoQuotesIllustration,
  };

  const defaultTitles = {
    customers: 'No Customers Yet',
    sessions: 'No Sessions Scheduled',
    orders: 'No Orders Found',
    quotes: 'No Quotes Available',
  };

  const defaultDescriptions = {
    customers: 'Start by adding your first customer',
    sessions: 'Create a new travel session to get started',
    orders: 'Orders will appear here once created',
    quotes: 'Generate your first quote to see it here',
  };

  const Illustration = illustrations[type];

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Illustration className="w-48 h-48 mb-4" />
      <h3 className="text-xl font-semibold text-slate-700 mb-2">
        {title || defaultTitles[type]}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        {description || defaultDescriptions[type]}
      </p>
    </div>
  );
};

export default EmptyState;
