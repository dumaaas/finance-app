import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 opacity-50">
        <Icon name={icon} size={28} className="text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-60 max-w-xs">{description}</p>
    </div>
  );
}
