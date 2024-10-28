import { create } from 'zustand';

export interface FileInfo {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

interface FileStore {
  files: FileInfo[];
  activeFile: FileInfo | null;
  openTabs: string[];
  setFiles: (files: FileInfo[]) => void;
  setActiveFile: (file: FileInfo | null) => void;
  setOpenTabs: (tabs: string[]) => void;
  createFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  createDirectory: (path: string) => void;
  deleteItem: (path: string) => void;
  renameItem: (oldPath: string, newPath: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  activeFile: null,
  openTabs: [],
  setFiles: (files) => set({ files }),
  setActiveFile: (file) => set({ activeFile: file }),
  setOpenTabs: (tabs) => set({ openTabs: tabs }),
  createFile: (path) => {
    const newFile: FileInfo = { path, content: '', type: 'file' };
    set((state) => ({
      files: [...state.files, newFile],
      //activeFile: newFile,
      //openTabs: [...state.openTabs, path],
    }));
  },
  updateFile: (path, content) => {
    const newFile: FileInfo = { path, content, type: 'file' };
    set((state) => ({
      files: [...state.files.filter(x => x.path != path), newFile],
    }));
  },
  createDirectory: (path) => {
    set((state) => ({
      files: [...state.files, { path, content: '', type: 'directory' }],
    }));
  },
  deleteItem: (path) => {
    set((state) => ({
      files: state.files.filter((f) => !f.path.startsWith(path)),
      activeFile: state.activeFile?.path.startsWith(path) ? null : state.activeFile,
      openTabs: state.openTabs.filter((tab) => !tab.startsWith(path)),
    }));
  },
  renameItem: (oldPath, newPath) => {
    set((state) => {
      const updatedTabs = state.openTabs.map((tab) =>
        tab === oldPath ? newPath : tab
      );

      return {
        files: state.files.map((f) => ({
          ...f,
          path: f.path.startsWith(oldPath)
            ? newPath + f.path.slice(oldPath.length)
            : f.path,
        })),
        activeFile: state.activeFile?.path.startsWith(oldPath)
          ? { ...state.activeFile, path: newPath }
          : state.activeFile,
        openTabs: updatedTabs,
      };
    });
  },
}));