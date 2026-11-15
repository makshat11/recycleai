import http from 'node:http';
import handler from './.build/analyze.bundle.mjs';

const GOOD = {
  itemName: 'Cardboard Box', description: 'A corrugated cardboard shipping box.',
  materials: ['Corrugated cardboard'], category: 'Paper and Card', identificationNotes: [],
  possibleActions: ['reuse', 'recycle'], safetyLevel: 'standard', hazardWarnings: [],
  advantages: ['Lightweight', 'Widely recycled where collection exists', 'Reusable for storage'],
  disadvantages: ['Weakens when wet', 'Greasy or food-soiled card is often rejected', 'Bulky to store'],
  environmentalImpact: { improperDisposal: 'Litter degrades but still harms amenity and drains.', landfill: 'Occupies landfill space unnecessarily.', recycling: 'Card fibre can often re-enter paper production.', reuse: 'Reusing avoids needing another box.', wildlifeRisks: [] },
  recommendedAction: { type: 'reuse', explanation: 'Keep it for storage or moving before recycling it.', precautions: [] },
  recyclingGuidance: { generalSteps: ['Flatten the box', 'Remove tape and labels'], localRulesWarning: 'Check local acceptance rules.' },
  reuseIdeas: [], reuseIdeasNotice: null, uncertaintyNotice: null,
};

// Primary provider: always fails. Fallback provider: succeeds.
const broken = http.createServer((_, res) => { res.writeHead(503); res.end('{"error":"down"}'); });
const working = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(GOOD) } }] }));
});
await new Promise((r) => broken.listen(0, '127.0.0.1', r));
await new Promise((r) => working.listen(0, '127.0.0.1', r));

process.env.GROQ_API_KEY = 'groq-key';
process.env.GROQ_BASE_URL = `http://127.0.0.1:${broken.address().port}/v1`;
process.env.NVIDIA_NIM_API_KEY = 'nvidia-key';
process.env.NVIDIA_NIM_BASE_URL = `http://127.0.0.1:${working.address().port}/v1`;
process.env.NVIDIA_NIM_MODEL = 'minimaxai/minimax-m3.1-flash';
process.env.AI_PROVIDER_ORDER = 'groq,nvidia';

const res = await handler(new Request('http://localhost/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.7' },
  body: JSON.stringify({ itemName: 'Cardboard box' }),
}));
const body = await res.json();
const ok = res.status === 200 && body.ok === true && body.meta.provider === 'nvidia';
console.log(ok
  ? `  PASS  Groq failure falls back to NVIDIA NIM (provider=${body.meta.provider}, model=${body.meta.model})`
  : `  FAIL  ${res.status} ${JSON.stringify(body).slice(0, 300)}`);

// Close the mock servers and let the loop drain; calling process.exit() here
// races libuv's handle teardown on Windows.
process.exitCode = ok ? 0 : 1;
await Promise.all([
  new Promise((r) => broken.close(r)),
  new Promise((r) => working.close(r)),
]);
