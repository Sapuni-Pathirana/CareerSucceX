import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  target: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export default function CountUp({
  target,
  duration = 1400,
  decimals = 0,
  suffix = '',
  className = '',
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          startRef.current = null;

          const animate = (timestamp: number) => {
            if (!startRef.current) startRef.current = timestamp;
            const elapsed = timestamp - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(parseFloat((eased * target).toFixed(decimals)));
            if (progress < 1) {
              frameRef.current = requestAnimationFrame(animate);
            } else {
              setValue(target);
            }
          };

          frameRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, decimals]);

  return (
    <span ref={ref} className={`animate-count-up tabular-nums ${className}`}>
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
      {suffix}
    </span>
  );
}
