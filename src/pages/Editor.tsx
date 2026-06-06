import React, { useEffect } from 'react';
import { Toolbar } from '@/components/panels/Toolbar/Toolbar';
import { LeftPanel } from '@/components/panels/LeftPanel/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel/RightPanel';
import { Canvas } from '@/components/canvas/Canvas';
import { ExportModal } from '@/components/modals/ExportModal';
import { ProjectDrawer } from '@/components/modals/ProjectDrawer';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import { useProjectStore } from '@/store/projectStore';

export const Editor: React.FC = () => {
  const canvasState = useCanvasStore();
  const layerState = useLayerStore();
  const { saveSnapshot } = useProjectStore();

  useEffect(() => {
    (window as any).__canvasState = canvasState;
    (window as any).__layersState = layerState.layers;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useLayerStore.getState().redo();
        } else {
          useLayerStore.getState().undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        useLayerStore.getState().redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        useLayerStore.getState().selectAll();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useProjectStore.getState().saveProject();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useLayerStore.getState();
        if (state.selectedLayerIds.length > 0) {
          e.preventDefault();
          state.selectedLayerIds.forEach((id) => state.removeLayer(id));
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const state = useLayerStore.getState();
        if (state.selectedLayerIds.length === 1) {
          state.duplicateLayer(state.selectedLayerIds[0]);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        const name = prompt('输入版本名称:', `版本 ${new Date().toLocaleString()}`);
        if (name) {
          saveSnapshot(name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState, layerState.layers, saveSnapshot]);

  useEffect(() => {
    (window as any).__setLayers = (layers: any[]) => {
      useLayerStore.getState().setLayers(layers);
    };

    (window as any).__restoreSnapshot = (canvas: any, layers: any[]) => {
      useCanvasStore.getState().setSize(canvas.width, canvas.height);
      useCanvasStore.getState().setBackgroundColor(canvas.backgroundColor);
      useLayerStore.getState().setLayers(layers);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-surface-950 overflow-hidden">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>

      <ExportModal />
      <ProjectDrawer />
    </div>
  );
};
