import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useLayerStore } from '@/store/layerStore';
import type { Layer } from '@/types/layer';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    selectedLayerIds,
    selectLayer,
    toggleVisibility,
    toggleLock,
    removeLayer,
    duplicateLayer,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    renameLayer,
  } = useLayerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const filteredLayers = sortedLayers.filter((layer) =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'text':
        return <Type size={14} />;
      case 'image':
        return <ImageIcon size={14} />;
      case 'shape':
        return <Square size={14} />;
      default:
        return <Square size={14} />;
    }
  };

  const handleDoubleClick = (layer: Layer) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      renameLayer(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleSelect = (e: React.MouseEvent, id: string) => {
    const multiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    selectLayer(id, multiSelect);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-surface-700">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            placeholder="搜索图层..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded-md text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-surface-700">
        <button
          onClick={() => bringToFront(selectedLayerIds[0])}
          disabled={selectedLayerIds.length === 0}
          className="p-1 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="置于顶层"
        >
          <ChevronsUp size={14} />
        </button>
        <button
          onClick={() => bringForward(selectedLayerIds[0])}
          disabled={selectedLayerIds.length === 0}
          className="p-1 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="上移一层"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => sendBackward(selectedLayerIds[0])}
          disabled={selectedLayerIds.length === 0}
          className="p-1 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="下移一层"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={() => sendToBack(selectedLayerIds[0])}
          disabled={selectedLayerIds.length === 0}
          className="p-1 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="置于底层"
        >
          <ChevronsDown size={14} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => duplicateLayer(selectedLayerIds[0])}
          disabled={selectedLayerIds.length === 0}
          className="p-1 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="复制图层"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => removeLayer(selectedLayerIds[0])}
          disabled={selectedLayerIds.length === 0}
          className="p-1 text-surface-400 hover:text-accent-coral hover:bg-surface-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="删除图层"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {filteredLayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-surface-500">
            <Plus size={24} className="mb-2 opacity-50" />
            <p className="text-xs">暂无图层</p>
            <p className="text-[10px] mt-1">从左侧添加元素开始设计</p>
          </div>
        ) : (
          filteredLayers.map((layer) => (
            <div
              key={layer.id}
              onClick={(e) => handleSelect(e, layer.id)}
              onDoubleClick={() => handleDoubleClick(layer)}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer group transition-colors ${
                selectedLayerIds.includes(layer.id)
                  ? 'bg-brand-500/20 text-brand-300'
                  : 'text-surface-300 hover:bg-surface-800/50'
              } ${!layer.visible ? 'opacity-50' : ''}`}
            >
              <div className="w-6 h-6 flex items-center justify-center text-surface-400">
                {getLayerIcon(layer.type)}
              </div>

              {editingId === layer.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRenameSubmit(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(layer.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 text-xs bg-surface-700 border border-brand-500 rounded px-1.5 py-0.5 outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-xs truncate">{layer.name}</span>
              )}

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  className="p-0.5 text-surface-400 hover:text-surface-200 rounded"
                  title={layer.visible ? '隐藏' : '显示'}
                >
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer.id);
                  }}
                  className="p-0.5 text-surface-400 hover:text-surface-200 rounded"
                  title={layer.locked ? '解锁' : '锁定'}
                >
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-2 py-2 border-t border-surface-700 text-[10px] text-surface-500">
        共 {layers.length} 个图层
      </div>
    </div>
  );
};
