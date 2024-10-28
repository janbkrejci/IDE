import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { WebContainer } from '@webcontainer/api';

const root = createRoot(document.getElementById('root')!);

root.render(
  <div className={`h-screen flex flex-col dark`}>
    <div className="flex-1">
      <div className="flex items-center justify-center h-full text-gray-500">
        Spouští se vývojové prostředí, čekejte...
      </div>
    </div>
  </div>
);

// Call only once
const webContainer = await WebContainer.boot({
  coep: 'credentialless',
  workdirName: 'wc'
});

root.render(
  <StrictMode>
    <App webContainer={webContainer} />
  </StrictMode>
);
