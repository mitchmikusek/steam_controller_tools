import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './i18n';
import './style.css';
import { App } from './App';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { UnsupportedBrowser } from './components/UnsupportedBrowser';

// Initialize Sentry (production only)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
  });
}

// Clean up cache-busting param left by stale-asset recovery
if (location.search.includes('_=')) {
  history.replaceState(null, '', location.pathname + location.hash);
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
    <AppHeader />

    {'hid' in navigator ? (
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Sentry.ErrorBoundary
          fallback={<div className="unsupported">Something went wrong. Please refresh the page.</div>}
        >
          <App />
        </Sentry.ErrorBoundary>
      </main>
    ) : (
      <UnsupportedBrowser />
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

    <AppFooter />
  </StrictMode>,
);
