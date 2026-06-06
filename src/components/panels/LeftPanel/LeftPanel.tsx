import React, { useState } from 'react';
import { LayoutTemplate, Image, Type, Shapes, Palette, Search } from 'lucide-react';
import { TemplatePanel } from './TemplatePanel';
import { ImagePanel } from './ImagePanel';
import { TextPanel } from './TextPanel';
import { ShapePanel } from './ShapePanel';
import { ColorPalettePanel } from './ColorPalettePanel';

type PanelTab = 'templates' | 'images' | 'text' | 'shapes' | 'colors';

export const LeftPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PanelTab>('templates');

  const tabs = [
    { id: 'templates' as PanelTab, icon: LayoutTemplate, label: '模板' },
    { id: 'images' as PanelTab, icon: Image, label: '素材' },
    { id: 'text' as PanelTab, icon: Type, label: '文字' },
    { id: 'shapes' as PanelTab, icon: Shapes, label: '形状' },
    { id: 'colors' as PanelTab, icon: Palette, label: '配色' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplatePanel />;
      case 'images':
        return <ImagePanel />;
      case 'text':
        return <TextPanel />;
      case 'shapes':
        return <ShapePanel />;
      case 'colors':
        return <ColorPalettePanel />;
      default:
        return null;
    }
  };

  return (
    <div className="w-72 h-full flex flex-col bg-surface-900 border-r border-surface-700 panel-transition">
      <div className="flex border-b border-surface-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5'
                : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800/50'
            }`}
            title={tab.label}
          >
            <tab.icon size={18} />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
};
