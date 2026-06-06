import React, { useRef, useEffect, useCallback } from 'react';
import { CanvasElement } from './CanvasElement';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import { ZoomControls } from './ZoomControls';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    width,
    height,
    zoom,
    offsetX,
    offsetY,
    backgroundColor,
    showGrid,
    setZoom,
    setOffset,
    resetZoom,
  } = useCanvasStore();
  const { layers, selectedLayerIds, clearSelection, setLayers } = useLayerStore();

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const canvasCenterX = rect.width / 2 + offsetX;
      const canvasCenterY = rect.height / 2 + offsetY;

      const scaleRatio = newZoom / zoom;
      const newOffsetX = mouseX - (mouseX - canvasCenterX) * scaleRatio - rect.width / 2;
      const newOffsetY = mouseY - (mouseY - canvasCenterY) * scaleRatio - rect.height / 2;

      setZoom(newZoom);
      setOffset(newOffsetX, newOffsetY);
    } else {
      setZoom(newZoom);
    }
  }, [zoom, offsetX, offsetY, setZoom, setOffset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX,
        offsetY,
      };
      e.preventDefault();
    } else if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-inner')) {
      clearSelection();
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setOffset(
        panStart.current.offsetX + dx,
        panStart.current.offsetY + dy
      );
    }
  };

  const handleContainerMouseUp = () => {
    isPanning.current = false;
  };

  const handleContainerMouseLeave = () => {
    isPanning.current = false;
  };

  useEffect(() => {
    (window as any).__canvasElement = canvasRef.current;
  }, []);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-surface-950 canvas-dot-bg"
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseLeave}
      style={{ cursor: isPanning.current ? 'grabbing' : 'default' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        <div
          ref={canvasRef}
          className="canvas-inner relative shadow-canvas"
          style={{
            width,
            height,
            backgroundColor,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            backgroundImage: showGrid
              ? `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`
              : 'none',
            backgroundSize: '20px 20px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            clearSelection();
          }}
        >
          {sortedLayers.map((layer) => (
            <CanvasElement
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerIds.includes(layer.id)}
            />
          ))}
        </div>
      </div>

      <ZoomControls />

      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-surface-500 bg-surface-900/80 backdrop-blur px-3 py-1.5 rounded-md">
        <span className="font-mono">{width} × {height}</span>
        <span className="text-surface-700">|</span>
        <span className="font-mono">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
