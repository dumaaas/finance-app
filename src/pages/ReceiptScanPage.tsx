import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode, Camera, StopCircle, FileText, X,
  Building2, Calendar, Hash, Receipt, CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useCategories, useTransactionMutations } from '../hooks/useFirestore';
import { useAppStore } from '../lib/store';
import { cn, formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

interface ReceiptData {
  iic: string;
  tin: string;
  totalPrice: number;
  dateTime: string;
  orderNumber: string;
  businessUnit: string;
  cashRegister: string;
  software: string;
  verifyUrl: string;
}

function parseReceiptQR(qrText: string): ReceiptData | null {
  try {
    const url = new URL(qrText);
    if (!url.hostname.includes('tax.gov.me')) return null;

    const hash = url.hash || '';
    const queryPart = hash.includes('?') ? hash.split('?')[1] : url.search.slice(1);
    const params = new URLSearchParams(queryPart);

    const iic = params.get('iic') || '';
    const tin = params.get('tin') || '';
    const crtd = params.get('crtd') || '';
    const ord = params.get('ord') || '';
    const bu = params.get('bu') || '';
    const cr = params.get('cr') || '';
    const sw = params.get('sw') || '';
    const prc = params.get('prc') || '0';

    if (!tin && !prc) return null;

    return {
      iic,
      tin,
      totalPrice: parseFloat(prc.replace(',', '.')),
      dateTime: crtd,
      orderNumber: ord,
      businessUnit: bu,
      cashRegister: cr,
      software: sw,
      verifyUrl: qrText,
    };
  } catch {
    return null;
  }
}

function formatReceiptDate(dateStr: string): { display: string; timestamp: number } {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error('Invalid');
    return {
      display: format(date, 'dd.MM.yyyy HH:mm'),
      timestamp: date.getTime(),
    };
  } catch {
    return { display: dateStr || 'Nepoznat datum', timestamp: Date.now() };
  }
}

export function ReceiptScanPage() {
  const { theme } = useAppStore();
  const { data: categories = [] } = useCategories();
  const { create, userId } = useTransactionMutations();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const lastDecodedRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const DEBOUNCE_MS = 1500;

  const [scannerActive, setScannerActive] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const stopScanner = useCallback(async () => {
    try {
      if (html5QrRef.current?.isScanning) {
        await html5QrRef.current.stop();
      }
      html5QrRef.current?.clear();
    } catch {
      // scanner already stopped
    }
    html5QrRef.current = null;
    setScannerActive(false);
  }, []);

  const handleQrResult = useCallback((decodedText: string) => {
    const now = Date.now();
    const last = lastDecodedRef.current;
    const preview = decodedText.length > 60 ? decodedText.slice(0, 60) + '...' : decodedText;
    console.log('[QR] Prepoznat tekst (dužina ' + decodedText.length + '):', preview);

    if (last.text === decodedText && now - last.at < DEBOUNCE_MS) {
      console.log('[QR] Preskačem (isti QR u debounce periodu)');
      return;
    }
    lastDecodedRef.current = { text: decodedText, at: now };

    const data = parseReceiptQR(decodedText);
    if (data) {
      console.log('[QR] Validan fiskalni račun:', data.totalPrice, 'EUR', data.dateTime);
      stopScanner();
      setReceiptData(data);
      const dateInfo = formatReceiptDate(data.dateTime);
      setDescription(`Fiskalni racun - ${dateInfo.display}`);
      toast.success(`Racun skeniran: ${formatCurrency(data.totalPrice, 'EUR')}`);
    } else {
      console.log('[QR] Nije CG fiskalni račun (nema tax.gov.me ili neispravan format)');
      toast.error('QR kod nije crnogorski fiskalni racun');
    }
  }, [stopScanner]);

  const startScanner = () => {
    if (html5QrRef.current) {
      stopScanner();
    }
    setScannerActive(true);
  };

  const handleManualUrl = () => {
    if (!manualUrl.trim()) return;
    handleQrResult(manualUrl.trim());
    if (!receiptData) {
      toast.error('Neispravan URL. Treba biti link sa tax.gov.me');
    }
    setManualUrl('');
  };

  const saveTransaction = async () => {
    if (!userId || !categoryId || !receiptData) {
      toast.error('Odaberi kategoriju');
      return;
    }

    setSaving(true);
    const dateInfo = formatReceiptDate(receiptData.dateTime);

    try {
      await create.mutateAsync({
        amount: receiptData.totalPrice,
        description: description || `Fiskalni racun #${receiptData.orderNumber}`,
        categoryId,
        type: 'expense',
        date: dateInfo.timestamp,
        month: format(new Date(dateInfo.timestamp), 'yyyy-MM'),
        userId,
        tags: [`TIN:${receiptData.tin}`, `IIC:${receiptData.iic}`],
        createdAt: Date.now(),
      });
      toast.success('Transakcija sacuvana!');
      setReceiptData(null);
      setDescription('');
      setCategoryId('');
    } catch {
      toast.error('Greska pri cuvanju');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    stopScanner();
    setReceiptData(null);
    setDescription('');
    setCategoryId('');
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // Start scanner only after the #qr-reader div is mounted (when scannerActive becomes true)
  useEffect(() => {
    if (!scannerActive) return;

    let scanner: import('html5-qrcode').Html5Qrcode | null = null;

    const init = async () => {
      const el = document.getElementById('qr-reader');
      if (!el) return;

      lastDecodedRef.current = { text: '', at: 0 };

      const startConfig = {
        fps: 15,
        aspectRatio: 4 / 3,
        qrbox: (w: number, h: number) => {
          const size = Math.round(Math.min(w, h) * 0.85);
          return { width: size, height: size };
        },
        videoConstraints: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      };

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-reader', {
          verbose: false,
          useBarCodeDetectorIfSupported: true,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          startConfig,
          (decodedText) => handleQrResult(decodedText),
          () => {},
        );
      } catch (err) {
        console.warn('[QR Scanner] S videoConstraints nije uspio, pokušavam bez:', err);
        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
          scanner = new Html5Qrcode('qr-reader', {
            verbose: false,
            useBarCodeDetectorIfSupported: true,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          });
          html5QrRef.current = scanner;
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 15, aspectRatio: 4 / 3, qrbox: (w: number, h: number) => ({ width: Math.round(Math.min(w, h) * 0.85), height: Math.round(Math.min(w, h) * 0.85) }) },
            (decodedText) => handleQrResult(decodedText),
            () => {},
          );
        } catch (err2) {
          console.error('[QR Scanner] Greška:', err2);
          toast.error('Ne mogu pristupiti kameri. Provjeri dozvole.');
          setScannerActive(false);
        }
      }
    };

    init();

    return () => {
      if (scanner?.isScanning) {
        scanner.stop().catch(() => { });
      }
      scanner?.clear();
      html5QrRef.current = null;
    };
  }, [scannerActive, handleQrResult]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Skeniraj racun</h2>
        {(scannerActive || receiptData) && (
          <Button variant="ghost" size="sm" onClick={reset}><X size={16} /> Resetuj</Button>
        )}
      </div>

      {/* Info card */}
      <Card className="gradient-mesh">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/20 shrink-0">
            <QrCode size={22} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold mb-1">CG Fiskalni QR kod</h3>
            <p className="text-xs opacity-60 leading-relaxed">
              Skeniraj QR kod sa fiskalnog racuna iz Crne Gore. Automatski se preuzimaju podaci o iznosu, datumu i poreskom obvezniku sa Poreske uprave.
            </p>
          </div>
        </div>
      </Card>

      {/* Scanner / Start button */}
      {!receiptData && (
        <>
          {!scannerActive ? (
            <Card>
              <div className="flex flex-col items-center py-8">
                <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mb-5 shadow-xl shadow-primary-500/25">
                  <QrCode size={44} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">Spremi QR kod</h3>
                <p className="text-sm opacity-50 text-center max-w-xs mb-6">
                  Usmjeri kameru na QR kod fiskalnog racuna
                </p>
                <Button onClick={startScanner} size="lg">
                  <Camera size={20} /> Pokreni skener
                </Button>
              </div>

              {/* Manual URL entry */}
              <div className={cn('mt-6 pt-6 border-t', theme === 'dark' ? 'border-dark-800' : 'border-dark-200')}>
                <p className="text-xs font-semibold opacity-60 mb-3">Ili unesi URL rucno:</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://mapr.tax.gov.me/ic/#/verify?..."
                    onKeyDown={(e) => e.key === 'Enter' && handleManualUrl()}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-sm outline-none',
                      theme === 'dark'
                        ? 'bg-dark-800 border border-dark-700 text-dark-100 placeholder:text-dark-500'
                        : 'bg-dark-50 border border-dark-200 text-dark-900 placeholder:text-dark-400',
                      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                    )}
                  />
                  <Button onClick={handleManualUrl} size="sm">Provjeri</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
                  Skener aktivan
                </h3>
                <Button variant="danger" size="sm" onClick={stopScanner}>
                  <StopCircle size={16} /> Zaustavi
                </Button>
              </div>
              <div
                id="qr-reader"
                ref={scannerRef}
                className="rounded-xl overflow-hidden min-h-[280px] [&_video]:max-h-[min(70vh,420px)]!"
              />
              <p className="text-xs text-center opacity-40 mt-3">
                Usmjeri kameru na QR kod fiskalnog racuna
              </p>
            </Card>
          )}
        </>
      )}

      {/* Receipt data display */}
      {receiptData && (
        <>
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-accent-500/20">
                <CheckCircle2 size={22} className="text-accent-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Racun uspjesno skeniran</h3>
                <p className="text-xs opacity-50">Podaci preuzeti sa QR koda</p>
              </div>
            </div>

            {/* Amount - big display */}
            <div className={cn(
              'text-center py-6 rounded-2xl mb-5',
              theme === 'dark' ? 'bg-dark-800/60' : 'bg-dark-50'
            )}>
              <p className="text-xs font-medium opacity-50 mb-1">Ukupan iznos</p>
              <p className="text-4xl font-black text-primary-400">
                {formatCurrency(receiptData.totalPrice, 'EUR')}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <DetailItem
                icon={<Calendar size={15} />}
                label="Datum i vrijeme"
                value={formatReceiptDate(receiptData.dateTime).display}
                theme={theme}
              />
              <DetailItem
                icon={<Building2 size={15} />}
                label="PIB obveznika"
                value={receiptData.tin || '-'}
                theme={theme}
              />
              <DetailItem
                icon={<Hash size={15} />}
                label="Broj racuna"
                value={receiptData.orderNumber || '-'}
                theme={theme}
              />
              <DetailItem
                icon={<Receipt size={15} />}
                label="Poslovna jed."
                value={receiptData.businessUnit?.slice(0, 12) || '-'}
                theme={theme}
              />
            </div>

            {/* Verify link */}
            <a
              href={receiptData.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 text-xs text-center text-primary-400 hover:text-primary-300 underline underline-offset-2"
            >
              Verifikuj racun na tax.gov.me
            </a>
          </Card>

          {/* Save form */}
          <Card>
            <h3 className="text-sm font-bold mb-4">Sacuvaj kao transakciju</h3>
            <div className="space-y-4">
              <Input
                label="Opis"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Npr. Kupovina u Voli marketu"
              />
              <Select
                label="Kategorija"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={[
                  { value: '', label: 'Odaberi kategoriju' },
                  ...expenseCategories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <div className="flex gap-3">
                <Button onClick={saveTransaction} loading={saving} className="flex-1">
                  <FileText size={16} /> Sacuvaj transakciju
                </Button>
                <Button variant="secondary" onClick={reset}>
                  <QrCode size={16} /> Novi sken
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
}

function DetailItem({ icon, label, value, theme }: { icon: React.ReactNode; label: string; value: string; theme: string }) {
  return (
    <div className={cn('p-3 rounded-xl', theme === 'dark' ? 'bg-dark-800/60' : 'bg-dark-50')}>
      <div className="flex items-center gap-1.5 mb-1 opacity-50">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}
