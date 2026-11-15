#!/usr/bin/env node
/**
 * Dependency-free test runner.
 *
 * The source is TypeScript with `@/` path aliases, so each suite is bundled
 * with esbuild (already present as a Vite dependency) into tests/.build/ and
 * then executed in Node. No test framework is installed.
 *
 *   npm test
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const build = path.join(here, '.build');
const esbuild = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild');

rmSync(build, { recursive: true, force: true });
mkdirSync(build, { recursive: true });

function bundle(entry, outfile) {
  execFileSync(
    process.execPath,
    [
      esbuild,
      entry,
      '--bundle',
      '--platform=node',
      '--format=esm',
      '--target=node20',
      `--alias:@=${path.join(root, 'src')}`,
      `--outfile=${outfile}`,
      '--log-level=warning',
    ],
    { cwd: root, stdio: 'inherit' },
  );
}

console.log('Bundling sources for test...');
bundle(path.join(root, 'api', 'analyze.ts'), path.join(build, 'analyze.bundle.mjs'));
bundle(path.join(here, 'client-entry.ts'), path.join(build, 'client.bundle.mjs'));

const suites = [
  { name: 'API endpoint (/api/analyze)', file: 'api.test.mjs', stub: false },
  { name: 'Provider fallback (Groq -> NVIDIA NIM)', file: 'fallback.test.mjs', stub: false },
  { name: 'Local storage & dashboard stats', file: 'storage.test.mjs', stub: true },
];

let failed = 0;
for (const suite of suites) {
  console.log(`\n================ ${suite.name} ================`);
  const args = suite.stub
    ? ['--import', new URL('./dom-stub.mjs', import.meta.url).href, path.join(here, suite.file)]
    : [path.join(here, suite.file)];
  const result = spawnSync(process.execPath, args, { cwd: here, stdio: 'inherit' });
  if (result.status !== 0) failed += 1;
}

console.log(
  failed === 0
    ? '\nAll test suites passed.\n'
    : `\n${failed} test suite(s) failed.\n`,
);
process.exit(failed === 0 ? 0 : 1);
