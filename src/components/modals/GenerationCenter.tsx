import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Edit3,
  Download,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Megaphone,
  FileText,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import { canvasSizes } from '@/data/canvasSizes';
import type { CanvasSize } from '@/types/canvas';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export const GenerationCenter: React.FC = () => {
  const {
    showGenerationCenter,
    setShowGenerationCenter,
    generatedDesigns,
    selectedGeneratedDesignId,
    generateDesigns,
    selectGeneratedDesign,
    deleteGeneratedDesign,
    applyGeneratedDesignToCanvas,
    saveGeneratedDesignAsSnapshot,
    clearGeneratedDesigns,
  } = useProjectStore();

  const { width: currentWidth, height: currentHeight } = useCanvasStore();
  const { layers } = useLayerStore();

  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([
    'instagram-post',
    'xiaohongshu',
    'youtube-thumbnail',
  ]);

  const socialSizes = canvasSizes.filter((s) => s.category === 'social');
  const posterSizes = canvasSizes.filter((s) => s.category === 'poster');
  const adSizes = canvasSizes.filter((s) => s.category === 'ad');

  const selectedDesign = useMemo(
    () => generatedDesigns.find((d) => d.id === selectedGeneratedDesignId) || null,
    [generatedDesigns, selectedGeneratedDesignId]
  );

  const toggleSize = (sizeId: string) => {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const handleGenerate = () => {
    if (selectedSizeIds.length === 0) return;
    generateDesigns(selectedSizeIds);
  };

  const handleApply = () => {
    if (selectedDesign) {
      applyGeneratedDesignToCanvas(selectedDesign.id);
      setShowGenerationCenter(false);
    }
  };

  const handleSaveAsSnapshot = () => {
    if (selectedDesign) {
      const name = prompt('输入版本名称:', `${selectedDesign.name} 版本`);
      if (name) {
        saveGeneratedDesignAsSnapshot(selectedDesign.id, name);
      }
    }
  };

  const handleClose = () => {
    setShowGenerationCenter(false);
  };

  if (!showGenerationCenter) return null;

  return (
    <Modal isOpen={showGenerationCenter} onClose={handleClose} size="xl">
      <div className="flex flex-col h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-100 font-display">
                多平台生成中心
              </h2>
              <p className="text-xs text-surface-500">
                当前画布: {currentWidth} × {currentHeight} · {layers.length} 个图层
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-surface-700 flex flex-col">
            <div className="p-3 border-b border-surface-700">
              <p className="text-xs font-medium text-surface-400 mb-2 uppercase tracking-wider">
                选择尺寸
              </p>
              <p className="text-[11px] text-surface-500 mb-3">
                已选 {selectedSizeIds.length} 个尺寸
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles size={12} />}
                className="w-full"
                onClick={handleGenerate}
                disabled={selectedSizeIds.length === 0}
              >
                生成设计
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <SizeGroup
                title="社交媒体"
                icon={<Smartphone size={12} />}
                sizes={socialSizes}
                selectedIds={selectedSizeIds}
                onToggle={toggleSize}
              />
              <SizeGroup
                title="海报"
                icon={<FileText size={12} />}
                sizes={posterSizes}
                selectedIds={selectedSizeIds}
                onToggle={toggleSize}
              />
              <SizeGroup
                title="广告"
                icon={<Megaphone size={12} />}
                sizes={adSizes}
                selectedIds={selectedSizeIds}
                onToggle={toggleSize}
              />
            </div>

            {generatedDesigns.length > 0 && (
              <div className="p-3 border-t border-surface-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-surface-400"
                  onClick={clearGeneratedDesigns}
                >
                  清除所有生成
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {generatedDesigns.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500">
                <Monitor size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">还没有生成的设计</p>
                <p className="text-xs mt-1">从左侧选择尺寸，点击"生成设计"开始</p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-surface-700 flex items-center justify-between">
                  <p className="text-xs font-medium text-surface-400">
                    生成的设计 ({generatedDesigns.length})
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {generatedDesigns.map((design) => (
                      <div
                        key={design.id}
                        onClick={() => selectGeneratedDesign(design.id)}
                        className={`relative rounded-lg border cursor-pointer transition-all group ${
                          design.id === selectedGeneratedDesignId
                            ? 'border-brand-500 ring-2 ring-brand-500/30'
                            : 'border-surface-700 hover:border-surface-600'
                        }`}
                      >
                        <div className="aspect-square bg-surface-800 rounded-t-lg overflow-hidden flex items-center justify-center p-2">
                          <DesignPreview design={design} />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-surface-200 truncate">
                            {design.name}
                          </p>
                          <p className="text-[10px] text-surface-500 font-mono">
                            {design.width} × {design.height}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGeneratedDesign(design.id);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-surface-900/80 text-surface-400 hover:text-accent-coral rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-72 border-l border-surface-700 flex flex-col">
            {selectedDesign ? (
              <>
                <div className="p-3 border-b border-surface-700">
                  <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">
                    设计详情
                  </p>
                  <h3 className="text-sm font-semibold text-surface-200">
                    {selectedDesign.name}
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5 font-mono">
                    {selectedDesign.width} × {selectedDesign.height}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="bg-surface-800 rounded-lg p-3 mb-3">
                    <p className="text-[11px] font-medium text-surface-400 mb-2">
                      图层信息
                    </p>
                    <p className="text-xs text-surface-300">
                      共 {selectedDesign.layers.length} 个图层
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-surface-400">
                      快速操作
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Edit3 size={12} />}
                      className="w-full"
                      onClick={handleApply}
                    >
                      在画布中编辑
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Save size={12} />}
                      className="w-full"
                      onClick={handleSaveAsSnapshot}
                    >
                      保存为版本
                    </Button>
                  </div>
                </div>

                <div className="p-3 border-t border-surface-700">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Download size={12} />}
                    className="w-full"
                    onClick={() => {
                      useProjectStore.getState().setShowExportModal(true);
                    }}
                  >
                    导出此设计
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500 p-4">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <p className="text-xs text-center">选择一个设计查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

interface SizeGroupProps {
  title: string;
  icon: React.ReactNode;
  sizes: CanvasSize[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const SizeGroup: React.FC<SizeGroupProps> = ({
  title,
  icon,
  sizes,
  selectedIds,
  onToggle,
}) => {
  if (sizes.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-surface-500">{icon}</span>
        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-1">
        {sizes.map((size) => (
          <button
            key={size.id}
            onClick={() => onToggle(size.id)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors ${
              selectedIds.includes(size.id)
                ? 'bg-brand-500/20 text-brand-300'
                : 'text-surface-300 hover:bg-surface-800'
            }`}
          >
            <span className="text-xs">{size.name}</span>
            <span className="text-[10px] font-mono text-surface-500">
              {size.width}×{size.height}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface DesignPreviewProps {
  design: {
    width: number;
    height: number;
    layers: any[];
  };
}

const DesignPreview: React.FC<DesignPreviewProps> = ({ design }) => {
  const { width, height, layers } = design;

  const maxSize = 120;
  const scale = Math.min(maxSize / width, maxSize / height);
  const displayWidth = width * scale;
  const displayHeight = height * scale;

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="relative bg-white shadow-inner"
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
    >
      {sortedLayers.map((layer) => {
        if (!layer.visible) return null;

        const x = (layer.x / width) * 100;
        const y = (layer.y / height) * 100;
        const w = (layer.width / width) * 100;
        const h = (layer.height / height) * 100;

        const baseStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: `${w}%`,
          height: `${h}%`,
          opacity: layer.opacity,
          overflow: 'hidden',
        };

        if (layer.type === 'text') {
          return (
            <div
              key={layer.id}
              style={{
                ...baseStyle,
                fontSize: `${(layer.fontSize / height) * 100}%`,
                fontFamily: layer.fontFamily,
                fontWeight: layer.fontWeight,
                color: layer.color,
                textAlign: layer.textAlign,
                lineHeight: layer.lineHeight,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {layer.content}
            </div>
          );
        }

        if (layer.type === 'shape') {
          let borderRadius: React.CSSProperties['borderRadius'] = 0;
          if (layer.shapeType === 'circle') borderRadius = '50%';
          if (layer.shapeType === 'rectangle') borderRadius = layer.borderRadius || 0;

          if (layer.shapeType === 'triangle') {
            return (
              <div key={layer.id} style={baseStyle}>
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                  <polygon points="50,0 100,100 0,100" fill={layer.fill} />
                </svg>
              </div>
            );
          }

          return (
            <div
              key={layer.id}
              style={{
                ...baseStyle,
                backgroundColor: layer.fill,
                borderRadius,
                border:
                  layer.stroke && layer.stroke.width > 0
                    ? `${(layer.stroke.width / width) * 100}% solid ${layer.stroke.color}`
                    : 'none',
                boxSizing: 'border-box',
              }}
            />
          );
        }

        if (layer.type === 'image') {
          return (
            <div key={layer.id} style={baseStyle}>
              <div
                className="w-full h-full bg-surface-400/30 flex items-center justify-center"
                style={{
                  filter: layer.filter
                    ? `brightness(${layer.filter.brightness}%) contrast(${layer.filter.contrast}%) saturate(${layer.filter.saturate}%)`
                    : 'none',
                }}
              >
                <ImageIcon size={12} className="text-surface-500" />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
