import { useEffect, useState } from 'react';
import { CircleDashed, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/primitives';
import { LOADING_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Staged progress indicator. These are *progress hints*, not claims that a
 * stage finished -- the real analysis arrives in one response from the server,
 * and nothing is rendered from this component but placeholders.
 */
export function AnalysisProgress() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, LOADING_STAGES.length - 1));
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="card card-pad" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-eco-600" aria-hidden="true" />
        <p className="font-bold text-forest">Analysing with AI</p>
      </div>

      <ol className="mt-5 space-y-3">
        {LOADING_STAGES.map((label, index) => {
          const active = index === stage;
          const passed = index < stage;
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
                  passed
                    ? 'border-eco-500 bg-eco-500'
                    : active
                      ? 'border-eco-500 bg-white'
                      : 'border-eco-100 bg-white',
                )}
                aria-hidden="true"
              >
                {active ? (
                  <CircleDashed className="h-3.5 w-3.5 animate-spin text-eco-600" />
                ) : passed ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </span>
              <span className={cn(passed || active ? 'font-semibold text-forest' : 'text-muted')}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        These steps show progress only. Your results appear once the AI has finished the whole
        analysis -- usually a few seconds.
      </p>

      <div className="mt-6 space-y-3 border-t border-eco-100 pt-6">
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  );
}
