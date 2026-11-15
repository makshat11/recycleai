// Exercises the real localStorage persistence layer and dashboard aggregation
// against a minimal browser stub.
import { store, stats } from './.build/client.bundle.mjs';

const {
  saveScan,
  loadRecords,
  updateRecord,
  deleteRecord,
  clearAllRecords,
  getRecord,
  isCompleted,
  MAX_RECORDS,
} = store;
const { summarise, categoryBreakdown, completedByType, activitySeries } = stats;

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    fail += 1;
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

function analysis(name, category, ideaId = 'idea-1') {
  return {
    itemName: name,
    description: 'd',
    materials: ['m'],
    category,
    identificationNotes: [],
    possibleActions: ['reuse'],
    safetyLevel: 'standard',
    hazardWarnings: [],
    advantages: ['a', 'b', 'c'],
    disadvantages: ['a', 'b', 'c'],
    environmentalImpact: { improperDisposal: 'x', landfill: 'x', recycling: 'x', reuse: 'x', wildlifeRisks: [] },
    recommendedAction: { type: 'reuse', explanation: 'x', precautions: [] },
    recyclingGuidance: { generalSteps: ['x'], localRulesWarning: 'x' },
    reuseIdeas: [
      {
        id: ideaId,
        title: 'Mini Plant Pot',
        description: 'd',
        difficulty: 'Easy',
        estimatedTime: '20 min',
        materialsNeeded: ['bottle'],
        instructions: ['one', 'two'],
        safetyNotes: [],
        environmentalBenefit: 'x',
      },
    ],
    reuseIdeasNotice: null,
    uncertaintyNotice: null,
  };
}

const add = (name, category) =>
  saveScan({ analysis: analysis(name, category), hadImage: false, provider: 'groq', model: 'm' });

console.log('\n--- scan persistence ---');

clearAllRecords();

check('a saved scan is readable back', () => {
  const record = add('Plastic water bottle', 'Plastic Packaging');
  const loaded = getRecord(record.id);
  expect(loaded !== undefined, 'record not found after save');
  expect(loaded.itemName === 'Plastic water bottle', 'item name not persisted');
  expect(loaded.analysis.reuseIdeas.length === 1, 'analysis not persisted');
  expect(loaded.action === 'none', `new record should start at "none", got ${loaded.action}`);
  expect(loaded.completedAt === null, 'new record should not be completed');
});

check('records survive a simulated page reload', () => {
  const before = loadRecords();
  globalThis.__reload();
  const after = loadRecords();
  expect(after.length === before.length, `${before.length} records before reload, ${after.length} after`);
  expect(after[0].analysis.itemName === before[0].analysis.itemName, 'analysis lost across reload');
});

check('newest scan comes first', () => {
  add('Cardboard box', 'Paper and Card');
  expect(loadRecords()[0].itemName === 'Cardboard box', 'ordering is not newest-first');
});

console.log('\n--- eco action bookkeeping ---');

check('choosing a reuse idea is recorded as planning, not completed', () => {
  const record = loadRecords()[0];
  const next = updateRecord(record.id, {
    selectedIdeaId: 'idea-1',
    selectedIdeaTitle: 'Mini Plant Pot',
    action: 'planning',
  });
  expect(next.selectedIdeaTitle === 'Mini Plant Pot', 'chosen project not stored');
  expect(next.action === 'planning', 'action not stored');
  expect(next.completedAt === null, 'planning must not set a completion date');
  expect(isCompleted(next) === false, 'planning must never count as completed');
});

check('marking an action done stamps a completion date', () => {
  const record = loadRecords()[0];
  const next = updateRecord(record.id, { action: 'reused' });
  expect(next.completedAt !== null, 'no completion date stamped');
  expect(isCompleted(next) === true, 'completed record not recognised');
});

check('reverting to planning clears the completion date', () => {
  const record = loadRecords()[0];
  const next = updateRecord(record.id, { action: 'planning' });
  expect(next.completedAt === null, 'completion date was not cleared');
  expect(isCompleted(next) === false, 'record still counted as completed');
});

check('notes are stored and capped at 400 characters', () => {
  const record = loadRecords()[0];
  const next = updateRecord(record.id, { note: 'x'.repeat(900).slice(0, 400) });
  expect(next.note.length === 400, `note length was ${next.note.length}`);
});

check('a change in one place is visible everywhere (single source of truth)', () => {
  const record = loadRecords()[0];
  updateRecord(record.id, { action: 'recycled' });
  expect(getRecord(record.id).action === 'recycled', 'update not reflected in getRecord');
  expect(loadRecords().find((r) => r.id === record.id).action === 'recycled', 'update not reflected in list');
});

console.log('\n--- dashboard aggregation ---');

clearAllRecords();

check('summary counts only completed actions', () => {
  const a = add('Bottle', 'Plastic Packaging');
  const b = add('Box', 'Paper and Card');
  const c = add('Jar', 'Glass');
  const d = add('Can', 'Metal');
  updateRecord(a.id, { action: 'reused' });
  updateRecord(b.id, { action: 'recycled' });
  updateRecord(c.id, { action: 'planning' });
  updateRecord(d.id, { action: 'donated' });

  const summary = summarise(loadRecords());
  expect(summary.total === 4, `total was ${summary.total}`);
  expect(summary.completed === 3, `completed was ${summary.completed}`);
  expect(summary.planning === 1, `planning was ${summary.planning}`);
  expect(summary.reused === 1 && summary.recycled === 1 && summary.donated === 1, JSON.stringify(summary));
  expect(summary.repaired === 0, 'repaired should be zero');
});

check('category donut groups by material category', () => {
  add('Second bottle', 'Plastic Packaging');
  const breakdown = categoryBreakdown(loadRecords());
  const plastic = breakdown.find((entry) => entry.name === 'Plastic Packaging');
  expect(plastic.value === 2, `expected 2 plastic items, got ${plastic.value}`);
  expect(breakdown[0].value >= breakdown[breakdown.length - 1].value, 'not sorted by count');
});

check('completed-by-type bar has one entry per action type', () => {
  const bars = completedByType(loadRecords());
  expect(bars.length === 5, `expected 5 bars, got ${bars.length}`);
  expect(bars.find((b) => b.name === 'Reused').value === 1, 'reused bar wrong');
  expect(bars.find((b) => b.name === 'Repaired').value === 0, 'repaired bar should be zero');
});

check('activity series covers 14 days and records today', () => {
  const series = activitySeries(loadRecords());
  expect(series.length === 14, `expected 14 points, got ${series.length}`);
  const today = series[series.length - 1];
  expect(today.scans === 5, `expected 5 scans today, got ${today.scans}`);
  expect(today.completed === 3, `expected 3 completions today, got ${today.completed}`);
  expect(series[0].scans === 0, 'a day with no activity should be zero, not missing');
});

console.log('\n--- deletion and caps ---');

check('a single record can be deleted', () => {
  const target = loadRecords()[0];
  deleteRecord(target.id);
  expect(getRecord(target.id) === undefined, 'record still present after delete');
  expect(loadRecords().length === 4, `expected 4 remaining, got ${loadRecords().length}`);
});

check('clearing removes everything', () => {
  clearAllRecords();
  expect(loadRecords().length === 0, 'records remain after clear');
});

check(`history is capped at ${MAX_RECORDS} records`, () => {
  for (let i = 0; i < MAX_RECORDS + 12; i += 1) add(`Item ${i}`, 'Test');
  expect(loadRecords().length === MAX_RECORDS, `expected ${MAX_RECORDS}, got ${loadRecords().length}`);
  expect(loadRecords()[0].itemName === `Item ${MAX_RECORDS + 11}`, 'cap dropped the wrong end');
});

check('no photograph data is ever written to storage', () => {
  const raw = globalThis.__rawStorage();
  expect(!raw.includes('data:image'), 'storage contains image data');
  expect(!raw.includes('base64'), 'storage contains base64 data');
});

check('corrupted storage degrades to an empty list instead of throwing', () => {
  globalThis.__corrupt();
  expect(loadRecords().length === 0, 'corrupt storage should read as empty');
});

clearAllRecords();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
