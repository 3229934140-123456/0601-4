import React from 'react';
import { Type, Heading1, Heading2, Quote } from 'lucide-react';
import { useLayerStore, createTextLayer } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';

export const TextPanel: React.FC = () => {
  const { addLayer } = useLayerStore();
  const { width: canvasWidth, height: canvasHeight } = useCanvasStore();

  const textPresets = [
    {
      id: 'heading',
      name: '大标题',
      icon: Heading1,
      fontSize: 56,
      fontWeight: 700,
      content: '添加标题',
      width: 400,
      height: 80,
    },
    {
      id: 'subheading',
      name: '副标题',
      icon: Heading2,
      fontSize: 28,
      fontWeight: 600,
      content: '添加副标题文字',
      width: 350,
      height: 50,
    },
    {
      id: 'body',
      name: '正文',
      icon: Type,
      fontSize: 16,
      fontWeight: 400,
      content: '在这里输入正文内容，支持多行文字编辑。',
      width: 300,
      height: 80,
    },
    {
      id: 'quote',
      name: '引言',
      icon: Quote,
      fontSize: 24,
      fontWeight: 500,
      content: '"创意是解决问题的艺术。"',
      width: 350,
      height: 60,
    },
  ];

  const handleAddText = (preset: typeof textPresets[0]) => {
    const x = (canvasWidth - preset.width) / 2;
    const y = (canvasHeight - preset.height) / 2;
    const layer = createTextLayer(x, y, preset.content);
    layer.name = preset.name;
    layer.fontSize = preset.fontSize;
    layer.fontWeight = preset.fontWeight;
    layer.width = preset.width;
    layer.height = preset.height;
    layer.color = '#18181b';
    addLayer(layer);
  };

  const fonts = [
    { name: 'Inter', family: 'Inter' },
    { name: 'Space Grotesk', family: 'Space Grotesk' },
    { name: 'Georgia', family: 'Georgia' },
    { name: 'Arial Black', family: 'Arial Black' },
    { name: 'Courier New', family: 'Courier New' },
  ];

  return (
    <div className="p-3">
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          文字样式
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {textPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddText(preset)}
              className="p-3 bg-surface-800 rounded-lg border border-surface-700 hover:border-brand-500/50 hover:bg-surface-700/50 transition-all text-left group"
            >
              <preset.icon
                size={18}
                className="text-surface-400 group-hover:text-brand-400 mb-2 transition-colors"
              />
              <p className="text-sm font-medium text-surface-200">
                {preset.name}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                {preset.fontSize}px
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          字体
        </h4>
        <div className="space-y-1">
          {fonts.map((font) => (
            <div
              key={font.name}
              className="px-3 py-2 bg-surface-800 rounded-md border border-surface-700 hover:border-surface-600 cursor-pointer transition-colors"
              style={{ fontFamily: font.family }}
            >
              <span className="text-sm text-surface-200">{font.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
