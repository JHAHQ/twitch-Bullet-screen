const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1920,
        height: 1080,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
    win.maximize();

    // 接收滑鼠穿透指令
    ipcMain.on('set-ignore-mouse', (event, ignore) => {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    });

    ipcMain.on('window-close', () => app.quit());
}

app.whenReady().then(createWindow);