import React, { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import { useThemeStore } from './store/themeStore';
import Terminal from './components/Terminal';
import { WebContainer } from '@webcontainer/api';

const tabs = [
  { label: 'IDE', code: 'IDE' },
  { label: 'Terminal 1', code: 'Terminal 1' },
  { label: 'Terminal 2', code: 'Terminal 2' },
  { label: 'Browser', code: 'Browser' },
];

type AppProps = {
  webContainer: WebContainer;
};

function App({ webContainer }: AppProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const [activeTab, setActiveTab] = React.useState('IDE');
  const [previewURL, setPreviewURL] = React.useState('about:blank');

  useEffect(() => {
    if (webContainer) {
      webContainer.on('server-ready', (_port, url) => {
        setPreviewURL(url);
        setActiveTab('Browser');
      });
    }
  }, [webContainer]);

  return (
    <div className={`max-h-screen h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <div className="select-none flex min-h-fit overflow-x-auto bg-[#252526] border-b border-[#3c3c3c]">
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

      <div className={activeTab === 'IDE' ? 'h-full w-full' : 'hidden'}>
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <FileExplorer webContainer={webContainer} />
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" />
          <Panel>
            <Editor webContainer={webContainer} />
          </Panel>
        </PanelGroup>
      </div>

      <div className={activeTab === 'Terminal 1' ? 'h-full w-ful' : 'hidden'}>
        <PanelGroup direction='vertical'>
          <Terminal webContainer={webContainer} visible={activeTab == 'Terminal 1'} />
        </PanelGroup>
      </div>
      <div className={activeTab === 'Terminal 2' ? 'h-full w-ful' : 'hidden'}>
        <PanelGroup direction='vertical'>
          <Terminal webContainer={webContainer} visible={activeTab == 'Terminal 2'} />
        </PanelGroup>
      </div>

      <div className={activeTab === 'Browser' ? 'h-full w-ful' : 'hidden'}>
        <PanelGroup direction='vertical'>
          <Panel className="text-white light">
            <iframe src={previewURL} className="w-full h-full bg-gray-200" />
          </Panel>
        </PanelGroup>
      </div>

    </div>
  );
}

export default App;