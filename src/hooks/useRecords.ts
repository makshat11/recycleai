import { useCallback, useEffect, useState } from 'react';
import {
  RECORDS_CHANGED_EVENT,
  clearAllRecords,
  deleteRecord,
  loadRecords,
  updateRecord,
  type EcoAction,
  type ScanRecord,
} from '@/lib/storage';

/**
 * Subscribes the UI to locally stored records so history and the dashboard
 * update immediately after any change -- including changes made in another tab.
 */
export function useRecords() {
  const [records, setRecords] = useState<ScanRecord[]>(() => loadRecords());

  const refresh = useCallback(() => setRecords(loadRecords()), []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(RECORDS_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener(RECORDS_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [refresh]);

  const setAction = useCallback((id: string, action: EcoAction) => {
    updateRecord(id, { action });
  }, []);

  const setNote = useCallback((id: string, note: string) => {
    updateRecord(id, { note: note.slice(0, 400) });
  }, []);

  const remove = useCallback((id: string) => {
    deleteRecord(id);
  }, []);

  const clearAll = useCallback(() => {
    clearAllRecords();
  }, []);

  return { records, refresh, setAction, setNote, remove, clearAll };
}
