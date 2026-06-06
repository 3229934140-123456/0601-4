import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Slider } from '@/components/common/Slider';
import { useProjectStore } from '@/store/projectStore';
import { useLayerStore } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';
import { canvasSizes } from '@/data/canvasSizes';
import { Download, Check, Loader2, Image, Instagram, Youtube, Twitter, Monitor, Smartphone } from 'lucide-react';
import { exportSingleSize, exportMultipleSizes, downloadImage, getFileExtension } from '@/utils/export';
import type { ExportConfig } from '@/types/project';

export const ExportModal: React.FC = () => {
  const { showExportModal, setShowExportModal } = useProjectStore();
  const { layers } = useLayerStore();
  const { width, height, backgroundColor } = useCanvasStore();

  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentSize, setCurrentSize] = useState('');

  const sizeCategories = useMemo(() => {
    return [
      {
        name: '社交媒体',
        icon: Instagram,
        sizes: canvasSizes.filter((s) => s.category === 'social').slice(0, 8),
      },
      {
        name: '海报',
        icon: Monitor,
        sizes: canvasSizes.filter((s) => s.category === 'poster'),
      },
      {
        name: '广告',
        icon: Smartphone,
        sizes: canvasSizes.filter((s) => s.category === 'ad'),
      },
    ];
  }, []);

  const toggleSize = (sizeId: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const layerData = {
        layers: [...layers],
        originalWidth: width,
        originalHeight: height,
        backgroundColor,
      };

      if (selectedSizes.length === 0) {
        const dataUrl = await exportSingleSize(
          layerData,
          format,
          quality / 100,
          scale
        );
        const ext = getFileExtension(format);
        downloadImage(dataUrl, `design.${ext}`);
      } else {
        const sizes = selectedSizes
          .map((id) => canvasSizes.find((s) => s.id === id))
          .filter(Boolean)
          .map((s) => ({ id: s!.id, name: s!.name, width: s!.width, height: s!.height }));

        const config: ExportConfig = {
          format,
          quality: quality / 100,
          scale: 1,
          sizes,
        };

        const results = await exportMultipleSizes(
          layerData,
          config,
          (current, total, sizeName) => {
            setCurrentSize(sizeName);
            setExportProgress(Math.round((current / total) * 100));
          }
        );

        results.forEach(({ name, dataUrl }) => {
          downloadImage(dataUrl, name);
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setCurrentSize('');
    }
  };

  const estimatedOutputWidth = Math.round(width * scale);
  const estimatedOutputHeight = Math.round(height * scale);

  return (
    <Modal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      title="导出图片"
      size="xl"
    >
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <h4 className="text-sm font-semibold text-surface-200 mb-3">导出设置</h4>
          
          <div className="mb-4">
            <div className="text-xs text-surface-500 mb-2">文件格式</div>
            <div className="flex gap-2">
              {(['png', 'jpeg', 'webp'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 px-3 text-sm rounded-md border transition-all ${
                    format === f
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {format !== 'png' && (
            <div className="mb-4">
              <Slider
                label="图片质量"
                value={quality}
                onChange={setQuality}
                min={10}
                max={100}
                unit="%"
              />
            </div>
          )}

          <div className="mb-4">
            <Slider
              label="导出倍率"
              value={scale * 100}
              onChange={(v) => setScale(v / 100)}
              min={50}
              max={300}
              step={25}
              unit="%"
            />
          </div>

          <div className="p-3 bg-surface-800/50 rounded-lg border border-surface-700">
            <div className="text-xs text-surface-400 mb-3">输出信息</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-surface-700 rounded flex items-center justify-center">
                <Image size={20} className="text-surface-500" />
              </div>
              <div>
                <p className="text-sm text-surface-200 font-medium">
                  design.{getFileExtension(format)}
                </p>
                <p className="text-xs text-surface-500">
                  {estimatedOutputWidth} × {estimatedOutputHeight} px
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-surface-500">格式</div>
              <div className="text-surface-300 text-right">{format.toUpperCase()}</div>
              {format !== 'png' && (
                <>
                  <div className="text-surface-500">质量</div>
                  <div className="text-surface-300 text-right">{quality}%</div>
                </>
              )}
              <div className="text-surface-500">倍率</div>
              <div className="text-surface-300 text-right">{scale}x</div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <h4 className="text-sm font-semibold text-surface-200 mb-3">
            多平台尺寸生成
            <span className="text-xs text-surface-500 font-normal ml-2">
              可多选，自动适配各平台比例
            </span>
          </h4>

          <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4">
            {sizeCategories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center gap-2 text-xs text-surface-500 mb-2">
                  <category.icon size={14} />
                  <span>{category.name}</span>
                  <span className="text-surface-600">({category.sizes.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => toggleSize(size.id)}
                      className={`p-2.5 text-left rounded-md border transition-all ${
                        selectedSizes.includes(size.id)
                          ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                          : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedSizes.includes(size.id) ? (
                          <Check size={14} className="text-brand-400 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 border border-surface-600 rounded-sm flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate">{size.name}</span>
                      </div>
                      <div className="text-[10px] text-surface-500 mt-1 ml-0">
                        {size.width} × {size.height} · {size.platform}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedSizes.length > 0 && (
            <div className="mt-4 p-3 bg-brand-500/10 rounded-lg border border-brand-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-300 font-medium">
                    已选择 {selectedSizes.length} 个尺寸
                  </p>
                  <p className="text-xs text-brand-400/70 mt-0.5">
                    将自动缩放适配并批量导出
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSizes([])}
                  className="text-xs text-brand-400 hover:text-brand-300"
                >
                  清空
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isExporting && (
        <div className="mt-6 p-4 bg-surface-800 rounded-lg border border-surface-700">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 size={20} className="animate-spin text-brand-400" />
            <div>
              <p className="text-sm text-surface-200 font-medium">
                {currentSize ? `正在导出 ${currentSize}` : '正在准备导出...'}
              </p>
              <p className="text-xs text-surface-500">
                {selectedSizes.length > 0
                  ? `${exportProgress}% 完成 (${Math.round(selectedSizes.length * exportProgress / 100)}/${selectedSizes.length})`
                  : '请稍候...'}
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan transition-all duration-300"
              style={{ width: `${exportProgress || (selectedSizes.length > 0 ? 5 : 95)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={() => setShowExportModal(false)}
          disabled={isExporting}
        >
          取消
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting
            ? '导出中...'
            : selectedSizes.length > 0
            ? `批量导出 ${selectedSizes.length} 张`
            : '导出图片'}
        </Button>
      </div>
    </Modal>
  );
};
