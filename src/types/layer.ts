export interface BaseLayer {
  id: string;
  type: 'image' | 'text' | 'shape';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  filter?: {
    brightness: number;
    contrast: number;
    saturate: number;
  };
  backgroundRemoved?: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  stroke?: {
    color: string;
    width: number;
  };
  shadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
  fill: string;
  stroke?: {
    color: string;
    width: number;
  };
  borderRadius?: number;
}

export type Layer = ImageLayer | TextLayer | ShapeLayer;

export type LayerType = Layer['type'];
