import { format, parse } from 'date-fns';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatMonth(monthStr: string): string {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthRange(monthStr: string): { start: number; end: number } {
  const date = parse(monthStr, 'yyyy-MM', new Date());
  const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const CATEGORY_ICONS = [
  'ShoppingCart', 'Home', 'Car', 'Utensils', 'Heart', 'Gamepad2',
  'GraduationCap', 'Plane', 'Shirt', 'Smartphone', 'Wifi', 'Zap',
  'Droplets', 'Bus', 'Coffee', 'Gift', 'Music', 'Film',
  'Dumbbell', 'Stethoscope', 'Baby', 'Dog', 'Briefcase', 'PiggyBank',
  'CreditCard', 'Banknote', 'TrendingUp', 'Building2', 'Wrench', 'Scissors',
];

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#2563eb', '#7c3aed', '#9333ea', '#c026d3',
];

export const DEFAULT_CATEGORIES = [
  { name: 'Hrana', icon: 'ShoppingCart', color: '#22c55e', type: 'expense' as const, subcategories: [
    { name: 'Namirnice' }, { name: 'Restoran' }, { name: 'Dostava' }, { name: 'Kafa/Pice' }
  ]},
  { name: 'Stanovanje', icon: 'Home', color: '#3b82f6', type: 'expense' as const, subcategories: [
    { name: 'Kirija/Rata' }, { name: 'Komunalije' }, { name: 'Internet' }, { name: 'Odrzavanje' }
  ]},
  { name: 'Transport', icon: 'Car', color: '#f59e0b', type: 'expense' as const, subcategories: [
    { name: 'Gorivo' }, { name: 'Parking' }, { name: 'Servis' }, { name: 'Javni prevoz' }
  ]},
  { name: 'Zabava', icon: 'Gamepad2', color: '#ec4899', type: 'expense' as const, subcategories: [
    { name: 'Izlasci' }, { name: 'Pretplate' }, { name: 'Hobiji' }, { name: 'Sport' }
  ]},
  { name: 'Zdravlje', icon: 'Stethoscope', color: '#ef4444', type: 'expense' as const, subcategories: [
    { name: 'Ljekovi' }, { name: 'Pregledi' }, { name: 'Osiguranje' }
  ]},
  { name: 'Odjeca', icon: 'Shirt', color: '#a78bfa', type: 'expense' as const, subcategories: [
    { name: 'Garderoba' }, { name: 'Obuca' }, { name: 'Aksesori' }
  ]},
  { name: 'Obrazovanje', icon: 'GraduationCap', color: '#06b6d4', type: 'expense' as const, subcategories: [
    { name: 'Kursevi' }, { name: 'Knjige' }, { name: 'Softver' }
  ]},
  { name: 'Plata', icon: 'Banknote', color: '#22c55e', type: 'income' as const, subcategories: [
    { name: 'Osnovna plata' }, { name: 'Bonus' }, { name: 'Prekovremeni' }
  ]},
  { name: 'Freelance', icon: 'Briefcase', color: '#6366f1', type: 'income' as const, subcategories: [
    { name: 'Projekti' }, { name: 'Konsultacije' }
  ]},
  { name: 'Ostali prihodi', icon: 'TrendingUp', color: '#10b981', type: 'income' as const, subcategories: [
    { name: 'Investicije' }, { name: 'Pokloni' }, { name: 'Prodaja' }
  ]},
];
