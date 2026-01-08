const { createApp } = Vue;

createApp({
    data() {
        return {
            channelName: '',
            wsStatus: 'disconnected',
            wsStatusText: '尚未連線',
            channelAvatar: '',
            messages: [],
            filterInput: '',
            filterList: [],
            isMinimized: false,
            settings: { speed: 8, fontSize: 24, region: 'full' }
        }
    },
    methods: {
        updateFilterList() {
            this.filterList = this.filterInput.split(',').map(k => k.trim()).filter(k => k !== '');
        },
        async connectTwitch() {
            if (!this.channelName) return;
            try {
                const response = await fetch(`https://decapi.me/twitch/avatar/${this.channelName}`);
                if (response.ok) this.channelAvatar = await response.text();
            } catch (err) { console.error("Avatar error"); }

            const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            socket.onopen = () => {
                this.wsStatus = 'connected';
                this.wsStatusText = `已連線: ${this.channelName}`;
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
                        if (this.filterList.some(k => text.includes(k))) return;

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
        setIgnoreMouse(ignore) {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('set-ignore-mouse', ignore);
        },
        minimizeWindow() {
            this.isMinimized = true;
            this.setIgnoreMouse(true);
        },
        closeWindow() {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('window-close');
        }
    }
}).mount('#app');