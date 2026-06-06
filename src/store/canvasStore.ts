import { create } from 'zustand';
import type { CanvasState, GuideLine } from '@/types/canvas';

interface CanvasStore extends CanvasState {
  setSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setOffset: (x: number, y: number) => void;
  setBackgroundColor: (color: string) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnapToGrid: () => void;
  toggleSnapToObjects: () => void;
  guideLines: GuideLine[];
  addGuideLine: (type: GuideLine['type'], position: number) => void;
  removeGuideLine: (index: number) => void;
  clearGuideLines: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  width: 1080,
  height: 1080,
  zoom: 0.6,
  offsetX: 0,
  offsetY: 0,
  backgroundColor: '#ffffff',
  showGrid: true,
  showRulers: false,
  snapToGrid: false,
  snapToObjects: true,
  guideLines: [],

  setSize: (width, height) => set({ width, height }),

  setZoom: (zoom) => {
    const clampedZoom = Math.max(0.1, Math.min(3, zoom));
    set({ zoom: clampedZoom });
  },

  zoomIn: () => {
    const { zoom } = get();
    const newZoom = Math.min(3, zoom * 1.2);
    set({ zoom: newZoom });
  },

  zoomOut: () => {
    const { zoom } = get();
    const newZoom = Math.max(0.1, zoom / 1.2);
    set({ zoom: newZoom });
  },

  resetZoom: () => set({ zoom: 0.6, offsetX: 0, offsetY: 0 }),

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  setBackgroundColor: (color) => set({ backgroundColor: color }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  toggleSnapToObjects: () => set((state) => ({ snapToObjects: !state.snapToObjects })),

  addGuideLine: (type, position) =>
    set((state) => ({
      guideLines: [...state.guideLines, { type, position }],
    })),

  removeGuideLine: (index) =>
    set((state) => ({
      guideLines: state.guideLines.filter((_, i) => i !== index),
    })),

  clearGuideLines: () => set({ guideLines: [] }),
}));
