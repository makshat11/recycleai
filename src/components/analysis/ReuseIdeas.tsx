import { useState } from 'react';
import { CheckCircle2, Clock, Gauge, Hammer, Leaf, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert, Badge, Card } from '@/components/ui/primitives';
import type { Difficulty, ReuseIdea } from '@/types/analysis';
import { cn } from '@/lib/utils';

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  Easy: 'bg-eco-50 text-eco-700',
  Medium: 'bg-amber-soft text-amber-deep',
  Advanced: 'bg-red-50 text-red-700',
};

interface ReuseIdeasSectionProps {
  ideas: ReuseIdea[];
  selectedIdeaId: string | null;
  onSelect: (idea: ReuseIdea) => void;
}

export function ReuseIdeasSection({ ideas, selectedIdeaId, onSelect }: ReuseIdeasSectionProps) {
  const [openIdea, setOpenIdea] = useState<ReuseIdea | null>(null);

  if (ideas.length === 0) return null;

  return (
    <section aria-labelledby="reuse-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Give it a second life</p>
          <h2 id="reuse-heading" className="mt-2 text-xl sm:text-2xl">
            {ideas.length === 1 ? 'One safe project' : `${ideas.length} safe projects`} for this item
          </h2>
        </div>
        <p className="text-xs text-muted">Tap a card for full instructions</p>
      </div>

      <ul className="grid gap-5 lg:grid-cols-3">
        {ideas.map((idea) => {
          const chosen = idea.id === selectedIdeaId;
          return (
            <li key={idea.id}>
              <Card
                className={cn(
                  'flex h-full flex-col transition hover:-translate-y-0.5 hover:shadow-lift',
                  chosen && 'border-eco ring-2 ring-eco/30',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint text-eco-700">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide',
                      DIFFICULTY_TONE[idea.difficulty],
                    )}
                  >
                    {idea.difficulty}
                  </span>
                </div>

                <h3 className="mt-4 text-lg">{idea.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{idea.description}</p>

                <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <dt className="sr-only">Estimated time</dt>
                    <dd>{idea.estimatedTime}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                    <dt className="sr-only">Materials</dt>
                    <dd>
                      {idea.materialsNeeded.length === 0
                        ? 'No extras'
                        : `${idea.materialsNeeded.length} item${idea.materialsNeeded.length === 1 ? '' : 's'}`}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                    <dt className="sr-only">Steps</dt>
                    <dd>{idea.instructions.length} steps</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setOpenIdea(idea)}>
                    View instructions
                  </Button>
                  <Button
                    size="sm"
                    variant={chosen ? 'ghost' : 'primary'}
                    onClick={() => onSelect(idea)}
                    disabled={chosen}
                  >
                    {chosen ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Added to your eco actions
                      </>
                    ) : (
                      "I'll Try This Idea"
                    )}
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <ReuseIdeaModal
        idea={openIdea}
        selected={openIdea?.id === selectedIdeaId}
        onClose={() => setOpenIdea(null)}
        onSelect={(idea) => {
          onSelect(idea);
          setOpenIdea(null);
        }}
      />
    </section>
  );
}

export function ReuseIdeaModal({
  idea,
  selected,
  onClose,
  onSelect,
}: {
  idea: ReuseIdea | null;
  selected: boolean;
  onClose: () => void;
  onSelect: (idea: ReuseIdea) => void;
}) {
  return (
    <Modal
      open={Boolean(idea)}
      onClose={onClose}
      title={idea?.title ?? ''}
      subtitle={idea ? `${idea.difficulty} - about ${idea.estimatedTime}` : undefined}
      footer={
        idea ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onSelect(idea)} disabled={selected}>
              {selected ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Already added
                </>
              ) : (
                "I'll Try This Idea"
              )}
            </Button>
          </>
        ) : undefined
      }
    >
      {idea && (
        <div className="space-y-7">
          <p className="text-sm leading-relaxed text-muted">{idea.description}</p>

          <div className="flex flex-wrap gap-2">
            <Badge tone="mint">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {idea.estimatedTime}
            </Badge>
            <Badge tone={idea.difficulty === 'Easy' ? 'neutral' : 'amber'}>
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              {idea.difficulty}
            </Badge>
          </div>

          <section>
            <h3 className="text-base">What you need</h3>
            {idea.materialsNeeded.length === 0 ? (
              <p className="mt-3 rounded-xl bg-cream px-3 py-2.5 text-sm text-muted">
                Nothing beyond the item itself and basic household tools.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {idea.materialsNeeded.map((material) => (
                  <li
                    key={material}
                    className="flex items-start gap-2.5 rounded-xl bg-cream px-3 py-2.5 text-sm text-ink/90"
                  >
                    <Hammer className="mt-0.5 h-4 w-4 shrink-0 text-eco-600" aria-hidden="true" />
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-base">Step-by-step</h3>
            <ol className="mt-3 space-y-3">
              {idea.instructions.map((step, index) => (
                <li key={`${index}-${step.slice(0, 12)}`} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-ink/90">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {idea.safetyNotes.length > 0 && (
            <Alert tone="warning" title="Safety notes">
              <ul className="space-y-2">
                {idea.safetyNotes.map((note) => (
                  <li key={note} className="flex gap-2.5">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <section className="rounded-2xl bg-eco-50 px-4 py-4">
            <h3 className="flex items-center gap-2 text-base">
              <Leaf className="h-4 w-4 text-eco-600" aria-hidden="true" />
              Why it helps
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/85">{idea.environmentalBenefit}</p>
          </section>

          <p className="text-xs leading-relaxed text-muted">
            Use your own judgement before starting. Supervise children, and do not reuse any
            container for food or drinking water unless it was made for that purpose, is undamaged
            and can be cleaned thoroughly.
          </p>
        </div>
      )}
    </Modal>
  );
}
