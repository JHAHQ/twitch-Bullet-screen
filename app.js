const { createApp } = Vue;

createApp({
    data() {
        return {
            channelName: '',
            wsStatus: 'disconnected',
            wsStatusText: '尚未連線',
            messages: [],
            settings: { speed: 8, fontSize: 24, opacity: 1 },
            chart: null,
            msgCount: 0
        }
    },
    mounted() {
        this.initChart();
        // 每 10 秒將訊息數推入圖表一次
        setInterval(this.updateChart, 10000);
    },
    methods: {
        connectTwitch() {
            if (!this.channelName) return;
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
                // 處理心跳機制
                if (data.startsWith('PING')) {
                    socket.send('PONG :tmi.twitch.tv');
                    return;
                }
                // 處理訊息
                if (data.includes('PRIVMSG')) {
                    this.msgCount++;
                    const match = data.match(/:(\w+)!.*PRIVMSG #\w+ :(.*)/);
                    if (match) {
                        const newMessage = {
                            id: Date.now() + Math.random(),
                            user: match[1],
                            text: match[2],
                            top: Math.random() * 85 + '%'
                        };
                        this.messages.push(newMessage);
                        // 根據速度設定移除訊息，釋放記憶體
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
        },
        initChart() {
            const ctx = document.getElementById('chatChart').getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '聊天頻率 (10s)',
                        data: [],
                        borderColor: '#9147ff',
                        backgroundColor: 'rgba(145, 71, 255, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        },
        updateChart() {
            if (!this.chart) return;
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.chart.data.labels.push(now);
            this.chart.data.datasets[0].data.push(this.msgCount);
            if (this.chart.data.labels.length > 10) {
                this.chart.data.labels.shift();
                this.chart.data.datasets[0].data.shift();
            }
            this.chart.update();
            this.msgCount = 0;
        }
    }
}).mount('#app');