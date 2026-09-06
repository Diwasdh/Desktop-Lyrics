import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopLyrics', {
  onMediaEvent: (callback: (event: any) => void) => {
    const listener = (_e: any, value: any) => callback(value);
    ipcRenderer.on('media:event', listener);
    return () => ipcRenderer.removeListener('media:event', listener);
  },
  onModeChanged: (callback: (mode: 'widget' | 'full' | 'compact' | 'island') => void) => {
    const listener = (_e: any, value: any) => callback(value);
    ipcRenderer.on('window:mode-changed', listener);
    return () => ipcRenderer.removeListener('window:mode-changed', listener);
  },
  sendMediaCommand: (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => {
    ipcRenderer.send('media:command', cmd);
  },
  setAlwaysOnTop: (val: boolean) => {
    ipcRenderer.send('window:set-always-on-top', val);
  },
  setClickThrough: (val: boolean) => {
    ipcRenderer.send('window:set-click-through', val);
  },
  setIgnoreMouseEvents: (ignore: boolean, forward = true) => {
    ipcRenderer.send('window:set-ignore-mouse-events', ignore, forward);
  },
  onToggleClickThrough: (callback: (val: boolean) => void) => {
    const listener = (_e: any, val: boolean) => callback(val);
    ipcRenderer.on('window:toggle-click-through', listener);
    return () => ipcRenderer.removeListener('window:toggle-click-through', listener);
  },
  setOpacity: (val: number) => {
    ipcRenderer.send('window:set-opacity', val);
  },
  setWindowMode: (mode: 'widget' | 'full' | 'compact' | 'island') => {
    ipcRenderer.send('window:set-mode', mode);
  },
  minimize: () => {
    ipcRenderer.send('window:minimize');
  },
  close: () => {
    ipcRenderer.send('window:close');
  },
  alignTopCenter: () => {
    ipcRenderer.send('window:align-top-center');
  },
});
