import React from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function DatePicker({ label, error, className = '', ...props }: DatePickerProps) {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label className="mb-1 text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type="date"
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
          error ? 'border-red-500' : 'border-slate-300'
        } bg-white text-slate-900`}
        {...props}
      />
      {error && <span className="mt-1 text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}
