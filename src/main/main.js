/**
 * YouTube Danmu Controller v1.0.0
 * Main Process - Aligned with Twitch v2.3.1 logic & Performance
 */
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. 性能優化：從 Twitch 版導入的硬體加速開關
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('enable-gpu-rasterization');

let win, fetchWin;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // 2. 主視窗設定：融合 Twitch 的穩固層級與 YT 的透明設定
    win = new BrowserWindow({
        title: "YouTube Danmu Controller",
        width: width,
        height: height,
        x: 0, 
        y: 0,
        transparent: true,      // 確保半透明感
        frame: false, 
        alwaysOnTop: true,
        resizable: false, 
        skipTaskbar: true, 
        focusable: true,
        type: 'toolbar',        // 確保在其他應用程式上方但不搶佔工作列
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false // 關鍵：防止失去焦點時彈幕卡頓
        }
    });

    // 3. 強化置頂層級
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver');

    // 4. 載入 Renderer 頁面
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    if (fs.existsSync(indexPath)) {
        win.loadFile(indexPath);
    } else {
        console.error("Critical Error: index.html not found at", indexPath);
    }

    // 5. 初始化語言傳遞 (對標 Twitch 版)
    win.webContents.on('did-finish-load', () => {
        const sysLang = app.getLocale().toLowerCase();
        win.webContents.send('init-lang', sysLang);
    });

    // 6. 抓取 YouTube 聊天室用的隱藏視窗 (YT 版核心)
    fetchWin = new BrowserWindow({
        show: false,
        webPreferences: { 
            offscreen: true, 
            nodeIntegration: true, 
            contextIsolation: false 
        }
    });
}

// 監聽來自 Renderer 的滑鼠穿透指令
ipcMain.on('set-ignore-mouse', (event, ignore) => {
    if (win && !win.isDestroyed()) {
        // ignore = true: 滑鼠在空白背景，穿透
        // ignore = false: 滑鼠在面板或小球上，接收點擊
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

// YouTube 聊天室連線與 MutationObserver 抓取邏輯
ipcMain.on('connect-yt-stream', (event, videoId) => {
    const chatUrl = `https://www.youtube.com/live_chat?v=${videoId}`;
    fetchWin.loadURL(chatUrl);
    
    fetchWin.webContents.on('did-finish-load', () => {
        fetchWin.webContents.executeJavaScript(`
            const { ipcRenderer } = require('electron');
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                            const user = node.querySelector('#author-name')?.innerText || 'Guest';
                            const text = node.querySelector('#message')?.innerText || '';
                            ipcRenderer.send('relay-danmu', { user, text });
                        }
                    });
                });
            });
            const chatContainer = document.querySelector('#items.yt-live-chat-item-list-renderer');
            if (chatContainer) observer.observe(chatContainer, { childList: true });
        `);
    });
});

// 彈幕中繼轉發
ipcMain.on('relay-danmu', (event, data) => {
    if (win) win.webContents.send('spawn-danmu', data);
});

// 基本控制
ipcMain.on('window-close', () => app.quit());
ipcMain.on('window-minimize', () => win.minimize());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') app.quit(); 
});