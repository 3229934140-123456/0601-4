import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showRecent?: boolean;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  showRecent = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { favoriteColors, addFavoriteColor } = useProjectStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleAddFavorite = () => {
    addFavoriteColor(value);
  };

  const presetColors = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78350f',
  ];

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <div className="text-xs text-surface-400 font-medium mb-1.5">
          {label}
        </div>
      )}
      <div
        className="flex items-center gap-2 p-2 bg-surface-800 rounded-md cursor-pointer border border-surface-700 hover:border-surface-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-6 h-6 rounded border border-surface-600 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs font-mono text-surface-300 uppercase flex-1">
          {value}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 w-56">
          <div className="mb-3">
            <input
              type="color"
              value={value}
              onChange={handleColorChange}
              className="w-full h-24 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs font-mono bg-surface-900 border border-surface-600 rounded text-surface-200 uppercase focus:outline-none focus:border-brand-500"
              maxLength={7}
            />
            <button
              onClick={handleAddFavorite}
              className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded transition-colors"
              title="添加到收藏"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="mb-3">
            <div className="text-xs text-surface-500 mb-1.5">预设颜色</div>
            <div className="grid grid-cols-12 gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-3.5 h-3.5 rounded-sm border border-surface-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onChange(color)}
                />
              ))}
            </div>
          </div>

          {showRecent && favoriteColors.length > 0 && (
            <div>
              <div className="text-xs text-surface-500 mb-1.5">收藏颜色</div>
              <div className="grid grid-cols-10 gap-1">
                {favoriteColors.slice(0, 20).map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    className="w-4 h-4 rounded-sm border border-surface-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
