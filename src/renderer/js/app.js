/**
 * © 2026 JHAHQ. All rights reserved.
 * v2.2.0 - Sidebar Settings Overlay Version
 */
const { createApp } = Vue;

let ipcRenderer;
try {
    ipcRenderer = window.require('electron').ipcRenderer;
} catch (e) {
    ipcRenderer = { send: (c, ...a) => console.log(`[Web] ${c}`, a) };
}

createApp({
    data() {
        return {
            version: '2.2.0',
            author: 'JHAHQ',
            channelName: '',
            wsStatus: 'disconnected',
            channelAvatar: '',
            messages: [],
            isMinimized: false,
            
            // --- 新增：設置窗控制 ---
            showSettings: false,
            currentTab: 'lang', // 預設分頁
            langNames: {
                zh: '繁體中文',
                en: 'English',
                jp: '日本語'
            },
            
            settings: { 
                speed: 8, 
                fontSize: 24, 
                region: 'full',
                lang: 'zh'
            },
            panelPos: { x: 50, y: 50 },
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            hasMoved: false,
            filterInput: '',
            filterList: [],
            
            i18n: {
                zh: {
                    ui: {
                        panelTitle: "設置台",
                        language: "語言設定",
                        channel: "頻道",
                        statusOffline: "尚未連線",
                        connect: "連線",
                        speed: "速度",
                        fontSize: "大小",
                        region: "區域",
                        filter: "關鍵字過濾",
                        placeholderID: "Twitch ID",
                        placeholderFilter: "髒話,洗版 (用逗號隔開)"
                    },
                    regions: { full: "全螢幕", top: "上半部", center: "中間帶", bottom: "下半部" }
                },
                en: {
                    ui: {
                        panelTitle: "Control",
                        language: "Language",
                        channel: "Channel",
                        statusOffline: "Offline",
                        connect: "Connect",
                        speed: "Speed",
                        fontSize: "Size",
                        region: "Region",
                        filter: "Filter",
                        placeholderID: "Twitch ID",
                        placeholderFilter: "Banned words..."
                    },
                    regions: { full: "Full", top: "Top", center: "Center", bottom: "Bottom" }
                },
                jp: {
                    ui: {
                        panelTitle: "コントロール",
                        language: "言語設定",
                        channel: "チャンネル",
                        statusOffline: "未接続",
                        connect: "接続",
                        speed: "速度",
                        fontSize: "サイズ",
                        region: "エリア",
                        filter: "フィルター",
                        placeholderID: "Twitch ID",
                        placeholderFilter: "NGワード..."
                    },
                    regions: { full: "全画面", top: "上部", center: "中央", bottom: "下部" }
                }
            }
        }
    },
    computed: {
        t() { return this.i18n[this.settings.lang]; },
        wsStatusText() {
            return this.wsStatus === 'disconnected' ? this.t.ui.statusOffline : this.channelName;
        }
    },
    mounted() {
        let lastIgnoreState = null;
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.hasMoved = true; 
                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

            // 精準偵測：如果滑鼠在面板內，就不穿透
            const panelRect = this.$refs.panel?.getBoundingClientRect();
            const miniRect = this.$refs.miniBtn?.getBoundingClientRect();
            
            let isInside = false;
            if (this.isMinimized) {
                isInside = miniRect && (e.clientX >= miniRect.left && e.clientX <= miniRect.right && e.clientY >= miniRect.top && e.clientY <= miniRect.bottom);
            } else {
                isInside = panelRect && (e.clientX >= panelRect.left && e.clientX <= panelRect.right && e.clientY >= panelRect.top && e.clientY <= panelRect.bottom);
            }

            const shouldIgnore = !isInside;
            if (shouldIgnore !== lastIgnoreState) {
                ipcRenderer.send('set-ignore-mouse', shouldIgnore);
                lastIgnoreState = shouldIgnore;
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            setTimeout(() => { this.hasMoved = false; }, 100);
        });
    },
    methods: {
        startDrag(e) {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.panelPos.x;
            this.dragOffset.y = e.clientY - this.panelPos.y;
        },
        toggleSettings() {
            this.showSettings = !this.showSettings;
        },
        async connectTwitch() {
            if (!this.channelName) return;
            try {
                const response = await fetch(`https://decapi.me/twitch/avatar/${this.channelName}`);
                if (response.ok) this.channelAvatar = await response.text();
            } catch (err) { console.error("無法取得頭像"); }

            const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            socket.onopen = () => {
                this.wsStatus = 'connected';
                socket.send('PASS SCHMOOPIE');
                socket.send(`NICK justinfan${Math.floor(Math.random() * 10000)}`);
                socket.send(`JOIN #${this.channelName.toLowerCase()}`);
            };
            
            socket.onmessage = (event) => {
                const data = event.data;
                if (data.includes('PRIVMSG')) {
                    const match = data.match(/:(\w+)!.*PRIVMSG #\w+ :(.*)/);
                    if (match) {
                        const user = match[1];
                        const text = match[2];
                        if (this.filterList.some(word => text.includes(word))) return; 

                        let topPos;
                        const r = this.settings.region;
                        if (r === 'top') topPos = Math.random() * 40;
                        else if (r === 'bottom') topPos = Math.random() * 40 + 50;
                        else if (r === 'center') topPos = Math.random() * 20 + 40;
                        else topPos = Math.random() * 85;

                        const newMessage = { id: Date.now(), user, text, top: topPos + '%' };
                        this.messages.push(newMessage);
                        setTimeout(() => {
                            this.messages = this.messages.filter(m => m.id !== newMessage.id);
                        }, this.settings.speed * 1000);
                    }
                }
            };
        },
        updateFilterList() {
            this.filterList = this.filterInput.split(',').map(s => s.trim()).filter(s => s !== '');
        },
        genDanmuStyle(msg) {
            return { top: msg.top, fontSize: this.settings.fontSize + 'px', animationDuration: this.settings.speed + 's' };
        },
        minimizeWindow() { this.isMinimized = true; this.showSettings = false; },
        restoreWindow() { if (!this.hasMoved) this.isMinimized = false; },
        closeWindow() { ipcRenderer.send('window-close'); }
    }
}).mount('#app');