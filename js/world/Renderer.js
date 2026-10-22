/**
 * Renderer.js - Rich Illustrated 2D Vector Rendering Engine (Among Us Cartoon Style)
 * Features thick outlines, 3D shaded machinery, curved car bodies, articulated robots,
 * rotating fans, cylindrical batteries, detailed forklifts, and holographic terminals.
 */
window.QuantumGame = window.QuantumGame || {};

class Renderer {
    constructor(canvas, minimapCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.minimapCanvas = minimapCanvas;
        this.minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
        this.camera = { x: 0, y: 0 };
        this.avatarCache = new Map();

        // Dynamic Camera Shake & Screen Flash Trauma FX
        this.shakeTimer = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.flashTimer = 0;
        this.flashDuration = 0;
        this.activeExplosions = [];
        this.lastTime = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.camera.x,
            y: screenY + this.camera.y
        };
    }

    shakeCamera(intensity = 28, duration = 1600) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }

    flashScreen(duration = 1300) {
        this.flashDuration = duration;
        this.flashTimer = duration;
    }

    triggerExplosion(x = 1200, y = 1155) {
        this.shakeCamera(32, 1700);
        this.flashScreen(1350);

        const particles = [];

        // 1. Expanding shockwaves
        for (let s = 0; s < 4; s++) {
            particles.push({
                type: 'shockwave',
                x,
                y,
                radius: 12 + s * 22,
                maxRadius: 380 + s * 70,
                speed: 360 + s * 80,
                alpha: 1.0,
                color: s % 2 === 0 ? 'rgba(255, 255, 255,' : 'rgba(251, 146, 60,'
            });
        }

        // 2. Fireballs & Plasma bursts
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 290;
            const lifeDuration = 900 + Math.random() * 700;
            particles.push({
                type: 'fireball',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 45,
                size: 22 + Math.random() * 38,
                maxLife: lifeDuration,
                life: lifeDuration,
                hue: 15 + Math.random() * 35
            });
        }

        // 3. Milk geysers / splash droplets
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 330;
            const lifeDuration = 1300 + Math.random() * 800;
            particles.push({
                type: 'milk',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 90,
                size: 6 + Math.random() * 16,
                gravity: 300,
                maxLife: lifeDuration,
                life: lifeDuration
            });
        }

        // 4. Flying Shrapnel & Twisted Metal
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 340;
            const lifeDuration = 1600 + Math.random() * 700;
            particles.push({
                type: 'shrapnel',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 20,
                size: 10 + Math.random() * 14,
                gravity: 360,
                color: Math.random() > 0.5 ? '#64748b' : '#1e293b',
                maxLife: lifeDuration,
                life: lifeDuration
            });
        }

        // 5. Flying Bolsa Azul Film Strips
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 220;
            const lifeDuration = 1800 + Math.random() * 800;
            particles.push({
                type: 'film',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 9,
                w: 14 + Math.random() * 18,
                h: 22 + Math.random() * 30,
                gravity: 140,
                maxLife: lifeDuration,
                life: lifeDuration
            });
        }

        this.activeExplosions.push({
            x,
            y,
            startTime: performance.now(),
            particles
        });
    }

    drawExplosions(ctx, now, dt) {
        if (!this.activeExplosions.length) return;

        for (let expIdx = this.activeExplosions.length - 1; expIdx >= 0; expIdx--) {
            const exp = this.activeExplosions[expIdx];
            let allDead = true;

            for (const p of exp.particles) {
                if (p.type === 'shockwave') {
                    p.radius = Math.max(1, p.radius + p.speed * dt);
                    p.alpha = Math.max(0, 1 - (p.radius / p.maxRadius));
                    if (p.alpha > 0.01) {
                        allDead = false;
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                        ctx.strokeStyle = `${p.color} ${p.alpha})`;
                        ctx.lineWidth = 14 * p.alpha + 2;
                        ctx.stroke();
                        ctx.restore();
                    }
                    continue;
                }

                p.life -= dt * 1000;
                if (p.life <= 0) continue;
                allDead = false;

                const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.gravity) p.vy += p.gravity * dt;
                if (p.vRot) p.rotation += p.vRot * dt;

                ctx.save();
                try {
                    if (p.type === 'fireball') {
                        const currentRadius = Math.max(1, p.size * (1 + (1 - lifeRatio) * 1.5));
                        if (isFinite(currentRadius) && currentRadius > 0) {
                            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
                            grad.addColorStop(0, `hsla(${p.hue + 25}, 100%, 75%, ${lifeRatio})`);
                            grad.addColorStop(0.4, `hsla(${p.hue}, 100%, 55%, ${lifeRatio * 0.9})`);
                            grad.addColorStop(1, `hsla(0, 100%, 40%, 0)`);
                            ctx.fillStyle = grad;
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else if (p.type === 'milk') {
                        const currentMilkRadius = Math.max(0.5, p.size * lifeRatio);
                        ctx.fillStyle = `rgba(255, 255, 255, ${lifeRatio * 0.95})`;
                        ctx.strokeStyle = `rgba(186, 230, 253, ${lifeRatio * 0.8})`;
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, currentMilkRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    } else if (p.type === 'shrapnel') {
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rotation);
                        ctx.fillStyle = p.color;
                        ctx.strokeStyle = '#090d16';
                        ctx.lineWidth = 2;
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    } else if (p.type === 'film') {
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rotation);
                        ctx.fillStyle = `rgba(2, 132, 199, ${lifeRatio * 0.9})`;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                        ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    }
                } catch (err) {
                    console.warn('Particle render safety guard:', err);
                }
                ctx.restore();
            }

            if (allDead) {
                this.activeExplosions.splice(expIdx, 1);
            }
        }
    }

    drawExplosionDirectionalIndicator(ctx, w, h, now) {
        const targetX = 1200;
        const targetY = 1155;
        const screenX = targetX - this.camera.x;
        const screenY = targetY - this.camera.y;

        const margin = 70;
        const isOffScreen = screenX < margin || screenX > w - margin || screenY < margin || screenY > h - margin;
        if (!isOffScreen) return;

        const centerX = w / 2;
        const centerY = h / 2;
        const angle = Math.atan2(screenY - centerY, screenX - centerX);

        const padding = 65;
        const edgeX = Math.max(padding, Math.min(w - padding, centerX + Math.cos(angle) * (w / 2 - padding)));
        const edgeY = Math.max(padding, Math.min(h - padding, centerY + Math.sin(angle) * (h / 2 - padding)));

        const pulse = (Math.sin(now * 0.012) + 1) * 0.5;
        ctx.save();
        ctx.translate(edgeX, edgeY);

        // Halo
        ctx.fillStyle = `rgba(239, 68, 68, ${0.45 + pulse * 0.45})`;
        ctx.beginPath();
        ctx.arc(0, 0, 36 + pulse * 10, 0, Math.PI * 2);
        ctx.fill();

        // Chip background
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-85, -22, 170, 44, 14);
        ctx.fill();
        ctx.stroke();

        // Text & Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥 ENVASADORA PIL 💥', 0, 0);

        ctx.restore();
    }

    render(state) {
        const { factoryMap, localPlayer, remotePlayers, robotGuide, nearestStation, nearestSignage } = state;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const now = performance.now();

        // Smooth camera tracking local player
        const targetCamX = localPlayer.x - w / 2;
        const targetCamY = localPlayer.y - h / 2;
        this.camera.x += (targetCamX - this.camera.x) * 0.14;
        this.camera.y += (targetCamY - this.camera.y) * 0.14;

        // Camera trauma shake calculation
        let shakeX = 0;
        let shakeY = 0;
        const dt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0.016;
        this.lastTime = now;

        if (this.shakeTimer > 0) {
            const shakeRatio = this.shakeTimer / this.shakeDuration;
            const currentShake = this.shakeIntensity * (shakeRatio * shakeRatio);
            shakeX = (Math.random() - 0.5) * 2 * currentShake;
            shakeY = (Math.random() - 0.5) * 2 * currentShake;
            this.shakeTimer = Math.max(0, this.shakeTimer - dt * 1000);
        }

        // Clear background
        ctx.fillStyle = '#070b12';
        ctx.fillRect(0, 0, w, h);

        // Store currentFactoryMap for visual checks (e.g. easter eggs)
        this.currentFactoryMap = factoryMap;

        ctx.save();
        ctx.translate(-Math.round(this.camera.x + shakeX), -Math.round(this.camera.y + shakeY));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Exterior blueprint grid
        this.drawExteriorGrid(ctx, factoryMap.width, factoryMap.height);

        // 2. Factory Zones & Rich Illustrated Scenery
        for (const zone of factoryMap.zones) {
            this.drawZone(ctx, zone, factoryMap.completedTasks, now);
        }

        // 3. Corridors connecting zones (drawn over zone walls to create open bulkhead doorways)
        this.drawCorridors(ctx, factoryMap.corridors, now);

        // 4. Educational Signage Holograms
        for (const zone of factoryMap.zones) {
            if (zone.signage) {
                const isNear = nearestSignage && nearestSignage.title === zone.signage.title;
                this.drawSignage(ctx, zone.signage, zone.accentColor, isNear, now);
            }
        }

        // 5. Interactive Task Terminals
        for (const station of factoryMap.stations) {
            const isCompleted = factoryMap.completedTasks.has(station.id);
            const isNear = nearestStation && nearestStation.id === station.id;
            const animTimer = factoryMap.taskAnimations.get(station.id) || 0;
            this.drawStation(ctx, station, isCompleted, isNear, animTimer, now);
        }

        // 6. Sort all characters by Y for proper 2.5D depth overlapping
        const allEntities = [
            { type: 'player', data: localPlayer, isLocal: true },
            ...remotePlayers.map(p => ({ type: 'player', data: p, isLocal: false })),
            { type: 'qbot', data: robotGuide }
        ].sort((a, b) => a.data.y - b.data.y);

        for (const ent of allEntities) {
            if (ent.type === 'qbot') {
                this.drawQBot(ctx, ent.data);
            } else {
                this.drawCrewmate(ctx, ent.data, ent.isLocal, now);
            }
        }

        // 6b. Active World-Space Explosions (shockwaves, fireballs, milk splashes, shrapnel)
        this.drawExplosions(ctx, now, dt);

        ctx.restore();

        // Screen-Space Explosive Flash & Hazard Vignette (seen by all players)
        if (this.flashTimer > 0) {
            const ratio = this.flashTimer / this.flashDuration;
            if (ratio > 0.8) {
                const whiteAlpha = ((ratio - 0.8) / 0.2) * 0.95;
                ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
                ctx.fillRect(0, 0, w, h);
            }
            ctx.fillStyle = `rgba(239, 68, 68, ${ratio * 0.42})`;
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = `rgba(239, 68, 68, ${ratio * 0.9})`;
            ctx.lineWidth = 14 * ratio + 4;
            ctx.strokeRect(0, 0, w, h);

            this.flashTimer = Math.max(0, this.flashTimer - dt * 1000);
        }

        // Directional Off-screen indicator if envasadora is broken and off-camera
        if (factoryMap && factoryMap.envasadoraBroken) {
            this.drawExplosionDirectionalIndicator(ctx, w, h, now);
        }

        // 7. Render Minimap
        if (this.minimapCtx) {
            this.renderMinimap(factoryMap, localPlayer, remotePlayers);
        }
    }


    drawExteriorGrid(ctx, worldW, worldH) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.lineWidth = 1;
        const step = 80;
        for (let x = 0; x <= worldW; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, worldH);
            ctx.stroke();
        }
        for (let y = 0; y <= worldH; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(worldW, y);
            ctx.stroke();
        }
    }

    drawCorridors(ctx, corridors, now) {
        const pulse = (Math.sin(now * 0.004) + 1) * 0.5;
        for (const c of corridors) {
            const isHorizontal = c.width <= 120 && c.height <= 165 && c.x !== 340 && c.x !== 1120 && c.x !== 1900;
            const padX = isHorizontal ? 20 : 0;
            const padY = isHorizontal ? 0 : 20;

            // Metallic corridor floor with gradient
            const grad = isHorizontal
                ? ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.height)
                : ctx.createLinearGradient(c.x, c.y, c.x + c.width, c.y);
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(0.5, '#334155');
            grad.addColorStop(1, '#1e293b');
            ctx.fillStyle = grad;
            ctx.fillRect(c.x - padX, c.y - padY, c.width + padX * 2, c.height + padY * 2);

            // Anti-slip metal treads
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
            ctx.lineWidth = 2.5;
            if (isHorizontal) {
                for (let gx = c.x - 8; gx <= c.x + c.width + 8; gx += 18) {
                    ctx.beginPath();
                    ctx.moveTo(gx, c.y + 12);
                    ctx.lineTo(gx, c.y + c.height - 12);
                    ctx.stroke();
                }
            } else {
                for (let gy = c.y - 8; gy <= c.y + c.height + 8; gy += 18) {
                    ctx.beginPath();
                    ctx.moveTo(c.x + 12, gy);
                    ctx.lineTo(c.x + c.width - 12, gy);
                    ctx.stroke();
                }
            }

            // Thick industrial side pipes along corridor walls
            ctx.fillStyle = '#090d16';
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            if (isHorizontal) {
                this.drawPipe(ctx, c.x - padX, c.y - 4, c.width + padX * 2, 10, true);
                this.drawPipe(ctx, c.x - padX, c.y + c.height - 6, c.width + padX * 2, 10, true);
            } else {
                this.drawPipe(ctx, c.x - 4, c.y - padY, 10, c.height + padY * 2, false);
                this.drawPipe(ctx, c.x + c.width - 6, c.y - padY, 10, c.height + padY * 2, false);
            }

            // Glowing chevron arrows painted on corridor floor
            ctx.save();
            ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
            if (!isHorizontal) ctx.rotate(Math.PI / 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + pulse * 0.5})`;
            ctx.lineWidth = 4;
            for (let dir of [-18, 0, 18]) {
                ctx.beginPath();
                ctx.moveTo(dir - 6, -10);
                ctx.lineTo(dir + 6, 0);
                ctx.lineTo(dir - 6, 10);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    drawPipe(ctx, x, y, w, h, horizontal) {
        ctx.save();
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
        ctx.stroke();
        // Pipe joints
        ctx.fillStyle = '#facc15';
        if (horizontal) {
            ctx.fillRect(x + 12, y - 2, 8, h + 4);
            ctx.fillRect(x + w - 20, y - 2, 8, h + 4);
        } else {
            ctx.fillRect(x - 2, y + 12, w + 4, 8);
            ctx.fillRect(x - 2, y + h - 20, w + 4, 8);
        }
        ctx.restore();
    }

    drawZone(ctx, zone, completedTasks, now) {
        // Thick 3D Among-Us style room bulkhead walls
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(zone.x - 16, zone.y - 16, zone.width + 32, zone.height + 32, 18);
        ctx.fill();

        // Outer metallic wall rim
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(zone.x - 10, zone.y - 10, zone.width + 20, zone.height + 20, 14);
        ctx.fill();

        // Floor base fill
        ctx.fillStyle = zone.floorColor;
        ctx.beginPath();
        ctx.roundRect(zone.x, zone.y, zone.width, zone.height, 8);
        ctx.fill();

        // Subtle hexagonal/tile floor pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let gx = zone.x + 60; gx < zone.x + zone.width; gx += 60) {
            ctx.beginPath();
            ctx.moveTo(gx, zone.y);
            ctx.lineTo(gx, zone.y + zone.height);
            ctx.stroke();
        }
        for (let gy = zone.y + 60; gy < zone.y + zone.height; gy += 60) {
            ctx.beginPath();
            ctx.moveTo(zone.x, gy);
            ctx.lineTo(zone.x + zone.width, gy);
            ctx.stroke();
        }

        // Neon zone border
        ctx.strokeStyle = zone.accentColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(zone.x, zone.y, zone.width, zone.height, 8);
        ctx.stroke();

        // Rich Illustrated Zone Scenery
        this.drawDetailedZoneScenery(ctx, zone, completedTasks, now);

        // Illustrated Top Header Banner inside Zone
        ctx.save();
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = zone.accentColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(zone.x + 22, zone.y + 16, zone.width - 44, 56, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 19px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${zone.icon} ${zone.name}`, zone.x + 38, zone.y + 42);

        ctx.fillStyle = zone.accentColor;
        ctx.font = '12.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(zone.subtitle, zone.x + 38, zone.y + 62);
        ctx.restore();
    }

    // =========================================================================
    // DETAILED ILLUSTRATED PROPS FOR ALL 7 PIL ANDINA FACTORY ZONES
    // =========================================================================
    drawDetailedZoneScenery(ctx, zone, completedTasks, now) {
        ctx.save();
        const zx = zone.x;
        const zy = zone.y;

        if (zone.id === 'recepcion') {
            // 1. RECEPCIÓN & BPM: Lockers sanitarios, pediluvio/lavamanos, mostrador de cisternas y camión lechero PIL en pedestal
            this.drawSafetyLockers(ctx, zx + 36, zy + 115);
            this.drawPediluvioAndSanitizer(ctx, zx + 68, zy + 525);
            this.drawReceptionDesk(ctx, zx + 460, zy + 115);
            this.drawPottedPlant(ctx, zx + 430, zy + 140);
            this.drawPottedPlant(ctx, zx + 635, zy + 245);
            this.drawMilkTankerShowroomPod(ctx, zx + 545, zy + 495, now);

        } else if (zone.id === 'baterias') {
            // 2. PASTEURIZACIÓN HTST & HOMOGENEIZADO: Tuberías sanitarias inox, intercambiador de placas 72°C, homogeneizador 180 bar y clarificadora
            const isDone = completedTasks.has('task_battery');
            this.drawSanitaryPipingCircuits(ctx, zx, zy);
            this.drawHtstPlatePasteurizer(ctx, zx + 50, zy + 115, isDone, now);
            this.drawHighPressureHomogenizer(ctx, zx + 460, zy + 120, isDone, now);
            this.drawCentrifugalClarifier(ctx, zx + 470, zy + 425, now);

        } else if (zone.id === 'chasis') {
            // 3. SILOS DE LECHE & SISTEMA CIP: Grandes silos verticales 50.000 L, sistema de limpieza CIP y consola de proceso
            const isDone = completedTasks.has('task_chassis');
            this.drawMilkStorageSilos(ctx, zx + 45, zy + 115, now);
            this.drawCipCleaningSystem(ctx, zx + 50, zy + 335, isDone, now);
            this.drawSanitaryProcessDesk(ctx, zx + 465, zy + 120);

        } else if (zone.id === 'deposito') {
            // 6. MANTENIMIENTO SANITARIO: Estantes de repuestos inox, banco de abrazaderas clamp y montacargas con canastillas PIL
            this.drawSanitarySparesShelves(ctx, zx + 38, zy + 110);
            this.drawSanitaryFittingWorkbench(ctx, zx + 460, zy + 125);
            this.drawElectricForkliftWithCrates(ctx, zx + 555, zy + 455, now);

        } else if (zone.id === 'ensamblaje') {
            // 4. LÍNEA DE ENVASADO BOLSA AZUL PIL: Cinta continua con bolsas azules de leche 946ml, torre aséptica UV y robot encajonador
            this.drawBolsaAzulPackagingLine(ctx, zx + zone.width / 2, zy + 275, zone.width, completedTasks, now);

        } else if (zone.id === 'pruebas') {
            // 5. YOGUR & LABORATORIO DE CALIDAD: Tanques de fermentación de yogur (frutilla/durazno), mesa de microbiología y semáforo SENASAG
            const qaDone = completedTasks.has('task_qa');
            this.drawYogurtFermentationTanks(ctx, zx + 55, zy + 275, qaDone, now);
            this.drawMicrobiologyLabBench(ctx, zx + 465, zy + 115, now);
            this.drawQualityStatusTower(ctx, zx + 555, zy + 335, qaDone);

        } else if (zone.id === 'reuniones') {
            // 7. SALA DE INOCUIDAD HACCP: Tablero de puntos críticos HACCP, mesa ejecutiva con botón de emergencia, y estación de refrigerio
            const meetDone = completedTasks.has('task_meeting');
            this.drawHaccpBoardAndProjector(ctx, zx + 42, zy + 115, meetDone, now);
            this.drawMeetingRoomTable(ctx, zx + zone.width / 2, zy + 350, meetDone, now);
            this.drawCoffeeAndWaterStation(ctx, zx + 490, zy + 120);
            this.drawPottedPlant(ctx, zx + 75, zy + 545);
            this.drawPottedPlant(ctx, zx + 605, zy + 545);
        }

        ctx.restore();
    }

    // --- ZONE 7 HELPERS (SALA DE INOCUIDAD HACCP) ---
    drawMeetingRoomTable(ctx, cx, cy, isDone, now) {
        ctx.save();
        ctx.translate(cx, cy);

        // Luxury Oval Boardroom Carpet underneath
        ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 178, 108, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 8 Executive Swivel Chairs arranged around the oval table
        const chairPositions = [
            { x: -120, y: -62, a: 0.4 },
            { x: 0, y: -84, a: 0 },
            { x: 120, y: -62, a: -0.4 },
            { x: -120, y: 62, a: -0.4 },
            { x: 0, y: 84, a: 0 },
            { x: 120, y: 62, a: 0.4 },
            { x: -158, y: 0, a: 1.57 },
            { x: 158, y: 0, a: -1.57 }
        ];

        for (let ch of chairPositions) {
            ctx.save();
            ctx.translate(ch.x, ch.y);
            ctx.rotate(ch.a);
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Red/rose executive backrest cushion
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.roundRect(-15, -18, 30, 9, 4);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Table drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(6, 8, 138, 68, 0, 0, Math.PI * 2);
        ctx.fill();

        // Large Oval Executive Conference Table (Among Us + Boardroom Hybrid)
        const tableGrad = ctx.createRadialGradient(0, -10, 15, 0, 0, 140);
        tableGrad.addColorStop(0, '#334155');
        tableGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = tableGrad;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 136, 66, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner glowing cyan/rose table inlay ring
        ctx.strokeStyle = isDone ? '#10b981' : '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 114, 48, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Laptops & Quality audit folders on the table
        for (let lx of [-75, 65]) {
            ctx.fillStyle = '#cbd5e1';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(lx - 16, -34, 32, 22, 4);
            ctx.fill();
            ctx.stroke();
            // Laptop screen glow
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(lx - 12, -30, 24, 12);

            // Bottom side quality logbooks
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.roundRect(lx - 14, 14, 26, 20, 3);
            ctx.fill();
            ctx.stroke();
        }

        // Iconic Central Emergency / Briefing Button under Glass Dome (Among Us style!)
        const pulse = (Math.sin(now * 0.006) + 1) * 0.5;
        // Metallic octagon pedestal
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-26, -22, 52, 44, 10);
        ctx.fill();
        ctx.stroke();

        // Yellow/Black hazard stripes around button base
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-20, -16, 40, 32);

        // Glowing Red Briefing Button in center
        ctx.fillStyle = isDone ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 13 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Specular glass dome highlight over button
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-4, -5, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawHaccpBoardAndProjector(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Digital HACCP Quality Control Board
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 195, 130, 12);
        ctx.fill();
        ctx.stroke();

        // 3 HACCP Points
        const pccs = [
            { code: 'PCC-1', title: '72°C / 15s', status: 'PASTEURIZADO', col: '#10b981' },
            { code: 'PCC-2', title: '0.0 Fe/Al', status: 'DETECCIÓN METAL', col: '#38bdf8' },
            { code: 'PCC-3', title: 'HERMÉTICO', status: 'BOLSA AZUL OK', col: '#facc15' }
        ];

        pccs.forEach((p, idx) => {
            const py = 28 + idx * 32;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(8, py, 179, 26, 5);
            ctx.fill();

            ctx.fillStyle = p.col;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${p.code}: ${p.status}`, 16, py + 16);

            ctx.textAlign = 'right';
            ctx.fillText(p.title, 180, py + 16);
        });

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SISTEMA INOCUIDAD HACCP PIL', 97, 18);

        ctx.restore();
    }

    drawCoffeeAndWaterStation(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Breakroom Countertop
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 145, 115, 12);
        ctx.fill();
        ctx.stroke();

        // Dispensador de Leche Fría y Café
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.roundRect(14, 14, 52, 56, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(28, 28, 4, 0, Math.PI * 2);
        ctx.fill();

        // Vasos de leche PIL
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(32, 88, 9, 0, Math.PI * 2);
        ctx.arc(56, 88, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Water Dispenser with Blue Jug on Right Side
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(84, 42, 46, 56, 8);
        ctx.fill();
        ctx.stroke();
        // Translucent Blue Jug
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(107, 32, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REFRIGERIO LÁCTEO', 72, 108);

        ctx.restore();
    }

    // --- ZONE 1 HELPERS (RECEPCIÓN Y BPM) ---
    drawSafetyLockers(ctx, x, y) {
        // 4 Lockers with white lab coats & hairnets
        for (let i = 0; i < 4; i++) {
            const ly = y + i * 78;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.roundRect(x + 6, ly + 6, 70, 68, 8);
            ctx.fill();

            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x, ly, 70, 68, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(x + 6, ly + 6, 58, 56, 5);
            ctx.fill();

            // Louvers
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            for (let v = 0; v < 3; v++) {
                ctx.beginPath();
                ctx.moveTo(x + 14, ly + 14 + v * 5);
                ctx.lineTo(x + 42, ly + 14 + v * 5);
                ctx.stroke();
            }

            // Chrome handle
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.roundRect(x + 52, ly + 26, 6, 16, 2);
            ctx.fill();

            // Illustrated BPM icons
            this.drawMiniBpmIllustration(ctx, x + 28, ly + 44, i);
        }
    }

    drawMiniBpmIllustration(ctx, cx, cy, index) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;

        if (index === 0) {
            // White hairnet (Cofia)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(0, 0, 11, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-12, 0, 24, 3);
        } else if (index === 1) {
            // Sanitary Face Mask (Barbijo)
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.roundRect(-9, -6, 18, 12, 3);
            ctx.fill();
            ctx.stroke();
        } else if (index === 2) {
            // White Lab Coat (Mandil blanco)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-9, -9);
            ctx.lineTo(9, -9);
            ctx.lineTo(7, 9);
            ctx.lineTo(-7, 9);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // White Rubber Boots (Botas de goma)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-6, -9);
            ctx.lineTo(2, -9);
            ctx.lineTo(2, 2);
            ctx.lineTo(9, 4);
            ctx.lineTo(9, 9);
            ctx.lineTo(-6, 9);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-6, 7, 15, 2);
        }
        ctx.restore();
    }

    drawPediluvioAndSanitizer(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);

        // Blue sanitized foot-bath mat (Pediluvio)
        ctx.fillStyle = '#0369a1';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-30, -30, 60, 60, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(-24, -24, 48, 48, 6);
        ctx.fill();

        // Footprint outline in mat
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.ellipse(-8, 0, 6, 12, -0.1, 0, Math.PI * 2);
        ctx.ellipse(8, 0, 6, 12, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PEDILUVIO', 0, 22);

        ctx.restore();
    }

    drawPottedPlant(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(3, 4, 20, 0, Math.PI * 2);
        ctx.fill();
        // Pot
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0c4a6e';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        // Leaves
        const angles = [0, 1.05, 2.1, 3.14, 4.2, 5.25];
        for (let a of angles) {
            ctx.save();
            ctx.rotate(a);
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = '#064e3b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(11, 0, 11, 5.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    drawReceptionDesk(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Two swivel chairs behind desk
        for (let cx of [55, 130]) {
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, 22, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#0369a1';
            ctx.beginPath();
            ctx.roundRect(cx - 14, 2, 28, 10, 5);
            ctx.fill();
            ctx.stroke();
        }

        // Curved counter
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(6, 36, 185, 78, 28);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 30, 185, 78, 28);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(6, 36, 173, 66, 22);
        ctx.stroke();

        // Monitors
        for (let mx of [32, 108]) {
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(mx + 6, 48, 34, 12, 3);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(mx, 66, 48, 18, 4);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(mx + 5, 71, 24, 3);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(mx + 5, 77, 34, 3);
        }

        ctx.restore();
    }

    drawMilkTankerShowroomPod(ctx, cx, cy, now) {
        ctx.save();
        ctx.translate(cx, cy);

        // Circular illuminated showroom stage
        const grad = ctx.createRadialGradient(0, 0, 15, 0, 0, 95);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.9)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 92, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 88, 0, Math.PI * 2);
        ctx.stroke();

        // Bolivian tricolor ribbon
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 0, 78, 0.3, 2.84);
        ctx.stroke();
        ctx.strokeStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 73, 0.3, 2.84);
        ctx.stroke();
        ctx.strokeStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(0, 0, 68, 0.3, 2.84);
        ctx.stroke();

        // Rotating Display Miniature of PIL Milk Tanker Truck!
        ctx.save();
        ctx.rotate(Math.sin(now * 0.0012) * 0.25 - 0.2);
        this.drawMilkTankerTruckIllustration(ctx, 0, -10, 0.72);
        ctx.restore();

        // Plaque
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-76, 42, 152, 34, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CISTERNA PIL ANDINA', 0, 56);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9.5px sans-serif';
        ctx.fillText('Recepción de Leche Fresca', 0, 69);

        ctx.restore();
    }

    /**
     * Draws an illustrated top-down / 2.5D PIL Milk Tanker Truck with stainless steel tank
     */
    drawMilkTankerTruckIllustration(ctx, x, y, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(-86, -42, 184, 84, 20);
        ctx.fill();

        // 6 Rubber Heavy-Duty Wheels
        ctx.fillStyle = '#090d16';
        for (let [wx, wy] of [[-68, -44], [-24, -44], [52, -44], [-68, 34], [-24, 34], [52, 34]]) {
            ctx.beginPath();
            ctx.roundRect(wx, wy, 24, 10, 4);
            ctx.fill();
        }

        // Heavy Truck Chassis Frame
        ctx.fillStyle = '#334155';
        ctx.fillRect(-78, -34, 168, 68);

        // 1. Polished Stainless Steel Tanker (Rear/Center)
        const tankGrad = ctx.createLinearGradient(-75, -34, -75, 34);
        tankGrad.addColorStop(0, '#94a3b8');
        tankGrad.addColorStop(0.3, '#f8fafc');
        tankGrad.addColorStop(0.6, '#cbd5e1');
        tankGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = tankGrad;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-76, -32, 106, 64, 18);
        ctx.fill();
        ctx.stroke();

        // Specular chrome reflection along tank top
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(-68, -26, 92, 8);

        // Tank top inspection hatches
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        for (let hx of [-52, -18]) {
            ctx.beginPath();
            ctx.arc(hx, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Bold "PIL ANDINA" lettering on tanker
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PIL', -36, -5);
        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.fillText('ANDINA', -36, 12);

        // 2. White & Blue Truck Cabin (Front)
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(32, -32, 54, 64, 12);
        ctx.fill();
        ctx.stroke();

        // Blue aerodynamic cabin roof trim
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(40, -32, 38, 10);
        ctx.fillRect(40, 22, 38, 10);

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, -22, 28, 44, 6);
        ctx.fill();
        ctx.stroke();

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(84, -20, 5, 0, Math.PI * 2);
        ctx.arc(84, 20, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // --- ZONE 2 HELPERS (PASTEURIZACIÓN HTST & HOMOGENEIZADO) ---
    drawSanitaryPipingCircuits(ctx, zx, zy) {
        ctx.save();
        ctx.lineCap = 'round';

        const drawPipe = (pts, color, label) => {
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 11;
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
            ctx.stroke();

            // Stainless steel core with colored stripe
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 7;
            ctx.stroke();

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
        };

        // Cold milk line (Blue, 4°C)
        drawPipe([[zx + 150, zy + 250], [zx + 150, zy + 310], [zx + 465, zy + 310]], '#0284c7');
        // Hot pasteurized return line (Red, 72°C)
        drawPipe([[zx + 180, zy + 250], [zx + 180, zy + 285], [zx + 465, zy + 285]], '#ef4444');
        ctx.restore();
    }

    drawHtstPlatePasteurizer(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(6, 6, 215, 145, 14);
        ctx.fill();

        // Main stainless steel frame
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 215, 145, 14);
        ctx.fill();
        ctx.stroke();

        // Header
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PASTEURIZADOR DE PLACAS HTST', 107, 22);

        // Pack of thermal stainless steel plates (alternating blue cold & red hot channels)
        const plateStartX = 24;
        const plateY = 36;
        for (let p = 0; p < 14; p++) {
            const px = plateStartX + p * 8.5;
            ctx.fillStyle = p % 2 === 0 ? '#0284c7' : '#ef4444';
            ctx.fillRect(px, plateY, 6, 62);
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(px, plateY, 6, 62);
        }

        // Heavy tie-rods compressing plates
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(18, plateY + 8, 130, 4);
        ctx.fillRect(18, plateY + 50, 130, 4);

        // Digital Temperature Display Console
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = isDone ? '#10b981' : '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(154, 34, 52, 66, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDone ? '#10b981' : '#facc15';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('72.0°C', 180, 56);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px sans-serif';
        ctx.fillText('15 SEG', 180, 72);
        ctx.fillStyle = isDone ? '#10b981' : '#38bdf8';
        ctx.fillText('HTST OK', 180, 88);

        // Dual glycerin pressure gauges on bottom
        for (let d = 0; d < 3; d++) {
            const dx = 40 + d * 48;
            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.arc(dx, 120, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Needle
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(dx, 120);
            ctx.lineTo(dx + Math.cos(d + now * 0.003) * 8, 120 + Math.sin(d + now * 0.003) * 8);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawHighPressureHomogenizer(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Heavy Stainless Steel Homogenizer Machine Housing (180 Bar)
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(8, 8, 185, 265, 16);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 185, 265, 16);
        ctx.fill();
        ctx.stroke();

        // Header label
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HOMOGENEIZADOR (180 BAR)', 92, 24);

        // 3 Stainless Steel Piston Chambers
        for (let p = 0; p < 3; p++) {
            const px = 34 + p * 44;
            const py = 54;
            const pistonMotion = Math.sin(now * 0.01 + p * 2.1) * 8;

            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(px, py, 30, 72, 6);
            ctx.fill();
            ctx.stroke();

            // Polished moving chrome piston
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(px + 6, py + 18 + pistonMotion, 18, 38);
        }

        // Heavy Stainless Steel Manifold Block
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(22, 138, 142, 42, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BLOQUE DE MICRONIZACIÓN', 93, 163);

        // Large Glycerin Pressure Gauge
        const gx = 93;
        const gy = 216;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gx, gy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Needle pointing to 180 BAR
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 16, gy - 16);
        ctx.stroke();

        ctx.fillStyle = '#090d16';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('180 BAR', gx, gy + 14);

        ctx.restore();
    }

    drawCentrifugalClarifier(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Machine Base
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 170, 135, 16);
        ctx.fill();
        ctx.stroke();

        // Conical spinning bowl of clarifier
        const cx = 85;
        const cy = 60;
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 38, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Animated rotating blades inside
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(now * 0.015);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;
        for (let b = 0; b < 6; b++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(28, 0);
            ctx.stroke();
        }
        ctx.restore();

        // Label
        ctx.fillStyle = '#bae6fd';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLARIFICADORA CENTRÍFUGA', 85, 115);

        ctx.restore();
    }

    // --- ZONE 3 HELPERS (SILOS DE LECHE & SISTEMA CIP) ---
    drawMilkStorageSilos(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Two massive vertical stainless steel milk storage silos (50.000 L each)
        for (let s = 0; s < 2; s++) {
            const sx = s * 95;

            // Silo shadow
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.roundRect(sx + 6, 6, 82, 195, 16);
            ctx.fill();

            // Cylindrical silo body with stainless steel gradient
            const grad = ctx.createLinearGradient(sx, 0, sx + 82, 0);
            grad.addColorStop(0, '#64748b');
            grad.addColorStop(0.35, '#f8fafc');
            grad.addColorStop(0.7, '#cbd5e1');
            grad.addColorStop(1, '#475569');
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.roundRect(sx, 0, 82, 195, 16);
            ctx.fill();
            ctx.stroke();

            // Top agitator motor & catwalk railing
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sx + 24, -14, 34, 16, 4);
            ctx.fill();
            ctx.stroke();

            // Slow rotating agitator motor shaft indicator
            const agitator = (Math.sin(now * 0.004 + s) + 1) * 0.5;
            ctx.fillStyle = '#facc15';
            ctx.fillRect(sx + 36, -10, 10, 4);

            // Vertical sight-glass showing creamy milk level!
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sx + 10, 32, 14, 130, 4);
            ctx.fill();
            ctx.stroke();

            // White milk fluid in sight-glass
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(sx + 12, 54 + agitator * 3, 10, 106 - agitator * 3);

            // PIL Logo on Silo
            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 15px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PIL', sx + 50, 72);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 8.5px sans-serif';
            ctx.fillText(`SILO #${s + 1}`, sx + 50, 94);
            ctx.fillText('50.000 L', sx + 50, 108);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 8px sans-serif';
            ctx.fillText('4.0°C OK', sx + 50, 124);
        }

        ctx.restore();
    }

    drawCipCleaningSystem(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // CIP Station Housing with warning border
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = isDone ? '#10b981' : '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 205, 235, 16);
        ctx.fill();
        ctx.stroke();

        // 3 CIP Chemical Solution Tanks
        const tanks = [
            { name: 'AGUA', col: '#38bdf8' },
            { name: 'SODA', col: '#f59e0b' },
            { name: 'ÁCIDO', col: '#ef4444' }
        ];

        tanks.forEach((t, i) => {
            const tx = 18 + i * 58;
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(tx, 34, 52, 92, 10);
            ctx.fill();
            ctx.stroke();

            // Liquid sight window
            ctx.fillStyle = t.col;
            ctx.fillRect(tx + 8, 55, 36, 62);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(t.name, tx + 26, 48);
        });

        // Recirculation Pump at bottom
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(32, 142, 140, 52, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDone ? '#10b981' : '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isDone ? 'SISTEMA CIP: LAVADO COMPLETO ✅' : 'BOMBA SANITARIA CIP (RECIRCULACIÓN)', 102, 218);

        ctx.restore();
    }

    drawSanitaryProcessDesk(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Process Desk
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 175, 130, 10);
        ctx.fill();
        ctx.stroke();

        // SCADA Screen with Plant Flow Diagram
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(14, 14, 147, 102, 4);
        ctx.fill();
        ctx.stroke();

        // SCADA Diagram Sketch
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 65);
        ctx.lineTo(65, 65);
        ctx.lineTo(65, 45);
        ctx.lineTo(110, 45);
        ctx.lineTo(110, 85);
        ctx.lineTo(145, 85);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(65, 45, 5, 0, Math.PI * 2);
        ctx.arc(110, 85, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DIAGRAMA DE FLUJO SCADA PIL', 88, 30);

        ctx.restore();
    }

    // --- ZONE 6 HELPERS (MANTENIMIENTO Y REPUESTOS SANITARIOS) ---
    drawSanitarySparesShelves(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        for (let s = 0; s < 3; s++) {
            const sy = s * 155;
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(0, sy, 180, 132, 10);
            ctx.fill();
            ctx.stroke();

            // Blue rack beams
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(6, sy + 28, 168, 6);
            ctx.fillRect(6, sy + 120, 168, 6);

            if (s === 0) {
                // Shelf 1: Stainless Steel Sanitary Lobe Pumps & Impellers
                for (let mx of [52, 128]) {
                    const my = sy + 75;
                    ctx.fillStyle = '#94a3b8';
                    ctx.strokeStyle = '#090d16';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(mx, my, 24, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#0284c7';
                    ctx.beginPath();
                    ctx.arc(mx, my, 10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#e0e7ff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('BOMBAS SANITARIAS INOX', 90, sy + 20);

            } else if (s === 1) {
                // Shelf 2: Tri-Clover Clamps & Butterfly Valves
                for (let cx of [26, 98]) {
                    const cy = sy + 46;
                    ctx.fillStyle = '#64748b';
                    ctx.strokeStyle = '#090d16';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.roundRect(cx, cy, 56, 58, 8);
                    ctx.fill();
                    ctx.stroke();
                    // Blue sanitary silicone gasket
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(cx + 28, cy + 29, 16, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.fillStyle = '#e0e7ff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('JUNTAS Y CLAMPS TRI-CLOVER', 90, sy + 20);

            } else {
                // Shelf 3: Clean Yellow & Blue PIL Distribution Crates
                for (let cx of [28, 102]) {
                    const cy = sy + 50;
                    ctx.fillStyle = cx === 28 ? '#eab308' : '#0284c7';
                    ctx.strokeStyle = '#090d16';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.roundRect(cx, cy, 50, 48, 6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('PIL', cx + 25, cy + 28);
                }
                ctx.fillStyle = '#e0e7ff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('CANASTILLAS DE REPARTO', 90, sy + 20);
            }
        }

        ctx.restore();
    }

    drawSanitaryFittingWorkbench(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 110, 12);
        ctx.fill();
        ctx.stroke();

        // Tool box
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(16, 18, 64, 38, 6);
        ctx.fill();
        ctx.stroke();

        // Torque wrench
        ctx.save();
        ctx.translate(115, 42);
        ctx.rotate(-0.4);
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-22, -4, 44, 8, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Digital sanitary pressure calibrator
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.roundRect(105, 62, 34, 38, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(111, 68, 22, 12);

        ctx.restore();
    }

    drawElectricForkliftWithCrates(ctx, cx, cy, now) {
        ctx.save();
        ctx.translate(cx, cy);

        // Parking bay
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.roundRect(-72, -105, 144, 205, 12);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wooden Pallet with Stacks of Yellow & Blue PIL Milk Crates
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-42, -92, 84, 52, 4);
        ctx.fill();
        ctx.stroke();

        // Crates on pallet
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-38, -88, 36, 44);
        ctx.strokeRect(-38, -88, 36, 44);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(2, -88, 36, 44);
        ctx.strokeRect(2, -88, 36, 44);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PIL', -20, -65);
        ctx.fillText('PIL', 20, -65);

        // Forks
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-28, -88, 12, 65, 3);
        ctx.roundRect(16, -88, 12, 65, 3);
        ctx.fill();
        ctx.stroke();

        // Wheels
        ctx.fillStyle = '#090d16';
        for (let [wx, wy] of [[-42, -12], [30, -12], [-42, 42], [30, 42]]) {
            ctx.beginPath();
            ctx.roundRect(wx, wy, 12, 26, 4);
            ctx.fill();
        }

        // Forklift Body (PIL Blue & Yellow)
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-34, -24, 68, 96, 22);
        ctx.fill();
        ctx.stroke();

        // Rear Counterweight
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.roundRect(-30, 48, 60, 20, 10);
        ctx.fill();
        ctx.stroke();

        // Driver seat
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-22, -8, 44, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-15, 12, 30, 22, 6);
        ctx.fill();

        // Steering wheel
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -2, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // --- ZONE 4 HELPERS (ENVASADO DE LECHE PIL EN BOLSA AZUL 946 ML) ---
    drawBolsaAzulPackagingLine(ctx, cx, cy, zoneWidth, completedTasks, now) {
        ctx.save();
        const isBroken = this.currentFactoryMap && this.currentFactoryMap.envasadoraBroken;

        // If broken: Massive Scorched Blast Crater, Radial Cracks, and Spilled Milk Lake!
        if (isBroken) {
            // 1. Massive Scorched Black Blast Crater
            const craterGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 260);
            craterGrad.addColorStop(0, '#020202');
            craterGrad.addColorStop(0.35, '#170e0e');
            craterGrad.addColorStop(0.7, '#2b1414');
            craterGrad.addColorStop(1, 'rgba(43, 20, 20, 0)');
            ctx.fillStyle = craterGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 270, 160, 0, 0, Math.PI * 2);
            ctx.fill();

            // Radial blast fracture cracks
            ctx.strokeStyle = '#050202';
            ctx.lineWidth = 3.5;
            for (let a = 0; a < 8; a++) {
                const crackAng = a * (Math.PI / 4) + 0.2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const midX = cx + Math.cos(crackAng) * 90 + (a % 2 === 0 ? 15 : -15);
                const midY = cy + Math.sin(crackAng) * 60 + (a % 2 === 0 ? -12 : 12);
                const endX = cx + Math.cos(crackAng) * 210;
                const endY = cy + Math.sin(crackAng) * 120;
                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // 2. Giant White Milk Lake Spill
            ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
            ctx.beginPath();
            ctx.ellipse(cx - 50, cy + 65, 170, 52, -0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + 95, cy - 30, 130, 44, 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx - 150, cy - 25, 110, 36, -0.18, 0, Math.PI * 2);
            ctx.fill();

            // Frothy milk bubbles
            ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
            for (let b = 0; b < 12; b++) {
                const bx = cx - 120 + ((b * 37) % 240);
                const by = cy + 30 + ((b * 23) % 45);
                ctx.beginPath();
                ctx.arc(bx, by, 4 + (b % 4) * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Flashing red zone alarm strobe
            if (Math.sin(now * 0.015) > 0) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.26)';
                ctx.fillRect(cx - zoneWidth / 2 + 15, cy - 190, zoneWidth - 30, 380);
            }
        }

        // Industrial Conveyor Track
        ctx.fillStyle = isBroken ? '#1e1b1b' : '#111827';
        ctx.strokeStyle = isBroken ? '#ef4444' : '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - zoneWidth / 2 + 45, cy - 86, zoneWidth - 90, 172, 16);
        ctx.fill();
        ctx.stroke();

        // Rollers (stopped if broken)
        for (let rx = cx - zoneWidth / 2 + 68; rx < cx + zoneWidth / 2 - 68; rx += 32) {
            ctx.fillStyle = isBroken ? '#331e1e' : '#1e293b';
            ctx.fillRect(rx - 5, cy - 80, 10, 160);
        }

        // Sachets / Pouches on belt
        if (!isBroken) {
            const beltOffset = (now * 0.08) % 64;
            for (let bx = cx - zoneWidth / 2 + 75 + beltOffset; bx < cx + zoneWidth / 2 - 80; bx += 64) {
                this.drawSingleBolsaAzul(ctx, bx, cy - 42);
                this.drawSingleBolsaAzul(ctx, bx - 32, cy + 32);
            }
        } else {
            // Stopped, jammed sachets
            for (let bx = cx - zoneWidth / 2 + 80; bx < cx - 130; bx += 68) {
                this.drawSingleBolsaAzul(ctx, bx, cy - 40);
            }
            // Tangled, crumpled leaking sachets near the jammed tower
            ctx.save();
            ctx.translate(cx - 48, cy + 18);
            ctx.rotate(0.35);
            this.drawSingleBolsaAzul(ctx, 0, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(cx + 36, cy - 22);
            ctx.rotate(-0.4);
            this.drawSingleBolsaAzul(ctx, 0, 0);
            ctx.restore();
        }

        // Central Vertical Form-Fill-Seal Packaging Tower (Envasadora Aséptica)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(cx - 105, cy - 82, 210, 164, 18);
        ctx.fill();

        const towerGrad = ctx.createLinearGradient(cx - 100, 0, cx + 100, 0);
        if (isBroken) {
            towerGrad.addColorStop(0, '#451a1a');
            towerGrad.addColorStop(0.3, '#7f1d1d');
            towerGrad.addColorStop(0.7, '#450a0a');
            towerGrad.addColorStop(1, '#180808');
        } else {
            towerGrad.addColorStop(0, '#334155');
            towerGrad.addColorStop(0.3, '#f8fafc');
            towerGrad.addColorStop(0.7, '#cbd5e1');
            towerGrad.addColorStop(1, '#1e293b');
        }
        ctx.fillStyle = towerGrad;
        ctx.strokeStyle = isBroken ? '#ef4444' : '#0284c7';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(cx - 100, cy - 78, 200, 156, 16);
        ctx.fill();
        ctx.stroke();

        // Roll of Film on top (torn/snapped if broken)
        ctx.fillStyle = isBroken ? '#991b1b' : '#0284c7';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 46, 42, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // UV Window (flickering red error if broken)
        if (isBroken) {
            ctx.fillStyle = (Math.sin(now * 0.02) > 0) ? '#ef4444' : '#450a0a';
            ctx.fillRect(cx - 65, cy - 18, 130, 26);
        } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(cx - 65, cy - 18, 130, 26);
            ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
            ctx.fillRect(cx - 65, cy - 18, 130, 26);
        }

        // Sealing Jaws
        const jawClamp = isBroken ? 0 : Math.abs(Math.sin(now * 0.006)) * 4;
        ctx.fillStyle = isBroken ? '#ef4444' : '#facc15';
        ctx.fillRect(cx - 40, cy + 18 - jawClamp, 80, 8);
        ctx.fillRect(cx - 40, cy + 32 + jawClamp, 80, 8);

        // Tower label & status
        if (isBroken) {
            ctx.fillStyle = '#ef4444';
            ctx.font = '900 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 ¡ENVASADORA DESTRUIDA! 💥', cx, cy - 60);
            ctx.fillStyle = '#fca5a5';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('ATASCO CRÍTICO [B] - EXPLOSIÓN TOTAL', cx, cy + 64);

            // Dancing flames on wreckage
            for (let f = 0; f < 8; f++) {
                const flameAge = now * 0.01 + f * 1.3;
                const fx = cx - 70 + f * 20;
                const fy = cy - 20 + Math.sin(f * 2.1) * 16;
                const flameH = 22 + Math.sin(flameAge) * 14;

                const fGrad = ctx.createLinearGradient(fx, fy, fx, fy - flameH);
                fGrad.addColorStop(0, '#facc15');
                fGrad.addColorStop(0.45, '#f97316');
                fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = fGrad;
                ctx.beginPath();
                ctx.moveTo(fx - 8, fy);
                ctx.quadraticCurveTo(fx + (Math.sin(flameAge * 1.5) * 6), fy - flameH * 0.6, fx, fy - flameH);
                ctx.quadraticCurveTo(fx + 8, fy - flameH * 0.6, fx + 8, fy);
                ctx.closePath();
                ctx.fill();
            }

            // Billowing thick dark smoke clouds
            for (let i = 0; i < 8; i++) {
                const smokeAge = (now * 0.0024 + i * 0.65) % 2.5;
                const sy = cy - 75 - smokeAge * 58;
                const sx = cx + Math.sin(now * 0.005 + i * 1.7) * 40 + (i % 2 === 0 ? -22 : 22);
                const sRadius = 16 + smokeAge * 20;
                ctx.fillStyle = `rgba(24, 24, 32, ${Math.max(0, 0.85 - smokeAge * 0.32)})`;
                ctx.beginPath();
                ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Electrical sparks
            for (let s = 0; s < 7; s++) {
                const spPhase = (now * 0.024 + s * 1.3) % 2;
                if (spPhase < 0.8) {
                    ctx.strokeStyle = (s % 2 === 0) ? '#fef08a' : '#38bdf8';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    const spX = cx + Math.cos(s * 2.4) * 44;
                    const spY = cy - 10 + Math.sin(s * 1.8) * 32;
                    ctx.moveTo(spX, spY);
                    ctx.lineTo(spX + (Math.random() - 0.5) * 30, spY + (Math.random() - 0.5) * 30);
                    ctx.stroke();
                }
            }

            // Blown-off access panel on floor
            ctx.save();
            ctx.translate(cx + 85, cy + 38);
            ctx.rotate(0.45);
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.fillRect(-20, -14, 40, 28);
            ctx.strokeRect(-20, -14, 40, 28);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ PELIGRO', 0, 4);
            ctx.restore();

            // Flashing Red Emergency Beacon on top
            ctx.fillStyle = (Math.sin(now * 0.022) > 0) ? '#ef4444' : '#7f1d1d';
            ctx.beginPath();
            ctx.arc(cx, cy - 92, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fee2e2';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ENVASADORA ASÉPTICA PIL', cx, cy - 56);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('BOLSA AZUL 946 ml', cx, cy + 62);
        }

        // Articulated robotic picker packing sachets into crates (frozen if broken)
        const swing = isBroken ? 0.4 : Math.sin(now * 0.004) * 0.3;
        for (let dir of [-1, 1]) {
            ctx.save();
            ctx.translate(cx + dir * 165, cy);
            ctx.fillStyle = isBroken ? '#475569' : '#0284c7';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.rotate(dir * swing);
            ctx.fillStyle = isBroken ? '#94a3b8' : '#facc15';
            ctx.fillRect(dir > 0 ? -48 : 0, -7, 48, 14);
            ctx.strokeRect(dir > 0 ? -48 : 0, -7, 48, 14);
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Draws an authentic PIL Leche Pasteurizada en Bolsa Azul (946 ml) sachet pouch
     */
    drawSingleBolsaAzul(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Pillow pouch shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(-16, -22, 32, 44, 8);
        ctx.fill();

        // Blue Pillow Sachet Body
        const pouchGrad = ctx.createLinearGradient(-15, -20, 15, 20);
        pouchGrad.addColorStop(0, '#0284c7');
        pouchGrad.addColorStop(0.5, '#38bdf8');
        pouchGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = pouchGrad;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-15, -20, 30, 40, 8);
        ctx.fill();
        ctx.stroke();

        // White sealed seams on top and bottom
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-12, -19, 24, 3);
        ctx.fillRect(-12, 16, 24, 3);

        // White PIL logo and milk droplet
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PIL', 0, -4);
        ctx.font = 'bold 6.5px sans-serif';
        ctx.fillText('LECHE', 0, 5);
        ctx.fillText('946ml', 0, 13);

        ctx.restore();
    }

    // --- ZONE 5 HELPERS (YOGUR & LABORATORIO DE CALIDAD) ---
    drawYogurtFermentationTanks(ctx, x, y, qaDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Fermentation Bay Housing
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = qaDone ? '#10b981' : '#34d399';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 215, 255, 16);
        ctx.fill();
        ctx.stroke();

        // Two Jacketed Yogurt Fermentation Tanks (Frutilla & Durazno)
        const yogurts = [
            { flavor: 'YOGUR FRUTILLA', col: '#ec4899', fruit: '🍓', iconCol: '#be185d' },
            { flavor: 'YOGUR DURAZNO', col: '#f97316', fruit: '🍑', iconCol: '#c2410c' }
        ];

        yogurts.forEach((ygt, idx) => {
            const ty = 34 + idx * 105;

            // Tank Body (Stainless Steel with color accent)
            const grad = ctx.createLinearGradient(20, ty, 195, ty);
            grad.addColorStop(0, '#64748b');
            grad.addColorStop(0.35, '#f8fafc');
            grad.addColorStop(0.7, '#cbd5e1');
            grad.addColorStop(1, '#475569');
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(20, ty, 175, 92, 14);
            ctx.fill();
            ctx.stroke();

            // Fruit window showing yogurt level
            ctx.fillStyle = ygt.col;
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(32, ty + 18, 48, 56, 8);
            ctx.fill();
            ctx.stroke();

            // Fruit emoji icon
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ygt.fruit, 56, ty + 54);

            // Digital pH and Temp readouts
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(92, ty + 20, 92, 52);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(ygt.flavor, 98, ty + 36);

            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('pH 4.5', 98, ty + 52);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '9px monospace';
            ctx.fillText('T: 42°C FERM', 98, ty + 66);
        });

        ctx.fillStyle = qaDone ? '#10b981' : '#facc15';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(qaDone ? 'FERMENTACIÓN PROBIÓTICA OK ✅' : 'TANQUES DE YOGUR CON CULTIVOS VIVOS', 107, 246);

        ctx.restore();
    }

    drawMicrobiologyLabBench(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Sterile White Microbiology Lab Bench
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 175, 170, 16);
        ctx.fill();
        ctx.stroke();

        // Bench surface
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(12, 14, 151, 142, 10);
        ctx.fill();

        // Binocular Microscope
        const mx = 50;
        const my = 85;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(mx - 16, my - 34, 32, 68, 6);
        ctx.fill();

        // Eyepieces
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(mx - 8, my - 38, 5, 0, Math.PI * 2);
        ctx.arc(mx + 8, my - 38, 5, 0, Math.PI * 2);
        ctx.fill();

        // Rack of Test Tubes with Dairy Samples
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(94, 60, 65, 42);
        const tubeColors = ['#0284c7', '#ec4899', '#ffffff', '#10b981'];
        for (let t = 0; t < 4; t++) {
            ctx.fillStyle = tubeColors[t];
            ctx.fillRect(98 + t * 15, 68, 10, 30);
            ctx.strokeRect(98 + t * 15, 68, 10, 30);
        }

        // Petri Dish with Lactobacillus colonies
        ctx.fillStyle = '#bae6fd';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(126, 128, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        for (let c = 0; c < 5; c++) {
            ctx.beginPath();
            ctx.arc(120 + c * 3, 124 + (c % 2) * 6, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LABORATORIO MICROBIOLÓGICO', 87, 30);

        ctx.restore();
    }

    drawQualityStatusTower(ctx, cx, cy, qaDone) {
        ctx.save();
        ctx.translate(cx, cy);

        // Base Plate
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-34, -18, 68, 156, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-24, -10, 48, 140, 14);
        ctx.fill();

        const lights = [
            { y: 18, on: !qaDone, onCol: '#ef4444', offCol: '#450a0a', label: 'CUAR' },
            { y: 60, on: true, onCol: '#facc15', offCol: '#422006', label: 'TEST' },
            { y: 102, on: qaDone, onCol: '#10b981', offCol: '#064e3b', label: 'APROB' }
        ];

        for (let l of lights) {
            if (l.on) {
                const glow = ctx.createRadialGradient(0, l.y, 4, 0, l.y, 26);
                glow.addColorStop(0, l.onCol);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, l.y, 26, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = l.on ? l.onCol : l.offCol;
            ctx.beginPath();
            ctx.arc(0, l.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, l.y, 15, Math.PI, 0);
            ctx.stroke();
        }

        ctx.restore();
    }

    // =========================================================================
    // HOLOGRAPHIC SIGNAGE & INTERACTIVE WORKSTATIONS
    // =========================================================================
    drawSignage(ctx, signage, accentColor, isNear, now) {
        const { x, y, title } = signage;
        const floatY = Math.sin(now * 0.004) * 3;
        ctx.save();
        ctx.translate(x, y);

        // Metallic Floor Projector Base
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 24, 38, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing Hologram Emitter Core
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.ellipse(0, 22, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hologram Light Cone
        const coneGrad = ctx.createLinearGradient(0, 22, 0, -25);
        coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(-18, 22);
        ctx.lineTo(-70, -20 + floatY);
        ctx.lineTo(70, -20 + floatY);
        ctx.lineTo(18, 22);
        ctx.closePath();
        ctx.fill();

        // Floating Curved Hologram Screen
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = isNear ? '#facc15' : accentColor;
        ctx.lineWidth = isNear ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.roundRect(-74, -28 + floatY, 148, 44, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📘 INFO PIL ANDINA', 0, -10 + floatY);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px sans-serif';
        ctx.fillText(title.substring(0, 20), 0, 6 + floatY);

        if (isNear) {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('🔍 [E] o CLIC PARA LEER', 0, -36 + floatY);
        }
        ctx.restore();
    }

    drawStation(ctx, station, isCompleted, isNear, animTimer, now) {
        const { x, y, icon, shortName } = station;
        const pulse = Math.sin(now * 0.006) * 5;

        ctx.save();
        ctx.translate(x, y);

        const isBroken = (station.id === 'task_assembly' && this.currentFactoryMap && this.currentFactoryMap.envasadoraBroken);

        // Outer glowing interactive floor pad
        ctx.beginPath();
        ctx.arc(0, 0, 46 + (isNear ? 6 : 0) + (isCompleted ? 0 : pulse * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = isBroken
            ? 'rgba(239, 68, 68, 0.35)'
            : (isCompleted
                ? 'rgba(16, 185, 129, 0.25)'
                : (isNear ? 'rgba(250, 204, 21, 0.35)' : 'rgba(56, 189, 248, 0.18)'));
        ctx.fill();

        ctx.lineWidth = isNear ? 4 : 2.5;
        ctx.strokeStyle = isBroken ? '#ef4444' : (isCompleted ? '#10b981' : (isNear ? '#facc15' : '#38bdf8'));
        ctx.stroke();

        // Illustrated Octagonal Computer Kiosk / Workstation Base
        ctx.fillStyle = isBroken ? '#291414' : '#1e293b';
        ctx.strokeStyle = isBroken ? '#ef4444' : '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-28, -26, 56, 52, 14);
        ctx.fill();
        ctx.stroke();

        // Angled glowing terminal screen inside kiosk
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = isBroken ? '#ef4444' : (isCompleted ? '#10b981' : '#38bdf8');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-20, -18, 40, 28, 7);
        ctx.fill();
        ctx.stroke();

        // Keyboard / Control buttons on lower bevel
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-10, 17, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.arc(0, 17, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.arc(10, 17, 3, 0, Math.PI * 2);
        ctx.fill();

        // Icon on screen
        ctx.font = '21px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isBroken ? '💥' : (isCompleted ? '✅' : icon), 0, -3);

        // Rounded Station Pill Label
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = isBroken ? '#ef4444' : (isCompleted ? '#10b981' : '#475569');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-86, 32, 172, 24, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isBroken ? '#f87171' : (isCompleted ? '#6ee7b7' : '#ffffff');
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(isBroken ? '⚠️ INUTILIZABLE' : shortName, 0, 48);

        // Interaction Prompt when nearby
        if (isNear) {
            ctx.fillStyle = isBroken ? '#f87171' : '#facc15';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(isBroken
                ? '⚠️ ¡MÁQUINA INUTILIZABLE! (Atasco [B])'
                : (isCompleted ? '¡Misión Completada! [E] Repetir' : '⚡ Presiona [E] o Haz Clic'), 0, -52);
        }

        // Celebratory expanding ring when recently completed
        if (animTimer > 0) {
            const prog = 1 - (animTimer / 4.0);
            ctx.beginPath();
            ctx.arc(0, 0, 30 + prog * 110, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(16, 185, 129, ${1 - prog})`;
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        ctx.restore();
    }

    // =========================================================================
    // CHARACTERS (AMONG US CREWMATES & Q-BOT)
    // =========================================================================
    getAvatarImage(dataUrl) {
        if (!dataUrl) return null;
        if (this.avatarCache.has(dataUrl)) {
            return this.avatarCache.get(dataUrl);
        }
        const img = new Image();
        img.src = dataUrl;
        this.avatarCache.set(dataUrl, img);
        return img;
    }

    drawCrewmate(ctx, player, isLocal, now) {
        const colors = window.QuantumGame.FactoryAssets.PLAYER_COLORS;
        const palette = colors.find(c => c.id === player.colorId) || colors[0];

        const x = player.x;
        const y = player.y;
        const facing = player.facing || 1;
        const bob = player.isMoving ? Math.abs(Math.sin(now * 0.015)) * 6 : 0;
        const legSwing = player.isMoving ? Math.sin(now * 0.02) * 9 : 0;
        const charScale = 1.45; // Larger character so the face photo is clearly visible

        ctx.save();
        ctx.translate(x, y);

        // Drop shadow on floor
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 32, 29, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Local player highlight ring
        if (isLocal) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(0, 32, 35, 14, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.save();
        ctx.scale(facing * charScale, charScale);
        ctx.translate(0, -bob);

        // Oxygen / Battery Backpack (Among Us signature)
        ctx.fillStyle = palette.shadow;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-25, -16, 12, 28, 5);
        ctx.fill();
        ctx.stroke();

        // Legs
        ctx.fillStyle = palette.shadow;
        ctx.beginPath();
        ctx.roundRect(-13 + legSwing * 0.5, 10, 11, 13, 4);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(2 - legSwing * 0.5, 10, 11, 13, 4);
        ctx.fill();
        ctx.stroke();

        // Main Capsule Body
        ctx.fillStyle = palette.body;
        ctx.beginPath();
        ctx.roundRect(-18, -28, 36, 42, 16);
        ctx.fill();
        ctx.stroke();

        // Lower body shading
        ctx.fillStyle = palette.shadow;
        ctx.beginPath();
        ctx.roundRect(-15, 3, 30, 11, 5);
        ctx.fill();

        // Large Crewmate Helmet Visor OR Custom Player Face Photo!
        const avatarImg = player.avatar ? this.getAvatarImage(player.avatar) : null;
        if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
            const vx = -10;
            const vy = -25;
            const vw = 31;
            const vh = 28;

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(vx, vy, vw, vh, 11);
            ctx.clip();

            // Draw face photo inside helmet window
            ctx.drawImage(avatarImg, vx, vy, vw, vh);

            // Subtle glass helmet reflection on top corner
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.beginPath();
            ctx.ellipse(vx + vw - 7, vy + 5, 6, 2.8, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Helmet visor frame border
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.roundRect(vx, vy, vw, vh, 11);
            ctx.stroke();
        } else {
            // Classic Crewmate Glass Visor
            ctx.fillStyle = palette.visor;
            ctx.beginPath();
            ctx.roundRect(-2, -20, 23, 16, 7);
            ctx.fill();
            ctx.stroke();

            // Visor glossy reflection
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(12, -15, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // PIL Dairy Sanitary Cap / Hairnet (Cofia blanca con borde azul PIL)
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(-1, -28, 15, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Blue PIL sanitary headband
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(-18, -29, 36, 4.5, 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Name Tag above character
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        const nameW = ctx.measureText(player.name).width + 18;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-nameW / 2, -76, nameW, 22, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isLocal ? '#38bdf8' : '#ffffff';
        ctx.fillText(player.name, 0, -60);

        // Floating Emote / Signal Bubble
        if (player.emote) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -104, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.font = '22px sans-serif';
            ctx.fillText(player.emote, 0, -96);
        }

        ctx.restore();
    }

    drawQBot(ctx, qbot) {
        ctx.save();
        ctx.translate(qbot.x, qbot.y + qbot.hoverOffset);

        // Hover thruster glow
        ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antenna
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, -28);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0, Math.PI * 2);
        ctx.fill();

        // Spherical Robot Head/Body
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-16, -18, 32, 28, 10);
        ctx.fill();
        ctx.stroke();

        // Digital Face Screen
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-12, -13, 24, 16, 5);
        ctx.fill();

        // Glowing Cyan Eyes
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🤖 PIL-BOT', 0, -37);

        ctx.restore();
    }

    renderMinimap(factoryMap, localPlayer, remotePlayers) {
        const mCtx = this.minimapCtx;
        const mw = this.minimapCanvas.width;
        const mh = this.minimapCanvas.height;
        const scaleX = mw / factoryMap.width;
        const scaleY = mh / factoryMap.height;

        mCtx.clearRect(0, 0, mw, mh);
        mCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        mCtx.fillRect(0, 0, mw, mh);

        // Zones
        for (const z of factoryMap.zones) {
            mCtx.fillStyle = z.floorColor;
            mCtx.fillRect(z.x * scaleX, z.y * scaleY, z.width * scaleX, z.height * scaleY);
            mCtx.strokeStyle = z.accentColor;
            mCtx.lineWidth = 1.5;
            mCtx.strokeRect(z.x * scaleX, z.y * scaleY, z.width * scaleX, z.height * scaleY);
        }

        // Corridors
        mCtx.fillStyle = '#475569';
        for (const c of factoryMap.corridors) {
            mCtx.fillRect(c.x * scaleX, c.y * scaleY, c.width * scaleX, c.height * scaleY);
        }

        // Stations
        for (const s of factoryMap.stations) {
            const done = factoryMap.completedTasks.has(s.id);
            mCtx.fillStyle = done ? '#10b981' : '#facc15';
            mCtx.beginPath();
            mCtx.arc(s.x * scaleX, s.y * scaleY, 4, 0, Math.PI * 2);
            mCtx.fill();
        }

        // Remote players
        for (const p of remotePlayers) {
            mCtx.fillStyle = '#a855f7';
            mCtx.beginPath();
            mCtx.arc(p.x * scaleX, p.y * scaleY, 3.5, 0, Math.PI * 2);
            mCtx.fill();
        }

        // Local player
        mCtx.fillStyle = '#38bdf8';
        mCtx.beginPath();
        mCtx.arc(localPlayer.x * scaleX, localPlayer.y * scaleY, 5, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.strokeStyle = '#ffffff';
        mCtx.lineWidth = 1.5;
        mCtx.stroke();

        // Flashing disaster explosion marker on minimap
        if (factoryMap.envasadoraBroken) {
            const expMx = 1200 * scaleX;
            const expMy = 1155 * scaleY;
            const mPulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;
            mCtx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
            mCtx.lineWidth = 2.5;
            mCtx.beginPath();
            mCtx.arc(expMx, expMy, 6 + mPulse * 12, 0, Math.PI * 2);
            mCtx.stroke();

            mCtx.fillStyle = '#ef4444';
            mCtx.beginPath();
            mCtx.arc(expMx, expMy, 5, 0, Math.PI * 2);
            mCtx.fill();

            mCtx.font = 'bold 11px sans-serif';
            mCtx.textAlign = 'center';
            mCtx.textBaseline = 'middle';
            mCtx.fillText('💥', expMx, expMy - 9);
        }
    }
}

window.QuantumGame.Renderer = Renderer;
