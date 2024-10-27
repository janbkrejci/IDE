import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import { useThemeStore } from './store/themeStore';

function App() {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15}>
          <FileExplorer />
        </Panel>
        <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" />
        <Panel>
          <Editor />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;