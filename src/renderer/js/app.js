/**
 * YouTube Danmu Controller v1.0.0
 * Renderer Process - Fully Aligned with Twitch v2.3.1 Logic
 */
const { createApp } = Vue;

let ipcRenderer;
try {
    ipcRenderer = window.require('electron').ipcRenderer;
} catch (e) {
    ipcRenderer = { 
        send: (c, ...a) => console.log(`[Web] ${c}`, a),
        on: (c, f) => console.log(`[Web Listener] ${c}`)
    };
}

createApp({
    data() {
        return {
            version: '1.0.0',
            author: 'JHAHQ',
            videoId: '',
            wsStatus: 'disconnected',
            channelAvatar: '', // 預留頭像位置
            messages: [],
            isMinimized: false,
            showSettings: false,
            currentTab: 'lang',
            langNames: {
                'zh-tw': '繁體中文', 'zh-cn': '简体中文', 'en': 'English',
                'jp': '日本語', 'ko': '한국어', 'fr': 'Français',
                'de': 'Deutsch', 'es': 'Español', 'vi': 'Tiếng Việt', 'pt': 'Português'
            },
            // 語系結構對標 v2.3.1
            t: { ui: {}, regions: {}, status: {} },
            settings: { 
                speed: 8, 
                fontSize: 24, 
                region: 'full',
                lang: 'zh-tw',
                density: 100,
                fpsLimit: 60,
                miniSize: 54
            },
            filterInput: '',
            filterList: [],
            panelPos: { x: 50, y: 50 },
            isDragging: false,
            isActuallyMoving: false, // 關鍵判定：區分拖動與點擊
            dragOffset: { x: 0, y: 0 },
            startClickPos: { x: 0, y: 0 },
            lastMouseUpdate: 0
        }
    },
    watch: {
        'settings.lang': function(newLang) { this.loadLanguage(newLang); }
    },
    computed: {
        wsStatusText() {
            if (this.wsStatus === 'connected') return '已連線';
            if (this.wsStatus === 'connecting') return '連線中...';
            return this.t.status?.disconnected || '未連線';
        },
        systemVars() {
            // 對標 Twitch 版的渲染性能控制邏輯
            return {
                '--speed': this.settings.speed + 's',
                '--fps-step': this.settings.fpsLimit > 0 ? `steps(${this.settings.fpsLimit * this.settings.speed})` : 'linear'
            };
        },
        miniStyle() {
            return {
                left: this.panelPos.x + 'px',
                top: this.panelPos.y + 'px',
                width: this.settings.miniSize + 'px',
                height: this.settings.miniSize + 'px',
                position: 'fixed'
            };
        }
    },
    methods: {
        // 導入 v2.3.1 的 CSV 語系載入機制
        async loadLanguage(lang) {
            try {
                const response = await fetch(`./locales/${lang}.csv`);
                const csvText = await response.text();
                const lines = csvText.split('\n');
                const newT = { ui: {}, regions: {}, status: {} };
                lines.forEach((line, index) => {
                    if (index === 0 || !line.trim()) return;
                    const [type, key, value] = line.split(',');
                    if (type && key && value && newT[type.trim()]) {
                        newT[type.trim()][key.trim()] = value.trim();
                    }
                });
                this.t = newT;
            } catch (err) { 
                console.error("YouTube Danmu: Lang Load Error, using fallback."); 
                // 基礎保底語系
                this.t.ui = { panelTitle: 'YouTube 彈幕控制台', connect: '連線' };
            }
        },

        connectYouTube() {
            if (!this.videoId) return;
            this.wsStatus = 'connecting';
            ipcRenderer.send('connect-yt-stream', this.videoId);
            // 狀態由 Main Process 透過事件回傳會更精確，此處先對標邏輯設定連線
            setTimeout(() => { this.wsStatus = 'connected'; }, 1500);
        },

        spawnDanmu(user, text) {
            if (this.filterList.some(f => text.includes(f))) return;
            if (Math.random() * 100 > this.settings.density) return;

            let topPos;
            const r = this.settings.region;
            if (r === 'top') topPos = Math.random() * 30;
            else if (r === 'bottom') topPos = Math.random() * 25 + 65;
            else topPos = Math.random() * 85;

            const newMessage = { id: performance.now(), user, text, top: topPos + '%' };
            this.messages.push(newMessage);

            // 自動清理
            setTimeout(() => {
                const index = this.messages.findIndex(m => m.id === newMessage.id);
                if (index > -1) this.messages.splice(index, 1);
            }, this.settings.speed * 1000);
        },

        genDanmuStyle(msg) {
            return { 
                top: msg.top, 
                fontSize: this.settings.fontSize + 'px',
                animationDuration: this.settings.speed + 's',
                animationTimingFunction: this.systemVars['--fps-step']
            };
        },

        updateFilterList() {
            this.filterList = this.filterInput.split(',').map(s => s.trim()).filter(s => s !== '');
        },

        startDrag(e) {
            this.isDragging = true;
            this.isActuallyMoving = false;
            this.startClickPos.x = e.clientX;
            this.startClickPos.y = e.clientY;
            this.dragOffset.x = e.clientX - this.panelPos.x;
            this.dragOffset.y = e.clientY - this.panelPos.y;
        },

        toggleSettings() { this.showSettings = !this.showSettings; },
        minimizeWindow() { this.isMinimized = true; this.showSettings = false; },
        restoreWindow() { 
            // 只有在非拖動狀態下點擊才觸發還原
            if (this.isActuallyMoving) return;
            this.isMinimized = false; 
        },
        closeWindow() { ipcRenderer.send('window-close'); }
    },
    mounted() {
        // 載入預設語系
        this.loadLanguage(this.settings.lang);

        // 監聽彈幕事件
        ipcRenderer.on('spawn-danmu', (event, data) => this.spawnDanmu(data.user, data.text));

        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - this.lastMouseUpdate < 16) return; // 限制更新頻率 (約 60fps)
            this.lastMouseUpdate = now;

            if (this.isDragging) {
                // 計算位移距離
                const dist = Math.sqrt(Math.pow(e.clientX - this.startClickPos.x, 2) + Math.pow(e.clientY - this.startClickPos.y, 2));
                if (dist > 5) this.isActuallyMoving = true;

                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

            // 穿透偵測
            const panelRect = this.$refs.panel?.getBoundingClientRect();
            const miniRect = this.$refs.miniBtn?.getBoundingClientRect();
            let isInside = false;

            if (!this.isMinimized && panelRect) {
                isInside = e.clientX >= panelRect.left && e.clientX <= panelRect.right && 
                           e.clientY >= panelRect.top && e.clientY <= panelRect.bottom;
            } else if (this.isMinimized && miniRect) {
                isInside = e.clientX >= miniRect.left && e.clientX <= miniRect.right && 
                           e.clientY >= miniRect.top && e.clientY <= miniRect.bottom;
            }
            ipcRenderer.send('set-ignore-mouse', !isInside);
        });

        window.addEventListener('mouseup', () => {
            setTimeout(() => {
                this.isDragging = false;
                // 注意：isActuallyMoving 會在下一次 startDrag 被重置，但在 restoreWindow 判斷後才重置
            }, 10);
        });
    }
}).mount('#app');