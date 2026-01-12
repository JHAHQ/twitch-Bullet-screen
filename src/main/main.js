const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        title: "Twitch Danmu Controller v2.2.0", // 更新版本號
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
            backgroundThrottling: false
        }
    });

    // 確保在全螢幕遊戲或影片上也能看見
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver');

    // 載入我們剛剛改好的 index.html
    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    // 滑鼠穿透控制：當滑鼠在設定面板之外時，允許點擊後方視窗
    ipcMain.on('set-ignore-mouse', (event, ignore) => {
        if (win) {
            win.setIgnoreMouseEvents(ignore, { forward: true });
        }
    });

    // 視窗關閉事件
    ipcMain.on('window-close', () => {
        app.quit();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') app.quit(); 
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});