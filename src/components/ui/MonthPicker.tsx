import { format, addMonths, subMonths, parse } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export function MonthPicker() {
  const { selectedMonth, setSelectedMonth, theme } = useAppStore();

  const date = parse(selectedMonth, 'yyyy-MM', new Date());

  const goBack = () => setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'));
  const goForward = () => setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'));
  const goToday = () => setSelectedMonth(format(new Date(), 'yyyy-MM'));

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl px-2 py-1',
      theme === 'dark' ? 'bg-dark-800/60' : 'bg-dark-100/60'
    )}>
      <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors">
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={goToday}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-dark-700/50 transition-colors min-w-[140px] justify-center"
      >
        <Calendar size={14} className="text-primary-400" />
        <span className="text-sm font-semibold">{format(date, 'MMM yyyy')}</span>
      </button>
      <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
