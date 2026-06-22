import CountUp from './CountUp';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  icon?: string;
  delay?: number;
  theme?: 'light' | 'dark';
}

const accentMap: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  indigo:  { bg: 'from-brand-500 to-brand-700',   text: 'text-brand-600',   ring: 'ring-brand-100',   icon: 'bg-brand-50' },
  blue:    { bg: 'from-blue-500 to-blue-700',      text: 'text-blue-600',    ring: 'ring-blue-100',    icon: 'bg-blue-50' },
  emerald: { bg: 'from-emerald-500 to-emerald-700', text: 'text-emerald-600', ring: 'ring-emerald-100', icon: 'bg-emerald-50' },
  amber:   { bg: 'from-amber-500 to-amber-700',    text: 'text-amber-600',   ring: 'ring-amber-100',   icon: 'bg-amber-50' },
  rose:    { bg: 'from-rose-500 to-rose-700',      text: 'text-rose-600',    ring: 'ring-rose-100',    icon: 'bg-rose-50' },
  purple:  { bg: 'from-purple-500 to-purple-700',  text: 'text-purple-600',  ring: 'ring-purple-100',  icon: 'bg-purple-50' },
};

const darkAccentMap: Record<string, { bg: string; text: string; ring: string; icon: string; live: string }> = {
  indigo:  { bg: 'from-indigo-400 to-violet-400',   text: 'text-indigo-300',   ring: 'ring-white/10', icon: 'bg-white/10', live: 'dash-stat-card--indigo' },
  blue:    { bg: 'from-sky-400 to-blue-400',        text: 'text-sky-300',      ring: 'ring-white/10', icon: 'bg-white/10', live: 'dash-stat-card--blue' },
  emerald: { bg: 'from-emerald-400 to-teal-400',    text: 'text-emerald-300',  ring: 'ring-white/10', icon: 'bg-white/10', live: 'dash-stat-card--emerald' },
  amber:   { bg: 'from-amber-400 to-orange-400',    text: 'text-amber-300',    ring: 'ring-white/10', icon: 'bg-white/10', live: 'dash-stat-card--amber' },
  rose:    { bg: 'from-rose-400 to-pink-400',       text: 'text-rose-300',     ring: 'ring-white/10', icon: 'bg-white/10', live: 'dash-stat-card--indigo' },
  purple:  { bg: 'from-purple-400 to-fuchsia-400', text: 'text-purple-300',   ring: 'ring-white/10', icon: 'bg-white/10', live: 'dash-stat-card--indigo' },
};

export default function StatCard({
  label,
  value,
  subtext,
  accent = 'indigo',
  icon,
  delay = 0,
  theme = 'light',
}: StatCardProps) {
  const isDark = theme === 'dark';
  const a = (isDark ? darkAccentMap : accentMap)[accent];
  const numeric = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numeric) && value !== '—';

  if (isDark) {
    const liveClass = 'live' in a ? a.live : 'dash-stat-card--indigo';

    return (
      <div
        className={`dash-stat-card ${liveClass} animate-fade-in`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className={`dash-stat-card__accent bg-gradient-to-r ${a.bg}`} aria-hidden />
        <div className="dash-stat-card__body">
          {icon && (
            <div
              className={`mb-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${a.icon} ${a.ring} text-white/90`}
            >
              {icon}
            </div>
          )}
          <p className="min-h-[2rem] text-xs font-semibold uppercase leading-snug tracking-widest text-[#a099c0]">
            {label}
          </p>
          <div className={`mt-2 bg-gradient-to-r bg-clip-text text-4xl font-extrabold leading-none text-transparent ${a.bg}`}>
            {isNumeric ? (
              <CountUp target={numeric} decimals={value.toString().includes('.') ? 1 : 0} />
            ) : (
              <span>{value}</span>
            )}
          </div>
          <p className="mt-auto min-h-[1.25rem] pt-2 text-xs text-[#8b83a8]">{subtext ?? '\u00A0'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden p-5 animate-fade-in card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-aurora-card opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-[22px] bg-gradient-to-r ${a.bg}`} />

      <div className="relative">
        {icon && (
          <div
            className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg ring-1 ${a.icon} ${a.ring}`}
          >
            {icon}
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <div className={`mt-2 bg-gradient-to-r bg-clip-text text-4xl font-extrabold text-transparent ${a.bg}`}>
          {isNumeric ? (
            <CountUp target={numeric} decimals={value.toString().includes('.') ? 1 : 0} />
          ) : (
            <span>{value}</span>
          )}
        </div>
        {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
      </div>
    </div>
  );
}
