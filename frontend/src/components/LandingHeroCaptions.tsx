import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

function CaptionBlock({
  children,
  delay = 0,
  visible,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  visible: boolean;
  className?: string;
}) {
  return (
    <div
      className={`hero-caption-item ${visible ? 'hero-caption-item--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export default function LandingHeroCaptions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative z-10 max-w-4xl">
      <CaptionBlock visible={visible} delay={0}>
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] sm:text-base">
          <span className="hero-caption-gradient hero-caption-shimmer">
            AI-Powered Career Readiness
          </span>
        </p>
      </CaptionBlock>

      <h1 className="mb-8 flex flex-col gap-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl sm:gap-4 lg:text-6xl xl:text-7xl">
        <span
          className={`hero-caption-item ${visible ? 'hero-caption-item--visible' : ''}`}
          style={{ transitionDelay: '180ms' }}
        >
          Build your{' '}
          <span className="hero-caption-gradient">Future Career</span>
        </span>
        <span
          className={`hero-caption-item ${visible ? 'hero-caption-item--visible' : ''}`}
          style={{ transitionDelay: '320ms' }}
        >
          with Confidence
        </span>
      </h1>

      <CaptionBlock visible={visible} delay={400}>
        <p className="hero-subtitle mx-auto mb-10 max-w-[34rem] sm:max-w-2xl">
          CareerSucceX analyses your CV, GitHub, interview skills, and knowledge gaps.
          <br />
          Get a real-time readiness score and a step-by-step plan to land jobs and internships.
        </p>
      </CaptionBlock>

      <CaptionBlock visible={visible} delay={600} className="flex justify-center">
        <Link
          to="/register"
          className="landing-cta-btn animate-pulse-glow"
        >
          Start for free →
        </Link>
      </CaptionBlock>

      <CaptionBlock visible={visible} delay={750}>
        <p className="mt-8 text-sm leading-relaxed text-[#7aaea9]">
          Join thousands of job seekers who improved their career readiness with AI
        </p>
      </CaptionBlock>
    </div>
  );
}
