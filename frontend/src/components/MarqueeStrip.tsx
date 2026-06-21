interface MarqueeStripProps {
  items: string[];
  className?: string;
}

export default function MarqueeStrip({ items, className = '' }: MarqueeStripProps) {
  const doubled = [...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
