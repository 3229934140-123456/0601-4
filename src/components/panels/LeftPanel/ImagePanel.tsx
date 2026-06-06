import React, { useState, useRef } from 'react';
import { Upload, Search } from 'lucide-react';
import { imageMaterials, imageCategories } from '@/data/materials';
import { useLayerStore, createImageLayer } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';

export const ImagePanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addLayer } = useLayerStore();
  const { width: canvasWidth, height: canvasHeight } = useCanvasStore();

  const filteredImages = imageMaterials.filter((img) => {
    const matchCategory = selectedCategory === 'all' || img.category === selectedCategory;
    const matchSearch = img.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleImageClick = (img: typeof imageMaterials[0]) => {
    const width = 250;
    const height = 250;
    const x = (canvasWidth - width) / 2;
    const y = (canvasHeight - height) / 2;
    const layer = createImageLayer(x, y, img.url, width, height);
    layer.name = img.name;
    addLayer(layer);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        const x = (canvasWidth - width) / 2;
        const y = (canvasHeight - height) / 2;
        const layer = createImageLayer(
          x,
          y,
          event.target?.result as string,
          width,
          height
        );
        layer.name = file.name;
        addLayer(layer);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="mb-3 p-4 border-2 border-dashed border-surface-700 rounded-lg cursor-pointer hover:border-brand-500/50 hover:bg-surface-800/50 transition-colors text-center"
      >
        <Upload size={20} className="mx-auto mb-2 text-surface-400" />
        <p className="text-xs text-surface-400">点击或拖拽上传图片</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          placeholder="搜索素材..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm bg-surface-800 border border-surface-700 rounded-md text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {imageCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            onClick={() => handleImageClick(img)}
            className="aspect-square rounded-md overflow-hidden cursor-pointer border border-surface-700 hover:border-brand-500/50 transition-all hover:scale-[1.02]"
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
