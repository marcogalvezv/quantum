/**
 * NetworkManager.js - Real-Time Multiplayer Networking (Up to 6 Players)
 * Supports:
 * 1. Native WebSockets (connects to server.js / ws://localhost:8080 or custom WS URL)
 * 2. Instant Browser Multi-Tab Sync via BroadcastChannel (zero server required!)
 * 3. Cooperative AI Technician Bots to complete up to 6 simultaneous players
 */
window.QuantumGame = window.QuantumGame || {};

class NetworkManager {
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
        this.roomCode = 'QM-2026';
        this.maxPlayers = 6;
        this.localId = 'tech_' + Math.random().toString(36).substring(2, 9);
        this.ws = null;
        this.wsConnected = false;
        this.channel = null;
        this.mode = 'hybrid'; // WebSocket + BroadcastChannel fallback
        this.remotePlayers = new Map(); // id -> player state
        this.bots = new Map();          // id -> bot state
        this.heartbeatTimer = null;
    }

    connect(roomCode, localPlayerInfo, wsUrl = 'ws://localhost:8080', fillWithBots = true) {
        this.disconnect();
        this.roomCode = (roomCode || 'QM-2026').toUpperCase().trim();

        // 1. Setup BroadcastChannel for instant zero-install multi-tab multiplayer
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel(`quantum_room_${this.roomCode}`);
            this.channel.onmessage = (event) => {
                this.handlePacket(event.data, 'broadcast');
            };
        }

        // 2. Try connecting to WebSocket Server (if running)
        try {
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                this.wsConnected = true;
                this.sendPacket({
                    type: 'join',
                    room: this.roomCode,
                    player: localPlayerInfo
                });
                if (this.callbacks.onStatusChange) {
                    this.callbacks.onStatusChange('Conectado via WebSocket (' + wsUrl + ')', true);
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handlePacket(data, 'ws');
                } catch (err) {
                    console.warn('Error parsing WS message:', err);
                }
            };

            this.ws.onerror = () => {
                this.wsConnected = false;
                if (this.callbacks.onStatusChange) {
                    this.callbacks.onStatusChange('Modo Multijugador Local (Multi-Pestaña WebSocket/Broadcast)', false);
                }
            };

            this.ws.onclose = () => {
                this.wsConnected = false;
            };
        } catch (e) {
            this.wsConnected = false;
        }

        // Announce join on BroadcastChannel immediately
        this.sendPacket({
            type: 'join',
            room: this.roomCode,
            player: localPlayerInfo
        });

        // Populate cooperative AI Technician Apprentices if enabled so up to 6 players are in the factory
        if (fillWithBots) {
            setTimeout(() => this.ensureSixCrewmates(localPlayerInfo), 400);
        }

        // Periodic cleanup of stale remote players
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            for (const [id, p] of this.remotePlayers.entries()) {
                if (now - p.lastSeen > 8000) {
                    this.remotePlayers.delete(id);
                    if (this.callbacks.onPlayerLeave) this.callbacks.onPlayerLeave(id);
                }
            }
        }, 2500);
    }

    ensureSixCrewmates(localPlayer) {
        const botProfiles = [
            { name: 'Valeria (Bot)', colorId: 'lime', targetZone: 1 },
            { name: 'Carlos (Bot)', colorId: 'orange', targetZone: 2 },
            { name: 'Inti (Bot)', colorId: 'purple', targetZone: 3 },
            { name: 'Camila (Bot)', colorId: 'yellow', targetZone: 4 },
            { name: 'Marco (Bot)', colorId: 'red', targetZone: 5 }
        ];

        const usedColors = new Set([localPlayer.colorId]);
        for (const p of this.remotePlayers.values()) {
            usedColors.add(p.colorId);
        }

        const stations = window.QuantumGame.FactoryAssets.STATIONS;
        let botIdx = 0;

        while (1 + this.remotePlayers.size + this.bots.size < this.maxPlayers && botIdx < botProfiles.length) {
            const profile = botProfiles[botIdx++];
            let colorId = profile.colorId;
            if (usedColors.has(colorId)) {
                const fallback = window.QuantumGame.FactoryAssets.PLAYER_COLORS.find(c => !usedColors.has(c.id));
                if (fallback) colorId = fallback.id;
            }
            usedColors.add(colorId);

            const botId = `bot_${botIdx}`;
            const targetStation = stations[botIdx % stations.length];
            this.bots.set(botId, {
                id: botId,
                name: profile.name,
                colorId: colorId,
                x: 360 + (botIdx * 55),
                y: 350 + ((botIdx % 2) * 60),
                vx: 0,
                vy: 0,
                facing: 1,
                isMoving: false,
                isBot: true,
                targetX: targetStation.x + (Math.random() * 80 - 40),
                targetY: targetStation.y + 40,
                waitTimer: 60 + botIdx * 40,
                emote: null,
                emoteTimer: 0
            });
        }

        if (this.callbacks.onPlayersUpdated) {
            this.callbacks.onPlayersUpdated(this.getAllRemoteAndBotPlayers());
        }
    }

    updateBots(dt, completedTasks) {
        const stations = window.QuantumGame.FactoryAssets.STATIONS;
        const emotes = window.QuantumGame.FactoryAssets.EMOTES;

        for (const bot of this.bots.values()) {
            // If real human players joined and total exceeds 6, remove a bot
            if (1 + this.remotePlayers.size + this.bots.size > this.maxPlayers) {
                this.bots.delete(bot.id);
                continue;
            }

            if (bot.emoteTimer > 0) {
                bot.emoteTimer -= dt;
                if (bot.emoteTimer <= 0) bot.emote = null;
            }

            let aimX = bot.targetX;
            let aimY = bot.targetY;
            const diffX = Math.abs(aimX - bot.x);
            const diffY = Math.abs(aimY - bot.y);
            if (bot.y > 1600 && aimY < 1600) {
                if (Math.abs(bot.x - 1200) > 30) {
                    aimX = 1200;
                    aimY = bot.y;
                } else {
                    aimX = 1200;
                    aimY = 1200;
                }
            } else if (aimY > 1600 && bot.y < 1600) {
                if (Math.abs(bot.x - 1200) > 35) {
                    const corridorY = bot.y < 790 ? 390 : 1200;
                    if (Math.abs(bot.y - corridorY) > 30) {
                        aimX = bot.x;
                        aimY = corridorY;
                    } else {
                        aimX = 1200;
                        aimY = corridorY;
                    }
                } else {
                    aimX = 1200;
                }
            } else if (diffX > 260) {
                const corridorY = bot.y < 790 ? 390 : 1200;
                if (Math.abs(bot.y - corridorY) > 30) {
                    aimX = bot.x;
                    aimY = corridorY;
                }
            } else if (diffY > 260) {
                const colX = bot.x < 810 ? 420 : (bot.x < 1590 ? 1200 : 1980);
                if (Math.abs(bot.x - colX) > 30) {
                    aimX = colX;
                    aimY = bot.y;
                }
            }

            const dx = aimX - bot.x;
            const dy = aimY - bot.y;
            const totalDist = Math.hypot(bot.targetX - bot.x, bot.targetY - bot.y);

            if (totalDist > 14) {
                const stepLen = Math.hypot(dx, dy) || 1;
                const speed = 135;
                bot.vx = (dx / stepLen) * speed;
                bot.vy = (dy / stepLen) * speed;
                bot.x += bot.vx * dt;
                bot.y += bot.vy * dt;
                bot.facing = bot.vx >= 0 ? 1 : -1;
                bot.isMoving = true;
            } else {
                bot.isMoving = false;
                bot.waitTimer -= dt * 30;
                if (bot.waitTimer <= 0) {
                    // Pick next station (prefer uncompleted stations)
                    const pending = stations.filter(s => !completedTasks.has(s.id));
                    const pool = pending.length > 0 ? pending : stations;
                    const nextStation = pool[Math.floor(Math.random() * pool.length)];

                    // Navigate via central corridors so bots look natural
                    bot.targetX = nextStation.x + (Math.random() * 110 - 55);
                    bot.targetY = nextStation.y + (Math.random() * 60 + 20);
                    bot.waitTimer = 100 + Math.random() * 140;

                    if (Math.random() < 0.35) {
                        const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
                        bot.emote = randomEmote.icon;
                        bot.emoteTimer = 3.2;
                    }
                }
            }
        }
    }

    sendPacket(packet) {
        const payload = {
            ...packet,
            senderId: this.localId,
            room: this.roomCode,
            timestamp: Date.now()
        };

        if (this.ws && this.wsConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }

        if (this.channel) {
            this.channel.postMessage(payload);
        }
    }

    broadcastState(playerState) {
        this.stateCounter = (this.stateCounter || 0) + 1;
        // Include avatar every 20th state packet (~1.3s) so late-joining players receive it without bloating every frame
        const includeAvatar = (this.stateCounter % 20 === 1);
        this.sendPacket({
            type: 'state',
            player: {
                id: this.localId,
                name: playerState.name,
                colorId: playerState.colorId,
                x: Math.round(playerState.x),
                y: Math.round(playerState.y),
                facing: playerState.facing,
                isMoving: playerState.isMoving,
                isTalking: Boolean(playerState.isTalking),
                emote: playerState.emote,
                ...(includeAvatar && playerState.avatar ? { avatar: playerState.avatar } : {})
            }
        });
    }

    broadcastTaskComplete(taskId, badgeId, points, playerName) {
        this.sendPacket({
            type: 'task_complete',
            taskId,
            badgeId,
            points,
            playerName
        });
    }

    broadcastChatOrEmote(playerName, colorId, text, emoteIcon) {
        this.sendPacket({
            type: 'chat',
            playerName,
            colorId,
            text,
            emoteIcon
        });
    }

    handlePacket(data, source) {
        if (!data || data.senderId === this.localId) return;
        if (data.room && data.room !== this.roomCode) return;

        switch (data.type) {
            case 'join':
            case 'state': {
                if (data.player) {
                    const existing = this.remotePlayers.get(data.senderId);
                    const isNew = !existing;
                    if (isNew && this.remotePlayers.size >= this.maxPlayers - 1) {
                        return; // Max 6 players reached
                    }
                    const hadNoAvatar = existing && !existing.avatar && data.player.avatar;
                    this.remotePlayers.set(data.senderId, {
                        ...(existing || {}),
                        ...data.player,
                        avatar: data.player.avatar || (existing ? existing.avatar : null),
                        id: data.senderId,
                        lastSeen: Date.now(),
                        isBot: false
                    });

                    // Remove one AI bot if a real player joined
                    if (isNew && this.bots.size > 0 && (1 + this.remotePlayers.size + this.bots.size > this.maxPlayers)) {
                        const firstBotKey = this.bots.keys().next().value;
                        this.bots.delete(firstBotKey);
                    }

                    if (isNew && this.callbacks.onPlayerJoin) {
                        this.callbacks.onPlayerJoin(data.player);
                    } else if (hadNoAvatar && this.callbacks.onPlayersUpdated) {
                        this.callbacks.onPlayersUpdated(this.getAllRemoteAndBotPlayers());
                    }
                }
                break;
            }
            case 'task_complete': {
                if (this.callbacks.onRemoteTaskComplete) {
                    this.callbacks.onRemoteTaskComplete(data);
                }
                break;
            }
            case 'chat': {
                if (this.callbacks.onRemoteChat) {
                    this.callbacks.onRemoteChat(data);
                }
                break;
            }
        }
    }

    getAllRemoteAndBotPlayers() {
        return [
            ...Array.from(this.remotePlayers.values()),
            ...Array.from(this.bots.values())
        ];
    }

    disconnect() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.ws) {
            try { this.ws.close(); } catch (e) {}
            this.ws = null;
        }
        if (this.channel) {
            try { this.channel.close(); } catch (e) {}
            this.channel = null;
        }
        this.remotePlayers.clear();
        this.bots.clear();
    }
}

window.QuantumGame.NetworkManager = NetworkManager;
