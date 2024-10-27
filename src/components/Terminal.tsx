import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

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
        selection: '#5b5b5b',
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

  const executeCommand = async (command: string) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    // Add command to history
    if (command.trim()) {
      commandHistoryRef.current.push(command);
      historyIndexRef.current = commandHistoryRef.current.length;
    }

    try {
      // Execute command using JSH
      const response = await fetch('/__jsh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      const result = await response.text();
      terminal.writeln(result);
    } catch (error) {
      terminal.writeln(`\r\nError: ${error}`);
    }

    terminal.write('\r\n$ ');
  };

  const handleInput = (terminal: XTerm, data: string) => {
    const code = data.charCodeAt(0);
    const buffer = inputBufferRef.current;

    // Handle special keys
    switch (code) {
      case 13: // Enter
        terminal.writeln('');
        executeCommand(buffer);
        inputBufferRef.current = '';
        return;

      case 127: // Backspace
        if (buffer.length > 0) {
          terminal.write('\b \b');
          inputBufferRef.current = buffer.slice(0, -1);
        }
        return;

      case 27: // ESC
        if (data === '\u001b[A') { // Up arrow
          if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const command = commandHistoryRef.current[historyIndexRef.current];
            // Clear current line
            terminal.write('\r$ ' + ' '.repeat(buffer.length) + '\r$ ' + command);
            inputBufferRef.current = command;
          }
          return;
        }
        if (data === '\u001b[B') { // Down arrow
          if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
            historyIndexRef.current++;
            const command = commandHistoryRef.current[historyIndexRef.current];
            terminal.write('\r$ ' + ' '.repeat(buffer.length) + '\r$ ' + command);
            inputBufferRef.current = command;
          } else {
            historyIndexRef.current = commandHistoryRef.current.length;
            terminal.write('\r$ ' + ' '.repeat(buffer.length) + '\r$ ');
            inputBufferRef.current = '';
          }
          return;
        }
        break;
    }

    // Print printable characters
    if (code >= 32 && code <= 126) {
      terminal.write(data);
      inputBufferRef.current += data;
    }
  };

  useEffect(() => {
    const terminal = initTerminal();
    if (!terminal) return;

    const initialFitTimeout = setTimeout(() => {
      fitTerminal();
      terminal.focus();
      terminal.writeln('Welcome to JSH (JavaScript Shell)');
      terminal.writeln('Type "help" for available commands.');
      terminal.write('\r\n$ ');
    }, 100);

    const dataListener = terminal.onData((data) => {
      handleInput(terminal, data);
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
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="h-8 bg-[#252526] flex items-center px-4">
        <span className="text-gray-300 text-sm">Terminal</span>
      </div>
      <div 
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{ padding: '4px' }}
      />
    </div>
  );
};

export default Terminal;