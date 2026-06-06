import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3X3, Ruler } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';

export const ZoomControls: React.FC = () => {
  const { zoom, zoomIn, zoomOut, resetZoom, showGrid, toggleGrid, showRulers, toggleRulers } =
    useCanvasStore();

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-surface-800/90 backdrop-blur rounded-lg border border-surface-700 p-1">
      <button
        onClick={zoomOut}
        className="p-1.5 text-surface-400 hover:text-surface-100 hover:bg-surface-700 rounded transition-colors"
        title="缩小"
      >
        <ZoomOut size={16} />
      </button>

      <div className="px-2 py-0.5 text-xs font-mono text-surface-300 min-w-[50px] text-center">
        {Math.round(zoom * 100)}%
      </div>

      <button
        onClick={zoomIn}
        className="p-1.5 text-surface-400 hover:text-surface-100 hover:bg-surface-700 rounded transition-colors"
        title="放大"
      >
        <ZoomIn size={16} />
      </button>

      <div className="w-px h-5 bg-surface-700 mx-1" />

      <button
        onClick={resetZoom}
        className="p-1.5 text-surface-400 hover:text-surface-100 hover:bg-surface-700 rounded transition-colors"
        title="适应画布"
      >
        <Maximize2 size={16} />
      </button>

      <div className="w-px h-5 bg-surface-700 mx-1" />

      <button
        onClick={toggleGrid}
        className={`p-1.5 rounded transition-colors ${
          showGrid
            ? 'text-brand-400 bg-brand-500/10'
            : 'text-surface-400 hover:text-surface-100 hover:bg-surface-700'
        }`}
        title="网格"
      >
        <Grid3X3 size={16} />
      </button>

      <button
        onClick={toggleRulers}
        className={`p-1.5 rounded transition-colors ${
          showRulers
            ? 'text-brand-400 bg-brand-500/10'
            : 'text-surface-400 hover:text-surface-100 hover:bg-surface-700'
        }`}
        title="标尺"
      >
        <Ruler size={16} />
      </button>
    </div>
  );
};
