/**
 * Player.js - Crewmate Character Controller ("Técnico Aprendiz Quantum")
 * Handles WASD/Arrow movement, collision resolution, walk cycle animation, and emotes
 */
window.QuantumGame = window.QuantumGame || {};

class Player {
    constructor(config = {}) {
        this.id = config.id || 'local';
        this.name = config.name || 'Aprendiz Quantum';
        this.colorId = config.colorId || 'cyan';
        this.x = config.x || 350;
        this.y = config.y || 360;
        this.radius = 22;
        this.speed = 240; // pixels per second
        this.facing = 1;  // 1 = right, -1 = left
        this.isMoving = false;
        this.animTime = 0;
        this.emote = null;
        this.emoteTimer = 0;
        this.targetClickPos = null;
        this.avatar = config.avatar || null;
    }

    setEmote(icon, duration = 3.5) {
        this.emote = icon;
        this.emoteTimer = duration;
    }

    update(dt, keys, factoryMap, soundManager) {
        if (this.emoteTimer > 0) {
            this.emoteTimer -= dt;
            if (this.emoteTimer <= 0) {
                this.emote = null;
            }
        }

        let dx = 0;
        let dy = 0;

        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

        // If keyboard input is pressed, cancel click-to-walk target
        if (dx !== 0 || dy !== 0) {
            this.targetClickPos = null;
        } else if (this.targetClickPos) {
            let aimX = this.targetClickPos.x;
            let aimY = this.targetClickPos.y;

            // If target is in a different room, align with corridor centerlines first so player walks through doorways
            const diffX = Math.abs(aimX - this.x);
            const diffY = Math.abs(aimY - this.y);
            if (this.y > 1600 && aimY < 1600) {
                // Exiting Sala de Reuniones upward through x=1200
                if (Math.abs(this.x - 1200) > 35) {
                    aimX = 1200;
                    aimY = this.y;
                } else {
                    aimX = 1200;
                    aimY = 1200;
                }
            } else if (aimY > 1600 && this.y < 1600) {
                // Entering Sala de Reuniones: first reach x=1200 via horizontal corridor
                if (Math.abs(this.x - 1200) > 40) {
                    const corridorY = this.y < 790 ? 390 : 1200;
                    if (Math.abs(this.y - corridorY) > 35) {
                        aimX = this.x;
                        aimY = corridorY;
                    } else {
                        aimX = 1200;
                        aimY = corridorY;
                    }
                } else {
                    aimX = 1200;
                }
            } else if (diffX > 260) {
                const corridorY = this.y < 790 ? 390 : 1200;
                if (Math.abs(this.y - corridorY) > 35) {
                    aimX = this.x;
                    aimY = corridorY;
                }
            } else if (diffY > 260) {
                const colX = this.x < 810 ? 420 : (this.x < 1590 ? 1200 : 1980);
                if (Math.abs(this.x - colX) > 35) {
                    aimX = colX;
                    aimY = this.y;
                }
            }

            const tdx = aimX - this.x;
            const tdy = aimY - this.y;
            const dist = Math.hypot(this.targetClickPos.x - this.x, this.targetClickPos.y - this.y);
            if (dist > 12) {
                const stepLen = Math.hypot(tdx, tdy) || 1;
                dx = tdx / stepLen;
                dy = tdy / stepLen;
            } else {
                this.targetClickPos = null;
            }
        }

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            const nextX = this.x + dx * this.speed * dt;
            const nextY = this.y + dy * this.speed * dt;

            // Axis-separated collision check for smooth sliding along walls
            if (factoryMap.isWalkable(nextX, this.y, this.radius)) {
                this.x = nextX;
            }
            if (factoryMap.isWalkable(this.x, nextY, this.radius)) {
                this.y = nextY;
            }

            if (Math.abs(dx) > 0.05) {
                this.facing = dx > 0 ? 1 : -1;
            }

            this.isMoving = true;
            this.animTime += dt * 12;
            if (soundManager) soundManager.playStep();
        } else {
            this.isMoving = false;
            this.animTime = 0;
        }
    }
}

window.QuantumGame.Player = Player;
