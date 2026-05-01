import './style.css';
import { App } from './app';

const root = document.getElementById('app')!;

// Header (always shown)
const header = document.createElement('div');
header.className = 'app-header';
const h1 = document.createElement('h1');
h1.textContent = 'Steam Controller (2015)';
const sub = document.createElement('div');
sub.className = 'subtitle';
sub.textContent = 'Firmware Flash Tool';
header.appendChild(h1);
header.appendChild(sub);
root.appendChild(header);

if (!('hid' in navigator)) {
  const banner = document.createElement('div');
  banner.className = 'unsupported';
  banner.textContent = 'Your browser does not support WebHID. Please use Chrome, Edge, or Vivaldi.';
  root.appendChild(banner);
} else {
  new App(root);
}

// Disclaimer footer (always shown)
const footer = document.createElement('div');
footer.className = 'disclaimer';
const line1 = document.createElement('div');
line1.textContent = 'Not affiliated with Valve Corporation. Use this tool at your own risk.';
const line2 = document.createElement('div');
line2.style.marginTop = '4px';
line2.textContent = '\u00A92026 Valve Corporation. Steam\u00AE and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries.';
footer.appendChild(line1);
footer.appendChild(line2);
root.appendChild(footer);
