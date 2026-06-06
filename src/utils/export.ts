import { toPng, toJpeg } from 'html-to-image';
import type { ExportConfig } from '@/types/project';

export async function exportCanvas(
  canvasElement: HTMLElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.9,
  scale: number = 1
): Promise<string> {
  const options = {
    quality,
    pixelRatio: scale,
    cacheBust: true,
    style: {
      transform: 'scale(1)',
    },
  };

  try {
    let dataUrl: string;

    switch (format) {
      case 'jpeg':
        dataUrl = await toJpeg(canvasElement, options);
        break;
      case 'webp':
        dataUrl = await toPng(canvasElement, options);
        break;
      case 'png':
      default:
        dataUrl = await toPng(canvasElement, options);
        break;
    }

    return dataUrl;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportMultipleSizes(
  canvasElement: HTMLElement,
  config: ExportConfig,
  onProgress?: (current: number, total: number, sizeName: string) => void
): Promise<{ name: string; dataUrl: string }[]> {
  const results: { name: string; dataUrl: string }[] = [];
  const total = config.sizes.length;

  for (let i = 0; i < config.sizes.length; i++) {
    const size = config.sizes[i];
    if (onProgress) {
      onProgress(i + 1, total, size.name);
    }

    try {
      const dataUrl = await exportCanvas(
        canvasElement,
        config.format,
        config.quality,
        config.scale
      );
      results.push({
        name: `${size.name}.${config.format === 'jpeg' ? 'jpg' : config.format}`,
        dataUrl,
      });
    } catch (error) {
      console.error(`Failed to export ${size.name}:`, error);
    }
  }

  return results;
}

export function getMimeType(format: string): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
}

export function estimateFileSize(
  width: number,
  height: number,
  format: string,
  quality: number = 0.9
): string {
  const pixels = width * height;
  let bytes: number;

  switch (format) {
    case 'png':
      bytes = pixels * 4 * 0.7;
      break;
    case 'jpeg':
      bytes = pixels * 3 * quality * 0.3;
      break;
    case 'webp':
      bytes = pixels * 3 * quality * 0.2;
      break;
    default:
      bytes = pixels * 4;
  }

  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
