/**
 * MissionManager.js - Interactive Educational Challenges & Mini-Games
 * Implements the 7 interactive mini-games for PIL Andina dairy technicians
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
        this.tipEl.textContent = `🤖 PIL-BOT: "${station.qbotTip}"`;
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

    // 1. RECEPCIÓN: Inducción BPM e Indumentaria Sanitaria Estéril
    renderEppMission() {
        const items = [
            { id: 'hairnet', icon: '🧢', name: 'Cofia Sanitaria de Cabeza', valid: true, info: 'Evita caída de cabello en tanques y circuitos de leche' },
            { id: 'mask', icon: '😷', name: 'Barbijo Sanitario Aséptico', valid: true, info: 'Barrera microbiológica obligatoria en salas blancas' },
            { id: 'watch', icon: '⌚', name: 'Reloj y Pulseras Metálicas', valid: false, info: '¡Prohibido por BPM! Acumulan bacterias y suciedad' },
            { id: 'coat', icon: '🥼', name: 'Mandil Blanco de Grado Lácteo', valid: true, info: 'Vestimenta higiénica lavable sin bolsillos superiores' },
            { id: 'boots', icon: '🥾', name: 'Botas Blancas Sanitarias', valid: true, info: 'Suela antideslizante desinfectable en pediluvio' },
            { id: 'phone', icon: '📱', name: 'Teléfono Móvil Personal', valid: false, info: '¡Peligro! Es un vector crítico de contaminación cruzada' }
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
                    this.statusEl.textContent = `⚠️ Infracción BPM: ${item.info}`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => card.classList.remove('card-error'), 700);
                    return;
                }
                if (!selected.has(item.id)) {
                    selected.add(item.id);
                    card.classList.add('card-selected');
                    this.sound.playWireZap();
                    this.statusEl.textContent = `Indumentaria BPM colocada: ${selected.size} / 4`;
                    if (selected.size === 4) {
                        this.completeCurrentMission();
                    }
                }
            });
            grid.appendChild(card);
        });

        this.bodyEl.appendChild(grid);
    }

    // 2. CONTROL DE LECHE CRUDA: 6 Muestras Óptimas de Cisternas
    renderBatteryMission() {
        const samples = [
            { id: 1, region: 'Cochabamba (Valle Central)', acidity: '16.0°D', temp: '4.1°C', healthy: true },
            { id: 2, region: 'Achacachi (Altiplano)', acidity: '15.5°D', temp: '3.8°C', healthy: true },
            { id: 3, region: 'Cisterna #03', acidity: '24.5°D', temp: '14.0°C', healthy: false, reason: 'Leche agria o con mastitis por encima de 18°D Dornic' },
            { id: 4, region: 'Punata (Valle Alto)', acidity: '16.2°D', temp: '4.2°C', healthy: true },
            { id: 5, region: 'Montero (Santa Cruz)', acidity: '17.0°D', temp: '4.5°C', healthy: true },
            { id: 6, region: 'Cisterna #06', acidity: '11.0°D', temp: '5.2°C', healthy: false, reason: 'Densidad alterada: leche aguada (diluida con agua)' },
            { id: 7, region: 'Tarata (Cochabamba)', acidity: '16.5°D', temp: '3.9°C', healthy: true },
            { id: 8, region: 'Batallas (La Paz)', acidity: '15.8°D', temp: '4.0°C', healthy: true },
            { id: 9, region: 'Cisterna #09', acidity: '22.0°D', temp: '12.8°C', healthy: false, reason: 'Cadena de frío rota en transporte: temperatura > 10°C' }
        ];

        let count = 0;
        const meter = document.createElement('div');
        meter.className = 'battery-meter-bar';
        meter.innerHTML = `<span>Volumen de Leche Cruda Aprobada: <strong id="pack-v">0 L / 60.000 L en Silo</strong></span>`;
        this.bodyEl.appendChild(meter);

        const grid = document.createElement('div');
        grid.className = 'minigame-grid-3';

        samples.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'minigame-card';
            btn.innerHTML = `
                <div class="card-icon">🥛</div>
                <div class="card-title">${s.region}</div>
                <div class="card-sub">Acidez: ${s.acidity} | Temp: ${s.temp}</div>
            `;
            btn.addEventListener('click', () => {
                if (btn.classList.contains('card-selected')) return;
                if (!s.healthy) {
                    this.sound.playError();
                    btn.classList.add('card-error');
                    this.statusEl.textContent = `⚠️ Rechazo SENASAG: ${s.reason}. Se acepta solo acidez entre 14°D y 18°D Dornic.`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => btn.classList.remove('card-error'), 700);
                    return;
                }
                btn.classList.add('card-selected');
                count++;
                this.sound.playWireZap();
                const currentL = count * 10000;
                document.getElementById('pack-v').textContent = `${currentL.toLocaleString()} L / 60.000 L en Silo`;
                this.statusEl.textContent = `Cisternas certificadas: ${count} / 6`;
                this.statusEl.className = 'mission-status';

                if (count === 6) {
                    this.completeCurrentMission();
                }
            });
            grid.appendChild(btn);
        });

        this.bodyEl.appendChild(grid);
    }

    // 3. PASTEURIZACIÓN HTST: Secuencia del Proceso en Orden
    renderChassisMission() {
        const correctOrder = [
            { step: 1, icon: '🌪️', name: '1. Desaireación y Clarificación Centrífuga', desc: 'Elimina micropartículas e impurezas del ordeño' },
            { step: 2, icon: '🔥', name: '2. Precalentamiento Regenerativo a 55°C', desc: 'Aprovecha el calor saliente para eficiencia energética' },
            { step: 3, icon: '⚙️', name: '3. Homogeneización a Alta Presión (180 Bar)', desc: 'Pulveriza los glóbulos grasos para textura suave y uniforme' },
            { step: 4, icon: '🌡️', name: '4. Pasteurización HTST (72°C por 15 Segundos)', desc: 'Elimina patógenos conservando nutrientes y vitaminas' },
            { step: 5, icon: '❄️', name: '5. Choque Térmico Aséptico y Enfriado a 4°C', desc: 'Inmoviliza bacterias y envía al silo pulmón de envasado' }
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
                    this.statusEl.textContent = `Etapa HTST completada (${expectedStep - 1} / 5)`;
                    this.statusEl.className = 'mission-status';
                    if (expectedStep > 5) {
                        this.completeCurrentMission();
                    }
                } else {
                    this.sound.playError();
                    btn.classList.add('card-error');
                    this.statusEl.textContent = `⚠️ Secuencia termodinámica incorrecta: Ejecuta primero el Paso #${expectedStep}.`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => btn.classList.remove('card-error'), 650);
                }
            });
            list.appendChild(btn);
        });

        this.bodyEl.appendChild(list);
    }

    // 4. MANTENIMIENTO: Tuberías Clamp y Válvulas Sanitarias
    renderFaultRepairMission() {
        let wiresFixed = 0;
        let boltsFixed = 0;
        let selectedWireColor = null;

        const container = document.createElement('div');
        container.className = 'repair-container';

        // Left: Sanitary line matching
        const wireBox = document.createElement('div');
        wireBox.className = 'repair-panel';
        wireBox.innerHTML = `<h4>🔧 1. Conecta las Líneas Sanitarias Inoxidables</h4>`;

        const wires = [
            { id: 'blue', label: 'Línea AZUL (Leche Fría a 4°C)', color: '#3b82f6', targetLabel: 'Entrada Pasteurizador de Placas' },
            { id: 'red', label: 'Línea ROJA (Vapor Térmico a 72°C)', color: '#ef4444', targetLabel: 'Circuito Térmico del Intercambiador' },
            { id: 'green', label: 'Línea VERDE (Retorno CIP Sanitario)', color: '#10b981', targetLabel: 'Tanque de Lavado y Recirculación' }
        ];

        const wireRow = document.createElement('div');
        wireRow.className = 'wire-columns';

        const leftCol = document.createElement('div');
        const rightCol = document.createElement('div');

        wires.forEach(w => {
            const srcBtn = document.createElement('button');
            srcBtn.className = 'wire-btn';
            srcBtn.style.borderColor = w.color;
            srcBtn.textContent = `🥛 ${w.label}`;
            srcBtn.dataset.wire = w.id;
            srcBtn.addEventListener('click', () => {
                if (srcBtn.disabled) return;
                selectedWireColor = w.id;
                this.sound.playClick();
                this.statusEl.textContent = `Seleccionada ${w.label}. Haz clic en su puerto sanitario.`;
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
                    this.statusEl.textContent = '⚠️ ¡Error! El fluido no corresponde a este puerto sanitario.';
                    this.statusEl.className = 'mission-status error';
                }
            });
            rightCol.appendChild(dstBtn);
        });

        wireRow.appendChild(leftCol);
        wireRow.appendChild(rightCol);
        wireBox.appendChild(wireRow);

        // Right: Clamp Tri-Clover sanitarios
        const boltBox = document.createElement('div');
        boltBox.className = 'repair-panel';
        boltBox.innerHTML = `<h4>🔩 2. Ajusta las 4 Abrazaderas Clamp Tri-Clover</h4>`;

        const boltGrid = document.createElement('div');
        boltGrid.className = 'bolt-grid';

        for (let i = 1; i <= 4; i++) {
            const boltBtn = document.createElement('button');
            boltBtn.className = 'bolt-btn';
            boltBtn.innerHTML = `⚙️ Abrazadera Clamp #${i}<br><small>Estado: FLOJA (Riesgo fuga)</small>`;
            boltBtn.addEventListener('click', () => {
                if (boltBtn.disabled) return;
                boltBtn.disabled = true;
                boltBtn.classList.add('card-selected');
                boltBtn.innerHTML = `✅ Abrazadera Clamp #${i}<br><small>Sellado Inox Grado Alimenticio</small>`;
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
            this.statusEl.textContent = `Líneas conectadas: ${wiresFixed}/3 | Abrazaderas aseguradas: ${boltsFixed}/4`;
            this.statusEl.className = 'mission-status';
            if (wiresFixed === 3 && boltsFixed === 4) {
                this.completeCurrentMission();
            }
        };
    }

    // 5. ENVASADO FINAL: Línea Continua de Leche PIL en Bolsa Azul
    renderCarAssemblyMission() {
        const steps = [
            { icon: '🎞️', title: 'Paso 1: Bobina de Película Tricapa Azul PIL', detail: 'Cargar film de polietileno con barrera contra rayos ultravioleta y luz.' },
            { icon: '💡', title: 'Paso 2: Esterilización UV en Cámara Aséptica', detail: 'Túnel germicida de alta potencia para esterilizar el plástico antes del llenado.' },
            { icon: '🥛', title: 'Paso 3: Dosificación Volumétrica Exacta (946 ml)', detail: 'Inyección continua aséptica sin contacto manual ni espuma.' },
            { icon: '📦', title: 'Paso 4: Termosellado Hermético y Encajonado PIL', detail: 'Sellado por mordaza térmica y empaque en canastillas amarillas oficiales.' }
        ];

        let currentIdx = 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'assembly-wrapper';

        const preview = document.createElement('div');
        preview.className = 'assembly-preview';
        preview.innerHTML = `<div class="car-stage-label" id="car-stage-text">🥛 Envasadora Aséptica PIL (0% de producción del lote)</div>`;
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
                    this.statusEl.textContent = `⚠️ Sigue el protocolo aséptico: ejecuta primero el Paso ${currentIdx + 1}.`;
                    this.statusEl.className = 'mission-status error';
                    return;
                }
                btn.disabled = true;
                btn.classList.add('card-selected');
                currentIdx++;
                this.sound.playMechanicalRatchet();
                const pct = currentIdx * 25;
                document.getElementById('car-stage-text').textContent = `🥛 Leche PIL Bolsa Azul: Envasado al ${pct}%`;
                this.statusEl.textContent = `Etapa de envasado ${currentIdx}/4 completada con éxito.`;
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

    // 6. PRUEBAS DE CALIDAD: Cadena de Frío, pH de Yogur y Fosfatasa
    renderQualityTestMission() {
        const tests = [
            { id: 'cold', name: 'Temperatura de Cámara Frigorífica PIL', targetMin: 2, targetMax: 4, unit: '°C', initial: 9 },
            { id: 'ph', name: 'pH de Fermentación de Yogur PIL (Frutilla/Durazno)', targetMin: 44, targetMax: 46, unit: 'x10 pH', initial: 58 },
            { id: 'fosfatasa', name: 'Nivel de Fosfatasa Residual (Inactivación bacteriana)', targetMin: 0, targetMax: 2, unit: '%', initial: 15 }
        ];

        const container = document.createElement('div');
        container.className = 'qa-container';

        const sliders = {};

        tests.forEach(t => {
            const row = document.createElement('div');
            row.className = 'qa-row';
            const displayVal = t.id === 'ph' ? (t.initial / 10).toFixed(1) : t.initial;
            const targetDisplay = t.id === 'ph' ? `${(t.targetMin / 10).toFixed(1)} - ${(t.targetMax / 10).toFixed(1)}` : `${t.targetMin} - ${t.targetMax}`;
            row.innerHTML = `
                <div class="qa-header">
                    <strong>${t.name}</strong>
                    <span class="qa-badge" id="val-${t.id}">${displayVal} ${t.id === 'ph' ? 'pH' : t.unit} (Meta: ${targetDisplay})</span>
                </div>
                <input type="range" min="0" max="${t.id === 'ph' ? 70 : (t.id === 'cold' ? 12 : 30)}" value="${t.initial}" class="qa-slider" id="slider-${t.id}">
            `;
            container.appendChild(row);

            const slider = row.querySelector(`#slider-${t.id}`);
            const badge = row.querySelector(`#val-${t.id}`);
            sliders[t.id] = { slider, t };

            slider.addEventListener('input', () => {
                const v = parseInt(slider.value, 10);
                const ok = v >= t.targetMin && v <= t.targetMax;
                const txt = t.id === 'ph' ? (v / 10).toFixed(1) + ' pH' : `${v} ${t.unit}`;
                badge.textContent = `${txt} ${ok ? '✅ ÓPTIMO SENASAG' : `(Meta: ${targetDisplay})`}`;
                badge.style.color = ok ? '#10b981' : '#facc15';
            });
        });

        const verifyBtn = document.createElement('button');
        verifyBtn.className = 'primary-action-btn';
        verifyBtn.textContent = '🥛 Certificar Lote de Productos Lácteos PIL';
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
                this.statusEl.textContent = '⚠️ Ajusta los 3 parámetros de inocuidad en el rango verde (ÓPTIMO) antes de certificar.';
                this.statusEl.className = 'mission-status error';
            }
        });

        container.appendChild(verifyBtn);
        this.bodyEl.appendChild(container);
    }

    // 7. SALA DE REUNIONES: Comité de Inocuidad Alimentaria HACCP PIL
    renderMeetingMission() {
        const proposals = [
            { id: 'cold_chain', icon: '❄️', name: 'Cadena de Frío Ininterrumpida a 4°C', valid: true, info: 'Distribución en camiones frigoríficos a tiendas y mercados de Bolivia' },
            { id: 'senasag', icon: '📋', name: 'Certificación Sanitaria SENASAG', valid: true, info: 'Auditoría permanente en Buenas Prácticas Ganaderas y de Manufactura' },
            { id: 'off_cold', icon: '⚡', name: 'Apagar Refrigeración Nocturna', valid: false, info: '¡Propuesta rechazada! La proliferación bacteriana arruinaría el lote' },
            { id: 'traceability', icon: '🏷️', name: 'Trazabilidad por Código de Lote', valid: true, info: 'Identificación exacta de la fecha, hora y silo de envasado' },
            { id: 'recycle_film', icon: '♻️', name: 'Envases 100% Reciclables y Seguros', valid: true, info: 'Economía circular y reducción de huella plástica en Bolivia' },
            { id: 'antibiotics', icon: '💊', name: 'Aceptar Leche con Antibióticos', valid: false, info: '¡Propuesta rechazada! Tóxico para el consumidor e impide fermentar yogur' }
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
                    this.statusEl.textContent = `⚠️ Infracción HACCP: ${prop.info}`;
                    this.statusEl.className = 'mission-status error';
                    setTimeout(() => card.classList.remove('card-error'), 750);
                    return;
                }
                if (!approved.has(prop.id)) {
                    approved.add(prop.id);
                    card.classList.add('card-selected');
                    this.sound.playWireZap();
                    this.statusEl.textContent = `Resoluciones de calidad aprobadas: ${approved.size} / 4`;
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

