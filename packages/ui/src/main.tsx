import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { App } from './App';

const root = document.getElementById('app')!;

createRoot(root).render(
  <StrictMode>
    <div className="app-header">
      <h1>Steam Controller (2015)</h1>
      <div className="subtitle">Firmware Flash Tool</div>
    </div>

    {'hid' in navigator ? (
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <App />
      </main>
    ) : (
      <div className="unsupported">
        Your browser does not support WebHID. Please use Chrome, Edge, or Vivaldi.
      </div>
    )}

    <div className="disclaimer">
      <div>Not affiliated with Valve Corporation. Use this tool at your own risk.</div>
      <div style={{ marginTop: 4 }}>
        &copy;2026 Valve Corporation. Steam&reg; and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries.
      </div>
    </div>
  </StrictMode>
);
