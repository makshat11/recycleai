import {
  Brain,
  Database,
  Github,
  Lock,
  Server,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Alert, Card, SectionHeading } from '@/components/ui/primitives';
import { StepGlyph } from '@/components/ui/Illustrations';
import { GITHUB_REPO_URL } from '@/lib/constants';

const STEPS = [
  {
    step: 1 as const,
    title: 'You submit a photo or an item name',
    body: 'Photos are resized in your browser first, so the upload stays small and fast even on mobile data. Text-only analysis works too.',
  },
  {
    step: 2 as const,
    title: 'Our own server calls the AI provider',
    body: 'The request goes to /api/analyze, a serverless function on Vercel. It validates your input, then calls the AI providers. API keys stay on the server and never reach the browser.',
  },
  {
    step: 3 as const,
    title: 'A photo is read first, then reasoned about',
    body: 'When you send an image, a vision model identifies the object and its visible materials, and that finding is passed to a fast text model which writes the full analysis. Both stages must return JSON matching a strict schema: the server checks it with Zod, applies a safety backstop for hazardous items, and rejects anything malformed instead of guessing.',
  },
  {
    step: 4 as const,
    title: 'You record what you actually did',
    body: 'Your scan metadata, the analysis and your chosen action are saved in this browser so your history and dashboard persist across refreshes.',
  },
];

const STACK = [
  { icon: Sparkles, label: 'Frontend', value: 'React 18, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, Recharts' },
  { icon: Server, label: 'Backend', value: 'Vercel Functions (TypeScript), one POST /api/analyze endpoint' },
  { icon: Brain, label: 'AI', value: 'Two stages over OpenAI-compatible APIs: a vision model on NVIDIA NIM identifies photos, then Groq (with NVIDIA NIM as fallback) writes the analysis. Every reply is validated by Zod.' },
  { icon: Database, label: 'Storage', value: 'Browser localStorage only -- no accounts, no database, no server-side user data' },
];

export function About() {
  return (
    <div className="container-page space-y-16 py-12 lg:py-16">
      <section>
        <SectionHeading
          eyebrow="About the project"
          title="An AI second opinion before you throw something away"
          description="RecycleVision AI was built for the Rotary AI for Good Hackathon under the theme Create Lasting Impact. It focuses on environmental sustainability and community education: helping people understand an everyday object well enough to make a better decision about it."
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/scan">Try the scanner</ButtonLink>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-eco-100 bg-white px-5 py-2.5 text-[0.95rem] font-semibold text-forest shadow-soft transition hover:border-eco/40 hover:bg-eco-50"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            View the source
          </a>
        </div>
      </section>

      <section aria-labelledby="problem-heading" className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 id="problem-heading" className="text-xl">
            The problem
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Every day, reusable and recyclable household items are thrown away because people have
            no quick way to find out what they are made of, whether they can be repaired or donated,
            how improper disposal affects the environment, or what else the object could become.
            Guidance exists, but not at the moment of the decision -- standing at the bin.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl">The approach</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Point a camera at the object, or type its name. In seconds you get the likely materials,
            an honest list of advantages and disadvantages, what happens under four different
            disposal routes, the most responsible next step, and up to three safe second-life
            projects with real instructions. Then you record what you chose to do.
          </p>
        </Card>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl">
          How it works, end to end
        </h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {STEPS.map((item) => (
            <Card key={item.title} className="flex gap-4">
              <StepGlyph step={item.step} className="h-12 w-12 shrink-0" />
              <div>
                <h3 className="text-base">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="stack-heading">
        <h2 id="stack-heading" className="text-2xl">
          Technology
        </h2>
        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          {STACK.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint text-eco-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-sm font-bold text-forest">{item.label}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted">{item.value}</dd>
                </div>
              </Card>
            );
          })}
        </dl>
      </section>

      <section id="accuracy" aria-labelledby="accuracy-heading" className="space-y-5 scroll-mt-24">
        <h2 id="accuracy-heading" className="text-2xl">
          Accuracy and limits
        </h2>

        <Alert tone="warning" title="What this app will not tell you">
          <ul className="mt-1 space-y-2">
            {[
              'Exact CO2, water or energy savings -- these depend on the specific material, local infrastructure and transport, and we will not invent them.',
              'Decomposition timelines or recycling percentages presented as fact.',
              'Whether your local service accepts a material. Acceptance varies street by street; always check with your local authority.',
              'A numeric AI confidence score. Where the model is unsure, it says so in words instead.',
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Alert>

        <Alert tone="danger" title="Safety">
          <p>
            For damaged or swollen batteries, lithium-ion cells, chemical or solvent containers,
            pressurised canisters, medical or contaminated waste and similar hazards, the app
            deliberately returns <strong>no</strong> DIY reuse ideas. It points you to qualified
            collection or professional handling instead. Never cut, heat, puncture or dismantle
            these items.
          </p>
          <p className="mt-2 flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Reuse ideas are suggestions, not certified instructions. Supervise children, use
              appropriate tools, and do not reuse containers for food or drinking water unless they
              were made for that purpose and can be cleaned thoroughly.
            </span>
          </p>
        </Alert>

        <Card>
          <h3 className="text-base">AI can still be wrong</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Identification from a single photo is imperfect. Plastic resin types in particular cannot
            be determined visually -- check the recycling symbol moulded into the item. Treat every
            analysis as an informed starting point, not an authoritative ruling, and cross-check
            anything that matters.
          </p>
        </Card>
      </section>

      <section id="privacy" aria-labelledby="privacy-heading" className="space-y-5 scroll-mt-24">
        <h2 id="privacy-heading" className="text-2xl">
          Privacy and your data
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h3 className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-eco-600" aria-hidden="true" />
              What leaves your device
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Only the item name and the compressed photo you submit. They go to our own serverless
              endpoint, which forwards them to the configured AI provider purely to produce the
              analysis. The app stores no photographs, keeps no server-side account, and raw images
              are not written to logs.
            </p>
          </Card>
          <Card>
            <h3 className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-eco-600" aria-hidden="true" />
              What stays on your device
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your scan metadata, the AI analysis text and your recorded actions live in this
              browser's localStorage, capped to the most recent records. No photographs are stored.
              Nothing syncs between devices, and you can delete any record -- or everything -- from
              the My Eco Actions page.
            </p>
          </Card>
        </div>

        <Card>
          <h3 className="text-base">Hackathon disclosure</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            RecycleVision AI is an independent hackathon entry submitted to the Rotary AI for Good
            Hackathon. It is not an official Rotary product and carries no endorsement from Rotary
            or any partner organisation. It is an educational prototype, not a certified waste
            management service.
          </p>
        </Card>
      </section>
    </div>
  );
}
