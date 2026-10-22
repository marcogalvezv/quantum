/**
 * FactoryMap.js - Quantum Motors Factory Layout, Collisions, Signage & Interactive Objects
 */
window.QuantumGame = window.QuantumGame || {};

class FactoryMap {
    constructor() {
        const assets = window.QuantumGame.FactoryAssets;
        this.width = assets.WORLD_WIDTH;
        this.height = assets.WORLD_HEIGHT;
        this.zones = assets.ZONES;
        this.corridors = assets.CORRIDORS;
        this.stations = assets.STATIONS;
        this.completedTasks = new Set();
        this.taskAnimations = new Map(); // stationId -> animation progress timer
        this.envasadoraBroken = false; // Easter egg broken state
    }

    breakEnvasadora() {
        this.envasadoraBroken = true;
    }

    isWalkable(x, y, radius = 20) {
        const margin = radius * 0.55;
        // Check if circle center +/- margin lies inside any zone or corridor (with generous doorway overlap)
        const checkPoint = (px, py) => {
            for (const c of this.corridors) {
                if (px >= c.x - 32 && px <= c.x + c.width + 32 &&
                    py >= c.y - 32 && py <= c.y + c.height + 32) {
                    return true;
                }
            }
            for (const z of this.zones) {
                if (px >= z.x + 10 && px <= z.x + z.width - 10 &&
                    py >= z.y + 10 && py <= z.y + z.height - 10) {
                    return true;
                }
            }
            return false;
        };

        return (
            checkPoint(x - margin, y - margin) &&
            checkPoint(x + margin, y - margin) &&
            checkPoint(x - margin, y + margin) &&
            checkPoint(x + margin, y + margin)
        );
    }

    getZoneAt(x, y) {
        for (const z of this.zones) {
            if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
                return z;
            }
        }
        return null;
    }

    getNearestStation(x, y, maxDist = 105) {
        let nearest = null;
        let bestDist = maxDist;
        for (const st of this.stations) {
            const d = Math.hypot(st.x - x, st.y - y);
            if (d < bestDist) {
                bestDist = d;
                nearest = st;
            }
        }
        return nearest;
    }

    getNearestSignage(x, y, maxDist = 95) {
        let nearest = null;
        let bestDist = maxDist;
        for (const z of this.zones) {
            if (z.signage) {
                const d = Math.hypot(z.signage.x - x, z.signage.y - y);
                if (d < bestDist) {
                    bestDist = d;
                    nearest = { ...z.signage, zoneName: z.name, accentColor: z.accentColor };
                }
            }
        }
        return nearest;
    }

    markTaskCompleted(taskId) {
        this.completedTasks.add(taskId);
        this.taskAnimations.set(taskId, 4.0); // 4 seconds celebratory particle burst
    }

    update(dt) {
        for (const [id, time] of this.taskAnimations.entries()) {
            if (time > 0) {
                this.taskAnimations.set(id, time - dt);
            } else {
                this.taskAnimations.delete(id);
            }
        }
    }
}

window.QuantumGame.FactoryMap = FactoryMap;
