import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Panel({ children, className = '', onClick }: PanelProps) {
  return (
    <div
      onClick={onClick}
      className={`surface rounded-[5px] overflow-hidden ${onClick ? 'cursor-pointer hover:ring-accent' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
