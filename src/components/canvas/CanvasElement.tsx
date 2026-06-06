import React, { useRef, useState, useEffect } from 'react';
import type { Layer, TextLayer, ImageLayer, ShapeLayer } from '@/types/layer';
import { useLayerStore } from '@/store/layerStore';
import { useCanvasStore } from '@/store/canvasStore';
import { checkSnapAlignment } from '@/utils/canvas';

interface CanvasElementProps {
  layer: Layer;
  isSelected: boolean;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({ layer, isSelected }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, layerX: 0, layerY: 0 });

  const { moveLayer, resizeLayer, selectLayer, toggleLock, layers, updateLayer } = useLayerStore();
  const { zoom, snapToObjects } = useCanvasStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (layer.locked) return;
    e.stopPropagation();
    const multiSelect = e.shiftKey;
    selectLayer(layer.id, multiSelect);

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStart.current.x) / zoom;
        const dy = (e.clientY - dragStart.current.y) / zoom;
        let newX = dragStart.current.layerX + dx;
        let newY = dragStart.current.layerY + dy;

        if (snapToObjects) {
          const tempLayer = { ...layer, x: newX, y: newY };
          const { hLine, vLine } = checkSnapAlignment(
            tempLayer,
            layers,
            useCanvasStore.getState().width,
            useCanvasStore.getState().height
          );
          if (vLine !== null) {
            const bounds = getLayerBounds(tempLayer);
            if (Math.abs(bounds.centerX - vLine) < 5) {
              newX = vLine - layer.width / 2;
            } else if (Math.abs(bounds.left - vLine) < 5) {
              newX = vLine;
            } else if (Math.abs(bounds.right - vLine) < 5) {
              newX = vLine - layer.width;
            }
          }
          if (hLine !== null) {
            const bounds = getLayerBounds(tempLayer);
            if (Math.abs(bounds.centerY - hLine) < 5) {
              newY = hLine - layer.height / 2;
            } else if (Math.abs(bounds.top - hLine) < 5) {
              newY = hLine;
            } else if (Math.abs(bounds.bottom - hLine) < 5) {
              newY = hLine - layer.height;
            }
          }
        }

        moveLayer(layer.id, newX, newY);
      }

      if (isResizing) {
        const dx = (e.clientX - resizeStart.current.x) / zoom;
        const dy = (e.clientY - resizeStart.current.y) / zoom;

        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.layerX;
        let newY = resizeStart.current.layerY;

        const handle = isResizing;

        if (handle.includes('e')) {
          newWidth = Math.max(20, resizeStart.current.width + dx);
        }
        if (handle.includes('w')) {
          newWidth = Math.max(20, resizeStart.current.width - dx);
          newX = resizeStart.current.layerX + (resizeStart.current.width - newWidth);
        }
        if (handle.includes('s')) {
          newHeight = Math.max(20, resizeStart.current.height + dy);
        }
        if (handle.includes('n')) {
          newHeight = Math.max(20, resizeStart.current.height - dy);
          newY = resizeStart.current.layerY + (resizeStart.current.height - newHeight);
        }

        resizeLayer(layer.id, newWidth, newHeight);
        if (handle.includes('w') || handle.includes('n')) {
          moveLayer(layer.id, newX, newY);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      useLayerStore.getState().saveHistory();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, layer.id, layer.x, layer.y, layer.width, layer.height, zoom, snapToObjects, layers, moveLayer, resizeLayer]);

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    if (layer.locked) return;
    e.stopPropagation();
    setIsResizing(handle);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: layer.width,
      height: layer.height,
      layerX: layer.x,
      layerY: layer.y,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (layer.type === 'text') {
      e.stopPropagation();
    }
  };

  const renderContent = () => {
    switch (layer.type) {
      case 'text':
        return <TextContent layer={layer as TextLayer} />;
      case 'image':
        return <ImageContent layer={layer as ImageLayer} />;
      case 'shape':
        return <ShapeContent layer={layer as ShapeLayer} />;
      default:
        return null;
    }
  };

  if (!layer.visible) return null;

  const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div
      ref={elementRef}
      className={cn(
        'absolute group',
        isSelected ? 'selected-outline' : '',
        layer.locked ? 'cursor-not-allowed' : 'cursor-move',
        isDragging ? 'dragging' : ''
      )}
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        transform: `rotate(${layer.rotation}deg)`,
        opacity: layer.opacity,
        zIndex: layer.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}

      {isSelected && !layer.locked && (
        <>
          {resizeHandles.map((handle) => (
            <div
              key={handle}
              className="absolute w-3 h-3 bg-white border-2 border-brand-500 rounded-sm"
              style={{
                ...getHandlePosition(handle),
                cursor: `${handle}-resize`,
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            />
          ))}
        </>
      )}
    </div>
  );
};

function getLayerBounds(layer: Layer) {
  return {
    left: layer.x,
    top: layer.y,
    right: layer.x + layer.width,
    bottom: layer.y + layer.height,
    centerX: layer.x + layer.width / 2,
    centerY: layer.y + layer.height / 2,
  };
}

function getHandlePosition(handle: string): React.CSSProperties {
  const positions: Record<string, React.CSSProperties> = {
    nw: { top: -6, left: -6 },
    n: { top: -6, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -6, right: -6 },
    e: { top: '50%', right: -6, transform: 'translateY(-50%)' },
    se: { bottom: -6, right: -6 },
    s: { bottom: -6, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -6, left: -6 },
    w: { top: '50%', left: -6, transform: 'translateY(-50%)' },
  };
  return positions[handle] || {};
}

function cn(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

const TextContent: React.FC<{ layer: TextLayer }> = ({ layer }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(layer.content);
  const { updateLayer, saveHistory } = useLayerStore();

  useEffect(() => {
    if (!isEditing && text !== layer.content) {
      setText(layer.content);
    }
  }, [layer.content, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== layer.content) {
      updateLayer(layer.id, { content: text } as Partial<TextLayer>);
      saveHistory();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const textStyle: React.CSSProperties = {
    fontSize: layer.fontSize,
    fontFamily: layer.fontFamily,
    fontWeight: layer.fontWeight,
    color: layer.color,
    textAlign: layer.textAlign,
    lineHeight: layer.lineHeight,
    letterSpacing: `${layer.letterSpacing}px`,
    width: '100%',
    height: '100%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden',
    userSelect: isEditing ? 'text' : 'none',
    textShadow: layer.shadow
      ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}`
      : 'none',
    WebkitTextStroke: layer.stroke
      ? `${layer.stroke.width}px ${layer.stroke.color}`
      : 'none',
  };

  if (isEditing) {
    return (
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        autoFocus
        className="w-full h-full bg-transparent border-none outline-none resize-none p-0"
        style={textStyle}
      />
    );
  }

  return (
    <div
      className="w-full h-full pointer-events-none"
      style={textStyle}
      onDoubleClick={handleDoubleClick}
    >
      {layer.content}
    </div>
  );
};

const ImageContent: React.FC<{ layer: ImageLayer }> = ({ layer }) => {
  const [processedSrc, setProcessedSrc] = useState<string>(layer.src);
  const [isProcessing, setIsProcessing] = useState(false);

  const filter = layer.filter
    ? `brightness(${layer.filter.brightness}%) contrast(${layer.filter.contrast}%) saturate(${layer.filter.saturate}%)`
    : 'none';

  useEffect(() => {
    if (layer.backgroundRemoved) {
      setIsProcessing(true);
      import('@/utils/imageProcessing')
        .then(({ removeBackground }) => {
          return removeBackground(layer.src, {
            threshold: 25,
            tolerance: 30,
            edgeSoftness: 2,
          });
        })
        .then((result) => {
          setProcessedSrc(result);
          setIsProcessing(false);
        })
        .catch(() => {
          setProcessedSrc(layer.src);
          setIsProcessing(false);
        });
    } else {
      setProcessedSrc(layer.src);
    }
  }, [layer.src, layer.backgroundRemoved]);

  return (
    <div className="w-full h-full relative">
      {layer.backgroundRemoved && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
            backgroundColor: '#ffffff',
          }}
        />
      )}
      <img
        src={processedSrc}
        alt=""
        className={`w-full h-full object-cover pointer-events-none select-none relative z-10 ${
          isProcessing ? 'opacity-50' : 'opacity-100'
        }`}
        style={{ filter }}
        draggable={false}
      />
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
          <span className="text-xs text-white font-medium">去背处理中...</span>
        </div>
      )}
    </div>
  );
};

const ShapeContent: React.FC<{ layer: ShapeLayer }> = ({ layer }) => {
  const strokeStyle = layer.stroke
    ? `${layer.stroke.width}px ${layer.stroke.color}`
    : 'none';

  if (layer.shapeType === 'rectangle') {
    return (
      <div
        className="w-full h-full pointer-events-none"
        style={{
          backgroundColor: layer.fill,
          borderRadius: layer.borderRadius || 0,
          border: strokeStyle,
        }}
      />
    );
  }

  if (layer.shapeType === 'circle') {
    return (
      <div
        className="w-full h-full rounded-full pointer-events-none"
        style={{
          backgroundColor: layer.fill,
          border: strokeStyle,
        }}
      />
    );
  }

  if (layer.shapeType === 'triangle') {
    return (
      <svg
        className="w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,0 100,100 0,100"
          fill={layer.fill}
          stroke={layer.stroke?.color || 'none'}
          strokeWidth={layer.stroke?.width || 0}
        />
      </svg>
    );
  }

  if (layer.shapeType === 'line') {
    return (
      <div
        className="w-full h-full pointer-events-none"
        style={{
          backgroundColor: layer.fill,
        }}
      />
    );
  }

  return null;
};
