# 💜 Twitch Danmu Controller (彈幕控制台) v2.2.0

[繁體中文] | [English]

---

## 🇹🇼 繁體中文說明

這是一個為 Twitch 實況主打造的輕量化彈幕工具。透過 Electron 技術，將聊天室訊息以透明疊層（Overlay）顯示在螢幕最前方，讓你在全螢幕遊戲時也能即時互動。

### ✨ v2.2.0 更新重點
- **深色介面優化**：採用專業深色模式 (Dark Mode)，提升長時間實況的視覺舒適度。
- **全新設置系統**：位於主視窗右上角的齒輪按鈕，點擊後開啟側邊欄設置選單。
- **多語系支援**：內建繁體中文、英文、日文切換功能。
- **效能提升**：優化過濾器邏輯，減少高流量聊天室時的記憶體佔用。

### 🚀 如何使用
1. 前往 [Releases](你的GitHub網址/releases) 下載 `Twitch彈幕控制台.exe`。
2. 程式為 **免安裝版**，下載後直接執行即可。
3. 輸入您的 Twitch 頻道 ID（ID 為 URL 後方的名稱）。
4. 點擊連線，即可在螢幕上看到彈幕飄過。

---

## 🇺🇸 English Description

A lightweight Twitch chat overlay tool designed for streamers. Powered by Electron, it displays chat messages as a transparent overlay on top of any application, ensuring you never miss a message while gaming in full screen.

### ✨ v2.2.0 Key Updates
- **Dark Mode UI**: Professional dark theme optimized for reduced eye strain during long streaming sessions.
- **New Settings System**: Access settings via the gear icon in the top-right corner with a sleek sidebar overlay.
- **Multi-language Support**: Built-in support for Traditional Chinese, English, and Japanese.
- **Performance Boost**: Refined filter logic for lower memory usage in high-traffic chatrooms.

### 🚀 How to Use
1. Download the `Twitch彈幕控制台.exe` from the [Releases](你的GitHub網址/releases) page.
2. **Portable version**: No installation required. Just run the executable.
3. Enter your **Twitch Channel ID** (the name at the end of your channel URL).
4. Click "Connect" to start seeing chat messages float across your screen.

---

## ⌨️ 開發與編譯 / Development

```bash
# Clone repository
git clone [https://github.com/你的用戶名/twitch-Bullet-screen.git](https://github.com/你的用戶名/twitch-Bullet-screen.git)

# Install dependencies
npm install

# Build EXE
npx electron-builder build --win portable