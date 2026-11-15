import type { ActionType, SafetyLevel, WasteAnalysis } from '@/types/analysis';

/**
 * Browser-local persistence for scans and eco actions.
 *
 * Everything lives in this browser's localStorage: there are no accounts and no
 * sync between devices. Uploaded photographs are never written to storage -- only
 * small text metadata plus the AI analysis, and the list is capped so storage
 * cannot grow without bound.
 */

const STORAGE_KEY = 'recyclevision.records.v1';
export const MAX_RECORDS = 40;
export const RECORDS_CHANGED_EVENT = 'recyclevision:records-changed';

export const ECO_ACTIONS = [
  'none',
  'planning',
  'reused',
  'repaired',
  'donated',
  'recycled',
  'specialized',
] as const;
export type EcoAction = (typeof ECO_ACTIONS)[number];

/** Actions that represent something the user says they actually finished. */
export const COMPLETED_ACTIONS: EcoAction[] = [
  'reused',
  'repaired',
  'donated',
  'recycled',
  'specialized',
];

export const ECO_ACTION_LABELS: Record<EcoAction, string> = {
  none: 'No action yet',
  planning: 'Planning to reuse',
  reused: 'Reused',
  repaired: 'Repaired',
  donated: 'Donated',
  recycled: 'Recycled',
  specialized: 'Taken to specialized collection',
};

export interface ScanRecord {
  id: string;
  itemName: string;
  category: string;
  materials: string[];
  safetyLevel: SafetyLevel;
  recommendedAction: ActionType;
  hadImage: boolean;
  scannedAt: string;
  action: EcoAction;
  selectedIdeaId: string | null;
  selectedIdeaTitle: string | null;
  completedAt: string | null;
  note: string;
  analysis: WasteAnalysis;
  provider: string;
  model: string;
}

export function isCompleted(record: ScanRecord): boolean {
  return COMPLETED_ACTIONS.includes(record.action) && Boolean(record.completedAt);
}

function announce() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT));
}

function safeParse(raw: string | null): ScanRecord[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ScanRecord =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as ScanRecord).id === 'string' &&
        typeof (item as ScanRecord).itemName === 'string' &&
        !!(item as ScanRecord).analysis,
    );
  } catch {
    return [];
  }
}

export function loadRecords(): ScanRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function persist(records: ScanRecord[]): boolean {
  if (typeof window === 'undefined') return false;
  const capped = records.slice(0, MAX_RECORDS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    announce();
    return true;
  } catch {
    // Most likely a storage quota error -- drop the oldest half and retry once.
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(capped.slice(0, Math.ceil(capped.length / 2))),
      );
      announce();
      return true;
    } catch {
      return false;
    }
  }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SaveScanInput {
  analysis: WasteAnalysis;
  hadImage: boolean;
  provider: string;
  model: string;
}

export function saveScan({ analysis, hadImage, provider, model }: SaveScanInput): ScanRecord {
  const record: ScanRecord = {
    id: createId(),
    itemName: analysis.itemName,
    category: analysis.category,
    materials: analysis.materials,
    safetyLevel: analysis.safetyLevel,
    recommendedAction: analysis.recommendedAction.type,
    hadImage,
    scannedAt: new Date().toISOString(),
    action: 'none',
    selectedIdeaId: null,
    selectedIdeaTitle: null,
    completedAt: null,
    note: '',
    analysis,
    provider,
    model,
  };
  persist([record, ...loadRecords()]);
  return record;
}

export function getRecord(id: string): ScanRecord | undefined {
  return loadRecords().find((record) => record.id === id);
}

export function updateRecord(id: string, patch: Partial<ScanRecord>): ScanRecord | undefined {
  const records = loadRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return undefined;

  const next: ScanRecord = { ...records[index], ...patch };

  // Keep completion bookkeeping honest: a planned action is never "completed".
  if (patch.action !== undefined) {
    if (COMPLETED_ACTIONS.includes(next.action)) {
      next.completedAt = records[index].completedAt ?? new Date().toISOString();
    } else {
      next.completedAt = null;
    }
  }

  records[index] = next;
  persist(records);
  return next;
}

export function deleteRecord(id: string): void {
  persist(loadRecords().filter((record) => record.id !== id));
}

export function clearAllRecords(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  announce();
}

/** Rough footprint of what we keep locally, for the privacy/storage notice. */
export function storageFootprintKb(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? '';
    return Math.round((raw.length / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}
