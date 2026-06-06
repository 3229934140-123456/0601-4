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
  Tag,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  Edit3,
  Check,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useLayerStore } from '@/store/layerStore';
import { formatDate } from '@/utils/canvas';
import type { Layer } from '@/types/layer';
import { Button } from '@/components/common/Button';

type FilterType = 'active' | 'starred' | 'recent' | 'archived';

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
    setProjectTags,
    setProjectFolder,
    getAllFolders,
    getAllTags,
    getCurrentProject,
  } = useProjectStore();
  const { setSize, setBackgroundColor } = useCanvasStore();
  const { setLayers } = useLayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('active');
  const [showBatchReplace, setShowBatchReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [showSaveRecords, setShowSaveRecords] = useState(false);

  const allFolders = getAllFolders();
  const allTags = getAllTags();
  const currentProject = getCurrentProject();

  const matchCount = useMemo(() => {
    if (!findText) return 0;
    return countMatchingTextLayers(findText);
  }, [findText, countMatchingTextLayers, showProjectPanel]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(query));
        return nameMatch || tagMatch;
      });
    }

    if (selectedFolder) {
      result = result.filter((p) => p.folder === selectedFolder);
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags?.includes(selectedTag));
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
    }

    if (filter !== 'recent') {
      result.sort((a, b) => {
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    }

    return result;
  }, [projects, searchQuery, filter, selectedFolder, selectedTag]);

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

  const handleStartRename = (project: any) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = () => {
    if (editingProjectId && editingName.trim()) {
      renameProject(editingProjectId, editingName.trim());
    }
    setEditingProjectId(null);
  };

  const handleAddTag = (projectId: string, tag: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const newTags = [...(project.tags || []), tag];
    setProjectTags(projectId, newTags);
    setShowTagMenu(false);
  };

  const handleRemoveTag = (projectId: string, tag: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const newTags = (project.tags || []).filter((t) => t !== tag);
    setProjectTags(projectId, newTags);
  };

  const handleSetFolder = (projectId: string, folder: string | undefined) => {
    setProjectFolder(projectId, folder);
    setShowFolderMenu(false);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      if (currentProjectId) {
        setProjectFolder(currentProjectId, newFolderName.trim());
      }
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      if (currentProjectId) {
        const project = projects.find((p) => p.id === currentProjectId);
        if (project) {
          const newTags = [...(project.tags || []), newTagName.trim()];
          setProjectTags(currentProjectId, newTags);
        }
      }
      setNewTagName('');
      setShowNewTag(false);
    }
  };

  if (!showProjectPanel) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowProjectPanel(false)}
      />

      <div className="relative z-10 w-[420px] h-full bg-surface-900 border-r border-surface-700 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
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
              placeholder="搜索项目名或标签..."
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
                onClick={() => {
                  setFilter(f.key);
                  setSelectedFolder(null);
                  setSelectedTag(null);
                }}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  filter === f.key && !selectedFolder && !selectedTag
                    ? 'bg-surface-700 text-surface-200'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {allFolders.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFolderMenu(!showFolderMenu);
                    setShowTagMenu(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedFolder
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'bg-surface-800 text-surface-400 hover:text-surface-200'
                  }`}
                >
                  <Folder size={11} />
                  <span className="max-w-[80px] truncate">
                    {selectedFolder || '文件夹'}
                  </span>
                  <ChevronDown size={10} />
                </button>
                {showFolderMenu && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-surface-800 border border-surface-700 rounded-md shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedFolder(null);
                        setShowFolderMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                        !selectedFolder
                          ? 'bg-brand-500/10 text-brand-400'
                          : 'text-surface-300 hover:bg-surface-700'
                      }`}
                    >
                      全部文件夹
                    </button>
                    {allFolders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => {
                          setSelectedFolder(folder);
                          setShowFolderMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center gap-2 ${
                          selectedFolder === folder
                            ? 'bg-brand-500/10 text-brand-400'
                            : 'text-surface-300 hover:bg-surface-700'
                        }`}
                      >
                        <Folder size={11} />
                        <span className="truncate">{folder}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {allTags.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTagMenu(!showTagMenu);
                    setShowFolderMenu(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedTag
                      ? 'bg-accent-magenta/20 text-accent-magenta'
                      : 'bg-surface-800 text-surface-400 hover:text-surface-200'
                  }`}
                >
                  <Tag size={11} />
                  <span className="max-w-[80px] truncate">
                    {selectedTag || '标签'}
                  </span>
                  <ChevronDown size={10} />
                </button>
                {showTagMenu && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-surface-800 border border-surface-700 rounded-md shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setShowTagMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                        !selectedTag
                          ? 'bg-brand-500/10 text-brand-400'
                          : 'text-surface-300 hover:bg-surface-700'
                      }`}
                    >
                      全部标签
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setShowTagMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center gap-2 ${
                          selectedTag === tag
                            ? 'bg-brand-500/10 text-brand-400'
                            : 'text-surface-300 hover:bg-surface-700'
                        }`}
                      >
                        <Tag size={11} />
                        <span className="truncate">{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(selectedFolder || selectedTag) && (
              <button
                onClick={() => {
                  setSelectedFolder(null);
                  setSelectedTag(null);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-surface-500 hover:text-surface-300 rounded-md transition-colors"
              >
                <X size={11} />
                清除筛选
              </button>
            )}
          </div>
        </div>

        {currentProjectId && (
          <div className="p-3 border-b border-surface-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} />
                当前项目
              </h3>
              <button
                onClick={() => setShowSaveRecords(!showSaveRecords)}
                className="text-[10px] text-surface-500 hover:text-surface-300"
              >
                {showSaveRecords ? '收起' : '保存记录'}
              </button>
            </div>
            
            {currentProject && (
              <div className="space-y-2.5">
                <div className="p-2 bg-surface-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-200 truncate flex-1">
                      {currentProject.name}
                    </span>
                    {currentProject.starred && (
                      <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-surface-500 mt-0.5 font-mono">
                    {currentProject.canvas.width} × {currentProject.canvas.height}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-surface-400 flex items-center gap-1">
                      <Tag size={10} />
                      标签
                    </label>
                    <button
                      onClick={() => {
                        const tag = prompt('输入标签名:');
                        if (tag && tag.trim() && currentProjectId) {
                          const project = projects.find((p) => p.id === currentProjectId);
                          if (project && !project.tags?.includes(tag.trim())) {
                            setProjectTags(currentProjectId, [...(project.tags || []), tag.trim()]);
                          }
                        }
                      }}
                      className="text-[10px] text-brand-400 hover:text-brand-300"
                    >
                      + 添加
                    </button>
                  </div>
                  <div className="flex gap-1 flex-wrap min-h-[22px]">
                    {currentProject.tags && currentProject.tags.length > 0 ? (
                      currentProject.tags.map((tag) => (
                        <span
                          key={tag}
                          className="group px-1.5 py-0.5 text-[10px] bg-surface-700 text-surface-300 rounded flex items-center gap-1"
                        >
                          <Tag size={8} />
                          {tag}
                          <button
                            onClick={() => {
                              if (currentProjectId) {
                                const project = projects.find((p) => p.id === currentProjectId);
                                if (project) {
                                  setProjectTags(currentProjectId, project.tags?.filter((t) => t !== tag) || []);
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-500 hover:text-accent-coral transition-opacity"
                            title="删除标签"
                          >
                            <X size={9} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-surface-600">暂无标签，点击添加</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-surface-400 flex items-center gap-1">
                      <Folder size={10} />
                      文件夹
                    </label>
                    {currentProject.folder && (
                      <button
                        onClick={() => {
                          if (currentProjectId) {
                            setProjectFolder(currentProjectId, undefined);
                          }
                        }}
                        className="text-[10px] text-surface-500 hover:text-accent-coral"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <select
                    value={currentProject.folder || ''}
                    onChange={(e) => {
                      if (currentProjectId) {
                        setProjectFolder(currentProjectId, e.target.value || undefined);
                      }
                    }}
                    className="w-full px-2 py-1 text-[11px] bg-surface-800 border border-surface-700 rounded text-surface-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">未分类</option>
                    {allFolders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const folder = prompt('输入新文件夹名:');
                      if (folder && folder.trim() && currentProjectId) {
                        setProjectFolder(currentProjectId, folder.trim());
                      }
                    }}
                    className="text-[10px] text-brand-400 hover:text-brand-300"
                  >
                    + 新建文件夹
                  </button>
                </div>
                
                {showSaveRecords && currentProject.saveRecords && currentProject.saveRecords.length > 0 && (
                  <div className="pt-2 border-t border-surface-700 space-y-1">
                    <p className="text-[10px] text-surface-500">最近保存：</p>
                    {currentProject.saveRecords.slice(-5).reverse().map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-2 text-[10px] text-surface-400"
                      >
                        {record.type === 'auto' ? (
                          <RefreshCw size={9} className="text-accent-cyan" />
                        ) : (
                          <Save size={9} className="text-emerald-400" />
                        )}
                        <span>{record.type === 'auto' ? '自动保存' : '手动保存'}</span>
                        <span className="ml-auto font-mono">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentProjectId && versionSnapshots.length > 0 && (
          <div className="p-3 border-b border-surface-700">
            <h3 className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <History size={12} />
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
                        {project.folder && (
                          <div className="absolute bottom-0.5 right-0.5">
                            <div className="px-1 py-0.5 bg-surface-900/80 rounded text-[8px] text-surface-400 flex items-center gap-0.5">
                              <Folder size={7} />
                              {project.folder}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingProjectId === project.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-0.5 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200 focus:outline-none focus:border-brand-500"
                          />
                        ) : (
                          <p className="text-sm font-medium text-surface-200 truncate flex items-center gap-1">
                            {project.name}
                            {project.starred && (
                              <Star size={10} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                            )}
                          </p>
                        )}
                        <p className="text-xs text-surface-500 mt-0.5">
                          {project.canvas.width} × {project.canvas.height}
                        </p>
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {project.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 text-[9px] bg-surface-700/50 text-surface-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 2 && (
                              <span className="text-[9px] text-surface-500">
                                +{project.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(project);
                          }}
                          className="p-1 text-surface-400 hover:text-surface-200 rounded"
                          title="重命名"
                        >
                          <Edit3 size={13} />
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
          {selectedFolder && ` · 文件夹: ${selectedFolder}`}
          {selectedTag && ` · 标签: ${selectedTag}`}
        </div>
      </div>
    </div>
  );
};

function RefreshCw({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
