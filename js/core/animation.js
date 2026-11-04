// ============================================================================
// js/core/animation.js — 3D Animation Orchestrator
// Délègue aux modules de js/animations/common/ et js/animations/<creature>/
// ============================================================================

function animateDino3DRig(fighter, time, dt) {
    const rig = fighter.rig;
    if (!rig) return;
    const id = fighter.dino.id;
    const act = fighter.action;
    const prog = fighter.actionDuration > 0 ? Math.min(1, fighter.actionTimer / fighter.actionDuration) : 0;

    const fighterImpl = FIGHTER_IMPLS[id] || FIGHTER_ANIMATIONS[id] || {};
    const baseHipsY = fighterImpl.animBaseHipsY !== undefined ? fighterImpl.animBaseHipsY : 2.1;

    // 1. RÉINITIALISATION COMPLÈTE À LA POSE DE REPOS (REST POSE) À CHAQUE FRAME
    resetDino3DRig(fighter, rig, baseHipsY, time, dt);

    const finishAnatomicalSkin = () => {
        if (rig.specialParts && typeof rig.specialParts.updateAnatomicalSkin === 'function') {
            rig.specialParts.updateAnatomicalSkin(time, fighter);
        }
    };

    // 2. RÉACTIONS DE COMBAT (X-RAY, MORT, DIZZY, CHOPE, KNOCKDOWN, HITSTUN, GARDE 3-VOIES)
    if (animateCombatReactions(fighter, rig, baseHipsY, act, time)) {
        finishAnatomicalSkin();
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
            finishAnatomicalSkin();
            return;
        }
    }

    // 4. DÉTECTION DES ACTIONS D'ATTAQUE & COURBES BIOMÉCANIQUES
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

    if (isWalk) {
        const safeDt = Math.min(0.05, Math.max(0, dt || 0.016));
        const walkSpeedRef = (fighter.dino && fighter.dino.walkSpeed) || 7.5;
        const speedScale = Math.max(0.45, Math.min(1.8, Math.abs(fighter.vx) / walkSpeedRef));
        const dirSign = isMovingBackward ? -1 : 1;
        fighter._walkAnimTime += safeDt * speedScale * dirSign;
    } else {
        fighter._walkAnimTime = time;
    }

    const animTime = isWalk ? fighter._walkAnimTime : time;
    const animCtx = { fighter, rig, id, act, prog, strike, swing, anticipate, baseHipsY, time: animTime, dt, isWalk, isMovingBackward };

    // 5. GESTION DU SAUT LIBRE (HORS ATTAQUE)
    const airHeight = fighter.y - (fighter.groundY || 0);
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
        finishAnatomicalSkin();
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
        finishAnatomicalSkin();
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
        finishAnatomicalSkin();
        return;
    }

    // 8. CHORÉGRAPHIES DE FATALITÉS 3D UNIQUES PAR ESPÈCE
    if (act === 'fatality') {
        if (fighterImpl.animateFatality) fighterImpl.animateFatality(animCtx);
    }
    finishAnatomicalSkin();
}
