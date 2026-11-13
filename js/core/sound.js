// 2. SYNTHÉTISEUR AUDIO WEB API (ZÉRO FICHIER EXTERNE)
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.8;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.6;
        this.roarIntensity = 0.85;
        this.boneCrunchEnabled = true;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this._musicInterval = null;
        this._musicStep = 0;
        this._musicMode = 'menu';
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && !this.masterGain) {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    get destination() {
        this.init();
        return this.sfxGain || (this.ctx ? this.ctx.destination : null);
    }
    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, Number(val)));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime);
        }
    }
    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, Number(val)));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
    }
    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, Number(val)));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
    }
    setRoarIntensity(val) {
        this.roarIntensity = Math.max(0, Math.min(1, Number(val)));
    }
    setBoneCrunchEnabled(enabled) {
        this.boneCrunchEnabled = Boolean(enabled);
    }
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.enabled ? this.masterVolume : 0, this.ctx.currentTime);
        }
        if (!this.enabled) {
            this.stopMusicLoop();
        }
    }
    startMusicLoop(mode = 'menu') {
        this._musicMode = mode;
        if (!this.enabled || this._musicInterval) return;
        this.init();
        if (!this.ctx || !this.musicGain) return;

        const playStep = () => {
            if (!this.enabled || !this.ctx || !this.musicGain || this.musicVolume <= 0.01) return;
            if (this.ctx.state === 'suspended') return;
            const now = this.ctx.currentTime;
            const step = this._musicStep % 8;
            this._musicStep++;

            const isBattle = this._musicMode === 'battle';
            // Battement de tambour tribal grave sur les temps forts
            if (step === 0 || step === 4 || (isBattle && (step === 3 || step === 6))) {
                const drumOsc = this.ctx.createOscillator();
                const drumGain = this.ctx.createGain();
                drumOsc.type = 'sine';
                const baseFreq = step === 0 ? 78 : (isBattle ? 64 : 56);
                drumOsc.frequency.setValueAtTime(baseFreq, now);
                drumOsc.frequency.exponentialRampToValueAtTime(32, now + 0.24);
                const amp = (step === 0 ? 0.20 : 0.12) * (isBattle ? 1.0 : 0.65);
                drumGain.gain.setValueAtTime(amp, now);
                drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
                drumOsc.connect(drumGain);
                drumGain.connect(this.musicGain);
                drumOsc.start(now);
                drumOsc.stop(now + 0.27);
            }
            // Bourdon atmosphérique primitif (toutes les 4 pulsations)
            if (step === 0) {
                const droneOsc = this.ctx.createOscillator();
                const droneFilter = this.ctx.createBiquadFilter();
                const droneGain = this.ctx.createGain();
                droneOsc.type = 'triangle';
                droneOsc.frequency.setValueAtTime(isBattle ? 55 : 49, now);
                droneFilter.type = 'lowpass';
                droneFilter.frequency.setValueAtTime(180, now);
                droneGain.gain.setValueAtTime(0.001, now);
                droneGain.gain.linearRampToValueAtTime(isBattle ? 0.07 : 0.05, now + 0.4);
                droneGain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);
                droneOsc.connect(droneFilter);
                droneFilter.connect(droneGain);
                droneGain.connect(this.musicGain);
                droneOsc.start(now);
                droneOsc.stop(now + 1.9);
            }
        };

        this._musicInterval = setInterval(playStep, 480);
    }
    stopMusicLoop() {
        if (this._musicInterval) {
            clearInterval(this._musicInterval);
            this._musicInterval = null;
        }
    }
    playHit(heavy = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = heavy ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(heavy ? 130 : 210, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + (heavy ? 0.25 : 0.12));
        gain.gain.setValueAtTime(heavy ? 0.45 : 0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.26 : 0.13));
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + (heavy ? 0.27 : 0.14));
    }
    playWhoosh() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.16);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.17);
    }
    playThunder() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Bruit blanc filtré pour un tonnerre réaliste
        const bufSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(45, now + 0.8);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.destination);
        noise.start(now);
    }
    playStinger() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.23);
    }
    playRoar(pitch = 95, duration = 0.45) {
        if (!this.enabled) return;
        const roarScale = (typeof window !== 'undefined' && typeof window.roarIntensity === 'number')
            ? window.roarIntensity
            : this.roarIntensity;
        if (roarScale <= 0.01) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(pitch * 1.3, now);
        osc.frequency.linearRampToValueAtTime(pitch * 0.65, now + duration);

        lfo.frequency.value = 38;
        lfoGain.gain.value = 25;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.35 * roarScale, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
    }
    playSauropodCall() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [95, 190, 285];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(f * 0.88, now);
            osc.frequency.exponentialRampToValueAtTime(f * 1.28, now + 1.2);
            osc.frequency.exponentialRampToValueAtTime(f * 0.78, now + 3.4);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(340, now);
            filter.frequency.linearRampToValueAtTime(680, now + 1.3);
            filter.frequency.linearRampToValueAtTime(220, now + 3.4);

            const amp = idx === 0 ? 0.22 : 0.12 / idx;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(amp, now + 0.8);
            gain.gain.setValueAtTime(amp, now + 1.8);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.destination);

            osc.start(now);
            osc.stop(now + 3.7);
        });
    }
    playGong() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [110, 165, 220, 277].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 1.1);
            gain.gain.setValueAtTime(0.18 / (idx + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(now);
            osc.stop(now + 1.2);
        });
    }
    playBoneCrack() {
        const boneAllowed = (typeof window !== 'undefined' && typeof window.boneCrunchEnabled === 'boolean')
            ? window.boneCrunchEnabled
            : this.boneCrunchEnabled;
        if (!this.enabled || !boneAllowed) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        noise.connect(gain);
        gain.connect(this.destination);
        noise.start(now);
    }
    playCooldownWarning() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(140, now + 0.05);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }
    playMenuClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }
    playSliderTick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }
    playTabSwitch() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }
    playResetSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [220, 180, 140].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            osc.frequency.exponentialRampToValueAtTime(60, now + idx * 0.07 + 0.12);
            gain.gain.setValueAtTime(0.2, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.13);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.14);
        });
    }
}

const sfx = new SoundEngine();
