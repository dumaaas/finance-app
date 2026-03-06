import { motion } from 'framer-motion';
import { Sun, Moon, Globe, Palette, Shield, Smartphone, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { useAppStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const { theme, toggleTheme, currency, setCurrency } = useAppStore();
  const { user } = useAuth();

  const currencies = [
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'BAM', label: 'BAM - Konvertibilna marka' },
    { value: 'RSD', label: 'RSD - Srpski dinar' },
    { value: 'HRK', label: 'HRK - Hrvatska kuna' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6 max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-black">Podesavanja</h2>

      {/* Profile */}
      <Card>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Shield size={16} className="text-primary-400" /> Profil</h3>
        {user && (
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-2xl" />
            ) : (
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold">
                {user.displayName?.[0] || user.email[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold">{user.displayName || 'User'}</p>
              <p className="text-sm opacity-50">{user.email}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Appearance */}
      <Card>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Palette size={16} className="text-primary-400" /> Izgled</h3>
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center justify-between w-full p-4 rounded-xl transition-all',
            theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700' : 'bg-dark-100 hover:bg-dark-200'
          )}
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={20} className="text-primary-400" /> : <Sun size={20} className="text-warning-400" />}
            <div className="text-left">
              <p className="text-sm font-semibold">{theme === 'dark' ? 'Tamna tema' : 'Svijetla tema'}</p>
              <p className="text-xs opacity-50">Klikni za promjenu</p>
            </div>
          </div>
          <div className={cn(
            'w-12 h-7 rounded-full p-1 transition-colors',
            theme === 'dark' ? 'bg-primary-500' : 'bg-dark-300'
          )}>
            <div className={cn(
              'w-5 h-5 rounded-full bg-white transition-transform',
              theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            )} />
          </div>
        </button>
      </Card>

      {/* Currency */}
      <Card>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Globe size={16} className="text-primary-400" /> Valuta</h3>
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={currencies}
        />
      </Card>

      {/* PWA */}
      <Card>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Smartphone size={16} className="text-primary-400" /> Instalacija</h3>
        <p className="text-sm opacity-60 mb-3">
          Instaliraj FinanceFlow na svoj uredaj za najbolje iskustvo. Na iOS-u, otvori u Safari-ju
          i klikni "Dodaj na pocetni ekran".
        </p>
        <div className={cn('p-3 rounded-xl text-xs', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-100')}>
          <p className="font-semibold mb-1">iOS instalacija:</p>
          <ol className="list-decimal list-inside opacity-70 space-y-1">
            <li>Otvori u Safari-ju</li>
            <li>Klikni na Share dugme (kvadrat sa strelicom)</li>
            <li>Odaberi "Add to Home Screen"</li>
            <li>Potvrdi sa "Add"</li>
          </ol>
        </div>
      </Card>

      {/* About */}
      <Card>
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Info size={16} className="text-primary-400" /> O aplikaciji</h3>
        <p className="text-sm opacity-50">FinanceFlow v1.0.0</p>
        <p className="text-xs opacity-30 mt-1">Upravljaj finansijama pametno i jednostavno.</p>
      </Card>
    </motion.div>
  );
}
