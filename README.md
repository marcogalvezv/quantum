# ⚡ Quantum Crew: Ensambladora Quantum Motors (Bolivia)

Videojuego educativo multijugador cooperativo estilo **Among Us**, desarrollado íntegramente con **HTML5 Canvas, CSS3 y JavaScript (ES6+)** sin dependencias externas.

Hasta **6 Técnicos Aprendices Quantum** ingresan simultáneamente a la planta automotriz inspirada en **Quantum Motors (Cochabamba, Bolivia)** para aprender sobre movilidad eléctrica y ensamblar un vehículo eléctrico **Quantum E4**.

---

## 📁 Estructura Modular del Proyecto

```text
quantum-motors-game/
├── index.html                  # Punto de entrada principal (ejecutable con doble clic)
├── server.js                   # Servidor WebSocket nativo (RFC 6455) sin paquetes npm
├── README.md                   # Documentación y guía de uso
├── css/
│   └── styles.css              # Interfaz HUD minimalista, lobby y modales de mini-misiones
├── assets/
│   └── FactoryAssets.js        # Mapa de 6 zonas, estaciones, señalética, colores e insignias
└── js/
    ├── audio/
    │   └── SoundManager.js     # Sintetizador Web Audio API (música ambiental y efectos mecánicos)
    ├── networking/
    │   └── NetworkManager.js   # Sincronización WebSockets + BroadcastChannel + Bots IA (hasta 6 jugadores)
    ├── entities/
    │   ├── Player.js           # Controlador de personajes estilo Among Us con casco de seguridad
    │   └── RobotGuide.js       # Robot guía "Q-BOT" con narrativa contextual por sección
    ├── world/
    │   ├── FactoryMap.js       # Colisiones, pasillos, estaciones interactivas y señalética
    │   └── Renderer.js         # Motor gráfico HTML5 Canvas 2D y minimapa en tiempo real
    └── missions/
        └── MissionManager.js   # 6 mini-juegos educativos cooperativos
```

---

## 🚀 Cómo Ejecutar el Juego en el Navegador (Sin Instalar Nada)

### Opción 1: Ejecución Instantánea sin Servidor (Doble Clic / Multi-Pestaña)
1. Abre directamente el archivo **`index.html`** con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox, Safari).
2. Elige tu nombre de **Técnico Aprendiz**, color de traje, código de sala (ej. `QM-2026`) y haz clic en **"Ingresar a la Planta Quantum Motors"**.
3. **Para probar el multijugador en tiempo real sin servidor**: abre **`index.html`** en **2 a 6 pestañas o ventanas** del navegador con el mismo código de sala. ¡Los movimientos, emojis, chat y tareas completadas se sincronizan instantáneamente!

### Opción 2: Servidor WebSocket en Red Local / Aula (`server.js`)
Si deseas conectar hasta 6 computadoras distintas en una red local (LAN) usando WebSockets puros sin instalar `node_modules`:
```bash
node server.js
```
Luego abre `http://localhost:8080` (o la IP local del equipo anfitrión) en los navegadores.

---

## 🎮 Controles y Jugabilidad

- **Movimiento**: Teclas `W`, `A`, `S`, `D` o **Flechas del teclado** (también puedes hacer clic en el mapa para caminar hacia un punto).
- **Interactuar con Estaciones y Señalética**: Presiona la tecla **`[E]`**, **`[Espacio]`**, haz clic en el botón grande **`USAR [E]`** de la esquina inferior derecha, o haz clic directamente sobre la estación cuando estés cerca.
- **Señales y Chat**: Usa la barra de emojis rápidos (`⚡`, `🔧`, `🚗`, `✅`, `🔋`, `🇧🇴`) o el chat de equipo en la esquina inferior izquierda.

---

## 🏭 Las 6 Zonas Educativas y Retos de Ingeniería

1. **Recepción y Bienvenida (`Inducción EPP`)**: Seleccionar los 4 Equipos de Protección Personal dieléctricos obligatorios antes de manipular sistemas de 60V.
2. **Área de Baterías y Sistemas Eléctricos (`Armar Batería Litio`)**: Identificar 6 celdas LiFePO4 con voltaje nominal saludable (`3.2V - 3.3V`) y descartar celdas sobrecalentadas o en cortocircuito junto al sistema BMS.
3. **Zona de Chasis y Estructura (`Ordenar Chasis`)**: Soldar en secuencia lógica las 5 piezas estructurales del chasis tubular adaptado a la topografía andina.
4. **Depósito y Logística (`Resolver Fallas`)**: Diagnosticar y conectar cables de potencia (`+60V`, `GND`, `CAN-Bus`) y ajustar 4 pernos M10 flojos con torque de 45 Nm.
5. **Estación de Ensamblaje Final (`Ensamblaje Final`)**: Integrar paso a paso el motor eléctrico *brushless*, banco de litio, carrocería ecológica y tablero digital del **Quantum E4**.
6. **Zona de Pruebas de Calidad (`Prueba de Calidad`)**: Calibrar freno regenerativo, aislamiento dieléctrico y velocidad máxima urbana en el dinamómetro para certificar el vehículo.
