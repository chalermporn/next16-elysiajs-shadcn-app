export type Area = { x: number; y: number; width: number; height: number };

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.9
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Resize to max 400px for avatar to reduce file size
  const max = 400;
  let out = canvas;
  if (pixelCrop.width > max || pixelCrop.height > max) {
    const scale = max / Math.max(pixelCrop.width, pixelCrop.height);
    const w = Math.round(pixelCrop.width * scale);
    const h = Math.round(pixelCrop.height * scale);
    const resized = document.createElement('canvas');
    resized.width = w;
    resized.height = h;
    const rctx = resized.getContext('2d');
    if (rctx) {
      rctx.drawImage(canvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, w, h);
      out = resized;
    }
  }

  return out.toDataURL(type, quality);
}
