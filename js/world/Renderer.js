/**
 * Renderer.js - Industry 4.0 Smart Factory Isometric Vector Rendering Engine
 * Transforms the visual style to match modern 2.5D clean isometric industrial illustrations:
 * - Elevated crisp white platforms with 3D drop bevels and soft cast shadows
 * - Smooth corporate teal/slate background with routed cyan data bus conduits
 * - Safety-orange articulated robotic arms with hydraulic joints and welding sparks
 * - Conveyor belts with moving rollers, boxes, and components
 * - Tall blue cylindrical storage silos with pulsating IoT / Wi-Fi telemetry waves
 * - Giant wall tablet dashboard with production charts & graphs
 * - Curved multi-monitor central control room desk with operator chair
 * - Cloud server racks (HUB Datos) with glowing cloud logo and blinking LEDs
 * - Industry 4.0 vector technicians with hard hats, safety vests, and diagnostic tablets
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

        // 1. Pale Corporate Teal/Slate Industrial Background (matches reference image)
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#e5edf3');
        bgGrad.addColorStop(0.5, '#dbe7ee');
        bgGrad.addColorStop(1, '#d2e0e8');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 2. Blueprint floor isometric grid & data conduits on the ground
        this.drawFloorGrid(ctx, factoryMap.width, factoryMap.height);
        this.drawDataConduits(ctx, now);

        // 3. Corridors & 3D Isometric Connecting Stairs (drawn beneath platform surfaces)
        this.drawCorridorsAndStairs(ctx, factoryMap.corridors, now);

        // 4. Elevated White Platforms (Slabs) with 3D drop bevels and cast shadows
        for (const zone of factoryMap.zones) {
            this.drawElevatedPlatform(ctx, zone, factoryMap.completedTasks, now);
        }

        // 5. Machinery, Assembly Lines, Silos, Screens & Props
        for (const zone of factoryMap.zones) {
            this.drawSmartFactoryMachinery(ctx, zone, factoryMap.completedTasks, now);
        }

        // 6. Educational Signage Hologram Pedestals
        for (const zone of factoryMap.zones) {
            if (zone.signage) {
                const isNear = nearestSignage && nearestSignage.title === zone.signage.title;
                this.drawSignagePedestal(ctx, zone.signage, zone.accentColor, isNear, now);
            }
        }

        // 7. Interactive Station Terminals (Smart Pedestals)
        for (const station of factoryMap.stations) {
            const isCompleted = factoryMap.completedTasks.has(station.id);
            const isNear = nearestStation && nearestStation.id === station.id;
            const animTimer = factoryMap.taskAnimations.get(station.id) || 0;
            this.drawSmartStation(ctx, station, isCompleted, isNear, animTimer, now);
        }

        // 8. Characters (Technicians, Apprentices & Q-BOT) sorted by Y for 2.5D depth
        const allEntities = [
            { type: 'player', data: localPlayer, isLocal: true },
            ...remotePlayers.map(p => ({ type: 'player', data: p, isLocal: false })),
            { type: 'qbot', data: robotGuide }
        ].sort((a, b) => a.data.y - b.data.y);

        for (const ent of allEntities) {
            if (ent.type === 'qbot') {
                this.drawQBotDrone(ctx, ent.data, now);
            } else {
                this.drawIndustryTechnician(ctx, ent.data, ent.isLocal, now);
            }
        }

        ctx.restore();

        // 9. Watermark Badge in Top Right ("QUANTUM MOTORS • SMART FACTORY")
        this.drawBrandHeader(ctx, w, h);

        // 10. Minimap
        if (this.minimapCtx) {
            this.renderMinimap(factoryMap, localPlayer, remotePlayers);
        }
    }

    // =========================================================================
    // BACKGROUND & DATA CONDUITS
    // =========================================================================

    drawFloorGrid(ctx, worldW, worldH) {
        ctx.save();
        ctx.strokeStyle = 'rgba(10, 61, 86, 0.05)';
        ctx.lineWidth = 1;
        const step = 90;
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
        ctx.restore();
    }

    drawDataConduits(ctx, now) {
        ctx.save();
        // Cyan data bus lines running between HUB (bottom-left) and the other platforms
        const cables = [
            // HUB (420, 1200) to Remote Office (420, 600)
            [{ x: 420, y: 1200 }, { x: 420, y: 700 }],
            // HUB (420, 1200) to Central Assembly (960, 1200)
            [{ x: 420, y: 1200 }, { x: 860, y: 1200 }],
            // Central Assembly (1540, 1200) to Central Control (1700, 1200)
            [{ x: 1540, y: 1200 }, { x: 1640, y: 1200 }],
            // Remote Office (760, 390) to Lithium Silos (860, 390)
            [{ x: 760, y: 390 }, { x: 860, y: 390 }],
            // Lithium Silos (1540, 390) to Chassis Robotics (1640, 390)
            [{ x: 1540, y: 390 }, { x: 1640, y: 390 }],
            // Central Assembly (1200, 1520) to Boardroom (1200, 1700)
            [{ x: 1200, y: 1520 }, { x: 1200, y: 1700 }]
        ];

        // Cable shadow
        ctx.strokeStyle = 'rgba(15, 35, 55, 0.12)';
        ctx.lineWidth = 6;
        for (const cable of cables) {
            ctx.beginPath();
            ctx.moveTo(cable[0].x + 3, cable[0].y + 4);
            ctx.lineTo(cable[1].x + 3, cable[1].y + 4);
            ctx.stroke();
        }

        // Cable outer body
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        for (const cable of cables) {
            ctx.beginPath();
            ctx.moveTo(cable[0].x, cable[0].y);
            ctx.lineTo(cable[1].x, cable[1].y);
            ctx.stroke();
        }

        // Inner glowing core
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        for (const cable of cables) {
            ctx.beginPath();
            ctx.moveTo(cable[0].x, cable[0].y);
            ctx.lineTo(cable[1].x, cable[1].y);
            ctx.stroke();
        }

        // Animated traveling data pulse packets
        const pulse = (now * 0.0015) % 1;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        for (const cable of cables) {
            const px = cable[0].x + (cable[1].x - cable[0].x) * pulse;
            const py = cable[0].y + (cable[1].y - cable[0].y) * pulse;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawBrandHeader(ctx, w, h) {
        ctx.save();
        // Modern logo matching the "meinsa" style from the reference image
        const logoX = w - 275;
        const logoY = 34;

        ctx.textAlign = 'right';
        ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#00687f';
        ctx.fillText('meinsa', logoX, logoY);

        // Small cyan dot/accent on top of the 'i' in meinsa
        ctx.fillStyle = '#00b4d8';
        ctx.beginPath();
        ctx.arc(logoX - 44, logoY - 14, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '700 9.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#0a3d56';
        ctx.letterSpacing = '1px';
        ctx.fillText('QUANTUM MOTORS • SMART FACTORY 4.0', logoX, logoY + 16);
        ctx.restore();
    }

    // =========================================================================
    // ELEVATED WHITE PLATFORMS (SLABS) & ISOMETRIC CONNECTING STAIRS
    // =========================================================================

    drawElevatedPlatform(ctx, zone, completedTasks, now) {
        ctx.save();
        const zx = zone.x;
        const zy = zone.y;
        const zw = zone.width;
        const zh = zone.height;
        const bevel = 14;

        // 1. Soft Drop Shadow on pale teal ground
        ctx.fillStyle = 'rgba(15, 45, 65, 0.12)';
        ctx.beginPath();
        ctx.roundRect(zx + 14, zy + 16, zw, zh, 12);
        ctx.fill();

        // 2. 3D Isometric Slab Bevel (Bottom and Right Edges)
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(zx, zy + 8, zw + 8, zh + bevel, 12);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(zx, zy + 4, zw + 4, zh + bevel * 0.6, 12);
        ctx.fill();

        // 3. Crisp Pure White Slab Surface
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 10);
        ctx.fill();

        // 4. Subtle Perimeter Rim
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 10);
        ctx.stroke();

        // 5. Subtle Interior Floor Joints / Tile Seams
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 1;
        const tileStep = 75;
        for (let gx = zx + tileStep; gx < zx + zw; gx += tileStep) {
            ctx.beginPath();
            ctx.moveTo(gx, zy + 6);
            ctx.lineTo(gx, zy + zh - 6);
            ctx.stroke();
        }
        for (let gy = zy + tileStep; gy < zy + zh; gy += tileStep) {
            ctx.beginPath();
            ctx.moveTo(zx + 6, gy);
            ctx.lineTo(zx + zw - 6, gy);
            ctx.stroke();
        }

        // 6. Platform Title & Section Labels (Clean bold navy & teal typography)
        ctx.save();
        const mainLabel = zone.mainLabel || 'PLANTA';
        const subLabel = zone.subLabel || 'FÁBRICA';

        ctx.textAlign = 'left';
        // Main bold title
        ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#0a3d56';
        ctx.fillText(mainLabel, zx + 32, zy + 46);

        // Subtitle in clean corporate teal
        ctx.font = '700 12.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#007a99';
        ctx.fillText(subLabel, zx + 32, zy + 66);
        ctx.restore();

        ctx.restore();
    }

    drawCorridorsAndStairs(ctx, corridors, now) {
        ctx.save();
        for (const c of corridors) {
            const isHorizontal = c.width <= 120 && c.height <= 165 && c.x !== 340 && c.x !== 1120 && c.x !== 1900;

            // 1. Shadow underneath stairs
            ctx.fillStyle = 'rgba(15, 35, 55, 0.22)';
            ctx.fillRect(c.x + 8, c.y + 10, c.width, c.height);

            // 2. Base walkway surface
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(c.x, c.y, c.width, c.height);

            // 3. Realistic 3D White Steps (Stairs between platforms, matching reference image)
            const stepCount = 5;
            if (isHorizontal) {
                const stepW = c.width / stepCount;
                for (let i = 0; i < stepCount; i++) {
                    const sx = c.x + i * stepW;
                    // Step tread (top)
                    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    ctx.fillRect(sx, c.y, stepW - 3, c.height);
                    // Step riser (shadow edge)
                    ctx.fillStyle = '#cbd5e1';
                    ctx.fillRect(sx + stepW - 3, c.y, 3, c.height);
                }
            } else {
                const stepH = c.height / stepCount;
                for (let i = 0; i < stepCount; i++) {
                    const sy = c.y + i * stepH;
                    // Step tread
                    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    ctx.fillRect(c.x, sy, c.width, stepH - 3);
                    // Step riser
                    ctx.fillStyle = '#cbd5e1';
                    ctx.fillRect(c.x, sy + stepH - 3, c.width, 3);
                }
            }

            // Outer clean boundary
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(c.x, c.y, c.width, c.height);
        }
        ctx.restore();
    }

    // =========================================================================
    // SMART FACTORY MACHINERY, ROBOTIC ARMS, SILOS & SCREENS
    // =========================================================================

    drawSmartFactoryMachinery(ctx, zone, completedTasks, now) {
        ctx.save();
        const zx = zone.x;
        const zy = zone.y;

        if (zone.id === 'recepcion') {
            // =================================================================
            // 1. OFICINA CONTROL REMOTO:
            // Giant Wall Tablet Dashboard, Presentation Office Tables, Potted Plants
            // Scenery Engineers matching reference illustration
            // =================================================================
            this.drawGiantTabletDashboard(ctx, zx + 440, zy + 110, 200, 240, now);
            this.drawOfficeGlassTable(ctx, zx + 80, zy + 160);
            this.drawOfficeDesksAndEngineers(ctx, zx + 80, zy + 370, now);
            this.drawPottedPlantIsometric(ctx, zx + 400, zy + 130);
            this.drawPottedPlantIsometric(ctx, zx + 630, zy + 380);

            // Scenery Figure 1: Executive in dark suit pointing at giant tablet dashboard
            this.drawVectorPerson(ctx, {
                x: zx + 420, y: zy + 250,
                facing: 1, shirt: '#0f2942', shirtShadow: '#091e30',
                pants: '#1e293b', skin: '#fed7aa', hair: '#1e293b',
                helmet: null, pose: 'point', reflectiveStripe: false,
                scale: 1.15, now
            });

            // Scenery Figure 2: Engineer in orange polo walking towards stairs with briefcase
            this.drawVectorPerson(ctx, {
                x: zx + 360, y: zy + 460,
                facing: 1, shirt: '#ea580c', pants: '#1e293b',
                skin: '#fed7aa', hair: '#334155', helmet: null,
                pose: 'briefcase', reflectiveStripe: false,
                scale: 1.15, now
            });

            // Scenery Figure 3: Woman standing on left holding open laptop
            this.drawVectorPerson(ctx, {
                x: zx + 60, y: zy + 210,
                facing: 1, shirt: '#ffffff', pants: '#1e293b',
                skin: '#fbcfe8', hair: '#451a03', helmet: null,
                pose: 'laptop', reflectiveStripe: false,
                scale: 1.15, now
            });

        } else if (zone.id === 'baterias') {
            // =================================================================
            // 2. PLANTA FÁBRICA: BATERÍAS & SILOS DE LITIO
            // 4 Tall Cylindrical Tanks with Pulsating IoT / Wi-Fi Telemetry Waves
            // Conveyor Belt with Lithium Cells & Orange Robotic Arm
            // =================================================================
            this.drawStorageSilos(ctx, zx + 80, zy + 120, 4, now);
            this.drawConveyorBelt(ctx, zx + 80, zy + 440, 420, true, now);
            this.drawOrangeRoboticArm(ctx, zx + 220, zy + 390, 1.1, -0.2, true, now);
            this.drawOrangeRoboticArm(ctx, zx + 380, zy + 390, 1.1, 0.3, true, now);
            this.drawDigitalInspectionBoard(ctx, zx + 540, zy + 130, 'LITIO 60V • TELEMETRÍA IOT', now);

            // Scenery Technician pointing at digital inspection board
            this.drawVectorPerson(ctx, {
                x: zx + 510, y: zy + 195,
                facing: 1, shirt: '#ea580c', pants: '#1e293b',
                skin: '#fed7aa', hair: '#1e293b', helmet: '#facc15',
                pose: 'point', reflectiveStripe: true,
                scale: 1.2, now
            });

            // Scenery Technician standing near conveyor inspecting with tablet
            this.drawVectorPerson(ctx, {
                x: zx + 470, y: zy + 440,
                facing: -1, shirt: '#0284c7', pants: '#1e293b',
                skin: '#fed7aa', hair: '#1e293b', helmet: '#facc15',
                pose: 'tablet', reflectiveStripe: true,
                scale: 1.2, now
            });

        } else if (zone.id === 'chasis') {
            // =================================================================
            // 3. PLANTA FÁBRICA: ROBÓTICA DE CHASIS
            // Orange Robotic Arms Welding Tubular Frame, Laser Cutter, Blueprint
            // =================================================================
            this.drawOrangeIndustrialGantry(ctx, zx + 160, zy + 150, 260, 180, now);
            this.drawConveyorBelt(ctx, zx + 70, zy + 250, 480, true, now);
            this.drawOrangeRoboticArm(ctx, zx + 190, zy + 190, 1.25, 0.4, true, now);
            this.drawOrangeRoboticArm(ctx, zx + 360, zy + 190, 1.25, -0.3, true, now);
            this.drawTubularChassisFrame(ctx, zx + 270, zy + 250, completedTasks.has('task_chassis'), now);
            this.drawDesignTabletStand(ctx, zx + 440, zy + 420);

        } else if (zone.id === 'deposito') {
            // =================================================================
            // 6. HUB CENTRO DE PROCESO DE DATOS & LOGÍSTICA
            // Cloud Server Racks with Cyan Cloud Icon, Blinking LEDs, Cable Bundles
            // Forklift and Neatly Arranged Cardboard Parts Pallets
            // =================================================================
            this.drawCloudServerHub(ctx, zx + 80, zy + 130, now);
            this.drawComponentShelves(ctx, zx + 380, zy + 120);
            this.drawCardboardPalletStack(ctx, zx + 120, zy + 460);
            this.drawModernElectricForklift(ctx, zx + 460, zy + 450, now);

            // Scenery Logistics Technician checking inventory near pallets
            this.drawVectorPerson(ctx, {
                x: zx + 230, y: zy + 470,
                facing: 1, shirt: '#0284c7', pants: '#1e293b',
                skin: '#fed7aa', hair: '#1e293b', helmet: '#facc15',
                pose: 'tablet', reflectiveStripe: true,
                scale: 1.2, now
            });

        } else if (zone.id === 'ensamblaje') {
            // =================================================================
            // 4. PLANTA FÁBRICA: LÍNEA PRINCIPAL QUANTUM E4
            // Industrial Conveyor, Double Orange Robotic Arms & Quantum E4 Car
            // =================================================================
            this.drawOrangeIndustrialGantry(ctx, zx + 80, zy + 130, 520, 210, now);
            this.drawConveyorBelt(ctx, zx + 60, zy + 280, 560, true, now);
            this.drawOrangeRoboticArm(ctx, zx + 160, zy + 210, 1.3, 0.35, true, now);
            this.drawOrangeRoboticArm(ctx, zx + 500, zy + 210, 1.3, -0.35, true, now);
            this.drawQuantumE4CarOnPlatform(ctx, zx + 330, zy + 265, completedTasks, now);
            this.drawAssemblyTelemetryBoard(ctx, zx + 80, zy + 470, now);

        } else if (zone.id === 'pruebas') {
            // =================================================================
            // 5. OFICINA CONTROL CENTRAL & PRUEBAS QA
            // Curved Semi-Circular Multi-Monitor Desk with Operator
            // Dynamometer Rollers & Rain Testing Arch
            // =================================================================
            this.drawCurvedControlDesk(ctx, zx + 440, zy + 180, completedTasks.has('task_qa'), now);
            this.drawDynamometerRollers(ctx, zx + 110, zy + 260, completedTasks.has('task_qa'), now);
            this.drawRainTestArch(ctx, zx + 110, zy + 130, now);
            this.drawTelemetryTower(ctx, zx + 520, zy + 440, completedTasks.has('task_qa'));

            // Scenery Operator sitting in swivel chair facing curved screens
            this.drawVectorPerson(ctx, {
                x: zx + 440, y: zy + 208,
                facing: 1, shirt: '#0284c7', pants: '#1e293b',
                skin: '#fed7aa', hair: '#1e293b', helmet: null,
                pose: 'sit', reflectiveStripe: false,
                scale: 1.15, now
            });

            // Scenery Technician with hard hat standing near server rack
            this.drawVectorPerson(ctx, {
                x: zx + 550, y: zy + 220,
                facing: -1, shirt: '#0284c7', pants: '#1e293b',
                skin: '#fed7aa', hair: '#1e293b', helmet: '#facc15',
                pose: 'tablet', reflectiveStripe: true,
                scale: 1.2, now
            });

        } else if (zone.id === 'reuniones') {
            // =================================================================
            // 7. OFICINA DE ESTRATEGIA Y SALA DE REUNIONES
            // Executive Oval Boardroom Table with Emergency Briefing Button
            // Projector Screen, Executive Chairs, Glass Laptops
            // =================================================================
            const meetDone = completedTasks.has('task_meeting');
            this.drawExecutiveBoardroomTable(ctx, zx + zone.width / 2, zy + 330, meetDone, now);
            this.drawProjectorScreen(ctx, zx + 80, zy + 120, meetDone, now);
            this.drawCoffeeAndWaterStation(ctx, zx + 480, zy + 120);
            this.drawPottedPlantIsometric(ctx, zx + 90, zy + 520);
            this.drawPottedPlantIsometric(ctx, zx + 590, zy + 520);
        }

        ctx.restore();
    }

    // --- ORANGE ARTICULATED ROBOTIC ARMS (Signature element from image) ---
    drawOrangeRoboticArm(ctx, x, y, scale = 1, baseAngle = 0, isWorking = true, now = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Subtle kinematic joint swaying
        const armSway = isWorking ? Math.sin(now * 0.003 + x) * 0.18 : 0;
        const forearmSway = isWorking ? Math.cos(now * 0.0035 + y) * 0.22 : 0;

        // 1. Circular Pedestal Base (Dark Slate with Orange Rim)
        ctx.fillStyle = 'rgba(15, 35, 55, 0.25)';
        ctx.beginPath();
        ctx.ellipse(3, 10, 24, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 4, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Turntable cylinder
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-12, -10, 24, 14, 4);
        ctx.fill();

        ctx.save();
        ctx.rotate(baseAngle + armSway * 0.5);

        // 2. Heavy Orange Lower Boom Segment
        ctx.fillStyle = '#f97316';
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-8, -55, 16, 50, 6);
        ctx.fill();
        ctx.stroke();

        // Hydraulic chrome piston on boom
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-3, -45, 6, 32);

        // Pivot knuckle at shoulder
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, -6, 7, 0, Math.PI * 2);
        ctx.fill();

        // 3. Articulated Forearm Segment
        ctx.translate(0, -52);
        ctx.rotate(-0.6 + forearmSway);

        // Elbow joint knuckle
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = '#9a3412';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-6, -42, 12, 42, 5);
        ctx.fill();
        ctx.stroke();

        // 4. Tool End (Gripper / Welder Head)
        ctx.translate(0, -42);
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-10, -8, 20, 8, 3);
        ctx.fill();

        // Two-prong mechanical gripper
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-8, -18, 4, 10);
        ctx.fillRect(4, -18, 4, 10);

        // Welding spark arc or component held
        if (isWorking) {
            const spark = Math.sin(now * 0.02) > 0.6;
            if (spark) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, -22, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();
        ctx.restore();
    }

    // --- INDUSTRIAL CONVEYOR BELTS WITH MOVING PARTS ---
    drawConveyorBelt(ctx, x, y, length, isHorizontal, now) {
        ctx.save();
        ctx.translate(x, y);

        const beltW = isHorizontal ? length : 38;
        const beltH = isHorizontal ? 38 : length;

        // Shadow under conveyor
        ctx.fillStyle = 'rgba(15, 35, 55, 0.2)';
        ctx.beginPath();
        ctx.roundRect(4, 6, beltW, beltH, 6);
        ctx.fill();

        // Support Pylons / Legs
        ctx.fillStyle = '#334155';
        for (let i = 20; i < beltW; i += 90) {
            ctx.fillRect(i, beltH - 4, 8, 14);
            ctx.fillRect(i - 4, beltH + 8, 16, 4);
        }

        // Metal conveyor bed frame (Slate Blue)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, beltW, beltH, 6);
        ctx.fill();
        ctx.stroke();

        // Moving dark rubber belt tread
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(6, 6, beltW - 12, beltH - 12, 4);
        ctx.fill();

        // Moving tread rollers
        const rollOffset = (now * 0.04) % 24;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 2;
        for (let rx = 10 + rollOffset; rx < beltW - 12; rx += 24) {
            ctx.beginPath();
            ctx.moveTo(rx, 8);
            ctx.lineTo(rx, beltH - 8);
            ctx.stroke();
        }

        // Cardboard boxes & battery units traveling on belt
        const boxOffset1 = (now * 0.035) % beltW;
        const boxOffset2 = (now * 0.035 + beltW * 0.5) % beltW;

        for (const bx of [boxOffset1, boxOffset2]) {
            if (bx > 15 && bx < beltW - 35) {
                // Cardboard box (Kraft Brown)
                ctx.fillStyle = '#d97706';
                ctx.strokeStyle = '#92400e';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(bx, 10, 22, 18, 3);
                ctx.fill();
                ctx.stroke();
                // Barcode / packing tape
                ctx.fillStyle = '#fef3c7';
                ctx.fillRect(bx + 4, 16, 14, 5);
            }
        }

        ctx.restore();
    }

    // --- 4 CYLINDRICAL STORAGE TANKS / SILOS WITH IOT WAVES (From image) ---
    drawStorageSilos(ctx, x, y, count = 4, now) {
        ctx.save();
        ctx.translate(x, y);

        const tankW = 68;
        const tankH = 135;
        const gap = 16;

        // Overhead Interconnecting Transfer Pipes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(10, 40);
        ctx.lineTo((tankW + gap) * count - 20, 40);
        ctx.stroke();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.stroke();

        for (let i = 0; i < count; i++) {
            const tx = i * (tankW + gap);

            // Tank drop shadow
            ctx.fillStyle = 'rgba(15, 35, 55, 0.25)';
            ctx.beginPath();
            ctx.ellipse(tx + tankW / 2 + 4, tankH + 8, tankW / 2, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cylinder body with metallic steel-blue gradient
            const grad = ctx.createLinearGradient(tx, 0, tx + tankW, 0);
            grad.addColorStop(0, '#2b5c77');
            grad.addColorStop(0.35, '#4a8ba9');
            grad.addColorStop(0.7, '#38738e');
            grad.addColorStop(1, '#1e4459');

            ctx.fillStyle = grad;
            ctx.strokeStyle = '#1e3a4f';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(tx, 20, tankW, tankH - 20, 8);
            ctx.fill();
            ctx.stroke();

            // Cylindrical metallic dome cap on top
            ctx.fillStyle = '#4a8ba9';
            ctx.beginPath();
            ctx.ellipse(tx + tankW / 2, 20, tankW / 2, 14, 0, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // Pressure release valve on dome
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(tx + tankW / 2 - 3, 2, 6, 8);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(tx + tankW / 2, 2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Horizontal weld bands on tank
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.5;
            for (let wy of [55, 88, 118]) {
                ctx.beginPath();
                ctx.moveTo(tx + 4, wy);
                ctx.lineTo(tx + tankW - 4, wy);
                ctx.stroke();
            }

            // Vertical ladder on 1st and 3rd tanks
            if (i % 2 === 0) {
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1.5;
                const lx = tx + tankW - 14;
                ctx.beginPath();
                ctx.moveTo(lx, 24);
                ctx.lineTo(lx, tankH);
                ctx.moveTo(lx + 8, 24);
                ctx.lineTo(lx + 8, tankH);
                for (let r = 32; r < tankH - 5; r += 12) {
                    ctx.moveTo(lx, r);
                    ctx.lineTo(lx + 8, r);
                }
                ctx.stroke();
            }

            // PULSATING IOT / WI-FI TELEMETRY WAVES (Exact detail from reference image)
            const wavePhase = (now * 0.0025 + i * 0.8) % 1;
            ctx.save();
            ctx.translate(tx + tankW / 2, -10);
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - wavePhase})`;
            ctx.lineWidth = 2.5;

            // Small antenna transmitter node
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // 3 Concentric curved broadcast arcs
            for (let w = 1; w <= 3; w++) {
                const radius = 8 + w * 6 + wavePhase * 6;
                ctx.beginPath();
                ctx.arc(0, -2, radius, -Math.PI * 0.75, -Math.PI * 0.25);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.restore();
    }

    // --- GIANT WALL TABLET DASHBOARD (In Oficina Control Remoto) ---
    drawGiantTabletDashboard(ctx, x, y, w, h, now) {
        ctx.save();
        ctx.translate(x, y);

        // Drop shadow on wall/floor
        ctx.fillStyle = 'rgba(15, 35, 55, 0.3)';
        ctx.beginPath();
        ctx.roundRect(8, 10, w, h, 14);
        ctx.fill();

        // Tablet outer dark slate bezel
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 14);
        ctx.fill();
        ctx.stroke();

        // Front-facing camera dot
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(w / 2, 8, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Tablet bright display screen
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(8, 18, w - 16, h - 26, 8);
        ctx.fill();

        // Header Bar in Screen
        ctx.fillStyle = '#0f2942';
        ctx.fillRect(8, 18, w - 16, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('⚡ TELEMETRÍA PLANTA 4.0', 16, 35);

        // Card 1: Orange/Coral Bar Chart (Matching image dashboard)
        ctx.fillStyle = '#fff7ed';
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(14, 50, 80, 80, 6);
        ctx.fill();
        ctx.stroke();

        // 4 Animated Vertical Bars
        const barHeights = [38, 54, 42, 62];
        barHeights.forEach((bh, idx) => {
            const animH = bh + Math.sin(now * 0.004 + idx) * 5;
            ctx.fillStyle = idx === 3 ? '#ea580c' : '#f97316';
            ctx.fillRect(20 + idx * 17, 122 - animH, 11, animH);
        });

        // Card 2: Cyan Production Line Graph & Meters
        ctx.fillStyle = '#f0f9ff';
        ctx.strokeStyle = '#bae6fd';
        ctx.beginPath();
        ctx.roundRect(102, 50, w - 116, 80, 6);
        ctx.fill();
        ctx.stroke();

        // Live sinusoidal telemetry pulse line
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let lx = 0; lx < 66; lx += 4) {
            const ly = 90 + Math.sin((lx + now * 0.06) * 0.15) * 14;
            if (lx === 0) ctx.moveTo(108 + lx, ly);
            else ctx.lineTo(108 + lx, ly);
        }
        ctx.stroke();

        // Card 3: System Status Indicators
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(14, 138, w - 28, 64, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('● LÍNEA E4: ÓPTIMO (98.4%)', 22, 156);
        ctx.fillStyle = '#0284c7';
        ctx.fillText('● SILOS LITIO: 60.4V BMS OK', 22, 172);
        ctx.fillStyle = '#d97706';
        ctx.fillText('● ROBOTS: EN CICLO ACTIVO', 22, 188);

        ctx.restore();
    }

    // --- CURVED CENTRAL CONTROL DESK (Oficina Control Central) ---
    drawCurvedControlDesk(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        // Desk shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.25)';
        ctx.beginPath();
        ctx.ellipse(4, 14, 98, 44, 0, 0, Math.PI * 2);
        ctx.fill();

        // Curved Semi-Circular Console Desk in Slate
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 92, 40, 0, Math.PI, 0); // Front curved rim
        ctx.lineTo(76, 26);
        ctx.ellipse(0, 26, 76, 32, 0, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Desk Surface Inlay
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(0, -4, 82, 30, 0, Math.PI, 0);
        ctx.fill();

        // 3 Curved LCD Telemetry Monitors
        const monitors = [
            { x: -50, y: -22, a: -0.3 },
            { x: 0, y: -30, a: 0 },
            { x: 50, y: -22, a: 0.3 }
        ];

        monitors.forEach((m, idx) => {
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(m.a);

            // Stand
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-3, 6, 6, 8);
            ctx.fillRect(-8, 14, 16, 3);

            // Screen frame
            ctx.fillStyle = '#090d16';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-22, -14, 44, 22, 3);
            ctx.fill();
            ctx.stroke();

            // Glowing cyan monitor display
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-19, -11, 38, 16);

            // Waveform lines on screen
            ctx.strokeStyle = isDone ? '#6ee7b7' : '#e0f2fe';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-16, -3);
            ctx.lineTo(-8, -8 + (idx * 2));
            ctx.lineTo(0, 0);
            ctx.lineTo(8, -6);
            ctx.lineTo(16, -3);
            ctx.stroke();

            ctx.restore();
        });

        // Operator Swivel Chair
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 28, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Yellow safety cushion
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 28, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // --- CLOUD SERVER HUB (Hub Centro de Proceso de Datos) ---
    drawCloudServerHub(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Rack shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.28)';
        ctx.beginPath();
        ctx.roundRect(8, 12, 100, 165, 8);
        ctx.fill();

        // 42U Server Cabinet Frame (Dark Matte Steel)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 96, 160, 8);
        ctx.fill();
        ctx.stroke();

        // Large Glowing Cyan Cloud Icon (Signature from reference image)
        ctx.save();
        ctx.translate(48, 40);
        ctx.fillStyle = '#0284c7';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;

        // Cloud icon shape
        ctx.beginPath();
        ctx.arc(-10, 0, 10, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(-2, -10, 12, Math.PI, Math.PI * 1.85);
        ctx.arc(10, -4, 11, Math.PI * 1.2, Math.PI * 2);
        ctx.arc(8, 4, 10, 0, Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Text below cloud
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CONEXIÓN EN LA NUBE', 48, 62);

        // Rackmount Blade Servers with Blinking LEDs
        for (let s = 0; s < 5; s++) {
            const sy = 74 + s * 16;
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(8, sy, 80, 12, 2);
            ctx.fill();
            ctx.stroke();

            // Blinking status LEDs (green, cyan, amber)
            const blink = Math.sin(now * 0.005 + s) > 0;
            ctx.fillStyle = blink ? '#10b981' : '#047857';
            ctx.beginPath();
            ctx.arc(16, sy + 6, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(24, sy + 6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Drive bay vents
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(40, sy + 3, 42, 6);
        }

        // Heavy cyan data cables emerging from bottom
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(35, 160);
        ctx.bezierCurveTo(35, 180, 10, 185, 0, 195);
        ctx.moveTo(55, 160);
        ctx.bezierCurveTo(55, 185, 75, 190, 85, 200);
        ctx.stroke();

        ctx.restore();
    }

    // --- ORANGE INDUSTRIAL GANTRY CRANE ---
    drawOrangeIndustrialGantry(ctx, x, y, w, h, now) {
        ctx.save();
        ctx.translate(x, y);

        // Left & Right Vertical Orange Columns
        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 2.5;

        // Left column
        ctx.beginPath();
        ctx.roundRect(0, 0, 24, h, 4);
        ctx.fill();
        ctx.stroke();

        // Right column
        ctx.beginPath();
        ctx.roundRect(w - 24, 0, 24, h, 4);
        ctx.fill();
        ctx.stroke();

        // Top Horizontal Crossbeam
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, 22, 4);
        ctx.fill();
        ctx.stroke();

        // Motorized Hoist Trolley traveling horizontally
        const trolleyX = 40 + (Math.sin(now * 0.001) + 1) * 0.5 * (w - 100);
        ctx.fillStyle = '#334155';
        ctx.fillRect(trolleyX, 18, 32, 14);

        // Steel Lifting Cables
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trolleyX + 8, 32);
        ctx.lineTo(trolleyX + 8, 70);
        ctx.moveTo(trolleyX + 24, 32);
        ctx.lineTo(trolleyX + 24, 70);
        ctx.stroke();

        // Heavy Lifting Hook
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(trolleyX + 16, 76, 8, 0, Math.PI);
        ctx.fill();

        ctx.restore();
    }

    // --- QUANTUM E4 ELECTRIC CAR (Centerpiece on Assembly Platform) ---
    drawQuantumE4CarOnPlatform(ctx, x, y, completedTasks, now) {
        ctx.save();
        ctx.translate(x, y);

        const doneCount = completedTasks.size;
        const liftOffset = Math.min(25, doneCount * 4.5);

        // Hydraulic lift pedestal
        ctx.fillStyle = '#475569';
        ctx.fillRect(-28, 48 - liftOffset, 56, liftOffset + 8);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-12, 48 - liftOffset, 24, liftOffset + 8);

        // Car Shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.35)';
        ctx.beginPath();
        ctx.ellipse(4, 52, 92, 34, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(0, -liftOffset);

        // Car Body (Aerodynamic Quantum E4 City Electric Vehicle in Cyan/Teal)
        const carGrad = ctx.createLinearGradient(0, -40, 0, 40);
        carGrad.addColorStop(0, '#38bdf8');
        carGrad.addColorStop(0.5, '#0284c7');
        carGrad.addColorStop(1, '#0369a1');

        ctx.fillStyle = carGrad;
        ctx.strokeStyle = '#082f49';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-75, -28, 150, 56, 18);
        ctx.fill();
        ctx.stroke();

        // Tinted Glass Panoramic Roof / Windshield
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-42, -22, 84, 44, 12);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(-36, -18, 72, 36, 8);
        ctx.fill();

        // Windshield reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-8, -8, 22, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // LED Headlights (Bright Cyan Xenon)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(72, -18, 6, 12);
        ctx.fillRect(72, 6, 6, 12);
        ctx.shadowBlur = 0;

        // Front Grille with Quantum Motors Badge
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(73, -5, 4, 10);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('⚡', 73, 4);

        // 4 Wheels with Alloy Rims
        const wheels = [
            { x: -50, y: -34 }, { x: 50, y: -34 },
            { x: -50, y: 28 }, { x: 50, y: 28 }
        ];
        wheels.forEach(w => {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(w.x - 12, w.y, 24, 8, 3);
            ctx.fill();
            ctx.stroke();
        });

        // Vehicle Model Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QUANTUM E4', 0, 3);

        ctx.restore();
    }

    // --- OFFICE DESKS & BOARDS ---
    drawOfficeGlassTable(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.2)';
        ctx.beginPath();
        ctx.roundRect(4, 8, 180, 80, 8);
        ctx.fill();

        // Table surface (Clean White/Glass)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 80, 8);
        ctx.fill();
        ctx.stroke();

        // 2 Laptops on table
        for (let lx of [40, 120]) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(lx, 26, 28, 20);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(lx + 3, 28, 22, 12);
        }

        ctx.restore();
    }

    drawOfficeDesksAndEngineers(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Collaborative meeting table with gears/blueprints (from reference image)
        ctx.fillStyle = 'rgba(15, 35, 55, 0.2)';
        ctx.beginPath();
        ctx.roundRect(4, 6, 170, 75, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, 170, 75, 8);
        ctx.fill();
        ctx.stroke();

        // Cyan blueprint sheet
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.fillRect(35, 15, 60, 45);
        ctx.strokeRect(35, 15, 60, 45);

        // Interactive orange gear props on table (matching reference image!)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(115, 35, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(115, 35, 6, 0, Math.PI * 2);
        ctx.fill();

        // Two sitting engineers collaborating around gears (from reference image)
        this.drawVectorPerson(ctx, {
            x: 20, y: 55, facing: 1, shirt: '#ffffff',
            pants: '#1e293b', skin: '#fed7aa', hair: '#1e293b',
            helmet: null, pose: 'sit', reflectiveStripe: false,
            scale: 1.05, now
        });

        this.drawVectorPerson(ctx, {
            x: 150, y: 55, facing: -1, shirt: '#ea580c',
            pants: '#1e293b', skin: '#fed7aa', hair: '#451a03',
            helmet: null, pose: 'sit', reflectiveStripe: false,
            scale: 1.05, now
        });

        ctx.restore();
    }

    drawPottedPlantIsometric(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // White ceramic cylindrical pot
        ctx.fillStyle = 'rgba(15, 35, 55, 0.2)';
        ctx.beginPath();
        ctx.ellipse(2, 10, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-10, -6, 20, 16, 4);
        ctx.fill();
        ctx.stroke();

        // Lush green leaves
        ctx.fillStyle = '#10b981';
        for (let la of [-0.6, 0, 0.6]) {
            ctx.save();
            ctx.rotate(la);
            ctx.beginPath();
            ctx.ellipse(0, -18, 6, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    drawTubularChassisFrame(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        ctx.strokeStyle = isDone ? '#10b981' : '#f97316';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-45, -20, 90, 40, 6);
        ctx.stroke();

        // Internal crossbraces
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-45, -20);
        ctx.lineTo(45, 20);
        ctx.moveTo(-45, 20);
        ctx.lineTo(45, -20);
        ctx.stroke();

        ctx.restore();
    }

    drawDesignTabletStand(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-15, -25, 30, 50);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-12, -22, 24, 30);

        ctx.restore();
    }

    drawComponentShelves(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Warehouse rack frame (Slate)
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 16, 120);
        ctx.fillRect(160, 0, 16, 120);

        // 3 Shelves with cardboard boxes
        for (let sh of [30, 65, 100]) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, sh, 176, 8);

            // Cardboard boxes
            for (let bx = 22; bx < 150; bx += 36) {
                ctx.fillStyle = '#d97706';
                ctx.fillRect(bx, sh - 18, 26, 18);
            }
        }

        ctx.restore();
    }

    drawCardboardPalletStack(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Wooden pallet base
        ctx.fillStyle = '#92400e';
        ctx.fillRect(0, 20, 70, 8);

        // Stacked boxes
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.fillRect(4, 2, 30, 18);
        ctx.strokeRect(4, 2, 30, 18);
        ctx.fillRect(36, 2, 30, 18);
        ctx.strokeRect(36, 2, 30, 18);

        ctx.restore();
    }

    drawModernElectricForklift(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 32, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Safety Orange Forklift Body
        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = '#9a3412';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-24, -16, 48, 32, 6);
        ctx.fill();
        ctx.stroke();

        // Rollcage
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(-16, -14, 24, 24);

        // Lifting mast & forks
        ctx.fillStyle = '#334155';
        ctx.fillRect(24, -22, 6, 38);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(28, 4, 22, 4);

        ctx.restore();
    }

    drawAssemblyTelemetryBoard(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, 190, 60, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f2942';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📊 ESTADO DE LÍNEA QUANTUM E4', 12, 22);

        ctx.fillStyle = '#ea580c';
        ctx.fillText('● INTEGRACIÓN ELECTROMECÁNICA', 12, 42);

        ctx.restore();
    }

    drawDigitalInspectionBoard(ctx, x, y, title, now) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#00a8cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 65, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0b2545';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, 12, 22);

        ctx.fillStyle = '#10b981';
        ctx.fillText('● CELDAS LIFEPO4: 3.25V NOMINAL', 12, 40);
        ctx.fillText('● EQUILIBRIO BMS: ACTIVO', 12, 54);

        ctx.restore();
    }

    drawDynamometerRollers(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 160, 50);

        // Rotating rollers
        ctx.fillStyle = isDone ? '#10b981' : '#64748b';
        ctx.fillRect(20, 10, 45, 30);
        ctx.fillRect(95, 10, 45, 30);

        ctx.restore();
    }

    drawRainTestArch(ctx, x, y, now) {
        ctx.save();
        ctx.translate(x, y);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(80, 50, 45, Math.PI, 0);
        ctx.stroke();

        ctx.restore();
    }

    drawTelemetryTower(ctx, x, y, isDone) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 14, 70);

        ctx.fillStyle = isDone ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(7, 10, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // --- EXECUTIVE BOARDROOM TABLE WITH EMERGENCY BUTTON ---
    drawExecutiveBoardroomTable(ctx, cx, cy, isDone, now) {
        ctx.save();
        ctx.translate(cx, cy);

        // Drop shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.3)';
        ctx.beginPath();
        ctx.ellipse(4, 10, 145, 75, 0, 0, Math.PI * 2);
        ctx.fill();

        // 8 Executive Chairs around the table
        const chairs = [
            { x: -125, y: -65, a: 0.4 }, { x: 0, y: -85, a: 0 }, { x: 125, y: -65, a: -0.4 },
            { x: -125, y: 65, a: -0.4 }, { x: 0, y: 85, a: 0 }, { x: 125, y: 65, a: 0.4 },
            { x: -160, y: 0, a: 1.57 }, { x: 160, y: 0, a: -1.57 }
        ];

        chairs.forEach(ch => {
            ctx.save();
            ctx.translate(ch.x, ch.y);
            ctx.rotate(ch.a);
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-12, -16, 24, 7);
            ctx.restore();
        });

        // Oval Boardroom Table Surface (Pure White with Slate Rim)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0b2545';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 140, 70, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner glowing ring
        ctx.strokeStyle = isDone ? '#10b981' : '#00a8cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 116, 50, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Laptops on table
        for (let lx of [-75, 75]) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(lx - 14, -30, 28, 18);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(lx - 10, -28, 20, 10);
        }

        // ICONIC CENTRAL EMERGENCY / BRIEFING BUTTON (Among Us style!)
        const pulse = (Math.sin(now * 0.006) + 1) * 0.5;

        // Metallic Pedestal
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-24, -20, 48, 40, 8);
        ctx.fill();

        // Hazard stripes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-18, -14, 36, 28);

        // Glowing Red Emergency Button
        ctx.fillStyle = isDone ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 12 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawProjectorScreen(ctx, x, y, isDone, now) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 85, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f2942';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📋 HOJA DE RUTA QUANTUM', 14, 26);
        ctx.fillStyle = '#059669';
        ctx.fillText('● 100% CERO EMISIONES', 14, 46);
        ctx.fillText('● ENSAMBLADO EN BOLIVIA', 14, 64);

        ctx.restore();
    }

    drawCoffeeAndWaterStation(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(0, 0, 90, 50, 6);
        ctx.fill();
        ctx.stroke();

        // Water dispenser bottle
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(45, 16, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // =========================================================================
    // SMART PEDESTAL TERMINALS & SIGNAGE
    // =========================================================================

    drawSmartStation(ctx, station, isCompleted, isNear, animTimer, now) {
        ctx.save();
        ctx.translate(station.x, station.y);

        // Ground shadow
        ctx.fillStyle = 'rgba(15, 35, 55, 0.25)';
        ctx.beginPath();
        ctx.ellipse(2, 8, 20, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sleek White Pedestal
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = isCompleted ? '#10b981' : (isNear ? '#f97316' : '#0284c7');
        ctx.lineWidth = isNear ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(-16, -20, 32, 26, 6);
        ctx.fill();
        ctx.stroke();

        // Glowing Interface Screen
        ctx.fillStyle = isCompleted ? '#10b981' : (isNear ? '#f97316' : '#0284c7');
        ctx.fillRect(-12, -16, 24, 12);

        // Floating icon / status beacon
        const bounce = Math.sin(now * 0.005) * 3;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(station.icon, 0, -32 + bounce);

        // Station name pill
        ctx.fillStyle = '#0f2942';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.fillText(station.shortName, 0, 22);

        // Proximity glow ring when player is close
        if (isNear) {
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -6, 32, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawSignagePedestal(ctx, signage, accentColor, isNear, now) {
        ctx.save();
        ctx.translate(signage.x, signage.y);

        // Holographic Information Terminal
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-14, -18, 28, 24, 5);
        ctx.fill();
        ctx.stroke();

        // Floating info icon
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📘', 0, -28 + Math.sin(now * 0.004) * 3);

        ctx.fillStyle = '#0f2942';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillText('INFO', 0, 18);

        ctx.restore();
    }

    // =========================================================================
    // INDUSTRY 4.0 TECHNICIANS & COMPANION DRONE
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

    /**
     * drawVectorPerson - Renders a stylized isometric human figure
     * Completely eliminates any Among Us bean or capsule shapes:
     * - Anatomical human proportions (slender legs, hips, waist, torso, shoulders, neck, head)
     * - Stylized hair or yellow safety hard hat with front brim
     * - Collared polo shirt or suit jacket with high-vis safety vest
     * - Slender dark trousers and work shoes with clean soles
     * - Digital diagnostic tablet with glowing cyan telemetry screen
     * - Natural walking stride animation (alternating leg swing, knee flex, arm swing, torso bob)
     */
    drawVectorPerson(ctx, opts) {
        const {
            x = 0,
            y = 0,
            facing = 1,
            shirt = '#0284c7',
            shirtShadow = null,
            pants = '#1e293b',
            shoes = '#0f172a',
            skin = '#fed7aa',
            hair = '#1e293b',
            helmet = null,
            helmetBrim = '#ca8a04',
            pose = 'tablet',
            isMoving = false,
            now = performance.now(),
            avatarImg = null,
            scale = 1.25,
            name = null,
            isLocal = false,
            emote = null,
            reflectiveStripe = true
        } = opts;

        ctx.save();
        ctx.translate(x, y);

        // 1. Soft Floor Shadow on Ground
        ctx.fillStyle = 'rgba(15, 35, 55, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Local Player Proximity / Target Indicator
        if (isLocal) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 22 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Subtle pulsing outer halo
            const haloPulse = (Math.sin(now * 0.005) + 1) * 0.5;
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 + haloPulse * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, (26 + haloPulse * 4) * scale, (10 + haloPulse * 2) * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.save();
        // Facing flips the character horizontally
        ctx.scale(facing * scale, scale);

        // 3. Movement & Walking Animation Dynamics
        const walkSpeed = 0.016;
        const walkPhase = isMoving ? (now * walkSpeed) : 0;
        const stride = isMoving ? Math.sin(walkPhase) * 7.5 : 0;
        const kneeLift = isMoving ? Math.max(0, -Math.cos(walkPhase)) * 3.5 : 0;
        const torsoBob = isMoving ? Math.abs(Math.sin(walkPhase * 2)) * 2 : (Math.sin(now * 0.003) * 0.6);
        const armSwing = isMoving ? Math.cos(walkPhase) * 6 : 0;

        // 4. Legs & Slender Trousers (Two distinct human legs with seam gap)
        ctx.fillStyle = pants;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.8;

        if (pose === 'sit') {
            // Sitting on chair: upper legs horizontal, lower legs vertical
            // Left thigh
            ctx.fillRect(-6, -24, 14, 6);
            // Left calf down
            ctx.fillRect(4, -18, 5, 16);
            // Right thigh
            ctx.fillRect(-4, -22, 14, 6);
            // Right calf down
            ctx.fillRect(7, -16, 5, 16);

            // Shoes
            ctx.fillStyle = shoes;
            ctx.fillRect(4, -3, 8, 4);
            ctx.fillRect(7, -1, 8, 4);
        } else {
            // Standing or Walking
            // --- Back / Left Leg ---
            ctx.save();
            ctx.beginPath();
            const leftHipX = -3.5;
            const leftHipY = -27 - torsoBob;
            const leftKneeX = -4.5 + stride * 0.5;
            const leftKneeY = -14 - kneeLift - torsoBob * 0.5;
            const leftFootX = -5 + stride;
            const leftFootY = -2;

            // Leg path
            ctx.moveTo(leftHipX - 2.5, leftHipY);
            ctx.lineTo(leftKneeX - 2.2, leftKneeY);
            ctx.lineTo(leftFootX - 2, leftFootY);
            ctx.lineTo(leftFootX + 2, leftFootY);
            ctx.lineTo(leftKneeX + 2.2, leftKneeY);
            ctx.lineTo(leftHipX + 1.5, leftHipY);
            ctx.closePath();
            ctx.fillStyle = pants;
            ctx.fill();
            ctx.stroke();

            // Left shoe / work boot
            ctx.fillStyle = shoes;
            ctx.beginPath();
            ctx.roundRect(leftFootX - 4, leftFootY - 1, 9, 4, 1.5);
            ctx.fill();
            // Sole
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(leftFootX - 4, leftFootY + 2, 9, 1);
            ctx.restore();

            // --- Front / Right Leg ---
            ctx.save();
            ctx.beginPath();
            const rightHipX = 3.5;
            const rightHipY = -27 - torsoBob;
            const rightKneeX = 4.5 - stride * 0.5;
            const rightKneeY = -14 - torsoBob * 0.5;
            const rightFootX = 5 - stride;
            const rightFootY = -2;

            // Leg path
            ctx.moveTo(rightHipX - 1.5, rightHipY);
            ctx.lineTo(rightKneeX - 2.2, rightKneeY);
            ctx.lineTo(rightFootX - 2, rightFootY);
            ctx.lineTo(rightFootX + 2, rightFootY);
            ctx.lineTo(rightKneeX + 2.2, rightKneeY);
            ctx.lineTo(rightHipX + 2.5, rightHipY);
            ctx.closePath();
            ctx.fillStyle = pants;
            ctx.fill();
            ctx.stroke();

            // Right shoe / work boot
            ctx.fillStyle = shoes;
            ctx.beginPath();
            ctx.roundRect(rightFootX - 4, rightFootY - 1, 9, 4, 1.5);
            ctx.fill();
            // Sole
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(rightFootX - 4, rightFootY + 2, 9, 1);
            ctx.restore();
        }

        // 5. Waist, Belt & Buckle
        const waistY = -28 - torsoBob;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6.5, waistY - 2, 13, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-1.5, waistY - 2, 3, 3);

        // 6. Torso: Tapered Human Shape with Shoulders
        const shoulderY = -44 - torsoBob;
        ctx.beginPath();
        ctx.moveTo(-6.5, waistY - 1);
        ctx.lineTo(-9.5, shoulderY);
        ctx.lineTo(9.5, shoulderY);
        ctx.lineTo(6.5, waistY - 1);
        ctx.closePath();
        ctx.fillStyle = shirt;
        ctx.fill();
        ctx.strokeStyle = shirtShadow || '#0b2545';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right side depth shading on torso
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.moveTo(1, shoulderY);
        ctx.lineTo(9.5, shoulderY);
        ctx.lineTo(6.5, waistY - 1);
        ctx.lineTo(0.5, waistY - 1);
        ctx.closePath();
        ctx.fill();

        // High-vis reflective safety stripe on torso
        if (reflectiveStripe) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-8.5, waistY - 9, 17, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-8.5, waistY - 8, 17, 1);
        }

        // Collared polo / shirt neck trim
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-3, shoulderY);
        ctx.lineTo(0, shoulderY + 4);
        ctx.lineTo(3, shoulderY);
        ctx.lineTo(0, shoulderY + 1);
        ctx.closePath();
        ctx.fill();

        // 7. Security ID Badge Lanyard on Chest
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3, shoulderY + 2);
        ctx.lineTo(0, shoulderY + 7);
        ctx.lineTo(3, shoulderY + 2);
        ctx.stroke();

        // Miniature ID Badge on Chest
        const badgeX = -2.5;
        const badgeY = shoulderY + 6;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f2942';
        ctx.lineWidth = 0.8;
        ctx.fillRect(badgeX, badgeY, 5, 7);
        ctx.strokeRect(badgeX, badgeY, 5, 7);

        // Show player avatar photo inside the lanyard badge if uploaded!
        if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
            try {
                ctx.drawImage(avatarImg, badgeX + 0.5, badgeY + 0.5, 4, 4);
            } catch (e) {
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(badgeX + 1, badgeY + 1, 3, 3);
            }
        } else {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(badgeX + 1, badgeY + 1, 3, 3);
        }

        // 8. Arms, Hands & Props (Diagnostic Tablet, Laptop, Pointer, Briefcase)
        if (pose === 'point') {
            // Right arm pointing forward
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(8, shoulderY + 2);
            ctx.lineTo(16, shoulderY - 2);
            ctx.lineTo(24, shoulderY - 6);
            ctx.stroke();

            // Pointing hand & index finger
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(24, shoulderY - 6, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(24, shoulderY - 7.5, 5, 2);

            // Left arm resting on hip
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-8, shoulderY + 2);
            ctx.lineTo(-12, waistY - 3);
            ctx.lineTo(-6, waistY);
            ctx.stroke();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(-6, waistY, 2.2, 0, Math.PI * 2);
            ctx.fill();

        } else if (pose === 'laptop') {
            // Holding open laptop in front
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            // Left arm bent
            ctx.beginPath();
            ctx.moveTo(-8, shoulderY + 2);
            ctx.lineTo(-6, waistY - 5);
            ctx.lineTo(2, waistY - 5);
            ctx.stroke();
            // Right arm bent
            ctx.beginPath();
            ctx.moveTo(8, shoulderY + 2);
            ctx.lineTo(8, waistY - 5);
            ctx.lineTo(4, waistY - 5);
            ctx.stroke();

            // Open laptop
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(2, waistY - 6, 12, 2); // base
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(10, waistY - 14, 2, 9); // screen back
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(9, waistY - 14, 1.5, 8); // glowing screen

        } else if (pose === 'briefcase') {
            // Holding briefcase at right side
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(8, shoulderY + 2);
            ctx.lineTo(10, waistY - 2);
            ctx.lineTo(9, waistY + 6);
            ctx.stroke();

            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(9, waistY + 6, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Leather Briefcase
            ctx.fillStyle = '#78350f';
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            ctx.fillRect(5, waistY + 5, 11, 8);
            ctx.strokeRect(5, waistY + 5, 11, 8);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(9.5, waistY + 7, 2, 2);

            // Left arm swinging naturally
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-8, shoulderY + 2);
            ctx.lineTo(-10, waistY - 2);
            ctx.stroke();

        } else if (pose === 'sit') {
            // Sitting arms resting on desk or keyboard
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(7, shoulderY + 2);
            ctx.lineTo(11, waistY - 4);
            ctx.lineTo(14, waistY - 4);
            ctx.stroke();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(14, waistY - 4, 2.2, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Default: 'tablet' (Holding digital diagnostic tablet, matching reference image)
            // Left / Back Arm
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-7.5, shoulderY + 2);
            ctx.lineTo(-9.5, waistY - 6 - armSwing * 0.3);
            ctx.lineTo(0, waistY - 6);
            ctx.stroke();

            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(0, waistY - 6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Right / Front Arm
            ctx.strokeStyle = shirt;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(7.5, shoulderY + 2);
            ctx.lineTo(9.5, waistY - 5 + armSwing * 0.3);
            ctx.lineTo(6, waistY - 5);
            ctx.stroke();

            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(6, waistY - 5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Digital Diagnostic Tablet (Signature Industry 4.0 tool)
            const tabX = 1;
            const tabY = waistY - 13;
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tabX, tabY, 11, 14, 2);
            ctx.fill();
            ctx.stroke();

            // Glowing Cyan Screen
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(tabX + 1.5, tabY + 1.5, 8, 11);

            // Miniature Screen Telemetry Pulse Lines
            ctx.fillStyle = '#0369a1';
            ctx.fillRect(tabX + 2.5, tabY + 3, 6, 1.5);
            ctx.fillRect(tabX + 2.5, tabY + 6, 4, 1.5);
            ctx.fillRect(tabX + 2.5, tabY + 9, 5, 1.5);
        }

        // 9. Neck
        const neckY = shoulderY - 1;
        ctx.fillStyle = skin;
        ctx.fillRect(-2.5, neckY - 4, 5, 5);

        // 10. Head & Face
        const headCenterY = neckY - 8;
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(0, headCenterY, 6.5, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Clean Stylized Eye & Ear
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(3.2, headCenterY - 0.5, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Ear
        ctx.fillStyle = skin;
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(-4.5, headCenterY, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 11. Hair or Industry Safety Helmet (Hard Hat)
        if (helmet) {
            // Safety Helmet (Industry 4.0 Hard Hat from reference image)
            // Hair trim visible under helmet at back of neck
            ctx.fillStyle = hair;
            ctx.beginPath();
            ctx.arc(-2, headCenterY + 2, 4.5, Math.PI * 0.5, Math.PI * 1.5);
            ctx.fill();

            // Rounded Helmet Dome
            ctx.fillStyle = helmet;
            ctx.strokeStyle = helmetBrim || '#ca8a04';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, headCenterY - 2, 7.5, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // Protective Front Brim Shade (over forehead)
            ctx.beginPath();
            ctx.roundRect(-7.5, headCenterY - 2.5, 17, 3, 1.2);
            ctx.fill();
            ctx.stroke();

            // Helmet Top Ventilation Ridge / Crest
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1.5, headCenterY - 9.5, 3, 7.5);

        } else {
            // Office Stylized Hair (for office staff / executives)
            ctx.fillStyle = hair;
            ctx.beginPath();
            ctx.arc(0, headCenterY - 2, 7.2, Math.PI * 0.9, Math.PI * 2.1);
            ctx.lineTo(-4, headCenterY + 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore(); // Undo facing scale

        // 12. Modern Floating Name Tag Above Character
        if (name) {
            ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            const nameWidth = ctx.measureText(name).width + 16;
            const tagY = -74 - torsoBob;

            // Shadow
            ctx.fillStyle = 'rgba(15, 35, 55, 0.18)';
            ctx.beginPath();
            ctx.roundRect(-nameWidth / 2 + 1, tagY + 2, nameWidth, 18, 5);
            ctx.fill();

            // Tag Box (White with teal border)
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = isLocal ? '#0284c7' : '#cbd5e1';
            ctx.lineWidth = isLocal ? 2 : 1.2;
            ctx.beginPath();
            ctx.roundRect(-nameWidth / 2, tagY, nameWidth, 18, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0b2545';
            ctx.fillText(name, 0, tagY + 13);
        }

        // 13. Floating Emote Bubble
        if (emote) {
            const emoteY = -102 - torsoBob;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, emoteY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(emote, 0, emoteY + 6);
        }

        ctx.restore();
    }

    drawIndustryTechnician(ctx, player, isLocal, now) {
        const colors = window.QuantumGame.FactoryAssets.PLAYER_COLORS;
        const palette = colors.find(c => c.id === player.colorId) || colors[0];
        const avatarImg = player.avatar ? this.getAvatarImage(player.avatar) : null;

        this.drawVectorPerson(ctx, {
            x: player.x,
            y: player.y,
            facing: player.facing || 1,
            shirt: palette.body,
            shirtShadow: palette.shadow,
            pants: '#1e293b',
            shoes: '#0f172a',
            skin: '#fed7aa',
            hair: '#1e293b',
            helmet: '#facc15',
            helmetBrim: '#ca8a04',
            pose: player.isMoving ? 'walk' : 'tablet',
            isMoving: Boolean(player.isMoving),
            now: now,
            avatarImg: avatarImg,
            scale: 1.25,
            name: player.name,
            isLocal: isLocal,
            emote: player.emote,
            reflectiveStripe: true
        });
    }

    drawQBotDrone(ctx, qbot, now) {
        ctx.save();
        ctx.translate(qbot.x, qbot.y + (qbot.hoverOffset || 0));

        // Hover thruster cyan glow
        ctx.fillStyle = 'rgba(0, 168, 204, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sleek Drone Shell (White & Cyan)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-16, -16, 32, 26, 10);
        ctx.fill();
        ctx.stroke();

        // Digital Visor Eyes
        ctx.fillStyle = '#0f2942';
        ctx.beginPath();
        ctx.roundRect(-12, -12, 24, 14, 5);
        ctx.fill();

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(-5, -5, 2.8, 0, Math.PI * 2);
        ctx.arc(5, -5, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🤖 Q-BOT', 0, -32);

        ctx.restore();
    }

    // =========================================================================
    // MINIMAP
    // =========================================================================

    renderMinimap(factoryMap, localPlayer, remotePlayers) {
        const mCtx = this.minimapCtx;
        const mw = this.minimapCanvas.width;
        const mh = this.minimapCanvas.height;
        const scaleX = mw / factoryMap.width;
        const scaleY = mh / factoryMap.height;

        mCtx.clearRect(0, 0, mw, mh);

        // Pale corporate teal background on minimap
        mCtx.fillStyle = '#e5edf3';
        mCtx.fillRect(0, 0, mw, mh);

        // Elevated white platforms on minimap
        for (const z of factoryMap.zones) {
            // Shadow
            mCtx.fillStyle = 'rgba(15, 35, 55, 0.25)';
            mCtx.fillRect(z.x * scaleX + 1.5, z.y * scaleY + 1.5, z.width * scaleX, z.height * scaleY);

            // White slab
            mCtx.fillStyle = '#ffffff';
            mCtx.fillRect(z.x * scaleX, z.y * scaleY, z.width * scaleX, z.height * scaleY);

            // Border
            mCtx.strokeStyle = z.accentColor || '#0284c7';
            mCtx.lineWidth = 1;
            mCtx.strokeRect(z.x * scaleX, z.y * scaleY, z.width * scaleX, z.height * scaleY);
        }

        // Corridors / Stairs
        mCtx.fillStyle = '#cbd5e1';
        for (const c of factoryMap.corridors) {
            mCtx.fillRect(c.x * scaleX, c.y * scaleY, c.width * scaleX, c.height * scaleY);
        }

        // Stations
        for (const s of factoryMap.stations) {
            const done = factoryMap.completedTasks.has(s.id);
            mCtx.fillStyle = done ? '#10b981' : '#ea580c';
            mCtx.beginPath();
            mCtx.arc(s.x * scaleX, s.y * scaleY, 3, 0, Math.PI * 2);
            mCtx.fill();
        }

        // Remote players
        for (const p of remotePlayers) {
            mCtx.fillStyle = '#0284c7';
            mCtx.beginPath();
            mCtx.arc(p.x * scaleX, p.y * scaleY, 3, 0, Math.PI * 2);
            mCtx.fill();
        }

        // Local player
        mCtx.fillStyle = '#f97316';
        mCtx.beginPath();
        mCtx.arc(localPlayer.x * scaleX, localPlayer.y * scaleY, 4.5, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.strokeStyle = '#ffffff';
        mCtx.lineWidth = 1.5;
        mCtx.stroke();
    }
}

window.QuantumGame.Renderer = Renderer;
