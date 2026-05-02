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
const controllerAvailable = Date.now() >= new Date('2026-05-04T10:00:00-07:00').getTime();

createRoot(root).render(
  <StrictMode>
    <div className="app-header">
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
        <img src="controller-blueprint.webp" alt="Steam Controller" />
        <div className="unsupported-title">Browser Not Supported</div>
        <div className="unsupported-detail">This tool requires WebHID, which is available in these browsers:</div>
        <div className="unsupported-browsers">
          <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001-3.953 6.848c.318.026.639.042.964.042 6.627 0 12.013-5.373 12.013-12 0-1.056-.137-2.08-.393-3.055H15.58z"/><circle cx="12" cy="12" r="3.882"/></svg>
            Chrome
          </a>
          <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.86 17.86q.14 0 .25.12.1.13.1.25t-.11.33l-.32.46q-.43.58-1.15 1.21a7.8 7.8 0 0 1-1.67 1.09 9.9 9.9 0 0 1-4.63 1.11q-2.02 0-3.79-.73A9.4 9.4 0 0 1 7.5 19.4a9.9 9.9 0 0 1-2.08-3.19 10.2 10.2 0 0 1-.76-3.9q0-2.35.86-4.47A10.5 10.5 0 0 1 7.86 4.6a11.4 11.4 0 0 1 3.59-2.38A10.9 10.9 0 0 1 15.78 1.5q1.63 0 3.05.56a7.3 7.3 0 0 1 2.4 1.52q1 .96 1.55 2.18.54 1.21.54 2.53 0 1.88-1.13 3.22t-2.91 1.34q-.78 0-1.38-.34-.59-.35-.85-.94-.86.94-1.87.94-.98 0-1.63-.73-.64-.74-.64-1.87 0-1.55.88-2.79.87-1.24 2.13-1.24.58 0 .99.3.4.31.55.83l.12-.96h1.55l-.84 4.14q-.07.42-.07.67 0 .4.21.63.2.22.57.22.69 0 1.25-.65.55-.66.55-1.81 0-1.12-.42-2.1-.43-.97-1.17-1.7-.75-.73-1.74-1.15-1-.42-2.15-.42-1.5 0-2.82.62t-2.28 1.68q-.97 1.07-1.53 2.48-.56 1.41-.56 2.96 0 1.67.56 3.11.56 1.44 1.55 2.5t2.36 1.66q1.38.6 3 .6 1.33 0 2.47-.4 1.14-.4 2.23-1.26l.34-.28q.12-.1.24-.1z"/></svg>
            Edge
          </a>
          <a href="https://vivaldi.com/" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.09c-.464.812-1.08 1.18-1.672 1.18-.296 0-.588-.076-.856-.228l-3.366-1.94-3.366 1.94c-.268.152-.56.228-.856.228-.592 0-1.208-.368-1.672-1.18C4.96 13.968 4.22 11.404 4.22 8.698c0-.636.228-1.18.636-1.52.38-.316.88-.46 1.408-.404.888.092 1.9.7 2.736 1.648l3 3.388 3-3.388c.836-.948 1.848-1.556 2.736-1.648.528-.056 1.028.088 1.408.404.408.34.636.884.636 1.52 0 2.706-.74 5.27-1.886 7.392z"/></svg>
            Vivaldi
          </a>
        </div>
      </div>
    )}

    <a href="https://store.steampowered.com/sale/steamcontroller" target="_blank" rel="noopener noreferrer" className="new-controller-ad">
      <img src="new-controller.webp" alt="New Steam Controller" />
      <div className="new-controller-ad-text">
        <div className="new-controller-ad-title">The New Steam Controller</div>
        <div className="new-controller-ad-sub">{controllerAvailable ? 'Now Available!' : 'Available May 4, 10AM Pacific'}</div>
      </div>
    </a>

    <div className="disclaimer">
      <div className="footer-icons">
        <a href="https://github.com/mitchmikusek/steam_controller_tools" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/></svg>
        </a>
        <a href="https://ko-fi.com/mitchmikusek" target="_blank" rel="noopener noreferrer" aria-label="Ko-fi">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/></svg>
        </a>
        <a href="https://store.steampowered.com/app/353370/Steam_Controller_2015/" target="_blank" rel="noopener noreferrer" aria-label="Steam Controller on Steam">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.985 1.3 1.2a2.263 2.263 0 0 0 2.898-1.37 2.253 2.253 0 0 0-.003-1.73 2.259 2.259 0 0 0-1.207-1.21 2.256 2.256 0 0 0-1.391-.136l1.524.63c.916.378 1.352 1.432.975 2.349-.378.917-1.432 1.353-2.349.977h-.001l.727-.1zm8.397-8.163a3.013 3.013 0 0 0-3.012-3.012 3.014 3.014 0 0 0-3.014 3.012 3.013 3.013 0 0 0 3.014 3.013 3.012 3.012 0 0 0 3.012-3.013zm-5.27-.005a2.26 2.26 0 0 1 2.256-2.256 2.259 2.259 0 0 1 2.259 2.256 2.26 2.26 0 0 1-2.259 2.259 2.26 2.26 0 0 1-2.256-2.259z"/></svg>
        </a>
      </div>
      <div style={{ marginBottom: 8 }}><LanguageSwitcher /></div>
      <div>Not affiliated with Valve Corporation. Use this tool at your own risk.</div>
      <div style={{ marginTop: 4 }}>
        &copy;2026 Valve Corporation. Steam&reg; and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries.
      </div>
    </div>
  </StrictMode>
);
