/**
 * SoundManager.js - Procedural Web Audio API Sound & Music Engine
 * Generates mechanical factory ambiance, light electronic background music, and UI/task sound effects
 */
window.QuantumGame = window.QuantumGame || {};

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicPlaying = false;
        this.musicInterval = null;
        this.ambientGain = null;
        this.stepCooldown = 0;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.muted;
    }

    playTone(freq, type = 'sine', duration = 0.15, vol = 0.12, slideTo = null) {
        if (this.muted) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        }

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    playStep() {
        const now = performance.now();
        if (now - this.stepCooldown < 240) return;
        this.stepCooldown = now;
        // Soft among-us style footstep tap
        this.playTone(110 + Math.random() * 35, 'triangle', 0.06, 0.05, 65);
    }

    playTalkSyllable() {
        const now = performance.now();
        if (now - (this.talkCooldown || 0) < 115) return;
        this.talkCooldown = now;
        // Expressive cartoon speech syllable ("Animal Crossing / Crewmate" style voice bleep)
        const baseFreq = 240 + Math.random() * 190;
        const targetFreq = baseFreq + (Math.random() * 140 - 70);
        this.playTone(baseFreq, 'triangle', 0.085, 0.09, Math.max(150, targetFreq));
    }

    playClick() {
        this.playTone(520, 'sine', 0.08, 0.1, 780);
    }

    playMechanicalRatchet() {
        this.playTone(220, 'sawtooth', 0.07, 0.08, 340);
        setTimeout(() => this.playTone(320, 'square', 0.09, 0.07, 460), 60);
    }

    playWireZap() {
        this.playTone(680, 'sawtooth', 0.12, 0.09, 980);
    }

    playError() {
        this.playTone(200, 'sawtooth', 0.22, 0.12, 130);
    }

    playEmergencyAlarm() {
        if (this.muted) return;
        this.resume();
        if (!this.ctx) return;

        // Heavy introductory gong / impact
        this.playTone(130, 'triangle', 0.6, 0.25, 45);

        // Dramatic two-tone emergency klaxon pulses (Among Us style siren)
        const klaxonPairs = [
            { t: 80, f: 580, s: 780 },
            { t: 420, f: 780, s: 540 },
            { t: 800, f: 580, s: 780 },
            { t: 1150, f: 780, s: 540 },
            { t: 1520, f: 620, s: 840 },
            { t: 1880, f: 840, s: 520 }
        ];

        klaxonPairs.forEach(p => {
            setTimeout(() => {
                this.playTone(p.f, 'sawtooth', 0.28, 0.16, p.s);
            }, p.t);
        });
    }

    playVoteSound() {
        this.playTone(740, 'sine', 0.09, 0.12, 1050);
    }

    playTaskComplete() {
        // Cheerful chord fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((n, idx) => {
            setTimeout(() => {
                this.playTone(n, 'triangle', 0.28, 0.15);
            }, idx * 90);
        });
    }

    playVictoryFanfare() {
        const melody = [
            { f: 523.25, d: 0.18, t: 0 },
            { f: 659.25, d: 0.18, t: 180 },
            { f: 783.99, d: 0.18, t: 360 },
            { f: 1046.5, d: 0.45, t: 540 },
            { f: 783.99, d: 0.18, t: 850 },
            { f: 1046.5, d: 0.60, t: 1050 }
        ];
        melody.forEach(m => {
            setTimeout(() => this.playTone(m.f, 'triangle', m.d, 0.18), m.t);
        });
    }

    startMusic() {
        if (this.muted || this.musicPlaying) return;
        this.resume();
        this.musicPlaying = true;

        // Light futuristic marimba/synth loop suitable for an educational factory
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        let step = 0;

        this.musicInterval = setInterval(() => {
            if (this.muted || !this.musicPlaying) return;
            const note = scale[(step * 2 + (step % 3)) % scale.length];
            this.playTone(note, 'sine', 0.35, 0.025);
            if (step % 4 === 0) {
                // Soft bass pulse
                this.playTone(130.81, 'triangle', 0.45, 0.03);
            }
            step++;
        }, 550);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

window.QuantumGame.SoundManager = SoundManager;
