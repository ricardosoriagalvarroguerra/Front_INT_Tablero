import type { ReactNode } from 'react';

interface SectionTitleProps {
  /** Código de módulo heredado: ya no se muestra (rediseño minimalista). */
  id?: string;
  title: string;
  right?: ReactNode;
}

export function SectionTitle({ title, right }: SectionTitleProps) {
  const t = title.charAt(0).toUpperCase() + title.slice(1);
  return (
    <div className="flex items-center justify-between gap-2 px-3 h-9 border-b border-token">
      <div className="text-[12px] font-semibold truncate">{t}</div>
      <div className="flex items-center gap-2 text-[10px] text-subtle shrink-0">{right}</div>
    </div>
  );
}
