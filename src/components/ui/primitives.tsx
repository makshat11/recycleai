import type { ReactNode } from 'react';
import { Info, ShieldAlert, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------- Card */

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={cn('card card-pad', className)}>{children}</Tag>;
}

/* ------------------------------------------------------------------ Badge */

type BadgeTone = 'eco' | 'mint' | 'amber' | 'danger' | 'neutral';

const BADGE_TONES: Record<BadgeTone, string> = {
  eco: 'bg-eco-600 text-white',
  mint: 'bg-mint text-forest',
  amber: 'bg-amber-soft text-amber-deep',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  neutral: 'bg-eco-50 text-forest',
};

export function Badge({
  children,
  tone = 'mint',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------- SectionHeading */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-2xl sm:text-3xl lg:text-[2.35rem] lg:leading-[1.15]">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Alert */

type AlertTone = 'info' | 'warning' | 'danger';

const ALERT_TONES: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: 'border-eco-100 bg-eco-50/70 text-forest',
    icon: <Info className="h-5 w-5 shrink-0 text-eco-600" aria-hidden="true" />,
  },
  warning: {
    wrap: 'border-amber/50 bg-amber-soft text-[#6b4a10]',
    icon: <TriangleAlert className="h-5 w-5 shrink-0 text-amber-deep" aria-hidden="true" />,
  },
  danger: {
    wrap: 'border-red-200 bg-red-50 text-red-900',
    icon: <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex gap-3 rounded-2xl border px-4 py-3.5', ALERT_TONES[tone].wrap, className)}
      role={tone === 'info' ? undefined : 'alert'}
    >
      {ALERT_TONES[tone].icon}
      <div className="space-y-1 text-sm leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        <div className="[&_p]:leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-eco-100 bg-white/70 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-eco-700">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function BulletList({
  items,
  tone = 'eco',
  className,
}: {
  items: string[];
  tone?: 'eco' | 'amber' | 'danger';
  className?: string;
}) {
  const dot =
    tone === 'amber' ? 'bg-amber' : tone === 'danger' ? 'bg-red-500' : 'bg-eco-500';
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 12)}`} className="flex gap-3 text-sm leading-relaxed text-ink/90">
          <span className={cn('mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
