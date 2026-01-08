const { createApp } = Vue;

createApp({
    data() {
        return {
            channelName: '',
            wsStatus: 'disconnected',
            wsStatusText: '尚未連線',
            channelAvatar: '',
            messages: [],
            filterInput: '', // 關鍵字輸入字串
            filterList: [],  // 解析後的過濾清單
            settings: { 
                speed: 8, 
                fontSize: 24, 
                opacity: 1,
                region: 'full'
            }
        }
    },
    methods: {
        updateFilterList() {
            // 將輸入內容依逗號拆分，並過濾掉空白項
            this.filterList = this.filterInput.split(',').map(s => s.trim()).filter(s => s !== '');
        },
        async connectTwitch() {
            if (!this.channelName) return;

            // Fetch API: 獲取頻道頭像
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
                if (data.startsWith('PING')) {
                    socket.send('PONG :tmi.twitch.tv');
                    return;
                }

                if (data.includes('PRIVMSG')) {
                    const match = data.match(/:(\w+)!.*PRIVMSG #\w+ :(.*)/);
                    if (match) {
                        const user = match[1];
                        const text = match[2];

                        // 邏輯功能：關鍵字過濾
                        if (this.filterList.some(keyword => text.includes(keyword))) {
                            return; // 若包含關鍵字則不顯示
                        }

                        // 邏輯功能：區域顯示控制
                        let topPosition;
                        const r = this.settings.region;
                        if (r === 'top') topPosition = Math.random() * 40;
                        else if (r === 'bottom') topPosition = Math.random() * 40 + 50;
                        else if (r === 'center') topPosition = Math.random() * 40 + 25;
                        else topPosition = Math.random() * 85;

                        const newMessage = {
                            id: Date.now() + Math.random(),
                            user: user,
                            text: text,
                            top: topPosition + '%'
                        };

                        this.messages.push(newMessage);
                        
                        // 定時移除彈幕，釋放記憶體
                        setTimeout(() => {
                            this.messages = this.messages.filter(m => m.id !== newMessage.id);
                        }, this.settings.speed * 1000);
                    }
                }
            };

            socket.onclose = () => {
                this.wsStatus = 'disconnected';
                this.wsStatusText = '連線已中斷';
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