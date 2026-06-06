import React, { useState } from 'react';
import { templates, templateCategories } from '@/data/templates';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import type { Layer } from '@/types/layer';

export const TemplatePanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { createProjectFromTemplate, setShowProjectPanel } = useProjectStore();
  const { setSize, setBackgroundColor } = useCanvasStore();
  const { setLayers } = useLayerStore();

  const filteredTemplates = templates.filter((t) => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSize(template.canvas.width, template.canvas.height);
    setBackgroundColor(template.canvas.backgroundColor);
    const layers = template.layers.map((layer, index) => ({
      ...layer,
      zIndex: index + 1,
    })) as Layer[];
    setLayers(layers);
  };

  return (
    <div className="p-3">
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm bg-surface-800 border border-surface-700 rounded-md text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {templateCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleUseTemplate(template.id)}
            className="template-card cursor-pointer rounded-lg overflow-hidden border border-surface-700 hover:border-brand-500/50"
          >
            <div
              className="aspect-square relative"
              style={{ backgroundColor: template.canvas.backgroundColor }}
            >
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-500 text-xs">
                  空白模板
                </div>
              )}
            </div>
            <div className="p-2 bg-surface-800">
              <p className="text-xs text-surface-200 font-medium truncate">
                {template.name}
              </p>
              <p className="text-[10px] text-surface-500 mt-0.5">
                {template.canvas.width} × {template.canvas.height}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
