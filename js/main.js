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
        this.meetingModeratorName = null;
        this.isMeetingModerator = false;
        this.meetingCustomVote = null;
        this.customVotesByPlayer = new Map();
        this.selectedCustomVoteIndex = null;
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
                const topicInput = document.getElementById('call-vote-topic-input');
                const opt1Input = document.getElementById('call-vote-opt1-input');
                const opt2Input = document.getElementById('call-vote-opt2-input');
                const opt3Input = document.getElementById('call-vote-opt3-input');

                const topic = (topicInput && topicInput.value.trim()) || '¿Cómo cumplimos con el pedido?';
                const opt1 = (opt1Input && opt1Input.value.trim()) || 'Reparar';
                const opt2 = (opt2Input && opt2Input.value.trim()) || 'Alquilar una máquina compatible';
                const opt3 = (opt3Input && opt3Input.value.trim()) || 'Contratar producción externa';

                document.getElementById('call-meeting-modal').classList.add('hidden');
                this.triggerEmergencyMeeting(this.localPlayer.name, this.localPlayer.colorId, this.localPlayer.avatar, topic, true, [opt1, opt2, opt3]);
            });
        }

        // End meeting / resume button
        const endMeetingBtn = document.getElementById('end-meeting-btn');
        if (endMeetingBtn) {
            endMeetingBtn.addEventListener('click', () => {
                this.endEmergencyMeeting(true);
            });
        }

        // Moderator 3-Option Voting buttons
        const startCustomVoteBtn = document.getElementById('start-custom-vote-btn');
        if (startCustomVoteBtn) {
            startCustomVoteBtn.addEventListener('click', () => {
                this.moderatorCreateCustomVote();
            });
        }
        const concludeCustomVoteBtn = document.getElementById('conclude-custom-vote-btn');
        if (concludeCustomVoteBtn) {
            concludeCustomVoteBtn.addEventListener('click', () => {
                this.concludeCustomVote();
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
                this.triggerEmergencyMeeting(data.callerName, data.callerColor, data.callerAvatar, data.voteTopic || data.reason, false, data.voteOptions);
            },
            onMeetingVote: (data) => {
                this.handleRemoteMeetingVote(data.voterId, data.stationId);
            },
            onMeetingCustomVoteCreate: (data) => {
                this.handleRemoteCustomVoteCreate(data.topic, data.options, data.moderatorName);
            },
            onMeetingCustomVoteCast: (data) => {
                this.handleRemoteCustomVoteCast(data.voterId, data.optionIndex, data.voterName);
            },
            onMeetingCustomVoteClose: (data) => {
                this.handleRemoteCustomVoteClose(data.winningOptionText, data.winnerIndex);
            },
            onMeetingChat: (data) => {
                this.handleRemoteMeetingChat(data.senderName, data.senderColor, data.text);
            },
            onMeetingEnded: () => {
                this.endEmergencyMeeting(false);
            },
            onEnvasadoraExplosion: (data) => {
                this.handleRemoteEnvasadoraExplosion(data.x, data.y, data.culpritName);
            },
            onEnvasadoraRepaired: (data) => {
                this.handleRemoteEnvasadoraRepaired(data.mechanicName);
            }
        });
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            this.keys[e.code] = true;

            // EASTER EGG: En el área de envasado, si se aprieta 'B' en lugar de 'E', ¡provoca una falla destructiva en la envasadora!
            if (e.code === 'KeyB' && this.isRunning) {
                const isNearEnvasado = (this.nearestStation && this.nearestStation.id === 'task_assembly') ||
                                       (this.missionManager && this.missionManager.activeStation && this.missionManager.activeStation.id === 'task_assembly');
                const currentZone = this.factoryMap.getZoneAt(this.localPlayer.x, this.localPlayer.y);
                const isInEnvasadoZone = currentZone && currentZone.id === 'ensamblaje';

                if (isNearEnvasado || isInEnvasadoZone) {
                    this.triggerEasterEggEnvasadoFailure();
                    return;
                }
            }

            // REPARAR ENVASADORA: Con la tecla 'F', reparar la máquina envasadora si está rota
            if (e.code === 'KeyF' && this.isRunning) {
                if (this.factoryMap.envasadoraBroken) {
                    this.repairEnvasadora();
                    return;
                }
            }

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
                if (clickedStation.id === 'task_assembly' && this.factoryMap.envasadoraBroken) {
                    this.showBrokenEnvasadoraAlert();
                    return;
                }
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
        const roomInput = document.getElementById('room-code-input').value.trim() || 'PIL-2026';
        const wsInput = document.getElementById('ws-url-input').value.trim() || 'ws://localhost:8080';
        const fillBotsCheckbox = document.getElementById('fill-bots-checkbox');
        const fillBots = (fillBotsCheckbox && fillBotsCheckbox.checked) ? true : false;

        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(t => t.stop());
            this.webcamStream = null;
        }

        this.localPlayer.name = nameInput || 'Técnico PIL';
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

        this.addChatMessage('PIL-BOT', 'cyan', `¡Bienvenido a la Planta PIL Andina Bolivia, ${this.localPlayer.name}! Completen las 6 estaciones para procesar el lote de leche y yogur.`);
        this.updateCrewRosterHUD();

        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    interactWithNearest() {
        if (this.nearestStation) {
            if (this.nearestStation.id === 'task_assembly' && this.factoryMap.envasadoraBroken) {
                this.showBrokenEnvasadoraAlert();
                return;
            }
            if (this.nearestStation.id === 'task_meeting') {
                this.promptCallMeeting();
                return;
            }
            this.missionManager.openMission(this.nearestStation);
        } else if (this.nearestSignage) {
            this.openSignageModal(this.nearestSignage);
        }
    }

    triggerEasterEggEnvasadoFailure() {
        if (this.factoryMap.envasadoraBroken) {
            this.showBrokenEnvasadoraAlert();
            return;
        }

        // Set broken state in factory map
        this.factoryMap.breakEnvasadora();

        // Close mission modal if active
        if (this.missionManager && this.missionManager.activeStation) {
            this.missionManager.closeModal();
        }

        // Trigger massive visual explosion, fireballs, milk splash, and violent camera shake
        if (this.renderer && this.renderer.triggerExplosion) {
            this.renderer.triggerExplosion(1200, 1155);
        }

        // Play catastrophic explosion sound boom & klaxon
        if (this.sound && this.sound.playCatastrophicExplosion) {
            this.sound.playCatastrophicExplosion();
        } else if (this.sound && this.sound.playMachineFailure) {
            this.sound.playMachineFailure();
        } else {
            this.sound.playError();
        }

        // Display dramatic global alert banner for all players
        this.showExplosionGlobalAlert(this.localPlayer.name || 'Técnico PIL');

        // Broadcast to ALL players across network (WebSocket and local channel)
        if (this.network && this.network.broadcastEnvasadoraExplosion) {
            this.network.broadcastEnvasadoraExplosion(1200, 1155, this.localPlayer.name || 'Técnico PIL');
        }

        // Emote on player
        this.localPlayer.setEmote('💥', 5.0);

        // Chat announcements
        this.addChatMessage('SISTEMA', 'red', '🥚 ¡EASTER EGG ACTIVADO! Has presionado [B] en la línea de envasado...');
        this.addChatMessage('PIL-BOT', 'orange', '🚨 ¡DESASTRE LÁCTEO! ¡La envasadora sufrió un atasco destructivo de film tricapa por pulsar [B], derramó leche y quedó totalmente INUTILIZABLE!');

        // Broadcast chat over network if available
        if (this.network && this.network.ws && this.network.ws.readyState === WebSocket.OPEN) {
            this.network.ws.send(JSON.stringify({
                type: 'chat',
                room: this.network.roomId,
                playerName: 'ALERTA PLANTA',
                colorId: 'orange',
                text: '💥 ¡FALLA CRÍTICA EN ENVASADO! La envasadora de Bolsa Azul colapsó por sobredosis [B]. Máquina INUTILIZABLE.'
            }));
        }

        // Show Easter Egg Discovery Modal
        this.showEasterEggModal();
    }

    handleRemoteEnvasadoraExplosion(x = 1200, y = 1155, culpritName = 'Un Técnico') {
        if (!this.factoryMap.envasadoraBroken) {
            this.factoryMap.breakEnvasadora();
        }
        if (this.missionManager && this.missionManager.activeStation && this.missionManager.activeStation.id === 'task_assembly') {
            this.missionManager.closeModal();
        }
        if (this.renderer && this.renderer.triggerExplosion) {
            this.renderer.triggerExplosion(x, y);
        }
        if (this.sound && this.sound.playCatastrophicExplosion) {
            this.sound.playCatastrophicExplosion();
        }
        this.showExplosionGlobalAlert(culpritName);
        this.addChatMessage('PIL-BOT', 'orange', `🚨 ¡DESASTRE LÁCTEO! ¡${culpritName} provocó una explosión en la envasadora PIL! ¡Máquina INUTILIZABLE!`);
    }

    showExplosionGlobalAlert(culpritName = 'Un Técnico') {
        let banner = document.getElementById('explosion-global-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'explosion-global-banner';
            banner.className = 'explosion-global-banner';
            banner.innerHTML = `
                <div class="explosion-banner-icon">💥</div>
                <div class="explosion-banner-text">
                    <h3 id="explosion-banner-title">¡ALERTA ROJA: EXPLOSIÓN EN ENVASADORA PIL!</h3>
                    <p id="explosion-banner-desc">La envasadora aséptica colapsó violentamente y quedó INUTILIZABLE.</p>
                </div>
            `;
            document.body.appendChild(banner);
        }

        const titleEl = document.getElementById('explosion-banner-title');
        const descEl = document.getElementById('explosion-banner-desc');
        if (titleEl) titleEl.textContent = '💥 ¡ALERTA ROJA: EXPLOSIÓN EN ENVASADORA PIL! 💥';
        if (descEl) descEl.textContent = `La envasadora colapsó por sobredosis de film [B] (Causado por ${culpritName}). ¡Máquina fuera de servicio!`;

        banner.classList.add('visible');

        if (this._explosionAlertTimeout) {
            clearTimeout(this._explosionAlertTimeout);
        }
        this._explosionAlertTimeout = setTimeout(() => {
            banner.classList.remove('visible');
        }, 6500);
    }

    repairEnvasadora() {
        if (!this.factoryMap.envasadoraBroken) return;

        this.factoryMap.repairEnvasadora();

        // Sound effect
        if (this.sound.playMachineRepaired) {
            this.sound.playMachineRepaired();
        } else {
            this.sound.playTaskComplete();
        }

        // Close broken machine or easter egg modals if open
        const brokenModal = document.getElementById('broken-machine-modal');
        if (brokenModal) brokenModal.classList.add('hidden');
        const easterModal = document.getElementById('easter-egg-modal');
        if (easterModal) easterModal.classList.add('hidden');

        // Emote on player
        this.localPlayer.setEmote('🔧', 4.0);

        // Chat announcements
        this.addChatMessage('PIL-BOT', 'lime', `🔧 ¡ENVASADORA REPARADA! ${this.localPlayer.name} reparó la máquina envasadora aséptica con la tecla [F]. ¡La línea de Bolsa Azul vuelve a operar!`);

        // Global HUD Alert Banner
        this.showRepairedGlobalAlert(this.localPlayer.name || 'Técnico PIL');

        // Broadcast to all other players across network
        if (this.network && this.network.broadcastEnvasadoraRepaired) {
            this.network.broadcastEnvasadoraRepaired(this.localPlayer.name || 'Técnico PIL');
        }

        if (this.network && this.network.ws && this.network.ws.readyState === WebSocket.OPEN) {
            this.network.ws.send(JSON.stringify({
                type: 'chat',
                room: this.network.roomId,
                playerName: 'MANTENIMIENTO PIL',
                colorId: 'lime',
                text: `🔧 ¡ENVASADORA REPARADA! ${this.localPlayer.name} arregló la máquina con [F]. Operatividad al 100%.`
            }));
        }
    }

    handleRemoteEnvasadoraRepaired(mechanicName = 'Un Técnico') {
        this.factoryMap.repairEnvasadora();

        const brokenModal = document.getElementById('broken-machine-modal');
        if (brokenModal) brokenModal.classList.add('hidden');
        const easterModal = document.getElementById('easter-egg-modal');
        if (easterModal) easterModal.classList.add('hidden');

        if (this.sound.playMachineRepaired) {
            this.sound.playMachineRepaired();
        } else {
            this.sound.playTaskComplete();
        }

        this.showRepairedGlobalAlert(mechanicName);
        this.addChatMessage('PIL-BOT', 'lime', `🔧 ¡ENVASADORA REPARADA! ${mechanicName} arregló la envasadora aséptica con la tecla [F]. ¡Vuelve a estar operativa!`);
    }

    showRepairedGlobalAlert(mechanicName = 'Un Técnico') {
        let banner = document.getElementById('explosion-global-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'explosion-global-banner';
            banner.className = 'explosion-global-banner';
            document.body.appendChild(banner);
        }

        banner.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.96), rgba(5, 150, 105, 0.98))';
        banner.style.borderColor = '#6ee7b7';
        banner.style.boxShadow = '0 0 50px rgba(16, 185, 129, 0.75), 0 12px 30px rgba(0, 0, 0, 0.7)';

        banner.innerHTML = `
            <div class="explosion-banner-icon">🔧</div>
            <div class="explosion-banner-text">
                <h3 style="color:#d1fae5;margin:0;font-size:20px;font-weight:900;">🔧 ¡ENVASADORA REPARADA CON ÉXITO! 🔧</h3>
                <p style="color:#ffffff;margin:4px 0 0 0;font-size:14px;font-weight:700;">${mechanicName} reparó la máquina con la tecla [F]. ¡La producción de Bolsa Azul continúa!</p>
            </div>
        `;

        banner.classList.add('visible');

        if (this._explosionAlertTimeout) {
            clearTimeout(this._explosionAlertTimeout);
        }
        this._explosionAlertTimeout = setTimeout(() => {
            banner.classList.remove('visible');
            setTimeout(() => {
                banner.style.background = '';
                banner.style.borderColor = '';
                banner.style.boxShadow = '';
            }, 500);
        }, 5500);
    }

    showEasterEggModal() {
        let modal = document.getElementById('easter-egg-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'easter-egg-modal';
            modal.className = 'overlay';
            modal.innerHTML = `
                <div class="lobby-card" style="border-color:#ef4444;text-align:center;box-shadow:0 0 50px rgba(239,68,68,0.55);max-width:520px;">
                    <div style="font-size:48px;margin-bottom:8px;">💥🥚🥛</div>
                    <span class="bolivia-pill" style="background:#ef4444;color:#fff;">EASTER EGG ACTIVADO</span>
                    <h2 style="color:#f87171;margin:12px 0 6px 0;font-size:22px;">¡ENVASADORA PIL INUTILIZABLE!</h2>
                    <p style="color:#e2e8f0;font-size:14px;line-height:1.6;margin-bottom:14px;">
                        Presionaste la tecla secreta <strong>[B]</strong> en lugar de [E] en la línea de envasado.<br>
                        ¡La bobina tricapa se atascó violentamente, los selladores térmicos colapsaron y se derramaron litros de leche por todo el piso!<br>
                        <span style="color:#fca5a5;font-weight:700;">⚠️ La máquina envasadora ha quedado completamente fuera de servicio e inutilizable.</span>
                    </p>
                    <p style="color:#6ee7b7;font-size:13.5px;font-weight:700;margin-bottom:18px;">
                        💡 <em>Tip: Presiona la tecla <strong>[F]</strong> para repararla y volver a ponerla en marcha.</em>
                    </p>
                    <div style="display:flex;gap:10px;">
                        <button id="repair-easter-egg-btn" class="primary-action-btn" style="background:#10b981;border-color:#059669;flex:1;">🔧 Reparar [F]</button>
                        <button id="close-easter-egg-btn" class="btn btn-primary" style="background:#ef4444;border-color:#b91c1c;flex:1;">¡Entendido!</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('close-easter-egg-btn').addEventListener('click', () => {
                modal.classList.add('hidden');
            });
            document.getElementById('repair-easter-egg-btn').addEventListener('click', () => {
                this.repairEnvasadora();
            });
        }
        modal.classList.remove('hidden');
    }

    showBrokenEnvasadoraAlert() {
        this.sound.playError();
        this.localPlayer.setEmote('⚠️', 3.0);
        let modal = document.getElementById('broken-machine-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'broken-machine-modal';
            modal.className = 'overlay';
            modal.innerHTML = `
                <div class="lobby-card" style="border-color:#f97316;text-align:center;max-width:480px;box-shadow:0 0 40px rgba(249,115,22,0.4);">
                    <div style="font-size:42px;margin-bottom:6px;">⚠️🛠️🛑</div>
                    <h3 style="color:#fb923c;margin-bottom:8px;font-size:20px;">MÁQUINA ENVASADORA INUTILIZABLE</h3>
                    <p style="color:#cbd5e1;font-size:14px;line-height:1.5;margin-bottom:14px;">
                        Esta máquina sufrió una falla destructiva por el atasco con la tecla <strong>[B]</strong>.<br>
                        No se puede operar ni procesar bolsas de leche PIL.<br>
                        <em>Estado: Inutilizable / Fuera de Servicio</em>
                    </p>
                    <p style="color:#6ee7b7;font-size:13.5px;font-weight:700;margin-bottom:16px;">
                        💡 Presiona la tecla <strong>[F]</strong> en cualquier momento para repararla.
                    </p>
                    <button id="repair-broken-btn" class="primary-action-btn" style="background:#10b981;border-color:#059669;width:100%;margin-bottom:10px;font-size:14px;">🔧 REPARAR ENVASADORA [F]</button>
                    <button id="close-broken-btn" class="btn btn-secondary" style="width:100%;">Cerrar</button>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('close-broken-btn').addEventListener('click', () => {
                modal.classList.add('hidden');
            });
            document.getElementById('repair-broken-btn').addEventListener('click', () => {
                this.repairEnvasadora();
            });
        }
        modal.classList.remove('hidden');
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
        this.addChatMessage('PIL-BOT', 'lime', `✅ ¡${this.localPlayer.name} completó "${station.shortName}"! (+${station.points} pts)`);

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
        progressText.textContent = `Procesamiento Colectivo PIL: ${done}/${total} (${pct}%)`;
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
            document.getElementById('victory-score').textContent = `${this.teamScore} Puntos de Inocuidad Láctea`;
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

    triggerEmergencyMeeting(callerName, callerColor, callerAvatar, reason, isInitiator, initialOptions) {
        if (this.meetingInProgress) return;
        this.meetingInProgress = true;

        // Close minigames or signage if open
        if (this.missionManager) this.missionManager.closeModal();
        document.getElementById('signage-modal').classList.add('hidden');
        document.getElementById('call-meeting-modal').classList.add('hidden');

        const voteOptions = (Array.isArray(initialOptions) && initialOptions.length >= 3) ? initialOptions : [
            'Reparar',
            'Alquilar una máquina compatible',
            'Contratar producción externa'
        ];
        const voteTopic = reason || '¿Cómo cumplimos con el pedido?';

        // Broadcast to network if local caller
        if (isInitiator) {
            this.network.broadcastEmergencyMeeting(callerName, callerColor, callerAvatar, voteTopic, voteTopic, voteOptions);
        }

        // Sound the emergency alarm (siren + gong)
        this.sound.playEmergencyAlarm();

        // Populate Alert Overlay
        const alertCallerName = document.getElementById('alert-caller-name');
        const alertCallerReason = document.getElementById('alert-caller-reason');
        const alertAvatarSlot = document.getElementById('alert-caller-avatar-slot');

        if (alertCallerName) alertCallerName.textContent = callerName || 'Técnico PIL';
        if (alertCallerReason) alertCallerReason.textContent = `Votación: ${voteTopic}`;
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
        this.customVotesByPlayer.clear();
        this.selectedCustomVoteIndex = null;
        this.meetingModeratorName = callerName || this.localPlayer.name;
        this.isMeetingModerator = Boolean(isInitiator);

        this.meetingCustomVote = {
            topic: voteTopic,
            options: voteOptions,
            isOpen: true,
            moderatorName: this.meetingModeratorName,
            isClosed: false
        };
        this.clearBotSpeechTimers();

        // After the dramatic intro (2.2s), open the boardroom screen
        setTimeout(() => {
            if (alertOverlay) alertOverlay.classList.add('hidden');
            const boardModal = document.getElementById('emergency-meeting-modal');
            if (boardModal) boardModal.classList.remove('hidden');

            const headerSub = document.getElementById('meeting-header-sub');
            if (headerSub) {
                headerSub.textContent = `Votación convocada por ${callerName} • Moderador de Sala`;
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

        // 3. Moderated 3-Option Voting Setup
        this.setupMeetingModeratorPanel();
        this.renderCustomMeetingVoteCards();
    }

    setupMeetingModeratorPanel() {
        const modNameEl = document.getElementById('meeting-moderator-display-name');
        const concludeBtn = document.getElementById('conclude-custom-vote-btn');
        const endMeetingBtn = document.getElementById('end-meeting-btn');
        const waitModeratorText = document.getElementById('meeting-wait-moderator-text');
        const winnerBanner = document.getElementById('vote-winner-banner');

        if (winnerBanner) winnerBanner.classList.add('hidden');

        if (modNameEl) {
            modNameEl.textContent = this.meetingModeratorName || (this.isMeetingModerator ? this.localPlayer.name : 'el Convocante');
        }

        if (this.isMeetingModerator) {
            if (concludeBtn) concludeBtn.classList.remove('hidden');
            if (endMeetingBtn) endMeetingBtn.classList.remove('hidden');
            if (waitModeratorText) waitModeratorText.classList.add('hidden');
        } else {
            if (concludeBtn) concludeBtn.classList.add('hidden');
            if (endMeetingBtn) endMeetingBtn.classList.add('hidden');
            if (waitModeratorText) {
                waitModeratorText.textContent = `⏳ Esperando que ${this.meetingModeratorName || 'el convocante'} reanude las labores...`;
                waitModeratorText.classList.remove('hidden');
            }
        }
    }

    moderatorCreateCustomVote() {
        if (!this.isMeetingModerator) return;
        const topicInput = document.getElementById('custom-vote-topic-input');
        const opt1Input = document.getElementById('custom-vote-opt1-input');
        const opt2Input = document.getElementById('custom-vote-opt2-input');
        const opt3Input = document.getElementById('custom-vote-opt3-input');

        const topic = (topicInput && topicInput.value.trim()) || '¿Cómo cumplimos con el pedido?';
        const opt1 = (opt1Input && opt1Input.value.trim()) || 'Reparar';
        const opt2 = (opt2Input && opt2Input.value.trim()) || 'Alquilar una máquina compatible';
        const opt3 = (opt3Input && opt3Input.value.trim()) || 'Contratar producción externa';

        this.meetingCustomVote = {
            topic,
            options: [opt1, opt2, opt3],
            isOpen: true,
            moderatorName: this.localPlayer.name,
            isClosed: false
        };

        this.customVotesByPlayer.clear();
        this.selectedCustomVoteIndex = null;
        this.sound.playClick();

        // Broadcast to other players
        this.network.broadcastMeetingCustomVoteCreate(topic, [opt1, opt2, opt3], this.localPlayer.name);

        this.addChatMessage('MODERADOR', 'orange', `📢 Votación oficial abierta por ${this.localPlayer.name}: "${topic}". ¡Todos tienen 1 voto!`);

        const concludeBtn = document.getElementById('conclude-custom-vote-btn');
        if (concludeBtn) concludeBtn.classList.remove('hidden');

        const winnerBanner = document.getElementById('vote-winner-banner');
        if (winnerBanner) winnerBanner.classList.add('hidden');

        this.renderCustomMeetingVoteCards();
    }

    handleRemoteCustomVoteCreate(topic, options, moderatorName) {
        if (!this.meetingInProgress) return;
        this.meetingCustomVote = {
            topic,
            options: Array.isArray(options) ? options : ['Opción 1', 'Opción 2', 'Opción 3'],
            isOpen: true,
            moderatorName: moderatorName || 'El Moderador',
            isClosed: false
        };
        this.customVotesByPlayer.clear();
        this.selectedCustomVoteIndex = null;
        this.sound.playClick();

        const modNameEl = document.getElementById('meeting-moderator-display-name');
        if (modNameEl) modNameEl.textContent = moderatorName || 'el Moderador';

        const winnerBanner = document.getElementById('vote-winner-banner');
        if (winnerBanner) winnerBanner.classList.add('hidden');

        this.addChatMessage('MODERADOR', 'orange', `📢 Votación abierta por ${moderatorName}: "${topic}". Vota por 1 opción.`);
        this.renderCustomMeetingVoteCards();
    }

    castCustomMeetingVote(optionIndex, voterId = this.network.localId, isLocal = true) {
        if (!this.meetingCustomVote || this.meetingCustomVote.isClosed) return;
        if (optionIndex < 0 || optionIndex > 2) return;

        this.customVotesByPlayer.set(voterId, optionIndex);
        this.sound.playVoteSound();

        if (isLocal) {
            this.selectedCustomVoteIndex = optionIndex;
            this.network.broadcastMeetingCustomVoteCast(voterId, optionIndex, this.localPlayer.name);
        }

        // Update vote tag on voter's seat card
        const tag = document.getElementById(`vote-tag-${voterId}`);
        if (tag) {
            tag.style.display = 'inline-flex';
            tag.innerHTML = `🗳️ Opción ${optionIndex + 1}`;
            const card = document.getElementById(`tech-card-${voterId}`);
            if (card) card.classList.add('has-voted');
        }

        this.renderCustomMeetingVoteCards();
    }

    handleRemoteCustomVoteCast(voterId, optionIndex, voterName) {
        if (!this.meetingInProgress) return;
        this.castCustomMeetingVote(optionIndex, voterId, false);
    }

    renderCustomMeetingVoteCards() {
        const grid = document.getElementById('custom-vote-cards-grid');
        const questionEl = document.getElementById('active-vote-question');
        const modNameEl = document.getElementById('meeting-moderator-display-name');
        if (!grid) return;

        if (!this.meetingCustomVote) return;

        if (questionEl) questionEl.textContent = `🎯 ${this.meetingCustomVote.topic}`;
        if (modNameEl) modNameEl.textContent = this.meetingCustomVote.moderatorName || 'el Convocante';

        // Tally votes
        const totalVotes = this.customVotesByPlayer.size;
        const tallies = [0, 0, 0];
        const votersByOption = [[], [], []];

        const allParticipants = [
            { id: this.network.localId, name: `${this.localPlayer.name} (Tú)` },
            ...this.network.getAllRemoteAndBotPlayers()
        ];

        for (const [voterId, optIdx] of this.customVotesByPlayer.entries()) {
            if (optIdx >= 0 && optIdx <= 2) {
                tallies[optIdx]++;
                const p = allParticipants.find(x => x.id === voterId);
                if (p) votersByOption[optIdx].push(p.name);
            }
        }

        grid.innerHTML = '';

        this.meetingCustomVote.options.forEach((optText, idx) => {
            const count = tallies[idx];
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyVote = this.selectedCustomVoteIndex === idx;

            const card = document.createElement('div');
            card.className = 'custom-vote-card' + (isMyVote ? ' voted-by-me' : '');
            if (this.meetingCustomVote.isClosed) card.style.cursor = 'default';

            const votersChipsHtml = votersByOption[idx]
                .map(name => `<span class="voter-chip">👤 ${name}</span>`)
                .join('');

            card.innerHTML = `
                <div>
                    <div class="card-top-badge-row">
                        <span class="card-opt-badge">OPCIÓN ${idx + 1}</span>
                        ${isMyVote ? '<span class="my-vote-indicator">✓ Tu Voto</span>' : ''}
                    </div>
                    <div class="card-opt-text">${optText}</div>
                </div>
                <div>
                    <div class="vote-progress-wrapper">
                        <div class="vote-progress-bar" style="width: ${pct}%;"></div>
                    </div>
                    <div class="vote-tally-row">
                        <span>${count} voto${count !== 1 ? 's' : ''}</span>
                        <span>${pct}%</span>
                    </div>
                    <div class="voters-avatars-row">
                        ${votersChipsHtml}
                    </div>
                </div>
            `;

            if (!this.meetingCustomVote.isClosed) {
                card.addEventListener('click', () => {
                    this.castCustomMeetingVote(idx, this.network.localId, true);
                });
            }

            grid.appendChild(card);
        });
    }

    concludeCustomVote() {
        if (!this.meetingCustomVote || this.meetingCustomVote.isClosed) return;
        this.meetingCustomVote.isClosed = true;

        // Calculate counts
        const tallies = [0, 0, 0];
        for (const optIdx of this.customVotesByPlayer.values()) {
            if (optIdx >= 0 && optIdx <= 2) {
                tallies[optIdx]++;
            }
        }

        let maxVotes = -1;
        let winnerIdx = 0;
        tallies.forEach((count, idx) => {
            if (count > maxVotes) {
                maxVotes = count;
                winnerIdx = idx;
            }
        });

        const winningText = this.meetingCustomVote.options[winnerIdx] || `Opción ${winnerIdx + 1}`;

        // Show banner
        const banner = document.getElementById('vote-winner-banner');
        if (banner) {
            banner.innerHTML = `🏆 <strong>RESOLUCIÓN APROBADA POR EL COMITÉ:</strong><br><span style="font-size:16px;color:#fff;">Opción ${winnerIdx + 1}: ${winningText}</span> <span style="font-size:12px;color:#facc15;">(${maxVotes} votos)</span>`;
            banner.classList.remove('hidden');
        }

        this.sound.playTaskComplete();
        this.addChatMessage('COMITÉ HACCP', 'lime', `🏆 ¡Votación concluida! Resolución aprobada: "Opción ${winnerIdx + 1}: ${winningText}" con ${maxVotes} votos.`);

        // Hide conclude button
        const concludeBtn = document.getElementById('conclude-custom-vote-btn');
        if (concludeBtn) concludeBtn.classList.add('hidden');

        if (this.isMeetingModerator) {
            this.network.broadcastMeetingCustomVoteClose(winningText, winnerIdx);
        }

        this.renderCustomMeetingVoteCards();
    }

    handleRemoteCustomVoteClose(winningOptionText, winnerIndex) {
        if (!this.meetingInProgress) return;
        if (this.meetingCustomVote) this.meetingCustomVote.isClosed = true;

        const banner = document.getElementById('vote-winner-banner');
        if (banner) {
            banner.innerHTML = `🏆 <strong>RESOLUCIÓN APROBADA POR EL COMITÉ:</strong><br><span style="font-size:16px;color:#fff;">Opción ${(winnerIndex || 0) + 1}: ${winningOptionText}</span>`;
            banner.classList.remove('hidden');
        }
        this.sound.playTaskComplete();
        this.addChatMessage('COMITÉ HACCP', 'lime', `🏆 ¡Votación concluida por el moderador! Resolución aprobada: "${winningOptionText}".`);
        this.renderCustomMeetingVoteCards();
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
        const all = this.network.getAllRemoteAndBotPlayers();
        const p = all.find(x => x.name === senderName);
        const senderId = p ? p.id : 'remote';
        this.sendMeetingChatMessage(senderId, senderName, senderColor, text, false);
    }

    simulateBotParticipation() {
        const bots = Array.from(this.network.bots.values());

        const botLines = [
            '¡Yo voto por Reparar de inmediato la envasadora!',
            '¡Alquilar una máquina compatible nos permitirá seguir envasando sin demoras!',
            '¡Contratar producción externa garantiza las bolsas azules del pedido!',
            '¡Buen debate de planta! Voto por la solución más rápida y segura.'
        ];

        bots.forEach((bot, idx) => {
            // Speech timer
            const speechTimer = setTimeout(() => {
                if (!this.meetingInProgress) return;
                const line = botLines[idx % botLines.length];
                this.sendMeetingChatMessage(bot.id, bot.name, bot.colorId, line, false);
            }, 1200 + (idx * 2200));
            this.botSpeechTimers.push(speechTimer);

            // Vote timer (bots vote for 1 option across the 3 choices)
            const voteTimer = setTimeout(() => {
                if (!this.meetingInProgress) return;
                const optIdx = idx % 3;
                this.castCustomMeetingVote(optIdx, bot.id, false);
            }, 1800 + (idx * 1600));
            this.botSpeechTimers.push(voteTimer);
        });
    }

    endEmergencyMeeting(isInitiator = true) {
        if (!this.meetingInProgress) return;
        if (isInitiator && !this.isMeetingModerator) return;
        this.meetingInProgress = false;
        this.meetingCooldown = 20;

        if (this.meetingTimer) {
            clearInterval(this.meetingTimer);
            this.meetingTimer = null;
        }
        this.clearBotSpeechTimers();

        const boardModal = document.getElementById('emergency-meeting-modal');
        if (boardModal) boardModal.classList.add('hidden');

        // Unlock badge Comité de Inocuidad HACCP
        const isNewBadge = !this.unlockedBadges.has('badge_meeting');
        this.unlockedBadges.add('badge_meeting');
        if (isNewBadge) {
            this.teamScore += 250;
            this.sound.playTaskComplete();
        }
        this.renderBadgesHUD();

        this.addChatMessage('PIL-BOT', 'cyan', '🛡️ ¡Comité de Inocuidad HACCP finalizado con éxito! Todos los técnicos regresan a sus estaciones.');

        if (isInitiator) {
            this.network.broadcastMeetingEnded();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.quantumGameInstance = new QuantumMotorsGame();
});
