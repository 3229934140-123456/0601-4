import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Folder,
  Archive,
  Trash2,
  Clock,
  Search,
  FileText,
  Save,
  Replace,
  Star,
  History,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import { formatDate } from '@/utils/canvas';
import type { Layer } from '@/types/layer';
import { Button } from '@/components/common/Button';

export const ProjectDrawer: React.FC = () => {
  const {
    showProjectPanel,
    setShowProjectPanel,
    projects,
    currentProjectId,
    createNewProject,
    loadProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    renameProject,
    versionSnapshots,
    restoreSnapshot,
    deleteSnapshot,
    batchReplaceText,
    countMatchingTextLayers,
    updateSavedState,
    toggleStarProject,
  } = useProjectStore();
  const { setSize, setBackgroundColor } = useCanvasStore();
  const { setLayers } = useLayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived' | 'starred' | 'recent'>('active');
  const [showBatchReplace, setShowBatchReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const matchCount = useMemo(() => {
    if (!findText) return 0;
    return countMatchingTextLayers(findText);
  }, [findText, countMatchingTextLayers, showProjectPanel]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    switch (filter) {
      case 'active':
        result = result.filter((p) => !p.archived);
        break;
      case 'archived':
        result = result.filter((p) => p.archived);
        break;
      case 'starred':
        result = result.filter((p) => p.starred && !p.archived);
        break;
      case 'recent':
        result = result
          .filter((p) => p.lastOpenedAt && !p.archived)
          .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
        break;
      default:
        break;
    }

    if (filter !== 'recent') {
      result.sort((a, b) => {
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    }

    return result;
  }, [projects, searchQuery, filter]);

  const handleLoadProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    setSize(project.canvas.width, project.canvas.height);
    setBackgroundColor(project.canvas.backgroundColor);
    setLayers(project.layers as Layer[]);
    loadProject(id);
    
    setTimeout(() => {
      updateSavedState();
    }, 0);
  };

  const handleNewProject = () => {
    const name = prompt('输入项目名称:', '未命名项目');
    if (name) {
      const id = createNewProject(name, 1080, 1080);
      if (id) {
        setSize(1080, 1080);
        setBackgroundColor('#ffffff');
        setLayers([]);
        setTimeout(() => {
          updateSavedState();
        }, 0);
      }
    }
  };

  const handleBatchReplace = () => {
    batchReplaceText(findText, replaceText);
    setShowBatchReplace(false);
    setFindText('');
    setReplaceText('');
  };

  if (!showProjectPanel) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowProjectPanel(false)}
      />

      <div className="relative z-10 w-96 h-full bg-surface-900 border-r border-surface-700 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-base font-semibold text-surface-100 font-display">
            项目管理
          </h2>
          <button
            onClick={() => setShowProjectPanel(false)}
            className="p-1.5 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 border-b border-surface-700 space-y-3">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              className="flex-1"
              onClick={handleNewProject}
            >
              新建项目
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Replace size={14} />}
              onClick={() => setShowBatchReplace(!showBatchReplace)}
            >
              替换
            </Button>
          </div>

          {showBatchReplace && (
            <div className="p-3 bg-surface-800 rounded-lg space-y-2">
              <p className="text-xs font-medium text-surface-300 flex items-center gap-1.5">
                <Replace size={12} />
                批量替换文字
              </p>
              <input
                type="text"
                placeholder="查找文字"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-surface-900 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500"
              />
              <input
                type="text"
                placeholder="替换为"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-surface-900 border border-surface-700 rounded text-surface-200 focus:outline-none focus:border-brand-500"
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${
                  findText && matchCount > 0
                    ? 'text-brand-400'
                    : 'text-surface-500'
                }`}>
                  {findText
                    ? matchCount > 0
                      ? `找到 ${matchCount} 个匹配图层`
                      : '未找到匹配文字'
                    : '输入要查找的文字'}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleBatchReplace}
                disabled={!findText || matchCount === 0}
              >
                全部替换 {matchCount > 0 ? `(${matchCount})` : ''}
              </Button>
              <p className="text-[10px] text-surface-500">
                提示：按普通文字匹配，不会把点号、括号等当作特殊规则
              </p>
            </div>
          )}

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface-800 border border-surface-700 rounded-md text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {([
              { key: 'active', label: '进行中', icon: <Folder size={11} /> },
              { key: 'starred', label: '星标', icon: <Star size={11} /> },
              { key: 'recent', label: '最近', icon: <History size={11} /> },
              { key: 'archived', label: '已归档', icon: <Archive size={11} /> },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  filter === f.key
                    ? 'bg-surface-700 text-surface-200'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {currentProjectId && versionSnapshots.length > 0 && (
          <div className="p-3 border-b border-surface-700">
            <h3 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              版本快照
            </h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {versionSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-2 bg-surface-800 rounded-md group"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-surface-200 font-medium truncate">
                      {snapshot.name}
                    </p>
                    <p className="text-[10px] text-surface-500">
                      {formatDate(snapshot.timestamp)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restoreSnapshot(snapshot.id)}
                      className="p-1 text-surface-400 hover:text-brand-400 rounded"
                      title="恢复"
                    >
                      <Save size={12} />
                    </button>
                    <button
                      onClick={() => deleteSnapshot(snapshot.id)}
                      className="p-1 text-surface-400 hover:text-accent-coral rounded"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-surface-500">
              <Folder size={32} className="mb-3 opacity-50" />
              <p className="text-sm">暂无项目</p>
              <button
                onClick={handleNewProject}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300"
              >
                创建第一个项目
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleLoadProject(project.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                    project.id === currentProjectId
                      ? 'bg-brand-500/10 border-brand-500/50'
                      : 'bg-surface-800 border-surface-700 hover:border-surface-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-surface-900 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText
                            size={20}
                            className="text-surface-600"
                          />
                        )}
                        {project.starred && (
                          <div className="absolute top-0.5 left-0.5">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-200 truncate flex items-center gap-1">
                          {project.name}
                          {project.starred && (
                            <Star size={10} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                          )}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {project.canvas.width} × {project.canvas.height}
                        </p>
                        <p className="text-[10px] text-surface-600 mt-0.5">
                          更新于 {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarProject(project.id);
                          }}
                          className={`p-1 rounded ${
                            project.starred
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-surface-400 hover:text-surface-200'
                          }`}
                          title={project.starred ? '取消星标' : '加星标'}
                        >
                          <Star size={13} className={project.starred ? 'fill-amber-400' : ''} />
                        </button>
                        {project.archived ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unarchiveProject(project.id);
                            }}
                            className="p-1 text-surface-400 hover:text-surface-200 rounded"
                            title="取消归档"
                          >
                            <Archive size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveProject(project.id);
                            }}
                            className="p-1 text-surface-400 hover:text-surface-200 rounded"
                            title="归档"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定删除这个项目吗？')) {
                              deleteProject(project.id);
                            }
                          }}
                          className="p-1 text-surface-400 hover:text-accent-coral rounded"
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-surface-700 text-xs text-surface-500 text-center">
          共 {projects.filter((p) => !p.archived).length} 个进行中项目
        </div>
      </div>
    </div>
  );
};
