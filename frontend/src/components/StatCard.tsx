interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose';
}

const accentStyles = {
  indigo: 'from-brand-500 to-brand-700',
  blue: 'from-blue-500 to-blue-700',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  rose: 'from-rose-500 to-rose-700',
};

export default function StatCard({ label, value, subtext, accent = 'indigo' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent ${accentStyles[accent]}`}
      >
        {value}
      </p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}
