/**
 * main.js - Main Game Controller, Lobby, HUD, Input & Cooperative Loop
 */
window.QuantumGame = window.QuantumGame || {};

class QuantumMotorsGame {
    constructor() {
        this.assets = window.QuantumGame.FactoryAssets;
        this.sound = new window.QuantumGame.SoundManager();
        this.factoryMap = new window.QuantumGame.FactoryMap();
        this.robotGuide = new window.QuantumGame.RobotGuide();

        this.localPlayer = new window.QuantumGame.Player({
            name: 'Aprendiz 01',
            colorId: 'cyan',
            x: 380,
            y: 360
        });

        this.keys = {};
        this.selectedColorId = 'cyan';
        this.teamScore = 0;
        this.unlockedBadges = new Set();
        this.isRunning = false;
        this.lastFrameTime = performance.now();
        this.netSyncTimer = 0;
        this.nearestStation = null;
        this.nearestSignage = null;
        this.victoryShown = false;

        this.initDOM();
        this.initNetworking();
        this.initInput();
    }

    initDOM() {
        this.canvas = document.getElementById('game-canvas');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.renderer = new window.QuantumGame.Renderer(this.canvas, this.minimapCanvas);

        this.missionManager = new window.QuantumGame.MissionManager(this.sound, (station) => {
            this.handleLocalTaskCompleted(station);
        });

        // Lobby color selector
        const colorContainer = document.getElementById('color-picker');
        this.assets.PLAYER_COLORS.forEach((col, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-swatch' + (idx === 0 ? ' active' : '');
            btn.style.backgroundColor = col.body;
            btn.title = col.name;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedColorId = col.id;
                this.sound.playClick();
            });
            colorContainer.appendChild(btn);
        });

        // Auto-detect WebSocket URL when hosted online (Render, Railway, Glitch, etc.)
        const wsUrlInput = document.getElementById('ws-url-input');
        if (wsUrlInput && window.location.protocol.startsWith('http')) {
            const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrlInput.value = `${wsProto}//${window.location.host}`;
        }

        // Photo Upload & Webcam Face Capture in Lobby
        this.selectedAvatarDataUrl = null;
        this.webcamStream = null;
        this.initAvatarPicker();

        // Emote buttons in HUD
        const emoteBar = document.getElementById('emote-bar');
        this.assets.EMOTES.forEach(em => {
            const btn = document.createElement('button');
            btn.className = 'emote-btn';
            btn.title = em.label;
            btn.textContent = em.icon;
            btn.addEventListener('click', () => {
                this.triggerEmote(em.icon, em.label);
            });
            emoteBar.appendChild(btn);
        });

        // Start button
        document.getElementById('join-game-btn').addEventListener('click', () => {
            this.startGameFromLobby();
        });

        // Interact HUD button
        document.getElementById('hud-interact-btn').addEventListener('click', () => {
            this.interactWithNearest();
        });

        // Audio mute button
        const muteBtn = document.getElementById('mute-btn');
        muteBtn.addEventListener('click', () => {
            const muted = this.sound.toggleMute();
            muteBtn.textContent = muted ? '🔇 Sonido Off' : '🔊 Sonido On';
        });

        // Chat form
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;
            chatInput.value = '';
            this.addChatMessage(this.localPlayer.name, this.localPlayer.colorId, text);
            this.network.broadcastChatOrEmote(this.localPlayer.name, this.localPlayer.colorId, text, null);
        });

        // Signage modal close
        document.getElementById('signage-close-btn').addEventListener('click', () => {
            document.getElementById('signage-modal').classList.add('hidden');
        });

        // Victory replay button
        document.getElementById('victory-continue-btn').addEventListener('click', () => {
            document.getElementById('victory-modal').classList.add('hidden');
        });

        this.renderTaskChecklistHUD();
        this.renderBadgesHUD();
    }

    initAvatarPicker() {
        const fileInput = document.getElementById('avatar-file-input');
        const webcamBtn = document.getElementById('webcam-btn');
        const clearBtn = document.getElementById('clear-avatar-btn');
        const webcamContainer = document.getElementById('webcam-container');
        const videoEl = document.getElementById('webcam-video');
        const captureBtn = document.getElementById('capture-photo-btn');
        const previewImg = document.getElementById('avatar-preview-img');
        const placeholderIcon = document.getElementById('avatar-placeholder-icon');

        const setAvatarPreview = (dataUrl) => {
            this.selectedAvatarDataUrl = dataUrl;
            if (dataUrl) {
                previewImg.src = dataUrl;
                previewImg.classList.remove('hidden');
                placeholderIcon.classList.add('hidden');
                clearBtn.classList.remove('hidden');
            } else {
                previewImg.src = '';
                previewImg.classList.add('hidden');
                placeholderIcon.classList.remove('hidden');
                clearBtn.classList.add('hidden');
            }
        };

        const cropSourceToDataUrl = (sourceEl, srcW, srcH, mirror = false) => {
            const size = 112;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const minSide = Math.min(srcW, srcH);
            const sx = (srcW - minSide) / 2;
            const sy = (srcH - minSide) / 2;

            if (mirror) {
                ctx.translate(size, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(sourceEl, sx, sy, minSide, minSide, 0, 0, size, size);
            return canvas.toDataURL('image/jpeg', 0.78);
        };

        const stopWebcam = () => {
            if (this.webcamStream) {
                this.webcamStream.getTracks().forEach(t => t.stop());
                this.webcamStream = null;
            }
            webcamContainer.classList.add('hidden');
        };

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                stopWebcam();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const cropped = cropSourceToDataUrl(img, img.naturalWidth, img.naturalHeight, false);
                        setAvatarPreview(cropped);
                        this.sound.playClick();
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        if (webcamBtn) {
            webcamBtn.addEventListener('click', async () => {
                if (this.webcamStream) {
                    stopWebcam();
                    return;
                }
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    alert('Tu navegador no permite acceso directo a la cámara aquí. Usa "Subir Foto".');
                    return;
                }
                try {
                    this.webcamStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 320, height: 240, facingMode: 'user' },
                        audio: false
                    });
                    videoEl.srcObject = this.webcamStream;
                    webcamContainer.classList.remove('hidden');
                } catch (err) {
                    alert('No se pudo abrir la cámara. Puedes usar el botón "Subir Foto".');
                }
            });
        }

        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                if (!videoEl.videoWidth) return;
                const cropped = cropSourceToDataUrl(videoEl, videoEl.videoWidth, videoEl.videoHeight, true);
                setAvatarPreview(cropped);
                this.sound.playTaskComplete();
                stopWebcam();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                stopWebcam();
                setAvatarPreview(null);
                if (fileInput) fileInput.value = '';
                this.sound.playClick();
            });
        }
    }

    initNetworking() {
        this.network = new window.QuantumGame.NetworkManager({
            onStatusChange: (msg, isWs) => {
                const netBadge = document.getElementById('net-status-badge');
                if (netBadge) {
                    netBadge.textContent = isWs ? '🟢 WebSocket Online' : '🟢 Multijugador Local Activo';
                }
            },
            onPlayerJoin: (player) => {
                this.addChatMessage('SISTEMA', 'cyan', `👋 ¡${player.name} ingresó a la planta!`);
                this.updateCrewRosterHUD();
            },
            onPlayerLeave: () => {
                this.updateCrewRosterHUD();
            },
            onPlayersUpdated: () => {
                this.updateCrewRosterHUD();
            },
            onRemoteTaskComplete: (data) => {
                if (!this.factoryMap.completedTasks.has(data.taskId)) {
                    this.factoryMap.markTaskCompleted(data.taskId);
                    this.unlockedBadges.add(data.badgeId);
                    this.teamScore += (data.points || 200);
                    this.sound.playTaskComplete();
                    this.addChatMessage('Q-BOT', 'lime', `🎉 ¡${data.playerName} completó una estación! (+${data.points} pts)`);
                    this.renderTaskChecklistHUD();
                    this.renderBadgesHUD();
                    this.checkTeamVictory();
                }
            },
            onRemoteChat: (data) => {
                if (data.text) {
                    this.addChatMessage(data.playerName, data.colorId, data.text);
                }
            }
        });
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            this.keys[e.code] = true;

            if ((e.code === 'KeyE' || e.code === 'Space') && this.isRunning) {
                if (this.missionManager.activeStation) return;
                this.interactWithNearest();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Click on canvas to interact with station/signage or walk there
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning || this.missionManager.activeStation) return;
            const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);

            // Check if user clicked directly on a nearby station
            const clickedStation = this.factoryMap.getNearestStation(worldPos.x, worldPos.y, 65);
            if (clickedStation && Math.hypot(clickedStation.x - this.localPlayer.x, clickedStation.y - this.localPlayer.y) < 130) {
                this.missionManager.openMission(clickedStation);
                return;
            }

            // Check if user clicked directly on a nearby signage board
            const clickedSign = this.factoryMap.getNearestSignage(worldPos.x, worldPos.y, 70);
            if (clickedSign && Math.hypot(clickedSign.x - this.localPlayer.x, clickedSign.y - this.localPlayer.y) < 130) {
                this.openSignageModal(clickedSign);
                return;
            }

            // Otherwise set walk target
            this.localPlayer.targetClickPos = worldPos;
        });
    }

    startGameFromLobby() {
        const nameInput = document.getElementById('player-name-input').value.trim();
        const roomInput = document.getElementById('room-code-input').value.trim() || 'QM-2026';
        const wsInput = document.getElementById('ws-url-input').value.trim() || 'ws://localhost:8080';
        const fillBots = document.getElementById('fill-bots-checkbox').checked;

        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(t => t.stop());
            this.webcamStream = null;
        }

        this.localPlayer.name = nameInput || 'Técnico Quantum';
        this.localPlayer.colorId = this.selectedColorId;
        this.localPlayer.avatar = this.selectedAvatarDataUrl;

        document.getElementById('lobby-overlay').classList.add('hidden');
        document.getElementById('room-display').textContent = `Sala: ${roomInput.toUpperCase()}`;

        this.sound.startMusic();
        this.network.connect(roomInput, {
            id: this.network.localId,
            name: this.localPlayer.name,
            colorId: this.localPlayer.colorId,
            avatar: this.localPlayer.avatar,
            x: this.localPlayer.x,
            y: this.localPlayer.y,
            facing: 1,
            isMoving: false
        }, wsInput, fillBots);

        this.addChatMessage('Q-BOT', 'cyan', `¡Bienvenido a Quantum Motors Bolivia, ${this.localPlayer.name}! Completen las 6 estaciones para ensamblar el Quantum E4.`);
        this.updateCrewRosterHUD();

        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    interactWithNearest() {
        if (this.nearestStation) {
            this.missionManager.openMission(this.nearestStation);
        } else if (this.nearestSignage) {
            this.openSignageModal(this.nearestSignage);
        }
    }

    openSignageModal(signage) {
        this.sound.playClick();
        document.getElementById('signage-zone').textContent = signage.zoneName;
        document.getElementById('signage-title').textContent = `📘 ${signage.title}`;
        document.getElementById('signage-fact').textContent = signage.fact;
        document.getElementById('signage-modal').classList.remove('hidden');
    }

    triggerEmote(icon, label) {
        this.sound.playClick();
        this.localPlayer.setEmote(icon, 3.5);
        this.addChatMessage(this.localPlayer.name, this.localPlayer.colorId, `${icon} ${label}`);
        this.network.broadcastChatOrEmote(this.localPlayer.name, this.localPlayer.colorId, `${icon} ${label}`, icon);
    }

    handleLocalTaskCompleted(station) {
        const isFirstTime = !this.factoryMap.completedTasks.has(station.id);
        this.factoryMap.markTaskCompleted(station.id);
        this.unlockedBadges.add(station.badgeId);

        if (isFirstTime) {
            this.teamScore += station.points;
        } else {
            this.teamScore += 25; // Bonus practice points
        }

        this.localPlayer.setEmote('✅', 3.5);
        this.addChatMessage('Q-BOT', 'lime', `✅ ¡${this.localPlayer.name} completó "${station.shortName}"! (+${station.points} pts)`);

        this.network.broadcastTaskComplete(station.id, station.badgeId, station.points, this.localPlayer.name);
        this.renderTaskChecklistHUD();
        this.renderBadgesHUD();
        this.checkTeamVictory();
    }

    renderTaskChecklistHUD() {
        const listEl = document.getElementById('task-list-hud');
        const progressFill = document.getElementById('total-progress-fill');
        const progressText = document.getElementById('total-progress-text');
        const scoreEl = document.getElementById('team-score-val');

        const total = this.assets.STATIONS.length;
        const done = this.factoryMap.completedTasks.size;
        const pct = Math.round((done / total) * 100);

        progressFill.style.width = `${pct}%`;
        progressText.textContent = `Ensamblaje Colectivo Quantum E4: ${done}/${total} (${pct}%)`;
        scoreEl.textContent = `${this.teamScore} pts`;

        listEl.innerHTML = '';
        this.assets.STATIONS.forEach(st => {
            const isDone = this.factoryMap.completedTasks.has(st.id);
            const li = document.createElement('li');
            li.className = 'task-item' + (isDone ? ' done' : '');
            li.innerHTML = `
                <span>${isDone ? '✅' : '⬜'} ${st.icon} ${st.shortName}</span>
                <small>${st.points} pts</small>
            `;
            li.addEventListener('click', () => {
                // Guide player toward clicked task on checklist
                this.localPlayer.targetClickPos = { x: st.x, y: st.y + 30 };
            });
            listEl.appendChild(li);
        });
    }

    renderBadgesHUD() {
        const container = document.getElementById('badges-hud');
        container.innerHTML = '';
        this.assets.BADGES.forEach(b => {
            const unlocked = this.unlockedBadges.has(b.id);
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge-chip' + (unlocked ? ' unlocked' : '');
            badgeEl.title = `${b.title}: ${b.desc}`;
            badgeEl.innerHTML = `<span>${b.icon}</span>`;
            container.appendChild(badgeEl);
        });
    }

    updateCrewRosterHUD() {
        const rosterEl = document.getElementById('crew-roster');
        if (!rosterEl) return;
        const allPlayers = [
            { name: `${this.localPlayer.name} (Tú)`, colorId: this.localPlayer.colorId, avatar: this.localPlayer.avatar },
            ...this.network.getAllRemoteAndBotPlayers()
        ];

        document.getElementById('crew-count').textContent = `${allPlayers.length}/${this.network.maxPlayers}`;
        rosterEl.innerHTML = '';

        allPlayers.forEach(p => {
            const col = this.assets.PLAYER_COLORS.find(c => c.id === p.colorId) || this.assets.PLAYER_COLORS[0];
            const pill = document.createElement('div');
            pill.className = 'crew-pill';
            const dotOrFace = p.avatar
                ? `<img src="${p.avatar}" style="width:16px;height:16px;border-radius:50%;object-fit:cover;border:1.5px solid ${col.body};">`
                : `<span class="crew-dot" style="background:${col.body}"></span>`;
            pill.innerHTML = `
                ${dotOrFace}
                <span class="crew-name">${p.name}</span>
            `;
            rosterEl.appendChild(pill);
        });
    }

    addChatMessage(sender, colorId, text) {
        const log = document.getElementById('chat-messages');
        if (!log) return;
        const col = this.assets.PLAYER_COLORS.find(c => c.id === colorId) || { body: '#38bdf8' };
        const div = document.createElement('div');
        div.className = 'chat-line';
        div.innerHTML = `<strong style="color:${col.body}">${sender}:</strong> <span>${text}</span>`;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }

    checkTeamVictory() {
        if (this.victoryShown) return;
        if (this.factoryMap.completedTasks.size >= this.assets.STATIONS.length) {
            this.victoryShown = true;
            this.sound.playVictoryFanfare();
            document.getElementById('victory-score').textContent = `${this.teamScore} Puntos de Ingeniería`;
            document.getElementById('victory-modal').classList.remove('hidden');
        }
    }

    gameLoop(timestamp) {
        const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
        this.lastFrameTime = timestamp;

        // 1. Update Local Player
        if (!this.missionManager.activeStation) {
            this.localPlayer.update(dt, this.keys, this.factoryMap, this.sound);
        }

        // 2. Update Q-BOT Companion & Zone Narrative Banner
        this.robotGuide.update(dt, this.localPlayer, this.factoryMap, (zone, msg) => {
            const qbotBanner = document.getElementById('qbot-narrative-text');
            if (qbotBanner) qbotBanner.textContent = msg;
        });

        // 3. Update Factory Map & Cooperative Bots
        this.factoryMap.update(dt);
        this.network.updateBots(dt, this.factoryMap.completedTasks);

        // 4. Check proximity to Interactive Stations & Educational Signage
        this.nearestStation = this.factoryMap.getNearestStation(this.localPlayer.x, this.localPlayer.y);
        this.nearestSignage = this.factoryMap.getNearestSignage(this.localPlayer.x, this.localPlayer.y);

        const interactBtn = document.getElementById('hud-interact-btn');
        if (this.nearestStation) {
            interactBtn.disabled = false;
            interactBtn.classList.add('ready');
            interactBtn.innerHTML = `${this.nearestStation.icon} <strong>USAR [E]</strong><small>${this.nearestStation.shortName}</small>`;
        } else if (this.nearestSignage) {
            interactBtn.disabled = false;
            interactBtn.classList.add('ready');
            interactBtn.innerHTML = `📘 <strong>LEER [E]</strong><small>Señalética</small>`;
        } else {
            interactBtn.disabled = true;
            interactBtn.classList.remove('ready');
            interactBtn.innerHTML = `🔧 <strong>USAR [E]</strong><small>Acércate a estación</small>`;
        }

        // 5. Broadcast local player position ~15 times per second
        this.netSyncTimer += dt;
        if (this.netSyncTimer >= 0.065) {
            this.netSyncTimer = 0;
            this.network.broadcastState(this.localPlayer);
        }

        // 6. Render World & Minimap
        const remotePlayers = this.network.getAllRemoteAndBotPlayers();
        this.renderer.render({
            factoryMap: this.factoryMap,
            localPlayer: this.localPlayer,
            remotePlayers,
            robotGuide: this.robotGuide,
            nearestStation: this.nearestStation,
            nearestSignage: this.nearestSignage
        });

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.quantumGameInstance = new QuantumMotorsGame();
});
