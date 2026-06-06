import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Type,
  StickyNote,
  GitCompareArrows,
  Clock,
  Check,
  CheckSquare,
  Square,
  Settings,
  ChevronDown,
  ChevronRight,
  Folder,
  RefreshCw,
  DownloadCloud,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import { canvasSizes } from '@/data/canvasSizes';
import type { CanvasSize } from '@/types/canvas';
import type { GeneratedDesign } from '@/types/project';
import type { Layer } from '@/types/layer';
import { exportToDataUrl, downloadImage } from '@/utils/export';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  filename: string;
}

interface ExportResult {
  designId: string;
  name: string;
  success: boolean;
  size?: string;
  error?: string;
  format?: string;
  filename?: string;
}

export const GenerationCenter: React.FC = () => {
  const {
    showGenerationCenter,
    setShowGenerationCenter,
    generatedDesigns,
    selectedGeneratedDesignId,
    selectedDesignIds,
    generateDesigns,
    selectGeneratedDesign,
    toggleSelectDesign,
    selectAllDesigns,
    deselectAllDesigns,
    updateGeneratedDesign,
    deleteGeneratedDesign,
    applyGeneratedDesignToCanvas,
    saveGeneratedDesignAsSnapshot,
    clearGeneratedDesigns,
    duplicateGeneratedDesign,
    selectGeneratedDesignLayer,
    updateGeneratedDesignLayer,
    saveGeneratedDesignsToProject,
  } = useProjectStore();

  const { width: currentWidth, height: currentHeight, backgroundColor } = useCanvasStore();
  const { layers: currentLayers } = useLayerStore();

  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([
    'instagram-post',
    'xiaohongshu',
    'youtube-thumbnail',
  ]);
  const [showCompare, setShowCompare] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'details' | 'export'>('layers');
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [showExportResults, setShowExportResults] = useState(false);
  const [globalFormat, setGlobalFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [globalQuality, setGlobalQuality] = useState(0.9);
  const [showBatchSettings, setShowBatchSettings] = useState(false);
  const thumbnailCache = useRef<Map<string, string>>(new Map());

  const socialSizes = canvasSizes.filter((s) => s.category === 'social');
  const posterSizes = canvasSizes.filter((s) => s.category === 'poster');
  const adSizes = canvasSizes.filter((s) => s.category === 'ad');

  const selectedDesign = useMemo(
    () => generatedDesigns.find((d) => d.id === selectedGeneratedDesignId) || null,
    [generatedDesigns, selectedGeneratedDesignId]
  );

  const selectedLayer = useMemo(() => {
    if (!selectedDesign || !selectedDesign.selectedLayerId) return null;
    return selectedDesign.layers.find((l) => l.id === selectedDesign.selectedLayerId) || null;
  }, [selectedDesign]);

  const textLayers = useMemo(() => {
    if (!selectedDesign) return [];
    return selectedDesign.layers.filter((l) => l.type === 'text');
  }, [selectedDesign]);

  useEffect(() => {
    const generateThumbnails = async () => {
      for (const design of generatedDesigns) {
        if (thumbnailCache.current.has(design.id)) continue;
        try {
          const thumb = await exportToDataUrl(
            design.layers,
            design.width,
            design.height,
            design.backgroundColor,
            'png',
            0.6
          );
          thumbnailCache.current.set(design.id, thumb);
          setThumbnails(new Map(thumbnailCache.current));
        } catch {
          // skip
        }
      }
    };
    if (generatedDesigns.length > 0) {
      generateThumbnails();
    }
  }, [generatedDesigns]);

  const toggleSize = (sizeId: string) => {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const handleGenerate = () => {
    if (selectedSizeIds.length === 0) return;
    thumbnailCache.current.clear();
    setThumbnails(new Map());
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

  const handleExportSingle = async () => {
    if (!selectedDesign) return;
    setIsExporting(true);
    try {
      const { format, quality, filename } = selectedDesign.exportSettings;
      const dataUrl = await exportToDataUrl(
        selectedDesign.layers,
        selectedDesign.width,
        selectedDesign.height,
        selectedDesign.backgroundColor,
        format,
        quality
      );
      const ext = format === 'jpeg' ? 'jpg' : format;
      const finalFilename = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
      downloadImage(dataUrl, finalFilename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchExport = async () => {
    if (selectedDesignIds.length === 0) return;
    setIsExporting(true);
    setExportResults([]);
    setShowExportResults(true);

    const results: ExportResult[] = [];

    for (const designId of selectedDesignIds) {
      const design = generatedDesigns.find((d) => d.id === designId);
      if (!design) continue;

      const { format, quality, filename } = design.exportSettings;
      const ext = format === 'jpeg' ? 'jpg' : format;
      const finalFilename = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;

      try {
        const dataUrl = await exportToDataUrl(
          design.layers,
          design.width,
          design.height,
          design.backgroundColor,
          format,
          quality
        );
        downloadImage(dataUrl, finalFilename);
        results.push({
          designId: design.id,
          name: design.name,
          success: true,
          size: `${design.width} × ${design.height}`,
          format: format.toUpperCase(),
          filename: finalFilename,
        });
      } catch (error) {
        results.push({
          designId: design.id,
          name: design.name,
          success: false,
          error: error instanceof Error ? error.message : '导出失败',
          format: format.toUpperCase(),
          filename: finalFilename,
        });
      }

      setExportResults([...results]);
    }

    setIsExporting(false);
  };

  const handleDuplicate = () => {
    if (selectedDesign) {
      thumbnailCache.current.delete(selectedDesign.id);
      duplicateGeneratedDesign(selectedDesign.id);
    }
  };

  const handleStartEditName = () => {
    if (selectedDesign) {
      setTempName(selectedDesign.name);
      setEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (selectedDesign && tempName.trim()) {
      updateGeneratedDesign(selectedDesign.id, { name: tempName.trim() });
    }
    setEditingName(false);
  };

  const moveLayer = (direction: 'up' | 'down' | 'left' | 'right', amount: number = 1) => {
    if (!selectedDesign || !selectedLayer) return;

    let dx = 0;
    let dy = 0;
    switch (direction) {
      case 'up': dy = -amount; break;
      case 'down': dy = amount; break;
      case 'left': dx = -amount; break;
      case 'right': dx = amount; break;
    }

    updateGeneratedDesignLayer(selectedDesign.id, selectedLayer.id, {
      x: selectedLayer.x + dx,
      y: selectedLayer.y + dy,
    });
    thumbnailCache.current.delete(selectedDesign.id);
  };

  const handleLayerPositionChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedDesign || !selectedLayer) return;
    updateGeneratedDesignLayer(selectedDesign.id, selectedLayer.id, {
      [axis]: value,
    });
    thumbnailCache.current.delete(selectedDesign.id);
  };

  const handleSaveToProject = () => {
    saveGeneratedDesignsToProject();
    alert('生成版本已保存到项目');
  };

  const handleClose = () => {
    setShowGenerationCenter(false);
    setShowCompare(false);
    setShowExportResults(false);
  };

  const handleSelectAllToggle = () => {
    if (selectedDesignIds.length === generatedDesigns.length) {
      deselectAllDesigns();
    } else {
      selectAllDesigns();
    }
  };

  if (!showGenerationCenter) return null;

  return (
    <Modal isOpen={showGenerationCenter} onClose={handleClose} size="xl">
      <div className="flex flex-col h-[85vh]">
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
                当前画布: {currentWidth} × {currentHeight} · {currentLayers.length} 个图层
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {generatedDesigns.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Save size={12} />}
                onClick={handleSaveToProject}
              >
                保存到项目
              </Button>
            )}
            {generatedDesigns.length > 0 && (
              <Button
                variant={showCompare ? 'primary' : 'secondary'}
                size="sm"
                icon={<GitCompareArrows size={12} />}
                onClick={() => setShowCompare(!showCompare)}
              >
                对比视图
              </Button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
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
            ) : showCompare && selectedDesign ? (
              <CompareView design={selectedDesign} />
            ) : showExportResults ? (
              <ExportResultsView
                results={exportResults}
                isExporting={isExporting}
                onBack={() => setShowExportResults(false)}
              />
            ) : (
              <>
                <div className="p-3 border-b border-surface-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAllToggle}
                      className="flex items-center gap-2 text-xs text-surface-300 hover:text-surface-100"
                    >
                      {selectedDesignIds.length === generatedDesigns.length ? (
                        <CheckSquare size={14} className="text-brand-400" />
                      ) : (
                        <Square size={14} />
                      )}
                      <span>全选 ({selectedDesignIds.length}/{generatedDesigns.length})</span>
                    </button>
                    <span className="text-surface-700">|</span>
                    <span className="text-[11px] text-surface-500">
                      点击卡片选中查看详情，点击复选框批量选择
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDesignIds.length > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Download size={12} />}
                        onClick={handleBatchExport}
                        disabled={isExporting}
                      >
                        {isExporting ? '导出中...' : `批量导出 (${selectedDesignIds.length})`}
                      </Button>
                    )}
                    <button
                      onClick={() => setShowBatchSettings(!showBatchSettings)}
                      className={`p-1.5 rounded transition-colors ${
                        showBatchSettings
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                      }`}
                      title="批量导出设置"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                </div>

                {showBatchSettings && (
                  <div className="p-3 border-b border-surface-700 bg-surface-800/50">
                    <p className="text-[11px] font-medium text-surface-400 mb-2">批量应用导出设置到选中项</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-surface-500">格式:</label>
                        <select
                          value={globalFormat}
                          onChange={(e) => setGlobalFormat(e.target.value as any)}
                          className="px-2 py-1 text-xs bg-surface-900 border border-surface-600 rounded text-surface-200 focus:outline-none focus:border-brand-500"
                        >
                          <option value="png">PNG</option>
                          <option value="jpeg">JPG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </div>
                      {globalFormat !== 'png' && (
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-surface-500">质量: {Math.round(globalQuality * 100)}%</label>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={globalQuality}
                            onChange={(e) => setGlobalQuality(Number(e.target.value))}
                            className="w-20"
                          />
                        </div>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          selectedDesignIds.forEach((id) => {
                            updateGeneratedDesign(id, {
                              exportSettings: {
                                ...(generatedDesigns.find((d) => d.id === id)?.exportSettings || { format: 'png' as const, quality: 0.9, filename: '' }),
                                format: globalFormat,
                                quality: globalQuality,
                              },
                            });
                          });
                        }}
                        disabled={selectedDesignIds.length === 0}
                        className="text-[10px] py-1 px-2"
                      >
                        应用到 {selectedDesignIds.length} 个
                      </Button>
                    </div>
                    <p className="text-[10px] text-surface-500 mt-2">
                      提示：每个版本都有独立的导出设置，也可以在右侧详情面板单独修改
                    </p>
                  </div>
                )}

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
                        <div
                          className="absolute top-2 left-2 z-10 p-0.5 rounded bg-surface-900/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectDesign(design.id);
                          }}
                        >
                          {selectedDesignIds.includes(design.id) ? (
                            <CheckSquare size={14} className="text-brand-400" />
                          ) : (
                            <Square size={14} className="text-surface-400" />
                          )}
                        </div>

                        <div className="aspect-square bg-surface-800 rounded-t-lg overflow-hidden flex items-center justify-center p-2">
                          {thumbnails.has(design.id) ? (
                            <img
                              src={thumbnails.get(design.id)!}
                              alt=""
                              className="max-w-full max-h-full object-contain shadow-md"
                            />
                          ) : (
                            <DesignThumbnail design={design} />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-surface-200 truncate">
                            {design.name}
                          </p>
                          <p className="text-[10px] text-surface-500 font-mono">
                            {design.width} × {design.height}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateGeneratedDesign(design.id);
                              thumbnailCache.current.delete(design.id);
                            }}
                            className="p-1 bg-surface-900/80 text-surface-400 hover:text-brand-400 rounded"
                            title="复制变体"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGeneratedDesign(design.id);
                              thumbnailCache.current.delete(design.id);
                            }}
                            className="p-1 bg-surface-900/80 text-surface-400 hover:text-accent-coral rounded"
                            title="删除"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        {design.parentId && (
                          <div className="absolute bottom-8 right-2" title="变体">
                            <RefreshCw size={10} className="text-accent-cyan" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-80 border-l border-surface-700 flex flex-col">
            {selectedDesign ? (
              <>
                <div className="p-3 border-b border-surface-700">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        onBlur={handleSaveName}
                        autoFocus
                        className="flex-1 px-2 py-1 text-sm bg-surface-800 border border-surface-600 rounded text-surface-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-semibold text-surface-200 truncate cursor-pointer hover:text-brand-400"
                          onClick={handleStartEditName}
                        >
                          {selectedDesign.name}
                        </h3>
                        <p className="text-xs text-surface-500 mt-0.5 font-mono">
                          {selectedDesign.width} × {selectedDesign.height}
                        </p>
                      </div>
                      <button
                        onClick={handleStartEditName}
                        className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded"
                        title="重命名"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-surface-500">
                    <Clock size={10} />
                    <span>更新于 {new Date(selectedDesign.updatedAt).toLocaleString()}</span>
                  </div>
                  {selectedDesign.parentId && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <RefreshCw size={10} className="text-accent-cyan" />
                      <span className="text-[10px] text-accent-cyan">这是一个变体</span>
                    </div>
                  )}
                </div>

                <div className="flex border-b border-surface-700">
                  <button
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'layers'
                        ? 'text-brand-400 border-b-2 border-brand-400'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    文字图层
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'details'
                        ? 'text-brand-400 border-b-2 border-brand-400'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    详情
                  </button>
                  <button
                    onClick={() => setActiveTab('export')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'export'
                        ? 'text-brand-400 border-b-2 border-brand-400'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    导出
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'layers' ? (
                    <div className="p-3 space-y-2">
                      {textLayers.length === 0 ? (
                        <div className="text-center py-8 text-surface-500">
                          <Type size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">暂无文字图层</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] font-medium text-surface-400 mb-2">
                            点击图层选中，然后调整位置
                          </p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {textLayers.map((layer) => (
                              <button
                                key={layer.id}
                                onClick={() =>
                                  selectGeneratedDesignLayer(
                                    selectedDesign.id,
                                    selectedDesign.selectedLayerId === layer.id
                                      ? null
                                      : layer.id
                                  )
                                }
                                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left transition-colors ${
                                  selectedDesign.selectedLayerId === layer.id
                                    ? 'bg-brand-500/20 text-brand-300'
                                    : 'text-surface-300 hover:bg-surface-800'
                                }`}
                              >
                                <Type size={12} />
                                <span className="text-xs truncate flex-1">
                                  {(layer as any).content}
                                </span>
                              </button>
                            ))}
                          </div>

                          {selectedLayer && selectedLayer.type === 'text' && (
                            <div className="mt-4 p-3 bg-surface-800 rounded-lg space-y-3">
                              <p className="text-[11px] font-medium text-surface-400 flex items-center gap-1.5">
                                <Type size={11} />
                                位置调整
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-surface-500 block mb-1">X</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedLayer.x)}
                                    onChange={(e) =>
                                      handleLayerPositionChange('x', Number(e.target.value))
                                    }
                                    className="w-full px-2 py-1 text-xs bg-surface-900 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-surface-500 block mb-1">Y</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedLayer.y)}
                                    onChange={(e) =>
                                      handleLayerPositionChange('y', Number(e.target.value))
                                    }
                                    className="w-full px-2 py-1 text-xs bg-surface-900 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => moveLayer('up', 1)}
                                  className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => moveLayer('left', 1)}
                                    className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded"
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                  <button
                                    onClick={() => moveLayer('right', 1)}
                                    className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded"
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => moveLayer('down', 1)}
                                  className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                              <p className="text-[10px] text-surface-500 text-center">
                                方向键每次移动 1px
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : activeTab === 'details' ? (
                    <div className="p-3 space-y-3">
                      <div>
                        <label className="text-[11px] font-medium text-surface-400 flex items-center gap-1.5 mb-1.5">
                          <StickyNote size={11} />
                          备注
                        </label>
                        <textarea
                          value={selectedDesign.note || ''}
                          onChange={(e) =>
                            updateGeneratedDesign(selectedDesign.id, { note: e.target.value })
                          }
                          placeholder="添加备注..."
                          rows={4}
                          className="w-full px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500 resize-none"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-medium text-surface-400">背景色</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedDesign.backgroundColor}
                            onChange={(e) => {
                              updateGeneratedDesign(selectedDesign.id, {
                                backgroundColor: e.target.value,
                              });
                              thumbnailCache.current.delete(selectedDesign.id);
                            }}
                            className="w-8 h-8 rounded border border-surface-600 cursor-pointer"
                          />
                          <span className="text-xs text-surface-300 font-mono">
                            {selectedDesign.backgroundColor}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-medium text-surface-400">图层信息</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-surface-800 rounded p-2">
                            <p className="text-surface-500 text-[10px]">总图层</p>
                            <p className="text-surface-200 font-medium">
                              {selectedDesign.layers.length}
                            </p>
                          </div>
                          <div className="bg-surface-800 rounded p-2">
                            <p className="text-surface-500 text-[10px]">文字图层</p>
                            <p className="text-surface-200 font-medium">
                              {selectedDesign.layers.filter((l) => l.type === 'text').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-medium text-surface-400">快速操作</p>
                        <div className="space-y-1.5">
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
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Copy size={12} />}
                            className="w-full"
                            onClick={handleDuplicate}
                          >
                            复制变体
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      <p className="text-[11px] font-medium text-surface-400">导出设置</p>
                      
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] text-surface-500 block mb-1">文件名</label>
                          <input
                            type="text"
                            value={selectedDesign.exportSettings.filename}
                            onChange={(e) =>
                              updateGeneratedDesign(selectedDesign.id, {
                                exportSettings: {
                                  ...selectedDesign.exportSettings,
                                  filename: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-surface-500 block mb-1">格式</label>
                          <select
                            value={selectedDesign.exportSettings.format}
                            onChange={(e) =>
                              updateGeneratedDesign(selectedDesign.id, {
                                exportSettings: {
                                  ...selectedDesign.exportSettings,
                                  format: e.target.value as 'png' | 'jpeg' | 'webp',
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 text-xs bg-surface-800 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500"
                          >
                            <option value="png">PNG - 无损，支持透明</option>
                            <option value="jpeg">JPG - 有损，体积小</option>
                            <option value="webp">WebP - 现代格式，体积更小</option>
                          </select>
                        </div>

                        {selectedDesign.exportSettings.format !== 'png' && (
                          <div>
                            <label className="text-[10px] text-surface-500 block mb-1">
                              质量: {Math.round(selectedDesign.exportSettings.quality * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={selectedDesign.exportSettings.quality}
                              onChange={(e) =>
                                updateGeneratedDesign(selectedDesign.id, {
                                  exportSettings: {
                                    ...selectedDesign.exportSettings,
                                    quality: Number(e.target.value),
                                  },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        )}

                        <div className="bg-surface-800 rounded p-2.5 text-[11px] text-surface-400 space-y-1">
                          <p className="flex justify-between">
                            <span className="text-surface-500">尺寸</span>
                            <span className="font-mono text-surface-300">{selectedDesign.width} × {selectedDesign.height} px</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-surface-500">格式</span>
                            <span className="text-surface-300">{selectedDesign.exportSettings.format.toUpperCase()}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-surface-500">文件大小</span>
                            <span className="text-surface-300">约 {estimateFileSize(
                              selectedDesign.width,
                              selectedDesign.height,
                              selectedDesign.exportSettings.format,
                              selectedDesign.exportSettings.quality
                            )}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={isExporting ? undefined : <Download size={12} />}
                          className="w-full"
                          onClick={handleExportSingle}
                          disabled={isExporting}
                        >
                          {isExporting ? '导出中...' : '导出此设计'}
                        </Button>
                        <p className="text-[10px] text-surface-500 text-center">
                          导出 {selectedDesign.width} × {selectedDesign.height} 的 {selectedDesign.exportSettings.format.toUpperCase()} 图片
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-surface-700 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Save size={12} />}
                    className="w-full"
                    onClick={handleSaveToProject}
                  >
                    保存生成版本到项目
                  </Button>
                  <p className="text-[10px] text-surface-500 text-center">
                    保存后关闭项目再打开仍能看到
                  </p>
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

function estimateFileSize(width: number, height: number, format: string, quality: number): string {
  const pixels = width * height;
  let bytes: number;
  switch (format) {
    case 'png': bytes = pixels * 4 * 0.7; break;
    case 'jpeg': bytes = pixels * 3 * quality * 0.3; break;
    case 'webp': bytes = pixels * 3 * quality * 0.2; break;
    default: bytes = pixels * 4;
  }
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

interface DesignThumbnailProps {
  design: GeneratedDesign;
}

const DesignThumbnail: React.FC<DesignThumbnailProps> = ({ design }) => {
  const { width, height, layers, backgroundColor } = design;

  const maxSize = 120;
  const scale = Math.min(maxSize / width, maxSize / height);
  const displayWidth = width * scale;
  const displayHeight = height * scale;

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="relative shadow-inner"
      style={{
        width: displayWidth,
        height: displayHeight,
        backgroundColor,
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
                fontSize: `${((layer as any).fontSize / height) * 100}%`,
                fontFamily: (layer as any).fontFamily,
                fontWeight: (layer as any).fontWeight,
                color: (layer as any).color,
                textAlign: (layer as any).textAlign,
                lineHeight: (layer as any).lineHeight,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {(layer as any).content}
            </div>
          );
        }

        if (layer.type === 'shape') {
          let borderRadius: React.CSSProperties['borderRadius'] = 0;
          if ((layer as any).shapeType === 'circle') borderRadius = '50%';
          if ((layer as any).shapeType === 'rectangle') borderRadius = (layer as any).borderRadius || 0;

          if ((layer as any).shapeType === 'triangle') {
            return (
              <div key={layer.id} style={baseStyle}>
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                  <polygon points="50,0 100,100 0,100" fill={(layer as any).fill} />
                </svg>
              </div>
            );
          }

          return (
            <div
              key={layer.id}
              style={{
                ...baseStyle,
                backgroundColor: (layer as any).fill,
                borderRadius,
                border:
                  (layer as any).stroke && (layer as any).stroke.width > 0
                    ? `${((layer as any).stroke.width / width) * 100}% solid ${(layer as any).stroke.color}`
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
                  filter: (layer as any).filter
                    ? `brightness(${(layer as any).filter.brightness}%) contrast(${(layer as any).filter.contrast}%) saturate(${(layer as any).filter.saturate}%)`
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

interface CompareViewProps {
  design: GeneratedDesign;
}

const CompareView: React.FC<CompareViewProps> = ({ design }) => {
  const originalLayers = useLayerStore((s) => s.layers);
  const originalWidth = useCanvasStore((s) => s.width);
  const originalHeight = useCanvasStore((s) => s.height);
  const originalBg = useCanvasStore((s) => s.backgroundColor);

  const [originalThumb, setOriginalThumb] = useState<string>('');
  const [designThumb, setDesignThumb] = useState<string>('');

  useEffect(() => {
    const generateThumbs = async () => {
      try {
        const orig = await exportToDataUrl(originalLayers, originalWidth, originalHeight, originalBg, 'png', 0.7);
        setOriginalThumb(orig);
      } catch {}
      try {
        const des = await exportToDataUrl(design.layers, design.width, design.height, design.backgroundColor, 'png', 0.7);
        setDesignThumb(des);
      } catch {}
    };
    generateThumbs();
  }, [design, originalLayers, originalWidth, originalHeight, originalBg]);

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <div className="text-center mb-3">
        <p className="text-sm font-medium text-surface-300">对比视图</p>
        <p className="text-xs text-surface-500">左侧为原始设计，右侧为生成的 {design.name}</p>
      </div>

      <div className="flex-1 flex items-center justify-center gap-6 overflow-hidden">
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-surface-400 mb-2">原始设计</p>
          <p className="text-[10px] text-surface-500 mb-2 font-mono">
            {originalWidth} × {originalHeight}
          </p>
          <div className="p-2 bg-surface-800 rounded-lg border border-surface-700">
            <div className="w-56 h-56 flex items-center justify-center">
              {originalThumb ? (
                <img src={originalThumb} alt="" className="max-w-full max-h-full object-contain shadow-md" />
              ) : (
                <div className="animate-pulse bg-surface-700 w-full h-full rounded" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <GitCompareArrows size={24} className="text-surface-600" />
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-brand-400 mb-2">{design.name}</p>
          <p className="text-[10px] text-surface-500 mb-2 font-mono">
            {design.width} × {design.height}
          </p>
          <div className="p-2 bg-surface-800 rounded-lg border border-brand-500/50">
            <div className="w-56 h-56 flex items-center justify-center">
              {designThumb ? (
                <img src={designThumb} alt="" className="max-w-full max-h-full object-contain shadow-md" />
              ) : (
                <div className="animate-pulse bg-surface-700 w-full h-full rounded" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExportResultsViewProps {
  results: ExportResult[];
  isExporting: boolean;
  onBack: () => void;
}

const ExportResultsView: React.FC<ExportResultsViewProps> = ({ results, isExporting, onBack }) => {
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <div>
            <p className="text-sm font-medium text-surface-200">导出结果</p>
            <p className="text-xs text-surface-500">
              {isExporting ? '正在导出...' : `成功 ${successCount} 个，失败 ${failCount} 个`}
            </p>
          </div>
        </div>
        {isExporting && (
          <div className="flex items-center gap-2">
            <DownloadCloud size={16} className="text-brand-400 animate-bounce" />
            <span className="text-xs text-brand-400">{results.length} 个已处理</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {results.map((result, index) => (
          <div
            key={`${result.designId}-${index}`}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              result.success
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-accent-coral/10 border-accent-coral/30'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {result.success ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-emerald-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-coral/20 flex items-center justify-center flex-shrink-0">
                  <X size={14} className="text-accent-coral" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-200 truncate">{result.name}</p>
                <p className="text-xs text-surface-500 font-mono truncate">
                  {result.filename}
                </p>
                <p className="text-[10px] text-surface-500">
                  {result.success
                    ? `${result.size} · ${result.format}`
                    : result.error}
                </p>
              </div>
            </div>
            {result.success && (
              <span className="text-[10px] text-emerald-400 font-medium flex-shrink-0">已下载</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
