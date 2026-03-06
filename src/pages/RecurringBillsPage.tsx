import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Repeat, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useRecurringBills, useRecurringBillMutations, useCategories } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';
import toast from 'react-hot-toast';

export function RecurringBillsPage() {
  const { theme, currency } = useAppStore();
  const { data: bills = [], isLoading } = useRecurringBills();
  const { data: categories = [] } = useCategories();
  const { create, update, remove, userId } = useRecurringBillMutations();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDueDay, setFormDueDay] = useState('1');
  const [formFrequency, setFormFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [formAutoPay, setFormAutoPay] = useState(false);
  const [formNote, setFormNote] = useState('');

  const resetForm = () => {
    setFormName(''); setFormAmount(''); setFormCategoryId(''); setFormDueDay('1');
    setFormFrequency('monthly'); setFormAutoPay(false); setFormNote(''); setEditingId(null);
  };

  const openEdit = (bill: typeof bills[0]) => {
    setEditingId(bill.id);
    setFormName(bill.name);
    setFormAmount(bill.amount.toString());
    setFormCategoryId(bill.categoryId || '');
    setFormDueDay(bill.dueDay.toString());
    setFormFrequency(bill.frequency);
    setFormAutoPay(bill.isAutoPay);
    setFormNote(bill.note || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const data = {
      name: formName,
      amount: parseFloat(formAmount),
      categoryId: formCategoryId || undefined,
      dueDay: parseInt(formDueDay),
      frequency: formFrequency,
      isAutoPay: formAutoPay,
      note: formNote || undefined,
      userId,
      isActive: true,
      createdAt: Date.now(),
    };

    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...data });
        toast.success('Racun azuriran');
      } else {
        await create.mutateAsync(data);
        toast.success('Racun dodan');
      }
      setShowModal(false);
      resetForm();
    } catch {
      toast.error('Greska');
    }
  };

  const toggleActive = async (bill: typeof bills[0]) => {
    await update.mutateAsync({ id: bill.id, isActive: !bill.isActive });
    toast.success(bill.isActive ? 'Deaktivirano' : 'Aktivirano');
  };

  const active = bills.filter((b) => b.isActive);
  const inactive = bills.filter((b) => !b.isActive);
  const totalMonthly = active.reduce((s, b) => {
    if (b.frequency === 'monthly') return s + b.amount;
    if (b.frequency === 'quarterly') return s + b.amount / 3;
    return s + b.amount / 12;
  }, 0);

  const freqLabels = { monthly: 'Mjesecno', quarterly: 'Kvartalno', yearly: 'Godisnje' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Mjesecni troskovi</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }} size="sm"><Plus size={18} /> Novi</Button>
      </div>

      {/* Summary */}
      <Card className="gradient-mesh">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-500/20">
            <Repeat size={24} className="text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium opacity-60">Ukupno mjesecno</p>
            <p className="text-2xl font-black text-primary-400">{formatCurrency(totalMonthly, currency)}</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : bills.length === 0 ? (
        <EmptyState icon="Repeat" title="Nema mjesecnih troskova" description="Dodaj stanarne troskove kao sto su kirija, internet, pretplate..." />
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold opacity-60">Aktivni ({active.length})</h3>
              {active.map((bill) => {
                const cat = categories.find((c) => c.id === bill.categoryId);
                return (
                  <Card key={bill.id} hover className="!p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (cat?.color || '#6366f1') + '20' }}>
                        <Icon name={cat?.icon || 'Repeat'} size={20} style={{ color: cat?.color || '#6366f1' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{bill.name}</p>
                          {bill.isAutoPay && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-500/20 text-accent-400 rounded-full">AUTO</span>
                          )}
                        </div>
                        <p className="text-xs opacity-50">
                          {bill.dueDay}. u mjesecu &middot; {freqLabels[bill.frequency]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatCurrency(bill.amount, currency)}</span>
                        <button onClick={() => toggleActive(bill)} className="p-1.5 rounded-lg hover:bg-dark-700/50">
                          <ToggleRight size={18} className="text-accent-400" />
                        </button>
                        <button onClick={() => openEdit(bill)} className="p-1.5 rounded-lg hover:bg-dark-700/50"><Edit3 size={14} className="opacity-50" /></button>
                        <button onClick={() => remove.mutateAsync(bill.id).then(() => toast.success('Obrisano'))} className="p-1.5 rounded-lg hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400 opacity-50" /></button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {inactive.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold opacity-60">Neaktivni ({inactive.length})</h3>
              {inactive.map((bill) => (
                <Card key={bill.id} className="!p-3 opacity-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{bill.name} - {formatCurrency(bill.amount, currency)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => toggleActive(bill)} className="p-1.5 rounded-lg hover:bg-dark-700/50"><ToggleLeft size={18} /></button>
                      <button onClick={() => remove.mutateAsync(bill.id)} className="p-1.5 rounded-lg hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400" /></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Uredi trosak' : 'Novi mjesecni trosak'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Naziv" placeholder="Npr. Internet, Netflix, Kirija..." value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Iznos" type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
            <Input label="Dan u mjesecu" type="number" min="1" max="31" value={formDueDay} onChange={(e) => setFormDueDay(e.target.value)} required />
          </div>
          <Select label="Kategorija" value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}
            options={[{ value: '', label: 'Bez kategorije' }, ...categories.filter((c) => c.type === 'expense').map((c) => ({ value: c.id, label: c.name }))]} />
          <Select label="Ucestalost" value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as typeof formFrequency)}
            options={[{ value: 'monthly', label: 'Mjesecno' }, { value: 'quarterly', label: 'Kvartalno' }, { value: 'Godisnje', label: 'Godisnje' }]} />
          <button type="button" onClick={() => setFormAutoPay(!formAutoPay)}
            className={cn('flex items-center gap-3 w-full p-3 rounded-xl transition-all', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-100')}>
            <Zap size={18} className={formAutoPay ? 'text-accent-400' : 'opacity-40'} />
            <span className="text-sm font-medium flex-1 text-left">Automatsko placanje</span>
            {formAutoPay ? <ToggleRight size={24} className="text-accent-400" /> : <ToggleLeft size={24} className="opacity-40" />}
          </button>
          <Textarea label="Napomena" placeholder="Opciono..." value={formNote} onChange={(e) => setFormNote(e.target.value)} />
          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>
            {editingId ? 'Sacuvaj' : 'Dodaj'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
