// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_walking.js — Quetzalcoatlus Walk, Sprint & Dash Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, dt } = ctx;

        // Mise à jour de la jauge d'endurance circulaire 3D
        if (rig.specialParts && rig.specialParts.updateEnduranceCircle) {
            const endurance = fighter ? (fighter.flightEndurance !== undefined ? fighter.flightEndurance : 2.0) : 2.0;
            const isFlying = fighter ? !!fighter.isFlying : false;
            rig.specialParts.updateEnduranceCircle(endurance, isFlying, dt || 0.016);
        }

        if (fighter && fighter.isFlying) {
            if (this.animateFlight) {
                this.animateFlight(ctx);
            }
            return;
        }

        const sp = rig.specialParts;

        const moveDir = fighter ? (fighter.vx * fighter.facing) : 4.0;
        const isSprint = moveDir > 6.5 || (fighter && (fighter.isSprinting || fighter.sprintDuration > 0.25));
        const strideSpeed = isSprint ? 6.2 : 4.6;
        const strideAmp = isSprint ? 0.52 : 0.36;

        const c = Math.sin(time * strideSpeed);
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * strideSpeed)) * 0.06;
        rig.torso.rotation.z = isSprint ? -0.18 : (moveDir < -0.5 ? 0.08 : -0.03);
        rig.neck.rotation.z = isSprint ? -0.04 : 0.06;
        rig.headGroup.rotation.z = isSprint ? -0.10 : (moveDir < -0.5 ? 0.10 : -0.06);
        rig.jaw.rotation.z = isSprint ? -0.10 : -0.02;

        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = c * strideAmp;
            rig.legs[1].rotation.z = -c * strideAmp;
        }
        if (sp.leftWing && sp.rightWing) {
            sp.leftWing.rotation.set(0.0, 0.0, -c * strideAmp * 0.45);
            sp.rightWing.rotation.set(0.0, 0.0, c * strideAmp * 0.45);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(0.0, 0.0, 0.0);
            rig.arms[1].rotation.set(0.0, 0.0, 0.0);
        }
    },

    // Ruée / Dash : Envergure aérodynamique complète et fente profilée
    animateDash(ctx) {
        const { fighter, rig, lunge, isBackDash, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        const flap = Math.sin(time * 12) * 0.48;
        rig.hips.position.y = isBackDash ? baseHipsY * (0.96 + lunge * 0.18) : baseHipsY * 0.92;
        rig.hips.position.x = isBackDash ? -lunge * 0.45 : lunge * 0.58;
        rig.torso.rotation.z = isBackDash ? 0.36 * lunge : -0.32 * lunge;
        rig.neck.rotation.z = isBackDash ? 0.18 * lunge : -0.16 * lunge;
        rig.headGroup.rotation.z = isBackDash ? -0.14 : 0.12;
        rig.jaw.rotation.z = -0.24 * lunge;
        if (sp.leftWing && sp.rightWing) {
            sp.leftWing.rotation.set(1.42 + flap, isBackDash ? -0.22 : 0.32, 0);
            sp.rightWing.rotation.set(-1.42 - flap, isBackDash ? 0.22 : -0.32, 0);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(0, 0, 2.68);
            rig.arms[1].rotation.set(0, 0, 2.68);
        }
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = isBackDash ? 0.38 : -0.58;
            rig.legs[1].rotation.z = isBackDash ? 0.30 : -0.50;
        }
    }
});

