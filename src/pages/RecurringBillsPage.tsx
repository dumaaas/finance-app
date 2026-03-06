import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Trash2, Edit3, Repeat, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useRecurringBills, useRecurringBillMutations, useTransactionMutations, useCategories } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';
import toast from 'react-hot-toast';

function monthlyAmountForBill(bill: { amount: number; frequency: string }): number {
  if (bill.frequency === 'monthly') return bill.amount;
  if (bill.frequency === 'quarterly') return bill.amount / 3;
  return bill.amount / 12;
}

export function RecurringBillsPage() {
  const { theme, currency, selectedMonth } = useAppStore();
  const { data: bills = [], isLoading } = useRecurringBills();
  const { data: categories = [] } = useCategories();
  const { create, update, remove, userId } = useRecurringBillMutations();
  const { create: createTransaction } = useTransactionMutations();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmPayBill, setConfirmPayBill] = useState<(typeof bills)[0] | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [confirmDeleteBill, setConfirmDeleteBill] = useState<(typeof bills)[0] | null>(null);

  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSubcategoryId, setFormSubcategoryId] = useState('');
  const [formDueDay, setFormDueDay] = useState('1');
  const [formFrequency, setFormFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [formNote, setFormNote] = useState('');

  const formCategory = categories.find((c) => c.id === formCategoryId);
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const resetForm = () => {
    setFormName(''); setFormAmount(''); setFormCategoryId(''); setFormSubcategoryId(''); setFormDueDay('1');
    setFormFrequency('monthly'); setFormNote(''); setEditingId(null);
  };

  const openEdit = (bill: typeof bills[0]) => {
    setEditingId(bill.id);
    setFormName(bill.name);
    setFormAmount(bill.amount.toString());
    setFormCategoryId(bill.categoryId || '');
    setFormSubcategoryId(bill.subcategoryId || '');
    setFormDueDay(bill.dueDay.toString());
    setFormFrequency(bill.frequency);
    setFormNote(bill.note || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const validSubId = formCategory?.subcategories.some((s) => s.id === formSubcategoryId) ? formSubcategoryId : undefined;
    const data = {
      name: formName,
      amount: parseFloat(formAmount),
      categoryId: formCategoryId || undefined,
      ...(validSubId && { subcategoryId: validSubId }),
      dueDay: parseInt(formDueDay),
      frequency: formFrequency,
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

  const payBill = async (bill: typeof bills[0], amount: number) => {
    if (!userId) return;
    const paid = bill.paidMonths || [];
    if (paid.includes(selectedMonth)) {
      toast.error('Već plaćeno za ovaj mjesec.');
      return;
    }
    try {
      if (bill.categoryId) {
        const subId = bill.subcategoryId && categories.find((c) => c.id === bill.categoryId)?.subcategories.some((s) => s.id === bill.subcategoryId) ? bill.subcategoryId : undefined;
        await createTransaction.mutateAsync({
          amount,
          description: bill.name,
          categoryId: bill.categoryId,
          ...(subId && { subcategoryId: subId }),
          type: 'expense',
          date: Date.now(),
          month: selectedMonth,
          userId,
          createdAt: Date.now(),
        });
      } else {
        toast('Označeno plaćenim. Uredi račun i dodaj kategoriju da se transakcija upiše u rashode.', { icon: '💡' });
      }
      await update.mutateAsync({
        id: bill.id,
        paidMonths: [...paid, selectedMonth],
      });
      toast.success(bill.categoryId ? 'Plaćeno, transakcija dodana u rashode.' : 'Označeno plaćenim za ovaj mjesec.');
      setConfirmPayBill(null);
    } catch {
      toast.error('Greška');
    }
  };

  const totalMonthly = bills.filter((b) => b.isActive).reduce((s, b) => s + monthlyAmountForBill(b), 0);
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
        <div className="space-y-2">
          {bills.map((bill) => {
            const cat = categories.find((c) => c.id === bill.categoryId);
            const isPaidThisMonth = (bill.paidMonths || []).includes(selectedMonth);
            return (
              <Card
                key={bill.id}
                hover
                className={cn(
                  'p-3!',
                  isPaidThisMonth && 'ring-2 ring-accent-500/50 bg-accent-500/5 dark:bg-accent-500/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (cat?.color || '#6366f1') + '20' }}>
                    <Icon name={cat?.icon || 'Repeat'} size={20} style={{ color: cat?.color || '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate">{bill.name}</p>
                      {isPaidThisMonth && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-500/20 text-accent-400 rounded-full">
                          Plaćeno za {format(new Date(selectedMonth + '-01'), 'MMM yyyy')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-50">
                      {bill.dueDay}. u mjesecu &middot; {freqLabels[bill.frequency]}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{formatCurrency(bill.amount, currency)}</span>
                    {!isPaidThisMonth && (
                      <button
                        onClick={() => {
                          setConfirmPayBill(bill);
                          setPayAmount(monthlyAmountForBill(bill).toFixed(2));
                        }}
                        className="p-1.5 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 transition-colors"
                        title="Plati za ovaj mjesec"
                      >
                        <Check size={16} className="text-accent-400" />
                      </button>
                    )}
                    <button onClick={() => openEdit(bill)} className="p-1.5 rounded-lg hover:bg-dark-700/50"><Edit3 size={14} className="opacity-50" /></button>
                    <button onClick={() => setConfirmDeleteBill(bill)} className="p-1.5 rounded-lg hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400 opacity-50" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Uredi trosak' : 'Novi mjesecni trosak'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Naziv" placeholder="Npr. Internet, Netflix, Kirija..." value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Iznos" type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
            <Input label="Dan u mjesecu" type="number" min="1" max="31" value={formDueDay} onChange={(e) => setFormDueDay(e.target.value)} required />
          </div>
          <Select
            label="Kategorija"
            value={formCategoryId}
            onChange={(e) => { setFormCategoryId(e.target.value); setFormSubcategoryId(''); }}
            options={[{ value: '', label: 'Bez kategorije' }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          {formCategory && formCategory.subcategories.length > 0 && (
            <Select
              label="Podkategorija"
              value={formSubcategoryId}
              onChange={(e) => setFormSubcategoryId(e.target.value)}
              options={[{ value: '', label: 'Bez podkategorije' }, ...formCategory.subcategories.map((s) => ({ value: s.id, label: s.name }))]}
            />
          )}
          <Select label="Ucestalost" value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as typeof formFrequency)}
            options={[{ value: 'monthly', label: 'Mjesecno' }, { value: 'quarterly', label: 'Kvartalno' }, { value: 'yearly', label: 'Godisnje' }]} />
          <Textarea label="Napomena" placeholder="Opciono..." value={formNote} onChange={(e) => setFormNote(e.target.value)} />
          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>
            {editingId ? 'Sacuvaj' : 'Dodaj'}
          </Button>
        </form>
      </Modal>

      {/* Potvrda plaćanja */}
      <Modal
        isOpen={!!confirmPayBill}
        onClose={() => { setConfirmPayBill(null); setPayAmount(''); }}
        title="Plati račun"
        size="sm"
      >
        {confirmPayBill && (
          <div className="space-y-4">
            <p className="text-sm opacity-80">
              <strong>{confirmPayBill.name}</strong> — za mjesec {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}. Transakcija će biti dodana u rashode.
            </p>
            <Input
              label="Iznos (možeš izmijeniti)"
              type="number"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setConfirmPayBill(null); setPayAmount(''); }}>
                Odustani
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const amount = parseFloat(payAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    toast.error('Unesi ispravan iznos');
                    return;
                  }
                  payBill(confirmPayBill, amount);
                }}
              >
                Plati
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Potvrda brisanja */}
      <Modal
        isOpen={!!confirmDeleteBill}
        onClose={() => setConfirmDeleteBill(null)}
        title="Obrisati mjesečni trošak?"
        size="sm"
      >
        {confirmDeleteBill && (
          <div className="space-y-4">
            <p className="text-sm opacity-80">
              <strong>{confirmDeleteBill.name}</strong> će biti trajno obrisan. Ova akcija se ne može poništiti.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeleteBill(null)}>
                Odustani
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={async () => {
                  try {
                    await remove.mutateAsync(confirmDeleteBill.id);
                    toast.success('Obrisano');
                    setConfirmDeleteBill(null);
                  } catch {
                    toast.error('Greška');
                  }
                }}
              >
                Obriši
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
