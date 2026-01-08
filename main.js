const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win;

function createWindow() {
    // 獲取螢幕尺寸以確保完全覆蓋
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        width: width,
        height: height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true, // 不在工作列顯示
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 關鍵：這能讓視窗在全螢幕遊戲上依然置頂
    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile('index.html');
    
    // 確保視窗完全佔滿
    win.setBounds({ x: 0, y: 0, width, height });

    ipcMain.on('set-ignore-mouse', (event, ignore) => {
        // forward: true 讓全螢幕模式下依然能監測滑鼠座標
        win.setIgnoreMouseEvents(ignore, { forward: true });
    });

    ipcMain.on('window-close', () => app.quit());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });