import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './i18n';
import './style.css';
import { App } from './App';
import { LanguageSwitcher } from './components/LanguageSwitcher';

// Initialize Sentry (production only)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
  });
}

const root = document.getElementById('app')!;

createRoot(root).render(
  <StrictMode>
    <div className="app-header">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <LanguageSwitcher />
      </div>
      <h1>Steam Controller (2015)</h1>
      <div className="subtitle">Firmware Flash Tool</div>
    </div>

    {'hid' in navigator ? (
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Sentry.ErrorBoundary fallback={<div className="unsupported">Something went wrong. Please refresh the page.</div>}>
          <App />
        </Sentry.ErrorBoundary>
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
