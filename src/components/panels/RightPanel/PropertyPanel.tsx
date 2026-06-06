import React from 'react';
import { useLayerStore } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';
import { ColorPicker } from '@/components/common/ColorPicker';
import { Slider } from '@/components/common/Slider';
import type { TextLayer, ImageLayer, ShapeLayer } from '@/types/layer';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';

export const PropertyPanel: React.FC = () => {
  const { layers, selectedLayerIds, updateLayer } = useLayerStore();
  const { backgroundColor, setBackgroundColor } = useCanvasStore();

  const selectedLayer = selectedLayerIds.length === 1
    ? layers.find((l) => l.id === selectedLayerIds[0])
    : null;

  if (!selectedLayer) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
            画布设置
          </h4>
          <ColorPicker
            value={backgroundColor}
            onChange={setBackgroundColor}
            label="背景颜色"
          />
        </div>

        <div className="text-center py-12 text-surface-500">
          <p className="text-xs">选择一个元素</p>
          <p className="text-[10px] mt-1">以编辑其属性</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateLayer(selectedLayer.id, updates);
  };

  return (
    <div className="p-3 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          位置和大小
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">X</label>
            <input
              type="number"
              value={Math.round(selectedLayer.x)}
              onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
              className="number-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">Y</label>
            <input
              type="number"
              value={Math.round(selectedLayer.y)}
              onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
              className="number-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">宽度</label>
            <input
              type="number"
              value={Math.round(selectedLayer.width)}
              onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
              className="number-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">高度</label>
            <input
              type="number"
              value={Math.round(selectedLayer.height)}
              onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
              className="number-input w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <Slider
          label="不透明度"
          value={Math.round(selectedLayer.opacity * 100)}
          onChange={(val) => handleUpdate({ opacity: val / 100 })}
          min={0}
          max={100}
          unit="%"
        />
      </div>

      <div>
        <Slider
          label="旋转"
          value={Math.round(selectedLayer.rotation)}
          onChange={(val) => handleUpdate({ rotation: val })}
          min={-180}
          max={180}
          unit="°"
        />
      </div>

      {selectedLayer.type === 'text' && (
        <TextProperties
          layer={selectedLayer as TextLayer}
          onUpdate={handleUpdate}
        />
      )}

      {selectedLayer.type === 'image' && (
        <ImageProperties
          layer={selectedLayer as ImageLayer}
          onUpdate={handleUpdate}
        />
      )}

      {selectedLayer.type === 'shape' && (
        <ShapeProperties
          layer={selectedLayer as ShapeLayer}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

interface TextPropertiesProps {
  layer: TextLayer;
  onUpdate: (updates: Record<string, unknown>) => void;
}

const TextProperties: React.FC<TextPropertiesProps> = ({ layer, onUpdate }) => {
  const fonts = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Space Grotesk', value: 'Space Grotesk' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Courier New', value: 'Courier New' },
  ];

  return (
    <>
      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          文字样式
        </h4>

        <div className="mb-3">
          <label className="text-[10px] text-surface-500 block mb-1">字体</label>
          <select
            value={layer.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500"
          >
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">字号</label>
            <input
              type="number"
              value={layer.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="number-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">字重</label>
            <select
              value={layer.fontWeight}
              onChange={(e) => onUpdate({ fontWeight: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500"
            >
              <option value={300}>细体</option>
              <option value={400}>常规</option>
              <option value={500}>中等</option>
              <option value={600}>半粗</option>
              <option value={700}>粗体</option>
            </select>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {[
            { align: 'left', icon: AlignLeft },
            { align: 'center', icon: AlignCenter },
            { align: 'right', icon: AlignRight },
          ].map(({ align, icon: Icon }) => (
            <button
              key={align}
              onClick={() => onUpdate({ textAlign: align })}
              className={`flex-1 p-1.5 rounded transition-colors ${
                layer.textAlign === align
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
              }`}
            >
              <Icon size={14} className="mx-auto" />
            </button>
          ))}
        </div>

        <ColorPicker
          value={layer.color}
          onChange={(color) => onUpdate({ color })}
          label="文字颜色"
        />
      </div>

      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          间距
        </h4>
        <Slider
          label="行高"
          value={Math.round(layer.lineHeight * 100)}
          onChange={(val) => onUpdate({ lineHeight: val / 100 })}
          min={80}
          max={200}
          unit="%"
        />
        <div className="mt-2">
          <Slider
            label="字间距"
            value={layer.letterSpacing}
            onChange={(val) => onUpdate({ letterSpacing: val })}
            min={-5}
            max={20}
            unit="px"
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          描边
        </h4>
        <ColorPicker
          value={layer.stroke?.color || '#000000'}
          onChange={(color) =>
            onUpdate({
              stroke: { color, width: layer.stroke?.width || 1 },
            })
          }
          label="描边颜色"
        />
        <div className="mt-2">
          <Slider
            label="描边宽度"
            value={layer.stroke?.width || 0}
            onChange={(val) =>
              onUpdate({
                stroke: { color: layer.stroke?.color || '#000000', width: val },
              })
            }
            min={0}
            max={20}
            unit="px"
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          阴影
        </h4>
        <ColorPicker
          value={layer.shadow?.color || 'rgba(0,0,0,0.5)'}
          onChange={(color) =>
            onUpdate({
              shadow: {
                color,
                offsetX: layer.shadow?.offsetX || 0,
                offsetY: layer.shadow?.offsetY || 4,
                blur: layer.shadow?.blur || 8,
              },
            })
          }
          label="阴影颜色"
        />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">X偏移</label>
            <input
              type="number"
              value={layer.shadow?.offsetX || 0}
              onChange={(e) =>
                onUpdate({
                  shadow: {
                    ...(layer.shadow || { color: 'rgba(0,0,0,0.5)', offsetX: 0, offsetY: 4, blur: 8 }),
                    offsetX: Number(e.target.value),
                  },
                })
              }
              className="number-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">Y偏移</label>
            <input
              type="number"
              value={layer.shadow?.offsetY || 0}
              onChange={(e) =>
                onUpdate({
                  shadow: {
                    ...(layer.shadow || { color: 'rgba(0,0,0,0.5)', offsetX: 0, offsetY: 4, blur: 8 }),
                    offsetY: Number(e.target.value),
                  },
                })
              }
              className="number-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-surface-500 block mb-1">模糊</label>
            <input
              type="number"
              value={layer.shadow?.blur || 0}
              onChange={(e) =>
                onUpdate({
                  shadow: {
                    ...(layer.shadow || { color: 'rgba(0,0,0,0.5)', offsetX: 0, offsetY: 4, blur: 8 }),
                    blur: Number(e.target.value),
                  },
                })
              }
              className="number-input w-full"
            />
          </div>
        </div>
      </div>
    </>
  );
};

interface ImagePropertiesProps {
  layer: ImageLayer;
  onUpdate: (updates: Record<string, unknown>) => void;
}

const ImageProperties: React.FC<ImagePropertiesProps> = ({ layer, onUpdate }) => {
  const filter = layer.filter || { brightness: 100, contrast: 100, saturate: 100 };

  const handleFilterChange = (key: keyof typeof filter, value: number) => {
    onUpdate({
      filter: { ...filter, [key]: value },
    });
  };

  return (
    <div>
      <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
        图片滤镜
      </h4>
      <div className="space-y-3">
        <Slider
          label="亮度"
          value={filter.brightness}
          onChange={(v) => handleFilterChange('brightness', v)}
          min={0}
          max={200}
          unit="%"
        />
        <Slider
          label="对比度"
          value={filter.contrast}
          onChange={(v) => handleFilterChange('contrast', v)}
          min={0}
          max={200}
          unit="%"
        />
        <Slider
          label="饱和度"
          value={filter.saturate}
          onChange={(v) => handleFilterChange('saturate', v)}
          min={0}
          max={200}
          unit="%"
        />
      </div>

      <div className="mt-4 p-3 bg-surface-800/50 rounded-lg border border-surface-700">
        <p className="text-xs text-surface-400 text-center">
          背景移除功能
        </p>
        <button
          className="w-full mt-2 px-3 py-1.5 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-500 transition-colors"
          onClick={() => onUpdate({ backgroundRemoved: !layer.backgroundRemoved })}
        >
          {layer.backgroundRemoved ? '恢复背景' : '移除背景'}
        </button>
      </div>
    </div>
  );
};

interface ShapePropertiesProps {
  layer: ShapeLayer;
  onUpdate: (updates: Record<string, unknown>) => void;
}

const ShapeProperties: React.FC<ShapePropertiesProps> = ({ layer, onUpdate }) => {
  return (
    <>
      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          填充
        </h4>
        <ColorPicker
          value={layer.fill}
          onChange={(color) => onUpdate({ fill: color })}
          label="填充颜色"
        />
      </div>

      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          描边
        </h4>
        <ColorPicker
          value={layer.stroke?.color || '#000000'}
          onChange={(color) =>
            onUpdate({
              stroke: { color, width: layer.stroke?.width || 1 },
            })
          }
          label="描边颜色"
          showRecent={false}
        />
        <div className="mt-2">
          <Slider
            label="描边宽度"
            value={layer.stroke?.width || 0}
            onChange={(val) =>
              onUpdate({
                stroke: {
                  color: layer.stroke?.color || '#000000',
                  width: val,
                },
              })
            }
            min={0}
            max={50}
            unit="px"
          />
        </div>
      </div>

      {layer.shapeType === 'rectangle' && (
        <div>
          <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
            圆角
          </h4>
          <Slider
            value={layer.borderRadius || 0}
            onChange={(val) => onUpdate({ borderRadius: val })}
            min={0}
            max={100}
            unit="px"
          />
        </div>
      )}
    </>
  );
};
