/**
 * © 2026 JHAHQ. All rights reserved.
 * v2.3.1 - Enhanced Customization & Performance
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
            version: '2.3.1',
            author: 'JHAHQ',
            channelName: '',
            wsStatus: 'disconnected',
            channelAvatar: '',
            messages: [],
            isMinimized: false,
            showSettings: false,
            currentTab: 'lang',
            langNames: {
                'zh-tw': '繁體中文', 'zh-cn': '简体中文', 'en': 'English',
                'jp': '日本語', 'ko': '한국어', 'fr': 'Français',
                'de': 'Deutsch', 'es': 'Español', 'vi': 'Tiếng Việt', 'pt': 'Português'
            },
            t: { ui: {}, regions: {}, status: {} },
            settings: { 
                speed: 8, 
                fontSize: 24, 
                region: 'full',
                lang: 'zh-tw',
                density: 100,
                fpsLimit: 60,   // 改為數值
                miniSize: 54    // 圓球大小預設
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
            // 動態控制渲染性能
            return {
                '--fps-step': this.settings.fpsLimit > 0 ? `steps(${this.settings.fpsLimit * this.settings.speed})` : 'linear'
            };
        },
        miniStyle() {
            return {
                left: this.panelPos.x + 'px',
                top: this.panelPos.y + 'px',
                width: this.settings.miniSize + 'px',
                height: this.settings.miniSize + 'px'
            };
        }
    },
    methods: {
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
            } catch (err) { console.error("Lang Load Error"); }
        },

        async connectTwitch() {
            if (!this.channelName) return;
            this.wsStatus = 'connecting';
            try {
                const response = await fetch(`https://decapi.me/twitch/avatar/${this.channelName}`);
                if (response.ok) this.channelAvatar = await response.text();
            } catch (err) { console.error("Avatar fetch error"); }

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
                        if (Math.random() * 100 > this.settings.density) return;
                        const user = match[1];
                        const text = match[2];
                        if (this.filterList && this.filterList.some(word => text.includes(word))) return; 
                        this.spawnDanmu(user, text);
                    }
                }
            };
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

        updateFilterList() {
            this.filterList = this.filterInput.split(',').map(s => s.trim()).filter(s => s !== '');
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