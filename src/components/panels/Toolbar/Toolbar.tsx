import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  Save,
  History,
  Sparkles,
  ChevronDown,
  Maximize2,
  Layers,
} from 'lucide-react';
import { useLayerStore } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useProjectStore } from '@/store/projectStore';
import { canvasSizes } from '@/data/canvasSizes';
import type { CanvasSize } from '@/types/canvas';
import { Button } from '@/components/common/Button';

export const Toolbar: React.FC = () => {
  const { undo, redo, historyIndex, history } = useLayerStore();
  const { width, height, setSize } = useCanvasStore();
  const {
    setShowExportModal,
    setShowProjectPanel,
    saveProject,
    saveSnapshot,
    setShowGenerationCenter,
    getCurrentProject,
    isDirty,
    currentProjectId,
  } = useProjectStore();
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const currentProject = getCurrentProject();

  const socialSizes = canvasSizes.filter((s) => s.category === 'social');
  const posterSizes = canvasSizes.filter((s) => s.category === 'poster');
  const adSizes = canvasSizes.filter((s) => s.category === 'ad');

  const handleSizeChange = (size: CanvasSize) => {
    setSize(size.width, size.height);
    setShowSizeMenu(false);
  };

  const handleSaveSnapshot = () => {
    const name = prompt('输入版本名称:', `版本 ${Date.now()}`);
    if (name) {
      saveSnapshot(name);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-12 flex items-center justify-between px-4 bg-surface-900 border-b border-surface-700">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold font-display text-surface-100 leading-tight">
              Design Studio
            </span>
            {currentProject && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-surface-400 truncate max-w-[120px]">
                  {currentProject.name}
                </span>
                {isDirty ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-coral flex-shrink-0" title="未保存" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="已保存" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-surface-700 mx-2" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowProjectPanel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-surface-100 hover:bg-surface-800 rounded-md transition-colors"
          >
            <FolderOpen size={14} />
            <span>项目</span>
          </button>

          <button
            onClick={saveProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-surface-100 hover:bg-surface-800 rounded-md transition-colors"
          >
            <Save size={14} />
            <span>保存</span>
          </button>

          <button
            onClick={handleSaveSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-surface-100 hover:bg-surface-800 rounded-md transition-colors"
          >
            <History size={14} />
            <span>快照</span>
          </button>
        </div>

        <div className="w-px h-5 bg-surface-700 mx-1" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo
                ? 'text-surface-400 hover:text-surface-100 hover:bg-surface-800'
                : 'text-surface-700 cursor-not-allowed'
            }`}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo
                ? 'text-surface-400 hover:text-surface-100 hover:bg-surface-800'
                : 'text-surface-700 cursor-not-allowed'
            }`}
            title="重做 (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:text-surface-100 hover:bg-surface-800 rounded-md border border-surface-700 transition-colors"
          >
            <Maximize2 size={14} />
            <span className="font-mono">
              {width} × {height}
            </span>
            <ChevronDown size={12} />
          </button>

          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
              <SizeGroup
                title="社交媒体"
                sizes={socialSizes}
                onSelect={handleSizeChange}
              />
              <SizeGroup
                title="海报"
                sizes={posterSizes}
                onSelect={handleSizeChange}
              />
              <SizeGroup
                title="广告"
                sizes={adSizes}
                onSelect={handleSizeChange}
              />
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Sparkles size={14} />}
          onClick={() => setShowGenerationCenter(true)}
        >
          多平台
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Download size={14} />}
          onClick={() => setShowExportModal(true)}
        >
          导出
        </Button>
      </div>
    </div>
  );
};

interface SizeGroupProps {
  title: string;
  sizes: CanvasSize[];
  onSelect: (size: CanvasSize) => void;
}

const SizeGroup: React.FC<SizeGroupProps> = ({ title, sizes, onSelect }) => {
  if (sizes.length === 0) return null;

  return (
    <div>
      <div className="px-3 py-1.5 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">
        {title}
      </div>
      {sizes.map((size) => (
        <button
          key={size.id}
          onClick={() => onSelect(size)}
          className="w-full px-3 py-2 text-left text-xs text-surface-300 hover:bg-surface-700/50 hover:text-surface-100 transition-colors flex items-center justify-between"
        >
          <span>{size.name}</span>
          <span className="text-surface-500 font-mono text-[10px]">
            {size.width} × {size.height}
          </span>
        </button>
      ))}
    </div>
  );
};
