import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, FileText, Plus, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useCategories, useTransactionMutations } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { cn, formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

interface ScannedItem {
  description: string;
  amount: number;
}

export function ReceiptScanPage() {
  const { theme, currency } = useAppStore();
  const { data: categories = [] } = useCategories();
  const { create, userId } = useTransactionMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScanning(true);
    setItems([]);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng+deu+hrv');
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const lines = data.text.split('\n').filter((l) => l.trim());
      const parsedItems: ScannedItem[] = [];

      for (const line of lines) {
        const match = line.match(/(.+?)\s+([\d.,]+)\s*$/);
        if (match) {
          const desc = match[1].trim();
          const amount = parseFloat(match[2].replace(',', '.'));
          if (desc && amount > 0 && amount < 100000) {
            parsedItems.push({ description: desc, amount });
          }
        }
      }

      if (parsedItems.length === 0) {
        const totalMatch = data.text.match(/(?:total|ukupno|suma|iznos)[:\s]*([\d.,]+)/i);
        if (totalMatch) {
          parsedItems.push({
            description: 'Ukupno sa racuna',
            amount: parseFloat(totalMatch[1].replace(',', '.')),
          });
        }
      }

      setItems(parsedItems.length > 0 ? parsedItems : [{ description: 'Racun', amount: 0 }]);
      if (parsedItems.length > 0) {
        toast.success(`Pronadjeno ${parsedItems.length} stavki`);
      } else {
        toast('OCR nije pronasao stavke. Dodaj ih rucno.', { icon: 'i' });
      }
    } catch {
      toast.error('Greska pri skeniranju');
      setItems([{ description: 'Racun', amount: 0 }]);
    } finally {
      setScanning(false);
    }
  };

  const updateItem = (idx: number, field: keyof ScannedItem, value: string) => {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : item
    ));
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const addItem = () => setItems([...items, { description: '', amount: 0 }]);

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);

  const saveAll = async () => {
    if (!userId || !categoryId || items.length === 0) {
      toast.error('Odaberi kategoriju i provjeri stavke');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      for (const item of items) {
        if (item.amount > 0 && item.description) {
          await create.mutateAsync({
            amount: item.amount,
            description: item.description,
            categoryId,
            type: 'expense',
            date: now,
            month: format(new Date(), 'yyyy-MM'),
            userId,
            createdAt: now,
          });
        }
      }
      toast.success('Sve transakcije sacuvane!');
      setItems([]);
      setImageUrl(null);
      setCategoryId('');
    } catch {
      toast.error('Greska pri cuvanju');
    } finally {
      setSaving(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-black">Skeniraj racun</h2>

      {/* Upload area */}
      {!imageUrl && !scanning && (
        <Card className="!p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 sm:p-12 cursor-pointer transition-all',
              theme === 'dark' ? 'border-dark-700 hover:border-primary-500/50 hover:bg-dark-800/30' : 'border-dark-300 hover:border-primary-500/50 hover:bg-dark-50'
            )}
          >
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
              <Camera size={36} className="text-white" />
            </div>
            <h3 className="text-lg font-bold mb-1">Fotografisi ili uploaduj racun</h3>
            <p className="text-sm opacity-50 text-center max-w-xs">
              Slikaj racun kamerom ili uploaduj sliku. AI ce prepoznati stavke automatski.
            </p>
            <div className="flex gap-3 mt-6">
              <Button size="sm"><Camera size={16} /> Kamera</Button>
              <Button variant="secondary" size="sm"><Upload size={16} /> Upload</Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </Card>
      )}

      {/* Scanning */}
      {scanning && (
        <Card className="!p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center animate-pulse">
                <Sparkles size={36} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold">Skeniram racun...</h3>
              <p className="text-sm opacity-50">OCR prepoznavanje u toku</p>
            </div>
            <Loader2 size={24} className="animate-spin text-primary-400" />
          </div>
        </Card>
      )}

      {/* Results */}
      {!scanning && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Image preview */}
            {imageUrl && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold opacity-80">Slika racuna</h3>
                  <button onClick={() => { setImageUrl(null); setItems([]); }}
                    className="p-1.5 rounded-lg hover:bg-danger-500/20"><X size={16} className="text-danger-400" /></button>
                </div>
                <img src={imageUrl} alt="Receipt" className="w-full rounded-xl max-h-80 object-contain" />
              </Card>
            )}

            {/* Parsed items */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold opacity-80">Prepoznate stavke</h3>
                <button onClick={addItem} className="p-1.5 rounded-lg hover:bg-dark-700/50"><Plus size={16} /></button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Opis"
                      className={cn('flex-1 px-3 py-2 rounded-lg text-sm outline-none', theme === 'dark' ? 'bg-dark-800 border border-dark-700 text-dark-100' : 'bg-dark-50 border border-dark-200')}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                      placeholder="0.00"
                      className={cn('w-24 px-3 py-2 rounded-lg text-sm outline-none text-right', theme === 'dark' ? 'bg-dark-800 border border-dark-700 text-dark-100' : 'bg-dark-50 border border-dark-200')}
                    />
                    <button onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-danger-500/20 shrink-0">
                      <X size={14} className="text-danger-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div className={cn('flex justify-between items-center mt-4 pt-4 border-t', theme === 'dark' ? 'border-dark-700' : 'border-dark-200')}>
                <span className="text-sm font-bold">Ukupno:</span>
                <span className="text-lg font-black text-primary-400">{formatCurrency(totalAmount, currency)}</span>
              </div>
            </Card>
          </div>

          {/* Category & Save */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Select
                  label="Kategorija za sve stavke"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={[{ value: '', label: 'Odaberi kategoriju' }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]}
                />
              </div>
              <Button onClick={saveAll} loading={saving} className="w-full sm:w-auto">
                <FileText size={16} /> Sacuvaj sve transakcije
              </Button>
            </div>
          </Card>

          {/* Scan another */}
          <div className="text-center">
            <Button variant="ghost" onClick={() => { fileInputRef.current?.click(); }}>
              <Camera size={16} /> Skeniraj novi racun
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </>
      )}
    </motion.div>
  );
}
