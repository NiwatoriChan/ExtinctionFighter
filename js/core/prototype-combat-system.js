/* ============================================================================
 * EXTINCTION KOMBAT 3D - UPDATE 2.0 : ARCHITECTURE PROTOTYPE & SYSTÈME DE COMBAT
 * - AnimalPrototype / BaseDinosaur (Validation stricte du Manifeste de 19 Animations)
 * - AnimationController (THREE.AnimationMixer, THREE.AnimationAction, Cross-Fade, TimeScale)
 * - ColliderRig (Hitboxes & Hurtboxes THREE.Box3 découplées sur sockets osseux)
 * - DinosaurCombatController (FSM, Knockdown->Grounded->WakeUp, Momentum Damage,
 *   Anti-Spam Stale-Move Queue, Matrice Directionnelle 3-Voies High / Mid / Low)
 * ============================================================================ */

// 1. CONSTANTES, ÉNUMÉRATIONS & MANIFESTE D'ANIMATIONS OBLIGATOIRE

const CombatZone = Object.freeze({
    HIGH: 'high',
    MID: 'mid',
    LOW: 'low'
});

const CombatState = Object.freeze({
    IDLE: 'IDLE',
    WALK: 'WALK',
    RUN: 'RUN',
    SPRINT: 'SPRINT',
    GUARD: 'GUARD',
    ATTACK_WINDUP: 'ATTACK_WINDUP',
    ATTACK_ACTIVE: 'ATTACK_ACTIVE',
    ATTACK_RECOVERY: 'ATTACK_RECOVERY',
    BLOCK_DEFLECTED: 'BLOCK_DEFLECTED',
    GUARD_BLOCK_IMPACT: 'GUARD_BLOCK_IMPACT',
    HIT_REACT: 'HIT_REACT',
    KNOCKDOWN_FALL: 'KNOCKDOWN_FALL',
    GROUNDED_IDLE: 'GROUNDED_IDLE',
    WAKE_UP_STAND: 'WAKE_UP_STAND'
});

const AnimationKey = Object.freeze({
    // Locomotion
    IDLE: 'Idle',
    WALK: 'Walk',
    RUN: 'Run',
    SPRINT: 'Sprint',

    // Offensive (High, Mid, Low)
    ATTACK_HIGH: 'Attack_High',
    ATTACK_MID: 'Attack_Mid',
    ATTACK_LOW: 'Attack_Low',

    // Defensive (Directional Guard)
    GUARD_HIGH: 'Guard_High',
    GUARD_MID: 'Guard_Mid',
    GUARD_LOW: 'Guard_Low',

    // Impact & Deflection
    BLOCK_DEFLECT_HIGH: 'Block_Deflect_High',
    BLOCK_DEFLECT_MID: 'Block_Deflect_Mid',
    BLOCK_DEFLECT_LOW: 'Block_Deflect_Low',
    HIT_REACT_HIGH: 'Hit_React_High',
    HIT_REACT_MID: 'Hit_React_Mid',
    HIT_REACT_LOW: 'Hit_React_Low',

    // Knockdown & Recovery Sequence
    KNOCKDOWN_FALL: 'Knockdown_Fall',
    GROUNDED_IDLE: 'Grounded_Idle',
    WAKE_UP_STAND: 'Wake_Up_Stand'
});

const MANDATORY_ANIMATION_MANIFEST = Object.freeze({
    Locomotion: Object.freeze([
        AnimationKey.IDLE,
        AnimationKey.WALK,
        AnimationKey.RUN,
        AnimationKey.SPRINT
    ]),
    Offensive: Object.freeze([
        AnimationKey.ATTACK_HIGH,
        AnimationKey.ATTACK_MID,
        AnimationKey.ATTACK_LOW
    ]),
    Defensive: Object.freeze([
        AnimationKey.GUARD_HIGH,
        AnimationKey.GUARD_MID,
        AnimationKey.GUARD_LOW
    ]),
    ImpactAndDeflection: Object.freeze([
        AnimationKey.BLOCK_DEFLECT_HIGH,
        AnimationKey.BLOCK_DEFLECT_MID,
        AnimationKey.BLOCK_DEFLECT_LOW,
        AnimationKey.HIT_REACT_HIGH,
        AnimationKey.HIT_REACT_MID,
        AnimationKey.HIT_REACT_LOW
    ]),
    KnockdownAndRecovery: Object.freeze([
        AnimationKey.KNOCKDOWN_FALL,
        AnimationKey.GROUNDED_IDLE,
        AnimationKey.WAKE_UP_STAND
    ])
});

const ALL_MANDATORY_ANIMATION_KEYS = Object.freeze(
    Object.values(MANDATORY_ANIMATION_MANIFEST).reduce((acc, arr) => acc.concat(arr), [])
);

/**
 * Erreur d'exécution descriptive levée lorsqu'un dinosaure ne respecte pas le contrat
 * du manifeste d'animations obligatoire lors de son initialisation.
 */
class AnimationContractError extends Error {
    constructor(dinosaurClassName, missingKeys, missingClips, availableClips) {
        const details = [
            `[AnimationContractError] Dinosaur "${dinosaurClassName}" failed Mandatory Animation Manifest validation.`
        ];
        if (missingKeys.length > 0) {
            details.push(`  -> Unmapped Canonical Keys (${missingKeys.length}): ${missingKeys.join(', ')}`);
        }
        if (missingClips.length > 0) {
            details.push(`  -> Missing/Invalid THREE.AnimationClips (${missingClips.length}): ${missingClips.join(', ')}`);
        }
        details.push(`  -> Available Clips on Model (${availableClips.length}): [${availableClips.join(', ') || 'NONE'}]`);

        super(details.join('\n'));
        this.name = 'AnimationContractError';
        this.dinosaurClassName = dinosaurClassName;
        this.missingKeys = missingKeys;
        this.missingClips = missingClips;
        this.availableClips = availableClips;
    }
}

// ============================================================================
// 2. COLLIDER RIG DÉCOUPLÉ (Hitboxes & Hurtboxes THREE.Box3 parentées aux os)
// ============================================================================

class ColliderRig {
    constructor(rootObject, socketBoneMap = {}) {
        this.rootObject = rootObject;
        this.socketBoneMap = socketBoneMap;
        this.resolvedSockets = new Map();
        this.hurtboxes = new Map();
        this.hitboxes = new Map();
        this._tempBox = new THREE.Box3();
        this._tempCenter = new THREE.Vector3();
        this._resolveBones();
    }

    _resolveBones() {
        for (const [socketName, boneName] of Object.entries(this.socketBoneMap)) {
            const node = this.rootObject.getObjectByName(boneName) || this.rootObject;
            this.resolvedSockets.set(socketName, node);
        }
    }

    registerHurtbox(zone, socketName, min, max) {
        this.hurtboxes.set(zone, {
            socket: socketName,
            localBox: new THREE.Box3(min.clone(), max.clone()),
            worldBox: new THREE.Box3()
        });
    }

    registerHitbox(attackKey, socketName, min, max) {
        this.hitboxes.set(attackKey, {
            socket: socketName,
            localBox: new THREE.Box3(min.clone(), max.clone()),
            worldBox: new THREE.Box3(),
            active: false
        });
    }

    setHitboxActive(attackKey, isActive) {
        const hb = this.hitboxes.get(attackKey);
        if (hb) hb.active = isActive;
    }

    deactivateAllHitboxes() {
        for (const hb of this.hitboxes.values()) {
            hb.active = false;
        }
    }

    updateWorldBoxes() {
        if (!this.rootObject) return;
        this.rootObject.updateMatrixWorld(true);

        for (const hurtbox of this.hurtboxes.values()) {
            const socketNode = this.resolvedSockets.get(hurtbox.socket) || this.rootObject;
            hurtbox.worldBox.copy(hurtbox.localBox).applyMatrix4(socketNode.matrixWorld);
        }

        for (const hitbox of this.hitboxes.values()) {
            if (!hitbox.active) continue;
            const socketNode = this.resolvedSockets.get(hitbox.socket) || this.rootObject;
            hitbox.worldBox.copy(hitbox.localBox).applyMatrix4(socketNode.matrixWorld);
        }
    }

    checkIntersection(attackKey, defenderRig) {
        const hitbox = this.hitboxes.get(attackKey);
        if (!hitbox || !hitbox.active || !defenderRig) {
            return { intersected: false, hitZone: null, impactPoint: null };
        }

        this.updateWorldBoxes();
        defenderRig.updateWorldBoxes();

        for (const [zone, hurtbox] of defenderRig.hurtboxes.entries()) {
            if (hitbox.worldBox.intersectsBox(hurtbox.worldBox)) {
                this._tempBox.copy(hitbox.worldBox).intersect(hurtbox.worldBox);
                this._tempBox.getCenter(this._tempCenter);
                return {
                    intersected: true,
                    hitZone: zone,
                    impactPoint: this._tempCenter
                };
            }
        }

        return { intersected: false, hitZone: null, impactPoint: null };
    }
}

// ============================================================================
// 3. ANIMATION CONTROLLER (THREE.AnimationMixer, Cross-Fade, TimeScale, Events)
// ============================================================================

class AnimationController {
    constructor(rootObject, validatedClipMap) {
        this.rootObject = rootObject;
        this.mixer = new THREE.AnimationMixer(rootObject);
        this.actions = new Map();
        this.actionToKey = new Map();
        this.currentKey = null;
        this.currentAction = null;
        this._finishedListeners = new Set();

        this._initializeActions(validatedClipMap);

        this._onMixerFinished = this._onMixerFinished.bind(this);
        this.mixer.addEventListener('finished', this._onMixerFinished);
    }

    _initializeActions(validatedClipMap) {
        const loopingKeys = new Set([
            AnimationKey.IDLE,
            AnimationKey.WALK,
            AnimationKey.RUN,
            AnimationKey.SPRINT,
            AnimationKey.GUARD_HIGH,
            AnimationKey.GUARD_MID,
            AnimationKey.GUARD_LOW,
            AnimationKey.GROUNDED_IDLE
        ]);

        for (const [canonicalKey, clip] of validatedClipMap.entries()) {
            const action = this.mixer.clipAction(clip);
            if (loopingKeys.has(canonicalKey)) {
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
            } else {
                // Actions offensives, d'impact, de déviation, de chute et de relevé :
                // LoopOnce + clampWhenFinished = true pour verrouiller l'input jusqu'à la fin
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
            }
            this.actions.set(canonicalKey, action);
            this.actionToKey.set(action, canonicalKey);
        }
    }

    _onMixerFinished(event) {
        const canonicalKey = this.actionToKey.get(event.action);
        if (!canonicalKey) return;
        for (const listener of this._finishedListeners) {
            listener(canonicalKey, event.action);
        }
    }

    onActionFinished(callback) {
        this._finishedListeners.add(callback);
        return () => this._finishedListeners.delete(callback);
    }

    transitionTo(canonicalKey, options = {}) {
        const {
            fadeDuration = 0.12,
            timeScale = 1.0,
            weight = 1.0,
            forceRestart = false,
            loopOnce = false
        } = options;

        const nextAction = this.actions.get(canonicalKey);
        if (!nextAction) {
            throw new Error(`[AnimationController] Unknown canonical animation key: "${canonicalKey}".`);
        }

        if (this.currentKey === canonicalKey && !forceRestart) {
            nextAction.setEffectiveTimeScale(timeScale);
            nextAction.setEffectiveWeight(weight);
            return nextAction;
        }

        if (loopOnce) {
            nextAction.setLoop(THREE.LoopOnce, 1);
            nextAction.clampWhenFinished = true;
        }

        nextAction.enabled = true;
        nextAction.setEffectiveTimeScale(timeScale);
        nextAction.setEffectiveWeight(weight);

        if (this.currentAction && this.currentAction !== nextAction) {
            nextAction.reset();
            nextAction.play();
            this.currentAction.crossFadeTo(nextAction, fadeDuration, false);
        } else {
            nextAction.reset();
            nextAction.fadeIn(fadeDuration);
            nextAction.play();
        }

        this.currentKey = canonicalKey;
        this.currentAction = nextAction;
        return nextAction;
    }

    setCurrentTimeScale(timeScale) {
        if (this.currentAction) {
            this.currentAction.setEffectiveTimeScale(timeScale);
        }
    }

    getClipDuration(canonicalKey) {
        const action = this.actions.get(canonicalKey);
        return action ? action.getClip().duration : 0;
    }

    update(deltaTime) {
        this.mixer.update(deltaTime);
    }

    dispose() {
        this.mixer.removeEventListener('finished', this._onMixerFinished);
        this.mixer.stopAllAction();
        this._finishedListeners.clear();
    }
}

// ============================================================================
// 4. CLASSE ABSTRAITE DE BASE : AnimalPrototype (BaseDinosaur)
// ============================================================================

class AnimalPrototype {
    constructor(modelRoot, gltfClips = [], customOptions = {}) {
        if (new.target === AnimalPrototype) {
            throw new TypeError(
                '[AnimalPrototype] Cannot instantiate abstract class AnimalPrototype directly. Subclass it (e.g., Tyrannosaurus, Triceratops, or Fighter3D).'
            );
        }

        if (!modelRoot || !(modelRoot instanceof THREE.Object3D)) {
            throw new TypeError(`[${this.constructor.name}] A valid THREE.Object3D modelRoot is required.`);
        }

        this.modelRoot = modelRoot;
        this.customOptions = customOptions || {};
        this.dino = this.customOptions.dino || null;
        this.speciesName = this.customOptions.speciesName || (this.dino && this.dino.name) || this.constructor.name;

        // Validation stricte du contrat d'animations obligatoire
        const clipMapping = this.getAnimationMap();
        const validatedClipMap = this._validateAnimationContract(gltfClips, clipMapping);

        // Initialisation de l'AnimationController (THREE.AnimationMixer)
        this.animationController = new AnimationController(this.modelRoot, validatedClipMap);

        // Configuration de combat & physique
        const defaultConfig = this.getCombatConfig();
        this.config = Object.assign({
            maxHealth: 1050,
            maxStamina: 100,
            staminaRegenRate: 14,
            walkSpeed: 7.5,
            runSpeed: 10.5,
            sprintSpeed: 15.5,
            momentumCoefficient: 0.045, // k in TotalDamage = Base * (1 + k * ||v||)
            lungeDamping: 6.0,
            knockdownGroundedDuration: 1.35 // N secondes au sol en Grounded_Idle avant Wake_Up_Stand
        }, defaultConfig, customOptions);

        // Initialisation du ColliderRig découplé (THREE.Box3)
        this.colliderRig = new ColliderRig(this.modelRoot, this.getSocketBoneMap());
        this._setupColliders();

        // Démarrer en posture Idle
        this.playIdle(0);
    }

    getAnimationMap() {
        throw new Error(`[${this.constructor.name}] Abstract method getAnimationMap() must be implemented by subclass.`);
    }

    getCombatConfig() {
        throw new Error(`[${this.constructor.name}] Abstract method getCombatConfig() must be implemented by subclass.`);
    }

    getSocketBoneMap() {
        return {
            Head: 'Bone_Head',
            Torso: 'Bone_Torso',
            Tail: 'Bone_Tail0',
            LowerBody: 'Bone_Hips'
        };
    }

    _setupColliders() {
        // 3 Hurtboxes Directionnelles (High, Mid, Low) découplées du maillage visuel
        this.colliderRig.registerHurtbox(
            CombatZone.HIGH,
            'Head',
            new THREE.Vector3(-1.4, -0.8, -1.2),
            new THREE.Vector3(2.2, 1.8, 1.2)
        );
        this.colliderRig.registerHurtbox(
            CombatZone.MID,
            'Torso',
            new THREE.Vector3(-1.8, -1.0, -1.2),
            new THREE.Vector3(2.0, 1.4, 1.2)
        );
        this.colliderRig.registerHurtbox(
            CombatZone.LOW,
            'LowerBody',
            new THREE.Vector3(-1.8, -2.4, -1.2),
            new THREE.Vector3(1.8, 0.2, 1.2)
        );

        // 3 Hitboxes Offensives (Attack_High, Attack_Mid, Attack_Low)
        this.colliderRig.registerHitbox(
            AnimationKey.ATTACK_HIGH,
            'Head',
            new THREE.Vector3(-0.5, -0.8, -1.5),
            new THREE.Vector3(3.8, 2.5, 1.5)
        );
        this.colliderRig.registerHitbox(
            AnimationKey.ATTACK_MID,
            'Torso',
            new THREE.Vector3(-0.5, -1.2, -1.5),
            new THREE.Vector3(4.2, 1.8, 1.5)
        );
        this.colliderRig.registerHitbox(
            AnimationKey.ATTACK_LOW,
            'LowerBody',
            new THREE.Vector3(-1.2, -2.5, -1.5),
            new THREE.Vector3(4.0, 0.6, 1.5)
        );
    }

    _validateAnimationContract(gltfClips, clipMapping) {
        if (!clipMapping || typeof clipMapping !== 'object') {
            throw new AnimationContractError(this.speciesName, ALL_MANDATORY_ANIMATION_KEYS, [], []);
        }

        const clipLookup = new Map();
        const availableClipNames = [];

        if (Array.isArray(gltfClips)) {
            for (const clip of gltfClips) {
                if (clip && typeof clip.name === 'string') {
                    clipLookup.set(clip.name, clip);
                    availableClipNames.push(clip.name);
                }
            }
        }

        const missingKeys = [];
        const missingClips = [];
        const validatedClipMap = new Map();

        for (const mandatoryKey of ALL_MANDATORY_ANIMATION_KEYS) {
            const targetClipName = clipMapping[mandatoryKey];
            if (!targetClipName || typeof targetClipName !== 'string') {
                missingKeys.push(mandatoryKey);
                continue;
            }

            const clip = clipLookup.get(targetClipName);
            if (!clip || !(clip instanceof THREE.AnimationClip) || clip.duration <= 0) {
                missingClips.push(`${mandatoryKey} -> "${targetClipName}"`);
                continue;
            }

            validatedClipMap.set(mandatoryKey, clip);
        }

        if (missingKeys.length > 0 || missingClips.length > 0) {
            throw new AnimationContractError(
                this.speciesName,
                missingKeys,
                missingClips,
                availableClipNames
            );
        }

        return validatedClipMap;
    }

    // Méthodes de déclenchement du Manifeste d'Animations Obligatoire
    playIdle(fadeDuration = 0.15) {
        return this.animationController.transitionTo(AnimationKey.IDLE, { fadeDuration, timeScale: 1.0 });
    }

    playWalk(fadeDuration = 0.15, timeScale = 1.0) {
        return this.animationController.transitionTo(AnimationKey.WALK, { fadeDuration, timeScale });
    }

    playRun(fadeDuration = 0.12, timeScale = 1.0) {
        return this.animationController.transitionTo(AnimationKey.RUN, { fadeDuration, timeScale });
    }

    playSprint(fadeDuration = 0.10, timeScale = 1.0) {
        return this.animationController.transitionTo(AnimationKey.SPRINT, { fadeDuration, timeScale });
    }

    playAttack(zone, timeScale = 1.0, fadeDuration = 0.08) {
        const keyMap = {
            [CombatZone.HIGH]: AnimationKey.ATTACK_HIGH,
            [CombatZone.MID]: AnimationKey.ATTACK_MID,
            [CombatZone.LOW]: AnimationKey.ATTACK_LOW
        };
        const key = keyMap[zone] || AnimationKey.ATTACK_MID;
        return this.animationController.transitionTo(key, {
            fadeDuration,
            timeScale,
            forceRestart: true,
            loopOnce: true
        });
    }

    playGuard(zone, fadeDuration = 0.08) {
        const keyMap = {
            [CombatZone.HIGH]: AnimationKey.GUARD_HIGH,
            [CombatZone.MID]: AnimationKey.GUARD_MID,
            [CombatZone.LOW]: AnimationKey.GUARD_LOW
        };
        const key = keyMap[zone] || AnimationKey.GUARD_MID;
        return this.animationController.transitionTo(key, { fadeDuration, timeScale: 1.0 });
    }

    playBlockDeflect(zone) {
        const keyMap = {
            [CombatZone.HIGH]: AnimationKey.BLOCK_DEFLECT_HIGH,
            [CombatZone.MID]: AnimationKey.BLOCK_DEFLECT_MID,
            [CombatZone.LOW]: AnimationKey.BLOCK_DEFLECT_LOW
        };
        const key = keyMap[zone] || AnimationKey.BLOCK_DEFLECT_MID;
        return this.animationController.transitionTo(key, {
            fadeDuration: 0.05,
            timeScale: 1.0,
            forceRestart: true,
            loopOnce: true
        });
    }

    playHitReact(zone) {
        const keyMap = {
            [CombatZone.HIGH]: AnimationKey.HIT_REACT_HIGH,
            [CombatZone.MID]: AnimationKey.HIT_REACT_MID,
            [CombatZone.LOW]: AnimationKey.HIT_REACT_LOW
        };
        const key = keyMap[zone] || AnimationKey.HIT_REACT_MID;
        return this.animationController.transitionTo(key, {
            fadeDuration: 0.05,
            timeScale: 1.0,
            forceRestart: true,
            loopOnce: true
        });
    }

    playKnockdownFall() {
        return this.animationController.transitionTo(AnimationKey.KNOCKDOWN_FALL, {
            fadeDuration: 0.06,
            timeScale: 1.0,
            forceRestart: true,
            loopOnce: true
        });
    }

    playGroundedIdle() {
        return this.animationController.transitionTo(AnimationKey.GROUNDED_IDLE, {
            fadeDuration: 0.10,
            timeScale: 1.0
        });
    }

    playWakeUpStand() {
        return this.animationController.transitionTo(AnimationKey.WAKE_UP_STAND, {
            fadeDuration: 0.08,
            timeScale: 1.0,
            forceRestart: true,
            loopOnce: true
        });
    }
}

const BaseDinosaur = AnimalPrototype;

// ============================================================================
// 5. DINOSAUR COMBAT CONTROLLER (FSM, Momentum, Stale Queue, 3-Way Matrix)
// ============================================================================

class DinosaurCombatController {
    constructor(dinosaur, options = {}) {
        if (!(dinosaur instanceof AnimalPrototype)) {
            throw new TypeError('[DinosaurCombatController] dinosaur must be an instance of AnimalPrototype.');
        }

        this.dinosaur = dinosaur;
        this.anim = dinosaur.animationController;
        this.rig = dinosaur.colliderRig;

        this.state = CombatState.IDLE;
        this.activeGuardZone = null;
        this.activeAttackZone = null;
        this.activeAttackKey = null;

        this.stateElapsed = 0;
        this.attackLaunchSpeed = 0;
        this.currentStaleCount = 0;
        this.currentTimeScale = 1.0;

        // Séquence Knockdown -> Grounded -> WakeUp
        this.pendingKnockdownChain = false;
        this.groundedTimer = 0;
        this.groundedDuration = dinosaur.config.knockdownGroundedDuration || 1.35;
        this.deflectTimer = 0;

        // File d'attente Anti-Spam / Stale-Move Negation (Les N dernières attaques)
        this.staleQueueMaxSize = options.staleQueueMaxSize ?? 6;
        this.staleMoveQueue = [];
        this.staleDecayStep = options.staleDecayStep ?? 0.25; // 100% -> 75% -> 50% -> 25%
        this.minStaleMultiplier = options.minStaleMultiplier ?? 0.25;
        this.staledAnimationTimeScale = options.staledAnimationTimeScale ?? 0.85;

        // Écouteur sur THREE.AnimationMixer 'finished'
        this._unsubscribeAnimFinished = this.anim.onActionFinished(
            this._handleAnimationFinished.bind(this)
        );
    }

    reset() {
        this.state = CombatState.IDLE;
        this.activeGuardZone = null;
        this.activeAttackZone = null;
        this.activeAttackKey = null;
        this.stateElapsed = 0;
        this.attackLaunchSpeed = 0;
        this.currentStaleCount = 0;
        this.currentTimeScale = 1.0;
        this.pendingKnockdownChain = false;
        this.groundedTimer = 0;
        this.deflectTimer = 0;
        this.staleMoveQueue = [];
        this.rig.deactivateAllHitboxes();
        this.dinosaur.playIdle(0);
    }

    /**
     * Convertit un type de coup du moteur ('up_light', 'low_heavy', 'fwd_light', etc.)
     * en zone directionnelle canonique (CombatZone.HIGH | MID | LOW).
     */
    static resolveAttackZoneFromAction(actionType) {
        if (
            actionType === 'up_light' ||
            actionType === 'anti_air' ||
            actionType === 'air_light' ||
            actionType === 'air_heavy' ||
            actionType === 'high' ||
            actionType === 'overhead'
        ) {
            return CombatZone.HIGH;
        }
        if (
            actionType === 'low_light' ||
            actionType === 'low_heavy' ||
            actionType === 'low'
        ) {
            return CombatZone.LOW;
        }
        return CombatZone.MID;
    }

    /**
     * Compte le nombre de répétitions de `moveId` dans la file d'usure (Stale Queue).
     */
    getStaleRepeatCount(moveId) {
        let count = 0;
        for (const item of this.staleMoveQueue) {
            if (item === moveId) count++;
        }
        return count;
    }

    /**
     * Atténuation des dégâts en cas de spam :
     * 0 répétition -> 100% (1.00)
     * 1 répétition -> 75%  (0.75)
     * 2 répétitions -> 50% (0.50)
     * >=3 répétitions -> 25% (0.25)
     */
    calculateStaleDamageMultiplier(repeatCount) {
        return Math.max(this.minStaleMultiplier, 1.0 - repeatCount * this.staleDecayStep);
    }

    /**
     * Réduction du blockstun infligé si l'attaque est spammée.
     */
    calculateStaleBlockstunMultiplier(repeatCount) {
        return Math.max(0.40, 1.0 - repeatCount * 0.20);
    }

    /**
     * Ralentissement de la vitesse de lecture de l'animation (0.85x) si l'attaque est usée (staled).
     */
    calculateStaleTimeScale(repeatCount) {
        return repeatCount > 0 ? this.staledAnimationTimeScale : 1.0;
    }

    recordAttackExecution(moveKey, currentSpeed) {
        const zone = DinosaurCombatController.resolveAttackZoneFromAction(moveKey);
        const zoneToAnimKey = {
            [CombatZone.HIGH]: AnimationKey.ATTACK_HIGH,
            [CombatZone.MID]: AnimationKey.ATTACK_MID,
            [CombatZone.LOW]: AnimationKey.ATTACK_LOW
        };
        const animKey = zoneToAnimKey[zone] || AnimationKey.ATTACK_MID;

        this.attackLaunchSpeed = Math.abs(currentSpeed || 0);
        this.lastAttackSpeed = this.attackLaunchSpeed;
        this.currentStaleCount = this.getStaleRepeatCount(moveKey);
        this.currentTimeScale = this.calculateStaleTimeScale(this.currentStaleCount);

        // Enregistrer dans la file FIFO de taille N
        this.staleMoveQueue.push(moveKey);
        if (this.staleMoveQueue.length > this.staleQueueMaxSize) {
            this.staleMoveQueue.shift();
        }

        this.state = CombatState.ATTACK_WINDUP;
        this.stateElapsed = 0;
        this.activeAttackZone = zone;
        this.activeAttackKey = animKey;

        // Jouer le clip d'attaque avec timeScale (0.85 si staled) et clampWhenFinished = true
        this.dinosaur.playAttack(zone, this.currentTimeScale, 0.06);

        return {
            zone,
            animKey,
            staleRepeatCount: this.currentStaleCount,
            staleDamageMultiplier: this.calculateStaleDamageMultiplier(this.currentStaleCount),
            timeScale: this.currentTimeScale,
            launchSpeed: this.attackLaunchSpeed
        };
    }

    /**
     * Équation mathématique combinant les dégâts basés sur l'inertie (Momentum)
     * et la courbe d'atténuation Anti-Spam (Stale-Move Negation) :
     * Total Damage = Base Damage * (1 + k * ||v||) * StaleMultiplier
     */
    evaluateScaledDamage(baseDamage) {
        const k = this.dinosaur.config.momentumCoefficient || 0.045;
        const speed = this.attackLaunchSpeed || 0;
        const momentumMultiplier = 1.0 + k * speed;
        const staleMultiplier = this.calculateStaleDamageMultiplier(this.currentStaleCount);
        const scaledDamage = Math.max(1, Math.round(baseDamage * momentumMultiplier * staleMultiplier));

        return {
            scaledDamage,
            momentumMultiplier,
            staleMultiplier,
            staleRepeatCount: this.currentStaleCount,
            launchSpeed: speed
        };
    }

    /**
     * Matrice Directionnelle 3-Voies (High / Mid / Low) :
     * Vérifie si la posture de garde du défenseur correspond à la zone d'attaque.
     */
    static isDirectionalGuardMatched(attackCategoryOrZone, defenderBlockType) {
        if (!defenderBlockType || defenderBlockType === 'none') return false;
        if (attackCategoryOrZone === 'throw' || attackCategoryOrZone === 'seismic') return false;

        const targetZone = DinosaurCombatController.resolveAttackZoneFromAction(attackCategoryOrZone);
        return defenderBlockType === targetZone;
    }

    /**
     * Déclenche la réaction à une parade directionnelle réussie :
     * L'attaquant subit Block_Deflect_[Zone] (recul et désavantage de frames).
     */
    triggerAttackerBlockDeflect(zone) {
        this.rig.deactivateAllHitboxes();
        this.state = CombatState.BLOCK_DEFLECTED;
        this.stateElapsed = 0;
        this.deflectTimer = 0.36;
        this.dinosaur.playBlockDeflect(zone);
    }

    /**
     * Déclenche la réaction à un coup encaissé (Hit_React_[Zone]) et, si le coup est lourd,
     * enchaîne séquentiellement :
     * Hit_React_[Zone] -> Knockdown_Fall -> Grounded_Idle (N sec) -> Wake_Up_Stand -> Idle
     */
    triggerDefenderHitOrKnockdown(zone, causesKnockdown = false, groundedDuration = 1.35) {
        this.rig.deactivateAllHitboxes();
        this.activeGuardZone = null;
        this.activeAttackZone = null;
        this.activeAttackKey = null;

        this.state = CombatState.HIT_REACT;
        this.stateElapsed = 0;
        this.pendingKnockdownChain = Boolean(causesKnockdown);
        this.groundedDuration = groundedDuration;

        this.dinosaur.playHitReact(zone);
    }

    /**
     * Indique si le dinosaure est actuellement verrouillé dans la séquence de Knockdown / Wake-Up.
     */
    isInKnockdownSequence() {
        return (
            this.state === CombatState.KNOCKDOWN_FALL ||
            this.state === CombatState.GROUNDED_IDLE ||
            this.state === CombatState.WAKE_UP_STAND ||
            (this.state === CombatState.HIT_REACT && this.pendingKnockdownChain)
        );
    }

    /**
     * Indique si l'input du joueur est totalement verrouillé (Recovery frames, Deflection, Knockdown, Wake-Up).
     */
    isInputLocked() {
        return (
            this.state === CombatState.ATTACK_WINDUP ||
            this.state === CombatState.ATTACK_ACTIVE ||
            this.state === CombatState.ATTACK_RECOVERY ||
            this.state === CombatState.BLOCK_DEFLECTED ||
            this.state === CombatState.HIT_REACT ||
            this.state === CombatState.KNOCKDOWN_FALL ||
            this.state === CombatState.GROUNDED_IDLE ||
            this.state === CombatState.WAKE_UP_STAND
        );
    }

    /**
     * Gestionnaire d'événement 'finished' du THREE.AnimationMixer.
     * Orchestre la chaîne Knockdown_Fall -> Grounded_Idle -> Wake_Up_Stand -> Idle
     * et le déverrouillage d'input en fin de Recovery.
     */
    _handleAnimationFinished(finishedKey) {
        // 1. Fin d'une animation d'attaque -> Déverrouiller l'input et retourner en Idle
        if (
            finishedKey === AnimationKey.ATTACK_HIGH ||
            finishedKey === AnimationKey.ATTACK_MID ||
            finishedKey === AnimationKey.ATTACK_LOW
        ) {
            if (
                this.state === CombatState.ATTACK_WINDUP ||
                this.state === CombatState.ATTACK_ACTIVE ||
                this.state === CombatState.ATTACK_RECOVERY
            ) {
                this.rig.deactivateAllHitboxes();
                this.activeAttackZone = null;
                this.activeAttackKey = null;
                this.state = CombatState.IDLE;
                this.dinosaur.playIdle(0.12);
            }
            return;
        }

        // 2. Fin de Block_Deflect_[Zone] -> Retour en Idle
        if (
            finishedKey === AnimationKey.BLOCK_DEFLECT_HIGH ||
            finishedKey === AnimationKey.BLOCK_DEFLECT_MID ||
            finishedKey === AnimationKey.BLOCK_DEFLECT_LOW
        ) {
            if (this.state === CombatState.BLOCK_DEFLECTED) {
                this.deflectTimer = 0;
                this.state = CombatState.IDLE;
                this.dinosaur.playIdle(0.12);
            }
            return;
        }

        // 3. Fin de Hit_React_[Zone] -> Soit chaîner vers Knockdown_Fall, soit retourner en Idle
        if (
            finishedKey === AnimationKey.HIT_REACT_HIGH ||
            finishedKey === AnimationKey.HIT_REACT_MID ||
            finishedKey === AnimationKey.HIT_REACT_LOW
        ) {
            if (this.state === CombatState.HIT_REACT) {
                if (this.pendingKnockdownChain && !this.dinosaur.isDead && !this.dinosaur.isDizzy) {
                    this.pendingKnockdownChain = false;
                    this.state = CombatState.KNOCKDOWN_FALL;
                    this.stateElapsed = 0;
                    this.dinosaur.playKnockdownFall();
                } else {
                    this.state = CombatState.IDLE;
                    this.dinosaur.playIdle(0.12);
                }
            }
            return;
        }

        // 4. Fin de Knockdown_Fall -> Entrer dans Grounded_Idle pendant N secondes
        if (finishedKey === AnimationKey.KNOCKDOWN_FALL) {
            if (this.state === CombatState.KNOCKDOWN_FALL) {
                this.state = CombatState.GROUNDED_IDLE;
                this.stateElapsed = 0;
                this.groundedTimer = this.groundedDuration;
                this.dinosaur.playGroundedIdle();
            }
            return;
        }

        // 5. Fin de Wake_Up_Stand -> Déverrouiller l'input et retourner en Idle
        if (finishedKey === AnimationKey.WAKE_UP_STAND) {
            if (this.state === CombatState.WAKE_UP_STAND) {
                this.state = CombatState.IDLE;
                this.stateElapsed = 0;
                this.dinosaur.playIdle(0.15);
            }
        }
    }

    update(dt) {
        this.stateElapsed += dt;

        if (this.deflectTimer > 0) {
            this.deflectTimer = Math.max(0, this.deflectTimer - dt);
            if (this.deflectTimer <= 0 && this.state === CombatState.BLOCK_DEFLECTED) {
                this.state = CombatState.IDLE;
                this.dinosaur.playIdle(0.12);
            }
        }

        // Minuteur Grounded_Idle -> Déclenche Wake_Up_Stand une fois les N secondes écoulées
        if (this.state === CombatState.GROUNDED_IDLE) {
            this.groundedTimer -= dt;
            if (this.groundedTimer <= 0) {
                this.state = CombatState.WAKE_UP_STAND;
                this.stateElapsed = 0;
                this.dinosaur.playWakeUpStand();
            }
        }

        // Mettre à jour le THREE.AnimationMixer (les boîtes THREE.Box3 sont évaluées à la demande lors des collisions actives)
        this.anim.update(dt);
    }
}

// ============================================================================
// 6. GÉNÉRATEUR DE THREE.AnimationClip PROCÉDURAUX POUR LES 19 CLIPS OBLIGATOIRES
// ============================================================================

/**
 * Construit les 19 THREE.AnimationClip obligatoires avec de véritables pistes de keyframes
 * (THREE.NumberKeyframeTrack) ciblant les groupes d'articulation (Bone_Hips, Bone_Torso,
 * Bone_Neck, Bone_Head, Bone_Jaw) de n'importe quel dinosaure du jeu.
 */
function buildMandatoryDinoAnimationClips(dino, rig, baseHipsY = 2.1) {
    const prefix = dino && dino.id ? dino.id : 'dino';
    const clips = [];

    function addClip(name, duration, trackDefs) {
        const tracks = trackDefs.map(td => new THREE.NumberKeyframeTrack(td.path, td.times, td.values));
        clips.push(new THREE.AnimationClip(name, duration, tracks));
    }

    // 1. Locomotion : Idle, Walk, Run, Sprint
    addClip(`${prefix}_Idle`, 1.2, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.6, 1.2], values: [baseHipsY, baseHipsY + 0.06, baseHipsY] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.6, 1.2], values: [0, 0.03, 0] },
        { path: 'Bone_Jaw.rotation[z]', times: [0, 0.6, 1.2], values: [-0.08, -0.18, -0.08] }
    ]);

    addClip(`${prefix}_Walk`, 0.7, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.35, 0.7], values: [baseHipsY, baseHipsY + 0.18, baseHipsY] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.35, 0.7], values: [-0.10, -0.04, -0.10] }
    ]);

    addClip(`${prefix}_Run`, 0.5, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.25, 0.5], values: [baseHipsY - 0.05, baseHipsY + 0.24, baseHipsY - 0.05] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.25, 0.5], values: [-0.22, -0.14, -0.22] }
    ]);

    addClip(`${prefix}_Sprint`, 0.38, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.19, 0.38], values: [baseHipsY * 0.82, baseHipsY * 0.95, baseHipsY * 0.82] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.19, 0.38], values: [-0.38, -0.28, -0.38] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.19, 0.38], values: [-0.20, -0.12, -0.20] }
    ]);

    // 2. Offensive : Attack_High, Attack_Mid, Attack_Low
    addClip(`${prefix}_Attack_High`, 0.42, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.12, 0.25, 0.42], values: [baseHipsY, baseHipsY - 0.25, baseHipsY + 0.85, baseHipsY] },
        { path: 'Bone_Hips.rotation[z]', times: [0, 0.12, 0.25, 0.42], values: [0, -0.18, 0.35, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.12, 0.25, 0.42], values: [0, -0.28, 0.68, 0] },
        { path: 'Bone_Neck.rotation[z]', times: [0, 0.12, 0.25, 0.42], values: [0, -0.22, 0.72, 0] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.12, 0.25, 0.42], values: [0, -0.25, 0.92, 0] },
        { path: 'Bone_Jaw.rotation[z]', times: [0, 0.12, 0.25, 0.42], values: [-0.1, -0.35, -1.35, -0.1] }
    ]);

    addClip(`${prefix}_Attack_Mid`, 0.38, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.10, 0.22, 0.38], values: [0, -0.38, 1.15, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.10, 0.22, 0.38], values: [0, 0.22, -0.48, 0] },
        { path: 'Bone_Neck.rotation[z]', times: [0, 0.10, 0.22, 0.38], values: [0, 0.18, -0.45, 0] },
        { path: 'Bone_Jaw.rotation[z]', times: [0, 0.10, 0.22, 0.38], values: [-0.1, -0.28, -1.05, -0.1] }
    ]);

    addClip(`${prefix}_Attack_Low`, 0.40, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.12, 0.24, 0.40], values: [baseHipsY, baseHipsY * 0.62, baseHipsY * 0.44, baseHipsY] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.12, 0.24, 0.40], values: [0, -0.28, -0.58, 0] },
        { path: 'Bone_Torso.rotation[y]', times: [0, 0.12, 0.24, 0.40], values: [0, -0.55, 0.85, 0] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.12, 0.24, 0.40], values: [0, -0.35, -0.72, 0] }
    ]);

    // 3. Defensive : Guard_High, Guard_Mid, Guard_Low
    addClip(`${prefix}_Guard_High`, 0.6, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.3, 0.6], values: [baseHipsY * 1.05, baseHipsY * 1.08, baseHipsY * 1.05] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.3, 0.6], values: [0.22, 0.26, 0.22] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.3, 0.6], values: [0.25, 0.30, 0.25] }
    ]);

    addClip(`${prefix}_Guard_Mid`, 0.6, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.3, 0.6], values: [-0.25, -0.28, -0.25] },
        { path: 'Bone_Hips.position[y]', times: [0, 0.3, 0.6], values: [baseHipsY * 0.92, baseHipsY * 0.94, baseHipsY * 0.92] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.3, 0.6], values: [-0.22, -0.25, -0.22] }
    ]);

    addClip(`${prefix}_Guard_Low`, 0.6, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.3, 0.6], values: [baseHipsY * 0.56, baseHipsY * 0.58, baseHipsY * 0.56] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.3, 0.6], values: [-0.34, -0.36, -0.34] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.3, 0.6], values: [-0.28, -0.30, -0.28] }
    ]);

    // 4. Impact & Deflection : Block_Deflect_High/Mid/Low & Hit_React_High/Mid/Low
    addClip(`${prefix}_Block_Deflect_High`, 0.36, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.12, 0.36], values: [0, -0.55, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.12, 0.36], values: [0, 0.48, 0] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.12, 0.36], values: [0, 0.65, 0] }
    ]);

    addClip(`${prefix}_Block_Deflect_Mid`, 0.34, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.12, 0.34], values: [0, -0.60, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.12, 0.34], values: [0, 0.38, 0] },
        { path: 'Bone_Torso.rotation[y]', times: [0, 0.12, 0.34], values: [0, -0.35, 0] }
    ]);

    addClip(`${prefix}_Block_Deflect_Low`, 0.34, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.12, 0.34], values: [0, -0.45, 0] },
        { path: 'Bone_Hips.position[y]', times: [0, 0.12, 0.34], values: [baseHipsY, baseHipsY * 0.68, baseHipsY] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.12, 0.34], values: [0, 0.30, 0] }
    ]);

    addClip(`${prefix}_Hit_React_High`, 0.28, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.10, 0.28], values: [0, -0.45, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.10, 0.28], values: [0, 0.45, 0] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.10, 0.28], values: [0, 0.62, 0] },
        { path: 'Bone_Jaw.rotation[z]', times: [0, 0.10, 0.28], values: [-0.1, -0.75, -0.1] }
    ]);

    addClip(`${prefix}_Hit_React_Mid`, 0.28, [
        { path: 'Bone_Hips.position[x]', times: [0, 0.10, 0.28], values: [0, -0.50, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.10, 0.28], values: [0, 0.35, 0] },
        { path: 'Bone_Neck.rotation[z]', times: [0, 0.10, 0.28], values: [0, 0.30, 0] }
    ]);

    addClip(`${prefix}_Hit_React_Low`, 0.28, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.12, 0.28], values: [baseHipsY, baseHipsY * 0.58, baseHipsY] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.12, 0.28], values: [0, -0.35, 0] }
    ]);

    // 5. Knockdown & Recovery Sequence : Knockdown_Fall -> Grounded_Idle -> Wake_Up_Stand
    const groundClipHipsY = Math.max(0.62, baseHipsY * 0.38);
    addClip(`${prefix}_Knockdown_Fall`, 0.42, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.22, 0.42], values: [baseHipsY, (baseHipsY + groundClipHipsY) * 0.5, groundClipHipsY] },
        { path: 'Bone_Hips.rotation[x]', times: [0, 0.22, 0.42], values: [0, 0.72, 1.45] },
        { path: 'Bone_Hips.rotation[z]', times: [0, 0.22, 0.42], values: [0, 0.05, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.22, 0.42], values: [0.15, 0.08, 0] },
        { path: 'Bone_Jaw.rotation[z]', times: [0, 0.42], values: [-0.15, -0.35] }
    ]);

    addClip(`${prefix}_Grounded_Idle`, 0.80, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.40, 0.80], values: [groundClipHipsY, groundClipHipsY + 0.04, groundClipHipsY] },
        { path: 'Bone_Hips.rotation[x]', times: [0, 0.40, 0.80], values: [1.45, 1.48, 1.45] },
        { path: 'Bone_Hips.rotation[z]', times: [0, 0.40, 0.80], values: [0, 0, 0] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.40, 0.80], values: [-0.12, -0.08, -0.12] },
        { path: 'Bone_Jaw.rotation[z]', times: [0, 0.40, 0.80], values: [-0.35, -0.42, -0.35] }
    ]);

    addClip(`${prefix}_Wake_Up_Stand`, 0.46, [
        { path: 'Bone_Hips.position[y]', times: [0, 0.24, 0.46], values: [groundClipHipsY, baseHipsY * 0.78, baseHipsY] },
        { path: 'Bone_Hips.rotation[x]', times: [0, 0.24, 0.46], values: [1.45, 0.35, 0] },
        { path: 'Bone_Hips.rotation[z]', times: [0, 0.24, 0.46], values: [0, 0, 0] },
        { path: 'Bone_Torso.rotation[z]', times: [0, 0.24, 0.46], values: [0, -0.22, 0] },
        { path: 'Bone_Head.rotation[z]', times: [0, 0.24, 0.46], values: [-0.12, 0.28, 0] }
    ]);

    return clips;
}

/**
 * Génère la table de correspondance canonique (AnimationKey -> ClipName) pour une espèce donnée.
 */
function buildCanonicalAnimationMapForSpecies(dinoId) {
    const prefix = dinoId || 'dino';
    return {
        [AnimationKey.IDLE]: `${prefix}_Idle`,
        [AnimationKey.WALK]: `${prefix}_Walk`,
        [AnimationKey.RUN]: `${prefix}_Run`,
        [AnimationKey.SPRINT]: `${prefix}_Sprint`,
        [AnimationKey.ATTACK_HIGH]: `${prefix}_Attack_High`,
        [AnimationKey.ATTACK_MID]: `${prefix}_Attack_Mid`,
        [AnimationKey.ATTACK_LOW]: `${prefix}_Attack_Low`,
        [AnimationKey.GUARD_HIGH]: `${prefix}_Guard_High`,
        [AnimationKey.GUARD_MID]: `${prefix}_Guard_Mid`,
        [AnimationKey.GUARD_LOW]: `${prefix}_Guard_Low`,
        [AnimationKey.BLOCK_DEFLECT_HIGH]: `${prefix}_Block_Deflect_High`,
        [AnimationKey.BLOCK_DEFLECT_MID]: `${prefix}_Block_Deflect_Mid`,
        [AnimationKey.BLOCK_DEFLECT_LOW]: `${prefix}_Block_Deflect_Low`,
        [AnimationKey.HIT_REACT_HIGH]: `${prefix}_Hit_React_High`,
        [AnimationKey.HIT_REACT_MID]: `${prefix}_Hit_React_Mid`,
        [AnimationKey.HIT_REACT_LOW]: `${prefix}_Hit_React_Low`,
        [AnimationKey.KNOCKDOWN_FALL]: `${prefix}_Knockdown_Fall`,
        [AnimationKey.GROUNDED_IDLE]: `${prefix}_Grounded_Idle`,
        [AnimationKey.WAKE_UP_STAND]: `${prefix}_Wake_Up_Stand`
    };
}

// ============================================================================
// 7. SOUS-CLASSES D'EXEMPLE CONCRÈTES (Tyrannosaurus & Triceratops)
// ============================================================================

class Tyrannosaurus extends AnimalPrototype {
    getAnimationMap() {
        return buildCanonicalAnimationMapForSpecies('trex');
    }

    getCombatConfig() {
        return {
            maxHealth: 1050,
            walkSpeed: 7.8,
            runSpeed: 11.2,
            sprintSpeed: 16.5,
            momentumCoefficient: 0.055,
            knockdownGroundedDuration: 1.4
        };
    }
}

class Triceratops extends AnimalPrototype {
    getAnimationMap() {
        return buildCanonicalAnimationMapForSpecies('pachyrhinosaurus');
    }

    getCombatConfig() {
        return {
            maxHealth: 1150,
            walkSpeed: 7.0,
            runSpeed: 10.5,
            sprintSpeed: 16.0,
            momentumCoefficient: 0.068,
            knockdownGroundedDuration: 1.4
        };
    }
}

// Exposer globalement pour tous les scripts du jeu
window.CombatZone = CombatZone;
window.CombatState = CombatState;
window.AnimationKey = AnimationKey;
window.MANDATORY_ANIMATION_MANIFEST = MANDATORY_ANIMATION_MANIFEST;
window.ALL_MANDATORY_ANIMATION_KEYS = ALL_MANDATORY_ANIMATION_KEYS;
window.AnimationContractError = AnimationContractError;
window.ColliderRig = ColliderRig;
window.AnimationController = AnimationController;
window.AnimalPrototype = AnimalPrototype;
window.BaseDinosaur = BaseDinosaur;
window.DinosaurCombatController = DinosaurCombatController;
window.buildMandatoryDinoAnimationClips = buildMandatoryDinoAnimationClips;
window.buildCanonicalAnimationMapForSpecies = buildCanonicalAnimationMapForSpecies;
window.Tyrannosaurus = Tyrannosaurus;
window.Triceratops = Triceratops;
