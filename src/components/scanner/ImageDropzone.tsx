import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/primitives';
import {
  ACCEPT_ATTRIBUTE,
  ImageError,
  formatBytes,
  prepareImage,
  type PreparedImage,
} from '@/lib/image';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  image: PreparedImage | null;
  onImage: (image: PreparedImage | null) => void;
  disabled?: boolean;
}

export function ImageDropzone({ image, onImage, disabled }: ImageDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const lastPreview = useRef<string | null>(null);

  // Release the previous object URL whenever the preview changes or unmounts.
  useEffect(() => {
    if (lastPreview.current && lastPreview.current !== image?.previewUrl) {
      URL.revokeObjectURL(lastPreview.current);
    }
    lastPreview.current = image?.previewUrl ?? null;
  }, [image?.previewUrl]);

  useEffect(
    () => () => {
      if (lastPreview.current) URL.revokeObjectURL(lastPreview.current);
    },
    [],
  );

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);
      setBusy(true);
      try {
        const prepared = await prepareImage(file);
        onImage(prepared);
      } catch (err) {
        onImage(null);
        setError(
          err instanceof ImageError
            ? err.message
            : 'We could not process that image. Please try another photo.',
        );
      } finally {
        setBusy(false);
      }
    },
    [onImage],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      void handleFile(event.dataTransfer.files?.[0]);
    },
    [disabled, handleFile],
  );

  const clear = useCallback(() => {
    setError(null);
    onImage(null);
    if (fileInput.current) fileInput.current.value = '';
    if (cameraInput.current) cameraInput.current.value = '';
  }, [onImage]);

  return (
    <div className="space-y-3">
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        aria-label="Upload an image of your item"
        tabIndex={-1}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        aria-label="Take a photo of your item"
        tabIndex={-1}
      />

      {image ? (
        <figure className="overflow-hidden rounded-3xl border border-eco-100 bg-white shadow-soft">
          <div className="relative bg-forest-900/5">
            <img
              src={image.previewUrl}
              alt={`Preview of the uploaded photo: ${image.fileName}`}
              className="mx-auto max-h-80 w-full object-contain"
            />
          </div>
          <figcaption className="flex flex-col gap-3 border-t border-eco-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="truncate text-xs text-muted">
              <span className="font-semibold text-forest">{image.fileName}</span> &middot;{' '}
              {image.width}&times;{image.height}px &middot; {formatBytes(image.bytes)} after
              compression
            </span>
            <span className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInput.current?.click()}
                disabled={disabled || busy}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Replace
              </Button>
              <Button variant="ghost" size="sm" onClick={clear} disabled={disabled || busy}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            </span>
          </figcaption>
        </figure>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'rounded-3xl border-2 border-dashed px-6 py-10 text-center transition',
            dragging ? 'border-eco bg-mint/60' : 'border-eco-100 bg-white',
            disabled && 'opacity-60',
          )}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-eco-700">
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <p className="mt-4 text-base font-bold text-forest">
            {busy ? 'Preparing your photo...' : 'Drop a photo here'}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            JPEG, PNG or WebP, up to 12 MB. Large photos are resized in your browser before they are
            sent, so uploads stay fast.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInput.current?.click()}
              disabled={disabled || busy}
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Choose a file
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => cameraInput.current?.click()}
              disabled={disabled || busy}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Take a photo
            </Button>
          </div>
        </div>
      )}

      {error && <Alert tone="warning">{error}</Alert>}
    </div>
  );
}
