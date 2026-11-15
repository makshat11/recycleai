import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Filter,
  ImageIcon,
  Search,
  Trash2,
  Type,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ActionPicker } from '@/components/analysis/ActionPicker';
import { useToast } from '@/components/ui/ToastProvider';
import { useRecords } from '@/hooks/useRecords';
import {
  ECO_ACTIONS,
  ECO_ACTION_LABELS,
  isCompleted,
  storageFootprintKb,
  type EcoAction,
} from '@/lib/storage';
import { formatDate, formatRelative } from '@/lib/utils';

type StatusFilter = 'all' | 'completed' | 'pending' | EcoAction;

export function EcoActions() {
  const { records, setAction, remove, clearAll } = useRecords();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [material, setMaterial] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const categories = useMemo(
    () => [...new Set(records.map((record) => record.category).filter(Boolean))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (material !== 'all' && record.category !== material) return false;

      if (status === 'completed' && !isCompleted(record)) return false;
      if (status === 'pending' && isCompleted(record)) return false;
      if (status !== 'all' && status !== 'completed' && status !== 'pending' && record.action !== status) {
        return false;
      }

      if (!needle) return true;
      const haystack = [
        record.itemName,
        record.category,
        record.selectedIdeaTitle ?? '',
        record.note,
        ...record.materials,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [material, query, records, status]);

  const deleteTarget = records.find((record) => record.id === pendingDelete);

  if (records.length === 0) {
    return (
      <div className="container-page py-14 lg:py-20">
        <SectionHeading
          eyebrow="My eco actions"
          title="Your history lives here"
          description="Every item you analyse is saved in this browser so you can come back, record what you did, and open the AI results again."
        />
        <div className="mt-10">
          <EmptyState
            icon={<ClipboardList className="h-7 w-7" aria-hidden="true" />}
            title="No items yet"
            description="Analyse your first item and it will appear here, ready for you to record whether you reused, repaired, donated or recycled it."
            action={<ButtonLink to="/scan">Analyse your first item</ButtonLink>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <SectionHeading
        eyebrow="My eco actions"
        title={`${records.length} item${records.length === 1 ? '' : 's'} in your local history`}
        description="Update an action whenever your plans change, re-open any previous AI analysis, or remove records you no longer need."
      />

      {/* ------------------------------------------------------------- filters */}
      <div className="mt-9 grid gap-3 rounded-3xl border border-eco-100 bg-white p-4 shadow-soft lg:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <label htmlFor="history-search" className="sr-only">
            Search your history
          </label>
          <input
            id="history-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items, materials or notes"
            className="w-full rounded-2xl border border-eco-100 bg-cream py-3 pl-11 pr-4 text-sm transition focus:border-eco focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco/30"
          />
        </div>

        <div>
          <label htmlFor="filter-material" className="sr-only">
            Filter by material category
          </label>
          <select
            id="filter-material"
            value={material}
            onChange={(event) => setMaterial(event.target.value)}
            className="w-full rounded-2xl border border-eco-100 bg-cream px-4 py-3 text-sm font-medium transition focus:border-eco focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco/30"
          >
            <option value="all">All materials</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-status" className="sr-only">
            Filter by action status
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="w-full rounded-2xl border border-eco-100 bg-cream px-4 py-3 text-sm font-medium transition focus:border-eco focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco/30"
          >
            <option value="all">Any status</option>
            <option value="completed">Completed actions</option>
            <option value="pending">Not completed yet</option>
            {ECO_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {ECO_ACTION_LABELS[action]}
              </option>
            ))}
          </select>
        </div>

        <Button variant="secondary" onClick={() => setConfirmClear(true)} className="justify-center">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear all
        </Button>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-muted">
        <Filter className="h-3.5 w-3.5" aria-hidden="true" />
        Showing {filtered.length} of {records.length} records &middot; about {storageFootprintKb()} KB
        stored in this browser
      </p>

      {/* -------------------------------------------------------------- list */}
      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Search className="h-7 w-7" aria-hidden="true" />}
            title="Nothing matches those filters"
            description="Try a different search term, material or status."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setMaterial('all');
                  setStatus('all');
                }}
              >
                Reset filters
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {filtered.map((record) => {
            const completed = isCompleted(record);
            return (
              <Card as="li" key={record.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg">{record.itemName}</h2>
                      {completed ? (
                        <Badge tone="eco">{ECO_ACTION_LABELS[record.action]}</Badge>
                      ) : (
                        <Badge tone={record.action === 'planning' ? 'amber' : 'neutral'}>
                          {ECO_ACTION_LABELS[record.action]}
                        </Badge>
                      )}
                      <Badge tone="neutral">
                        {record.hadImage ? (
                          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Type className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {record.hadImage ? 'Photo' : 'Text'}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-muted">
                      {record.category}
                      {record.materials.length > 0 && ` - ${record.materials.join(', ')}`}
                    </p>

                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        <dt className="sr-only">Scanned</dt>
                        <dd>Scanned {formatRelative(record.scannedAt)}</dd>
                      </div>
                      {record.completedAt && (
                        <div>
                          <dt className="sr-only">Completed</dt>
                          <dd>Completed {formatDate(record.completedAt)}</dd>
                        </div>
                      )}
                      {record.selectedIdeaTitle && (
                        <div>
                          <dt className="sr-only">Chosen project</dt>
                          <dd>Project: {record.selectedIdeaTitle}</dd>
                        </div>
                      )}
                    </dl>

                    {record.note && (
                      <p className="mt-3 rounded-2xl bg-cream px-4 py-2.5 text-sm italic text-muted">
                        &ldquo;{record.note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                      to={`/results/${record.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-eco-100 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-eco/40 hover:bg-eco-50"
                    >
                      Open AI results
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(record.id)}
                      aria-label={`Delete the record for ${record.itemName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-5 border-t border-eco-100 pt-5">
                  <ActionPicker
                    compact
                    value={record.action}
                    idPrefix={`history-${record.id}`}
                    onChange={(action) => {
                      setAction(record.id, action);
                      toast('Action updated.');
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      <Alert tone="info" className="mt-10">
        <p>
          Everything on this page is self-reported by you and stored only in this browser. The app
          does not verify completed activities, and a planned project is never counted as finished.
        </p>
      </Alert>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        destructive
        title="Delete this record?"
        message={`"${deleteTarget?.itemName ?? ''}" and its saved AI analysis will be removed from this browser. This cannot be undone.`}
        confirmLabel="Delete record"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            remove(pendingDelete);
            toast('Record deleted.');
          }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        destructive
        title="Clear all locally saved data?"
        message={`This permanently removes all ${records.length} records, their AI analyses and your dashboard history from this browser. This cannot be undone.`}
        confirmLabel="Clear everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          setConfirmClear(false);
          toast('All local data cleared.', 'info');
        }}
      />
    </div>
  );
}
