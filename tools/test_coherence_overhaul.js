const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function loadIntoContext(ctx, relPath) {
    const code = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    vm.runInContext(code, ctx, { filename: relPath });
}

function createMockElement(tag = 'div') {
    const el = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        children: [],
        _listeners: {},
        classList: {
            _set: new Set(),
            add(...cls) { cls.forEach(c => this._set.add(c)); },
            remove(...cls) { cls.forEach(c => this._set.delete(c)); },
            contains(c) { return this._set.has(c); },
            toggle(c, force) {
                if (force === undefined) {
                    if (this._set.has(c)) this._set.delete(c); else this._set.add(c);
                } else if (force) {
                    this._set.add(c);
                } else {
                    this._set.delete(c);
                }
            }
        },
        appendChild(child) { this.children.push(child); return child; },
        remove() {},
        addEventListener(evt, fn) {
            this._listeners[evt] = this._listeners[evt] || [];
            this._listeners[evt].push(fn);
        },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        insertAdjacentHTML(pos, html) { this._lastInsertedHTML = html; }
    };
    return el;
}

function makeThreeStub() {
    class Vec3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        setScalar(s) { this.x = s; this.y = s; this.z = s; return this; }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
        add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    }
    class Obj3D {
        constructor() {
            this.position = new Vec3();
            this.rotation = new Vec3();
            this.scale = new Vec3(1, 1, 1);
            this.children = [];
            this.userData = {};
            this.visible = true;
        }
        add(c) { this.children.push(c); }
        remove(c) { this.children = this.children.filter(x => x !== c); }
        lookAt() {}
        traverse(fn) { fn(this); this.children.forEach(c => c.traverse && c.traverse(fn)); }
    }
    class Geometry { dispose() {} }
    class Material {
        constructor(opts = {}) {
            Object.assign(this, opts);
            this.opacity = opts.opacity ?? 1;
        }
        dispose() {}
    }
    class Mesh extends Obj3D {
        constructor(geometry, material) {
            super();
            this.geometry = geometry || new Geometry();
            this.material = material || new Material();
        }
    }
    return {
        Vector3: Vec3,
        Group: Obj3D,
        Object3D: Obj3D,
        Scene: Obj3D,
        Mesh,
        BoxGeometry: Geometry,
        SphereGeometry: Geometry,
        CylinderGeometry: Geometry,
        DodecahedronGeometry: Geometry,
        PlaneGeometry: Geometry,
        TorusGeometry: Geometry,
        ConeGeometry: Geometry,
        RingGeometry: Geometry,
        MeshBasicMaterial: Material,
        MeshLambertMaterial: Material,
        MeshStandardMaterial: Material,
        MeshPhongMaterial: Material,
        DoubleSide: 2
    };
}

function makeStorage() {
    const store = new Map();
    return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k)
    };
}

function testStateAndHtml() {
    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert(indexHtml.includes('<html lang="fr">'), 'index.html should declare lang="fr"');
    assert(indexHtml.includes('__isTestMode'), 'index.html should gate telemetry behind __isTestMode');
    assert(!indexHtml.includes('Jurassic Blood — 1v1'), 'index.html should not carry old subtitle');

    const combatTagIdx = indexHtml.indexOf('js/core/combat.js');
    const superTagIdx = indexHtml.indexOf('js/core/super-attack.js');
    assert(combatTagIdx !== -1 && superTagIdx > combatTagIdx,
        'index.html should load js/core/super-attack.js immediately after js/core/combat.js');

    const ctx = vm.createContext({ window: {}, localStorage: makeStorage(), console, Math });
    loadIntoContext(ctx, 'js/core/state.js');
    assert.strictEqual(ctx.GAME_VERSION, 'v0.4.0', 'GAME_VERSION should be v0.4.0');
    assert.strictEqual(ctx.superState, null, 'superState should initialize to null');
    assert.strictEqual(ctx.battleTimeScale, 1.0, 'battleTimeScale should initialize to 1.0');
    assert.strictEqual(ctx.koSlowMoTimer, 0, 'koSlowMoTimer should initialize to 0');
    assert.strictEqual(ctx.koPendingData, null, 'koPendingData should initialize to null');
    assert.strictEqual(ctx.hitstopTimer, 0, 'hitstopTimer should initialize to 0');
    assert.strictEqual(ctx.hitstopTarget, null, 'hitstopTarget should initialize to null');
    assert.strictEqual(ctx.screenShake, 0, 'screenShake should initialize to 0');
    assert.strictEqual(ctx.camRecoilX, 0, 'camRecoilX should initialize to 0');
    assert.strictEqual(ctx.camRecoilY, 0, 'camRecoilY should initialize to 0');
    assert.strictEqual(ctx.camFovKick, 0, 'camFovKick should initialize to 0');
    assert.strictEqual(ctx.roundIntroAnnounced, false, 'roundIntroAnnounced should initialize to false');
    assert.strictEqual(typeof ctx.xrayCinematicTimer, 'undefined', 'legacy xrayCinematicTimer must be removed');
    assert.strictEqual(typeof ctx.xrayElapsed, 'undefined', 'legacy xrayElapsed must be removed');
    assert.strictEqual(typeof ctx.xrayPhaseApplied, 'undefined', 'legacy xrayPhaseApplied must be removed');
    assert.strictEqual(typeof ctx.xrayContext, 'undefined', 'legacy xrayContext must be removed');
    assert.strictEqual(typeof ctx.fatalityFocusFighter, 'undefined', 'legacy fatalityFocusFighter must be removed');
    console.log('[PASS] index.html & js/core/state.js coherence');
}

function testSoundEngine() {
    let oscCount = 0;
    let bufCount = 0;
    const mockCtx = {
        state: 'running',
        currentTime: 0,
        sampleRate: 44100,
        destination: {},
        resume() {},
        createGain() {
            return {
                gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
                connect() {}
            };
        },
        createOscillator() {
            oscCount++;
            return {
                type: 'sine',
                frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
                connect() {},
                start() {},
                stop() {}
            };
        },
        createBuffer(ch, len) {
            return { getChannelData: () => new Float32Array(len) };
        },
        createBufferSource() {
            bufCount++;
            return { buffer: null, connect() {}, start() {}, stop() {} };
        },
        createBiquadFilter() {
            return { type: 'lowpass', frequency: { value: 1000, setValueAtTime() {} }, Q: { value: 1 }, connect() {} };
        }
    };

    const ctx = vm.createContext({
        window: { AudioContext: function () { return mockCtx; } },
        console,
        Math,
        setInterval: () => 42,
        clearInterval: () => {}
    });
    loadIntoContext(ctx, 'js/core/sound.js');

    const engine = vm.runInContext('new SoundEngine()', ctx);
    engine.init();
    assert.strictEqual(engine.musicVolume, 0.6, 'Default musicVolume should be 0.6');
    engine.setMusicVolume(0.35);
    assert.strictEqual(engine.musicVolume, 0.35, 'setMusicVolume should update musicVolume');
    assert.strictEqual(engine.roarIntensity, 0.85, 'Default roarIntensity should be 0.85');
    assert.strictEqual(engine.boneCrunchEnabled, true, 'boneCrunchEnabled should default to true');

    engine.setMasterVolume(0.7);
    engine.setEnabled(false);
    assert.strictEqual(engine.enabled, false);
    assert.strictEqual(engine.masterVolume, 0.7, 'setEnabled(false) must preserve masterVolume');
    engine.setEnabled(true);
    assert.strictEqual(engine.enabled, true);
    assert.strictEqual(engine.masterVolume, 0.7, 'setEnabled(true) must preserve masterVolume');

    engine.setBoneCrunchEnabled(false);
    const beforeBoneBuf = bufCount;
    engine.playBoneCrack();
    assert.strictEqual(bufCount, beforeBoneBuf, 'playBoneCrack must not synthesize when boneCrunchEnabled=false');

    engine.setBoneCrunchEnabled(true);
    engine.playBoneCrack();
    assert(bufCount > beforeBoneBuf, 'playBoneCrack should synthesize buffer noise when boneCrunchEnabled=true');

    engine.setRoarIntensity(0);
    const beforeMutedRoar = oscCount;
    engine.playRoar(2.0);
    assert.strictEqual(oscCount, beforeMutedRoar, 'playRoar should skip when roarIntensity=0');

    engine.setRoarIntensity(0.8);
    engine.playRoar(2.0);
    assert(oscCount > beforeMutedRoar, 'playRoar should play when roarIntensity > 0');

    engine.startMusicLoop('battle');
    assert(engine._musicInterval !== null, 'startMusicLoop should start music interval');
    engine.setEnabled(false);
    assert.strictEqual(engine._musicInterval, null, 'setEnabled(false) should stop active music loop');
    console.log('[PASS] SoundEngine settings, toggle preservation & music loop');
}

function testEffectsAndSuperAndTeardown() {
    const THREE = makeThreeStub();
    const addedToScene = [];
    const scene = {
        add(obj) { addedToScene.push(obj); },
        remove() {}
    };
    const bodyEl = createMockElement('body');
    const domById = {
        superFlashOverlay: createMockElement('div'),
        pauseModal: createMockElement('div'),
        postMatchMenu: createMockElement('div'),
        duelTopHudOverlay: createMockElement('div')
    };
    const document = {
        body: bodyEl,
        getElementById: (id) => domById[id] || createMockElement('div')
    };

    let superOverlayShown = 0;
    let superOverlayHidden = 0;
    let lightsResetCalled = 0;
    const ctx = vm.createContext({
        THREE,
        localStorage: makeStorage(),
        window: {
            goreAndBloodEnabled: false,
            subtitlesEnabled: true,
            autoBlockEnabled: false,
            screenShakeMultiplier: 1.0,
            particlesMultiplier: 1.0
        },
        document,
        console,
        Math,
        particles3D: [],
        STAGE_LEFT_3D: -11,
        STAGE_RIGHT_3D: 11,
        CombatState: {
            IDLE: 'IDLE',
            ATTACK_WINDUP: 'ATTACK_WINDUP',
            ATTACK_ACTIVE: 'ATTACK_ACTIVE',
            ATTACK_RECOVERY: 'ATTACK_RECOVERY',
            BLOCK_DEFLECTED: 'BLOCK_DEFLECTED',
            WAKE_UP_STAND: 'WAKE_UP_STAND'
        },
        camera3D: { position: { set() {} }, lookAt() {} },
        scene3D: scene,
        renderer3D: null,
        sfx: {
            enabled: true,
            playHit() {},
            playBoneCrack() {},
            playRoar() {},
            playKO() {},
            playSuperFlash() {},
            playKoFinish() {},
            playDash() {},
            playParry() {},
            playBlock() {},
            playGuardBreak() {},
            playCooldownWarning() {},
            startMusicLoop() {},
            stopMusicLoop() {}
        },
        showAnnouncer() {},
        clearAnnouncer() {},
        spawnFloatingPopup() {},
        showSuperFlashOverlay() {
            superOverlayShown++;
            domById.superFlashOverlay.classList.remove('hidden');
        },
        hideSuperFlashOverlay() {
            superOverlayHidden++;
            domById.superFlashOverlay.classList.add('hidden');
        },
        resetBattleLighting() { lightsResetCalled++; },
        triggerGamepadRumble() {},
        applyFighterTextures() {},
        updateFighterHudDOM() {},
        updateHealthBars() {},
        updateBattleHUD() {},
        updateBattleHUDCooldowns() {},
        showComboHUD() {},
        hideComboHUD() {},
        handlePlayer1Inputs() {},
        handlePlayer2Inputs() {},
        updateAI() {},
        animateDino3DRig() {},
        performance: { now: () => 1000 },
        setTimeout: () => { throw new Error('executeSuperAttack / updateSuperAttack must not rely on setTimeout'); },
        clearTimeout: () => {},
        clearInterval: () => {}
    });

    loadIntoContext(ctx, 'js/core/state.js');
    ctx.scene3D = scene;
    ctx.fxGroup = new THREE.Group();
    ctx.particles3D = [];
    loadIntoContext(ctx, 'js/core/effects.js');
    loadIntoContext(ctx, 'js/core/combat.js');
    loadIntoContext(ctx, 'js/core/super-attack.js');
    loadIntoContext(ctx, 'js/core/match.js');

    // 1) Gore toggle in spawn3DBloodAndBones
    ctx.particles3D = [];
    ctx.window.goreAndBloodEnabled = false;
    ctx.spawn3DBloodAndBones(0, 2, 8, false);
    const nonGoreColors = ctx.particles3D.map(p => p.mesh.material.color);
    assert(nonGoreColors.length > 0, 'Non-gore mode should still spawn spark/rock particles');
    assert(!nonGoreColors.includes(0x7f1d1d) && !nonGoreColors.includes(0xdc2626) && !nonGoreColors.includes(0xfef3c7),
        'goreAndBloodEnabled=false must not spawn blood/bone colors');

    ctx.particles3D = [];
    ctx.window.goreAndBloodEnabled = true;
    ctx.spawn3DBloodAndBones(0, 2, 8, true);
    const goreColors = ctx.particles3D.map(p => p.mesh.material.color);
    assert(goreColors.some(c => c === 0x7f1d1d || c === 0xdc2626 || c === 0xfef3c7),
        'goreAndBloodEnabled=true should spawn blood/bone particles');

    // 2) Pause-safe Real Super Attack lifecycle (Flash -> Startup -> 3-Beat Cinematic -> Cleanup)
    let f1Destroyed = false;
    let f2Destroyed = false;
    const f1 = {
        isP1: true, x: -1.5, y: 0, groundY: 0, facing: 1, rage: 100, hp: 900, maxHp: 1000, roundsWon: 0,
        isDead: false, isDizzy: false, vx: 0, vy: 0, isBlocking: false, blockType: 'none', guardStamina: 100,
        comboCount: 0, comboDamage: 0, hitStun: 0, action: 'idle', actionTimer: 0, actionDuration: 0,
        hasHitCurrentAttack: false, hasHitConfirmed: false, dashTimer: 0, dashCooldown: 0,
        superInvulnTimer: 0, isSuperAttacker: false, isSuperTarget: false, superBeatStage: 0,
        hitFlashTimer: 0, hitFlashColor: 0xffffff, hitShakeOffset: 0, landingSquashTimer: 0,
        bodyRadius: 1.32, weightClass: 'brawler', gravityScale: 1.0, knockbackMult: 1.0,
        rig: { root: new THREE.Group() },
        dino: { id: 'trex', name: 'T-REX', fullName: 'Tyrannosaurus Rex', color: '#ef4444', stats: { pow: 100, spd: 60 } },
        destroy() { f1Destroyed = true; }
    };
    const f2 = {
        isP1: false, x: 1.2, y: 0, groundY: 0, facing: -1, rage: 0, hp: 1000, maxHp: 1000, roundsWon: 0,
        isDead: false, isDizzy: false, vx: 0, vy: 0, isBlocking: false, blockType: 'none', guardStamina: 100,
        comboCount: 0, comboDamage: 0, hitStun: 0, action: 'idle', actionTimer: 0, actionDuration: 0,
        hasHitCurrentAttack: false, hasHitConfirmed: false, dashTimer: 0, dashCooldown: 0,
        superInvulnTimer: 0, isSuperAttacker: false, isSuperTarget: false, superBeatStage: 0,
        hitFlashTimer: 0, hitFlashColor: 0xffffff, hitShakeOffset: 0, landingSquashTimer: 0,
        bodyRadius: 1.32, weightClass: 'brawler', gravityScale: 1.0, knockbackMult: 1.0,
        rig: { root: new THREE.Group() },
        dino: { id: 'spinosaurus', name: 'SPINOSAURE', fullName: 'Spinosaurus Aegyptiacus', color: '#38bdf8', stats: { pow: 95, spd: 65 } },
        destroy() { f2Destroyed = true; }
    };
    ctx.fighter1 = f1;
    ctx.fighter2 = f2;
    ctx.matchState = 'fight';
    ctx.isMatchPaused = false;

    const started = ctx.executeSuperAttack(f1, f2);
    assert.strictEqual(started, true, 'executeSuperAttack should succeed at 100% Rage');
    assert.strictEqual(f1.rage, 0, 'Super Attack should consume 100% Rage');
    assert(ctx.superState !== null, 'superState should be populated');
    assert.strictEqual(ctx.superState.phase, 'flash', 'Super Attack should start in flash phase');
    assert(f1.superInvulnTimer > 0, 'Super Attack should grant startup invulnerability');
    assert(superOverlayShown >= 1, 'Super Flash should show #superFlashOverlay');

    // Ensure pause blocks Super Flash & updateBattle3D completely
    ctx.isMatchPaused = true;
    const flashTimerBeforePause = ctx.superState.timer;
    ctx.updateBattle3D(0.9, 10);
    assert.strictEqual(ctx.superState.phase, 'flash', 'Paused updateBattle3D must not exit Super Flash');
    assert.strictEqual(ctx.superState.timer, flashTimerBeforePause, 'Paused updateBattle3D must not decrement superState.timer');
    assert.strictEqual(f2.hp, 1000, 'Paused Super must not deal damage');

    // Unpause and step past 0.45s Flash -> Startup -> Connect into Cinematic
    ctx.isMatchPaused = false;
    let simT = 10;
    for (let i = 0; i < 40 && ctx.superState && ctx.superState.phase !== 'cinematic'; i++) {
        simT += 0.02;
        ctx.updateBattle3D(0.02, simT);
    }
    assert(ctx.superState && ctx.superState.phase === 'cinematic',
        `Super should connect into cinematic phase, got: ${ctx.superState && ctx.superState.phase}`);
    assert.strictEqual(ctx.superState.hasConnected, true, 'superState.hasConnected should be true');

    // Step to Beat 1 (>= 0.35s)
    for (let i = 0; i < 30 && ctx.superState && ctx.superState.beatApplied < 1; i++) {
        simT += 0.02;
        ctx.updateBattle3D(0.02, simT);
    }
    assert.strictEqual(ctx.superState.beatApplied, 1, 'Beat 1 should trigger deterministically');
    const hpAfterBeat1 = f2.hp;
    assert(hpAfterBeat1 < 1000, 'Beat 1 should deal Super damage');

    // Ensure pause mid-cinematic freezes beats and HP
    ctx.isMatchPaused = true;
    ctx.updateBattle3D(1.0, simT + 1.0);
    assert.strictEqual(ctx.superState.beatApplied, 1, 'Paused cinematic must not advance to Beat 2');
    assert.strictEqual(f2.hp, hpAfterBeat1, 'Paused cinematic must not deal Beat 2 damage');

    // Unpause and advance through Beats 2 & 3 until Super finishes cleanly
    ctx.isMatchPaused = false;
    let sawBeat2 = false;
    let sawBeat3 = false;
    let hpAfterBeat2 = hpAfterBeat1;
    for (let i = 0; i < 160 && ctx.superState; i++) {
        simT += 0.02;
        ctx.updateBattle3D(0.02, simT);
        if (ctx.superState && ctx.superState.beatApplied === 2 && !sawBeat2) {
            sawBeat2 = true;
            hpAfterBeat2 = f2.hp;
        }
        if (ctx.superState && ctx.superState.beatApplied === 3) {
            sawBeat3 = true;
        }
    }
    assert(sawBeat2, 'Unpaused Super should trigger Beat 2');
    assert(hpAfterBeat2 < hpAfterBeat1, 'Beat 2 should deal incremental damage');
    assert(sawBeat3, 'Unpaused Super should trigger Beat 3');
    assert(f2.hp < hpAfterBeat2, 'Beat 3 should deal climax damage');
    assert.strictEqual(ctx.superState, null, 'superState should clean up to null after 3-beat cinematic');
    assert.strictEqual(f1.isSuperAttacker, false, 'Attacker isSuperAttacker flag should clear');
    assert.strictEqual(f2.isSuperTarget, false, 'Defender isSuperTarget flag should clear');

    // 3) teardownActiveBattle resets Super + Slow-Mo + Recoil + Pause state cleanly
    ctx.superState = { phase: 'flash', timer: 0.3, attacker: f1, defender: f2 };
    ctx.battleTimeScale = 0.18;
    ctx.koSlowMoTimer = 0.85;
    ctx.koPendingData = { winner: f1, loser: f2, isExtinctionFinish: true };
    ctx.hitstopTimer = 0.12;
    ctx.hitstopTarget = f2;
    ctx.camRecoilX = 0.5;
    ctx.camRecoilY = -0.2;
    ctx.camFovKick = 3.2;
    ctx.isMatchPaused = true;
    ctx.teardownActiveBattle();
    assert.strictEqual(f1Destroyed && f2Destroyed, true, 'teardownActiveBattle should destroy both fighters');
    assert.strictEqual(ctx.superState, null, 'teardownActiveBattle should clear superState');
    assert.strictEqual(ctx.battleTimeScale, 1.0, 'teardownActiveBattle should reset battleTimeScale to 1.0');
    assert.strictEqual(ctx.koSlowMoTimer, 0, 'teardownActiveBattle should zero koSlowMoTimer');
    assert.strictEqual(ctx.koPendingData, null, 'teardownActiveBattle should clear koPendingData');
    assert.strictEqual(ctx.hitstopTimer, 0, 'teardownActiveBattle should zero hitstopTimer');
    assert.strictEqual(ctx.hitstopTarget, null, 'teardownActiveBattle should clear hitstopTarget');
    assert.strictEqual(ctx.camRecoilX, 0, 'teardownActiveBattle should zero camRecoilX');
    assert.strictEqual(ctx.camRecoilY, 0, 'teardownActiveBattle should zero camRecoilY');
    assert.strictEqual(ctx.camFovKick, 0, 'teardownActiveBattle should zero camFovKick');
    assert.strictEqual(ctx.isMatchPaused, false, 'teardownActiveBattle should reset isMatchPaused');
    assert(domById.superFlashOverlay.classList.contains('hidden'), 'teardownActiveBattle should hide #superFlashOverlay');
    console.log('[PASS] Effects gore toggle, pause-safe Real Super lifecycle & teardownActiveBattle');
}

function testMovesModalAndVictoryModal() {
    // Test moves-modal.js locked fighter era lookup
    const renderedCards = [];
    const modalListNode = {
        children: [],
        clear() { this.children = []; },
        clearChildren() { this.children = []; },
        add(c) { this.children.push(c); }
    };
    const mockUIKit = {
        signal: (v) => ({ value: v }),
        computed: (fn) => ({ get value() { return fn(); } }),
        effect: (fn) => fn(),
        getElementById: (id) => (id === 'modalRosterMoves' ? modalListNode : null),
        Dialog: class { constructor(o = {}) { Object.assign(this, o); } add(c) { (this.children = this.children || []).push(c); } mount() {} },
        Container: class { constructor(o = {}) { Object.assign(this, o); } add(c) { (this.children = this.children || []).push(c); } mount() {} clear() {} },
        Card: class { constructor(o = {}) { Object.assign(this, o); renderedCards.push(o); } add(c) { (this.children = this.children || []).push(c); } },
        Text: class { constructor(o = {}) { Object.assign(this, o); } },
        Image: class { constructor(o = {}) { Object.assign(this, o); } },
        Button: class { constructor(o = {}) { Object.assign(this, o); } },
        Badge: class { constructor(o = {}) { Object.assign(this, o); } }
    };
    const modalRootEl = createMockElement('div');
    modalRootEl.classList.add('hidden');

    const ctxMoves = vm.createContext({
        UIKit: mockUIKit,
        window: {},
        document: {
            getElementById(id) {
                if (id === 'movesModal') return modalRootEl;
                return createMockElement('div');
            }
        },
        console,
        DINO_ROSTER: [
            {
                id: 'trex',
                name: 'T-REX',
                isUnlockable: false,
                portrait: '',
                role: 'Apex',
                desc: '',
                accentColor: 0xff0000,
                fatalityName: 'Dévoration Royale',
                fatalityDesc: 'Broie l\'ennemi',
                stats: { hp: 1000, pow: 100, speed: 60 },
                moves: {
                    special: 'Morsure',
                    specialDesc: 'Morsure sismique',
                    xrayDesc: 'Brise le crâne'
                }
            },
            { id: 'anomalocaris', name: 'ANOMALOCARIS', isUnlockable: true, moves: {} },
            { id: 'smilodon', name: 'SMILODON', isUnlockable: true, moves: {} }
        ],
        UNLOCKABLE_FIGHTER_ERAS: { anomalocaris: 1, smilodon: 12 },
        CAMPAIGN_ERAS: [
            { id: 1, name: 'I. ÈRE DU CAMBRIEN' },
            { id: 12, name: 'XII. CÉNOZOÏQUE : QUATERNAIRE' }
        ],
        isFighterUnlocked: (id) => id === 'trex',
        playUISound() {}
    });
    loadIntoContext(ctxMoves, 'js/menus/moves-modal.js');
    ctxMoves.openMovesModal();
    assert.strictEqual(modalListNode.children.length, 3, 'Should render 1 unlocked + 2 locked cards');
    const lockedCards = modalListNode.children.slice(1);
    const lockedTexts = lockedCards.map(c => c.children[2].text);
    assert(lockedTexts[0].includes('Ère 1') && lockedTexts[0].includes('CAMBRIEN'),
        `Anomalocaris hint should reference Era 1, got: ${lockedTexts[0]}`);
    assert(lockedTexts[1].includes('Ère 12') && lockedTexts[1].includes('QUATERNAIRE'),
        `Smilodon hint should reference Era 12, got: ${lockedTexts[1]}`);
    assert(!lockedTexts.some(t => t.includes('félin préhistorique') && t.includes('Dragon Suprême')),
        'Locked cards must not hardcode the old Smilodon/Dragon Suprême hint');

    // Test campaign-level.js showEraVictoryRewardsModal reward badges
    let lastInsertedModal = '';
    const ctxCamp = vm.createContext({
        window: {},
        localStorage: makeStorage(),
        document: {
            body: { insertAdjacentHTML(pos, html) { lastInsertedModal = html; } },
            getElementById: () => null
        },
        console,
        Math,
        UNLOCKABLE_FIGHTER_ERAS: { anomalocaris: 1 },
        UNLOCKABLE_ARENA_ERAS: { cambrian: 1 },
        CAMPAIGN_ERAS: []
    });
    loadIntoContext(ctxCamp, 'js/core/campaign-level.js');

    ctxCamp.showEraVictoryRewardsModal({
        id: 1,
        name: 'I. ÈRE DU CAMBRIEN',
        subtitle: '538 Ma',
        logo: 'logo.png',
        reward: {
            fighterId: 'anomalocaris',
            fighterName: 'Anomalocaris',
            fighterPortrait: 'p.png',
            fighterRole: 'Radiodonte',
            arenaId: 'cambrian',
            arenaName: 'Récif Abyssal',
            arenaDesc: 'Récif marin'
        }
    });
    assert(lastInsertedModal.includes('NOUVEAU COMBATTANT DÉBLOQUÉ'), 'Era 1 should show new fighter unlock badge');
    assert(lastInsertedModal.includes('NOUVELLE ARÈNE DÉBLOQUÉE'), 'Era 1 should show new arena unlock badge');

    ctxCamp.showEraVictoryRewardsModal({
        id: 2,
        name: 'II. ÈRE DE L\'ORDOVICIEN',
        subtitle: '485 Ma',
        logo: 'logo.png',
        reward: {
            fighterId: 'maiasaura',
            fighterName: 'Maiasaura (Maîtrise Abyssale)',
            fighterPortrait: 'p.png',
            fighterRole: 'Maîtrise',
            arenaId: 'cambrian',
            arenaName: 'Fosse de l\'Ordovicien',
            arenaDesc: 'Fosse abyssale'
        }
    });
    assert(!lastInsertedModal.includes('NOUVEAU COMBATTANT DÉBLOQUÉ'), 'Era 2 starter fighter reward must not claim new unlock');
    assert(!lastInsertedModal.includes('NOUVELLE ARÈNE DÉBLOQUÉE'), 'Era 2 reused arena must not claim new unlock');
    assert(lastInsertedModal.includes('MAÎTRE DE L\'ÈRE'), 'Era 2 should show mastery badge');

    console.log('[PASS] Moves Grimoire locked hints & Campaign victory reward badges');
}

function testAiDifficultyTiers() {
    const captured = {};
    let currentDiff = 'normal';

    const ctxAi = vm.createContext({
        window: {},
        console,
        Math,
        performance: { now: () => 2000 },
        aiDifficulty: 'normal',
        gameMode: 'arcade',
        CombatState: { IDLE: 'IDLE', ATTACK_RECOVERY: 'ATTACK_RECOVERY', BLOCK_DEFLECTED: 'BLOCK_DEFLECTED' },
        ArenaNavSystem: {
            computeTacticalNavigation: () => ({
                sweetSpot: { x: 0, y: 0, myReach: 3.5, enemyReach: 3.5, isCornered: false }
            })
        },
        AIVehicleSystem: {
            aiVehicle: { position: { set() {} }, velocity: { set() {} } },
            computeSteeringStep: () => ({ vx: 0, steeringMode: 'ARRIVE' })
        },
        AIMacroStatechart: { evaluate: () => 'ALERT_FOOTSIES' },
        AICombatBehaviorTree: { evaluate: (bb) => { captured[currentDiff] = bb; } },
        YUKA: undefined
    });
    loadIntoContext(ctxAi, 'js/core/ai.js');

    const ai = {
        x: 3, y: 0, groundY: 0, vx: 0, hp: 1000, maxHp: 1000,
        action: 'idle', actionDuration: 0, guardStamina: 100,
        dino: { isBoss: false, walkSpeed: 10 },
        isDead: false, isDizzy: false, hitStun: 0
    };
    const target = {
        x: -1, y: 0, groundY: 0, hp: 1000, maxHp: 1000,
        action: 'idle', actionDuration: 0
    };

    ['easy', 'normal', 'hard', 'very_hard', 'brutal'].forEach(d => {
        currentDiff = d;
        ctxAi.aiDifficulty = d;
        ctxAi.updateAI(ai, target, 0.016);
    });

    const e = captured.easy;
    const n = captured.normal;
    const h = captured.hard;
    const vh = captured.very_hard;
    const br = captured.brutal;

    assert.strictEqual(n.difficulty, 'normal');
    assert.strictEqual(h.difficulty, 'hard');
    assert.strictEqual(vh.difficulty, 'very_hard');
    assert.strictEqual(br.difficulty, 'very_hard', 'legacy brutal must alias to very_hard');

    // Normal must sit strictly between easy and hard on all reactive probabilities
    assert(e.reactionProb < n.reactionProb && n.reactionProb < h.reactionProb && h.reactionProb < vh.reactionProb,
        `reactionProb ordering mismatch: ${e.reactionProb}, ${n.reactionProb}, ${h.reactionProb}, ${vh.reactionProb}`);
    assert(e.whiffPunishProb < n.whiffPunishProb && n.whiffPunishProb < h.whiffPunishProb && h.whiffPunishProb < vh.whiffPunishProb,
        'whiffPunishProb should strictly increase from easy -> normal -> hard -> very_hard');
    assert(e.blockChance < n.blockChance && n.blockChance < h.blockChance && h.blockChance < vh.blockChance,
        'blockChance should strictly increase from easy -> normal -> hard -> very_hard');
    assert(e.guardMatchProb < n.guardMatchProb && n.guardMatchProb < h.guardMatchProb && h.guardMatchProb < vh.guardMatchProb,
        'guardMatchProb should strictly increase from easy -> normal -> hard -> very_hard');

    // Verify steering desirability + speed scaling in ai-steering.js
    class GoalEvaluator { constructor(bias = 1) { this.characterBias = bias; } }
    const ctxSteer = vm.createContext({
        window: {},
        console,
        Math,
        aiDifficulty: 'normal',
        YUKA: {
            GoalEvaluator,
            EntityManager: class { add() {} },
            Vehicle: class {
                constructor() {
                    this.position = { set() {} };
                    this.velocity = { set() {} };
                    this.forward = { set() {} };
                    this.steering = { add() {} };
                }
            },
            Vector3: class { copy() {} },
            Path: class {},
            SeekBehavior: class {},
            ArriveBehavior: class {},
            PursueBehavior: class {},
            EvadeBehavior: class {},
            FleeBehavior: class {},
            FollowPathBehavior: class {},
            Vision: class { visible() { return true; } },
            MemorySystem: class { createRecord() {} getRecord() { return {}; } },
            Think: class { addEvaluator() {} execute() {} },
            Time: class { update() { return { getDelta: () => 0.016 }; } }
        }
    });
    loadIntoContext(ctxSteer, 'js/core/ai-steering.js');
    const evalInstance = vm.runInContext('new MomentumPursueGoalEvaluator(1.0)', ctxSteer);
    const des = {};
    ['easy', 'normal', 'hard', 'very_hard', 'brutal'].forEach(d => {
        des[d] = evalInstance.calculateDesirability({
            blackboard: { difficulty: d, targetInRecovery: true, targetDeflected: false, dist: 2, myReach: 3.5, hpRatio: 1 }
        });
    });
    assert(des.easy < des.normal && des.normal < des.hard && des.hard < des.very_hard,
        `steering desirability ordering mismatch: ${JSON.stringify(des)}`);
    assert.strictEqual(des.brutal, des.very_hard, 'steering brutal must match very_hard');

    const settingsSrc = fs.readFileSync(path.join(ROOT, 'js/menus/settings-modal.js'), 'utf8');
    ['data-ai="easy"', 'data-ai="normal"', 'data-ai="hard"', 'data-ai="very_hard"'].forEach(attr => {
        assert(settingsSrc.includes(attr), `settings-modal.js missing ${attr}`);
    });
    console.log('[PASS] AI 4-tier difficulty progression (easy < normal < hard < very_hard)');
}

function main() {
    console.log('=== RUNNING EXTINCTION KOMBAT 3D COHERENCE OVERHAUL SUITE ===');
    testStateAndHtml();
    testSoundEngine();
    testEffectsAndSuperAndTeardown();
    testMovesModalAndVictoryModal();
    testAiDifficultyTiers();
    console.log('=== ALL COHERENCE OVERHAUL TESTS PASSED! ===');
}

main();
