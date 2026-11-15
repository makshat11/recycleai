import { isCompleted, type EcoAction, type ScanRecord } from '@/lib/storage';
import { dayKey, shortDayLabel } from '@/lib/utils';

/** Dashboard aggregation, kept out of the component so it can be tested. */

export interface NameValue {
  name: string;
  value: number;
}

export interface ActivityPoint {
  label: string;
  scans: number;
  completed: number;
}

export interface Summary {
  total: number;
  reused: number;
  repaired: number;
  recycled: number;
  donated: number;
  specialized: number;
  completed: number;
  planning: number;
}

export const ACTIVITY_WINDOW_DAYS = 14;

export function summarise(records: ScanRecord[]): Summary {
  const completedRecords = records.filter(isCompleted);
  const count = (action: EcoAction) =>
    completedRecords.filter((record) => record.action === action).length;

  return {
    total: records.length,
    reused: count('reused'),
    repaired: count('repaired'),
    recycled: count('recycled'),
    donated: count('donated'),
    specialized: count('specialized'),
    completed: completedRecords.length,
    planning: records.filter((record) => record.action === 'planning').length,
  };
}

export function categoryBreakdown(records: ScanRecord[], limit = 8): NameValue[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.category?.trim() || 'Uncategorised';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

const COMPLETED_LABELS: Array<{ action: EcoAction; name: string }> = [
  { action: 'reused', name: 'Reused' },
  { action: 'repaired', name: 'Repaired' },
  { action: 'donated', name: 'Donated' },
  { action: 'recycled', name: 'Recycled' },
  { action: 'specialized', name: 'Specialist' },
];

export function completedByType(records: ScanRecord[]): NameValue[] {
  const completed = records.filter(isCompleted);
  return COMPLETED_LABELS.map(({ action, name }) => ({
    name,
    value: completed.filter((record) => record.action === action).length,
  }));
}

export function activitySeries(
  records: ScanRecord[],
  days = ACTIVITY_WINDOW_DAYS,
  now = new Date(),
): ActivityPoint[] {
  const scans = new Map<string, number>();
  const completed = new Map<string, number>();

  for (const record of records) {
    const key = dayKey(record.scannedAt);
    if (key) scans.set(key, (scans.get(key) ?? 0) + 1);
    if (isCompleted(record) && record.completedAt) {
      const done = dayKey(record.completedAt);
      if (done) completed.set(done, (completed.get(done) ?? 0) + 1);
    }
  }

  const points: ActivityPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const key = dayKey(date.toISOString());
    points.push({
      label: shortDayLabel(key),
      scans: scans.get(key) ?? 0,
      completed: completed.get(key) ?? 0,
    });
  }
  return points;
}
