import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import type { ThemeMode } from '../types';

interface AppStore {
  theme: ThemeMode;
  selectedMonth: string;
  currency: string;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setSelectedMonth: (month: string) => void;
  setCurrency: (currency: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      selectedMonth: format(new Date(), 'yyyy-MM'),
      currency: 'EUR',
      sidebarOpen: false,
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          document.body.className = newTheme;
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        document.body.className = theme;
        set({ theme });
      },
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setCurrency: (currency) => set({ currency }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'financeflow-store',
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
      }),
    }
  )
);
