# ❤️ YouTube Danmu Controller (彈幕控制台) v1.0.0

[繁體中文] | [English]

---

## 🇹🇼 繁體中文說明

專為 YouTube 直播主設計的彈幕抓取工具。與 Twitch 版共用相同的渲染引擎，確保在極低 CPU 占用下顯示高畫質彈幕。

### ✨ v1.0.0 更新重點
- **磨砂玻璃視覺**：控制面板支援背景半透明與模糊濾鏡，呈現紅黑質感的現代化 UI。
- **操作體驗同步**：與 Twitch 版本同步滑條設計，支援橫向雙滑條調節（速度、字體）。
- **極致效能限制**：內建 FPS 渲染上限調節，確保彈幕流動順暢且不影響遊戲跑分。
- **動態懸浮球**：一鍵最小化為 YouTube 經典圖示，並可自由調整圓球尺寸。
- **自動過濾系統**：內建關鍵字過濾功能，有效阻擋機器人或洗屏訊息。

### 🚀 如何使用
1. 下載並執行 `YouTube彈幕V1.0.0.exe`（免安裝版）。
2. 輸入 **YouTube 影片 ID**（網址 `v=` 後方的代碼）。
3. 點擊「連線」開始同步聊天室訊息。

---

## 🇺🇸 English Description

A high-performance YouTube Live chat overlay tool. Designed for streamers who need a clean, transparent interaction experience.

### ✨ v1.0.0 Key Updates
- **Visual Transparency**: Glassmorphism UI with adjustable opacity for a modern look.
- **Unified Control Design**: Shared UI logic with the Twitch version, including dual-slider groups.
- **Low Resource Consumption**: Native CSS animation and FPS limiting technology.
- **Customizable Overlay**: Full control over danmu density, region, and mini-icon scaling.

### 🚀 How to Use
1. Download and run `YouTube彈幕V1.0.0.exe` (Portable version).
2. Enter the **YouTube Video ID** (The code after `v=` in the URL).
3. Click **"Connect"** to sync the live chat messages.

---

## ⌨️ 開發與編譯 / Development

```bash
# Clone repository
git clone https://github.com/JHAHQ/youtube-danmu-controller.git

# Install dependencies
npm install

# Run App
npm start

# Build EXE
npx electron-builder build --win portable