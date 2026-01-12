/**
 * © 2026 JHAHQ. All rights reserved.
 */
const { createApp } = Vue;

// 修正 Electron IPC 取得方式
let ipcRenderer;
try {
    ipcRenderer = window.require('electron').ipcRenderer;
} catch (e) {
    ipcRenderer = { send: (c, ...a) => console.log(`[Web] ${c}`, a) };
}

createApp({
    data() {
        return {
            version: '2.1.4',
            author: 'JHAHQ',
            channelName: '',
            wsStatus: 'disconnected',
            wsStatusText: '尚未連線',
            channelAvatar: '',
            messages: [],
            isMinimized: false,
            settings: { speed: 8, fontSize: 24, region: 'full' },
            panelPos: { x: 50, y: 50 },
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            hasMoved: false,
            filterInput: '',
            filterList: []
        }
    },
    mounted() {
        let lastIgnoreState = null;
        console.log(`%c Twitch Bullet Screen v${this.version} %c by ${this.author} `, "color: #fff; background: #9147ff; padding:5px 0;", "color: #fff; background: #333; padding:5px 0;");

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.hasMoved = true; 
                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

            // 精準穿透邏輯
            let targetRect;
            if (this.isMinimized) {
                targetRect = this.$refs.miniBtn?.getBoundingClientRect();
            } else {
                targetRect = this.$refs.panel?.getBoundingClientRect();
            }

            if (targetRect) {
                const isInside = (
                    e.clientX >= targetRect.left && e.clientX <= targetRect.right &&
                    e.clientY >= targetRect.top && e.clientY <= targetRect.bottom
                );
                const shouldIgnore = !isInside;
                if (shouldIgnore !== lastIgnoreState) {
                    ipcRenderer.send('set-ignore-mouse', shouldIgnore);
                    lastIgnoreState = shouldIgnore;
                }
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
            this.hasMoved = false; 
            this.dragOffset.x = e.clientX - this.panelPos.x;
            this.dragOffset.y = e.clientY - this.panelPos.y;
        },
        updateFilterList() {
            this.filterList = this.filterInput.split(',').map(s => s.trim()).filter(s => s !== '');
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
                this.wsStatusText = this.channelName;
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
                        else if (r === 'center') topPos = Math.random() * 40 + 25;
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
        genDanmuStyle(msg) {
            return { top: msg.top, fontSize: this.settings.fontSize + 'px', animationDuration: this.settings.speed + 's' };
        },
        minimizeWindow() { this.isMinimized = true; },
        restoreWindow() { if (!this.hasMoved) this.isMinimized = false; },
        closeWindow() { ipcRenderer.send('window-close'); }
    }
}).mount('#app');