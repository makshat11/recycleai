import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, FileSearch, ScanLine, StickyNote } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, Card, EmptyState } from '@/components/ui/primitives';
import {
  HazardBanner,
  IdentityPanel,
  ImpactSection,
  NoIdeasNotice,
  ProsConsSection,
  RecommendedActionCard,
  RecyclingGuidanceCard,
} from '@/components/analysis/AnalysisSections';
import { ReuseIdeasSection } from '@/components/analysis/ReuseIdeas';
import { ActionPicker } from '@/components/analysis/ActionPicker';
import { useToast } from '@/components/ui/ToastProvider';
import { RECORDS_CHANGED_EVENT, getRecord, updateRecord, type EcoAction, type ScanRecord } from '@/lib/storage';
import { formatDateTime } from '@/lib/utils';
import type { ReuseIdea } from '@/types/analysis';

export function Results() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [record, setRecord] = useState<ScanRecord | null | undefined>(undefined);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    if (!id) {
      setRecord(null);
      return;
    }
    const found = getRecord(id);
    setRecord(found ?? null);
    if (found) setNote(found.note);
  }, [id]);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener(RECORDS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(RECORDS_CHANGED_EVENT, onChange);
  }, [load]);

  const selectIdea = useCallback(
    (idea: ReuseIdea) => {
      if (!record) return;
      const next = updateRecord(record.id, {
        selectedIdeaId: idea.id,
        selectedIdeaTitle: idea.title,
        action: record.action === 'none' ? 'planning' : record.action,
      });
      if (next) {
        setRecord(next);
        toast(`"${idea.title}" saved to your eco actions.`);
      }
    },
    [record, toast],
  );

  const changeAction = useCallback(
    (action: EcoAction) => {
      if (!record) return;
      const next = updateRecord(record.id, { action });
      if (next) {
        setRecord(next);
        toast(
          next.completedAt
            ? 'Marked as completed. Your dashboard has been updated.'
            : 'Action updated.',
        );
      }
    },
    [record, toast],
  );

  const saveNote = useCallback(() => {
    if (!record) return;
    const next = updateRecord(record.id, { note: note.slice(0, 400) });
    if (next) {
      setRecord(next);
      toast('Note saved.');
    }
  }, [note, record, toast]);

  if (record === undefined) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md text-center text-sm text-muted">Loading your analysis...</div>
      </div>
    );
  }

  if (record === null) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<FileSearch className="h-7 w-7" aria-hidden="true" />}
          title="That analysis is not in this browser"
          description="Results are stored locally, so a link from another device or a cleared browser will not find it. Run a new scan to get a fresh analysis."
          action={
            <ButtonLink to="/scan">
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Scan an item
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const { analysis } = record;

  return (
    <div className="container-page space-y-10 py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/scan"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-forest"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Scan another item
        </Link>
        <p className="text-xs text-muted">Analysed {formatDateTime(record.scannedAt)}</p>
      </div>

      <HazardBanner analysis={analysis} />

      <IdentityPanel
        analysis={analysis}
        hadImage={record.hadImage}
        provider={record.provider}
        model={record.model}
      />

      <RecommendedActionCard analysis={analysis} />

      <ProsConsSection analysis={analysis} />

      <ImpactSection analysis={analysis} />

      {analysis.reuseIdeas.length > 0 ? (
        <ReuseIdeasSection
          ideas={analysis.reuseIdeas}
          selectedIdeaId={record.selectedIdeaId}
          onSelect={selectIdea}
        />
      ) : (
        <NoIdeasNotice
          notice={
            analysis.reuseIdeasNotice ??
            'No safe do-it-yourself reuse ideas are offered for this item.'
          }
        />
      )}

      <RecyclingGuidanceCard analysis={analysis} />

      {/* ------------------------------------------------ record your action */}
      <section aria-labelledby="track-heading" className="space-y-5">
        <div>
          <p className="eyebrow">Eco action tracker</p>
          <h2 id="track-heading" className="mt-2 text-xl sm:text-2xl">
            Record what you decided to do
          </h2>
        </div>

        <Card>
          <ActionPicker value={record.action} onChange={changeAction} idPrefix={`result-${record.id}`} />

          {record.selectedIdeaTitle && (
            <p className="mt-5 rounded-2xl bg-mint/60 px-4 py-3 text-sm text-forest">
              Chosen project: <strong className="font-bold">{record.selectedIdeaTitle}</strong>
            </p>
          )}

          <div className="mt-6 border-t border-eco-100 pt-6">
            <label htmlFor="record-note" className="flex items-center gap-2 text-sm font-bold text-forest">
              <StickyNote className="h-4 w-4" aria-hidden="true" />
              Your note (optional)
            </label>
            <textarea
              id="record-note"
              value={note}
              maxLength={400}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Took it to the collection point near the market on Saturday."
              className="mt-2.5 w-full rounded-2xl border border-eco-100 bg-cream px-4 py-3 text-sm text-ink transition placeholder:text-muted/70 focus:border-eco focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco/30"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">{note.length}/400</span>
              <Button size="sm" variant="secondary" onClick={saveNote} disabled={note === record.note}>
                Save note
              </Button>
            </div>
          </div>
        </Card>

        <Alert tone="info">
          <p>
            This analysis and your recorded action are saved in this browser only. Clearing your
            browser data removes them, and they do not sync to other devices.
          </p>
        </Alert>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/actions" variant="secondary">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            See all my eco actions
          </ButtonLink>
          <ButtonLink to="/scan">
            <ScanLine className="h-4 w-4" aria-hidden="true" />
            Analyse another item
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
