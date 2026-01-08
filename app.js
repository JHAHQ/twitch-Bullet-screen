const { createApp } = Vue;

createApp({
    data() {
        return {
            channelName: '',
            wsStatus: 'disconnected',
            wsStatusText: '尚未連線',
            channelAvatar: '', // 透過 Fetch 抓取的頭像
            messages: [],
            settings: { 
                speed: 8, 
                fontSize: 24, 
                opacity: 1,
                region: 'full' // 區域設定：full, top, center, bottom
            }
        }
    },
    methods: {
        async connectTwitch() {
            if (!this.channelName) return;

            // --- 進階技術：Fetch API 實作 (抓取頻道頭像) ---
            try {
                const response = await fetch(`https://decapi.me/twitch/avatar/${this.channelName}`);
                if (response.ok) {
                    this.channelAvatar = await response.text();
                }
            } catch (err) {
                console.error("無法抓取頭像:", err);
            }

            const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

            socket.onopen = () => {
                this.wsStatus = 'connected';
                this.wsStatusText = `已連線: ${this.channelName}`;
                socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                socket.send('PASS SCHMOOPIE');
                socket.send(`NICK justinfan${Math.floor(Math.random() * 10000)}`);
                socket.send(`JOIN #${this.channelName.toLowerCase()}`);
            };

            socket.onmessage = (event) => {
                const data = event.data;
                if (data.includes('PRIVMSG')) {
                    const match = data.match(/:(\w+)!.*PRIVMSG #\w+ :(.*)/);
                    if (match) {
                        // --- 邏輯功能：區域顯示控制 ---
                        let topPosition;
                        const r = this.settings.region;
                        if (r === 'top') topPosition = Math.random() * 40; // 0-40%
                        else if (r === 'bottom') topPosition = Math.random() * 40 + 50; // 50-90%
                        else if (r === 'center') topPosition = Math.random() * 40 + 25; // 25-65%
                        else topPosition = Math.random() * 85;

                        const newMessage = {
                            id: Date.now() + Math.random(),
                            user: match[1],
                            text: match[2],
                            top: topPosition + '%'
                        };
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
                opacity: this.settings.opacity,
                animationDuration: this.settings.speed + 's'
            };
        }
    }
}).mount('#app');