import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, globalShortcut } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import { MacMediaBridge } from './mac-media-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let bridgeProcess: ChildProcess | null = null;
let macMediaBridge: MacMediaBridge | null = null;
let isClickThrough = false;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getBridgePath(): string {
  const possiblePaths = [
    path.join(process.resourcesPath, 'native', 'win-media-bridge.exe'),
    path.join(process.cwd(), 'native', 'win-media-bridge.exe'),
    path.join(__dirname, '../../native', 'win-media-bridge.exe'),
    path.join(app.getAppPath(), 'native', 'win-media-bridge.exe'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'native', 'win-media-bridge.exe');
}

function getAppIconPath(): string {
  const possible = [
    path.join(process.resourcesPath, 'logo_icon.png'),
    path.join(process.cwd(), 'logo_icon.png'),
    path.join(__dirname, '../../logo_icon.png'),
    path.join(__dirname, '../logo_icon.png'),
    path.join(app.getAppPath(), 'logo_icon.png'),
  ];
  for (const p of possible) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'logo_icon.png');
}

function createWindow() {
  const initialWidth = 500;
  const initialHeight = 300;
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    title: 'Universal Desktop Lyrics',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    width: initialWidth,
    height: initialHeight,
    center: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    minWidth: 280,
    minHeight: 34,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.center();
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setSkipTaskbar(true);
  mainWindow.show();
  mainWindow.focus();

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window did-finish-load successfully!');
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Window did-fail-load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[RENDERER LOG] (${sourceId}:${line}):`, message);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details);
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  console.log('Loading file:', distIndex, 'Exists:', fs.existsSync(distIndex));
  mainWindow.loadFile(distIndex).catch((err) => {
    console.error('Failed to loadFile:', err);
  });

  // Prevent window destruction; hide to system tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  initTray();
  startMediaBridge();
}

function initTray() {
  const iconPath = getAppIconPath();
  let trayIcon: Electron.NativeImage;

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  try {
    tray = new Tray(trayIcon);
  } catch (e) {
    const emptyIcon = nativeImage.createEmpty();
    tray = new Tray(emptyIcon);
  }

  tray.setToolTip('Universal Desktop Lyrics');

  const updateContextMenu = () => {
    const isVisible = mainWindow?.isVisible() ?? false;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Universal Desktop Lyrics',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: isVisible ? 'Hide to Tray' : 'Show / Restore Lyrics',
        click: () => {
          if (!mainWindow) return;
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Top Dynamic Island',
        click: () => {
          setWindowMode('island');
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      {
        label: 'Dynamic Island (Compact)',
        click: () => {
          setWindowMode('compact');
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      {
        label: 'Mini Floating Widget',
        click: () => {
          setWindowMode('widget');
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      {
        label: 'Full Lyrics Canvas',
        click: () => {
          setWindowMode('full');
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: 'separator' },
      {
        label: 'Play / Pause',
        click: () => sendBridgeCommand('toggle'),
      },
      {
        label: 'Next Track',
        click: () => sendBridgeCommand('next'),
      },
      {
        label: 'Previous Track',
        click: () => sendBridgeCommand('previous'),
      },
      { type: 'separator' },
      {
        label: 'Toggle Click-Through (Ctrl+Shift+X)',
        click: () => {
          isClickThrough = !isClickThrough;
          mainWindow?.setIgnoreMouseEvents(isClickThrough, { forward: true });
          mainWindow?.webContents.send('window:toggle-click-through', isClickThrough);
        },
      },
      {
        label: 'Always On Top',
        type: 'checkbox',
        checked: true,
        click: (item) => {
          mainWindow?.setAlwaysOnTop(item.checked, 'screen-saver');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Desktop Lyrics',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray?.setContextMenu(contextMenu);
  };

  updateContextMenu();

  // Left-click on tray icon toggles show / hide
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  tray.on('double-click', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
  });

  tray.on('right-click', () => {
    updateContextMenu();
  });
}

function startMediaBridge() {
  if (process.platform === 'darwin') {
    if (!macMediaBridge) {
      macMediaBridge = new MacMediaBridge(() => mainWindow);
    }
    macMediaBridge.start();
    return;
  }

  if (process.platform !== 'win32') {
    console.log('[MediaBridge] Platform not supported for native bridge:', process.platform);
    return;
  }

  const bridgeExe = getBridgePath();
  if (!fs.existsSync(bridgeExe)) {
    console.error('win-media-bridge.exe not found at:', bridgeExe);
    return;
  }

  console.log('Spawning Windows Media Bridge:', bridgeExe);
  bridgeProcess = spawn(bridgeExe, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let lineBuffer = '';

  bridgeProcess.stdout?.on('data', (chunk: Buffer) => {
    lineBuffer += chunk.toString('utf8');
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('media:event', parsed);
        }
      } catch (e) {
        // Not a JSON line, ignore
      }
    }
  });

  bridgeProcess.stderr?.on('data', (data) => {
    console.error('Bridge error:', data.toString());
  });

  bridgeProcess.on('exit', (code) => {
    console.log('Bridge process exited with code', code);
    bridgeProcess = null;
    // Auto restart bridge if app is still alive
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !bridgeProcess && process.platform === 'win32') {
        console.log('Restarting Windows Media Bridge...');
        startMediaBridge();
      }
    }, 1500);
  });
}

function sendBridgeCommand(cmd: string) {
  if (process.platform === 'darwin' && macMediaBridge) {
    macMediaBridge.sendCommand(cmd);
    return;
  }

  if (bridgeProcess && bridgeProcess.stdin && !bridgeProcess.killed) {
    try {
      bridgeProcess.stdin.write(cmd + '\n');
    } catch (e) {
      console.error('Error writing to bridge stdin:', e);
    }
  }
}

function alignIslandTopCenter() {
  if (!mainWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x: screenX, y: screenY, width: screenWidth } = primaryDisplay.workArea;
  const islandWidth = 680;
  const islandHeight = 36;
  const x = screenX + Math.round((screenWidth - islandWidth) / 2);
  const y = screenY; // Flush with top of screen
  mainWindow.setBounds({ x, y, width: islandWidth, height: islandHeight }, true);
}

function setWindowMode(mode: 'widget' | 'full' | 'compact' | 'island') {
  if (!mainWindow) return;

  if (mode === 'widget') {
    mainWindow.setMinimumSize(320, 120);
    mainWindow.setSize(500, 260, true);
  } else if (mode === 'full') {
    mainWindow.setMinimumSize(320, 200);
    mainWindow.setSize(500, 680, true);
  } else if (mode === 'compact') {
    mainWindow.setMinimumSize(320, 60);
    mainWindow.setSize(520, 84, true);
  } else if (mode === 'island') {
    mainWindow.setMinimumSize(280, 32);
    alignIslandTopCenter();
  }

  mainWindow.webContents.send('window:mode-changed', mode);
}

// IPC Handlers
ipcMain.on('window:align-top-center', () => {
  alignIslandTopCenter();
});

ipcMain.on('media:command', (_event, cmd: string) => {
  sendBridgeCommand(cmd);
});

ipcMain.on('window:set-always-on-top', (_event, val: boolean) => {
  mainWindow?.setAlwaysOnTop(val, 'screen-saver');
});

ipcMain.on('window:set-click-through', (_event, val: boolean) => {
  isClickThrough = val;
  mainWindow?.setIgnoreMouseEvents(val, { forward: true });
});

ipcMain.on('window:set-ignore-mouse-events', (_event, ignore: boolean, forward = true) => {
  if (isClickThrough) {
    mainWindow?.setIgnoreMouseEvents(ignore, { forward });
  }
});

ipcMain.on('window:set-opacity', (_event, opacity: number) => {
  mainWindow?.setOpacity(Math.max(0.1, Math.min(1.0, opacity)));
});

ipcMain.on('window:set-mode', (_event, mode: 'widget' | 'full' | 'compact' | 'island') => {
  setWindowMode(mode);
});

ipcMain.on('window:minimize', () => {
  mainWindow?.hide();
});

ipcMain.on('window:hide', () => {
  mainWindow?.hide();
});

ipcMain.on('window:close', () => {
  mainWindow?.hide();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  createWindow();

  // Register Global Shortcut: Ctrl+Shift+X to toggle click-through anytime
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    isClickThrough = !isClickThrough;
    mainWindow?.setIgnoreMouseEvents(isClickThrough, { forward: true });
    mainWindow?.webContents.send('window:toggle-click-through', isClickThrough);
    console.log('Global Shortcut: Click-Through is now', isClickThrough);
  });
});

app.on('window-all-closed', () => {
  if (macMediaBridge) {
    macMediaBridge.stop();
  }
  if (bridgeProcess) {
    try {
      bridgeProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (macMediaBridge) {
    macMediaBridge.stop();
  }
  if (bridgeProcess) {
    try {
      bridgeProcess.kill();
    } catch {}
  }
});
