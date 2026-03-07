import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, AlertTriangle, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useBudgets, useBudgetMutations, useCategories, useTransactions } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';
import toast from 'react-hot-toast';

export function BudgetPage() {
  const { selectedMonth, theme, currency } = useAppStore();
  const { data: budgets = [], isLoading } = useBudgets(selectedMonth);
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions(selectedMonth);
  const { create, update, remove, userId } = useBudgetMutations();

  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<(typeof budgetData)[0] | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');

  const budgetData = useMemo(() => {
    return budgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = transactions
        .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, category: cat, spent, percentage, remaining: b.amount - spent };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categories, transactions]);

  const totalBudget = budgetData.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !formCategoryId) return;

    const existing = budgets.find((b) => b.categoryId === formCategoryId);
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, amount: parseFloat(formAmount) });
      } else {
        await create.mutateAsync({
          categoryId: formCategoryId,
          amount: parseFloat(formAmount),
          month: selectedMonth,
          userId,
          createdAt: Date.now(),
        });
      }
      toast.success('Budzet sacuvan');
      setShowModal(false);
      setFormCategoryId('');
      setFormAmount('');
    } catch {
      toast.error('Greska');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Budzet</h2>
        <Button onClick={() => setShowModal(true)} size="sm"><Plus size={18} /> Postavi</Button>
      </div>

      {/* Overview */}
      <Card className="gradient-mesh">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-500/20">
            <Target size={28} className="text-primary-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium opacity-60">Ukupno potroseno / Budzet</p>
            <p className="text-2xl font-black">
              <span className={totalSpent > totalBudget ? 'text-danger-400' : 'text-primary-400'}>
                {formatCurrency(totalSpent, currency)}
              </span>
              <span className="text-sm font-normal opacity-40"> / {formatCurrency(totalBudget, currency)}</span>
            </p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div className={cn('h-3 rounded-full overflow-hidden mt-4', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-200')}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              className={cn('h-full rounded-full', totalSpent > totalBudget ? 'gradient-danger' : 'gradient-primary')}
            />
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : budgetData.length === 0 ? (
        <EmptyState icon="Target" title="Nema budzeta" description="Postavi budzet po kategorijama za ovaj mjesec" />
      ) : (
        <div className="space-y-3">
          {budgetData.map((b) => (
            <Card key={b.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: (b.category?.color || '#64748b') + '20' }}>
                  <Icon name={b.category?.icon || 'Circle'} size={18} style={{ color: b.category?.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{b.category?.name || 'Nepoznato'}</p>
                  <p className="text-xs opacity-50">
                    {formatCurrency(b.spent, currency)} od {formatCurrency(b.amount, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {b.percentage > 100 ? (
                    <AlertTriangle size={16} className="text-danger-400" />
                  ) : b.percentage > 80 ? (
                    <AlertTriangle size={16} className="text-warning-400" />
                  ) : (
                    <Check size={16} className="text-accent-400" />
                  )}
                  <span className={cn('text-sm font-bold',
                    b.percentage > 100 ? 'text-danger-400' : b.percentage > 80 ? 'text-warning-400' : 'text-accent-400'
                  )}>
                    {b.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className={cn('h-2 rounded-full overflow-hidden', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-200')}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                  className={cn('h-full rounded-full',
                    b.percentage > 100 ? 'gradient-danger' : b.percentage > 80 ? 'bg-warning-400' : 'gradient-primary'
                  )}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs opacity-40">
                  {b.remaining > 0 ? `Preostalo: ${formatCurrency(b.remaining, currency)}` : `Prekoracenje: ${formatCurrency(Math.abs(b.remaining), currency)}`}
                </span>
                <button onClick={() => setConfirmDelete(b)}
                  className="text-xs text-danger-400 opacity-50 hover:opacity-100">Ukloni</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Postavi budzet" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Kategorija" value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}
            options={[{ value: '', label: 'Odaberi kategoriju' }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]} />
          <Input label="Mjesecni budzet" type="number" step="0.01" placeholder="0.00" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>Sacuvaj budzet</Button>
        </form>
      </Modal>

      {/* Potvrda brisanja budzeta */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Obrisati budzet?" size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm opacity-80">
              Budzet za <strong>{confirmDelete.category?.name || 'Nepoznato'}</strong> ce biti trajno obrisan. Ova akcija se ne moze ponistiti.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Odustani</Button>
              <Button variant="danger" className="flex-1" onClick={async () => {
                try {
                  await remove.mutateAsync(confirmDelete.id);
                  toast.success('Obrisano');
                  setConfirmDelete(null);
                } catch {
                  toast.error('Greska');
                }
              }}>Obrisi</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
