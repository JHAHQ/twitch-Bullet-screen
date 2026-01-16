# ❤️ YouTube Danmu Controller (彈幕控制台) v1.0.1

[繁體中文] | [English]

---

## 🇹🇼 繁體中文說明

專為 YouTube 直播主設計的彈幕抓取工具。與 Twitch 版共用相同的渲染引擎。

### ✨ v1.0.1 功能重點
- **操作體驗同步**：與 Twitch 版本同步滑條設計，支援橫向雙滑條調節（速度、字體）。
- **極致效能限制**：內建 FPS 渲染上限調節，確保彈幕流動順暢且不影響遊戲跑分。
- **動態懸浮球**：一鍵最小化為 YouTube 經典圖示，與Twitch版本同理。

### 🚀 如何使用
1. 下載 Releases`YouTube彈幕V1.0.1`（免安裝版）。
2. 輸入 **YouTube 影片 ID**（網址 `v=` 後方的代碼）。
3. 點擊「連線」開始同步聊天室訊息。

---

## 🇺🇸 English Description

A professional chat overlay tool designed specifically for YouTube streamers, powered by the same high-performance rendering engine as the Twitch version.

### ✨ v1.0.1 Key Updates
- **Synchronized Experience**: Slider designs are aligned with the Twitch version, supporting dual horizontal sliders for Speed and Font Size.
- **Extreme Performance Control**: Built-in FPS rendering limits ensure smooth chat flow without impacting game benchmarks.
- **Dynamic Mini-ball**: One-click minimization into a classic YouTube-styled icon, functioning identically to the Twitch version.

### 🚀 How to Use
1. Download `YouTube彈幕V1.0.1`from the Releases (Portable version).
2. Enter the **YouTube Video ID** (the alphanumeric code after `v=` in the URL).
3. Click **"Connect"** to start syncing real-time chat messages.

---

## ⌨️ 開發與編譯 / Development

```bash
# Clone repository
git clone https://github.com/JHAHQ/videos-danmu-controller.git

# Install dependencies
npm install

# Run App
npm start

# Build EXE
npx electron-builder build --win portable