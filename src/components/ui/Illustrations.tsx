/** Original inline SVG illustrations -- no stock imagery, no external assets. */

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 360"
      className={className}
      role="img"
      aria-label="Illustration of a discarded plastic bottle being transformed into a small plant pot"
    >
      <defs>
        <linearGradient id="rv-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#DDF5E9" />
          <stop offset="100%" stopColor="#F8FAF5" />
        </linearGradient>
        <linearGradient id="rv-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#198C76" />
          <stop offset="100%" stopColor="#0F5E4F" />
        </linearGradient>
        <linearGradient id="rv-bottle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#CBEBE2" />
          <stop offset="100%" stopColor="#9FD8C8" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="440" height="360" rx="36" fill="url(#rv-sky)" />
      <circle cx="356" cy="74" r="46" fill="#F2BA62" opacity="0.35" />
      <circle cx="356" cy="74" r="28" fill="#F2BA62" opacity="0.55" />

      {/* left: the discarded bottle */}
      <g transform="translate(58 96)">
        <rect x="18" y="34" width="58" height="124" rx="22" fill="url(#rv-bottle)" />
        <rect x="36" y="12" width="22" height="26" rx="6" fill="#9FD8C8" />
        <rect x="31" y="4" width="32" height="12" rx="6" fill="#198C76" opacity="0.6" />
        <rect x="24" y="74" width="46" height="26" rx="7" fill="#F8FAF5" opacity="0.85" />
        <path d="M31 82h32M31 90h22" stroke="#198C76" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="47" cy="170" rx="42" ry="9" fill="#153C35" opacity="0.08" />
      </g>

      {/* middle: the AI scan */}
      <g transform="translate(176 150)">
        <rect x="0" y="0" width="88" height="62" rx="18" fill="#153C35" />
        <rect x="14" y="16" width="60" height="30" rx="9" fill="#DDF5E9" opacity="0.25" />
        <path d="M22 24h16M22 32h26M22 40h12" stroke="#DDF5E9" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="62" cy="31" r="7" fill="#F2BA62" />
        <path d="M-16 31h-22M104 31h22" stroke="#198C76" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" />
      </g>

      {/* right: the second life */}
      <g transform="translate(286 92)">
        <path
          d="M14 72h76l-9 72a20 20 0 0 1-20 18H43a20 20 0 0 1-20-18L14 72Z"
          fill="url(#rv-bottle)"
        />
        <rect x="6" y="58" width="92" height="20" rx="10" fill="#9FD8C8" />
        <path d="M22 86h60l-6 50H28l-6-50Z" fill="#B98A5E" opacity="0.5" />
        <path
          d="M52 86c0-26 10-44 30-56-6 24-12 38-22 50 16-6 28-4 36 2-14 10-30 12-44 4Z"
          fill="url(#rv-leaf)"
        />
        <path
          d="M52 86c0-18-8-32-24-42 4 18 8 28 16 36-12-4-22-2-28 4 12 8 24 10 36 2Z"
          fill="#198C76"
          opacity="0.75"
        />
        <path d="M52 134V78" stroke="#0F5E4F" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="52" cy="166" rx="52" ry="10" fill="#153C35" opacity="0.08" />
      </g>

      <g opacity="0.7">
        <circle cx="96" cy="60" r="5" fill="#198C76" />
        <circle cx="128" cy="40" r="3.5" fill="#198C76" opacity="0.6" />
        <circle cx="404" cy="246" r="4.5" fill="#198C76" opacity="0.55" />
        <circle cx="36" cy="272" r="6" fill="#F2BA62" opacity="0.7" />
      </g>
    </svg>
  );
}

export function StepGlyph({ step, className }: { step: 1 | 2 | 3 | 4; className?: string }) {
  const common = { strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true" fill="none">
      <rect x="0" y="0" width="56" height="56" rx="18" fill="#DDF5E9" />
      {step === 1 && (
        <g stroke="#0F5E4F" {...common}>
          <path d="M16 22v-4a2 2 0 0 1 2-2h4M40 22v-4a2 2 0 0 0-2-2h-4M16 34v4a2 2 0 0 0 2 2h4M40 34v4a2 2 0 0 1-2 2h-4" />
          <path d="M14 28h28" stroke="#198C76" />
        </g>
      )}
      {step === 2 && (
        <g stroke="#0F5E4F" {...common}>
          <circle cx="26" cy="26" r="9" />
          <path d="M33 33l7 7" />
          <path d="M26 21v5l3 2" stroke="#198C76" />
        </g>
      )}
      {step === 3 && (
        <g stroke="#0F5E4F" {...common}>
          <path d="M28 16c0 8 4 12 8 16s2 10-4 10-12-4-12-12 4-10 8-14Z" />
          <path d="M28 42v-8" stroke="#198C76" />
        </g>
      )}
      {step === 4 && (
        <g stroke="#0F5E4F" {...common}>
          <path d="M16 40V28M28 40V20M40 40V24" />
          <path d="M14 44h28" stroke="#198C76" />
        </g>
      )}
    </svg>
  );
}

export function EmptyPlanetGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <circle cx="32" cy="32" r="20" stroke="#198C76" strokeWidth="3" />
      <path d="M12 32h40M32 12c6 6 6 34 0 40M32 12c-6 6-6 34 0 40" stroke="#198C76" strokeWidth="2.4" opacity="0.6" />
    </svg>
  );
}
