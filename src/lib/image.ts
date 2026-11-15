/** Client-side image validation and downscaling, so requests stay inside the
 *  serverless function's body limit and uploads feel fast on mobile data. */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPT_ATTRIBUTE = 'image/jpeg,image/png,image/webp';
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // what we accept from the user
const MAX_EDGE = 1024; // longest side after downscaling
const TARGET_BYTES = 950_000; // encoded data-URL budget

export class ImageError extends Error {}

export interface PreparedImage {
  /** `data:image/jpeg;base64,...` ready to POST to /api/analyze */
  dataUrl: string;
  /** object URL for on-screen preview (revoke when done) */
  previewUrl: string;
  fileName: string;
  width: number;
  height: number;
  bytes: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('We could not read that image. Please try a different photo.'));
    };
    img.src = url;
  });
}

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type || !ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new ImageError('Unsupported file type. Please upload a JPEG, PNG or WebP image.');
  }
  if (file.size === 0) {
    throw new ImageError('That file is empty. Please choose another photo.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError('That image is larger than 12 MB. Please choose a smaller photo.');
  }

  const img = await loadImage(file);
  if (!img.naturalWidth || !img.naturalHeight) {
    throw new ImageError('That image appears to be corrupted. Please try another photo.');
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Your browser could not process this image.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrlBytes(dataUrl) > TARGET_BYTES && quality > 0.4) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrlBytes(dataUrl) > TARGET_BYTES * 2) {
    throw new ImageError('We could not compress that image enough. Please try a smaller photo.');
  }

  return {
    dataUrl,
    previewUrl: URL.createObjectURL(file),
    fileName: file.name || 'photo.jpg',
    width,
    height,
    bytes: dataUrlBytes(dataUrl),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
