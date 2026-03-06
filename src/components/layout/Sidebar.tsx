import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, Tags, CalendarClock,
  Repeat, Camera, Target, PiggyBank, Settings, LogOut,
  X, Sun, Moon,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transakcije' },
  { to: '/categories', icon: Tags, label: 'Kategorije' },
  { to: '/installments', icon: CalendarClock, label: 'Rate' },
  { to: '/recurring', icon: Repeat, label: 'Mjesecni trosk.' },
  { to: '/receipts', icon: Camera, label: 'Skeniraj racun' },
  { to: '/budget', icon: Target, label: 'Budzet' },
  { to: '/savings', icon: PiggyBank, label: 'Stednja' },
  { to: '/settings', icon: Settings, label: 'Podesavanja' },
];

export function Sidebar() {
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useAppStore();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          'w-70 flex flex-col',
          theme === 'dark'
            ? 'bg-dark-950 border-r border-dark-800'
            : 'bg-white border-r border-dark-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <PiggyBank size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">FinanceFlow</h1>
              <p className="text-[11px] opacity-50">Personal Finance</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-dark-800/50"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className={cn(
            'mx-4 mb-4 p-3 rounded-xl',
            theme === 'dark' ? 'bg-dark-900/80' : 'bg-dark-50'
          )}>
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  {user.displayName?.[0] || user.email[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
                <p className="text-[11px] opacity-50 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map(({ to, icon: ItemIcon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'gradient-primary text-white shadow-lg shadow-primary-500/20'
                    : theme === 'dark'
                      ? 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/60'
                      : 'text-dark-500 hover:text-dark-900 hover:bg-dark-100'
                )}
              >
                <ItemIcon size={20} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 space-y-2">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all',
              theme === 'dark'
                ? 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/60'
                : 'text-dark-500 hover:text-dark-900 hover:bg-dark-100'
            )}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? 'Svijetla tema' : 'Tamna tema'}</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-danger-400 hover:bg-danger-500/10 transition-all"
          >
            <LogOut size={20} />
            <span>Odjavi se</span>
          </button>
        </div>
      </aside>
    </>
  );
}
