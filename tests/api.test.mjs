// Drives the real /api/analyze handler against a mock OpenAI-compatible provider.
import http from 'node:http';
import handler from './.build/analyze.bundle.mjs';

const GOOD = {
  itemName: 'Plastic Water Bottle',
  description: 'A single-use drinks bottle, most likely made from a clear PET-type plastic.',
  materials: ['Likely PET plastic', 'Polypropylene cap'],
  category: 'Plastic Packaging',
  identificationNotes: ['Resin type cannot be confirmed visually; check the symbol on the base.'],
  possibleActions: ['reuse', 'recycle', 'reduce'],
  safetyLevel: 'caution',
  hazardWarnings: [],
  advantages: ['Lightweight', 'Durable for its intended use', 'Easy to transport', 'Often accepted by recycling programmes'],
  disadvantages: ['Can contribute to plastic pollution', 'May fragment into microplastics', 'Acceptance for recycling varies'],
  environmentalImpact: {
    improperDisposal: 'Littered bottles can travel into drains and waterways.',
    landfill: 'In landfill the material occupies space for a long time.',
    recycling: 'Where accepted, recycling can reduce demand for new plastic.',
    reuse: 'Keeping it in use avoids producing another item for a while.',
    wildlifeRisks: ['Animals can become trapped in or ingest fragments.'],
  },
  recommendedAction: {
    type: 'recycle',
    explanation: 'If your local service accepts this plastic, rinsing and recycling is usually the best option.',
    precautions: ['Rinse before recycling', 'Check the symbol on the item'],
  },
  recyclingGuidance: {
    generalSteps: ['Empty and rinse the bottle', 'Remove the cap if your service asks for it', 'Place in the correct bin'],
    localRulesWarning: 'Acceptance rules differ by location. Check with your local waste authority.',
  },
  reuseIdeas: [
    {
      id: 'idea-1',
      title: 'Mini Plant Pot',
      description: 'Turn the lower half of the bottle into a small pot for a seedling.',
      difficulty: 'easy',
      estimatedTime: '20 minutes',
      materialsNeeded: ['Clean bottle', 'Soil', 'Small plant'],
      instructions: ['Clean and dry the bottle.', 'Ask an adult to cut it safely.', 'Add drainage holes, then soil and the plant.'],
      safetyNotes: ['Cut edges are sharp -- adult supervision required.'],
      environmentalBenefit: 'Keeps the bottle in use instead of discarding it immediately.',
    },
  ],
  reuseIdeasNotice: null,
  uncertaintyNotice: 'The exact plastic type cannot be confirmed from a photo alone.',
};

const VISION = {
  isPhysicalObject: true,
  objectName: 'plastic water bottle',
  likelyMaterials: ['likely clear PET-type plastic'],
  visibleCondition: 'intact and empty',
  otherObjects: [],
  notes: ['resin code not legible'],
};

let mode = 'good';
let visionMode = 'good';
let lastVisionHadImage = null;
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
    };
    const reply = (content) => send(200, { choices: [{ message: { content } }] });

    // Stage 1: vision identification.
    let isVision = false;
    try {
      const parsed = JSON.parse(body);
      const system = parsed.messages?.[0]?.content ?? '';
      isVision = typeof system === 'string' && system.includes('You identify everyday objects');
      if (isVision) {
        const user = parsed.messages?.[1]?.content;
        lastVisionHadImage = Array.isArray(user) && user.some((p) => p.type === 'image_url');
      }
    } catch { /* fall through */ }

    if (isVision) {
      if (visionMode === 'not-an-object') {
        return reply(JSON.stringify({ ...VISION, isPhysicalObject: false }));
      }
      if (visionMode === '500') return send(500, { error: 'vision down' });
      return reply(JSON.stringify(VISION));
    }

    if (mode === 'good') return reply(JSON.stringify(GOOD));
    if (mode === 'fenced') return reply('Sure! Here you go:\n```json\n' + JSON.stringify(GOOD) + '\n```');
    if (mode === 'hazard') {
      return reply(
        JSON.stringify({
          ...GOOD,
          itemName: 'Damaged lithium-ion battery',
          category: 'Battery / e-waste',
          safetyLevel: 'hazardous',
          hazardWarnings: ['A damaged cell can overheat, vent toxic gas or catch fire.'],
          recommendedAction: { type: 'reuse', explanation: 'x'.repeat(30), precautions: ['Do not puncture'] },
        }),
      );
    }
    if (mode === 'echo-prompt') {
      // Proves the stage-2 prompt actually contains the stage-1 finding.
      const parsed = JSON.parse(body);
      const user = parsed.messages?.[1]?.content ?? '';
      const text = typeof user === 'string' ? user : JSON.stringify(user);
      const match = text.match(/Object seen: (.+)/);
      return reply(JSON.stringify({ ...GOOD, itemName: match ? `SAW: ${match[1].trim()}` : 'NO FINDING' }));
    }
    if (mode === 'garbage') return reply('I am afraid I cannot help with that request.');
    if (mode === 'short') return reply(JSON.stringify({ ...GOOD, advantages: ['only one'] }));
    if (mode === '503') {
      return send(503, { error: { message: 'content safety screening is temporarily unavailable' } });
    }
    if (mode === '401') return send(401, { error: 'invalid api key' });
    if (mode === '429') return send(429, { error: 'rate limit' });
    if (mode === '500') return send(500, { error: 'boom' });
    return send(500, { error: 'unknown mode' });
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

process.env.GROQ_API_KEY = 'test-key';
process.env.GROQ_BASE_URL = `http://127.0.0.1:${port}/v1`;
process.env.GROQ_MODEL = 'mock-text-model';
// The mock stands in for both stages, so give it a vision model too. In real
// deployments Groq has no vision model and photos route to NVIDIA NIM.
process.env.GROQ_VISION_MODEL = 'mock-vision-model';
process.env.AI_PROVIDER_ORDER = 'groq';
delete process.env.NVIDIA_NIM_API_KEY;

let ip = 0;
function post(body, headers = {}) {
  ip += 1;
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.0.0.${ip}`, ...headers },
    body: JSON.stringify(body),
  });
}

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try {
    await fn();
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

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

console.log('\n--- request validation ---');

await check('GET is rejected with 405', async () => {
  const res = await handler(new Request('http://localhost/api/analyze', { method: 'GET' }));
  expect(res.status === 405, `expected 405, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'method_not_allowed', `got ${body.error.code}`);
});

await check('non-JSON content type is rejected with 415', async () => {
  const res = await handler(
    new Request('http://localhost/api/analyze', { method: 'POST', body: 'hi', headers: { 'Content-Type': 'text/plain' } }),
  );
  expect(res.status === 415, `expected 415, got ${res.status}`);
});

await check('empty input is rejected with 400', async () => {
  const res = await handler(post({}));
  expect(res.status === 400, `expected 400, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'bad_request', `got ${body.error.code}`);
});

await check('one-character item name is rejected', async () => {
  const res = await handler(post({ itemName: 'x' }));
  expect(res.status === 400, `expected 400, got ${res.status}`);
});

await check('unsupported image type is rejected with 415', async () => {
  const res = await handler(post({ imageDataUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' }));
  expect(res.status === 415, `expected 415, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'unsupported_media', `got ${body.error.code}`);
});

await check('malformed data URL is rejected', async () => {
  const res = await handler(post({ imageDataUrl: 'not-a-data-url' }));
  expect(res.status === 400, `expected 400, got ${res.status}`);
});

await check('oversized image is rejected with 413', async () => {
  const res = await handler(post({ imageDataUrl: `data:image/jpeg;base64,${'A'.repeat(4_200_000)}` }));
  expect(res.status === 413, `expected 413, got ${res.status}`);
});

await check('missing API keys report not_configured', async () => {
  const saved = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  const res = await handler(post({ itemName: 'Glass jar' }));
  process.env.GROQ_API_KEY = saved;
  expect(res.status === 503, `expected 503, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'not_configured', `got ${body.error.code}`);
  expect(!JSON.stringify(body).includes('test-key'), 'error body leaked the API key');
});

console.log('\n--- successful analysis ---');

await check('text-only analysis returns validated analysis', async () => {
  mode = 'good';
  const res = await handler(post({ itemName: 'Plastic water bottle' }));
  expect(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  expect(body.ok === true, 'expected ok:true');
  expect(body.analysis.itemName === 'Plastic Water Bottle', 'wrong item name');
  expect(body.analysis.advantages.length >= 3, 'advantages missing');
  expect(body.analysis.disadvantages.length >= 3, 'disadvantages missing');
  expect(body.analysis.environmentalImpact.landfill.length > 0, 'landfill impact missing');
  expect(body.analysis.recyclingGuidance.generalSteps.length > 0, 'recycling steps missing');
  expect(body.analysis.reuseIdeas.length === 1, 'reuse idea missing');
  expect(body.analysis.reuseIdeas[0].difficulty === 'Easy', 'difficulty was not normalised');
  expect(body.meta.inputMode === 'text', `inputMode was ${body.meta.inputMode}`);
  expect(body.meta.provider === 'groq', 'provider not reported');
});

await check('fenced / chatty JSON is still parsed', async () => {
  mode = 'fenced';
  const res = await handler(post({ itemName: 'Cardboard box' }));
  expect(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  expect(body.ok === true, 'expected ok:true');
});

await check('image reaches the vision stage as a real image part', async () => {
  mode = 'good';
  visionMode = 'good';
  lastVisionHadImage = null;
  const res = await handler(post({ imageDataUrl: tinyPng }));
  expect(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  expect(lastVisionHadImage === true, 'the vision stage did not receive an image_url part');
  expect(body.meta.inputMode === 'image', `inputMode was ${body.meta.inputMode}`);
  expect(body.meta.visionModel, 'the response did not report which vision model was used');
});

await check('the vision finding is passed into the analysis stage', async () => {
  mode = 'echo-prompt';
  visionMode = 'good';
  const res = await handler(post({ imageDataUrl: tinyPng }));
  expect(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  expect(
    body.analysis.itemName === 'SAW: plastic water bottle',
    `the analysis prompt did not carry the vision finding (got "${body.analysis.itemName}")`,
  );
});

await check('text + image is reported as text+image', async () => {
  mode = 'good';
  const res = await handler(post({ itemName: 'Cardboard box', imageDataUrl: tinyPng }));
  const body = await res.json();
  expect(body.meta.inputMode === 'text+image', `inputMode was ${body.meta.inputMode}`);
});

await check('a photo with no clear object is refused, not guessed at', async () => {
  mode = 'good';
  visionMode = 'not-an-object';
  const res = await handler(post({ imageDataUrl: tinyPng }));
  expect(res.status === 422, `expected 422, got ${res.status}`);
  const body = await res.json();
  expect(body.ok === false, 'expected ok:false');
  expect(!('analysis' in body), 'a refused photo still returned an analysis');
  visionMode = 'good';
});

await check('a failing vision stage does not fall through to a text-only guess', async () => {
  mode = 'good';
  visionMode = '500';
  const res = await handler(post({ itemName: 'Plastic bottle', imageDataUrl: tinyPng }));
  expect(res.status >= 400, `expected an error, got ${res.status}`);
  const body = await res.json();
  expect(body.ok === false, 'expected ok:false');
  visionMode = 'good';
});

console.log('\n--- safety backstop ---');

await check('hazardous item loses all DIY ideas and is routed to specialist disposal', async () => {
  mode = 'hazard';
  const res = await handler(post({ itemName: 'Damaged lithium-ion battery' }));
  expect(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  expect(body.analysis.safetyLevel === 'hazardous', 'safety level not hazardous');
  expect(body.analysis.reuseIdeas.length === 0, 'hazardous item still returned reuse ideas');
  expect(
    body.analysis.recommendedAction.type === 'specialized-disposal',
    `recommended action was ${body.analysis.recommendedAction.type}`,
  );
  expect(body.analysis.hazardWarnings.length > 0, 'no hazard warnings');
  expect(typeof body.analysis.reuseIdeasNotice === 'string', 'no explanation for missing ideas');
});

console.log('\n--- upstream failures ---');

await check('provider 401 is reported without leaking the key', async () => {
  mode = '401';
  const res = await handler(post({ itemName: 'Glass jar' }));
  expect(res.status === 502, `expected 502, got ${res.status}`);
  const body = await res.json();
  expect(body.ok === false, 'expected ok:false');
  expect(body.error.code === 'not_configured', `got ${body.error.code}`);
  expect(!JSON.stringify(body).includes('test-key'), 'error body leaked the API key');
  expect(!('analysis' in body), 'a failed request returned an analysis');
});

await check('provider 429 maps to a retryable rate_limited error', async () => {
  mode = '429';
  const res = await handler(post({ itemName: 'Glass jar' }));
  expect(res.status === 429, `expected 429, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'rate_limited' && body.error.retryable === true, JSON.stringify(body.error));
});

await check('upstream 503 is an upstream error, not a config error, and leaks nothing', async () => {
  mode = '503';
  const res = await handler(post({ itemName: 'Glass jar' }));
  const body = await res.json();
  expect(body.error.code === 'upstream_error', `got ${body.error.code} (503 must not look like misconfiguration)`);
  expect(body.error.retryable === true, 'an upstream 503 should be retryable');
  expect(
    !/content safety screening/i.test(JSON.stringify(body)),
    "the provider's own error text leaked to the client",
  );
});

await check('provider 500 maps to a retryable upstream_error', async () => {
  mode = '500';
  const res = await handler(post({ itemName: 'Glass jar' }));
  expect(res.status === 502, `expected 502, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'upstream_error' && body.error.retryable === true, JSON.stringify(body.error));
});

await check('non-JSON model reply yields invalid_model_output, never a fake analysis', async () => {
  mode = 'garbage';
  const res = await handler(post({ itemName: 'Glass jar' }));
  expect(res.status === 502, `expected 502, got ${res.status}`);
  const body = await res.json();
  expect(body.error.code === 'invalid_model_output', `got ${body.error.code}`);
  expect(!('analysis' in body), 'a failed request returned an analysis');
});

await check('schema-violating reply is rejected rather than shown', async () => {
  mode = 'short';
  const res = await handler(post({ itemName: 'Glass jar' }));
  expect(res.status === 502, `expected 502, got ${res.status}`);
  const body = await res.json();
  expect(body.ok === false, 'expected ok:false');
});

console.log('\n--- abuse protection ---');

await check('burst from one IP is throttled with Retry-After', async () => {
  mode = 'good';
  let limited = null;
  for (let i = 0; i < 16; i += 1) {
    const res = await handler(
      new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
        body: JSON.stringify({ itemName: 'Glass jar' }),
      }),
    );
    if (res.status === 429) {
      limited = res;
      break;
    }
  }
  expect(limited !== null, 'the limiter never kicked in');
  expect(limited.headers.get('retry-after') !== null, 'no Retry-After header');
  const body = await limited.json();
  expect(body.error.code === 'rate_limited', `got ${body.error.code}`);
});

console.log(`\n${pass} passed, ${fail} failed\n`);

// Close the mock server and let the loop drain; calling process.exit() here
// races libuv's handle teardown on Windows.
process.exitCode = fail === 0 ? 0 : 1;
await new Promise((resolve) => server.close(resolve));
