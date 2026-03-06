import { cn } from '../../lib/utils';
import { useAppStore } from '../../lib/store';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', children, loading, className, disabled, ...props }: ButtonProps) {
  const theme = useAppStore((s) => s.theme);

  const base = 'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97]';

  const variants = {
    primary: 'gradient-primary text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
    secondary: theme === 'dark'
      ? 'bg-dark-800 text-dark-100 hover:bg-dark-700 border border-dark-700'
      : 'bg-dark-100 text-dark-800 hover:bg-dark-200 border border-dark-200',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-lg shadow-danger-500/25',
    ghost: theme === 'dark'
      ? 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
      : 'text-dark-600 hover:text-dark-900 hover:bg-dark-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
