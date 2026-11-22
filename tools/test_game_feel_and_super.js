/**
 * Extinction Kombat 3D — Game-Feel Overhaul & Real Super Attack Verification Suite
 *
 * Covers all 8 verification invariants from implementation_plan.md plus cross-module integration:
 *   1. Multi-frame active hitbox (whiffs on frame 1, connects on frame 3 of active window, no double-hit)
 *   2. dt-independent physics equivalence (60fps vs 120fps walking & knockback/gravity, no double walk integration)
 *   3. Full moveset resolution & hit-confirm cancel routes (light/heavy/directional/throw/special2/super)
 *   4. Canonical 21-species passives (ankylo hyper-armor & projectile reflect, therizino 40% guard shred, all 21 weight classes)
 *   5. Counter-Hit (+20% dmg, +35% hitstun on ATTACK_WINDUP) & Perfect Parry (<=130ms guard = 0 dmg, 0 stamina loss, +15 Rage, 0.48s deflect)
 *   6. Universal 140ms input buffer firing on frame 1 after recovery / landing (and expiry on timeout)
 *   7. All 21 fighters Real Super Attack lifecycle (Super Flash -> Startup -> Whiff/Block/Parry/Connect -> 3-Beat Cinematic or 5-Pulse AoE -> Extinction Finish on lethal final round + Slow-Mo KO, zero finish_him)
 *   8. Layered Web Audio (SoundEngine) + Camera/VFX/Animation/HUD/Post-Match cross-module integration
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function loadScript(ctx, relPath) {
    const code = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    vm.runInContext(code, ctx, { filename: relPath });
}

function makeStorage(preset = {}) {
    const store = new Map(Object.entries(preset));
    return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k)
    };
}

function createMockElement(tag = 'div', id = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id,
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        children: [],
        parentNode: null,
        parentElement: { getBoundingClientRect: () => ({ width: 1280, height: 720 }) },
        width: 1280,
        height: 720,
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
        appendChild(child) {
            child.parentNode = this;
            this.children.push(child);
            return child;
        },
        remove() {
            if (this.parentNode && Array.isArray(this.parentNode.children)) {
                this.parentNode.children = this.parentNode.children.filter(c => c !== this);
            }
        },
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
    class Color {
        constructor(hex = 0xffffff) { this.hex = hex; }
        setHex(h) { this.hex = h; return this; }
        set(h) { this.hex = h; return this; }
        clone() { return new Color(this.hex); }
    }
    class Vec3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        setScalar(s) { this.x = s; this.y = s; this.z = s; return this; }
        copy(v) { if (v) { this.x = v.x; this.y = v.y; this.z = v.z; } return this; }
        add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
        clone() { return new Vec3(this.x, this.y, this.z); }
        length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    }
    class Box3 {
        constructor(min = new Vec3(-1, -1, -1), max = new Vec3(1, 1, 1)) {
            this.min = min;
            this.max = max;
        }
        copy(other) {
            this.min.copy(other.min);
            this.max.copy(other.max);
            return this;
        }
        applyMatrix4(m) {
            if (m && m.elements) {
                const tx = m.elements[12] || 0;
                const ty = m.elements[13] || 0;
                const tz = m.elements[14] || 0;
                this.min.x += tx; this.min.y += ty; this.min.z += tz;
                this.max.x += tx; this.max.y += ty; this.max.z += tz;
            }
            return this;
        }
        setFromObject(obj) {
            const p = (obj && obj.position) ? obj.position : { x: 0, y: 0, z: 0 };
            this.min.set(p.x - 0.5, p.y - 0.5, p.z - 0.5);
            this.max.set(p.x + 0.5, p.y + 0.5, p.z + 0.5);
            return this;
        }
        setFromCenterAndSize(c, s) {
            this.min.set(c.x - s.x * 0.5, c.y - s.y * 0.5, c.z - s.z * 0.5);
            this.max.set(c.x + s.x * 0.5, c.y + s.y * 0.5, c.z + s.z * 0.5);
            return this;
        }
        isEmpty() { return this.max.x < this.min.x; }
        intersectsBox(other) {
            return (
                this.min.x <= other.max.x && this.max.x >= other.min.x &&
                this.min.y <= other.max.y && this.max.y >= other.min.y &&
                this.min.z <= other.max.z && this.max.z >= other.min.z
            );
        }
        intersect(other) {
            this.min.x = Math.max(this.min.x, other.min.x);
            this.min.y = Math.max(this.min.y, other.min.y);
            this.min.z = Math.max(this.min.z, other.min.z);
            this.max.x = Math.min(this.max.x, other.max.x);
            this.max.y = Math.min(this.max.y, other.max.y);
            this.max.z = Math.min(this.max.z, other.max.z);
            return this;
        }
        getCenter(target = new Vec3()) {
            return target.set(
                (this.min.x + this.max.x) * 0.5,
                (this.min.y + this.max.y) * 0.5,
                (this.min.z + this.max.z) * 0.5
            );
        }
        getSize(target = new Vec3()) {
            return target.set(
                this.max.x - this.min.x,
                this.max.y - this.min.y,
                this.max.z - this.min.z
            );
        }
    }
    class Obj3D {
        constructor() {
            this.name = '';
            this.position = new Vec3();
            this.rotation = new Vec3();
            this.scale = new Vec3(1, 1, 1);
            this.children = [];
            this.userData = {};
            this.visible = true;
            this.parent = null;
            this.matrixWorld = { elements: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] };
        }
        add(...objs) {
            for (const c of objs) {
                if (!c) continue;
                c.parent = this;
                this.children.push(c);
            }
            return this;
        }
        remove(c) { this.children = this.children.filter(x => x !== c); return this; }
        lookAt() {}
        updateMatrixWorld() {
            const wp = this.getWorldPosition(new Vec3());
            this.matrixWorld.elements[12] = wp.x;
            this.matrixWorld.elements[13] = wp.y;
            this.matrixWorld.elements[14] = wp.z;
            for (const c of this.children) {
                if (c.updateMatrixWorld) c.updateMatrixWorld();
            }
        }
        getWorldPosition(target = new Vec3()) {
            let x = this.position.x, y = this.position.y, z = this.position.z;
            let p = this.parent;
            while (p) {
                if (p.position) { x += p.position.x; y += p.position.y; z += p.position.z; }
                p = p.parent;
            }
            return target.set(x, y, z);
        }
        getObjectByName(name) {
            if (this.name === name) return this;
            for (const c of this.children) {
                if (c.getObjectByName) {
                    const hit = c.getObjectByName(name);
                    if (hit) return hit;
                }
            }
            return null;
        }
        traverse(fn) {
            fn(this);
            for (const c of this.children) {
                if (c.traverse) c.traverse(fn);
            }
        }
    }
    class Geometry {
        scale() { return this; }
        rotateX() { return this; }
        rotateY() { return this; }
        rotateZ() { return this; }
        translate() { return this; }
        dispose() {}
    }
    class Material {
        constructor(opts = {}) {
            Object.assign(this, opts);
            this.color = new Color(opts.color !== undefined ? opts.color : 0xffffff);
            this.emissive = new Color(opts.emissive !== undefined ? opts.emissive : 0x000000);
            this.emissiveIntensity = opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0;
            this.opacity = opts.opacity !== undefined ? opts.opacity : 1;
            this.disposed = false;
        }
        dispose() { this.disposed = true; }
    }
    class Mesh extends Obj3D {
        constructor(geometry, material) {
            super();
            this.isMesh = true;
            this.geometry = geometry || new Geometry();
            this.material = material || new Material();
        }
    }
    class Light extends Obj3D {
        constructor(color = 0xffffff, intensity = 1) {
            super();
            this.color = new Color(color);
            this.intensity = intensity;
            this.shadow = {
                mapSize: { width: 512, height: 512 },
                camera: { near: 1, far: 50, left: -10, right: 10, top: 10, bottom: -10 }
            };
        }
    }
    class PerspectiveCamera extends Obj3D {
        constructor(fov = 45, aspect = 16 / 9, near = 0.1, far = 250) {
            super();
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            this.projectionUpdates = 0;
        }
        updateProjectionMatrix() { this.projectionUpdates++; }
    }
    class WebGLRenderer {
        constructor() {
            this.shadowMap = { enabled: false, type: 0, needsUpdate: false };
            this.renderCount = 0;
        }
        setPixelRatio() {}
        setSize() {}
        render() { this.renderCount++; }
    }
    class NumberKeyframeTrack {
        constructor(name, times, values) {
            this.name = name;
            this.times = times;
            this.values = values;
        }
    }
    class AnimationClip {
        constructor(name, duration = -1, tracks = []) {
            this.name = name;
            this.duration = duration >= 0 ? duration : 0.5;
            this.tracks = tracks;
        }
    }
    class AnimationAction {
        constructor(clip) {
            this._clip = clip;
            this.timeScale = 1;
            this.clampWhenFinished = false;
            this.weight = 1;
        }
        getClip() { return this._clip; }
        setLoop() { return this; }
        setEffectiveTimeScale(s) { this.timeScale = s; return this; }
        setEffectiveWeight(w) { this.weight = w; return this; }
        reset() { return this; }
        play() { return this; }
        stop() { return this; }
        fadeIn() { return this; }
        fadeOut() { return this; }
        crossFadeTo() { return this; }
        isRunning() { return true; }
    }
    class AnimationMixer {
        constructor(root) { this.root = root; this._actions = new Map(); }
        clipAction(clip) {
            if (!this._actions.has(clip.name)) {
                this._actions.set(clip.name, new AnimationAction(clip));
            }
            return this._actions.get(clip.name);
        }
        addEventListener() {}
        removeEventListener() {}
        update() {}
        stopAllAction() {}
        uncacheRoot() {}
    }

    return {
        Color,
        Vector3: Vec3,
        Box3,
        Group: Obj3D,
        Object3D: Obj3D,
        Scene: Obj3D,
        Mesh,
        AmbientLight: Light,
        HemisphereLight: Light,
        DirectionalLight: Light,
        PerspectiveCamera,
        WebGLRenderer,
        NumberKeyframeTrack,
        AnimationClip,
        AnimationAction,
        AnimationMixer,
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
        DoubleSide: 2,
        LoopRepeat: 2201,
        LoopOnce: 2200,
        BasicShadowMap: 0,
        PCFSoftShadowMap: 2,
        sRGBEncoding: 3001,
        ACESFilmicToneMapping: 4
    };
}

/**
 * Builds a complete headless combat VM loading the real game core modules + all 21 fighters.
 */
function createCombatHarness(opts = {}) {
    const THREE = makeThreeStub();
    let nowMs = 10000;

    const calls = {
        sfx: {},
        popups: [],
        announcers: [],
        superOverlay: [],
        hideSuperOverlay: 0,
        comboHud: [],
        hideComboHud: 0,
        dustPuffs: 0,
        counterBursts: 0,
        parryBursts: 0,
        superAuras: 0,
        superBeams: 0,
        postMatchShown: 0,
        lightsReset: 0
    };

    function trackSfx(name) {
        return (...args) => {
            calls.sfx[name] = (calls.sfx[name] || 0) + 1;
            calls.sfx[name + '_lastArgs'] = args;
        };
    }

    const domMap = {
        battleCanvas: createMockElement('canvas', 'battleCanvas'),
        superFlashOverlay: createMockElement('div', 'superFlashOverlay'),
        postMatchMenu: createMockElement('div', 'postMatchMenu'),
        pauseModal: createMockElement('div', 'pauseModal'),
        duelTopHudOverlay: createMockElement('div', 'duelTopHudOverlay'),
        hudTimer: createMockElement('div', 'hudTimer'),
        hudRoundText: createMockElement('div', 'hudRoundText')
    };

    const windowListeners = {};
    const winObj = {
        devicePixelRatio: 1,
        goreAndBloodEnabled: false,
        screenShakeMultiplier: 1.0,
        particlesMultiplier: 1.0,
        autoBlockEnabled: false,
        addEventListener(evt, fn) {
            windowListeners[evt] = windowListeners[evt] || [];
            windowListeners[evt].push(fn);
        },
        dispatchEvent() {}
    };

    const sfxMock = {
        enabled: true,
        init: trackSfx('init'),
        playGong: trackSfx('playGong'),
        playSwing: trackSfx('playSwing'),
        playHit: trackSfx('playHit'),
        playCounterHit: trackSfx('playCounterHit'),
        playBlock: trackSfx('playBlock'),
        playParry: trackSfx('playParry'),
        playGuardBreak: trackSfx('playGuardBreak'),
        playJump: trackSfx('playJump'),
        playLand: trackSfx('playLand'),
        playFootstep: trackSfx('playFootstep'),
        playDash: trackSfx('playDash'),
        playWhoosh: trackSfx('playWhoosh'),
        playRoar: trackSfx('playRoar'),
        playBoneCrack: trackSfx('playBoneCrack'),
        playSuperFlash: trackSfx('playSuperFlash'),
        playKoFinish: trackSfx('playKoFinish'),
        playCooldownWarning: trackSfx('playCooldownWarning'),
        startMusicLoop: trackSfx('startMusicLoop'),
        stopMusicLoop: trackSfx('stopMusicLoop')
    };

    // Always allow unlocking all 21 fighters (including dragon boss)
    const storage = makeStorage({
        ek3d_unlocked_dragon: 'true',
        ek3d_graphics_quality: 'high'
    });

    const ctx = vm.createContext({
        THREE,
        window: winObj,
        navigator: { getGamepads: () => [] },
        localStorage: storage,
        document: {
            body: createMockElement('body'),
            getElementById: (id) => domMap[id] || createMockElement('div', id),
            createElement: (tag) => createMockElement(tag),
            querySelector: () => null,
            querySelectorAll: () => []
        },
        performance: {
            now: () => nowMs
        },
        Date,
        Math,
        console,
        setTimeout: opts.forbidSetTimeout
            ? () => { throw new Error('setTimeout forbidden in pause-safe combat/Super simulation'); }
            : () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        sfx: sfxMock,
        battleScene: new THREE.Scene(),
        fxGroup: new THREE.Group(),
        arenaGroup: new THREE.Group(),
        getArenaGroundHeight: () => 0,
        getFighterSupportHeight: () => 0,
        getFighterSurfaceSlope: () => 0,
        getArenaPlatforms: () => [],
        updateArenaDynamics: () => {},
        loadFighterGLB: () => Promise.resolve({}),
        loadCampaignGLB: () => Promise.resolve({}),
        hydrateRigFromGLB: (rig) => { rig._isGlbHydrated = true; return true; },
        loadGLBModelForRig: () => {},
        spawnFloatingPopup: (x, text, color) => calls.popups.push({ x, text, color }),
        showAnnouncer: (title, sub) => calls.announcers.push({ title, sub }),
        clearAnnouncer: () => {},
        showSuperFlashOverlay: (att, spec, isExt) => {
            calls.superOverlay.push({ id: att && att.dino && att.dino.id, specName: spec && spec.name, isExt: Boolean(isExt) });
            domMap.superFlashOverlay.classList.remove('hidden');
        },
        hideSuperFlashOverlay: () => {
            calls.hideSuperOverlay++;
            domMap.superFlashOverlay.classList.add('hidden');
        },
        showComboHUD: (count, dmg) => calls.comboHud.push({ count, dmg }),
        hideComboHUD: () => { calls.hideComboHud++; },
        updateBattleHUD: () => {},
        updateBattleHUDCooldowns: () => {},
        showPostMatchMenu: () => { calls.postMatchShown++; },
        resetBattleLighting: () => { calls.lightsReset++; },
        flashArcadeButton: () => {},
        updateAI: () => {},
        animateDino3DRig: () => {}
    });

    // Load real registry + all 18 fighter files (21 fighters)
    loadScript(ctx, 'js/core/registry.js');
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const fighterScripts = [...html.matchAll(/<script\s+src="(js\/fighters\/[^"]+)"/g)].map(m => m[1]);
    for (const s of fighterScripts) {
        loadScript(ctx, s);
    }

    // Load core combat engine in exact index.html order
    loadScript(ctx, 'js/core/state.js');
    loadScript(ctx, 'js/core/rig.js');
    loadScript(ctx, 'js/core/prototype-combat-system.js');
    loadScript(ctx, 'js/core/fighter.js');
    loadScript(ctx, 'js/core/effects.js');

    // Wrap VFX spawners to count calls while still executing real effects.js code
    const origDust = ctx.spawn3DDustPuff;
    ctx.spawn3DDustPuff = (...args) => { calls.dustPuffs++; return origDust(...args); };
    const origCounter = ctx.spawn3DCounterBurst;
    ctx.spawn3DCounterBurst = (...args) => { calls.counterBursts++; return origCounter(...args); };
    const origParry = ctx.spawn3DParryBurst;
    ctx.spawn3DParryBurst = (...args) => { calls.parryBursts++; return origParry(...args); };
    const origAura = ctx.spawn3DSuperAura;
    ctx.spawn3DSuperAura = (...args) => { calls.superAuras++; return origAura(...args); };
    const origBeam = ctx.spawn3DSuperBeam;
    ctx.spawn3DSuperBeam = (...args) => { calls.superBeams++; return origBeam(...args); };

    loadScript(ctx, 'js/core/input.js');
    loadScript(ctx, 'js/core/combat.js');
    loadScript(ctx, 'js/core/super-attack.js');
    loadScript(ctx, 'js/core/match.js');

    const roster = vm.runInContext('DINO_ROSTER', ctx);
    const Fighter3D = vm.runInContext('Fighter3D', ctx);
    const CombatState = vm.runInContext('CombatState', ctx);

    function getDino(id) {
        const d = roster.find(x => x.id === id);
        assert(d, `Dino '${id}' not found in DINO_ROSTER`);
        return d;
    }

    function spawnDuel(id1 = 'trex', id2 = 'spinosaurus') {
        const f1 = new Fighter3D(getDino(id1), true, 0);
        const f2 = new Fighter3D(getDino(id2), false, 0);
        ctx.fighter1 = f1;
        ctx.fighter2 = f2;
        ctx.matchState = 'fight';
        ctx.gameMode = 'pvp';
        ctx.isMatchPaused = false;
        ctx.keys = {};
        ctx.superState = null;
        ctx.battleTimeScale = 1.0;
        ctx.koSlowMoTimer = 0;
        ctx.koPendingData = null;
        ctx.hitstopTimer = 0;
        ctx.hitstopTarget = null;
        ctx.screenShake = 0;
        ctx.camRecoilX = 0;
        ctx.camRecoilY = 0;
        ctx.camFovKick = 0;
        ctx.projectiles3D = [];
        ctx.particles3D = [];
        return { f1, f2 };
    }

    function step(dt) {
        nowMs += dt * 1000;
        ctx.updateBattle3D(dt, nowMs * 0.001);
    }

    return {
        ctx,
        THREE,
        roster,
        Fighter3D,
        CombatState,
        calls,
        domMap,
        getDino,
        spawnDuel,
        step,
        getNowSec: () => nowMs * 0.001,
        advanceClockMs: (ms) => { nowMs += ms; }
    };
}

// ============================================================================
// INVARIANT 1: Multi-frame active hitbox (whiff on frame 1, connect on frame 3)
// ============================================================================
function testInvariant1_MultiFrameHitbox() {
    const h = createCombatHarness({ forbidSetTimeout: true });
    const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');

    // Start far enough that frame 1 of active window whiffs
    f1.x = -4.0;
    f2.x = 2.0;
    const initialHp = f2.hp;

    assert.strictEqual(f1.startAttack('light'), true, 'light attack should start');
    const prof = f1.getAttackFrameProfile('light');
    assert(prof.activeEnd > prof.activeStart, 'light must have a multi-frame active window');

    // Advance into frame 1 of active window while opponent is out of reach
    const dt = 1 / 60;
    let activeFrames = 0;
    while (f1.actionDuration > 0 && activeFrames < 2) {
        h.step(dt);
        const p = f1.actionTimer / Math.max(0.001, f1.actionDuration);
        if (p >= prof.activeStart && p <= prof.activeEnd) {
            activeFrames++;
        }
    }
    assert.strictEqual(activeFrames, 2, 'Should reach frame 2 of active window cleanly');
    assert.strictEqual(f1.hasHitCurrentAttack, false, 'Whiffing on active frames 1-2 must NOT consume hasHitCurrentAttack');
    assert.strictEqual(f2.hp, initialHp, 'Out-of-range opponent must not take damage on active frames 1-2');

    // Move opponent into reach on frame 3 of the SAME active window!
    f2.x = f1.x + 2.4;
    h.step(dt);
    assert.strictEqual(f1.hasHitCurrentAttack, true, 'Attack MUST connect on frame 3 when opponent enters reach');
    assert(f2.hp < initialHp, 'Opponent HP must decrease on frame-3 active hitbox contact');

    // Flush hitstop and step remaining active frames -> must NOT double-hit!
    const hpAfterHit = f2.hp;
    for (let i = 0; i < 12; i++) h.step(dt);
    assert.strictEqual(f2.hp, hpAfterHit, 'Same attack must NOT double-hit on subsequent active frames');

    console.log('[PASS] Invariant 1: Multi-frame active hitbox (whiff frame 1-2 -> connect frame 3, zero double-hit)');
}

// ============================================================================
// INVARIANT 2: dt-independent physics (60fps vs 120fps, no double walk integration)
// ============================================================================
function testInvariant2_DtIndependentPhysics() {
    // Case A: Walking displacement equivalence + zero double walk integration
    const h60 = createCombatHarness({ forbidSetTimeout: true });
    const d60 = h60.spawnDuel('trex', 'spinosaurus');
    d60.f1.x = -6.0;
    d60.f2.x = 6.0;
    h60.ctx.keys['KeyD'] = true;
    for (let i = 0; i < 10; i++) h60.step(1 / 60);

    const h120 = createCombatHarness({ forbidSetTimeout: true });
    const d120 = h120.spawnDuel('trex', 'spinosaurus');
    d120.f1.x = -6.0;
    d120.f2.x = 6.0;
    h120.ctx.keys['KeyD'] = true;
    for (let i = 0; i < 20; i++) h120.step(1 / 120);

    const walkDisp60 = d60.f1.x - (-6.0);
    const walkDisp120 = d120.f1.x - (-6.0);
    const expectedWalk = d60.f1.dino.walkSpeed * (10 / 60);
    const walkRelErr = Math.abs(walkDisp60 - walkDisp120) / Math.max(0.001, expectedWalk);
    assert(walkRelErr < 0.02, `Walk 60fps (${walkDisp60.toFixed(4)}) vs 120fps (${walkDisp120.toFixed(4)}) diverged by ${(walkRelErr * 100).toFixed(2)}%`);
    assert(Math.abs(walkDisp60 - expectedWalk) / expectedWalk < 0.02,
        `Walk displacement (${walkDisp60.toFixed(4)}) must match walkSpeed*T (${expectedWalk.toFixed(4)}), proving NO double integration`);

    // Crisp stopping on key release
    h60.ctx.keys['KeyD'] = false;
    h60.step(1 / 60);
    assert.strictEqual(d60.f1.vx, 0, 'Releasing walk key must stop horizontal velocity cleanly');

    // Case B: Grounded knockback exponential friction + airborne gravity equivalence (60fps vs 120fps)
    const k60 = createCombatHarness({ forbidSetTimeout: true });
    const kd60 = k60.spawnDuel('trex', 'spinosaurus');
    kd60.f1.x = -5.0; kd60.f2.x = 5.0;
    kd60.f2.vx = 9.5; kd60.f2.hitStun = 0.5;
    for (let i = 0; i < 10; i++) k60.step(1 / 60);

    const k120 = createCombatHarness({ forbidSetTimeout: true });
    const kd120 = k120.spawnDuel('trex', 'spinosaurus');
    kd120.f1.x = -5.0; kd120.f2.x = 5.0;
    kd120.f2.vx = 9.5; kd120.f2.hitStun = 0.5;
    for (let i = 0; i < 20; i++) k120.step(1 / 120);

    const kbDisp60 = kd60.f2.x - 5.0;
    const kbDisp120 = kd120.f2.x - 5.0;
    const kbRelErr = Math.abs(kbDisp60 - kbDisp120) / Math.max(0.001, kbDisp60);
    const vxRelErr = Math.abs(kd60.f2.vx - kd120.f2.vx) / Math.max(0.001, kd60.f2.vx);
    assert(kbRelErr < 0.02, `Knockback x 60fps (${kbDisp60.toFixed(4)}) vs 120fps (${kbDisp120.toFixed(4)}) diverged by ${(kbRelErr * 100).toFixed(2)}%`);
    assert(vxRelErr < 0.02, `Knockback vx 60fps (${kd60.f2.vx.toFixed(4)}) vs 120fps (${kd120.f2.vx.toFixed(4)}) diverged`);

    // Case C: Airborne jump arc equivalence (60fps vs 120fps)
    const j60 = createCombatHarness({ forbidSetTimeout: true });
    const jd60 = j60.spawnDuel('trex', 'spinosaurus');
    jd60.f1.x = -5.0; jd60.f2.x = 5.0; jd60.f1.vy = 11.8;
    for (let i = 0; i < 12; i++) j60.step(1 / 60);

    const j120 = createCombatHarness({ forbidSetTimeout: true });
    const jd120 = j120.spawnDuel('trex', 'spinosaurus');
    jd120.f1.x = -5.0; jd120.f2.x = 5.0; jd120.f1.vy = 11.8;
    for (let i = 0; i < 24; i++) j120.step(1 / 120);

    const airRelErr = Math.abs(jd60.f1.y - jd120.f1.y) / Math.max(0.001, jd60.f1.y);
    assert(airRelErr < 0.02, `Jump y 60fps (${jd60.f1.y.toFixed(4)}) vs 120fps (${jd120.f1.y.toFixed(4)}) diverged`);

    console.log(`[PASS] Invariant 2: dt-independent physics (walk err=${(walkRelErr * 100).toFixed(4)}%, kb err=${(kbRelErr * 100).toFixed(4)}%, air err=${(airRelErr * 100).toFixed(4)}%)`);
}

// ============================================================================
// INVARIANT 3: Full moveset resolution & hit-confirm cancel routes
// ============================================================================
function testInvariant3_MovesetAndCancels() {
    const h = createCombatHarness({ forbidSetTimeout: true });
    const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
    f1.x = -1.5; f2.x = 1.0; f1.facing = 1;

    const resolve = (type, keySetup = {}, yVal = 0) => {
        h.ctx.keys = Object.assign({}, keySetup);
        f1.y = yVal;
        f1.groundY = 0;
        return h.ctx.resolveAttackVariant(f1, type, f2);
    };

    // Light variants (facing right)
    assert.strictEqual(resolve('strike'), 'light');
    assert.strictEqual(resolve('light', { KeyW: true }), 'up_light');
    assert.strictEqual(resolve('light', {}, 1.2), 'air_light');
    assert.strictEqual(resolve('light', { KeyS: true }), 'low_light');
    assert.strictEqual(resolve('light', { KeyD: true }), 'fwd_light');
    assert.strictEqual(resolve('light', { KeyA: true }), 'back_light');

    // ShiftLeft bug fix: holding ShiftLeft alone must NEVER force low_light!
    assert.strictEqual(resolve('light', { ShiftLeft: true }), 'light', 'ShiftLeft must NOT be treated as isDown');

    // Relative facing reversal (facing left)
    f1.facing = -1;
    assert.strictEqual(resolve('light', { KeyA: true }), 'fwd_light', 'Left key while facing -1 must resolve to fwd_light');
    assert.strictEqual(resolve('light', { KeyD: true }), 'back_light', 'Right key while facing -1 must resolve to back_light');
    f1.facing = 1;

    // Heavy variants
    assert.strictEqual(resolve('heavy'), 'heavy');
    assert.strictEqual(resolve('heavy', { KeyD: true }), 'fwd_heavy');
    assert.strictEqual(resolve('heavy', { KeyS: true }), 'low_heavy');
    assert.strictEqual(resolve('heavy', { KeyW: true }), 'anti_air');
    assert.strictEqual(resolve('heavy', {}, 1.5), 'air_heavy');

    // Special 1 & Special 2
    assert.strictEqual(resolve('special'), 'special');
    assert.strictEqual(resolve('special', { KeyS: true }), 'special2');

    // Throw vs throw_whiff
    f1.x = -1.0; f2.x = 1.5; f2.y = 0; f2.groundY = 0;
    assert.strictEqual(resolve('throw'), 'throw', 'Close grounded target must resolve to throw');
    f2.x = 6.0;
    assert.strictEqual(resolve('throw'), 'throw_whiff', 'Out-of-range target must resolve to throw_whiff');
    f2.x = 1.5; f2.y = 1.5;
    assert.strictEqual(resolve('throw'), 'throw_whiff', 'Airborne target must resolve to throw_whiff');
    f2.y = 0;

    // Hit-confirm cancel hierarchy (anti-whiff integrity + full chain)
    f1.startAttack('light');
    f1.actionTimer = f1.actionDuration * 0.60;
    f1.hasHitConfirmed = false;
    assert.strictEqual(f1.canCancelInto('light2'), false, 'Whiffed light must NOT cancel into light2');
    assert.strictEqual(f1.canCancelInto('heavy'), false, 'Whiffed light must NOT cancel into heavy');
    assert.strictEqual(f1.canCancelInto('super'), false, 'Whiffed light must NOT cancel into super');

    // Enable hit-confirm in cancel window (42%..90%)
    f1.hasHitConfirmed = true;
    ['light', 'light2', 'heavy', 'fwd_heavy', 'low_heavy', 'anti_air', 'special', 'special2', 'super', 'xray'].forEach(next => {
        assert.strictEqual(f1.canCancelInto(next), true, `Hit-confirmed light must cancel into ${next}`);
    });

    // light -> light2 auto-chain on startAttack('light')
    assert.strictEqual(f1.startAttack('light'), true, 'Hit-confirmed light should chain into light2');
    assert.strictEqual(f1.action, 'light2', 'Second light in combo must become light2');
    f1.actionTimer = f1.actionDuration * 0.60;
    f1.hasHitConfirmed = true;
    assert.strictEqual(f1.canCancelInto('light'), false, 'light2 must NOT loop back into light');
    assert.strictEqual(f1.canCancelInto('heavy'), true, 'light2 must cancel into heavy');
    assert.strictEqual(f1.canCancelInto('special2'), true, 'light2 must cancel into special2');
    assert.strictEqual(f1.canCancelInto('super'), true, 'light2 must cancel into super');

    // Heavy -> Special / Special2 / Super (not light/heavy)
    assert.strictEqual(f1.startAttack('heavy'), true);
    f1.actionTimer = f1.actionDuration * 0.60;
    f1.hasHitConfirmed = true;
    assert.strictEqual(f1.canCancelInto('light'), false, 'heavy must NOT cancel back to light');
    assert.strictEqual(f1.canCancelInto('heavy'), false, 'heavy must NOT cancel into heavy');
    assert.strictEqual(f1.canCancelInto('special'), true, 'heavy must cancel into special');
    assert.strictEqual(f1.canCancelInto('special2'), true, 'heavy must cancel into special2');
    assert.strictEqual(f1.canCancelInto('super'), true, 'heavy must cancel into super');

    // Special -> Super (Super Cancel!)
    assert.strictEqual(f1.startAttack('special'), true);
    f1.actionTimer = f1.actionDuration * 0.60;
    f1.hasHitConfirmed = true;
    assert.strictEqual(f1.canCancelInto('heavy'), false, 'special must NOT cancel into heavy');
    assert.strictEqual(f1.canCancelInto('special2'), false, 'special must NOT cancel into special2');
    assert.strictEqual(f1.canCancelInto('super'), true, 'special must Super-cancel into super');
    assert.strictEqual(f1.canCancelInto('xray'), true, 'xray alias must cancel into super');

    // Throw breaks matched guard, sets beingThrownTimer = 0.42, deals damage & launches
    f1.resetForRound(); f2.resetForRound();
    f1.x = -1.0; f2.x = 1.2; f1.facing = 1;
    f2.isBlocking = true; f2.blockType = 'mid'; f2.guardStartTime = h.getNowSec() - 0.5;
    const hpPreThrow = f2.hp;
    f1.startAttack('throw');
    const hitThrow = h.ctx.checkAttackCollision3D(f1, f2);
    assert.strictEqual(hitThrow, true, 'Throw must connect against blocking grounded opponent');
    assert.strictEqual(f2.beingThrownTimer, 0.42, 'Throw must set defender.beingThrownTimer = 0.42');
    assert(f2.hp < hpPreThrow, 'Unblockable throw must deal damage through guard');
    assert(f2.vy > 0, 'Throw must launch defender');

    // Combo-friendly knockdown check: neutral heavy on hit 1 does NOT hard-knockdown; low_heavy DOES
    f1.resetForRound(); f2.resetForRound();
    f1.action = 'heavy';
    h.ctx.applyDamage(f1, f2, 80, true, '', false, 'mid');
    assert.strictEqual(f2.combatController.isInKnockdownSequence(), false,
        'Neutral heavy on hit 1 must NOT cause hard knockdown so combos stay extendable');

    f1.resetForRound(); f2.resetForRound();
    f1.action = 'low_heavy';
    h.ctx.applyDamage(f1, f2, 80, true, '', false, 'low');
    assert.strictEqual(f2.combatController.isInKnockdownSequence(), true,
        'low_heavy sweep MUST cause hard knockdown');

    console.log('[PASS] Invariant 3: Full moveset resolution, ShiftLeft fix, hit-confirm cancel chain, unblockable throw & combo-friendly knockdown');
}

// ============================================================================
// INVARIANT 4: Canonical 21-species passives & weight classes
// ============================================================================
function testInvariant4_Canonical21SpeciesPassives() {
    const h = createCombatHarness({ forbidSetTimeout: true });
    assert.strictEqual(h.roster.length, 21, `Expected 21 playable fighters in DINO_ROSTER, found ${h.roster.length}`);

    const EXPECTED_HEAVY = ['apato', 'ankylo', 'pachyrhino', 'stegosaurus', 'giantsloth', 'dragon', 'dunkleosteus', 'cameroceras'];
    const EXPECTED_SPEED = ['smilodon', 'terabird', 'quetzal', 'pulmonoscorpius', 'maiasaura', 'postosuchus', 'anomalocaris', 'jaekelopterus', 'gorgonopsia'];
    const EXPECTED_BRAWLER = ['trex', 'spinosaurus', 'therizino', 'dimetrodon'];

    for (const dino of h.roster) {
        const fighter = new h.Fighter3D(dino, true, 0);
        const cfg = fighter.getCombatConfig();
        if (EXPECTED_HEAVY.includes(dino.id)) {
            assert.strictEqual(fighter.weightClass, 'heavy', `${dino.id} should be heavy weightClass`);
            assert.strictEqual(fighter.gravityScale, 1.30, `${dino.id} heavy gravityScale`);
            assert.strictEqual(fighter.knockbackMult, 0.65, `${dino.id} heavy knockbackMult`);
            assert.strictEqual(cfg.momentumCoefficient, 0.062, `${dino.id} heavy momentumCoefficient`);
        } else if (EXPECTED_SPEED.includes(dino.id)) {
            assert.strictEqual(fighter.weightClass, 'speed', `${dino.id} should be speed weightClass`);
            assert.strictEqual(fighter.gravityScale, 0.82, `${dino.id} speed gravityScale`);
            assert.strictEqual(fighter.knockbackMult, 1.25, `${dino.id} speed knockbackMult`);
            assert.strictEqual(cfg.momentumCoefficient, 0.042, `${dino.id} speed momentumCoefficient`);
        } else if (EXPECTED_BRAWLER.includes(dino.id)) {
            assert.strictEqual(fighter.weightClass, 'brawler', `${dino.id} should be brawler weightClass`);
            assert.strictEqual(cfg.momentumCoefficient, 0.052, `${dino.id} brawler momentumCoefficient`);
        } else {
            assert.fail(`Unexpected fighter ID in roster: ${dino.id}`);
        }
        fighter.destroy();
    }

    // 4A. Ankylosaurus ('ankylo') Hyper-Armor on heavy attacks
    const { f1: ankylo, f2: attacker } = h.spawnDuel('ankylo', 'trex');
    assert.strictEqual(ankylo.startAttack('heavy'), true);
    assert.strictEqual(ankylo.hasHyperArmor, true, 'Ankylosaurus heavy attack must activate hasHyperArmor');
    const ankHpBefore = ankylo.hp;
    const armorRes = h.ctx.applyDamage(attacker, ankylo, 60, false, '', false, 'mid');
    assert.strictEqual(armorRes, 'armor', 'Light attack against armored Ankylo must trigger hyper-armor');
    assert.strictEqual(ankylo.hitStun, 0, 'Hyper-armor must prevent hitstun');
    assert.strictEqual(ankylo.action, 'heavy', 'Hyper-armor must NOT interrupt Ankylo heavy attack');
    assert.strictEqual(ankHpBefore - ankylo.hp, 30, 'Hyper-armor must halve incoming light damage (60 -> 30)');

    // Heavy attack breaks through Ankylo hyper-armor
    const heavyRes = h.ctx.applyDamage(attacker, ankylo, 80, true, '', false, 'mid');
    assert.strictEqual(heavyRes, 'hit', 'Heavy attack must break through Ankylo hyper-armor');

    // 4B. Ankylosaurus ('ankylo') Projectile Reflection
    ankylo.resetForRound(); attacker.resetForRound();
    h.ctx.hitstopTimer = 0; h.ctx.hitstopTarget = null;
    ankylo.x = -2.0; attacker.x = 5.0;
    ankylo.action = 'special';
    ankylo.actionDuration = 0.5;
    const mockMesh = new h.THREE.Mesh();
    mockMesh.position.set(-0.5, 1.8, 0);
    h.ctx.projectiles3D.push({
        owner: attacker,
        mesh: mockMesh,
        kind: 'boulder',
        vx: -15.0,
        damage: 85,
        life: 1.5
    });
    h.step(1 / 60);
    assert.strictEqual(h.ctx.projectiles3D.length, 1, 'Reflected projectile should remain active');
    assert.strictEqual(h.ctx.projectiles3D[0].owner, ankylo, 'Ankylo must take ownership of reflected projectile');
    assert(h.ctx.projectiles3D[0].vx > 18, `Reflected projectile vx must reverse and boost by 1.35x, got ${h.ctx.projectiles3D[0].vx}`);

    // 4C. Therizinosaurus ('therizino') 40% Guard Shred
    const { f1: theri, f2: blocker } = h.spawnDuel('therizino', 'trex');
    blocker.isBlocking = true;
    blocker.blockType = 'mid';
    blocker.guardStartTime = h.getNowSec() - 0.5; // Normal block (outside 130ms parry window)
    const blkHpBefore = blocker.hp;
    const shredRes = h.ctx.applyDamage(theri, blocker, 100, false, '', false, 'mid');
    assert.strictEqual(shredRes, 'block', 'Matched block against Therizino still returns block');
    assert.strictEqual(blkHpBefore - blocker.hp, 40, 'Therizino must shred matched guard for 40% chip damage (40 HP)');

    console.log('[PASS] Invariant 4: All 21 canonical weight classes + ankylo Hyper-Armor & Projectile Reflect + therizino 40% Guard Shred');
}

// ============================================================================
// INVARIANT 5: Counter-Hit (+20% dmg, +35% hitstun) & Perfect Parry (<=130ms)
// ============================================================================
function testInvariant5_CounterHitAndPerfectParry() {
    const h = createCombatHarness({ forbidSetTimeout: true });
    const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');

    // Baseline neutral hit (idle defender)
    const hpBaseBefore = f2.hp;
    const resBase = h.ctx.applyDamage(f1, f2, 100, false, '', false, 'mid');
    assert.strictEqual(resBase, 'hit');
    const baseDmg = hpBaseBefore - f2.hp;
    const baseStun = f2.hitStun;

    // Counter-Hit (defender in ATTACK_WINDUP)
    f1.resetForRound(); f2.resetForRound();
    h.ctx.hitstopTimer = 0; h.ctx.camFovKick = 0;
    f2.combatController.state = h.CombatState.ATTACK_WINDUP;
    const hpCounterBefore = f2.hp;
    const counterSfxBefore = h.calls.sfx.playCounterHit || 0;
    const counterBurstBefore = h.calls.counterBursts;
    const resCounter = h.ctx.applyDamage(f1, f2, 100, false, '', false, 'mid');
    assert.strictEqual(resCounter, 'hit');
    const counterDmg = hpCounterBefore - f2.hp;
    const counterStun = f2.hitStun;

    assert.strictEqual(counterDmg, Math.round(baseDmg * 1.20),
        `Counter-Hit damage must be +20% (${Math.round(baseDmg * 1.20)}), got ${counterDmg}`);
    assert(Math.abs(counterStun - baseStun * 1.35) < 0.001,
        `Counter-Hit hitstun must be +35% (${(baseStun * 1.35).toFixed(4)}), got ${counterStun.toFixed(4)}`);
    assert(h.ctx.hitstopTimer >= 0.055 + 0.055 - 0.001, 'Counter-Hit must add +0.055s hitstop');
    assert(h.ctx.camFovKick >= 3.2, 'Counter-Hit must trigger camFovKick >= 3.2');
    assert.strictEqual(f2.hitFlashColor, 0xf97316, 'Counter-Hit must tint defender hitFlashColor orange (0xf97316)');
    assert((h.calls.sfx.playCounterHit || 0) > counterSfxBefore, 'Counter-Hit must call sfx.playCounterHit()');
    assert(h.calls.counterBursts > counterBurstBefore, 'Counter-Hit must call spawn3DCounterBurst()');

    // Perfect Parry (<= 130ms guard timestamp)
    f1.resetForRound(); f2.resetForRound();
    h.ctx.hitstopTimer = 0;
    f2.isBlocking = true;
    f2.blockType = 'mid';
    f2.guardStamina = 100;
    f2.rage = 10;
    f2.guardStartTime = h.getNowSec() - 0.06; // 60ms <= 130ms
    const parrySfxBefore = h.calls.sfx.playParry || 0;
    const parryBurstBefore = h.calls.parryBursts;
    const hpPreParry = f2.hp;

    const parryRes = h.ctx.applyDamage(f1, f2, 95, true, '', false, 'mid');
    assert.strictEqual(parryRes, 'parry', 'Matched guard <= 130ms must trigger Perfect Parry');
    assert.strictEqual(f2.hp, hpPreParry, 'Perfect Parry must take 0 damage');
    assert.strictEqual(f2.guardStamina, 100, 'Perfect Parry must cost 0 guard stamina');
    assert.strictEqual(f2.rage, 25, 'Perfect Parry must grant +15 Rage (10 -> 25)');
    assert.strictEqual(f1.combatController.state, h.CombatState.BLOCK_DEFLECTED, 'Perfect Parry must deflect attacker');
    assert.strictEqual(f1.combatController.deflectTimer, 0.48, 'Perfect Parry must extend attacker deflectTimer to 0.48s');
    assert.strictEqual(f2.hitFlashColor, 0xfef08a, 'Perfect Parry must set gold hitFlashColor');
    assert.strictEqual(h.ctx.hitstopTimer, 0.11, 'Perfect Parry must set hitstopTimer = 0.11');
    assert((h.calls.sfx.playParry || 0) > parrySfxBefore, 'Perfect Parry must call sfx.playParry()');
    assert(h.calls.parryBursts > parryBurstBefore, 'Perfect Parry must call spawn3DParryBurst()');

    // Normal Block (> 130ms guard timestamp) -> drains guardStamina, 0 dmg, calls sfx.playBlock
    f1.resetForRound(); f2.resetForRound();
    f2.isBlocking = true;
    f2.blockType = 'mid';
    f2.guardStamina = 100;
    f2.guardStartTime = h.getNowSec() - 0.25; // 250ms > 130ms
    const blkSfxBefore = h.calls.sfx.playBlock || 0;
    const blkRes = h.ctx.applyDamage(f1, f2, 95, true, '', false, 'mid');
    assert.strictEqual(blkRes, 'block', 'Matched guard > 130ms must be a normal block');
    assert.strictEqual(f2.hp, f2.maxHp, 'Normal non-therizino matched block takes 0 damage');
    assert.strictEqual(f2.guardStamina, 72, 'Heavy attack normal block drains 28 guard stamina (100 -> 72)');
    assert((h.calls.sfx.playBlock || 0) > blkSfxBefore, 'Normal block must call sfx.playBlock()');

    // Guard Break when stamina hits 0
    f2.guardStamina = 10;
    const gbSfxBefore = h.calls.sfx.playGuardBreak || 0;
    const gbRes = h.ctx.applyDamage(f1, f2, 90, true, '', false, 'mid');
    assert.strictEqual(gbRes, 'hit', 'Guard break must allow the hit through');
    assert((h.calls.sfx.playGuardBreak || 0) > gbSfxBefore, 'Guard break must call sfx.playGuardBreak()');
    assert(h.ctx.hitstopTimer >= 0.16, 'Guard break must set hitstopTimer >= 0.16');
    assert(h.ctx.camFovKick >= 3.0, 'Guard break must set camFovKick >= 3.0');

    console.log('[PASS] Invariant 5: Counter-Hit (+20% dmg, +35% stun), Perfect Parry (<=130ms, 0 stam, +15 Rage, 0.48s deflect), Block & Guard Break');
}

// ============================================================================
// INVARIANT 6: Universal 140ms Input Buffer (recovery, landing & expiry)
// ============================================================================
function testInvariant6_UniversalInputBuffer() {
    const h = createCombatHarness({ forbidSetTimeout: true });
    const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
    f1.x = -5.0; f2.x = 5.0;

    // Case A: Press 'heavy' during final 60ms of a whiffed light recovery -> fires on frame 1 after recovery
    f1.startAttack('light');
    f1.hasHitConfirmed = false;
    f1.actionTimer = f1.actionDuration - 0.05; // 50ms remaining (< 140ms buffer)
    h.ctx.triggerPlayerAction(f1, f2, 'heavy');
    assert.strictEqual(f1.action, 'light', 'Must stay in light recovery before recovery completes');
    assert(f1.bufferedInput && f1.bufferedInput.type === 'heavy', 'Heavy should be queued in 140ms bufferedInput');

    // Step 4 frames (67ms > 50ms) -> heavy MUST fire immediately upon exiting recovery!
    for (let i = 0; i < 4; i++) h.step(1 / 60);
    assert.strictEqual(f1.action, 'heavy', `Buffered 'heavy' must execute immediately after recovery, got '${f1.action}'`);
    assert.strictEqual(f1.bufferedInput, null, 'bufferedInput must clear once consumed');

    // Case B: Press 'jump' (or 'light') 45ms before landing -> landing squash + sfx.playLand + buffer flushes on landing frame!
    f1.resetForRound(); f2.resetForRound();
    f1.x = -5.0; f2.x = 5.0;
    f1.y = 0.28;
    f1.vy = -8.0;
    f1._wasAirborne = true;
    f1.juggleCount = 2;
    const landSfxBefore = h.calls.sfx.playLand || 0;
    const dustBefore = h.calls.dustPuffs;

    h.ctx.triggerPlayerAction(f1, f2, 'jump');
    assert(f1.bufferedInput && f1.bufferedInput.type === 'jump', 'Jump pressed just before landing must buffer');

    // Step until fighter lands (within 3 frames)
    let landedAndJumped = false;
    for (let i = 0; i < 4; i++) {
        h.step(1 / 60);
        if (f1.landingSquashTimer > 0 && f1.action === 'jump' && f1.vy > 8) {
            landedAndJumped = true;
            break;
        }
    }
    assert(landedAndJumped, 'Buffered jump must flush on frame 1 of landing while triggering landingSquashTimer');
    assert.strictEqual(f1.juggleCount, 0, 'Landing must reset juggleCount to 0');
    assert((h.calls.sfx.playLand || 0) > landSfxBefore, 'Landing must call sfx.playLand()');
    assert(h.calls.dustPuffs > dustBefore, 'Landing must spawn dust puff');

    // Case C: Buffer expires after 140ms while fighter remains locked in hitStun
    f1.resetForRound(); f2.resetForRound();
    f1.hitStun = 0.40;
    h.ctx.triggerPlayerAction(f1, f2, 'heavy');
    assert(f1.bufferedInput && f1.bufferedInput.type === 'heavy');
    for (let i = 0; i < 12; i++) h.step(1 / 60); // 200ms > 140ms
    assert.strictEqual(f1.bufferedInput, null, 'Buffered input must expire cleanly after 140ms TTL');
    // Finish hitStun -> expired buffer must NOT fire late!
    for (let i = 0; i < 20; i++) h.step(1 / 60);
    assert.notStrictEqual(f1.action, 'heavy', 'Expired buffer must NOT fire after hitStun ends');

    console.log('[PASS] Invariant 6: Universal 140ms input buffer (recovery flush, landing flush + squash/audio/dust, TTL expiry)');
}

// ============================================================================
// INVARIANT 7: All 21 Fighters Real Super Attack Lifecycle & Extinction Finish
// ============================================================================
function testInvariant7_All21SupersAndExtinctionFinish() {
    const h = createCombatHarness({ forbidSetTimeout: true });
    const SUPER_SPECS = vm.runInContext('SUPER_SPECS', h.ctx);
    const getSuperSpec = h.ctx.getSuperSpec;

    // 7A. Verify all 21 roster fighters have valid SUPER_SPECS + alias resolution
    assert.strictEqual(Object.keys(SUPER_SPECS).length, 21, 'SUPER_SPECS must cover all 21 fighters');
    let rushCount = 0, aoeCount = 0;
    for (const dino of h.roster) {
        const spec = SUPER_SPECS[dino.id];
        assert(spec, `Missing SUPER_SPECS entry for ${dino.id}`);
        assert(typeof spec.name === 'string' && spec.name.length > 0, `Invalid spec.name for ${dino.id}`);
        assert(['cinematic_rush', 'beam', 'seismic_aoe', 'dive_aoe'].includes(spec.archetype), `Invalid archetype for ${dino.id}`);
        assert(Array.isArray(spec.beats) && spec.beats.length === 3, `Spec for ${dino.id} must have 3 beats`);
        if (spec.archetype === 'cinematic_rush') rushCount++;
        else aoeCount++;
    }
    assert.strictEqual(rushCount, 15, 'Expected 15 cinematic_rush Supers');
    assert.strictEqual(aoeCount, 6, 'Expected 6 beam/seismic_aoe/dive_aoe Supers');

    // Alias checks
    assert.strictEqual(getSuperSpec('apatosaurus').name, SUPER_SPECS.apato.name);
    assert.strictEqual(getSuperSpec('ankylosaurus').name, SUPER_SPECS.ankylo.name);
    assert.strictEqual(getSuperSpec('pachyrhinosaurus').name, SUPER_SPECS.pachyrhino.name);
    assert.strictEqual(getSuperSpec('terror-bird').name, SUPER_SPECS.terabird.name);
    assert.strictEqual(getSuperSpec('quetzalcoatlus').name, SUPER_SPECS.quetzal.name);
    assert.strictEqual(getSuperSpec('therizinosaurus').name, SUPER_SPECS.therizino.name);
    assert.strictEqual(getSuperSpec('megatherium').name, SUPER_SPECS.giantsloth.name);

    // 7B. Rage gate (< 100 rejected, 100 consumes without cooldown block)
    {
        const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
        f1.rage = 99;
        assert.strictEqual(h.ctx.executeSuperAttack(f1, f2), false, 'Super must be rejected below 100% Rage');
        assert.strictEqual(h.ctx.superState, null);
    }

    // 7C. Whiff path on cinematic_rush (far opponent -> Flash -> Startup -> Whiff Recovery -> null)
    {
        const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
        f1.x = -10.0; f2.x = 10.0; f1.rage = 100;
        const hpInit = f2.hp;
        assert.strictEqual(h.ctx.executeSuperAttack(f1, f2), true);
        assert.strictEqual(h.ctx.superState.phase, 'flash');
        let sawStartup = false, sawWhiff = false;
        for (let i = 0; i < 120 && h.ctx.superState; i++) {
            h.step(0.02);
            if (h.ctx.superState && h.ctx.superState.phase === 'startup') sawStartup = true;
            if (h.ctx.superState && h.ctx.superState.phase === 'whiff_recovery') sawWhiff = true;
        }
        assert(sawStartup && sawWhiff, 'Whiffed cinematic_rush must pass through startup -> whiff_recovery');
        assert.strictEqual(h.ctx.superState, null, 'Whiffed Super must clean up to null');
        assert.strictEqual(f2.hp, hpInit, 'Whiffed Super must deal 0 damage');
    }

    // 7D. Blocked path on cinematic_rush (18% chip, -55 guardStamina, bounce into whiff_recovery)
    {
        const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
        f1.x = -1.5; f2.x = 1.5; f1.rage = 100;
        h.ctx.keys['Numpad5'] = true; // P2 holds Guard
        f2.isBlocking = true; f2.blockType = 'mid'; f2._prevBlockType = 'mid';
        f2.guardStamina = 100;
        f2.guardStartTime = h.getNowSec() - 0.5; // Normal block (not parry)
        const hpInit = f2.hp;
        assert.strictEqual(h.ctx.executeSuperAttack(f1, f2), true);
        let enteredWhiff = false;
        for (let i = 0; i < 90 && h.ctx.superState; i++) {
            h.step(0.02);
            if (h.ctx.superState && h.ctx.superState.phase === 'whiff_recovery') enteredWhiff = true;
        }
        h.ctx.keys['Numpad5'] = false;
        assert(enteredWhiff, 'Blocked Super Rush must bounce attacker into whiff_recovery');
        assert(f2.hp < hpInit && (hpInit - f2.hp) < 120, `Blocked Super must deal ~18% chip, got ${hpInit - f2.hp}`);
        assert(f2.guardStamina <= 55, `Blocked Super must drain 55 guard stamina, remaining=${f2.guardStamina}`);
        assert.strictEqual(h.ctx.superState, null);
    }

    // 7E. Perfect Parried Super Rush (<=130ms -> 0 chip, 0 stamina loss, +15 Rage)
    {
        const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
        f1.x = -1.5; f2.x = 1.5; f1.rage = 100;
        f2.guardStamina = 100; f2.rage = 0;
        const hpInit = f2.hp;
        assert.strictEqual(h.ctx.executeSuperAttack(f1, f2), true);
        let parried = false;
        let tappedGuard = false;
        for (let i = 0; i < 90 && h.ctx.superState; i++) {
            // Defender taps P2 Guard right as startup begins (authentic 130ms Perfect Parry!)
            if (!tappedGuard && h.ctx.superState && h.ctx.superState.phase === 'startup') {
                tappedGuard = true;
                h.ctx.keys['Numpad5'] = true;
            }
            h.step(0.02);
            if (h.ctx.superState && h.ctx.superState.phase === 'whiff_recovery') parried = true;
        }
        h.ctx.keys['Numpad5'] = false;
        assert(parried, 'Perfect-Parried Super Rush must send attacker to whiff_recovery');
        assert.strictEqual(f2.hp, hpInit, 'Perfect-Parried Super must deal 0 chip damage');
        assert.strictEqual(f2.guardStamina, 100, 'Perfect-Parried Super must cost 0 guard stamina');
        assert(f2.rage >= 15, `Perfect-Parried Super must grant +15 Rage, got ${f2.rage}`);
    }

    // 7F. Execute FULL Super lifecycle for ALL 21 fighters (15 cinematic_rush + 6 AoE/Beam/Dive)!
    for (const dino of h.roster) {
        const { f1, f2 } = h.spawnDuel(dino.id, 'apato'); // apato has 1400 HP so non-lethal full run
        f1.x = -1.5; f2.x = 1.5;
        f1.rage = 100;
        f2.hp = 2000; f2.maxHp = 2000;
        const spec = SUPER_SPECS[dino.id];
        const ok = h.ctx.executeSuperAttack(f1, f2);
        assert.strictEqual(ok, true, `executeSuperAttack failed for ${dino.id}`);

        let sawCinematic = false, sawAoe = false, maxBeat = 0, maxAoeTicks = 0;
        for (let i = 0; i < 240 && h.ctx.superState; i++) {
            h.step(0.02);
            const st = h.ctx.superState;
            if (st) {
                if (st.phase === 'cinematic') sawCinematic = true;
                if (st.phase === 'active_aoe') sawAoe = true;
                if (st.beatApplied > maxBeat) maxBeat = st.beatApplied;
                if (st.aoeTicks > maxAoeTicks) maxAoeTicks = st.aoeTicks;
            }
        }
        assert.strictEqual(h.ctx.superState, null, `Super for ${dino.id} did not terminate cleanly`);
        assert.strictEqual(f1.isSuperAttacker, false, `${dino.id} isSuperAttacker leaked`);
        assert.strictEqual(f2.isSuperTarget, false, `${dino.id} target isSuperTarget leaked`);
        const totalDealt = 2000 - f2.hp;
        assert(totalDealt >= 120, `Super for ${dino.id} dealt too little damage: ${totalDealt}`);
        if (spec.archetype === 'cinematic_rush') {
            assert(sawCinematic && maxBeat === 3, `${dino.id} cinematic_rush must run 3 beats (maxBeat=${maxBeat})`);
            if (spec.statusEffect === 'bleed') assert.strictEqual(f2.bleedStacks, 3, `${dino.id} should apply bleed x3`);
            if (spec.statusEffect === 'venom') assert.strictEqual(f2.poisonStacks, 3, `${dino.id} should apply venom x3`);
            if (spec.statusEffect === 'intimidate') assert(f2.atkPowerMod < 1.0, `${dino.id} should apply intimidate`);
        } else {
            assert(sawAoe && maxAoeTicks === 5, `${dino.id} (${spec.archetype}) must fire 5 AoE pulses (ticks=${maxAoeTicks})`);
        }
    }

    // 7G. Combo proration floor (55%) on combo-cancelled Super
    {
        const { f1, f2 } = h.spawnDuel('trex', 'apato');
        f1.x = -1.5; f2.x = 1.5; f1.rage = 100; f1.comboCount = 5;
        f2.hp = 2000; f2.maxHp = 2000;
        const spec = SUPER_SPECS.trex;
        const rawExpected = Math.round(f1.dino.stats.pow * spec.baseDmgMult);
        h.ctx.executeSuperAttack(f1, f2);
        for (let i = 0; i < 240 && h.ctx.superState; i++) h.step(0.02);
        const dealt = 2000 - f2.hp;
        assert(dealt >= Math.round(rawExpected * 0.55) - 2,
            `Combo-cancelled Super must honor 55% floor (>= ${Math.round(rawExpected * 0.55)}), got ${dealt}`);
    }

    // 7H. Automatic EXTINCTION FINISH on lethal final round (both cinematic_rush & beam) + Slow-Mo K.O., ZERO finish_him
    for (const fighterId of ['trex', 'dragon']) {
        const { f1, f2 } = h.spawnDuel(fighterId, 'spinosaurus');
        f1.x = -1.5; f2.x = 1.5;
        f1.rage = 100;
        f1.roundsWon = 1; // Final round!
        f2.hp = 120;      // Lethal range for Super
        const koSfxBefore = h.calls.sfx.playKoFinish || 0;
        const postMatchBefore = h.calls.postMatchShown;

        assert.strictEqual(h.ctx.executeSuperAttack(f1, f2), true);

        let sawExtinctionSlowMo = false;
        let sawFinishHim = false;
        let overlayPrematurelyHidden = false;
        for (let i = 0; i < 320 && h.ctx.matchState !== 'match_over'; i++) {
            h.step(0.02);
            if (h.ctx.matchState === 'finish_him') sawFinishHim = true;
            if (h.ctx.koSlowMoTimer > 0 && h.ctx.koPendingData && h.ctx.koPendingData.isExtinctionFinish) {
                sawExtinctionSlowMo = true;
                assert.strictEqual(h.ctx.battleTimeScale, 0.18, 'Extinction Finish must run at 0.18x slow-mo');
                if (h.ctx.koSlowMoTimer > 0.10 && h.domMap.superFlashOverlay.classList.contains('hidden')) {
                    overlayPrematurelyHidden = true;
                }
            }
        }
        assert.strictEqual(sawFinishHim, false, `matchState must NEVER enter finish_him (${fighterId})`);
        assert.strictEqual(sawExtinctionSlowMo, true, `Lethal final-round Super (${fighterId}) must trigger EXTINCTION FINISH slow-mo`);
        assert.strictEqual(overlayPrematurelyHidden, false,
            `Extinction Finish overlay (${fighterId}) must stay visible during slow-mo until KO completes`);
        assert.strictEqual((h.calls.sfx.playKoFinish || 0) - koSfxBefore, 1,
            `Extinction Finish (${fighterId}) must play sfx.playKoFinish(true) ONCE (got ${(h.calls.sfx.playKoFinish || 0) - koSfxBefore})`);
        assert.strictEqual(h.ctx.matchState, 'match_over', `Extinction Finish (${fighterId}) must finish into match_over`);
        assert.strictEqual(h.ctx.battleTimeScale, 1.0, 'battleTimeScale must restore to 1.0 after slow-mo KO');
        assert.strictEqual(h.ctx.superState, null, 'superState must be null after match_over');
        assert(h.calls.postMatchShown > postMatchBefore, 'Post-Match menu must display after Extinction Finish');
    }

    // 7I. Regular final-round K.O. triggers Dramatic Slow-Mo K.O. (0.22x, 0.95s) directly to match_over (ZERO finish_him)
    {
        const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
        f1.roundsWon = 1;
        f2.hp = 30;
        let sawFinishHim = false;
        let sawSlowMo = false;
        h.ctx.applyDamage(f1, f2, 90, true, '', false, 'mid');
        assert.strictEqual(f2.isDead, true, 'Lethal hit must set loser.isDead = true');
        assert.strictEqual(f2.hp, 0, 'Lethal hit must drop loser.hp to 0 (no 1 HP dizzy freeze)');
        assert.strictEqual(h.ctx.koSlowMoTimer, 0.95, 'Regular KO slow-mo must be 0.95s');
        assert.strictEqual(h.ctx.battleTimeScale, 0.22, 'Regular KO slow-mo must be 0.22x');
        assert(h.ctx.koPendingData && h.ctx.koPendingData.isExtinctionFinish === false);
        assert(Math.abs(f2.vx) > 0.5 || Math.abs(f2.vy) > 0.5, 'Regular KO must preserve/apply dramatic launch velocity');

        for (let i = 0; i < 120 && h.ctx.matchState !== 'match_over'; i++) {
            h.step(0.02);
            if (h.ctx.matchState === 'finish_him') sawFinishHim = true;
            if (h.ctx.koSlowMoTimer > 0) sawSlowMo = true;
        }
        assert.strictEqual(sawFinishHim, false, 'Regular final-round KO must NEVER enter finish_him');
        assert.strictEqual(sawSlowMo, true, 'Regular KO must step through slow-mo');
        assert.strictEqual(h.ctx.matchState, 'match_over', 'Regular final-round KO must finish into match_over');
        assert.strictEqual(h.ctx.battleTimeScale, 1.0);
    }

    // 7J. Pause-safety of updateBattle3D during hitstop & koSlowMoTimer
    {
        const { f1, f2 } = h.spawnDuel('trex', 'spinosaurus');
        h.ctx.hitstopTimer = 0.10;
        h.ctx.koSlowMoTimer = 0.80;
        f1.x = -2.0; f1.vx = 6.0;
        h.ctx.isMatchPaused = true;
        h.step(0.5);
        assert.strictEqual(h.ctx.hitstopTimer, 0.10, 'Paused updateBattle3D must NOT tick hitstopTimer');
        assert.strictEqual(h.ctx.koSlowMoTimer, 0.80, 'Paused updateBattle3D must NOT tick koSlowMoTimer');
        assert.strictEqual(f1.x, -2.0, 'Paused updateBattle3D must NOT integrate fighter position');
    }

    console.log('[PASS] Invariant 7: All 21 fighters SUPER_SPECS & lifecycles, whiff/block/parry, 55% floor, Extinction Finish, Slow-Mo KO & pause-safety');
}

// ============================================================================
// INVARIANT 8: Layered Procedural Web Audio + Scene/Effects/Anim/HUD Integration
// ============================================================================
function testInvariant8_AudioAndVisualHudIntegration() {
    // 8A. Layered SoundEngine (all 12+ methods active & muted)
    const freqsRecorded = [];
    let oscCount = 0;
    let bufCount = 0;
    const mockAudioCtx = {
        state: 'running',
        currentTime: 1.0,
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
                frequency: {
                    value: 440,
                    setValueAtTime(v) { freqsRecorded.push(v); },
                    exponentialRampToValueAtTime() {},
                    linearRampToValueAtTime() {}
                },
                connect() {},
                start() {},
                stop() {}
            };
        },
        createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
        createBufferSource() {
            bufCount++;
            return { buffer: null, connect() {}, start() {}, stop() {} };
        },
        createBiquadFilter() {
            return {
                type: 'lowpass',
                frequency: { value: 1000, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
                Q: { value: 1 },
                connect() {}
            };
        }
    };

    const sfxCtx = vm.createContext({
        window: { AudioContext: function () { return mockAudioCtx; } },
        console,
        Math,
        setInterval: () => 1,
        clearInterval: () => {}
    });
    loadScript(sfxCtx, 'js/core/sound.js');
    const engine = vm.runInContext('new SoundEngine()', sfxCtx);
    engine.init();

    const methods = [
        ['playSwing(false)', () => engine.playSwing(false)],
        ['playSwing(true)', () => engine.playSwing(true)],
        ['playHit(false, combo=1)', () => engine.playHit(false, { comboCount: 1 })],
        ['playHit(true, combo=5)', () => engine.playHit(true, { comboCount: 5 })],
        ['playCounterHit()', () => engine.playCounterHit()],
        ['playBlock(false)', () => engine.playBlock(false)],
        ['playBlock(true)', () => engine.playBlock(true)],
        ['playParry()', () => engine.playParry()],
        ['playGuardBreak()', () => engine.playGuardBreak()],
        ['playJump()', () => engine.playJump()],
        ['playLand(false)', () => engine.playLand(false)],
        ['playLand(true)', () => engine.playLand(true)],
        ['playFootstep(false)', () => engine.playFootstep(false)],
        ['playFootstep(true)', () => engine.playFootstep(true)],
        ['playDash()', () => engine.playDash()],
        ['playSuperFlash()', () => engine.playSuperFlash()],
        ['playKoFinish(false)', () => engine.playKoFinish(false)],
        ['playKoFinish(true)', () => engine.playKoFinish(true)]
    ];

    for (const [label, fn] of methods) {
        const prevTotal = oscCount + bufCount;
        fn();
        assert(oscCount + bufCount > prevTotal, `${label} should synthesize at least one audio node when enabled`);
    }

    // Verify muted state produces zero nodes and does not throw
    engine.setEnabled(false);
    const mutedSnap = oscCount + bufCount;
    for (const [, fn] of methods) fn();
    assert.strictEqual(oscCount + bufCount, mutedSnap, 'Muted SoundEngine must not allocate audio nodes');

    // 8B. Scene Camera Director, Lighting Dim/Restore & FOV Kick
    const THREE = makeThreeStub();
    const sceneCtx = vm.createContext({
        THREE,
        window: { devicePixelRatio: 1, screenShakeMultiplier: 1.0, addEventListener() {} },
        localStorage: makeStorage(),
        document: { getElementById: () => createMockElement('canvas', 'battleCanvas') },
        performance: { now: () => 1000 },
        Math,
        console,
        graphicsQuality: 'high',
        matchState: 'fight',
        superState: null,
        koSlowMoTimer: 0,
        koPendingData: null,
        screenShake: 0,
        camRecoilX: 0,
        camRecoilY: 0,
        camFovKick: 0,
        fighter1: { x: -3, y: 0, facing: 1, isDead: false },
        fighter2: { x: 3, y: 0, facing: -1, isDead: false }
    });
    loadScript(sceneCtx, 'js/core/scene.js');
    sceneCtx.initBattle3DScene();

    const battleLights = vm.runInContext('battleLights', sceneCtx);
    const battleCamera = vm.runInContext('battleCamera', sceneCtx);
    assert(battleLights && battleLights.sun && battleLights.amb, 'scene.js must store battleLights');
    const baseSun = battleLights.base.sun;

    // Trigger Super Flash -> lights dim, FOV kick applies & decays
    sceneCtx.superState = { phase: 'flash', attacker: sceneCtx.fighter1, defender: sceneCtx.fighter2, beat: 0 };
    sceneCtx.camFovKick = 4.0;
    sceneCtx.camRecoilX = 0.6;
    sceneCtx.renderBattle3D(1016);
    sceneCtx.renderBattle3D(1032);
    assert(battleLights.sun.intensity < baseSun * 0.9, 'Super Flash must dim arena sunLight intensity');
    assert(battleCamera.fov > 45, 'camFovKick must punch battleCamera.fov above 45');
    assert(sceneCtx.camFovKick < 4.0 && sceneCtx.camRecoilX < 0.6, 'renderBattle3D must exponentially decay camFovKick & camRecoilX');

    sceneCtx.resetBattleLighting();
    assert.strictEqual(battleLights.sun.intensity, baseSun, 'resetBattleLighting() must restore exact base sunLight intensity');

    // 8C. Effects pooled VFX + ownsMaterial disposal check
    const fxCtx = vm.createContext({
        THREE,
        window: { goreAndBloodEnabled: false, particlesMultiplier: 1.0 },
        Math,
        console,
        graphicsQuality: 'high',
        fxGroup: new THREE.Group(),
        particles3D: [],
        projectiles3D: []
    });
    loadScript(fxCtx, 'js/core/effects.js');
    const mockAtt = { x: -2, y: 0, groundY: 0, facing: 1, dino: { accentColor: 0xff0000 } };
    fxCtx.spawn3DDustPuff(0, 0, 1.0, 6);
    fxCtx.spawn3DCounterBurst(0, 2);
    fxCtx.spawn3DParryBurst(0, 2);
    fxCtx.spawn3DSuperAura(mockAtt, 0xf59e0b);
    fxCtx.spawn3DSuperBeam(mockAtt, 0xff3b00, 11.5);
    assert(fxCtx.particles3D.length >= 20, `All 5 new VFX helpers should spawn particles (got ${fxCtx.particles3D.length})`);
    assert(fxCtx.particles3D.some(p => p.ownsMaterial === true), 'Custom FX particles must mark ownsMaterial: true for disposal');

    // 8D. Multi-material Hit-Flash, 3D Guard Armor, Super Animation & Heavyweight Footsteps
    let animFatalityCalls = 0;
    let footstepSfxCalls = 0;
    let dustCalls = 0;
    const animCtx = vm.createContext({
        THREE,
        window: {},
        Math,
        console,
        CombatState: { WAKE_UP_STAND: 'WAKE_UP_STAND', KNOCKDOWN_FALL: 'KNOCKDOWN_FALL', GROUNDED_IDLE: 'GROUNDED_IDLE', BLOCK_DEFLECTED: 'BLOCK_DEFLECTED' },
        FIGHTER_IMPLS: {
            trex: {
                animBaseHipsY: 2.1,
                animateFatality() { animFatalityCalls++; },
                animateWalk() {}
            }
        },
        FIGHTER_ANIMATIONS: {},
        superState: null,
        screenShake: 0,
        sfx: { playFootstep() { footstepSfxCalls++; } },
        spawn3DDustPuff() { dustCalls++; },
        computeAttackBiomechanics: () => ({ strike: 0, swing: 0, anticipate: 0 }),
        applyUniversalAttackBase() {},
        applyPostAttackBiomechanics() {}
    });
    loadScript(animCtx, 'js/animations/common/rig_reset.js');
    loadScript(animCtx, 'js/animations/common/combat_reactions.js');
    loadScript(animCtx, 'js/core/animation.js');

    const matA = new THREE.MeshStandardMaterial({ color: 0x884422 });
    const matB = new THREE.MeshStandardMaterial({ color: 0x553311 });
    const armorMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.85 });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const fakeRig = {
        _isGlbHydrated: true,
        root: new THREE.Group(),
        hips: new THREE.Group(),
        torso: new THREE.Group(),
        neck: new THREE.Group(),
        headGroup: new THREE.Group(),
        jaw: new THREE.Group(),
        arms: [new THREE.Group(), new THREE.Group()],
        legs: [new THREE.Group(), new THREE.Group()],
        tailSegments: [new THREE.Group()],
        specialParts: {},
        skeletonGroup: new THREE.Group(),
        shieldMesh: new THREE.Mesh(),
        bodyMat: matA,
        skinMaterials: [matA, matB],
        armorRig: {
            high: new THREE.Group(),
            mid: new THREE.Group(),
            low: new THREE.Group(),
            mat: armorMat,
            runeMat
        }
    };
    const fakeFighter = {
        dino: { id: 'trex', scale: 1, walkSpeed: 7.5 },
        rig: fakeRig,
        action: 'idle',
        actionTimer: 0,
        actionDuration: 0,
        x: 0, y: 0, groundY: 0, vx: 0, vy: 0, facing: 1,
        isBlocking: true, blockType: 'high', guardStamina: 20, // < 30% low guard crimson pulse!
        hitFlashTimer: 0.10, hitFlashColor: 0xf97316,
        landingSquashTimer: 0.14, hitShakeOffset: 0.12,
        weightClass: 'heavy', _prevWalkPhase: 3.0
    };

    animCtx.animateDino3DRig(fakeFighter, 1.0, 0.016);
    assert.strictEqual(matA.emissive.hex, 0xf97316, 'Hit-flash must illuminate skinMaterials[0]');
    assert.strictEqual(matB.emissive.hex, 0xf97316, 'Hit-flash must illuminate skinMaterials[1]');
    assert.strictEqual(fakeRig.armorRig.high.visible, true, 'High guard must reveal 3D armorRig.high');
    assert.strictEqual(fakeRig.armorRig.mid.visible, false, 'High guard must hide armorRig.mid');
    assert(armorMat.color.hex === 0xef4444 || armorMat.color.hex === 0xb91c1c, 'Low guard stamina (<30%) must pulse crimson');
    assert(fakeRig._smoothCache, 'applyRigPoseSmoothing must populate rig._smoothCache');

    // Super cinematic delegates to animateFatality
    fakeFighter.isBlocking = false;
    fakeFighter.action = 'super_cinematic';
    fakeFighter.actionDuration = 1.95;
    fakeFighter.actionTimer = 0.5;
    animCtx.animateDino3DRig(fakeFighter, 1.05, 0.016);
    assert.strictEqual(animFatalityCalls, 1, 'super_cinematic must delegate to species animateFatality/animateSuper');

    // Heavyweight footstep crosses Math.PI -> dust + footstep SFX
    fakeFighter.action = 'walk';
    fakeFighter.actionDuration = 0;
    fakeFighter.vx = 7.5;
    fakeFighter._prevWalkPhase = Math.PI - 0.02;
    animCtx.animateDino3DRig(fakeFighter, 1.10, 0.02);
    assert(footstepSfxCalls >= 1 && dustCalls >= 1, 'Heavyweight walk step crossing PI must emit footstep SFX and dust puff');

    // 8E. Post-Match menu mounts cleanly without #fatalityPromptBox (anchored on #superFlashOverlay)
    const mountedTargets = [];
    const superOverlayEl = createMockElement('div', 'superFlashOverlay');
    const battleWrapper = createMockElement('div', 'battleWrapper');
    battleWrapper.appendChild(superOverlayEl);
    let postMatchMountedEl = null;

    const pmCtx = vm.createContext({
        window: {},
        console,
        gameMode: 'cpu',
        campaignStage: 1,
        DINO_ROSTER: [],
        p1ChoiceIndex: 0,
        p2ChoiceIndex: 1,
        UIKit: {
            signal: (v) => ({ value: v }),
            Container: class {
                constructor(o = {}) { Object.assign(this, o); }
                mount(anchor, pos) {
                    mountedTargets.push({ anchorId: anchor && anchor.id, pos });
                    postMatchMountedEl = createMockElement('div', this.id);
                    return postMatchMountedEl;
                }
            },
            Button: class { constructor(o = {}) { Object.assign(this, o); } }
        },
        document: {
            getElementById: (id) => {
                if (id === 'superFlashOverlay') return superOverlayEl;
                if (id === 'postMatchMenu') return postMatchMountedEl;
                return null; // Notice #fatalityPromptBox does NOT exist!
            },
            querySelector: () => battleWrapper
        }
    });
    loadScript(pmCtx, 'js/menus/post-match.js');
    assert.strictEqual(mountedTargets.length, 1, 'post-match.js must mount cleanly without #fatalityPromptBox');
    assert.strictEqual(mountedTargets[0].anchorId, 'superFlashOverlay', 'post-match.js should anchor after #superFlashOverlay');

    console.log('[PASS] Invariant 8: Layered Web Audio (18 calls + mute), Camera/Lights, Pooled VFX, Multi-Mat Hit-Flash/Armor/Smoothing & Post-Match mount');
}

function main() {
    console.log('=== RUNNING EXTINCTION KOMBAT 3D GAME-FEEL & REAL SUPER SUITE ===');
    testInvariant1_MultiFrameHitbox();
    testInvariant2_DtIndependentPhysics();
    testInvariant3_MovesetAndCancels();
    testInvariant4_Canonical21SpeciesPassives();
    testInvariant5_CounterHitAndPerfectParry();
    testInvariant6_UniversalInputBuffer();
    testInvariant7_All21SupersAndExtinctionFinish();
    testInvariant8_AudioAndVisualHudIntegration();
    console.log('=== ALL 8 GAME-FEEL & REAL SUPER INVARIANTS PASSED! ===');
}

main();
