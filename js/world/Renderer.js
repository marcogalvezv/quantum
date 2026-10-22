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

        // Clear background
        ctx.fillStyle = '#070b12';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
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

        ctx.restore();

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
    // DETAILED ILLUSTRATED PROPS FOR ALL 6 FACTORY ZONES
    // =========================================================================
    drawDetailedZoneScenery(ctx, zone, completedTasks, now) {
        ctx.save();
        const zx = zone.x;
        const zy = zone.y;

        if (zone.id === 'recepcion') {
            // 1. RECEPCIÓN: Lockers 3D, Planta Decorativa, Mostrador Curvo con Sillas y Showroom Quantum E2
            this.drawSafetyLockers(ctx, zx + 36, zy + 115);
            this.drawFireExtinguisherStand(ctx, zx + 68, zy + 525);
            this.drawReceptionDesk(ctx, zx + 460, zy + 115);
            this.drawPottedPlant(ctx, zx + 430, zy + 140);
            this.drawPottedPlant(ctx, zx + 635, zy + 245);
            this.drawShowroomPod(ctx, zx + 545, zy + 495, now);

        } else if (zone.id === 'baterias') {
            // 2. BATERÍAS: Cables Naranjas con Conectores, Consola BMS con Ventiladores y Celdas Cilíndricas 3D
            const isDone = completedTasks.has('task_battery');
            this.drawHighVoltageCables(ctx, zx, zy);
            this.drawBmsConsole(ctx, zx + 50, zy + 115, isDone, now);
            this.drawCylindricalBatteryRack(ctx, zx + 460, zy + 120, isDone, now);
            this.drawThermalChamber(ctx, zx + 470, zy + 425, now);

        } else if (zone.id === 'chasis') {
            // 3. CHASIS: Cortadora Láser con Chispas, Brazo Robótico Articulado Soldando Chasis Real y Mesa de Planos
            const isDone = completedTasks.has('task_chassis');
            this.drawLaserCutterMachine(ctx, zx + 45, zy + 115, now);
            this.drawChasisWeldingJig(ctx, zx + 50, zy + 315, isDone, now);
            this.drawBlueprintTable(ctx, zx + 465, zy + 120);

        } else if (zone.id === 'deposito') {
            // 6. DEPÓSITO Y LOGÍSTICA: Pallets de Madera con Motores/Neumáticos, Banco de Herramientas y Montacargas
            this.drawLogisticsShelves(ctx, zx + 38, zy + 110);
            this.drawToolWorkbench(ctx, zx + 460, zy + 125);
            this.drawDetailedForklift(ctx, zx + 555, zy + 455, now);

        } else if (zone.id === 'ensamblaje') {
            // 4. ENSAMBLAJE FINAL: Cinta Transportadora, Brazos Robóticos con Pinzas y Auto Quantum E4 Detallado
            this.drawAssemblyLineAndCar(ctx, zx + zone.width / 2, zy + 275, zone.width, completedTasks, now);

        } else if (zone.id === 'pruebas') {
            // 5. PRUEBAS DE CALIDAD: Dinamómetro con Ventilador de Túnel de Viento, Arco de Lluvia IP65 y Semáforo
            const qaDone = completedTasks.has('task_qa');
            this.drawDynamometerBay(ctx, zx + 55, zy + 275, qaDone, now);
            this.drawRainTestArch(ctx, zx + 465, zy + 115, now);
            this.drawTrafficLightTower(ctx, zx + 555, zy + 335, qaDone);

        } else if (zone.id === 'reuniones') {
            // 7. SALA DE REUNIONES Y ESTRATEGIA: Mesa Ovalada con Botón de Reunión, Pizarra Kanban, Proyector y Estación de Café
            const meetDone = completedTasks.has('task_meeting');
            this.drawKanbanAndProjector(ctx, zx + 42, zy + 115, meetDone, now);
            this.drawMeetingRoomTable(ctx, zx + zone.width / 2, zy + 350, meetDone, now);
            this.drawCoffeeAndWaterStation(ctx, zx + 490, zy + 120);
            this.drawPottedPlant(ctx, zx + 75, zy + 545);
            this.drawPottedPlant(ctx, zx + 605, zy + 545);
        }

        ctx.restore();
    }

    // --- ZONE 7 HELPERS (SALA DE REUNIONES) ---
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
            ctx.fillStyle = '#e11d48';
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

        // Laptops & Blueprint folders on the table
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

            // Bottom side notebooks
            ctx.fillStyle = '#fef08a';
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

    drawKanbanAndProjector(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Agile Kanban Board with Sticky Notes (Top Left of Meeting Room)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 195, 130, 12);
        ctx.fill();
        ctx.stroke();

        // 3 Kanban Columns (TO-DO, DOING, DONE)
        const cols = [
            { title: 'PENDIENTE', x: 10, color: '#f43f5e' },
            { title: 'EN CURSO', x: 70, color: '#facc15' },
            { title: 'LISTO ✅', x: 130, color: '#10b981' }
        ];

        cols.forEach((col, cIdx) => {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(col.x, 28, 54, 90, 6);
            ctx.fill();

            ctx.fillStyle = col.color;
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(col.title, col.x + 27, 40);

            // Colorful Post-it sticky notes
            const postItColors = ['#fef08a', '#bae6fd', '#fbcfe8', '#bbf7d0'];
            for (let n = 0; n < 2; n++) {
                ctx.fillStyle = postItColors[(cIdx + n) % postItColors.length];
                ctx.strokeStyle = '#090d16';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(col.x + 8, 48 + n * 32, 38, 24, 3);
                ctx.fill();
                ctx.stroke();
            }
        });

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TABLERO KANBAN SCRUM', 97, 18);

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

        // Espresso Coffee Machine
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.roundRect(14, 14, 52, 56, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(28, 28, 4, 0, Math.PI * 2);
        ctx.fill();
        // Coffee pot & mugs
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
        // Translucent Blue Water Jug on top
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(107, 32, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESTACIÓN DE CAFÉ', 72, 108);

        ctx.restore();
    }

    // --- ZONE 1 HELPERS (RECEPCIÓN) ---
    drawSafetyLockers(ctx, x, y) {
        // 3D Locker Cabinet bank
        for (let i = 0; i < 4; i++) {
            const ly = y + i * 78;
            // Drop shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.roundRect(x + 6, ly + 6, 70, 68, 8);
            ctx.fill();

            // Locker body
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x, ly, 70, 68, 8);
            ctx.fill();
            ctx.stroke();

            // Inner door bevel
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(x + 6, ly + 6, 58, 56, 5);
            ctx.fill();

            // Louver vents
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

            // Illustrated EPP item badge on door
            this.drawMiniEppIllustration(ctx, x + 28, ly + 44, i);
        }
    }

    drawMiniEppIllustration(ctx, cx, cy, index) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        if (index === 0) {
            // Hard Hat illustration
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(0, 2, 11, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
            ctx.fillRect(-13, 1, 26, 4);
            ctx.strokeRect(-13, 1, 26, 4);
        } else if (index === 1) {
            // Dielectric Glove illustration
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.roundRect(-8, -8, 16, 16, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fb923c';
            ctx.beginPath();
            ctx.arc(-4, -9, 3, 0, Math.PI * 2);
            ctx.arc(1, -10, 3, 0, Math.PI * 2);
            ctx.arc(6, -8, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (index === 2) {
            // Safety Boot illustration
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.moveTo(-8, -10);
            ctx.lineTo(2, -10);
            ctx.lineTo(2, 0);
            ctx.lineTo(11, 2);
            ctx.lineTo(11, 8);
            ctx.lineTo(-8, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Yellow dielectric sole
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-8, 6, 19, 3);
        } else {
            // Safety Goggles illustration
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.roundRect(-12, -5, 11, 9, 3);
            ctx.roundRect(1, -5, 11, 9, 3);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    drawFireExtinguisherStand(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Red safety mat with white diagonal stripes
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-28, -28, 56, 56, 10);
        ctx.fill();
        ctx.stroke();

        // Extinguisher cylinder
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-10, -14, 20, 32, 8);
        ctx.fill();
        ctx.stroke();

        // White CO2 label
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-7, -2, 14, 10);
        ctx.fillStyle = '#090d16';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CO2', 0, 6);

        // Valve, pressure gauge & horn hose
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-4, -20, 8, 6);
        ctx.beginPath();
        ctx.moveTo(4, -18);
        ctx.quadraticCurveTo(16, -12, 14, 6);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }

    drawPottedPlant(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(3, 4, 20, 0, Math.PI * 2);
        ctx.fill();
        // Terracotta pot
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        // Lush tropical leaves radiating out
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

        // Two ergonomic swivel chairs behind desk
        for (let cx of [55, 130]) {
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, 22, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Backrest
            ctx.fillStyle = '#0369a1';
            ctx.beginPath();
            ctx.roundRect(cx - 14, 2, 28, 10, 5);
            ctx.fill();
            ctx.stroke();
        }

        // Curved L-shaped / kidney reception counter with wooden/cyan trim
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

        // Glowing cyan front counter lip
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(6, 36, 173, 66, 22);
        ctx.stroke();

        // Dual curved widescreen monitors with keyboards & coffee mug
        for (let mx of [32, 108]) {
            // Keyboard
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(mx + 6, 48, 34, 12, 3);
            ctx.fill();
            // Monitor screen
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(mx, 66, 48, 18, 4);
            ctx.fill();
            ctx.stroke();
            // Screen glow
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(mx + 5, 71, 24, 3);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(mx + 5, 77, 34, 3);
        }

        // Coffee mug on desk
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(92, 56, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(92, 56, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawShowroomPod(ctx, cx, cy, now) {
        ctx.save();
        ctx.translate(cx, cy);

        // Circular Illuminated Showroom Stage
        const grad = ctx.createRadialGradient(0, 0, 15, 0, 0, 95);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.9)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 92, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 88, 0, Math.PI * 2);
        ctx.stroke();

        // Bolivian tricolor curved ribbon at bottom of pedestal
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

        // Rotating Display Miniature of Quantum E2 Electric Car!
        ctx.save();
        ctx.rotate(Math.sin(now * 0.0012) * 0.25 - 0.2);
        this.drawCompleteCarIllustration(ctx, 0, -10, 0.68, '#00e5ff', true);
        ctx.restore();

        // Showroom plaque
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-72, 42, 144, 34, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QUANTUM E2 PIONERO', 0, 57);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px sans-serif';
        ctx.fillText('100% Eléctrico • Bolivia', 0, 70);

        ctx.restore();
    }

    // --- ZONE 2 HELPERS (BATERÍAS) ---
    drawHighVoltageCables(ctx, zx, zy) {
        ctx.save();
        ctx.lineCap = 'round';
        // Thick black outer conduit shadow + bright orange EV cable
        const drawCable = (pts, color) => {
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 11;
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
            ctx.stroke();

            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.stroke();
        };

        drawCable([[zx + 150, zy + 250], [zx + 150, zy + 310], [zx + 465, zy + 310]], '#f97316');
        drawCable([[zx + 180, zy + 250], [zx + 180, zy + 285], [zx + 465, zy + 285]], '#0284c7');
        ctx.restore();
    }

    drawBmsConsole(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(6, 6, 200, 145, 14);
        ctx.fill();

        // Main metal cabinet
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 200, 145, 14);
        ctx.fill();
        ctx.stroke();

        // Dual Rotating Cooling Fans on right side of console
        for (let fy of [42, 98]) {
            const fx = 162;
            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.arc(fx, fy, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.save();
            ctx.translate(fx, fy);
            ctx.rotate(now * 0.008);
            ctx.fillStyle = '#64748b';
            for (let b = 0; b < 4; b++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.ellipse(10, 0, 9, 4, 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            // Fan grill ring
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(fx, fy, 22, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Curved Glass Oscilloscope Screen
        ctx.fillStyle = '#04101e';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(14, 16, 118, 82, 10);
        ctx.fill();
        ctx.stroke();

        // Oscilloscope Grid
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(14, 57);
        ctx.lineTo(132, 57);
        ctx.moveTo(73, 16);
        ctx.lineTo(73, 98);
        ctx.stroke();

        // Live animated waveform
        ctx.strokeStyle = isDone ? '#10b981' : '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let sx = 0; sx <= 104; sx += 4) {
            const sy = 57 + Math.sin((sx * 0.09) + (now * 0.009)) * 20;
            if (sx === 0) ctx.moveTo(20 + sx, sy);
            else ctx.lineTo(20 + sx, sy);
        }
        ctx.stroke();

        // Analog rotary dials & status LEDs at bottom
        for (let d = 0; d < 3; d++) {
            const dx = 30 + d * 32;
            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.arc(dx, 120, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Pointer line
            ctx.strokeStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(dx, 120);
            ctx.lineTo(dx + Math.cos(d + now * 0.002) * 8, 120 + Math.sin(d + now * 0.002) * 8);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawCylindricalBatteryRack(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Cabinet housing with 3D shadow
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
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CELDAS CILÍNDRICAS LiFePO4', 92, 24);

        // Draw 3 rows x 4 columns of realistic 3D cylindrical lithium cells connected with copper busbars!
        for (let r = 0; r < 3; r++) {
            const cy = 58 + r * 72;

            // Copper busbar linking the row of cells
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(32, cy - 16);
            ctx.lineTo(152, cy - 16);
            ctx.stroke();

            for (let c = 0; c < 4; c++) {
                const cx = 32 + c * 40;
                const active = isDone || ((Math.floor(now / 350) + r + c) % 3 !== 0);
                const cellColor = isDone ? '#10b981' : (active ? '#06b6d4' : '#0369a1');

                // Cylinder body
                ctx.fillStyle = cellColor;
                ctx.strokeStyle = '#090d16';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.roundRect(cx - 14, cy - 14, 28, 42, 6);
                ctx.fill();
                ctx.stroke();

                // Specular highlight stripe on cylinder
                ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.fillRect(cx - 8, cy - 8, 5, 30);

                // Top elliptical cap
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.ellipse(cx, cy - 14, 13, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Positive brass terminal button
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(cx, cy - 15, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawThermalChamber(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Circular High-Voltage Warning Pad with Hazard Symbol
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 170, 135, 16);
        ctx.fill();
        ctx.stroke();

        // Illustrated Yellow Warning Triangle
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(85, 18);
        ctx.lineTo(122, 78);
        ctx.lineTo(48, 78);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lightning bolt inside triangle
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.moveTo(88, 34);
        ctx.lineTo(75, 55);
        ctx.lineTo(86, 55);
        ctx.lineTo(80, 72);
        ctx.lineTo(96, 50);
        ctx.lineTo(85, 50);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BANCO ALTA TENSIÓN', 85, 102);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('60V - 72V DC • Guantes Clase 0', 85, 118);

        ctx.restore();
    }

    // --- ZONE 3 HELPERS (CHASIS Y ESTRUCTURA) ---
    drawLaserCutterMachine(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Machine bed with slats
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 205, 135, 12);
        ctx.fill();
        ctx.stroke();

        // Cutting grate slats
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
        for (let sx = 18; sx < 190; sx += 14) {
            ctx.beginPath();
            ctx.moveTo(sx, 28);
            ctx.lineTo(sx, 118);
            ctx.stroke();
        }

        // Steel sheet being cut
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(28, 38, 148, 68, 4);
        ctx.fill();
        ctx.stroke();

        // Moving CNC Gantry Bridge
        const gantryX = 40 + ((Math.sin(now * 0.0025) + 1) * 0.5) * 120;
        const laserY = 50 + ((Math.cos(now * 0.005) + 1) * 0.5) * 44;

        // Gantry bar
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.fillRect(gantryX - 8, 20, 16, 104);
        ctx.strokeRect(gantryX - 8, 20, 16, 104);

        // Laser head nozzle
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(gantryX, laserY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing laser beam spark
        const grad = ctx.createRadialGradient(gantryX, laserY, 2, gantryX, laserY, 22);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#ef4444');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(gantryX, laserY, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CORTE LÁSER CNC', 102, 16);

        ctx.restore();
    }

    drawChasisWeldingJig(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Octagonal Industrial Welding Platform
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 215, 255, 16);
        ctx.fill();
        ctx.stroke();

        // Draw an authentic Top-Down Tubular Car Chassis Silhouette (not a rectangle!)
        ctx.save();
        ctx.translate(115, 118);
        const frameColor = isDone ? '#10b981' : '#38bdf8';

        // 4 Suspension Coil Springs & Wheel Hubs
        for (let [wx, wy] of [[-48, -56], [48, -56], [-48, 56], [48, 56]]) {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wx * 0.6, wy);
            ctx.lineTo(wx, wy);
            ctx.stroke();
            ctx.fillStyle = '#475569';
            ctx.fillRect(wx - 6, wy - 12, 12, 24);
        }

        // Curved Tubular Spaceframe Silhouette
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 9;
        this.traceChassisPath(ctx);
        ctx.stroke();

        ctx.strokeStyle = frameColor;
        ctx.lineWidth = 5;
        this.traceChassisPath(ctx);
        ctx.stroke();
        ctx.restore();

        // Articulated Multi-Joint Robotic Welding Arm (KUKA style)
        ctx.save();
        ctx.translate(42, 205);
        // Turret Base
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Joint 1 & Lower Arm
        const angle1 = -0.6 + Math.sin(now * 0.004) * 0.35;
        ctx.rotate(angle1);
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.roundRect(-8, -65, 16, 65, 6);
        ctx.fill();
        ctx.stroke();

        // Elbow Joint & Forearm
        ctx.translate(0, -60);
        const angle2 = 0.9 + Math.cos(now * 0.005) * 0.3;
        ctx.rotate(angle2);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-6, -52, 12, 52, 5);
        ctx.fill();
        ctx.stroke();

        // Welding Torch Tip & Animated Flying Sparks!
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -56, 6, 0, Math.PI * 2);
        ctx.fill();

        if (Math.sin(now * 0.04) > -0.2) {
            for (let sp = 0; sp < 5; sp++) {
                const sa = (now * 0.02 + sp * 1.2);
                const sr = ((now * 0.08 + sp * 7) % 24);
                ctx.strokeStyle = sp % 2 === 0 ? '#fef08a' : '#f97316';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, -56);
                ctx.lineTo(Math.cos(sa) * sr, -56 + Math.sin(sa) * sr);
                ctx.stroke();
            }
        }
        ctx.restore();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SOLDADURA ROBÓTICA MIG', 107, 238);

        ctx.restore();
    }

    traceChassisPath(ctx) {
        ctx.beginPath();
        // Tapered front nose bumper
        ctx.moveTo(-26, -82);
        ctx.lineTo(26, -82);
        ctx.lineTo(42, -50);
        // Side rails
        ctx.lineTo(42, 55);
        // Rear motor cradle
        ctx.lineTo(30, 80);
        ctx.lineTo(-30, 80);
        ctx.lineTo(-42, 55);
        ctx.lineTo(-42, -50);
        ctx.closePath();
        // Internal cross-members & battery cradle
        ctx.moveTo(-40, -25);
        ctx.lineTo(40, -25);
        ctx.moveTo(-40, 25);
        ctx.lineTo(40, 25);
        ctx.moveTo(-25, -25);
        ctx.lineTo(25, 25);
        ctx.moveTo(25, -25);
        ctx.lineTo(-25, 25);
    }

    drawBlueprintTable(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Drafting table
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 175, 130, 10);
        ctx.fill();
        ctx.stroke();

        // Unrolled Blue Engineering Blueprint sheet
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(14, 14, 147, 102, 4);
        ctx.fill();
        ctx.stroke();

        // Blueprint side-view sketch of Quantum E4
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(42, 82);
        ctx.lineTo(48, 46);
        ctx.quadraticCurveTo(85, 34, 118, 48);
        ctx.lineTo(132, 66);
        ctx.lineTo(134, 82);
        ctx.closePath();
        ctx.stroke();
        // Blueprint wheels
        ctx.beginPath();
        ctx.arc(60, 82, 11, 0, Math.PI * 2);
        ctx.arc(116, 82, 11, 0, Math.PI * 2);
        ctx.stroke();

        // Yellow triangle ruler on table
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(22, 92);
        ctx.lineTo(48, 92);
        ctx.lineTo(22, 66);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // --- ZONE 6 HELPERS (DEPÓSITO Y LOGÍSTICA) ---
    drawLogisticsShelves(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        for (let s = 0; s < 3; s++) {
            const sy = s * 155;
            // Wooden slatted pallet & rack frame
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(0, sy, 180, 132, 10);
            ctx.fill();
            ctx.stroke();

            // Orange rack beams
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(6, sy + 28, 168, 6);
            ctx.fillRect(6, sy + 120, 168, 6);

            if (s === 0) {
                // Shelf 1: Illustrated Brushless Electric Motors with Copper Coils & Gears
                for (let mx of [52, 128]) {
                    const my = sy + 75;
                    ctx.fillStyle = '#475569';
                    ctx.strokeStyle = '#090d16';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(mx, my, 24, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    // Copper winding ring
                    ctx.strokeStyle = '#d97706';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.arc(mx, my, 13, 0, Math.PI * 2);
                    ctx.stroke();
                    // Center rotor shaft
                    ctx.fillStyle = '#e2e8f0';
                    ctx.beginPath();
                    ctx.arc(mx, my, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#e9d5ff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MOTORES BRUSHLESS 4kW', 90, sy + 20);

            } else if (s === 1) {
                // Shelf 2: Sinusoidal Controllers with Heatsink Fins & Connectors
                for (let cx of [26, 98]) {
                    const cy = sy + 46;
                    ctx.fillStyle = '#0284c7';
                    ctx.strokeStyle = '#090d16';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.roundRect(cx, cy, 56, 58, 8);
                    ctx.fill();
                    ctx.stroke();
                    // Aluminum heatsink fins
                    ctx.strokeStyle = '#bae6fd';
                    ctx.lineWidth = 2;
                    for (let f = 0; f < 4; f++) {
                        ctx.beginPath();
                        ctx.moveTo(cx + 10, cy + 14 + f * 10);
                        ctx.lineTo(cx + 46, cy + 14 + f * 10);
                        ctx.stroke();
                    }
                }
                ctx.fillStyle = '#e9d5ff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('INVERSORES Y CAN-BUS', 90, sy + 20);

            } else {
                // Shelf 3: Rubber Tires with Alloy Rims & Coil Springs
                for (let tx of [52, 128]) {
                    const ty = sy + 75;
                    // Tire tread
                    ctx.fillStyle = '#18181b';
                    ctx.strokeStyle = '#090d16';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 25, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    // Alloy rim & spokes
                    ctx.fillStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#090d16';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#e9d5ff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('NEUMÁTICOS Y RINES R13', 90, sy + 20);
            }
        }

        ctx.restore();
    }

    drawToolWorkbench(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Workbench surface
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 110, 12);
        ctx.fill();
        ctx.stroke();

        // Red Mechanic's Toolbox
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(16, 18, 64, 38, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(36, 14, 24, 6);

        // Illustrated Wrench on table
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
        ctx.beginPath();
        ctx.arc(-24, 0, 9, 0.6, Math.PI * 2 - 0.6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Yellow Digital Multimeter with test leads
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.roundRect(105, 62, 34, 38, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(111, 68, 22, 12);

        ctx.restore();
    }

    drawDetailedForklift(ctx, cx, cy, now) {
        ctx.save();
        ctx.translate(cx, cy);

        // Painted safety parking bay
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.roundRect(-72, -105, 144, 205, 12);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wooden Slatted Pallet carried on front forks
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-42, -92, 84, 52, 4);
        ctx.fill();
        ctx.stroke();
        // Pallet wooden slats
        ctx.strokeStyle = '#78350f';
        for (let py = -82; py <= -48; py += 11) {
            ctx.beginPath();
            ctx.moveTo(-40, py);
            ctx.lineTo(40, py);
            ctx.stroke();
        }

        // Steel Forks sliding under pallet
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-28, -88, 12, 65, 3);
        ctx.roundRect(16, -88, 12, 65, 3);
        ctx.fill();
        ctx.stroke();

        // 4 Thick Rubber Wheels protruding from chassis
        ctx.fillStyle = '#090d16';
        for (let [wx, wy] of [[-42, -12], [30, -12], [-42, 42], [30, 42]]) {
            ctx.beginPath();
            ctx.roundRect(wx, wy, 12, 26, 4);
            ctx.fill();
        }

        // Curved Yellow & Black Counterbalance Forklift Body
        ctx.fillStyle = '#eab308';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-34, -24, 68, 96, 22);
        ctx.fill();
        ctx.stroke();

        // Rear heavy cast-iron counterweight
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-30, 48, 60, 20, 10);
        ctx.fill();
        ctx.stroke();

        // Driver Compartment: Contoured Seat & Steering Wheel
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-22, -8, 44, 48, 8);
        ctx.fill();
        // Driver seat cushion
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-15, 12, 30, 22, 6);
        ctx.fill();
        // Steering wheel circle
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -2, 9, 0, Math.PI * 2);
        ctx.stroke();

        // Overhead Guard Pillars & Flashing Amber Beacon
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.strokeRect(-24, -12, 48, 52);

        const beaconGlow = (Math.sin(now * 0.01) + 1) * 0.5;
        ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + beaconGlow * 0.6})`;
        ctx.beginPath();
        ctx.arc(18, 34, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // --- ZONE 4 HELPERS (ENSAMBLAJE FINAL & VEHÍCULO QUANTUM E4) ---
    drawAssemblyLineAndCar(ctx, cx, cy, zoneWidth, completedTasks, now) {
        ctx.save();
        const numDone = completedTasks.size;

        // Industrial Conveyor Track with Metallic Rollers
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - zoneWidth / 2 + 45, cy - 86, zoneWidth - 90, 172, 16);
        ctx.fill();
        ctx.stroke();

        for (let rx = cx - zoneWidth / 2 + 68; rx < cx + zoneWidth / 2 - 68; rx += 32) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(rx - 5, cy - 80, 10, 160);
        }

        // Hydraulic 4-Post Car Lift Platform
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(cx - 132, cy - 78, 264, 156, 18);
        ctx.fill();
        ctx.stroke();

        // 4 Yellow Hydraulic Corner Posts
        for (let [px, py] of [[-124, -70], [108, -70], [-124, 54], [108, 54]]) {
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(cx + px, cy + py, 16, 16, 4);
            ctx.fill();
            ctx.stroke();
        }

        // Two Articulated Assembly Robots with Dual Grippers flanking the Lift
        const swing = Math.sin(now * 0.003) * 0.28;
        for (let dir of [-1, 1]) {
            ctx.save();
            ctx.translate(cx + dir * 185, cy);
            // Robot pedestal
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.rotate(dir * swing);
            const armX = dir > 0 ? -52 : 0;
            ctx.fillStyle = '#fb923c';
            ctx.beginPath();
            ctx.roundRect(armX, -8, 52, 16, 6);
            ctx.fill();
            ctx.stroke();

            // Claw pincers at end of arm
            const clawX = dir > 0 ? -58 : 58;
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(clawX, 0, 10, dir > 0 ? 1.8 : -1.3, dir > 0 ? 4.5 : 1.3);
            ctx.stroke();
            ctx.restore();
        }

        // Render the Quantum E4 Vehicle on the Lift according to team progress!
        const hasBody = completedTasks.has('task_assembly') || numDone >= 5;
        if (hasBody) {
            this.drawCompleteCarIllustration(ctx, cx, cy, 1.0, '#10b981', true);
        } else {
            // Partially assembled vehicle showing realistic chassis, wheels, motor & battery pack!
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI / 2); // Orient facing right

            // 4 Realistic Tires with treads
            ctx.fillStyle = '#090d16';
            for (let [wx, wy] of [[-46, -58], [46, -58], [-46, 58], [46, 58]]) {
                ctx.beginPath();
                ctx.roundRect(wx - 8, wy - 18, 16, 36, 5);
                ctx.fill();
            }

            // Curved Tubular Spaceframe
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 10;
            this.traceChassisPath(ctx);
            ctx.stroke();
            ctx.strokeStyle = completedTasks.has('task_chassis') ? '#f59e0b' : '#94a3b8';
            ctx.lineWidth = 5.5;
            this.traceChassisPath(ctx);
            ctx.stroke();

            // Rear Brushless Electric Motor with copper coils
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 62, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 62, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Central Lithium Battery Pack with High-Voltage Orange Cables
            if (completedTasks.has('task_battery') || numDone >= 2) {
                ctx.fillStyle = '#0891b2';
                ctx.strokeStyle = '#090d16';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(-28, -24, 56, 48, 8);
                ctx.fill();
                ctx.stroke();
                // Individual cell bars inside pack
                ctx.fillStyle = '#22d3ee';
                for (let by = -16; by <= 12; by += 9) {
                    ctx.fillRect(-20, by, 40, 5);
                }
            }
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Draws an authentic, curvy, cartoon-shaded Quantum E4 / E2 Electric Vehicle
     */
    drawCompleteCarIllustration(ctx, x, y, scale = 1.0, bodyColor = '#10b981', lightsOn = true) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Headlight beams if lightsOn
        if (lightsOn) {
            const grad = ctx.createLinearGradient(88, 0, 195, 0);
            grad.addColorStop(0, 'rgba(250, 204, 21, 0.65)');
            grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(85, -36);
            ctx.lineTo(195, -72);
            ctx.lineTo(195, 72);
            ctx.lineTo(85, 36);
            ctx.closePath();
            ctx.fill();
        }

        // Drop shadow under car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(-86, -46, 182, 102, 34);
        ctx.fill();

        // 4 Protruding Rubber Wheels
        ctx.fillStyle = '#090d16';
        for (let [wx, wy] of [[-58, -54], [46, -54], [-58, 42], [46, 42]]) {
            ctx.beginPath();
            ctx.roundRect(wx, wy, 34, 12, 5);
            ctx.fill();
        }

        // Side Mirrors (Left & Right)
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(28, -53, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(28, 53, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Aerodynamic Quantum E4 Curvy Body Shell
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-84, -34);
        ctx.quadraticCurveTo(-92, 0, -84, 34);
        ctx.quadraticCurveTo(-78, 48, -50, 48);
        ctx.lineTo(52, 48);
        ctx.quadraticCurveTo(88, 46, 92, 24);
        ctx.quadraticCurveTo(96, 0, 92, -24);
        ctx.quadraticCurveTo(88, -46, 52, -48);
        ctx.lineTo(-50, -48);
        ctx.quadraticCurveTo(-78, -48, -84, -34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Curved Panoramic Windshield & Rear Glass
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-62, -38, 114, 76, 22);
        ctx.fill();
        ctx.stroke();

        // Windshield glossy reflection diagonal streak
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.moveTo(15, -32);
        ctx.lineTo(42, -26);
        ctx.lineTo(42, 26);
        ctx.lineTo(15, 32);
        ctx.closePath();
        ctx.fill();

        // Roof panel with Solar / Panoramic sunroof
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-42, -30, 58, 60, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-30, -20, 34, 40, 6);
        ctx.fill();

        // Hood crease lines
        ctx.strokeStyle = 'rgba(9, 13, 22, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(52, -26);
        ctx.lineTo(86, -18);
        ctx.moveTo(52, 26);
        ctx.lineTo(86, 18);
        ctx.stroke();

        // LED Headlights (Front) & Red Taillights (Rear)
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(88, -28, 5, 10, 0.2, 0, Math.PI * 2);
        ctx.ellipse(88, 28, 5, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(-89, -36, 6, 16, 3);
        ctx.roundRect(-89, 20, 6, 16, 3);
        ctx.fill();

        ctx.restore();
    }

    // --- ZONE 5 HELPERS (PRUEBAS DE CALIDAD QA) ---
    drawDynamometerBay(ctx, x, y, qaDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Dyno Pit Platform with yellow/black hazard border
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 215, 255, 16);
        ctx.fill();
        ctx.stroke();

        // Giant Wind-Tunnel Cooling Fan at the top of the Dyno Bay!
        const fanX = 107;
        const fanY = 44;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(fanX - 58, 12, 116, 34, 8);
        ctx.fill();
        ctx.stroke();

        // Animated airflow wind streams blowing down onto the dyno rollers
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        for (let w = -36; w <= 36; w += 24) {
            const wy = 52 + ((now * 0.1 + w * 2) % 140);
            ctx.beginPath();
            ctx.moveTo(fanX + w, wy);
            ctx.lineTo(fanX + w, wy + 22);
            ctx.stroke();
        }

        // 4 Metallic 3D Cylindrical Rollers spinning in the pit
        const spinOffset = (now * 0.05) % 14;
        for (let r = 0; r < 2; r++) {
            const ry = 82 + r * 88;
            for (let pair = 0; pair < 2; pair++) {
                const cy = ry + pair * 24;
                const grad = ctx.createLinearGradient(0, cy, 0, cy + 18);
                grad.addColorStop(0, '#334155');
                grad.addColorStop(0.5, '#94a3b8');
                grad.addColorStop(1, '#1e293b');
                ctx.fillStyle = grad;
                ctx.strokeStyle = '#090d16';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(26, cy, 162, 18, 6);
                ctx.fill();
                ctx.stroke();

                // Spinning hash marks on cylinder
                ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
                for (let hx = 36 + spinOffset; hx < 180; hx += 18) {
                    ctx.beginPath();
                    ctx.moveTo(hx, cy + 2);
                    ctx.lineTo(hx - 4, cy + 16);
                    ctx.stroke();
                }
            }
        }

        ctx.fillStyle = qaDone ? '#10b981' : '#facc15';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(qaDone ? 'DINAMÓMETRO: CERTIFICADO ✅' : 'RODILLOS DINAMÓMETRO EV', 107, 238);

        ctx.restore();
    }

    drawRainTestArch(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Glass & Steel Water Test Booth
        ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, 175, 170, 16);
        ctx.fill();
        ctx.stroke();

        // Floor drain grate & animated water ripples
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(45, 75, 85, 65, 10);
        ctx.fill();

        const rippleR = (now * 0.03) % 28;
        ctx.strokeStyle = `rgba(56, 189, 248, ${1 - rippleR / 28})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(87, 107, rippleR, 0, Math.PI * 2);
        ctx.stroke();

        // Curved Chrome Overhead Spray Pipe Arch with Yellow Nozzles
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(22, 145);
        ctx.lineTo(22, 42);
        ctx.quadraticCurveTo(87, 18, 152, 42);
        ctx.lineTo(152, 145);
        ctx.stroke();

        // Spray nozzles & animated water streams
        for (let nx of [42, 65, 87, 110, 132]) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(nx, 36, 4.5, 0, Math.PI * 2);
            ctx.fill();

            const dropY = 46 + ((now * 0.14 + nx * 3) % 85);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(nx, dropY);
            ctx.lineTo(nx, dropY + 12);
            ctx.stroke();
        }

        ctx.fillStyle = '#bae6fd';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ARCO DE LLUVIA IP65', 87, 158);

        ctx.restore();
    }

    drawTrafficLightTower(ctx, cx, cy, qaDone) {
        ctx.save();
        ctx.translate(cx, cy);

        // Shadow & Base Plate
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-34, -18, 68, 156, 18);
        ctx.fill();
        ctx.stroke();

        // Inner dark housing
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-24, -10, 48, 140, 14);
        ctx.fill();

        const lights = [
            { y: 18, on: !qaDone, onCol: '#ef4444', offCol: '#450a0a' },
            { y: 60, on: true, onCol: '#facc15', offCol: '#422006' },
            { y: 102, on: qaDone, onCol: '#10b981', offCol: '#064e3b' }
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
            // Visor hood over lamp
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
        ctx.fillText('📘 INFO QUANTUM', 0, -10 + floatY);
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

        // Outer glowing interactive floor pad
        ctx.beginPath();
        ctx.arc(0, 0, 46 + (isNear ? 6 : 0) + (isCompleted ? 0 : pulse * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = isCompleted
            ? 'rgba(16, 185, 129, 0.25)'
            : (isNear ? 'rgba(250, 204, 21, 0.35)' : 'rgba(56, 189, 248, 0.18)');
        ctx.fill();

        ctx.lineWidth = isNear ? 4 : 2.5;
        ctx.strokeStyle = isCompleted ? '#10b981' : (isNear ? '#facc15' : '#38bdf8');
        ctx.stroke();

        // Illustrated Octagonal Computer Kiosk / Workstation Base
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-28, -26, 56, 52, 14);
        ctx.fill();
        ctx.stroke();

        // Angled glowing terminal screen inside kiosk
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = isCompleted ? '#10b981' : '#38bdf8';
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
        ctx.fillText(isCompleted ? '✅' : icon, 0, -3);

        // Rounded Station Pill Label
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = isCompleted ? '#10b981' : '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-76, 32, 152, 24, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isCompleted ? '#6ee7b7' : '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(shortName, 0, 48);

        // Interaction Prompt when nearby
        if (isNear) {
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(isCompleted ? '¡Misión Completada! [E] Repetir' : '⚡ Presiona [E] o Haz Clic', 0, -52);
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

        // Quantum Technician Yellow Safety Hard-Hat on top
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(-1, -28, 15, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
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
        ctx.fillText('🤖 Q-BOT', 0, -37);

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
    }
}

window.QuantumGame.Renderer = Renderer;
