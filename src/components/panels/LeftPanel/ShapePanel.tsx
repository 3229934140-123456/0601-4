import React from 'react';
import { shapePresets } from '@/data/materials';
import { useLayerStore, createShapeLayer } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';
import { Square, Circle, Triangle, Minus } from 'lucide-react';

export const ShapePanel: React.FC = () => {
  const { addLayer } = useLayerStore();
  const { width: canvasWidth, height: canvasHeight } = useCanvasStore();

  const shapeIcons: Record<string, React.ReactNode> = {
    rectangle: <Square size={20} />,
    circle: <Circle size={20} />,
    triangle: <Triangle size={20} />,
    line: <Minus size={20} />,
  };

  const colors = [
    '#6366F1', '#06B6D4', '#F43F5E', '#F59E0B',
    '#10B981', '#8B5CF6', '#EC4899', '#18181b',
  ];

  const handleAddShape = (shape: typeof shapePresets[0], color: string) => {
    const x = (canvasWidth - shape.defaultWidth) / 2;
    const y = (canvasHeight - shape.defaultHeight) / 2;
    const layer = createShapeLayer(x, y, shape.type, shape.defaultWidth, shape.defaultHeight);
    layer.fill = color;
    addLayer(layer);
  };

  return (
    <div className="p-3">
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          基础形状
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {shapePresets.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleAddShape(shape, '#6366F1')}
              className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-surface-800 rounded-lg border border-surface-700 hover:border-brand-500/50 hover:bg-surface-700/50 transition-all text-surface-300 hover:text-brand-400"
            >
              {shapeIcons[shape.type]}
              <span className="text-[10px]">{shape.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          快速颜色
        </h4>
        <div className="grid grid-cols-8 gap-1.5">
          {colors.map((color) => (
            <button
              key={color}
              className="aspect-square rounded-md border border-surface-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-surface-800/50 rounded-lg border border-surface-700">
        <p className="text-xs text-surface-400 text-center">
          点击形状添加到画布
        </p>
        <p className="text-[10px] text-surface-500 text-center mt-1">
          可在右侧面板调整样式
        </p>
      </div>
    </div>
  );
};
