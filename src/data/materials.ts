export interface MaterialImage {
  id: string;
  name: string;
  url: string;
  category: string;
  hasTransparent?: boolean;
}

export const imageMaterials: MaterialImage[] = [
  {
    id: 'img-1',
    name: '抽象渐变',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
    category: '抽象',
  },
  {
    id: 'img-2',
    name: '霓虹光晕',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=600&fit=crop',
    category: '抽象',
  },
  {
    id: 'img-3',
    name: '几何图形',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=600&fit=crop',
    category: '几何',
  },
  {
    id: 'img-4',
    name: '山脉风景',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    category: '自然',
  },
  {
    id: 'img-5',
    name: '城市夜景',
    url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=600&h=400&fit=crop',
    category: '城市',
  },
  {
    id: 'img-6',
    name: '咖啡杯',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop',
    category: '物品',
  },
  {
    id: 'img-7',
    name: '植物叶子',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=600&fit=crop',
    category: '自然',
  },
  {
    id: 'img-8',
    name: '科技感背景',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=600&fit=crop',
    category: '科技',
  },
  {
    id: 'img-9',
    name: '沙漠日落',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&h=400&fit=crop',
    category: '自然',
  },
  {
    id: 'img-10',
    name: '建筑线条',
    url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=600&fit=crop',
    category: '建筑',
  },
];

export const imageCategories = [
  { id: 'all', name: '全部' },
  { id: '抽象', name: '抽象' },
  { id: '几何', name: '几何' },
  { id: '自然', name: '自然' },
  { id: '城市', name: '城市' },
  { id: '物品', name: '物品' },
  { id: '科技', name: '科技' },
  { id: '建筑', name: '建筑' },
];

export interface ShapePreset {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'line';
  defaultWidth: number;
  defaultHeight: number;
}

export const shapePresets: ShapePreset[] = [
  { id: 'rect', name: '矩形', type: 'rectangle', defaultWidth: 200, defaultHeight: 150 },
  { id: 'circle', name: '圆形', type: 'circle', defaultWidth: 150, defaultHeight: 150 },
  { id: 'square', name: '正方形', type: 'rectangle', defaultWidth: 150, defaultHeight: 150 },
  { id: 'triangle', name: '三角形', type: 'triangle', defaultWidth: 150, defaultHeight: 150 },
  { id: 'line-h', name: '横线', type: 'line', defaultWidth: 200, defaultHeight: 4 },
  { id: 'line-v', name: '竖线', type: 'line', defaultWidth: 4, defaultHeight: 200 },
];
