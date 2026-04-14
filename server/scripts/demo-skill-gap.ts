import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SkillGapResponse =
  | Record<string, unknown>
  | { error: string };

async function main(): Promise<void> {
  const jobPath = path.join(__dirname, '..', 'fixtures', 'job-junior-software-dev.txt');
  const cvPath = path.join(__dirname, '..', 'fixtures', 'cv-tawanda-moyo.txt');

  const [jobText, cvText] = await Promise.all([
    readFile(jobPath, 'utf8'),
    readFile(cvPath, 'utf8'),
  ]);

  const res = await fetch('http://localhost:3001/api/analyse/skill-gap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobText,
      cvText,
      options: { requiredWeight: 1, niceWeight: 0.5 },
      applicationId: 'demo-tawanda-moyo',
      jobId: 'demo-junior-software-dev',
    }),
  });

  const json = await res.json() as SkillGapResponse;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error('[demo-skill-gap] Failed:', msg);
  process.exitCode = 1;
});
