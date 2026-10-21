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
        this.meetingInProgress = false;
        this.meetingCooldown = 0;
        this.meetingTimer = null;
        this.meetingTimeRemaining = 45;
        this.meetingVotes = new Map();
        this.selectedMeetingStationVote = null;
        this.botSpeechTimers = [];

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

        // Emergency Meeting HUD button
        const meetingHudBtn = document.getElementById('emergency-meeting-hud-btn');
        if (meetingHudBtn) {
            meetingHudBtn.addEventListener('click', () => {
                this.promptCallMeeting();
            });
        }

        // Call meeting modal buttons
        const callCloseBtn = document.getElementById('call-meeting-close-btn');
        const callCancelBtn = document.getElementById('cancel-call-meeting-btn');
        const callConfirmBtn = document.getElementById('confirm-call-meeting-btn');

        if (callCloseBtn) {
            callCloseBtn.addEventListener('click', () => {
                document.getElementById('call-meeting-modal').classList.add('hidden');
            });
        }
        if (callCancelBtn) {
            callCancelBtn.addEventListener('click', () => {
                document.getElementById('call-meeting-modal').classList.add('hidden');
            });
        }
        if (callConfirmBtn) {
            callConfirmBtn.addEventListener('click', () => {
                const reasonSelect = document.getElementById('meeting-reason-select');
                const reason = reasonSelect ? reasonSelect.value : 'Coordinación general de producción';
                document.getElementById('call-meeting-modal').classList.add('hidden');
                this.triggerEmergencyMeeting(this.localPlayer.name, this.localPlayer.colorId, this.localPlayer.avatar, reason, true);
            });
        }

        // End meeting / resume button
        const endMeetingBtn = document.getElementById('end-meeting-btn');
        if (endMeetingBtn) {
            endMeetingBtn.addEventListener('click', () => {
                this.endEmergencyMeeting(true);
            });
        }

        // Meeting chat form
        const meetingChatForm = document.getElementById('meeting-chat-form');
        const meetingChatInput = document.getElementById('meeting-chat-input');
        if (meetingChatForm && meetingChatInput) {
            meetingChatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = meetingChatInput.value.trim();
                if (!text) return;
                meetingChatInput.value = '';
                this.sendMeetingChatMessage(this.network.localId, this.localPlayer.name, this.localPlayer.colorId, text, true);
            });
        }

        // Quick phrase buttons
        const phraseBtns = document.querySelectorAll('.phrase-btn');
        phraseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const phrase = btn.getAttribute('data-phrase');
                if (phrase) {
                    this.sendMeetingChatMessage(this.network.localId, this.localPlayer.name, this.localPlayer.colorId, phrase, true);
                }
            });
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
            },
            onEmergencyMeeting: (data) => {
                this.triggerEmergencyMeeting(data.callerName, data.callerColor, data.callerAvatar, data.reason, false);
            },
            onMeetingVote: (data) => {
                this.handleRemoteMeetingVote(data.voterId, data.stationId);
            },
            onMeetingChat: (data) => {
                this.handleRemoteMeetingChat(data.senderName, data.senderColor, data.text);
            },
            onMeetingEnded: () => {
                this.endEmergencyMeeting(false);
            }
        });
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            this.keys[e.code] = true;

            if ((e.code === 'KeyE' || e.code === 'Space') && this.isRunning) {
                if (this.missionManager.activeStation || this.meetingInProgress) return;
                this.interactWithNearest();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Click on canvas to interact with station/signage or walk there
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning || this.missionManager.activeStation || this.meetingInProgress) return;
            const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);

            // Check if user clicked directly on a nearby station
            const clickedStation = this.factoryMap.getNearestStation(worldPos.x, worldPos.y, 65);
            if (clickedStation && Math.hypot(clickedStation.x - this.localPlayer.x, clickedStation.y - this.localPlayer.y) < 130) {
                if (clickedStation.id === 'task_meeting') {
                    this.promptCallMeeting();
                    return;
                }
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
            if (this.nearestStation.id === 'task_meeting') {
                this.promptCallMeeting();
                return;
            }
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
        if (!this.missionManager.activeStation && !this.meetingInProgress) {
            this.localPlayer.update(dt, this.keys, this.factoryMap, this.sound);
        }

        // 2. Update Meeting Cooldown & HUD Button
        if (this.meetingCooldown > 0) {
            this.meetingCooldown = Math.max(0, this.meetingCooldown - dt);
            const meetBtn = document.getElementById('emergency-meeting-hud-btn');
            const meetTxt = document.getElementById('meeting-cooldown-text');
            if (meetBtn && meetTxt) {
                meetBtn.disabled = true;
                meetTxt.textContent = `⏳ ${Math.ceil(this.meetingCooldown)}s`;
            }
        } else {
            const meetBtn = document.getElementById('emergency-meeting-hud-btn');
            const meetTxt = document.getElementById('meeting-cooldown-text');
            if (meetBtn && meetTxt && !this.meetingInProgress) {
                meetBtn.disabled = false;
                meetTxt.textContent = `Convocatoria`;
            }
        }

        // 3. Update Q-BOT Companion & Zone Narrative Banner
        this.robotGuide.update(dt, this.localPlayer, this.factoryMap, (zone, msg) => {
            const qbotBanner = document.getElementById('qbot-narrative-text');
            if (qbotBanner) qbotBanner.textContent = msg;
        });

        // 4. Update Factory Map & Cooperative Bots (bots only wander when not in meeting)
        this.factoryMap.update(dt);
        if (!this.meetingInProgress) {
            this.network.updateBots(dt, this.factoryMap.completedTasks);
        }

        // 5. Check proximity to Interactive Stations & Educational Signage
        this.nearestStation = this.factoryMap.getNearestStation(this.localPlayer.x, this.localPlayer.y);
        this.nearestSignage = this.factoryMap.getNearestSignage(this.localPlayer.x, this.localPlayer.y);

        const interactBtn = document.getElementById('hud-interact-btn');
        if (this.nearestStation) {
            interactBtn.disabled = false;
            interactBtn.classList.add('ready');
            if (this.nearestStation.id === 'task_meeting') {
                interactBtn.innerHTML = `🚨 <strong>REUNIÓN [E]</strong><small>Mesa Central</small>`;
            } else {
                interactBtn.innerHTML = `${this.nearestStation.icon} <strong>USAR [E]</strong><small>${this.nearestStation.shortName}</small>`;
            }
        } else if (this.nearestSignage) {
            interactBtn.disabled = false;
            interactBtn.classList.add('ready');
            interactBtn.innerHTML = `📘 <strong>LEER [E]</strong><small>Señalética</small>`;
        } else {
            interactBtn.disabled = true;
            interactBtn.classList.remove('ready');
            interactBtn.innerHTML = `🔧 <strong>USAR [E]</strong><small>Acércate a estación</small>`;
        }

        // 6. Broadcast local player position ~15 times per second
        this.netSyncTimer += dt;
        if (this.netSyncTimer >= 0.065 && !this.meetingInProgress) {
            this.netSyncTimer = 0;
            this.network.broadcastState(this.localPlayer);
        }

        // 7. Render World & Minimap
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

    // =========================================================================
    // EMERGENCY MEETING / JUNTA DE PLANTA METHODS
    // =========================================================================

    promptCallMeeting() {
        if (!this.isRunning) return;
        if (this.meetingInProgress) return;
        if (this.meetingCooldown > 0) {
            this.sound.playError();
            this.addChatMessage('SISTEMA', 'red', `⏰ Espera ${Math.ceil(this.meetingCooldown)}s antes de convocar otra reunión.`);
            return;
        }
        document.getElementById('call-meeting-modal').classList.remove('hidden');
        this.sound.playClick();
    }

    triggerEmergencyMeeting(callerName, callerColor, callerAvatar, reason, isInitiator) {
        if (this.meetingInProgress) return;
        this.meetingInProgress = true;

        // Close minigames or signage if open
        if (this.missionManager) this.missionManager.closeModal();
        document.getElementById('signage-modal').classList.add('hidden');
        document.getElementById('call-meeting-modal').classList.add('hidden');

        // Broadcast to network if local caller
        if (isInitiator) {
            this.network.broadcastEmergencyMeeting(callerName, callerColor, callerAvatar, reason);
        }

        // Sound the emergency alarm (siren + gong)
        this.sound.playEmergencyAlarm();

        // Populate Alert Overlay
        const alertCallerName = document.getElementById('alert-caller-name');
        const alertCallerReason = document.getElementById('alert-caller-reason');
        const alertAvatarSlot = document.getElementById('alert-caller-avatar-slot');

        if (alertCallerName) alertCallerName.textContent = callerName || 'Técnico Quantum';
        if (alertCallerReason) alertCallerReason.textContent = `Motivo: ${reason}`;
        if (alertAvatarSlot) {
            if (callerAvatar) {
                alertAvatarSlot.innerHTML = `<img src="${callerAvatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #38bdf8;">`;
            } else {
                const col = this.assets.PLAYER_COLORS.find(c => c.id === callerColor) || this.assets.PLAYER_COLORS[0];
                alertAvatarSlot.innerHTML = `<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${col.body};border:2px solid #fff;"></span>`;
            }
        }

        const alertOverlay = document.getElementById('emergency-alert-overlay');
        if (alertOverlay) alertOverlay.classList.remove('hidden');

        // Gather all players to Sala de Reuniones around the central table (x: 1200, y: 2050)
        const tableSeats = [
            { x: 1200, y: 2134, facing: 0 },
            { x: 1080, y: 1988, facing: 1 },
            { x: 1200, y: 1966, facing: 0 },
            { x: 1320, y: 1988, facing: -1 },
            { x: 1080, y: 2112, facing: 1 },
            { x: 1320, y: 2112, facing: -1 }
        ];

        // Teleport local player to their chair
        this.localPlayer.x = tableSeats[0].x;
        this.localPlayer.y = tableSeats[0].y;
        this.localPlayer.targetClickPos = null;
        this.localPlayer.isMoving = false;

        // Position bots in the remaining chairs
        let seatIdx = 1;
        for (const bot of this.network.bots.values()) {
            if (seatIdx < tableSeats.length) {
                const seat = tableSeats[seatIdx++];
                bot.x = seat.x;
                bot.y = seat.y;
                bot.targetX = seat.x;
                bot.targetY = seat.y;
                bot.isMoving = false;
                bot.facing = seat.facing;
            }
        }

        // Position Q-BOT near the top of the table
        if (this.robotGuide) {
            this.robotGuide.x = 1200;
            this.robotGuide.y = 1910;
        }

        // Disable meeting button during meeting
        const meetBtn = document.getElementById('emergency-meeting-hud-btn');
        if (meetBtn) meetBtn.disabled = true;

        // Reset meeting votes & speech timers
        this.meetingVotes.clear();
        this.selectedMeetingStationVote = null;
        this.clearBotSpeechTimers();

        // After the dramatic intro (2.2s), open the boardroom screen
        setTimeout(() => {
            if (alertOverlay) alertOverlay.classList.add('hidden');
            const boardModal = document.getElementById('emergency-meeting-modal');
            if (boardModal) boardModal.classList.remove('hidden');

            const headerSub = document.getElementById('meeting-header-sub');
            if (headerSub) {
                headerSub.textContent = `Convocada por ${callerName} • Motivo: ${reason}`;
            }

            this.meetingTimeRemaining = 45;
            this.updateMeetingTimerDisplay();
            if (this.meetingTimer) clearInterval(this.meetingTimer);
            this.meetingTimer = setInterval(() => {
                this.meetingTimeRemaining--;
                this.updateMeetingTimerDisplay();
                if (this.meetingTimeRemaining <= 0) {
                    this.endEmergencyMeeting(false);
                }
            }, 1000);

            this.renderMeetingBoardroom();

            // Simulate intelligent AI bot participation in the meeting
            this.simulateBotParticipation();
        }, 2200);
    }

    clearBotSpeechTimers() {
        if (this.botSpeechTimers && this.botSpeechTimers.length > 0) {
            this.botSpeechTimers.forEach(t => clearTimeout(t));
            this.botSpeechTimers = [];
        }
    }

    updateMeetingTimerDisplay() {
        const timerEl = document.getElementById('meeting-timer-val');
        if (timerEl) {
            timerEl.textContent = `${this.meetingTimeRemaining}s`;
            if (this.meetingTimeRemaining <= 10) {
                timerEl.style.color = '#ef4444';
            } else {
                timerEl.style.color = '#fb7185';
            }
        }
    }

    renderMeetingBoardroom() {
        // 1. Factory Status Badges
        const badgesContainer = document.getElementById('meeting-stations-badges');
        const summaryEl = document.getElementById('meeting-progress-summary');
        const total = this.assets.STATIONS.length;
        const done = this.factoryMap.completedTasks.size;
        const pct = Math.round((done / total) * 100);

        if (summaryEl) {
            summaryEl.textContent = `${done}/${total} Estaciones Completadas (${pct}%)`;
        }

        if (badgesContainer) {
            badgesContainer.innerHTML = '';
            this.assets.STATIONS.forEach(st => {
                const isCompleted = this.factoryMap.completedTasks.has(st.id);
                const chip = document.createElement('div');
                chip.className = 'meeting-station-chip ' + (isCompleted ? 'completed' : 'pending');
                chip.innerHTML = `
                    <span>${isCompleted ? '✅' : '⏳'}</span>
                    <strong>${st.icon} ${st.shortName}</strong>
                `;
                badgesContainer.appendChild(chip);
            });
        }

        // 2. Technicians Grid (Cards for all players present)
        const gridEl = document.getElementById('technicians-grid');
        if (gridEl) {
            gridEl.innerHTML = '';
            const allParticipants = [
                {
                    id: this.network.localId,
                    name: `${this.localPlayer.name} (Tú)`,
                    colorId: this.localPlayer.colorId,
                    avatar: this.localPlayer.avatar,
                    role: 'Técnico Líder',
                    isLocal: true
                },
                ...this.network.getAllRemoteAndBotPlayers().map(p => ({
                    ...p,
                    role: p.isBot ? 'Técnico Aprendiz (IA)' : 'Técnico de Planta',
                    isLocal: false
                }))
            ];

            allParticipants.forEach(p => {
                const col = this.assets.PLAYER_COLORS.find(c => c.id === p.colorId) || this.assets.PLAYER_COLORS[0];
                const card = document.createElement('div');
                card.id = `tech-card-${p.id}`;
                card.className = 'tech-seat-card' + (p.isLocal ? ' local-user' : '');
                card.style.borderColor = p.isLocal ? '#38bdf8' : col.body;

                const avatarContent = p.avatar
                    ? `<img class="tech-avatar-img" src="${p.avatar}" alt="${p.name}">`
                    : `<span class="tech-suit-glyph" style="color:${col.body}">👨‍🚀</span>`;

                const votedStationId = this.meetingVotes.get(p.id);
                const votedStation = votedStationId ? this.assets.STATIONS.find(s => s.id === votedStationId) : null;
                const voteTagHtml = votedStation
                    ? `<div class="tech-vote-tag" id="vote-tag-${p.id}">🎯 ${votedStation.icon} ${votedStation.shortName}</div>`
                    : `<div class="tech-vote-tag" id="vote-tag-${p.id}" style="display:none;"></div>`;

                card.innerHTML = `
                    <div class="tech-seat-top">
                        <div class="tech-avatar-box" style="background:#090d16;border:2.5px solid ${col.body};">
                            ${avatarContent}
                        </div>
                        <div class="tech-info-meta">
                            <span class="tech-name-label" style="color:${col.body};">${p.name}</span>
                            <span class="tech-role-label">${p.role}</span>
                        </div>
                    </div>
                    <div class="tech-speech-bubble" id="speech-bubble-${p.id}">
                        <span>(Esperando deliberación...)</span>
                    </div>
                    ${voteTagHtml}
                `;
                gridEl.appendChild(card);
            });
        }

        // 3. Voting Options
        this.renderMeetingVoteOptions();
    }

    renderMeetingVoteOptions() {
        const container = document.getElementById('meeting-vote-options');
        if (!container) return;
        container.innerHTML = '';

        // Tally votes per station
        const voteCounts = new Map();
        for (const stationId of this.meetingVotes.values()) {
            voteCounts.set(stationId, (voteCounts.get(stationId) || 0) + 1);
        }

        this.assets.STATIONS.forEach(st => {
            const isCompleted = this.factoryMap.completedTasks.has(st.id);
            const count = voteCounts.get(st.id) || 0;
            const isSelected = this.selectedMeetingStationVote === st.id;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'vote-station-btn' + (isSelected ? ' selected' : '');
            btn.innerHTML = `
                <span>${st.icon} ${st.shortName} ${isCompleted ? '✓' : ''}</span>
                <span class="vote-count-badge">${count} votos</span>
            `;

            btn.addEventListener('click', () => {
                this.castMeetingVote(st.id, this.network.localId, true);
            });

            container.appendChild(btn);
        });

        // Update vote tally info text
        const tallyInfo = document.getElementById('meeting-votes-tally-info');
        if (tallyInfo) {
            let maxVotes = 0;
            let leadingStation = null;
            for (const [stId, count] of voteCounts.entries()) {
                if (count > maxVotes) {
                    maxVotes = count;
                    leadingStation = this.assets.STATIONS.find(s => s.id === stId);
                }
            }
            if (leadingStation && maxVotes > 0) {
                tallyInfo.innerHTML = `🌟 Próximo objetivo acordado: <strong>${leadingStation.icon} ${leadingStation.shortName}</strong> (${maxVotes} votos)`;
            } else {
                tallyInfo.textContent = 'Coordina con tu equipo antes de que termine el tiempo.';
            }
        }
    }

    castMeetingVote(stationId, voterId = this.network.localId, isLocal = true) {
        this.meetingVotes.set(voterId, stationId);
        this.sound.playVoteSound();

        if (isLocal) {
            this.selectedMeetingStationVote = stationId;
            this.network.broadcastMeetingVote(voterId, stationId);
        }

        // Update vote tag on voter's card
        const tag = document.getElementById(`vote-tag-${voterId}`);
        const st = this.assets.STATIONS.find(s => s.id === stationId);
        if (tag && st) {
            tag.style.display = 'inline-flex';
            tag.innerHTML = `🎯 ${st.icon} ${st.shortName}`;
            const card = document.getElementById(`tech-card-${voterId}`);
            if (card) card.classList.add('has-voted');
        }

        this.renderMeetingVoteOptions();
    }

    handleRemoteMeetingVote(voterId, stationId) {
        if (!this.meetingInProgress) return;
        this.castMeetingVote(stationId, voterId, false);
    }

    sendMeetingChatMessage(senderId, senderName, senderColor, text, isLocal = true) {
        // Update speech bubble on card
        const bubble = document.getElementById(`speech-bubble-${senderId}`);
        if (bubble) {
            bubble.innerHTML = `<span style="animation: alertPopIn 0.2s ease-out;">"${text}"</span>`;
            bubble.style.borderColor = '#38bdf8';
            setTimeout(() => {
                if (bubble) bubble.style.borderColor = '#475569';
            }, 1800);
        }

        this.sound.playTalkSyllable();
        this.addChatMessage(`[Reunión] ${senderName}`, senderColor, text);

        if (isLocal) {
            this.network.broadcastMeetingChat(senderName, senderColor, text);
        }
    }

    handleRemoteMeetingChat(senderName, senderColor, text) {
        if (!this.meetingInProgress) return;
        // Find matching remote player
        const all = this.network.getAllRemoteAndBotPlayers();
        const p = all.find(x => x.name === senderName);
        const senderId = p ? p.id : 'remote';
        this.sendMeetingChatMessage(senderId, senderName, senderColor, text, false);
    }

    simulateBotParticipation() {
        const pendingStations = this.assets.STATIONS.filter(s => !this.factoryMap.completedTasks.has(s.id));
        const bots = Array.from(this.network.bots.values());

        const botLines = [
            '¡Atención equipo! Organicemos las estaciones pendientes.',
            'Sugiero que nos enfoquemos en la zona con mayor puntaje.',
            '¡Yo puedo colaborar en la siguiente tarea del Quantum E4!',
            'Revisemos bien los componentes antes de la prueba final.'
        ];

        bots.forEach((bot, idx) => {
            // Speech timer
            const speechTimer = setTimeout(() => {
                if (!this.meetingInProgress) return;
                const line = (pendingStations.length > 0 && Math.random() < 0.6)
                    ? `Recomiendo que vayamos a ${pendingStations[0].shortName}.`
                    : botLines[idx % botLines.length];
                this.sendMeetingChatMessage(bot.id, bot.name, bot.colorId, line, false);
            }, 1200 + (idx * 2400));
            this.botSpeechTimers.push(speechTimer);

            // Vote timer
            const voteTimer = setTimeout(() => {
                if (!this.meetingInProgress) return;
                const targetStation = pendingStations.length > 0
                    ? pendingStations[idx % pendingStations.length]
                    : this.assets.STATIONS[idx % this.assets.STATIONS.length];
                this.castMeetingVote(targetStation.id, bot.id, false);
            }, 2500 + (idx * 1900));
            this.botSpeechTimers.push(voteTimer);
        });
    }

    endEmergencyMeeting(isInitiator = true) {
        if (!this.meetingInProgress) return;
        this.meetingInProgress = false;
        this.meetingCooldown = 20;

        if (this.meetingTimer) {
            clearInterval(this.meetingTimer);
            this.meetingTimer = null;
        }
        this.clearBotSpeechTimers();

        const boardModal = document.getElementById('emergency-meeting-modal');
        if (boardModal) boardModal.classList.add('hidden');

        // Unlock badge Estratega de Directorio
        const isNewBadge = !this.unlockedBadges.has('badge_meeting');
        this.unlockedBadges.add('badge_meeting');
        if (isNewBadge) {
            this.teamScore += 250;
            this.sound.playTaskComplete();
        }
        this.renderBadgesHUD();

        this.addChatMessage('Q-BOT', 'cyan', '🤝 ¡Junta técnica de planta finalizada con éxito! Todos los técnicos regresan a sus estaciones.');

        if (isInitiator) {
            this.network.broadcastMeetingEnded();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.quantumGameInstance = new QuantumMotorsGame();
});
