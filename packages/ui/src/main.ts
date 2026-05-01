import './style.css';
import { App } from './app';

const root = document.getElementById('app')!;

// Check WebHID support
if (!('hid' in navigator)) {
  const banner = document.createElement('div');
  banner.className = 'unsupported';
  banner.textContent = 'Your browser does not support WebHID. Please use Chrome, Edge, or Vivaldi.';
  root.appendChild(banner);
} else {
  const header = document.createElement('h1');
  header.textContent = 'Steam Controller Flash Tool';
  root.appendChild(header);

  const subtitle = document.createElement('div');
  subtitle.className = 'subtitle';
  subtitle.textContent = 'Flash BLE (Bluetooth) firmware onto your original Steam Controller';
  root.appendChild(subtitle);

  new App(root);
}
