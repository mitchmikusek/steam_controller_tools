import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isBundled: true,
  loadFirmware: (path: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('load-firmware', path),
});
