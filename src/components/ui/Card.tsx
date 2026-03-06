import { cn } from '../../lib/utils';
import { useAppStore } from '../../lib/store';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, hover = false, gradient = false, className, ...props }: CardProps) {
  const theme = useAppStore((s) => s.theme);

  return (
    <div
      className={cn(
        'rounded-2xl p-4 sm:p-5 transition-all duration-200',
        theme === 'dark'
          ? 'bg-dark-900/80 border border-dark-800'
          : 'bg-white border border-dark-100 shadow-sm',
        hover && (theme === 'dark'
          ? 'hover:bg-dark-800/80 hover:border-dark-700 cursor-pointer'
          : 'hover:shadow-md hover:border-dark-200 cursor-pointer'),
        gradient && 'gradient-mesh',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
