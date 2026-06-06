import { create } from 'zustand';
import type { Project, VersionSnapshot, ColorPalette, GeneratedDesign } from '@/types/project';
import type { Layer } from '@/types/layer';
import type { CanvasState } from '@/types/canvas';
import { colorPalettes, favoriteColors as defaultFavorites } from '@/data/colorPalettes';
import { templates } from '@/data/templates';
import { canvasSizes } from '@/data/canvasSizes';

interface ProjectStore {
  currentProjectId: string | null;
  projects: Project[];
  versionSnapshots: VersionSnapshot[];
  favoriteColors: string[];
  favoritePalettes: string[];
  showExportModal: boolean;
  showProjectPanel: boolean;
  showGenerationCenter: boolean;
  generatedDesigns: GeneratedDesign[];
  selectedGeneratedDesignId: string | null;
  isDirty: boolean;

  setShowExportModal: (show: boolean) => void;
  setShowProjectPanel: (show: boolean) => void;
  setShowGenerationCenter: (show: boolean) => void;
  setIsDirty: (dirty: boolean) => void;

  createNewProject: (name: string, width: number, height: number) => string;
  createProjectFromTemplate: (templateId: string) => string;
  saveProject: () => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  unarchiveProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;

  saveSnapshot: (name: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;

  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
  toggleFavoritePalette: (paletteId: string) => void;

  batchReplaceText: (find: string, replace: string) => number;
  countMatchingTextLayers: (find: string) => number;

  generateDesigns: (sizeIds: string[]) => void;
  selectGeneratedDesign: (id: string | null) => void;
  updateGeneratedDesign: (id: string, updates: Partial<GeneratedDesign>) => void;
  deleteGeneratedDesign: (id: string) => void;
  applyGeneratedDesignToCanvas: (id: string) => void;
  saveGeneratedDesignAsSnapshot: (id: string, name: string) => void;
  clearGeneratedDesigns: () => void;

  getCurrentProject: () => Project | null;
}

const generateId = () => `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateSnapshotId = () => `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateDesignId = () => `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

const STORAGE_KEY = 'design-studio-projects';
const FAVORITES_KEY = 'design-studio-favorites';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

function loadFavorites() {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : { colors: defaultFavorites, palettes: [] };
  } catch {
    return { colors: defaultFavorites, palettes: [] };
  }
}

function saveFavorites(colors: string[], palettes: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify({ colors, palettes }));
  } catch {}
}

const initialFavorites = loadFavorites();

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProjectId: null,
  projects: loadFromStorage(),
  versionSnapshots: [],
  favoriteColors: initialFavorites.colors,
  favoritePalettes: initialFavorites.palettes,
  showExportModal: false,
  showProjectPanel: false,
  showGenerationCenter: false,
  generatedDesigns: [],
  selectedGeneratedDesignId: null,
  isDirty: false,

  setShowExportModal: (show) => set({ showExportModal: show }),
  setShowProjectPanel: (show) => set({ showProjectPanel: show }),
  setShowGenerationCenter: (show) => set({ showGenerationCenter: show }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  createNewProject: (name, width, height) => {
    const { projects } = get();
    const newProject: Project = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvas: {
        width,
        height,
        zoom: 0.6,
        offsetX: 0,
        offsetY: 0,
        backgroundColor: '#ffffff',
        showGrid: true,
        showRulers: false,
        snapToGrid: false,
        snapToObjects: true,
      },
      layers: [],
      archived: false,
    };
    const newProjects = [newProject, ...projects];
    saveToStorage(newProjects);
    set({ projects: newProjects, currentProjectId: newProject.id, versionSnapshots: [], isDirty: false });
    return newProject.id;
  },

  createProjectFromTemplate: (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return '';

    const { projects } = get();
    const layers = template.layers.map((layer, index) => ({
      ...layer,
      zIndex: index + 1,
    }));

    const newProject: Project = {
      id: generateId(),
      name: template.name,
      thumbnail: template.thumbnail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvas: {
        width: template.canvas.width,
        height: template.canvas.height,
        zoom: 0.6,
        offsetX: 0,
        offsetY: 0,
        backgroundColor: template.canvas.backgroundColor,
        showGrid: true,
        showRulers: false,
        snapToGrid: false,
        snapToObjects: true,
      },
      layers: layers as Layer[],
      archived: false,
    };

    const newProjects = [newProject, ...projects];
    saveToStorage(newProjects);
    set({ projects: newProjects, currentProjectId: newProject.id, versionSnapshots: [], isDirty: false });
    return newProject.id;
  },

  saveProject: () => {
    const { currentProjectId, projects } = get();
    if (!currentProjectId) return;

    const canvasState = (window as any).__canvasState;
    const layersState = (window as any).__layersState;

    const updatedProjects = projects.map((p) =>
      p.id === currentProjectId
        ? {
            ...p,
            updatedAt: Date.now(),
            canvas: canvasState || p.canvas,
            layers: layersState || p.layers,
          }
        : p
    );

    saveToStorage(updatedProjects);
    set({ projects: updatedProjects, isDirty: false });
  },

  loadProject: (id) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === id);
    if (project) {
      set({ currentProjectId: id, versionSnapshots: [], isDirty: false });
    }
  },

  deleteProject: (id) => {
    const { projects, currentProjectId } = get();
    const newProjects = projects.filter((p) => p.id !== id);
    saveToStorage(newProjects);
    set({
      projects: newProjects,
      currentProjectId: currentProjectId === id ? null : currentProjectId,
    });
  },

  archiveProject: (id) => {
    const { projects } = get();
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, archived: true, updatedAt: Date.now() } : p
    );
    saveToStorage(newProjects);
    set({ projects: newProjects });
  },

  unarchiveProject: (id) => {
    const { projects } = get();
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, archived: false, updatedAt: Date.now() } : p
    );
    saveToStorage(newProjects);
    set({ projects: newProjects });
  },

  renameProject: (id, name) => {
    const { projects } = get();
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, name, updatedAt: Date.now() } : p
    );
    saveToStorage(newProjects);
    set({ projects: newProjects });
  },

  saveSnapshot: (name) => {
    const { versionSnapshots } = get();
    const canvasState = (window as any).__canvasState;
    const layersState = (window as any).__layersState;

    if (!canvasState || !layersState) return;

    const snapshot: VersionSnapshot = {
      id: generateSnapshotId(),
      name,
      timestamp: Date.now(),
      canvas: canvasState,
      layers: layersState,
    };

    set({ versionSnapshots: [snapshot, ...versionSnapshots].slice(0, 20) });
  },

  restoreSnapshot: (snapshotId) => {
    const { versionSnapshots } = get();
    const snapshot = versionSnapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    if ((window as any).__restoreSnapshot) {
      (window as any).__restoreSnapshot(snapshot.canvas, snapshot.layers);
    }
  },

  deleteSnapshot: (snapshotId) => {
    const { versionSnapshots } = get();
    set({
      versionSnapshots: versionSnapshots.filter((s) => s.id !== snapshotId),
    });
  },

  addFavoriteColor: (color) => {
    const { favoriteColors } = get();
    if (!favoriteColors.includes(color)) {
      const newColors = [color, ...favoriteColors].slice(0, 20);
      saveFavorites(newColors, get().favoritePalettes);
      set({ favoriteColors: newColors });
    }
  },

  removeFavoriteColor: (color) => {
    const { favoriteColors, favoritePalettes } = get();
    const newColors = favoriteColors.filter((c) => c !== color);
    saveFavorites(newColors, favoritePalettes);
    set({ favoriteColors: newColors });
  },

  toggleFavoritePalette: (paletteId) => {
    const { favoritePalettes, favoriteColors } = get();
    let newPalettes: string[];
    if (favoritePalettes.includes(paletteId)) {
      newPalettes = favoritePalettes.filter((id) => id !== paletteId);
    } else {
      newPalettes = [paletteId, ...favoritePalettes];
    }
    saveFavorites(favoriteColors, newPalettes);
    set({ favoritePalettes: newPalettes });
  },

  batchReplaceText: (find, replace) => {
    const layersState = (window as any).__layersState as Layer[] | undefined;
    if (!layersState || !find) return 0;

    let count = 0;
    const updatedLayers = layersState.map((layer) => {
      if (layer.type === 'text') {
        const textLayer = layer as any;
        if (textLayer.content && textLayer.content.includes(find)) {
          count++;
          return {
            ...layer,
            content: textLayer.content.split(find).join(replace),
          };
        }
      }
      return layer;
    });

    if ((window as any).__setLayers) {
      (window as any).__setLayers(updatedLayers);
    }

    return count;
  },

  countMatchingTextLayers: (find) => {
    const layersState = (window as any).__layersState as Layer[] | undefined;
    if (!layersState || !find) return 0;

    let count = 0;
    layersState.forEach((layer) => {
      if (layer.type === 'text') {
        const textLayer = layer as any;
        if (textLayer.content && textLayer.content.includes(find)) {
          count++;
        }
      }
    });

    return count;
  },

  generateDesigns: (sizeIds) => {
    const canvasState = (window as any).__canvasState as CanvasState | undefined;
    const layersState = (window as any).__layersState as Layer[] | undefined;
    if (!canvasState || !layersState) return;

    const newDesigns: GeneratedDesign[] = sizeIds.map((sizeId) => {
      const size = canvasSizes.find((s) => s.id === sizeId);
      if (!size) return null;

      const scaledLayers = scaleLayersForSize(
        layersState,
        canvasState.width,
        canvasState.height,
        size.width,
        size.height
      );

      return {
        id: generateDesignId(),
        name: size.name,
        sizeId: size.id,
        width: size.width,
        height: size.height,
        layers: scaledLayers,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }).filter(Boolean) as GeneratedDesign[];

    set({
      generatedDesigns: newDesigns,
      selectedGeneratedDesignId: newDesigns.length > 0 ? newDesigns[0].id : null,
    });
  },

  selectGeneratedDesign: (id) => {
    set({ selectedGeneratedDesignId: id });
  },

  updateGeneratedDesign: (id, updates) => {
    const { generatedDesigns } = get();
    const updatedDesigns = generatedDesigns.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
    );
    set({ generatedDesigns: updatedDesigns });
  },

  deleteGeneratedDesign: (id) => {
    const { generatedDesigns, selectedGeneratedDesignId } = get();
    const newDesigns = generatedDesigns.filter((d) => d.id !== id);
    set({
      generatedDesigns: newDesigns,
      selectedGeneratedDesignId:
        selectedGeneratedDesignId === id
          ? newDesigns.length > 0
            ? newDesigns[0].id
            : null
          : selectedGeneratedDesignId,
    });
  },

  applyGeneratedDesignToCanvas: (id) => {
    const { generatedDesigns } = get();
    const design = generatedDesigns.find((d) => d.id === id);
    if (!design) return;

    if ((window as any).__setLayers) {
      (window as any).__setLayers(design.layers);
    }
    const canvasStore = (window as any).__canvasState;
    if (canvasStore && canvasStore.setSize) {
      canvasStore.setSize(design.width, design.height);
    }
  },

  saveGeneratedDesignAsSnapshot: (id, name) => {
    const { generatedDesigns, saveSnapshot } = get();
    const design = generatedDesigns.find((d) => d.id === id);
    if (!design) return;

    const tempLayers = (window as any).__layersState;
    const tempCanvas = (window as any).__canvasState;

    (window as any).__layersState = design.layers;
    (window as any).__canvasState = {
      ...tempCanvas,
      width: design.width,
      height: design.height,
    };

    saveSnapshot(name);

    (window as any).__layersState = tempLayers;
    (window as any).__canvasState = tempCanvas;
  },

  clearGeneratedDesigns: () => {
    set({ generatedDesigns: [], selectedGeneratedDesignId: null });
  },

  getCurrentProject: () => {
    const { currentProjectId, projects } = get();
    return projects.find((p) => p.id === currentProjectId) || null;
  },
}));

export { colorPalettes };
