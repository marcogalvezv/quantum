# Quantum Crew — Project Context & History Summary

Use this file on a new computer to give the AI assistant full context of everything built so far.

## 1. Project Overview
- **Name**: Quantum Crew: Ensambladora Quantum Motors (Bolivia)
- **Genre**: Educational cooperative multiplayer game (up to 6 players) inspired by *Among Us* and **Quantum Motors** (electric vehicle manufacturer in Cochabamba, Bolivia).
- **Tech Stack**: Pure HTML5 Canvas, CSS3, and modular ES6+ JavaScript (`window.QuantumGame` namespace so it works both via direct double-click on `index.html` and when hosted on a web server), plus a zero-dependency Node.js RFC 6455 WebSocket + HTTP server (`server.js`).

## 2. Key Features Implemented
1. **7 Factory Sections (`assets/FactoryAssets.js` & `js/world/Renderer.js`)**:
   - **1. Recepción y Bienvenida (`recepcion`)**: Safety lockers (EPP), curved reception desk with dual monitors, CO2 extinguisher stand, potted plants, and rotating showroom pod featuring a scale model of the Quantum E2.
   - **2. Área de Baterías y Sistemas Eléctricos (`baterias`)**: BMS oscilloscope console with live animated sine wave and rotating cooling fans, 3D cylindrical LiFePO4 battery racks with copper busbars, and high-voltage EV cables.
   - **3. Zona de Chasis y Estructura (`chasis`)**: CNC laser cutter with moving gantry and laser spark, KUKA-style articulated welding robot arm with animated sparks welding a tubular spaceframe chassis, and engineering blueprint drafting table.
   - **4. Estación de Ensamblaje Final (`ensamblaje`)**: Central hydraulic 4-post lift with progressive visual assembly of the **Quantum E4** electric vehicle, conveyor belt rollers, and two dual-gripper assembly robots.
   - **5. Zona de Pruebas de Calidad (`pruebas`)**: Dynamometer bay with 3D spinning rollers and wind-tunnel fan, IP65 rain test arch with animated water sprays/ripples, and QA certification traffic light tower.
   - **6. Depósito y Logística (`deposito`)**: Multi-level pallet shelves with illustrated brushless motors, sinusoidal inverters, tires/rims, mechanic's workbench, and detailed electric forklift carrying a wooden pallet.
   - **7. Sala de Reuniones y Estrategia (`reuniones`)**: Oval boardroom table with 8 swivel chairs, laptops, and central *Among Us*-style briefing button under a glass dome, plus an Agile Scrum Kanban board and coffee/water station.

2. **7 Interactive Educational Mini-Games (`js/missions/MissionManager.js`)**:
   - `epp_quiz`: Select the 4 dielectric PPE items and avoid conductive hazards.
   - `battery_pack`: Select 6 healthy LiFePO4 cells (3.2V–3.3V) and reject faulty cells.
   - `chassis_order`: Assemble the 5 structural chassis components in engineering sequence.
   - `fault_repair`: Connect +60V, GND, and CAN-Bus wires and torque 4 loose M10 bolts.
   - `car_assembly`: 4-step guided integration of the Quantum E4.
   - `quality_test`: Calibrate regenerative braking, dielectric insulation, and urban top speed on the dyno.
   - `meeting_plan`: Approve the 4 sustainable engineering pillars in the Boardroom.

3. **Character Customization & Custom Face Photo (`js/main.js` & `js/world/Renderer.js`)**:
   - Characters are scaled at `1.45x` with an enlarged helmet visor window.
   - Players can upload a photo (`📁 Subir Foto`) or capture a webcam selfie (`📷 Usar Cámara`) in the Lobby (`112x112` center-cropped JPEG), which renders inside their crewmate helmet visor and syncs across multiplayer.

4. **Hybrid Real-Time Multiplayer (`js/networking/NetworkManager.js` & `server.js`)**:
   - Auto-detects `wss://` or `ws://` when hosted online (e.g., Render.com).
   - Falls back to `BroadcastChannel` for instant multi-tab multiplayer without a server.
   - Includes cooperative AI Apprentice Bots to fill the squad up to 6 players.
