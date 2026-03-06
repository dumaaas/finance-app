import { Outlet, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MonthPicker } from '../ui/MonthPicker';
import { Icon } from '../ui/Icon';
import { useAppStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export function Layout() {
  const { theme, toggleSidebar } = useAppStore();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - sits BELOW the status bar safe area */}
        <div
          className={cn(
            'shrink-0',
            theme === 'dark' ? 'bg-dark-950' : 'bg-white'
          )}
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <header className={cn(
            'flex items-center justify-between px-4 sm:px-6 py-3',
            theme === 'dark'
              ? 'bg-dark-950/90 border-b border-dark-800'
              : 'bg-white/90 border-b border-dark-200',
            'backdrop-blur-xl'
          )}>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-dark-800/50 transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="hidden lg:block" />
            <MonthPicker />
          </header>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto scrollbar-hide ${theme === 'dark' ? 'bg-dark-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-28 lg:pb-6">
            <Outlet />
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </main>
    </div>
  );
}

function MobileBottomNav() {
  const theme = useAppStore((s) => s.theme);

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-30',
        theme === 'dark'
          ? 'bg-dark-950/95 border-t border-dark-800'
          : 'bg-white/95 border-t border-dark-200',
        'backdrop-blur-xl'
      )}
    >
      <div className="flex items-center justify-around py-2 px-2">
        <MobileNavItem to="/" icon="LayoutDashboard" label="Pocetna" />
        <MobileNavItem to="/transactions" icon="ArrowLeftRight" label="Trans." />
        <MobileNavItem to="/receipts" icon="Camera" label="Skeniraj" highlight />
        <MobileNavItem to="/installments" icon="CalendarClock" label="Rate" />
        <MobileNavItem to="/settings" icon="Settings" label="Vise" />
      </div>
      {/* Safe area spacer for home indicator (iPhone) / nav bar (Android) */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}

function MobileNavItem({ to, icon, label, highlight }: { to: string; icon: string; label: string; highlight?: boolean }) {
  const theme = useAppStore((s) => s.theme);

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]',
        highlight && !isActive && 'relative',
        isActive
          ? 'text-primary-500'
          : theme === 'dark' ? 'text-dark-500' : 'text-dark-400'
      )}
    >
      {({ isActive }) => (
        <>
          {highlight && !isActive ? (
            <div className="w-11 h-11 -mt-5 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Icon name={icon} size={22} className="text-white" />
            </div>
          ) : (
            <Icon name={icon} size={22} strokeWidth={isActive ? 2.5 : 2} />
          )}
          <span className="text-[10px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}
