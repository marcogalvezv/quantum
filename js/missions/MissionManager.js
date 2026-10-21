/**
 * MissionManager.js - Interactive Educational Challenges & Mini-Games
 * Implements the 6 interactive mini-games for Quantum Motors apprentices
 */
window.QuantumGame = window.QuantumGame || {};

class MissionManager {
    constructor(soundManager, onMissionSuccess) {
        this.sound = soundManager;
        this.onMissionSuccess = onMissionSuccess;
        this.activeStation = null;

        this.modalEl = document.getElementById('mission-modal');
        this.titleEl = document.getElementById('mission-title');
        this.tipEl = document.getElementById('mission-qbot-tip');
        this.bodyEl = document.getElementById('mission-body');
        this.statusEl = document.getElementById('mission-status');
        this.closeBtn = document.getElementById('mission-close-btn');

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
    }

    openMission(station) {
        this.activeStation = station;
        this.sound.playClick();
        this.titleEl.textContent = `${station.icon} ${station.title}`;
        this.tipEl.textContent = `🤖 Q-BOT: "${station.qbotTip}"`;
        this.statusEl.textContent = 'Completa el reto técnico para registrar el avance del equipo.';
        this.statusEl.className = 'mission-status';
        this.bodyEl.innerHTML = '';

        switch (station.type) {
            case 'epp_quiz':
                this.renderEppMission();
                break;
            case 'battery_pack':
                this.renderBatteryMission();
                break;
            case 'chassis_order':
                this.renderChassisMission();
                break;
            case 'fault_repair':
                this.renderFaultRepairMission();
                break;
            case 'car_assembly':
                this.renderCarAssemblyMission();
                break;
            case 'quality_test':
                this.renderQualityTestMission();
                break;
            case 'meeting_plan':
                this.renderMeetingMission();
                break;
        }

        this.modalEl.classList.remove('hidden');
    }

    closeModal() {
        this.sound.playClick();
        this.modalEl.classList.add('hidden');
        this.activeStation = null;
    }

    completeCurrentMission() {
        if (!this.activeStation) return;
        const st = this.activeStation;
        this.sound.playTaskComplete();
        this.statusEl.textContent = `✅ ¡Excelente trabajo! Has ganado +${st.points} pts y desbloqueado la insignia para el equipo.`;
        this.statusEl.className = 'mission-status success';

        setTimeout(() => {
            if (this.onMissionSuccess) {
                this.onMissionSuccess(st);
            }
            this.closeModal();
        }, 1100);
    }

    // 1. RECEPCIÓN: Selección de EPP Dieléctrico
    renderEppMission() {
        const items = [
            { id: 'gloves', icon: '🧤', name: 'Guantes Dieléctricos Clase 0', valid: true, info: 'Aíslan hasta 1000V DC' },
            { id: 'helmet', icon: '⛑️', name: 'Casco Industrial Aislante', valid: true, info: 'Protección contra impactos y arco' },
            { id: 'ring', icon: '💍', name: 'Anillos y Reloj Metálico', valid: false, info: '¡Peligro! Conducen electricidad y causan cortocircuito' },
            { id: 'boots', icon: '🥾', name: 'Botas Dieléctricas sin Clavos', valid: true, info: 'Suela aislante antideslizante' },
            { id: 'glasses', icon: '🥽', name: 'Gafas de Policarbonato', valid: true, info: 'Protección ocular en soldadura y chispas' },
            { id: 'soda', icon: '🥤', name: 'Bebida Abierta en Banco Eléctrico', valid: false, info: '¡Peligro de derrame en celdas de litio!' }
        ];

        const selected = new Set();
        const grid = document.createElement('div');
        grid.className = 'minigame-grid-3';

        items.forEach(item => {
            const card = document.createElement('button');
            card.className = 'minigame-card';
            card.innerHTML = `
                <div class="card-icon">${item.icon}</div>
                <div class="card-title">${item.name}</div>
                <div class="card-sub">${item.info}</div>
            `;
            card.addEventListener('click', () => {
                if (!item.valid) {
                    this.sound.playError();
                    card.classList.add('card-error');
                    this.statusEl.textContent = `⚠️ Incorrecto: ${item.info}`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => card.classList.remove('card-error'), 700);
                    return;
                }
                if (!selected.has(item.id)) {
                    selected.add(item.id);
                    card.classList.add('card-selected');
                    this.sound.playWireZap();
                    this.statusEl.textContent = `Equipos seguros equipados: ${selected.size} / 4`;
                    if (selected.size === 4) {
                        this.completeCurrentMission();
                    }
                }
            });
            grid.appendChild(card);
        });

        this.bodyEl.appendChild(grid);
    }

    // 2. BATERÍAS: Selección de 6 Celdas LiFePO4 Saludables
    renderBatteryMission() {
        const cells = [
            { id: 1, voltage: '3.25V', temp: '24°C', healthy: true },
            { id: 2, voltage: '3.28V', temp: '25°C', healthy: true },
            { id: 3, voltage: '1.80V', temp: '49°C', healthy: false, reason: 'Celda degradada con bajo voltaje y sobrecalentamiento' },
            { id: 4, voltage: '3.22V', temp: '23°C', healthy: true },
            { id: 5, voltage: '3.26V', temp: '24°C', healthy: true },
            { id: 6, voltage: '0.95V', temp: '52°C', healthy: false, reason: 'Celda en cortocircuito interno' },
            { id: 7, voltage: '3.24V', temp: '25°C', healthy: true },
            { id: 8, voltage: '3.27V', temp: '24°C', healthy: true },
            { id: 9, voltage: '4.45V', temp: '46°C', healthy: false, reason: 'Celda sobrecargada fuera de rango LiFePO4' }
        ];

        let count = 0;
        const meter = document.createElement('div');
        meter.className = 'battery-meter-bar';
        meter.innerHTML = `<span>Voltaje del Módulo Pack Quantum: <strong id="pack-v">0V / 60V Nominal</strong></span>`;
        this.bodyEl.appendChild(meter);

        const grid = document.createElement('div');
        grid.className = 'minigame-grid-3';

        cells.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'minigame-card';
            btn.innerHTML = `
                <div class="card-icon">🔋</div>
                <div class="card-title">Celda #0${c.id} (${c.voltage})</div>
                <div class="card-sub">Temp: ${c.temp}</div>
            `;
            btn.addEventListener('click', () => {
                if (btn.classList.contains('card-selected')) return;
                if (!c.healthy) {
                    this.sound.playError();
                    btn.classList.add('card-error');
                    this.statusEl.textContent = `⚠️ BMS Alerta: ${c.reason}. Selecciona celdas entre 3.2V y 3.3V.`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => btn.classList.remove('card-error'), 700);
                    return;
                }
                btn.classList.add('card-selected');
                count++;
                this.sound.playWireZap();
                const currentV = count * 10;
                document.getElementById('pack-v').textContent = `${currentV}V / 60V Nominal`;
                this.statusEl.textContent = `Celdas LiFePO4 balanceadas: ${count} / 6`;
                this.statusEl.className = 'mission-status';

                if (count === 6) {
                    this.completeCurrentMission();
                }
            });
            grid.appendChild(btn);
        });

        this.bodyEl.appendChild(grid);
    }

    // 3. CHASIS: Secuencia Estructural en Orden
    renderChassisMission() {
        const correctOrder = [
            { step: 1, icon: '📏', name: '1. Plataforma Base de Acero Tubular', desc: 'Soporta el peso estructural inferior' },
            { step: 2, icon: '🗄️', name: '2. Cuna Acorazada de Baterías', desc: 'Mantiene el centro de gravedad bajo y estable' },
            { step: 3, icon: '⚙️', name: '3. Ejes y Suspensión McPherson Reforzada', desc: 'Amortiguación para calles y pendientes andinas' },
            { step: 4, icon: '🏗️', name: '4. Jaula Habitáculo Antivuelco', desc: 'Protección integral para los pasajeros' },
            { step: 5, icon: '🛡️', name: '5. Defensas de Absorción de Impacto', desc: 'Seguridad frontal y trasera completada' }
        ];

        // Shuffled display
        const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
        let expectedStep = 1;

        const list = document.createElement('div');
        list.className = 'chassis-list';

        shuffled.forEach(piece => {
            const btn = document.createElement('button');
            btn.className = 'chassis-item-btn';
            btn.innerHTML = `
                <span class="chassis-icon">${piece.icon}</span>
                <div class="chassis-text">
                    <strong>${piece.name}</strong>
                    <small>${piece.desc}</small>
                </div>
            `;
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                if (piece.step === expectedStep) {
                    btn.disabled = true;
                    btn.classList.add('card-selected');
                    this.sound.playMechanicalRatchet();
                    expectedStep++;
                    this.statusEl.textContent = `Pieza soldada correctamente (${expectedStep - 1} / 5)`;
                    this.statusEl.className = 'mission-status';
                    if (expectedStep > 5) {
                        this.completeCurrentMission();
                    }
                } else {
                    this.sound.playError();
                    btn.classList.add('card-error');
                    this.statusEl.textContent = `⚠️ Orden incorrecto: Debes colocar primero el Paso #${expectedStep}.`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => btn.classList.remove('card-error'), 650);
                }
            });
            list.appendChild(btn);
        });

        this.bodyEl.appendChild(list);
    }

    // 4. DEPÓSITO: Resolución de Fallas (Cables y Tornillos)
    renderFaultRepairMission() {
        let wiresFixed = 0;
        let boltsFixed = 0;
        let selectedWireColor = null;

        const container = document.createElement('div');
        container.className = 'repair-container';

        // Left: Wire matching
        const wireBox = document.createElement('div');
        wireBox.className = 'repair-panel';
        wireBox.innerHTML = `<h4>⚡ 1. Conecta el Arnés Eléctrico (Haz clic en Origen y luego Destino)</h4>`;

        const wires = [
            { id: 'red', label: 'Cable ROJO (+60V DC)', color: '#ef4444', targetLabel: 'Terminal Positivo Inversor (+)' },
            { id: 'black', label: 'Cable NEGRO (GND Tierra)', color: '#64748b', targetLabel: 'Chasis / Masa Negativa (-)' },
            { id: 'blue', label: 'Cable AZUL (Datos CAN-Bus)', color: '#3b82f6', targetLabel: 'Puerto Telemetría BMS' }
        ];

        const wireRow = document.createElement('div');
        wireRow.className = 'wire-columns';

        const leftCol = document.createElement('div');
        const rightCol = document.createElement('div');

        wires.forEach(w => {
            const srcBtn = document.createElement('button');
            srcBtn.className = 'wire-btn';
            srcBtn.style.borderColor = w.color;
            srcBtn.textContent = `🔌 ${w.label}`;
            srcBtn.dataset.wire = w.id;
            srcBtn.addEventListener('click', () => {
                if (srcBtn.disabled) return;
                selectedWireColor = w.id;
                this.sound.playClick();
                this.statusEl.textContent = `Seleccionado ${w.label}. Ahora haz clic en su terminal correspondiente.`;
            });
            leftCol.appendChild(srcBtn);
        });

        [...wires].reverse().forEach(w => {
            const dstBtn = document.createElement('button');
            dstBtn.className = 'wire-btn';
            dstBtn.textContent = `🎯 ${w.targetLabel}`;
            dstBtn.addEventListener('click', () => {
                if (dstBtn.disabled) return;
                if (selectedWireColor === w.id) {
                    dstBtn.disabled = true;
                    dstBtn.classList.add('card-selected');
                    const src = leftCol.querySelector(`[data-wire="${w.id}"]`);
                    if (src) {
                        src.disabled = true;
                        src.classList.add('card-selected');
                    }
                    selectedWireColor = null;
                    wiresFixed++;
                    this.sound.playWireZap();
                    checkAllFixed();
                } else {
                    this.sound.playError();
                    this.statusEl.textContent = '⚠️ ¡Cuidado! Ese terminal no corresponde al cable seleccionado.';
                    this.statusEl.className = 'mission-status error';
                }
            });
            rightCol.appendChild(dstBtn);
        });

        wireRow.appendChild(leftCol);
        wireRow.appendChild(rightCol);
        wireBox.appendChild(wireRow);

        // Right: Loose bolts tightening
        const boltBox = document.createElement('div');
        boltBox.className = 'repair-panel';
        boltBox.innerHTML = `<h4>🔩 2. Ajusta los 4 Pernos Sueltos del Soporte Motor</h4>`;

        const boltGrid = document.createElement('div');
        boltGrid.className = 'bolt-grid';

        for (let i = 1; i <= 4; i++) {
            const boltBtn = document.createElement('button');
            boltBtn.className = 'bolt-btn';
            boltBtn.innerHTML = `🔩 Perno M10 #${i}<br><small>Estado: FLOJO</small>`;
            boltBtn.addEventListener('click', () => {
                if (boltBtn.disabled) return;
                boltBtn.disabled = true;
                boltBtn.classList.add('card-selected');
                boltBtn.innerHTML = `✅ Perno M10 #${i}<br><small>Torque: 45 Nm OK</small>`;
                boltsFixed++;
                this.sound.playMechanicalRatchet();
                checkAllFixed();
            });
            boltGrid.appendChild(boltBtn);
        }

        boltBox.appendChild(boltGrid);
        container.appendChild(wireBox);
        container.appendChild(boltBox);
        this.bodyEl.appendChild(container);

        const checkAllFixed = () => {
            this.statusEl.textContent = `Cables: ${wiresFixed}/3 | Pernos ajustados: ${boltsFixed}/4`;
            this.statusEl.className = 'mission-status';
            if (wiresFixed === 3 && boltsFixed === 4) {
                this.completeCurrentMission();
            }
        };
    }

    // 5. ENSAMBLAJE FINAL: Integración Guiada del Quantum E4
    renderCarAssemblyMission() {
        const steps = [
            { icon: '⚙️', title: 'Paso 1: Instalar Motor Eléctrico Brushless (4000W)', detail: 'Acoplar al diferencial trasero sin emisiones.' },
            { icon: '🔋', title: 'Paso 2: Conectar Banco de Litio 60V y Controlador Sinusoidal', detail: 'Fijar conectores de alta corriente y fusible principal.' },
            { icon: '🚗', title: 'Paso 3: Montar Carrocería Compacta y Parabrisas', detail: 'Sellado hermético para lluvia y granizo.' },
            { icon: '🖥️', title: 'Paso 4: Encender Tablero Digital e Indicador de Carga', detail: 'Verificar cámaras de retroceso y luces LED.' }
        ];

        let currentIdx = 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'assembly-wrapper';

        const preview = document.createElement('div');
        preview.className = 'assembly-preview';
        preview.innerHTML = `<div class="car-stage-label" id="car-stage-text">🏗️ Chasis en Plataforma Elevadora (0% completado)</div>`;
        wrapper.appendChild(preview);

        const list = document.createElement('div');
        list.className = 'chassis-list';

        steps.forEach((s, idx) => {
            const btn = document.createElement('button');
            btn.className = 'chassis-item-btn';
            btn.innerHTML = `
                <span class="chassis-icon">${s.icon}</span>
                <div class="chassis-text">
                    <strong>${s.title}</strong>
                    <small>${s.detail}</small>
                </div>
            `;
            btn.addEventListener('click', () => {
                if (idx !== currentIdx) {
                    this.sound.playError();
                    this.statusEl.textContent = `⚠️ Sigue el procedimiento guiado: ejecuta primero el Paso ${currentIdx + 1}.`;
                    this.statusEl.className = 'mission-status error';
                    return;
                }
                btn.disabled = true;
                btn.classList.add('card-selected');
                currentIdx++;
                this.sound.playMechanicalRatchet();
                const pct = currentIdx * 25;
                document.getElementById('car-stage-text').textContent = `🚗 Quantum E4 Integrado al ${pct}%`;
                this.statusEl.textContent = `Etapa ${currentIdx}/4 completada con éxito.`;
                this.statusEl.className = 'mission-status';

                if (currentIdx === steps.length) {
                    this.completeCurrentMission();
                }
            });
            list.appendChild(btn);
        });

        wrapper.appendChild(list);
        this.bodyEl.appendChild(wrapper);
    }

    // 6. PRUEBAS DE CALIDAD (QA): Calibración en Dinamómetro
    renderQualityTestMission() {
        const tests = [
            { id: 'regen', name: 'Freno Regenerativo (Recuperación de Energía)', targetMin: 75, targetMax: 90, unit: '%', initial: 40 },
            { id: 'iso', name: 'Aislamiento Dieléctrico de Seguridad', targetMin: 80, targetMax: 100, unit: 'MΩ', initial: 45 },
            { id: 'speed', name: 'Velocidad Máxima Urbana Regulada', targetMin: 50, targetMax: 60, unit: 'km/h', initial: 30 }
        ];

        const container = document.createElement('div');
        container.className = 'qa-container';

        const sliders = {};

        tests.forEach(t => {
            const row = document.createElement('div');
            row.className = 'qa-row';
            row.innerHTML = `
                <div class="qa-header">
                    <strong>${t.name}</strong>
                    <span class="qa-badge" id="val-${t.id}">${t.initial} ${t.unit} (Meta: ${t.targetMin}-${t.targetMax} ${t.unit})</span>
                </div>
                <input type="range" min="20" max="100" value="${t.initial}" class="qa-slider" id="slider-${t.id}">
            `;
            container.appendChild(row);

            const slider = row.querySelector(`#slider-${t.id}`);
            const badge = row.querySelector(`#val-${t.id}`);
            sliders[t.id] = { slider, t };

            slider.addEventListener('input', () => {
                const v = parseInt(slider.value, 10);
                const ok = v >= t.targetMin && v <= t.targetMax;
                badge.textContent = `${v} ${t.unit} ${ok ? '✅ ÓPTIMO' : `(Meta: ${t.targetMin}-${t.targetMax} ${t.unit})`}`;
                badge.style.color = ok ? '#10b981' : '#facc15';
            });
        });

        const verifyBtn = document.createElement('button');
        verifyBtn.className = 'primary-action-btn';
        verifyBtn.textContent = '🚀 Ejecutar Prueba en Dinamómetro y Certificar Vehículo';
        verifyBtn.addEventListener('click', () => {
            let allOk = true;
            for (const key in sliders) {
                const { slider, t } = sliders[key];
                const v = parseInt(slider.value, 10);
                if (v < t.targetMin || v > t.targetMax) {
                    allOk = false;
                }
            }
            if (allOk) {
                this.completeCurrentMission();
            } else {
                this.sound.playError();
                this.statusEl.textContent = '⚠️ Ajusta los 3 controles deslizantes dentro del rango verde (ÓPTIMO) antes de certificar.';
                this.statusEl.className = 'mission-status error';
            }
        });

        container.appendChild(verifyBtn);
        this.bodyEl.appendChild(container);
    }

    // 7. SALA DE REUNIONES: Junta Estratégica de Ingeniería Quantum
    renderMeetingMission() {
        const proposals = [
            { id: 'plug220', icon: '🔌', name: 'Carga Doméstica a 220V', valid: true, info: 'Recarga en cualquier enchufe estándar sin electrolinera especial' },
            { id: 'climb', icon: '⛰️', name: 'Relación de Transmisión Andina', valid: true, info: 'Torque optimizado para subir pendientes de La Paz y Cochabamba' },
            { id: 'diesel', icon: '🛢️', name: 'Motor Auxiliar a Diésel', valid: false, info: '¡Propuesta rechazada! Quantum fabrica vehículos 100% cero emisiones' },
            { id: 'lithium_local', icon: '🔋', name: 'Integración de Baterías de Litio', valid: true, info: 'Impulso al valor agregado y talento técnico en Bolivia' },
            { id: 'recycle', icon: '♻️', name: 'Economía Circular de Celdas', valid: true, info: 'Segunda vida útil de baterías para almacenamiento solar' },
            { id: 'lead', icon: '⚓', name: 'Chasis Pesado de Hierro Fundido', valid: false, info: '¡Propuesta rechazada! El exceso de peso reduce la autonomía a la mitad' }
        ];

        const approved = new Set();
        const grid = document.createElement('div');
        grid.className = 'minigame-grid-3';

        proposals.forEach(prop => {
            const card = document.createElement('button');
            card.className = 'minigame-card';
            card.innerHTML = `
                <div class="card-icon">${prop.icon}</div>
                <div class="card-title">${prop.name}</div>
                <div class="card-sub">${prop.info}</div>
            `;
            card.addEventListener('click', () => {
                if (!prop.valid) {
                    this.sound.playError();
                    card.classList.add('card-error');
                    this.statusEl.textContent = `⚠️ ${prop.info}`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => card.classList.remove('card-error'), 750);
                    return;
                }
                if (!approved.has(prop.id)) {
                    approved.add(prop.id);
                    card.classList.add('card-selected');
                    this.sound.playWireZap();
                    this.statusEl.textContent = `Metas estratégicas aprobadas por el directorio: ${approved.size} / 4`;
                    this.statusEl.className = 'mission-status';
                    if (approved.size === 4) {
                        this.completeCurrentMission();
                    }
                }
            });
            grid.appendChild(card);
        });

        this.bodyEl.appendChild(grid);
    }
}

window.QuantumGame.MissionManager = MissionManager;
