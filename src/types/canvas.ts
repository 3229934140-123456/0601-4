export interface CanvasSize {
  id: string;
  name: string;
  width: number;
  height: number;
  platform: string;
  category: 'social' | 'poster' | 'ad' | 'custom';
}

export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  backgroundColor: string;
  backgroundImage?: string;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
}

export interface GuideLine {
  type: 'horizontal' | 'vertical';
  position: number;
}
