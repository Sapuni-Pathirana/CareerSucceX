interface MarqueeStripProps {
  items: string[];
  className?: string;
  theme?: 'light' | 'dark';
}

export default function MarqueeStrip({ items, className = '', theme = 'light' }: MarqueeStripProps) {
  const doubled = [...items, ...items];
  const isDark = theme === 'dark';

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-2 text-sm font-medium ${
              isDark ? 'text-[#a099c0]' : 'text-slate-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDark ? 'bg-[#c4b5fd]' : 'bg-brand-400'
              }`}
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
