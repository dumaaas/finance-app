import { cn } from '../../lib/utils';
import { useAppStore } from '../../lib/store';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const theme = useAppStore((s) => s.theme);
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium opacity-80">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none',
          theme === 'dark'
            ? 'bg-dark-800 border border-dark-700 focus:border-primary-500 text-dark-100 placeholder:text-dark-500'
            : 'bg-dark-50 border border-dark-200 focus:border-primary-500 text-dark-900 placeholder:text-dark-400',
          'focus:ring-2 focus:ring-primary-500/20',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  const theme = useAppStore((s) => s.theme);
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium opacity-80">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none appearance-none',
          theme === 'dark'
            ? 'bg-dark-800 border border-dark-700 focus:border-primary-500 text-dark-100'
            : 'bg-dark-50 border border-dark-200 focus:border-primary-500 text-dark-900',
          'focus:ring-2 focus:ring-primary-500/20',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  const theme = useAppStore((s) => s.theme);
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium opacity-80">{label}</label>}
      <textarea
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none resize-none',
          theme === 'dark'
            ? 'bg-dark-800 border border-dark-700 focus:border-primary-500 text-dark-100 placeholder:text-dark-500'
            : 'bg-dark-50 border border-dark-200 focus:border-primary-500 text-dark-900 placeholder:text-dark-400',
          'focus:ring-2 focus:ring-primary-500/20',
          className
        )}
        rows={3}
        {...props}
      />
    </div>
  );
}
