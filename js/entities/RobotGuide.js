/**
 * RobotGuide.js - "PIL-BOT" Educational Robot Companion
 * Follows the technician around the dairy plant at a polite distance and explains each PIL Andina section
 */
window.QuantumGame = window.QuantumGame || {};

class RobotGuide {
    constructor() {
        this.name = 'PIL-BOT Guía';
        this.x = 420;
        this.y = 330;
        this.hoverOffset = 0;
        this.currentZoneId = null;
        this.currentMessage = '¡Hola Técnico Lácteo! Soy PIL-BOT. Explora las secciones de la planta industrial PIL Andina con WASD o flechas y presiona [E] o haz clic en las estaciones.';
        this.visitedZones = new Set();
    }

    update(dt, player, factoryMap, onZoneChange) {
        this.hoverOffset = Math.sin(performance.now() * 0.005) * 6;

        // Smoothly float toward a spot slightly behind/above the player
        const targetX = player.x - (player.facing * 58);
        const targetY = player.y - 42;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 15) {
            this.x += dx * Math.min(1, dt * 3.8);
            this.y += dy * Math.min(1, dt * 3.8);
        }

        // Detect which zone the player is currently inside
        const zone = factoryMap.getZoneAt(player.x, player.y);
        if (zone && zone.id !== this.currentZoneId) {
            this.currentZoneId = zone.id;
            this.visitedZones.add(zone.id);
            this.currentMessage = `${zone.icon} ${zone.name}: ${zone.description}`;
            if (onZoneChange) {
                onZoneChange(zone, this.currentMessage);
            }
        }
    }
}

window.QuantumGame.RobotGuide = RobotGuide;

