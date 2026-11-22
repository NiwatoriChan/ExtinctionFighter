// ============================================================================
// js/core/animation.js — 3D Animation Orchestrator, Super Poses & Pose Blending
// Délègue aux modules de js/animations/common/ et js/animations/<creature>/
// ============================================================================

function _smoothAxis(prevVal, targetVal, alpha) {
    return prevVal + (targetVal - prevVal) * alpha;
}

function _smoothBoneRot(bone, cacheObj, key, alpha, snap) {
    if (!bone || !bone.rotation) return;
    const tx = bone.rotation.x || 0;
    const ty = bone.rotation.y || 0;
    const tz = bone.rotation.z || 0;
    let entry = cacheObj[key];
    if (!entry || snap) {
        entry = { x: tx, y: ty, z: tz };
        cacheObj[key] = entry;
        return;
    }
    entry.x = _smoothAxis(entry.x, tx, alpha);
    entry.y = _smoothAxis(entry.y, ty, alpha);
    entry.z = _smoothAxis(entry.z, tz, alpha);
    bone.rotation.x = entry.x;
    bone.rotation.y = entry.y;
    bone.rotation.z = entry.z;
}

function applyRigPoseSmoothing(fighter, rig, dt) {
    if (!rig || !rig.hips) return;
    const act = fighter ? fighter.action : 'idle';
    const isSnappyState = Boolean(
        fighter && (
            fighter.hitStun > 0 ||
            fighter.dashTimer > 0 ||
            fighter.beingThrownTimer > 0 ||
            fighter.isSuperTarget ||
            act === 'light' || act === 'light2' || act === 'heavy' ||
            act === 'fwd_light' || act === 'back_light' || act === 'up_light' || act === 'low_light' || act === 'air_light' ||
            act === 'fwd_heavy' || act === 'low_heavy' || act === 'anti_air' || act === 'air_heavy' ||
            act === 'throw' || act === 'throw_whiff' ||
            act === 'special' || act === 'special2' ||
            act === 'super_startup' || act === 'super_cinematic' || act === 'super_aoe' || act === 'fatality'
        )
    );

    const safeDt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    const stiffness = isSnappyState ? 38 : 16;
    const alpha = 1 - Math.exp(-stiffness * safeDt);

    const snap = !rig._smoothCache;
    if (!rig._smoothCache) {
        rig._smoothCache = {
            hipsPos: { x: rig.hips.position.x, y: rig.hips.position.y, z: rig.hips.position.z },
            rots: {}
        };
    }

    const cache = rig._smoothCache;
    const hp = rig.hips.position;
    if (snap) {
        cache.hipsPos.x = hp.x;
        cache.hipsPos.y = hp.y;
        cache.hipsPos.z = hp.z;
    } else {
        cache.hipsPos.x = _smoothAxis(cache.hipsPos.x, hp.x, alpha);
        cache.hipsPos.y = _smoothAxis(cache.hipsPos.y, hp.y, alpha);
        cache.hipsPos.z = _smoothAxis(cache.hipsPos.z, hp.z, alpha);
        hp.x = cache.hipsPos.x;
        hp.y = cache.hipsPos.y;
        hp.z = cache.hipsPos.z;
    }

    const rots = cache.rots;
    _smoothBoneRot(rig.hips, rots, 'hips', alpha, snap);
    _smoothBoneRot(rig.torso, rots, 'torso', alpha, snap);
    _smoothBoneRot(rig.neck, rots, 'neck', alpha, snap);
    _smoothBoneRot(rig.headGroup, rots, 'head', alpha, snap);
    _smoothBoneRot(rig.jaw, rots, 'jaw', alpha, snap);

    if (rig.legs) {
        for (let i = 0; i < rig.legs.length; i++) {
            _smoothBoneRot(rig.legs[i], rots, 'leg_' + i, alpha, snap);
        }
    }
    if (rig.arms) {
        for (let i = 0; i < rig.arms.length; i++) {
            _smoothBoneRot(rig.arms[i], rots, 'arm_' + i, alpha, snap);
        }
    }
    if (rig.tailSegments) {
        for (let i = 0; i < rig.tailSegments.length; i++) {
            _smoothBoneRot(rig.tailSegments[i], rots, 'tail_' + i, alpha, snap);
        }
    }
    if (rig.specialParts) {
        _smoothBoneRot(rig.specialParts.leftWing, rots, 'leftWing', alpha, snap);
        _smoothBoneRot(rig.specialParts.rightWing, rots, 'rightWing', alpha, snap);
        _smoothBoneRot(rig.specialParts.stinger, rots, 'stinger', alpha, snap);
        if (rig.specialParts.neckSegments) {
            for (let i = 0; i < rig.specialParts.neckSegments.length; i++) {
                _smoothBoneRot(rig.specialParts.neckSegments[i], rots, 'neckSeg_' + i, alpha, snap);
            }
        }
    }
}

function _applySuperFallbackPose(rig, prog, baseHipsY) {
    const pulse = Math.sin(prog * Math.PI * 6);
    rig.hips.position.x = 0.78 * Math.sin(prog * Math.PI);
    rig.hips.position.y = baseHipsY + (prog > 0.68 ? 0.34 : -0.10);
    rig.torso.rotation.z = prog < 0.35 ? -0.38 : (prog < 0.72 ? 0.16 + pulse * 0.20 : 0.44);
    rig.torso.rotation.y = pulse * 0.36;
    rig.neck.rotation.z = prog > 0.68 ? 0.34 : -0.22;
    rig.headGroup.rotation.z = prog > 0.68 ? 0.48 : -0.20;
    rig.jaw.rotation.z = -0.88;
    if (rig.arms) {
        if (rig.arms[0]) rig.arms[0].rotation.z = prog < 0.72 ? 1.15 : 1.55;
        if (rig.arms[1]) rig.arms[1].rotation.z = prog < 0.72 ? -0.85 : 1.35;
    }
    if (rig.tailSegments) {
        rig.tailSegments.forEach((s, i) => {
            if (s) s.rotation.y = -pulse * (0.20 + i * 0.05);
        });
    }
}

function animateDino3DRig(fighter, time, dt) {
    const rig = fighter.rig;
    if (!rig || !rig._isGlbHydrated) return;
    const id = fighter.dino.id;
    const act = fighter.action;
    const prog = fighter.actionDuration > 0 ? Math.min(1, fighter.actionTimer / fighter.actionDuration) : 0;

    const baseId = (fighter.dino && fighter.dino.animBaseId) || id;
    const fighterImpl = FIGHTER_IMPLS[id] || FIGHTER_ANIMATIONS[id] || FIGHTER_IMPLS[baseId] || FIGHTER_ANIMATIONS[baseId] || {};
    const baseHipsY = fighterImpl.animBaseHipsY !== undefined ? fighterImpl.animBaseHipsY : 2.1;

    // 1. RÉINITIALISATION COMPLÈTE À LA POSE DE REPOS (REST POSE) À CHAQUE FRAME
    resetDino3DRig(fighter, rig, baseHipsY, time, dt);

    const finalizeRigPose = () => {
        // Compression d'impact à l'atterrissage (Landing Squash)
        if (fighter.landingSquashTimer > 0) {
            const squash = Math.min(1.0, fighter.landingSquashTimer / 0.14);
            rig.hips.position.y -= squash * 0.28;
            rig.torso.rotation.z -= squash * 0.14;
        }

        // Lissage adaptatif des os (élimine le snapping sans casser le punch d'impact)
        applyRigPoseSmoothing(fighter, rig, dt);

        // Micro-vibration latérale pendant le hitstop (appliquée après lissage pour rester incisive)
        if (fighter.hitShakeOffset) {
            rig.hips.position.x += fighter.hitShakeOffset;
        }
    };

    // 2. RÉACTIONS DE COMBAT (SUPER TARGET, MORT, DIZZY, CHOPE, KNOCKDOWN, HITSTUN, GARDE 3-VOIES)
    if (animateCombatReactions(fighter, rig, baseHipsY, act, time, dt)) {
        finalizeRigPose();
        return;
    }

    // 3. RUÉE / DASH AÉRODYNAMIQUE (AVANT / ARRIÈRE)
    if (fighter.dashTimer > 0) {
        const dashProg = Math.min(1.0, fighter.dashTimer / 0.22);
        const lunge = Math.sin(dashProg * Math.PI);
        const dashDir = fighter.dashDir !== undefined && fighter.dashDir !== 0
            ? fighter.dashDir
            : (Math.sign(fighter.vx) || fighter.facing);
        const isBackDash = dashDir !== fighter.facing;

        if (fighterImpl && fighterImpl.animateDash) {
            fighterImpl.animateDash({ fighter, rig, id, lunge, dashProg, isBackDash, baseHipsY, time });
            finalizeRigPose();
            return;
        }
    }

    // 4. DÉTECTION DES ACTIONS D'ATTAQUE, PRIMAL SUPERS & COURBES BIOMÉCANIQUES
    const isSuperAction = act === 'super_startup' || act === 'super_cinematic' || act === 'super_aoe' || act === 'super_whiff';
    const isAttackAction = act === 'light' || act === 'light2' || act === 'heavy' || act === 'special' || act === 'special2' || act === 'xray' ||
        act === 'fwd_light' || act === 'low_light' || act === 'air_light' ||
        act === 'fwd_heavy' || act === 'anti_air' || act === 'air_heavy' ||
        act === 'up_light' || act === 'low_heavy' || act === 'back_light' ||
        act === 'throw' || act === 'throw_whiff';

    const { strike, swing, anticipate } = computeAttackBiomechanics(prog);

    if (fighter._walkAnimTime === undefined) {
        fighter._walkAnimTime = time;
    }
    const isWalk = act === 'walk';
    const isMovingBackward = isWalk && (fighter.vx * fighter.facing < -0.05);
    const safeDt = Math.min(0.05, Math.max(0, dt || 0.016));
    const airHeight = (fighter.y || 0) - (fighter.groundY || 0);

    if (isWalk) {
        const walkSpeedRef = (fighter.dino && fighter.dino.walkSpeed) || 7.5;
        const speedScale = Math.max(0.45, Math.min(1.8, Math.abs(fighter.vx) / walkSpeedRef));
        const dirSign = isMovingBackward ? -1 : 1;
        fighter._walkAnimTime += safeDt * speedScale * dirSign;

        // Poids des pas pour les créatures lourdes (poussière, micro-secousse, pas sourd)
        if (fighter.weightClass === 'heavy' && !fighter.isFlying && airHeight <= 0.08 && Math.abs(fighter.vx) > 0.35) {
            const strideFreq = (fighter.isSprinting || fighter.sprintDuration > 0.25) ? 10.2 : 7.5;
            const prevPhase = fighter._prevWalkPhase || 0;
            const nextPhase = prevPhase + safeDt * speedScale * strideFreq;
            if (Math.floor(nextPhase / Math.PI) > Math.floor(prevPhase / Math.PI)) {
                if (typeof spawn3DDustPuff === 'function') {
                    spawn3DDustPuff(fighter.x, fighter.groundY !== undefined ? fighter.groundY : (fighter.y || 0), 0.75, 3);
                }
                if (typeof screenShake === 'number') {
                    screenShake = Math.max(screenShake, 0.05);
                }
                if (typeof sfx !== 'undefined' && sfx && typeof sfx.playFootstep === 'function') {
                    sfx.playFootstep(true);
                }
            }
            fighter._prevWalkPhase = nextPhase;
        }
    } else {
        fighter._walkAnimTime = time;
    }

    const animTime = isWalk ? fighter._walkAnimTime : time;
    const animCtx = { fighter, rig, id, act, prog, strike, swing, anticipate, baseHipsY, time: animTime, dt, isWalk, isMovingBackward };

    // 4B. CHORÉGRAPHIES DES PRIMAL SUPERS (STARTUP, CINEMATIC, AOE, WHIFF)
    if (isSuperAction) {
        if (act === 'super_cinematic' || act === 'super_aoe') {
            if (fighterImpl.animateSuper) {
                fighterImpl.animateSuper(animCtx);
            } else if (fighterImpl.animateFatality) {
                fighterImpl.animateFatality(animCtx);
            } else {
                _applySuperFallbackPose(rig, prog, baseHipsY);
            }
        } else if (act === 'super_startup') {
            const isSuperFlash = Boolean(fighter.isSuperAttacker && typeof superState !== 'undefined' && superState && superState.phase === 'flash');
            if (isSuperFlash) {
                // Posture d'invocation / rugissement tendu pendant le Super Flash
                const pulse = Math.sin(time * 28);
                rig.hips.position.y = baseHipsY * 0.94 + Math.abs(pulse) * 0.08;
                rig.hips.position.x = -0.18;
                rig.torso.rotation.z = 0.26 + pulse * 0.06;
                rig.neck.rotation.z = 0.32;
                rig.headGroup.rotation.z = 0.42 + pulse * 0.08;
                rig.jaw.rotation.z = -0.95;
                if (rig.arms) {
                    if (rig.arms[0]) rig.arms[0].rotation.z = 0.85;
                    if (rig.arms[1]) rig.arms[1].rotation.z = 0.85;
                }
                if (rig.tailSegments) {
                    rig.tailSegments.forEach((s, i) => {
                        if (s) s.rotation.y = Math.sin(time * 16 - i * 0.45) * 0.28;
                    });
                }
            } else {
                // Ruée prédatrice agressive vers l'avant (Super Startup)
                const drive = Math.sin(time * 26);
                const chargeProg = Math.min(1, prog * 1.45);
                rig.hips.position.x = 0.42 + chargeProg * 0.56;
                rig.hips.position.y = baseHipsY * 0.86 + Math.abs(drive) * 0.12;
                rig.torso.rotation.z = -0.34 - chargeProg * 0.14;
                rig.neck.rotation.z = -0.28;
                rig.headGroup.rotation.z = -0.10 + chargeProg * 0.18;
                rig.jaw.rotation.z = -0.84 - Math.abs(drive) * 0.16;
                if (rig.legs) {
                    if (rig.legs[0]) rig.legs[0].rotation.z = drive * 0.78;
                    if (rig.legs[1]) rig.legs[1].rotation.z = -drive * 0.78;
                    if (rig.legs[2]) rig.legs[2].rotation.z = -drive * 0.62;
                    if (rig.legs[3]) rig.legs[3].rotation.z = drive * 0.62;
                }
                if (rig.arms) {
                    if (rig.arms[0]) rig.arms[0].rotation.z = 0.70 + chargeProg * 0.45;
                    if (rig.arms[1]) rig.arms[1].rotation.z = 0.70 + chargeProg * 0.45;
                }
                if (rig.tailSegments) {
                    rig.tailSegments.forEach((s, i) => {
                        if (s) {
                            s.rotation.z = -0.18;
                            s.rotation.y = Math.sin(time * 18 - i * 0.4) * 0.24;
                        }
                    });
                }
            }
        } else if (act === 'super_whiff') {
            // Posture déséquilibrée et vulnérable après un Super manqué / bloqué
            const stagger = Math.sin(prog * Math.PI);
            const wobble = Math.sin(time * 22) * 0.16 * stagger;
            rig.hips.position.x = (1 - prog) * 0.46;
            rig.hips.position.y = baseHipsY * (1 - stagger * 0.16);
            rig.hips.rotation.z = -stagger * 0.18;
            rig.torso.rotation.z = -stagger * 0.42 + wobble;
            rig.torso.rotation.y = wobble * 1.4;
            rig.neck.rotation.z = -stagger * 0.30;
            rig.headGroup.rotation.z = -stagger * 0.28;
            rig.jaw.rotation.z = -0.24 * stagger;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = stagger * 0.45;
                if (rig.legs[1]) rig.legs[1].rotation.z = -stagger * 0.55;
            }
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = -stagger * 0.55;
                if (rig.arms[1]) rig.arms[1].rotation.z = stagger * 0.45;
            }
        }
        finalizeRigPose();
        return;
    }

    // 5. GESTION DU SAUT LIBRE (HORS ATTAQUE)
    if (airHeight > 0.06 && !isAttackAction && !fighter.isFlying) {
        if (fighterImpl.animateJump) {
            fighterImpl.animateJump(animCtx);
        } else {
            const isRising = fighter.vy > 0;
            rig.hips.position.y = baseHipsY + 0.18;
            rig.torso.rotation.z = isRising ? 0.24 : 0;
            rig.neck.rotation.z = isRising ? 0.20 : 0;
            rig.headGroup.rotation.z = isRising ? 0.25 : 0;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = isRising ? 0.48 : 0.15;
                if (rig.legs[1]) rig.legs[1].rotation.z = isRising ? -0.38 : -0.15;
            }
        }
        finalizeRigPose();
        return;
    }

    // 6. ANIMATIONS D'ATTENTE (IDLE), MARCHE (WALK), VOL (FLY), SAUT (JUMP) & SPRINT
    if (act === 'idle' || act === 'walk' || act === 'crouch' || act === 'fly' || (fighter && fighter.isFlying) || (act === 'jump' && fighter && fighter.isFlying)) {
        animCtx.isWalk = isWalk;
        if (fighter.animationController) {
            if (!isWalk && act === 'idle') {
                fighter.playIdle(0.15);
            } else if (isWalk) {
                if (fighter.isSprinting || fighter.sprintDuration > 0.45) {
                    fighter.playSprint(0.10);
                } else if (fighter.sprintDuration > 0.18) {
                    fighter.playRun(0.12);
                } else {
                    fighter.playWalk(0.15, isMovingBackward ? -1.0 : 1.0);
                }
            }
        }

        if (isWalk && fighterImpl.animateWalk && !(fighter && fighter.isFlying)) {
            fighterImpl.animateWalk(animCtx);
        } else if (fighterImpl.animateIdle) {
            fighterImpl.animateIdle(animCtx);
        }

        // En Sprint / Course rapide : inclinaison aérodynamique de prédateur en chasse
        if (isWalk && (fighter.isSprinting || fighter.sprintDuration > 0.25)) {
            const sprintBoost = Math.min(1.0, fighter.sprintDuration * 1.8);
            rig.torso.rotation.z -= 0.18 * sprintBoost;
            rig.neck.rotation.z -= 0.14 * sprintBoost;
            rig.headGroup.rotation.z += 0.16 * sprintBoost;
        } else if (isWalk && isMovingBackward) {
            // En recul : posture défensive / alerte plus redressée
            rig.torso.rotation.z += 0.08;
            rig.neck.rotation.z += 0.05;
        }

        if (act === 'crouch') {
            rig.hips.position.y = baseHipsY * 0.62;
            rig.torso.rotation.z = -0.26;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.42;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.42;
            }
        }
        finalizeRigPose();
        return;
    }

    // 7. CHORÉGRAPHIES D'ATTAQUES ULTRA-LISIBLES (TRAJECTOIRES, APPUIS & EFFETS VISUELS)
    if (isAttackAction) {
        // A. SOCLE DIRECTIONNEL UNIVERSEL (COMMAND NORMALS & ZONES HIGH / MID / LOW)
        applyUniversalAttackBase(rig, act, prog, strike, swing, anticipate, baseHipsY);

        // B. DÉLÉGATION AUX CHORÉGRAPHIES SPÉCIFIQUES À L'ESPÈCE
        const isCustomNormal = fighterImpl.hasCustomDirectionals;
        const supportedByFighter = act === 'light' || act === 'light2' || act === 'heavy' || act === 'fwd_heavy' || act === 'fwd_light' || act === 'low_light' || act === 'low_heavy' || act === 'anti_air' || act === 'up_light' || act === 'back_light' || act === 'throw' || act === 'air_light' || act === 'air_heavy' || act === 'special' || act === 'special2';
        if (fighterImpl.animateAttack && act !== 'throw_whiff' && (isCustomNormal ? supportedByFighter : (act === 'light' || act === 'heavy' || act === 'special' || act === 'special2'))) {
            fighterImpl.animateAttack(animCtx);
        }

        // C. ENRICHISSEMENT BIOMÉCANIQUE POST-CHORÉGRAPHIE
        applyPostAttackBiomechanics(fighter, rig, id, act, prog, strike, swing, time);
        finalizeRigPose();
        return;
    }

    // 8. FALLBACK CHORÉGRAPHIES HISTORIQUES (EX-FATALITÉS RÉUTILISÉES EN SUPERS)
    if (act === 'fatality') {
        if (fighterImpl.animateSuper) fighterImpl.animateSuper(animCtx);
        else if (fighterImpl.animateFatality) fighterImpl.animateFatality(animCtx);
        else _applySuperFallbackPose(rig, prog, baseHipsY);
    }

    finalizeRigPose();
}

if (typeof window !== 'undefined') {
    window.applyRigPoseSmoothing = applyRigPoseSmoothing;
}
