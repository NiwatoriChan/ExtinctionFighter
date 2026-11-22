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
    _jitter(base, pct = 0.08) {
        return base * (1 + (Math.random() * 2 - 1) * pct);
    }
    _ramp(param, value, endTime, linear = false) {
        if (!param) return;
        const safeVal = linear ? value : Math.max(0.0001, value);
        if (linear && typeof param.linearRampToValueAtTime === 'function') {
            param.linearRampToValueAtTime(safeVal, endTime);
        } else if (!linear && typeof param.exponentialRampToValueAtTime === 'function') {
            param.exponentialRampToValueAtTime(safeVal, endTime);
        } else if (typeof param.setValueAtTime === 'function') {
            param.setValueAtTime(safeVal, endTime);
        } else {
            param.value = safeVal;
        }
    }
    _isBoneCrunchAllowed() {
        return (typeof window !== 'undefined' && typeof window.boneCrunchEnabled === 'boolean')
            ? window.boneCrunchEnabled
            : this.boneCrunchEnabled;
    }
    _createNoiseBuffer(durationSec, decayPower = 0) {
        const sr = this.ctx.sampleRate || 44100;
        const len = Math.max(1, Math.floor(sr * durationSec));
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const env = decayPower > 0 ? Math.exp(-i / (len * decayPower)) : 1;
            data[i] = (Math.random() * 2 - 1) * env;
        }
        return buffer;
    }
    playSwing(isHeavy = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = isHeavy ? 0.22 : 0.13;

        // Couche 1 : Souffle d'air bruit filtré passe-bande
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(dur, 0.45);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        if (filter.Q) filter.Q.value = isHeavy ? 1.8 : 2.4;
        const startCut = this._jitter(isHeavy ? 920 : 1450, 0.08);
        const endCut = isHeavy ? 180 : 360;
        filter.frequency.setValueAtTime(startCut, now);
        this._ramp(filter.frequency, endCut, now + dur);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        this._ramp(nGain.gain, isHeavy ? 0.24 : 0.14, now + dur * 0.22, true);
        this._ramp(nGain.gain, 0.001, now + dur);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.destination);
        noise.start(now);

        // Couche 2 : Sifflement tonal descendant subtil
        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = isHeavy ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(this._jitter(isHeavy ? 225 : 340, 0.08), now);
        this._ramp(osc.frequency, isHeavy ? 62 : 115, now + dur);
        oGain.gain.setValueAtTime(isHeavy ? 0.16 : 0.09, now);
        this._ramp(oGain.gain, 0.001, now + dur);
        osc.connect(oGain);
        oGain.connect(this.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);
    }
    playHit(heavy = false, opts = {}) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const comboCount = (opts && typeof opts.comboCount === 'number' && opts.comboCount > 1)
            ? opts.comboCount
            : 1;
        // Montée tonale progressive en combo (+4% par coup, plafonné à +32%)
        const comboMult = 1 + Math.min(0.32, (comboCount - 1) * 0.04);

        // Couche 1 : Punch sub-basse sinusoïdal (corps / thorax)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        const subDur = heavy ? 0.24 : 0.12;
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(this._jitter(heavy ? 128 : 172) * comboMult, now);
        this._ramp(subOsc.frequency, heavy ? 28 : 42, now + subDur);
        subGain.gain.setValueAtTime(heavy ? 0.48 : 0.30, now);
        this._ramp(subGain.gain, 0.001, now + subDur + 0.01);
        subOsc.connect(subGain);
        subGain.connect(this.destination);
        subOsc.start(now);
        subOsc.stop(now + subDur + 0.02);

        // Couche 2 : Claque organique (bruit filtré passe-bande)
        const slapDur = heavy ? 0.10 : 0.06;
        const slapNoise = this.ctx.createBufferSource();
        slapNoise.buffer = this._createNoiseBuffer(slapDur, 0.30);
        const slapFilter = this.ctx.createBiquadFilter();
        slapFilter.type = 'bandpass';
        if (slapFilter.Q) slapFilter.Q.value = 1.4;
        slapFilter.frequency.setValueAtTime(this._jitter(heavy ? 880 : 1280) * comboMult, now);
        this._ramp(slapFilter.frequency, heavy ? 260 : 480, now + slapDur);
        const slapGain = this.ctx.createGain();
        slapGain.gain.setValueAtTime(heavy ? 0.36 : 0.22, now);
        this._ramp(slapGain.gain, 0.001, now + slapDur);
        slapNoise.connect(slapFilter);
        slapFilter.connect(slapGain);
        slapGain.connect(this.destination);
        slapNoise.start(now);

        // Couche 3 : Transitoire mordant en dents de scie (crunch d'impact)
        const crunchOsc = this.ctx.createOscillator();
        const crunchFilter = this.ctx.createBiquadFilter();
        const crunchGain = this.ctx.createGain();
        const crunchDur = heavy ? 0.15 : 0.075;
        crunchOsc.type = 'sawtooth';
        crunchOsc.frequency.setValueAtTime(this._jitter(heavy ? 220 : 310) * comboMult, now);
        this._ramp(crunchOsc.frequency, heavy ? 44 : 78, now + crunchDur);
        crunchFilter.type = 'lowpass';
        crunchFilter.frequency.setValueAtTime(this._isBoneCrunchAllowed() ? 2000 : 950, now);
        crunchGain.gain.setValueAtTime(heavy ? 0.24 : 0.14, now);
        this._ramp(crunchGain.gain, 0.001, now + crunchDur);
        crunchOsc.connect(crunchFilter);
        crunchFilter.connect(crunchGain);
        crunchGain.connect(this.destination);
        crunchOsc.start(now);
        crunchOsc.stop(now + crunchDur + 0.01);
    }
    playCounterHit() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Couche 1 : Sub-drop profond de contre-attaque
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(this._jitter(158, 0.06), now);
        this._ramp(sub.frequency, 26, now + 0.28);
        subGain.gain.setValueAtTime(0.52, now);
        this._ramp(subGain.gain, 0.001, now + 0.30);
        sub.connect(subGain);
        subGain.connect(this.destination);
        sub.start(now);
        sub.stop(now + 0.31);

        // Couche 2 : Impact métallique / claquement haute-énergie
        [1240, 1860].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx === 0 ? 'triangle' : 'square';
            osc.frequency.setValueAtTime(this._jitter(freq, 0.05), now);
            this._ramp(osc.frequency, freq * 0.62, now + 0.16);
            gain.gain.setValueAtTime(idx === 0 ? 0.18 : 0.09, now);
            this._ramp(gain.gain, 0.001, now + 0.17);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        });

        // Couche 3 : Craquement d'os / bruit sec haute-fréquence
        const crackDur = 0.14;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(crackDur, 0.26);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(this._isBoneCrunchAllowed() ? 850 : 1400, now);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(this._isBoneCrunchAllowed() ? 0.42 : 0.24, now);
        this._ramp(nGain.gain, 0.001, now + crackDur);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.destination);
        noise.start(now);
    }
    playBlock(isHeavy = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = isHeavy ? 0.13 : 0.09;

        // Couche 1 : Résonance mate d'ostéoderme / carapace osseuse (distinct d'un impact chair)
        const shellOsc = this.ctx.createOscillator();
        const shellFilter = this.ctx.createBiquadFilter();
        const shellGain = this.ctx.createGain();
        shellOsc.type = 'triangle';
        shellOsc.frequency.setValueAtTime(this._jitter(isHeavy ? 295 : 390, 0.07), now);
        this._ramp(shellOsc.frequency, isHeavy ? 118 : 172, now + dur);
        shellFilter.type = 'bandpass';
        if (shellFilter.Q) shellFilter.Q.value = 3.2;
        shellFilter.frequency.setValueAtTime(isHeavy ? 420 : 580, now);
        shellGain.gain.setValueAtTime(isHeavy ? 0.36 : 0.25, now);
        this._ramp(shellGain.gain, 0.001, now + dur);
        shellOsc.connect(shellFilter);
        shellFilter.connect(shellGain);
        shellGain.connect(this.destination);
        shellOsc.start(now);
        shellOsc.stop(now + dur + 0.01);

        // Couche 2 : Amorti grave court
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(this._jitter(115, 0.06), now);
        this._ramp(thudOsc.frequency, 52, now + dur);
        thudGain.gain.setValueAtTime(isHeavy ? 0.28 : 0.18, now);
        this._ramp(thudGain.gain, 0.001, now + dur);
        thudOsc.connect(thudGain);
        thudGain.connect(this.destination);
        thudOsc.start(now);
        thudOsc.stop(now + dur + 0.01);

        // Couche 3 : Frottement sec d'écaille
        const scrape = this.ctx.createBufferSource();
        scrape.buffer = this._createNoiseBuffer(0.05, 0.25);
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'bandpass';
        sFilter.frequency.setValueAtTime(1600, now);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.14, now);
        this._ramp(sGain.gain, 0.001, now + 0.05);
        scrape.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.destination);
        scrape.start(now);
    }
    playParry() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Couche 1 : Ping métallique doré cristallin
        const ping = this.ctx.createOscillator();
        const pingGain = this.ctx.createGain();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(this._jitter(2480, 0.04), now);
        this._ramp(ping.frequency, 1980, now + 0.18);
        pingGain.gain.setValueAtTime(0.24, now);
        this._ramp(pingGain.gain, 0.001, now + 0.19);
        ping.connect(pingGain);
        pingGain.connect(this.destination);
        ping.start(now);
        ping.stop(now + 0.20);

        // Couche 2 : Carillon harmonique scintillant (accord doré lumineux)
        [880, 1318.5, 1760, 2637].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startAt = now + idx * 0.012;
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(this._jitter(freq, 0.02), startAt);
            this._ramp(osc.frequency, freq * 1.015, startAt + 0.38);
            gain.gain.setValueAtTime(0.18 / (idx + 1), startAt);
            this._ramp(gain.gain, 0.001, startAt + 0.40);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(startAt);
            osc.stop(startAt + 0.42);
        });

        // Couche 3 : Impulsion grave de déviation
        const snap = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snap.type = 'sine';
        snap.frequency.setValueAtTime(215, now);
        this._ramp(snap.frequency, 68, now + 0.09);
        snapGain.gain.setValueAtTime(0.22, now);
        this._ramp(snapGain.gain, 0.001, now + 0.10);
        snap.connect(snapGain);
        snapGain.connect(this.destination);
        snap.start(now);
        snap.stop(now + 0.11);
    }
    playGuardBreak() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Couche 1 : Détonation grave
        const boom = this.ctx.createOscillator();
        const boomGain = this.ctx.createGain();
        boom.type = 'sine';
        boom.frequency.setValueAtTime(this._jitter(115, 0.06), now);
        this._ramp(boom.frequency, 24, now + 0.42);
        boomGain.gain.setValueAtTime(0.50, now);
        this._ramp(boomGain.gain, 0.001, now + 0.44);
        boom.connect(boomGain);
        boomGain.connect(this.destination);
        boom.start(now);
        boom.stop(now + 0.45);

        // Couche 2 : Éclatement dissonant descendant
        [740, 622, 466, 311].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t0 = now + idx * 0.026;
            osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(this._jitter(freq, 0.05), t0);
            this._ramp(osc.frequency, freq * 0.52, t0 + 0.30);
            gain.gain.setValueAtTime(0.16 / (idx * 0.35 + 1), t0);
            this._ramp(gain.gain, 0.001, t0 + 0.32);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(t0);
            osc.stop(t0 + 0.34);
        });

        // Couche 3 : Crépitement de carapace brisée
        const crackle = this.ctx.createBufferSource();
        crackle.buffer = this._createNoiseBuffer(0.28, 0.34);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1050, now);
        const cGain = this.ctx.createGain();
        cGain.gain.setValueAtTime(0.36, now);
        this._ramp(cGain.gain, 0.001, now + 0.28);
        crackle.connect(filter);
        filter.connect(cGain);
        cGain.connect(this.destination);
        crackle.start(now);
    }
    playJump() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this._jitter(142, 0.07), now);
        this._ramp(osc.frequency, this._jitter(365, 0.07), now + 0.12);
        gain.gain.setValueAtTime(0.16, now);
        this._ramp(gain.gain, 0.001, now + 0.13);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + 0.14);

        const push = this.ctx.createBufferSource();
        push.buffer = this._createNoiseBuffer(0.08, 0.35);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(720, now);
        const pGain = this.ctx.createGain();
        pGain.gain.setValueAtTime(0.10, now);
        this._ramp(pGain.gain, 0.001, now + 0.08);
        push.connect(filter);
        filter.connect(pGain);
        pGain.connect(this.destination);
        push.start(now);
    }
    playLand(isHeavy = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = isHeavy ? 0.19 : 0.10;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this._jitter(isHeavy ? 88 : 138, 0.08), now);
        this._ramp(osc.frequency, isHeavy ? 26 : 46, now + dur);
        gain.gain.setValueAtTime(isHeavy ? 0.38 : 0.18, now);
        this._ramp(gain.gain, 0.001, now + dur + 0.01);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);

        const dustDur = isHeavy ? 0.13 : 0.07;
        const dust = this.ctx.createBufferSource();
        dust.buffer = this._createNoiseBuffer(dustDur, 0.35);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isHeavy ? 320 : 540, now);
        const dGain = this.ctx.createGain();
        dGain.gain.setValueAtTime(isHeavy ? 0.24 : 0.11, now);
        this._ramp(dGain.gain, 0.001, now + dustDur);
        dust.connect(filter);
        filter.connect(dGain);
        dGain.connect(this.destination);
        dust.start(now);
    }
    playFootstep(isHeavy = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = isHeavy ? 0.11 : 0.06;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this._jitter(isHeavy ? 68 : 112, 0.08), now);
        this._ramp(osc.frequency, isHeavy ? 28 : 52, now + dur);
        gain.gain.setValueAtTime(isHeavy ? 0.18 : 0.08, now);
        this._ramp(gain.gain, 0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);

        const grit = this.ctx.createBufferSource();
        grit.buffer = this._createNoiseBuffer(0.06, 0.32);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isHeavy ? 260 : 420, now);
        const gGain = this.ctx.createGain();
        gGain.gain.setValueAtTime(isHeavy ? 0.09 : 0.04, now);
        this._ramp(gGain.gain, 0.001, now + 0.06);
        grit.connect(filter);
        filter.connect(gGain);
        gGain.connect(this.destination);
        grit.start(now);
    }
    playDash() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = 0.15;

        const rush = this.ctx.createBufferSource();
        rush.buffer = this._createNoiseBuffer(dur, 0.42);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        if (filter.Q) filter.Q.value = 1.6;
        filter.frequency.setValueAtTime(this._jitter(1800, 0.08), now);
        this._ramp(filter.frequency, 360, now + dur);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.22, now);
        this._ramp(nGain.gain, 0.001, now + dur);
        rush.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.destination);
        rush.start(now);

        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this._jitter(440, 0.07), now);
        this._ramp(osc.frequency, 105, now + dur);
        oGain.gain.setValueAtTime(0.14, now);
        this._ramp(oGain.gain, 0.001, now + dur);
        osc.connect(oGain);
        oGain.connect(this.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);
    }
    playSuperFlash() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Couche 1 : Sub-bass drop emblématique de gel temporel (150Hz -> 28Hz)
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(150, now);
        this._ramp(sub.frequency, 28, now + 0.44);
        subGain.gain.setValueAtTime(0.54, now);
        this._ramp(subGain.gain, 0.001, now + 0.46);
        sub.connect(subGain);
        subGain.connect(this.destination);
        sub.start(now);
        sub.stop(now + 0.48);

        // Couche 2 : Transitoire d'éclair métallique
        const zap = this.ctx.createOscillator();
        const zapGain = this.ctx.createGain();
        zap.type = 'triangle';
        zap.frequency.setValueAtTime(980, now);
        this._ramp(zap.frequency, 240, now + 0.16);
        zapGain.gain.setValueAtTime(0.22, now);
        this._ramp(zapGain.gain, 0.001, now + 0.17);
        zap.connect(zapGain);
        zapGain.connect(this.destination);
        zap.start(now);
        zap.stop(now + 0.18);

        // Couche 3 : Montée harmonique scintillante (surge)
        [330, 495, 660, 990].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            this._ramp(osc.frequency, freq * 1.48, now + 0.42);
            gain.gain.setValueAtTime(0.001, now);
            this._ramp(gain.gain, 0.15 / (idx * 0.45 + 1), now + 0.12, true);
            this._ramp(gain.gain, 0.001, now + 0.44);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(now);
            osc.stop(now + 0.46);
        });
    }
    playKoFinish(isExtinction = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = isExtinction ? 1.25 : 0.90;

        // Couche 1 : Détonation cinématique massive sub-basse
        const boom = this.ctx.createOscillator();
        const boomGain = this.ctx.createGain();
        boom.type = 'sine';
        boom.frequency.setValueAtTime(isExtinction ? 132 : 118, now);
        this._ramp(boom.frequency, 22, now + dur);
        boomGain.gain.setValueAtTime(isExtinction ? 0.60 : 0.48, now);
        this._ramp(boomGain.gain, 0.001, now + dur + 0.04);
        boom.connect(boomGain);
        boomGain.connect(this.destination);
        boom.start(now);
        boom.stop(now + dur + 0.06);

        // Couche 2 : Onde de choc grave filtrée
        const shockDur = isExtinction ? 0.78 : 0.52;
        const shock = this.ctx.createBufferSource();
        shock.buffer = this._createNoiseBuffer(shockDur, 0.45);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isExtinction ? 460 : 380, now);
        this._ramp(filter.frequency, 52, now + shockDur);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(isExtinction ? 0.42 : 0.32, now);
        this._ramp(sGain.gain, 0.001, now + shockDur);
        shock.connect(filter);
        filter.connect(sGain);
        sGain.connect(this.destination);
        shock.start(now);

        // Couche 3 : Écho harmonique grave (enrichi pour Extinction Finish)
        const harmonics = isExtinction ? [110, 165, 220, 330, 440] : [110, 165, 220];
        harmonics.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t0 = now + idx * 0.025;
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, t0);
            this._ramp(osc.frequency, freq * 0.94, t0 + dur);
            gain.gain.setValueAtTime((isExtinction ? 0.20 : 0.15) / (idx + 1), t0);
            this._ramp(gain.gain, 0.001, t0 + dur + 0.12);
            osc.connect(gain);
            gain.connect(this.destination);
            osc.start(t0);
            osc.stop(t0 + dur + 0.15);
        });
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
