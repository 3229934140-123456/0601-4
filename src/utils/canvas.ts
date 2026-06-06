import type { Layer } from '@/types/layer';

export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapValue(value: number, snapThreshold: number = 5, ...snapTargets: number[]): { value: number; snapped: boolean } {
  for (const target of snapTargets) {
    if (Math.abs(value - target) <= snapThreshold) {
      return { value: target, snapped: true };
    }
  }
  return { value, snapped: false };
}

export function getLayerBounds(layer: Layer) {
  const { x, y, width, height, rotation } = layer;
  
  if (rotation === 0) {
    return { left: x, top: y, right: x + width, bottom: y + height, centerX: x + width / 2, centerY: y + height / 2 };
  }
  
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const newWidth = width * cos + height * sin;
  const newHeight = width * sin + height * cos;
  const cx = x + width / 2;
  const cy = y + height / 2;
  
  return {
    left: cx - newWidth / 2,
    top: cy - newHeight / 2,
    right: cx + newWidth / 2,
    bottom: cy + newHeight / 2,
    centerX: cx,
    centerY: cy,
  };
}

export function checkSnapAlignment(
  movingLayer: Layer,
  allLayers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number = 5
): { hLine: number | null; vLine: number | null } {
  const bounds = getLayerBounds(movingLayer);
  const otherLayers = allLayers.filter((l) => l.id !== movingLayer.id && l.visible);
  
  let hLine: number | null = null;
  let vLine: number | null = null;
  
  const vTargets: number[] = [canvasWidth / 2];
  const hTargets: number[] = [canvasHeight / 2];
  
  for (const layer of otherLayers) {
    const lb = getLayerBounds(layer);
    vTargets.push(lb.left, lb.right, lb.centerX);
    hTargets.push(lb.top, lb.bottom, lb.centerY);
  }
  
  const { value: leftSnap, snapped: leftSnapped } = snapValue(bounds.left, threshold, ...vTargets);
  const { value: rightSnap, snapped: rightSnapped } = snapValue(bounds.right, threshold, ...vTargets);
  const { value: centerSnap, snapped: centerSnapped } = snapValue(bounds.centerX, threshold, ...vTargets);
  
  if (centerSnapped) vLine = centerSnap;
  else if (leftSnapped) vLine = leftSnap;
  else if (rightSnapped) vLine = rightSnap;
  
  const { value: topSnap, snapped: topSnapped } = snapValue(bounds.top, threshold, ...hTargets);
  const { value: bottomSnap, snapped: bottomSnapped } = snapValue(bounds.bottom, threshold, ...hTargets);
  const { value: midSnap, snapped: midSnapped } = snapValue(bounds.centerY, threshold, ...hTargets);
  
  if (midSnapped) hLine = midSnap;
  else if (topSnapped) hLine = topSnap;
  else if (bottomSnapped) hLine = bottomSnap;
  
  return { hLine, vLine };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
