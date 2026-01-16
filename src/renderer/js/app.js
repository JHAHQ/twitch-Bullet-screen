/**
 * © 2026 JHAHQ. All rights reserved.
 * v2.3.2 - Translation Logic Fixed
 */
const { createApp } = Vue;

let ipcRenderer;
try {
    ipcRenderer = window.require('electron').ipcRenderer;
} catch (e) {
    ipcRenderer = { send: (c, ...a) => console.log(`[Web] ${c}`, a) };
}

// 定義原始繁體中文範本，作為語系切換的基底
const defaultT = { 
    ui: { 
        panelTitle: 'Twitch 彈幕控制台', 
        connect: '連線', 
        settings: '設定',
        channel: '頻道',
        placeholderID: '輸入 ID...',
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
            version: '2.3.2',
            author: 'JHAHQ',
            channelName: '',
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
            // 當前顯示文字
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
            panelPos: { x: 50, y: 50 },
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            hasMoved: false,
            lastMouseUpdate: 0
        }
    },
    watch: {
        'settings.lang': function(newLang) { this.loadLanguage(newLang); }
    },
    computed: {
        wsStatusText() {
            return this.wsStatus === 'disconnected' ? (this.t.status?.disconnected || 'Offline') : this.channelName;
        },
        systemVars() {
            return {
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
            // 如果切換回繁體中文，直接還原範本即可，不需讀取 CSV
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
                    
                    // 關鍵修正：每次讀取 CSV 都必須基於「原始範本」進行修改
                    const newT = JSON.parse(JSON.stringify(defaultT));
                    
                    lines.forEach((line, index) => {
                        if (index === 0 || !line.trim()) return;
                        const [type, key, value] = line.split(',');
                        const trimmedType = type?.trim();
                        const trimmedKey = key?.trim();
                        // 確保 key 存在於範本中才替換
                        if (trimmedType && trimmedKey && value && newT[trimmedType]) {
                            newT[trimmedType][trimmedKey] = value.trim();
                        }
                    });
                    
                    this.t = newT;
                    console.log(`Lang loaded: ${lang}`);
                    return; 
                } catch (err) { }
            }
        },

        async connectTwitch() {
            if (!this.channelName) return;
            this.wsStatus = 'connecting';
            this.channelAvatar = '';
            
            const cleanName = this.channelName.trim().toLowerCase();
            const avatarUrl = `https://decapi.me/twitch/avatar/${cleanName}`;
            
            fetch(avatarUrl)
                .then(res => res.text())
                .then(data => {
                    if (data && data.startsWith('http')) {
                        this.channelAvatar = data;
                    }
                })
                .catch(() => { this.channelAvatar = ''; });

            const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            socket.onopen = () => {
                this.wsStatus = 'connected';
                socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                socket.send('PASS SCHMOOPIE');
                socket.send(`NICK justinfan${Math.floor(Math.random() * 10000)}`);
                socket.send(`JOIN #${cleanName}`);
            };
            
            socket.onmessage = (event) => {
                const data = event.data;
                if (data.includes('PRIVMSG')) {
                    const match = data.match(/:(\w+)!.*PRIVMSG #\w+ :(.*)/);
                    if (match) {
                        if (Math.random() * 100 > this.settings.density) return;
                        this.spawnDanmu(match[1], match[2]);
                    }
                }
                if (data.startsWith('PING')) socket.send('PONG :tmi.twitch.tv');
            };
            socket.onclose = () => { this.wsStatus = 'disconnected'; };
        },

        spawnDanmu(user, text) {
            let topPos;
            const r = this.settings.region;
            if (r === 'top') topPos = Math.random() * 40;
            else if (r === 'bottom') topPos = Math.random() * 40 + 50;
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
            this.dragOffset.x = e.clientX - this.panelPos.x;
            this.dragOffset.y = e.clientY - this.panelPos.y;
        },

        toggleSettings() { this.showSettings = !this.showSettings; },
        minimizeWindow() { this.isMinimized = true; this.showSettings = false; },
        restoreWindow() { if (!this.hasMoved) this.isMinimized = false; },
        closeWindow() { ipcRenderer.send('window-close'); }
    },
    mounted() {
        this.loadLanguage(this.settings.lang);

        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - this.lastMouseUpdate < 16) return;
            this.lastMouseUpdate = now;

            if (this.isDragging) {
                this.hasMoved = true; 
                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

            const panelRect = this.$refs.panel?.getBoundingClientRect();
            const miniRect = this.$refs.miniBtn?.getBoundingClientRect();
            let isInside = false;

            if (this.isMinimized) {
                isInside = miniRect && (e.clientX >= miniRect.left && e.clientX <= miniRect.right && e.clientY >= miniRect.top && e.clientY <= miniRect.bottom);
            } else {
                isInside = panelRect && (e.clientX >= panelRect.left && e.clientX <= panelRect.right && e.clientY >= panelRect.top && e.clientY <= panelRect.bottom);
            }
            ipcRenderer.send('set-ignore-mouse', !isInside);
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            setTimeout(() => { this.hasMoved = false; }, 100);
        });
    }
}).mount('#app');