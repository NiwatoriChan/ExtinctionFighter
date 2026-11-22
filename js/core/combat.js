function resolveAttackVariant(attacker, type, defender = null) {
    if (type !== 'strike' && type !== 'light' && type !== 'heavy' && type !== 'special' && type !== 'throw') {
        return type;
    }

    const isP1 = attacker.isP1;

    // Détection directionnelle unifiée (Stick analogique, Croix directionnelle, Clavier, Tactile)
    // IMPORTANT : ShiftLeft est STRICTEMENT réservé à la garde, jamais à isDown !
    const moveLeft = isP1
        ? (keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left)
        : (keys['ArrowLeft'] || p2TouchState.left);
    const moveRight = isP1
        ? (keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right)
        : (keys['ArrowRight'] || p2TouchState.right);
    const isUp = isP1
        ? (keys['KeyW'] || keys['KeyZ'] || (gameMode !== 'pvp' && keys['ArrowUp']) || touchState.up)
        : (keys['ArrowUp'] || p2TouchState.up);
    const isDown = isP1
        ? (keys['KeyS'] || (gameMode !== 'pvp' && keys['ArrowDown']) || touchState.down)
        : (keys['ArrowDown'] || p2TouchState.down);

    const facing = attacker.facing || 1;
    const isForward = (facing === 1 && moveRight) || (facing === -1 && moveLeft);
    const isBack = (facing === 1 && moveLeft) || (facing === -1 && moveRight);
    const airHeight = (attacker.y || 0) - (attacker.groundY || 0);
    const isAirborne = airHeight > 0.15 || Boolean(attacker.isFlying);

    // 1. SPÉCIAL : Bas + Spécial = Spécial 2, sinon Spécial 1
    if (type === 'special') {
        return isDown ? 'special2' : 'special';
    }

    // 2. CHOPE (THROW) : Inbloquable à courte portée sur cible au sol dans la même bande verticale
    if (type === 'throw') {
        if (isAirborne) return 'throw_whiff';
        let target = defender;
        if (!target && typeof fighter1 !== 'undefined' && typeof fighter2 !== 'undefined') {
            target = attacker === fighter1 ? fighter2 : fighter1;
        }
        if (target && !target.isDead) {
            const defAirH = (target.y || 0) - (target.groundY || 0);
            const defGrounded = defAirH <= 0.18 && !target.isFlying;
            const dist = Math.abs(attacker.x - target.x);
            if (defGrounded && dist <= 3.1 && isWithinVerticalHitBand(attacker, target, 1.8, 1.4)) {
                return 'throw';
            }
            return 'throw_whiff';
        }
        // En mode campagne contre une vague de minions (sans boss actif)
        if (matchState === 'campaign_level' && typeof campaignActiveMinions !== 'undefined' && Array.isArray(campaignActiveMinions)) {
            for (let i = 0; i < campaignActiveMinions.length; i++) {
                const m = campaignActiveMinions[i];
                if (!m || m.isDead) continue;
                if (Math.abs(attacker.x - m.x) <= 3.1 && Math.abs((attacker.y || 0) - (m.y || 0)) <= 1.8) {
                    return 'throw';
                }
            }
        }
        return 'throw_whiff';
    }

    // 3. ATTAQUE LOURDE (HEAVY) : Aérienne / Anti-Air / Balayage Bas / Bélier Avant / Neutre
    if (type === 'heavy') {
        if (isAirborne) return 'air_heavy';
        if (isUp) return 'anti_air';
        if (isDown) return 'low_heavy';
        if (isForward) return 'fwd_heavy';
        return 'heavy';
    }

    // 4. ATTAQUE LÉGÈRE (STRIKE / LIGHT) : Haut / Aérien / Bas / Avant / Arrière / Neutre
    if (isUp) return 'up_light';
    if (isAirborne) return 'air_light';
    if (isDown) return 'low_light';
    if (isForward) return 'fwd_light';
    if (isBack) return 'back_light';
    return 'light';
}

function triggerPlayerAction(attacker, defender, type) {
    if (!attacker) return;
    if (!defender && matchState !== 'campaign_level') return;

    // Verrouillage strict pendant Super Flash, cinématique Super ou Slow-Mo K.O.
    const superLocked = typeof superState !== 'undefined' && superState && (superState.phase === 'flash' || superState.phase === 'cinematic');
    const koLocked = typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0;
    if (superLocked || koLocked) return;

    if (matchState !== 'fight' && matchState !== 'campaign_level') return;
    if (attacker.isDead || attacker.isDizzy) return;

    const normType = (type === 'xray') ? 'super' : type;
    const ctrl = attacker.combatController;
    const inLockedState = (
        attacker.hitStun > 0 ||
        attacker.beingThrownTimer > 0 ||
        attacker.dashTimer > 0 ||
        (ctrl && (ctrl.isInKnockdownSequence() || ctrl.state === CombatState.BLOCK_DEFLECTED))
    );

    // PROTÉGER : Armure directionnelle 3-voies (Haute, Médiane, Basse) + Horodatage Parade Parfaite
    if (normType === 'guard') {
        if (inLockedState || attacker.actionDuration > 0) return;
        const isP1 = attacker.isP1;
        const isUp = isP1
            ? (keys['KeyW'] || keys['KeyZ'] || (gameMode !== 'pvp' && keys['ArrowUp']) || touchState.up)
            : (keys['ArrowUp'] || p2TouchState.up);
        const isDown = isP1
            ? (keys['KeyS'] || (gameMode !== 'pvp' && keys['ArrowDown']) || touchState.down)
            : (keys['ArrowDown'] || p2TouchState.down);

        const nextBlockType = isUp ? 'high' : (isDown ? 'low' : 'mid');
        const nowSec = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
        if (!attacker.isBlocking || attacker._prevBlockType !== nextBlockType) {
            attacker.guardStartTime = nowSec;
            attacker._prevBlockType = nextBlockType;
        }
        attacker.isBlocking = true;
        attacker.blockType = nextBlockType;
        attacker.action = attacker.blockType === 'low' ? 'crouch' : 'idle';
        attacker.vx = 0;
        return;
    }

    // SAUTER (avec mise en tampon 140ms juste avant l'atterrissage / fin de recovery)
    if (normType === 'jump') {
        if (inLockedState || attacker.actionDuration > 0) {
            if (typeof attacker.queueBufferedInput === 'function') attacker.queueBufferedInput('jump', 0.14);
            return;
        }
        const airHeight = (attacker.y || 0) - (attacker.groundY || 0);
        if (airHeight > 0.10) {
            if (typeof attacker.queueBufferedInput === 'function') attacker.queueBufferedInput('jump', 0.14);
            return;
        }
        attacker.isBlocking = false;
        attacker.blockType = 'none';
        attacker._prevBlockType = 'none';
        attacker.vy = attacker.jumpVy || 11.8;
        const moveLeft = attacker.isP1
            ? (keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left)
            : (keys['ArrowLeft'] || p2TouchState.left);
        const moveRight = attacker.isP1
            ? (keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right)
            : (keys['ArrowRight'] || p2TouchState.right);
        const curWalkSpd = (attacker.dino && attacker.dino.walkSpeed) || 7.5;
        if (moveLeft) attacker.vx = -curWalkSpd * 0.70;
        if (moveRight) attacker.vx = curWalkSpd * 0.70;
        attacker.action = 'jump';
        if (typeof sfx !== 'undefined') {
            if (typeof sfx.playJump === 'function') sfx.playJump();
            else if (typeof sfx.playWhoosh === 'function') sfx.playWhoosh();
        }
        if (typeof spawn3DDustPuff === 'function') {
            spawn3DDustPuff(attacker.x, attacker.y || 0, attacker.weightClass === 'heavy' ? 1.2 : 0.85, 6);
        }
        return;
    }

    // DASH : Ruée rapide et esquive (bufferisable en recovery/hitstun/atterrissage)
    if (normType === 'dash') {
        if (inLockedState || attacker.actionDuration > 0) {
            if (typeof attacker.queueBufferedInput === 'function') attacker.queueBufferedInput('dash', 0.14);
            return;
        }
        const moveLeft = attacker.isP1
            ? (keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left)
            : (keys['ArrowLeft'] || p2TouchState.left);
        const moveRight = attacker.isP1
            ? (keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right)
            : (keys['ArrowRight'] || p2TouchState.right);
        const dir = moveLeft ? -1 : (moveRight ? 1 : attacker.facing);
        attacker.startDash(dir);
        return;
    }

    // PRIMAL SUPER (100% Rage — Combo-cancelable sur Hit-Confirm, Dash-cancelable + Bufferisable !)
    if (normType === 'super') {
        if (attacker.rage < 100) {
            if (attacker.isP1 || gameMode === 'pvp') {
                if (typeof sfx !== 'undefined' && typeof sfx.playCooldownWarning === 'function') {
                    sfx.playCooldownWarning();
                }
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(attacker.x, '⚡ RAGE INSUFFISANTE (100% REQUIS) !', '#ef4444');
                }
            }
            return;
        }
        if (typeof superState !== 'undefined' && superState) return;

        const inHardLockedState = (
            attacker.hitStun > 0 ||
            attacker.beingThrownTimer > 0 ||
            (ctrl && (ctrl.isInKnockdownSequence() || ctrl.state === CombatState.BLOCK_DEFLECTED))
        );
        if (inHardLockedState) {
            if (typeof attacker.queueBufferedInput === 'function') attacker.queueBufferedInput('super', 0.55);
            return;
        }

        const inActiveAttack = attacker.actionDuration > 0 && attacker.action !== 'idle' && attacker.action !== 'walk' && attacker.action !== 'crouch';
        if (inActiveAttack && !attacker.canCancelInto('super')) {
            if (typeof attacker.queueBufferedInput === 'function') attacker.queueBufferedInput('super', 0.55);
            return;
        }

        if (typeof executeSuperAttack === 'function') {
            executeSuperAttack(attacker, defender);
        }
        return;
    }

    // ATTAQUES (Légères, Lourdes, Spécial 1 & 2, Chope) : Bufferisation si verrouillé
    if (inLockedState) {
        if (typeof attacker.queueBufferedInput === 'function') attacker.queueBufferedInput(normType, 0.14);
        return;
    }

    const finalType = resolveAttackVariant(attacker, normType, defender);
    attacker.startAttack(finalType);
}

/**
 * Vérifie si l'attaquant et le défenseur se trouvent dans la même bande verticale
 * afin d'empêcher les coups de toucher à travers deux étages / plateformes distinctes.
 */
function isWithinVerticalHitBand(attacker, defender, maxAbove = 2.0, maxBelow = 1.6, allowCrossFloor = false) {
    if (!attacker || !defender) return false;
    const dy = (defender.y || 0) - (attacker.y || 0);
    if (dy > maxAbove || dy < -maxBelow) return false;

    if (!allowCrossFloor) {
        const attGround = attacker.groundY !== undefined ? attacker.groundY : 0;
        const defGround = defender.groundY !== undefined ? defender.groundY : 0;
        const attAir = Math.abs((attacker.y || 0) - attGround);
        const defAir = Math.abs((defender.y || 0) - defGround);
        if (Math.abs(attGround - defGround) >= 2.1 && Math.abs((attacker.y || 0) - (defender.y || 0)) >= 1.9 && attAir <= 0.45 && defAir <= 0.45) {
            return false;
        }
    }
    return true;
}
if (typeof window !== 'undefined') {
    window.resolveAttackVariant = resolveAttackVariant;
    window.triggerPlayerAction = triggerPlayerAction;
    window.isWithinVerticalHitBand = isWithinVerticalHitBand;
}

/**
 * Évalue la collision d'une attaque active sur la frame courante.
 * Retourne TRUE uniquement si le coup connecte (hit, block, parry, throw ou projectile/AoE déclenché),
 * et FALSE en cas de whiff afin de laisser la hitbox active sur toute sa fenêtre multi-frames !
 */
function checkAttackCollision3D(attacker, defender) {
    if (!attacker || !defender || defender.isDead) return false;

    // Invulnérabilité de démarrage d'une Primal Super (Reversal)
    if (defender.superInvulnTimer > 0) {
        return false;
    }

    // Invulnérabilité pendant la séquence de relevé (Wake_Up_Stand)
    if (defender.combatController && defender.combatController.state === CombatState.WAKE_UP_STAND) {
        if (!attacker._wakeupPopupShown) {
            attacker._wakeupPopupShown = true;
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, '🛡️ INVULNÉRABLE (RELEVÉ) !', '#38bdf8');
            }
        }
        return false;
    }

    const act = attacker.action;
    if (act === 'throw_whiff' || act === 'super_whiff') return false;

    const dist = Math.abs(attacker.x - defender.x);
    const basePow = attacker.dino.stats.pow;
    const defAirH = (defender.y || 0) - (defender.groundY || 0);

    // 1. PRIMAL SUPER STARTUP (Hitbox réelle de rush — esquivable, bloquable ou connectable !)
    if (act === 'super_startup') {
        const spec = typeof getSuperSpec === 'function' ? getSuperSpec(attacker.dino && attacker.dino.id) : null;
        const superReach = (spec && spec.reach) || 4.2;
        if (dist <= superReach && isWithinVerticalHitBand(attacker, defender, 2.6, 2.0, defAirH > 0.25)) {
            if (typeof onSuperStartupContact === 'function') {
                return Boolean(onSuperStartupContact(attacker, defender));
            }
        }
        return false;
    }

    // 2. CHOPE (THROW) : Inbloquable à courte portée sur cible au sol
    if (act === 'throw') {
        const defGrounded = defAirH <= 0.25 && !defender.isFlying;
        if (dist <= 3.1 && defGrounded && isWithinVerticalHitBand(attacker, defender, 1.8, 1.4)) {
            defender.isBlocking = false;
            defender.blockType = 'none';
            defender._prevBlockType = 'none';
            defender.beingThrownTimer = 0.42;
            defender.thrownBy = attacker;
            const res = applyDamage(attacker, defender, Math.round(basePow * 0.95), true, '🤼 CHOPE !', false, 'throw');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    // 3. SPÉCIAL 1 (Projectile unique OU Ruée/Frappe multi-frames)
    if (act === 'special') {
        const fighterImpl = FIGHTER_IMPLS[attacker.dino.id];
        if (fighterImpl && fighterImpl.onSpecial) {
            if (!attacker._customSpecialFired) {
                attacker._customSpecialFired = true;
                const prevProjLen = (typeof projectiles3D !== 'undefined' && Array.isArray(projectiles3D)) ? projectiles3D.length : 0;
                fighterImpl.onSpecial(attacker, defender, dist, basePow);
                const spawnedProj = (typeof projectiles3D !== 'undefined' && Array.isArray(projectiles3D)) && projectiles3D.length > prevProjLen;
                if (spawnedProj || attacker.hasHitConfirmed) {
                    return true;
                }
                return false;
            }
            // Frames actives suivantes d'un spécial de mêlée/ruée sans spammer le rugissement
            const rushReach = attacker.dino.id === 'apato' ? 6.4 : 4.8;
            if (dist < rushReach && isWithinVerticalHitBand(attacker, defender, 2.4, 1.8)) {
                const label = (attacker.dino.special1Name || 'SPÉCIAL !').replace(/ \(.*?\)/, '').toUpperCase() + ' !';
                const res = applyDamage(attacker, defender, Math.round(basePow * 1.1), true, label, false, 'mid');
                return res !== 'invuln' && res !== 'none';
            }
            return false;
        }
        if (!attacker._specialLungeApplied) {
            attacker._specialLungeApplied = true;
            attacker.vx = attacker.facing * 22;
        }
        if (dist < 4.6 && isWithinVerticalHitBand(attacker, defender, 2.2, 1.8)) {
            const label = (attacker.dino.special1Name || 'SPÉCIAL').replace(/ \(.*?\)/, '');
            const res = applyDamage(attacker, defender, Math.round(basePow * 1.1), true, label, false, 'mid');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    // 4. SPÉCIAL 2 (Projectile / Séisme one-shot OU Morsure de mêlée)
    if (act === 'special2') {
        const fighterImpl = FIGHTER_IMPLS[attacker.dino.id];
        const isMeleeSpecial2 = ['smilodon', 'gorgonopsia', 'cameroceras', 'anomalocaris'].includes(attacker.dino.id);
        if (!attacker._customSpecialFired) {
            attacker._customSpecialFired = true;
            const prevProjLen = (typeof projectiles3D !== 'undefined' && Array.isArray(projectiles3D)) ? projectiles3D.length : 0;
            if (fighterImpl && fighterImpl.onSpecial2) {
                fighterImpl.onSpecial2(attacker, defender, dist, basePow);
            } else if (typeof spawn3DProjectile === 'function') {
                spawn3DProjectile(attacker, 'boulder');
            }
            const spawnedProj = (typeof projectiles3D !== 'undefined' && Array.isArray(projectiles3D)) && projectiles3D.length > prevProjLen;
            if (spawnedProj || attacker.hasHitConfirmed || !isMeleeSpecial2) {
                return true;
            }
            return false;
        }
        // Frames actives suivantes pour les spéciaux 2 de mêlée qui ruent vers la cible
        if (isMeleeSpecial2 && dist < 4.0 && isWithinVerticalHitBand(attacker, defender, 2.2, 1.8)) {
            const label = (attacker.dino.special2Name || 'ULTRA !').replace(/ \(.*?\)/, '').toUpperCase() + ' !';
            const res = applyDamage(attacker, defender, Math.round(basePow * 1.25), true, label, false, 'mid');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    // 5. COUPS NORMAUX (Multi-frames : ne verrouille le hit qu'en cas de contact effectif)
    const reachImpl = FIGHTER_IMPLS[attacker.dino.id];
    let reach = ((reachImpl && reachImpl.attackReach) || 3.45);

    if (act === 'fwd_light' || act === 'fwd_heavy') reach += 0.85;
    else if (act === 'heavy' || act === 'low_heavy') reach += 0.55;
    else if (act === 'anti_air' || act === 'up_light') reach += 0.35;

    // Évaluation découplée des volumes THREE.Box3 (ColliderRig Hitbox vs Hurtbox)
    let box3Hit = false;
    if (attacker.colliderRig && defender.colliderRig && attacker.combatController) {
        const atkKey = attacker.combatController.activeAttackKey || AnimationKey.ATTACK_MID;
        attacker.colliderRig.setHitboxActive(atkKey, true);
        const boxResult = attacker.colliderRig.checkIntersection(atkKey, defender.colliderRig);
        attacker.colliderRig.setHitboxActive(atkKey, false);
        box3Hit = boxResult.intersected;
    }

    const inRange = (dist <= reach) || (box3Hit && dist <= reach + 1.2);
    if (!inRange) return false;

    if (act === 'up_light') {
        if (isWithinVerticalHitBand(attacker, defender, 2.9, 1.2, defAirH > 0.25)) {
            const res = applyDamage(attacker, defender, Math.round(basePow * 0.52), false, '👆 UPPERCUT HAUT !', false, 'high');
            if (res === 'hit') {
                defender.vy = Math.max(defender.vy, 4.6);
                defender.onPlatform = null;
            }
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    if (act === 'anti_air') {
        if (isWithinVerticalHitBand(attacker, defender, 3.2, 1.0, defAirH > 0.35)) {
            const res = applyDamage(attacker, defender, Math.round(basePow * 0.84), true, '🚀 LAUNCHER CÉLESTE !', false, 'antiair');
            if (res === 'hit') {
                defender.onPlatform = null;
            }
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    if (act === 'low_light') {
        if (isWithinVerticalHitBand(attacker, defender, 1.4, 1.2)) {
            const res = applyDamage(attacker, defender, Math.round(basePow * 0.46), false, '🦶 BALAYAGE BAS !', false, 'low');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    if (act === 'low_heavy') {
        if (isWithinVerticalHitBand(attacker, defender, 1.5, 1.3)) {
            const res = applyDamage(attacker, defender, Math.round(basePow * 0.86), true, '💥 ÉCRASEMENT BAS !', false, 'low');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    if (act === 'back_light') {
        if (isWithinVerticalHitBand(attacker, defender, 1.9, 1.5)) {
            const res = applyDamage(attacker, defender, Math.round(basePow * 0.44), false, '🛡️ CONTRE ARRIÈRE !', false, 'mid');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    if (act === 'air_light' || act === 'air_heavy') {
        if (isWithinVerticalHitBand(attacker, defender, 2.2, 2.5, true)) {
            const isH = act === 'air_heavy';
            const res = applyDamage(attacker, defender, Math.round(basePow * (isH ? 0.92 : 0.52)), isH, isH ? '🦅 DIVE HEAVY !' : '🦅 DIVE KICK !', false, 'overhead');
            return res !== 'invuln' && res !== 'none';
        }
        return false;
    }

    // Coups standards et frappes avancées au sol (Zone MID)
    if (isWithinVerticalHitBand(attacker, defender, 2.0, 1.5)) {
        let res = 'none';
        if (act === 'light') {
            res = applyDamage(attacker, defender, Math.round(basePow * 0.48), false, '', false, 'mid');
        } else if (act === 'light2') {
            res = applyDamage(attacker, defender, Math.round(basePow * 0.58), false, '⚡ COMBO 2-HITS !', false, 'mid');
        } else if (act === 'fwd_light') {
            res = applyDamage(attacker, defender, Math.round(basePow * 0.54), false, '👉 PERCÉE AVANT !', false, 'mid');
        } else if (act === 'heavy') {
            res = applyDamage(attacker, defender, Math.round(basePow * 0.88), true, '', false, 'mid');
        } else if (act === 'fwd_heavy') {
            res = applyDamage(attacker, defender, Math.round(basePow * 0.98), true, '💥 BÉLIER AVANT !', false, 'mid');
        } else {
            return false;
        }
        return res !== 'invuln' && res !== 'none';
    }

    return false;
}

// Spécial 2 sismique partagé (Apatosaure, Pachyrhinosaure, Mégathérium, Stégosaure)
function special2SeismicQuake(attacker, defender, dist, basePow) {
    screenShake = 0.65;
    if (typeof spawn3DGroundShockwave === 'function') {
        spawn3DGroundShockwave(attacker.x + attacker.facing * 2.0, 0xf59e0b, 4.2, true);
        if (defender) {
            spawn3DGroundShockwave(defender.x, 0xef4444, 3.0, true);
        }
    }
    if (!defender) return;

    if (typeof spawn3DBloodAndBones === 'function') {
        spawn3DBloodAndBones(defender.x, (defender.y || 0) + 0.3, 18, true);
    }
    if (dist < 8.5) {
        const floorDiff = Math.abs((attacker.groundY || 0) - (defender.groundY || 0));
        const defAirH = (defender.y || 0) - (defender.groundY || 0);
        // L'onde sismique se propage uniquement sur le même étage / niveau de sol !
        if (floorDiff > 1.4 || Math.abs((attacker.y || 0) - (defender.y || 0)) > 2.6) {
            return;
        }
        // Si l'adversaire saute ou est en vol sur ce même étage, il évite l'onde sismique !
        if (defAirH > 0.25) {
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, '🕊️ SÉISME ÉVITÉ EN VOL / SAUT !', '#38bdf8');
            }
        } else {
            // Onde sismique inbloquable au sol : force le saut !
            defender.isBlocking = false;
            defender.blockType = 'none';
            defender._prevBlockType = 'none';
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, '💥 SÉISME AU SOL (INBLOQUABLE) !', false, 'seismic');
            defender.vy = 5.2;
        }
    }
}
