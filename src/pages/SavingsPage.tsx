import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, PiggyBank, TrendingUp, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useSavingsGoals, useSavingsGoalMutations } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { formatCurrency, cn, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/utils';
import toast from 'react-hot-toast';

export function SavingsPage() {
  const { theme, currency } = useAppStore();
  const { data: goals = [], isLoading } = useSavingsGoals();
  const { create, update, remove, userId } = useSavingsGoalMutations();

  const [showModal, setShowModal] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<(typeof goals)[0] | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('0');
  const [formDeadline, setFormDeadline] = useState('');
  const [formIcon, setFormIcon] = useState('PiggyBank');
  const [formColor, setFormColor] = useState('#6366f1');

  const resetForm = () => {
    setFormName(''); setFormTarget(''); setFormCurrent('0'); setFormDeadline('');
    setFormIcon('PiggyBank'); setFormColor('#6366f1'); setEditingId(null);
  };

  const openEdit = (g: typeof goals[0]) => {
    setEditingId(g.id);
    setFormName(g.name);
    setFormTarget(g.targetAmount.toString());
    setFormCurrent(g.currentAmount.toString());
    setFormDeadline(g.deadline ? format(new Date(g.deadline), 'yyyy-MM-dd') : '');
    setFormIcon(g.icon);
    setFormColor(g.color);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const currentAmt = parseFloat(formCurrent || '0');
    const targetAmt = parseFloat(formTarget);
    const data = {
      name: formName,
      targetAmount: targetAmt,
      currentAmount: currentAmt,
      deadline: formDeadline ? new Date(formDeadline).getTime() : undefined,
      icon: formIcon,
      color: formColor,
      userId,
      isCompleted: currentAmt >= targetAmt,
      createdAt: Date.now(),
    };

    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...data });
        toast.success('Cilj azuriran');
      } else {
        await create.mutateAsync(data);
        toast.success('Cilj kreiran!');
      }
      setShowModal(false);
      resetForm();
    } catch {
      toast.error('Greska');
    }
  };

  const handleAddFunds = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + parseFloat(addAmount);
    try {
      await update.mutateAsync({
        id: goalId,
        currentAmount: newAmount,
        isCompleted: newAmount >= goal.targetAmount,
      });
      if (newAmount >= goal.targetAmount) {
        toast.success('Cilj ostvaren!!!');
      } else {
        toast.success('Sredstva dodana');
      }
      setShowAddFunds(null);
      setAddAmount('');
    } catch {
      toast.error('Greska');
    }
  };

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Ciljevi stednje</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }} size="sm"><Plus size={18} /> Novi cilj</Button>
      </div>

      {/* Total */}
      <Card className="gradient-mesh">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-500/20">
            <PiggyBank size={28} className="text-accent-400" />
          </div>
          <div>
            <p className="text-xs font-medium opacity-60">Ukupno sacuvano</p>
            <p className="text-2xl font-black text-accent-400">{formatCurrency(totalSaved, currency)}</p>
            <p className="text-xs opacity-40">od {formatCurrency(totalTarget, currency)} cilja</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon="PiggyBank" title="Nema ciljeva" description="Postavi svoj prvi cilj stednje" />
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.map((goal) => {
                const pct = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <Card key={goal.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: goal.color + '20' }}>
                          <Icon name={goal.icon} size={22} style={{ color: goal.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{goal.name}</p>
                          {goal.deadline && (
                            <p className="text-xs opacity-40">Do {format(new Date(goal.deadline), 'dd.MM.yyyy')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-dark-700/50"><Edit3 size={14} className="opacity-50" /></button>
                        <button onClick={() => setConfirmDelete(goal)} className="p-1.5 rounded-lg hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400 opacity-50" /></button>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-bold" style={{ color: goal.color }}>{formatCurrency(goal.currentAmount, currency)}</span>
                      <span className="opacity-50">{formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                    <div className={cn('h-2.5 rounded-full overflow-hidden', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-200')}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                        className="h-full rounded-full" style={{ backgroundColor: goal.color }} />
                    </div>
                    <p className="text-xs text-right mt-1 opacity-40">{pct.toFixed(0)}%</p>

                    {showAddFunds === goal.id ? (
                      <div className="flex gap-2 mt-3">
                        <input type="number" step="0.01" placeholder="Iznos" value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          className={cn('flex-1 px-3 py-2 rounded-lg text-sm outline-none', theme === 'dark' ? 'bg-dark-800 border border-dark-700 text-dark-100' : 'bg-dark-50 border border-dark-200')} />
                        <Button size="sm" onClick={() => handleAddFunds(goal.id)}>Dodaj</Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddFunds(null)}>X</Button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => setShowAddFunds(goal.id)}>
                        <TrendingUp size={14} /> Dodaj sredstva
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold opacity-60 flex items-center gap-2"><PartyPopper size={16} /> Ostvareni ciljevi</h3>
              {completed.map((goal) => (
                <Card key={goal.id} className="!p-3 opacity-70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: goal.color + '20' }}>
                        <Icon name={goal.icon} size={18} style={{ color: goal.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{goal.name}</p>
                        <p className="text-xs opacity-50">{formatCurrency(goal.targetAmount, currency)} - Ostvareno!</p>
                      </div>
                    </div>
                    <button onClick={() => setConfirmDelete(goal)} className="p-1.5 rounded-lg hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400" /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Uredi cilj' : 'Novi cilj stednje'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Naziv cilja" placeholder="Npr. Novi laptop, Putovanje..." value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ciljna suma" type="number" step="0.01" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} required />
            <Input label="Trenutno sacuvano" type="number" step="0.01" value={formCurrent} onChange={(e) => setFormCurrent(e.target.value)} />
          </div>
          <Input label="Rok (opciono)" type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium opacity-80">Ikonica</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 rounded-xl bg-dark-800/30">
              {CATEGORY_ICONS.slice(0, 20).map((icon) => (
                <button key={icon} type="button" onClick={() => setFormIcon(icon)}
                  className={cn('p-2 rounded-lg transition-all', formIcon === icon ? 'bg-primary-500 text-white' : 'hover:bg-dark-700/50')}>
                  <Icon name={icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium opacity-80">Boja</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.slice(0, 12).map((color) => (
                <button key={color} type="button" onClick={() => setFormColor(color)}
                  className={cn('w-7 h-7 rounded-full transition-all', formColor === color && 'ring-2 ring-offset-2 ring-offset-dark-900')}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>
            {editingId ? 'Sacuvaj' : 'Kreiraj cilj'}
          </Button>
        </form>
      </Modal>

      {/* Potvrda brisanja cilja */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Obrisati cilj?" size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm opacity-80">
              Cilj <strong>{confirmDelete.name}</strong> ce biti trajno obrisan. Ova akcija se ne moze ponistiti.
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
