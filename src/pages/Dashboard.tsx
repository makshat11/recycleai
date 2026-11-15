import { useMemo } from 'react';
import {
  Gift,
  Hammer,
  Layers,
  PackageCheck,
  Recycle,
  Repeat2,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Alert, Card, EmptyState, SectionHeading } from '@/components/ui/primitives';
import { EmptyPlanetGlyph } from '@/components/ui/Illustrations';
import { ActionsBar, ActivityArea, CategoryDonut, ChartCard } from '@/components/dashboard/Charts';
import { useRecords } from '@/hooks/useRecords';
import {
  activitySeries,
  categoryBreakdown,
  completedByType,
  summarise,
} from '@/lib/stats';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: typeof ScanLine;
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight
          ? 'border-eco/30 bg-forest text-white'
          : 'transition hover:-translate-y-0.5 hover:shadow-lift'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={
            highlight
              ? 'flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-mint'
              : 'flex h-10 w-10 items-center justify-center rounded-2xl bg-mint text-eco-700'
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className={highlight ? 'text-3xl font-extrabold text-white' : 'text-3xl font-extrabold text-forest'}>
          {value}
        </span>
      </div>
      <p className={highlight ? 'mt-4 text-sm font-bold text-mint' : 'mt-4 text-sm font-bold text-forest'}>
        {label}
      </p>
      {hint && <p className={highlight ? 'mt-1 text-xs text-mint/80' : 'mt-1 text-xs text-muted'}>{hint}</p>}
    </Card>
  );
}

export function Dashboard() {
  const { records } = useRecords();

  const stats = useMemo(() => summarise(records), [records]);
  const categories = useMemo(() => categoryBreakdown(records), [records]);
  const actions = useMemo(() => completedByType(records), [records]);
  const activity = useMemo(() => activitySeries(records), [records]);

  const hasCompleted = actions.some((entry) => entry.value > 0);

  if (records.length === 0) {
    return (
      <div className="container-page py-14 lg:py-20">
        <SectionHeading
          eyebrow="Eco impact dashboard"
          title="Your dashboard is ready for its first item"
          description="This page is built entirely from activity you record yourself. Nothing is pre-filled, estimated or simulated."
        />
        <div className="mt-10">
          <EmptyState
            icon={<EmptyPlanetGlyph className="h-9 w-9" aria-hidden="true" />}
            title="No activity recorded yet"
            description="Analyse an item, pick what you did with it, and your charts will start filling in straight away."
            action={
              <ButtonLink to="/scan">
                <ScanLine className="h-4 w-4" aria-hidden="true" />
                Analyse your first item
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <SectionHeading
        eyebrow="Eco impact dashboard"
        title="What you have recorded so far"
        description="Live totals from your own locally stored history. They update the moment you change an action."
      />

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Layers}
          label="Total items analysed"
          value={stats.total}
          hint={`${stats.planning} currently planned`}
        />
        <StatCard
          icon={PackageCheck}
          label="Completed eco actions"
          value={stats.completed}
          hint="Self-reported by you"
          highlight
        />
        <StatCard icon={Repeat2} label="Items reused" value={stats.reused} />
        <StatCard icon={Hammer} label="Items repaired" value={stats.repaired} />
        <StatCard icon={Recycle} label="Items recycled" value={stats.recycled} />
        <StatCard
          icon={Gift}
          label="Items donated"
          value={stats.donated}
          hint={`${stats.specialized} taken to specialist collection`}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Material categories you have scanned"
          hint="Counted per analysed item, using the category the AI assigned."
          footer="Categories come from the AI's own classification and may group items differently from your local recycling scheme."
        >
          <CategoryDonut data={categories} />
        </ChartCard>

        <ChartCard
          title="Completed actions by type"
          hint="Only actions you marked as finished appear here."
        >
          {hasCompleted ? (
            <ActionsBar data={actions} />
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-eco-100 px-6 text-center">
              <p className="text-sm font-semibold text-forest">No completed actions yet</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
                Open any item in My Eco Actions and mark it reused, repaired, donated, recycled or
                taken to a specialist collection.
              </p>
            </div>
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard
            title="Activity over the last 14 days"
            hint="Items analysed against actions you completed, by date."
          >
            <ActivityArea data={activity} />
          </ChartCard>
        </div>
      </div>

      <Alert tone="info" className="mt-8" title="What this dashboard does and does not measure">
        <p>
          These charts count <strong>recorded actions</strong>, not verified environmental savings.
          The app deliberately shows no CO2, water or energy figures, because a credible estimate
          needs documented sources, assumptions, units and a calculation method for each specific
          material and local waste system -- and invented numbers would mislead rather than help.
        </p>
        <p className="mt-2 flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-eco-600" aria-hidden="true" />
          <span>
            All data here is self-reported and stored only in this browser. It is not synced, shared
            or independently checked.
          </span>
        </p>
      </Alert>
    </div>
  );
}
