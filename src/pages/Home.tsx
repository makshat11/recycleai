import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  ClipboardCheck,
  Globe2,
  Lightbulb,
  Microscope,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Card, SectionHeading } from '@/components/ui/primitives';
import { HeroIllustration, StepGlyph } from '@/components/ui/Illustrations';
import { useRecords } from '@/hooks/useRecords';
import { isCompleted } from '@/lib/storage';

const STEPS = [
  {
    step: 1 as const,
    number: '01',
    title: 'Scan It',
    body: 'Upload a photo, use your camera, or simply type the name of the object you are about to throw away.',
  },
  {
    step: 2 as const,
    number: '02',
    title: 'Understand It',
    body: 'See likely materials, honest advantages and disadvantages, and general recycling guidance for that material.',
  },
  {
    step: 3 as const,
    number: '03',
    title: 'Reimagine It',
    body: 'Explore up to three safe, practical second-life projects with materials, steps and safety notes.',
  },
  {
    step: 4 as const,
    number: '04',
    title: 'Make an Impact',
    body: 'Record what you actually did -- reused, repaired, donated, recycled -- and watch your own history build up.',
  },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: 'AI Object Recognition',
    body: 'A vision-capable model reads your photo and names the object, or works from a typed item name alone.',
  },
  {
    icon: Microscope,
    title: 'Smart Material Analysis',
    body: 'Likely materials and category, with uncertainty stated plainly instead of guessed-at precision.',
  },
  {
    icon: Globe2,
    title: 'Environmental Impact',
    body: 'What happens if the item is littered, landfilled, recycled or reused -- explained in qualified, non-invented terms.',
  },
  {
    icon: Lightbulb,
    title: 'Second-Life Ideas',
    body: 'Up to three realistic reuse projects with difficulty, time, materials, steps and safety notes.',
  },
  {
    icon: ClipboardCheck,
    title: 'Eco Action Tracking',
    body: 'Mark what you planned and what you finished. Planned is never counted as done.',
  },
  {
    icon: BarChart3,
    title: 'Impact Dashboard',
    body: 'Charts built from your own recorded activity, stored only in this browser.',
  },
];

const MISSION = [
  {
    title: 'Information is the missing step',
    body: 'Most people want to do the right thing with an old object. What they lack at the bin is a quick, trustworthy answer about what it is made of and what their options are.',
  },
  {
    title: 'Reuse comes before recycling',
    body: 'Keeping an item in use, repairing it or passing it on usually avoids more material and energy demand than recycling it does. The app always surfaces those options first.',
  },
  {
    title: 'Education creates lasting habits',
    body: 'A single explained decision teaches a pattern that applies to the next ten objects. That is the lasting impact this project aims for -- knowledge, not guesswork.',
  },
];

export function Home() {
  const reduceMotion = useReducedMotion();
  const { records } = useRecords();
  const completed = records.filter(isCompleted).length;

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.5, delay, ease: 'easeOut' as const },
        };

  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mint blur-3xl"
          aria-hidden="true"
        />
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <p className="eyebrow inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-soft">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI for a greener tomorrow
            </p>

            <h1 className="mt-6 text-[2.4rem] leading-[1.08] sm:text-5xl lg:text-[3.6rem]">
              Your Waste Has a <span className="text-eco-600">Second Life.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Upload a photo or enter an item name. Discover its materials, understand its
              environmental impact, and explore practical ways to reuse it with AI.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/scan" size="lg">
                <ScanLine className="h-5 w-5" aria-hidden="true" />
                Start Scanning
              </ButtonLink>
              <ButtonLink to="/about" size="lg" variant="secondary">
                Explore How It Works
              </ButtonLink>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-eco-100 pt-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Items you have analysed
                </dt>
                <dd className="text-2xl font-extrabold text-forest">{records.length}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Actions you have completed
                </dt>
                <dd className="text-2xl font-extrabold text-forest">{completed}</dd>
              </div>
              <div className="max-w-[14rem]">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Where it is stored
                </dt>
                <dd className="text-sm font-medium text-muted">This browser only -- no account</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.12, ease: 'easeOut' }}
            className="relative"
          >
            <HeroIllustration className="w-full drop-shadow-[0_24px_50px_rgba(21,60,53,0.14)]" />
          </motion.div>
        </div>
      </section>

      {/* -------------------------------------------------------- how it works */}
      <section className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="From bin-bound object to useful second life, in four steps"
          description="No account, no forms. The whole flow takes about a minute."
          align="center"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, index) => (
            <motion.div key={item.number} {...fadeUp(index * 0.07)}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <StepGlyph step={item.step} className="h-12 w-12" />
                  <span className="text-2xl font-extrabold text-eco-100">{item.number}</span>
                </div>
                <h3 className="mt-5 text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- features */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Features"
            title="Everything in one place"
            description="Each feature is wired to the real AI endpoint and to your own locally stored activity -- nothing here is a mock-up."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} {...fadeUp(index * 0.05)}>
                  <Card className="h-full border-eco-100 transition hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-eco-700">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ mission */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            eyebrow="Our mission"
            title="Transform everyday waste into knowledge and better decisions"
            description="RecycleVision AI is an environmental education tool. It does not claim to measure your carbon footprint -- it helps you understand one object at a time, and keeps a record of what you chose to do."
          />

          <div className="space-y-4">
            {MISSION.map((item, index) => (
              <motion.div key={item.title} {...fadeUp(index * 0.06)}>
                <Card className="flex gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-mint">
                    <Brain className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- final CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-4xl bg-forest px-6 py-14 text-center sm:px-12 lg:py-20">
          <div className="absolute inset-0 bg-grid opacity-[0.12]" aria-hidden="true" />
          <div
            className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-eco-600/40 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-3xl text-white sm:text-4xl lg:text-[2.75rem]">
              Before You Throw It Away, Ask AI.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[0.975rem] leading-relaxed text-mint/90">
              One photo is enough to find out what an object is made of, how it affects the
              environment, and what you could build with it instead.
            </p>
            <div className="mt-9 flex justify-center">
              <ButtonLink to="/scan" size="lg" variant="amber">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Give It a Second Life
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
