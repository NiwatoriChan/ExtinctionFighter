// 8. MOTEUR DE COMBAT 3D (POSITIONS X EN UNITÉS 3D : -11 À +11)
const STAGE_LEFT_3D = -11.0;
const STAGE_RIGHT_3D = 11.0;

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
        if (battleScene) {
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
        const isHeavy = id === 'apatosaurus' || id === 'ankylosaurus' || id === 'pachyrhinosaurus' || id === 'dragon';
        const isSpeed = id === 'smilodon' || id === 'terror-bird' || id === 'quetzal' || id === 'quetzalcoatlus' || id === 'pulmonoscorpius' || id === 'maiasaura' || id === 'postosuchus';

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

    destroy() {
        if (this.animationController) {
            this.animationController.dispose();
        }
        if (this.rig && this.rig.root && battleScene) {
            battleScene.remove(this.rig.root);
        }
    }

    isAirborne(threshold = 0.08) {
        const gY = this.groundY !== undefined ? this.groundY : (typeof getFighterSupportHeight === 'function' ? getFighterSupportHeight(this, currentArena) : 0);
        return (this.y - gY) > threshold || Boolean(this.isFlying);
    }

    resetForRound() {
        this.x = this.isP1 ? -4.8 : 4.8;
        const initGroundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, this.x, 0) : 0;
        this.groundY = initGroundY;
        this.y = initGroundY;
        this.onPlatform = null;
        this.dropThroughTimer = 0;
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
        this.beingThrownTimer = 0;
        this.thrownBy = null;
        this.hitStun = 0;
        this.isBlocking = false;
        this.blockType = 'none'; // 'none' | 'high' | 'mid' | 'low'
        this.isDizzy = false;
        this.isDead = false;
        this.decapitated = false;
        this.flattened = false;
        this.kneeling = false;
        this.isXrayTarget = false;
        this.isXrayAttacker = false;
        this.comboCount = 0;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashDir = 0;
        this.sprintDuration = 0;
        this.isSprinting = false;
        this.flightEndurance = 2.0;
        this.isFlying = false;
        this.bufferedAction = null;
        this.bufferTimer = 0;
        this.inputBuffer = []; // File d'attente d'inputs (~130ms)
        this.hasHyperArmor = false;
        this.lightComboStep = 0;
        this.lastAttackType = null;
        this.staleMultiplier = 1.0;
        this.momentumMultiplier = 1.0;
        this.lastStaleCount = 0;
        this.rig.headGroup.scale.setScalar(1);

        if (this.combatController) {
            this.combatController.reset();
        }

        // --- PROFILES DE POIDS, RAYON DE BLOCAGE PHYSIQUE (BODY BLOCKER) & GRAVITÉ ---
        const id = this.dino.id;
        const baseRadius = (id === 'apatosaurus' || id === 'ankylosaurus' || id === 'pachyrhinosaurus' || id === 'stegosaurus' || id === 'dragon')
            ? 1.42
            : ((id === 'trex' || id === 'spinosaurus' || id === 'giantsloth' || id === 'postosuchus') ? 1.32 : 1.18);
        this.bodyRadius = baseRadius * (this.dino.scale || 1.0);

        if (id === 'apatosaurus' || id === 'ankylosaurus' || id === 'pachyrhinosaurus' || id === 'dragon') {
            this.weightClass = 'heavy';
            this.gravityScale = 1.30;
            this.jumpVy = 10.5;
            this.knockbackMult = 0.65;
        } else if (id === 'smilodon' || id === 'terror-bird' || id === 'quetzal' || id === 'quetzalcoatlus' || id === 'pulmonoscorpius' || id === 'maiasaura' || id === 'postosuchus') {
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

        // Seules les compétences Spéciales et l'X-Ray possèdent un temps de recharge.
        // Les attaques de base (Légère & Lourde) sont débloquées pour un enchaînement fluide (Frame Data).
        this.cooldowns = {
            special: 0,
            special2: 0,
            xray: 0
        };
        const spdMod = Math.max(0.85, Math.min(1.15, 1.25 - (this.dino.stats.spd / 100) * 0.35));
        this.maxCooldowns = {
            special: 2.0 * spdMod,   // Spécial 1 : 2.0s
            special2: 3.6 * spdMod,  // Spécial 2 / Ultra : 3.6s
            xray: 8.0 * spdMod       // X-Ray : 8.0s + 100% Rage
        };
    }

    canCancelInto(nextType) {
        if (this.actionDuration <= 0) return true;
        const progress = this.actionTimer / this.actionDuration;

        // 1. RÈGLE STRICTE DU HIT-CONFIRM (INTERDICTION DU WHIFF-CANCEL) :
        // Un coup manqué dans le vide ne peut JAMAIS être annulé !
        // L'attaquant subit obligatoirement tout le recovery frames et devient punissable.
        if (!this.hasHitConfirmed) return false;

        // 2. FENÊTRE DE CANCEL POST-IMPACT (52% à 88%) :
        // Le coup doit avoir connecté visuellement et son impact avoir eu lieu.
        if (progress < 0.52 || progress > 0.88) return false;

        // 3. HIÉRARCHIE STRICTE DES COMBOS (CHAÎNE À SENS UNIQUE) :
        // Étape A : 'light' (1er coup léger) peut s'enchaîner vers :
        // - 'light2' (2e coup léger de la chaîne)
        // - un coup lourd / anti-air
        // - un spécial / X-Ray
        if (this.action === 'light') {
            if (nextType === 'light' || nextType === 'light2' || nextType.includes('heavy') || nextType === 'anti_air' || nextType.startsWith('special') || nextType === 'xray') {
                return true;
            }
            return false;
        }

        // Étape B : Command Normals légers (fwd_light, low_light, up_light, back_light, air_light) :
        // Ne peuvent s'annuler que vers un Finisher (Lourd / Anti-Air / Spécial), JAMAIS vers un autre léger.
        if (this.action === 'fwd_light' || this.action === 'low_light' || this.action === 'up_light' || this.action === 'back_light' || this.action === 'air_light') {
            if (nextType.includes('heavy') || nextType === 'anti_air' || nextType.startsWith('special') || nextType === 'xray') {
                return true;
            }
            return false;
        }

        // Étape C : 'light2' (2e coup léger) :
        // NE PEUT PLUS JAMAIS s'annuler vers un coup léger ! La chaîne de coups légers est terminée.
        // Seuls un coup Lourd, Anti-Air, Spécial ou X-Ray peuvent conclure le combo.
        if (this.action === 'light2') {
            if (nextType.includes('heavy') || nextType === 'anti_air' || nextType.startsWith('special') || nextType === 'xray') {
                return true;
            }
            return false;
        }

        // Étape D : Coups Lourds (heavy, fwd_heavy, anti_air, air_heavy) :
        // Fin de chaîne normale : ne peuvent s'annuler que vers un Spécial, Ultra ou X-Ray (Special Cancel).
        const isHeavyAct = this.action.includes('heavy') || this.action === 'anti_air';
        if (isHeavyAct) {
            if (nextType.startsWith('special') || nextType === 'xray') {
                return true;
            }
            return false;
        }

        return false;
    }

    startDash(dir) {
        if (xrayCinematicTimer > 0 || this.hitStun > 0 || this.isDizzy || this.isDead || this.dashCooldown > 0) return;
        if (this.combatController && (this.combatController.isInKnockdownSequence() || this.combatController.state === CombatState.BLOCK_DEFLECTED)) return;
        if (this.action === 'xray' || this.action === 'fatality' || this.action === 'throw') return;

        this.isBlocking = false;
        this.blockType = 'none';
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
        sfx.playHit(false);
        const popupText = dashDir === this.facing
            ? (dashDir === 1 ? '💨 DASH DROITE !' : '💨 DASH GAUCHE !')
            : (dashDir === 1 ? '💨 ESQUIVE DROITE !' : '💨 ESQUIVE GAUCHE !');
        spawnFloatingPopup(this.x, popupText, '#38bdf8');
    }

    startAttack(type) {
        if (xrayCinematicTimer > 0 || this.hitStun > 0 || this.isDizzy || this.isDead) return;
        if (this.combatController && (this.combatController.isInKnockdownSequence() || this.combatController.state === CombatState.BLOCK_DEFLECTED)) return;
        if (this.action === 'xray' || this.action === 'fatality') return;

        // Vérification de cooldown uniquement pour les capacités spéciales / X-Ray
        if (this.cooldowns && this.cooldowns[type] !== undefined && this.cooldowns[type] > 0) {
            if (this.isP1 || gameMode === 'pvp') {
                sfx.playCooldownWarning();
                const labels = {
                    special: this.dino.special1Name ? this.dino.special1Name.replace(/ \(.*?\)/, '').toUpperCase() : 'SPÉCIAL',
                    special2: this.dino.special2Name ? this.dino.special2Name.replace(/ \(.*?\)/, '').toUpperCase() : 'ULTRA',
                    xray: 'X-RAY'
                };
                spawnFloatingPopup(this.x, `⏳ ${labels[type] || type.toUpperCase()} EN RECHARGE (${this.cooldowns[type].toFixed(1)}s)`, '#94a3b8');
            }
            return;
        }

        // Gestion de l'annulation de combo ou de la mise en mémoire tampon (Input Buffer)
        const inActiveAttack = this.actionDuration > 0 && this.action !== 'idle' && this.action !== 'walk' && this.action !== 'crouch';
        if (inActiveAttack) {
            if (!this.canCancelInto(type)) {
                this.bufferedAction = type;
                this.bufferTimer = 0.18;
                return;
            }
        }

        // Gestion des enchaînements 1-2 pour les attaques légères
        if (type === 'light') {
            if (this.lastAttackType === 'light' && inActiveAttack) {
                type = 'light2';
            }
        }

        // Capturer la vélocité instantanée ||v|| avant le déclenchement pour le calcul de Momentum Damage
        const preAttackVelocity = Math.abs(this.vx) + (this.isSprinting ? this.dino.walkSpeed * 0.45 : 0);

        this.isBlocking = false;
        this.blockType = 'none';
        this.action = type;
        this.lastAttackType = type;
        this.hasHitCurrentAttack = false;
        this.hasSpawnedAttackFx = false;
        this.hasHitConfirmed = false;
        this.actionTimer = 0;
        this.bufferedAction = null;

        // Déclencher le cooldown si applicable (spéciaux uniquement)
        if (this.cooldowns && this.maxCooldowns && this.maxCooldowns[type]) {
            this.cooldowns[type] = this.maxCooldowns[type];
        }

        // Ankylosaure : Hyper-Armure sur les attaques lourdes durant le démarrage
        if (this.dino.id === 'ankylosaurus' && (type === 'heavy' || type === 'fwd_heavy' || type === 'low_heavy' || type === 'anti_air')) {
            this.hasHyperArmor = true;
        } else {
            this.hasHyperArmor = false;
        }

        // Calibrage fin des Frame States (Durée, Récupération & Vélocité équilibrées)
        if (type === 'light') {
            this.actionDuration = 0.28;
            this.vx = this.facing * 2.8;
            sfx.playRoar(160, 0.12);
        } else if (type === 'light2') {
            this.actionDuration = 0.30;
            this.vx = this.facing * 2.4;
            sfx.playRoar(140, 0.15);
        } else if (type === 'up_light') {
            this.actionDuration = 0.28;
            this.vx = this.facing * 1.5;
            this.vy = Math.max(this.vy, 1.8);
            sfx.playRoar(155, 0.14);
        } else if (type === 'fwd_light') {
            this.actionDuration = 0.30;
            this.vx = this.facing * 4.6;
            sfx.playRoar(150, 0.14);
        } else if (type === 'low_light') {
            this.actionDuration = 0.28;
            this.vx = this.facing * 2.0;
            sfx.playRoar(145, 0.13);
        } else if (type === 'back_light') {
            this.actionDuration = 0.26;
            this.vx = -this.facing * 3.2;
            sfx.playRoar(145, 0.12);
        } else if (type === 'air_light') {
            this.actionDuration = 0.28;
            this.vy = Math.min(this.vy, 2.0);
            sfx.playRoar(155, 0.14);
        } else if (type === 'heavy') {
            this.actionDuration = 0.44;
            this.vx = this.facing * 4.2;
            sfx.playRoar(95, 0.24);
        } else if (type === 'fwd_heavy') {
            this.actionDuration = 0.48;
            this.vx = this.facing * 5.6;
            sfx.playRoar(90, 0.28);
        } else if (type === 'low_heavy') {
            this.actionDuration = 0.44;
            this.vx = this.facing * 2.8;
            sfx.playRoar(90, 0.25);
        } else if (type === 'anti_air') {
            this.actionDuration = 0.42;
            this.vx = this.facing * 1.8;
            this.vy = Math.max(this.vy, 1.5);
            sfx.playRoar(85, 0.30);
        } else if (type === 'air_heavy') {
            this.actionDuration = 0.44;
            this.vy = -6.5; // Piqué violent vers le sol
            this.vx = this.facing * 3.8;
            sfx.playRoar(92, 0.32);
        } else if (type === 'throw') {
            this.actionDuration = 0.48;
            this.vx = this.facing * 1.8;
            sfx.playRoar(110, 0.35);
        } else if (type === 'throw_whiff') {
            this.actionDuration = 0.38;
            this.vx = 0;
        } else if (type === 'special') {
            this.actionDuration = 0.52;
            this.vx = this.facing * 4.6;
            sfx.playRoar(80, 0.36);
        } else if (type === 'special2') {
            this.actionDuration = 0.60;
            this.vx = this.facing * 3.2;
            sfx.playRoar(115, 0.40);
        }

        // Intégration Update 2.0 : Évaluation du Momentum, File Stale-Move & TimeScale (0.85x si usé)
        if (this.combatController && type !== 'throw_whiff') {
            const effectiveSpeed = Math.max(preAttackVelocity, Math.abs(this.vx));
            const atkEval = this.combatController.recordAttackExecution(type, effectiveSpeed);
            this.staleMultiplier = atkEval.staleDamageMultiplier;
            this.lastStaleCount = atkEval.staleRepeatCount;

            // Si le coup est usé (staled), ralentir l'animation (0.85x) et allonger la fenêtre de punition (recovery)
            if (atkEval.timeScale < 1.0) {
                this.actionDuration = this.actionDuration / atkEval.timeScale;
            }

            // Conserver l'élan cinématique lors d'une attaque lancée en Sprint (évite le glissement des pieds)
            if (preAttackVelocity > 4.5 && type !== 'back_light') {
                this.vx += this.facing * (preAttackVelocity * 0.32);
            }
        }
        this.isSprinting = false;
    }
}

