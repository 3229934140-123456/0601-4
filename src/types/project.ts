import type { Layer } from './layer';
import type { CanvasState } from './canvas';

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  filename: string;
}

export interface GeneratedDesign {
  id: string;
  name: string;
  sizeId: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: Layer[];
  thumbnail?: string;
  note?: string;
  selectedLayerId: string | null;
  parentId?: string;
  exportSettings: ExportSettings;
  createdAt: number;
  updatedAt: number;
}

export interface SaveRecord {
  id: string;
  timestamp: number;
  type: 'auto' | 'manual';
}

export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  tags: string[];
  folder?: string;
  createdAt: number;
  updatedAt: number;
  canvas: CanvasState;
  layers: Layer[];
  generatedDesigns: GeneratedDesign[];
  saveRecords: SaveRecord[];
  archived: boolean;
  starred: boolean;
  lastOpenedAt?: number;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: number;
  layers: Layer[];
  canvas: CanvasState;
  thumbnail?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  layers: Layer[];
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  category: string;
}

export interface ExportConfig {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  scale: number;
  sizes: { id: string; name: string; width: number; height: number }[];
}
