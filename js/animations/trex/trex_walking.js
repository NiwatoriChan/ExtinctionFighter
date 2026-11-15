/* ============================================================================
 * ANIMATIONS T-REX : MARCHE (WALK), COURSE (SPRINT) & RUÉE (DASH)
 * Cinématique bipède théropode à 4 segments (fémur, tibia, métatarse, orteils),
 * transfert de masse pelvien, stabilisation cervicale en S et balancier caudal.
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, isMovingBackward } = ctx;
        const sp = rig.specialParts;

        const moveDir = fighter ? (fighter.vx * fighter.facing) : 4.0;
        const isSprint = !isMovingBackward && (moveDir > 6.2 || (fighter && (fighter.isSprinting || fighter.sprintDuration > 0.22)));
        const strideSpeed = isSprint ? 10.5 : 7.6;
        const strideAmp = isSprint ? 0.62 : 0.46;
        const dirSign = isMovingBackward ? -1 : 1;
        const c = Math.sin(time * strideSpeed * dirSign);

        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * strideSpeed)) * (isSprint ? 0.14 : 0.09);
        rig.hips.rotation.x = Math.cos(time * strideSpeed * dirSign) * 0.04;
        rig.torso.rotation.z = (isSprint ? -0.22 : (isMovingBackward ? 0.08 : -0.09)) + Math.cos(time * strideSpeed * 2) * 0.04;
        rig.neck.rotation.z = isMovingBackward ? 0.10 : -0.06;
        rig.headGroup.rotation.z = isMovingBackward ? 0.14 : (isSprint ? 0.12 : 0.04);
        rig.jaw.rotation.z = isSprint ? (-0.18 - Math.abs(c) * 0.14) : -0.08;

        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = c * strideAmp;
            rig.legs[1].rotation.z = -c * strideAmp;
        }
        rig.arms.forEach((arm, i) => {
            if (arm) arm.rotation.z = (i === 0 ? -c : c) * 0.22 + 0.1;
        });
        rig.tailSegments.forEach((seg, i) => {
            if (seg) {
                seg.rotation.y = Math.sin(time * strideSpeed * dirSign - i * 0.55) * (isSprint ? 0.16 : 0.12);
                seg.rotation.z = -Math.sin(time * strideSpeed * 2) * 0.03;
            }
        });
    },

    animateDash(ctx) {
        const { fighter, rig, lunge, isBackDash, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        rig.hips.position.y = baseHipsY - (isBackDash ? 0.05 : 0.16 * lunge);
        rig.hips.position.x = isBackDash ? -lunge * 0.48 : lunge * 0.58;
        rig.torso.rotation.z = isBackDash ? 0.26 * lunge : -0.34 * lunge;
        rig.headGroup.rotation.z = isBackDash ? -0.18 * lunge : 0.22 * lunge;
        rig.jaw.rotation.z = -0.35 * lunge;
        const c = Math.sin(time * 18);
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = isBackDash ? -0.30 * lunge : c * 0.65;
            rig.legs[1].rotation.z = isBackDash ? 0.28 * lunge : -c * 0.65;
        }
        rig.tailSegments.forEach((seg, i) => {
            if (seg) seg.rotation.y = Math.sin(time * 20 - i * 0.5) * 0.14;
        });
    }
});
