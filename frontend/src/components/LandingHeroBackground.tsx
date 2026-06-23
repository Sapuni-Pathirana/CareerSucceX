/** Floor panels — fast top↓ fill when visiting landing page */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const STICK_COUNT = 30;
const VIEW_W = 1440;
const VIEW_H = 900;
const TOP_Y = 0;
const BOT_Y = VIEW_H;
const FILL_DUR = '1.4s';
const FILL_MS = 1400;

/** Dashboard black-teal palette — black → gunmetal → midnight → teal → verdigris */
const PALETTE: [number, number, number][] = [
  [4, 4, 4],
  [8, 28, 35],
  [11, 38, 43],
  [17, 72, 82],
  [0, 128, 128],
  [0, 155, 155],
  [0, 177, 177],
];

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function stickRgb(i: number): [number, number, number] {
  const t = (i / (STICK_COUNT - 1)) * (PALETTE.length - 1);
  const idx = Math.floor(t);
  const frac = t - idx;
  const a = PALETTE[idx];
  const b = PALETTE[Math.min(idx + 1, PALETTE.length - 1)];
  return [mix(a[0], b[0], frac), mix(a[1], b[1], frac), mix(a[2], b[2], frac)];
}

const STICKS = Array.from({ length: STICK_COUNT }, (_, i) => {
  const left = (i / STICK_COUNT) * VIEW_W;
  const right = ((i + 1) / STICK_COUNT) * VIEW_W;
  return { left, right, width: (right - left), midX: (left + right) / 2, rgb: stickRgb(i) };
});

function stickPath(left: number, right: number) {
  return `M ${left},${BOT_Y} L ${left},${TOP_Y} L ${right},${TOP_Y} L ${right},${BOT_Y} Z`;
}

function rgba(rgb: [number, number, number], a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

function darken(rgb: [number, number, number], factor: number): [number, number, number] {
  return [
    Math.round(rgb[0] * factor),
    Math.round(rgb[1] * factor),
    Math.round(rgb[2] * factor),
  ];
}

function baseGradientStops(rgb: [number, number, number]) {
  return (
    <>
      <stop offset="0%" stopColor={rgba(rgb, 0.1)} />
      <stop offset="45%" stopColor={rgba(rgb, 0.28)} />
      <stop offset="100%" stopColor={rgba(rgb, 0.4)} />
    </>
  );
}

function fillGradientStops(rgb: [number, number, number]) {
  const dark = darken(rgb, 0.48);
  return (
    <>
      <stop offset="0%" stopColor={rgba(dark, 0.62)} />
      <stop offset="50%" stopColor={rgba(dark, 0.78)} />
      <stop offset="100%" stopColor={rgba(dark, 0.88)} />
    </>
  );
}

export default function LandingHeroBackground() {
  const { key: locationKey } = useLocation();
  const [fillCycle, setFillCycle] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setFillCycle((cycle) => cycle + 1);

    const id = window.setTimeout(() => setIsLoading(false), FILL_MS);
    return () => window.clearTimeout(id);
  }, [locationKey]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="landing-aurora-live absolute inset-0"
        style={{
          background: `linear-gradient(
            90deg,
            rgba(4,4,4,0.4) 0%,
            rgba(11,38,43,0.35) 20%,
            rgba(0,128,128,0.28) 50%,
            rgba(0,177,177,0.22) 80%,
            rgba(0,177,177,0.15) 100%
          )`,
          filter: 'blur(75px)',
          opacity: 0.88,
          WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 78%)',
          maskImage: 'linear-gradient(to top, black 10%, transparent 78%)',
        }}
      />

      <svg
        key={fillCycle}
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          {isLoading &&
            STICKS.map((stick, i) => (
              <clipPath key={`clip-${i}`} id={`clip-${i}`} clipPathUnits="userSpaceOnUse">
                <rect x={stick.left} width={stick.width} y={TOP_Y} height={0}>
                  <animate
                    attributeName="height"
                    values={`0;${VIEW_H}`}
                    dur={FILL_DUR}
                    repeatCount="1"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.25 0.1 0.25 1"
                    keyTimes="0;1"
                  />
                </rect>
              </clipPath>
            ))}

          {STICKS.map((stick, i) => (
            <linearGradient
              key={`base-${i}`}
              id={`beam-base-${i}`}
              x1={stick.midX}
              y1={TOP_Y}
              x2={stick.midX}
              y2={BOT_Y}
              gradientUnits="userSpaceOnUse"
            >
              {baseGradientStops(stick.rgb)}
            </linearGradient>
          ))}

          {isLoading &&
            STICKS.map((stick, i) => (
              <linearGradient
                key={`fill-${i}`}
                id={`beam-fill-${i}`}
                x1={stick.midX}
                y1={TOP_Y}
                x2={stick.midX}
                y2={BOT_Y}
                gradientUnits="userSpaceOnUse"
              >
                {fillGradientStops(stick.rgb)}
              </linearGradient>
            ))}
        </defs>

        <g>
          {STICKS.map((stick, i) => (
            <g key={i}>
              <path d={stickPath(stick.left, stick.right)} fill={`url(#beam-base-${i})`} />
              {isLoading && (
                <path
                  d={stickPath(stick.left, stick.right)}
                  fill={`url(#beam-fill-${i})`}
                  clipPath={`url(#clip-${i})`}
                />
              )}
            </g>
          ))}
        </g>
      </svg>

      <div className="absolute inset-0 bg-gradient-to-b from-[#040404] from-0% via-[#040404]/55 via-[18%] to-transparent to-[48%]" />

      <div className="landing-hero-grain absolute inset-0" />
    </div>
  );
}
