# 💜 Twitch Danmu Controller (彈幕控制台) v2.3.1

[繁體中文] | [English]

---

## 🇹🇼 繁體中文說明

這是一個為 Twitch 實況主打造的輕量化彈幕工具。透過 Electron 技術，將聊天室訊息以透明疊層（Overlay）顯示在螢幕最前方。

### ✨ v2.3.1 更新重點
- **介面透明質感優化**：主控制面板採用 Glassmorphism 磨砂玻璃特效，支援 80% 背景半透明顯示。
- **UI 佈局統一化**：滑條與輸入框佈局全面優化，與 YouTube 版本操作邏輯達成一致。
- **系統效能自定義**：新增 FPS 限制滑軌與數值輸入框（0-270 FPS），大幅降低 CPU 負擔。
- **懸浮球尺寸調整**：支援自定義最小化圓球大小 (30px - 100px)。
- **多語系支援**：完整內建 10 種語系，並修正長文本排版問題。

### 🚀 如何使用
1. 下載並執行 `Twitch彈幕V2.3.1.exe`（免安裝版）。
2. 輸入 **Twitch 頻道 ID**（例如：URL 結尾的名稱）。
3. 點擊「連線」即可啟動彈幕層。

---

## 🇺🇸 English Description

A professional chat overlay tool for Twitch streamers. Powered by Electron for high-performance transparent rendering.

### ✨ v2.3.1 Key Updates
- **Translucent UI**: Glassmorphism design with 80% background opacity and blur effects.
- **Unified Layout**: Slider alignments synchronized with the YouTube version.
- **Performance Control**: Precision FPS limiting (0-270) to optimize system resources.
- **Responsive Mini-ball**: Customizable size (30px - 100px) to ensure visibility.

### 🚀 How to Use
1. Download and run `Twitch彈幕V2.3.1.exe` (Portable version).
2. Enter your **Twitch Channel ID** (The name at the end of your channel URL).
3. Click **"Connect"** to start the danmu overlay.

---

## ⌨️ 開發與編譯 / Development

```bash
# Clone repository
git clone [https://github.com/JHAHQ/twitch-Bullet-screen.git](https://github.com/JHAHQ/twitch-Bullet-screen.git)

# Install dependencies
npm install

# Run App
npm start

# Build EXE
npx electron-builder build --win portable