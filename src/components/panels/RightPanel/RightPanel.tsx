import React, { useState } from 'react';
import { Layers, Settings, AlignLeft } from 'lucide-react';
import { LayerPanel } from './LayerPanel';
import { PropertyPanel } from './PropertyPanel';

type RightTab = 'layers' | 'properties';

export const RightPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RightTab>('layers');

  const tabs = [
    { id: 'layers' as RightTab, icon: Layers, label: '图层' },
    { id: 'properties' as RightTab, icon: Settings, label: '属性' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'layers':
        return <LayerPanel />;
      case 'properties':
        return <PropertyPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="w-72 h-full flex flex-col bg-surface-900 border-l border-surface-700 panel-transition">
      <div className="flex border-b border-surface-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5'
                : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800/50'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
};
