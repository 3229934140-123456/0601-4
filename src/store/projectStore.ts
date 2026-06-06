import { create } from 'zustand';
import type { Project, VersionSnapshot, ColorPalette, GeneratedDesign, SaveRecord } from '@/types/project';
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
  selectedDesignIds: string[];
  isDirty: boolean;
  savedLayers: Layer[] | null;
  savedCanvas: CanvasState | null;

  setShowExportModal: (show: boolean) => void;
  setShowProjectPanel: (show: boolean) => void;
  setShowGenerationCenter: (show: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  updateSavedState: () => void;
  checkIsDirty: () => void;

  createNewProject: (name: string, width: number, height: number) => string;
  createProjectFromTemplate: (templateId: string) => string;
  saveProject: (type?: 'auto' | 'manual') => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  unarchiveProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  toggleStarProject: (id: string) => void;
  setProjectTags: (id: string, tags: string[]) => void;
  setProjectFolder: (id: string, folder: string | undefined) => void;
  getAllFolders: () => string[];
  getAllTags: () => string[];

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
  toggleSelectDesign: (id: string) => void;
  selectAllDesigns: () => void;
  deselectAllDesigns: () => void;
  updateGeneratedDesign: (id: string, updates: Partial<GeneratedDesign>) => void;
  deleteGeneratedDesign: (id: string) => void;
  applyGeneratedDesignToCanvas: (id: string) => void;
  saveGeneratedDesignAsSnapshot: (id: string, name: string) => void;
  clearGeneratedDesigns: () => void;
  duplicateGeneratedDesign: (id: string) => void;
  selectGeneratedDesignLayer: (designId: string, layerId: string | null) => void;
  updateGeneratedDesignLayer: (designId: string, layerId: string, updates: Partial<Layer>) => void;
  saveGeneratedDesignsToProject: () => void;

  getCurrentProject: () => Project | null;
  getLastSaveRecord: () => SaveRecord | null;
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
  selectedDesignIds: [],
  isDirty: false,
  savedLayers: null,
  savedCanvas: null,

  setShowExportModal: (show) => set({ showExportModal: show }),
  setShowProjectPanel: (show) => set({ showProjectPanel: show }),
  setShowGenerationCenter: (show) => set({ showGenerationCenter: show }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  updateSavedState: () => {
    const canvasState = (window as any).__canvasState as CanvasState | undefined;
    const layersState = (window as any).__layersState as Layer[] | undefined;
    if (canvasState && layersState) {
      set({
        savedLayers: JSON.parse(JSON.stringify(layersState)),
        savedCanvas: JSON.parse(JSON.stringify(canvasState)),
        isDirty: false,
      });
    }
  },

  checkIsDirty: () => {
    const { savedLayers, savedCanvas } = get();
    if (!savedLayers || !savedCanvas) {
      set({ isDirty: true });
      return;
    }

    const canvasState = (window as any).__canvasState as CanvasState | undefined;
    const layersState = (window as any).__layersState as Layer[] | undefined;

    if (!canvasState || !layersState) {
      set({ isDirty: false });
      return;
    }

    const layersChanged = JSON.stringify(savedLayers) !== JSON.stringify(layersState);
    const canvasChanged =
      savedCanvas.width !== canvasState.width ||
      savedCanvas.height !== canvasState.height ||
      savedCanvas.backgroundColor !== canvasState.backgroundColor;

    set({ isDirty: layersChanged || canvasChanged });
  },

  createNewProject: (name, width, height) => {
    const { projects } = get();
    const newProject: Project = {
      id: generateId(),
      name,
      tags: [],
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
      generatedDesigns: [],
      saveRecords: [],
      archived: false,
      starred: false,
    };
    const newProjects = [newProject, ...projects];
    saveToStorage(newProjects);
    set({
      projects: newProjects,
      currentProjectId: newProject.id,
      versionSnapshots: [],
      generatedDesigns: [],
      selectedDesignIds: [],
      isDirty: false,
    });
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
      tags: [],
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
      generatedDesigns: [],
      saveRecords: [],
      archived: false,
      starred: false,
    };

    const newProjects = [newProject, ...projects];
    saveToStorage(newProjects);
    set({
      projects: newProjects,
      currentProjectId: newProject.id,
      versionSnapshots: [],
      generatedDesigns: [],
      selectedDesignIds: [],
      isDirty: false,
    });
    return newProject.id;
  },

  saveProject: (type = 'manual') => {
    const { currentProjectId, projects, generatedDesigns, updateSavedState } = get();
    if (!currentProjectId) return;

    const canvasState = (window as any).__canvasState;
    const layersState = (window as any).__layersState;

    const newRecord = {
      id: `save-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type,
    };

    const updatedProjects = projects.map((p) => {
      if (p.id !== currentProjectId) return p;
      const saveRecords = [...(p.saveRecords || []), newRecord].slice(-10);
      return {
        ...p,
        updatedAt: Date.now(),
        canvas: canvasState || p.canvas,
        layers: layersState || p.layers,
        generatedDesigns: generatedDesigns || p.generatedDesigns || [],
        saveRecords,
      };
    });

    saveToStorage(updatedProjects);
    set({ projects: updatedProjects });
    updateSavedState();
  },

  loadProject: (id) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === id);
    if (project) {
      const updatedProjects = projects.map((p) =>
        p.id === id ? { ...p, lastOpenedAt: Date.now() } : p
      );
      saveToStorage(updatedProjects);
      set({
        currentProjectId: id,
        versionSnapshots: [],
        projects: updatedProjects,
        isDirty: false,
        generatedDesigns: project.generatedDesigns || [],
        selectedDesignIds: [],
        selectedGeneratedDesignId: (project.generatedDesigns || []).length > 0
          ? project.generatedDesigns![0].id
          : null,
      });
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

  toggleStarProject: (id) => {
    const { projects } = get();
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, starred: !p.starred, updatedAt: Date.now() } : p
    );
    saveToStorage(newProjects);
    set({ projects: newProjects });
  },

  setProjectTags: (id, tags) => {
    const { projects } = get();
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, tags, updatedAt: Date.now() } : p
    );
    saveToStorage(newProjects);
    set({ projects: newProjects });
  },

  setProjectFolder: (id, folder) => {
    const { projects } = get();
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, folder, updatedAt: Date.now() } : p
    );
    saveToStorage(newProjects);
    set({ projects: newProjects });
  },

  getAllFolders: () => {
    const { projects } = get();
    const folders = new Set<string>();
    projects.forEach((p) => {
      if (p.folder) folders.add(p.folder);
    });
    return Array.from(folders).sort();
  },

  getAllTags: () => {
    const { projects } = get();
    const tags = new Set<string>();
    projects.forEach((p) => {
      p.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
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
        backgroundColor: canvasState.backgroundColor,
        layers: scaledLayers,
        selectedLayerId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }).filter(Boolean) as GeneratedDesign[];

    set({
      generatedDesigns: newDesigns,
      selectedGeneratedDesignId: newDesigns.length > 0 ? newDesigns[0].id : null,
      selectedDesignIds: newDesigns.map((d) => d.id),
    });
  },

  selectGeneratedDesign: (id) => {
    set({ selectedGeneratedDesignId: id });
  },

  toggleSelectDesign: (id) => {
    const { selectedDesignIds } = get();
    const newSelected = selectedDesignIds.includes(id)
      ? selectedDesignIds.filter((i) => i !== id)
      : [...selectedDesignIds, id];
    set({
      selectedDesignIds: newSelected,
      selectedGeneratedDesignId: newSelected.length > 0 ? id : null,
    });
  },

  selectAllDesigns: () => {
    const { generatedDesigns } = get();
    set({ selectedDesignIds: generatedDesigns.map((d) => d.id) });
  },

  deselectAllDesigns: () => {
    set({ selectedDesignIds: [] });
  },

  updateGeneratedDesign: (id, updates) => {
    const { generatedDesigns } = get();
    const updatedDesigns = generatedDesigns.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
    );
    set({ generatedDesigns: updatedDesigns });
  },

  deleteGeneratedDesign: (id) => {
    const { generatedDesigns, selectedGeneratedDesignId, selectedDesignIds } = get();
    const newDesigns = generatedDesigns.filter((d) => d.id !== id);
    const newSelectedIds = selectedDesignIds.filter((i) => i !== id);
    set({
      generatedDesigns: newDesigns,
      selectedDesignIds: newSelectedIds,
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
    if (canvasStore && canvasStore.setBackgroundColor) {
      canvasStore.setBackgroundColor(design.backgroundColor);
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
      backgroundColor: design.backgroundColor,
    };

    saveSnapshot(name);

    (window as any).__layersState = tempLayers;
    (window as any).__canvasState = tempCanvas;
  },

  clearGeneratedDesigns: () => {
    set({ generatedDesigns: [], selectedGeneratedDesignId: null, selectedDesignIds: [] });
  },

  duplicateGeneratedDesign: (id) => {
    const { generatedDesigns } = get();
    const design = generatedDesigns.find((d) => d.id === id);
    if (!design) return;

    const newDesign: GeneratedDesign = {
      ...design,
      id: generateDesignId(),
      name: `${design.name} 副本`,
      layers: JSON.parse(JSON.stringify(design.layers)),
      selectedLayerId: null,
      parentId: design.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newDesigns = [...generatedDesigns, newDesign];
    set({
      generatedDesigns: newDesigns,
      selectedGeneratedDesignId: newDesign.id,
      selectedDesignIds: [...new Set([...newDesigns.map((d) => d.id), newDesign.id])],
    });
  },

  selectGeneratedDesignLayer: (designId, layerId) => {
    const { generatedDesigns } = get();
    const updatedDesigns = generatedDesigns.map((d) =>
      d.id === designId ? { ...d, selectedLayerId: layerId } : d
    );
    set({ generatedDesigns: updatedDesigns });
  },

  updateGeneratedDesignLayer: (designId, layerId, updates) => {
    const { generatedDesigns } = get();
    const updatedDesigns = generatedDesigns.map((d) => {
      if (d.id !== designId) return d;
      const updatedLayers = d.layers.map((l) =>
        l.id === layerId ? ({ ...l, ...updates } as Layer) : l
      );
      return { ...d, layers: updatedLayers, updatedAt: Date.now() };
    });
    set({ generatedDesigns: updatedDesigns });
  },

  saveGeneratedDesignsToProject: () => {
    const { saveProject } = get();
    saveProject('manual');
  },

  getCurrentProject: () => {
    const { currentProjectId, projects } = get();
    return projects.find((p) => p.id === currentProjectId) || null;
  },

  getLastSaveRecord: () => {
    const { currentProjectId, projects } = get();
    const project = projects.find((p) => p.id === currentProjectId);
    if (!project?.saveRecords || project.saveRecords.length === 0) return null;
    return project.saveRecords[project.saveRecords.length - 1];
  },
}));

export { colorPalettes };
