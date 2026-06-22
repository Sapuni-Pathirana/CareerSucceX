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
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) {
      setValue(0);
      return;
    }

    let frameId = 0;
    let startTime: number | null = null;
    let cancelled = false;

    setValue(0);

    const animate = (timestamp: number) => {
      if (cancelled) return;
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [inView, target, duration, decimals]);

  return (
    <span ref={ref} className={`inline-block min-w-[2ch] tabular-nums ${className}`}>
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
      {suffix}
    </span>
  );
}
