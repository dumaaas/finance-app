import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Check, CalendarClock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useInstallments, useInstallmentMutations } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';
import toast from 'react-hot-toast';

export function InstallmentsPage() {
  const { theme, currency } = useAppStore();
  const { data: installments = [], isLoading } = useInstallments();
  const { create, update, remove, userId } = useInstallmentMutations();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formMonthly, setFormMonthly] = useState('');
  const [formTotalInst, setFormTotalInst] = useState('');
  const [formPaid, setFormPaid] = useState('');
  const [formStart, setFormStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formNote, setFormNote] = useState('');

  const resetForm = () => {
    setFormName(''); setFormTotal(''); setFormMonthly(''); setFormTotalInst('');
    setFormPaid('0'); setFormStart(format(new Date(), 'yyyy-MM-dd')); setFormNote('');
    setEditingId(null);
  };

  const openEdit = (inst: typeof installments[0]) => {
    setEditingId(inst.id);
    setFormName(inst.name);
    setFormTotal(inst.totalAmount.toString());
    setFormMonthly(inst.monthlyAmount.toString());
    setFormTotalInst(inst.totalInstallments.toString());
    setFormPaid(inst.paidInstallments.toString());
    setFormStart(format(new Date(inst.startDate), 'yyyy-MM-dd'));
    setFormNote(inst.note || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const data = {
      name: formName,
      totalAmount: parseFloat(formTotal),
      monthlyAmount: parseFloat(formMonthly),
      totalInstallments: parseInt(formTotalInst),
      paidInstallments: parseInt(formPaid || '0'),
      startDate: new Date(formStart).getTime(),
      note: formNote || undefined,
      userId,
      isActive: parseInt(formPaid || '0') < parseInt(formTotalInst),
      createdAt: Date.now(),
    };

    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...data });
        toast.success('Rate azurirane');
      } else {
        await create.mutateAsync(data);
        toast.success('Rate dodane');
      }
      setShowModal(false);
      resetForm();
    } catch {
      toast.error('Greska');
    }
  };

  const payInstallment = async (inst: typeof installments[0]) => {
    const newPaid = inst.paidInstallments + 1;
    try {
      await update.mutateAsync({
        id: inst.id,
        paidInstallments: newPaid,
        isActive: newPaid < inst.totalInstallments,
      });
      toast.success(newPaid >= inst.totalInstallments ? 'Sve rate placene!' : 'Rata placena');
    } catch {
      toast.error('Greska');
    }
  };

  const active = installments.filter((i) => i.isActive);
  const completed = installments.filter((i) => !i.isActive);
  const totalMonthly = active.reduce((s, i) => s + i.monthlyAmount, 0);
  const totalRemaining = active.reduce((s, i) => s + (i.totalAmount - i.monthlyAmount * i.paidInstallments), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Rate</h2>
        <Button onClick={() => { resetForm(); setShowModal(true); }} size="sm"><Plus size={18} /> Nova rata</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 text-primary-400 mb-2">
            <CreditCard size={18} />
            <span className="text-xs font-medium opacity-70">Mjesecno za rate</span>
          </div>
          <p className="text-lg font-bold text-primary-400">{formatCurrency(totalMonthly, currency)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-warning-400 mb-2">
            <CalendarClock size={18} />
            <span className="text-xs font-medium opacity-70">Preostalo ukupno</span>
          </div>
          <p className="text-lg font-bold text-warning-400">{formatCurrency(totalRemaining, currency)}</p>
        </Card>
      </div>

      {/* Active */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : active.length === 0 && completed.length === 0 ? (
        <EmptyState icon="CalendarClock" title="Nema rata" description="Dodaj rate za pracenje otplate" />
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold opacity-60">Aktivne rate ({active.length})</h3>
              {active.map((inst) => {
                const progress = (inst.paidInstallments / inst.totalInstallments) * 100;
                return (
                  <Card key={inst.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold">{inst.name}</p>
                        <p className="text-xs opacity-50 mt-0.5">
                          {inst.paidInstallments}/{inst.totalInstallments} rata &middot; Od {format(new Date(inst.startDate), 'dd.MM.yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => payInstallment(inst)} className="p-2 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 transition-colors" title="Plati ratu">
                          <Check size={16} className="text-accent-400" />
                        </button>
                        <button onClick={() => openEdit(inst)} className="p-2 rounded-xl hover:bg-dark-700/50"><Edit3 size={14} className="opacity-50" /></button>
                        <button onClick={() => remove.mutateAsync(inst.id).then(() => toast.success('Obrisano'))} className="p-2 rounded-xl hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400 opacity-50" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="opacity-60">Mjesecno: <strong>{formatCurrency(inst.monthlyAmount, currency)}</strong></span>
                      <span className="opacity-60">Ukupno: <strong>{formatCurrency(inst.totalAmount, currency)}</strong></span>
                    </div>
                    <div className={cn('h-2.5 rounded-full overflow-hidden', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-200')}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                    <p className="text-xs text-right mt-1 opacity-50">{progress.toFixed(0)}% otplaceno</p>
                    {inst.note && <p className="text-xs opacity-40 mt-2 italic">{inst.note}</p>}
                  </Card>
                );
              })}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold opacity-60">Zavrsene ({completed.length})</h3>
              {completed.map((inst) => (
                <Card key={inst.id} className="opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold line-through">{inst.name}</p>
                      <p className="text-xs opacity-50">{formatCurrency(inst.totalAmount, currency)} - Placeno</p>
                    </div>
                    <button onClick={() => remove.mutateAsync(inst.id)} className="p-2 rounded-xl hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400" /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Uredi rate' : 'Nove rate'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Naziv" placeholder="Npr. iPhone 15" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ukupan iznos" type="number" step="0.01" value={formTotal} onChange={(e) => setFormTotal(e.target.value)} required />
            <Input label="Mjesecna rata" type="number" step="0.01" value={formMonthly} onChange={(e) => setFormMonthly(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Broj rata" type="number" value={formTotalInst} onChange={(e) => setFormTotalInst(e.target.value)} required />
            <Input label="Placeno rata" type="number" value={formPaid} onChange={(e) => setFormPaid(e.target.value)} />
          </div>
          <Input label="Datum pocetka" type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} required />
          <Textarea label="Napomena" placeholder="Opciona napomena..." value={formNote} onChange={(e) => setFormNote(e.target.value)} />
          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>
            {editingId ? 'Sacuvaj' : 'Dodaj rate'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
