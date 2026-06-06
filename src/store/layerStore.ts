import { create } from 'zustand';
import type { Layer, ImageLayer, TextLayer, ShapeLayer } from '@/types/layer';

interface LayerStore {
  layers: Layer[];
  selectedLayerIds: string[];
  history: Layer[][];
  historyIndex: number;

  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  selectLayer: (id: string, multiSelect?: boolean) => void;
  deselectLayer: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  moveLayer: (id: string, x: number, y: number) => void;
  resizeLayer: (id: string, width: number, height: number) => void;
  rotateLayer: (id: string, rotation: number) => void;

  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;

  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  duplicateLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;

  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  setLayers: (layers: Layer[]) => void;
}

const generateId = () => `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getMaxZIndex = (layers: Layer[]) => {
  if (layers.length === 0) return 0;
  return Math.max(...layers.map((l) => l.zIndex));
};

export const useLayerStore = create<LayerStore>((set, get) => ({
  layers: [],
  selectedLayerIds: [],
  history: [[]],
  historyIndex: 0,

  addLayer: (layer) => {
    const { layers, saveHistory } = get();
    const newZ = getMaxZIndex(layers) + 1;
    const newLayer = { ...layer, zIndex: newZ, id: layer.id || generateId() };
    set({
      layers: [...layers, newLayer],
      selectedLayerIds: [newLayer.id],
    });
    saveHistory();
  },

  removeLayer: (id) => {
    const { layers, selectedLayerIds, saveHistory } = get();
    const newLayers = layers.filter((l) => l.id !== id);
    const newSelected = selectedLayerIds.filter((sid) => sid !== id);
    set({ layers: newLayers, selectedLayerIds: newSelected });
    saveHistory();
  },

  updateLayer: (id, updates) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? ({ ...l, ...updates } as Layer) : l
    );
    set({ layers: newLayers });
  },

  selectLayer: (id, multiSelect = false) => {
    const { selectedLayerIds } = get();
    if (multiSelect) {
      if (selectedLayerIds.includes(id)) {
        set({ selectedLayerIds: selectedLayerIds.filter((sid) => sid !== id) });
      } else {
        set({ selectedLayerIds: [...selectedLayerIds, id] });
      }
    } else {
      set({ selectedLayerIds: [id] });
    }
  },

  deselectLayer: (id) => {
    const { selectedLayerIds } = get();
    set({ selectedLayerIds: selectedLayerIds.filter((sid) => sid !== id) });
  },

  clearSelection: () => set({ selectedLayerIds: [] }),

  selectAll: () => {
    const { layers } = get();
    set({ selectedLayerIds: layers.filter(l => !l.locked).map((l) => l.id) });
  },

  moveLayer: (id, x, y) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, x: Math.round(x), y: Math.round(y) } : l
    );
    set({ layers: newLayers });
  },

  resizeLayer: (id, width, height) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, width: Math.round(width), height: Math.round(height) } : l
    );
    set({ layers: newLayers });
  },

  rotateLayer: (id, rotation) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, rotation } : l
    );
    set({ layers: newLayers });
  },

  bringForward: (id) => {
    const { layers, saveHistory } = get();
    const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const index = sorted.findIndex((l) => l.id === id);
    if (index < sorted.length - 1) {
      const temp = sorted[index].zIndex;
      sorted[index].zIndex = sorted[index + 1].zIndex;
      sorted[index + 1].zIndex = temp;
      set({ layers: [...sorted] });
      saveHistory();
    }
  },

  sendBackward: (id) => {
    const { layers, saveHistory } = get();
    const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const index = sorted.findIndex((l) => l.id === id);
    if (index > 0) {
      const temp = sorted[index].zIndex;
      sorted[index].zIndex = sorted[index - 1].zIndex;
      sorted[index - 1].zIndex = temp;
      set({ layers: [...sorted] });
      saveHistory();
    }
  },

  bringToFront: (id) => {
    const { layers, saveHistory } = get();
    const maxZ = getMaxZIndex(layers);
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, zIndex: maxZ + 1 } : l
    );
    set({ layers: newLayers });
    saveHistory();
  },

  sendToBack: (id) => {
    const { layers, saveHistory } = get();
    const minZ = Math.min(...layers.map((l) => l.zIndex));
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, zIndex: minZ - 1 } : l
    );
    set({ layers: newLayers });
    saveHistory();
  },

  reorderLayer: (fromIndex, toIndex) => {
    const { layers, saveHistory } = get();
    const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    const reindexed = sorted.map((l, i) => ({ ...l, zIndex: i + 1 }));
    set({ layers: reindexed });
    saveHistory();
  },

  toggleVisibility: (id) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    set({ layers: newLayers });
  },

  toggleLock: (id) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, locked: !l.locked } : l
    );
    set({ layers: newLayers });
  },

  duplicateLayer: (id) => {
    const { layers, addLayer, saveHistory } = get();
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      const newLayer = {
        ...layer,
        id: generateId(),
        name: `${layer.name} 副本`,
        x: layer.x + 20,
        y: layer.y + 20,
        zIndex: getMaxZIndex(layers) + 1,
      } as Layer;
      set({
        layers: [...layers, newLayer],
        selectedLayerIds: [newLayer.id],
      });
      saveHistory();
    }
  },

  renameLayer: (id, name) => {
    const { layers } = get();
    const newLayers = layers.map((l) =>
      l.id === id ? { ...l, name } : l
    );
    set({ layers: newLayers });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        layers: history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        layers: history[newIndex],
        historyIndex: newIndex,
      });
    }
  },

  saveHistory: () => {
    const { layers, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...layers]);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  setLayers: (layers) => {
    set({ layers, history: [layers], historyIndex: 0, selectedLayerIds: [] });
  },
}));

export function createTextLayer(
  x: number,
  y: number,
  content: string = '双击编辑文字'
): TextLayer {
  return {
    id: generateId(),
    type: 'text',
    name: '文字',
    x,
    y,
    width: 300,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    content,
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: 600,
    color: '#18181b',
    textAlign: 'left',
    lineHeight: 1.4,
    letterSpacing: 0,
  };
}

export function createImageLayer(
  x: number,
  y: number,
  src: string,
  width: number = 200,
  height: number = 200
): ImageLayer {
  return {
    id: generateId(),
    type: 'image',
    name: '图片',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    src,
    filter: {
      brightness: 100,
      contrast: 100,
      saturate: 100,
    },
  };
}

export function createShapeLayer(
  x: number,
  y: number,
  shapeType: ShapeLayer['shapeType'],
  width: number = 150,
  height: number = 150
): ShapeLayer {
  return {
    id: generateId(),
    type: 'shape',
    name:
      shapeType === 'rectangle'
        ? '矩形'
        : shapeType === 'circle'
        ? '圆形'
        : shapeType === 'triangle'
        ? '三角形'
        : '线条',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    shapeType,
    fill: '#6366F1',
    stroke: {
      color: 'transparent',
      width: 0,
    },
    borderRadius: shapeType === 'rectangle' ? 8 : 0,
  };
}
