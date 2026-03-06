import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto',
              sizeClasses[size],
              theme === 'dark' ? 'bg-dark-900 border border-dark-700' : 'bg-white border border-dark-200'
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-dark-200 dark:border-dark-700"
              style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' }}
            >
              <h2 className="text-lg font-bold">{title}</h2>
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  theme === 'dark' ? 'hover:bg-dark-800' : 'hover:bg-dark-100'
                )}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 safe-bottom">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
