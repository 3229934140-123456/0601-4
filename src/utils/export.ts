import { toPng, toJpeg } from 'html-to-image';
import type { Layer, ImageLayer } from '@/types/layer';
import type { ExportConfig } from '@/types/project';
import { removeBackground } from './imageProcessing';

export interface ExportSize {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface ExportLayerData {
  layers: Layer[];
  originalWidth: number;
  originalHeight: number;
  backgroundColor: string;
}

function scaleLayersForSize(
  layers: Layer[],
  originalW: number,
  originalH: number,
  targetW: number,
  targetH: number
): Layer[] {
  const scaleX = targetW / originalW;
  const scaleY = targetH / originalH;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (targetW - originalW * scale) / 2;
  const offsetY = (targetH - originalH * scale) / 2;

  return layers.map((layer) => ({
    ...layer,
    x: layer.x * scale + offsetX,
    y: layer.y * scale + offsetY,
    width: layer.width * scale,
    height: layer.height * scale,
    fontSize: layer.type === 'text' ? (layer as any).fontSize * scale : undefined,
    stroke:
      layer.type === 'shape' || layer.type === 'text'
        ? { ...(layer as any).stroke, width: ((layer as any).stroke?.width || 0) * scale }
        : undefined,
  })) as Layer[];
}

async function processImageLayers(layers: Layer[]): Promise<Map<string, string>> {
  const processedMap = new Map<string, string>();
  const imageLayers = layers.filter((l) => l.type === 'image' && l.visible) as ImageLayer[];

  for (const layer of imageLayers) {
    if (layer.backgroundRemoved) {
      try {
        const processed = await removeBackground(layer.src, {
          threshold: 25,
          tolerance: 30,
          edgeSoftness: 2,
        });
        processedMap.set(layer.id, processed);
      } catch {
        processedMap.set(layer.id, layer.src);
      }
    } else {
      processedMap.set(layer.id, layer.src);
    }
  }

  return processedMap;
}

function createExportCanvas(
  layers: Layer[],
  width: number,
  height: number,
  backgroundColor: string,
  processedImages: Map<string, string> = new Map()
): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '-99999px';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.backgroundColor = backgroundColor;
  container.style.overflow = 'hidden';
  container.style.transform = 'scale(1)';
  container.style.transformOrigin = 'top left';

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  sortedLayers.forEach((layer) => {
    if (!layer.visible) return;

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = `${layer.x}px`;
    el.style.top = `${layer.y}px`;
    el.style.width = `${layer.width}px`;
    el.style.height = `${layer.height}px`;
    el.style.opacity = String(layer.opacity);
    el.style.transform = `rotate(${layer.rotation}deg)`;
    el.style.zIndex = String(layer.zIndex);
    el.style.overflow = 'hidden';

    if (layer.type === 'text') {
      const textLayer = layer as any;
      el.textContent = textLayer.content;
      el.style.fontSize = `${textLayer.fontSize}px`;
      el.style.fontFamily = textLayer.fontFamily;
      el.style.fontWeight = String(textLayer.fontWeight);
      el.style.color = textLayer.color;
      el.style.textAlign = textLayer.textAlign;
      el.style.lineHeight = String(textLayer.lineHeight);
      el.style.letterSpacing = `${textLayer.letterSpacing}px`;
      el.style.whiteSpace = 'pre-wrap';
      el.style.wordBreak = 'break-word';
      el.style.userSelect = 'none';

      if (textLayer.shadow) {
        el.style.textShadow = `${textLayer.shadow.offsetX}px ${textLayer.shadow.offsetY}px ${textLayer.shadow.blur}px ${textLayer.shadow.color}`;
      }
      if (textLayer.stroke && textLayer.stroke.width > 0) {
        el.style.webkitTextStroke = `${textLayer.stroke.width}px ${textLayer.stroke.color}`;
      }
    } else if (layer.type === 'image') {
      const imgLayer = layer as any;
      const img = document.createElement('img');
      const src = processedImages.get(layer.id) || imgLayer.src;
      img.src = src;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      img.crossOrigin = 'anonymous';

      if (imgLayer.filter) {
        const f = imgLayer.filter;
        img.style.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%)`;
      }

      el.appendChild(img);
    } else if (layer.type === 'shape') {
      const shapeLayer = layer as any;
      el.style.backgroundColor = shapeLayer.fill;

      if (shapeLayer.shapeType === 'circle') {
        el.style.borderRadius = '50%';
      } else if (shapeLayer.shapeType === 'rectangle') {
        el.style.borderRadius = `${shapeLayer.borderRadius || 0}px`;
      } else if (shapeLayer.shapeType === 'triangle') {
        el.style.backgroundColor = 'transparent';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.width = '100%';
        svg.style.height = '100%';
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '50,0 100,100 0,100');
        polygon.setAttribute('fill', shapeLayer.fill);
        if (shapeLayer.stroke) {
          polygon.setAttribute('stroke', shapeLayer.stroke.color);
          polygon.setAttribute('stroke-width', String(shapeLayer.stroke.width));
        }
        svg.appendChild(polygon);
        el.appendChild(svg);
      } else if (shapeLayer.shapeType === 'line') {
        el.style.backgroundColor = shapeLayer.fill;
      }

      if (shapeLayer.stroke && shapeLayer.stroke.width > 0 && shapeLayer.shapeType !== 'triangle') {
        el.style.border = `${shapeLayer.stroke.width}px solid ${shapeLayer.stroke.color}`;
        el.style.boxSizing = 'border-box';
      }
    }

    container.appendChild(el);
  });

  document.body.appendChild(container);
  return container;
}

export async function exportToDataUrl(
  layers: Layer[],
  width: number,
  height: number,
  backgroundColor: string,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.9
): Promise<string> {
  const processedImages = await processImageLayers(layers);
  const container = createExportCanvas(layers, width, height, backgroundColor, processedImages);

  try {
    let dataUrl: string;

    if (format === 'webp') {
      const pngDataUrl = await toPng(container, {
        pixelRatio: 1,
        cacheBust: true,
      });

      dataUrl = await convertPngToWebp(pngDataUrl, quality);
    } else if (format === 'jpeg') {
      dataUrl = await toJpeg(container, {
        quality,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor,
      });
    } else {
      dataUrl = await toPng(container, {
        pixelRatio: 1,
        cacheBust: true,
      });
    }

    return dataUrl;
  } finally {
    document.body.removeChild(container);
  }
}

function convertPngToWebp(pngDataUrl: string, quality: number = 0.9): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        if (webpDataUrl.startsWith('data:image/webp')) {
          resolve(webpDataUrl);
        } else {
          resolve(pngDataUrl);
        }
      } catch {
        resolve(pngDataUrl);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = pngDataUrl;
  });
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
  layerData: ExportLayerData,
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
      const scaledLayers = scaleLayersForSize(
        layerData.layers,
        layerData.originalWidth,
        layerData.originalHeight,
        size.width,
        size.height
      );

      const dataUrl = await exportToDataUrl(
        scaledLayers,
        size.width,
        size.height,
        layerData.backgroundColor,
        config.format,
        config.quality
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

export async function exportSingleSize(
  layerData: ExportLayerData,
  format: 'png' | 'jpeg' | 'webp',
  quality: number = 0.9,
  scale: number = 1
): Promise<string> {
  const targetWidth = Math.round(layerData.originalWidth * scale);
  const targetHeight = Math.round(layerData.originalHeight * scale);

  const scaledLayers = scaleLayersForSize(
    layerData.layers,
    layerData.originalWidth,
    layerData.originalHeight,
    targetWidth,
    targetHeight
  );

  return exportToDataUrl(
    scaledLayers,
    targetWidth,
    targetHeight,
    layerData.backgroundColor,
    format,
    quality
  );
}

export function getFileExtension(format: string): string {
  switch (format) {
    case 'jpeg':
      return 'jpg';
    case 'webp':
      return 'webp';
    case 'png':
    default:
      return 'png';
  }
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
