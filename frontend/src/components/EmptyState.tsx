import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
  theme?: 'light' | 'dark';
  size?: 'default' | 'compact';
}

export default function EmptyState({
  title,
  description,
  action,
  icon = '◎',
  theme = 'light',
  size = 'default',
}: EmptyStateProps) {
  const isDark = theme === 'dark';
  const isCompact = size === 'compact';

  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center border border-dashed text-center animate-fade-in ${
        isCompact
          ? 'mx-auto w-full max-w-[240px] rounded-xl px-4 py-6'
          : 'w-full rounded-2xl px-6 py-12 sm:px-10 sm:py-16'
      } ${
        isDark
          ? 'border-white/[0.08] bg-[#114852]/50'
          : 'border-slate-200 bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-xl ${
          isCompact ? 'mb-2.5 h-9 w-9 text-base' : 'mb-4 h-14 w-14 rounded-2xl text-2xl'
        } ${
          isDark
            ? 'bg-[#008080]/20 text-[#00B1B1] ring-1 ring-[#008080]/30'
            : 'bg-brand-50 text-brand-400 shadow-glow-sm ring-1 ring-brand-100'
        }`}
      >
        {icon}
      </div>
      <h3
        className={`max-w-md text-balance font-semibold ${
          isCompact ? 'text-sm' : 'text-base'
        } ${isDark ? 'text-white' : 'text-slate-900'}`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`text-balance leading-relaxed ${
            isCompact ? 'mt-1 max-w-[200px] text-xs' : 'mt-1.5 max-w-md text-sm'
          } ${isDark ? 'text-[#7aaea9]' : 'text-slate-500'}`}
        >
          {description}
        </p>
      )}
      {action && <div className={isCompact ? 'mt-3' : 'mt-5'}>{action}</div>}
    </div>
  );
}
