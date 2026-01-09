const { createApp } = Vue;

// 1. 環境偵測與 Mock 物件
const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
let ipcRenderer = { 
    send: (channel, ...args) => console.log(`[Web Mode] IPC Send: ${channel}`, args) 
};

// 2. 只有在 Electron 裡面才真正載入模組
if (isElectron) {
    try {
        ipcRenderer = require('electron').ipcRenderer;
    } catch (e) {
        console.warn("Electron 模組載入失敗，切換回 Mock 模式");
    }
}

createApp({
    data() {
        return {
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
            hasMoved: false // 新增：判斷是拖拽還是點擊
        }
    },
    mounted() {
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.hasMoved = true; // 標記正在移動
                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

            // 以下邏輯只在 Electron 有效
            if (isElectron) {
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
                    ipcRenderer.send('set-ignore-mouse', !isInside);
                }
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            // 延遲重置標記，確保 click 事件能正確判斷
            setTimeout(() => { this.hasMoved = false; }, 100);
        });
    },
    methods: {
        startDrag(e) {
            this.isDragging = true;
            this.hasMoved = false; // 重置位移標記
            this.dragOffset.x = e.clientX - this.panelPos.x;
            this.dragOffset.y = e.clientY - this.panelPos.y;
        },
        async connectTwitch() {
            if (!this.channelName) return;

            // Fetch API 串接
            try {
                const response = await fetch(`https://decapi.me/twitch/avatar/${this.channelName}`);
                if (response.ok) {
                    this.channelAvatar = await response.text();
                }
            } catch (err) {
                console.error("無法取得頭像");
            }

            // WebSocket 串接
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
            return { 
                top: msg.top, 
                fontSize: this.settings.fontSize + 'px', 
                animationDuration: this.settings.speed + 's' 
            };
        },
        minimizeWindow() { 
            this.isMinimized = true; 
        },
        restoreWindow() {
            // 只有在純點擊（沒有明顯位移）時才還原視窗
            if (!this.hasMoved) {
                this.isMinimized = false;
            }
        },
        closeWindow() { 
            ipcRenderer.send('window-close'); 
        }
    }
}).mount('#app');