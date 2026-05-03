import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './i18n';
import './style.css';
import { App } from './App';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { BleModesButton } from './components/BleModesButton';

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

// Konami code easter egg
const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];
let konamiPos = 0;
function showCake() {
  root.style.display = 'none';
  const existing = document.querySelector('.easter-egg');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'easter-egg';
  const img = document.createElement('img');
  img.src = 'cake.webp';
  img.alt = 'cake';
  const text = document.createElement('div');
  text.className = 'easter-egg-text';
  text.textContent = 'The cake is a lie.';
  const btn = document.createElement('button');
  btn.className = 'btn-ghost btn-sm';
  btn.textContent = 'Return to reality';
  btn.addEventListener('click', () => {
    el.remove();
    root.style.display = '';
  });
  el.appendChild(img);
  el.appendChild(text);
  el.appendChild(btn);
  document.body.appendChild(el);
  window.dispatchEvent(new CustomEvent('easter-egg'));
}
document.addEventListener('keydown', (e) => {
  if (e.key === KONAMI[konamiPos]) {
    konamiPos++;
    if (konamiPos === KONAMI.length) {
      konamiPos = 0;
      showCake();
    }
  } else {
    konamiPos = e.key === KONAMI[0] ? 1 : 0;
  }
});

createRoot(root).render(
  <StrictMode>
    <div className="app-header">
      <h1>Steam Controller (2015)</h1>
      <div className="subtitle">Firmware Flash Tool</div>
    </div>

    {'hid' in navigator ? (
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Sentry.ErrorBoundary
          fallback={<div className="unsupported">Something went wrong. Please refresh the page.</div>}
        >
          <App />
        </Sentry.ErrorBoundary>
      </main>
    ) : (
      <div className="unsupported">
        <img src="controller-blueprint.webp" alt="Steam Controller" />
        <div className="unsupported-title">Browser Not Supported</div>
        <div className="unsupported-detail">This tool requires a Chromium-based browser with WebHID support.</div>
      </div>
    )}

    <a
      href="https://store.steampowered.com/sale/steamcontroller"
      target="_blank"
      rel="noopener noreferrer"
      className="new-controller-ad"
    >
      <img src="new-controller.webp" alt="New Steam Controller" />
      <div className="new-controller-ad-text">
        <div className="new-controller-ad-title">The New Steam Controller</div>
        <div className="new-controller-ad-sub">
          {controllerAvailable ? 'Now Available!' : 'Available May 4, 10AM Pacific'}
        </div>
      </div>
    </a>

    <div className="disclaimer">
      <div className="footer-icons">
        <a
          href="https://github.com/mitchmikusek/steam_controller_tools"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
          </svg>
        </a>
        <a
          href="https://ko-fi.com/mitchmikusek"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ko-fi"
          title="Ko-fi"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
          </svg>
        </a>
        <a
          href="https://steamcommunity.com/id/CatSensei"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Steam Profile"
          title="Steam Profile"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </a>
        <a
          href="https://help.steampowered.com/en/faqs/view/1796-5FC3-88B3-C85F"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Steam BLE Support"
          title="Steam BLE Support"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.985 1.3 1.2a2.263 2.263 0 0 0 2.898-1.37 2.253 2.253 0 0 0-.003-1.73 2.259 2.259 0 0 0-1.207-1.21 2.256 2.256 0 0 0-1.391-.136l1.524.63c.916.378 1.352 1.432.975 2.349-.378.917-1.432 1.353-2.349.977h-.001l.727-.1zm8.397-8.163a3.013 3.013 0 0 0-3.012-3.012 3.014 3.014 0 0 0-3.014 3.012 3.013 3.013 0 0 0 3.014 3.013 3.012 3.012 0 0 0 3.012-3.013zm-5.27-.005a2.26 2.26 0 0 1 2.256-2.256 2.259 2.259 0 0 1 2.259 2.256 2.26 2.26 0 0 1-2.259 2.259 2.26 2.26 0 0 1-2.256-2.259z" />
          </svg>
        </a>
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <LanguageSwitcher />
        <BleModesButton />
      </div>
      <div>Not affiliated with Valve Corporation. Use this tool at your own risk.</div>
      <div style={{ marginTop: 4 }}>
        &copy;2026 Valve Corporation. Steam&reg; and the Steam logo are trademarks and/or registered trademarks of Valve
        Corporation in the U.S. and/or other countries.
      </div>
    </div>
  </StrictMode>,
);
