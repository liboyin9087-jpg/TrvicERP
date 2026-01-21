import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  onClick,
  hoverable = false,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white border border-neutral-300 rounded-lg p-6 shadow-sm transition-all duration-200
        ${hoverable ? 'hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          {title}
        </h3>
      )}
      
      <div className="text-base text-neutral-700 leading-relaxed">
        {children}
      </div>
      
      {footer && (
        <div className="mt-6 pt-4 border-t border-neutral-200">
          {footer}
        </div>
      )}
    </div>
  );
};
