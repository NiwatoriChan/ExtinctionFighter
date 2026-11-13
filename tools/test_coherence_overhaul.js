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

    const ctx = vm.createContext({ window: {}, localStorage: makeStorage(), console, Math });
    loadIntoContext(ctx, 'js/core/state.js');
    assert.strictEqual(ctx.GAME_VERSION, 'v0.2.1', 'GAME_VERSION should be v0.2.1');
    assert.strictEqual(ctx.xrayElapsed, 0, 'xrayElapsed should initialize to 0');
    assert.strictEqual(ctx.xrayPhaseApplied, 0, 'xrayPhaseApplied should initialize to 0');
    assert.strictEqual(ctx.xrayContext, null, 'xrayContext should initialize to null');
    assert.strictEqual(ctx.roundIntroAnnounced, false, 'roundIntroAnnounced should initialize to false');
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

function testEffectsAndXRayAndTeardown() {
    const THREE = makeThreeStub();
    const addedToScene = [];
    const scene = {
        add(obj) { addedToScene.push(obj); },
        remove() {}
    };
    const bodyEl = createMockElement('body');
    const document = {
        body: bodyEl,
        getElementById: () => createMockElement('div')
    };

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
        STAGE_LEFT_3D: -18,
        STAGE_RIGHT_3D: 18,
        camera3D: { position: { set() {} }, lookAt() {} },
        scene3D: scene,
        renderer3D: null,
        sfx: {
            enabled: true,
            playHit() {},
            playBoneCrack() {},
            playRoar() {},
            playKO() {},
            startMusicLoop() {},
            stopMusicLoop() {}
        },
        showAnnouncer() {},
        spawnFloatingPopup() {},
        triggerHitstop() {},
        triggerGamepadRumble() {},
        triggerXRaySkeletonFlash() {},
        applyFighterTextures() {},
        updateFighterHudDOM() {},
        updateHealthBars() {},
        updateBattleHUD() {},
        animateDino3DRig() {},
        performance: { now: () => 1000 },
        setTimeout: () => { throw new Error('executeXRayMove must not rely on setTimeout'); },
        clearTimeout: () => {},
        clearInterval: () => {}
    });

    loadIntoContext(ctx, 'js/core/state.js');
    ctx.scene3D = scene;
    ctx.fxGroup = new THREE.Group();
    ctx.particles3D = [];
    loadIntoContext(ctx, 'js/core/effects.js');
    loadIntoContext(ctx, 'js/core/combat.js');
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

    // 2) Pause-safe X-Ray execution & teardown
    let damageDealt = 0;
    let takeHitCalls = 0;
    let f1Destroyed = false;
    let f2Destroyed = false;
    const f1 = {
        x: -2, y: 0, facing: 1, rage: 100, hp: 500, maxHp: 1000, isDead: false,
        vx: 0, vy: 0, onGround: true, state: 'idle', isBlocking: false, comboCount: 0, comboTimer: 0,
        hitstun: 0, blockstun: 0, stunTimer: 0, attackTimer: 0, specialCooldown: 0,
        mesh: new THREE.Group(),
        group: new THREE.Group(),
        rig: { root: new THREE.Group() },
        dino: { name: 'T-REX', fullName: 'Tyrannosaurus Rex', fatality: 'MORSURE', xrayTarget: 'CRÂNE', color: '#ef4444', stats: { pow: 100, speed: 60 } },
        update() {},
        triggerFlash() {},
        takeHit() {},
        takeDamage(dmg) {},
        destroy() { f1Destroyed = true; },
        enterPose() {}, setScale() {},
        setAction() {}
    };
    const f2 = {
        x: 0.5, y: 0, facing: -1, rage: 0, hp: 1000, maxHp: 1000, isDead: false,
        vx: 0, vy: 0, onGround: true, state: 'idle', isBlocking: false, comboCount: 0, comboTimer: 0,
        hitstun: 0, blockstun: 0, stunTimer: 0, attackTimer: 0, specialCooldown: 0,
        mesh: new THREE.Group(),
        group: new THREE.Group(),
        rig: { root: new THREE.Group() },
        dino: { name: 'SPINOSAURE', fullName: 'Spinosaurus Aegyptiacus', color: '#38bdf8', stats: { pow: 95, speed: 65 } },
        update() {},
        triggerFlash() {},
        takeHit(dmg) { takeHitCalls++; damageDealt += dmg; this.hp = Math.max(0, this.hp - dmg); },
        takeDamage(dmg) { takeHitCalls++; damageDealt += dmg; this.hp = Math.max(0, this.hp - dmg); },
        destroy() { f2Destroyed = true; },
        enterPose() {},
        setAction() {}
    };
    ctx.fighter1 = f1;
    ctx.fighter2 = f2;
    ctx.roundOver = false;
    ctx.ROUND_OVER = false;

    ctx.executeXRayMove(f1, f2);
    assert.strictEqual(f1.rage, 0, 'X-Ray should consume rage');
    assert(ctx.xrayCinematicTimer > 0, 'X-Ray timer should be active');
    assert.strictEqual(ctx.xrayPhaseApplied, 1, 'Phase 1 triggers on initiation');
    assert(ctx.xrayContext !== null, 'xrayContext should be populated');
    const hpAfterHit1 = f2.hp;
    assert(hpAfterHit1 < 1000, 'Phase 1 should deal initial X-Ray hit');

    // Ensure pause blocks X-Ray timer progress
    ctx.isMatchPaused = true;
    ctx.updateBattle3D(0.9);
    assert.strictEqual(ctx.xrayPhaseApplied, 1, 'Paused updateBattle3D must not advance X-Ray phases');
    assert.strictEqual(f2.hp, hpAfterHit1, 'Paused X-Ray must not deal delayed hits');

    // Unpause and advance through phases 2 (>=0.75s) and 3 (>=1.50s) at ~50fps (accounts for hitstop)
    ctx.isMatchPaused = false;
    ctx.matchState = 'battle';
    ctx.roundIntroTimer = 0;
    for (let i = 0; i < 48; i++) ctx.updateBattle3D(0.02);
    assert.strictEqual(ctx.xrayPhaseApplied, 2, 'X-Ray phase 2 should trigger at xrayElapsed >= 0.75s');
    const hpAfterHit2 = f2.hp;
    assert(hpAfterHit2 < hpAfterHit1, 'Phase 2 should apply second X-Ray impact');

    for (let i = 0; i < 48; i++) ctx.updateBattle3D(0.02);
    assert.strictEqual(ctx.xrayPhaseApplied, 3, 'X-Ray phase 3 should trigger at xrayElapsed >= 1.50s');
    assert(f2.hp < hpAfterHit2, 'Unpaused X-Ray should apply phase 3 damage deterministically');

    // 3) teardownActiveBattle resets X-Ray + pause state
    ctx.xrayCinematicTimer = 1.5;
    ctx.xrayElapsed = 0.4;
    ctx.xrayPhaseApplied = 1;
    ctx.isMatchPaused = true;
    ctx.teardownActiveBattle();
    assert.strictEqual(f1Destroyed && f2Destroyed, true, 'teardownActiveBattle should destroy both fighters');
    assert.strictEqual(ctx.xrayCinematicTimer, 0, 'teardownActiveBattle should zero xrayCinematicTimer');
    assert.strictEqual(ctx.xrayElapsed, 0, 'teardownActiveBattle should zero xrayElapsed');
    assert.strictEqual(ctx.xrayPhaseApplied, 0, 'teardownActiveBattle should zero xrayPhaseApplied');
    assert.strictEqual(ctx.xrayContext, null, 'teardownActiveBattle should clear xrayContext');
    assert.strictEqual(ctx.isMatchPaused, false, 'teardownActiveBattle should reset isMatchPaused');
    console.log('[PASS] Effects gore toggle, pause-safe X-Ray timing & teardownActiveBattle');
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

function main() {
    console.log('=== RUNNING EXTINCTION KOMBAT 3D COHERENCE OVERHAUL SUITE ===');
    testStateAndHtml();
    testSoundEngine();
    testEffectsAndXRayAndTeardown();
    testMovesModalAndVictoryModal();
    console.log('=== ALL COHERENCE OVERHAUL TESTS PASSED! ===');
}

main();
