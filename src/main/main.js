/**
 * YouTube Danmu Controller v1.0.1
 * Main Process - Fixed Connection & Scraper Stability
 */
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('enable-gpu-rasterization');

let win, fetchWin;

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        title: "YouTube Danmu Controller",
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

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver');

    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    if (fs.existsSync(indexPath)) {
        win.loadFile(indexPath);
    }

    // 初始化抓取視窗
    fetchWin = new BrowserWindow({
        show: false,
        webPreferences: { 
            offscreen: true, 
            nodeIntegration: true, 
            contextIsolation: false 
        }
    });
}

// 監聽滑鼠穿透
ipcMain.on('set-ignore-mouse', (event, ignore) => {
    if (win && !win.isDestroyed()) {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

// 核心連線邏輯修正
ipcMain.on('connect-yt-stream', (event, videoId) => {
    if (!videoId) return;
    const chatUrl = `https://www.youtube.com/live_chat?v=${videoId.trim()}`;
    
    console.log(`[Main] Connecting to YT: ${chatUrl}`);
    fetchWin.loadURL(chatUrl);
    
    fetchWin.webContents.on('did-finish-load', () => {
        // 1. 立即回傳連線成功給前端，解除「連線中」狀態
        if (win) win.webContents.send('yt-connected');

        // 2. 注入強化後的抓取腳本
        fetchWin.webContents.executeJavaScript(`
            (function() {
                const { ipcRenderer } = require('electron');
                
                function startObserve() {
                    const chatContainer = document.querySelector('#items.yt-live-chat-item-list-renderer');
                    
                    if (!chatContainer) {
                        // 如果容器還沒長出來，1秒後重試
                        setTimeout(startObserve, 1000);
                        return;
                    }

                    console.log("YouTube Scraper: Container found, start observing...");

                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                                    const user = node.querySelector('#author-name')?.innerText || 'Guest';
                                    const text = node.querySelector('#message')?.innerText || '';
                                    if (text) {
                                        ipcRenderer.send('relay-danmu', { user, text });
                                    }
                                }
                            });
                        });
                    });

                    observer.observe(chatContainer, { childList: true });
                }

                startObserve();
            })();
        `).catch(err => console.error("JS Injection Failed:", err));
    });
});

// 彈幕中繼
ipcMain.on('relay-danmu', (event, data) => {
    if (win && !win.isDestroyed()) {
        win.webContents.send('spawn-danmu', data);
    }
});

// 視窗控制
ipcMain.on('window-close', () => app.quit());
ipcMain.on('window-minimize', () => { if(win) win.minimize(); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });