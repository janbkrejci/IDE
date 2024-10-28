import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { useEffect, useRef, useCallback } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

type TerminalProps = {
  webContainer: WebContainer;
  visible?: boolean;
};
const Terminal = ({ webContainer, visible }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    xtermRef.current = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        //selection: '#5b5b5b',
        black: '#1e1e1e',
        white: '#ffffff',
      },
      allowTransparency: true,
      scrollback: 1000,
      convertEol: true,
    });

    fitAddonRef.current = new FitAddon();
    xtermRef.current.loadAddon(fitAddonRef.current);
    xtermRef.current.open(terminalRef.current);

    return xtermRef.current;
  }, []);

  const fitTerminal = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {
          console.error('Error fitting terminal:', e);
        }
      });
    }
  }, []);

  useEffect(() => {
    const terminal = xtermRef.current;
    if (!terminal) return;
    terminal.focus();
  }, [visible]);

  useEffect(() => {
    const terminal = initTerminal();
    if (!terminal) return;

    const initialFitTimeout = setTimeout(() => {
      fitTerminal();
      terminal.focus();
      let shellProcess: WebContainerProcess;
      async function startShell() {
        shellProcess = await webContainer.spawn('jsh', {
          terminal: {
            cols: terminal.cols,
            rows: terminal.rows
          }
        });
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data);
            }
          })
        );

        const input = shellProcess.input.getWriter();

        terminal.onData((data) => {
          input.write(data);
        });

        window.addEventListener('resize', () => {
          //fitAddon.fit();
          shellProcess.resize({
            cols: terminal.cols,
            rows: terminal.rows
          });
        });

        terminal.write('Welcome to WebContainers Terminal!\r\n');
        // if startup.sh exists, run it after one second
        setTimeout(async () => {
          const startup = await webContainer.fs.readFile('/startup.sh');
          if (startup) {
            terminal.input('sh startup.sh\n');
          }
        }, 1000);
      }
      startShell();
    }, 100);

    const dataListener = terminal.onData((data) => {
      //handleInput(terminal, data);
    });

    const handleResize = () => {
      fitTerminal();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initialFitTimeout);
      window.removeEventListener('resize', handleResize);
      dataListener.dispose();
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [initTerminal, fitTerminal]);

  return (
    <div className={`h-full flex flex-col bg-[#1e1e1e] ${visible ? '' : 'hidden'}`}>
      {/* <div className="h-8 bg-[#252526] flex items-center px-4">
        <span className="text-gray-300 text-sm">Terminal</span>
      </div> */}
      <PanelGroup direction="vertical">
        <Panel>
          <div
            ref={terminalRef}
            className="flex-1 overflow-hidden"
            style={{ padding: '4px' }}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Terminal;