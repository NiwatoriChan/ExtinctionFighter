// 8. MOTEUR DE COMBAT 3D (POSITIONS X EN UNITÉS 3D : DYNAMIQUE PAR ARÈNE, DÉFAUT -11 À +11)
const STAGE_LEFT_3D = -11.0;
const STAGE_RIGHT_3D = 11.0;

// Identifiants canoniques de poids pour les 21 combattants (+ alias hérités)
const HEAVY_SPECIES_IDS = [
    'apato', 'ankylo', 'pachyrhino', 'stegosaurus',
    'giantsloth', 'dragon', 'dunkleosteus', 'cameroceras'
];
const HEAVY_SPECIES_ALIASES = ['apatosaurus', 'ankylosaurus', 'pachyrhinosaurus', 'megatherium'];

const SPEED_SPECIES_IDS = [
    'smilodon', 'terabird', 'quetzal', 'pulmonoscorpius',
    'maiasaura', 'postosuchus', 'anomalocaris', 'jaekelopterus', 'gorgonopsia'
];
const SPEED_SPECIES_ALIASES = ['terror-bird', 'quetzalcoatlus'];

function isHeavySpeciesId(id) {
    return HEAVY_SPECIES_IDS.includes(id) || HEAVY_SPECIES_ALIASES.includes(id);
}

function isSpeedSpeciesId(id) {
    return SPEED_SPECIES_IDS.includes(id) || SPEED_SPECIES_ALIASES.includes(id);
}

// Frame Data par coup : durée, fenêtre active multi-frames, poids, vélocité d'élan
const ATTACK_FRAME_PROFILES = {
    light:         { duration: 0.26, activeStart: 0.24, activeEnd: 0.58, isHeavy: false, lungeVx: 2.8 },
    light2:        { duration: 0.28, activeStart: 0.26, activeEnd: 0.60, isHeavy: false, lungeVx: 2.4 },
    up_light:      { duration: 0.27, activeStart: 0.24, activeEnd: 0.58, isHeavy: false, lungeVx: 1.5, vyBoost: 1.8 },
    fwd_light:     { duration: 0.29, activeStart: 0.26, activeEnd: 0.62, isHeavy: false, lungeVx: 4.6 },
    low_light:     { duration: 0.27, activeStart: 0.25, activeEnd: 0.58, isHeavy: false, lungeVx: 2.0 },
    back_light:    { duration: 0.26, activeStart: 0.22, activeEnd: 0.56, isHeavy: false, lungeVx: -3.2 },
    air_light:     { duration: 0.28, activeStart: 0.22, activeEnd: 0.68, isHeavy: false, lungeVx: 0 },
    heavy:         { duration: 0.43, activeStart: 0.34, activeEnd: 0.68, isHeavy: true,  lungeVx: 4.2 },
    fwd_heavy:     { duration: 0.46, activeStart: 0.34, activeEnd: 0.68, isHeavy: true,  lungeVx: 5.8 },
    low_heavy:     { duration: 0.44, activeStart: 0.34, activeEnd: 0.66, isHeavy: true,  lungeVx: 2.8 },
    anti_air:      { duration: 0.42, activeStart: 0.28, activeEnd: 0.66, isHeavy: true,  lungeVx: 1.8, vyBoost: 1.5 },
    air_heavy:     { duration: 0.44, activeStart: 0.26, activeEnd: 0.74, isHeavy: true,  lungeVx: 3.8, vySet: -6.5 },
    throw:         { duration: 0.44, activeStart: 0.24, activeEnd: 0.48, isHeavy: true,  lungeVx: 1.8 },
    throw_whiff:   { duration: 0.40, activeStart: 1.0,  activeEnd: 1.0,  isHeavy: false, lungeVx: 0.8 },
    special:       { duration: 0.52, activeStart: 0.30, activeEnd: 0.70, isHeavy: true,  lungeVx: 4.6 },
    special2:      { duration: 0.58, activeStart: 0.32, activeEnd: 0.70, isHeavy: true,  lungeVx: 3.2 },
    super_startup: { duration: 0.42, activeStart: 0.14, activeEnd: 0.88, isHeavy: true,  lungeVx: 12.0, startupInvuln: 0.28 },
    super_whiff:   { duration: 0.45, activeStart: 1.0,  activeEnd: 1.0,  isHeavy: false, lungeVx: 0 }
};

function getAttackFrameProfile(type) {
    if (type && ATTACK_FRAME_PROFILES[type]) {
        return ATTACK_FRAME_PROFILES[type];
    }
    return {
        duration: 0.34,
        activeStart: 0.28,
        activeEnd: 0.66,
        isHeavy: Boolean(type && (type.includes('heavy') || type.startsWith('special') || type.startsWith('super'))),
        lungeVx: 2.4
    };
}

function getStageBounds3D() {
    const arena = (typeof ARENAS !== 'undefined' && typeof currentArena !== 'undefined') ? ARENAS[currentArena] : null;
    const bound = (arena && arena.stageBound) ? arena.stageBound : STAGE_RIGHT_3D;
    return { left: -bound, right: bound };
}
if (typeof window !== 'undefined') {
    window.HEAVY_SPECIES_IDS = HEAVY_SPECIES_IDS;
    window.SPEED_SPECIES_IDS = SPEED_SPECIES_IDS;
    window.ATTACK_FRAME_PROFILES = ATTACK_FRAME_PROFILES;
    window.getAttackFrameProfile = getAttackFrameProfile;
    window.getStageBounds3D = getStageBounds3D;
}

class Fighter3D extends AnimalPrototype {
    constructor(dino, isP1, skinIndex = 0) {
        const rig = createDino3DRig(dino, skinIndex);
        const fighterImpl = FIGHTER_IMPLS[dino.id] || {};
        const baseHipsY = fighterImpl.animBaseHipsY !== undefined ? fighterImpl.animBaseHipsY : 2.1;
        const mandatoryClips = buildMandatoryDinoAnimationClips(dino, rig, baseHipsY);

        // Initialisation et validation stricte du contrat AnimalPrototype (19 clips obligatoires)
        super(rig.root, mandatoryClips, {
            dino,
            speciesName: dino.fullName || dino.name
        });

        this.dino = dino;
        this.isP1 = isP1;
        this.skinIndex = skinIndex;
        this.roundsWon = 0;
        this.rig = rig;
        this.combatController = new DinosaurCombatController(this);
        if (typeof battleScene !== 'undefined' && battleScene) {
            battleScene.add(this.rig.root);
        }
        this.resetForRound();
    }

    getAnimationMap() {
        const dinoId = (this.dino && this.dino.id) || (this.customOptions && this.customOptions.dino && this.customOptions.dino.id) || 'dino';
        const fighterImpl = FIGHTER_IMPLS[dinoId] || {};
        if (fighterImpl.animationMap) {
            return fighterImpl.animationMap;
        }
        return buildCanonicalAnimationMapForSpecies(dinoId);
    }

    getCombatConfig() {
        const d = this.dino || (this.customOptions && this.customOptions.dino) || { maxHp: 1050, walkSpeed: 7.5, id: 'dino' };
        const id = d.id;
        const isHeavy = isHeavySpeciesId(id);
        const isSpeed = isSpeedSpeciesId(id);

        return {
            maxHealth: d.maxHp || 1050,
            maxStamina: 100,
            staminaRegenRate: 15,
            walkSpeed: d.walkSpeed || 7.5,
            runSpeed: (d.walkSpeed || 7.5) * 1.35,
            sprintSpeed: (d.walkSpeed || 7.5) * 1.85,
            // Coefficient k dans Total Damage = Base * (1 + k * ||v||)
            momentumCoefficient: isHeavy ? 0.062 : (isSpeed ? 0.042 : 0.052),
            lungeDamping: 6.0,
            knockdownGroundedDuration: 1.35
        };
    }

    getAttackFrameProfile(type) {
        return getAttackFrameProfile(type || this.action);
    }

    destroy() {
        if (this.animationController) {
            this.animationController.dispose();
        }
        if (this.rig && this.rig.root && typeof battleScene !== 'undefined' && battleScene) {
            battleScene.remove(this.rig.root);
        }
    }

    isAirborne(threshold = 0.08) {
        const gY = this.groundY !== undefined ? this.groundY : (typeof getFighterSupportHeight === 'function' ? getFighterSupportHeight(this, currentArena) : 0);
        return (this.y - gY) > threshold || Boolean(this.isFlying);
    }

    takeDamage(damage, knockbackX = 0, knockbackY = 0) {
        if (typeof applyDamageToPlayer === 'function') {
            applyDamageToPlayer(this, damage, knockbackX, knockbackY);
        } else {
            this.hp = Math.max(0, this.hp - damage);
            this.hitStun = 0.28;
            this.vx = knockbackX;
            if (knockbackY > 0) this.vy = knockbackY;
            this.action = 'hit';
            this.actionTimer = 0;
            this.actionDuration = 0.32;
        }
    }

    resetForRound() {
        this.x = this.isP1 ? -4.8 : 4.8;
        const initGroundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, this.x, 0) : 0;
        this.groundY = initGroundY;
        this.y = initGroundY;
        this.vx = 0;
        this.vy = 0;
        this.facing = this.isP1 ? 1 : -1;
        this._lockedSide = this.isP1 ? -1 : 1;
        this.hp = this.dino.maxHp;
        this.maxHp = this.dino.maxHp;
        this.rage = 0;
        this.guardStamina = 100;
        this.maxGuardStamina = 100;
        this.action = 'idle';
        this.actionTimer = 0;
        this.actionDuration = 0;
        this.hasHitCurrentAttack = false;
        this.hasSpawnedAttackFx = false;
        this.hasHitConfirmed = false;
        this._specialLungeApplied = false;
        this._customSpecialFired = false;
        this._wakeupPopupShown = false;
        this.beingThrownTimer = 0;
        this.thrownBy = null;
        this.hitStun = 0;
        this.isBlocking = false;
        this.blockType = 'none'; // 'none' | 'high' | 'mid' | 'low'
        this._prevBlockType = 'none';
        this.guardStartTime = -999;
        this.isDizzy = false;
        this.isDead = false;
        this.decapitated = false;
        this.flattened = false;
        this.kneeling = false;
        // Real Super Attack & Game-Feel state
        this.isSuperAttacker = false;
        this.isSuperTarget = false;
        this.superBeatStage = 0;
        this.superInvulnTimer = 0;
        this.hitFlashTimer = 0;
        this.hitFlashColor = 0xffffff;
        this.hitShakeOffset = 0;
        this.landingSquashTimer = 0;
        this.juggleCount = 0;
        this.comboCount = 0;
        this.comboDamage = 0;
        this._wasAirborne = false;
        this._prevWalkPhase = 0;
        this._moveInputDir = 0;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDir = 0;
        this.sprintDuration = 0;
        this.isSprinting = false;
        this.flightEndurance = 2.0;
        this.isFlying = false;
        // Universal 140ms Input Buffer
        this.bufferedInput = null; // null | { type, ttl }
        this.bufferedAction = null;
        this.bufferTimer = 0;
        this.inputBuffer = [];
        this.hasHyperArmor = false;
        this.lightComboStep = 0;
        this.lastAttackType = null;
        this.staleMultiplier = 1.0;
        this.momentumMultiplier = 1.0;
        this.lastStaleCount = 0;
        this._dropThroughTimer = 0;
        this._prevY = this.y;
        if (this.rig && this.rig.headGroup) {
            this.rig.headGroup.scale.setScalar(1);
        }

        if (this.combatController) {
            this.combatController.reset();
        }

        // --- PROFILES DE POIDS, RAYON DE BLOCAGE PHYSIQUE (BODY BLOCKER) & GRAVITÉ ---
        const id = this.dino.id;
        const isHeavy = isHeavySpeciesId(id);
        const isSpeed = isSpeedSpeciesId(id);
        const baseRadius = isHeavy
            ? 1.42
            : ((id === 'trex' || id === 'spinosaurus' || id === 'therizino' || id === 'therizinosaurus' || id === 'dimetrodon') ? 1.32 : 1.18);
        this.bodyRadius = baseRadius * (this.dino.scale || 1.0);

        if (isHeavy) {
            this.weightClass = 'heavy';
            this.gravityScale = 1.30;
            this.jumpVy = 10.5;
            this.knockbackMult = 0.65;
        } else if (isSpeed) {
            this.weightClass = 'speed';
            this.gravityScale = 0.82;
            this.jumpVy = 12.8;
            this.knockbackMult = 1.25;
        } else {
            this.weightClass = 'brawler';
            this.gravityScale = 1.0;
            this.jumpVy = 11.8;
            this.knockbackMult = 1.0;
        }

        // --- STATUTS ET GIMMICKS DE COMBAT ---
        this.bleedStacks = 0;
        this.bleedTimer = 0;
        this.bleedTickTimer = 0;
        this.poisonStacks = 0;
        this.poisonTimer = 0;
        this.poisonTickTimer = 0;
        this.atkPowerMod = 1.0;
        this.atkPowerModTimer = 0;

        // Seules les compétences Spéciales ont un cooldown (la Primal Super est régie par 100% de Rage)
        this.cooldowns = {
            special: 0,
            special2: 0
        };
        const spdMod = Math.max(0.85, Math.min(1.15, 1.25 - (this.dino.stats.spd / 100) * 0.35));
        this.maxCooldowns = {
            special: 2.0 * spdMod,   // Spécial 1 : 2.0s
            special2: 3.6 * spdMod   // Spécial 2 / Ultra : 3.6s
        };
    }

    queueBufferedInput(type, ttl = 0.14) {
        if (!type) return;
        const normalized = type === 'xray' ? 'super' : type;
        this.bufferedInput = {
            type: normalized,
            ttl: Math.max(0.02, ttl)
        };
    }

    consumeBufferedInput(opponent) {
        if (!this.bufferedInput || this.bufferedInput.ttl <= 0) {
            this.bufferedInput = null;
            return false;
        }
        const superLocked = typeof superState !== 'undefined' && superState && (superState.phase === 'flash' || superState.phase === 'cinematic');
        const koLocked = typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0;
        if (superLocked || koLocked || this.isDead || this.isDizzy || this.hitStun > 0 || this.beingThrownTimer > 0) {
            return false;
        }
        if (this.combatController && (this.combatController.isInKnockdownSequence() || this.combatController.state === CombatState.BLOCK_DEFLECTED)) {
            return false;
        }
        if (this.dashTimer > 0) {
            return false;
        }

        const nextType = this.bufferedInput.type;
        const inActiveAttack = this.actionDuration > 0 && this.action !== 'idle' && this.action !== 'walk' && this.action !== 'crouch';

        if (inActiveAttack) {
            if (nextType === 'jump' || nextType === 'dash' || nextType === 'guard') {
                return false;
            }
            if (nextType === 'super' || nextType === 'xray') {
                if (this.rage >= 100 && this.canCancelInto('super')) {
                    this.bufferedInput = null;
                    if (typeof executeSuperAttack === 'function') {
                        executeSuperAttack(this, opponent);
                        return true;
                    }
                    if (typeof triggerPlayerAction === 'function') {
                        triggerPlayerAction(this, opponent, 'super');
                        return true;
                    }
                }
                return false;
            }
            const resolved = typeof resolveAttackVariant === 'function' ? resolveAttackVariant(this, nextType, opponent) : nextType;
            if (this.canCancelInto(resolved)) {
                this.bufferedInput = null;
                return Boolean(this.startAttack(resolved));
            }
            return false;
        }

        // Actionable (after recovery, landing, hitstun, or dash)
        if (nextType === 'jump' && this.isAirborne(0.10)) {
            return false;
        }
        this.bufferedInput = null;
        if (typeof triggerPlayerAction === 'function') {
            triggerPlayerAction(this, opponent, nextType);
            return true;
        }
        if (nextType === 'dash') {
            return Boolean(this.startDash(this.facing));
        }
        if (nextType === 'super' && typeof executeSuperAttack === 'function') {
            executeSuperAttack(this, opponent);
            return true;
        }
        return Boolean(this.startAttack(nextType));
    }

    canCancelInto(nextType) {
        if (!nextType) return false;
        if (this.actionDuration <= 0) return true;

        const normNext = nextType === 'xray' ? 'super' : (nextType === 'strike' ? 'light' : nextType);
        const progress = this.actionTimer / this.actionDuration;

        // 1. RÈGLE STRICTE DU HIT-CONFIRM (INTERDICTION DU WHIFF-CANCEL)
        if (!this.hasHitConfirmed) return false;

        // 2. FENÊTRE DE CANCEL POST-IMPACT (42% à 90%)
        if (progress < 0.42 || progress > 0.90) return false;

        const isHeavyNext = normNext.includes('heavy') || normNext === 'anti_air';
        const isSpecialNext = normNext.startsWith('special');
        const isSuperNext = normNext === 'super';

        // 3. HIÉRARCHIE COMPLÈTE DES COMBOS (CHAÎNE À SENS UNIQUE) :
        // Étape A : 'light' -> 'light'/'light2' / heavy / anti_air / special / special2 / super
        if (this.action === 'light') {
            return normNext === 'light' || normNext === 'light2' || isHeavyNext || isSpecialNext || isSuperNext;
        }

        // Étape B : Command Normals légers & 'light2' -> heavy / anti_air / special / special2 / super
        if (
            this.action === 'light2' ||
            this.action === 'fwd_light' ||
            this.action === 'low_light' ||
            this.action === 'up_light' ||
            this.action === 'back_light' ||
            this.action === 'air_light'
        ) {
            return isHeavyNext || isSpecialNext || isSuperNext;
        }

        // Étape C : Coups Lourds & Anti-Air -> special / special2 / super
        if (this.action.includes('heavy') || this.action === 'anti_air') {
            return isSpecialNext || isSuperNext;
        }

        // Étape D : Spécial 1 / Spécial 2 -> super (Super Cancel!)
        if (this.action === 'special' || this.action === 'special2') {
            return isSuperNext;
        }

        return false;
    }

    startDash(dir) {
        const superLocked = typeof superState !== 'undefined' && superState && (superState.phase === 'flash' || superState.phase === 'cinematic');
        const koLocked = typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0;
        if (superLocked || koLocked || this.hitStun > 0 || this.isDizzy || this.isDead || this.dashCooldown > 0) return false;
        if (this.combatController && (this.combatController.isInKnockdownSequence() || this.combatController.state === CombatState.BLOCK_DEFLECTED)) return false;
        if (this.action === 'throw' || (this.action && this.action.startsWith('super_'))) return false;

        this.isBlocking = false;
        this.blockType = 'none';
        this._prevBlockType = 'none';
        this.dashTimer = 0.22;
        this.dashCooldown = 0.38;
        this.isSprinting = true;
        const dashDir = dir !== 0 ? dir : this.facing;
        this.dashDir = dashDir;
        this.vx = dashDir * (this.dino.walkSpeed * (this.weightClass === 'speed' ? 2.65 : 2.35));
        this.action = 'walk';
        this.actionDuration = 0;
        this.actionTimer = 0;
        this.playSprint(0.08);
        if (typeof spawn3DMomentumTrail === 'function') {
            spawn3DMomentumTrail(this);
        }
        if (typeof spawn3DDustPuff === 'function') {
            spawn3DDustPuff(this.x, this.y || 0, this.weightClass === 'heavy' ? 1.25 : 0.9, 6);
        }
        if (typeof sfx !== 'undefined') {
            if (typeof sfx.playDash === 'function') sfx.playDash();
            else if (typeof sfx.playWhoosh === 'function') sfx.playWhoosh();
        }
        return true;
    }

    startAttack(type) {
        const superLocked = typeof superState !== 'undefined' && superState && (superState.phase === 'flash' || superState.phase === 'cinematic');
        const koLocked = typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0;
        if (superLocked || koLocked || this.isDizzy || this.isDead) return false;
        if (this.hitStun > 0 || this.beingThrownTimer > 0) return false;
        if (this.combatController && (this.combatController.isInKnockdownSequence() || this.combatController.state === CombatState.BLOCK_DEFLECTED)) return false;
        if (this.action === 'super_startup' || this.action === 'super_cinematic' || this.action === 'super_aoe') return false;

        // Vérification de cooldown uniquement pour les capacités spéciales (Spécial 1 & 2)
        if (this.cooldowns && this.cooldowns[type] !== undefined && this.cooldowns[type] > 0) {
            if (this.isP1 || gameMode === 'pvp') {
                if (typeof sfx !== 'undefined' && typeof sfx.playCooldownWarning === 'function') {
                    sfx.playCooldownWarning();
                }
                const labels = {
                    special: this.dino.special1Name ? this.dino.special1Name.replace(/ \(.*?\)/, '').toUpperCase() : 'SPÉCIAL',
                    special2: this.dino.special2Name ? this.dino.special2Name.replace(/ \(.*?\)/, '').toUpperCase() : 'ULTRA'
                };
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(this.x, `⏳ ${labels[type] || type.toUpperCase()} EN RECHARGE (${this.cooldowns[type].toFixed(1)}s)`, '#94a3b8');
                }
            }
            return false;
        }

        // Gestion de l'annulation de combo ou de la mise en mémoire tampon (140ms Input Buffer)
        const inActiveAttack = this.actionDuration > 0 && this.action !== 'idle' && this.action !== 'walk' && this.action !== 'crouch';
        if (inActiveAttack) {
            if (!this.canCancelInto(type)) {
                this.queueBufferedInput(type, 0.14);
                return false;
            }
        }

        // Enchaînement 1-2 pour les attaques légères
        if (type === 'light') {
            if (this.lastAttackType === 'light' && inActiveAttack) {
                type = 'light2';
            }
        }

        // Capturer la vélocité instantanée ||v|| avant le déclenchement pour le calcul de Momentum Damage
        const preAttackVelocity = Math.abs(this.vx) + (this.isSprinting ? this.dino.walkSpeed * 0.45 : 0);

        this.isBlocking = false;
        this.blockType = 'none';
        this._prevBlockType = 'none';
        this.action = type;
        this.lastAttackType = type;
        this.hasHitCurrentAttack = false;
        this.hasSpawnedAttackFx = false;
        this.hasHitConfirmed = false;
        this._specialLungeApplied = false;
        this._customSpecialFired = false;
        this._wakeupPopupShown = false;
        this._minionSpecialTriggered = false;
        this.actionTimer = 0;
        this.bufferedInput = null;
        this.bufferedAction = null;

        // Déclencher le cooldown si applicable (spéciaux uniquement)
        if (this.cooldowns && this.maxCooldowns && this.maxCooldowns[type]) {
            this.cooldowns[type] = this.maxCooldowns[type];
        }

        // Ankylosaure : Hyper-Armure sur les attaques lourdes durant le démarrage (IDs canoniques + alias)
        const isAnkylo = this.dino && (this.dino.id === 'ankylo' || this.dino.id === 'ankylosaurus');
        if (isAnkylo && (type === 'heavy' || type === 'fwd_heavy' || type === 'low_heavy' || type === 'anti_air')) {
            this.hasHyperArmor = true;
        } else {
            this.hasHyperArmor = false;
        }

        // Profil de Frame Data unifié
        const profile = this.getAttackFrameProfile(type);
        this.actionDuration = profile.duration;

        if (type === 'air_light') {
            this.vy = Math.min(this.vy, 2.0);
        } else if (type === 'air_heavy') {
            this.vy = profile.vySet !== undefined ? profile.vySet : -6.5;
            this.vx = this.facing * profile.lungeVx;
        } else {
            this.vx = this.facing * (profile.lungeVx || 0);
            if (profile.vyBoost) {
                this.vy = Math.max(this.vy, profile.vyBoost);
            }
        }

        // Audio de démarrage : sifflement d'attaque systématique, rugissement réservé aux lourds/spéciaux/chopes
        if (typeof sfx !== 'undefined') {
            if (typeof sfx.playSwing === 'function') {
                sfx.playSwing(Boolean(profile.isHeavy));
            }
            if (typeof sfx.playRoar === 'function') {
                if (type === 'heavy' || type === 'fwd_heavy' || type === 'low_heavy' || type === 'anti_air' || type === 'air_heavy') {
                    sfx.playRoar(92, 0.24);
                } else if (type === 'throw') {
                    sfx.playRoar(110, 0.28);
                } else if (type === 'special') {
                    sfx.playRoar(80, 0.34);
                } else if (type === 'special2') {
                    sfx.playRoar(115, 0.38);
                }
            }
        }

        // Intégration Update 2.0 : Évaluation du Momentum, File Stale-Move & TimeScale (0.85x si usé)
        if (this.combatController && type !== 'throw_whiff' && type !== 'super_whiff') {
            const effectiveSpeed = Math.max(preAttackVelocity, Math.abs(this.vx));
            const atkEval = this.combatController.recordAttackExecution(type, effectiveSpeed);
            this.staleMultiplier = atkEval.staleDamageMultiplier;
            this.lastStaleCount = atkEval.staleRepeatCount;

            if (atkEval.timeScale < 1.0) {
                this.actionDuration = this.actionDuration / atkEval.timeScale;
            }

            if (preAttackVelocity > 4.5 && type !== 'back_light') {
                this.vx += this.facing * (preAttackVelocity * 0.32);
            }
        }
        this.isSprinting = false;
        return true;
    }
}
if (typeof window !== 'undefined') {
    window.Fighter3D = Fighter3D;
}
