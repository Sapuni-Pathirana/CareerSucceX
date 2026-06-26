import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
  theme?: 'light' | 'dark';
}

export default function EmptyState({
  title,
  description,
  action,
  icon = '◎',
  theme = 'light',
}: EmptyStateProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center animate-fade-in ${
        isDark
          ? 'border-white/[0.08] bg-[#114852]/50'
          : 'border-slate-200 bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
          isDark
            ? 'bg-[#008080]/20 text-[#00B1B1] ring-1 ring-[#008080]/30'
            : 'bg-brand-50 text-brand-400 shadow-glow-sm ring-1 ring-brand-100'
        }`}
      >
        {icon}
      </div>
      <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      {description && (
        <p
          className={`mt-1.5 max-w-sm text-sm leading-relaxed ${
            isDark ? 'text-[#7aaea9]' : 'text-slate-500'
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
