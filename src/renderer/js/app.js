/**
 * YouTube Danmu Controller v1.0.1
 * Renderer Process - Fixed Translation Logic & Default Template
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

// 定義原始繁體中文範本 (YouTube 專用)
const defaultT = { 
    ui: { 
        panelTitle: 'YouTube 彈幕控制台', 
        connect: '連線', 
        settings: '設定',
        channel: '直播 ID',
        placeholderID: '輸入 YouTube Video ID...',
        speed: '飄過速度',
        fontSize: '字體大小',
        density: '彈幕密度',
        region: '顯示區域',
        filter: '過濾關鍵字',
        placeholderFilter: '用逗號分隔...',
        language: '語言設定',
        systemTab: '系統',
        fpsLimit: '幀率限制',
        unlimited: '無限制',
        miniSize: '縮小尺寸'
    }, 
    regions: { full: '全螢幕', top: '頂部', center: '中間', bottom: '底部' }, 
    status: { disconnected: '未連線' } 
};

createApp({
    data() {
        return {
            version: '1.0.1',
            author: 'JHAHQ',
            videoId: '',
            wsStatus: 'disconnected',
            channelAvatar: '',
            messages: [],
            isMinimized: false,
            showSettings: false,
            currentTab: 'lang',
            langNames: {
                'zh-TW': '繁體中文', 'zh-CN': '简体中文', 'en': 'English',
                'jp': '日本語', 'ko': '한국어', 'fr': 'Français',
                'de': 'Deutsch', 'es': 'Español', 'vi': 'Tiếng Việt', 'pt': 'Português'
            },
            // 當前語言狀態，初始拷貝範本
            t: JSON.parse(JSON.stringify(defaultT)),
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
            isActuallyMoving: false,
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
            // 已連線與連線中字串建議也放入語系檔，此處先維持邏輯穩定
            if (this.wsStatus === 'connected') return '已連線';
            if (this.wsStatus === 'connecting') return '連線中...';
            return this.t.status?.disconnected || '未連線';
        },
        systemVars() {
            return {
                '--speed': this.settings.speed + 's',
                '--fps-step': this.settings.fpsLimit > 0 ? `steps(${this.settings.fpsLimit * this.settings.speed})` : 'linear'
            };
        },
        miniStyle() {
            return {
                width: this.settings.miniSize + 'px',
                height: this.settings.miniSize + 'px',
                left: this.panelPos.x + 'px',
                top: this.panelPos.y + 'px'
            };
        }
    },
    methods: {
        async loadLanguage(lang) {
            // 如果切換回 zh-tw，直接還原範本
            if (lang === 'zh-tw') {
                this.t = JSON.parse(JSON.stringify(defaultT));
                return;
            }

            const possiblePaths = [
                `./locales/${lang}.csv`,
                `../renderer/locales/${lang}.csv`,
                `renderer/locales/${lang}.csv`,
                `resources/app/renderer/locales/${lang}.csv`
            ];

            for (const pathStr of possiblePaths) {
                try {
                    const response = await fetch(pathStr);
                    if (!response.ok) continue;
                    
                    const csvText = await response.text();
                    const lines = csvText.split('\n');
                    
                    // 關鍵修正：每次讀取 CSV 都基於「原始範本」進行更新
                    const newT = JSON.parse(JSON.stringify(defaultT));
                    
                    lines.forEach((line, index) => {
                        if (index === 0 || !line.trim()) return;
                        const [type, key, value] = line.split(',');
                        const trimmedType = type?.trim();
                        const trimmedKey = key?.trim();
                        if (trimmedType && trimmedKey && value && newT[trimmedType]) {
                            newT[trimmedType][trimmedKey] = value.trim();
                        }
                    });
                    
                    this.t = newT;
                    console.log(`YouTube: Loaded ${lang} success`);
                    return;
                } catch (err) { }
            }
        },

        connectYouTube() {
            if (!this.videoId) return;
            this.wsStatus = 'connecting';
            ipcRenderer.send('connect-yt-stream', this.videoId.trim());
        },

        spawnDanmu(user, text) {
            if (this.filterList.some(f => text.includes(f))) return;
            if (Math.random() * 100 > this.settings.density) return;

            let topPos;
            const r = this.settings.region;
            if (r === 'top') topPos = Math.random() * 30;
            else if (r === 'bottom') topPos = Math.random() * 25 + 65;
            else if (r === 'center') topPos = Math.random() * 20 + 40;
            else topPos = Math.random() * 85;

            const newMessage = { id: performance.now(), user, text, top: topPos + '%' };
            this.messages.push(newMessage);

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
                animationTimingFunction: this.settings.fpsLimit > 0 ? `steps(${this.settings.fpsLimit * this.settings.speed})` : 'linear'
            };
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
            if (this.isActuallyMoving) return;
            this.isMinimized = false; 
        },
        closeWindow() { ipcRenderer.send('window-close'); }
    },
    mounted() {
        this.loadLanguage(this.settings.lang);
        
        // 監聽連線狀態
        ipcRenderer.on('yt-connected', () => {
            this.wsStatus = 'connected';
        });

        // 接收彈幕訊息
        ipcRenderer.on('spawn-danmu', (event, data) => {
            this.spawnDanmu(data.user, data.text);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dist = Math.sqrt(Math.pow(e.clientX - this.startClickPos.x, 2) + Math.pow(e.clientY - this.startClickPos.y, 2));
                if (dist > 5) this.isActuallyMoving = true;
                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

            const panelRect = this.$refs.panel?.getBoundingClientRect();
            const miniRect = this.$refs.miniBtn?.getBoundingClientRect();
            let isInside = false;

            if (!this.isMinimized && panelRect) {
                isInside = e.clientX >= panelRect.left && e.clientX <= panelRect.right && e.clientY >= panelRect.top && e.clientY <= panelRect.bottom;
            } else if (this.isMinimized && miniRect) {
                isInside = e.clientX >= miniRect.left && e.clientX <= miniRect.right && e.clientY >= miniRect.top && e.clientY <= miniRect.bottom;
            }
            ipcRenderer.send('set-ignore-mouse', !isInside);
        });

        window.addEventListener('mouseup', () => {
            setTimeout(() => { this.isDragging = false; }, 10);
        });
    }
}).mount('#app');