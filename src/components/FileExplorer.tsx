import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { useFileStore, FileInfo } from '../store/fileStore';

import {
  FolderIcon,
  DocumentIcon,
  PlusIcon,
  FolderPlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { IFSWatcher, WebContainer } from '@webcontainer/api';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  isDirectory?: boolean;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onRename,
  onDelete,
  isDirectory,
  onCreateFile,
  onCreateFolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-[#252526] border border-[#454545] rounded shadow-lg py-1 z-50"
      style={{ left: x, top: y }}
    >
      {isDirectory && (
        <>
          <button
            className="w-full px-4 py-1 text-left hover:bg-[#2a2a2a] text-sm"
            onClick={() => {
              onCreateFile?.();
              onClose();
            }}
          >
            Nový soubor
          </button>
          <button
            className="w-full px-4 py-1 text-left hover:bg-[#2a2a2a] text-sm"
            onClick={() => {
              onCreateFolder?.();
              onClose();
            }}
          >
            Nová složka
          </button>
          <div className="border-t border-[#454545] my-1" />
        </>
      )}
      <button
        className="w-full px-4 py-1 text-left hover:bg-[#2a2a2a] text-sm"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Přejmenovat
      </button>
      <button
        className="w-full px-4 py-1 text-left hover:bg-[#2a2a2a] text-sm text-red-400"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Smazat
      </button>
    </div>
  );
};

interface FileItemProps {
  file: FileInfo;
  level: number;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onCreateItem: (parentPath: string, type: 'file' | 'directory') => void;
  onMove: (sourcePath: string, targetPath: string) => void;
  isNewItemParent?: boolean;
  onNewItemSubmit: (parentPath: string, name: string, type: 'file' | 'directory') => void;
  children?: React.ReactNode;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  level,
  onRename,
  onDelete,
  onCreateItem,
  onMove,
  children,
}) => {
  const { activeFile, setActiveFile } = useFileStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.path.split('/').pop() || '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (file.type === 'directory') {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath === file.path) return;

    if (file.type === 'directory') {
      const sourceFileName = sourcePath.split('/').pop()!;
      const targetPath = `${file.path}/${sourceFileName}`;
      onMove(sourcePath, targetPath);
    }
  };

  return (
    <>
      <div
        className={`group flex items-center h-7 cursor-pointer rounded ${activeFile?.path === file.path ? 'bg-[#37373d]' : 'hover:bg-[#2a2a2a]'
          } ${isDragOver ? 'bg-[#2a2a2a] border border-blue-500' : ''}`}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={() => file.type === 'file' && setActiveFile(file)}
        onContextMenu={handleContextMenu}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file.type === 'directory' && (
          <button
            className="p-0.5 hover:bg-[#3c3c3c] rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )}
          </button>
        )}
        {file.type === 'directory' ? (
          <FolderIcon className="w-4 h-4 mx-1" />
        ) : (
          <DocumentIcon className="w-4 h-4 mx-1" />
        )}
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-[#3c3c3c] text-sm px-1 rounded"
            autoFocus
            onBlur={() => {
              setIsRenaming(false);
              setNewName(file.path.split('/').pop() || '');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                const newPath = file.path.split('/').slice(0, -1).concat(newName.trim()).join('/');
                onRename(file.path, newPath);
                setIsRenaming(false);
              } else if (e.key === 'Escape') {
                setIsRenaming(false);
                setNewName(file.path.split('/').pop() || '');
              }
            }}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{file.path.split('/').pop()}</span>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() => setIsRenaming(true)}
          onDelete={() => onDelete(file.path)}
          isDirectory={file.type === 'directory'}
          onCreateFile={() => {
            setIsExpanded(true);
            onCreateItem(file.path, 'file');
          }}
          onCreateFolder={() => {
            setIsExpanded(true);
            onCreateItem(file.path, 'directory');
          }}
        />
      )}

      {isExpanded && children}
    </>
  );
};

type FileExplorerProps = {
  webContainer: WebContainer;
};
const FileExplorer = ({ webContainer }: FileExplorerProps) => {
  const { files, createFile, createDirectory, deleteItem, renameItem, updateFile } = useFileStore();
  const [newItemState, setNewItemState] = useState<{
    type: 'file' | 'directory';
    parentPath: string;
    name: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleCreateItem = (parentPath: string, name: string, type: 'file' | 'directory') => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    if (type === 'file') {
      createFile(fullPath);
    } else {
      createDirectory(fullPath);
    }
    setNewItemState(null);
  };

  const handleMove = (sourcePath: string, targetPath: string) => {
    renameItem(sourcePath, targetPath);
  };

  const handleRootDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRootDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRootDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourcePath = e.dataTransfer.getData('text/plain');
    const fileName = sourcePath.split('/').pop()!;
    handleMove(sourcePath, fileName);
  };

  const renderFileTree = () => {
    const fileList = Object.values(files);
    const rootFiles: FileInfo[] = [];
    const filesByParent: { [key: string]: FileInfo[]; } = {};

    fileList.forEach((file) => {
      const parentPath = file.path.split('/').slice(0, -1).join('/');
      if (!parentPath) {
        rootFiles.push(file);
      } else {
        filesByParent[parentPath] = filesByParent[parentPath] || [];
        filesByParent[parentPath].push(file);
      }
    });

    const sortFiles = (files: FileInfo[]) => {
      return files.sort((a, b) => {
        if (a.type === b.type) {
          return a.path.localeCompare(b.path);
        }
        return a.type === 'directory' ? -1 : 1;
      });
    };

    const renderFiles = (parentFiles: FileInfo[], level: number) => {
      return sortFiles(parentFiles).map((file) => (
        <FileItem
          key={file.path}
          file={file}
          level={level}
          onRename={renameItem}
          onDelete={deleteItem}
          onCreateItem={(parentPath, type) => setNewItemState({ type, parentPath, name: '' })}
          onMove={handleMove}
          isNewItemParent={newItemState?.parentPath === file.path}
          onNewItemSubmit={handleCreateItem}
        >
          {
            file.type === 'directory' &&
            filesByParent[file.path] &&
            renderFiles(filesByParent[file.path], level + 1)
          }
          {
            newItemState?.parentPath === file.path && (
              <div className="h-7 flex items-center" style={{ paddingLeft: `${(level + 2) * 12}px` }}>
                <input
                  type="text"
                  value={newItemState.name}
                  onChange={(e) => setNewItemState({ ...newItemState, name: e.target.value })}
                  placeholder={`${newItemState.type === 'directory' ? 'Nová složka' : 'Nový soubor'}...`}
                  className="w-full bg-[#3c3c3c] text-sm px-2 h-5 rounded"
                  autoFocus
                  onBlur={() => setNewItemState(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemState.name.trim()) {
                      handleCreateItem(
                        newItemState.parentPath,
                        newItemState.name.trim(),
                        newItemState.type
                      );
                    } else if (e.key === 'Escape') {
                      setNewItemState(null);
                    }
                  }}
                />
              </div>
            )
          }
        </FileItem >
      ));
    };

    return renderFiles(rootFiles, -1);
  };

  const updateFileContent = async (path: string) => {
    const bytes = await webContainer.fs.readFile(path);
    if (!bytes) return;
    //make string from bytes
    const content = new TextDecoder('utf-8').decode(bytes);
    updateFile(path, content);
  };

  useEffect(() => {
    if (!webContainer) return;
    const watcher: IFSWatcher = webContainer.fs.watch('/', { recursive: true }, (event, path) => {
      console.log(event, path);
      if (event === 'rename') {
        const scan = async () => {
          const p = path.toString();
          const folder = p.split('/').slice(0, -1).join('/');
          const fileName = p.split('/').pop();
          let entries: any[];
          try {
            entries = await webContainer.fs.readdir(folder, { withFileTypes: true });
            console.log(entries);
          } catch (e) {
            entries = [];
          }
          const entry = entries.find((entry) => entry.name === fileName);
          if (!entry) {
            deleteItem(p);
          } else {
            if (entry._type === 1) {
              createFile(p);
              updateFileContent(p);
            } else if (entry._type === 2) {
              createDirectory(p);
            }
          }
        };
        scan();
      } else if (event === 'change') {
        updateFileContent(path.toString());
      }
    });

    return () => watcher.close();
  }, []);

  return (
    <div className="h-full bg-[#252526] text-gray-300">
      <div className="h-8 flex items-center justify-between px-4 bg-[#2d2d2d]">
        <div className="flex items-center">
          <FolderIcon className="w-4 h-4 mr-2" />
          <span className="text-sm">/</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            className="p-1 hover:bg-[#3c3c3c] rounded"
            onClick={() => setNewItemState({ type: 'file', parentPath: '', name: '' })}
            title="Nový soubor"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-[#3c3c3c] rounded"
            onClick={() => setNewItemState({ type: 'directory', parentPath: '', name: '' })}
            title="Nová složka"
          >
            <FolderPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        className={`p-2 h-[calc(100%-2rem)] overflow-auto ${isDragOver ? 'bg-[#2a2a2a]' : ''}`}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        {renderFileTree()}
        {newItemState && !newItemState.parentPath && (
          <div className="h-7 flex items-center px-2">
            <input
              type="text"
              value={newItemState.name}
              onChange={(e) => setNewItemState({ ...newItemState, name: e.target.value })}
              placeholder={`${newItemState.type === 'directory' ? 'Nová složka' : 'Nový soubor'}...`}
              className="w-full bg-[#3c3c3c] text-sm px-2 h-5 rounded"
              autoFocus
              onBlur={() => setNewItemState(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemState.name.trim()) {
                  handleCreateItem(newItemState.parentPath, newItemState.name.trim(), newItemState.type);
                } else if (e.key === 'Escape') {
                  setNewItemState(null);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;