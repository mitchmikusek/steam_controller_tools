import { app, BrowserWindow, session, ipcMain } from 'electron';
import { join } from 'path';
import { readFile } from 'fs/promises';

const VALVE_VID = 0x28de;
const ALLOWED_PIDS = [0x1102, 0x1002];

function setupHIDPermissions(): void {
  // Auto-grant HID permission for Valve devices
  session.defaultSession.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid') {
      const d = details.device as any;
      if (d.vendorId === VALVE_VID && ALLOWED_PIDS.includes(d.productId)) {
        return true;
      }
    }
    return false;
  });

  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    if (permission === 'hid') return true;
    return true;
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(import.meta.dirname, 'preload.js'),
    },
  });

  // Auto-select Valve HID devices without showing picker
  win.webContents.session.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    const valve = details.deviceList.find(
      (d: any) => d.vendorId === VALVE_VID && ALLOWED_PIDS.includes(d.productId),
    );
    callback(valve?.deviceId ?? '');
  });

  // In dev mode, load from Vite dev server
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  } else {
    // Production: load built UI
    win.loadFile(join(import.meta.dirname, '../../packages/ui/dist/index.html'));
  }

  return win;
}

// IPC handler for loading bundled firmware
ipcMain.handle('load-firmware', async (_event, relativePath: string) => {
  const fwDir = app.isPackaged
    ? join(process.resourcesPath, 'fw_images')
    : join(import.meta.dirname, '../resources/fw_images');
  const fullPath = join(fwDir, relativePath);
  const buffer = await readFile(fullPath);
  return buffer.buffer;
});

app.whenReady().then(() => {
  setupHIDPermissions();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
