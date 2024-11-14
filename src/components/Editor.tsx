import React from 'react';
import { useFileStore } from '../store/fileStore';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { WebContainer } from '@webcontainer/api';

type CodeEditorProps = {
  webContainer: WebContainer;
};

const CodeEditor = ({ webContainer }: CodeEditorProps) => {
  const { activeFile, files, setFiles, setActiveFile, openTabs, setOpenTabs } = useFileStore();

  // Add file to tabs when activated
  React.useEffect(() => {
    if (activeFile && !openTabs.some(tab => tab.path === activeFile.path)) {
      setOpenTabs([...openTabs, { 
        file: activeFile.path.split('/').pop() || '',
        path: activeFile.path 
      }]);
    }
  }, [activeFile]);

  const handleEditorWillMount = (monaco: Monaco) => {
    // Configure TypeScript/JavaScript language features
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Enable type definitions
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      strict: true,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      typeRoots: ['node_modules/@types'],
    });
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Add keyboard shortcut for code folding
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyL, () => {
      editor.trigger('fold', 'editor.fold', null);
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyO, () => {
      editor.trigger('unfold', 'editor.unfold', null);
    });
  };

  const handleContentChange = async (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      const updatedFiles = files.map((f) =>
        f.path === activeFile.path ? { ...f, content: value } : f
      );
      setFiles(updatedFiles);
      if (webContainer) {
        await webContainer.fs.writeFile(activeFile.path, value);
      }
    }
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'scss':
        return 'scss';
      case 'less':
        return 'less';
      case 'md':
        return 'markdown';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'sql':
        return 'sql';
      case 'py':
        return 'python';
      case 'sh':
        return 'shell';
      case 'dockerfile':
        return 'dockerfile';
      case 'go':
        return 'go';
      case 'rust':
      case 'rs':
        return 'rust';
      default:
        return 'plaintext';
    }
  };

  const closeTab = (path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newTabs = openTabs.filter((tab) => tab.path !== path);
    setOpenTabs(newTabs);

    if (activeFile?.path === path) {
      const nextTab = newTabs[newTabs.length - 1];
      const nextFile = nextTab ? files.find((f) => f.path === nextTab.path) : null;
      setActiveFile(nextFile || null);
    }
  };

  return (
    <div className="h-full bg-editor-bg text-gray-300 flex flex-col">
      {/* Tabs */}
      <div className="flex overflow-x-auto bg-[#252526] border-b border-[#3c3c3c]">
        {openTabs.map((tab) => {
          const file = files.find((f) => f.path === tab.path);
          const isActive = activeFile?.path === tab.path;
          return (
            <div
              key={tab.path}
              className={`group flex items-center px-3 py-2 cursor-pointer border-r border-[#3c3c3c] min-w-[100px] max-w-[200px] ${isActive ? 'bg-editor-bg' : 'hover:bg-[#2d2d2d]'
                }`}
              onClick={() => file && setActiveFile(file)}
            >
              <span className="text-sm truncate flex-1">
                {tab.file}
              </span>
              <button
                className="ml-2 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c]"
                onClick={(e) => closeTab(tab.path, e)}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Area */}
      <div className="flex-1">
        {activeFile?.type === 'file' ? (
          <Editor
            height="100%"
            defaultLanguage={getLanguage(activeFile.path)}
            value={activeFile.content}
            onChange={handleContentChange}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            path={activeFile.path}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              foldingHighlight: true,
              renderLineHighlight: 'all',
              matchBrackets: 'always',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              wordBasedSuggestions: "allDocuments",
              parameterHints: {
                enabled: true,
                cycle: true,
              },
              suggest: {
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true,
              },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {activeFile ? 'Složku nelze upravovat' : 'Vyberte soubor, který chcete upravit'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;