import { CheckCircle2, CircleDot } from 'lucide-react';
import { ECO_ACTIONS, ECO_ACTION_LABELS, COMPLETED_ACTIONS, type EcoAction } from '@/lib/storage';
import { cn } from '@/lib/utils';

/**
 * Lets the user record what they actually did with an item. Completion is
 * self-reported -- the copy here says so plainly, and "planning" never counts
 * as a completed action anywhere in the app.
 */
export function ActionPicker({
  value,
  onChange,
  idPrefix,
  compact = false,
}: {
  value: EcoAction;
  onChange: (action: EcoAction) => void;
  idPrefix: string;
  compact?: boolean;
}) {
  return (
    <fieldset>
      <legend className={cn('font-bold text-forest', compact ? 'text-sm' : 'text-base')}>
        What did you do with it?
      </legend>
      {!compact && (
        <p className="mt-1.5 text-sm text-muted">
          You can change this at any time. Only finished actions count towards your completed
          total, and everything here is self-reported rather than independently verified.
        </p>
      )}

      <div className={cn('flex flex-wrap gap-2', compact ? 'mt-3' : 'mt-4')}>
        {ECO_ACTIONS.map((action) => {
          const active = action === value;
          const completed = COMPLETED_ACTIONS.includes(action);
          const id = `${idPrefix}-${action}`;
          return (
            <div key={action}>
              <input
                type="radio"
                id={id}
                name={`${idPrefix}-action`}
                value={action}
                checked={active}
                onChange={() => onChange(action)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition peer-focus-visible:ring-2 peer-focus-visible:ring-eco peer-focus-visible:ring-offset-2',
                  active
                    ? completed
                      ? 'border-eco-600 bg-eco-600 text-white'
                      : 'border-amber bg-amber-soft text-amber-deep'
                    : 'border-eco-100 bg-white text-muted hover:border-eco/40 hover:text-forest',
                )}
              >
                {active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {ECO_ACTION_LABELS[action]}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
