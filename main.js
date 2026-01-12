const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        focusable: true,      // 保持 true 才能輸入頻道名稱
        acceptFirstMouse: true, // 允許滑鼠點擊穿透的第一層反應
        type: 'toolbar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    // --- 關鍵維修設定：防止奪取焦點導致後台網頁停掉 ---
    
    // 1. 讓視窗在所有工作區顯示，並在全螢幕下運作
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // 2. 設定置頂層級為最高級 (screen-saver)，確保在全螢幕瀏覽器之上
    win.setAlwaysOnTop(true, 'screen-saver');

    // 3. (Windows 專用) 嘗試減少對背景視窗的影響
    // 讓視窗不成為活動窗口，減少瀏覽器判斷「視窗已遮擋」的機率
    win.on('blur', () => {
        // 當控制台失去焦點時，確保層級不會掉下來
        win.setAlwaysOnTop(true, 'screen-saver');
    });

    win.loadFile('index.html');

    // --- IPC 通訊 ---

    ipcMain.on('set-ignore-mouse', (event, ignore) => {
        // ignore 為 true 時：滑鼠穿透（看彈幕）
        // ignore 為 false 時：滑鼠不穿透（點擊控制台）
        win.setIgnoreMouseEvents(ignore, { forward: true });
    });

    ipcMain.on('window-close', () => app.quit());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});