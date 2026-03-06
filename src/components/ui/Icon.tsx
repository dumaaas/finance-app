import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideIcon = (Icons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!LucideIcon) return <Icons.Circle {...props} />;
  return <LucideIcon {...props} />;
}
