import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, RotateCcw, Sparkles, Type } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, Card, SectionHeading } from '@/components/ui/primitives';
import { ImageDropzone } from '@/components/scanner/ImageDropzone';
import { AnalysisProgress } from '@/components/scanner/AnalysisProgress';
import { useToast } from '@/components/ui/ToastProvider';
import { AnalyzeError, requestAnalysis } from '@/services/analyzeService';
import { saveScan } from '@/lib/storage';
import { EXAMPLE_ITEMS } from '@/lib/constants';
import type { PreparedImage } from '@/lib/image';

const MAX_NAME = 120;

export function Scanner() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [itemName, setItemName] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const trimmedName = itemName.trim();
  const canSubmit = (trimmedName.length >= 2 || Boolean(image)) && !loading;

  const runAnalysis = useCallback(async () => {
    if (!trimmedName && !image) {
      setError({ message: 'Enter an item name or upload a photo first.', retryable: false });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await requestAnalysis({
        itemName: trimmedName || undefined,
        imageDataUrl: image?.dataUrl,
        signal: controller.signal,
      });

      const record = saveScan({
        analysis: result.analysis,
        hadImage: Boolean(image),
        provider: result.meta.provider,
        model: result.meta.model,
      });

      toast(`Analysis ready for "${result.analysis.itemName}".`);
      navigate(`/results/${record.id}`);
    } catch (err) {
      if (err instanceof AnalyzeError) {
        if (err.code === 'aborted') return;
        setError({ message: err.message, retryable: err.retryable });
      } else {
        setError({
          message: 'Something unexpected went wrong. Please try again.',
          retryable: true,
        });
      }
      toast('The analysis could not be completed.', 'error');
    } finally {
      setLoading(false);
    }
  }, [image, navigate, toast, trimmedName]);

  const reset = () => {
    abortRef.current?.abort();
    setItemName('');
    setImage(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <SectionHeading
        eyebrow="AI Waste Scanner"
        title="What are you about to throw away?"
        description="Upload a photo, take one with your camera, or just type the item name. You can also do both -- the photo is treated as the main evidence and your text as a hint."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void runAnalysis();
          }}
        >
          <Card>
            <h2 className="text-lg">1. Add a photo <span className="text-sm font-semibold text-muted">(optional)</span></h2>
            <p className="mt-1.5 text-sm text-muted">
              A clear, well-lit photo of a single object gives the best identification.
            </p>
            <div className="mt-5">
              <ImageDropzone image={image} onImage={setImage} disabled={loading} />
            </div>
          </Card>

          <Card>
            <label htmlFor="item-name" className="block text-lg font-bold text-forest">
              2. Or name the item
            </label>
            <p className="mt-1.5 text-sm text-muted">
              Text alone is enough -- no photo required.
            </p>

            <div className="relative mt-5">
              <Type
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="item-name"
                name="itemName"
                type="text"
                value={itemName}
                maxLength={MAX_NAME}
                onChange={(event) => setItemName(event.target.value)}
                disabled={loading}
                autoComplete="off"
                placeholder="e.g. Plastic water bottle"
                aria-describedby="item-name-help"
                className="w-full rounded-2xl border border-eco-100 bg-cream py-3.5 pl-12 pr-4 text-[0.975rem] text-ink transition placeholder:text-muted/70 focus:border-eco focus:bg-white focus:outline-none focus:ring-2 focus:ring-eco/30 disabled:opacity-60"
              />
            </div>
            <p id="item-name-help" className="mt-2 text-xs text-muted">
              {itemName.length}/{MAX_NAME} characters. At least 2 characters if you are not
              uploading a photo.
            </p>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Try an example
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {EXAMPLE_ITEMS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={loading}
                    onClick={() => setItemName(example)}
                    className="rounded-full border border-eco-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-forest transition hover:border-eco/40 hover:bg-mint disabled:opacity-60"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="sm:flex-1">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              {loading ? 'Analysing...' : 'Analyze with AI'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={reset}
              disabled={loading && !image && !itemName}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>

          {!canSubmit && !loading && (
            <p className="text-sm text-muted">
              Add a photo or type at least two characters to enable the analysis.
            </p>
          )}

          {error && (
            <Alert tone="danger" title="The analysis did not complete">
              <p>{error.message}</p>
              <p className="mt-2 text-xs">
                No results are shown when a request fails -- we never substitute made-up analysis.
              </p>
              {error.retryable && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => void runAnalysis()}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Try again
                  </Button>
                </div>
              )}
            </Alert>
          )}
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24">
          {loading ? (
            <AnalysisProgress />
          ) : (
            <Card>
              <h2 className="text-lg">What you will get</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                {[
                  'The identified object, its likely materials and category',
                  'Three to five honest advantages and disadvantages',
                  'What happens if it is littered, landfilled, recycled or reused',
                  'The most responsible next action, with precautions',
                  'Up to three safe second-life projects with full instructions',
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-eco-500" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Alert tone="info" title="Privacy">
            <p>
              Your photo and item name are sent to our own server, which forwards them to the
              configured AI providers purely to produce this analysis. A photo is read by a vision
              model, then a text model writes the result. We do not store your photographs, and API
              keys never reach the browser.
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-semibold">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Results are saved only in this browser.
            </p>
          </Alert>

          <Alert tone="warning" title="Safety first">
            <p>
              For damaged batteries, chemical containers, medical waste or anything leaking, the app
              deliberately offers no DIY projects -- only guidance to use a qualified collection
              point.
            </p>
          </Alert>
        </aside>
      </div>
    </div>
  );
}
