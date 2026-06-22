interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: string;
  theme?: 'light' | 'dark';
}

export default function PageHeader({
  title,
  description,
  action,
  badge,
  theme = 'light',
}: PageHeaderProps) {
  const isDark = theme === 'dark';

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-fade-in">
      <div>
        {badge && (
          <span
            className={
              isDark
                ? 'dash-badge mb-3'
                : 'pill mb-2 bg-brand-100 text-brand-700'
            }
          >
            {badge}
          </span>
        )}
        <h1
          className={`text-2xl font-bold tracking-tight sm:text-3xl ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h1>
        {description && (
          <p
            className={`mt-1.5 text-sm leading-relaxed ${
              isDark ? 'text-[#a099c0]' : 'text-slate-500'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
