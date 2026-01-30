import React from 'react';
import { Plane } from 'lucide-react';

/**
 * TrvicERP Logo Component Configuration
 */
interface TrvicLogoProps {
  /** Size of the logo */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show text alongside the icon */
  showText?: boolean;
  /** Whether to show the tagline */
  showTagline?: boolean;
}

/**
 * TrvicERP Logo Component
 * Travel-themed logo with airplane and globe
 * @example
 * ```tsx
 * <TrvicLogo size="md" showText showTagline />
 * ```
 */
export const TrvicLogo: React.FC<TrvicLogoProps> = ({ 
  size = 'md', 
  showText = true,
  showTagline = true 
}) => {
  const sizeConfig = {
    sm: {
      container: 'w-6 h-6',
      icon: 'w-4 h-4',
      trail: 'w-6 h-0.5',
      text: 'text-lg',
      tagline: 'text-[0.5rem]',
    },
    md: {
      container: 'w-10 h-10',
      icon: 'w-6 h-6',
      trail: 'w-8 h-0.5',
      text: 'text-2xl',
      tagline: 'text-xs',
    },
    lg: {
      container: 'w-14 h-14',
      icon: 'w-8 h-8',
      trail: 'w-10 h-0.5',
      text: 'text-3xl',
      tagline: 'text-sm',
    },
    xl: {
      container: 'w-20 h-20',
      icon: 'w-12 h-12',
      trail: 'w-14 h-1',
      text: 'text-4xl',
      tagline: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-3">
      {/* Globe + Airplane Icon */}
      <div className="relative">
        {/* Globe Background */}
        <div className={`${config.container} rounded-full bg-gradient-to-br from-brand-sky to-brand-ocean flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <Plane className={`${config.icon} text-white transform rotate-45`} />
        </div>
        
        {/* Flight Trail Animation */}
        <div className={`absolute -right-1 top-1/2 ${config.trail} bg-gradient-to-r from-travel-sunset to-transparent animate-pulse rounded-full`} />
      </div>
      
      {/* Text Content */}
      {showText && (
        <div className="flex flex-col">
          <div className={`${config.text} font-bold bg-gradient-to-r from-brand-sky to-travel-sunset bg-clip-text text-transparent leading-tight`}>
            TrvicERP
          </div>
          {showTagline && (
            <div className={`${config.tagline} text-neutral-500 tracking-wider uppercase leading-tight`}>
              Travel Made Simple
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Default export for backward compatibility
export default TrvicLogo;
