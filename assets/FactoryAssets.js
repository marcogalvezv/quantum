/**
 * PIL Andina S.A. Educational Game - Assets, Map Layout & Dairy Processing Content
 * Inspired by Planta Industrial PIL Andina (Cochabamba / Bolivia) - Leaders in Dairy Nutrition
 */
window.QuantumGame = window.QuantumGame || {};

window.QuantumGame.FactoryAssets = {
    // Crewmate colors (Among Us style with PIL Andina hygienic dairy technician vibe)
    PLAYER_COLORS: [
        { id: 'cyan', name: 'Azul PIL Clásico', body: '#0284c7', shadow: '#0369a1', visor: '#e0f2fe' },
        { id: 'white', name: 'Blanco Pasteurizado', body: '#f8fafc', shadow: '#cbd5e1', visor: '#bae6fd' },
        { id: 'pink', name: 'Yogur Frutilla', body: '#ec4899', shadow: '#be185d', visor: '#fce7f3' },
        { id: 'orange', name: 'Yogur Durazno', body: '#f97316', shadow: '#c2410c', visor: '#ffedd5' },
        { id: 'green', name: 'Verde Cuenca Lechera', body: '#10b981', shadow: '#047857', visor: '#d1fae5' },
        { id: 'yellow', name: 'Amarillo Mantequilla', body: '#eab308', shadow: '#a16207', visor: '#fef9c3' }
    ],

    EMOTES: [
        { id: 'milk', icon: '🥛', label: '¡Leche lista!' },
        { id: 'yogurt', icon: '🍓', label: '¡Fermentando yogur!' },
        { id: 'cold', icon: '❄️', label: '¡Cadena de frío 4°C!' },
        { id: 'check', icon: '✅', label: '¡Inocuidad aprobada!' },
        { id: 'pack', icon: '📦', label: '¡Bolsa azul envasada!' },
        { id: 'celebrate', icon: '🇧🇴', label: '¡Orgullo PIL Bolivia!' }
    ],

    BADGES: [
        { id: 'badge_welcome', icon: '🥼', title: 'Inducción Sanitaria BPM', desc: 'Buenas Prácticas de Manufactura: cofia, barbijo, mandil y botas' },
        { id: 'badge_battery', icon: '🧪', title: 'Analista de Leche Cruda', desc: 'Acidez Dornic (14-18°D) y densidad certificada en cisternas' },
        { id: 'badge_chassis', icon: '🌡️', title: 'Maestro Pasteurizador HTST', desc: 'Ciclo térmico a 72°C por 15s y choque de frío a 4°C' },
        { id: 'badge_repair', icon: '🔧', title: 'Especialista en Línea CIP', desc: 'Acople de tuberías clamp de acero inoxidable y válvulas sanitarias' },
        { id: 'badge_assembly', icon: '🥛', title: 'Operador Bolsa Azul PIL', desc: 'Envasado aséptico continuo de 946ml con termosellado hermético' },
        { id: 'badge_qa', icon: '❄️', title: 'Guardián Cadena de Frío', desc: 'Cámara frigorífica a 2-4°C y control de pH en yogur probiótico' },
        { id: 'badge_meeting', icon: '🛡️', title: 'Comité de Inocuidad HACCP', desc: 'Lote nacional aprobado para distribución segura en Bolivia' }
    ],

    // World dimensions
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 2400,

    // 7 Factory Sections inspired by Planta Industrial PIL Andina Bolivia
    ZONES: [
        {
            id: 'recepcion',
            name: '1. Recepción y Buenas Prácticas (BPM)',
            subtitle: 'Descarga de Cisternas y Filtro Sanitario',
            x: 80, y: 80, width: 680, height: 620,
            floorColor: '#0f172a',
            accentColor: '#38bdf8',
            icon: '🏢',
            description: 'Punto de ingreso a la planta PIL Andina. Los técnicos se colocan indumentaria estéril (cofia, barbijo, mandil blanco y botas) antes de ingresar a la zona de procesamiento.',
            signage: {
                x: 420, y: 210,
                title: 'HISTORIA PIL ANDINA',
                fact: 'Fundada en Cochabamba en 1960, PIL Andina es el corazón lechero de Bolivia, recolectando millones de litros de leche fresca de los valles y el altiplano boliviano.'
            }
        },
        {
            id: 'baterias',
            name: '2. Pasteurización HTST y Homogeneizado',
            subtitle: 'Intercambiadores de Placas Térmicas a 72°C',
            x: 860, y: 80, width: 680, height: 620,
            floorColor: '#0c2340',
            accentColor: '#0284c7',
            icon: '🌡️',
            description: 'Tratamiento térmico HTST (High Temperature Short Time). La leche se calienta a 72°C por 15 segundos para eliminar patógenos sin alterar sus nutrientes naturales.',
            signage: {
                x: 1200, y: 210,
                title: 'PASTEURIZACIÓN HTST',
                fact: 'La pasteurización a 72°C por 15 segundos elimina bacterias dañinas preservando las proteínas, calcio y vitaminas. Luego se homogeneiza a 180 bar para una textura perfecta.'
            }
        },
        {
            id: 'chasis',
            name: '3. Silos de Leche y Limpieza CIP',
            subtitle: 'Silos Verticales de Acero Inox 50.000 L',
            x: 1640, y: 80, width: 680, height: 620,
            floorColor: '#1e293b',
            accentColor: '#06b6d4',
            icon: '🏗️',
            description: 'Área de almacenamiento en grandes silos isotérmicos de acero inoxidable a 4°C, con sistema automatizado CIP (Clean-In-Place) para lavado y desinfección total.',
            signage: {
                x: 1980, y: 210,
                title: 'SISTEMA SANITARIO CIP',
                fact: 'El sistema CIP (Clean-In-Place) recircula soluciones alcalinas y ácidas a alta velocidad por todas las tuberías de acero inoxidable, garantizando asepsia absoluta.'
            }
        },
        {
            id: 'deposito',
            name: '6. Mantenimiento y Conexiones Sanitarias',
            subtitle: 'Válvulas Neumáticas, Bombas y Juntas Clamp',
            x: 80, y: 880, width: 680, height: 640,
            floorColor: '#1e1b4b',
            accentColor: '#818cf8',
            icon: '🔧',
            description: 'Taller de ingeniería y mantenimiento sanitario de bombas lobulares, válvulas mariposa y empaques de grado alimenticio para evitar fugas de leche.',
            signage: {
                x: 420, y: 1010,
                title: 'TUBERÍAS SANITARIAS CLAMP',
                fact: 'En la industria láctea no se usan roscas comunes que acumulan bacterias; se emplean abrazaderas tipo Clamp Tri-Clover con pulido sanitario espejo.'
            }
        },
        {
            id: 'ensamblaje',
            name: '4. Línea de Envasado Leche Bolsa Azul PIL',
            subtitle: 'Envasadoras Asépticas Verticales (946 ml)',
            x: 860, y: 880, width: 680, height: 640,
            floorColor: '#0a2540',
            accentColor: '#38bdf8',
            icon: '🥛',
            description: 'Línea de envasado del producto más icónico de Bolivia: la Leche Pasteurizada PIL en Bolsa Azul. Envasado aséptico continuo en película tricapa con barrera UV.',
            signage: {
                x: 1200, y: 1010,
                title: 'LA BOLSA AZUL DE PIL',
                fact: 'La bolsa azul de Leche PIL tiene un film tricapa que protege la leche de la luz ultravioleta y el oxígeno, conservando la frescura y el sabor natural del campo.'
            }
        },
        {
            id: 'pruebas',
            name: '5. Planta de Yogur y Laboratorio de Calidad',
            subtitle: 'Fermentación Probiótica y Control Físico-Químico',
            x: 1640, y: 880, width: 680, height: 640,
            floorColor: '#143825',
            accentColor: '#34d399',
            icon: '🍓',
            description: 'Tanques de fermentación de Yogur PIL (Frutilla y Durazno) inoculados con Lactobacillus bulgaricus, junto a pruebas de pH, acidez y ausencia de antibióticos.',
            signage: {
                x: 1980, y: 1010,
                title: 'YOGUR PROBIÓTICO PIL',
                fact: 'El yogur PIL fermenta a 42°C hasta alcanzar un pH de 4.5. Contiene cultivos vivos que fortalecen la flora intestinal y mejoran la digestión.'
            }
        },
        {
            id: 'reuniones',
            name: '7. Sala de Inocuidad y Comité HACCP',
            subtitle: 'Comité de Calidad, SENASAG y Trazabilidad',
            x: 860, y: 1700, width: 680, height: 620,
            floorColor: '#1a103c',
            accentColor: '#f43f5e',
            icon: '🛡️',
            description: 'Sala de control donde el equipo evalúa puntos críticos de control (HACCP), certifica lotes de producción y coordina la distribución a toda Bolivia.',
            signage: {
                x: 1200, y: 1830,
                title: 'SISTEMA HACCP Y SENASAG',
                fact: 'El sistema HACCP vigila los Puntos Críticos de Control (PCC): temperatura de pasteurización, detección de metales y hermeticidad de sellado de cada bolsa.'
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
        // Vertical corridor connecting Envasado (row 2) to Sala de Inocuidad (row 3)
        { x: 1120, y: 1520, width: 160, height: 180 }
    ],

    // Interactive Task Stations
    STATIONS: [
        {
            id: 'task_epp',
            zoneId: 'recepcion',
            title: 'Protocolo Sanitario BPM e Inducción PIL',
            shortName: 'Filtro Sanitario BPM',
            x: 250, y: 450,
            badgeId: 'badge_welcome',
            points: 150,
            type: 'epp_quiz',
            icon: '🥼',
            qbotTip: '¡Bienvenido Técnico Lácteo! Antes de ingresar a la planta PIL, equípate con la indumentaria sanitaria obligatoria (BPM) para proteger la inocuidad de la leche.'
        },
        {
            id: 'task_battery',
            zoneId: 'baterias',
            title: 'Control de Calidad de Leche Cruda en Cisterna',
            shortName: 'Análisis de Leche',
            x: 1180, y: 440,
            badgeId: 'badge_battery',
            points: 250,
            type: 'battery_pack',
            icon: '🧪',
            qbotTip: 'Analiza las muestras de las cisternas. Acepta solo la leche fresca con acidez óptima (14°D - 18°D Dornic) y temperatura fría, descartando las muestras alteradas.'
        },
        {
            id: 'task_chassis',
            zoneId: 'chasis',
            title: 'Secuencia del Proceso de Pasteurización HTST',
            shortName: 'Ciclo Pasteurización',
            x: 1980, y: 440,
            badgeId: 'badge_chassis',
            points: 250,
            type: 'chassis_order',
            icon: '🌡️',
            qbotTip: 'Ordena las 5 etapas del circuito de pasteurización continua de leche: desde la clarificación hasta el choque térmico y enfriamiento a 4°C.'
        },
        {
            id: 'task_repair',
            zoneId: 'deposito',
            title: 'Mantenimiento Sanitario: Tuberías y Abrazaderas Clamp',
            shortName: 'Tuberías Sanitarias',
            x: 380, y: 1260,
            badgeId: 'badge_repair',
            points: 250,
            type: 'fault_repair',
            icon: '🔧',
            qbotTip: '¡Alerta en la línea de recirculación! Conecta las líneas de acero inoxidable y ajusta las abrazaderas clamp tri-clover con empaques sanitarios.'
        },
        {
            id: 'task_assembly',
            zoneId: 'ensamblaje',
            title: 'Línea de Envasado Aséptico Leche PIL en Bolsa Azul',
            shortName: 'Envasar Bolsa Azul',
            x: 1200, y: 1260,
            badgeId: 'badge_assembly',
            points: 300,
            type: 'car_assembly',
            icon: '🥛',
            qbotTip: '¡Hora de producir la famosa Bolsa Azul de PIL! Sigue los 4 pasos guiados de esterilización UV, llenado volumétrico a 946ml y sellado térmico.'
        },
        {
            id: 'task_qa',
            zoneId: 'pruebas',
            title: 'Monitoreo de Cadena de Frío y Fermentación de Yogur',
            shortName: 'Cámara Fría y Yogur',
            x: 1980, y: 1260,
            badgeId: 'badge_qa',
            points: 300,
            type: 'quality_test',
            icon: '❄️',
            qbotTip: 'Calibra los parámetros críticos de calidad: temperatura de cámara fría (2-4°C), pH de fermentación del yogur y prueba de fosfatasa negativa.'
        },
        {
            id: 'task_meeting',
            zoneId: 'reuniones',
            title: 'Comité de Inocuidad HACCP: Certificación de Lote PIL',
            shortName: 'Comité HACCP PIL',
            x: 1200, y: 2170,
            badgeId: 'badge_meeting',
            points: 250,
            type: 'meeting_plan',
            icon: '🚨',
            qbotTip: '¡Reunión del Comité de Inocuidad en la mesa de control! Aprueba los 4 pilares de seguridad alimentaria y trazabilidad de PIL Andina S.A.'
        }
    ]
};
