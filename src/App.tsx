import React, { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import { useThemeStore } from './store/themeStore';
import Terminal from './components/Terminal';
import { WebContainer } from '@webcontainer/api';

const tabs = [
  { label: 'IDE', code: 'IDE' },
  { label: 'Terminal', code: 'Terminal' },
  { label: 'Output', code: 'Output' },
];

type AppProps = {
  webContainer: WebContainer;
};
function App({ webContainer }: AppProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const [activeTab, setActiveTab] = React.useState('IDE');

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <div className="flex overflow-x-auto bg-[#252526] border-b border-[#3c3c3c]">
        {tabs.map(({ label, code }) => {

          const isActive = activeTab === code;
          return (
            <div
              key={code}
              className={`group flex items-center px-3 py-2 cursor-pointer border-r border-[#3c3c3c] min-w-[100px] max-w-[200px] ${isActive ? 'bg-editor-bg' : 'hover:bg-[#2d2d2d]'
                }`}
              onClick={() => setActiveTab(code)}
            >
              <span className="text-sm truncate flex-1">
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {activeTab === 'IDE' && <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15}>
          <FileExplorer />
        </Panel>
        <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" />
        <Panel>
          <Editor />
        </Panel>
      </PanelGroup>}
      <Terminal webContainer={webContainer} visible={activeTab == 'Terminal'} />
    </div>
  );
}

export default App;