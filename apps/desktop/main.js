const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const VALVE_VID = 0x28de;

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    title: 'Steam Controller Flash Tool',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setMenuBarVisibility(false);

  // Auto-grant HID permission for Valve devices
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === 'hid';
  });

  session.defaultSession.setDevicePermissionHandler((details) => {
    return details.deviceType === 'hid' && details.device?.vendorId === VALVE_VID;
  });

  // Auto-select Valve HID device (skips the browser device picker)
  session.defaultSession.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    const valve = details.deviceList.find((d) => d.vendorId === VALVE_VID);
    if (valve) {
      callback(valve.deviceId);
    } else {
      // No matching device — return empty to let the request fail gracefully
      callback('');
    }
  });

  // Load the built UI
  const uiPath = path.join(__dirname, 'ui', 'index.html');
  win.loadFile(uiPath);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
