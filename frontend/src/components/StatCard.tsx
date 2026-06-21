import CountUp from './CountUp';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  icon?: string;
  delay?: number;
}

const accentMap: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  indigo:  { bg: 'from-brand-500 to-brand-700',   text: 'text-brand-600',   ring: 'ring-brand-100',   icon: 'bg-brand-50' },
  blue:    { bg: 'from-blue-500 to-blue-700',      text: 'text-blue-600',    ring: 'ring-blue-100',    icon: 'bg-blue-50' },
  emerald: { bg: 'from-emerald-500 to-emerald-700', text: 'text-emerald-600', ring: 'ring-emerald-100', icon: 'bg-emerald-50' },
  amber:   { bg: 'from-amber-500 to-amber-700',    text: 'text-amber-600',   ring: 'ring-amber-100',   icon: 'bg-amber-50' },
  rose:    { bg: 'from-rose-500 to-rose-700',      text: 'text-rose-600',    ring: 'ring-rose-100',    icon: 'bg-rose-50' },
  purple:  { bg: 'from-purple-500 to-purple-700',  text: 'text-purple-600',  ring: 'ring-purple-100',  icon: 'bg-purple-50' },
};

export default function StatCard({ label, value, subtext, accent = 'indigo', icon, delay = 0 }: StatCardProps) {
  const a = accentMap[accent];
  const numeric = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numeric) && value !== '—';

  return (
    <div
      className="card-hover group relative overflow-hidden p-5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow on hover */}
      <div className={`absolute inset-0 bg-aurora-card opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

      {/* Top line accent */}
      <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r ${a.bg}`} />

      <div className="relative">
        {icon && (
          <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${a.icon} text-lg ring-1 ${a.ring}`}>
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
