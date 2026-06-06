import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Slider } from '@/components/common/Slider';
import { useProjectStore } from '@/store/projectStore';
import { canvasSizes } from '@/data/canvasSizes';
import { Download, Check, Loader2, Image } from 'lucide-react';
import { exportCanvas, downloadImage } from '@/utils/export';

export const ExportModal: React.FC = () => {
  const { showExportModal, setShowExportModal } = useProjectStore();
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentSize, setCurrentSize] = useState('');

  const socialSizes = canvasSizes.filter((s) => s.category === 'social');

  const toggleSize = (sizeId: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const handleExport = async () => {
    const canvasElement = (window as any).__canvasElement as HTMLElement;
    if (!canvasElement) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      if (selectedSizes.length === 0) {
        const dataUrl = await exportCanvas(canvasElement, format, quality / 100, scale);
        downloadImage(dataUrl, `design.${format === 'jpeg' ? 'jpg' : format}`);
      } else {
        const total = selectedSizes.length;
        for (let i = 0; i < selectedSizes.length; i++) {
          const sizeId = selectedSizes[i];
          const size = canvasSizes.find((s) => s.id === sizeId);
          if (!size) continue;

          setCurrentSize(size.name);
          setExportProgress(Math.round(((i + 1) / total) * 100));

          const dataUrl = await exportCanvas(canvasElement, format, quality / 100, scale);
          downloadImage(dataUrl, `${size.name}.${format === 'jpeg' ? 'jpg' : format}`);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setCurrentSize('');
    }
  };

  return (
    <Modal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      title="导出图片"
      size="lg"
    >
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-surface-200 mb-3">导出格式</h4>
          <div className="flex gap-2 mb-4">
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
            <div className="text-xs text-surface-400 mb-2">导出预览</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-700 rounded flex items-center justify-center">
                <Image size={20} className="text-surface-500" />
              </div>
              <div>
                <p className="text-sm text-surface-200 font-medium">
                  design.{format === 'jpeg' ? 'jpg' : format}
                </p>
                <p className="text-xs text-surface-500">
                  约 {format === 'png' ? '高清无损' : `${quality}% 质量`} · {scale}x
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-surface-200 mb-3">
            多尺寸导出
            <span className="text-xs text-surface-500 font-normal ml-2">
              (可选，不选则导出当前尺寸)
            </span>
          </h4>

          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
            <div>
              <div className="text-xs text-surface-500 mb-2">社交媒体</div>
              <div className="grid grid-cols-2 gap-2">
                {socialSizes.slice(0, 8).map((size) => (
                  <button
                    key={size.id}
                    onClick={() => toggleSize(size.id)}
                    className={`p-2 text-left rounded-md border transition-all ${
                      selectedSizes.includes(size.id)
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                        : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedSizes.includes(size.id) && (
                        <Check size={12} className="text-brand-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{size.name}</span>
                    </div>
                    <div className="text-[10px] text-surface-500 mt-0.5 ml-0">
                      {size.width} × {size.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedSizes.length > 0 && (
            <div className="mt-3 p-2 bg-brand-500/10 rounded-md text-xs text-brand-300">
              已选择 {selectedSizes.length} 个尺寸
            </div>
          )}
        </div>
      </div>

      {isExporting && (
        <div className="mt-4 p-3 bg-surface-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={16} className="animate-spin text-brand-400" />
            <span className="text-sm text-surface-300">
              {currentSize ? `正在导出 ${currentSize}...` : '正在导出...'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
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
          icon={isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting
            ? '导出中...'
            : selectedSizes.length > 0
            ? `批量导出 (${selectedSizes.length})`
            : '导出图片'}
        </Button>
      </div>
    </Modal>
  );
};
