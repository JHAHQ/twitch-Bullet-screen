# 💜 Twitch Danmu Controller (彈幕控制台) v2.3.0

[繁體中文] | [English]

---

## 🇹🇼 繁體中文說明

這是一個為 Twitch 實況主打造的輕量化彈幕工具。透過 Electron 技術，將聊天室訊息以透明疊層（Overlay）顯示在螢幕最前方，讓你在全螢幕遊戲時也能即時互動。

### ✨ v2.3.0 更新重點
- **系統效能自定義**：新增 FPS 限制滑軌與數值輸入框，支援 0-270 FPS 調節，透過 CSS 渲染優化大幅降低 CPU 佔用。
- **懸浮球尺寸調整**：支援自定義 最小化圓球大小 (30px - 100px)，適配不同解析度的螢幕顯示。
- **多語系支援**：內建繁、簡、英、日、韓、法、德、西、越、葡等 10 種語言，並優化多語系排版相容性。
- **設置系統優化**：重構設置選單分頁（語言、系統、關於），提供更直觀的參數調整介面。

### 🚀 如何使用
1. 前往 [Releases](https://github.com/JHAHQ/twitch-Bullet-screen/releases) 下載 `Twitch彈幕V2.3.0.exe`。
2. 程式為 **免安裝版**，下載後直接執行即可。
3. 輸入 Twitch 頻道 ID（ID 為 URL 後方的名稱）。
4. 點擊連線，即可在螢幕上看到彈幕飄過。

---

## 🇺🇸 English Description

A lightweight Twitch chat overlay tool designed for streamers. Powered by Electron, it displays chat messages as a transparent overlay on top of any application, ensuring you never miss a message while gaming in full screen.

### ✨ v2.3.0 Key Updates
- **Performance Customization**: Added FPS Limit slider and numeric input (0-270 FPS) with CSS rendering optimization to reduce CPU overhead.
- **Adjustable Mini-ball Size**: Supports custom minimized ball size (30px - 100px) to fit various screen resolutions and scales.
- **Multilingual support** : Full integration for ZH-TW, ZH-CN, EN, JP, KR, FR, DE, ES, VI, and PT with improved UI localization.
- **Enhanced Settings UI**: Refactored settings with categorized tabs (Language, System, About) for a better user experience.

### 🚀 How to Use
1. Download the `Twitch彈幕2.3.0.exe` from the [Releases](https://github.com/JHAHQ/twitch-Bullet-screen/releases) page.
2. **Portable version**: No installation required. Just run the executable.
3. Enter **Twitch Channel ID** (the name at the end of your channel URL).
4. Click "Connect" to start seeing chat messages float across your screen.

---

## ⌨️ 開發與編譯 / Development

```bash
# Clone repository
git clone [https://github.com/JHAHQ/twitch-Bullet-screen.git](https://github.com/JHAHQ/twitch-Bullet-screen.git)

# Install dependencies
npm install

# Build EXE
npx electron-builder build --win portable