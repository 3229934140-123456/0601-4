import React, { useState } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { colorPalettes } from '@/data/colorPalettes';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { generateComplementary, generateAnalogous, generateTriadic } from '@/utils/color';

export const ColorPalettePanel: React.FC = () => {
  const { favoritePalettes, toggleFavoritePalette, addFavoriteColor } = useProjectStore();
  const { setBackgroundColor } = useCanvasStore();
  const [activeColor, setActiveColor] = useState('#6366F1');

  const categories = ['全部', '暖色', '冷色', '自然', '紫色', '活泼', '中性', '科技'];

  const handleApplyColor = (color: string) => {
    setBackgroundColor(color);
  };

  const handleColorClick = (color: string) => {
    setActiveColor(color);
  };

  const generatedSchemes = [
    { name: '互补色', colors: generateComplementary(activeColor) },
    { name: '类比色', colors: generateAnalogous(activeColor) },
    { name: '三角色', colors: generateTriadic(activeColor) },
  ];

  return (
    <div className="p-3">
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          当前颜色
        </h4>
        <div className="flex items-center gap-3 p-3 bg-surface-800 rounded-lg border border-surface-700">
          <div
            className="w-12 h-12 rounded-lg border border-surface-600"
            style={{ backgroundColor: activeColor }}
          />
          <div>
            <p className="text-sm font-mono text-surface-200 uppercase">
              {activeColor}
            </p>
            <button
              onClick={() => addFavoriteColor(activeColor)}
              className="text-xs text-brand-400 hover:text-brand-300 mt-1"
            >
              添加到收藏
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
          配色方案
        </h4>
        {generatedSchemes.map((scheme) => (
          <div key={scheme.name} className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-surface-500">{scheme.name}</span>
            </div>
            <div className="flex gap-1">
              {scheme.colors.map((color, i) => (
                <button
                  key={i}
                  className="flex-1 h-8 rounded first:rounded-l-md last:rounded-r-md hover:scale-y-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorClick(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              className="px-2 py-1 text-xs rounded-full bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {colorPalettes.map((palette) => (
          <div
            key={palette.id}
            className="p-2.5 bg-surface-800 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-surface-200">
                {palette.name}
              </span>
              <button
                onClick={() => toggleFavoritePalette(palette.id)}
                className="p-0.5 text-surface-400 hover:text-accent-coral transition-colors"
              >
                {favoritePalettes.includes(palette.id) ? (
                  <Heart size={14} className="fill-accent-coral text-accent-coral" />
                ) : (
                  <HeartOff size={14} />
                )}
              </button>
            </div>
            <div className="flex gap-1">
              {palette.colors.map((color, i) => (
                <button
                  key={i}
                  className="flex-1 h-7 rounded-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    handleColorClick(color);
                    handleApplyColor(color);
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
