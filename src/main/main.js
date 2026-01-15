const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

// 禁用硬體加速黑名單以確保效能
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('enable-gpu-rasterization');

let win;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        title: "Twitch Danmu Controller v2.3.1",
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
            contextIsolation: false, 
            backgroundThrottling: false, // 關鍵：防止視窗失去焦點時彈幕卡頓
            offscreen: false
        }
    });

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver');

    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    win.webContents.on('did-finish-load', () => {
        const sysLang = app.getLocale().toLowerCase();
        win.webContents.send('init-lang', sysLang);
    });

    ipcMain.on('set-ignore-mouse', (event, ignore) => {
        if (win && !win.isDestroyed()) {
            win.setIgnoreMouseEvents(ignore, { forward: true });
        }
    });

    ipcMain.on('window-close', () => app.quit());
    ipcMain.on('window-minimize', () => win.minimize());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') app.quit(); 
});