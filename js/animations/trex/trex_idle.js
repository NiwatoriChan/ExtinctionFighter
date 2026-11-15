/* ============================================================================
 * ANIMATIONS T-REX : ATTENTE (IDLE), ACCROUPISSEMENT (CROUCH) & PARADE
 * Pilotage biomécanique du squelette articulé (respiration thoracique et
 * gastrale, onde cervicale en S, scan binoculaire, compensation digitigrade).
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.trex && FIGHTER_IMPLS.trex.animateWalk) {
            FIGHTER_IMPLS.trex.animateWalk(ctx);
            return;
        }

        const { fighter, rig, baseHipsY, time, act } = ctx;
        const sp = rig.specialParts;

        const breathe = Math.sin(time * 2.6);
        rig.hips.position.y = baseHipsY + breathe * 0.04;
        rig.torso.rotation.z = breathe * 0.045;
        rig.neck.rotation.z = -breathe * 0.03;
        rig.headGroup.rotation.z = -breathe * 0.02 + Math.sin(time * 1.4) * 0.04;
        rig.headGroup.rotation.y = Math.sin(time * 1.1) * 0.08;
        rig.jaw.rotation.z = -0.06 - Math.max(0, Math.sin(time * 2.1)) * 0.14;
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.z = 0.08 + breathe * 0.05;
            rig.arms[1].rotation.z = 0.08 + breathe * 0.05;
        }
        rig.tailSegments.forEach((seg, i) => {
            if (seg) {
                seg.rotation.y = Math.sin(time * 3.0 - i * 0.55) * (0.10 + i * 0.03);
                seg.rotation.z = Math.sin(time * 2.6 - i * 0.4) * 0.03;
            }
        });
        if (act === 'crouch' || (fighter && fighter.isCrouching)) {
            rig.hips.position.y = baseHipsY * 0.72;
            rig.torso.rotation.z = -0.26;
            rig.headGroup.rotation.z = 0.22;
            if (rig.legs.length >= 2) {
                rig.legs[0].rotation.z = 0.22;
                rig.legs[1].rotation.z = -0.18;
            }
        }
    }
});
