import {
  ArrowRight,
  Factory,
  Leaf,
  Lightbulb,
  MinusCircle,
  PawPrint,
  PlusCircle,
  Recycle,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Alert, Badge, BulletList, Card } from '@/components/ui/primitives';
import { ACTION_LABELS, type WasteAnalysis } from '@/types/analysis';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------- identity */

export function IdentityPanel({
  analysis,
  hadImage,
  provider,
  model,
}: {
  analysis: WasteAnalysis;
  hadImage: boolean;
  provider?: string;
  model?: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Detected item</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">{analysis.itemName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{analysis.description}</p>
        </div>
        <SafetyPill level={analysis.safetyLevel} />
      </div>

      <dl className="mt-7 grid gap-5 border-t border-eco-100 pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Likely material
          </dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {analysis.materials.map((material) => (
              <Badge key={material} tone="mint">
                {material}
              </Badge>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Category</dt>
          <dd className="mt-2 text-sm font-semibold text-forest">{analysis.category}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Possible actions
          </dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {analysis.possibleActions.map((action) => (
              <Badge key={action} tone="neutral">
                {ACTION_LABELS[action]}
              </Badge>
            ))}
          </dd>
        </div>
      </dl>

      {analysis.identificationNotes.length > 0 && (
        <div className="mt-6 rounded-2xl bg-cream px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Identification notes
          </p>
          <BulletList items={analysis.identificationNotes} className="mt-2.5" />
        </div>
      )}

      {analysis.uncertaintyNotice && (
        <Alert tone="warning" title="Needs verification" className="mt-5">
          <p>{analysis.uncertaintyNotice}</p>
        </Alert>
      )}

      <p className="mt-5 text-xs leading-relaxed text-muted">
        Generated from {hadImage ? 'your photo' : 'the item name you typed'}
        {provider ? ` by ${provider}${model ? ` (${model})` : ''}` : ''}. AI identification can be
        wrong -- check any recycling symbol printed on the item itself, and confirm what your local
        service accepts.
      </p>
    </Card>
  );
}

export function SafetyPill({ level }: { level: WasteAnalysis['safetyLevel'] }) {
  if (level === 'hazardous') {
    return (
      <Badge tone="danger" className="shrink-0">
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Hazardous -- specialist handling
      </Badge>
    );
  }
  if (level === 'caution') {
    return (
      <Badge tone="amber" className="shrink-0">
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Handle with care
      </Badge>
    );
  }
  return (
    <Badge tone="mint" className="shrink-0">
      <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
      Everyday item
    </Badge>
  );
}

export function HazardBanner({ analysis }: { analysis: WasteAnalysis }) {
  if (analysis.safetyLevel !== 'hazardous' && analysis.hazardWarnings.length === 0) return null;
  const tone = analysis.safetyLevel === 'hazardous' ? 'danger' : 'warning';
  return (
    <Alert tone={tone} title={analysis.safetyLevel === 'hazardous' ? 'Safety warning' : 'Take care'}>
      {analysis.hazardWarnings.length > 0 ? (
        <BulletList items={analysis.hazardWarnings} tone={tone === 'danger' ? 'danger' : 'amber'} />
      ) : (
        <p>Handle this item carefully and follow the precautions below.</p>
      )}
      {analysis.safetyLevel === 'hazardous' && (
        <p className="mt-2.5 font-semibold">
          Do not take this apart, cut it, heat it or reuse it at home. Hand it to a qualified
          collection point or professional handler.
        </p>
      )}
    </Alert>
  );
}

/* ------------------------------------------------------- pros &amp; cons */

export function ProsConsSection({ analysis }: { analysis: WasteAnalysis }) {
  return (
    <section aria-labelledby="pros-cons-heading" className="space-y-5">
      <div>
        <p className="eyebrow">The honest picture</p>
        <h2 id="pros-cons-heading" className="mt-2 text-xl sm:text-2xl">
          Advantages and disadvantages
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-eco-100 bg-eco-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-eco-600 text-white">
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="text-lg">Advantages</h3>
          </div>
          <BulletList items={analysis.advantages} className="mt-5" />
        </Card>

        <Card className="border-amber/40 bg-amber-soft/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-deep text-white">
              <MinusCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="text-lg">Disadvantages &amp; risks</h3>
          </div>
          <BulletList items={analysis.disadvantages} tone="amber" className="mt-5" />
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ nature impact */

const IMPACT_ROWS = [
  {
    key: 'improperDisposal' as const,
    label: 'If littered or dumped',
    icon: Trash2,
    tone: 'border-red-200 bg-red-50/60',
  },
  {
    key: 'landfill' as const,
    label: 'If sent to landfill',
    icon: Factory,
    tone: 'border-amber/40 bg-amber-soft/50',
  },
  {
    key: 'recycling' as const,
    label: 'If recycled properly',
    icon: Recycle,
    tone: 'border-eco-100 bg-eco-50/60',
  },
  {
    key: 'reuse' as const,
    label: 'If reused or repaired',
    icon: Leaf,
    tone: 'border-eco-100 bg-mint/50',
  },
];

export function ImpactSection({ analysis }: { analysis: WasteAnalysis }) {
  const impact = analysis.environmentalImpact;
  return (
    <section aria-labelledby="impact-heading" className="space-y-5">
      <div>
        <p className="eyebrow">Impact on nature</p>
        <h2 id="impact-heading" className="mt-2 text-xl sm:text-2xl">
          What happens next matters more than the object
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {IMPACT_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.key} className={cn('rounded-3xl border p-5', row.tone)}>
              <div className="flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-forest" aria-hidden="true" />
                <h3 className="text-base">{row.label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/85">{impact[row.key]}</p>
            </div>
          );
        })}
      </div>

      {impact.wildlifeRisks.length > 0 && (
        <Card>
          <div className="flex items-center gap-2.5">
            <PawPrint className="h-5 w-5 text-eco-600" aria-hidden="true" />
            <h3 className="text-base">Risks to wildlife</h3>
          </div>
          <BulletList items={impact.wildlifeRisks} className="mt-4" />
        </Card>
      )}

      <Alert tone="info">
        <p>
          These explanations are qualitative on purpose. This app does not publish numeric CO2,
          water, energy or decomposition-time figures, because reliable values depend on the exact
          material, local infrastructure and transport -- and inventing them would be worse than
          leaving them out.
        </p>
      </Alert>
    </section>
  );
}

/* --------------------------------------------------- recommended action */

export function RecommendedActionCard({ analysis }: { analysis: WasteAnalysis }) {
  const action = analysis.recommendedAction;
  return (
    <Card className="border-eco/30 bg-forest text-white">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">
        Best environmental action
      </p>
      <h2 className="mt-3 flex flex-wrap items-center gap-3 text-2xl text-white">
        {ACTION_LABELS[action.type]}
        <ArrowRight className="h-5 w-5 text-amber" aria-hidden="true" />
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-mint/90">{action.explanation}</p>

      {action.precautions.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-mint">Precautions</p>
          <ul className="mt-2.5 space-y-2">
            {action.precautions.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-white/90">
                <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------ recycling guide */

export function RecyclingGuidanceCard({ analysis }: { analysis: WasteAnalysis }) {
  const guidance = analysis.recyclingGuidance;
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-eco-700">
          <Recycle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg">General recycling guidance</h2>
      </div>

      <ol className="mt-5 space-y-3">
        {guidance.generalSteps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink/90">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eco-50 text-xs font-bold text-eco-700">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <Alert tone="warning" title="Local rules vary" className="mt-6">
        <p>{guidance.localRulesWarning}</p>
      </Alert>
    </Card>
  );
}

export function NoIdeasNotice({ notice }: { notice: string }) {
  return (
    <Alert tone="warning" title="No DIY projects for this item">
      <p>{notice}</p>
      <p className="mt-2 flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          When fewer than three safe, genuinely useful ideas exist, the app shows fewer rather than
          padding the list.
        </span>
      </p>
    </Alert>
  );
}
