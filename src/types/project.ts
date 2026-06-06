import type { Layer } from './layer';
import type { CanvasState } from './canvas';

export interface GeneratedDesign {
  id: string;
  name: string;
  sizeId: string;
  width: number;
  height: number;
  layers: Layer[];
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  canvas: CanvasState;
  layers: Layer[];
  archived: boolean;
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
