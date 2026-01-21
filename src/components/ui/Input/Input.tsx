import React from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  error?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'number' | 'date' | 'time' | 'datetime-local';
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  error,
  required,
  onChange,
  type = 'text',
  className = '',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? e.target.value : e.target.value;
    onChange?.(newValue);
  };

  return (
    <div className={`mb-6 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          {label}
          {required && <span className="text-error">*</span>}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md transition-all duration-200
          focus:outline-none border-primary-900 ring-3 ring-primary-50
          disabled:bg-neutral-100 text-neutral-500 cursor-not-allowed
          ${error ? 'border-error ring-red-100' : ''}
        `}
        style={{ minHeight: '44px' }}
      />
      
      {error && (
        <span className="text-xs text-error font-medium mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
};
