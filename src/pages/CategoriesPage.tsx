import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useCategories, useCategoryMutations } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { cn, CATEGORY_ICONS, CATEGORY_COLORS, DEFAULT_CATEGORIES, generateId } from '../lib/utils';
import type { Subcategory } from '../types';
import toast from 'react-hot-toast';

export function CategoriesPage() {
  const { theme } = useAppStore();
  const { data: categories = [], isLoading } = useCategories();
  const { create, update, remove, userId } = useCategoryMutations();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Form
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('ShoppingCart');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formSubs, setFormSubs] = useState<Subcategory[]>([]);
  const [newSubName, setNewSubName] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormIcon('ShoppingCart');
    setFormColor('#6366f1');
    setFormType('expense');
    setFormSubs([]);
    setNewSubName('');
    setEditingId(null);
  };

  const openEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setFormType(cat.type);
    setFormSubs(cat.subcategories);
    setShowModal(true);
  };

  const addSub = () => {
    if (!newSubName.trim()) return;
    setFormSubs([...formSubs, { id: generateId(), name: newSubName.trim() }]);
    setNewSubName('');
  };

  const removeSub = (id: string) => {
    setFormSubs(formSubs.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const data = {
      name: formName,
      icon: formIcon,
      color: formColor,
      type: formType,
      subcategories: formSubs,
      userId,
      createdAt: Date.now(),
    };

    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...data });
        toast.success('Kategorija azurirana');
      } else {
        await create.mutateAsync(data);
        toast.success('Kategorija kreirana');
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      const msg = err instanceof Error ? err.message : '';
      if (code === 'permission-denied') {
        toast.error('Nemate dozvolu za cuvanje kategorija. Provjerite Firestore pravila.');
      } else {
        toast.error(msg || 'Greska pri cuvanju');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Obrisano');
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'permission-denied') {
        toast.error('Nemate dozvolu. Provjerite Firestore pravila.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Greska');
      }
    }
  };

  const initDefaults = async () => {
    if (!userId) return;
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await create.mutateAsync({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          subcategories: cat.subcategories.map((s) => ({ id: generateId(), name: s.name })),
          userId,
          createdAt: Date.now(),
        });
      }
      toast.success('Podrazumjevane kategorije dodane!');
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'permission-denied') {
        toast.error('Nemate dozvolu. Provjerite Firestore pravila.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Greska');
      }
    }
  };

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Kategorije</h2>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <Button variant="secondary" size="sm" onClick={initDefaults} loading={create.isPending}>
              Podrazumjevane
            </Button>
          )}
          <Button onClick={() => { resetForm(); setShowModal(true); }} size="sm">
            <Plus size={18} /> Nova
          </Button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex bg-dark-800/50 rounded-xl p-1 max-w-xs">
        <button onClick={() => setActiveTab('expense')}
          className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-all', activeTab === 'expense' ? 'gradient-primary text-white' : 'text-dark-400')}>
          Rashodi
        </button>
        <button onClick={() => setActiveTab('income')}
          className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-all', activeTab === 'income' ? 'gradient-primary text-white' : 'text-dark-400')}>
          Prihodi
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="Tags" title="Nema kategorija" description="Dodaj kategorije ili ucitaj podrazumjevane" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((cat) => (
            <Card key={cat.id} className="!p-0 overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                  <Icon name={cat.icon} size={22} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{cat.name}</p>
                  <p className="text-xs opacity-50">{cat.subcategories.length} podkategorija</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)} className="p-1.5 rounded-lg hover:bg-dark-700/50">
                    {expandedId === cat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-dark-700/50">
                    <Edit3 size={14} className="opacity-60" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-danger-500/20">
                    <Trash2 size={14} className="text-danger-400 opacity-60" />
                  </button>
                </div>
              </div>
              {expandedId === cat.id && cat.subcategories.length > 0 && (
                <div className={cn('px-4 pb-3 border-t', theme === 'dark' ? 'border-dark-800' : 'border-dark-100')}>
                  <div className="pt-3 flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <span key={sub.id} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-100')}>
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Uredi kategoriju' : 'Nova kategorija'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2 p-1 rounded-xl bg-dark-800/50">
            <button type="button" onClick={() => setFormType('expense')} className={cn('flex-1 py-2 rounded-lg text-sm font-semibold', formType === 'expense' ? 'gradient-primary text-white' : 'text-dark-400')}>Rashod</button>
            <button type="button" onClick={() => setFormType('income')} className={cn('flex-1 py-2 rounded-lg text-sm font-semibold', formType === 'income' ? 'gradient-primary text-white' : 'text-dark-400')}>Prihod</button>
          </div>

          <Input label="Naziv" placeholder="Npr. Hrana" value={formName} onChange={(e) => setFormName(e.target.value)} required />

          {/* Icon picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium opacity-80">Ikonica</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-dark-800/30">
              {CATEGORY_ICONS.map((icon) => (
                <button key={icon} type="button" onClick={() => setFormIcon(icon)}
                  className={cn('p-2.5 rounded-xl transition-all', formIcon === icon ? 'bg-primary-500 text-white scale-110' : 'hover:bg-dark-700/50')}>
                  <Icon name={icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium opacity-80">Boja</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setFormColor(color)}
                  className={cn('w-8 h-8 rounded-full transition-all', formColor === color && 'ring-2 ring-offset-2 ring-offset-dark-900')}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Subcategories */}
          <div className="space-y-2">
            <label className="block text-sm font-medium opacity-80">Podkategorije</label>
            {formSubs.map((sub) => (
              <div key={sub.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl', theme === 'dark' ? 'bg-dark-800' : 'bg-dark-100')}>
                <span className="flex-1 text-sm">{sub.name}</span>
                <button type="button" onClick={() => removeSub(sub.id)} className="p-1 rounded hover:bg-danger-500/20"><Trash2 size={14} className="text-danger-400" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="text" placeholder="Nova podkategorija" value={newSubName} onChange={(e) => setNewSubName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSub())}
                className={cn('flex-1 px-3 py-2 rounded-xl text-sm outline-none', theme === 'dark' ? 'bg-dark-800 border border-dark-700 text-dark-100' : 'bg-dark-50 border border-dark-200')}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addSub}>Dodaj</Button>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={create.isPending || update.isPending}>
            {editingId ? 'Sacuvaj' : 'Kreiraj kategoriju'}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
