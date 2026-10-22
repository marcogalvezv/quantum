/**
 * Quantum Motors Educational Game - Assets, Map Layout & Educational Content
 * Inspired by Quantum Motors (Cochabamba, Bolivia) - Pioneers of Electric Vehicles in Latin America
 */
window.QuantumGame = window.QuantumGame || {};

window.QuantumGame.FactoryAssets = {
    // Crewmate colors (Among Us style with Quantum Motors technician vibe)
    PLAYER_COLORS: [
        { id: 'cyan', name: 'Cian Eléctrico', body: '#00e5ff', shadow: '#008fa1', visor: '#e0f7fa' },
        { id: 'lime', name: 'Verde Litio', body: '#00e676', shadow: '#00964b', visor: '#e0f7fa' },
        { id: 'orange', name: 'Naranja Solar', body: '#ff9100', shadow: '#b26500', visor: '#e0f7fa' },
        { id: 'purple', name: 'Violeta Cobalto', body: '#d500f9', shadow: '#8900a1', visor: '#e0f7fa' },
        { id: 'yellow', name: 'Amarillo Uyuni', body: '#ffea00', shadow: '#b2a300', visor: '#e0f7fa' },
        { id: 'red', name: 'Rojo Andino', body: '#ff1744', shadow: '#b2102f', visor: '#e0f7fa' }
    ],

    EMOTES: [
        { id: 'bolt', icon: '⚡', label: '¡Energía lista!' },
        { id: 'wrench', icon: '🔧', label: '¡Necesito ayuda aquí!' },
        { id: 'car', icon: '🚗', label: '¡Al ensamblaje!' },
        { id: 'check', icon: '✅', label: '¡Tarea completada!' },
        { id: 'battery', icon: '🔋', label: '¡Revisando baterías!' },
        { id: 'celebrate', icon: '🇧🇴', label: '¡Orgullo Quantum!' }
    ],

    BADGES: [
        { id: 'badge_welcome', icon: '🪪', title: 'Credencial EPP Quantum', desc: 'Equipos de Protección Personal verificados' },
        { id: 'badge_battery', icon: '🔋', title: 'Especialista en Litio', desc: 'Pack de Baterías 60V equilibrado con BMS' },
        { id: 'badge_chassis', icon: '🏗️', title: 'Maestro de Estructura', desc: 'Chasis tubular reforzado para topografía andina' },
        { id: 'badge_assembly', icon: '🚗', title: 'Ingeniero de Ensamblaje', desc: 'Integración electromecánica del Quantum E4' },
        { id: 'badge_repair', icon: '🛠️', title: 'Diagnóstico Eléctrico', desc: 'Resolución de fallas en arnés y controlador' },
        { id: 'badge_qa', icon: '🏆', title: 'Certificador de Calidad', desc: 'Pruebas de frenado, aislamiento y autonomía superadas' },
        { id: 'badge_meeting', icon: '🤝', title: 'Estratega de Directorio', desc: 'Hoja de ruta de movilidad sostenible aprobada en reunión' }
    ],

    // World dimensions
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 2400,

    // 7 Factory Sections inspired by Quantum Motors Bolivia
    ZONES: [
        {
            id: 'recepcion',
            name: '1. Recepción y Bienvenida',
            subtitle: 'Inducción y Seguridad Industrial (EPP)',
            x: 80, y: 80, width: 680, height: 620,
            floorColor: '#1e293b',
            accentColor: '#38bdf8',
            icon: '🏢',
            description: 'Punto de ingreso a la planta de Quantum Motors en Cochabamba. Aquí todo Técnico Aprendiz recibe su equipo de seguridad dieléctrico antes de entrar a planta.',
            signage: {
                x: 420, y: 210,
                title: 'HISTORIA QUANTUM MOTORS',
                fact: 'Nacida en Bolivia, Quantum Motors es pionera en fabricar vehículos 100% eléctricos urbanos (modelos E2, E3 y E4) adaptados a la altura y calles latinoamericanas.'
            }
        },
        {
            id: 'baterias',
            name: '2. Área de Baterías y Sistemas Eléctricos',
            subtitle: 'Laboratorio de Litio y BMS',
            x: 860, y: 80, width: 680, height: 620,
            floorColor: '#172554',
            accentColor: '#22d3ee',
            icon: '🔋',
            description: 'Corazón energético del vehículo. Aquí se ensamblan los módulos de Ion-Litio / LiFePO4 y se configura el BMS (Battery Management System).',
            signage: {
                x: 1200, y: 210,
                title: 'ENERGÍA LIMPIA Y LITIO',
                fact: 'Un pack de batería Quantum opera entre 60V y 72V. El sistema BMS protege contra sobrecargas, equilibra el voltaje de cada celda y monitorea la temperatura.'
            }
        },
        {
            id: 'chasis',
            name: '3. Zona de Chasis y Estructura',
            subtitle: 'Soldadura, Corte Láser y Suspensión',
            x: 1640, y: 80, width: 680, height: 620,
            floorColor: '#27272a',
            accentColor: '#f59e0b',
            icon: '🏗️',
            description: 'Área metalmecánica donde los tubos de acero de alta resistencia se sueldan para crear una jaula segura, ligera y resistente.',
            signage: {
                x: 1980, y: 210,
                title: 'INGENIERÍA ESTRUCTURAL',
                fact: 'El chasis compacto reduce el peso total del vehículo a menos de 450 kg, maximizando la autonomía eléctrica en pendientes pronunciadas.'
            }
        },
        {
            id: 'deposito',
            name: '6. Depósito y Logística',
            subtitle: 'Inventario de Componentes y Diagnóstico',
            x: 80, y: 880, width: 680, height: 640,
            floorColor: '#1f2937',
            accentColor: '#a855f7',
            icon: '📦',
            description: 'Almacén inteligente de motores brushless, controladores electrónicos, cables de alta tensión y tornillería de grado automotriz.',
            signage: {
                x: 420, y: 1010,
                title: 'CADENA DE SUMINISTRO Y CONTROL',
                fact: 'Antes de instalar cualquier arnés eléctrico o controlador sinusoidal, se verifica la continuidad y el torque exacto de cada perno de sujeción.'
            }
        },
        {
            id: 'ensamblaje',
            name: '4. Estación de Ensamblaje Final',
            subtitle: 'Línea Principal de Integración Quantum E4',
            x: 860, y: 880, width: 680, height: 640,
            floorColor: '#0f172a',
            accentColor: '#10b981',
            icon: '🚗',
            description: 'Línea central donde se unen el chasis, el motor eléctrico trasero, el banco de baterías, la carrocería y el tablero digital.',
            signage: {
                x: 1200, y: 1010,
                title: 'MOTOR ELÉCTRICO BRUSHLESS',
                fact: 'A diferencia de un motor a gasolina con cientos de piezas móviles, el motor eléctrico sin escobillas tiene solo un rotor principal y cero emisiones locales.'
            }
        },
        {
            id: 'pruebas',
            name: '5. Zona de Pruebas de Calidad',
            subtitle: 'Dinamómetro, Frenado y Certificación',
            x: 1640, y: 880, width: 680, height: 640,
            floorColor: '#14532d',
            accentColor: '#facc15',
            icon: '✅',
            description: 'Pista de control de calidad (QA). Ningún vehículo Quantum sale a las calles sin aprobar aislamiento eléctrico, luces, frenos y telemetría.',
            signage: {
                x: 1980, y: 1010,
                title: 'CONTROL DE CALIDAD TOTAL',
                fact: 'Se comprueba el freno regenerativo (que recarga la batería al desacelerar), la hermeticidad contra lluvia y la respuesta del acelerador electrónico.'
            }
        },
        {
            id: 'reuniones',
            name: '7. Sala de Reuniones y Estrategia',
            subtitle: 'Directorio de Ingeniería, Kanban y Coordinación',
            x: 860, y: 1700, width: 680, height: 620,
            floorColor: '#1e1b4b',
            accentColor: '#f43f5e',
            icon: '🤝',
            description: 'Sala de juntas e ingeniería donde el equipo técnico se reúne alrededor de la mesa central para coordinar la producción y definir metas de movilidad eléctrica.',
            signage: {
                x: 1200, y: 1830,
                title: 'COORDINACIÓN Y TRABAJO EN EQUIPO',
                fact: 'Ningún vehículo se fabrica en solitario: en la Sala de Reuniones convergen diseño industrial, electrónica de potencia, logística y control de calidad.'
            }
        }
    ],

    // Corridors connecting zones
    CORRIDORS: [
        // Top horizontal corridors
        { x: 760, y: 310, width: 100, height: 160 },
        { x: 1540, y: 310, width: 100, height: 160 },
        // Bottom horizontal corridors
        { x: 760, y: 1120, width: 100, height: 160 },
        { x: 1540, y: 1120, width: 100, height: 160 },
        // Vertical corridors connecting row 1 & row 2
        { x: 340, y: 700, width: 160, height: 180 },
        { x: 1120, y: 700, width: 160, height: 180 },
        { x: 1900, y: 700, width: 160, height: 180 },
        // Vertical corridor connecting Ensamblaje (row 2) to Sala de Reuniones (row 3)
        { x: 1120, y: 1520, width: 160, height: 180 }
    ],

    // Interactive Task Stations
    STATIONS: [
        {
            id: 'task_epp',
            zoneId: 'recepcion',
            title: 'Protocolo de Seguridad y EPP Dieléctrico',
            shortName: 'Inducción EPP',
            x: 250, y: 450,
            badgeId: 'badge_welcome',
            points: 150,
            type: 'epp_quiz',
            icon: '🦺',
            qbotTip: '¡Bienvenido Técnico Aprendiz! Antes de tocar sistemas de 60V, selecciona los Equipos de Protección Personal (EPP) correctos para trabajar en una planta de vehículos eléctricos.'
        },
        {
            id: 'task_battery',
            zoneId: 'baterias',
            title: 'Armado de Pack de Baterías de Litio (60V)',
            shortName: 'Armar Batería Litio',
            x: 1180, y: 440,
            badgeId: 'badge_battery',
            points: 250,
            type: 'battery_pack',
            icon: '🔋',
            qbotTip: 'Para ensamblar un módulo saludable, selecciona únicamente las 6 celdas LiFePO4 con voltaje nominal óptimo (3.2V - 3.3V) y descarta las celdas dañadas o descargadas.'
        },
        {
            id: 'task_chassis',
            zoneId: 'chasis',
            title: 'Secuencia Estructural del Chasis Quantum',
            shortName: 'Ordenar Chasis',
            x: 1980, y: 440,
            badgeId: 'badge_chassis',
            points: 250,
            type: 'chassis_order',
            icon: '🏗️',
            qbotTip: 'El chasis debe construirse de abajo hacia arriba respetando el centro de gravedad. Coloca las 5 piezas estructurales en el orden de ingeniería correcto.'
        },
        {
            id: 'task_repair',
            zoneId: 'deposito',
            title: 'Resolución de Fallas: Arnés y Tornillería',
            shortName: 'Resolver Fallas',
            x: 380, y: 1260,
            badgeId: 'badge_repair',
            points: 250,
            type: 'fault_repair',
            icon: '🔧',
            qbotTip: '¡Alerta en logística! Detectamos un módulo con cables de potencia desconectados y pernos de sujeción flojos. Conecta cada color con su terminal y ajusta los 4 pernos.'
        },
        {
            id: 'task_assembly',
            zoneId: 'ensamblaje',
            title: 'Ensamblaje Guiado del Vehículo Quantum E4',
            shortName: 'Ensamblaje Final',
            x: 1200, y: 1260,
            badgeId: 'badge_assembly',
            points: 300,
            type: 'car_assembly',
            icon: '🚗',
            qbotTip: '¡Hora de dar vida al Quantum E4! Completa los 4 pasos guiados de integración electromecánica en la plataforma elevadora.'
        },
        {
            id: 'task_qa',
            zoneId: 'pruebas',
            title: 'Prueba Final en Dinamómetro y Calidad (QA)',
            shortName: 'Prueba de Calidad',
            x: 1980, y: 1260,
            badgeId: 'badge_qa',
            points: 300,
            type: 'quality_test',
            icon: '📊',
            qbotTip: 'Calibra los 3 sistemas críticos dentro de la zona verde óptima y ejecuta el test de rodaje para certificar el vehículo Quantum.'
        },
        {
            id: 'task_meeting',
            zoneId: 'reuniones',
            title: 'Junta de Ingeniería: Hoja de Ruta Quantum',
            shortName: 'Sala de Reuniones',
            x: 1200, y: 2170,
            badgeId: 'badge_meeting',
            points: 250,
            type: 'meeting_plan',
            icon: '🚨',
            qbotTip: '¡Reunión de equipo en la mesa central! Aprueba los 4 pilares estratégicos de fabricación sostenible de Quantum Motors y descarta las propuestas contaminantes.'
        }
    ]
};
