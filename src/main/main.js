const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        width: width,
        height: height,
        x: 0, y: 0,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        focusable: true,
        type: 'toolbar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // 確保渲染進程能使用 require
            backgroundThrottling: false
        }
    });

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver');

    // 修正：從 src/main/ 往上一層進入 renderer/
    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    ipcMain.on('set-ignore-mouse', (event, ignore) => {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    });

    ipcMain.on('window-close', () => app.quit());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });