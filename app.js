const { createApp } = Vue;
const { ipcRenderer } = require('electron');

createApp({
    data() {
        return {
            channelName: '',
            wsStatus: 'disconnected',
            wsStatusText: '尚未連線',
            channelAvatar: '', // 儲存頭像網址
            messages: [],
            isMinimized: false,
            settings: { speed: 8, fontSize: 24, region: 'full' },
            panelPos: { x: 50, y: 50 },
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
        }
    },
    mounted() {
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.panelPos.x = e.clientX - this.dragOffset.x;
                this.panelPos.y = e.clientY - this.dragOffset.y;
            }

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
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    },
    methods: {
        startDrag(e) {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.panelPos.x;
            this.dragOffset.y = e.clientY - this.panelPos.y;
        },
        async connectTwitch() {
            if (!this.channelName) return;

            // 抓取頭像
            try {
                const response = await fetch(`https://decapi.me/twitch/avatar/${this.channelName}`);
                if (response.ok) {
                    this.channelAvatar = await response.text();
                }
            } catch (err) {
                console.error("無法取得頭像");
            }

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
                        if (this.settings.region === 'top') topPos = Math.random() * 40;
                        else if (this.settings.region === 'bottom') topPos = Math.random() * 40 + 50;
                        else if (this.settings.region === 'center') topPos = Math.random() * 40 + 25;
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
        minimizeWindow() { 
            this.isMinimized = true; 
        },
        restoreWindow() {
            // 如果是在拖動中就不執行還原，避免拖小球時突然跳出大視窗
            if (!this.isDragging) {
                this.isMinimized = false;
            }
        },
        closeWindow() { ipcRenderer.send('window-close'); }
    }
}).mount('#app');